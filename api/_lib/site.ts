// Shared helpers for the site's agent surfaces (MCP + A2A).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const ORIGIN = 'https://www.juliomcruz.xyz'

let profileCache: string | null = null
export function profile(): string {
  if (!profileCache) profileCache = readFileSync(join(process.cwd(), 'index.md'), 'utf8')
  return profileCache
}

export async function sendMessage(input: { name: string; email: string; message: string }) {
  const r = await fetch(`${ORIGIN}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: input.name, email: input.email, message: input.message }),
  })
  const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string }
  return { ok: r.ok, text: r.ok ? `Message sent. Julio will reply to ${input.email}.` : `Failed: ${j.error || r.status}` }
}

const SYSTEM = `You are the profile agent for Julio M Cruz's personal site (juliomcruz.xyz). Answer questions about Julio using ONLY the profile below. Be concise and concrete: numbers over adjectives, no hype. If the profile does not contain the answer, say so plainly and suggest the person write to julio.cruz@eb-ms.net or use the contact skill. Never invent employers, dates, clients, or claims. If asked to contact Julio, explain that the site accepts POST /contact with name, email and message, and ask for those three. Reply in the language of the question.

--- PROFILE ---
`

export async function ask(question: string): Promise<string> {
  const base = process.env.PERKOS_LLM_BASE_URL || 'https://api.llm.perkos.xyz'
  const key = process.env.PERKOS_LLM_API_KEY
  const model = process.env.PERKOS_LLM_MODEL || 'kimi-k2.6:cloud'
  if (!key) throw new Error('llm_not_configured')
  const q = String(question || '').slice(0, 2000)
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), 45_000)
  try {
    const r = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          { role: 'system', content: SYSTEM + profile() },
          { role: 'user', content: q },
        ],
      }),
      signal: ctl.signal,
    })
    if (!r.ok) throw new Error(`llm_${r.status}`)
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] }
    const text = j.choices?.[0]?.message?.content?.trim()
    if (!text) throw new Error('llm_empty')
    return text
  } finally {
    clearTimeout(t)
  }
}
