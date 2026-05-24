// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "./supabase";
// import YawmiLogo from "../components/YawmiLogo";

// const PhoneIcon = () => (
//   <svg
//     width="20"
//     height="20"
//     viewBox="0 0 24 24"
//     fill="white"
//     stroke="black"
//     strokeWidth="1.5"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
//   </svg>
// );

// const ArrowIcon = () => (
//   <svg
//     width="18"
//     height="18"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="black"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <path d="M5 12h14M12 5l7 7-7 7" />
//   </svg>
// );

// export default function Login() {
//   const [phone, setPhone] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   async function handleLogin() {
//     if (!phone) {
//       setError("Please enter your mobile number");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     const { data } = await supabase
//       .from("users")
//       .select("*")
//       .eq("phone", phone)
//       .single();

//     if (!data) {
//       setError("This number is not registered");
//       setLoading(false);
//       return;
//     }

//     const otp = Math.floor(1000 + Math.random() * 9000).toString();
//     await supabase.from("otps").insert({ phone, otp });

//     localStorage.setItem("phone", phone);
//     localStorage.setItem("name", data.name);

//     setLoading(false);
//     navigate("/verify");
//   }

//   return (
//     <div className="login-page">
//       <div className="login-card">
//         <div className="logo-wrapper">
//           <YawmiLogo className="logo" />
//           <div className="logo-underline"></div>
//         </div>

//         <p className="subtitle">Enter your mobile number</p>

//         <div className="form-group">
//           <label className="form-label">
//             <PhoneIcon />
//             <span>Mobile number</span>
//           </label>
//           <input
//             className="form-input"
//             type="tel"
//             placeholder="01xxxxxxxxx"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value)}
//           />
//         </div>

//         {error && <p className="error-message">{error}</p>}

//         <button className="submit-btn" onClick={handleLogin} disabled={loading}>
//           {loading ? (
//             <span className="loading-spinner"></span>
//           ) : (
//             <>
//               Login
//               <ArrowIcon />
//             </>
//           )}
//         </button>

//         <p className="hint-text">
//           Don’t have an account?
//           <span className="link-text" onClick={() => navigate("/register")}> Sign up</span>
//         </p>
//       </div>

//       <style jsx="true">{`
//         .login-page {
//           min-height: 100vh;
//           background: #f5f5f5;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 24px;
//           font-family: 'Inter', 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//           direction: rtl;
//         }

//         .login-card {
//           background: #ffffff;
//           border-radius: 48px;
//           padding: 48px 36px;
//           width: 100%;
//           max-width: 480px;
//           border: 1px solid #e8e8e8;
//           box-shadow: 0 8px 24px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.01);
//           transition: transform 0.2s ease, box-shadow 0.2s ease;
//           animation: cardFloat 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
//         }

//         .login-card:hover {
//           transform: translateY(-3px);
//           box-shadow: 0 20px 32px rgba(0, 0, 0, 0.04);
//         }

//         @keyframes cardFloat {
//           from {
//             opacity: 0;
//             transform: translateY(20px) scale(0.98);
//             filter: blur(2px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0) scale(1);
//             filter: blur(0);
//           }
//         }

//         .logo-wrapper {
//           text-align: center;
//           margin-bottom: 12px;
//         }

//         .logo {
//           font-size: 56px;
//           font-weight: 900;
//           letter-spacing: -1.5px;
//           color: #000000;
//           margin: 0;
//           line-height: 1;
//         }

//         .logo-underline {
//           width: 48px;
//           height: 3px;
//           background: #000000;
//           margin: 12px auto 0;
//           border-radius: 4px;
//           opacity: 0.3;
//           transition: width 0.2s ease;
//         }

//         .login-card:hover .logo-underline {
//           width: 72px;
//           opacity: 0.6;
//         }

//         .subtitle {
//           font-size: 15px;
//           color: #5a5a5a;
//           text-align: center;
//           margin-bottom: 40px;
//           font-weight: 450;
//           letter-spacing: -0.2px;
//         }

//         .form-group {
//           margin-bottom: 24px;
//         }

