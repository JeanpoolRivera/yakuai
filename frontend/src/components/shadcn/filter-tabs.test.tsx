import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup} from "@testing-library/react";
import {FilterTabs} from "./filter-tabs";
afterEach(()=>cleanup());
describe("FilterTabs",()=>{
 it("las pestañas se navegan con el teclado y mantienen el foco",()=>{
  const change=vi.fn();
  const options=[{value:"todos",label:"Todas"},{value:"criticas",label:"Críticas"}] as const;
  render(<FilterTabs label="Filtrar alertas" value="todos" onChange={change} options={[...options]}/>);
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
