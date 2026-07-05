// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "./supabase";
// import YawmiLogo from "../components/YawmiLogo";

// export default function Dashboard() {
//   const [user, setUser] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [discountCode, setDiscountCode] = useState(null);
//   const [totalSaved, setTotalSaved] = useState(0);
//   const [copied, setCopied] = useState(false);
//   const [studentInfo, setStudentInfo] = useState(null);
//   const navigate = useNavigate();
//   const phone = localStorage.getItem("phone");

//   useEffect(() => {
//     if (!phone) { navigate("/login"); return; }
//     loadData();
//   }, []);

//   async function loadData() {
//     const { data: userData } = await supabase
//       .from("users").select("*").eq("phone", phone).single();
//     setUser(userData);
//     if (userData) {
//       const { data: ordersData } = await supabase
//         .from("orders")
//         .select("*, places(name, type)")
//         .eq("user_id", userData.id)
//         .order("created_at", { ascending: false });
//       setOrders(ordersData || []);
//       const total = (ordersData || []).reduce((sum, v) => sum + v.discount, 0);
//       setTotalSaved(total);

//       const { data: codeData } = await supabase
//         .from("discount_codes")
//         .select("*, places(name, discount_amount)")
//         .eq("user_id", userData.id)
//         .eq("used", false)
//         .order("created_at", { ascending: false });
//       setDiscountCode(codeData && codeData.length > 0 ? codeData[0] : null);

//       // Load student info to show banner if incomplete
//       const { data: studentData } = await supabase
//         .from("student_info")
//         .select("*")
//         .eq("user_id", userData.id)
//         .maybeSingle();
//       setStudentInfo(studentData);
//     }
//   }

//   function getTypeLabel(type) {
//     if (type === "restaurant") return "Restaurant";
//     if (type === "gym") return "Gym";
//     if (type === "beach") return "Beach";
//     if (type === "court") return "Court";
//     return type;
//   }

//   function formatDate(d) {
//     return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "long" });
//   }

//   const handleCopyCode = () => {
//     if (discountCode?.code) {
//       navigator.clipboard.writeText(discountCode.code);
//       setCopied(true);
//       setTimeout(() => setCopied(false), 2000);
//     }
//   };

//   // SVG Icons
//   const WalletIcon = () => (
//     <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M20 12V8H6C4.89543 8 4 8.89543 4 10V18C4 19.1046 4.89543 20 6 20H20C21.1046 20 22 19.1046 22 18V12Z" />
//       <path d="M20 12H16C14.8954 12 14 12.8954 14 14C14 15.1046 14.8954 16 16 16H20V12Z" />
//       <path d="M6 8L15 4" stroke="black" strokeWidth="1.5" />
//     </svg>
//   );

//   const ReceiptIcon = () => (
//     <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M6 21L8 19L10 21L12 19L14 21L16 19L18 21V5C18 3.89543 17.1046 3 16 3H8C6.89543 3 6 3.89543 6 5V21Z" />
//       <path d="M9 8H15" stroke="black" strokeWidth="1.5" />
//       <path d="M9 12H15" stroke="black" strokeWidth="1.5" />
//       <path d="M9 16H12" stroke="black" strokeWidth="1.5" />
//     </svg>
//   );

//   const TicketIcon = () => (
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M2 9C2 7.89543 2.89543 7 4 7H20C21.1046 7 22 7.89543 22 9V11C20.8954 11 20 11.8954 20 13C20 14.1046 20.8954 15 22 15V17C22 18.1046 21.1046 19 20 19H4C2.89543 19 2 18.1046 2 17V15C3.10457 15 4 14.1046 4 13C4 11.8954 3.10457 11 2 11V9Z" />
//       <path d="M12 7V19" stroke="black" strokeWidth="1.5" strokeDasharray="2 2" />
//     </svg>
//   );

//   const BagIcon = () => (
//     <svg width="56" height="56" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M6 7L8 4H16L18 7" />
//       <rect x="4" y="7" width="16" height="13" rx="2" />
//       <path d="M9 11V10" />
//       <path d="M15 11V10" />
//     </svg>
//   );

//   const CopyIcon = () => (
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
//       <rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="white" />
//       <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="white" />
//     </svg>
//   );

