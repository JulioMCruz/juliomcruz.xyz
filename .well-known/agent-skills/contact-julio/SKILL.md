---
name: contact-julio
description: Send Julio M Cruz a message by email through the site's contact endpoint, on behalf of a person.
---

# Contact Julio M Cruz

Use this when a person wants to reach Julio (a role, a collaboration, a question). Ask the person for their name, email and the message before calling; do not invent any of the three.

## Request

```
POST https://www.juliomcruz.xyz/contact
Content-Type: application/json

{"name": "Ada Lovelace", "email": "ada@example.com", "message": "..."}
```

- All three fields are required. `email` must be a valid address the person owns; Julio replies there.
- Do not send a `website` field. It is a honeypot; a non-empty value blocks the submission.
- One message per person per topic. Do not retry a `200`.

## Responses

- `200 {"ok": true}`: delivered. Tell the person Julio received it and will reply to their email.
- `400 {"error": "..."}`: fix the input and retry once.
- `500`: delivery failed; tell the person to email julio.cruz@eb-ms.net directly.

Full description: https://www.juliomcruz.xyz/openapi.json
