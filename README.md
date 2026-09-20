# Home Passport

A digital property record app for Local Link's NFC tags. Tap a card on a
property, get a mobile-friendly page with the home's records organised by
category, plus a way for the owner to add photos, documents, and voice
notes on the go.

## What's in here

- **server.js** — Express app with all routes
- **views/** — EJS templates (home overview, category detail, add-record
  form, share screen), matching the new brand design (cream/near-black/
  orange, Fraunces + Work Sans)
- **public/** — stylesheet and the client-side JS that handles category
  selection, voice-note recording (MediaRecorder API), and the upload form
- **lib/store.js** — tiny JSON-file data layer (records + property info)
- **lib/categories.js** — the list of record categories; add a category
  here and a matching icon in `views/partials/icon.ejs`
- **data/** — `property.json` (address, built year, etc.), `records.json`
  (all saved records), `uploads/` (photos, PDFs, voice notes)

## Running it locally

```bash
npm install
npm start
```

Then open http://localhost:3000 — that's the page an NFC tap would open.

## Setting up a property

Edit `data/property.json` before you deploy a card for a new client:

```json
{
  "address": "14 Riverbend Lane",
  "suburb": "Hastings 4120",
  "builtYear": 2011,
  "lastRenovationYear": 2023
}
```

## Deploying to Railway

1. Push this folder to a GitHub repo (or connect Railway directly to a
   local repo via the Railway CLI).
2. In Railway, create a new project from that repo. It auto-detects
   Node and runs `npm start`.
3. Once deployed, Railway gives you a URL — that's what you write onto
   the NFC card (see below).
4. **Important**: uploaded files (`data/uploads/`) are stored on local
   disk. Railway's filesystem is ephemeral on redeploys, so for anything
   beyond a demo, attach a Railway Volume mounted at `data/` so uploads
   and records survive deploys — Railway's docs cover this under
   "Volumes".

## Writing the NFC card

The card just needs to hold a URL — it doesn't store any data itself.
Use an NFC-writing app (e.g. NFC Tools on iOS/Android) to write your
deployed property URL to the tag. Tapping it opens this app straight in
the phone's browser, no app install needed.

## Current scope vs. next steps

This build is **one property per deployment** — the simplest thing that
actually works end to end today (matches the design, real uploads, real
voice notes, real zip export).

For selling this at scale across many clients, the natural next step is
making it multi-property: one shared deployment with a database
(Postgres works well on Railway) instead of JSON files, and each
property getting its own URL slug (e.g. `/p/14-riverbend-lane`) so one
app serves every customer. Happy to build that out whenever you're
ready to scale past a handful of properties.

## Categories included

Plumbing, Electrical, Renovations, Warranties & Certs, General. Add or
rename these in `lib/categories.js`.
