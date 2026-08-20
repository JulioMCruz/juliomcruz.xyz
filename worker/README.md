# Contact Form Worker

A Cloudflare Worker that handles contact form submissions and sends emails via Resend.

## Setup

### 1. Install dependencies

```bash
cd worker
npm install
```

### 2. Set the Resend API key

```bash
wrangler secret put RESEND_API_KEY
```

Paste your Resend API key when prompted. This key is stored securely in Cloudflare and never committed to the repository.

### 3. Deploy

```bash
npm run deploy
```

### 4. Add custom domain

In the Cloudflare Dashboard:

1. Go to **Workers & Pages**
2. Select **juliomcruz-contact-form**
3. Go to **Settings** → **Triggers** → **Custom Domains**
4. Add `form.juliomcruz.xyz`

## Local development

```bash
npm run dev
```

Note: Email sending requires a valid `RESEND_API_KEY`. For local testing, you can create a `.dev.vars` file (not committed):

```
RESEND_API_KEY=re_your_test_key
```

## Endpoints

### POST /contact

Accepts JSON body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!"
}
```

Returns `{ "success": true }` on success or `{ "error": "message" }` on failure.
