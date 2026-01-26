import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Trophy, Users, Zap, BookOpen, Shield } from 'lucide-react';

const features = [
  {
    icon: Code2,
    title: 'Interactive Code Editor',
    description: 'Practice coding directly in your browser with our Monaco-powered editor. Real-time feedback and test cases included.',
  },
  {
    icon: Trophy,
    title: 'NFT Certificates',
    description: 'Earn blockchain-verified NFT certificates upon course completion. Showcase your skills with verifiable credentials.',
  },
  {
    icon: Users,
    title: 'Expert Instructors',
    description: 'Learn from industry professionals and blockchain experts with years of real-world experience.',
  },
  {
    icon: Zap,
    title: 'Hands-On Projects',
    description: 'Build real projects with every course. Apply your knowledge immediately with practical exercises.',
  },
  {
    icon: BookOpen,
    title: '74+ Courses',
    description: 'Comprehensive curriculum covering frontend, backend, blockchain, DevOps, data science, and more.',
  },
  {
    icon: Shield,
    title: 'Career Support',
    description: 'Get job-ready with resume reviews, interview prep, and access to our hiring partner network.',
  },
];

const Features: React.FC = () => {
  return (
    <section className="section-padding bg-secondary/30" id="features">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            Why Choose Tribe Block?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to become a skilled blockchain developer
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-hover bg-card rounded-2xl p-6 md:p-8 border border-border"
            >
              <div className="feature-icon mb-4">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;