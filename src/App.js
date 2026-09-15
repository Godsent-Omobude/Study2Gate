import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import GenerateFlashcards from "./pages/GenerateFlashcard";
import MyFlashcards from "./pages/MyFlashcards";
import Materials from "./pages/Materials";
import StudyAll from "./pages/StudyAll";
import StudyCircles from "./pages/StudyCircles";
import StudyCircleDetail from "./pages/StudyCircleDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Settings from "./pages/Settings";
import NotificationBell from "./components/NotificationBell";
import DownloadCreditsBadge from "./components/DownloadCreditsBadge";
import JoinCircleInvitation from "./pages/JoinCircleInvitation";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import CopyrightPolicy from "./pages/CopyrightPolicy";
import AcceptCopyrightPolicy from "./pages/AcceptCopyrightPolicy";
import { applyDynamicManifest } from "./pwa/dynamicManifest";
import { resolveTheme } from "./utils/theme";
import SessionGuard from "./components/SessionGuard";

function ProtectedLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 lg:flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <Navbar onMenuOpen={() => setSidebarOpen(true)}>
            <NotificationBell />
            <DownloadCreditsBadge />
          </Navbar>

          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Pages that must always render with the blue brand colour, no matter what
// accent colour the signed-in user has picked in Settings. A signed-out
// visitor (or someone who just logged out) should never land on a red/green/etc.
// login or registration screen just because the account they used last time
// had a custom accent saved.
const ALWAYS_BLUE_ROUTES = ["/login", "/register", "/accept-policy"];

function AppearanceManager() {
  const location = useLocation();

  useEffect(() => {
    const apply = () => {
      const theme = localStorage.getItem("theme") || "system";
      const savedAccent = localStorage.getItem("accentColor") || "blue";
      const accent = ALWAYS_BLUE_ROUTES.includes(location.pathname)
        ? "blue"
        : savedAccent;

      // The preference itself can be "system" — but the DOM attribute the
      // CSS reads must be an actual "light" or "dark" (see utils/theme.js).
      document.documentElement.dataset.theme = resolveTheme(theme);
      document.documentElement.dataset.accent = accent;
      applyDynamicManifest(accent);
    };

    apply();
    window.addEventListener("study2gate-appearance-change", apply);

    // Keep "system" mode live: if the OS preference flips while the user
    // has this open (or between visits, before they've touched Settings
    // again), re-apply without requiring a trip back to Settings.
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener?.("change", apply);

    return () => {
      window.removeEventListener("study2gate-appearance-change", apply);
      media?.removeEventListener?.("change", apply);
    };
  }, [location.pathname]);

  return null;
}

function PlaceholderPage({ title, description }) {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppearanceManager />
      <SessionGuard />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/accept-policy" element={<AcceptCopyrightPolicy />} />

        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        <Route
          path="/generate-flashcards"
          element={
            <ProtectedLayout>
              <GenerateFlashcards />
            </ProtectedLayout>
          }
        />

        <Route
          path="/my-flashcards"
          element={
            <ProtectedLayout>
              <MyFlashcards />
            </ProtectedLayout>
          }
        />

        <Route
          path="/my-flashcards/:id"
          element={
            <ProtectedLayout>
              <MyFlashcards />
            </ProtectedLayout>
          }
        />

        <Route
          path="/my-flashcards/study-all"
          element={
            <ProtectedLayout>
              <StudyAll />
            </ProtectedLayout>
          }
        />

        <Route
          path="/circles"
          element={
            <ProtectedLayout>
              <StudyCircles />
            </ProtectedLayout>
          }
        />

        <Route
          path="/circles/join/:token"
          element={
            <ProtectedLayout>
              <JoinCircleInvitation />
            </ProtectedLayout>
          }
        />

        <Route
          path="/circles/:id"
          element={
            <ProtectedLayout>
              <StudyCircleDetail />
            </ProtectedLayout>
          }
        />

        <Route
          path="/materials"
          element={
            <ProtectedLayout>
              <Materials />
            </ProtectedLayout>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedLayout>
              <Settings />
            </ProtectedLayout>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedLayout>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </ProtectedLayout>
          }
        />

        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/copyright" element={<CopyrightPolicy />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
