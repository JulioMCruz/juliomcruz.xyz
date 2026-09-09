import type { VercelRequest, VercelResponse } from '@vercel/node'

// RFC 9727 API catalog. Served by a function because Vercel will not override
// the Content-Type of an extensionless static file.
const catalog = {
  linkset: [
    {
      anchor: 'https://www.juliomcruz.xyz',
      'service-desc': [{ href: 'https://www.juliomcruz.xyz/openapi.json', type: 'application/json' }],
      'service-doc': [
        { href: 'https://www.juliomcruz.xyz/llms.txt', type: 'text/plain' },
        { href: 'https://www.juliomcruz.xyz/auth.md', type: 'text/markdown' },
      ],
      status: [{ href: 'https://www.juliomcruz.xyz/api/health' }],
    },
  ],
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/linkset+json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.status(200).send(JSON.stringify(catalog, null, 2))
}
