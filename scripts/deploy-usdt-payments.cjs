const { ethers } = require('hardhat');

const CELO_MAINNET_USDT = '0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e';
const TREASURY_WALLET = '0xDe25bf927C839355C66ee3551dAE8A143bF85F9a';

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log('Deploying TribeBlockUsdtPayments');
  console.log('Deployer:', deployer.address);
  console.log('Deployer CELO balance:', ethers.formatEther(balance));
  console.log('USDT token:', CELO_MAINNET_USDT);
  console.log('Treasury:', TREASURY_WALLET);

  const Payments = await ethers.getContractFactory('TribeBlockUsdtPayments');
  const payments = await Payments.deploy(CELO_MAINNET_USDT, TREASURY_WALLET);

  await payments.waitForDeployment();

  const address = await payments.getAddress();
  console.log('TribeBlockUsdtPayments deployed to:', address);
  console.log('');
  console.log('Set this in backend/.env after deployment:');
  console.log(`CELO_PAYMENT_CONTRACT_ADDRESS=${address}`);
  console.log(`CELO_PAYMENT_RECEIVER_ADDRESS=${TREASURY_WALLET}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
