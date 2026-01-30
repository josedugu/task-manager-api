import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";

// Protected Route Wrapper
const ProtectedRoute = () => {
	const { isAuthenticated } = useAuth();
	return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />

			{/* Protected Routes */}
			<Route element={<ProtectedRoute />}>
				<Route path="/" element={<DashboardPage />} />
			</Route>

			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

export default App;
