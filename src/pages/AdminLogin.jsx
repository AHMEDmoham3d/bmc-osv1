import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin() {
    if (!email || !password) { setError("ادخل الايميل والباسورد"); return; }
    setLoading(true); setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) { setError("الايميل أو الباسورد غلط"); setLoading(false); return; }
    navigate("/admin/dashboard");
  }

  // SVG Icons – Hollow outline style
  const MailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );

  const LockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="logo-wrapper">
          <h1 className="logo">يومي</h1>
          <div className="logo-underline"></div>
        </div>
        <p className="subtitle">لوحة التحكم</p>

        <div className="form-group">
          <label className="form-label">
            <MailIcon />
            <span>الايميل</span>
          </label>
          <input
            className="form-input"
            type="email"
            placeholder="admin@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <LockIcon />
            <span>الباسورد</span>
          </label>
          <input
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button className="submit-btn" onClick={handleLogin} disabled={loading}>
          {loading ? <span className="loading-spinner"></span> : "دخول"}
        </button>
      </div>

      <style jsx="true">{`
        .admin-page {
          min-height: 100vh;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          direction: rtl;
        }

        .admin-card {
          background: #ffffff;
          border-radius: 48px;
          padding: 48px 36px;
          width: 100%;
          max-width: 480px;
          border: 1px solid #e8e8e8;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.01);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          animation: cardFloat 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }

        .admin-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 32px rgba(0, 0, 0, 0.04);
        }

        @keyframes cardFloat {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
            filter: blur(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .logo-wrapper {
          text-align: center;
          margin-bottom: 12px;
        }

        .logo {
          font-size: 56px;
          font-weight: 900;
          letter-spacing: -1.5px;
          color: #000000;
          margin: 0;
          line-height: 1;
        }

        .logo-underline {
          width: 48px;
          height: 3px;
          background: #000000;
          margin: 12px auto 0;
          border-radius: 4px;
          opacity: 0.3;
          transition: width 0.2s ease;
        }

        .admin-card:hover .logo-underline {
          width: 72px;
          opacity: 0.6;
        }

        .subtitle {
          font-size: 15px;
          color: #5a5a5a;
          text-align: center;
          margin-bottom: 40px;
          font-weight: 450;
          letter-spacing: -0.2px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #000000;
          margin-bottom: 8px;
        }

        .form-label svg {
          width: 18px;
          height: 18px;
        }

        .form-input {
          width: 100%;
          padding: 14px 18px;
          border: 1.5px solid #e0e0e0;
          border-radius: 28px;
          font-size: 16px;
          font-family: inherit;
          background: #ffffff;
          transition: all 0.2s ease;
          outline: none;
          text-align: right;
          color: #000000;
          box-sizing: border-box;
        }

        .form-input:focus {
          border-color: #000000;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
        }

        .form-input::placeholder {
          color: #b0b0b0;
          font-size: 14px;
        }

        .error-message {
          color: #d32f2f;
          font-size: 13px;
          margin: -8px 0 16px 0;
          padding: 8px 14px;
          background: #fff4f4;
          border-radius: 40px;
          border-right: 2px solid #d32f2f;
          text-align: center;
        }

        .submit-btn {
          width: 100%;
          padding: 14px 20px;
          background: #000000;
          color: #ffffff;
          border: none;
          border-radius: 60px;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.25s cubic-bezier(0.23, 1, 0.32, 1);
          margin-top: 12px;
          font-family: inherit;
        }

        .submit-btn:hover:not(:disabled) {
          transform: scale(0.97);
          background: #1c1c1c;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 520px) {
          .admin-card {
            padding: 36px 24px;
            border-radius: 36px;
          }
          .logo {
            font-size: 44px;
          }
          .form-input {
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
}