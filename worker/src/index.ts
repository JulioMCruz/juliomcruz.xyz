interface Env {
  RESEND_API_KEY: string
  FROM_EMAIL: string
  TO_EMAIL: string
  ALLOWED_ORIGIN: string
}

interface ContactRequest {
  name: string
  email: string
  message: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitize(str: string): string {
  return str.trim().slice(0, 5000)
}

async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  html: string,
  replyTo?: string
): Promise<Response> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [to],
      subject,
      html,
      reply_to: replyTo,
    }),
  })
  return res
}

function corsHeaders(env: Env): HeadersInit {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) })
    }

    if (url.pathname !== '/contact' || request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders(env), 'Content-Type': 'application/json' },
      })
    }

    let body: ContactRequest
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders(env), 'Content-Type': 'application/json' },
      })
    }

    const name = sanitize(body.name || '')
    const email = sanitize(body.email || '')
    const message = sanitize(body.message || '')

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { ...corsHeaders(env), 'Content-Type': 'application/json' },
      })
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { ...corsHeaders(env), 'Content-Type': 'application/json' },
      })
    }

    const notificationHtml = `
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `

    const notifyRes = await sendEmail(
      env,
      env.TO_EMAIL,
      `Contact form: ${name}`,
      notificationHtml,
      email
    )

    if (!notifyRes.ok) {
      const err = await notifyRes.text()
      console.error('Failed to send notification email:', err)
      return new Response(JSON.stringify({ error: 'Failed to send message. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders(env), 'Content-Type': 'application/json' },
      })
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
      env,
      email,
      'Thanks for getting in touch',
      autoresponderHtml
    )

    if (!autoRes.ok) {
      console.error('Failed to send autoresponder:', await autoRes.text())
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders(env), 'Content-Type': 'application/json' },
    })
  },
}
