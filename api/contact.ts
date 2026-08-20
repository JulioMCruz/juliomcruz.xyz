import type { VercelRequest, VercelResponse } from '@vercel/node'

interface ContactRequest {
  name: string
  email: string
  message: string
  website?: string
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'contact@juliomcruz.xyz'
const TO_EMAIL = process.env.TO_EMAIL || 'julio.cruz@eb-ms.net'
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://juliomcruz.xyz'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitize(str: string): string {
  return str.trim().slice(0, 5000)
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function setCorsHeaders(res: VercelResponse): void {
  const headers = corsHeaders()
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value)
  })
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  replyTo?: string
): Promise<Response> {
  const body: Record<string, unknown> = {
    from: FROM_EMAIL,
    to: [to],
    subject,
    html,
  }
  if (replyTo) body.reply_to = replyTo

  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(404).json({ error: 'Not found' })
    return
  }

  let body: ContactRequest
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  if (body.website) {
    res.status(400).json({ error: 'Submission blocked' })
    return
  }

  const name = sanitize(body.name || '')
  const email = sanitize(body.email || '')
  const message = sanitize(body.message || '')

  if (!name || !email || !message) {
    res.status(400).json({ error: 'All fields are required' })
    return
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Invalid email address' })
    return
  }

  const notificationHtml = `
    <h2>New contact form submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br>')}</p>
  `

  const notifyRes = await sendEmail(
    TO_EMAIL,
    `Contact form: ${name}`,
    notificationHtml,
    email
  )

  if (!notifyRes.ok) {
    const err = await notifyRes.text()
    console.error('Failed to send notification email:', err)
    res.status(500).json({ error: 'Failed to send message. Please try again.' })
    return
  }

  const autoresponderHtml = `
    <p>Hi ${name},</p>
    <p>Thank you for reaching out. I received your message and will get back to you soon.</p>
    <p>Best,<br>Julio M Cruz</p>
    <hr>
    <p style="color:#666;font-size:0.9em;">Your message:</p>
    <p style="color:#666;font-size:0.9em;">${message.replace(/\n/g, '<br>')}</p>
  `

  const autoRes = await sendEmail(
    email,
    'Thanks for getting in touch',
    autoresponderHtml
  )

  if (!autoRes.ok) {
    console.error('Failed to send autoresponder:', await autoRes.text())
  }

  res.status(200).json({ success: true })
}
