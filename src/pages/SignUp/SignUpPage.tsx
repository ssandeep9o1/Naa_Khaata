// src/pages/SignUp/SignUpPage.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import './SignUpPage.css'; // Use the new CSS

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else {
      alert('Sign up successful! Please check your email for verification.');
      navigate('/login'); // Redirect to login after successful signup
    }
    setLoading(false);
  };

  return (
    <div className="login-box">
      <h2 style={{ color: '#fff', textAlign: 'center', margin: '0 0 30px' }}>Sign Up</h2>
      <form onSubmit={handleSignUp}>
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
        <div className="user-box">
          <input
            type="password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>Password</label>
        </div>
        <div className="user-box">
          <input
            type="password"
            name="confirmPassword"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <label>Confirm Password</label>
        </div>
        
        {error && <p style={{ color: '#ff4d4d', textAlign: 'center' }}>{error}</p>}

        <div className="button-center-wrapper">
          <button type="submit" disabled={loading}>
            <span></span>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
       <p style={{ color: '#aaa', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#ffffffff', textDecoration: 'none' }}>
          Login
        </Link>
      </p>
    </div>
  );
};

export default SignUpPage;