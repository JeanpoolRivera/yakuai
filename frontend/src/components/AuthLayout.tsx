import type { ReactNode } from "react";
import { LoginIcon } from "./login-icons";
import { Brand } from "./layout/Brand";

/* Shell de acceso: réplica EXACTA v2 (login.css) con Tailwind v4. */
export function AuthLayout({
  children,
  footer,
  recovery = false,
}: {
  children: ReactNode;
  footer: ReactNode;
  recovery?: boolean;
}): React.JSX.Element {
  return (
    <main className="grid min-h-dvh bg-white min-[761px]:grid-cols-2 max-[760px]:block max-[760px]:bg-neutral-50">
      {/* === PANEL IZQUIERDO: STORY === */}
      <section className="min-w-0 flex flex-col bg-primary-950 px-[clamp(32px,5vw,80px)] pt-10 pb-7 text-white max-[760px]:hidden min-[761px]:flex" aria-labelledby="access-story-title">
        <Brand tone="dark" />
        <div className="my-auto w-full pt-[48px] pb-[36px] min-[761px]:[@media(max-height:760px)]:py-[28px_0]">
          <p className="mb-6 flex items-center gap-2 text-[10px] font-semibold tracking-[.12em] text-dark-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-dark-accent" aria-hidden="true" />
            AGRICULTURA CON INFORMACIÓN
          </p>
          <h2 id="access-story-title" className="text-[clamp(38px,4.4vw,64px)] font-medium leading-[1.05] tracking-[-.055em] max-[1100px]:text-[44px] min-[761px]:[@media(max-height:760px)]:text-[40px]">
            {recovery ? "Volvamos a tu campo." : <>Decide mejor.<br />Cuida cada <em className="not-italic text-dark-accent">gota.</em></>}
          </h2>
          <p className="mt-6 max-w-[390px] text-[15px] leading-[1.85] text-dark-muted">
            {recovery ? "Recupera tu acceso y continúa con el cuidado de tus parcelas." : "Tu suelo, tus cultivos y el clima, en un solo lugar. Información clara para saber cuándo y cuánto regar."}
          </p>
          <div className="mt-[30px] mb-2 max-w-[460px] max-[1100px]:mt-4 max-[1100px]:max-w-[320px] min-[761px]:[@media(max-height:760px)]:mt-4 min-[761px]:[@media(max-height:760px)]:max-w-[320px]" aria-hidden="true">
            <svg viewBox="0 0 480 240" fill="none" className="block h-auto w-full overflow-visible">
              <path d="m20 147 225-116 215 110-222 116Z" fill="#1b5247" stroke="#598378" />
              <path d="m20 147 218 110v15L20 162Z" fill="#0a2b27" /><path d="m238 257 222-116v15L238 272Z" fill="#123c33" />
              <path d="m42 148 98-50 84 43-99 51Z" fill="#82a98a" /><path d="m157 89 90-46 87 45-92 47Z" fill="#416f5c" />
              <path d="m143 201 98-52 87 44-100 53Z" fill="#305f4e" /><path d="m261 140 91-47 87 46-93 47Z" fill="#a7bf82" />
              <g stroke="#e0eabd" opacity=".5"><path d="m63 150 75-38m-56 49 75-38m-56 49 75-38m-56 49 75-38M280 142l69-35m-48 46 69-35m-48 46 69-35m-48 46 69-35M182 91l62-32m-42 42 62-32m-42 42 62-32" /></g>
              <path d="M240 20v51" stroke="#d6e8a9" strokeDasharray="3 5" /><circle cx="240" cy="75" r="6" fill="#d6e8a9" />
              <path d="M227 2c0-10 13-23 13-23s13 13 13 23a13 13 0 0 1-26 0Z" transform="translate(0 20)" fill="#d6e8a9" />
            </svg>
          </div>
          <div className="flex flex-wrap gap-6 pt-6 text-xs text-dark-muted">
            <span className="flex items-center gap-2"><LoginIcon name="sensor" size={17} />Suelo</span>
            <span className="flex items-center gap-2"><LoginIcon name="sprout" size={17} />Cultivo</span>
            <span className="flex items-center gap-2"><LoginIcon name="cloud" size={17} />Clima</span>
          </div>
        </div>
        <footer className="flex flex-wrap justify-between gap-4 border-t border-white/20 pt-5 text-[11px] text-dark-muted">
          <span>YakuAI · Gestión del riego</span>
          <span className="flex items-center gap-1"><LoginIcon name="pin" size={14} /> Chupaca, Junín</span>
        </footer>
      </section>

      {/* === PANEL DERECHO: LOGIN FORM === */}
      <section className="flex min-w-0 flex-col items-center bg-white px-[clamp(24px,5vw,80px)] pt-12 pb-7 min-[761px]:[@media(max-height:760px)]:py-6 max-[760px]:min-h-dvh max-[760px]:bg-neutral-50 max-[760px]:px-5 max-[760px]:py-7 max-[380px]:px-4 max-[380px]:py-6" aria-label={recovery ? "Recuperar acceso" : "Iniciar sesión"}>
        <div className="mb-7 hidden self-start max-[760px]:block"><Brand /></div>
        <div className="my-auto w-full max-w-[380px] py-8 min-[761px]:[@media(max-height:760px)]:py-3 max-[760px]:max-w-[420px] max-[760px]:rounded-lg max-[760px]:border max-[760px]:border-neutral-200 max-[760px]:bg-white max-[760px]:p-7 max-[380px]:px-5 max-[380px]:py-6">
          {children}
        </div>
        <footer className="max-w-[340px] shrink-0 pt-6 text-center text-[11px] text-neutral-600 max-[760px]:mt-auto">{footer}</footer>
      </section>
    </main>
  );
}