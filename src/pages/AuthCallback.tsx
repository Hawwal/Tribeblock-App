import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { saveSession, type AuthSession } from '@/lib/auth';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(searchParams.get('error') ?? '');

  useEffect(() => {
    const sessionHash = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('session');

    if (!sessionHash) {
      setError((current) => current || 'No auth session was returned.');
      return;
    }

    try {
      const normalized = sessionHash.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const session = JSON.parse(window.atob(padded)) as AuthSession;
      saveSession(session);
      window.setTimeout(() => {
        window.location.replace('/dashboard');
      }, 50);
    } catch {
      setError('The returned auth session could not be read.');
    }
  }, []);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <section className="w-full max-w-md bg-card border border-border rounded-lg p-6 text-center">
        {error ? (
          <>
            <AlertCircle className="mx-auto text-destructive mb-4" size={32} />
            <h1 className="text-2xl font-bold text-foreground mb-2">Sign in was not completed</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link to="/" className="btn-primary px-5 py-2.5 inline-flex">
              Return Home
            </Link>
          </>
        ) : (
          <>
            <CheckCircle className="mx-auto text-primary mb-4" size={32} />
            <h1 className="text-2xl font-bold text-foreground mb-2">Signing you in</h1>
            <p className="text-muted-foreground">Preparing your student dashboard...</p>
          </>
        )}
      </section>
    </main>
  );
};

export default AuthCallback;
