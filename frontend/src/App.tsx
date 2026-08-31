import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ToastContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LeadsListPage } from "./pages/LeadsListPage";
import { LeadDetailPage } from "./pages/LeadDetailPage";
import { NewLeadPage } from "./pages/NewLeadPage";
import { PipelinePage } from "./pages/PipelinePage";
import { OpportunityDetailPage } from "./pages/OpportunityDetailPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { TeamPage } from "./pages/TeamPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LandingPage } from "./pages/LandingPage";
import "./App.css";

const RootRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <DashboardPage />;
  }
  return <LandingPage />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootRoute />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads"
              element={
                <ProtectedRoute>
                  <LeadsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/new"
              element={
                <ProtectedRoute>
                  <NewLeadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/:id"
              element={
                <ProtectedRoute>
                  <LeadDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pipeline"
              element={
                <ProtectedRoute>
                  <PipelinePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities/:id"
              element={
                <ProtectedRoute>
                  <OpportunityDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers/:id"
              element={
                <ProtectedRoute>
                  <CustomerDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <TeamPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
