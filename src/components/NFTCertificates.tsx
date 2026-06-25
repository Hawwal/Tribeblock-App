import React from 'react';
import { motion } from 'framer-motion';
import { Award, Shield, Share2, Verified } from 'lucide-react';
import tribeBlockLogo from '@/assets/tribe-block-logo.png';

const NFTCertificates: React.FC = () => {
  return (
    <section className="section-padding bg-gradient-to-br from-accent/5 to-primary/5" id="certificates">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Award size={16} />
              Blockchain Verified
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6">
              Earn Pro NFT Certificates
            </h2>
            
            <p className="text-muted-foreground text-lg mb-8">
              Complete Pro course requirements and receive verifiable NFT certificates that prove your skills on-chain. 
              Share your achievements with employers, mentors, and your portfolio audience.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Verified size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Verifiable Credentials</h4>
                  <p className="text-muted-foreground text-sm">
                    Each Pro certificate is designed to mint as an NFT, with a verification link stored in the backend.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Tamper-Proof</h4>
                  <p className="text-muted-foreground text-sm">
                    Certificate metadata and transaction details make achievements easier to verify.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Share2 size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Easy Sharing</h4>
                  <p className="text-muted-foreground text-sm">
                    Share your certificate verification page on LinkedIn, your portfolio, or directly with employers.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Certificate Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-card border-2 border-border rounded-3xl p-8 shadow-hero">
              <div className="text-center mb-6">
                <img 
                  src={tribeBlockLogo} 
                  alt="Tribe Block" 
                  className="h-8 w-auto mx-auto mb-4"
                />
                <h3 className="text-xl font-bold text-foreground mb-1">Certificate of Completion</h3>
                <p className="text-muted-foreground text-sm">This certifies that</p>
              </div>
              
              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-primary mb-2">Your Name Here</p>
                <p className="text-muted-foreground">has successfully completed</p>
              </div>
              
              <div className="bg-secondary/50 rounded-xl p-4 text-center mb-6">
                <p className="text-lg font-bold text-foreground">Celo USDT Payments</p>
                <p className="text-sm text-muted-foreground">Pro Build Project</p>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">Date Issued</p>
                  <p>January 24, 2026</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">Token ID</p>
                  <p className="font-mono">#12345</p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-2 text-sm">
                <Verified size={16} className="text-green-500" />
                <span className="text-green-600 font-medium">Verified on Blockchain</span>
              </div>
            </div>
            
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default NFTCertificates;
