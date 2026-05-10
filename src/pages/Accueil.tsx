import React from 'react';
import { motion } from 'framer-motion'; 
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accueil_assets } from '@/lib/constants';
import { useTheme } from '../providers/theme-provider';
import dashboardDark from '@/assets/Dashboard_dark.png';
import dashboardWhite from '@/assets/dashboard_white.png';

const Accueil = () => {
  const { theme } = useTheme();

  const scrollSmooth = () => {
    const element = document.getElementById('01');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <section className="relative w-full pt-16 md:pt-24 pb-6 flex items-center justify-center flex-col overflow-hidden min-h-[90vh]">

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] -z-10" />
        
        <p className="text-center font-bold text-zinc-500 uppercase tracking-widest mb-4 text-[9px] md:text-xs opacity-70">
          NUTRITION INTELLIGENTE
        </p>

        <div className="relative">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-7xl md:text-[130px] font-black text-center leading-[0.7] text-black dark:text-white select-none"
          >
            CO2K
          </motion.h1>
        </div>

        <div className="flex justify-center items-center relative mt-[-10px] md:mt-[-25px] px-4 w-full max-w-[950px] z-20">
          <motion.img 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            src={theme === 'dark' ? dashboardDark : dashboardWhite}
            alt="Dashboard Preview"
            className="rounded-lg md:rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full h-auto"
          />

          <div className="bottom-0 h-16 bg-gradient-to-t from-white dark:from-zinc-950 left-0 right-0 absolute z-10" />
        </div>

        <button 
          onClick={scrollSmooth}
          className="mt-8 flex flex-col items-center gap-1 text-gray-400 bg-transparent font-bold hover:text-green-600 border-none transition-all hover:scale-110 z-20"
        >
          <span className="text-[9px] uppercase tracking-widest">Découvrir l'application</span>
          <span className="animate-bounce text-xl">↓</span>
        </button>
      </section>

      <div id="contenu">
        {Accueil_assets.map((item: any) => (
          <section 
            key={item.id}
            id={item.id}
            className={`min-h-screen flex flex-col relative px-10 md:px-20 overflow-hidden py-20 ${item.estCentre ? 'items-center justify-center' : 'md:flex-row items-center'} ${!item.estCentre && item.inverserPosition ? 'md:flex-row-reverse' : ''}`}
          >
            <span 
              className={`absolute font-black select-none pointer-events-none ${item.chiffreCouleur} ${item.chiffrePosition}`} 
              style={{ fontSize: item.estCentre ? '30rem' : '25rem' }}
            >
              {item.id}
            </span>
            
            <div className={`flex flex-col items-center justify-between w-full z-10 gap-10 ${item.estCentre ? 'flex-col' : item.inverserPosition ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
              <motion.img 
                src={item.image} 
                alt={item.titre} 
                animate={item.animation}
                transition={item.transition}
                className={`${item.id === '02' ? 'w-56 md:w-80' : 'w-64 md:w-96'} h-auto drop-shadow-2xl`} 
              />
              
              <div className={`max-w-2xl ${item.estCentre ? 'text-center' : item.inverserPosition ? 'md:text-right' : 'md:text-left'}`}>
                <Badge className={`${item.badgeCouleur} text-white mb-5 px-5 py-2 text-lg`}>
                  {item.badge}
                </Badge>
                <h2 className={`text-5xl md:text-7xl font-black italic mb-5 ${item.titreCouleur}`}>
                  {item.titre}
                </h2>
                <Separator className={`my-5 bg-current h-1 ${item.id === '03' ? 'w-40 mx-auto' : 'w-32'} ${item.estCentre ? 'mx-auto' : item.inverserPosition ? 'ml-auto' : 'mx-auto md:ml-0'}`} />
                <p className={`text-2xl md:text-3xl font-medium ${item.descCouleur} ${item.id === '03' ? 'italic' : ''}`}>
                  {item.description}
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
};

export default Accueil;