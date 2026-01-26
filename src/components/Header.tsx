import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, Rocket, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import tribeBlockLogo from '@/assets/tribe-block-logo.png';

interface HeaderProps {
  onSignUpClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSignUpClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const { connected } = useWallet();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses', hasDropdown: true },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'About', href: '/#about' },
  ];

  const courseCategories = [
    { name: 'Frontend Development', href: '/courses?category=frontend' },
    { name: 'Backend Development', href: '/courses?category=backend' },
    { name: 'Blockchain & Web3', href: '/courses?category=blockchain' },
    { name: 'Data Science & AI', href: '/courses?category=data-science' },
    { name: 'DevOps & Cloud', href: '/courses?category=devops' },
    { name: 'View All Courses', href: '/courses' },
  ];

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
          <nav className="hidden lg:flex items-center gap-8">
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
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={onSignUpClick}
              className="text-foreground/80 hover:text-foreground transition-colors font-medium"
            >
              Sign Up
            </button>
            <div className="wallet-adapter-button-wrapper">
              <WalletMultiButton className="wallet-connect-btn" />
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
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSignUpClick?.();
                  }}
                  className="block w-full text-center text-foreground font-medium py-2"
                >
                  Sign Up
                </button>
                <div className="wallet-adapter-button-wrapper w-full">
                  <WalletMultiButton className="wallet-connect-btn w-full" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;