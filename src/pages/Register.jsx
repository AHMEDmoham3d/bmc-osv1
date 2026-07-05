import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

function validateEgyptPhone(p) {
  return /^(01)[0125][0-9]{8}$/.test(p);
}

export default function Register() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleRegister() {
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!validateEgyptPhone(phone.trim())) { setError("Please enter a valid Egyptian phone number (e.g. 01012345678)"); return; }
    setLoading(true);
    setError("");
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone.trim())
        .maybeSingle();
      if (fetchError && fetchError.code !== "PGRST116") throw new Error(fetchError.message);

      if (existing) {
        // Existing user — store only user_id
        localStorage.setItem("user_id", existing.id);
        navigate("/dashboard");
        return;
      }

      // New user — insert and store only user_id
      const { data: inserted, error: insertError } = await supabase
        .from("users")
        .insert({ name: name.trim(), phone: phone.trim() })
        .select()
        .single();
      if (insertError) throw new Error(insertError.message);

      localStorage.setItem("user_id", inserted.id);
      navigate("/settings");
    } catch (err) {
      setError((err && err.message) || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const phoneValid = validateEgyptPhone(phone.trim());
  const phoneInvalid = phone.length === 11 && !phoneValid;

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="logo-wrapper">
          <span className="yawmi-logo">Yawmi</span>
          <div className="logo-underline" />
        </div>
        <p className="subtitle">Make every step count in your day</p>

        <div className="form-group">
          <label className="form-label">
            <UserIcon />
            <span>Full name</span>
          </label>
          <input
            className="form-input"
            type="text"
            placeholder="Ahmed Mahmoud"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <PhoneIcon />
            <span>Phone number (WhatsApp)</span>
          </label>
          <input
            className={`form-input ${phoneInvalid ? "input-error" : phoneValid ? "input-valid" : ""}`}
            type="tel"
            placeholder="01xxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            maxLength={11}
            inputMode="numeric"
          />
          {phone.length === 11 && (
            <p className={phoneValid ? "phone-valid" : "phone-invalid"}>
              {phoneValid ? "✓ Valid number" : "✗ Invalid Egyptian number"}
            </p>
          )}
          <p className="phone-hint">Make sure this number has WhatsApp</p>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button className="submit-btn" onClick={handleRegister} disabled={loading}>
          {loading ? <span className="loading-spinner" /> : <><span>Register now</span><ArrowIcon /></>}
        </button>

        <p className="hint-text">
          Already have an account?{" "}
          <span className="link-text" onClick={() => navigate("/login")}>Sign in</span>
        </p>
      </div>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .register-page {
          min-height: 100vh;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif;
        }
        .register-card {
          background: #ffffff;
          border-radius: 48px;
          padding: 48px 36px;
          width: 100%;
          max-width: 480px;
          border: 1px solid #e8e8e8;
          box-shadow: 0 8px 24px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.01);
          animation: cardFloat 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        .register-card:hover { transform: translateY(-3px); box-shadow: 0 20px 32px rgba(0,0,0,0.04); }
        @keyframes cardFloat {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .logo-wrapper { text-align: center; margin-bottom: 12px; }
        .yawmi-logo { font-size: 56px; font-weight: 900; letter-spacing: -1.5px; color: #000000; display: inline-block; line-height: 1; }
        .logo-underline { width: 48px; height: 3px; background: #000000; margin: 12px auto 0; border-radius: 4px; opacity: 0.3; transition: width 0.2s ease; }
        .register-card:hover .logo-underline { width: 72px; opacity: 0.6; }
        .subtitle { font-size: 15px; color: #5a5a5a; text-align: center; margin-bottom: 40px; font-weight: 450; }
        .form-group { margin-bottom: 24px; }
        .form-label { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #000; margin-bottom: 8px; }
        .form-input { width: 100%; padding: 14px 18px; border: 1.5px solid #e0e0e0; border-radius: 28px; font-size: 16px; font-family: inherit; background: #ffffff; transition: all 0.2s ease; outline: none; color: #000000; }
        .form-input:focus { border-color: #000000; box-shadow: 0 0 0 2px rgba(0,0,0,0.05); }
        .form-input::placeholder { color: #b0b0b0; font-size: 14px; }
        .input-valid { border-color: #00aa00; }
        .input-error { border-color: #d32f2f; }
        .phone-valid { font-size: 12px; color: #00aa00; margin-top: 4px; padding-left: 8px; }
        .phone-invalid { font-size: 12px; color: #d32f2f; margin-top: 4px; padding-left: 8px; }
        .phone-hint { font-size: 12px; color: #999; margin-top: 4px; padding-left: 8px; }
        .error-message { color: #d32f2f; font-size: 13px; margin: -8px 0 16px 0; padding: 8px 14px; background: #fff4f4; border-radius: 40px; border-left: 2px solid #d32f2f; }
        .submit-btn { width: 100%; padding: 14px 20px; background: #000000; color: #ffffff; border: none; border-radius: 60px; font-size: 17px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: all 0.25s cubic-bezier(0.23, 1, 0.32, 1); margin-top: 12px; margin-bottom: 20px; font-family: inherit; }
        .submit-btn:hover:not(:disabled) { transform: scale(0.97); background: #1c1c1c; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .loading-spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .hint-text { text-align: center; font-size: 13px; color: #6a6a6a; margin-top: 8px; }
        .link-text { color: #000; font-weight: 700; cursor: pointer; border-bottom: 1px dashed #000; transition: all 0.2s; padding-bottom: 1px; }
        .link-text:hover { border-bottom-style: solid; opacity: 0.8; }
        @media (max-width: 520px) {
          .register-card { padding: 36px 24px; border-radius: 36px; }
          .yawmi-logo { font-size: 44px; }
          .form-input { padding: 12px 16px; }
        }
      `}</style>
    </div>
  );
}