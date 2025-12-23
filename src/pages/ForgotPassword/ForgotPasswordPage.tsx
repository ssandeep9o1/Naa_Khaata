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

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="BG">
          <svg
            viewBox="0 0 512 512"
            className="ionicon"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M256 176a80 80 0 1080 80 80.24 80.24 0 00-80-80zm172.72 80a165.53 165.53 0 01-1.64 22.34l48.69 38.12a11.59 11.59 0 012.63 14.78l-46.06 79.52a11.64 11.64 0 01-14.14 4.93l-57.25-23a176.56 176.56 0 01-38.82 22.67l-8.56 60.78a11.93 11.93 0 01-11.51 9.86h-92.12a12 12 0 01-11.51-9.53l-8.56-60.78A169.3 169.3 0 01151.05 393L93.8 416a11.64 11.64 0 01-14.14-4.92L33.6 331.57a11.59 11.59 0 012.63-14.78l48.69-38.12A174.58 174.58 0 0183.28 256a165.53 165.53 0 011.64-22.34l-48.69-38.12a11.59 11.59 0 01-2.63-14.78l46.06-79.52a11.64 11.64 0 0114.14-4.93l57.25 23a176.56 176.56 0 0138.82-22.67l8.56-60.78A11.93 11.93 0 01209.94 26h92.12a12 12 0 0111.51 9.53l8.56 60.78A169.3 169.3 0 01361 119l57.2-23a11.64 11.64 0 0114.14 4.92l46.06 79.52a11.59 11.59 0 01-2.63 14.78l-48.69 38.12a174.58 174.58 0 011.64 22.66z"
            ></path>
          </svg>
        </div>

        <form className="content" onSubmit={handleSendResetLink}>
          <p className="heading">Oops!</p>
          <p className="sub-heading">Forgot password?</p>
          {success ? (
            <p className="message success">Reset link sent! Check email.</p>
          ) : (
            <>
              <p className="sub-sub-heading">Type your email to recover</p>
              <input
                className="email-input"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button className="card-btn" type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Reset Password'}
              </button>
              <Link to="/login" className="back-to-login-link">Back to Login</Link>
              {error && <p className="message error">{error}</p>}
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;