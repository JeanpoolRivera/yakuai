import type { ReactNode } from "react";
import { LoginIcon } from "../login-icons";
import { roleLabel } from "../../lib/permissions";
import { initial, todayLong } from "../../lib/format";
import { Brand } from "./Brand";
import { BottomNav } from "./BottomNav";
import { Toaster } from "@/components/shadcn/toaster";

export function FarmerShell({
  nombre,
  rol,
  onExit,
  children,
}: {
  nombre: string;
  rol: string;
  onExit: () => void;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[900] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-700 focus:shadow-toast"
      >
        Saltar al contenido
      </a>
      <header className="border-b border-neutral-200 bg-white px-6 py-[22px] max-[700px]:px-4 max-[700px]:py-[18px]">
        <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-5">
          <span className="[&>a>span:last-child]:max-[700px]:text-[26px] [&_small]:max-[700px]:hidden">
            <Brand />
          </span>
          <div className="flex min-w-0 items-center gap-2.5 max-[700px]:gap-2">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 flex-none place-items-center rounded-[7px] border border-primary-100 bg-primary-50 text-[13px] font-semibold text-primary-800 max-[700px]:hidden"
            >
              {initial(nombre)}
            </span>
            <div className="min-w-0">
              <strong className="block truncate text-[13px] text-neutral-800 max-[700px]:max-w-[100px]">{nombre}</strong>
              <small className="mt-[3px] block truncate text-[11px] text-neutral-600 max-[700px]:text-[10px]">
                {`${roleLabel(rol)} · Mi campo`}
              </small>
            </div>
            <button
              type="button"
              onClick={onExit}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="grid h-11 w-11 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15"
            >
              <LoginIcon name="logout" size={18} />
            </button>
          </div>
        </div>
      </header>
      <p className="mx-auto flex w-full max-w-[1088px] items-center gap-2 px-6 pt-6 text-xs capitalize text-neutral-600 max-[700px]:px-4 max-[700px]:pt-5">
        <LoginIcon name="calendar" size={15} />
        {todayLong()}
      </p>
      <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-[1088px] px-6 py-6 pb-[120px] focus:outline-none max-[700px]:px-4 max-[700px]:py-5 max-[700px]:pb-[120px]">
        {children}
      </main>
      <BottomNav />
      <Toaster />
    </div>
  );
}