# ShakhaOS

ShakhaOS is a Firebase-hosted React + TypeScript PWA for HSS Shakha attendance and volunteer administration.

## MVP Coverage

- Google sign-in wiring through Firebase Authentication.
- Mobile-first operations dashboard.
- QR code generation and PNG download per Shakha.
- Attendance capture by date and Shakha.
- Shakha, people, administrator, report, and announcement screens.
- Firestore repository layer with demo fallback data.
- Firebase Hosting config, Firestore indexes, and RBAC security rules.

## Local Setup

1. Install dependencies:

   ```powershell
   pnpm install
   ```

2. Create a Firebase web app and enable:

   - Authentication: Google provider
   - Firestore Database
   - Firebase Hosting

3. Copy `.env.example` to `.env.local` and fill in the Firebase web app values.

4. Start the app:

   ```powershell
   pnpm dev
   ```

## Firestore Collections

- `people`
- `shakhas`
- `peopleShakha`
- `admins`
- `attendance`
- `qrCodes`
- `announcements`

Admin document IDs should be the user's email address, because the Firestore rules use the signed-in email to resolve role and assignment.

Example bootstrap document:

```json
{
  "email": "admin@example.com",
  "role": "nationalAdmin",
  "active": true
}
```

## Deploy

Update `.firebaserc` with your Firebase project ID, then run:

```powershell
pnpm build
firebase deploy
```

## Notes

- The app runs in demo mode until Firebase environment variables are set.
- For production, seed the first National Admin from the Firebase console or a trusted script before opening the app broadly.
- Offline sync, push notifications, self check-in, Sampark integration, and analytics dashboards are intentionally left as future enhancements from the product specification.
