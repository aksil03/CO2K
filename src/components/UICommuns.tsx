import { type ComponentProps } from 'react';
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import Co2KLogo from '../assets/Co2K.svg'
import { CHEMIN_ACCUEIL } from '../App'
import { Form } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AlertTriangle, Leaf, Zap } from "lucide-react";
import React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"

export function Loading({ fullPage = true, message = "Chargement Master..." }: { fullPage?: boolean, message?: string }) {
    const containerClasses = fullPage
        ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm"
        : "flex flex-col items-center justify-center p-12 w-full";

    return (
        <div className={containerClasses}>
            <div className="relative flex items-center justify-center">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute w-16 h-16 rounded-full border-4 border-emerald-500/20"
                />

                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="text-emerald-500"
                >
                    <Loader2 size={40} strokeWidth={3} />
                </motion.div>
            </div>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-[10px] font-black uppercase italic tracking-[0.3em] text-emerald-700 dark:text-emerald-500 animate-pulse"
            >
                {message}
            </motion.p>
        </div>
    );
}

export function Bouton({ children, onClick, type = "button", disabled = false, className, ...props }: ComponentProps<typeof Button>) {
    return (
        <Button
            type={type}
            onClick={onClick}
            disabled={disabled}
            {...props}
            className={cn(
                "w-full h-12 bg-slate-800 text-slate-100 font-black italic uppercase text-[10px] tracking-[0.25em]",
                "rounded-xl transition-all duration-300 border-none shadow-none relative",
                "ring-1 ring-inset ring-white/5",
                "dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/5",
                "hover:bg-slate-700 dark:hover:bg-zinc-700",
                "active:scale-[0.98] active:bg-slate-900",
                "disabled:bg-slate-900/50 disabled:text-slate-600",

                className
            )}
        >
            <span className="flex items-center justify-center gap-2">
                {children}
            </span>
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

export function NavBoutonGhost({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
    return (
        <Button variant="ghost" onClick={onClick} className="text-slate-700 hover:text-emerald-700 font-bold">
            {children}
        </Button>
    )
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


export function FormTemplate({ title, form, children, footerText, linkText, linkTo }: { title: string, form: any, children: React.ReactNode, footerText: string, linkText: string, linkTo: string }) {
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

export const alerteSuppression = (onConfirm: () => void, titre = "Supprimer cet élément ?") => {
    toast.custom((t) => (
        <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-6 rounded-[2rem] shadow-2xl w-[350px] space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl">
                    <AlertTriangle size={20} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                    <p className="text-xs font-black uppercase italic leading-none">{titre}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Action irréversible</p>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => {
                        onConfirm();
                        toast.dismiss(t);
                    }}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase italic rounded-xl transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                >
                    Confirmer
                </button>
                <button
                    onClick={() => toast.dismiss(t)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[10px] font-black uppercase italic rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                >
                    Annuler
                </button>
            </div>
        </div>
    ), {
        duration: Infinity,
        position: "top-center",
    });
};


export const EmptyState = ({ message }: { message: string }) => (
    <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-[2rem] w-full">
        <p className="text-slate-400 font-black uppercase italic text-[10px] tracking-widest">
            {message}
        </p>
    </div>
);


export function SectionHeader({
    titre,
    icon,
    variant = "dark"
}: {
    titre: string,
    icon: React.ReactNode,
    variant?: "dark" | "light"
}) {
    const iconClass = variant === "dark"
        ? "p-3 bg-slate-900 text-white rounded-xl shadow-lg"
        : "p-3 bg-white border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl shadow-lg";

    return (
        <div className="flex items-center gap-4">
            <div className={iconClass}>
                {icon}
            </div>
            <div>
                <h2 className="text-2xl font-black uppercase italic">{titre}</h2>
                <div className="h-1 w-12 bg-emerald-600 rounded-full mt-1" />
            </div>
        </div>
    )
}

export function CarteImpact({ calories, co2, titre = "Impact Nutritionnel" }: { calories: number, co2: number, titre?: string }) {
    return (
        <div className="bg-zinc-950 p-6 rounded-3xl border-none shadow-xl relative overflow-hidden text-white w-full">
            <div className="absolute top-0 right-0 p-6 opacity-10">
                <Zap size={80} className="text-emerald-400 fill-emerald-400" />
            </div>
            <div className="relative z-10 space-y-4">
                <span className="text-emerald-400 font-black text-[9px] tracking-widest uppercase opacity-70">
                    {titre}
                </span>
                <div className="flex items-baseline gap-2">
                    <p id="stats-kcal-valeur" className="text-5xl font-black italic tracking-tighter leading-none">
                        {Math.round(calories)}
                    </p>
                    <span className="text-xs opacity-40 font-black uppercase">Kcal</span>
                </div>
                <div id="stats-co2-valeur" className="flex items-center gap-2 text-emerald-500 font-bold text-[9px] uppercase">
                    <Leaf size={14} />
                    {co2.toFixed(2)} KG CO2
                </div>
            </div>
        </div>
    );
}