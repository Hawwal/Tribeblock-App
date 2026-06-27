const { ethers } = require('hardhat');

async function main() {
  const vaultAddress = process.env.GOODDOLLAR_REWARDS_VAULT_ADDRESS;
  const rewardId = process.env.REWARD_ID;
  const recipient = process.env.RECIPIENT_ADDRESS;
  const amountGd = process.env.AMOUNT_GD;
  const decimals = Number(process.env.GOODDOLLAR_DECIMALS || 18);

  if (!vaultAddress || !ethers.isAddress(vaultAddress)) throw new Error('Set GOODDOLLAR_REWARDS_VAULT_ADDRESS.');
  if (!rewardId) throw new Error('Set REWARD_ID to the ContributorReward id from the admin/rewards dashboard.');
  if (!recipient || !ethers.isAddress(recipient)) throw new Error('Set RECIPIENT_ADDRESS to the contributor wallet.');
  if (!amountGd || Number(amountGd) <= 0) throw new Error('Set AMOUNT_GD to the reward amount.');

  const [sender] = await ethers.getSigners();
  const vault = await ethers.getContractAt('TribeBlockGoodDollarRewardsVault', vaultAddress);
  const amountUnits = ethers.parseUnits(amountGd, decimals);

  console.log('Preparing G$ reward');
  console.log('Sender:', sender.address);
  console.log('Vault:', vaultAddress);
  console.log('Reward ID:', rewardId);
  console.log('Recipient:', recipient);
  console.log('Amount:', amountGd, 'G$');

  const tx = await vault.setReward(rewardId, recipient, amountUnits);
  console.log('Transaction:', tx.hash);
  await tx.wait();
  console.log('Reward prepared. Contributor can now claim from the TribeBlock rewards page.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
