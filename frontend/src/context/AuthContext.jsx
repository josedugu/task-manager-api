import { createContext, useContext, useEffect, useState } from "react";
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

		// 2. Decode JWT to extract user ID
		// NOTE: A production app should validate JWT signature server-side.
		// Here we only decode to extract the user ID from the payload.
		const userInfo = { username, role: "member" }; // Defaulting for now

		try {
			// Safely decode JWT payload
			const payload = JSON.parse(atob(token.split(".")[1]));
			userInfo.id = payload.sub;
		} catch (error) {
			// Token is malformed or invalid - force logout for security
			console.error("Failed to decode JWT:", error);
			logout();
			throw new Error("Invalid authentication token");
		}

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
