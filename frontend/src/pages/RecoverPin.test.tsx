import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup} from "@testing-library/react";
import {act} from "react";
import {MemoryRouter,Route,Routes} from "react-router-dom";
import {RecoverPin} from "./RecoverPin";
import {ApiError} from "../api/client";
const api = vi.hoisted(()=>({recoverPin:vi.fn(),resetPin:vi.fn()}));
vi.mock("../api/endpoints",()=>api);
afterEach(()=>{cleanup();vi.clearAllMocks();vi.useRealTimers();});
function renderRecover():void {
 render(<MemoryRouter initialEntries={["/recuperar-pin"]}><Routes><Route path="/recuperar-pin" element={<RecoverPin/>}/><Route path="/login" element={<p>LOGIN</p>}/></Routes></MemoryRouter>);
}
async function requestCode():Promise<void> {
 fireEvent.change(screen.getByLabelText(/Correo electrónico/),{target:{value:"agricultor@yakuai.com"}});
 fireEvent.click(screen.getByRole("button",{name:"Enviar código de recuperación"}));
 await screen.findByText("Paso 2 de 2");
}
describe("Recuperación de PIN",()=>{
 it("solicita y reenvía el código",async()=>{
  api.recoverPin.mockResolvedValue({message:"Código enviado."});
  renderRecover();
  await requestCode();
  expect(api.recoverPin).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button",{name:"Reenviar código"}));
  await screen.findByText("Código enviado.");
  expect(api.recoverPin).toHaveBeenCalledTimes(2);
 });
 it("valida el PIN de cuatro dígitos",async()=>{
  api.recoverPin.mockResolvedValue({message:"Código enviado."});
  renderRecover();
  await requestCode();
  fireEvent.change(screen.getByLabelText(/Código de recuperación/),{target:{value:"123456"}});
  fireEvent.change(screen.getByLabelText(/Nuevo PIN/),{target:{value:"12"}});
  fireEvent.click(screen.getByRole("button",{name:"Actualizar PIN"}));
  expect(await screen.findByText("El PIN debe tener 4 dígitos numéricos.")).toBeInTheDocument();
  expect(api.resetPin).not.toHaveBeenCalled();
 });
 it("completa y vuelve al login",async()=>{
  api.recoverPin.mockResolvedValue({message:"Código enviado."});
  api.resetPin.mockResolvedValue({message:"PIN actualizado correctamente."});
  renderRecover();
  await requestCode();
  vi.useFakeTimers();
  try {
   fireEvent.change(screen.getByLabelText(/Código de recuperación/),{target:{value:"123456"}});
   fireEvent.change(screen.getByLabelText(/Nuevo PIN/),{target:{value:"1234"}});
   fireEvent.click(screen.getByRole("button",{name:"Actualizar PIN"}));
   await act(async()=>{});
   expect(screen.getByText("PIN actualizado correctamente.")).toBeInTheDocument();
   await act(async()=>{vi.advanceTimersByTime(2000);});
   expect(screen.getByText("LOGIN")).toBeInTheDocument();
  } finally {
   vi.useRealTimers();
  }
 });
 it("muestra el bloqueo por intentos",async()=>{
  api.recoverPin.mockRejectedValue(new ApiError("Cuenta bloqueada por intentos. Espera 15 minutos.",429));
  renderRecover();
  fireEvent.change(screen.getByLabelText(/Correo electrónico/),{target:{value:"agricultor@yakuai.com"}});
  fireEvent.click(screen.getByRole("button",{name:"Enviar código de recuperación"}));
  expect(await screen.findByText("Cuenta bloqueada por intentos. Espera 15 minutos.")).toBeInTheDocument();
 });
});
