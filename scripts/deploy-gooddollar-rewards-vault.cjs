const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  const CELO_MAINNET_GD = '0x62B8B11039FCfE5aB0C56e502b1C372A3D2a9c7A';
  const goodDollarToken = process.env.GOODDOLLAR_TOKEN_ADDRESS || CELO_MAINNET_GD;
  const owner = process.env.GOODDOLLAR_REWARDS_VAULT_OWNER || deployer.address;

  if (!goodDollarToken || !ethers.isAddress(goodDollarToken)) {
    throw new Error('GOODDOLLAR_TOKEN_ADDRESS must be a valid G$ token contract address.');
  }

  if (!ethers.isAddress(owner)) {
    throw new Error('GOODDOLLAR_REWARDS_VAULT_OWNER must be a valid address.');
  }

  console.log('Deploying TribeBlockGoodDollarRewardsVault');
  console.log('Deployer:', deployer.address);
  console.log('G$ token:', goodDollarToken);
  console.log('Vault owner:', owner);

  const Vault = await ethers.getContractFactory('TribeBlockGoodDollarRewardsVault');
  const vault = await Vault.deploy(goodDollarToken, owner);
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  console.log('TribeBlockGoodDollarRewardsVault deployed to:', address);
  console.log('');
  console.log('Set these in backend/.env / Render:');
  console.log('GOODDOLLAR_TOKEN_ADDRESS=' + goodDollarToken);
  console.log('GOODDOLLAR_REWARDS_VAULT_ADDRESS=' + address);
  console.log('GOODDOLLAR_DECIMALS=18');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
