import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup,waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {Login} from "./Login";
import {ApiError} from "../api/client";
const auth = vi.hoisted(()=>({signInPassword:vi.fn()}));
vi.mock("../app/auth",()=>({useAuth:()=>auth}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
function renderLogin():void {
 render(<MemoryRouter><Login/></MemoryRouter>);
}
function fillValid(email = "tecnico@yakuai.pe", secret = "clave123"):void {
 fireEvent.change(screen.getByLabelText(/Correo de cuenta/),{target:{value:email}});
 fireEvent.change(screen.getByLabelText(/PIN o contraseña/),{target:{value:secret}});
}
describe("Ingreso",()=>{
 it("no pide elegir un rol y acepta las credenciales unificadas",()=>{
  renderLogin();
  expect(screen.queryByRole("group",{name:"Tipo de acceso"})).not.toBeInTheDocument();
  expect(screen.getByLabelText(/PIN o contraseña/)).toBeInTheDocument();
 });
 it("pide el correo cuando está vacío",async()=>{
  renderLogin();
  fireEvent.click(screen.getByRole("button",{name:/Iniciar sesión/}));
  expect(await screen.findByText("Escribe tu correo.")).toBeInTheDocument();
  expect(auth.signInPassword).not.toHaveBeenCalled();
 });
 it("valida el formato del correo antes de enviar",async()=>{
  renderLogin();
  fillValid("sin-arroba", "1234");
  fireEvent.click(screen.getByRole("button",{name:/Iniciar sesión/}));
  expect(await screen.findByText("Escribe un correo válido.")).toBeInTheDocument();
  expect(auth.signInPassword).not.toHaveBeenCalled();
 });
 it("envía el correo normalizado con la credencial",async()=>{
  auth.signInPassword.mockResolvedValue(undefined);
  renderLogin();
  fillValid("  TECNICO@YAKUAI.PE  ","clave123");
  fireEvent.click(screen.getByRole("button",{name:/Iniciar sesión/}));
  await waitFor(()=>expect(auth.signInPassword).toHaveBeenCalledWith("tecnico@yakuai.pe","clave123"));
 });
 it("envía PIN numérico sin modo agricultor manual",async()=>{
  auth.signInPassword.mockResolvedValue(undefined);
  renderLogin();
  fillValid("agricultor@yakuai.pe","0427");
  fireEvent.click(screen.getByRole("button",{name:/Iniciar sesión/}));
  await waitFor(()=>expect(auth.signInPassword).toHaveBeenCalledWith("agricultor@yakuai.pe","0427"));
 });
 it("muestra alerta comprensible ante credenciales incorrectas",async()=>{
  auth.signInPassword.mockRejectedValue(new ApiError("Credenciales incorrectas.",401));
  renderLogin();
  fillValid();
  fireEvent.click(screen.getByRole("button",{name:/Iniciar sesión/}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales incorrectas.");
 });
 it("alterna mostrar u ocultar la credencial",()=>{
  renderLogin();
  const secret=screen.getByLabelText(/PIN o contraseña/);
  expect(secret).toHaveAttribute("type","password");
  fireEvent.click(screen.getByRole("button",{name:"Mostrar PIN o contraseña"}));
  expect(secret).toHaveAttribute("type","text");
 });
});