//   const CheckIcon = () => (
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <polyline points="20 6 9 17 4 12" fill="white" />
//     </svg>
//   );

//   const isStudentVerified = studentInfo?.verified && studentInfo?.edu_email;

//   return (
//     <div className="dashboard">
//       <div className="container">

//         {/* Header */}
//         <div className="header">
//           <div>
//             <YawmiLogo className="logo" />
//             {user && <p className="greeting">Welcome, {user.name}</p>}
//           </div>
//           <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
//             {/* My Info button */}
//             <button
//               className="settings-btn"
//               onClick={() => navigate("/settings")}
//             >
//               My Info
//             </button>
//             <button
//               className="logout-btn"
//               onClick={() => { localStorage.clear(); navigate("/login"); }}
//             >
//               Logout
//             </button>
//           </div>
//         </div>

//         {/* Student info incomplete banner */}
//         {!isStudentVerified && (
//           <div className="incomplete-banner" onClick={() => navigate("/settings")}>
//             <span className="incomplete-icon">!</span>
//             <div>
//               <p className="incomplete-title">Complete your student info</p>
//               <p className="incomplete-sub">Add your university email to unlock discounts</p>
//             </div>
//             <span className="incomplete-arrow">→</span>
//           </div>
//         )}

//         {/* Stats */}
//         <div className="stats">
//           <div className="stat-card">
//             <div className="stat-icon"><WalletIcon /></div>
//             <p className="stat-number">{totalSaved.toLocaleString()} <span className="unit">EGP</span></p>
//             <p className="stat-label">Total Saved</p>
//           </div>
//           <div className="stat-card">
//             <div className="stat-icon"><ReceiptIcon /></div>
//             <p className="stat-number">{orders.length}</p>
//             <p className="stat-label">Total Visits</p>
//           </div>
//         </div>

//         {/* Discount Code */}
//         {discountCode && (
//           <div className="discount-card">
//             <div className="discount-header">
//               <span className="discount-badge">Active Discount Code</span>
//               <div className="discount-icon-wrapper"><TicketIcon /></div>
//             </div>
//             <div className="code-container">
//               <p className="discount-code-text">{discountCode.code}</p>
//               <button className="copy-btn" onClick={handleCopyCode}>
//                 {copied ? <CheckIcon /> : <CopyIcon />}
//                 <span>{copied ? "Copied!" : "Copy"}</span>
//               </button>
//             </div>
//             <p className="discount-place-name">
//               {discountCode.places?.name} • {discountCode.places?.discount_amount} EGP discount
//             </p>
//           </div>
//         )}

//         {/* Orders List */}
//         <div className="orders-card">
//           <h2 className="section-title">Recent Visits</h2>
//           {orders.length === 0 ? (
//             <div className="empty-state">
//               <div className="empty-icon-wrapper"><BagIcon /></div>
//               <p className="empty-title">No visits yet</p>
//               <span className="empty-hint">Request a discount code from any contracted branch</span>
//             </div>
//           ) : (
//             <div className="orders-list">
//               {orders.map((order) => (
//                 <div key={order.id} className="order-row">
//                   <div className="order-details">
//                     <h3 className="place-name">{order.places?.name}</h3>
//                     <span className="place-type">{getTypeLabel(order.places?.type)}</span>
//                     <p className="item-name">{order.item}</p>
//                     <time className="order-date">{formatDate(order.created_at)}</time>
//                   </div>
//                   <div className="savings-box">
//                     <span className="saved-label">Saved</span>
//                     <strong className="saved-amount">{order.discount} EGP</strong>
//                     <span className="original-price">{order.price} EGP</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//       </div>

//       <style jsx="true">{`
//         .dashboard {
//           min-height: 100vh;
//           background: #f5f5f5;
//           padding: 28px 20px;
//           font-family: 'Inter', 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//         }
//         .container { max-width: 600px; margin: 0 auto; }

