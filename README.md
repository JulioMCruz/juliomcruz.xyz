# juliomcruz.xyz

Personal site. One page, no framework, no build step.

`index.html` is the whole thing. Edit it and push; GitHub Pages serves it at
[juliomcruz.xyz](https://juliomcruz.xyz).

## Architecture

| Component | Host | Domain |
|-----------|------|--------|
| Static site | GitHub Pages | juliomcruz.xyz |
| Contact form API | Vercel | form.juliomcruz.xyz |

The contact form on the site posts to `https://form.juliomcruz.xyz/contact`, which is a
Vercel serverless function that sends email via Resend.

## Contact Form Setup (Vercel)

### 1. Deploy to Vercel

Link this repository to a Vercel project. Vercel will deploy the `api/contact.ts` function.

### 2. Set environment variables

In the Vercel Dashboard → Project → Settings → Environment Variables, add:

| Variable | Value | Required |
|----------|-------|----------|
| `RESEND_API_KEY` | Your Resend API key | Yes |
| `FROM_EMAIL` | `contact@juliomcruz.xyz` (default) | No |
| `TO_EMAIL` | `julio.cruz@eb-ms.net` (default) | No |
| `ALLOWED_ORIGIN` | `https://juliomcruz.xyz` (default) | No |

**Never commit `RESEND_API_KEY` to the repository.**

### 3. Add custom domain

In Vercel Dashboard → Project → Settings → Domains, add `form.juliomcruz.xyz`.

### 4. Add DNS record

In Route 53 (or your DNS provider), add a CNAME record for the form subdomain:

| Type | Name | Value |
|------|------|-------|
| CNAME | form | cname.vercel-dns.com |

`cname.vercel-dns.com` is Vercel's documented target for custom domains. The apex
(`juliomcruz.xyz`) remains on GitHub Pages; only the `form` subdomain points to Vercel.

## Keeping it true

Every number and date on the page is verified, not estimated. If you change a claim,
verify it first. The current facts:

- **April 2020 / PPP** — timeline corroborated by contemporaneous reporting (American
  Banker, "After opening-day fiasco, SBA upgrades lender portal with Amazon assist").
  381,000 loans and $100B by 8 April; funding exhausted 16 April with 1M+ businesses
  approved; SBA normally backs ~$25.4B/year in 7(a) loans.
- **PerkOS** — 93.5% provisioning success across 433 deployments, 94 repositories,
  3 runtimes in production, ~$0.02/month idle cost.
- **Awards** — 30 total, 10 first places, from the profile README at
  [github.com/JulioMCruz](https://github.com/JulioMCruz).

Two items on the PPP section are Julio's to confirm before they harden: whether his team
shipped the E-Tran entry point specifically, and whether "a week and a half" is exact.
The copy is written to stay accurate either way.

## Local preview

```bash
python3 -m http.server 8000
```

## Design notes

Editorial and technical rather than startup-glossy: ink background, Newsreader for
narrative, IBM Plex Mono for data. The April 2020 section is deliberately styled as an
event log, because it is the one story nobody else can tell and it should not look like
the rest of the page.
