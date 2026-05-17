import { Navigate } from "react-router-dom";
import { CHEMIN_LOGIN } from "./App";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem("token");


  if (!token) {
    return <Navigate to={CHEMIN_LOGIN} replace />;
  }

  try {
    const parties = token.split('.');
    if (parties.length !== 3) throw new Error("Token invalide");
    const payloadBrut = window.atob(parties[1]);
    const payload = JSON.parse(payloadBrut);
    const maintenant = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < maintenant) {
      localStorage.clear();
      return <Navigate to={CHEMIN_LOGIN} replace />;
    }
  } catch (error) {
    sessionStorage.clear();
    return <Navigate to={CHEMIN_LOGIN} replace />;
  }

  return <>{children}</>;
}