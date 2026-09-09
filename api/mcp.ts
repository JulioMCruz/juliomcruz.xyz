import type { VercelRequest, VercelResponse } from '@vercel/node'
import { profile, sendMessage } from './_lib/site'

// MCP server, Streamable HTTP transport (single POST endpoint, JSON responses).
// Two tools, the same two actions the page exposes through WebMCP.
export const config = { maxDuration: 30 }

const TOOLS = [
  {
    name: 'read_profile',
    description: "Read Julio M Cruz's public professional profile as Markdown: summary, career arc, stack, hackathon record, links.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'send_message',
    description: 'Send Julio M Cruz a message by email on behalf of a person. Ask the person for name, email and message first; never invent them.',
    inputSchema: {
      type: 'object',
      required: ['name', 'email', 'message'],
      properties: {
        name: { type: 'string', maxLength: 5000 },
        email: { type: 'string', format: 'email' },
        message: { type: 'string', maxLength: 5000 },
      },
      additionalProperties: false,
    },
  },
]

type Rpc = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: any }
const ok = (id: Rpc['id'], result: unknown) => ({ jsonrpc: '2.0', id: id ?? null, result })
const err = (id: Rpc['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } })

async function handle(m: Rpc) {
  switch (m.method) {
    case 'initialize':
      return ok(m.id, {
        protocolVersion: '2025-06-18',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'juliomcruz.xyz', version: '1.0.0' },
        instructions: "Read Julio M Cruz's profile or send him a message. No authentication.",
      })
    case 'ping':
      return ok(m.id, {})
    case 'tools/list':
      return ok(m.id, { tools: TOOLS })
    case 'tools/call': {
      const name = m.params?.name
      const args = m.params?.arguments || {}
      if (name === 'read_profile') return ok(m.id, { content: [{ type: 'text', text: profile() }] })
      if (name === 'send_message') {
        const { name: n, email, message } = args
        if (!n || !email || !message) return ok(m.id, { content: [{ type: 'text', text: 'name, email and message are required' }], isError: true })
        const r = await sendMessage({ name: String(n), email: String(email), message: String(message) })
        return ok(m.id, { content: [{ type: 'text', text: r.text }], isError: !r.ok })
      }
      return err(m.id, -32602, `unknown tool: ${name}`)
    }
    default:
      if (m.method?.startsWith('notifications/')) return null
      return err(m.id, -32601, `method not found: ${m.method}`)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, DELETE')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method === 'DELETE') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST JSON-RPC 2.0 to this endpoint' })
  const body = req.body
  const batch = Array.isArray(body)
  const msgs: Rpc[] = batch ? body : [body]
  if (!msgs.every(m => m && m.jsonrpc === '2.0' && typeof m.method === 'string')) return res.status(400).json(err(null, -32600, 'invalid request'))
  const out = (await Promise.all(msgs.map(handle))).filter(Boolean)
  if (out.length === 0) return res.status(202).end()
  res.setHeader('Content-Type', 'application/json')
  return res.status(200).json(batch ? out : out[0])
}