//         .form-label {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           font-size: 14px;
//           font-weight: 600;
//           color: #000000;
//           margin-bottom: 8px;
//         }

//         .form-label svg {
//           width: 18px;
//           height: 18px;
//         }

//         .form-input {
//           width: 100%;
//           padding: 14px 18px;
//           border: 1.5px solid #e0e0e0;
//           border-radius: 28px;
//           font-size: 16px;
//           font-family: inherit;
//           background: #ffffff;
//           transition: all 0.2s ease;
//           outline: none;
//           text-align: right;
//           color: #000000;
//           box-sizing: border-box;
//         }

//         .form-input:focus {
//           border-color: #000000;
//           box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
//         }

//         .form-input::placeholder {
//           color: #b0b0b0;
//           font-size: 14px;
//         }

//         .error-message {
//           color: #d32f2f;
//           font-size: 13px;
//           margin: -8px 0 16px 0;
//           padding: 8px 14px;
//           background: #fff4f4;
//           border-radius: 40px;
//           border-right: 2px solid #d32f2f;
//           text-align: center;
//         }

//         .submit-btn {
//           width: 100%;
//           padding: 14px 20px;
//           background: #000000;
//           color: #ffffff;
//           border: none;
//           border-radius: 60px;
//           font-size: 17px;
//           font-weight: 700;
//           cursor: pointer;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           gap: 12px;
//           transition: all 0.25s cubic-bezier(0.23, 1, 0.32, 1);
//           margin-top: 12px;
//           margin-bottom: 20px;
//           font-family: inherit;
//         }

//         .submit-btn:hover:not(:disabled) {
//           transform: scale(0.97);
//           background: #1c1c1c;
//           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//         }

//         .submit-btn:disabled {
//           opacity: 0.7;
//           cursor: not-allowed;
//         }

//         .loading-spinner {
//           width: 20px;
//           height: 20px;
//           border: 2px solid rgba(255, 255, 255, 0.3);
//           border-top: 2px solid white;
//           border-radius: 50%;
//           animation: spin 0.8s linear infinite;
//         }

//         @keyframes spin {
//           to { transform: rotate(360deg); }
//         }

//         .hint-text {
//           text-align: center;
//           font-size: 13px;
//           color: #6a6a6a;
//           margin-top: 8px;
//         }

//         .link-text {
//           color: #000000;
//           font-weight: 700;
//           cursor: pointer;
//           border-bottom: 1px dashed #000000;
//           transition: all 0.2s;
//           padding-bottom: 1px;
//           margin-right: 6px;
//         }

//         .link-text:hover {
//           border-bottom-style: solid;
//           opacity: 0.8;
//         }

//         /* Responsive */
//         @media (max-width: 520px) {
//           .login-card {
//             padding: 36px 24px;
//             border-radius: 36px;
//           }
//           .logo {
//             font-size: 44px;
//           }
//           .form-input {
//             padding: 12px 16px;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin() {
    if (!phone) { alert("ادخل رقم موبايلك"); return; }
    setLoading(true);
    const { data } = await supabase.from("users").select("*").eq("phone", phone).single();
    if (data) {
      localStorage.setItem("phone", phone);
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
    setLoading(false);
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.logo}>Yawmi</h1>
        <p style={s.sub}>ادخل رقم موبايلك</p>
        <input style={s.input} placeholder="01xxxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} />
        <button style={s.btn} onClick={handleLogin} disabled={loading}>
          {loading ? "جاري..." : "دخول"}
        </button>
        <p style={s.hint}>مش مسجل؟ هنسجلك تلقائياً</p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  container: { width: "100%", maxWidth: "400px" },
  logo: { fontSize: "48px", fontWeight: "900", color: "#000", marginBottom: "8px" },
  sub: { fontSize: "16px", color: "#666", marginBottom: "32px" },
  input: { width: "100%", padding: "16px", border: "2px solid #000", borderRadius: "12px", fontSize: "18px", marginBottom: "16px", outline: "none", textAlign: "right", boxSizing: "border-box" },
  btn: { width: "100%", padding: "16px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer" },
  hint: { textAlign: "center", color: "#999", fontSize: "13px", marginTop: "16px" },
};