import {describe,it,expect,afterEach} from "vitest";
import {render,screen,cleanup} from "@testing-library/react";
import {FormField} from "./FormField";
import {Input} from "../shadcn/input";
afterEach(()=>cleanup());
describe("FormField",()=>{
 it("asocia nombre y error con el campo sin id manual",()=>{
  render(<FormField label="Nombre" error="Escribe un nombre" required><Input/></FormField>);
  const input=screen.getByRole("textbox",{name:"Nombre"});
  expect(input).toHaveAccessibleDescription("Escribe un nombre");
  expect(input).toHaveAttribute("aria-invalid","true");
  expect(input).toHaveAttribute("aria-required","true");
 });
});
