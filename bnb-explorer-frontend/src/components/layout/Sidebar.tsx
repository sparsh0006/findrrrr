"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/transactions", label: "Transactions", icon: "🔄" },
];

const viewItems = [
  { tab: "large", label: "Whale Transfers", icon: "🐋" },
  { tab: "tokens", label: "Token Transfers", icon: "🪙" },
  { tab: "failed", label: "Failed Txns", icon: "❌" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{ width: 220, minHeight: "100vh", background: "#0d1117", borderRight: "1px solid #1e2d3d", position: "fixed", top: 0, left: 0, zIndex: 100, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1e2d3d" }}>
        <div style={{ width: 32, height: 32, background: "#f0b90b", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#000", flexShrink: 0 }}>B</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.05em" }}>BNB Explorer</div>
          <div style={{ fontSize: 10, color: "#f0b90b", letterSpacing: "0.1em", textTransform: "uppercase" }}>Smart Chain</div>
        </div>
      </div>

      <nav style={{ padding: "12px 0", flex: 1 }}>
        <div style={{ padding: "8px 16px 4px", fontSize: 10, color: "#484f58", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>Navigation</div>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 16px",
              borderLeft: `2px solid ${active ? "#f0b90b" : "transparent"}`,
              color: active ? "#f0b90b" : "#8b949e",
              background: active ? "rgba(240,185,11,0.08)" : "transparent",
              fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              <span style={{ width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <div style={{ padding: "16px 16px 4px", fontSize: 10, color: "#484f58", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>Views</div>
        {viewItems.map((item) => (
          <div key={item.tab}
            onClick={() => { window.location.href = `/transactions?tab=${item.tab}`; }}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderLeft: "2px solid transparent", color: "#8b949e", fontSize: 13, fontWeight: 600, cursor: "pointer", userSelect: "none" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#161e28"; e.currentTarget.style.color = "#e6edf3"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8b949e"; }}>
            <span style={{ width: 20, textAlign: "center" }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      <div style={{ padding: "12px 16px", borderTop: "1px solid #1e2d3d", fontSize: 11, color: "#484f58" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ display: "inline-block", width: 6, height: 6, background: "#0ecb81", borderRadius: "50%" }} />
          <span style={{ color: "#0ecb81", fontWeight: 700 }}>Live</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10 }}>BSC Mainnet</span>
        </div>
        <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace" }}>v1.0.0</div>
      </div>
    </aside>
  );
}