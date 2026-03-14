import React from 'react';
import { motion } from 'framer-motion'; 
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accueil_assets } from '@/lib/constants';

const Accueil = () => {
  const scrollSmooth = () => {
    const element = document.getElementById('contenu');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <main className="flex flex-col items-center justify-center h-screen px-5 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.0 }} 
          className="text-8xl font-black text-black"
        >
          CO2<span className="text-green-600">K</span>
        </motion.h1>
        <p className="text-gray-500 mt-4 text-xl font-bold ">
          PROJET MASTER S8
        </p>
        <button 
          onClick={scrollSmooth}
          className="mt-20 flex flex-col items-center gap-2 text-gray-400 bg-transparent font-bold hover:text-green-600 border-none"
        >
          <span className="text-sm">Découvrir l'application</span>
          <span className="animate-bounce text-2xl">↓</span>
        </button>
      </main>

      <div id="contenu">
        {Accueil_assets.map((item) => (
          <section 
            key={item.id} 
            className={`min-h-screen flex flex-col relative px-10 md:px-20 overflow-hidden py-20 ${item.estCentre ? 'items-center justify-center' : 'md:flex-row items-center'} ${!item.estCentre && item.inverserPosition ? 'md:flex-row-reverse' : ''}`}
          >
            <span 
              className={`absolute font-black select-none ${item.chiffreCouleur} ${item.chiffrePosition}`} 
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
                <h2 className="text-5xl md:text-7xl font-black italic text-black mb-5 ">
                  {item.titre}
                </h2>
                <Separator className={`my-5 bg-black h-1 ${item.id === '03' ? 'w-40 mx-auto' : 'w-32'} ${item.estCentre ? 'mx-auto' : item.inverserPosition ? 'ml-auto' : 'mx-auto md:ml-0'}`} />
                <p className={`text-gray-700 text-2xl md:text-3xl font-medium ${item.id === '03' ? 'italic' : ''}`}>
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