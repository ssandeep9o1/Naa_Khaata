// src/pages/ForgotPassword/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="login-box">
      <h2>Forgot Password</h2>

      {success ? (
        <p style={{ color: 'lightgreen', textAlign: 'center' }}>
          If an account with that email exists, a password reset link has been sent. Please check your inbox.
        </p>
      ) : (
        <form onSubmit={handleSendResetLink}>
          <div className="user-box">
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label>Email</label>
          </div>
          
          {error && <p style={{ color: '#ff4d4d', textAlign: 'center' }}>{error}</p>}

          <div className="button-center-wrapper">
            <button type="submit" disabled={loading}>
              <span></span>
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      )}

      <p style={{ color: '#aaa', fontSize: '15px', textAlign: 'center', marginTop: '30px' }}>
        Remembered your password?{' '}
        <Link to="/login" style={{ color: '#ffffff', textDecoration: 'none' }}>
          Login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;