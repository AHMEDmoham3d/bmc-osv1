export default function YawmiLogo({ className = "", as: Tag = "h1" }) {
  const letters = ["Y", "a", "w", "m", "i"];

  return (
    <Tag 
      className={className} 
      style={{ 
        display: "inline-flex", 
        direction: "ltr",
        fontSize: "clamp(2rem, 10vw, 4rem)", // Much larger on mobile, scales nicely
        margin: 0,
        lineHeight: 1.2
      }}
    >
      <style>{`
        .yawmi-logo {
          display: inline-flex;
          align-items: baseline;
          gap: 0.08em; /* proportional gap */
          direction: ltr;
        }
        .yawmi-logo-letter {
          display: inline-block;
          will-change: transform, opacity;
          transform-origin: center;
          opacity: 0;
          font-weight: 800; /* bolder for better visibility */
          letter-spacing: -0.02em;
        }
        
        /* Y stays in place, others originate from Y's position */
        @keyframes yawmiYPop {
          0% { opacity: 0; transform: scale(0.7) translateY(12px); filter: blur(3px); }
          60% { opacity: 1; transform: scale(1.05) translateY(-2px); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }

        @keyframes yawmiLetterEmerge {
          0% { opacity: 0; transform: translateX(-8px) translateY(12px) scale(0.5); filter: blur(4px); }
          40% { opacity: 0.8; transform: translateX(2px) translateY(-2px) scale(1.05); filter: blur(0); }
          100% { opacity: 1; transform: translateX(0) translateY(0) scale(1); filter: blur(0); }
        }

        .yawmi-logo-letter[data-i="0"] {
          animation: yawmiYPop 600ms cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
        }
        .yawmi-logo-letter[data-i="1"] {
          animation: yawmiLetterEmerge 540ms cubic-bezier(0.2, 0.9, 0.4, 1.1) 140ms forwards;
        }
        .yawmi-logo-letter[data-i="2"] {
          animation: yawmiLetterEmerge 540ms cubic-bezier(0.2, 0.9, 0.4, 1.1) 220ms forwards;
        }
        .yawmi-logo-letter[data-i="3"] {
          animation: yawmiLetterEmerge 540ms cubic-bezier(0.2, 0.9, 0.4, 1.1) 300ms forwards;
        }
        .yawmi-logo-letter[data-i="4"] {
          animation: yawmiLetterEmerge 540ms cubic-bezier(0.2, 0.9, 0.4, 1.1) 380ms forwards;
        }

        /* Extra large on small screens */
        @media (max-width: 480px) {
          .yawmi-logo-letter {
            font-size: 2.8rem; /* explicit large size for very small phones */
          }
        }

        /* Reduced motion */
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