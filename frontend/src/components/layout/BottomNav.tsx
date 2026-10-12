import { NavLink } from "react-router-dom";
import { LoginIcon } from "../login-icons";
import { FARMER_NAVIGATION } from "../../app/navigation";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<string, string> = {
  home: "home",
  gauge: "gauge",
  drop: "drop",
  bell: "bell",
};

export function BottomNav(): React.JSX.Element {
  return (
    <nav
      aria-label="Navegación agricultor"
      style={{ gridTemplateColumns: `repeat(${FARMER_NAVIGATION.length},minmax(0,1fr))` }}
      className="fixed bottom-5 left-1/2 z-[20] grid w-[min(520px,calc(100%-32px))] -translate-x-1/2 gap-1 rounded-[14px] border border-neutral-200 bg-white p-1.5 shadow-[0_12px_40px_rgba(23,43,54,0.09)] max-[700px]:bottom-0 max-[700px]:w-full max-[700px]:rounded-none max-[700px]:border-x-0 max-[700px]:border-b-0 max-[700px]:pb-[calc(6px+env(safe-area-inset-bottom))]"
    >
      {FARMER_NAVIGATION.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-[7px] px-1 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600/25",
              isActive ? "bg-primary-50 text-primary-800" : "text-neutral-600 hover:text-neutral-800"
            )
          }
        >
          <LoginIcon name={NAV_ICONS[item.icon] ?? "info"} size={21} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}