import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import ModulesGrid from "./pages/ModulesGrid";
import ModuleRunner from "./pages/ModuleRunner";
import Campaigns from "./pages/Campaigns";
import Personas from "./pages/Personas";
import Groups from "./pages/Groups";
import Analytics from "./pages/Analytics";
import NeuroText from "./pages/NeuroText";
import Converter from "./pages/Converter";
import Booster from "./pages/Booster";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import BackendError from "./pages/BackendError";

export default function App() {
  const status = useAuth((s) => s.status);

  useEffect(() => {
    useAuth.getState().restore();
  }, []);

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">Starting…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="modules" element={<ModulesGrid />} />
        <Route path="modules/:moduleId" element={<ModuleRunner />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="personas" element={<Personas />} />
        <Route path="groups" element={<Groups />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="neuro-text" element={<NeuroText />} />
        <Route path="converter" element={<Converter />} />
        <Route path="booster" element={<Booster />} />
        <Route path="billing" element={<Billing />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<Admin />} />
        <Route path="backend-error" element={<BackendError />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}