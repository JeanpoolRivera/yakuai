import { NavLink } from "react-router-dom";
import { NAVIGATION } from "../../app/navigation";
import { roleLabel } from "../../lib/permissions";
import { initial } from "../../lib/format";
import { LoginIcon } from "../login-icons";
import { Brand } from "./Brand";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<string, string> = {
  home: "home",
  gauge: "gauge",
  map: "map",
  drop: "drop",
  bell: "bell",
  sensor: "sensor",
  cloud: "cloud",
  users: "users",
  layers: "layers",
  flask: "flask",
};

export function SidebarContent({
  nombre,
  rol,
  onExit,
  onNavigate,
  compactBrand = false,
}: {
  nombre: string;
  rol: string;
  onExit: () => void;
  onNavigate?: () => void;
  compactBrand?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex h-full flex-col">
      <div className="px-[22px] pb-[22px] pt-7 min-[1001px]:[@media(max-height:820px)]:px-[22px] min-[1001px]:[@media(max-height:820px)]:pb-[22px] min-[1001px]:[@media(max-height:820px)]:pt-[18px]">
        <Brand tagline={!compactBrand} />
      </div>
      <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-[7px] border border-neutral-200 bg-neutral-50 p-3 min-[1001px]:[@media(max-height:820px)]:mb-3 min-[1001px]:[@media(max-height:820px)]:p-2">
        <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center text-primary-700">
          <LoginIcon name="sprout" size={21} />
        </span>
        <div className="min-w-0">
          <strong className="block text-xs font-semibold text-neutral-800">Espacio de campo</strong>
          <span className="mt-[3px] block text-[10px] text-neutral-600">Chupaca, Junín · Perú</span>
        </div>
      </div>
      <nav className="min-h-0 flex-1 space-y-[22px] overflow-y-auto px-3 pb-4 [scrollbar-width:thin] min-[1001px]:[@media(max-height:820px)]:space-y-3" aria-label="Secciones">
        {NAVIGATION.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[10px] font-semibold text-neutral-600 min-[1001px]:[@media(max-height:820px)]:pb-1">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={cn(
                      "my-0.5 flex min-h-11 items-center gap-3 rounded-[7px] border border-transparent px-3 py-2.5 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15",
                      "min-[1001px]:[@media(max-height:820px)]:my-0",
                      "[&>svg]:text-neutral-600 [&.active]:border-primary-100 [&.active]:bg-primary-50 [&.active]:font-[650] [&.active]:text-primary-800 [&.active>svg]:text-primary-700"
                    )}
                  >
                    <LoginIcon name={NAV_ICONS[item.icon] ?? "info"} size={19} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <p className="mx-6 my-3 flex items-center gap-2 text-[10px] text-neutral-600 min-[1001px]:[@media(max-height:820px)]:hidden">
        <LoginIcon name="drop" size={16} />
        <span>Cada gota, una mejor decisión.</span>
      </p>
      <div className="flex items-center gap-2.5 border-t border-neutral-200 p-4 min-[1001px]:[@media(max-height:820px)]:px-4 min-[1001px]:[@media(max-height:820px)]:py-3">
        <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-[7px] border border-primary-100 bg-primary-50 text-[13px] font-semibold text-primary-800">
          {initial(nombre)}
        </span>
        <div className="grid min-w-0 flex-1 gap-[3px]">
          <strong className="truncate text-xs font-semibold text-neutral-800">{nombre}</strong>
          <small className="truncate text-[11px] text-neutral-600">{roleLabel(rol)}</small>
        </div>
        <button
          type="button"
          onClick={onExit}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="grid h-8 w-8 min-w-8 place-items-center border-0 bg-transparent text-neutral-600 transition-colors hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15"
        >
          <LoginIcon name="logout" size={18} />
        </button>
      </div>
    </div>
  );
}
