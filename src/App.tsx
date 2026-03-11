import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from "./components/Navbar";
import Acc from "./pages/Accueil";
import Conn from "./pages/Connexion";
import Dash from "./pages/Dashboard";

function App() {
  return (
    <Router>
      <div className="min-h-screen w-full [background:radial-gradient(125%_125%_at_50%_10%,#fff_20%,#10b981_100%)] bg-fixed">
        <Navbar />
        
        <Routes>
          <Route path="/" element={<Acc />} />
          
          <Route path="/login" element={<Conn />} />
          <Route path="/dashboard" element={<Dash />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;