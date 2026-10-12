import {createRoot} from "react-dom/client";
import {MemoryRouter} from "react-router-dom";
import {AuthProvider} from "./app/auth";
import {App} from "./app/App";
import * as data from "./test/fixtures";
import "./styles/globals.css";
const role = new URLSearchParams(location.search).get("role") === "agricultor" ? "agricultor" : "admin";
window.fetch = async (input, init) => {
 const path = new URL(String(input), location.origin).pathname.replace("/api/v1/", "");
 const account = {...data.user,role};
 let result:unknown;
  if(path==="auth/login") result={user:account,access_token:"isolated-ui-fixture",token_type:"Bearer"};
 else if(path==="auth/me") result=account;
 else if(path==="auth/logout") result={message:"OK"};
 else if(path.includes("/weather")) result=data.forecast;
 else if(path.endsWith("/evaluate")) result=data.evaluations[0];
 else if(path==="validation") result={total:1,passed:1,cases:[{caso:"Escenario de demostración",esperado:"riega",obtenido:"riega",ok:true,detalle:"Datos de prueba aislados"}]};
 else {
 const resources:Record<string,unknown>={plots:data.plots,farmers:data.farmers,crops:data.crops,"soil-textures":data.soils,sensors:data.sensors,evaluations:data.evaluations,irrigations:data.irrigations,alerts:data.alerts};
 result=resources[path];
 if(init?.method && init.method!=="GET") return new Response(JSON.stringify({error:{message:"Vista aislada: no se guardan cambios."}}),{status:422,headers:{"Content-Type":"application/json"}});
 }
 return new Response(JSON.stringify({data:result??[]}),{headers:{"Content-Type":"application/json"}});
};
createRoot(document.getElementById("root")!).render(<MemoryRouter><AuthProvider><App/></AuthProvider></MemoryRouter>);
