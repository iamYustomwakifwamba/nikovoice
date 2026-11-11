
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
  logout as logoutService,
} from "./authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const login = async (credentials) => {
    const data = await loginService(credentials);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    return await registerService(userData);
  };

  const logout = async () => {
    await logoutService();
    setUser(null);
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
