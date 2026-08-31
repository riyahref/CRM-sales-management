import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ApiErrorResponse } from "../types/auth";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, sessionExpiredMessage, clearSessionExpiredMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromLocation =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  const activeError = errorMessage || sessionExpiredMessage;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(fromLocation, { replace: true });
    }
  }, [isAuthenticated, navigate, fromLocation]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    clearSessionExpiredMessage();

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(fromLocation, { replace: true });
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      if (apiErr.message) {
        setErrorMessage(apiErr.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setErrorMessage(null);
  };

  return (
    <div className="login-page-container">
      <div className="login-card raised">
        <div className="login-header">
          <Link to="/" className="login-brand-logo" title="Back to Landing Page">
            <svg className="logo-mark" width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M2 19L9 6L13 14L16 9L22 19H2Z" fill="#2E5BFF" />
            </svg>
            <span className="brand-text">Ridgeline</span>
          </Link>
          <h1 className="login-title">Sign in to Ridgeline</h1>
          <p className="login-subtitle">
            Enter your account credentials to access your sales pipeline
          </p>
        </div>

        {activeError && (
          <div className="alert-banner error mb-2" role="alert" id="login-error-banner">
            <span>{activeError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="email-input">Work Email</label>
            <input
              id="email-input"
              type="email"
              placeholder="rep_1@acme.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="login-submit-btn btn-signal"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In to Portal"}
          </button>
        </form>

        <div className="demo-accounts-box inset">
          <div className="demo-title">Quick Demo Login</div>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="demo-fill-btn"
              onClick={() => fillDemoAccount("manager_1@acme.test")}
            >
              <span className="demo-role">Sales Manager</span>
              <span className="demo-email mono">manager_1@acme.test</span>
            </button>
            <button
              type="button"
              className="demo-fill-btn"
              onClick={() => fillDemoAccount("rep_1@acme.test")}
            >
              <span className="demo-role">Sales Rep</span>
              <span className="demo-email mono">rep_1@acme.test</span>
            </button>
          </div>
        </div>

        <div className="login-footer-link">
          <Link to="/">&larr; Back to Landing Page</Link>
        </div>
      </div>
    </div>
  );
};
