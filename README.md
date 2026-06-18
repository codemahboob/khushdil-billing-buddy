# Khushdil Billing Buddy

Cloud-synced billing app for **Khushdil Tent & DJ**. Sign in once, your customers, events,
invoices, and catalog stay in sync across every device you use.

Built on TanStack Start + Supabase. Hosted on Lovable.

## Features

- Email / password and Google sign-in
- Per-user data isolation (Row Level Security on every table)
- Realtime sync across devices (changes appear without refresh)
- One-time migration from older localStorage data on first sign-in
- Apple-minimal mobile-first UI
- PDF invoice generation with UPI QR payment + signature area
- Recycle bin with two-step confirm + DELETE typing guard
- Editable saved events (add / remove items after the fact)
- Custom service catalog synced across devices

## Stack

- TanStack Start (React 19, file-based routing, Vite 7)
- Tailwind v4
- Lovable Cloud (Supabase: Postgres, Auth, Storage, Realtime)
- jsPDF for invoice generation
- Framer Motion for screen transitions

## Local development

This project runs inside the Lovable editor — open the Preview pane on the right.

If you want to clone and run locally:

```bash
bun install
cp .env.example .env.local   # fill in your Supabase credentials
bun run dev
```

## Deploying to Vercel

This project's runtime is **Cloudflare Workers (via TanStack Start)** — it deploys via the
Lovable Publish button to a stable `*.lovable.app` URL. Custom domains are supported in
Project Settings.

If you need a Vercel deployment specifically, see [`vercel-export/README.md`](./vercel-export/README.md)
for a portable rebuild blueprint.

## Database

All tables live in the `public` schema with RLS. See `supabase/migrations/` for the schema.

| Table | Purpose |
| --- | --- |
| `profiles` | Per-user business profile + invoice counter |
| `customers` | Customer directory |
| `services` | Custom catalog items |
| `events` | Bookings (customer snapshot, date, totals, advance/due, soft-delete) |
| `event_items` | Line items per event |
| `invoices` | Invoice number + PDF URL per event |
