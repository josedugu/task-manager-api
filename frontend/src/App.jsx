import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "./context/AuthContext";

// Create a client
const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute = () => {
	const { isAuthenticated } = useAuth();
	return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

import { ThemeProvider } from "@/components/theme-provider";
import ErrorBoundary from "@/components/ErrorBoundary";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));

const RouteFallback = () => (
	<div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
		Loading...
	</div>
);

function App() {
	return (
		<ErrorBoundary>
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				<QueryClientProvider client={queryClient}>
					<Toaster position="bottom-right" richColors />
					<Suspense fallback={<RouteFallback />}>
						<Routes>
							<Route path="/login" element={<LoginPage />} />

							{/* Protected Routes */}
							<Route element={<ProtectedRoute />}>
								<Route path="/" element={<Navigate to="/task" replace />} />
								<Route path="/task" element={<TasksPage />} />
								<Route path="/dashboard" element={<DashboardPage />} />
								<Route path="/settings" element={<SettingsPage />} />
							</Route>

							{/* 404 Route */}
							<Route path="*" element={<ErrorPage type="404" />} />
						</Routes>
					</Suspense>
				</QueryClientProvider>
			</ThemeProvider>
		</ErrorBoundary>
	);
}

export default App;
