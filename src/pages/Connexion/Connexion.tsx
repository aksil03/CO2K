import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from 'axios'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { BoutonVert, FormTemplate } from '../../components/componentsCommuns'
import { LoginFormSchema, type LoginData } from "@/lib/types" 
import { toast } from "sonner"
import { useNavigate } from "react-router-dom";
import { CHEMIN_DASHBOARD, CHEMIN_INSCRIPTION } from '../../App'

export default function Connexion() {
  const navigate = useNavigate();
  const form = useForm<LoginData>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { email: "", password: "" },
  })

const valide = async (values: LoginData) => {
    try {
      const res = await axios.post('http://localhost:3000/api/connexion', values)
      localStorage.setItem("token", res.data.token); 
      localStorage.setItem("user_prenom", res.data.prenom); 
      localStorage.setItem("user_email", res.data.email);

      window.dispatchEvent(new Event("storage"));
      
      toast.success("Connexion réussie", {
        description: `Content de vous revoir, ${res.data.prenom} !`,
      })

      navigate(CHEMIN_DASHBOARD(res.data.email));

    } catch (err: any) {
      toast.error("Échec de la connexion", {
        description: "Identifiants invalides ou compte inexistant.",
      })
    }
  }

return (
    <FormTemplate 
      title="Connexion"
      form={{ ...form, onSubmit: valide }}
      footerText="Pas encore inscrit ?"
      linkText="Créer un compte"
      linkTo={CHEMIN_INSCRIPTION}
    >
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-black font-semibold">Email</FormLabel>
            <FormControl>
              <Input 
                placeholder="eco@co2k.fr" 
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
            <FormLabel className="text-black font-semibold">Mot de passe</FormLabel>
            <FormControl>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="bg-white border-slate-200 text-black focus:border-black transition-all"
                {...field} 
              />
            </FormControl>
            <FormMessage className="text-red-500 text-xs" />
          </FormItem>
        )}
      />
      <BoutonVert type="submit">
        Se connecter
      </BoutonVert>
    </FormTemplate>
  )}