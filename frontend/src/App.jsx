import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "./context/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";

// Create a client
const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute = () => {
	const { isAuthenticated } = useAuth();
	return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

import { ThemeProvider } from "@/components/theme-provider";
import ErrorBoundary from "@/components/ErrorBoundary";
import ErrorPage from "@/pages/ErrorPage";

function App() {
	return (
		<ErrorBoundary>
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				<QueryClientProvider client={queryClient}>
					<Toaster position="bottom-right" richColors />
					<Routes>
						<Route path="/login" element={<LoginPage />} />

						{/* Protected Routes */}
						<Route element={<ProtectedRoute />}>
							<Route path="/" element={<DashboardPage />} />
						</Route>

						{/* 404 Route */}
						<Route path="*" element={<ErrorPage type="404" />} />
					</Routes>
				</QueryClientProvider>
			</ThemeProvider>
		</ErrorBoundary>
	);
}

export default App;
