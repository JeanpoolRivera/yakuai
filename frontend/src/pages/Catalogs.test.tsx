import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { Catalogs } from "./Catalogs";
import { crops, soils } from "../test/fixtures";

const api = vi.hoisted(() => ({ listCrops: vi.fn(), listSoils: vi.fn() }));
vi.mock("../api/endpoints", () => api);
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const crops2 = [...crops, { ...crops[0], id: 2, code: "maiz", name: "Maíz choclo", scientific_name: "Zea mays" }];

describe("Catálogos", () => {
  it("filtra cultivos y suelos en tiempo real", async () => {
    api.listCrops.mockResolvedValue(crops2);
    api.listSoils.mockResolvedValue(soils);
    render(<Catalogs />);

    await screen.findByText("Maíz choclo");
    expect(screen.getAllByText("Papa")[0]).toBeInTheDocument();
    const search = screen.getByLabelText("Buscar en catálogos");

    fireEvent.change(search, { target: { value: "maíz" } });
    expect(screen.getAllByText("Maíz choclo").length).toBeGreaterThan(0);
    expect(within(screen.getByRole("region", { name: "Cultivos y etapas" })).queryByText("Papa")).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "inexistente" } });
    expect(screen.getByText("No hay cultivos coincidentes")).toBeInTheDocument();
    expect(screen.getByText("No hay suelos coincidentes")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "" } });
    expect((await screen.findAllByText("Papa")).length).toBeGreaterThan(0);
  });

  it("muestra las etapas y parámetros de cultivos y suelos", async () => {
    api.listCrops.mockResolvedValue(crops);
    api.listSoils.mockResolvedValue(soils);
    render(<Catalogs />);

    await screen.findAllByText("Papa");
    expect(screen.getByRole("heading", { name: "Cultivos y etapas" })).toBeInTheDocument();
    expect(screen.getAllByText("Inicial")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Kc").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Texturas de suelo" })).toBeInTheDocument();
    expect(screen.getAllByText("Agua útil").length).toBeGreaterThan(0);
  });

  it("mantiene las fuentes y advertencias dentro de ventanas de detalle", async () => {
    const citedCrops = crops.map((crop) => ({
      ...crop,
      stages: crop.stages?.map((stage) => ({ ...stage, source: "FAO-56, Tabla 12", source_url: "https://www.fao.org/4/X0490E/x0490e0b.htm", reviewed_at: "2026-10-26" })),
    }));
    const citedSoils = soils.map((soil) => ({ ...soil, source: "FAO-56 Tabla 19; valores de referencia", source_url: "https://www.fao.org/4/X0490E/x0490e0e.htm", reviewed_at: "2026-10-26" }));
    api.listCrops.mockResolvedValue(citedCrops);
    api.listSoils.mockResolvedValue(citedSoils);
    render(<Catalogs />);

    await screen.findByText("Papa");
    expect(screen.queryByText(/Duración de etapas.*pueden variar/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver fuentes y criterios de Papa" }));
    expect(await screen.findByRole("dialog", { name: "Papa" })).toBeInTheDocument();
    expect(screen.getByText(/Coeficiente de cultivo (Kc) · capítulo 6, tabla 12/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cómo interpretar estos datos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fuentes y revisión" })).toBeInTheDocument();
    expect(screen.getByText(/Revisado:/)).toBeInTheDocument(); expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://www.fao.org/4/X0490E/x0490e0b.htm" })).toHaveAttribute("href", "https://www.fao.org/4/X0490E/x0490e0b.htm");
    expect(screen.getByRole("link", { name: "https://www.fao.org/4/X0490E/x0490e0e.htm" })).toHaveAttribute("href", "https://www.fao.org/4/X0490E/x0490e0e.htm");
    expect(screen.getByText(/Base técnica: FAO-56/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    fireEvent.click(screen.getByRole("button", { name: "Ver fuentes y criterios de Franco" }));
    expect(await screen.findByRole("dialog", { name: "Franco" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://www.fao.org/4/X0490E/x0490e0e.htm" })).toHaveAttribute("href", "https://www.fao.org/4/X0490E/x0490e0e.htm");
    expect(screen.getByRole("link", { name: "https://doi.org/10.2136/sssaj2005.0117" })).toHaveAttribute("href", "https://doi.org/10.2136/sssaj2005.0117");
    expect(screen.getByText(/un análisis permite ajustarlos/)).toBeInTheDocument();
  });
});




