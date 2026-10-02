import {useEffect, useRef, useState} from "react";
import type {ReactNode} from "react";
import {Link, NavLink, useLocation} from "react-router-dom";
import {NAVIGATION, FARMER_NAVIGATION} from "../app/navigation";
import {roleLabel} from "../lib/permissions";
import {initial} from "../lib/format";
import {Icon} from "./ui";
import {Toasts} from "./Toasts";

export function Brand(): React.JSX.Element {
  return <Link to="/" className="brand" aria-label="YakuAI inicio">
    <span className="brand-mark"><Icon name="drop" size={25}/></span>
    <span className="brand-word">yaku<span>ai</span><small>INTELIGENCIA PARA TU CAMPO</small></span>
  </Link>;
}

export function TechShell({nombre,rol,onExit,crumb,children}:{
  nombre:string; rol:string; onExit:()=>void; crumb:string; children:ReactNode;
}):React.JSX.Element {
  const [navOpen,setNavOpen]=useState(false);
  const menuRef=useRef<HTMLButtonElement>(null);
  const sidebarRef=useRef<HTMLElement>(null);
  const workRef=useRef<HTMLDivElement>(null);
  const location=useLocation();
  useEffect(()=>{
    if(!navOpen)return;
    const work=workRef.current;
    const trigger=menuRef.current;
    const previous=document.body.style.overflow;
    if(work)work.inert=true;
    document.body.style.overflow="hidden";
    (sidebarRef.current?.querySelector<HTMLAnchorElement>(".nav-link.active") ?? sidebarRef.current?.querySelector<HTMLAnchorElement>(".nav-link"))?.focus();
    const onKey=(e:KeyboardEvent):void=>{
      if(e.key==="Escape")setNavOpen(false);
      if(e.key!=="Tab")return;
      const items=Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')??[]).filter(el=>el.getClientRects().length>0);
      const first=items[0],last=items.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    };
    const media=matchMedia("(min-width: 1001px)");
    const onResize=():void=>{if(media.matches)setNavOpen(false);};
    document.addEventListener("keydown",onKey);
    media.addEventListener("change",onResize);
    return()=>{
      if(work)work.inert=false;
      document.body.style.overflow=previous;
      document.removeEventListener("keydown",onKey);
      media.removeEventListener("change",onResize);
      trigger?.focus();
    };
  },[navOpen]);
  useEffect(()=>{
    document.title=crumb+" · YakuAI";
  },[crumb,location.pathname]);
  const [today]=useState(()=>new Date().toLocaleDateString("es-PE",{day:"numeric",month:"long",timeZone:"America/Lima"}));
  return <div className="app">
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    {navOpen?<button className="scrim" aria-label="Cerrar navegación" onClick={()=>setNavOpen(false)}/>:null}
    <aside id="navegacion-principal" ref={sidebarRef} className={"sidebar"+(navOpen?" open":"")} aria-label="Navegación principal">
      <div className="sidebar-head"><Brand/><button className="icon-btn sidebar-close" onClick={()=>setNavOpen(false)} aria-label="Cerrar navegación"><Icon name="x"/></button></div>
      <div className="workspace-label"><span className="workspace-icon"><Icon name="sprout" size={21}/></span><div><strong>Espacio de campo</strong><span>Chupaca, Junín · Perú</span></div></div>
      <nav className="nav" aria-label="Secciones">
        {NAVIGATION.map(group=><div className="nav-section" key={group.title}>
          <p className="nav-group">{group.title}</p>
          {group.items.map(item=><NavLink key={item.to} className="nav-link" to={item.to} end={item.end} onClick={()=>setNavOpen(false)}><Icon name={item.icon} size={19}/><span>{item.label}</span></NavLink>)}
        </div>)}
      </nav>
      <div className="sidebar-note"><Icon name="drop" size={16}/><span>Cada gota, una mejor decisión.</span></div>
      <div className="userchip"><span className="avatar">{initial(nombre)}</span><div className="userchip-copy"><strong className="truncate">{nombre}</strong><small>{roleLabel(rol)}</small></div><button className="icon-btn" onClick={onExit} aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="logout" size={18}/></button></div>
    </aside>
    <div className="work" ref={workRef}>
      <header className="topbar">
        <button ref={menuRef} className="icon-btn menu-btn" aria-label="Abrir navegación" aria-expanded={navOpen} aria-controls="navegacion-principal" onClick={()=>setNavOpen(true)}><Icon name="menu"/></button>
        <nav className="crumbs-bar" aria-label="Miga de pan"><Link className="crumb-root" to="/">Mi espacio</Link><Icon name="chevron" size={12}/><span className="topbar-title" aria-current="page">{crumb}</span></nav>
        <div className="topbar-right"><span className="topbar-date"><Icon name="calendar" size={16}/>{today}</span><span className="topbar-separator"/><span className="avatar avatar-sm" aria-label={nombre}>{initial(nombre)}</span></div>
      </header>
      <main className="content" id="contenido" tabIndex={-1}>{children}</main>
      <footer className="workspace-footer"><span>YakuAI · Gestión del riego</span><span>Información para decidir. Tú cuidas el campo.</span></footer>
    </div><Toasts/>
  </div>;
}
export function FarmerShell({nombre,onExit,children}:{nombre:string;onExit:()=>void;children:ReactNode}):React.JSX.Element{
 const [today]=useState(()=>new Date().toLocaleDateString("es-PE",{weekday:"long",day:"numeric",month:"long",timeZone:"America/Lima"}));
 return <div className="farmer">
  <a className="skip-link" href="#contenido">Saltar al contenido</a>
  <header className="farmer-top"><div className="farmer-top-inner"><Brand/><div className="farmer-user"><span className="avatar">{initial(nombre)}</span><div><strong>{nombre}</strong><small>Mi campo · Chupaca</small></div><button className="icon-btn" onClick={onExit} aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="logout"/></button></div></div></header>
  <div className="farmer-date"><Icon name="calendar" size={15}/>{today}</div>
  <main className="farmer-body" id="contenido" tabIndex={-1}>{children}</main>
  <nav className="bottomnav" aria-label="Navegación agricultor">{FARMER_NAVIGATION.map(item=><NavLink key={item.to} className="bottomnav-link" to={item.to} end={item.end}><Icon name={item.icon} size={21}/><span>{item.label}</span></NavLink>)}</nav>
  <Toasts/>
 </div>;
}
