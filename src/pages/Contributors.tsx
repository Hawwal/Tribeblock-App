import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  CheckCircle2,
  FileText,
  GitBranch,
  Github,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignUpModal from '@/components/SignUpModal';
import { submitContributorApplication, type ContributorApplicationInput } from '@/lib/api';
import { connectCeloWallet, getConnectedWallet } from '@/lib/wallet';

const repositoryUrl = 'https://github.com/Tribe-Block-University';
const mdnUrl = 'https://developer.mozilla.org/en-US/';

const skills = [
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'React Native',
  'Node.js',
  'Solidity',
  'Smart Contracts',
  'UI/UX Design',
  'Technical Writing',
  'Documentation',
  'Course Development',
  'Quality Assurance',
  'Other',
];

const interests = [
  'Create New Courses',
  'Create New Lessons',
  'Update Existing Lessons',
  'Fix Errors',
  'Improve Documentation',
  'Review Community Contributions',
  'Translate Course Content',
];

const rewardCategories = [
  'New course',
  'New lesson',
  'Major course expansion',
  'Lesson improvement',
  'Documentation improvement',
  'Example enhancement',
  'Bug fix',
  'Platform improvement',
  'IDE improvement',
  'Content review',
  'Course validation',
  'Translation contribution',
];

const initialForm: ContributorApplicationInput = {
  fullName: '',
  email: '',
  githubUsername: '',
  walletAddress: '',
  country: '',
  discordUsername: '',
  twitterHandle: '',
  skills: [],
  interests: [],
  experienceLevel: 'INTERMEDIATE',
  portfolioUrl: '',
  agreementReviewed: false,
  agreementRewards: false,
};

