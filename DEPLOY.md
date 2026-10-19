# Deploy to Vercel

This app is meant to run on **Vercel**. Every push to `master` on GitHub should update production.

## One-time setup (if not already connected)

1. Sign in at [vercel.com](https://vercel.com) with the same GitHub account that owns `LendeborgIsKING/Scoreboard`.
2. **Add New… → Project** → import **Scoreboard**.
3. Framework: **Next.js** (auto-detected). Root: `.`. Build: `npm run build`. Install: `npm install`.
4. Set **Production Branch** to `master` and deploy.

After that, each `git push origin master` triggers a production deployment. Check **Deployments** in the Vercel dashboard for the live URL.

## CLI deploy (optional)

```bash
npx vercel login
npx vercel link
npm run deploy
```

Use this for manual redeploys or if Git integration is not connected.
