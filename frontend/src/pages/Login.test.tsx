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
function fillValid():void {
 fireEvent.change(screen.getByLabelText(/Correo electrónico/),{target:{value:"tecnico@yakuai.pe"}});
 fireEvent.change(screen.getByLabelText(/Contraseña o PIN/),{target:{value:"clave123"}});
}
describe("Ingreso",()=>{
 it("pide el correo cuando está vacío",async()=>{
  renderLogin();
  fireEvent.click(screen.getByRole("button",{name:/Iniciar sesión/}));
  expect(await screen.findByText("Escribe tu correo.")).toBeInTheDocument();
  expect(auth.signInPassword).not.toHaveBeenCalled();
 });
 it("valida el formato del correo antes de enviar",async()=>{
  renderLogin();
  fireEvent.change(screen.getByLabelText(/Correo electrónico/),{target:{value:"sin-arroba"}});
  fireEvent.change(screen.getByLabelText(/Contraseña o PIN/),{target:{value:"1234"}});
  fireEvent.click(screen.getByRole("button",{name:/Iniciar sesión/}));
  expect(await screen.findByText("Escribe un correo válido.")).toBeInTheDocument();
  expect(auth.signInPassword).not.toHaveBeenCalled();
 });
 it("envía el correo normalizado con el secreto",async()=>{
  auth.signInPassword.mockResolvedValue(undefined);
  renderLogin();
  fireEvent.change(screen.getByLabelText(/Correo electrónico/),{target:{value:"  TECNICO@YAKUAI.PE  "}});
  fireEvent.change(screen.getByLabelText(/Contraseña o PIN/),{target:{value:"clave123"}});
  fireEvent.click(screen.getByRole("button",{name:/Iniciar sesión/}));
  await waitFor(()=>expect(auth.signInPassword).toHaveBeenCalledWith("tecnico@yakuai.pe","clave123"));
 });
 it("muestra alerta comprensible ante credenciales incorrectas",async()=>{
  auth.signInPassword.mockRejectedValue(new ApiError("Credenciales incorrectas.",401));
  renderLogin();
  fillValid();
  fireEvent.click(screen.getByRole("button",{name:/Iniciar sesión/}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales incorrectas.");
 });
 it("alterna mostrar u ocultar el secreto",()=>{
  renderLogin();
  const secret=screen.getByLabelText(/Contraseña o PIN/);
  expect(secret).toHaveAttribute("type","password");
  fireEvent.click(screen.getByRole("button",{name:"Mostrar contraseña"}));
  expect(secret).toHaveAttribute("type","text");
 });
});
