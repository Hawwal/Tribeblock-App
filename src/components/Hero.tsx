import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import heroBackground from '@/assets/hero-background.png';
import tribeBlockLogo from '@/assets/tribe-block-logo.png';

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
                fontSize: '3.5rem', // 56px - much larger
              }}
            >
              BUILD YOUR<br />
              TECH CAREER<br />
              IN BLOCKCHAIN
            </h1>
            
            <p className="text-muted-foreground text-sm md:text-base lg:text-lg max-w-sm mb-8 md:mb-10 font-mono leading-relaxed">
              Build skills to meet changing<br />
              business needs in blockchain
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
                <span className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-accent">74+</span>
                <span className="text-muted-foreground text-xs md:text-sm lg:text-base">
                  Tailored<br />courses
                </span>
              </div>
              
              <div className="flex items-baseline gap-1.5 md:gap-2">
                <span className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-accent">150+</span>
                <span className="text-muted-foreground text-xs md:text-sm lg:text-base">
                  Projects
                </span>
              </div>
              
              <div className="flex items-baseline gap-1.5 md:gap-2">
                <span className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-accent">50K+</span>
                <span className="text-muted-foreground text-xs md:text-sm lg:text-base">
                  Active<br />learners
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
            <button className="btn-primary inline-flex items-center justify-center gap-2 text-sm md:text-base px-6 py-3">
              Start Learning Free
              <ArrowRight size={16} />
            </button>
            
            <button className="btn-secondary inline-flex items-center justify-center gap-2 text-sm md:text-base border border-border px-6 py-3">
              <Play size={16} className="text-primary" />
              Watch Demo
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;