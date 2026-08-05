import React, { useState } from 'react';
import { useAuth, DEMO_EMAIL, DEMO_PASSWORD } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, KeyRound } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, isSupabaseActive } = useAuth();
  const [email, setEmail] = useState(isSupabaseActive ? '' : DEMO_EMAIL);
  const [password, setPassword] = useState(isSupabaseActive ? '' : DEMO_PASSWORD);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const res = await login(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Invalid Admin Credentials.');
    }
  };

  const handleQuickDemoLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    const res = await login(DEMO_EMAIL, DEMO_PASSWORD);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Demo login is unavailable while Supabase auth is active.');
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        {/* Brand Header */}
        <div className="login-logo">
          <div className="logo-ic" style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src="/logo.svg" alt="Khataview" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '10px' }} />
          </div>
          <div className="logo-txt">
            <h2>Khataview CRM</h2>
            <p className="flex-center gap-1">
              <ShieldCheck size={14} className="accent" />
              <span>Admin Portal Access</span>
              <span className="badge b-fac text-xs">Role: Admin</span>
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="login-err" id="loginErr">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="lg">
            <label htmlFor="admin-email">Admin Email</label>
            <div className="sw">
              <Mail size={16} />
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@khatabook.com"
                style={{ paddingLeft: '32px' }}
              />
            </div>
          </div>

          <div className="lg">
            <label htmlFor="admin-password">Password</label>
            <div className="sw pw-wrap">
              <Lock size={16} />
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: '32px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary login-btn"
            id="loginBtn"
          >
            <span>Login as Admin</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick demo access — only meaningful while Supabase auth is inactive */}
        {!isSupabaseActive && (
          <>
            <div className="login-divider">
              <span>Instant Local Testing</span>
            </div>

            <button
              onClick={handleQuickDemoLogin}
              type="button"
              disabled={isSubmitting}
              className="btn btn-ghost login-btn mt-2"
            >
              <Sparkles size={16} className="teal" />
              <span>Quick Demo Admin Login</span>
            </button>
          </>
        )}

        {/* Auth Mode Status Footer */}
        <div className="login-footer mt-4">
          <KeyRound size={14} />
          <span>Auth Mode:</span>
          <span className={`fw6 ${isSupabaseActive ? 'cg' : 'co'}`}>
            {isSupabaseActive ? 'Supabase Cloud Auth' : 'Local Admin Mode (Active)'}
          </span>
        </div>
      </div>
    </div>
  );
};