//         /* Header */
//         .header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           background: #ffffff;
//           padding: 20px 24px;
//           border-radius: 36px;
//           margin-bottom: 20px;
//           box-shadow: 0 4px 12px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03);
//           border: 1px solid #e8e8e8;
//         }
//         .logo {
//           font-size: 32px;
//           font-weight: 800;
//           letter-spacing: -0.8px;
//           color: #000000;
//           margin: 0;
//           line-height: 1.1;
//         }
//         .greeting { font-size: 13px; color: #5a5a5a; margin: 6px 0 0; font-weight: 450; }
//         .settings-btn {
//           background: #fff;
//           color: #000;
//           border: 1.5px solid #000;
//           padding: 8px 16px;
//           border-radius: 60px;
//           font-size: 13px;
//           font-weight: 600;
//           cursor: pointer;
//           transition: all 0.2s;
//         }
//         .settings-btn:hover { background: #000; color: #fff; }
//         .logout-btn {
//           background: #000000;
//           color: #ffffff;
//           border: none;
//           padding: 8px 20px;
//           border-radius: 60px;
//           font-size: 13px;
//           font-weight: 520;
//           cursor: pointer;
//           transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
//         }
//         .logout-btn:hover { transform: scale(0.96); background: #1f1f1f; }

//         /* Incomplete Banner */
//         .incomplete-banner {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           background: #fffbf0;
//           border: 1.5px solid #f0a500;
//           border-radius: 24px;
//           padding: 14px 18px;
//           margin-bottom: 20px;
//           cursor: pointer;
//           transition: all 0.2s;
//         }
//         .incomplete-banner:hover { background: #fff3d6; transform: translateY(-1px); }
//         .incomplete-icon {
//           width: 28px;
//           height: 28px;
//           border-radius: 50%;
//           border: 2px solid #f0a500;
//           color: #f0a500;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-weight: 800;
//           font-size: 14px;
//           flex-shrink: 0;
//         }
//         .incomplete-title { font-size: 14px; font-weight: 700; color: #000; margin: 0; }
//         .incomplete-sub { font-size: 12px; color: #666; margin: 2px 0 0; }
//         .incomplete-arrow { font-size: 18px; color: #f0a500; margin-left: auto; font-weight: 700; }

//         /* Stats Cards */
//         .stats { display: flex; gap: 16px; margin-bottom: 28px; }
//         .stat-card {
//           flex: 1;
//           background: #ffffff;
//           border-radius: 28px;
//           padding: 22px 12px;
//           text-align: center;
//           border: 1px solid #eaeef2;
//           transition: all 0.25s ease;
//           box-shadow: 0 2px 6px rgba(0,0,0,0.01);
//           position: relative;
//           overflow: hidden;
//         }
//         .stat-card::after {
//           content: '';
//           position: absolute;
//           bottom: 0; left: 0;
//           width: 100%; height: 2px;
//           background: #000000;
//           transform: scaleX(0);
//           transition: transform 0.3s ease;
//           transform-origin: right;
//         }
//         .stat-card:hover::after { transform: scaleX(1); transform-origin: left; }
//         .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.04); border-color: #d0d0d0; }
//         .stat-icon { margin-bottom: 12px; display: flex; justify-content: center; opacity: 0.85; }
//         .stat-number { font-size: 34px; font-weight: 800; color: #000000; margin: 6px 0 4px; letter-spacing: -0.5px; }
//         .unit { font-size: 16px; font-weight: 550; }
//         .stat-label { font-size: 12px; color: #6b6b6b; letter-spacing: 0.4px; font-weight: 450; }

//         /* Discount Card */
//         .discount-card {
//           background: #ffffff;
//           border: 1.5px solid #000000;
//           border-radius: 36px;
//           padding: 24px;
//           margin-bottom: 28px;
//           transition: all 0.25s ease;
//         }
//         .discount-card:hover { transform: translateY(-2px); box-shadow: 0 14px 28px rgba(0,0,0,0.04); }
//         .discount-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
//         .discount-badge {
//           font-size: 11px;
//           text-transform: uppercase;
//           letter-spacing: 1.8px;
//           color: #3c3c3c;
//           background: #f0f0f0;
//           padding: 5px 14px;
//           border-radius: 60px;
//           font-weight: 600;
//         }
//         .code-container {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//           background: #f8f8f8;
//           padding: 12px 18px;
//           border-radius: 28px;
//           margin: 12px 0;
//           border: 1px solid #e0e0e0;
//         }
//         .discount-code-text {
//           font-size: 28px;
//           font-weight: 800;
//           letter-spacing: 4px;
//           font-family: 'SF Mono', 'Fira Code', monospace;
//           color: #000000;
//           margin: 0;
//           direction: ltr;
//           text-align: left;
//           flex: 1;
//         }
//         .copy-btn {
//           background: white;
//           border: 1px solid #c0c0c0;
//           padding: 8px 14px;
//           border-radius: 40px;
//           font-size: 12px;
//           font-weight: 500;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           cursor: pointer;
//           transition: all 0.2s;
//           color: #1a1a1a;
//         }
//         .copy-btn:hover { background: #000000; color: white; border-color: #000000; }
//         .copy-btn:hover svg { stroke: white; }
//         .discount-place-name { font-size: 14px; color: #3a3a3a; margin: 8px 0 0; font-weight: 460; text-align: center; }

