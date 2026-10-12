import { Link } from "react-router-dom";
import { LoginIcon } from "../login-icons";
import { initial, todayShort } from "../../lib/format";

export function Topbar({
  crumb,
  nombre,
  onMenu,
  menuRef,
}: {
  crumb: string;
  nombre: string;
  onMenu: () => void;
  menuRef?: React.Ref<HTMLButtonElement>;
}): React.JSX.Element {
  return (
    <header className="workspace-topbar sticky top-0 z-20 flex min-h-[68px] items-center gap-4 border-b border-neutral-200 bg-[#ffffffef] px-8 py-3 backdrop-blur-md max-[1000px]:px-6 max-[700px]:min-h-16 max-[700px]:gap-2.5 max-[700px]:px-4 max-[700px]:py-2.5">
      <button
        ref={menuRef}
        type="button"
        onClick={onMenu}
        aria-label="Abrir navegación"
        className="grid h-11 w-11 min-w-11 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 min-[1001px]:hidden"
      >
        <LoginIcon name="menu" size={18} />
      </button>
      <nav aria-label="Miga de pan" className="flex min-w-0 flex-1 items-center gap-3">
        <Link to="/" className="whitespace-nowrap text-xs text-neutral-600 hover:text-neutral-800 max-[700px]:hidden">
          Mi espacio
        </Link>
        <span aria-hidden="true" className="text-neutral-600 max-[700px]:hidden">
          <LoginIcon name="chevron" size={12} />
        </span>
        <span aria-current="page" className="truncate text-xs font-semibold text-neutral-800">
          {crumb}
        </span>
      </nav>
      <div className="flex items-center gap-4 max-[700px]:gap-0">
        <span className="flex items-center gap-2 whitespace-nowrap text-xs text-neutral-600 max-[700px]:hidden">
          <LoginIcon name="calendar" size={16} />
          {todayShort()}
        </span>
        <span aria-hidden="true" className="h-6 w-px bg-neutral-200 max-[700px]:hidden" />
        <span
          aria-label={nombre}
          className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[7px] border border-primary-100 bg-primary-50 text-[13px] font-semibold text-primary-800"
        >
          {initial(nombre)}
        </span>
      </div>
    </header>
  );
}