import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const VALID_EDU_DOMAINS = [
  "alexu.edu.eg", "aast.edu", "pua.edu.eg", "anu.edu.eg",
  "aou.edu.eg", "cu.edu.eg", "aucegypt.edu", "guc.edu.eg",
  "bue.edu.eg", "must.edu.eg", "zewailcity.edu.eg", "nile.edu.eg",
  "mans.edu.eg", "zu.edu.eg", "azhar.edu.eg", "tanta.edu.eg",
  "su.edu.eg", "aun.edu.eg",
];

const ALEXANDRIA_UNIVERSITIES = [
  "Alexandria University",
  "Arab Academy for Science & Technology (AAST)",
  "Pharos University (PUA)",
  "Alexandria National University (ANU)",
  "Arab Open University - Alexandria",
  "Other University",
];

const STUDY_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year", "Postgraduate"];

function validateEduEmail(email) {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  if (VALID_EDU_DOMAINS.includes(domain)) return true;
  if (domain.endsWith(".edu.eg")) return true;
  if (domain.endsWith(".edu")) return true;
  return false;
}

export default function Settings() {
  const [user, setUser] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [eduEmail, setEduEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [studyYear, setStudyYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const phone = localStorage.getItem("phone");

  useEffect(() => {
    if (!phone) { navigate("/login"); return; }
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: userData } = await supabase.from("users").select("*").eq("phone", phone).single();
    setUser(userData);
    if (userData) {
      const { data: studentData } = await supabase
        .from("student_info").select("*").eq("user_id", userData.id).maybeSingle();
      if (studentData) {
        setStudentInfo(studentData);
        setEduEmail(studentData.edu_email || "");
        setUniversity(studentData.university || "");
        setStudyYear(studentData.study_year || "");
      }
    }
    setLoading(false);
  }

  async function handleSave() {
    setError("");
    if (!eduEmail || !university || !studyYear) { setError("Please fill in all fields"); return; }
    if (!validateEduEmail(eduEmail.trim().toLowerCase())) {
      setError("This is not a valid university email. It must end with .edu.eg or .edu");
      return;
    }
    setSaving(true);

    const { data: existingEmail } = await supabase
      .from("student_info").select("user_id")
      .eq("edu_email", eduEmail.trim().toLowerCase())
      .neq("user_id", user.id).maybeSingle();

    if (existingEmail) {
      setError("This email is already registered to another user");
      setSaving(false);
      return;
    }

    const payload = {
      user_id: user.id,
      edu_email: eduEmail.trim().toLowerCase(),
      university,
      study_year: studyYear,
      verified: true,
      updated_at: new Date().toISOString(),
    };

    if (studentInfo) {
      await supabase.from("student_info").update(payload).eq("user_id", user.id);
    } else {
      await supabase.from("student_info").insert(payload);
    }

    setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);
    loadData();
  }

  const emailValid = validateEduEmail(eduEmail.trim().toLowerCase());
  const isComplete = studentInfo?.verified && studentInfo?.edu_email;

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.spinnerWrap}><div style={s.spinner}></div></div>
        </div>
        <style>{css}</style>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={() => navigate("/dashboard")}>← Back</button>
          <h1 style={s.title}>Student Info</h1>
        </div>

        {isComplete ? (
          <div style={s.successBanner}>
            <span>✓</span>
            <div>
              <p style={s.bannerTitle}>Verified — Ready for discounts</p>
              <p style={s.bannerSub}>{studentInfo.edu_email}</p>
            </div>
          </div>
        ) : (
          <div style={s.warningBanner}>
            <span>!</span>
            <div>
              <p style={s.bannerTitle}>Missing information</p>
              <p style={s.bannerSub}>Complete your info to unlock discounts</p>
            </div>
          </div>
        )}

        <div style={s.form}>
          <div style={s.field}>
            <label style={s.label}>University Email</label>
            <input
              style={{ ...s.input, borderColor: eduEmail.length > 5 ? (emailValid ? "#00aa00" : "#d32f2f") : "#e0e0e0" }}
              type="email" placeholder="student@alexu.edu.eg"
              value={eduEmail} onChange={(e) => setEduEmail(e.target.value)} dir="ltr"
            />
            {eduEmail.length > 5 && (
              <p style={{ fontSize: "12px", color: emailValid ? "#00aa00" : "#d32f2f", margin: "4px 0 0" }}>
                {emailValid ? "✓ Valid university email" : "✗ Not a university email, must end with .edu.eg"}
              </p>
            )}
            <p style={s.hint}>The email issued by your university, not Gmail</p>
          </div>

          <div style={s.field}>
            <label style={s.label}>University</label>
            <select style={s.input} value={university} onChange={(e) => setUniversity(e.target.value)}>
              <option value="">Select your university</option>
              {ALEXANDRIA_UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Study Year</label>
            <select style={s.input} value={studyYear} onChange={(e) => setStudyYear(e.target.value)}>
              <option value="">Select your year</option>
              {STUDY_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {error && <p style={s.error}>{error}</p>}
          {success && <p style={s.successMsg}>✓ Information saved successfully</p>}

          <button style={{ ...s.btn, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Information"}
          </button>
        </div>

        <div style={s.infoBox}>
          <p style={s.infoTitle}>Why do we need a university email?</p>
          <p style={s.infoText}>Your university email proves you're a student so you can unlock Yawmi discounts. We will never send anything to this email.</p>
        </div>
      </div>
      <style>{css}</style>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Inter', -apple-system, sans-serif" },
  card: { background: "#fff", borderRadius: "40px", padding: "36px 28px", width: "100%", maxWidth: "480px", border: "1px solid #e8e8e8", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" },
  header: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" },
  backBtn: { background: "none", border: "1.5px solid #e0e0e0", borderRadius: "40px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", color: "#000" },
  title: { fontSize: "20px", fontWeight: "800", color: "#000", margin: 0 },
  successBanner: { display: "flex", alignItems: "center", gap: "12px", background: "#f0fff4", border: "1.5px solid #00aa00", borderRadius: "20px", padding: "14px 18px", marginBottom: "24px", color: "#00aa00" },
  warningBanner: { display: "flex", alignItems: "center", gap: "12px", background: "#fffbf0", border: "1.5px solid #f0a500", borderRadius: "20px", padding: "14px 18px", marginBottom: "24px", color: "#f0a500" },
  bannerTitle: { fontSize: "14px", fontWeight: "700", margin: 0, color: "inherit" },
  bannerSub: { fontSize: "12px", margin: "2px 0 0", color: "inherit" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "14px", fontWeight: "600", color: "#000" },
  input: { width: "100%", padding: "13px 16px", border: "1.5px solid #e0e0e0", borderRadius: "20px", fontSize: "15px", fontFamily: "inherit", background: "#fff", outline: "none", color: "#000", boxSizing: "border-box", transition: "border-color 0.2s" },
  hint: { fontSize: "11px", color: "#999", margin: "2px 0 0" },
  error: { fontSize: "13px", color: "#d32f2f", background: "#fff4f4", borderRadius: "16px", padding: "10px 14px", textAlign: "center", margin: 0 },
  successMsg: { fontSize: "13px", color: "#00aa00", background: "#f0fff4", borderRadius: "16px", padding: "10px 14px", textAlign: "center", margin: 0 },
  btn: { width: "100%", padding: "14px", background: "#000", color: "#fff", border: "none", borderRadius: "40px", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
  infoBox: { background: "#f8f8f8", borderRadius: "20px", padding: "16px", marginTop: "24px" },
  infoTitle: { fontSize: "13px", fontWeight: "700", color: "#000", margin: "0 0 6px" },
  infoText: { fontSize: "12px", color: "#666", lineHeight: "1.6", margin: 0 },
  spinnerWrap: { display: "flex", justifyContent: "center", padding: "40px" },
  spinner: { width: "32px", height: "32px", border: "3px solid #f0f0f0", borderTop: "3px solid #000", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

const css = `@keyframes spin { to { transform: rotate(360deg); } }`;