# Shakha Mechanics

Firebase-hosted React + TypeScript app for weekly HSS shakha sankhya entry. Primary data feeds Sampark.

## Core flow

1. Shakha admin signs in with Google.
2. Selects shakha + date.
3. Enters category counts (Sevika, SwayamSewak, Shishu, Bala, Kishores, Praudh, Others) + notes.
4. Saves one Firestore document per shakha per day under `sankhya/{shakhaId}_{date}`.

## Architecture (aligned with attendance-tracker)

- Vite + React + TypeScript SPA
- Firebase Auth (Google) + Firestore + Hosting
- No demo/sample data — empty project shows empty lists until you add shakhas/admins
- Access gated by `admins/{email}` documents

## Firestore collections

| Collection | Purpose |
|---|---|
| `sankhya` | Daily category counts (Sampark feed) |
| `shakhas` | Shakha registry |
| `admins` | Role allow-list (doc id = lowercased email) |

### `sankhya` document shape

```json
{
  "shakhaId": "aryabhatta",
  "shakhaName": "Aryabhatta",
  "date": "2026-08-05",
  "counts": {
    "sevika": 0,
    "swayamSewak": 0,
    "shishu": 0,
    "balas": 0,
    "kishores": 0,
    "praudh": 0,
    "others": 0
  },
  "notes": "",
  "recordedBy": "<uid-or-email>",
  "recordedAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

### Bootstrap National Admin

Create this document in Firestore console before first login (rules require an existing admin):

- Collection: `admins`
- Document ID: your email (lowercase), e.g. `you@example.com`
- Fields:

```json
{
  "email": "you@example.com",
  "role": "nationalAdmin",
  "active": true
}
```

## Local setup

1. Create a **new** Firebase project for Shakha Mechanics (do not reuse the attendance-tracker project).
2. Enable Authentication → Google, Firestore, and Hosting.
3. Register a web app and copy config into `.env.local` from `.env.example`.
4. Put the project id in `.firebaserc`.
5. Install and run:

```bash
pnpm install
pnpm dev
```

## Deploy

```bash
pnpm build
pnpm deploy
# or hosting only:
pnpm deploy:hosting
```

First-time rules/indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Notes

- Chicken-and-egg: the first National Admin must be seeded in the Firebase console.
- Sampark export/integration is intentionally deferred; `sankhya` is the source of truth.
- App logo: HSS mark from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hindu.Swayamsevak_sangh.png) (CC BY-SA 4.0).
