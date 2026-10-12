import { Toaster as SonnerToaster } from "sonner";

/** Toaster sonner con tokens YakuAI (montado en TechShell/FarmerShell).
 * `lib/toast.ts` conserva las firmas `toast*()` sobre sonner.
 */
export function Toaster(): React.JSX.Element {
  return (
    <SonnerToaster
      position="top-center"
      gap={8}
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-lg border-neutral-200 bg-white text-neutral-800 shadow-toast",
          title: "text-sm font-semibold",
          description: "text-sm text-neutral-600",
          actionButton: "bg-primary-700 text-white",
          cancelButton: "bg-neutral-100 text-neutral-800",
        },
      }}
    />
  );
}