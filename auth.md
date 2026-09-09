# auth.md

This document describes how agents access https://www.juliomcruz.xyz. It is self-contained: there is no OAuth server, no registration, and no credentials to obtain.

## Audience

Any agent that wants to read Julio M Cruz's public profile or send him a message on behalf of a person.

## Identity types supported

- `anonymous`

## Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/index.md` | GET | none | Profile in Markdown (also `GET /` with `Accept: text/markdown`) |
| `/openapi.json` | GET | none | API description |
| `/contact` | POST | none | Send a message (JSON: `name`, `email`, `message`) |
| `/api/health` | GET | none | Liveness |

## Registration

None. Do not attempt to register or provision credentials; there is nothing to provision.

## Rate and abuse

`POST /contact` sends one email per request and includes a honeypot field named `website` that must stay empty. Send one message per person per topic. Abuse is filtered and blocked.
