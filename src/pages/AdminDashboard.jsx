import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

// أيقونة دائرية مفرغة للقائمة (تستخدم فقط في سطح المكتب)
const OutlineIcon = ({ active = false }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      border: "2px solid #000",
      backgroundColor: active ? "#000" : "transparent",
      marginLeft: "8px",
    }}
  >
    {active && <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#fff" }} />}
  </span>
);

export default function AdminDashboard() {
  const [otps, setOtps] = useState([]);
  const [users, setUsers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rules, setRules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [chartRange, setChartRange] = useState("week");
  const [newPlace, setNewPlace] = useState({ name: "", type: "restaurant", cashier_code: "", discount_amount: "", commission: "10" });
  const [newRule, setNewRule] = useState({ rule_type: "inactive", days_inactive: "", min_visits: "", message: "" });
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedPlace, setSelectedPlace] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => { checkAdmin(); loadData(); }, []);

  async function checkAdmin() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) navigate("/admin");
  }

  async function loadData() {
    const [o, u, p, or, r, n] = await Promise.all([
      supabase.from("otps").select("*").eq("used", false).order("created_at", { ascending: false }),
      supabase.from("users").select("*").order("created_at", { ascending: false }),
      supabase.from("places").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*, users(name, phone), places(name, type)").order("created_at", { ascending: false }),
      supabase.from("smart_rules").select("*").order("created_at", { ascending: false }),
      supabase.from("notifications").select("*, users(name, phone)").eq("sent", false).order("created_at", { ascending: false }),
    ]);
    setOtps(o.data || []);
    setUsers(u.data || []);
    setPlaces(p.data || []);
    setOrders(or.data || []);
    setRules(r.data || []);
    setNotifications(n.data || []);
  }

  async function runSmartRules() {
    await supabase.rpc("check_smart_rules");
    loadData();
    alert("تم تشغيل Smart Rules");
  }

  async function markNotificationSent(id) {
    await supabase.from("notifications").update({ sent: true }).eq("id", id);
    loadData();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin");
  }

  async function handleAddPlace() {
    if (!newPlace.name || !newPlace.cashier_code || !newPlace.discount_amount) { alert("ادخل كل البيانات"); return; }
    const { error } = await supabase.from("places").insert({
      ...newPlace,
      discount_amount: Number(newPlace.discount_amount),
      commission: Number(newPlace.commission),
    });
    if (error) { alert("حصل خطأ: " + error.message); return; }
    setNewPlace({ name: "", type: "restaurant", cashier_code: "", discount_amount: "", commission: "10" });
    loadData();
  }

  async function handleDeletePlace(id) {
    if (!window.confirm("متأكد؟")) return;
    await supabase.from("places").delete().eq("id", id);
    loadData();
  }

  async function handleAddRule() {
    if (!newRule.message) { alert("ادخل الرسالة"); return; }
    await supabase.from("smart_rules").insert({
      ...newRule,
      days_inactive: Number(newRule.days_inactive) || null,
      min_visits: Number(newRule.min_visits) || null,
    });
    setNewRule({ rule_type: "inactive", days_inactive: "", min_visits: "", message: "" });
    loadData();
  }

  async function handleToggleRule(id, active) {
    await supabase.from("smart_rules").update({ active: !active }).eq("id", id);
    loadData();
  }

  async function handleDeleteRule(id) {
    if (!window.confirm("متأكد؟")) return;
    await supabase.from("smart_rules").delete().eq("id", id);
    loadData();
  }

  async function sendDiscount() {
    if (!selectedUser || !selectedPlace) { alert("اختار مستخدم ومكان"); return; }
    const place = places.find(p => p.id === selectedPlace);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await supabase.from("discount_codes").insert({
      user_id: selectedUser,
      code,
      place: place.name,
      place_id: selectedPlace,
    });
    alert("كود الخصم: " + code);
    setSelectedUser(""); setSelectedPlace("");
  }

  function getTypeLabel(type) {
    if (type === "restaurant") return "مطعم";
    if (type === "gym") return "جيم";
    if (type === "beach") return "شاطئ";
    if (type === "court") return "ملعب";
    return type;
  }

  function getChartData(placeOrders) {
    const now = new Date();
    let days = [];

    if (chartRange === "week") {
      days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });
    } else if (chartRange === "month") {
      days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split("T")[0];
      });
    } else if (chartRange === "all") {
      if (placeOrders.length === 0) return [];
      const firstDate = new Date(placeOrders[placeOrders.length - 1].created_at);
      const diffDays = Math.ceil((now - firstDate) / (1000 * 60 * 60 * 24));
      days = Array.from({ length: diffDays + 1 }, (_, i) => {
        const d = new Date(firstDate);
        d.setDate(d.getDate() + i);
        return d.toISOString().split("T")[0];
      });
    }

    return days.map(day => ({
      day: chartRange === "all" && days.length > 30 ? day.slice(5) : day.slice(5),
      fullDate: day,
      count: placeOrders.filter(o => o.created_at?.startsWith(day)).length,
    }));
  }

  function getPlaceAnalytics(placeId) {
    const placeOrders = orders.filter(o => o.place_id === placeId);
    const uniqueUserIds = [...new Set(placeOrders.map(o => o.user_id))];
    const itemCounts = placeOrders.reduce((acc, o) => {
      if (o.item) acc[o.item] = (acc[o.item] || 0) + 1;
      return acc;
    }, {});
    const sortedItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);
    const chartData = getChartData(placeOrders);
    const totalRevenue = placeOrders.length * (places.find(p => p.id === placeId)?.commission || 10);

    const hourCounts = placeOrders.reduce((acc, o) => {
      const hour = new Date(o.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    const returningUsers = uniqueUserIds.filter(uid =>
      placeOrders.filter(o => o.user_id === uid).length > 1
    ).length;

    return { placeOrders, uniqueUserIds, sortedItems, chartData, totalRevenue, peakHour, returningUsers };
  }

  const totalRevenue = orders.reduce((sum, o) => {
    const place = places.find(p => p.id === o.place_id);
    return sum + (place?.commission || 10);
  }, 0);
  const totalSaved = orders.reduce((sum, o) => sum + (o.discount || 0), 0);

  // تعريف التبويبات
  const tabs = [
    { key: "overview", label: "نظرة عامة" },
    { key: "analytics", label: "تحليلات" },
    { key: "notifications", label: `إشعارات (${notifications.length})` },
    { key: "otps", label: `OTPs (${otps.length})` },
    { key: "users", label: `المستخدمين (${users.length})` },
    { key: "orders", label: `الطلبات (${orders.length})` },
    { key: "places", label: `الأماكن (${places.length})` },
    { key: "rules", label: `Smart Rules (${rules.length})` },
    { key: "discount", label: "خصم" },
  ];

  const selectedPlaceAnalytics = selectedPlaceId ? getPlaceAnalytics(selectedPlaceId) : null;
  const maxCount = selectedPlaceAnalytics ? Math.max(...selectedPlaceAnalytics.chartData.map(d => d.count), 1) : 1;

  // تنسيق محتوى كل تبويب (نفس السابق لكن مختصر هنا للطول، وسيتم وضعه كاملاً)
  // نظراً لطول الكود، سأعيد استخدام نفس التبويبات ولكن سأضعها داخل متغير ثم أعرضها.
  // ولكن في الكود النهائي سأكتب كل التبويبات كاملة.

  // لتجنب التكرار، سأقوم بكتابة باقي الكود مع الحفاظ على الوظائف كما هي.

  // عرض التبويب حسب activeTab
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div>
            <div style={s.statsGrid}>
              <div style={s.statCard}><p style={s.statN}>{users.length}</p><p style={s.statL}>مستخدم</p></div>
              <div style={s.statCard}><p style={s.statN}>{orders.length}</p><p style={s.statL}>طلب</p></div>
              <div style={s.statCard}><p style={s.statN}>{totalRevenue}</p><p style={s.statL}>جنيه مكسب</p></div>
              <div style={s.statCard}><p style={s.statN}>{totalSaved}</p><p style={s.statL}>جنيه وُفِّر</p></div>
            </div>
            <h2 style={s.sectionTitle}>أداء كل مكان</h2>
            {places.map(place => {
              const placeOrders = orders.filter(o => o.place_id === place.id);
              const uniqueUsers = [...new Set(placeOrders.map(o => o.user_id))].length;
              const revenue = placeOrders.length * (place.commission || 10);
              const returningUsers = [...new Set(placeOrders.map(o => o.user_id))].filter(uid =>
                placeOrders.filter(o => o.user_id === uid).length > 1
              ).length;
              return (
                <div key={place.id} style={s.card}>
                  <div style={s.cardRow}>
                    <span style={s.cardMain}>{place.name}</span>
                    <span style={s.typeBadge}>{getTypeLabel(place.type)}</span>
                  </div>
                  <div style={s.statsRow}>
                    <div style={s.miniStat}><p style={s.miniN}>{uniqueUsers}</p><p style={s.miniL}>عميل</p></div>
                    <div style={s.miniStat}><p style={s.miniN}>{placeOrders.length}</p><p style={s.miniL}>طلب</p></div>
                    <div style={s.miniStat}><p style={s.miniN}>{revenue}</p><p style={s.miniL}>جنيه مكسب</p></div>
                    <div style={s.miniStat}><p style={s.miniN}>{returningUsers}</p><p style={s.miniL}>رجع تاني</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      case "analytics":
        return (
          <div>
            <div style={s.placeSelector}>
              {places.map(place => (
                <button key={place.id} style={selectedPlaceId === place.id ? s.activeTab : s.tab} onClick={() => setSelectedPlaceId(place.id)}>
                  {place.name}
                </button>
              ))}
            </div>
            {!selectedPlaceId && <p style={s.empty}>اختار مكان من فوق</p>}
            {selectedPlaceId && selectedPlaceAnalytics && (() => {
              const place = places.find(p => p.id === selectedPlaceId);
              const { placeOrders, uniqueUserIds, sortedItems, chartData, totalRevenue, peakHour, returningUsers } = selectedPlaceAnalytics;
              return (
                <div>
                  <div style={s.analyticsHeader}>
                    <h2 style={s.sectionTitle}>{place.name}</h2>
                    <span style={s.typeBadge}>{getTypeLabel(place.type)}</span>
                  </div>
                  <div style={s.statsGrid}>
                    <div style={s.statCard}><p style={s.statN}>{uniqueUserIds.length}</p><p style={s.statL}>عميل</p></div>
                    <div style={s.statCard}><p style={s.statN}>{placeOrders.length}</p><p style={s.statL}>طلب</p></div>
                    <div style={s.statCard}><p style={s.statN}>{returningUsers}</p><p style={s.statL}>رجع تاني</p></div>
                    <div style={s.statCard}><p style={s.statN}>{totalRevenue}</p><p style={s.statL}>جنيه مكسب</p></div>
                  </div>
                  {peakHour && (
                    <div style={s.insightCard}>
                      <p style={s.insightTitle}>💡 ذكاء السيستم</p>
                      <p style={s.insightText}>وقت الذروة: الساعة {peakHour[0]}:00 ({peakHour[1]} طلب)</p>
                      {returningUsers > 0 && <p style={s.insightText}>معدل الرجوع: {((returningUsers / uniqueUserIds.length) * 100).toFixed(0)}%</p>}
                      {sortedItems[0] && <p style={s.insightText}>الأكتر طلباً: {sortedItems[0][0]} ({sortedItems[0][1]} مرة)</p>}
                    </div>
                  )}
                  <div style={s.chartCard}>
                    <div style={s.chartHeader}>
                      <p style={s.subTitle}>الطلبات عبر الوقت</p>
                      <div style={s.rangeButtons}>
                        {[{ key: "week", label: "أسبوع" }, { key: "month", label: "شهر" }, { key: "all", label: "الكل" }].map(r => (
                          <button key={r.key} style={chartRange === r.key ? s.activeRange : s.range} onClick={() => setChartRange(r.key)}>{r.label}</button>
                        ))}
                      </div>
                    </div>
                    {chartData.length === 0 ? (
                      <p style={s.empty}>مفيش بيانات</p>
                    ) : (
                      <div style={s.chartWrapper}>
                        <div style={s.chart}>
                          {chartData.map((d, i) => (
                            <div key={i} style={s.chartCol} title={`${d.fullDate}: ${d.count} طلب`}>
                              <div style={s.barWrapper}>
                                <div style={{ ...s.bar, height: `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 5 : 0)}%` }}>
                                  {d.count > 0 && chartData.length <= 30 && <span style={s.barLabel}>{d.count}</span>}
                                </div>
                              </div>
                              {chartData.length <= 30 && <p style={s.chartDay}>{d.day}</p>}
                            </div>
                          ))}
                        </div>
                        {chartData.length > 30 && (
                          <div style={s.chartFooter}>
                            <span style={s.chartFooterText}>{chartData[0]?.fullDate}</span>
                            <span style={s.chartFooterText}>{chartData[chartData.length - 1]?.fullDate}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {sortedItems.length > 0 && (
                    <div style={s.card}>
                      <p style={s.subTitle}>الطلبات الأكتر تكراراً</p>
                      {sortedItems.slice(0, 5).map(([item, count]) => (
                        <div key={item} style={s.itemRow}>
                          <span style={s.itemName}>{item}</span>
                          <div style={s.itemRight}>
                            <div style={{ ...s.itemBar, width: `${(count / sortedItems[0][1]) * 100}%` }} />
                            <span style={s.itemCount}>{count} مرة</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={s.card}>
                    <p style={s.subTitle}>العملاء ({uniqueUserIds.length})</p>
                    {uniqueUserIds.map(userId => {
                      const user = users.find(u => u.id === userId);
                      const userOrders = placeOrders.filter(o => o.user_id === userId);
                      const lastVisit = userOrders[0]?.created_at;
                      const userItems = userOrders.map(o => o.item).filter(Boolean);
                      const mostFrequent = userItems.sort((a, b) =>
                        userItems.filter(v => v === b).length - userItems.filter(v => v === a).length
                      )[0];
                      const daysSinceLastVisit = lastVisit ? Math.floor((new Date() - new Date(lastVisit)) / (1000 * 60 * 60 * 24)) : null;
                      return user ? (
                        <div key={userId} style={s.userRow}>
                          <div>
                            <p style={s.userName}>{user.name}</p>
                            <p style={s.userPhone}>{user.phone}</p>
                            {mostFrequent && <p style={s.userFav}>⭐ {mostFrequent}</p>}
                          </div>
                          <div style={{ textAlign: "left" }}>
                            <p style={s.userVisits}>{userOrders.length} زيارة</p>
                            {daysSinceLastVisit !== null && (
                              <p style={{ ...s.userDate, color: daysSinceLastVisit > 7 ? "#ff4444" : "#999" }}>
                                {daysSinceLastVisit === 0 ? "النهارده" : `${daysSinceLastVisit} يوم`}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      case "notifications":
        return (
          <div>
            <div style={s.ruleActions}>
              <button style={s.btn} onClick={runSmartRules}>تشغيل Smart Rules دلوقتي</button>
            </div>
            {notifications.length === 0 ? (
              <p style={s.empty}>مفيش إشعارات دلوقتي</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={s.card}>
                  <div style={s.cardRow}>
                    <span style={s.cardMain}>{n.users?.name}</span>
                    <span style={s.cardSub}>{n.users?.phone}</span>
                  </div>
                  <p style={s.notifMessage}>{n.message}</p>
                  <p style={s.cardDate}>{new Date(n.created_at).toLocaleDateString("ar-EG")}</p>
                  <button style={s.sentBtn} onClick={() => markNotificationSent(n.id)}>✓ تم الإرسال على واتساب</button>
                </div>
              ))
            )}
          </div>
        );
      case "otps":
        return (
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
        );
      case "users":
        return (
          <div>
            {users.length === 0 ? <p style={s.empty}>مفيش مستخدمين</p> : users.map(u => (
              <div key={u.id} style={s.card}>
                <div style={s.cardRow}>
                  <span style={s.cardMain}>{u.name}</span>
                  <span style={s.cardSub}>{u.phone}</span>
                </div>
                <div style={s.cardRow}>
                  <span style={s.cardDate}>{new Date(u.created_at).toLocaleDateString("ar-EG")}</span>
                  <span style={s.cardSub}>طلبات: {orders.filter(o => o.user_id === u.id).length}</span>
                </div>
              </div>
            ))}
          </div>
        );
      case "orders":
        return (
          <div>
            {orders.length === 0 ? <p style={s.empty}>مفيش طلبات</p> : orders.map(o => (
              <div key={o.id} style={s.card}>
                <div style={s.cardRow}>
                  <span style={s.cardMain}>{o.users?.name}</span>
                  <span style={s.savedBadge}>وفّر {o.discount} جنيه</span>
                </div>
                <div style={s.cardRow}>
                  <span style={s.cardSub}>{o.places?.name}</span>
                  <span style={s.cardSub}>{o.item}</span>
                </div>
                <div style={s.cardRow}>
                  <span style={s.cardDate}>{new Date(o.created_at).toLocaleDateString("ar-EG")}</span>
                  <span style={s.cardSub}>{o.price} جنيه</span>
                </div>
              </div>
            ))}
          </div>
        );
      case "places":
        return (
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
              <input style={s.input} placeholder="كوميشن الشركة (افتراضي 10 جنيه)" value={newPlace.commission} onChange={e => setNewPlace({ ...newPlace, commission: e.target.value })} />
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
                <span style={s.cardSub}>كوميشن: {p.commission} جنيه</span>
                <button style={s.deleteBtn} onClick={() => handleDeletePlace(p.id)}>حذف</button>
              </div>
            ))}
          </div>
        );
      case "rules":
        return (
          <div>
            <div style={s.addCard}>
              <h2 style={s.sectionTitle}>إضافة Smart Rule</h2>
              <select style={s.input} value={newRule.rule_type} onChange={e => setNewRule({ ...newRule, rule_type: e.target.value })}>
                <option value="inactive">مستخدم مش رجع</option>
                <option value="frequent">مستخدم بيرجع كتير</option>
              </select>
              {newRule.rule_type === "inactive" && (
                <input style={s.input} placeholder="بعد كام يوم من غير استخدام" value={newRule.days_inactive} onChange={e => setNewRule({ ...newRule, days_inactive: e.target.value })} />
              )}
              {newRule.rule_type === "frequent" && (
                <input style={s.input} placeholder="بعد كام زيارة" value={newRule.min_visits} onChange={e => setNewRule({ ...newRule, min_visits: e.target.value })} />
              )}
              <input style={s.input} placeholder="الرسالة اللي هتتبعت للمستخدم" value={newRule.message} onChange={e => setNewRule({ ...newRule, message: e.target.value })} />
              <button style={s.btn} onClick={handleAddRule}>إضافة Rule</button>
            </div>
            {rules.length === 0 ? <p style={s.empty}>مفيش rules دلوقتي</p> : rules.map(r => (
              <div key={r.id} style={s.card}>
                <div style={s.cardRow}>
                  <span style={s.cardMain}>{r.rule_type === "inactive" ? "مستخدم مش رجع" : "مستخدم بيرجع كتير"}</span>
                  <span style={r.active ? s.activeBadge : s.inactiveBadge}>{r.active ? "شغال" : "موقف"}</span>
                </div>
                <p style={s.cardSub}>{r.message}</p>
                {r.days_inactive && <p style={s.cardDate}>بعد {r.days_inactive} يوم</p>}
                {r.min_visits && <p style={s.cardDate}>بعد {r.min_visits} زيارة</p>}
                <div style={s.cardRow}>
                  <button style={s.toggleBtn} onClick={() => handleToggleRule(r.id, r.active)}>{r.active ? "إيقاف" : "تشغيل"}</button>
                  <button style={s.deleteBtn} onClick={() => handleDeleteRule(r.id)}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        );
      case "discount":
        return (
          <div style={s.addCard}>
            <h2 style={s.sectionTitle}>إرسال كود خصم</h2>
            <label style={s.label}>اختار المستخدم</label>
            <select style={s.input} value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
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
        );
      default:
        return null;
    }
  };

  return (
    <div style={s.page}>
      {/* القائمة الجانبية (تظهر فقط في سطح المكتب) */}
      {!isMobile && (
        <div style={s.sidebarDesktop}>
          <div style={s.sidebarContent}>
            <div style={s.sidebarHeader}>
              <h2 style={s.sidebarLogo}>Nudge</h2>
            </div>
            {tabs.map(tab => (
              <button
                key={tab.key}
                style={activeTab === tab.key ? s.sidebarItemActive : s.sidebarItem}
                onClick={() => setActiveTab(tab.key)}
              >
                <OutlineIcon active={activeTab === tab.key} />
                {tab.label}
              </button>
            ))}
            <div style={s.sidebarFooter}>
              <button style={s.sidebarLogout} onClick={handleLogout}>خروج</button>
            </div>
          </div>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <div style={!isMobile ? s.mainDesktop : s.mainMobile}>
        <div style={s.topBar}>
          {!isMobile && <h1 style={s.topBarTitle}>لوحة التحكم</h1>}
          <button style={s.topBarRefresh} onClick={loadData}>⟳ تحديث</button>
        </div>

        <div style={s.content}>
          {renderTabContent()}
        </div>
      </div>

      {/* شريط سفلي للموبايل فقط */}
      {isMobile && (
        <div style={s.bottomNav}>
          {tabs.slice(0, 5).map(tab => (
            <button
              key={tab.key}
              style={activeTab === tab.key ? s.bottomNavItemActive : s.bottomNavItem}
              onClick={() => setActiveTab(tab.key)}
            >
              <span style={s.bottomNavLabel}>{tab.label}</span>
            </button>
          ))}
          <button
            style={s.bottomNavItem}
            onClick={() => {
              // عرض باقي التبويبات في قائمة منبثقة بسيطة
              const otherTabs = tabs.slice(5);
              const choice = window.prompt("اختر القسم:\n" + otherTabs.map((t, i) => `${i+1}. ${t.label}`).join("\n"));
              if (choice) {
                const index = parseInt(choice) - 1;
                if (otherTabs[index]) setActiveTab(otherTabs[index].key);
              }
            }}
          >
            <span style={s.bottomNavLabel}>المزيد</span>
          </button>
        </div>
      )}
    </div>
  );
}

// الأنماط المتجاوبة بالكامل
const s = {
  page: { minHeight: "100vh", backgroundColor: "#f5f5f5", display: "flex", direction: "rtl" },

  // Sidebar desktop
  sidebarDesktop: { position: "fixed", top: 0, right: 0, width: "260px", height: "100vh", zIndex: 100, borderLeft: "1px solid #e0e0e0", backgroundColor: "#fff", boxShadow: "-2px 0 8px rgba(0,0,0,0.05)" },
  sidebarContent: { display: "flex", flexDirection: "column", height: "100%" },
  sidebarHeader: { padding: "20px", borderBottom: "1px solid #eee" },
  sidebarLogo: { fontSize: "22px", fontWeight: "900", color: "#000", margin: 0, textAlign: "center" },
  sidebarItem: { display: "flex", alignItems: "center", justifyContent: "flex-start", width: "100%", padding: "12px 20px", backgroundColor: "transparent", border: "none", fontSize: "14px", fontWeight: "600", color: "#000", cursor: "pointer", textAlign: "right", transition: "0.2s" },
  sidebarItemActive: { display: "flex", alignItems: "center", justifyContent: "flex-start", width: "100%", padding: "12px 20px", backgroundColor: "#000", border: "none", fontSize: "14px", fontWeight: "600", color: "#fff", cursor: "pointer", textAlign: "right", transition: "0.2s" },
  sidebarFooter: { marginTop: "auto", padding: "20px", borderTop: "1px solid #eee" },
  sidebarLogout: { width: "100%", padding: "10px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #000", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },

  mainDesktop: { flex: 1, marginRight: "260px", width: "calc(100% - 260px)" },
  mainMobile: { flex: 1, width: "100%", marginBottom: "70px" }, // مساحة للشريط السفلي

  topBar: { backgroundColor: "#fff", padding: "12px 16px", display: "flex", justifyContent: "flex-end", alignItems: "center", borderBottom: "1px solid #e0e0e0", position: "sticky", top: 0, zIndex: 99 },
  topBarTitle: { fontSize: "20px", fontWeight: "700", color: "#000", margin: "0 auto 0 0" },
  topBarRefresh: { padding: "6px 12px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #000", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },

  content: { padding: "16px", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box", paddingBottom: isMobile => isMobile ? "80px" : "16px" },

  // شريط سفلي للموبايل
  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTop: "1px solid #e0e0e0", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 0", zIndex: 100, direction: "ltr" },
  bottomNavItem: { flex: 1, background: "none", border: "none", padding: "8px 4px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#666", cursor: "pointer", transition: "0.2s" },
  bottomNavItemActive: { flex: 1, background: "none", border: "none", padding: "8px 4px", textAlign: "center", fontSize: "12px", fontWeight: "700", color: "#000", borderTop: "2px solid #000", cursor: "pointer" },
  bottomNavLabel: { display: "block", fontSize: "11px" },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" },
  statCard: { backgroundColor: "#000", color: "#fff", borderRadius: "12px", padding: "16px", textAlign: "center" },
  statN: { fontSize: "24px", fontWeight: "900", marginBottom: "4px" },
  statL: { fontSize: "11px", opacity: 0.7 },
  statsRow: { display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" },
  miniStat: { flex: "1 1 70px", backgroundColor: "#f5f5f5", borderRadius: "8px", padding: "8px", textAlign: "center" },
  miniN: { fontSize: "16px", fontWeight: "900", color: "#000" },
  miniL: { fontSize: "10px", color: "#666" },
  card: { backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "14px", marginBottom: "12px" },
  cardRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "8px" },
  cardMain: { fontSize: "15px", fontWeight: "700", color: "#000" },
  cardSub: { fontSize: "12px", color: "#666" },
  cardDate: { fontSize: "10px", color: "#999" },
  otpCode: { fontSize: "20px", fontWeight: "900", letterSpacing: "4px", color: "#000", wordBreak: "break-all" },
  savedBadge: { backgroundColor: "#000", color: "#fff", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" },
  typeBadge: { backgroundColor: "#f0f0f0", color: "#000", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" },
  activeBadge: { backgroundColor: "#000", color: "#fff", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" },
  inactiveBadge: { backgroundColor: "#f0f0f0", color: "#666", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" },
  addCard: { backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "20px", marginBottom: "16px" },
  sectionTitle: { fontSize: "16px", fontWeight: "700", color: "#000", marginBottom: "16px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#000", marginBottom: "6px", display: "block" },
  input: { width: "100%", padding: "12px 14px", border: "1.5px solid #000", borderRadius: "10px", fontSize: "14px", marginBottom: "12px", outline: "none", textAlign: "right", boxSizing: "border-box", backgroundColor: "#fff" },
  btn: { width: "100%", padding: "14px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
  deleteBtn: { padding: "6px 14px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #000", borderRadius: "8px", cursor: "pointer", fontSize: "12px", marginTop: "8px" },
  toggleBtn: { padding: "6px 14px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px" },
  empty: { textAlign: "center", padding: "40px", color: "#666" },
  placeSelector: { display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" },
  analyticsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" },
  insightCard: { backgroundColor: "#000", color: "#fff", borderRadius: "12px", padding: "14px", marginBottom: "12px" },
  insightTitle: { fontSize: "14px", fontWeight: "700", marginBottom: "8px" },
  insightText: { fontSize: "12px", opacity: 0.8, marginBottom: "4px" },
  chartCard: { backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "16px", marginBottom: "12px", overflowX: "auto" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" },
  rangeButtons: { display: "flex", gap: "6px", flexWrap: "wrap" },
  range: { padding: "4px 10px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #000", borderRadius: "6px", cursor: "pointer", fontSize: "11px" },
  activeRange: { padding: "4px 10px", backgroundColor: "#000", color: "#fff", border: "1.5px solid #000", borderRadius: "6px", cursor: "pointer", fontSize: "11px" },
  chartWrapper: { width: "100%", overflowX: "auto" },
  chart: { display: "flex", alignItems: "flex-end", gap: "4px", height: "120px", minWidth: "280px" },
  chartCol: { flex: "0 0 auto", minWidth: "18px", display: "flex", flexDirection: "column", alignItems: "center", height: "100%", cursor: "pointer" },
  barWrapper: { flex: 1, display: "flex", alignItems: "flex-end", width: "100%" },
  bar: { width: "100%", backgroundColor: "#000", borderRadius: "4px 4px 0 0", minHeight: "2px", display: "flex", alignItems: "flex-start", justifyContent: "center", transition: "height 0.3s" },
  barLabel: { fontSize: "8px", color: "#fff", marginTop: "2px" },
  chartDay: { fontSize: "8px", color: "#666", marginTop: "2px" },
  chartFooter: { display: "flex", justifyContent: "space-between", marginTop: "4px" },
  chartFooterText: { fontSize: "10px", color: "#999" },
  subTitle: { fontSize: "13px", fontWeight: "700", color: "#000", marginBottom: "12px" },
  itemRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f5f5f5", flexWrap: "wrap", gap: "8px" },
  itemName: { fontSize: "13px", color: "#000", flex: 1 },
  itemRight: { display: "flex", alignItems: "center", gap: "8px" },
  itemBar: { height: "6px", backgroundColor: "#000", borderRadius: "3px", maxWidth: "80px" },
  itemCount: { fontSize: "12px", fontWeight: "700", color: "#000", minWidth: "45px", textAlign: "left" },
  userRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f5f5f5", flexWrap: "wrap", gap: "12px" },
  userName: { fontSize: "14px", fontWeight: "700", color: "#000" },
  userPhone: { fontSize: "12px", color: "#666" },
  userFav: { fontSize: "11px", color: "#999", marginTop: "2px" },
  userVisits: { fontSize: "13px", fontWeight: "700", color: "#000" },
  userDate: { fontSize: "11px", color: "#999" },
  notifMessage: { fontSize: "14px", color: "#000", margin: "8px 0", fontWeight: "600" },
  sentBtn: { marginTop: "8px", padding: "8px 16px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  ruleActions: { marginBottom: "16px" },
  tab: { padding: "8px 12px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #000", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  activeTab: { padding: "8px 12px", backgroundColor: "#000", color: "#fff", border: "1.5px solid #000", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
};