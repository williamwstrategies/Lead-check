import { FormEvent, useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

export function AccountPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const configured = isSupabaseConfigured();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const client = getSupabaseClient();
    if (!client) {
      setMessage('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable accounts.');
      return;
    }

    const result =
      mode === 'signup'
        ? await client.auth.signUp({ email, password })
        : await client.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setMessage(mode === 'signup' ? 'Account created. Check your email if confirmation is required.' : 'Signed in.');
    if (mode === 'signup') {
      void trackEvent('account_created', { method: 'email_password' });
    }
  }

  return (
    <section className="page-panel account-page">
      <div className="section-heading">
        <p className="eyebrow">Account</p>
        <h1>Save reports across devices.</h1>
        <p>
          Accounts are optional during beta. You can scan first, review the report, and connect Supabase Auth when
          you're ready to save reports across devices.
        </p>
      </div>

      {!configured ? (
        <div className="notice-panel">
          Supabase Auth is scaffolded but not configured. Add the public Supabase environment variables to enable this
          form.
        </div>
      ) : null}

      <div className="segmented-control" role="tablist" aria-label="Account mode">
        <button className={mode === 'signup' ? 'active' : ''} type="button" onClick={() => setMode('signup')}>
          <UserPlus size={17} aria-hidden="true" />
          Create Account
        </button>
        <button className={mode === 'signin' ? 'active' : ''} type="button" onClick={() => setMode('signin')}>
          <LogIn size={17} aria-hidden="true" />
          Sign In
        </button>
      </div>

      <form className="account-form" onSubmit={submit}>
        <label className="field full">
          <span>Email</span>
          <input value={email} onChange={event => setEmail(event.target.value)} type="email" autoComplete="email" />
        </label>
        <label className="field full">
          <span>Password</span>
          <input
            value={password}
            onChange={event => setPassword(event.target.value)}
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={6}
          />
        </label>
        <button className="primary-action" type="submit">
          {mode === 'signup' ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      {message ? <p className="inline-message">{message}</p> : null}
    </section>
  );
}
