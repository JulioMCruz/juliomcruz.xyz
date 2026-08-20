# DNS: juliomcruz.xyz on Route 53

## Domain Layout

| Subdomain | Target | Purpose |
|-----------|--------|---------|
| juliomcruz.xyz (apex) | Vercel | Static site + API |
| www.juliomcruz.xyz | Vercel | Redirect to apex |

The entire site (static files and contact form API) deploys on Vercel.

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

Save as `records.json`, replacing `ZONEID`:

```json
{
  "Comment": "Vercel deployment",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "juliomcruz.xyz",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          { "Value": "76.76.21.21" }
        ]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.juliomcruz.xyz",
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

### 3. Add domain to Vercel

In Vercel Dashboard → Project → Settings → Domains, add `juliomcruz.xyz`. Vercel will
verify ownership via the A record and automatically handle the www redirect.

### 4. Point the registrar at Route 53

At whoever holds `juliomcruz.xyz`, replace the nameservers with the four from step 1.

This is the step that actually flips the domain, and the one people forget.

## Verify

```bash
dig +short juliomcruz.xyz A            # 76.76.21.21
dig +short www.juliomcruz.xyz CNAME    # cname.vercel-dns.com
curl -sI https://juliomcruz.xyz | head -1
```

## Cost

A Route 53 hosted zone is **$0.50/month** plus about $0.40 per million queries.
