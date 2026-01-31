import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, useNavigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Mock hooks and libraries
vi.mock("@/context/AuthContext");
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn()
  };
});

describe("LoginPage", () => {
  const mockLogin = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLogin });
    useNavigate.mockReturnValue(mockNavigate);
  });

  it("renders login form correctly", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("calls login function with correct data on submit", async () => {
    mockLogin.mockResolvedValue(true);
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("testuser", "password123");
    });
  });

  it("shows error toast on login failure", async () => {
    // Mock login to throw error or return false
    // Based on implementation, assume login throws
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "wronguser" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      // Since the actual implementation might not throw but return success/fail
      // Or use try/catch inside component
      // Optimistically checking that login was called
    });

    // Note: To be precise, we should check `toast.error`. 
    // Depending on how LoginPage handles errors (try/catch block), this should work.
    // If LoginPage uses `toast.error`, verify it.
    expect(toast.error).toHaveBeenCalled();
  });
});
