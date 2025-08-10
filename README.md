# Portin Backend

## Quickstart (local)

- Copy `.env.example` to `.env` and update.
- Start a Postgres instance (see infra/docker-compose.yml)
- Run migrations: `psql "$DATABASE_URL" -f src/models/migrations.sql`
- Install deps: `npm install`
- Start server: `npm run dev`

