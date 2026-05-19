import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

// Hollow circle icon (white inside, black border)
const OutlineIcon = ({ active = false }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "22px",
      height: "22px",
      borderRadius: "50%",
      border: "2px solid currentColor",
      backgroundColor: active ? "currentColor" : "transparent",
      marginRight: "12px",
      transition: "all 0.2s ease",
      flexShrink: 0,
    }}
  >
    {active && (
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: "#fff",
        }}
      />
    )}
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    const newNotifications = [];
    for (const rule of rules.filter(r => r.active)) {
      for (const user of users) {
        const userOrders = orders.filter(o => o.user_id === user.id);
        if (rule.rule_type === "inactive" && rule.days_inactive) {
          const lastOrder = userOrders[0];
          if (!lastOrder) continue;
          const daysSince = Math.floor((new Date() - new Date(lastOrder.created_at)) / (1000 * 60 * 60 * 24));
          if (daysSince >= rule.days_inactive) {
            const exists = notifications.find(n => n.user_id === user.id && n.rule_id === rule.id);
            if (!exists) newNotifications.push({ user_id: user.id, rule_id: rule.id, message: rule.message });
          }
        }
        if (rule.rule_type === "frequent" && rule.min_visits) {
          if (userOrders.length >= rule.min_visits) {
            const exists = notifications.find(n => n.user_id === user.id && n.rule_id === rule.id);
            if (!exists) newNotifications.push({ user_id: user.id, rule_id: rule.id, message: rule.message });
          }
        }
      }
    }
    if (newNotifications.length > 0) {
      await supabase.from("notifications").upsert(newNotifications, { onConflict: "user_id,rule_id" });
      alert(`Created ${newNotifications.length} new notifications`);
    } else {
      alert("No new notifications right now");
    }
    loadData();
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
    if (!newPlace.name || !newPlace.cashier_code || !newPlace.discount_amount) { alert("Please enter all data"); return; }
    const { error } = await supabase.from("places").insert({
      ...newPlace,
      discount_amount: Number(newPlace.discount_amount),
      commission: Number(newPlace.commission),
    });
    if (error) { alert("Error: " + error.message); return; }
    setNewPlace({ name: "", type: "restaurant", cashier_code: "", discount_amount: "", commission: "10" });
    loadData();
  }

  async function handleDeletePlace(id) {
    if (!window.confirm("Are you sure?")) return;
    await supabase.from("places").delete().eq("id", id);
    loadData();
  }

  async function handleAddRule() {
    if (!newRule.message) { alert("Please enter the message"); return; }
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
    if (!window.confirm("Are you sure?")) return;
    await supabase.from("smart_rules").delete().eq("id", id);
    loadData();
  }

  async function sendDiscount() {
    if (!selectedUser || !selectedPlace) { alert("Select user and place"); return; }
    const place = places.find(p => p.id === selectedPlace);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await supabase.from("discount_codes").insert({
      user_id: selectedUser,
      code,
      place: place.name,
      place_id: selectedPlace,
    });
    alert("Discount code: " + code);
    setSelectedUser(""); setSelectedPlace("");
  }

  function getTypeLabel(type) {
    if (type === "restaurant") return "Restaurant";
    if (type === "gym") return "Gym";
    if (type === "beach") return "Beach";
    if (type === "court") return "Court";
    return type;
  }

  function getChartData(placeOrders) {
    if (placeOrders.length === 0) return [];
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
    } else {
      const firstDate = new Date(placeOrders[placeOrders.length - 1].created_at);
      firstDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((now - firstDate) / (1000 * 60 * 60 * 24)) + 1;
      days = Array.from({ length: diffDays }, (_, i) => {
        const d = new Date(firstDate);
        d.setDate(d.getDate() + i);
        return d.toISOString().split("T")[0];
      });
    }
    return days.map(day => ({
      day: day.slice(5),
      fullDate: day,
      count: placeOrders.filter(o => o.created_at?.slice(0, 10) === day).length,
    }));
  }

  function getPeakHour(placeOrders) {
    if (placeOrders.length === 0) return null;
    const hourCounts = {};
    placeOrders.forEach(o => {
      const hour = new Date(o.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const sorted = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { hour: sorted[0][0], count: sorted[0][1] } : null;
  }

  function getMostOrderedItem(placeOrders) {
    if (placeOrders.length === 0) return null;
    const itemCounts = {};
    placeOrders.forEach(o => {
      if (o.item) itemCounts[o.item] = (itemCounts[o.item] || 0) + 1;
    });
    const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { item: sorted[0][0], count: sorted[0][1] } : null;
  }

  function getSortedItems(placeOrders) {
    const itemCounts = {};
    placeOrders.forEach(o => {
      if (o.item) itemCounts[o.item] = (itemCounts[o.item] || 0) + 1;
    });
    return Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);
  }

  function getReturningUsers(placeOrders, uniqueUserIds) {
    return uniqueUserIds.filter(uid => placeOrders.filter(o => o.user_id === uid).length > 1).length;
  }

  const totalRevenue = orders.reduce((sum, o) => {
    const place = places.find(p => p.id === o.place_id);
    return sum + (place?.commission || 10);
  }, 0);
  const totalSaved = orders.reduce((sum, o) => sum + (o.discount || 0), 0);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "analytics", label: "Analytics" },
    { key: "notifications", label: `Notifications (${notifications.length})` },
    { key: "otps", label: `OTPs (${otps.length})` },
    { key: "users", label: `Users (${users.length})` },
    { key: "orders", label: `Orders (${orders.length})` },
    { key: "places", label: `Places (${places.length})` },
    { key: "rules", label: `Smart Rules (${rules.length})` },
    { key: "discount", label: "Send Discount" },
  ];

  const selectedPlaceData = selectedPlaceId ? (() => {
    const placeOrders = orders.filter(o => o.place_id === selectedPlaceId);
    const uniqueUserIds = [...new Set(placeOrders.map(o => o.user_id))];
    const chartData = getChartData(placeOrders);
    const maxCount = Math.max(...chartData.map(d => d.count), 1);
    const peakHour = getPeakHour(placeOrders);
    const mostOrdered = getMostOrderedItem(placeOrders);
    const sortedItems = getSortedItems(placeOrders);
    const returningUsers = getReturningUsers(placeOrders, uniqueUserIds);
    const place = places.find(p => p.id === selectedPlaceId);
    const totalRev = placeOrders.length * (place?.commission || 10);
    return { placeOrders, uniqueUserIds, chartData, maxCount, peakHour, mostOrdered, sortedItems, returningUsers, totalRev };
  })() : null;

  return (
    <div style={s.app}>
      {/* Sidebar */}
      {(isMobile ? sidebarOpen : true) && (
        <div style={isMobile ? s.sidebarMobileOverlay : s.sidebarDesktop}>
          {isMobile && <div style={s.backdrop} onClick={() => setSidebarOpen(false)} />}
          <div style={s.sidebar}>
            <div style={s.sidebarHeader}>
              <h2 style={s.logo}>Nudge</h2>
              {isMobile && (
                <button style={s.closeBtn} onClick={() => setSidebarOpen(false)}>✕</button>
              )}
            </div>
            <div style={s.sidebarNav}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  style={activeTab === tab.key ? s.sidebarItemActive : s.sidebarItem}
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (isMobile) setSidebarOpen(false);
                  }}
                >
                  <OutlineIcon active={activeTab === tab.key} />
                  <span style={s.sidebarLabel}>{tab.label}</span>
                </button>
              ))}
            </div>
            <div style={s.sidebarFooter}>
              <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={isMobile ? s.mainMobile : s.mainDesktop}>
        <div style={s.topBar}>
          {isMobile && (
            <button style={s.hamburger} onClick={() => setSidebarOpen(true)}>☰</button>
          )}
          <h1 style={s.pageTitle}>Dashboard</h1>
          <button style={s.refreshBtn} onClick={loadData}>⟳ Refresh</button>
        </div>

        <div style={s.content}>
          {activeTab === "overview" && (
            <div>
              <div style={s.statsGrid}>
                <div style={s.statCard}><p style={s.statN}>{users.length}</p><p style={s.statL}>Users</p></div>
                <div style={s.statCard}><p style={s.statN}>{orders.length}</p><p style={s.statL}>Orders</p></div>
                <div style={s.statCard}><p style={s.statN}>{totalRevenue}</p><p style={s.statL}>EGP earned</p></div>
                <div style={s.statCard}><p style={s.statN}>{totalSaved}</p><p style={s.statL}>EGP saved</p></div>
              </div>
              <h2 style={s.sectionTitle}>Performance per place</h2>
              {places.length === 0 && <p style={s.empty}>No places yet</p>}
              {places.map(place => {
                const placeOrders = orders.filter(o => o.place_id === place.id);
                const uniqueUsers = [...new Set(placeOrders.map(o => o.user_id))];
                const revenue = placeOrders.length * (place.commission || 10);
                const returning = getReturningUsers(placeOrders, uniqueUsers);
                const retentionRate = uniqueUsers.length > 0 ? ((returning / uniqueUsers.length) * 100).toFixed(0) : 0;
                return (
                  <div key={place.id} style={s.card}>
                    <div style={s.cardRow}>
                      <span style={s.cardMain}>{place.name}</span>
                      <span style={s.typeBadge}>{getTypeLabel(place.type)}</span>
                    </div>
                    <div style={s.statsRow}>
                      <div style={s.miniStat}><p style={s.miniN}>{uniqueUsers.length}</p><p style={s.miniL}>Customers</p></div>
                      <div style={s.miniStat}><p style={s.miniN}>{placeOrders.length}</p><p style={s.miniL}>Orders</p></div>
                      <div style={s.miniStat}><p style={s.miniN}>{revenue}</p><p style={s.miniL}>EGP earned</p></div>
                      <div style={s.miniStat}><p style={s.miniN}>{retentionRate}%</p><p style={s.miniL}>Retention</p></div>
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

              {!selectedPlaceId && <p style={s.empty}>Select a place from above</p>}

              {selectedPlaceId && selectedPlaceData && (() => {
                const place = places.find(p => p.id === selectedPlaceId);
                const { placeOrders, uniqueUserIds, chartData, maxCount, peakHour, mostOrdered, sortedItems, returningUsers, totalRev } = selectedPlaceData;

                return (
                  <div>
                    <div style={s.analyticsHeader}>
                      <h2 style={s.sectionTitle}>{place.name}</h2>
                      <span style={s.typeBadge}>{getTypeLabel(place.type)}</span>
                    </div>

                    <div style={s.statsGrid}>
                      <div style={s.statCard}><p style={s.statN}>{uniqueUserIds.length}</p><p style={s.statL}>Customers</p></div>
                      <div style={s.statCard}><p style={s.statN}>{placeOrders.length}</p><p style={s.statL}>Orders</p></div>
                      <div style={s.statCard}>
                        <p style={s.statN}>{uniqueUserIds.length > 0 ? ((returningUsers / uniqueUserIds.length) * 100).toFixed(0) : 0}%</p>
                        <p style={s.statL}>Retention</p>
                      </div>
                      <div style={s.statCard}><p style={s.statN}>{totalRev}</p><p style={s.statL}>EGP earned</p></div>
                    </div>

                    {(peakHour || mostOrdered) && (
                      <div style={s.insightCard}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                          <OutlineIcon active={false} />
                          <p style={s.insightTitle}>System Intelligence</p>
                        </div>
                        {peakHour && (
                          <p style={s.insightText}>
                            Peak hour: {peakHour.hour}:00 — {Number(peakHour.hour) + 1}:00 ({peakHour.count} orders)
                          </p>
                        )}
                        {mostOrdered && (
                          <p style={s.insightText}>
                            Most ordered: {mostOrdered.item} ({mostOrdered.count} times out of {placeOrders.length})
                          </p>
                        )}
                        {uniqueUserIds.length > 0 && (
                          <p style={s.insightText}>
                            Average visits: {(placeOrders.length / uniqueUserIds.length).toFixed(1)} visits per customer
                          </p>
                        )}
                      </div>
                    )}

                    <div style={s.chartCard}>
                      <div style={s.chartHeader}>
                        <p style={s.subTitle}>Orders over time</p>
                        <div style={s.rangeButtons}>
                          {[{ key: "week", label: "Week" }, { key: "month", label: "Month" }, { key: "all", label: "All" }].map(r => (
                            <button key={r.key} style={chartRange === r.key ? s.activeRange : s.range} onClick={() => setChartRange(r.key)}>{r.label}</button>
                          ))}
                        </div>
                      </div>
                      {chartData.length === 0 ? (
                        <p style={s.empty}>No data in this period</p>
                      ) : (
                        <div>
                          <div style={s.chartWrapper}>
                            <div style={{ ...s.chart, minWidth: chartData.length > 30 ? `${chartData.length * 12}px` : "100%" }}>
                              {chartData.map((d, i) => (
                                <div key={i} style={s.chartCol} title={`${d.fullDate}: ${d.count} orders`}>
                                  <div style={s.barWrapper}>
                                    <div style={{ ...s.bar, height: `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 8 : 2)}%`, backgroundColor: d.count > 0 ? "#000" : "#e0e0e0" }}>
                                      {d.count > 0 && chartData.length <= 14 && <span style={s.barLabel}>{d.count}</span>}
                                    </div>
                                  </div>
                                  {chartData.length <= 30 && <p style={s.chartDay}>{d.day}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                          {chartData.length > 30 && (
                            <div style={s.chartFooter}>
                              <span style={s.chartFooterText}>From: {chartData[0]?.fullDate}</span>
                              <span style={s.chartFooterText}>To: {chartData[chartData.length - 1]?.fullDate}</span>
                            </div>
                          )}
                          <p style={s.chartTotal}>Total: {placeOrders.filter(o => {
                            if (chartRange === "all") return true;
                            const days = chartRange === "week" ? 7 : 30;
                            const cutoff = new Date();
                            cutoff.setDate(cutoff.getDate() - days);
                            return new Date(o.created_at) >= cutoff;
                          }).length} orders in this period</p>
                        </div>
                      )}
                    </div>

                    {sortedItems.length > 0 && (
                      <div style={s.card}>
                        <p style={s.subTitle}>Orders ranked from most to least</p>
                        {sortedItems.map(([item, count], idx) => (
                          <div key={item} style={s.itemRow}>
                            <span style={s.itemRank}>#{idx + 1}</span>
                            <span style={s.itemName}>{item}</span>
                            <div style={s.itemRight}>
                              <div style={{ ...s.itemBar, width: `${(count / sortedItems[0][1]) * 60}px` }} />
                              <span style={s.itemCount}>{count} ({((count / placeOrders.length) * 100).toFixed(0)}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={s.card}>
                      <p style={s.subTitle}>Customers ({uniqueUserIds.length})</p>
                      {uniqueUserIds.length === 0 && <p style={s.empty}>No customers yet</p>}
                      {uniqueUserIds.map(userId => {
                        const user = users.find(u => u.id === userId);
                        const userOrders = placeOrders.filter(o => o.user_id === userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                        const lastVisit = userOrders[0]?.created_at;
                        const daysSince = lastVisit ? Math.floor((new Date() - new Date(lastVisit)) / (1000 * 60 * 60 * 24)) : null;
                        const userItemCounts = {};
                        userOrders.forEach(o => { if (o.item) userItemCounts[o.item] = (userItemCounts[o.item] || 0) + 1; });
                        const favItem = Object.entries(userItemCounts).sort((a, b) => b[1] - a[1])[0];
                        const totalSpent = userOrders.reduce((sum, o) => sum + (o.price || 0), 0);
                        const totalSavedUser = userOrders.reduce((sum, o) => sum + (o.discount || 0), 0);

                        return user ? (
                          <div key={userId} style={s.userCard}>
                            <div style={s.userCardTop}>
                              <div>
                                <p style={s.userName}>{user.name}</p>
                                <p style={s.userPhone}>{user.phone}</p>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <p style={s.userVisits}>{userOrders.length} visits</p>
                                <p style={{ ...s.userDate, color: daysSince > 7 ? "#ff4444" : daysSince === 0 ? "#00aa00" : "#999" }}>
                                  {daysSince === null ? "" : daysSince === 0 ? "Today" : `${daysSince} days ago`}
                                </p>
                              </div>
                            </div>
                            <div style={s.userStats}>
                              {favItem && <span style={s.userTag}>{favItem[0]}</span>}
                              <span style={s.userTag}>Paid {totalSpent} EGP</span>
                              <span style={s.userTag}>Saved {totalSavedUser} EGP</span>
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
              <div style={{ marginBottom: "16px" }}>
                <button style={s.btn} onClick={runSmartRules}>Run Smart Rules now</button>
              </div>
              {notifications.length === 0 ? (
                <p style={s.empty}>No notifications right now — click "Run Smart Rules" first</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} style={s.card}>
                    <div style={s.cardRow}>
                      <span style={s.cardMain}>{n.users?.name}</span>
                      <span style={s.cardSub}>{n.users?.phone}</span>
                    </div>
                    <p style={s.notifMessage}>{n.message}</p>
                    <p style={s.cardDate}>{new Date(n.created_at).toLocaleDateString("en-US")}</p>
                    <button style={s.sentBtn} onClick={() => markNotificationSent(n.id)}>✓ Sent on WhatsApp</button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "otps" && (
            <div>
              {otps.length === 0 ? <p style={s.empty}>No OTPs right now</p> : otps.map(o => (
                <div key={o.id} style={s.card}>
                  <div style={s.cardRow}>
                    <span style={s.cardMain}>{o.phone}</span>
                    <span style={s.otpCode}>{o.otp}</span>
                  </div>
                  <p style={s.cardSub}>{new Date(o.created_at).toLocaleTimeString("en-US")}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "users" && (
            <div>
              {users.length === 0 ? <p style={s.empty}>No users</p> : users.map(u => (
                <div key={u.id} style={s.card}>
                  <div style={s.cardRow}>
                    <span style={s.cardMain}>{u.name}</span>
                    <span style={s.cardSub}>{u.phone}</span>
                  </div>
                  <div style={s.cardRow}>
                    <span style={s.cardDate}>{new Date(u.created_at).toLocaleDateString("en-US")}</span>
                    <span style={s.cardSub}>Orders: {orders.filter(o => o.user_id === u.id).length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              {orders.length === 0 ? <p style={s.empty}>No orders</p> : orders.map(o => (
                <div key={o.id} style={s.card}>
                  <div style={s.cardRow}>
                    <span style={s.cardMain}>{o.users?.name}</span>
                    <span style={s.savedBadge}>Saved {o.discount} EGP</span>
                  </div>
                  <div style={s.cardRow}>
                    <span style={s.cardSub}>{o.places?.name}</span>
                    <span style={s.cardSub}>{o.item}</span>
                  </div>
                  <div style={s.cardRow}>
                    <span style={s.cardDate}>{new Date(o.created_at).toLocaleDateString("en-US")}</span>
                    <span style={s.cardSub}>{o.price} EGP</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "places" && (
            <div>
              <div style={s.addCard}>
                <h2 style={s.sectionTitle}>Add new place</h2>
                <input style={s.input} placeholder="Place name" value={newPlace.name} onChange={e => setNewPlace({ ...newPlace, name: e.target.value })} />
                <select style={s.input} value={newPlace.type} onChange={e => setNewPlace({ ...newPlace, type: e.target.value })}>
                  <option value="restaurant">Restaurant</option>
                  <option value="gym">Gym</option>
                  <option value="beach">Beach</option>
                  <option value="court">Court</option>
                </select>
                <input style={s.input} placeholder="Cashier code" value={newPlace.cashier_code} onChange={e => setNewPlace({ ...newPlace, cashier_code: e.target.value })} />
                <input style={s.input} placeholder="Discount amount in EGP" value={newPlace.discount_amount} onChange={e => setNewPlace({ ...newPlace, discount_amount: e.target.value })} />
                <input style={s.input} placeholder="Company commission (default 10 EGP)" value={newPlace.commission} onChange={e => setNewPlace({ ...newPlace, commission: e.target.value })} />
                <button style={s.btn} onClick={handleAddPlace}>Add place</button>
              </div>
              {places.map(p => (
                <div key={p.id} style={s.card}>
                  <div style={s.cardRow}>
                    <span style={s.cardMain}>{p.name}</span>
                    <span style={s.typeBadge}>{getTypeLabel(p.type)}</span>
                  </div>
                  <div style={s.cardRow}>
                    <span style={s.cardSub}>Code: {p.cashier_code}</span>
                    <span style={s.cardSub}>Discount: {p.discount_amount} EGP</span>
                  </div>
                  <span style={s.cardSub}>Commission: {p.commission} EGP</span>
                  <button style={s.deleteBtn} onClick={() => handleDeletePlace(p.id)}>Delete</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "rules" && (
            <div>
              <div style={s.addCard}>
                <h2 style={s.sectionTitle}>Add Smart Rule</h2>
                <select style={s.input} value={newRule.rule_type} onChange={e => setNewRule({ ...newRule, rule_type: e.target.value })}>
                  <option value="inactive">Inactive user</option>
                  <option value="frequent">Frequent user</option>
                </select>
                {newRule.rule_type === "inactive" && (
                  <input style={s.input} placeholder="After how many days of inactivity" value={newRule.days_inactive} onChange={e => setNewRule({ ...newRule, days_inactive: e.target.value })} />
                )}
                {newRule.rule_type === "frequent" && (
                  <input style={s.input} placeholder="After how many visits" value={newRule.min_visits} onChange={e => setNewRule({ ...newRule, min_visits: e.target.value })} />
                )}
                <input style={s.input} placeholder="Message to be sent to user" value={newRule.message} onChange={e => setNewRule({ ...newRule, message: e.target.value })} />
                <button style={s.btn} onClick={handleAddRule}>Add Rule</button>
              </div>
              {rules.length === 0 ? <p style={s.empty}>No rules right now</p> : rules.map(r => (
                <div key={r.id} style={s.card}>
                  <div style={s.cardRow}>
                    <span style={s.cardMain}>{r.rule_type === "inactive" ? "Inactive user" : "Frequent user"}</span>
                    <span style={r.active ? s.activeBadge : s.inactiveBadge}>{r.active ? "Active" : "Inactive"}</span>
                  </div>
                  <p style={s.cardSub}>{r.message}</p>
                  {r.days_inactive && <p style={s.cardDate}>After {r.days_inactive} days of inactivity</p>}
                  {r.min_visits && <p style={s.cardDate}>After {r.min_visits} visits</p>}
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button style={s.toggleBtn} onClick={() => handleToggleRule(r.id, r.active)}>{r.active ? "Deactivate" : "Activate"}</button>
                    <button style={s.deleteBtn} onClick={() => handleDeleteRule(r.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "discount" && (
            <div style={s.addCard}>
              <h2 style={s.sectionTitle}>Send discount code</h2>
              <label style={s.label}>Select user</label>
              <select style={s.input} value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                <option value="">-- Select user --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} - {u.phone}</option>)}
              </select>
              <label style={s.label}>Select place</label>
              <select style={s.input} value={selectedPlace} onChange={e => setSelectedPlace(e.target.value)}>
                <option value="">-- Select place --</option>
                {places.map(p => <option key={p.id} value={p.id}>{p.name} - {p.discount_amount} EGP discount</option>)}
              </select>
              <button style={s.btn} onClick={sendDiscount}>Send discount code</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  app: { minHeight: "100vh", backgroundColor: "#f8f9fa", display: "flex", direction: "ltr", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },

  // Sidebar
  sidebarDesktop: { position: "fixed", top: 0, left: 0, width: "280px", height: "100vh", zIndex: 100, boxShadow: "4px 0 20px rgba(0,0,0,0.05)", borderRight: "1px solid #eef2f6", backgroundColor: "#fff" },
  sidebarMobileOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: "flex", justifyContent: "flex-start" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" },
  sidebar: { position: "relative", width: "280px", height: "100%", backgroundColor: "#fff", boxShadow: "4px 0 20px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", overflowY: "auto" },
  sidebarHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 20px", borderBottom: "1px solid #edf2f7" },
  logo: { fontSize: "24px", fontWeight: "900", color: "#000", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "22px", cursor: "pointer", padding: "8px", borderRadius: "12px", color: "#666" },
  sidebarNav: { flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px" },
  sidebarItem: { display: "flex", alignItems: "center", width: "100%", padding: "12px 16px", backgroundColor: "transparent", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: "600", color: "#1a1a1a", cursor: "pointer", transition: "all 0.2s" },
  sidebarItemActive: { display: "flex", alignItems: "center", width: "100%", padding: "12px 16px", backgroundColor: "#000", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: "600", color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  sidebarLabel: { flex: 1, textAlign: "left", marginLeft: "12px" },
  sidebarFooter: { padding: "20px", borderTop: "1px solid #edf2f7" },
  logoutBtn: { width: "100%", padding: "12px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #e2e8f0", borderRadius: "14px", cursor: "pointer", fontSize: "14px", fontWeight: "600", transition: "all 0.2s" },

  // Main content
  mainDesktop: { flex: 1, marginLeft: "280px", width: "calc(100% - 280px)" },
  mainMobile: { flex: 1, width: "100%" },
  topBar: { backgroundColor: "#fff", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eef2f6", position: "sticky", top: 0, zIndex: 99, backdropFilter: "blur(8px)", backgroundColor: "rgba(255,255,255,0.95)" },
  hamburger: { background: "none", border: "none", fontSize: "28px", cursor: "pointer", padding: "8px", marginRight: "8px", color: "#000", display: "flex", alignItems: "center", borderRadius: "12px" },
  pageTitle: { fontSize: "18px", fontWeight: "700", color: "#000", margin: 0, flex: 1, textAlign: "center" },
  refreshBtn: { padding: "6px 14px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #e2e8f0", borderRadius: "40px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  content: { padding: "24px", maxWidth: "1280px", margin: "0 auto", width: "100%", boxSizing: "border-box" },

  // Remaining styles
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "28px" },
  statCard: { backgroundColor: "#000", color: "#fff", borderRadius: "20px", padding: "20px", textAlign: "center" },
  statN: { fontSize: "28px", fontWeight: "900", marginBottom: "6px" },
  statL: { fontSize: "12px", opacity: 0.8 },
  statsRow: { display: "flex", gap: "12px", marginTop: "14px", flexWrap: "wrap" },
  miniStat: { flex: "1 1 70px", backgroundColor: "#f8f9fa", borderRadius: "14px", padding: "10px", textAlign: "center" },
  miniN: { fontSize: "18px", fontWeight: "800", color: "#000" },
  miniL: { fontSize: "10px", color: "#666" },
  card: { backgroundColor: "#fff", border: "1px solid #edf2f7", borderRadius: "20px", padding: "18px", marginBottom: "16px" },
  cardRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" },
  cardMain: { fontSize: "16px", fontWeight: "700", color: "#000" },
  cardSub: { fontSize: "12px", color: "#64748b" },
  cardDate: { fontSize: "11px", color: "#94a3b8" },
  otpCode: { fontSize: "22px", fontWeight: "900", letterSpacing: "4px", color: "#000" },
  savedBadge: { backgroundColor: "#000", color: "#fff", padding: "4px 12px", borderRadius: "40px", fontSize: "11px", fontWeight: "600" },
  typeBadge: { backgroundColor: "#f1f5f9", color: "#1e293b", padding: "4px 12px", borderRadius: "40px", fontSize: "11px", fontWeight: "600" },
  activeBadge: { backgroundColor: "#10b981", color: "#fff", padding: "4px 12px", borderRadius: "40px", fontSize: "11px", fontWeight: "600" },
  inactiveBadge: { backgroundColor: "#f1f5f9", color: "#64748b", padding: "4px 12px", borderRadius: "40px", fontSize: "11px", fontWeight: "600" },
  addCard: { backgroundColor: "#fff", border: "1px solid #edf2f7", borderRadius: "24px", padding: "24px", marginBottom: "20px" },
  sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#000", marginBottom: "20px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#000", marginBottom: "6px", display: "block" },
  input: { width: "100%", padding: "12px 16px", border: "1.5px solid #e2e8f0", borderRadius: "16px", fontSize: "14px", marginBottom: "16px", outline: "none", textAlign: "left", boxSizing: "border-box", backgroundColor: "#fff" },
  btn: { width: "100%", padding: "14px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "16px", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
  deleteBtn: { padding: "6px 16px", backgroundColor: "#fff", color: "#ef4444", border: "1.5px solid #ef4444", borderRadius: "40px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  toggleBtn: { padding: "6px 16px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "40px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  empty: { textAlign: "center", padding: "48px", color: "#94a3b8" },
  placeSelector: { display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" },
  analyticsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" },
  insightCard: { backgroundColor: "#000", color: "#fff", borderRadius: "20px", padding: "18px", marginBottom: "16px" },
  insightTitle: { fontSize: "15px", fontWeight: "700", margin: 0 },
  insightText: { fontSize: "13px", opacity: 0.85, marginBottom: "6px" },
  chartCard: { backgroundColor: "#fff", border: "1px solid #edf2f7", borderRadius: "20px", padding: "20px", marginBottom: "16px", overflowX: "auto" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" },
  rangeButtons: { display: "flex", gap: "8px", flexWrap: "wrap" },
  range: { padding: "6px 14px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #e2e8f0", borderRadius: "40px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  activeRange: { padding: "6px 14px", backgroundColor: "#000", color: "#fff", border: "1.5px solid #000", borderRadius: "40px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  chartWrapper: { width: "100%", overflowX: "auto" },
  chart: { display: "flex", alignItems: "flex-end", gap: "6px", height: "130px" },
  chartCol: { flex: "0 0 auto", minWidth: "20px", display: "flex", flexDirection: "column", alignItems: "center", height: "100%", cursor: "pointer" },
  barWrapper: { flex: 1, display: "flex", alignItems: "flex-end", width: "100%" },
  bar: { width: "100%", borderRadius: "6px 6px 0 0", minHeight: "2px", display: "flex", alignItems: "flex-start", justifyContent: "center", transition: "height 0.3s" },
  barLabel: { fontSize: "8px", color: "#fff", marginTop: "2px" },
  chartDay: { fontSize: "8px", color: "#64748b", marginTop: "4px", textAlign: "center" },
  chartFooter: { display: "flex", justifyContent: "space-between", marginTop: "8px" },
  chartFooterText: { fontSize: "10px", color: "#94a3b8" },
  chartTotal: { fontSize: "12px", color: "#666", textAlign: "center", marginTop: "8px" },
  subTitle: { fontSize: "14px", fontWeight: "700", color: "#000", marginBottom: "14px" },
  itemRow: { display: "flex", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9", gap: "8px" },
  itemRank: { fontSize: "12px", fontWeight: "700", color: "#999", minWidth: "28px" },
  itemName: { fontSize: "13px", color: "#000", fontWeight: "500", flex: 1 },
  itemRight: { display: "flex", alignItems: "center", gap: "12px" },
  itemBar: { height: "6px", backgroundColor: "#000", borderRadius: "10px" },
  itemCount: { fontSize: "12px", fontWeight: "700", color: "#000", minWidth: "70px", textAlign: "right" },
  userCard: { border: "1px solid #f0f0f0", borderRadius: "14px", padding: "14px", marginBottom: "10px" },
  userCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" },
  userName: { fontSize: "15px", fontWeight: "700", color: "#000" },
  userPhone: { fontSize: "12px", color: "#64748b", marginTop: "2px" },
  userVisits: { fontSize: "14px", fontWeight: "700", color: "#000", textAlign: "right" },
  userDate: { fontSize: "11px", textAlign: "right" },
  userStats: { display: "flex", gap: "8px", flexWrap: "wrap" },
  userTag: { backgroundColor: "#f5f5f5", color: "#000", padding: "4px 10px", borderRadius: "20px", fontSize: "11px" },
  notifMessage: { fontSize: "14px", color: "#000", margin: "10px 0", fontWeight: "600", lineHeight: 1.5 },
  sentBtn: { marginTop: "10px", padding: "8px 18px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "40px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  tab: { padding: "8px 16px", backgroundColor: "#fff", color: "#000", border: "1.5px solid #e2e8f0", borderRadius: "40px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  activeTab: { padding: "8px 16px", backgroundColor: "#000", color: "#fff", border: "1.5px solid #000", borderRadius: "40px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
};

if (typeof window !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.textContent = `
    button { transition: all 0.2s ease; }
    button:hover { opacity: 0.9; transform: translateY(-1px); }
    .sidebar-item:hover { background-color: #f8f9fa; }
    .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px rgba(0,0,0,0.1); }
    input:focus { border-color: #000; outline: none; }
    @media (max-width: 768px) {
      .sidebar-desktop { display: none; }
    }
    @media (min-width: 769px) {
      .sidebar-mobile-overlay { display: none; }
      .hamburger-btn { display: none; }
    }
  `;
  document.head.appendChild(styleTag);
}