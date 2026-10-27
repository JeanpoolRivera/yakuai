import { useAuth } from "@/app/auth-context";
import { IrrigationsWorkspace } from "@/features/irrigations/components";
import { useIrrigations } from "@/features/irrigations/hooks/useIrrigations";
import { useIrrigationFilters } from "@/features/irrigations/hooks/useIrrigationFilters";
import { useIrrigationMutations } from "@/features/irrigations/hooks/useIrrigationMutations";

export function Irrigations(): React.JSX.Element {
  const { role } = useAuth();
  const isStaff = role === "tecnico" || role === "admin";
  const irrigations = useIrrigations();
  const filters = useIrrigationFilters(irrigations.items);
  const mutations = useIrrigationMutations(irrigations.reload);

  return (
    <IrrigationsWorkspace
      isStaff={isStaff}
      irrigations={irrigations}
      filters={filters}
      mutations={mutations}
    />
  );
}
