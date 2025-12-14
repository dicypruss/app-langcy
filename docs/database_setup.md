# Database Setup Guide

This project deals with a standard PostgreSQL database. Currenlty, we use **Supabase** for convenience, but you can use any PostgreSQL provider.

## 1. Setup Provider (Supabase Example)
1.  Go to [Supabase](https://supabase.com/) and create a new project.
2.  Go to **Project Settings** (cogwheel icon at bottom left) -> **API**.
3.  Copy the **Project URL** and **Service Role Key** (or Anon Key).
4.  Add them to your `.env` file (see `README.md`).

## 2. Get Credentials
1.  Go to your provider (e.g., Supabase) and find your **connection string** (URI).
    *   **CRITICAL FOR IPv4**: Supabase Direct connections are IPv6 only. If you are on an IPv4 network (or WSL), you **MUST** use the **Connection Pooler**.
    *   Go to **Project Settings** -> **Database**.
    *   Look for "Connection Pooler" or "Supavisor".
    *   Copy the URI that looks like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`.
    *   *Note*: Ensure "Mode" is set to "Transaction" (port 6543) or "Session" (port 5432). Both work, but Pooler is required for IPv4.

2.  Add this to your `.env` file:
    ```env
    DATABASE_URL=postgresql://postgres.ref:pass@...pooler.supabase.com:6543/postgres
    ```

## 3. Database Migrations
Migrations are applied **automatically** when you start the bot.

1.  Simply run:
    ```bash
    npm start
    ```
2.  The bot will check the `db/migrations/` folder and apply any new SQL files to your database.

## 4. Verify
Ensure the `users` and `words` tables are created in your database dashboard.
