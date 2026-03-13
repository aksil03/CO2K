import { useState } from 'react'
import axios from 'axios' 
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const test = async () => {
    try {
      const res = await axios.post('http://localhost:3000/api/connexion', { 
        email, 
        password 
      })

      alert(res.data.prenom)
      
    } catch (err: any) {
      alert("erreur")
    }
  }

  return (
    <div className="p-10 space-y-4 max-w-xs mx-auto">
      <h1 className="text-xl font-bold">Test</h1>
      <Input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <Input type="password" placeholder="Mdp" onChange={e => setPassword(e.target.value)} />
      <Button onClick={test} className="w-full">Valider</Button>
    </div>
  )
}