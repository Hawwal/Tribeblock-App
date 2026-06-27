const WALLET_STORAGE_KEY = 'tribeblock_celo_wallet';
export const WALLET_EVENT = 'tribeblock-wallet-session';
export const CELO_MAINNET_CHAIN_ID = 42220;
const CELO_MAINNET_CHAIN_HEX = '0xa4ec';

type EthereumProvider = {
  isMiniPay?: boolean;
  isMetaMask?: boolean;
  request: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export type ConnectedWallet = {
  address: string;
  provider: 'MiniPay' | 'MetaMask' | 'Injected Wallet';
  chainId?: number;
  signature?: string;
  signedMessage?: string;
};

export type TokenPaymentInput = {
  tokenAddress: string;
  receiverAddress: string;
  amount: string;
  decimals: number;
};

export type ContractSubscriptionPaymentInput = TokenPaymentInput & {
  contractAddress: string;
  reference: string;
};

export type GoodDollarRewardClaimInput = {
  vaultAddress: string;
  rewardId: string;
};

export type GoodDollarRewardPrepareInput = {
  vaultAddress: string;
  rewardId: string;
  recipientAddress: string;
  amount: string;
  decimals: number;
};

export function getConnectedWallet(): ConnectedWallet | null {
  try {
    const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConnectedWallet) : null;
  } catch {
    return null;
  }
}

export function saveConnectedWallet(wallet: ConnectedWallet) {
  window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
  window.dispatchEvent(new CustomEvent(WALLET_EVENT, { detail: wallet }));
}

export function clearConnectedWallet() {
  window.localStorage.removeItem(WALLET_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(WALLET_EVENT, { detail: null }));
}

export function formatWalletAddress(address?: string | null) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isMiniPay() {
  return typeof window !== 'undefined' && window.ethereum?.isMiniPay === true;
}

export async function connectCeloWallet(options: { requireSignature?: boolean } = {}): Promise<ConnectedWallet> {
  const provider = window.ethereum;

  if (!provider) {
    throw new Error('No Celo wallet found. Install MetaMask or open the app inside MiniPay.');
  }

  const accounts = await provider.request<string[]>({ method: 'eth_requestAccounts', params: [] });
  const address = accounts[0];

  if (!address) {
    throw new Error('No wallet account was returned.');
  }

  await ensureCeloMainnet();

  const chainIdHex = await provider.request<string>({ method: 'eth_chainId' });
  const signedMessage = options.requireSignature
    ? `Sign in to TribeBlock Rewards with wallet ${address}. This proves wallet ownership and does not cost gas.`
    : undefined;
  const signature = signedMessage && !provider.isMiniPay
    ? await provider.request<string>({
        method: 'personal_sign',
        params: [signedMessage, address],
      })
    : undefined;
  const wallet = {
    address,
    provider: provider.isMiniPay ? 'MiniPay' : provider.isMetaMask ? 'MetaMask' : 'Injected Wallet',
    chainId: Number.parseInt(chainIdHex, 16),
    signature,
    signedMessage,
  } satisfies ConnectedWallet;

  saveConnectedWallet(wallet);
  return wallet;
}

export async function sendCeloTokenPayment(input: TokenPaymentInput) {
  const provider = window.ethereum;
  const wallet = getConnectedWallet() ?? (await connectCeloWallet());

  if (!provider) {
    throw new Error('No wallet provider is available.');
  }

  if (!isAddress(input.tokenAddress) || !isAddress(input.receiverAddress)) {
    throw new Error('Payment token or receiver address is not configured yet.');
  }

  await ensureCeloMainnet();

  await assertSufficientTokenBalance(input.tokenAddress, wallet.address, input.amount, input.decimals);

  const data = encodeErc20Transfer(input.receiverAddress, parseTokenUnits(input.amount, input.decimals));

  return provider.request<string>({
    method: 'eth_sendTransaction',
    params: [
      {
        from: wallet.address,
        to: input.tokenAddress,
        value: '0x0',
        data,
      },
    ],
  });
}

