import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { fmtNum } from "@/lib/format";
import type { IrrigationSummary } from "../utils";
import { IrrigationSummaryCards } from "./IrrigationSummaryCards";

afterEach(() => cleanup());

function summary(overrides: Partial<IrrigationSummary> = {}): IrrigationSummary {
  return {
    activeCount: 3,
    appliedLiters: 9000,
    recommendedLiters: 8800,
    deviation: 200,
    level: "over",
    withRecommendation: 3,
    ...overrides,
  };
}

describe("IrrigationSummaryCards", () => {
  it("muestra vigentes, agua aplicada y desvío", () => {
    render(<IrrigationSummaryCards summary={summary()} />);

    expect(screen.getByText("Riegos vigentes")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(fmtNum(9000))).toBeInTheDocument();
    expect(screen.getByText("200 L por encima")).toBeInTheDocument();
    expect(screen.getByText("Por encima")).toBeInTheDocument();
    expect(screen.getByText(`vs ${fmtNum(8800)} L recomendados`)).toBeInTheDocument();
  });

  it("degrada el desvío cuando no hay recomendación", () => {
    render(
      <IrrigationSummaryCards
        summary={summary({
          deviation: null,
          level: "none",
          recommendedLiters: 0,
          withRecommendation: 0,
        })}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Sin recomendación")).toBeInTheDocument();
    expect(screen.getByText("Sin recomendación para comparar")).toBeInTheDocument();
  });
});
