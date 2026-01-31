import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { loginSchema } from "../schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data) => {
		try {
			await login(data.username, data.password);
			toast.success("Successfully logged in");
			navigate("/task");
		} catch (_err) {
			toast.error("Invalid credentials");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-muted/20 p-4">
			<div className="w-full max-w-md">
				{/* Card Container */}
				<div className="bg-card border border-border rounded-lg shadow-lg p-8 space-y-6">
					{/* Header */}
					<div className="text-center space-y-2">
						<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
							<LogIn className="w-6 h-6 text-primary" />
						</div>
						<h1 className="text-3xl font-bold tracking-tight text-foreground">
							Welcome Back
						</h1>
						<p className="text-sm text-muted-foreground">
							Sign in to your account to continue
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						{/* Username Field */}
						<div className="space-y-2">
							<Label htmlFor="username" className="text-foreground">
								Username
							</Label>
							<Input
								id="username"
								type="text"
								placeholder="Enter your username"
								className="text-foreground bg-background"
								autoComplete="username"
								{...register("username")}
							/>
							{errors.username && (
								<p className="text-destructive text-xs mt-1">
									{errors.username.message}
								</p>
							)}
						</div>

						{/* Password Field */}
						<div className="space-y-2">
							<Label htmlFor="password" className="text-foreground">
								Password
							</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="Enter your password"
									className="text-foreground bg-background pr-10"
									autoComplete="current-password"
									{...register("password")}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
									tabIndex={-1}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
							{errors.password && (
								<p className="text-destructive text-xs mt-1">
									{errors.password.message}
								</p>
							)}
						</div>

						{/* Submit Button */}
						<Button
							type="submit"
							className="w-full"
							disabled={isSubmitting}
							size="lg"
						>
							{isSubmitting ? (
								<>
									<span className="animate-spin mr-2">⏳</span>
									Signing In...
								</>
							) : (
								<>
									<LogIn className="w-4 h-4 mr-2" />
									Sign In
								</>
							)}
						</Button>
					</form>

					{/* Footer */}
					<div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
						<p>Task Manager API - Secure Login</p>
					</div>
				</div>
			</div>
		</div>
	);
}
