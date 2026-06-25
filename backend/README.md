# Tribe Block University API

NestJS + PostgreSQL + Prisma backend for the Codecademy-style learning platform.

## Local Setup

```bash
cd backend
cp .env.example .env
docker compose up -d
npm install
npm run prisma:migrate -- --name init
npm run db:seed
npm run dev
```

The API starts on `http://localhost:4000`.

## Payment Rails

- `USD` payments use Celo USDT payment intents.
- `NGN`, `KES`, and `GHS` payments use the `LOCAL_BANK` rail for later Paystack/Flutterwave/local bank integration.
- `CELO_PAYMENT_RECEIVER_ADDRESS` is deliberately configurable so it can become the final payment smart contract address later.

## Content Policy

Course content in the seed file is original placeholder material. Codecademy-style PDFs can be used as structural inspiration only; import external content only when its license allows reuse.
