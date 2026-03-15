import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from 'axios'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { CHEMIN_LOGIN } from '../../App'
import { BoutonVert, FormTemplate } from '../../components/componentsCommuns'
import { InscriptionFormSchema, type InscriptionData } from "@/lib/types" 
import { toast } from "sonner"

export default function Inscription() {
  const form = useForm<InscriptionData>({
    resolver: zodResolver(InscriptionFormSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      password: "",
    },
  })

  const inscriptionUtilisateur = async (values: InscriptionData) => {
    try {
      await axios.post('http://localhost:3000/api/inscription', values)
      
      toast.success("Compte créé avec succès !", {
        description: `Bienvenue parmi nous, ${values.prenom} ! Vous pouvez vous connecter.`,
      })
      form.reset()

    } catch (err: any) {
      toast.error("Erreur d'inscription", {
        description: "Un compte existe déjà avec cet email.",
      })
    }
  }

  return (
    <FormTemplate 
      title="Inscription"
      form={{ ...form, onSubmit: inscriptionUtilisateur }}
      footerText="Déjà un compte ?"
      linkText="Se connecter"
      linkTo={CHEMIN_LOGIN}
    >
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black font-bold">Nom</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nom" 
                  className="bg-white border-slate-200 text-black focus:border-black transition-all"
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-red-500 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prenom"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black font-bold">Prénom</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Prénom" 
                  className="bg-white border-slate-200 text-black focus:border-black transition-all"
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-red-500 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black font-bold">Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Email" 
                  className="bg-white border-slate-200 text-black focus:border-black transition-all"
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-red-500 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black font-bold">Mot de passe</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Mot de passe" 
                  className="bg-white border-slate-200 text-black focus:border-black transition-all"
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-red-500 text-xs" />
            </FormItem>
          )}
        />
        
        <BoutonVert type="submit" className="w-full">
          Créer mon compte
        </BoutonVert>
      </div>
    </FormTemplate>
  )
}