import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import { ask } from './_lib/site'

// A2A agent (JSON-RPC 2.0 over HTTP). Stateless: message/send runs the
// question against the profile through the PerkOS LLM gateway and returns a
// completed task with one text artifact. Tasks are not persisted.
export const config = { maxDuration: 60 }

type Rpc = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: any }
const ok = (id: Rpc['id'], result: unknown) => ({ jsonrpc: '2.0', id: id ?? null, result })
const err = (id: Rpc['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } })

function textOf(message: any): string {
  const parts = Array.isArray(message?.parts) ? message.parts : []
  return parts
    .filter((p: any) => p && (p.kind === 'text' || typeof p.text === 'string'))
    .map((p: any) => p.text)
    .join('\n')
    .trim()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST JSON-RPC 2.0 (A2A) to this endpoint' })
  const m = req.body as Rpc
  if (!m || m.jsonrpc !== '2.0' || typeof m.method !== 'string') return res.status(400).json(err(null, -32600, 'invalid request'))

  if (m.method === 'message/send') {
    const msg = m.params?.message
    const q = textOf(msg)
    if (!q) return res.status(200).json(err(m.id, -32602, 'message.parts must contain text'))
    const taskId = randomUUID()
    const contextId = msg?.contextId || randomUUID()
    const now = new Date().toISOString()
    try {
      const answer = await ask(q)
      return res.status(200).json(
        ok(m.id, {
          id: taskId,
          contextId,
          kind: 'task',
          status: { state: 'completed', timestamp: now },
          artifacts: [{ artifactId: randomUUID(), name: 'answer', parts: [{ kind: 'text', text: answer }] }],
          history: [
            { kind: 'message', role: 'user', messageId: msg?.messageId || randomUUID(), parts: [{ kind: 'text', text: q }], taskId, contextId },
            { kind: 'message', role: 'agent', messageId: randomUUID(), parts: [{ kind: 'text', text: answer }], taskId, contextId },
          ],
        }),
      )
    } catch (e: any) {
      return res.status(200).json(
        ok(m.id, {
          id: taskId,
          contextId,
          kind: 'task',
          status: {
            state: 'failed',
            timestamp: now,
            message: {
              kind: 'message',
              role: 'agent',
              messageId: randomUUID(),
              parts: [{ kind: 'text', text: `The profile agent is unavailable right now (${e?.message || 'error'}). Email julio.cruz@eb-ms.net.` }],
            },
          },
        }),
      )
    }
  }
  if (m.method === 'tasks/get' || m.method === 'tasks/cancel') return res.status(200).json(err(m.id, -32001, 'Task not found: this agent does not persist tasks'))
  if (m.method === 'message/stream' || m.method === 'tasks/resubscribe') return res.status(200).json(err(m.id, -32004, 'Streaming is not supported'))
  return res.status(200).json(err(m.id, -32601, `method not found: ${m.method}`))
}
