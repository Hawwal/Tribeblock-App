import React, { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Courses from '@/components/Courses';
import NFTCertificates from '@/components/NFTCertificates';
import Pricing from '@/components/Pricing';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import SignUpModal from '@/components/SignUpModal';

const Index: React.FC = () => {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onSignUpClick={() => setIsSignUpOpen(true)} />
      <main>
        <Hero />
        <Features />
        <Courses />
        <NFTCertificates />
        <Pricing />
        <CTA onSignUpClick={() => setIsSignUpOpen(true)} />
      </main>
      <Footer />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
    </div>
  );
};

export default Index;