//         /* Orders Card */
//         .orders-card {
//           background: #ffffff;
//           border-radius: 32px;
//           border: 1px solid #eaeef2;
//           overflow: hidden;
//           box-shadow: 0 2px 8px rgba(0,0,0,0.02);
//         }
//         .section-title {
//           font-size: 19px;
//           font-weight: 700;
//           color: #000000;
//           padding: 20px 24px 12px 24px;
//           margin: 0;
//           border-bottom: 1px solid #efefef;
//         }
//         .empty-state { text-align: center; padding: 56px 24px; }
//         .empty-icon-wrapper { margin-bottom: 20px; display: inline-block; opacity: 0.8; }
//         .empty-title { font-size: 17px; font-weight: 550; color: #2c2c2c; margin: 12px 0 6px; }
//         .empty-hint { font-size: 13px; color: #7a7a7a; display: block; }
//         .orders-list { display: flex; flex-direction: column; }
//         .order-row {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           padding: 20px 24px;
//           border-bottom: 1px solid #f0f0f0;
//           transition: background 0.2s ease;
//         }
//         .order-row:hover { background: #fbfbfb; }
//         .order-details { flex: 2; }
//         .place-name { font-size: 17px; font-weight: 740; color: #000000; margin: 0 0 6px; }
//         .place-type {
//           font-size: 11px;
//           background: #ebebeb;
//           padding: 3px 12px;
//           border-radius: 30px;
//           color: #2b2b2b;
//           display: inline-block;
//           margin-bottom: 8px;
//           font-weight: 500;
//         }
//         .item-name { font-size: 13px; color: #3e3e3e; margin: 4px 0 3px; font-weight: 450; }
//         .order-date { font-size: 11px; color: #8c8c8c; }
//         .savings-box {
//           text-align: left;
//           background: #f6f6f6;
//           padding: 10px 14px;
//           border-radius: 20px;
//           min-width: 100px;
//           transition: all 0.2s;
//         }
//         .order-row:hover .savings-box { background: #ececec; }
//         .saved-label { font-size: 10px; color: #6a6a6a; display: block; text-transform: uppercase; }
//         .saved-amount { font-size: 20px; font-weight: 800; color: #000000; display: block; line-height: 1.2; margin: 3px 0; }
//         .original-price { font-size: 11px; text-decoration: line-through; color: #a0a0a0; }

//         /* Responsive */
//         @media (max-width: 520px) {
//           .dashboard { padding: 16px; }
//           .stat-number { font-size: 28px; }
//           .discount-code-text { font-size: 20px; letter-spacing: 2px; }
//           .order-row { flex-direction: column; align-items: flex-start; gap: 14px; }
//           .savings-box { text-align: center; width: 90%; }
//           .code-container { flex-direction: column; align-items: stretch; }
//           .copy-btn { justify-content: center; }
//           .stat-card { padding: 16px 8px; }
//         }

//         /* Animations */
//         .header, .stat-card, .discount-card, .orders-card, .incomplete-banner {
//           animation: floatUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
//         }
//         .header { animation-delay: 0.02s; }
//         .incomplete-banner { animation-delay: 0.06s; }
//         .stat-card:first-child { animation-delay: 0.08s; }
//         .stat-card:last-child { animation-delay: 0.13s; }
//         .discount-card { animation-delay: 0.19s; }
//         .orders-card { animation-delay: 0.26s; }