export async function sendContractSubscriptionPayment(input: ContractSubscriptionPaymentInput) {
  const provider = window.ethereum;
  const wallet = getConnectedWallet() ?? (await connectCeloWallet());

  if (!provider) {
    throw new Error('No wallet provider is available.');
  }

  if (!isAddress(input.tokenAddress) || !isAddress(input.contractAddress)) {
    throw new Error('Payment token or contract address is not configured yet.');
  }

  await ensureCeloMainnet();

  const amountUnits = parseTokenUnits(input.amount, input.decimals);

  await assertSufficientTokenBalance(input.tokenAddress, wallet.address, input.amount, input.decimals);

  await provider.request<string>({
    method: 'eth_sendTransaction',
    params: [
      {
        from: wallet.address,
        to: input.tokenAddress,
        value: '0x0',
        data: encodeErc20Approve(input.contractAddress, amountUnits),
      },
    ],
  });

  return provider.request<string>({
    method: 'eth_sendTransaction',
    params: [
      {
        from: wallet.address,
        to: input.contractAddress,
        value: '0x0',
        data: encodePaySubscription(amountUnits, input.reference),
      },
    ],
  });
}

export async function claimGoodDollarReward(input: GoodDollarRewardClaimInput) {
  const provider = window.ethereum;
  const wallet = getConnectedWallet() ?? (await connectCeloWallet({ requireSignature: true }));

  if (!provider) {
    throw new Error('No wallet provider is available.');
  }

  if (!isAddress(input.vaultAddress)) {
    throw new Error('G$ rewards vault is not configured yet.');
  }

  await ensureCeloMainnet();

  return provider.request<string>({
    method: 'eth_sendTransaction',
    params: [
      {
        from: wallet.address,
        to: input.vaultAddress,
        value: '0x0',
        data: encodeClaimGoodDollarReward(input.rewardId),
      },
    ],
  });
}

export async function prepareGoodDollarReward(input: GoodDollarRewardPrepareInput) {
  const provider = window.ethereum;
  const wallet = getConnectedWallet() ?? (await connectCeloWallet({ requireSignature: true }));

  if (!provider) {
    throw new Error('No wallet provider is available.');
  }

  if (!isAddress(input.vaultAddress) || !isAddress(input.recipientAddress)) {
    throw new Error('G$ vault or contributor wallet is not configured correctly.');
  }

  await ensureCeloMainnet();

  return provider.request<string>({
    method: 'eth_sendTransaction',
    params: [
      {
        from: wallet.address,
        to: input.vaultAddress,
        value: '0x0',
        data: encodePrepareGoodDollarReward(
          input.rewardId,
          input.recipientAddress,
          parseTokenUnits(input.amount, input.decimals),
        ),
      },
    ],
  });
}

export async function getErc20Balance(tokenAddress: string, walletAddress: string, decimals: number) {
  const provider = window.ethereum;

  if (!provider || !isAddress(tokenAddress) || !isAddress(walletAddress)) {
    return '0';
  }

  const balanceHex = await provider.request<string>({
    method: 'eth_call',
    params: [
      {
        to: tokenAddress,
        data: encodeBalanceOf(walletAddress),
      },
      'latest',
    ],
  });

  return formatTokenUnits(BigInt(balanceHex), decimals);
}

async function ensureCeloMainnet() {
  const provider = window.ethereum;
  if (!provider || provider.isMiniPay) return;

  const currentChainId = await provider.request<string>({ method: 'eth_chainId' });

  if (currentChainId.toLowerCase() === CELO_MAINNET_CHAIN_HEX) return;

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CELO_MAINNET_CHAIN_HEX }],
    });
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: number }).code : undefined;

    if (code !== 4902) {
      throw error;
    }

    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: CELO_MAINNET_CHAIN_HEX,
          chainName: 'Celo Mainnet',
          nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
          rpcUrls: ['https://forno.celo.org'],
          blockExplorerUrls: ['https://celoscan.io'],
        },
      ],
    });
  }
}

