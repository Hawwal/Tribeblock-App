# TribeBlock Celo Contracts

## Subscription Payments

Contract: `TribeBlockUsdtPayments.sol`

Purpose:

- Accept Celo USDT subscription payments.
- Store each TribeBlock payment reference on-chain.
- Emit a `SubscriptionPaid` event for backend verification.
- Hold USDT until the owner withdraws it to the treasury wallet.

## Celo Mainnet Settings

USDT token:

```text
0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e
```

Treasury wallet:

```text
0xDe25bf927C839355C66ee3551dAE8A143bF85F9a
```

## Deployment Constructor Arguments

```text
usdtToken:      0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e
treasuryWallet: 0xDe25bf927C839355C66ee3551dAE8A143bF85F9a
```

## Deploy With Hardhat

Install the contract tooling once:

```bash
npm install
```

Set deployment secrets in the root `.env` file:

```bash
PRIVATE_KEY=your_deployer_private_key
CELO_RPC_URL=https://forno.celo.org
CELOSCAN_API_KEY=optional_celoscan_key
```

Compile:

```bash
npm run contracts:compile
```

Deploy to Celo Mainnet:

```bash
npm run contracts:deploy:celo
```

After deployment, copy the deployed address into `backend/.env`:

```bash
CELO_CHAIN_ID=42220
CELO_RPC_URL=https://forno.celo.org
CELO_USDT_TOKEN_ADDRESS=0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e
CELO_USDT_DECIMALS=6
CELO_PAYMENT_RECEIVER_ADDRESS=0xDe25bf927C839355C66ee3551dAE8A143bF85F9a
CELO_PAYMENT_CONTRACT_ADDRESS=deployed_contract_address
```

## Payment Flow

1. TribeBlock creates a backend payment intent with a reference like `TBU-CELO-1234ABCD`.
2. Student connects MetaMask or MiniPay on Celo Mainnet.
3. Student approves USDT spending for the deployed contract.
4. Student calls `paySubscription(amount, reference)`.
5. Contract transfers USDT from the student to the contract and emits `SubscriptionPaid`.
6. Backend verifies the event, amount, token, payer, and reference.
7. Admin/owner can withdraw accumulated USDT to the treasury wallet.

## Production Follow-Up

After deployment:

- Set `CELO_PAYMENT_CONTRACT_ADDRESS` to the deployed contract address.
- Wallet checkout already supports `approve()` plus `paySubscription()` when `CELO_PAYMENT_CONTRACT_ADDRESS` is configured.
- Add a Celo event watcher for `SubscriptionPaid`.

## Certificate NFTs

Contract: `TribeBlockCourseCertificates.sol`

Purpose:

- Mint Tribe Block University course certificates as non-transferable NFT credentials.
- Store the certificate number and metadata URI on-chain.
- Prevent transfer/approval so credentials remain tied to the issued wallet.
- Allow owner-approved minter wallets for backend automated issuance.

Deploy to Celo Mainnet:

```bash
npm run contracts:deploy:certificates:celo
```

Optional owner override:

```bash
CERTIFICATE_CONTRACT_OWNER=0xYourOwnerWallet npm run contracts:deploy:certificates:celo
```

After deployment, copy the deployed address into `backend/.env`:

```bash
CELO_CERTIFICATE_CONTRACT_ADDRESS=deployed_certificate_contract_address
CERTIFICATE_MINTER_PRIVATE_KEY=private_key_for_owner_or_approved_minter
CERTIFICATE_PUBLIC_BASE_URL=https://your-public-app-domain
```

Certificate mint flow:

1. Student completes all course lessons on an active Pro plan.
2. Student connects a Celo wallet from the dashboard.
3. Backend creates certificate metadata and calls `mintCertificate(student, certificateNumber, metadataUri)` when minter config exists.
4. Backend records `nftContract`, `nftTokenId`, and `transactionHash`.
5. Public verification opens at `/certificates/:certificateNumber`.