const Contributors: React.FC = () => {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [form, setForm] = useState<ContributorApplicationInput>(initialForm);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUseWallet = async () => {
    setError('');

    try {
      const wallet = getConnectedWallet() ?? (await connectCeloWallet());
      updateField('walletAddress', wallet.address);
    } catch (walletError) {
      setError(walletError instanceof Error ? walletError.message : 'Unable to connect wallet.');
    }
  };

  const updateField = <T extends keyof ContributorApplicationInput>(field: T, value: ContributorApplicationInput[T]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleListValue = (field: 'skills' | 'interests', value: string) => {
    setForm((current) => {
      const selected = current[field];
      return {
        ...current,
        [field]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setIsSubmitting(true);

    try {
      await submitContributorApplication(form);
      setStatus('Application submitted. It is now pending admin review.');
      setForm(initialForm);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSignUpClick={() => setIsSignUpOpen(true)} />
      <main>
        <section className="border-b border-border bg-secondary/20">
          <div className="container mx-auto px-4 md:px-6 py-16 md:py-20">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-primary mb-6">
                <GitBranch size={16} />
                GitHub-powered course management
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-5">
                Become a TribeBlock Contributor
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mb-8">
                Help improve lessons, create new courses, review learning content, and earn G$ rewards for approved contributions.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3"
                >
                  <Github size={18} />
                  Open GitHub
                </a>
                <a
                  href="#application"
                  className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3 border border-border"
                >
                  Apply to contribute
                  <ArrowRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Github,
                  title: 'Submit through GitHub',
                  text: 'Courses and lessons are edited or submitted in the Tribe Block University GitHub organization.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Review before publishing',
                  text: 'Admins and mentor reviewers check each submission before it can appear on the platform.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Approved content syncs',
                  text: 'Merged content is formatted into modules, lessons, quizzes, IDE exercises, and guided projects.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-border bg-card p-6">
                  <item.icon size={24} className="text-primary mb-4" />
                  <h2 className="text-xl font-bold text-foreground mb-2">{item.title}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding bg-secondary/20">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-start">
              <div>
                <div className="inline-flex items-center gap-2 text-primary font-semibold mb-3">
                  <BookOpen size={18} />
                  Content model
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                  Free foundations, premium projects
                </h2>
                <p className="text-muted-foreground mb-6">
                  Foundational programming lessons can use MDN as a secondary reference where licensing allows. Learners can study, practice in the IDE, complete modules, take exams, and earn fundamental badges for free.
                </p>
                <a
                  href={mdnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
                >
                  View MDN reference source
                  <ArrowRight size={16} />
                </a>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Free',
                    items: ['Lessons', 'IDE practicals', 'Quizzes and exams', 'Badges'],
                  },
                  {
                    title: 'Plus',
                    items: ['Guided projects', 'IDE checkpoints', 'Real-world builds'],
                  },
                  {
                    title: 'Pro',
                    items: ['NFT certificates', 'Mentor review', 'Credential proof'],
                  },
                ].map((plan) => (
                  <div key={plan.title} className="rounded-lg border border-border bg-card p-5">
                    <h3 className="font-bold text-foreground mb-3">{plan.title}</h3>
                    <ul className="space-y-2">
                      {plan.items.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 size={15} className="mt-0.5 text-primary flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <div className="inline-flex items-center gap-2 text-primary font-semibold mb-3">
                  <FileText size={18} />
                  Course template
                </div>
                <h2 className="text-3xl font-extrabold text-foreground mb-4">Contributor lesson format</h2>
                <div className="rounded-lg border border-border bg-card p-6">
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
{`Course Name
|-- README.md
|-- lesson-1
|   \`-- lesson.md
|-- lesson-2
|   \`-- lesson.md
\`-- lesson-3
    \`-- lesson.md`}
                  </pre>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Each lesson must include</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    'Lesson title',
                    'Objective',
                    'Detailed explanation',
                    'Multiple code examples',
                    'IDE practice task',
                    'Expected result',
                    'Hints',
                    'Validation checks',
                    'Additional resources',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <Link
                  to="/courses"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
                >
                  See current course catalog
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding bg-secondary/20">
          <div className="container mx-auto">
            <div className="max-w-3xl mb-8">
              <div className="inline-flex items-center gap-2 text-primary font-semibold mb-3">
                <BadgeDollarSign size={18} />
                Teaching Commission Program
              </div>
              <h2 className="text-3xl font-extrabold text-foreground mb-4">G$ reward categories</h2>
              <p className="text-muted-foreground">
                Rewards are issued for approved contributions. Final reward amounts are determined by the TribeBlock administration team.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {rewardCategories.map((category) => (
                <div key={category} className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
                  {category}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding" id="application">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">Contributor application</h2>
                <p className="text-muted-foreground mb-6">
                  Submit your details for review. Approved contributors can work on lessons, documentation, reviews, translations, IDE improvements, and platform fixes.
                </p>
                <div className="rounded-lg border border-border bg-card p-5">
                  <p className="text-sm font-semibold text-foreground mb-2">GitHub repository</p>
                  <a
                    href={repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm text-primary hover:text-primary/80"
                  >
                    {repositoryUrl}
                  </a>
                </div>
                <Link
                  to="/rewards"
                  className="mt-4 btn-secondary border border-border inline-flex items-center gap-2 px-5 py-3"
                >
                  <BadgeDollarSign size={18} className="text-primary" />
                  View rewards dashboard
                </Link>
              </div>

              <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField label="Full name" value={form.fullName} onChange={(value) => updateField('fullName', value)} required />
                  <FormField label="Email address" type="email" value={form.email} onChange={(value) => updateField('email', value)} required />
                  <FormField label="GitHub username" value={form.githubUsername} onChange={(value) => updateField('githubUsername', value)} required />
                  <div className="md:col-span-2">
                    <FormField
                      label="Celo wallet address for G$ rewards"
                      value={form.walletAddress}
                      onChange={(value) => updateField('walletAddress', value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleUseWallet}
                      className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
                    >
                      <Wallet size={16} />
                      Use connected wallet
                    </button>
                  </div>
                  <FormField label="Country" value={form.country} onChange={(value) => updateField('country', value)} required />
                  <FormField label="Discord username" value={form.discordUsername ?? ''} onChange={(value) => updateField('discordUsername', value)} />
                  <FormField label="Twitter/X handle" value={form.twitterHandle ?? ''} onChange={(value) => updateField('twitterHandle', value)} />
                  <FormField label="Portfolio or GitHub profile link" value={form.portfolioUrl ?? ''} onChange={(value) => updateField('portfolioUrl', value)} />
                  <label className="block">
                    <span className="block text-sm font-medium text-foreground mb-2">Experience level</span>
                    <select
                      value={form.experienceLevel}
                      onChange={(event) => updateField('experienceLevel', event.target.value as ContributorApplicationInput['experienceLevel'])}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                  </label>
                </div>

                <CheckboxGroup title="Skills" values={skills} selected={form.skills} onToggle={(value) => toggleListValue('skills', value)} />
                <CheckboxGroup title="Contribution interests" values={interests} selected={form.interests} onToggle={(value) => toggleListValue('interests', value)} />

                <div className="space-y-3">
                  <AgreementCheckbox
                    checked={form.agreementReviewed}
                    onChange={(checked) => updateField('agreementReviewed', checked)}
                    label="I agree that all contributions will be reviewed before publication."
                  />
                  <AgreementCheckbox
                    checked={form.agreementRewards}
                    onChange={(checked) => updateField('agreementRewards', checked)}
                    label="I understand rewards are issued only for approved contributions."
                  />
                </div>

                {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
                {status && <p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">{status}</p>}

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
    </div>
  );
};

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
};

const FormField: React.FC<FormFieldProps> = ({ label, value, onChange, type = 'text', required = false }) => (
  <label className="block">
    <span className="block text-sm font-medium text-foreground mb-2">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
    />
  </label>
);

type CheckboxGroupProps = {
  title: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
};

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ title, values, selected, onToggle }) => (
  <fieldset>
    <legend className="text-sm font-medium text-foreground mb-3">{title}</legend>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {values.map((value) => (
        <label key={value} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={selected.includes(value)}
            onChange={() => onToggle(value)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          {value}
        </label>
      ))}
    </div>
  </fieldset>
);

type AgreementCheckboxProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

const AgreementCheckbox: React.FC<AgreementCheckboxProps> = ({ checked, label, onChange }) => (
  <label className="flex items-start gap-3 text-sm text-muted-foreground">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      required
      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
    />
    <span>{label}</span>
  </label>
);

export default Contributors;
