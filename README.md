# MyBeratur

A modern digital queuing system for Malaysian government services.

**Live demo:** https://myberatur.vercel.app

MyBeratur helps citizens manage appointments and queue numbers for various government services like IC renewal, driver's license renewal, passport applications, and summon payments.

> This repo was originally named `nogipin` — MyBeratur is the current
> product name, but you may still see the old name in places like URLs
> or history from before the rename.

## Features

- **Service Selection**: Choose from IC Renewal, Driver's License Renewal, Passport Renewal, and Summon Payment
- **Geographic Navigation**: Select your state/region (Selangor, KL, Johor, Penang, Sabah, Sarawak)
- **Branch Selection**: Choose specific government offices (JPN, JPJ, JIM, PDRM branches)
- **Queue Management**: Get queue numbers, estimated wait times, and real-time status
- **Smart Recommendations**: Alternative branch suggestions when current branch is crowded
- **Priority Queues**: Special queue options for elderly, disabled, and pregnant individuals
- **Accounts**: Login/signup (`src/app/login`, `src/app/signup`, `src/components/auth/`) backed by Supabase
- **Digital queue tickets**: your queue status page renders a scannable
  QR code (`qrcode`/`qrcode.react`) and can generate a downloadable PDF
  ticket (`jspdf`) — see `src/app/queue-status/page.tsx`

## Tech Stack

- Next.js (App Router) + TypeScript
- Supabase (`@supabase/supabase-js`) for auth and data
- `jspdf` for PDF ticket generation
- `qrcode` / `qrcode.react` for QR code generation and rendering

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up your Supabase project and add these to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

   `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the Supabase anon/public key (the name the
   Supabase↔Vercel integration injects). The legacy name `NEXT_PUBLIC_SUPABASE_KEY`
   is still accepted as a fallback — see `src/lib/supabaseClient.ts`. Without
   either, the app falls back to a non-functional placeholder client.

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---
Built by [Muhammad Taufik](https://taufik.vercel.app)
