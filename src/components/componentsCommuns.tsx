import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import Co2KLogo from '../assets/Co2K.svg'
import { CHEMIN_ACCUEIL } from '../App'
import { Form } from "@/components/ui/form"

export function BoutonVert({ children, onClick, type = "button", disabled = false }: any) {
  return (
    <Button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-all border-none shadow-md"
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
      <span className="text-xl font-bold text-emerald-700">
        CO2K
      </span>
    </Link>
  )
}

export function NavBoutonGhost({ children, onClick }: any) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick}
      className="text-slate-700 hover:text-emerald-700 font-bold"
    >
      {children}
    </Button>
  )
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
            <form onSubmit={form.handleSubmit(form.onSubmit)} className="space-y-6 text-left">
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