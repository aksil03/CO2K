import React, { useState } from 'react';
import data from '../../../data/database_co2k.json'; 
import { Input } from "@/components/ui/input";
import { Button } from '@base-ui/react/button';
import { Search } from "lucide-react";
import './Dashboard.css';

const Repas = () => {
  const [categorie, setCategorie] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");

  const categories = Object.keys(data); 

  return (
    <div className="container">
      {categorie && <button
      className='back-button'
      onClick={() => setCategorie(null)}>Retour aux catégories</button>}

      {!categorie ? (

        <div className="grid">
          {categories.map((cat) => (
            <div key={cat} className="card-category" onClick={() => setCategorie(cat)}>
              <h3>{cat.replace("_", " ")}</h3>
              <p>Voir les {data[cat as keyof typeof data].length} aliments</p>
            </div>
          ))}
        </div>
      ) : (


        <div>
          <Search style={{position:"relative", left:"820px", top:"55px" }}></Search>
          <Input 
            style={{position:"relative", left:"25%", width:"50%", height:"50px",margin:"20px", borderRadius:"15px"}}
          
            placeholder="Rechercher un aliment" 
            onChange={(e) => setRecherche(e.target.value)} 
          />
          <div className="grid">
            {data[categorie as keyof typeof data]
              .filter((alim: any) => alim.nom.toLowerCase().includes(recherche.toLowerCase()))
              .map((aliment: any, index: number) => (
                <div key={index} className="card">
                  <h3 style={{fontWeight:"bold"}}>{aliment.nom}</h3>
                  <p><strong>CO2:</strong> {aliment.co2} kg</p>
                  <p><strong>Calories:</strong> {aliment.cal} kcal</p>
                  <p><strong>Protéines:</strong> {aliment.prot}g</p>
                  <p><strong>Lip:</strong>{aliment.lip}</p>
                  <p><strong>GRAS_Sat:</strong>{aliment.gras_sat}</p>
                  <p><strong>GLUCIDES:</strong>{aliment.glu}</p>
                  <p><strong>SUCRE:</strong>{aliment.sucre}</p>
                </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Repas;













