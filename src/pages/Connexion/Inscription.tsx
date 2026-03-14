import { useState } from 'react'
import axios from 'axios'
import { Input } from "@/components/ui/input"
import { CHEMIN_LOGIN } from '../../App'
import { BoutonVert, FormTemplate } from '../../components/componentsCommuns'

export default function Inscription() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')

  const inscriptionUtilisateur = async () => {
    try {
      await axios.post('http://localhost:3000/api/inscription', { 
        nom, 
        prenom, 
        email, 
        password 
      })
      alert("Inscription réussie ! Vous pouvez vous connecter.")
    } catch (err) {
      alert("Erreur lors de l'inscription")
    }
  }

  return (
    <FormTemplate 
      title="Inscription"
      footerText="Déjà un compte ?"
      linkText="Se connecter"
      linkTo={CHEMIN_LOGIN}
    >
      <div className="space-y-4">
        <Input 
          placeholder="Nom" 
          onChange={e => setNom(e.target.value)} 
        />
        <Input 
          placeholder="Prénom" 
          onChange={e => setPrenom(e.target.value)} 
        />
        <Input 
          placeholder="Email" 
          onChange={e => setEmail(e.target.value)} 
        />
        <Input 
          type="password" 
          placeholder="Mot de passe" 
          onChange={e => setPassword(e.target.value)} 
        />
        
        <BoutonVert onClick={inscriptionUtilisateur}>
          Créer mon compte
        </BoutonVert>
      </div>
    </FormTemplate>
  )
}