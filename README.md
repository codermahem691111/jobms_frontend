# Workroom frontend

This Next.js frontend contains member sign-in/registration and the protected
admin dashboard. Application code lives under `src/`; configuration, public
assets, and local environment settings remain at the project root.

## Run locally

Set `BACKEND_URL=https://job-maanagenement-backend-3.onrender.com/` in `.env.local`, then run:

```bash
yarn dev
```

The Next.js server proxies `/api/*` requests to the backend. A Next.js Proxy
checks admin sessions using the `admin_token` cookie before displaying the
dashboard; the dashboard also checks the session server-side.

## Routes

- `/` — member login and registration
- `/admin/login` — administrator sign-in
- `/admin/dashboard` — protected administrator dashboard
