import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import api from '@/lib/api'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Bouton, FormTemplate } from '@/components'
import { LoginFormSchema, type LoginData } from "@/lib/types"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom";
import { CHEMIN_DASHBOARD, CHEMIN_INSCRIPTION } from '../../App'
import { Loader2 } from "lucide-react"

export default function Connexion() {
  const navigate = useNavigate();
  const form = useForm<LoginData>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { email: "", password: "" },
  })

  const valide = async (values: LoginData) => {
    try {
      const res = await api.post('/api/connexion', values)

      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("user_prenom", res.data.prenom);
      sessionStorage.setItem("user_email", res.data.email);


      window.dispatchEvent(new Event("storage"));

      toast.success("Connexion réussie", {
        description: `Content de vous revoir, ${res.data.prenom}`,
      })

      navigate(CHEMIN_DASHBOARD(res.data.email));

    } catch (err: any) {
      const messageErreur = err.response?.data?.message || "Identifiants invalides.";

      toast.error("Échec de la connexion", {
        description: messageErreur,
      });
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
      <Bouton type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className="animate-spin mr-2 h-4 w-4 inline" />
            Connexion en cours...
          </>
        ) : (
          "Se connecter"
        )}
      </Bouton>
    </FormTemplate>
  )
}