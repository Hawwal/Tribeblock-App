import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroBackground from '@/assets/hero-background.png';

const Hero: React.FC = () => {
  return (
    <section className="relative w-full">
      {/* Background Image - Full display, no cropping */}
      <div className="relative w-full">
        <img 
          src={heroBackground} 
          alt="" 
          className="w-full h-auto block"
        />
      </div>

      {/* Content positioned absolutely over the white area */}
      <div className="absolute top-0 left-0 right-0 z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-md lg:max-w-lg" style={{ marginTop: '330px', marginLeft: '-20px' }}>
          {/* Main Content - Pushed down into white area */}
          <motion.div 
            className="py-4 md:py-6 lg:py-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 
              className="font-extrabold text-foreground leading-[1.1] tracking-tight mb-6 md:mb-8"
              style={{ 
                fontSize: '4.5rem', // 56px - much larger
              }}
            >
              BUILD YOUR<br />
              TECH CAREER<br />
              IN TRIBEBLOCK
            </h1>
            
            <p className="text-muted-foreground text-sm md:text-base lg:text-lg max-w-sm mb-8 md:mb-10 font-mono leading-relaxed">
              Build skills to meet changing<br />
              business needs globally
            </p>
          </motion.div>

          {/* Stats Section - Horizontal alignment */}
          <motion.div 
            className="mb-8 md:mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex flex-row items-baseline gap-6 md:gap-10 lg:gap-12">
              <div className="flex items-baseline gap-1.5 md:gap-2">
                <span className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-accent">5</span>
                <span className="text-muted-foreground text-xs md:text-sm lg:text-base">
                  Career<br />paths
                </span>
              </div>
              
              <div className="flex items-baseline gap-1.5 md:gap-2">
                <span className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-accent">10</span>
                <span className="text-muted-foreground text-xs md:text-sm lg:text-base">
                  Free<br />foundations
                </span>
              </div>
              
              <div className="flex items-baseline gap-1.5 md:gap-2">
                <span className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-accent">Pro</span>
                <span className="text-muted-foreground text-xs md:text-sm lg:text-base">
                  Projects &<br />NFT proof
                </span>
              </div>
            </div>
          </motion.div>

          {/* Buttons - Positioned beneath metrics */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-3 md:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link to="/courses" className="btn-primary inline-flex items-center justify-center gap-2 text-sm md:text-base px-6 py-3">
              Start Learning Free
              <ArrowRight size={16} />
            </Link>
            
            <Link to="/#courses" className="btn-secondary inline-flex items-center justify-center gap-2 text-sm md:text-base border border-border px-6 py-3">
              <BookOpen size={16} className="text-primary" />
              Browse Career Paths
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
