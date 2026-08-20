# DNS: juliomcruz.xyz on Route 53

## Domain Layout

| Subdomain | Target | Purpose |
|-----------|--------|---------|
| juliomcruz.xyz (apex) | GitHub Pages | Static site |
| www.juliomcruz.xyz | GitHub Pages | Redirect to apex |
| form.juliomcruz.xyz | Vercel | Contact form API |

## Order matters

Do these in order. Doing step 4 before step 2 leaves the domain dark for the duration.

### 1. Create the hosted zone

```bash
aws route53 create-hosted-zone \
  --name juliomcruz.xyz \
  --caller-reference "juliomcruz-$(date +%s)"
```

Note the four `NS` values it returns. You need them in step 4.

### 2. Add the records

GitHub Pages does not support ALIAS at the apex, and Route 53 alias records only point at
AWS resources, so the apex needs four plain `A` records. Route 53 takes them as multiple
values on one record set.

Save as `records.json`, replacing `ZONEID`:

```json
{
  "Comment": "GitHub Pages + Vercel contact form",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "juliomcruz.xyz",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          { "Value": "185.199.108.153" },
          { "Value": "185.199.109.153" },
          { "Value": "185.199.110.153" },
          { "Value": "185.199.111.153" }
        ]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.juliomcruz.xyz",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [ { "Value": "juliomcruz.github.io" } ]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "form.juliomcruz.xyz",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [ { "Value": "cname.vercel-dns.com" } ]
      }
    }
  ]
}
```

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONEID \
  --change-batch file://records.json
```

**TTL 300 on purpose.** Low while you are switching, so a mistake costs five minutes
rather than a day. Raise it to 3600 once it is stable.

### 3. Verify the domain with GitHub

Do not skip this. Without verification, if the domain ever lapses from your Pages config,
someone else can claim it on their own GitHub account and serve content from your domain.

GitHub → Settings → Pages → **Verify domain**. It gives you a `TXT` record on
`_github-pages-challenge-juliomcruz.<domain>`. Add it in Route 53 the same way, then hit
verify.

### 4. Point the registrar at Route 53

At whoever holds `juliomcruz.xyz`, replace the nameservers with the four from step 1, and
**remove the forwarding rule to X**. Leaving the forward in place while the NS changes is
the usual cause of "it still redirects".

This is the step that actually flips the domain, and the one people forget.

### 5. Enforce HTTPS

Once DNS resolves, GitHub issues a Let's Encrypt certificate automatically. It can take up
to an hour. Then GitHub → Settings → Pages → **Enforce HTTPS**.

### 6. Add form subdomain to Vercel

In Vercel Dashboard → Project → Settings → Domains, add `form.juliomcruz.xyz`. Vercel will
verify ownership via the CNAME record added in step 2.

## Verify

```bash
dig +short juliomcruz.xyz A            # the four 185.199.x addresses
dig +short www.juliomcruz.xyz CNAME    # juliomcruz.github.io
dig +short form.juliomcruz.xyz CNAME   # cname.vercel-dns.com
curl -sI https://juliomcruz.xyz | head -1
```

## Cost

A Route 53 hosted zone is **$0.50/month** plus about $0.40 per million queries. Worth
knowing given the roughly $1,000/month of infrastructure this sits alongside.
