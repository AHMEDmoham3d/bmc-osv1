export default function YawmiLogo({ className = "", as: Tag = "h1" }) {
  const letters = ["Y", "a", "w", "m", "i"];

  return (
    <Tag className={className} style={{ display: "inline-flex", gap: 0 }}>
      <style>{`
        .yawmi-logo { display: inline-flex; align-items: baseline; gap: 0; }
        .yawmi-logo-letter {
          display: inline-block;
          will-change: transform, opacity;
          transform-origin: center;
          opacity: 0;
        }
        /* Y appears first */
        @keyframes yawmiYIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.96); filter: blur(2px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        /* Remaining letters "exit" with a smart stagger */
        @keyframes yawmiOut {
          0% { opacity: 0; transform: translateX(0) translateY(8px) scale(0.96); filter: blur(2px); }
          100% { opacity: 1; transform: translateX(var(--dx, 0px)) translateY(var(--dy, -2px)) scale(1); filter: blur(0); }
        }

        .yawmi-logo-letter[data-i="0"] { animation: yawmiYIn 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .yawmi-logo-letter[data-i="1"] { --dx: -2px; --dy: -3px; animation: yawmiOut 560ms cubic-bezier(0.16, 1, 0.3, 1) 120ms forwards; }
        .yawmi-logo-letter[data-i="2"] { --dx: 3px; --dy: -4px; animation: yawmiOut 560ms cubic-bezier(0.16, 1, 0.3, 1) 170ms forwards; }
        .yawmi-logo-letter[data-i="3"] { --dx: -1px; --dy: -2px; animation: yawmiOut 560ms cubic-bezier(0.16, 1, 0.3, 1) 220ms forwards; }
        .yawmi-logo-letter[data-i="4"] { --dx: 2px; --dy: -3px; animation: yawmiOut 560ms cubic-bezier(0.16, 1, 0.3, 1) 270ms forwards; }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .yawmi-logo-letter { opacity: 1 !important; animation: none !important; transform: none !important; filter: none !important; }
        }
      `}</style>

      <span className="yawmi-logo">
        {letters.map((ch, i) => (
          <span key={i} className="yawmi-logo-letter" data-i={i}>
            {ch}
          </span>
        ))}
      </span>
    </Tag>
  );
}

