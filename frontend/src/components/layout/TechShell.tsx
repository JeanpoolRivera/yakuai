import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { LoginIcon } from "../login-icons";
import { Toaster } from "@/components/shadcn/toaster";
import { SidebarContent } from "./NavSidebar";
import { Topbar } from "./Topbar";

export function TechShell({
  nombre,
  rol,
  onExit,
  crumb,
  children,
}: {
  nombre: string;
  rol: string;
  onExit: () => void;
  crumb: string;
  children: ReactNode;
}): React.JSX.Element {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const workRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navOpen) return;
    const work = workRef.current;
    const trigger = menuRef.current;
    const previous = document.body.style.overflow;
    if (work) work.inert = true;
    document.body.style.overflow = "hidden";
    (sidebarRef.current?.querySelector<HTMLAnchorElement>('a[aria-current="page"]') ??
      sidebarRef.current?.querySelector<HTMLAnchorElement>("nav a[href]"))?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setNavOpen(false);
      if (e.key !== "Tab") return;
      const items = Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])") ?? []
      ).filter((el) => el.getClientRects().length > 0);
      const first = items[0], last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    const media = matchMedia("(min-width: 1001px)");
    const onResize = (): void => { if (media.matches) setNavOpen(false); };
    document.addEventListener("keydown", onKey);
    media.addEventListener("change", onResize);
    return () => {
      if (work) work.inert = false;
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      media.removeEventListener("change", onResize);
      trigger?.focus();
    };
  }, [navOpen]);

  useEffect(() => {
    document.title = `${crumb} · YakuAI`;
  }, [crumb, location.pathname]);

  return (
    <div className="yaku-workspace flex min-h-dvh bg-neutral-100">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[900] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-700 focus:shadow-toast"
      >
        Saltar al contenido
      </a>
      {navOpen ? (
        <button
          type="button"
          aria-label="Cerrar navegación"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-[80] border-0 bg-[#122c3d66] min-[1001px]:hidden"
        />
      ) : null}
      <aside
        ref={sidebarRef}
        aria-label="Navegación principal"
        className="workspace-sidebar invisible fixed bottom-0 left-0 top-0 z-[90] flex w-[min(300px,calc(100vw-44px))] -translate-x-full flex-col bg-white transition-transform duration-200 data-[open=true]:visible data-[open=true]:translate-x-0 min-[1001px]:visible min-[1001px]:sticky min-[1001px]:top-0 min-[1001px]:h-dvh min-[1001px]:w-[248px] min-[1001px]:shrink-0 min-[1001px]:translate-x-0 min-[1001px]:border-r min-[1001px]:border-neutral-200 min-[1001px]:transition-none"
        data-open={navOpen}
      >
        <div className="relative flex h-full flex-col min-[1001px]:static">
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            aria-label="Cerrar navegación"
            className="absolute right-3 top-6 grid h-11 w-11 min-w-11 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 min-[1001px]:hidden"
          >
            <LoginIcon name="x" size={18} />
          </button>
          <div className="h-full min-[1001px]:[&>:first-child]:pr-0 [&>:first-child]:pr-16">
            <SidebarContent nombre={nombre} rol={rol} onExit={onExit} onNavigate={() => setNavOpen(false)} compactBrand />
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col" ref={workRef}>
        <Topbar crumb={crumb} nombre={nombre} onMenu={() => setNavOpen(true)} menuRef={menuRef} />
        <main id="contenido" tabIndex={-1} className="workspace-main min-w-0 flex-1 px-[clamp(24px,3vw,44px)] py-8 focus:outline-none max-[1000px]:px-6 max-[1000px]:py-7 max-[700px]:px-4 max-[700px]:py-6">
          {children}
        </main>
        <footer className="flex flex-wrap justify-between gap-4 border-t border-neutral-200 px-8 py-5 text-[10px] text-neutral-600 max-[700px]:px-4">
          <span>YakuAI · Gestión del riego</span>
          <span className="max-[700px]:hidden">Información para decidir. Tú cuidas el campo.</span>
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
