import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ProjectListDashboard from "./pages/ProjectListDashboard";
import ProjectDetailDashboard from "./pages/ProjectDetailDashboard";
import SetupPage from "./pages/SetupPage";
import PlanReviewPage from "./pages/PlanReviewPage";

// TEMP: set to false to see LandingPage, true to see ProjectListDashboard
const hasProjects = false;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root logic */}
        <Route
          path="/"
          element={hasProjects ? <ProjectListDashboard /> : <LandingPage />}
        />

        {/* Flow */}
        <Route path="/setup"    element={<SetupPage />} />
        <Route path="/plan"     element={<PlanReviewPage />} />
        <Route path="/projects" element={<ProjectListDashboard />} />

        {/* Project dashboards */}
        <Route path="/project/:id" element={<ProjectDetailDashboard />} />
        <Route path="/project/:id/plan" element={<PlanReviewPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;