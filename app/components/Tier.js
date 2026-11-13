import { TIERS } from "../../lib/figures";

export default function Tier({ tier, label }) {
  const t = TIERS[tier] || TIERS.unverified;
  return (
    <span className="tier" style={{ color: t.color }}>
      <span className="tier-dot" style={{ background: t.dot }} />
      {label || t.label}
    </span>
  );
}
