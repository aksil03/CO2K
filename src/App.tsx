import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from "./components/Navbar";
import Acc from "./pages/Accueil";
import Conn from "./pages/Connexion/Connexion";
import Dash from "./pages/Dashboard";
import Insc from "./pages/Connexion/Inscription";
import { Toaster } from "@/components/ui/sonner"
import { ProtectedRoute } from "./middleware";
import { ThemeProvider } from "./providers/theme-provider"

export const CHEMIN_ACCUEIL = "/";
export const CHEMIN_LOGIN = "/login";
export const CHEMIN_DASHBOARD = "/dashboard";
export const CHEMIN_INSCRIPTION = "/Inscription";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Toaster theme="dark" position="bottom-right" richColors />
      <Router>
        <div className="relative min-h-screen w-full bg-white dark:bg-zinc-950 transition-colors duration-300">
          
          <div className="absolute inset-0 z-0 h-full w-full 
            bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] 
            dark:bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] 
            bg-[size:14px_24px] 
            [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]">
          </div>
          
          <div className="relative z-10">
            <Navbar />
            
            <main>
              <Routes>
                <Route path={CHEMIN_ACCUEIL} element={<Acc />} />
                <Route path={CHEMIN_LOGIN} element={<Conn />}/>
                <Route path={CHEMIN_DASHBOARD} element={<ProtectedRoute><Dash /></ProtectedRoute>} />
                <Route path={CHEMIN_INSCRIPTION} element={<Insc />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;