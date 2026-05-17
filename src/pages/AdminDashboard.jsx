import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function AdminDashboard() {
  const [otps, setOtps] = useState([]);
  const [users, setUsers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [places, setPlaces] = useState([]);
  const [activeTab, setActiveTab] = useState("otps");
  const [newPlace, setNewPlace] = useState({ name: "", type: "restaurant", cashier_code: "", discount_amount: "" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState("");
  const navigate = useNavigate();

  useEffect(() => { checkAdmin(); loadData(); }, []);

  async function checkAdmin() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) navigate("/admin");
  }

  async function loadData() {
    const [o, u, v, p] = await Promise.all([
      supabase.from("otps").select("*").eq("used", false).order("created_at", { ascending: false }),
      supabase.from("users").select("*").order("created_at", { ascending: false }),
      supabase.from("visits").select("*, users(name, phone), places(name, type)").order("created_at", { ascending: false }),
      supabase.from("places").select("*").order("created_at", { ascending: false }),
    ]);
    setOtps(o.data || []); setUsers(u.data || []); setVisits(v.data || []); setPlaces(p.data || []);
  }

  async function handleAddPlace() {
    if (!newPlace.name || !newPlace.cashier_code || !newPlace.discount_amount) { alert("ادخل كل البيانات"); return; }
    const { error } = await supabase.from("places").insert({ ...newPlace, discount_amount: Number(newPlace.discount_amount) });
    if (error) { alert("حصل خطأ: " + error.message); return; }
    setNewPlace({ name: "", type: "restaurant", cashier_code: "", discount_amount: "" });
    loadData(); alert("تم إضافة المكان");
  }

  async function handleDeletePlace(id) {
    if (!window.confirm("متأكد؟")) return;
    await supabase.from("places").delete().eq("id", id);
    loadData();
  }

  async function sendDiscount() {
    if (!selectedUser || !selectedPlace) { alert("اختار مستخدم ومكان"); return; }
    const place = places.find(p => p.id === selectedPlace);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await supabase.from("discount_codes").insert({ user_id: selectedUser, code, place: place.name, place_id: selectedPlace });
    alert("كود الخصم: " + code);
    setSelectedUser(null); setSelectedPlace("");
  }

  function getTypeLabel(type) {
    if (type === "restaurant") return "مطعم";
    if (type === "gym") return "جيم";
    if (type === "beach") return "شاطئ";
    if (type === "court") return "ملعب";
    return type;
  }

  const tabs = [
    { key: "otps", label: `OTPs (${otps.length})` },
    { key: "users", label: `المستخدمين (${users.length})` },
    { key: "visits", label: `الزيارات (${visits.length})` },
    { key: "places", label: `الأماكن (${places.length})` },
    { key: "discount", label: "إرسال خصم" },
  ];

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.logo}>يومي — أدمن</h1>
          <div style={s.headerRight}>
            <button style={s.refreshBtn} onClick={loadData}>تحديث</button>
            <button style={s.logoutBtn} onClick={async () => { await supabase.auth.signOut(); navigate("/admin"); }}>خروج</button>
          </div>
        </div>

        <div style={s.statsRow}>
          <div style={s.stat}><p style={s.statN}>{users.length}</p><p style={s.statL}>مستخدم</p></div>
          <div style={s.stat}><p style={s.statN}>{visits.length}</p><p style={s.statL}>زيارة</p></div>
          <div style={s.stat}><p style={s.statN}>{places.length}</p><p style={s.statL}>مكان</p></div>
          <div style={s.stat}><p style={s.statN}>{visits.reduce((sum, v) => sum + (v.discount_used || 0), 0)}</p><p style={s.statL}>جنيه وُفِّر</p></div>
        </div>

        <div style={s.tabs}>
          {tabs.map(t => (
            <button key={t.key} style={activeTab === t.key ? s.activeTab : s.tab} onClick={() => setActiveTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {activeTab === "otps" && (
          <div>
            {otps.length === 0 ? <p style={s.empty}>مفيش OTPs دلوقتي</p> : otps.map(o => (
              <div key={o.id} style={s.card}>
                <div style={s.cardRow}>
                  <span style={s.cardMain}>{o.phone}</span>
                  <span style={s.otpCode}>{o.otp}</span>
                </div>
                <p style={s.cardSub}>{new Date(o.created_at).toLocaleTimeString("ar-EG")}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "users" && (
          <div>
            {users.length === 0 ? <p style={s.empty}>مفيش مستخدمين</p> : users.map(u => (
              <div key={u.id} style={s.card}>
                <div style={s.cardRow}>
                  <span style={s.cardMain}>{u.name}</span>
                  <span style={s.cardSub}>{u.phone}</span>
                </div>
                <p style={s.cardDate}>{new Date(u.created_at).toLocaleDateString("ar-EG")}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "visits" && (
          <div>
            {visits.length === 0 ? <p style={s.empty}>مفيش زيارات</p> : visits.map(v => (
              <div key={v.id} style={s.card}>
                <div style={s.cardRow}>
                  <span style={s.cardMain}>{v.users?.name}</span>
                  <span style={s.savedBadge}>وفّر {v.discount_used} جنيه</span>
                </div>
                <div style={s.cardRow}>
                  <span style={s.cardSub}>{v.users?.phone}</span>
                  <span style={s.cardSub}>{v.places?.name} • {getTypeLabel(v.places?.type)}</span>
                </div>
                <p style={s.cardDate}>{new Date(v.created_at).toLocaleDateString("ar-EG")}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "places" && (
          <div>
            <div style={s.addCard}>
              <h2 style={s.sectionTitle}>إضافة مكان جديد</h2>
              <input style={s.input} placeholder="اسم المكان" value={newPlace.name} onChange={e => setNewPlace({ ...newPlace, name: e.target.value })} />
              <select style={s.input} value={newPlace.type} onChange={e => setNewPlace({ ...newPlace, type: e.target.value })}>
                <option value="restaurant">مطعم</option>
                <option value="gym">جيم</option>
                <option value="beach">شاطئ</option>
                <option value="court">ملعب</option>
              </select>
              <input style={s.input} placeholder="كود الكاشير" value={newPlace.cashier_code} onChange={e => setNewPlace({ ...newPlace, cashier_code: e.target.value })} />
              <input style={s.input} placeholder="قيمة الخصم بالجنيه" value={newPlace.discount_amount} onChange={e => setNewPlace({ ...newPlace, discount_amount: e.target.value })} />
              <button style={s.btn} onClick={handleAddPlace}>إضافة المكان</button>
            </div>
            {places.map(p => (
              <div key={p.id} style={s.card}>
                <div style={s.cardRow}>
                  <span style={s.cardMain}>{p.name}</span>
                  <span style={s.typeBadge}>{getTypeLabel(p.type)}</span>
                </div>
                <div style={s.cardRow}>
                  <span style={s.cardSub}>كود: {p.cashier_code}</span>
                  <span style={s.cardSub}>خصم: {p.discount_amount} جنيه</span>
                </div>
                <button style={s.deleteBtn} onClick={() => handleDeletePlace(p.id)}>حذف</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "discount" && (
          <div style={s.addCard}>
            <h2 style={s.sectionTitle}>إرسال كود خصم</h2>
            <label style={s.label}>اختار المستخدم</label>
            <select style={s.input} value={selectedUser || ""} onChange={e => setSelectedUser(e.target.value)}>
              <option value="">-- اختار مستخدم --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} - {u.phone}</option>)}
            </select>
            <label style={s.label}>اختار المكان</label>
            <select style={s.input} value={selectedPlace} onChange={e => setSelectedPlace(e.target.value)}>
              <option value="">-- اختار مكان --</option>
              {places.map(p => <option key={p.id} value={p.id}>{p.name} - خصم {p.discount_amount} جنيه</option>)}
            </select>
            <button style={s.btn} onClick={sendDiscount}>إرسال كود الخصم</button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", backgroundColor: "#f5f5f5", padding: "20px" },
  container: { maxWidth: "700px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", backgroundColor: "#fff", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e0e0e0" },
  logo: { fontSize: "22px", fontWeight: "900", color: "#000" },
  headerRight: { display: "flex", gap: "8px" },
  refreshBtn: { padding: "8px 16px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #000", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  logoutBtn: { padding: "8px 16px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  statsRow: { display: "flex", gap: "10px", marginBottom: "20px" },
  stat: { flex: 1, backgroundColor: "#000", color: "#fff", borderRadius: "12px", padding: "16px", textAlign: "center" },
  statN: { fontSize: "22px", fontWeight: "900", marginBottom: "2px" },
  statL: { fontSize: "11px", opacity: 0.7 },
  tabs: { display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" },
  tab: { padding: "10px 14px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #000", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  activeTab: { padding: "10px 14px", backgroundColor: "#000", color: "#fff", border: "1.5px solid #000", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  card: { backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "16px", marginBottom: "10px" },
  cardRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  cardMain: { fontSize: "15px", fontWeight: "700", color: "#000" },
  cardSub: { fontSize: "13px", color: "#666" },
  cardDate: { fontSize: "11px", color: "#999", marginTop: "4px" },
  otpCode: { fontSize: "24px", fontWeight: "900", letterSpacing: "8px", color: "#000" },
  savedBadge: { backgroundColor: "#000", color: "#fff", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  typeBadge: { backgroundColor: "#f0f0f0", color: "#000", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  addCard: { backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "24px", marginBottom: "16px" },
  sectionTitle: { fontSize: "16px", fontWeight: "700", color: "#000", marginBottom: "16px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#000", marginBottom: "6px", display: "block" },
  input: { width: "100%", padding: "12px 16px", border: "1.5px solid #000", borderRadius: "10px", fontSize: "14px", marginBottom: "12px", outline: "none", textAlign: "right", boxSizing: "border-box", backgroundColor: "#fff" },
  btn: { width: "100%", padding: "14px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
  deleteBtn: { marginTop: "8px", padding: "6px 14px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #000", borderRadius: "8px", cursor: "pointer", fontSize: "12px" },
  empty: { textAlign: "center", padding: "40px", color: "#666" },
};