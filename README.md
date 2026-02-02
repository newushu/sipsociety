# Sip Society

A Next.js + Supabase site with draft/preview/publish editing.

## Local dev

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Supabase setup

1) Create a Supabase project.
2) In Supabase SQL editor, run the schema from `supabase/schema.sql`.
3) Create a user in Supabase Auth (email + password).
4) In the `profiles` table, set that user's `role` to `admin`.
5) Add env vars in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Routes

- `/` live site (published content)
- `/preview` draft preview (admin only)
- `/admin` editor dashboard (admin only)
- `/display` full-screen menu display (published content)

## Content model

Content is stored in the `pages` table. Draft and published content are JSON payloads
with a flexible list of blocks. The editor writes to draft. Publish copies draft to
published.
