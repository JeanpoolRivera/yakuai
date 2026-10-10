import type {ReactNode} from "react";
import {Brand} from "./layout";
import {Icon} from "./ui";
export function AuthLayout({children,footer,recovery=false}:{children:ReactNode;footer:ReactNode;recovery?:boolean}):React.JSX.Element {
 return <main className="access">
  <section className="access-story" aria-labelledby="access-story-title">
   <Brand/>
   <div className="access-story-content">
    <p className="access-eyebrow"><span/> AGRICULTURA CON INFORMACIÓN</p>
    <h2 id="access-story-title">{recovery?"Volvamos a tu campo.":<>Decide mejor.<br/>Cuida cada <em>gota.</em></>}</h2>
    <p className="access-story-description">{recovery?"Recupera tu acceso y continúa con el cuidado de tus parcelas.":"Tu suelo, tus cultivos y el clima, en un solo lugar. Información clara para saber cuándo y cuánto regar."}</p>
    <div className="access-landscape" aria-hidden="true">
     <svg viewBox="0 0 480 240" fill="none">
      <path d="m20 147 225-116 215 110-222 116Z" fill="#1b5247" stroke="#598378"/>
      <path d="m20 147 218 110v15L20 162Z" fill="#0a2b27"/><path d="m238 257 222-116v15L238 272Z" fill="#123c33"/>
      <path d="m42 148 98-50 84 43-99 51Z" fill="#82a98a"/><path d="m157 89 90-46 87 45-92 47Z" fill="#416f5c"/>
      <path d="m143 201 98-52 87 44-100 53Z" fill="#305f4e"/><path d="m261 140 91-47 87 46-93 47Z" fill="#a7bf82"/>
      <g stroke="#e0eabd" opacity=".5"><path d="m63 150 75-38m-56 49 75-38m-56 49 75-38m-56 49 75-38M280 142l69-35m-48 46 69-35m-48 46 69-35m-48 46 69-35M182 91l62-32m-42 42 62-32m-42 42 62-32"/></g>
      <path d="M240 20v51" stroke="#d6e8a9" strokeDasharray="3 5"/><circle cx="240" cy="75" r="6" fill="#d6e8a9"/>
      <path d="M227 2c0-10 13-23 13-23s13 13 13 23a13 13 0 0 1-26 0Z" transform="translate(0 20)" fill="#d6e8a9"/>
     </svg>
    </div>
    <div className="access-pillars"><span><Icon name="sensor" size={17}/>Suelo</span><span><Icon name="sprout" size={17}/>Cultivo</span><span><Icon name="cloud" size={17}/>Clima</span></div>
   </div>
   <footer className="access-story-footer"><span>YakuAI · Gestión del riego</span><span><Icon name="pin" size={14}/> Chupaca, Junín</span></footer>
  </section>
  <section className="access-panel" aria-label={recovery?"Recuperar acceso":"Iniciar sesión"}>
   <div className="access-mobile-brand"><Brand/></div>
   <div className="access-card">{children}</div>
   <footer className="access-footer">{footer}</footer>
  </section>
 </main>;
}
