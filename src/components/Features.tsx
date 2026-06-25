import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Trophy, Users, Zap, BookOpen, Shield } from 'lucide-react';

const features = [
  {
    icon: Code2,
    title: 'In-App IDE Practice',
    description: 'Practice each concept directly inside the learning workspace with starter files, console output, and test results.',
  },
  {
    icon: Trophy,
    title: 'Pro NFT Certificates',
    description: 'Pro learners can earn blockchain-verified certificates after completing final exams and course projects.',
  },
  {
    icon: Users,
    title: 'Instructor Review Flow',
    description: 'Instructors can draft courses while mentors and admins review content before it goes live.',
  },
  {
    icon: Zap,
    title: 'Guided Build Projects',
    description: 'Free foundations stay accessible while portfolio-ready build projects unlock on Plus and Pro.',
  },
  {
    icon: BookOpen,
    title: 'Text-First Lessons',
    description: 'Courses use original text lessons, interactive checkpoints, quizzes, cheatsheets, and guided exercises.',
  },
  {
    icon: Shield,
    title: 'Celo USDT Payments',
    description: 'USD subscriptions are designed for Celo USDT, while NGN, KES, and GHS use local-bank rails later.',
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
            A staged learning platform for programming first, with design, blockchain, business, AI, and cybersecurity ready to follow
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
