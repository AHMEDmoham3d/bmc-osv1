import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

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
  const navigate = useNavigate();

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

    // أوقات الذروة
    const hourCounts = placeOrders.reduce((acc, o) => {
      const hour = new Date(o.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    // معدل الرجوع
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

  const tabs = [
    { key: "overview", label: "نظرة عامة" },
    { key: "analytics", label: "تحليلات" },
    { key: "notifications", label: `إشعارات (${notifications.length})` },
    { key: "otps", label: `OTPs (${otps.length})` },
    { key: "users", label: `المستخدمين (${users.length})` },
    { key: "orders", label: `الطلبات (${orders.length})` },
    { key: "places", label: `الأماكن (${places.length})` },
    { key: "rules", label: `Smart Rules (${rules.length})` },
    { key: "discount", label: "إرسال خصم" },
  ];

  const selectedPlaceAnalytics = selectedPlaceId ? getPlaceAnalytics(selectedPlaceId) : null;
  const maxCount = selectedPlaceAnalytics ? Math.max(...selectedPlaceAnalytics.chartData.map(d => d.count), 1) : 1;

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.logo}>Nudge — أدمن</h1>
          <div style={s.headerRight}>
            <button style={s.refreshBtn} onClick={loadData}>تحديث</button>
            <button style={s.logoutBtn} onClick={handleLogout}>خروج</button>
          </div>
        </div>

        <div style={s.tabs}>
          {tabs.map(t => (
            <button key={t.key} style={activeTab === t.key ? s.activeTab : s.tab} onClick={() => setActiveTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {activeTab === "overview" && (
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
        )}

        {activeTab === "analytics" && (
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
        )}

        {activeTab === "notifications" && (
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
        )}

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
                <div style={s.cardRow}>
                  <span style={s.cardDate}>{new Date(u.created_at).toLocaleDateString("ar-EG")}</span>
                  <span style={s.cardSub}>طلبات: {orders.filter(o => o.user_id === u.id).length}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "orders" && (
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
        )}

        {activeTab === "rules" && (
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
        )}

        {activeTab === "discount" && (
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
  tabs: { display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" },
  tab: { padding: "10px 14px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #000", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  activeTab: { padding: "10px 14px", backgroundColor: "#000", color: "#fff", border: "1.5px solid #000", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" },
  statCard: { backgroundColor: "#000", color: "#fff", borderRadius: "12px", padding: "20px", textAlign: "center" },
  statN: { fontSize: "28px", fontWeight: "900", marginBottom: "4px" },
  statL: { fontSize: "12px", opacity: 0.7 },
  statsRow: { display: "flex", gap: "8px", marginTop: "12px" },
  miniStat: { flex: 1, backgroundColor: "#f5f5f5", borderRadius: "8px", padding: "10px", textAlign: "center" },
  miniN: { fontSize: "18px", fontWeight: "900", color: "#000" },
  miniL: { fontSize: "11px", color: "#666" },
  card: { backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "16px", marginBottom: "10px" },
  cardRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  cardMain: { fontSize: "15px", fontWeight: "700", color: "#000" },
  cardSub: { fontSize: "13px", color: "#666" },
  cardDate: { fontSize: "11px", color: "#999" },
  otpCode: { fontSize: "24px", fontWeight: "900", letterSpacing: "8px", color: "#000" },
  savedBadge: { backgroundColor: "#000", color: "#fff", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  typeBadge: { backgroundColor: "#f0f0f0", color: "#000", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  activeBadge: { backgroundColor: "#000", color: "#fff", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  inactiveBadge: { backgroundColor: "#f0f0f0", color: "#666", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  addCard: { backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "24px", marginBottom: "16px" },
  sectionTitle: { fontSize: "16px", fontWeight: "700", color: "#000", marginBottom: "16px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#000", marginBottom: "6px", display: "block" },
  input: { width: "100%", padding: "12px 16px", border: "1.5px solid #000", borderRadius: "10px", fontSize: "14px", marginBottom: "12px", outline: "none", textAlign: "right", boxSizing: "border-box", backgroundColor: "#fff" },
  btn: { width: "100%", padding: "14px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
  deleteBtn: { padding: "6px 14px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #000", borderRadius: "8px", cursor: "pointer", fontSize: "12px", marginTop: "8px" },
  toggleBtn: { padding: "6px 14px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px" },
  empty: { textAlign: "center", padding: "40px", color: "#666" },
  placeSelector: { display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" },
  analyticsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  insightCard: { backgroundColor: "#000", color: "#fff", borderRadius: "12px", padding: "16px", marginBottom: "12px" },
  insightTitle: { fontSize: "14px", fontWeight: "700", marginBottom: "8px" },
  insightText: { fontSize: "13px", opacity: 0.8, marginBottom: "4px" },
  chartCard: { backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "20px", marginBottom: "12px" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  rangeButtons: { display: "flex", gap: "6px" },
  range: { padding: "4px 12px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #000", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  activeRange: { padding: "4px 12px", backgroundColor: "#000", color: "#fff", border: "1.5px solid #000", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  chartWrapper: { width: "100%", overflowX: "auto" },
  chart: { display: "flex", alignItems: "flex-end", gap: "4px", height: "120px", minWidth: "100%" },
  chartCol: { flex: "0 0 auto", minWidth: "20px", display: "flex", flexDirection: "column", alignItems: "center", height: "100%", cursor: "pointer" },
  barWrapper: { flex: 1, display: "flex", alignItems: "flex-end", width: "100%" },
  bar: { width: "100%", backgroundColor: "#000", borderRadius: "4px 4px 0 0", minHeight: "2px", display: "flex", alignItems: "flex-start", justifyContent: "center", transition: "height 0.3s" },
  barLabel: { fontSize: "9px", color: "#fff", marginTop: "2px" },
  chartDay: { fontSize: "9px", color: "#666", marginTop: "2px" },
  chartFooter: { display: "flex", justifyContent: "space-between", marginTop: "4px" },
  chartFooterText: { fontSize: "11px", color: "#999" },
  subTitle: { fontSize: "13px", fontWeight: "700", color: "#000", marginBottom: "12px" },
  itemRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f5f5f5" },
  itemName: { fontSize: "13px", color: "#000", flex: 1 },
  itemRight: { display: "flex", alignItems: "center", gap: "8px" },
  itemBar: { height: "6px", backgroundColor: "#000", borderRadius: "3px", maxWidth: "80px" },
  itemCount: { fontSize: "12px", fontWeight: "700", color: "#000", minWidth: "50px", textAlign: "left" },
  userRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f5f5f5" },
  userName: { fontSize: "14px", fontWeight: "700", color: "#000" },
  userPhone: { fontSize: "12px", color: "#666" },
  userFav: { fontSize: "11px", color: "#999", marginTop: "2px" },
  userVisits: { fontSize: "13px", fontWeight: "700", color: "#000" },
  userDate: { fontSize: "11px", color: "#999" },
  notifMessage: { fontSize: "14px", color: "#000", margin: "8px 0", fontWeight: "600" },
  sentBtn: { marginTop: "8px", padding: "8px 16px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  ruleActions: { marginBottom: "16px" },
};