function encodeErc20Transfer(receiverAddress: string, amountUnits: bigint) {
  const methodSelector = 'a9059cbb';
  const addressWord = receiverAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const amountWord = amountUnits.toString(16).padStart(64, '0');
  return `0x${methodSelector}${addressWord}${amountWord}`;
}

function encodeErc20Approve(spenderAddress: string, amountUnits: bigint) {
  const methodSelector = '095ea7b3';
  const addressWord = spenderAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const amountWord = amountUnits.toString(16).padStart(64, '0');
  return `0x${methodSelector}${addressWord}${amountWord}`;
}

function encodeBalanceOf(walletAddress: string) {
  const methodSelector = '70a08231';
  const addressWord = walletAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  return `0x${methodSelector}${addressWord}`;
}

function encodePaySubscription(amountUnits: bigint, reference: string) {
  const methodSelector = 'edbc8194';
  const amountWord = amountUnits.toString(16).padStart(64, '0');
  const stringOffsetWord = (64).toString(16).padStart(64, '0');
  const referenceBytes = utf8ToHex(reference);
  const lengthWord = (referenceBytes.length / 2).toString(16).padStart(64, '0');
  const paddedReference = referenceBytes.padEnd(Math.ceil(referenceBytes.length / 64) * 64, '0');

  return `0x${methodSelector}${amountWord}${stringOffsetWord}${lengthWord}${paddedReference}`;
}

function encodeClaimGoodDollarReward(rewardId: string) {
  const methodSelector = 'bb8c9797';
  const stringOffsetWord = (32).toString(16).padStart(64, '0');
  const rewardBytes = utf8ToHex(rewardId);
  const lengthWord = (rewardBytes.length / 2).toString(16).padStart(64, '0');
  const paddedReward = rewardBytes.padEnd(Math.ceil(rewardBytes.length / 64) * 64, '0');

  return `0x${methodSelector}${stringOffsetWord}${lengthWord}${paddedReward}`;
}

function encodePrepareGoodDollarReward(rewardId: string, recipientAddress: string, amountUnits: bigint) {
  const methodSelector = 'b8e8995b';
  const stringOffsetWord = (96).toString(16).padStart(64, '0');
  const addressWord = recipientAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const amountWord = amountUnits.toString(16).padStart(64, '0');
  const rewardBytes = utf8ToHex(rewardId);
  const lengthWord = (rewardBytes.length / 2).toString(16).padStart(64, '0');
  const paddedReward = rewardBytes.padEnd(Math.ceil(rewardBytes.length / 64) * 64, '0');

  return `0x${methodSelector}${stringOffsetWord}${addressWord}${amountWord}${lengthWord}${paddedReward}`;
}

function utf8ToHex(value: string) {
  return Array.from(new TextEncoder().encode(value))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function parseTokenUnits(value: string, decimals: number) {
  const [wholePart, decimalPart = ''] = value.trim().split('.');
  const whole = wholePart || '0';
  const paddedDecimals = decimalPart.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(paddedDecimals || '0');
}

async function assertSufficientTokenBalance(tokenAddress: string, walletAddress: string, amount: string, decimals: number) {
  const provider = window.ethereum;

  if (!provider) {
    throw new Error('No wallet provider is available.');
  }

  const balanceHex = await provider.request<string>({
    method: 'eth_call',
    params: [
      {
        to: tokenAddress,
        data: encodeBalanceOf(walletAddress),
      },
      'latest',
    ],
  });
  const balanceUnits = BigInt(balanceHex);
  const requiredUnits = parseTokenUnits(amount, decimals);

  if (balanceUnits < requiredUnits) {
    throw new Error(`Insufficient USDT balance. Amount due is ${amount} USDT, but this wallet has ${formatTokenUnits(balanceUnits, decimals)} USDT.`);
  }
}

function formatTokenUnits(value: bigint, decimals: number) {
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  const fractionText = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');

  return fractionText ? `${whole}.${fractionText}` : whole.toString();
}

function isAddress(value?: string | null) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}
