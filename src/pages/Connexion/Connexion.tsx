import { useState } from 'react'
import axios from 'axios' 
import { Input } from "@/components/ui/input"
import { CHEMIN_INSCRIPTION } from '../../App'
import { BoutonVert, FormTemplate } from '../../components/componentsCommuns'

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const connexionUtilisateur = async () => {
    try {
      const res = await axios.post('http://localhost:3000/api/connexion', { email, password })
      alert(`Bienvenue ${res.data.prenom}`)
    } catch (err: any) {
      alert("Erreur de connexion")
    }
  }

  return (
    <FormTemplate 
      title="Connexion"
      footerText="Pas encore inscrit ?"
      linkText="Créer un compte"
      linkTo={CHEMIN_INSCRIPTION}
    >
      <Input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <Input type="password" placeholder="Mdp" onChange={e => setPassword(e.target.value)} />
      
      <BoutonVert onClick={connexionUtilisateur}>
        Se connecter
      </BoutonVert>
    </FormTemplate>
  )
}