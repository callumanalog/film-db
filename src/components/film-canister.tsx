import type { FilmStock, FilmBrand, FilmType } from "@/lib/types";

interface FilmCanisterProps {
  stock: FilmStock & { brand?: FilmBrand };
  size?: "sm" | "md" | "lg";
  className?: string;
}

const BRAND_COLORS: Record<string, { primary: string; accent: string; text: string }> = {
  "brand-kodak": { primary: "#F7C948", accent: "#D4232A", text: "#1A1A1A" },
  "brand-fujifilm": { primary: "#00A651", accent: "#1B4D2E", text: "#FFFFFF" },
  "brand-ilford": { primary: "#D12D25", accent: "#1A1A1A", text: "#FFFFFF" },
  "brand-cinestill": { primary: "#E8572A", accent: "#1F1F1F", text: "#FFFFFF" },
  "brand-lomography": { primary: "#6B2FA0", accent: "#2D1350", text: "#FFFFFF" },
  "brand-foma": { primary: "#2563EB", accent: "#1E3A5F", text: "#FFFFFF" },
  "brand-rollei": { primary: "#1A1A1A", accent: "#4A4A4A", text: "#FFFFFF" },
  "brand-adox": { primary: "#0A7E3F", accent: "#0A3D1F", text: "#FFFFFF" },
  "brand-kentmere": { primary: "#5B7FA5", accent: "#2C3E50", text: "#FFFFFF" },
  "brand-bergger": { primary: "#8B6914", accent: "#3D2E06", text: "#FFFFFF" },
  "brand-agfa": { primary: "#E04040", accent: "#2D2D2D", text: "#FFFFFF" },
  "brand-jch": { primary: "#1A1A1A", accent: "#C8102E", text: "#FFFFFF" },
  "brand-washi": { primary: "#D4A574", accent: "#6B4226", text: "#1A1A1A" },
  "brand-silberra": { primary: "#8C8C8C", accent: "#3A3A3A", text: "#FFFFFF" },
  "brand-orwo": { primary: "#003DA5", accent: "#001D52", text: "#FFFFFF" },
  "brand-harman": { primary: "#C41E3A", accent: "#1A1A1A", text: "#FFFFFF" },
  "brand-dubblefilm": { primary: "#FF6B9D", accent: "#4A1942", text: "#FFFFFF" },
  "brand-revolog": { primary: "#9B59B6", accent: "#2C1445", text: "#FFFFFF" },
  "brand-street-candy": { primary: "#2D2D2D", accent: "#FFD700", text: "#FFFFFF" },
  "brand-ferrania": { primary: "#1B5E20", accent: "#0D2E10", text: "#FFFFFF" },
  "brand-kosmo-foto": { primary: "#E65100", accent: "#3E1600", text: "#FFFFFF" },
};

const FALLBACK_COLORS = { primary: "#6B7280", accent: "#374151", text: "#FFFFFF" };

const TYPE_STRIPE: Record<FilmType, string> = {
  color_negative: "#F59E0B",
  color_reversal: "#10B981",
  bw_negative: "#71717A",
  bw_reversal: "#52525B",
  instant: "#0EA5E9",
};

const SIZES = {
  sm: { width: 80, height: 120, fontSize: 7, isoSize: 6, brandSize: 5 },
  md: { width: 120, height: 160, fontSize: 9, isoSize: 8, brandSize: 6 },
  lg: { width: 160, height: 220, fontSize: 12, isoSize: 10, brandSize: 8 },
};

export function FilmCanister({ stock, size = "md", className = "" }: FilmCanisterProps) {
  const colors = BRAND_COLORS[stock.brand_id] || FALLBACK_COLORS;
  const stripe = TYPE_STRIPE[stock.type];
  const s = SIZES[size];

  const canW = s.width * 0.55;
  const canH = s.height * 0.72;
  const canX = (s.width - canW) / 2;
  const canY = s.height * 0.18;
  const capH = s.height * 0.08;
  const capW = canW * 0.7;
  const capX = (s.width - capW) / 2;
  const capR = capH * 0.3;
  const spoolR = canW * 0.12;
  const labelPad = canW * 0.08;

  const displayName = stock.name.length > 16 ? stock.name.slice(0, 15) + "…" : stock.name;

  return (
    <svg
      width={s.width}
      height={s.height}
      viewBox={`0 0 ${s.width} ${s.height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`${stock.name} film canister`}
    >
      {/* Top cap */}
      <rect
        x={capX}
        y={canY - capH + 2}
        width={capW}
        height={capH}
        rx={capR}
        fill="#2A2A2A"
      />
      {/* Spool hub */}
      <circle
        cx={s.width / 2}
        cy={canY - capH + 2 + capH / 2}
        r={spoolR}
        fill="#1A1A1A"
        stroke="#3A3A3A"
        strokeWidth={1}
      />
      <circle
        cx={s.width / 2}
        cy={canY - capH + 2 + capH / 2}
        r={spoolR * 0.4}
        fill="#444"
      />

      {/* Main canister body */}
      <rect
        x={canX}
        y={canY}
        width={canW}
        height={canH}
        rx={canW * 0.06}
        fill="#1E1E1E"
      />

      {/* Brand color label area */}
      <rect
        x={canX + labelPad}
        y={canY + canH * 0.08}
        width={canW - labelPad * 2}
        height={canH * 0.84}
        rx={2}
        fill={colors.accent}
      />

      {/* Accent stripe on left side of label */}
      <rect
        x={canX + labelPad}
        y={canY + canH * 0.08}
        width={canW * 0.15}
        height={canH * 0.84}
        rx={2}
        fill={colors.primary}
      />

      {/* Film type indicator stripe */}
      <rect
        x={canX + labelPad + canW * 0.15}
        y={canY + canH * 0.08}
        width={2}
        height={canH * 0.84}
        fill={stripe}
        opacity={0.7}
      />

      {/* Film name (main text, rotated — only label shown on canister) */}
      <text
        x={canX + labelPad + canW * 0.5}
        y={canY + canH * 0.5}
        fill="#FFFFFF"
        fontSize={s.fontSize}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(-90, ${canX + labelPad + canW * 0.5}, ${canY + canH * 0.5})`}
        letterSpacing="0.3"
      >
        {displayName}
      </text>

      {/* ISO badge at bottom of label */}
      <rect
        x={canX + canW * 0.3}
        y={canY + canH * 0.78}
        width={canW * 0.4}
        height={canH * 0.1}
        rx={canH * 0.02}
        fill="rgba(255,255,255,0.15)"
      />
      <text
        x={canX + canW * 0.5}
        y={canY + canH * 0.835}
        fill="#FFFFFF"
        fontSize={s.isoSize}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
        opacity={0.9}
      >
        ISO {stock.iso}
      </text>

      {/* Bottom cap */}
      <rect
        x={capX}
        y={canY + canH - 2}
        width={capW}
        height={capH}
        rx={capR}
        fill="#2A2A2A"
      />

      {/* Subtle canister edge highlights */}
      <rect
        x={canX}
        y={canY}
        width={1.5}
        height={canH}
        rx={0.5}
        fill="rgba(255,255,255,0.08)"
      />
      <rect
        x={canX + canW - 1.5}
        y={canY}
        width={1.5}
        height={canH}
        rx={0.5}
        fill="rgba(0,0,0,0.3)"
      />
    </svg>
  );
}
