import { Link } from "react-router-dom";
import { ChevronRight, Menu } from "lucide-react";
import { initial } from "../../lib/format";
import { roleLabel } from "../../lib/permissions";

export function Topbar({ crumb, nombre, rol, onMenu, menuRef, menuOpen, navigationId = "tecnico-navegacion" }: {
  crumb: string; nombre: string; rol: string; onMenu: () => void; menuRef?: React.Ref<HTMLButtonElement>; menuOpen: boolean; navigationId?: string;
}): React.JSX.Element {
  return (
    <header className="yaku-topbar">
      <button ref={menuRef} type="button" onClick={onMenu} aria-label={menuOpen ? "Cerrar navegación" : "Abrir navegación"} aria-expanded={menuOpen} aria-controls={navigationId} className="yaku-topbar-menu"><Menu size={20} aria-hidden="true"/></button>
      <nav className="yaku-breadcrumb" aria-label="Miga de pan"><Link to="/">YakuAI</Link><ChevronRight size={15} aria-hidden="true"/><span aria-current="page">{crumb}</span></nav>
      <div className="yaku-topbar-user"><span className="yaku-avatar" aria-hidden="true">{initial(nombre)}</span><span className="yaku-topbar-user-copy"><strong>{nombre}</strong><small>{roleLabel(rol)}</small></span></div>
    </header>
  );
}