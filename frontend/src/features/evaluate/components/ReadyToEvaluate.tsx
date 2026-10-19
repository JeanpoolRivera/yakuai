import { CloudRain, Droplet, Sprout } from "lucide-react";
import { Card } from "@/design-system/primitives";

export interface ReadyToEvaluateProps {
  plotName: string | null;
}

const INPUTS = [
  { Icon: Droplet, title: "Suelo", detail: "Humedad reciente" },
  { Icon: Sprout, title: "Cultivo", detail: "Etapa y necesidades" },
  { Icon: CloudRain, title: "Clima", detail: "Previsión de lluvia" },
] as const;

export function ReadyToEvaluate({ plotName }: ReadyToEvaluateProps): React.JSX.Element {
  return (
    <Card className="overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-800">Recomendación de riego</h2>
          <p className="text-xs text-neutral-600">La información necesaria para decidir.</p>
        </div>
      </header>

      <div className="grid justify-items-center gap-4 px-6 py-10 text-center">
        <span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Droplet className="h-8 w-8" strokeWidth={1.4} />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
          {plotName ?? "Tu próxima decisión"}
        </p>
        <h2 className="text-d3 font-bold tracking-tight text-neutral-900">¿Necesita agua tu parcela?</h2>
        <p className="max-w-prose text-sm leading-relaxed text-neutral-600">
          Usamos la humedad del suelo, el cultivo y la lluvia prevista.
        </p>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-t border-border px-6 py-5 text-center">
        {INPUTS.map(({ Icon, title, detail }) => (
          <div key={title} className="grid justify-items-center gap-1.5">
            <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
            <strong className="text-xs font-semibold text-neutral-800">{title}</strong>
            <span className="text-[11px] text-neutral-600">{detail}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
