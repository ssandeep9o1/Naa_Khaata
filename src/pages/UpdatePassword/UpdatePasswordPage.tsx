import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import './UpdatePasswordPage.css';

const UpdatePasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // useEffect hook to handle the URL's hash on component mount
  useEffect(() => {
    const handleUrlHash = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1)); // remove '#'
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        // Set the session using the tokens from the URL
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError('Failed to set session. Please try the reset link again.');
        } else {
          // You can navigate or stay on the same page, the session is now active
          // and the user can update their password.
          console.log('Session successfully set from URL tokens.');
        }
      }
    };

    handleUrlHash();
  }, []); // Run only once on component mount

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Call updateUser, which will now work because the session is set
    const { data, error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      // Wait a moment before navigating to give the user time to see the success message
      setTimeout(() => navigate('/login'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="login-box">
      <h2>Choose a New Password</h2>

      {success ? (
        <p style={{ color: 'lightgreen', textAlign: 'center' }}>
          Your password has been updated successfully! Redirecting to login...
        </p>
      ) : (
        <form onSubmit={handleUpdatePassword}>
          <div className="user-box">
            <input
              type="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label>New Password</label>
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
          
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          
          <div className="button-center-wrapper">
            <button type="submit" disabled={loading}>
              <span></span>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}; 

export default UpdatePasswordPage;