import { useState } from "react";
import { supabase } from "./supabase";
import YawmiLogo from "../components/YawmiLogo";

const StoreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const TagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const ReceiptIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 21L8 19L10 21L12 19L14 21L16 19L18 21V5C18 3.89543 17.1046 3 16 3H8C6.89543 3 6 3.89543 6 5V21Z" />
    <path d="M9 8H15" />
    <path d="M9 12H15" />
    <path d="M9 16H12" />
  </svg>
);

function getTypeLabel(type) {
  if (type === "restaurant") return "Restaurant";
  if (type === "gym") return "Gym";
  if (type === "beach") return "Beach";
  if (type === "court") return "Court";
  return type;
}

export default function Cashier() {
  const [placeCode, setPlaceCode] = useState("");
  const [place, setPlace] = useState(null);
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [user, setUser] = useState(null);
  const [discountCode, setDiscountCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [item, setItem] = useState("");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");

  async function handlePlaceLogin() {
    if (!placeCode) {
      setError("Please enter the place code");
      return;
    }
    setLoading(true);
    setError("");
    const { data } = await supabase.from("places").select("*").eq("cashier_code", placeCode).single();
    if (!data) {
      setError("Invalid place code");
      setLoading(false);
      return;
    }
    setPlace(data);
    setLoading(false);
  }

  async function handleFindUser() {
    if (!phone) {
      setError("Please enter the customer mobile number");
      return;
    }
    setLoading(true);
    setError("");
    const { data: userData } = await supabase.from("users").select("*").eq("phone", phone).single();
    if (!userData) {
      setError("This user is not registered");
      setLoading(false);
      return;
    }
    setUser(userData);

    const { data: existingCode } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("user_id", userData.id)
      .eq("place_id", place.id)
      .eq("used", false)
      .single();

    if (existingCode) {
      setDiscountCode(existingCode);
    } else {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      const { data: newCode } = await supabase
        .from("discount_codes")
        .insert({
          user_id: userData.id,
          code,
          place: place.name,
          place_id: place.id,
        })
        .select()
        .single();
      setDiscountCode(newCode);
    }

    setStep("confirm");
    setLoading(false);
  }

  async function handleConfirm() {
    if (place.type === "restaurant" && !item) {
      setError("Please enter the dish/order name");
      return;
    }
    if (!price) {
      setError("Please enter the price");
      return;
    }
    if (place.type === "court" && !hours) {
      setError("Please enter the number of hours");
      return;
    }

    setLoading(true);

    await supabase.from("discount_codes").update({ used: true }).eq("id", discountCode.id);

    await supabase.from("visits").insert({
      user_id: user.id,
      place_id: place.id,
      discount_used: place.discount_amount,
    });

    await supabase.from("orders").insert({
      user_id: user.id,
      place_id: place.id,
      place: place.name,
      item:
        place.type === "restaurant"
          ? item
          : place.type === "court"
            ? `${hours} hour`
            : place.type === "gym"
              ? item
              : item,
      price: Number(price),
      discount: place.discount_amount,
    });

    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      setStep("phone");
      setPhone("");
      setUser(null);
      setDiscountCode(null);
      setItem("");
      setPrice("");
      setHours("");
      setSuccess(false);
    }, 3000);
  }

  if (!place) {
    return (
      <div className="cashier-page">
        <div className="cashier-card">
          <div className="logo-wrapper">
            <YawmiLogo className="logo" />
            <div className="logo-underline"></div>
          </div>
          <p className="subtitle">Place Login</p>

          <div className="form-group">
            <label className="form-label">
              <StoreIcon />
              <span>Place code</span>
            </label>
            <input
              className="form-input"
              placeholder="XXXX"
              value={placeCode}
              onChange={(e) => setPlaceCode(e.target.value)}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button className="submit-btn" onClick={handlePlaceLogin} disabled={loading}>
            {loading ? <span className="loading-spinner"></span> : "Login"}
          </button>
        </div>

        <style jsx="true">{css}</style>
      </div>
    );
  }

  if (success) {
    return (
      <div className="cashier-page">
        <div className="cashier-card success-card">
          <div className="success-box">
            <div className="success-icon-wrapper">✓</div>
            <p className="success-title">Operation recorded</p>
            <p className="success-sub">
              You saved {place.discount_amount} EGP for {user?.name}
            </p>
          </div>
        </div>
        <style jsx="true">{css}</style>
      </div>
    );
  }

  return (
    <div className="cashier-page">
      <div className="cashier-card">
        <div className="header-row">
          <YawmiLogo className="logo-small" />
          <div className="place-badge">{place.name}</div>
        </div>

        <p className="discount-info">
          <TagIcon />
          <span>
            Discount: {place.discount_amount} EGP • {getTypeLabel(place.type)}
          </span>
        </p>

        {step === "phone" && (
          <>
            <div className="form-group">
              <label className="form-label">
                <PhoneIcon />
                <span>Customer mobile number</span>
              </label>
              <input
                className="form-input"
                placeholder="01xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button className="submit-btn" onClick={handleFindUser} disabled={loading}>
              {loading ? <span className="loading-spinner"></span> : "Next"}
            </button>
          </>
        )}

        {step === "confirm" && user && (
          <>
            <div className="user-card">
              <div className="user-icon">
                <UserIcon />
              </div>

              <div className="user-info">
                <p className="user-name">{user.name}</p>
                <p className="user-phone">{user.phone}</p>
              </div>

              <div className="discount-code-chip">
                <span className="chip-label">Discount code</span>
                <strong className="chip-code">{discountCode?.code}</strong>
              </div>
            </div>

            {place.type === "restaurant" && (
              <div className="form-group">
                <label className="form-label">Dish / Order</label>
                <input
                  className="form-input"
                  placeholder="e.g. Burger + Fries"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                />
              </div>
            )}

            {place.type === "court" && (
              <div className="form-group">
                <label className="form-label">Number of hours</label>
                <input
                  className="form-input"
                  placeholder="e.g. 2"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>
            )}

            {place.type === "gym" && (
              <div className="form-group">
                <label className="form-label">Membership type</label>
                <select className="form-input" value={item} onChange={(e) => setItem(e.target.value)}>
                  <option value="">Select membership type</option>
                  <option value="single session">Single session</option>
                  <option value="month">Month</option>
                  <option value="3 months">3 months</option>
                  <option value="6 months">6 months</option>
                  <option value="year">Year</option>
                </select>
              </div>
            )}

            {place.type === "beach" && (
              <div className="form-group">
                <label className="form-label">Package type</label>
                <select className="form-input" value={item} onChange={(e) => setItem(e.target.value)}>
                  <option value="">Select a package</option>
                  <option value="entry only">Entry only</option>
                  <option value="entry + chair">Entry + Chair</option>
                  <option value="entry + chair + drink">Entry + Chair + Drink</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <ReceiptIcon />
                <span>Price after discount</span>
              </label>
              <input
                className="form-input"
                placeholder="In EGP"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button className="submit-btn" onClick={handleConfirm} disabled={loading}>
              {loading ? <span className="loading-spinner"></span> : "Confirm & apply discount"}
            </button>

            <button
              className="back-btn"
              onClick={() => {
                setStep("phone");
                setPhone("");
                setUser(null);
                setError("");
              }}
            >
              Back
            </button>
          </>
        )}
      </div>

      <style jsx="true">{css}</style>
    </div>
  );
}

const css = `
  .cashier-page {
    min-height: 100vh;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: 'Inter', 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    direction: rtl;
  }

  .cashier-card {
    background: #ffffff;
    border-radius: 48px;
    padding: 40px 32px;
    width: 100%;
    max-width: 500px;
    border: 1px solid #e8e8e8;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.01);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    animation: cardFloat 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  }

  .cashier-card:hover {
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
    margin-bottom: 16px;
  }

  .logo {
    font-size: 48px;
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

  .cashier-card:hover .logo-underline {
    width: 72px;
    opacity: 0.6;
  }

  .subtitle {
    font-size: 15px;
    color: #5a5a5a;
    text-align: center;
    margin-bottom: 32px;
    font-weight: 450;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .logo-small {
    font-size: 28px;
    font-weight: 800;
    color: #000000;
    margin: 0;
  }

  .place-badge {
    background: #000000;
    color: #ffffff;
    padding: 6px 18px;
    border-radius: 40px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .discount-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #4a4a4a;
    background: #f6f6f6;
    padding: 10px 16px;
    border-radius: 60px;
    margin-bottom: 28px;
  }

  .form-group {
    margin-bottom: 22px;
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

  .form-input::placeholder,
  select.form-input {
    color: #2c2c2c;
  }

  select.form-input option {
    color: #000000;
    background: white;
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

  .submit-btn, .back-btn {
    width: 100%;
    padding: 14px 20px;
    border-radius: 60px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.23, 1, 0.32, 1);
    font-family: inherit;
    margin-top: 8px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .submit-btn {
    background: #000000;
    color: #ffffff;
    border: none;
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

  .back-btn {
    background: #ffffff;
    color: #000000;
    border: 1.5px solid #000000;
    margin-top: 12px;
  }

  .back-btn:hover {
    background: #f8f8f8;
    transform: scale(0.97);
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

  .user-card {
    background: #f8f8f8;
    border-radius: 32px;
    padding: 20px;
    margin-bottom: 28px;
    border: 1px solid #ececec;
    transition: all 0.2s;
  }

  .user-icon {
    margin-bottom: 12px;
  }

  .user-name {
    font-size: 18px;
    font-weight: 800;
    color: #000000;
    margin: 0 0 4px;
  }

  .user-phone {
    font-size: 13px;
    color: #5a5a5a;
    margin: 0 0 16px;
  }

  .discount-code-chip {
    background: #000000;
    border-radius: 60px;
    padding: 10px 16px;
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  .chip-label {
    font-size: 11px;
    color: rgba(255,255,255,0.7);
    letter-spacing: 0.5px;
  }

  .chip-code {
    font-size: 20px;
    font-weight: 800;
    font-family: monospace;
    letter-spacing: 2px;
    color: #ffffff;
  }

  .success-card {
    text-align: center;
  }

  .success-box {
    padding: 20px 0;
  }

  .success-icon-wrapper {
    font-size: 56px;
    font-weight: 800;
    color: #000000;
    margin-bottom: 16px;
  }

  .success-title {
    font-size: 24px;
    font-weight: 800;
    color: #000000;
    margin: 0 0 8px;
  }

  .success-sub {
    font-size: 14px;
    color: #5a5a5a;
  }

  @media (max-width: 520px) {
    .cashier-card {
      padding: 32px 24px;
      border-radius: 36px;
    }
    .logo {
      font-size: 40px;
    }
    .form-input {
      padding: 12px 16px;
    }
    .chip-code {
      font-size: 16px;
    }
  }
`;

