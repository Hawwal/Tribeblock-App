import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  CELO_CHAIN_ID: z.coerce.number().default(42220),
  CELO_RPC_URL: z.string().url().default('https://forno.celo.org'),
  CELO_USDT_TOKEN_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  CELO_USDT_DECIMALS: z.coerce.number().default(6),
  CELO_PAYMENT_RECEIVER_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  CELO_PAYMENT_CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  CELO_CERTIFICATE_CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  CERTIFICATE_MINTER_PRIVATE_KEY: z.string().regex(/^(0x)?[a-fA-F0-9]{64}$/).optional(),
  CERTIFICATE_PUBLIC_BASE_URL: z.string().url().optional(),
  GOODDOLLAR_TOKEN_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  GOODDOLLAR_CHAIN_ID: z.coerce.number().default(42220),
  LOCAL_BANK_PROVIDER: z.string().default('manual'),
  USD_TO_NGN_RATE: z.coerce.number().default(1500),
  USD_TO_KES_RATE: z.coerce.number().default(130),
  USD_TO_GHS_RATE: z.coerce.number().default(15),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_REDIRECT_URI: z.string().url().optional(),
  ADMIN_EMAILS: z.string().optional(),
});

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }

  return parsed.data;
}
