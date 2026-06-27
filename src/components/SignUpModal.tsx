import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Fingerprint, Eye, EyeOff, Check, AlertCircle, Github } from 'lucide-react';
import tribeBlockLogo from '@/assets/tribe-block-logo.png';
import { loginWithEmail, registerWithEmail, startOAuth } from '@/lib/auth';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SignUpMethod = 'options' | 'email' | 'login-options' | 'login' | 'passkey';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const SignUpModal: React.FC<SignUpModalProps> = ({ isOpen, onClose }) => {
  const [method, setMethod] = useState<SignUpMethod>('options');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passkeyEmail, setPasskeyEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  
  // Email form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return requirements;
  };

  const passwordRequirements = validatePassword(formData.password);
  const passwordStrength = Object.values(passwordRequirements).filter(Boolean).length;

  const handleOAuth = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setErrors({});
    setStatusMessage('');

    try {
      const response = await startOAuth(provider);

      if (response.configured && response.authorizationUrl) {
        window.location.href = response.authorizationUrl;
        return;
      }

      setErrors({
        general:
          response.message ??
          `${provider === 'google' ? 'Google' : 'GitHub'} sign in is not configured yet.`,
      });
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Unable to start sign in.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeySignUp = async () => {
    if (!passkeyEmail) {
      setErrors({ passkeyEmail: 'Please enter your email first.' });
      return;
    }

    setErrors({});
    setStatusMessage(
      'Passkeys are staged for the next auth hardening pass. The backend still needs WebAuthn challenge and credential endpoints before this can sign you in or create an account.',
    );
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (passwordStrength < 4) newErrors.password = 'Password does not meet requirements';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        await registerWithEmail({
          displayName: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });
        setStatusMessage('Account created. You are signed in locally for development.');
        window.setTimeout(handleClose, 700);
      } catch (error) {
        setErrors({
          general: error instanceof Error ? error.message : 'Unable to create your account.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        await loginWithEmail({
          email: formData.email.trim(),
          password: formData.password,
        });
        setStatusMessage('Signed in.');
        window.setTimeout(handleClose, 500);
      } catch (error) {
        setErrors({
          general: error instanceof Error ? error.message : 'Unable to sign in.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetModal = () => {
    setMethod('options');
    setFormData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    });
    setPasskeyEmail('');
    setErrors({});
    setStatusMessage('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card rounded-2xl shadow-hero border border-border w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X size={20} className="text-muted-foreground" />
            </button>

            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <img 
                  src={tribeBlockLogo} 
                  alt="Tribe Block" 
                  className="h-10 w-auto mx-auto mb-4"
                />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Join Tribe Block University
                </h2>
                <p className="text-muted-foreground">
                  Start learning programming, Web3, AI, and career skills today
                </p>
              </div>

              {errors.general && (
                <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              {statusMessage && (
                <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 flex items-start gap-2">
                  <Check size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Sign Up Options */}
              {method === 'options' && (
                <div className="space-y-4">
                  {/* Google Sign Up */}
                  <button
                    onClick={() => handleOAuth('google')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl hover:bg-secondary/50 transition-colors disabled:opacity-50"
                  >
                    <GoogleIcon />
                    <span className="font-medium text-foreground">Continue with Google</span>
                  </button>

                  <button
                    onClick={() => handleOAuth('github')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl hover:bg-secondary/50 transition-colors disabled:opacity-50"
                  >
                    <Github size={20} />
                    <span className="font-medium text-foreground">Continue with GitHub</span>
                  </button>

                  {/* Passkey Sign Up */}
                  <button
                    onClick={() => setMethod('passkey')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Fingerprint size={20} />
                    <span className="font-medium">Sign Up with Passkey</span>
                  </button>

                  {/* Email Sign Up */}
                  <button
                    onClick={() => setMethod('email')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50"
                  >
                    <Mail size={20} />
                    <span className="font-medium">Sign Up with Email</span>
                  </button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-card text-muted-foreground">OR</span>
                    </div>
                  </div>

                  {/* Login Link */}
                  <p className="text-center text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setErrors({});
                        setStatusMessage('');
                        setMethod('login-options');
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Log In
                    </button>
                  </p>
                </div>
              )}

              {method === 'login-options' && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setMethod('options')}
                    className="text-sm text-muted-foreground hover:text-foreground mb-4"
                  >
                    Back to sign up
                  </button>

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">Log in to Tribe Block</h3>
                    <p className="text-muted-foreground text-sm">Choose the same provider you used to create your account.</p>
                  </div>

                  <button
                    onClick={() => handleOAuth('google')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl hover:bg-secondary/50 transition-colors disabled:opacity-50"
                  >
                    <GoogleIcon />
                    <span className="font-medium text-foreground">Continue with Google</span>
                  </button>

                  <button
                    onClick={() => handleOAuth('github')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl hover:bg-secondary/50 transition-colors disabled:opacity-50"
                  >
                    <Github size={20} />
                    <span className="font-medium text-foreground">Continue with GitHub</span>
                  </button>

                  <button
                    onClick={() => setMethod('passkey')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Fingerprint size={20} />
                    <span className="font-medium">Continue with Passkey</span>
                  </button>

                  <button
                    onClick={() => setMethod('login')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50"
                  >
                    <Mail size={20} />
                    <span className="font-medium">Log in with Email</span>
                  </button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-card text-muted-foreground">OR</span>
                    </div>
                  </div>

                  <p className="text-center text-muted-foreground">
                    New to Tribe Block?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setErrors({});
                        setStatusMessage('');
                        setMethod('options');
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Create an account
                    </button>
                  </p>
                </div>
              )}

              {/* Passkey Form */}
              {method === 'passkey' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setMethod('options')}
                    className="text-sm text-muted-foreground hover:text-foreground mb-4"
                  >
                    Back to options
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                      <Fingerprint size={32} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Continue with Passkey</h3>
                    <p className="text-muted-foreground text-sm">
                      Use Face ID, Touch ID, Windows Hello, or a security key
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={passkeyEmail}
                      onChange={(e) => {
                        setPasskeyEmail(e.target.value);
                        setErrors({});
                        setStatusMessage('');
                      }}
                      placeholder="Enter your email"
                      className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        errors.passkeyEmail ? 'border-destructive' : 'border-border'
                      }`}
                    />
                    {errors.passkeyEmail && (
                      <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.passkeyEmail}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handlePasskeySignUp}
                    disabled={isLoading}
                    className="w-full btn-primary py-3"
                  >
                    {isLoading ? 'Preparing Passkey...' : 'Continue with Passkey'}
                  </button>
                </div>
              )}

              {/* Email Form */}
              {method === 'email' && (
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setMethod('options')}
                    className="text-sm text-muted-foreground hover:text-foreground mb-4"
                  >
                    Back to options
                  </button>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe"
                      className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        errors.fullName ? 'border-destructive' : 'border-border'
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        errors.email ? 'border-destructive' : 'border-border'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10 ${
                          errors.password ? 'border-destructive' : 'border-border'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    
                    {/* Password Strength */}
                    <div className="mt-2">
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full ${
                              passwordStrength >= i
                                ? passwordStrength === 4
                                  ? 'bg-green-500'
                                  : passwordStrength >= 2
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                                : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className={`flex items-center gap-1 ${passwordRequirements.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <Check size={12} /> 8+ characters
                        </div>
                        <div className={`flex items-center gap-1 ${passwordRequirements.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <Check size={12} /> Uppercase
                        </div>
                        <div className={`flex items-center gap-1 ${passwordRequirements.number ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <Check size={12} /> Number
                        </div>
                        <div className={`flex items-center gap-1 ${passwordRequirements.special ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <Check size={12} /> Special char
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10 ${
                          errors.confirmPassword ? 'border-destructive' : 'border-border'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Terms Agreement */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={formData.agreeToTerms}
                      onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                      I agree to the{' '}
                      <a href="/#pricing" className="text-primary hover:underline">Terms of Service</a>
                      {' '}and{' '}
                      <a href="/#pricing" className="text-primary hover:underline">Privacy Policy</a>
                    </label>
                  </div>
                  {errors.agreeToTerms && (
                    <p className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.agreeToTerms}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary py-3"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setErrors({});
                        setStatusMessage('');
                        setMethod('login-options');
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Log In
                    </button>
                  </p>
                </form>
              )}

              {method === 'login' && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setMethod('login-options')}
                    className="text-sm text-muted-foreground hover:text-foreground mb-4"
                  >
                    Back to login options
                  </button>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        errors.email ? 'border-destructive' : 'border-border'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Password"
                        className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10 ${
                          errors.password ? 'border-destructive' : 'border-border'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary py-3"
                  >
                    {isLoading ? 'Signing In...' : 'Log In'}
                  </button>

                  <p className="text-center text-sm text-muted-foreground">
                    New to Tribe Block?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setErrors({});
                        setStatusMessage('');
                        setMethod('options');
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Create an account
                    </button>
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SignUpModal;
