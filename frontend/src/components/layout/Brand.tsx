import { Link } from "react-router-dom";
import { LoginIcon } from "../login-icons";
import { cn } from "@/lib/utils";

/* Marca exacta v2 (shell.css .brand + overrides .access-story). */
export function Brand({ tone = "light", tagline = true }: { tone?: "light" | "dark"; tagline?: boolean }): React.JSX.Element {
  const dark = tone === "dark";
  return (
    <Link to="/" aria-label="YakuAI inicio" className="inline-flex items-center gap-2.5 no-underline">
      <span
        aria-hidden="true"
        className="grid h-11 w-10 place-items-center rounded-[12px_12px_12px_3px] text-dark-accent"
        style={dark ? { background: "#ffffff0c", border: "1px solid #ffffff25" } : { background: "#103e38" }}
      >
        <LoginIcon name="drop" size={25} />
      </span>
      <span className={cn("text-[30px] font-[750] leading-none tracking-[-1.5px]", dark ? "text-white" : "text-primary-950")}>
        yaku<span className={cn("font-[400]", dark ? "text-dark-accent" : "text-primary-600")}>ai</span>
        {tagline ? (
          <small className={cn("mt-2 block text-[7px] font-[650] tracking-[1px]", dark ? "text-dark-muted" : "text-neutral-600")}>
            INTELIGENCIA PARA TU CAMPO
          </small>
        ) : null}
      </span>
    </Link>
  );
}