import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginSchema } from "../schemas/auth.schema";

export default function LoginPage() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [error, setError] = useState(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data) => {
		setError(null);
		try {
			await login(data.username, data.password);
			navigate("/"); // Go to Dashboard
		} catch (_err) {
			setError("Invalid credentials");
		}
	};

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100vh",
			}}
		>
			<div className="card" style={{ width: "400px" }}>
				<h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Login</h2>
				{error && (
					<div
						style={{ color: "red", marginBottom: "1rem", textAlign: "center" }}
					>
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit(onSubmit)}>
					<label
						htmlFor="username"
						style={{ display: "block", marginBottom: "0.5rem" }}
					>
						Username
					</label>
					<input
						id="username"
						className="input"
						type="text"
						{...register("username")}
					/>
					{errors.username && (
						<p style={{ color: "red", fontSize: "0.8em", marginTop: "-5px" }}>
							{errors.username.message}
						</p>
					)}

					<label
						htmlFor="password"
						style={{ display: "block", marginBottom: "0.5rem" }}
					>
						Password
					</label>
					<input
						id="password"
						className="input"
						type="password"
						{...register("password")}
					/>
					{errors.password && (
						<p style={{ color: "red", fontSize: "0.8em", marginTop: "-5px" }}>
							{errors.password.message}
						</p>
					)}

					<button
						className="btn btn-primary"
						style={{ width: "100%" }}
						type="submit"
						disabled={isSubmitting}
					>
						{isSubmitting ? "Signing In..." : "Sign In"}
					</button>
				</form>
			</div>
		</div>
	);
}
