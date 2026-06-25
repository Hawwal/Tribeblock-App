# Tribe Block University Deployment Checklist

## Stage 9 Target

- Frontend: Vercel
- Backend API: Render
- Database: Render Postgres
- Chain: Celo mainnet

## Render Backend

Create a Render Blueprint from the GitHub repository and use `render.yaml`.

Required production environment values:

```text
FRONTEND_ORIGIN=https://your-vercel-domain.vercel.app
CELO_PAYMENT_RECEIVER_ADDRESS=0xDe25bf927C839355C66ee3551dAE8A143bF85F9a
CELO_PAYMENT_CONTRACT_ADDRESS=deployed_usdt_payment_contract
CELO_CERTIFICATE_CONTRACT_ADDRESS=deployed_certificate_contract
CERTIFICATE_MINTER_PRIVATE_KEY=private_key_for_backend_minter_wallet
CERTIFICATE_PUBLIC_BASE_URL=https://your-vercel-domain.vercel.app
GOOGLE_CLIENT_ID=google_client_id
GOOGLE_CLIENT_SECRET=google_client_secret
GOOGLE_REDIRECT_URI=https://your-render-api.onrender.com/api/auth/oauth/google/callback
GITHUB_CLIENT_ID=github_client_id
GITHUB_CLIENT_SECRET=github_client_secret
GITHUB_REDIRECT_URI=https://your-render-api.onrender.com/api/auth/oauth/github/callback
```

Render will set `DATABASE_URL` from the managed Postgres database.

## Vercel Frontend

Import the same GitHub repository into Vercel.

Recommended Vercel settings:

```text
Framework Preset: Vite
Root Directory: .
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Required Vercel environment value:

```text
VITE_API_BASE_URL=https://your-render-api.onrender.com
```

## OAuth Provider Redirect URIs

Google:

```text
https://your-render-api.onrender.com/api/auth/oauth/google/callback
```

GitHub:

```text
https://your-render-api.onrender.com/api/auth/oauth/github/callback
```

After the Vercel domain is final, update Render:

```text
FRONTEND_ORIGIN=https://your-vercel-domain.vercel.app
CERTIFICATE_PUBLIC_BASE_URL=https://your-vercel-domain.vercel.app
```

Then redeploy the Render backend.
