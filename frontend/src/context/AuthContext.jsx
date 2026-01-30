import { createContext, useState, useContext, useEffect } from "react";
import { authService } from "../services/auth.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Init: Check if token exists
    const token = localStorage.getItem("token");
    if (token) {
      // Decode token? For simplicity, we assume robust persistence isn't needed for Auth MVP
      // Ideally we would fetch /me here if endpoint existed.
      // For now, we rely on the fact that if request fails 401, client.js redirects to login.
      // We can persist user info in localStorage too for UI purposes.
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // 1. Get Token
    const data = await authService.login(username, password);
    const token = data.access_token;
    localStorage.setItem("token", token);

    // 2. Fetch User Details (Or use username from input since we don't have /me)
    // Ideally backend should return user info on login or have /me endpoint.
    // Let's assume for MVP we only have username. 
    // Wait! The /login response DOES NOT return user info, only token.
    // We need /users/me endpoint? Or decode JWT.
    // For MVP speed: just save username provided.
    // UPDATE: Our backend doesn't have /me. Let's decode or simply store the username entered.

    const userInfo = { username, role: "member" }; // Defaulting for now
    // NOTE: A better way is to parse the JWT payload which contains "sub" (id).

    // Let's rely on decoding JWT to get ID at least.
    const payload = JSON.parse(atob(token.split('.')[1]));
    userInfo.id = payload.sub;

    setUser(userInfo);
    localStorage.setItem("user", JSON.stringify(userInfo));
    return true;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  if (loading) return <div>Loading...</div>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
