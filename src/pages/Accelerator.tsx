import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Mail, Check, Lightbulb, Users, DollarSign, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AcceleratorPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Countdown to Q2 2025 (April 1, 2025)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2025-04-01T00:00:00').getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      
      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setSubmitted(true);
  };

  const features = [
    {
      icon: Lightbulb,
      title: '12-Week Intensive Program',
      description: 'A structured program designed to take your blockchain startup from idea to launch.',
    },
    {
      icon: Users,
      title: 'Expert Mentorship',
      description: '1-on-1 mentorship with industry leaders and successful blockchain entrepreneurs.',
    },
    {
      icon: DollarSign,
      title: 'Funding Connect',
      description: 'Exclusive access to our VC network and demo day with 50+ investors.',
    },
  ];

  const benefits = [
    'Dedicated mentors (2 per startup)',
    'Weekly workshops and masterclasses',
    'Access to Tribe Block alumni network',
    'Pitch deck and business plan support',
    'Smart contract audits',
    'Marketing and go-to-market strategy',
    'Legal and compliance guidance',
    'Co-working space credits',
  ];

  const timeline = [
    { quarter: 'Q2 2025', title: 'Applications Open', description: 'Submit your application and pitch deck' },
    { quarter: 'Q3 2025', title: 'Cohort 1 Begins', description: '12-week intensive program starts' },
    { quarter: 'Q4 2025', title: 'Demo Day', description: 'Pitch to 50+ investors and partners' },
  ];

  const faqs = [
    {
      question: 'When will applications open?',
      answer: 'Applications for Cohort 1 will open in Q2 2025. Join our waitlist to be notified first and get early access to the application.',
    },
    {
      question: 'How many startups will be accepted?',
      answer: "We're accepting 15-20 startups for our first cohort. We focus on quality over quantity to ensure each startup gets personalized attention.",
    },
    {
      question: 'Is there a cost to join?',
      answer: "No! The Tribe Surge Accelerator is completely free. We don't take equity either. Our mission is to grow the blockchain ecosystem.",
    },
    {
      question: 'What stage should my startup be?',
      answer: 'We accept startups from idea stage to early revenue. You should have a clear vision and be building on blockchain technology.',
    },
    {
      question: 'Do I need to be technical?',
      answer: 'At least one co-founder should have technical skills, but we accept non-technical founders with strong business backgrounds.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-[80vh] flex items-center">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Stars */}
            <div className="absolute inset-0">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: Math.random() * 3 + 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10 py-20">
            {/* Animated Rocket */}
            <motion.div
              className="flex justify-center mb-8"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="relative">
                <Rocket size={100} className="text-primary transform rotate-45" />
                {/* Flame Effect */}
                <motion.div
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-16 bg-gradient-to-t from-primary via-accent to-transparent rounded-full blur-sm"
                  animate={{ height: [64, 80, 64], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-center text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              TRIBE SURGE ACCELERATOR
            </motion.h1>

            <motion.p
              className="text-2xl md:text-3xl text-center text-purple-200 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Coming Soon
            </motion.p>

            <motion.p
              className="text-lg md:text-xl text-center text-gray-300 mb-12 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Launching Your Blockchain Startup to New Heights
            </motion.p>

            {/* Countdown Timer */}
            <motion.div
              className="flex justify-center gap-4 md:gap-8 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {[
                { value: countdown.days, label: 'DAYS' },
                { value: countdown.hours, label: 'HOURS' },
                { value: countdown.minutes, label: 'MINS' },
                { value: countdown.seconds, label: 'SECS' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="w-16 md:w-20 h-16 md:h-20 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                    <span className="text-2xl md:text-4xl font-bold text-white">{item.value}</span>
                  </div>
                  <span className="text-xs md:text-sm text-gray-400 mt-2 block">{item.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Email Form */}
            <motion.div
              className="max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {!submitted ? (
                <form onSubmit={handleNotifyMe} className="flex gap-3">
                  <div className="relative flex-1">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Notify Me'}
                  </button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-6 bg-green-500/20 border border-green-500/50 rounded-xl"
                >
                  <Check size={48} className="text-green-400 mx-auto mb-3" />
                  <p className="text-white font-semibold text-lg">You're on the list!</p>
                  <p className="text-gray-300 text-sm">We'll notify you when applications open.</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section-padding bg-background">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                What is Tribe Surge Accelerator?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A world-class accelerator program designed to help blockchain startups succeed
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-6 bg-card rounded-2xl border border-border card-hover"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <feature.icon size={32} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Benefits Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-secondary/30 rounded-3xl p-8 md:p-12"
            >
              <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
                What You'll Get
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check size={14} className="text-green-500" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="section-padding">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                Timeline
              </h2>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-0.5" />

                {timeline.map((item, index) => (
                  <motion.div
                    key={item.quarter}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative flex items-center mb-8 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* Dot */}
                    <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-primary -translate-x-1/2 z-10" />

                    {/* Content */}
                    <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                      <div className="bg-card p-6 rounded-xl border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar size={16} className="text-primary" />
                          <span className="text-primary font-semibold">{item.quarter}</span>
                        </div>
                        <h4 className="text-lg font-bold text-foreground mb-1">{item.title}</h4>
                        <p className="text-muted-foreground text-sm">{item.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section-padding bg-secondary/30">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-5 flex items-center justify-between text-left"
                  >
                    <span className="font-semibold text-foreground">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp size={20} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={20} className="text-muted-foreground" />
                    )}
                  </button>
                  {openFaq === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-5"
                    >
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section-padding">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                Be the First to Know
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Get notified when applications open and receive exclusive founder resources.
              </p>

              {!submitted ? (
                <form onSubmit={handleNotifyMe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary px-6 py-3"
                  >
                    {isLoading ? 'Sending...' : 'Notify Me'}
                  </button>
                </form>
              ) : (
                <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl inline-block">
                  <p className="text-green-600 font-semibold flex items-center gap-2 justify-center">
                    <Check size={20} />
                    You're on the waitlist!
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  Early access to application
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  Exclusive accelerator updates
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  Founder resources and guides
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AcceleratorPage;
