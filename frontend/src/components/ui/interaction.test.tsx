import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup} from "@testing-library/react";
import {Field,TextInput} from "./Field";
import {Button} from "./Button";
import {Modal} from "./Dialog";
import {DataTable} from "./DataTable";
import {Tabs} from "./Navigation";
afterEach(()=>cleanup());
describe("Componentes accesibles",()=>{
 it("asocia nombre y error con el campo sin id manual",()=>{
  render(<Field label="Nombre" error="Escribe un nombre" required><TextInput/></Field>);
  const input=screen.getByRole("textbox",{name:"Nombre"});
  expect(input).toHaveAccessibleDescription("Escribe un nombre");
  expect(input).toHaveAttribute("aria-invalid","true");
  expect(input).toHaveAttribute("aria-required","true");
 });
 it("conserva la variante al agregar clases y bloquea doble envío",()=>{
  const click=vi.fn();
  render(<Button className="custom" loading onClick={click}>Guardar</Button>);
  const button=screen.getByRole("button",{name:"Guardar"});
  expect(button).toHaveClass("btn","btn-primary","custom");
  expect(button).toBeDisabled(); fireEvent.click(button);expect(click).not.toHaveBeenCalled();
 });
 it("presenta celdas con encabezados también para la vista móvil",()=>{
  render(<DataTable label="Parcelas" rows={[{id:1,name:"El Molino"}]} rowKey={r=>r.id} columns={[{key:"name",label:"Parcela",render:r=>r.name}]}/>);
  expect(screen.getByRole("table",{name:"Parcelas"})).toBeInTheDocument();
  expect(screen.getByRole("cell",{name:"El Molino"})).toHaveAttribute("data-label","Parcela");
 });
 it("el diálogo aísla el fondo y restaura el foco al cerrar",()=>{
  const root=document.createElement("div");root.id="root";document.body.append(root);
  const trigger=document.createElement("button");root.append(trigger);trigger.focus();
  const container=document.createElement("div");root.append(container);
  const close=vi.fn();const view=render(<Modal title="Editar parcela" onClose={close}>Contenido</Modal>,{container});
  expect(root.inert).toBe(true);
  expect(screen.getByRole("dialog",{name:"Editar parcela"})).toHaveFocus();
  fireEvent.keyDown(document,{key:"Escape"});expect(close).toHaveBeenCalledTimes(1);
  view.unmount();expect(root.inert).toBe(false);expect(trigger).toHaveFocus();root.remove();
 });
 it("Escape afecta únicamente el diálogo superior",()=>{
  const outer=vi.fn(),inner=vi.fn();
  render(<><Modal title="Principal" onClose={outer}>Formulario</Modal><Modal title="Confirmar" onClose={inner}>Confirmación</Modal></>);
  fireEvent.keyDown(document,{key:"Escape"});expect(inner).toHaveBeenCalledOnce();expect(outer).not.toHaveBeenCalled();
 });
 it("un diálogo ocupado evita cancelar por teclado",()=>{
  const close=vi.fn();render(<Modal title="Guardando" busy onClose={close}>Espera</Modal>);
  fireEvent.keyDown(document,{key:"Escape"});expect(close).not.toHaveBeenCalled();
  expect(screen.getByRole("button",{name:"Cerrar diálogo"})).toBeDisabled();
 });
 it("las pestañas se navegan con el teclado y mantienen el foco",()=>{
  const change=vi.fn();
  const options=[{value:"todos",label:"Todas"},{value:"criticas",label:"Críticas"}] as const;
  render(<Tabs label="Filtrar alertas" value="todos" onChange={change} options={[...options]}/>);
  const [todas,criticas]=screen.getAllByRole("button");
  expect(todas).toHaveAttribute("aria-pressed","true");
  expect(todas).toHaveAttribute("tabindex","0");
  expect(criticas).toHaveAttribute("tabindex","-1");
  fireEvent.keyDown(todas,{key:"ArrowRight"});
  expect(change).toHaveBeenCalledWith("criticas");
  expect(criticas).toHaveFocus();
  fireEvent.keyDown(criticas,{key:"Home"});
  expect(change).toHaveBeenCalledWith("todos");
  expect(todas).toHaveFocus();
  fireEvent.click(criticas);
  expect(change).toHaveBeenCalledWith("criticas");
 });
});
