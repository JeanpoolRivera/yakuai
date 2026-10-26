import { NavLink } from "react-router-dom";
import { Bell, Cloud, Droplets, FlaskConical, Gauge, House, Layers, LogOut, Map, Radio, Users } from "lucide-react";
import { NAVIGATION } from "../../app/navigation";
import { roleLabel } from "../../lib/permissions";
import { initial } from "../../lib/format";
import { Brand } from "./Brand";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = { home: House, gauge: Gauge, map: Map, drop: Droplets, bell: Bell, sensor: Radio, cloud: Cloud, users: Users, layers: Layers, flask: FlaskConical };

export function SidebarContent({ nombre, rol, onExit, onNavigate, compactBrand = false }: { nombre: string; rol: string; onExit: () => void; onNavigate?: () => void; compactBrand?: boolean }): React.JSX.Element {
  return (
    <div className="yaku-sidebar-content">
      <div className="yaku-sidebar-brand"><Brand tone="dark" tagline={!compactBrand}/></div>
      <div className="yaku-sidebar-context"><strong>Decisión de riego</strong><span>Monitoreo y gestión de campo</span></div>
      <nav className="yaku-sidebar-nav" aria-label="Secciones">
        {NAVIGATION.map((group) => <section className="yaku-sidebar-group" key={group.title} aria-label={group.title}>
          <p className="yaku-sidebar-group-title">{group.title}</p><ul className="yaku-sidebar-list">
            {group.items.map((item) => { const Icon = NAV_ICONS[item.icon] ?? House; return <li key={item.to}><NavLink to={item.to} end={item.end} onClick={onNavigate} className="yaku-nav-link"><Icon className="yaku-nav-icon" aria-hidden={true}/><span>{item.label}</span></NavLink></li>; })}
          </ul>
        </section>)}
      </nav>
      <div className="yaku-sidebar-user"><span className="yaku-avatar" aria-hidden="true">{initial(nombre)}</span><div className="yaku-user-copy"><strong>{nombre}</strong><small>{roleLabel(rol)}</small></div><button type="button" className="yaku-icon-button" onClick={onExit} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={18} aria-hidden="true"/></button></div>
    </div>
  );
}