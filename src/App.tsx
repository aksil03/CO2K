import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from "./components/Navbar";
import Acc from "./pages/Accueil";
import Conn from "./pages/Connexion/Connexion";
import Dash from "./pages/Dashboard";
import Insc from "./pages/Connexion/Inscription";

export const CHEMIN_ACCUEIL = "/";
export const CHEMIN_LOGIN = "/login";
export const CHEMIN_DASHBOARD = "/dashboard";
export const CHEMIN_INSCRIPTION = "/Inscription";

function App() {
  return (
    <Router>
      <div className="min-h-screen w-full [background:radial-gradient(125%_125%_at_50%_10%,#fff_20%,#10b981_100%)] bg-fixed">
        <Navbar />
        
        <Routes>
          <Route path={CHEMIN_ACCUEIL} element={<Acc />} />
          <Route path={CHEMIN_LOGIN} element={<Conn />} />
          <Route path={CHEMIN_DASHBOARD} element={<Dash />} />
          <Route path={CHEMIN_INSCRIPTION} element={<Insc />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;