# RateIt

RateIt is a Vite media-journal room where users can organize books, movies, anime, music, and TV shows. The bookshelf is a books-and-manga-only view, and every book entry keeps its own selectable type or can create a new type.

## Deploy to Vercel

1. Create a PostgreSQL database with Vercel Postgres, Neon, Supabase, or another PostgreSQL provider.
2. Add `DATABASE_URL` to the Vercel project's Environment Variables using the value from `.env.example` as a shape reference.
3. Deploy the repository. The Vercel build runs `prisma generate && vite build`.
4. Initialize the production schema once with `npx prisma db push` using the production `DATABASE_URL`, or replace it with a reviewed Prisma migration workflow before launch.

The serverless API scaffold includes `GET`/`POST /api/entries` and `GET /api/health`. The entries endpoint verifies Clerk bearer tokens with the configured JWT public key and uses the verified Clerk subject as the database user id. Add the Clerk variables from `.env.example` to Vercel; keep `CLERK_JWT_KEY` server-only. Clerk's Publishable Key is the only auth value exposed to the browser.

Local secrets, `.env` files, generated Prisma databases, and deployment output are excluded by `.gitignore`. The Prisma schema itself is intentionally tracked so deployments can generate and update the database client.
