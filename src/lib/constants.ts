import bowl from '../assets/bowl.png';
import homme from '../assets/homme.png';
import co2 from '../assets/CO2.png';

export const Accueil_assets = [
  {
    id: '01',
    titre: "L'ALIMENTATION",
    badge: "MODULE 01",
    description: "Une multitude de recettes saines et protéinées respectant vos besoins énergétiques selon vos objectifs",
    image: bowl,
    chiffreCouleur: "text-green-300",
    chiffrePosition: "-top-10 -right-10",
    badgeCouleur: "bg-green-600",
    inverserPosition: false,
    estCentre: false,
    animation: { rotate: 360 },
    transition: { duration: 40, repeat: Infinity, ease: "linear" }
  },
  {
    id: '02',
    titre: "LE SPORT",
    badge: "MODULE 02",
    description: "Notre programme s’adapte aussi bien aux sportifs du dimanche qu’aux plus assidus.",
    image: homme,
    chiffreCouleur: "text-gray-200",
    chiffrePosition: "-bottom-10 -left-10",
    badgeCouleur: "bg-gray-800",
    inverserPosition: true,
    estCentre: false,
    animation: { y: [0, -30, 0] },
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
  },
  {
    id: '03',
    titre: "LE CARBONE",
    badge: "MODULE 03",
    description: "Cuisiner en prenant en compte l'empreinte carbone de vos aliments",
    image: co2,
    chiffreCouleur: "text-emerald-100",
    chiffrePosition: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    badgeCouleur: "bg-emerald-600",
    inverserPosition: false,
    estCentre: true,
    animation: { scale: [1, 1.1, 1] },
    transition: { duration: 5, repeat: Infinity }
  }
];