import { Lock } from "lucide-react";
import { ROUTE_TITLES } from "./navigation";
/* YakuAI — rutas y puertas por rol. */
import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";
import { FarmerShell } from "../components/layout/FarmerShell";
import { TechShell } from "../components/layout/TechShell";
import { Button } from "../components/shadcn/button";
import { Empty, Loading } from "../components/shadcn/feedback";
import { isFarmerRole, isStaffRole } from "../lib/permissions";
import { Dashboard } from "../pages/Dashboard";
import { Hoy } from "../pages/Hoy";
import { Login } from "../pages/Login";
import { RecoverPin } from "../pages/RecoverPin";
import { Evaluate } from "../pages/Evaluate";
import { Irrigations } from "../pages/Irrigations";
import { Alerts } from "../pages/Alerts";

const Plots = lazy(() => import("../pages/Plots").then((m) => ({ default: m.Plots })));
const Farmers = lazy(() => import("../pages/Farmers").then((m) => ({ default: m.Farmers })));
const Sensors = lazy(() => import("../pages/Sensors").then((m) => ({ default: m.Sensors })));
const Weather = lazy(() => import("../pages/Weather").then((m) => ({ default: m.Weather })));
const Catalogs = lazy(() => import("../pages/Catalogs").then((m) => ({ default: m.Catalogs })));
const Validation = lazy(() => import("../pages/Validation").then((m) => ({ default: m.Validation })));

const STAFF_ONLY = ["/parcelas", "/sensores", "/clima", "/agricultores", "/catalogos", "/validacion"];


function ShellRoutes(): React.JSX.Element {
  const { session, role, displayName, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!session || !role) return <Navigate to="/login" replace />;

  if (isFarmerRole(role) && STAFF_ONLY.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  const exit = (): void => {
    void signOut().then(() => navigate("/login"));
  };

  if (isFarmerRole(role)) {
    return (
      <FarmerShell nombre={displayName} rol={role} onExit={exit}>
        <Routes>
          <Route path="/" element={<Hoy />} />
          <Route path="/evaluar" element={<Evaluate />} />
          <Route path="/riegos" element={<Irrigations />} />
          <Route path="/alertas" element={<Alerts />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </FarmerShell>
    );
  }

  if (!isStaffRole(role)) {
    // Rol no reconocido por esta versión: vista restringida sin navegación.
    return (
      <main className="mx-auto grid min-h-dvh w-full max-w-[88rem] place-items-center p-4">
        <div className="w-full max-w-md">
          <Empty
            icon={<Lock className="h-5 w-5" aria-hidden="true" />}
            title="Sesión no reconocida"
            hint="Tu cuenta tiene un rol que esta versión no reconoce. Cierra sesión o contacta a tu técnico."
            action={<Button variant="outline" onClick={exit}>Cerrar sesión</Button>}
          />
        </div>
      </main>
    );
  }

  return (
    <TechShell
      nombre={displayName}
      rol={role}
      onExit={exit}
      crumb={ROUTE_TITLES[location.pathname] ?? "YakuAI"}
    >
      <Suspense fallback={<Loading text="Cargando pantalla…" />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/evaluar" element={<Evaluate />} />
          <Route path="/parcelas" element={<Plots />} />
          <Route path="/riegos" element={<Irrigations />} />
          <Route path="/alertas" element={<Alerts />} />
          <Route path="/sensores" element={<Sensors />} />
          <Route path="/clima" element={<Weather />} />
          <Route path="/agricultores" element={<Farmers />} />
          <Route path="/catalogos" element={<Catalogs />} />
          <Route path="/validacion" element={<Validation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </TechShell>
  );
}

export function App(): React.JSX.Element {
  const { session, ready } = useAuth();

  if (!ready) return <Loading text="Abriendo YakuAI…" />;

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/recuperar-pin" element={session ? <Navigate to="/" replace /> : <RecoverPin />} />
      <Route path="/*" element={<ShellRoutes />} />
    </Routes>
  );
}
