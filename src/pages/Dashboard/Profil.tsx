import React, { useEffect, useState } from 'react';
import axios from 'axios';
import type { UserWithRelations } from '../../lib/types'; 

function Profil(props: { email: string }) {
  const [user, setUser] = useState<UserWithRelations | null>(null);

  useEffect(() => {
    axios.get("http://localhost:3000/api/utilisateur?email=" + props.email)
      .then(res => setUser(res.data));
  }, [props.email]);

  if (!user) return <p>Recherche d'utilisateur</p>;

  return (
    <div>
      <h1>{user.prenom} {user.nom}</h1>
    </div>
  );
}

export default Profil;