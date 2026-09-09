import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Markdown for Agents: `GET /` with `Accept: text/markdown` lands here (see
// vercel.json routes). Returns the same profile as index.html, as Markdown.
let cached: { body: string; tokens: number } | null = null

function load() {
  if (cached) return cached
  const body = readFileSync(join(process.cwd(), 'index.md'), 'utf8')
  const tokens = Math.round(body.split(/\s+/).filter(Boolean).length * 1.35)
  cached = { body, tokens }
  return cached
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const { body, tokens } = load()
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
  res.setHeader('Vary', 'Accept')
  res.setHeader('x-markdown-tokens', String(tokens))
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).send(body)
}
