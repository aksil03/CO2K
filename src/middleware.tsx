import { Navigate } from "react-router-dom";
import { CHEMIN_LOGIN } from "./App";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to={CHEMIN_LOGIN} replace />;
  }

  return <>{children}</>;
}