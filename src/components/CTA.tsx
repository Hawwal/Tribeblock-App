import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Rocket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getSession } from '@/lib/auth';

interface CTAProps {
  onSignUpClick?: () => void;
}

const CTA: React.FC<CTAProps> = ({ onSignUpClick }) => {
  const navigate = useNavigate();

  const handleStartLearning = () => {
    if (getSession()) {
      navigate('/courses');
      return;
    }

    onSignUpClick?.();
  };

  return (
    <section className="section-padding bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6">
            Ready to Start Your<br />
            <span className="gradient-text">Blockchain Journey?</span>
          </h2>
          
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join over 50,000 learners who are building their tech careers with Tribe Block University.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={handleStartLearning}
              className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2"
            >
              Start Learning Free
              <ArrowRight size={18} />
            </button>
            <Link
              to="/accelerator"
              className="btn-secondary text-base px-8 py-3.5 border border-border inline-flex items-center gap-2"
            >
              <Rocket size={18} className="text-primary" />
              Join Accelerator
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span>50,000+ Students</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span>4.8 Average Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <span>Industry Recognized</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
