import { Button } from "@/components/ui/button";
import { AlertCircle, Ban, FileWarning } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ErrorPage({ type = "404", message, onRetry }) {
  const navigate = useNavigate();

  const config = {
    "404": {
      icon: FileWarning,
      title: "Page not found",
      desc: "Sorry, we couldn't find the page you're looking for.",
    },
    "403": {
      icon: Ban,
      title: "Access Denied",
      desc: "You don't have permission to access this resource.",
    },
    "500": {
      icon: AlertCircle,
      title: "Something went wrong",
      desc: message || "An unexpected error occurred. Please try again.",
    },
  };

  const { icon: Icon, title, desc } = config[type] || config["500"];

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mb-6 text-muted-foreground max-w-sm">{desc}</p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        {type === "500" && onRetry ? (
          <Button onClick={onRetry}>Try Again</Button>
        ) : (
          <Button onClick={() => navigate("/")}>Go Home</Button>
        )}
      </div>
    </div>
  );
}
