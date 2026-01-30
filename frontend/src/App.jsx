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

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<Toaster position="bottom-right" richColors />
			<Routes>
				<Route path="/login" element={<LoginPage />} />

				{/* Protected Routes */}
				<Route element={<ProtectedRoute />}>
					<Route path="/" element={<DashboardPage />} />
				</Route>

				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</QueryClientProvider>
	);
}

export default App;
