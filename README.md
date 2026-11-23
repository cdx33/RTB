# RTB Ready

A static, local-first interview practice app for an RTB House Technical Account Manager recruiter interview. It uses the public question bank in `public/question-bank.json`. There is no account, server route, model key, telemetry, or external persistence.

## Run locally

Serve this folder with any static file server. For example: `python3 -m http.server 4173` from this directory, then open `http://localhost:4173`.

## Privacy

The personal profile is never bundled. Import it explicitly from Settings using the file picker; the app stores the selected JSON in this browser's `localStorage` only. Do not copy `private-profile.local.json` into this folder, add it to the question bank, commit it, or deploy it. Behavioural examples appear only after a user chooses to reveal an answer. Salary-linked content is always suppressed. The browser profile does not sync across devices.

Progress can be exported and imported as a JSON backup from Settings. Reset removes this app's locally stored progress and profile.

## Deploy

This is a static site and can be deployed by connecting this folder/repository to a static host. It requires no build step. The included question bank cites sources and checked dates for public facts.
