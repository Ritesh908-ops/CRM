import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, ShieldCheck, Lock, Mail, ArrowRight, Sparkles, KeyRound } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, isSupabaseActive } = useAuth();
  const [email, setEmail] = useState('admin@khatabook.com');
  const [password, setPassword] = useState('admin123');
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
    await login('admin@khatabook.com', 'admin123');
    setIsSubmitting(false);
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        {/* Brand Header */}
        <div className="login-logo">
          <div className="logo-ic">
            <Building2 size={22} />
          </div>
          <div className="logo-txt">
            <h2>Khatabook CRM</h2>
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

        {/* Quick Demo Access Divider */}
        <div className="login-divider">
          <span>Instant Local Testing</span>
        </div>

        {/* Quick Demo Admin Login CTA */}
        <button
          onClick={handleQuickDemoLogin}
          type="button"
          disabled={isSubmitting}
          className="btn btn-ghost login-btn mt-2"
        >
          <Sparkles size={16} className="teal" />
          <span>Quick Demo Admin Login</span>
        </button>

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
