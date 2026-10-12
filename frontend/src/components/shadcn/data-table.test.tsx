import {describe,it,expect,afterEach} from "vitest";
import {render,screen,cleanup} from "@testing-library/react";
import {DataTable} from "./data-table";
afterEach(()=>cleanup());
describe("DataTable",()=>{
 it("presenta celdas con encabezados también para la vista móvil",()=>{
  render(<DataTable label="Parcelas" rows={[{id:1,name:"El Molino"}]} rowKey={r=>r.id} columns={[{key:"name",label:"Parcela",render:r=>r.name}]}/>);
  expect(screen.getByRole("table",{name:"Parcelas"})).toBeInTheDocument();
  expect(screen.getByRole("cell",{name:"El Molino"})).toHaveAttribute("data-label","Parcela");
 });
});
