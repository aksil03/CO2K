import React from 'react';
import { motion } from 'framer-motion'; 
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import bowl from '../assets/bowl.png';
import homme from '../assets/homme.png';
import co2 from '../assets/CO2.png'; 

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
        <section className="min-h-screen flex flex-col md:flex-row items-center relative px-10 md:px-20 overflow-hidden py-20">

          <span className="absolute -top-10 -right-10 font-black text-green-300 select-none" style={{ fontSize: '25rem' }}>
            01
          </span>
          
          <div className="flex flex-col md:flex-row items-center justify-between w-full z-10 gap-10">
            <motion.img 
              src={bowl} 
              alt="Bowl" 
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="w-64 md:w-96 h-auto drop-shadow-2xl" 
            />
            
            <div className="max-w-2xl text-center md:text-left">
              <Badge className="bg-green-600 text-white mb-5 px-5 py-2 text-lg">MODULE 01</Badge>
              <h2 className="text-5xl md:text-7xl font-black italic text-black mb-5 ">L'ALIMENTATION</h2>
              <Separator className="my-5 bg-black h-1 w-32 mx-auto md:ml-0" />
              <p className="text-gray-700 text-2xl md:text-3xl font-medium ">
                Une multitude de recettes saines et protéinées respectant vos besoins énergétiques selon vos objectifs
              </p>
            </div>
          </div>
        </section>

        <section className="min-h-screen flex flex-col md:flex-row-reverse items-center relative px-10 md:px-20 overflow-hidden py-20">
          <span className="absolute -bottom-10 -left-10 font-black text-gray-200 select-none" style={{ fontSize: '25rem' }}>
            02
          </span>

          <div className="flex flex-col md:flex-row-reverse items-center justify-between w-full z-10 gap-10">
            <motion.img 
              src={homme} 
              alt="Homme" 
              animate={{ y: [0, -30, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-56 md:w-80 h-auto drop-shadow-2xl" 
            />

            <div className="max-w-2xl text-center md:text-right">
              <Badge className="bg-gray-800 text-white mb-5 px-5 py-2 text-lg">MODULE 02</Badge>
              <h2 className="text-5xl md:text-7xl font-black italic text-black mb-5">LE SPORT</h2>
              <Separator className="my-5 bg-black h-1 w-32 ml-auto" />
              <p className="text-gray-700 text-2xl md:text-3xl font-medium text-right">
                Notre programme s’adapte aussi bien aux sportifs du dimanche qu’aux plus assidus.
              </p>
            </div>
          </div>
        </section>
        <section className="min-h-screen flex flex-col items-center justify-center relative px-10 text-center overflow-hidden py-20">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-emerald-100 select-none" style={{ fontSize: '30rem' }}>
            03
          </span>

          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            whileInView={{ opacity: 1, y: 0 }}
            className="z-10 flex flex-col items-center"
          >
            <motion.img 
              src={co2} 
              alt="CO2" 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="w-64 md:w-80 mb-10 drop-shadow-xl" 
            />
            <Badge className="bg-emerald-600 text-white mb-5 px-6 py-2 text-lg">MODULE 03</Badge>
            <h2 className="text-5xl md:text-7xl font-black italic text-black mb-5 ">LE CARBONE</h2>
            <Separator className="my-5 bg-black h-1 w-40 mx-auto" />
            <p className="text-gray-700 text-2xl md:text-3xl font-medium italic max-w-4xl px-5">
              Cuisiner en prenant en compte l'empreinte carbone de vos aliments
            </p>
          </motion.div>
        </section>
        
      </div>
    </>
  );
};

export default Accueil;