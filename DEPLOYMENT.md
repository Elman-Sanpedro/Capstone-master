# Deploying to Vercel + Supabase

The app runs as a single PHP serverless function on Vercel, with Supabase
providing Postgres and file storage. Everything in the repo is ready; what
follows is the part that needs your accounts.

Roughly 45 minutes end to end.

## Why the code changed

Vercel's filesystem is read-only and has no MySQL, no cron daemon and no queue
worker, so five things moved:

| Local (XAMPP) | Deployed |
| --- | --- |
| MySQL | Supabase Postgres (`DB_CONNECTION=pgsql`) |
| `storage/app/public` + `public/storage` symlink | Supabase Storage bucket, via its S3 API |
| `php artisan schedule:run` | Vercel Cron → `/api/cron/gcash-cancel-expired` |
| `storage/logs/laravel-*.log` | stderr → the deployment's **Logs** tab |
| `public/index.php` | `api/index.php` (serves `public/` files, then boots Laravel) |

Your local XAMPP setup is untouched: with no `SUPABASE_URL` set and
`DB_CONNECTION=mysql`, everything behaves exactly as before.

## 1. Create the Supabase project

1. <https://supabase.com/dashboard> → **New project**. Pick the region nearest
   your users (Singapore, `ap-southeast-1`, for the Philippines).
2. Save the database password it generates — you need it in step 3.

## 2. Create the uploads bucket

**Storage → New bucket**, name it `uploads`, and turn **Public bucket** on.
(Payment proofs and delivery photos are served by URL; a private bucket would
need signed URLs, which the app doesn't generate.)

Then **Project Settings → Storage → S3 access keys → New access key**. Copy the
access key ID and secret once — the secret is shown only at creation.

## 3. Set the environment variables on Vercel

Import the GitHub repo at <https://vercel.com/new>. Leave every build setting
alone: `vercel.json` already sets them.

Copy `.env.production.example` into **Settings → Environment Variables**
(Production), filling in each `CHANGE_ME`. The ones that are easy to get wrong:

- **`APP_KEY`** — run `php artisan key:generate --show` locally and paste the
  whole value including `base64:`.
- **`DB_*`** — Supabase → **Connect** → **Session pooler**. Use that one, on
  port **5432**, not the transaction pooler on 6543 (it can't run prepared
  statements, and emulating them breaks Laravel's boolean bindings). The
  username contains a dot: `postgres.<project-ref>`.
- **`SUPABASE_S3_REGION`** — must match the project's region or uploads fail
  signature validation.
- **`CRON_SECRET`** — any random string: `php -r "echo bin2hex(random_bytes(32));"`

## 4. Deploy

Push to `master`, or click **Deploy**. The build runs `composer install`, then
the `vercel` script in `composer.json` (`npm ci` + `npm run build`), which
produces `public/build` inside the deployment.

## 5. Create the database schema

Run this once from your machine, pointed at Supabase. It needs the
`pdo_pgsql` extension — in XAMPP, uncomment `extension=pdo_pgsql` and
`extension=pgsql` in `php.ini`, or pass them on the command line as below.

```bash
# Use the DIRECT connection for migrations, not the pooler:
# Supabase > Connect > Direct connection.
DB_CONNECTION=pgsql \
DB_HOST=db.<project-ref>.supabase.co DB_PORT=5432 \
DB_DATABASE=postgres DB_USERNAME=postgres DB_PASSWORD='<password>' \
DB_SSLMODE=require APP_ENV=production SUPERADMIN_PASSWORD='<a strong password>' \
php -d extension=pdo_pgsql -d extension=pgsql artisan migrate --force --seed
```

If that host can't be reached, your network is IPv4-only and the direct
connection is IPv6-only; use the session pooler host instead (same command,
`DB_HOST=<region>.pooler.supabase.com`, `DB_USERNAME=postgres.<project-ref>`).

Then **remove `SUPERADMIN_PASSWORD`** from your shell history and from Vercel.

You can now sign in as `harrismanabat0` with the password you just set.

## 6. Check it works

- Sign in, open the admin dashboard and the reports page.
- Upload a GCash proof as a customer, then open it as an admin — it should load
  from a `supabase.co/storage/v1/object/public/uploads/...` URL.
- **Settings → Backup** downloads a `.sql` file of the data.

## Things worth knowing

**Uploads are capped at ~4.5 MB.** Vercel rejects larger request bodies. The
app's own limits (10 MB for damaged-bottle photos, 100 MB for report evidence)
are now above what the platform accepts, so those uploads fail with a platform
error rather than a friendly message. Lower the `max:` rules in
`CustomerReportController` and `BrokenBottleController` if that matters.

**Cron runs once a day** (`0 16 * * *` UTC = midnight Manila). Vercel's Hobby
plan refuses anything more frequent, and may fire up to 59 minutes late. The
job only cancels GCash orders rejected more than 24 hours ago, so the exact
minute doesn't matter.

**Existing MySQL data is not migrated.** Step 5 creates an empty schema. Moving
the live data across is a separate job (export from MySQL, translate the dump
to Postgres, import) — ask if you want it.

**Row-level security is on** for every table, with no policies, so Supabase's
public REST API exposes nothing. Laravel connects as the table owner and is
unaffected. Any table you add later needs the same (`enable row level
security`), and Supabase's Security Advisor will flag it if you forget.

**Free-tier Supabase pauses after a week of inactivity**, and the first request
afterwards fails until you resume it from the dashboard.
