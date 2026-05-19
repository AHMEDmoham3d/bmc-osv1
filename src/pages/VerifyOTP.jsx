import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import YawmiLogo from "../components/YawmiLogo";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const phone = localStorage.getItem("phone");
  const name = localStorage.getItem("name");

  async function handleVerify() {
    if (!otp) { setError("من فضلك ادخل الكود"); return; }
    setLoading(true);
    setError("");
    const { data, error: otpError } = await supabase.from("otps").select("*").eq("phone", phone).eq("otp", otp).eq("used", false).single();
    if (otpError || !data) { setError("الكود غلط أو منتهي"); setLoading(false); return; }
    await supabase.from("otps").update({ used: true }).eq("id", data.id);
    const { data: existing } = await supabase.from("users").select("*").eq("phone", phone).single();
    if (!existing) await supabase.from("users").insert({ phone, name });
    setLoading(false);
    navigate("/dashboard");
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <YawmiLogo className="yawmi-logo" as="h1" />

        <p style={s.sub}>ادخل الكود اللي اتبعتهولك على واتساب</p>
        <div style={s.form}>
          <label style={s.label}>كود التحقق</label>
          <input style={s.otpInput} placeholder="XXXX" value={otp} onChange={e => setOtp(e.target.value)} maxLength={4} />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} onClick={handleVerify} disabled={loading}>
            {loading ? "جاري التحقق..." : "تأكيد"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  card: { backgroundColor: "#ffffff", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px", border: "1px solid #e0e0e0" },
  logo: { fontSize: "42px", fontWeight: "900", color: "#000", textAlign: "center", marginBottom: "8px" },
  sub: { fontSize: "14px", color: "#666", textAlign: "center", marginBottom: "32px" },
  form: { display: "flex", flexDirection: "column" },
  label: { fontSize: "13px", fontWeight: "600", color: "#000", marginBottom: "6px" },
  otpInput: { padding: "16px", border: "1.5px solid #000", borderRadius: "10px", fontSize: "28px", fontWeight: "700", textAlign: "center", letterSpacing: "12px", marginBottom: "16px", outline: "none" },
  btn: { padding: "14px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: "pointer", marginTop: "8px" },
  error: { color: "red", fontSize: "13px", marginBottom: "8px" },
};