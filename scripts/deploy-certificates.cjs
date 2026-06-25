const { ethers } = require('hardhat');

const DEFAULT_OWNER = '0xDe25bf927C839355C66ee3551dAE8A143bF85F9a';

async function main() {
  const [deployer] = await ethers.getSigners();
  const owner = process.env.CERTIFICATE_CONTRACT_OWNER ?? DEFAULT_OWNER;
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log('Deploying TribeBlockCourseCertificates');
  console.log('Deployer:', deployer.address);
  console.log('Deployer CELO balance:', ethers.formatEther(balance));
  console.log('Certificate owner:', owner);

  const Certificates = await ethers.getContractFactory('TribeBlockCourseCertificates');
  const certificates = await Certificates.deploy(owner);

  await certificates.waitForDeployment();

  const address = await certificates.getAddress();
  console.log('TribeBlockCourseCertificates deployed to:', address);
  console.log('');
  console.log('Set these in backend/.env after deployment:');
  console.log(`CELO_CERTIFICATE_CONTRACT_ADDRESS=${address}`);
  console.log('CERTIFICATE_MINTER_PRIVATE_KEY=<private key for an owner-approved minter wallet>');
  console.log('CERTIFICATE_PUBLIC_BASE_URL=<your public app/backend origin>');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
