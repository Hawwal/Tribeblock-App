import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Github, Instagram, Mail } from 'lucide-react';
import tribeBlockLogo from '@/assets/tribe-block-logo.png';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');

  const footerLinks = {
    courses: [
      { name: 'Frontend Development', href: '/courses?category=frontend' },
      { name: 'Backend Development', href: '/courses?category=backend' },
      { name: 'Blockchain & Web3', href: '/courses?category=blockchain' },
      { name: 'Data Science', href: '/courses?category=data' },
      { name: 'All Courses', href: '/courses' },
    ],
    company: [
      { name: 'About Us', href: '/#features' },
      { name: 'Pricing', href: '/#pricing' },
      { name: 'Courses', href: '/courses' },
      { name: 'Contributors', href: '/contributors' },
      { name: 'Rewards', href: '/rewards' },
      { name: 'Accelerator', href: '/accelerator' },
      { name: 'Student Dashboard', href: '/dashboard' },
    ],
    resources: [
      { name: 'Course Catalog', href: '/courses' },
      { name: 'Learning Paths', href: '/#courses' },
      { name: 'Certificates', href: '/#certificates' },
      { name: 'Contributor Program', href: '/contributors' },
      { name: 'G$ Rewards', href: '/rewards' },
      { name: 'Accelerator', href: '/accelerator' },
      { name: 'Subscription Plans', href: '/#pricing' },
    ],
    legal: [
      { name: 'Terms of Service', href: '/#pricing' },
      { name: 'Privacy Policy', href: '/#pricing' },
      { name: 'Cookie Policy', href: '/#pricing' },
      { name: 'Refund Policy', href: '/#pricing' },
    ],
  };

  const socialLinks = [
    { name: 'GitHub', icon: Github, href: 'https://github.com/Tribe-Block-University' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/tribeblock' },
    { name: 'Twitter', icon: Twitter, href: 'https://x.com/tribeblock' },
  ];

  return (
    <footer className="bg-secondary/30 border-t border-border">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img 
                src={tribeBlockLogo} 
                alt="Tribe Block" 
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              Building the next generation of blockchain developers.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Courses */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Courses</h4>
            <ul className="space-y-2">
              {footerLinks.courses.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-card rounded-2xl p-6 mb-12 border border-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Subscribe to our newsletter</h4>
              <p className="text-muted-foreground text-sm">Get the latest courses and updates delivered to your inbox.</p>
            </div>
            <form
              className="flex gap-2 w-full md:w-auto"
              onSubmit={(event) => {
                event.preventDefault();
                setNewsletterStatus('Thanks. Newsletter signup is ready for provider integration.');
                setNewsletterEmail('');
              }}
            >
              <div className="relative flex-1 md:w-64">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
              <button type="submit" className="btn-primary text-sm px-4 py-2.5 whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
          {newsletterStatus && (
            <p className="text-sm text-primary mt-4">{newsletterStatus}</p>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm">
            © {currentYear} Tribe Block University. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>Built for the Tribe Block learning community</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
