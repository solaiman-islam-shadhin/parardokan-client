import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../ui/LoadingSpinner";

interface Props {
  children: ReactNode;
  role: "customer" | "shopkeeper";
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;

  if (!user) return <Navigate to="/auth" replace />;

  if (!profile || !profile.setupComplete) {
    return <Navigate to="/auth" replace />;
  }

  if (profile.role !== role) {
    return (
      <Navigate
        to={profile.role === "customer" ? "/customer" : "/shopkeeper"}
        replace
      />
    );
  }

  return <>{children}</>;
}
