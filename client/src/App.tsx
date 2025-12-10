import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import ModelManagement from "./pages/ModelManagement";
import ImageManagement from "./pages/ImageManagement";
import ProjectManagement from "./pages/ProjectManagement";
import DeploymentManagement from "./pages/DeploymentManagement";
import TrainingManagement from "./pages/TrainingManagement";
import TrainingMonitoring from "./pages/TrainingMonitoring";
import APIManagement from "./pages/APIManagement";
import EvaluationManagement from "./pages/EvaluationManagement";
import AnomalyDetectionManagement from "./pages/AnomalyDetectionManagement";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path="/models">
        <DashboardLayout>
          <ModelManagement />
        </DashboardLayout>
      </Route>
      <Route path="/projects">
        <DashboardLayout>
          <ProjectManagement />
        </DashboardLayout>
      </Route>
      <Route path="/deployments">
        <DashboardLayout>
          <DeploymentManagement />
        </DashboardLayout>
      </Route>
      <Route path="/images">
        <DashboardLayout>
          <ImageManagement />
        </DashboardLayout>
      </Route>
      <Route path="/trainings">
        <DashboardLayout>
          <TrainingManagement />
        </DashboardLayout>
      </Route>
      <Route path="/trainings/:id/monitoring">
        <DashboardLayout>
          <TrainingMonitoring />
        </DashboardLayout>
      </Route>
      <Route path="/apis">
        <DashboardLayout>
          <APIManagement />
        </DashboardLayout>
      </Route>
      <Route path="/evaluations">
        <DashboardLayout>
          <EvaluationManagement />
        </DashboardLayout>
      </Route>
      <Route path="/anomalies">
        <DashboardLayout>
          <AnomalyDetectionManagement />
        </DashboardLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
