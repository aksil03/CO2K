import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion';
import { Button } from './ui/button'
import Co2KLogo from '../assets/Co2K.svg'
import { CHEMIN_ACCUEIL } from '../App'
import { Form } from "@/components/ui/form"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Utensils } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MODELES_REPAS } from "@/lib/constants";
import { type TemplateRepas, type Aliment } from "@/lib/types";

export function BoutonVert({ children, onClick, type = "button", disabled = false, className }: any) {
  return (
    <Button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn("w-full bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-all border-none shadow-md", className)}
    >
      {children}
    </Button>
  )
}

export function LogoCo2K() {
  return (
    <Link to={CHEMIN_ACCUEIL} className="group flex items-center gap-2">
      <motion.img 
        whileHover={{ rotate: -10, scale: 1.1 }}
        src={Co2KLogo} 
        alt="Logo" 
        className="h-10"
        style={{ filter: 'invert(30%) sepia(75%) saturate(450%) hue-rotate(115deg)' }}
      />
      <span className="text-xl font-bold text-emerald-700">CO2K</span>
    </Link>
  )
}

export function NavBoutonGhost({ children, onClick }: any) {
  return (
    <Button variant="ghost" onClick={onClick} className="text-slate-700 hover:text-emerald-700 font-bold">
      {children}
    </Button>
  )
}

export function CardRepasMaster({ title, icon, colorClass, children, action }: any) {
  return (
    <div className="h-full group">
      <Card className={cn(
        "relative h-full rounded-[2rem] transition-all duration-300 overflow-hidden text-left border",
        "bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200",
        "dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-zinc-700 dark:shadow-none"
      )}>
        
        <div className={cn(
          "absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          colorClass?.replace('text', 'bg') || "bg-emerald-500"
        )} />

        <CardHeader className="p-7 pb-0 space-y-0 flex flex-row justify-between items-start">
          <div className="space-y-0.5">
            <CardDescription className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
              Nutrition
            </CardDescription>
            
            <div className="flex items-center gap-2.5">
              <div className={cn("shrink-0 transition-colors duration-300", colorClass)}>
                {icon}
              </div>
              <CardTitle className="text-xl font-black uppercase italic text-slate-900 dark:text-zinc-100">
                {title}
              </CardTitle>
            </div>
          </div>

          <div className="shrink-0">
            {action ? (
              <div className="opacity-40 group-hover:opacity-100 transition-all duration-300">
                {action}
              </div>
            ) : (
              <Utensils size={14} className="text-slate-200 dark:text-zinc-800" />
            )}
          </div>
        </CardHeader>

        <CardContent className={cn(
          "p-7 pt-6 transition-colors duration-300",
          "text-slate-600 dark:text-zinc-400",
          "[&_span]:dark:text-zinc-200 [&_span]:font-black [&_span]:italic [&_span]:text-sm"
        )}>
          <div className="space-y-3.5">
            {children}
          </div>
        </CardContent>

        <div className="absolute inset-0 pointer-events-none bg-linear-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Card>
    </div>
  );
}

export function BadgePoids({ poids }: { poids: number }) {
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "rounded-xl font-black italic border-none px-3 py-1 shrink-0 transition-all duration-300",
        "bg-emerald-50 text-emerald-700", 
        "dark:bg-emerald-500/10 dark:text-emerald-400 dark:group-hover:bg-emerald-500/20"
      )}
    >
      {Math.round(poids)}g
    </Badge>
  );
}


export function AjusterRepasForm({ repas, tousLesAliments, onUpdatePortion }: { 
  repas: any, 
  tousLesAliments: Aliment[], 
  onUpdatePortion: (repasId: number, portionIndex: number, alimentId: string, quantite: number) => void 
}) {
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 space-y-4 overflow-y-auto pr-2"
    >
      {repas.portions.map((portion: any, index: number) => {
        const templateKey = repas.nomTemplate as TemplateRepas;
        const structureAttendue = MODELES_REPAS[templateKey] || [];
        const bacsAutorises = structureAttendue.find((groupe: any) => 
          groupe.includes(portion.aliment.bac)
        ) || (structureAttendue[index] || []);
        
        const optionsAliments = (tousLesAliments || []).filter(
          (aliment: any) => String(aliment.bac).toUpperCase() === String(portion.aliment.bac).toUpperCase()
        );

        return (
          <motion.div 
            key={index} 
            className="relative p-4 rounded-xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 transition-colors"
          >
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-xs font-bold text-slate-400">
                {index + 1}
              </div>
              <div className="w-full md:w-40">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Catégorie</p>
                <Select 
                  value={portion.aliment.bac} 
                  onValueChange={(nouveauBac) => {
                    const premierAliment = tousLesAliments.find((a: any) => String(a.bac) === String(nouveauBac));
                    if (premierAliment) onUpdatePortion(repas.id, index, premierAliment.id.toString(), portion.quantite);
                  }}
                >
                  <SelectTrigger className="border-none bg-slate-50 dark:bg-zinc-800 font-bold text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bacsAutorises.map((bac: string) => (
                      <SelectItem key={bac} value={bac} className="text-xs font-bold uppercase">{bac}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 w-full">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Aliment</p>
                <Select 
                  value={portion.aliment.id.toString()} 
                  onValueChange={(nouvelAlimentId) => onUpdatePortion(repas.id, index, nouvelAlimentId, portion.quantite)}
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 font-bold">
                    <SelectValue>{portion.aliment.nom}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {optionsAliments.map((opt: any) => (
                      <SelectItem key={opt.id} value={opt.id.toString()} className="font-bold">{opt.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-32">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1 md:text-right">Poids (g)</p>
                <div className="relative">
                  <Input 
                    type="number" 
                    className="rounded-lg border-none bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-right pr-8"
                    value={Math.round(portion.quantite)} 
                    onChange={(e) => onUpdatePortion(repas.id, index, portion.aliment.id.toString(), Number(e.target.value))} 
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-emerald-500 opacity-50">G</span>
                </div>
              </div>

            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export function FormTemplate({ title, form, children, footerText, linkText, linkTo }: any) {
  return (
    <div className="py-24 w-full flex justify-center px-4 relative">
      <motion.div 
        layout
        className="w-full max-w-md p-10 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-2xl transition-colors duration-300"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-8">
            {title}
          </h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(form.onSubmit)} className="space-y-6 text-left dark:[&_label]:text-white dark:[&_input]:text-white dark:[&_input]:bg-zinc-800">
              {children}
            </form>
          </Form>

          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-zinc-800">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {footerText}{" "}
              <Link to={linkTo} className="text-emerald-600 dark:text-white font-bold hover:text-emerald-700 transition-colors">
                {linkText}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}