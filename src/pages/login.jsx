import { useState } from 'react';
import authService from '../services/authService';
import './login.css';

function Login({ onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
    // rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errorMessage) setErrorMessage('');
  };

  const toggleMode = () => {
    setIsRegisterMode((prev) => !prev);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const emailTrimmed = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Client-side validations
    if (isRegisterMode && !formData.name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!emailTrimmed) {
      setErrorMessage('Email address is required.');
      return;
    }

    if (!emailRegex.test(emailTrimmed)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!formData.password) {
      setErrorMessage('Password is required.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (isRegisterMode && formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        // --- 1. Register Flow ---
        await authService.register(
          formData.name,
          emailTrimmed,
          formData.password
        );

        setSuccessMessage('Account created successfully! Logging you in...');

        // Auto-login after registration
        const loginData = await authService.login(emailTrimmed, formData.password);
        
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(loginData.user);
          }
        }, 800);

      } else {
        // --- 2. Login Flow ---
        const loginData = await authService.login(emailTrimmed, formData.password);

        setSuccessMessage(`Welcome back, ${loginData.user?.name || 'User'}!`);

        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(loginData.user);
          }
        }, 600);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-section">
      <div className="login-backdrop-overlay" />

      <div className="login-content">
        {/* Brand & Title */}
        <div className="login-header">
          <div className="brand-badge">
            <svg
              className="brand-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            <span>MachineCare CMMS</span>
          </div>

          <h2 className="login-title text-align-center"> {isRegisterMode ? 'Create Account' : 'Welcome back'}</h2>
          <p className="login-subtitle">
            {isRegisterMode
              ? 'Register to start managing plant assets and work orders'
              : 'Sign in to access your maintenance dashboard'}
          </p>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="login-alert error" role="alert">
            <svg viewBox="0 0 24 24" className="alert-icon" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="login-alert success" role="alert">
            <svg viewBox="0 0 24 24" className="alert-icon" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name (Registration only) */}
          {isRegisterMode && (
            <div className="login-field">
              <label htmlFor="auth-name">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="auth-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  autoComplete="name"
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="login-field">
            <label htmlFor="auth-email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                id="auth-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="login-field">
            <div className="field-label-row">
              <label htmlFor="auth-password">Password</label>
              {/* {!isRegisterMode && (
                <a href="#forgot" className="forgot-link" onClick={(e) => e.preventDefault()}>
                  Forgot password?
                </a>
              )} */}
            </div>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isRegisterMode ? 'Min 8 characters' : 'Enter your password'}
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password (Registration only) */}
          {isRegisterMode && (
            <div className="login-field">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          {/* Remember Me Option (Login mode only) */}
          {/* {!isRegisterMode && (
            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>
          )} */}

          {/* Submit Button */}
          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <span className="btn-content-loading">
                <span className="btn-spinner" aria-hidden="true"></span>
                {isRegisterMode ? 'Creating account...' : 'Signing in...'}
              </span>
            ) : isRegisterMode ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        {/* <div className="auth-switch">
          <span>{isRegisterMode ? 'Already have an account?' : "Don't have an account?"}</span>{' '}
          <button type="button" className="switch-btn" onClick={toggleMode} disabled={loading}>
            {isRegisterMode ? 'Sign In' : 'Sign Up'}
          </button>
        </div> */}

        {/* Footer */}
        <div className="login-footer">
          <p>
            Connected to <strong>CMMS Auth Engine</strong> • JWT Secured
          </p>
        </div>
      </div>
    </section>
  );
}

export default Login;
