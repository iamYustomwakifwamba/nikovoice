import { useContext } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { AuthContext } from "../src/auth/authContext";

import HomePage from "./pages/Home";
import TtsPage from "./pages/Tts";
import VoicesPage from "./pages/Voices";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";


// Protect pages that require authentication
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation();

  // Wait until authentication check is complete
  if (isLoading) {
    return <div>Checking your session...</div>;
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
}


function App() {
  return (
    <Routes>

      {/* Public Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />

      {/* Protected Pages */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/app/text-to-speech" element={<TtsPage />} />
        <Route path="/voices" element={<VoicesPage />} />
      </Route>

      {/* Default Route */}
     

    </Routes>
  );
}

export default App;