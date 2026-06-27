import React, { useEffect, useState } from 'react';
import { Award, BadgeDollarSign, CheckCircle2, Github, RefreshCw, Wallet } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignUpModal from '@/components/SignUpModal';
import { confirmContributorRewardClaim, fetchContributorRewards, type ContributorRewardsDashboard } from '@/lib/api';
import { claimGoodDollarReward, connectCeloWallet, formatWalletAddress, getConnectedWallet } from '@/lib/wallet';

const Rewards: React.FC = () => {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState(() => getConnectedWallet()?.address ?? '');
  const [dashboard, setDashboard] = useState<ContributorRewardsDashboard | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [claimingRewardId, setClaimingRewardId] = useState('');

  const loadDashboard = async (input = { githubUsername, walletAddress }) => {
    setError('');
    setIsLoading(true);

    try {
      const result = await fetchContributorRewards(input);
      setDashboard(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load rewards.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setError('');
    setIsConnectingWallet(true);

    try {
      const wallet = await connectCeloWallet({ requireSignature: true });
      setWalletAddress(wallet.address);
      await loadDashboard({ githubUsername, walletAddress: wallet.address });
    } catch (walletError) {
      setError(walletError instanceof Error ? walletError.message : 'Unable to connect wallet.');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    const vaultAddress = dashboard?.goodDollar.vaultAddress;

    if (!vaultAddress) {
      setError('G$ rewards vault is not configured yet.');
      return;
    }

    setError('');
    setClaimingRewardId(rewardId);

    try {
      const connectedWallet = getConnectedWallet() ?? (await connectCeloWallet({ requireSignature: true }));
      setWalletAddress(connectedWallet.address);
      const transactionHash = await claimGoodDollarReward({ vaultAddress, rewardId });
      await confirmContributorRewardClaim(rewardId, transactionHash);
      await loadDashboard({ githubUsername, walletAddress: connectedWallet.address });
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'Unable to claim G$ reward.');
    } finally {
      setClaimingRewardId('');
    }
  };

  useEffect(() => {
    const wallet = getConnectedWallet();
    if (wallet) {
      loadDashboard({ githubUsername: '', walletAddress: wallet.address });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header onSignUpClick={() => setIsSignUpOpen(true)} />
      <main>
        <section className="border-b border-border bg-secondary/20">
          <div className="container mx-auto px-4 md:px-6 py-14 md:py-18">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-primary mb-5">
                <BadgeDollarSign size={16} />
                GoodDollar rewards
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
                Contributor Rewards Dashboard
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                Track GitHub contributions, approved rewards, and claimable G$ payouts for accepted TribeBlock contributors.
              </p>
            </div>
          </div>
        </section>

        <section className="section-padding">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-8 items-start">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Find your rewards</h2>
                <div className="space-y-4">
                  <label className="block">
                    <span className="block text-sm font-medium text-foreground mb-2">GitHub username</span>
                    <div className="relative">
                      <Github size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={githubUsername}
                        onChange={(event) => setGithubUsername(event.target.value)}
                        placeholder="tribeblock-contributor"
                        className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="block text-sm font-medium text-foreground mb-2">Celo wallet address</span>
                    <input
                      value={walletAddress}
                      onChange={(event) => setWalletAddress(event.target.value)}
                      placeholder="0x..."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </label>

                  <button type="button" onClick={handleConnectWallet} disabled={isConnectingWallet} className="payment-cta w-full justify-center gap-2 disabled:opacity-60">
                    <Wallet size={16} />
                    {isConnectingWallet ? 'Connecting wallet...' : walletAddress ? 'Wallet ' + formatWalletAddress(walletAddress) : 'Connect Wallet'}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    MetaMask will ask you to connect and sign a gas-free message to prove wallet ownership. MiniPay may connect without message signing.
                  </p>

                  <button
                    type="button"
                    onClick={() => loadDashboard()}
                    disabled={isLoading || (!githubUsername.trim() && !walletAddress.trim())}
                    className="btn-primary w-full py-3 disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Refresh Rewards'}
                  </button>

                  {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <Metric label="Approved contributions" value={dashboard?.totals.approvedContributions ?? 0} />
                  <Metric label="Pending review" value={dashboard?.totals.pendingContributions ?? 0} />
                  <Metric label="Pending G$" value={(dashboard?.totals.pendingRewardsGd ?? '0') + ' G$'} />
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Contributor profile</h2>
                      <p className="text-sm text-muted-foreground">Application and payout identity</p>
                    </div>
                    <Award className="text-primary" size={24} />
                  </div>

                  {dashboard?.contributor ? (
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <Info label="Name" value={dashboard.contributor.fullName} />
                      <Info label="GitHub" value={'@' + dashboard.contributor.githubUsername} />
                      <Info label="Wallet" value={dashboard.contributor.walletAddress} />
                      <Info label="Status" value={dashboard.contributor.status.replaceAll('_', ' ')} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Connect a wallet or search by GitHub username to find a contributor reward profile.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">GitHub contributions</h2>
                      <p className="text-sm text-muted-foreground">
                        This dashboard is ready for GitHub webhook syncing. Approved items become rewardable records.
                      </p>
                    </div>
                    <RefreshCw className="text-primary" size={22} />
                  </div>

                  <div className="space-y-3">
                    {(dashboard?.contributions ?? []).map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.contributionType}</p>
                          </div>
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {item.status.replaceAll('_', ' ')}
                          </span>
                        </div>
                        {item.pullRequestUrl && (
                          <a href={item.pullRequestUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-semibold text-primary hover:text-primary/80">
                            View GitHub record
                          </a>
                        )}
                      </div>
                    ))}

                    {!dashboard?.contributions.length && (
                      <p className="text-sm text-muted-foreground">No GitHub contribution records found yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">G$ rewards</h2>
                      <p className="text-sm text-muted-foreground">
                        Token: {dashboard?.goodDollar.tokenSymbol ?? 'G$'} on chain {dashboard?.goodDollar.chainId ?? 42220}
                        {dashboard?.goodDollar.vaultAddress ? ' - Vault ' + formatWalletAddress(dashboard.goodDollar.vaultAddress) : ' - Vault not configured'}
                      </p>
                    </div>
                    <BadgeDollarSign className="text-primary" size={24} />
                  </div>

                  <div className="space-y-3">
                    {(dashboard?.rewards ?? []).map((reward) => {
                      const canClaim = reward.status === 'READY' && Boolean(dashboard?.goodDollar.vaultAddress) && !reward.transactionHash;

                      return (
                        <div key={reward.id} className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{reward.amountGd} G$</p>
                            <p className="text-sm text-muted-foreground">{formatWalletAddress(reward.walletAddress)}</p>
                            <p className="mt-1 text-xs text-muted-foreground break-all">Reward ID: {reward.id}</p>
                          </div>
                          <div className="flex flex-col items-start gap-2 sm:items-end">
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                              {reward.status}
                            </span>
                            {reward.transactionHash && (
                              <p className="text-xs text-muted-foreground">Tx {formatWalletAddress(reward.transactionHash)}</p>
                            )}
                            {canClaim && (
                              <button
                                type="button"
                                onClick={() => handleClaimReward(reward.id)}
                                disabled={claimingRewardId === reward.id}
                                className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
                              >
                                {claimingRewardId === reward.id ? 'Claiming...' : 'Claim G$'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {!dashboard?.rewards.length && (
                      <p className="text-sm text-muted-foreground">No G$ rewards are ready yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm text-foreground">
                  <div className="flex gap-3">
                    <CheckCircle2 className="text-primary flex-shrink-0" size={20} />
                    <p>
                      Approved rewards are claimable from the G$ rewards vault once an admin funds the vault and prepares the reward ID for the contributor wallet. The claim transaction is verified before the reward is marked paid.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="rounded-lg border border-border bg-card p-5">
    <p className="text-sm text-muted-foreground mb-2">{label}</p>
    <p className="text-2xl font-extrabold text-foreground">{value}</p>
  </div>
);

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-border bg-background p-3">
    <p className="text-xs uppercase text-muted-foreground mb-1">{label}</p>
    <p className="font-medium text-foreground break-all">{value}</p>
  </div>
);

export default Rewards;
