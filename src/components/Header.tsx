import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, Rocket, LogOut, UserCircle, Wallet, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import tribeBlockLogo from '@/assets/tribe-block-logo.png';
import { AUTH_SESSION_EVENT, clearSession, getSession, type AuthSession } from '@/lib/auth';
import { clearConnectedWallet, connectCeloWallet, formatWalletAddress, getConnectedWallet, WALLET_EVENT, type ConnectedWallet } from '@/lib/wallet';

interface HeaderProps {
  onSignUpClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSignUpClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(() => getSession());
  const [wallet, setWallet] = useState<ConnectedWallet | null>(() => getConnectedWallet());
  const [walletError, setWalletError] = useState('');
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses', hasDropdown: true },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'Contribute', href: '/contributors' },
    { name: 'Rewards', href: '/rewards' },
    { name: 'About', href: '/#features' },
  ];

  const courseCategories = [
    { name: 'Frontend Development', href: '/courses?category=frontend' },
    { name: 'Backend Development', href: '/courses?category=backend' },
    { name: 'Blockchain & Web3', href: '/courses?category=blockchain' },
    { name: 'Data Science & AI', href: '/courses?category=data' },
    { name: 'DevOps & Cloud', href: '/courses?category=devops' },
    { name: 'View All Courses', href: '/courses' },
  ];

  const canOpenAdmin = session?.user.role === 'ADMIN' || session?.user.role === 'MENTOR_REVIEWER';
  const connectedChainName = wallet ? chainLabel(wallet.chainId) : '';

  useEffect(() => {
    const handleSessionChange = () => setSession(getSession());
    const handleWalletChange = () => setWallet(getConnectedWallet());

    window.addEventListener(AUTH_SESSION_EVENT, handleSessionChange);
    window.addEventListener(WALLET_EVENT, handleWalletChange);
    window.addEventListener('storage', handleSessionChange);
    window.addEventListener('storage', handleWalletChange);

    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, handleSessionChange);
      window.removeEventListener(WALLET_EVENT, handleWalletChange);
      window.removeEventListener('storage', handleSessionChange);
      window.removeEventListener('storage', handleWalletChange);
    };
  }, []);

  const handleSignOut = () => {
    clearSession();
    setSession(null);
    setIsMenuOpen(false);
    setIsAccountOpen(false);
    setIsWalletOpen(false);
  };

  const handleConnectWallet = async () => {
    setWalletError('');

    try {
      const connectedWallet = await connectCeloWallet();
      setWallet(connectedWallet);
      setIsMenuOpen(false);
      setIsWalletOpen(true);
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : 'Unable to connect wallet.');
    }
  };

  const handleDisconnectWallet = () => {
    clearConnectedWallet();
    setWallet(null);
    setWalletError('');
    setIsMenuOpen(false);
    setIsAccountOpen(false);
    setIsWalletOpen(false);
  };

  const handleWalletButton = () => {
    if (wallet) {
      setIsWalletOpen((value) => !value);
      setIsAccountOpen(false);
      return;
    }

    void handleConnectWallet();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={tribeBlockLogo} 
              alt="Tribe Block" 
              className="h-8 md:h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
            {navLinks.map((link) => (
              <div key={link.name} className="relative">
                {link.hasDropdown ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setIsCoursesOpen(true)}
                    onMouseLeave={() => setIsCoursesOpen(false)}
                  >
                    <button className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors font-medium">
                      {link.name}
                      <ChevronDown size={16} className={`transition-transform ${isCoursesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isCoursesOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 mt-2 w-56 bg-card rounded-xl shadow-card border border-border py-2"
                        >
                          {courseCategories.map((category) => (
                            <Link
                              key={category.name}
                              to={category.href}
                              className="block px-4 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                            >
                              {category.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    to={link.href}
                    className="text-foreground/80 hover:text-foreground transition-colors font-medium"
                  >
                    {link.name}
                  </Link>
                )}
              </div>
            ))}
            
            {/* Accelerator Link with Badge */}
            <Link
              to="/accelerator"
              className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors font-medium"
            >
              <Rocket size={16} className="text-primary" />
              Accelerator
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                Soon
              </span>
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-2">
            {session ? (
              <>
                {canOpenAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                    title="Admin"
                    aria-label="Admin"
                  >
                    <ShieldCheck size={18} className="text-primary" />
                  </Link>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountOpen((value) => !value);
                      setIsWalletOpen(false);
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                    title={session.user.displayName}
                    aria-label="Account"
                  >
                    <UserCircle size={20} className="text-primary" />
                  </button>
                  <AnimatePresence>
                    {isAccountOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-border bg-card p-3 shadow-card"
                      >
                        <p className="truncate font-semibold text-foreground">{session.user.displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                        {wallet && <p className="mt-2 text-xs text-muted-foreground">Wallet: {formatWalletAddress(wallet.address)}</p>}
                        <div className="mt-3 grid gap-2">
                          <Link
                            to="/dashboard"
                            onClick={() => setIsAccountOpen(false)}
                            className="rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary/10"
                          >
                            Dashboard
                          </Link>
                          {wallet && (
                            <button
                              type="button"
                              onClick={handleDisconnectWallet}
                              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:border-primary"
                            >
                              <Wallet size={16} />
                              Disconnect Wallet
                            </button>
                          )}
                          <button
                            onClick={handleSignOut}
                            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:border-primary"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <button
                onClick={onSignUpClick}
                className="text-foreground/80 hover:text-foreground transition-colors font-medium"
              >
                Sign Up
              </button>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={handleWalletButton}
                className="payment-cta gap-2"
                title={wallet ? 'Wallet details' : 'Connect wallet'}
                aria-expanded={wallet ? isWalletOpen : undefined}
              >
                <Wallet size={16} />
                <span className="hidden xl:inline">{wallet ? formatWalletAddress(wallet.address) : 'Connect Wallet'}</span>
                <span className="xl:hidden">{wallet ? 'Wallet' : 'Connect'}</span>
                {wallet && <ChevronDown size={15} className={`transition-transform ${isWalletOpen ? 'rotate-180' : ''}`} />}
              </button>
              <AnimatePresence>
                {wallet && isWalletOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-border bg-card p-3 shadow-card"
                  >
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Wallet size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">Connected Wallet</p>
                        <p className="truncate text-xs text-muted-foreground">{wallet.provider}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">Address</p>
                        <p className="break-all text-muted-foreground">{wallet.address}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-md bg-secondary px-3 py-2">
                          <p className="font-semibold text-foreground">Blockchain</p>
                          <p className="text-muted-foreground">{connectedChainName}</p>
                        </div>
                        <div className="rounded-md bg-secondary px-3 py-2">
                          <p className="font-semibold text-foreground">Chain ID</p>
                          <p className="text-muted-foreground">{wallet.chainId ?? 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisconnectWallet}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:border-primary"
                    >
                      <LogOut size={16} />
                      Disconnect Wallet
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-t border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navLinks.map((link) => (
                <div key={link.name}>
                  {link.hasDropdown ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => setIsCoursesOpen(!isCoursesOpen)}
                        className="flex items-center justify-between w-full text-foreground font-medium py-2"
                      >
                        {link.name}
                        <ChevronDown size={16} className={`transition-transform ${isCoursesOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isCoursesOpen && (
                        <div className="pl-4 space-y-2">
                          {courseCategories.map((category) => (
                            <Link
                              key={category.name}
                              to={category.href}
                              className="block text-foreground/70 hover:text-foreground py-1"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={link.href}
                      className="block text-foreground font-medium py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  )}
                </div>
              ))}
              
              <Link
                to="/accelerator"
                className="flex items-center gap-2 text-foreground font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Rocket size={16} className="text-primary" />
                Accelerator
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                  Soon
                </span>
              </Link>

              <div className="pt-4 border-t border-border space-y-3">
                {session ? (
                  <>
                    {canOpenAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center justify-center gap-2 w-full text-foreground font-medium py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <ShieldCheck size={18} className="text-primary" />
                        Admin
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      className="flex items-center justify-center gap-2 w-full text-foreground font-medium py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <UserCircle size={18} className="text-primary" />
                      {session.user.displayName}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center justify-center gap-2 w-full text-foreground font-medium py-2"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onSignUpClick?.();
                    }}
                    className="block w-full text-center text-foreground font-medium py-2"
                  >
                    Sign Up
                  </button>
                )}
                {wallet ? (
                  <div className="rounded-lg border border-border bg-card p-3">
                    <button
                      type="button"
                      onClick={() => setIsWalletOpen((value) => !value)}
                      className="payment-cta w-full justify-center gap-2"
                    >
                      <Wallet size={16} />
                      Wallet Details
                      <ChevronDown size={15} className={`transition-transform ${isWalletOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isWalletOpen && (
                      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                        <p><span className="font-semibold text-foreground">Address:</span> {formatWalletAddress(wallet.address)}</p>
                        <p><span className="font-semibold text-foreground">Blockchain:</span> {connectedChainName}</p>
                        <p><span className="font-semibold text-foreground">Provider:</span> {wallet.provider}</p>
                        <button
                          type="button"
                          onClick={handleDisconnectWallet}
                          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground"
                        >
                          <LogOut size={16} />
                          Disconnect Wallet
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleWalletButton}
                    className="payment-cta w-full justify-center gap-2"
                  >
                    <Wallet size={16} />
                    Connect Wallet
                  </button>
                )}
                {walletError && <p className="text-sm text-destructive text-center">{walletError}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

function chainLabel(chainId?: number) {
  if (!chainId) return 'Unknown network';

  const chains: Record<number, string> = {
    42220: 'Celo Mainnet',
    44787: 'Celo Alfajores',
  };

  return chains[chainId] ?? `Chain ${chainId}`;
}

export default Header;