//         @keyframes floatUp {
//           from { opacity: 0; transform: translateY(18px); filter: blur(2px); }
//           to { opacity: 1; transform: translateY(0); filter: blur(0); }
//         }
//       `}</style>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import YawmiLogo from "../components/YawmiLogo";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [discountCode, setDiscountCode] = useState(null);
  const [totalSaved, setTotalSaved] = useState(0);
  const [copied, setCopied] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!userId) { navigate("/login"); return; }
    loadData();
  }, []);

  async function loadData() {
    // Fetch all data from Supabase using user_id — nothing from localStorage
    const { data: userData } = await supabase
      .from("users").select("*").eq("id", userId).single();
    setUser(userData);

    if (userData) {
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*, places(name, type)")
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false });
      setOrders(ordersData || []);
      const total = (ordersData || []).reduce((sum, v) => sum + v.discount, 0);
      setTotalSaved(total);

      const { data: codeData } = await supabase
        .from("discount_codes")
        .select("*, places(name, discount_amount)")
        .eq("user_id", userData.id)
        .eq("used", false)
        .order("created_at", { ascending: false });
      setDiscountCode(codeData && codeData.length > 0 ? codeData[0] : null);

      const { data: studentData } = await supabase
        .from("student_info")
        .select("*")
        .eq("user_id", userData.id)
        .maybeSingle();
      setStudentInfo(studentData);
    }
  }

  function getTypeLabel(type) {
    if (type === "restaurant") return "Restaurant";
    if (type === "gym") return "Gym";
    if (type === "beach") return "Beach";
    if (type === "court") return "Court";
    return type;
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "long" });
  }

  const handleCopyCode = () => {
    if (discountCode?.code) {
      navigator.clipboard.writeText(discountCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const WalletIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6C4.89543 8 4 8.89543 4 10V18C4 19.1046 4.89543 20 6 20H20C21.1046 20 22 19.1046 22 18V12Z" />
      <path d="M20 12H16C14.8954 12 14 12.8954 14 14C14 15.1046 14.8954 16 16 16H20V12Z" />
      <path d="M6 8L15 4" stroke="black" strokeWidth="1.5" />
    </svg>
  );

  const ReceiptIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 21L8 19L10 21L12 19L14 21L16 19L18 21V5C18 3.89543 17.1046 3 16 3H8C6.89543 3 6 3.89543 6 5V21Z" />
      <path d="M9 8H15" stroke="black" strokeWidth="1.5" />
      <path d="M9 12H15" stroke="black" strokeWidth="1.5" />
      <path d="M9 16H12" stroke="black" strokeWidth="1.5" />
    </svg>
  );

  const TicketIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9C2 7.89543 2.89543 7 4 7H20C21.1046 7 22 7.89543 22 9V11C20.8954 11 20 11.8954 20 13C20 14.1046 20.8954 15 22 15V17C22 18.1046 21.1046 19 20 19H4C2.89543 19 2 18.1046 2 17V15C3.10457 15 4 14.1046 4 13C4 11.8954 3.10457 11 2 11V9Z" />
      <path d="M12 7V19" stroke="black" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  );

  const BagIcon = () => (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7L8 4H16L18 7" />
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M9 11V10" />
      <path d="M15 11V10" />
    </svg>
  );

  const CopyIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="white" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="white" />
    </svg>
  );

  const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" fill="white" />
    </svg>
  );

  const isStudentVerified = studentInfo?.verified && studentInfo?.edu_email;

  return (
    <div className="dashboard">
      <div className="container">

        <div className="header">
          <div>
            <YawmiLogo className="logo" />
            {user && <p className="greeting">Welcome, {user.name}</p>}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button className="settings-btn" onClick={() => navigate("/settings")}>My Info</button>
            <button className="logout-btn" onClick={() => { localStorage.clear(); navigate("/login"); }}>Logout</button>
          </div>
        </div>

        {!isStudentVerified && (
          <div className="incomplete-banner" onClick={() => navigate("/settings")}>
            <span className="incomplete-icon">!</span>
            <div>
              <p className="incomplete-title">Complete your student info</p>
              <p className="incomplete-sub">Add your university email to unlock discounts</p>
            </div>
            <span className="incomplete-arrow">→</span>
          </div>
        )}

        <div className="stats">
          <div className="stat-card">
            <div className="stat-icon"><WalletIcon /></div>
            <p className="stat-number">{totalSaved.toLocaleString()} <span className="unit">EGP</span></p>
            <p className="stat-label">Total Saved</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><ReceiptIcon /></div>
            <p className="stat-number">{orders.length}</p>
            <p className="stat-label">Total Visits</p>
          </div>
        </div>

        {discountCode && (
          <div className="discount-card">
            <div className="discount-header">
              <span className="discount-badge">Active Discount Code</span>
              <div className="discount-icon-wrapper"><TicketIcon /></div>
            </div>
            <div className="code-container">
              <p className="discount-code-text">{discountCode.code}</p>
              <button className="copy-btn" onClick={handleCopyCode}>
                {copied ? <CheckIcon /> : <CopyIcon />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
            <p className="discount-place-name">
              {discountCode.places?.name} • {discountCode.places?.discount_amount} EGP discount
            </p>
          </div>
        )}

        <div className="orders-card">
          <h2 className="section-title">Recent Visits</h2>
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrapper"><BagIcon /></div>
              <p className="empty-title">No visits yet</p>
              <span className="empty-hint">Request a discount code from any contracted branch</span>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-row">
                  <div className="order-details">
                    <h3 className="place-name">{order.places?.name}</h3>
                    <span className="place-type">{getTypeLabel(order.places?.type)}</span>
                    <p className="item-name">{order.item}</p>
                    <time className="order-date">{formatDate(order.created_at)}</time>
                  </div>
                  <div className="savings-box">
                    <span className="saved-label">Saved</span>
                    <strong className="saved-amount">{order.discount} EGP</strong>
                    <span className="original-price">{order.price} EGP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <style jsx="true">{`
        .dashboard { min-height: 100vh; background: #f5f5f5; padding: 28px 20px; font-family: 'Inter', 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 20px 24px; border-radius: 36px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03); border: 1px solid #e8e8e8; }
        .logo { font-size: 32px; font-weight: 800; letter-spacing: -0.8px; color: #000000; margin: 0; line-height: 1.1; }
        .greeting { font-size: 13px; color: #5a5a5a; margin: 6px 0 0; font-weight: 450; }
        .settings-btn { background: #fff; color: #000; border: 1.5px solid #000; padding: 8px 16px; border-radius: 60px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .settings-btn:hover { background: #000; color: #fff; }
        .logout-btn { background: #000000; color: #ffffff; border: none; padding: 8px 20px; border-radius: 60px; font-size: 13px; font-weight: 520; cursor: pointer; transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1); }
        .logout-btn:hover { transform: scale(0.96); background: #1f1f1f; }
        .incomplete-banner { display: flex; align-items: center; gap: 12px; background: #fffbf0; border: 1.5px solid #f0a500; border-radius: 24px; padding: 14px 18px; margin-bottom: 20px; cursor: pointer; transition: all 0.2s; }
        .incomplete-banner:hover { background: #fff3d6; transform: translateY(-1px); }
        .incomplete-icon { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #f0a500; color: #f0a500; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; flex-shrink: 0; }
        .incomplete-title { font-size: 14px; font-weight: 700; color: #000; margin: 0; }
        .incomplete-sub { font-size: 12px; color: #666; margin: 2px 0 0; }
        .incomplete-arrow { font-size: 18px; color: #f0a500; margin-left: auto; font-weight: 700; }
        .stats { display: flex; gap: 16px; margin-bottom: 28px; }
        .stat-card { flex: 1; background: #ffffff; border-radius: 28px; padding: 22px 12px; text-align: center; border: 1px solid #eaeef2; transition: all 0.25s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.01); position: relative; overflow: hidden; }
        .stat-card::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: #000000; transform: scaleX(0); transition: transform 0.3s ease; transform-origin: right; }
        .stat-card:hover::after { transform: scaleX(1); transform-origin: left; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.04); border-color: #d0d0d0; }
        .stat-icon { margin-bottom: 12px; display: flex; justify-content: center; opacity: 0.85; }
        .stat-number { font-size: 34px; font-weight: 800; color: #000000; margin: 6px 0 4px; letter-spacing: -0.5px; }
        .unit { font-size: 16px; font-weight: 550; }
        .stat-label { font-size: 12px; color: #6b6b6b; letter-spacing: 0.4px; font-weight: 450; }
        .discount-card { background: #ffffff; border: 1.5px solid #000000; border-radius: 36px; padding: 24px; margin-bottom: 28px; transition: all 0.25s ease; }
        .discount-card:hover { transform: translateY(-2px); box-shadow: 0 14px 28px rgba(0,0,0,0.04); }
        .discount-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .discount-badge { font-size: 11px; text-transform: uppercase; letter-spacing: 1.8px; color: #3c3c3c; background: #f0f0f0; padding: 5px 14px; border-radius: 60px; font-weight: 600; }
        .code-container { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #f8f8f8; padding: 12px 18px; border-radius: 28px; margin: 12px 0; border: 1px solid #e0e0e0; }
        .discount-code-text { font-size: 28px; font-weight: 800; letter-spacing: 4px; font-family: 'SF Mono', 'Fira Code', monospace; color: #000000; margin: 0; direction: ltr; text-align: left; flex: 1; }
        .copy-btn { background: white; border: 1px solid #c0c0c0; padding: 8px 14px; border-radius: 40px; font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; color: #1a1a1a; }
        .copy-btn:hover { background: #000000; color: white; border-color: #000000; }
        .copy-btn:hover svg { stroke: white; }
        .discount-place-name { font-size: 14px; color: #3a3a3a; margin: 8px 0 0; font-weight: 460; text-align: center; }
        .orders-card { background: #ffffff; border-radius: 32px; border: 1px solid #eaeef2; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .section-title { font-size: 19px; font-weight: 700; color: #000000; padding: 20px 24px 12px 24px; margin: 0; border-bottom: 1px solid #efefef; }
        .empty-state { text-align: center; padding: 56px 24px; }
        .empty-icon-wrapper { margin-bottom: 20px; display: inline-block; opacity: 0.8; }
        .empty-title { font-size: 17px; font-weight: 550; color: #2c2c2c; margin: 12px 0 6px; }
        .empty-hint { font-size: 13px; color: #7a7a7a; display: block; }
        .orders-list { display: flex; flex-direction: column; }
        .order-row { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f0f0f0; transition: background 0.2s ease; }
        .order-row:hover { background: #fbfbfb; }
        .order-details { flex: 2; }
        .place-name { font-size: 17px; font-weight: 740; color: #000000; margin: 0 0 6px; }
        .place-type { font-size: 11px; background: #ebebeb; padding: 3px 12px; border-radius: 30px; color: #2b2b2b; display: inline-block; margin-bottom: 8px; font-weight: 500; }
        .item-name { font-size: 13px; color: #3e3e3e; margin: 4px 0 3px; font-weight: 450; }
        .order-date { font-size: 11px; color: #8c8c8c; }
        .savings-box { text-align: left; background: #f6f6f6; padding: 10px 14px; border-radius: 20px; min-width: 100px; transition: all 0.2s; }
        .order-row:hover .savings-box { background: #ececec; }
        .saved-label { font-size: 10px; color: #6a6a6a; display: block; text-transform: uppercase; }
        .saved-amount { font-size: 20px; font-weight: 800; color: #000000; display: block; line-height: 1.2; margin: 3px 0; }
        .original-price { font-size: 11px; text-decoration: line-through; color: #a0a0a0; }
        @media (max-width: 520px) {
          .dashboard { padding: 16px; }
          .stat-number { font-size: 28px; }
          .discount-code-text { font-size: 20px; letter-spacing: 2px; }
          .order-row { flex-direction: column; align-items: flex-start; gap: 14px; }
          .savings-box { text-align: center; width: 90%; }
          .code-container { flex-direction: column; align-items: stretch; }
          .copy-btn { justify-content: center; }
          .stat-card { padding: 16px 8px; }
        }
        .header, .stat-card, .discount-card, .orders-card, .incomplete-banner { animation: floatUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
        .header { animation-delay: 0.02s; }
        .incomplete-banner { animation-delay: 0.06s; }
        .stat-card:first-child { animation-delay: 0.08s; }
        .stat-card:last-child { animation-delay: 0.13s; }
        .discount-card { animation-delay: 0.19s; }
        .orders-card { animation-delay: 0.26s; }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(18px); filter: blur(2px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </div>
  );
}