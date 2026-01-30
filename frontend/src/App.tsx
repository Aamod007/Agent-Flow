import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardHome from "@/pages/DashboardHome";
import WorkflowEditor from "@/pages/WorkflowEditor";
import WorkflowsList from "@/pages/WorkflowsList";
import Templates from "@/pages/Templates";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Connections from "@/pages/Connections";
import Landing from "@/pages/Landing";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page (public) */}
        <Route path="/" element={<Landing />} />

        {/* Dashboard routes (authenticated) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="workflows" element={<WorkflowsList />} />
          <Route path="editor/:id" element={<WorkflowEditor />} />
          <Route path="templates" element={<Templates />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="connections" element={<Connections />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
