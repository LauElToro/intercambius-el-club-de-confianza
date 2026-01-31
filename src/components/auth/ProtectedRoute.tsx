import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem("intercambius_token");
  const user = localStorage.getItem("intercambius_user");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
