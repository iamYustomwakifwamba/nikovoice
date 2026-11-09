
import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  login as loginService,
  register as registerService,
  getProfile,
} from "./authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check existing session when application starts
  const checkAuth = useCallback(async () => {
    try {
      const data = await getProfile();

      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login
  const login = async (credentials) => {
    const data = await loginService(credentials);

    setUser(data.user);

    return data.user;
  };

  // Register
  const register = async (userData) => {
    return await registerService(userData);
  };

  // Logout placeholder
  const logout = async () => {
    throw new Error("Logout endpoint has not been implemented yet.");
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
