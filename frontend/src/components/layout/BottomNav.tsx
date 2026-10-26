import { NavLink } from "react-router-dom";
import { Bell, Droplets, Gauge, House } from "lucide-react";
import { FARMER_NAVIGATION } from "../../app/navigation";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = { home: House, gauge: Gauge, drop: Droplets, bell: Bell };
export function BottomNav({ variant = "mobile" }: { variant?: "mobile" | "sidebar" }): React.JSX.Element {
  return <nav className={variant === "sidebar" ? "yaku-farmer-sidebar-nav" : "yaku-farmer-mobile-nav"} aria-label="Navegación agricultor"><ul className="yaku-sidebar-list">{FARMER_NAVIGATION.map((item) => { const Icon = NAV_ICONS[item.icon] ?? House; return <li key={item.to}><NavLink to={item.to} end={item.end} className="yaku-nav-link"><Icon className="yaku-nav-icon" aria-hidden={true}/><span>{item.label}</span></NavLink></li>; })}</ul></nav>;
}