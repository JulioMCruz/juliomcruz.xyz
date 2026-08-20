# Status and handoff

Last updated **2026-08-20**. Update this file when something below changes.

## Where things stand

Everything on our side is done and verified. The only blocker is DNS propagation at the
registry, which nobody can accelerate.

| | State |
|---|---|
| Repo, `index.html`, `CNAME` | ✅ done |
| GitHub Pages build | ✅ built |
| Route 53 hosted zone `Z07371743QPQ3CXV5M94L` | ✅ A record with the 4 GitHub IPs, `www` CNAME to `juliomcruz.github.io`, TTL 300 |
| Nameservers changed at the registrar (GoDaddy → AWS) | ✅ recorded in whois, `Updated Date: 2026-08-20T15:39:33Z` |
| Registrar forwarding to X removed | ✅ done |
| **`.xyz` registry publishing the new delegation** | ⏳ **still `ns43/ns44.domaincontrol.com`** |
| HTTPS certificate | ⏳ GitHub issues it automatically once DNS resolves |
| Enforce HTTPS | ⏳ only selectable after the certificate exists |
| GitHub domain verification (TXT) | ⏳ optional, does not block |

**The site itself is confirmed working.** Verified by bypassing DNS entirely:

```bash
curl -s -H "Host: juliomcruz.xyz" http://185.199.108.153/ | grep "<title>"
# <title>Julio M Cruz</title>
```

So GitHub has the site, associates it with the domain, and serves it. The public just
cannot reach it yet.

## Check whether it is live

```bash
# 1. Has the registry published the AWS nameservers? This is the blocker.
dig @x.nic.xyz juliomcruz.xyz NS +noall +authority

# 2. Once it has, the apex should return the four GitHub IPs.
dig @8.8.8.8 +short juliomcruz.xyz A

# 3. Then the site.
curl -sI https://juliomcruz.xyz | head -1
```

**Do not use `juliomcruz.github.io` to verify.** That is the user page, which needs a repo
named `JulioMCruz/JulioMCruz.github.io` and does not exist. GitHub routes this site by the
`Host` header, not by path.

## When DNS resolves, do these

1. GitHub → repo Settings → Pages → **Enforce HTTPS** (only available once the certificate
   is issued, which can take up to an hour after DNS resolves).
2. `github.com/settings/pages` → Verified domains → add `juliomcruz.xyz`. This is an
   **account** setting, not a repo setting, which is why it is hard to find. It prevents
   someone claiming the domain on their own account if it ever leaves this Pages config.
3. Raise the Route 53 TTLs from 300 to 3600 now that it is stable.
4. Remove any `/etc/hosts` override added for local testing.

## Two facts on the page that still need Julio's confirmation

Both are in the April 2020 section. The copy is written to stay accurate either way, so
they do not block launch, but they should be resolved before the story gets reused
elsewhere.

1. **Did his team ship the new E-Tran entry point specifically**, or adjacent work in the
   same sprint? The page says "a new entry point into the loan system ships. Built with
   AWS", which follows his account.
2. **Is "about a week and a half" the right figure?** It fits 3 to 8 April plus the days
   after, but only he knows.

Also open: **what `eb-ms.net` is**. It is his contact domain but does not appear as an
employer on the resume. If it is a consulting entity with real client work it may be worth
naming somewhere; if it is just a personal domain, leave it out.

## Where the source material lives

Not in this repo. The verified canon is in Julio's Obsidian vault under **`Personal-Brand/`**:

- `Biography.md` — career verified against the resume
- `Web3-Track.md` — GitHub numbers, queried live
- `Hackathon-Record.md` — 30 awards, 10 first places, two Base programs won
- `Signature-Stories.md` — the stories, what each proves, and the two open items above
- `Founder-Positioning.md`, `Voice.md`, `Profiles-and-Handles.md`

**Rule from that canon: never invent a fact.** Everything on the page was verified against
the resume, GitHub, or contemporaneous reporting. If a claim is not in those notes, it is
not established. Ask rather than fill.

## Design intent, before changing anything

Editorial and technical rather than startup-glossy. Ink background, Newsreader for
narrative, IBM Plex Mono for data, one amber accent.

The April 2020 section is deliberately styled as an event log because it is the one story
nobody else can tell and it should not look like the rest of the page. If you restyle,
keep that contrast.

No em dashes anywhere in copy. Date ranges use en dashes, which is a different character
and is correct for ranges.
