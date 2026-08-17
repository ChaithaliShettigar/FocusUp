# FocusUp Deployment Guide (Vercel + Render + MongoDB Atlas)

This guide gives you a public link for your full app:
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## 1) Create MongoDB Atlas (Cloud DB)

1. Sign in to MongoDB Atlas.
2. Create a new project and a free cluster.
3. Create a database user (username + password).
4. In Network Access, add `0.0.0.0/0` (or restrict later).
5. Copy your connection string and set DB name at end, for example:

```text
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/focusup-prod?retryWrites=true&w=majority
```

Note: You can still use MongoDB Compass by connecting Compass to this Atlas URI.

## 2) Deploy Backend to Render

1. Open Render and create a new Web Service from your GitHub repo.
2. Set Root Directory to `focusup-backend`.
3. Set Build Command:

```bash
npm install
```

4. Set Start Command:

```bash
npm start
```

5. Add environment variables in Render:

```text
MONGODB_URI=<your-atlas-uri>
JWT_SECRET=<random-long-secret>
JWT_REFRESH_SECRET=<different-random-long-secret>
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://placeholder.vercel.app
OPENROUTER_API_KEY=<optional, only if chatbot AI is needed>
```

6. Deploy and copy backend URL:

```text
https://your-backend-name.onrender.com
```

7. Check health endpoint:

```text
https://your-backend-name.onrender.com/api/health
```

Expected response:

```json
{"status":"Backend is running"}
```

## 3) Deploy Frontend to Vercel

1. Open Vercel and import the same GitHub repository.
2. Set Root Directory to `focusup-frontend`.
3. Framework preset: Vite.
4. Build Command:

```bash
npm run build
```

5. Output Directory:

```text
dist
```

6. Add environment variables in Vercel:

```text
VITE_API_URL=https://your-backend-name.onrender.com/api
VITE_SOCKET_URL=https://your-backend-name.onrender.com
```

7. Deploy and copy frontend URL:

```text
https://your-frontend-name.vercel.app
```

## 4) Final CORS/Socket Sync

1. Go back to Render service environment variables.
2. Update `FRONTEND_URL` to your real Vercel URL.
3. Redeploy backend.

If needed for preview deployments, use comma-separated values:

```text
FRONTEND_URL=https://your-frontend-name.vercel.app,https://your-frontend-name-git-main-yourteam.vercel.app
```

## 5) Verify End-to-End

1. Open frontend URL.
2. Register/login.
3. Start a focus session.
4. Test group and real-time updates (Socket.IO).
5. Confirm no CORS errors in browser console.

## 6) Security Checklist (Important)

1. Rotate all secrets before production.
2. Never commit `.env` files.
3. Keep Atlas DB user credentials private.
4. If OpenRouter key was ever exposed, revoke and regenerate it.

## Quick Troubleshooting

- `401` auth errors on all endpoints:
  - Check `JWT_SECRET` and `JWT_REFRESH_SECRET` are set in Render.
- CORS blocked in browser:
  - Check `FRONTEND_URL` in Render exactly matches Vercel URL.
- Frontend cannot reach API:
  - Check `VITE_API_URL` includes `/api`.
- Socket events not updating:
  - Check `VITE_SOCKET_URL` is backend base URL without `/api`.
- DB errors:
  - Validate Atlas URI, DB user, and IP access list.
