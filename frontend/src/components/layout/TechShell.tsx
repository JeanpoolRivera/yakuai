import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { Toaster } from "@/components/shadcn/toaster";
import { SidebarContent } from "./NavSidebar";
import { Topbar } from "./Topbar";

export function TechShell({ nombre, rol, onExit, crumb, children }: { nombre: string; rol: string; onExit: () => void; crumb: string; children: ReactNode }): React.JSX.Element {
  const location = useLocation(); const [openLocationKey, setOpenLocationKey] = useState<string | null>(null); const navOpen = openLocationKey === location.key; const setNavOpen = (open: boolean): void => setOpenLocationKey(open ? location.key : null); const menuRef = useRef<HTMLButtonElement>(null); const sidebarRef = useRef<HTMLElement>(null); const workRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!navOpen) return;
    const work = workRef.current; const trigger = menuRef.current; const previousOverflow = document.body.style.overflow;
    if (work) work.inert = true; document.body.style.overflow = "hidden";
    (sidebarRef.current?.querySelector<HTMLAnchorElement>('a[aria-current="page"]') ?? sidebarRef.current?.querySelector<HTMLAnchorElement>("nav a[href]"))?.focus();
    const onKeyDown = (event: KeyboardEvent): void => { if (event.key === "Escape") setOpenLocationKey(null); if (event.key !== "Tab") return; const items = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])") ?? []).filter((item) => item.getClientRects().length > 0); const first = items[0]; const last = items.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } };
    const media = matchMedia("(min-width: 1001px)"); const onResize = (): void => { if (media.matches) setOpenLocationKey(null); };
    document.addEventListener("keydown", onKeyDown); media.addEventListener("change", onResize);
    return () => { if (work) work.inert = false; document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); media.removeEventListener("change", onResize); trigger?.focus(); };
  }, [navOpen]);
  useEffect(() => { document.title = crumb + " · YakuAI"; }, [crumb, location.pathname]);
  return <div className="yaku-shell yaku-workspace yaku-shell--staff"><a href="#contenido" className="yaku-skip-link">Saltar al contenido</a>{navOpen ? <button type="button" aria-label="Cerrar navegación" className="yaku-sidebar-backdrop" onClick={() => setNavOpen(false)}/> : null}<aside ref={sidebarRef} id="tecnico-navegacion" role={navOpen ? "dialog" : undefined} aria-modal={navOpen || undefined} aria-label={navOpen ? "Menú de navegación" : "Navegación principal"} className="yaku-sidebar" data-open={navOpen}>{navOpen ? <button type="button" className="yaku-mobile-close" aria-label="Cerrar navegación" onClick={() => setNavOpen(false)}><X size={20} aria-hidden="true"/></button> : null}<SidebarContent nombre={nombre} rol={rol} onExit={onExit} onNavigate={() => setNavOpen(false)} compactBrand={navOpen}/></aside><div className="yaku-main" ref={workRef}><Topbar crumb={crumb} nombre={nombre} rol={rol} onMenu={() => setNavOpen(true)} menuRef={menuRef} menuOpen={navOpen}/><main id="contenido" tabIndex={-1} className="yaku-main-content"><div className="yaku-content-width">{children}</div></main><footer className="yaku-shell-footer"><span>YakuAI · Decisiones de riego</span><span>El sistema recomienda. Tú decides.</span></footer></div><Toaster/></div>;
}