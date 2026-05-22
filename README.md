# CO2K - Planificateur de Repas & Éco-Score Carbone

Le site est en ligne et accessible à l'adresse suivante : [co-2-k-wvzs.vercel.app](https://co-2-k-wvzs.vercel.app)  
   
CO2K est une application web conçue pour planifier ses repas au quotidien tout en gardant un œil sur son apport nutritionnel et sur l'impact environnemental (émissions de CO2) de chaque ingrédient. L'idée est de proposer un outil simple pour manger plus sainement tout en limitant son empreinte carbone

---
 
## Fonctionnalités principales

### Gestion de profil et objectifs
* Profil personnalisé avec vos données (âge, genre, poids, taille, niveau d'activité physique)
* Définition d'objectifs physiques : prise de masse, perte de gras ou maintien de poids
* Choix du régime alimentaire : standard, sans porc ou végétarien

### Planification des repas
* Organisation de plannings à la semaine ou de programmes de plusieurs semaines
* Composition détaillée des portions à partir d'une liste d'aliments et de quantités ajustables
* Répartition des repas sur les différents moments de la journée (petit-déjeuner, déjeuner, collation, dîner)

### Suivi nutritionnel et empreinte carbone
* Calcul automatique de l'éco-score de chaque repas basé sur les aliments
* Suivi des macronutriments (Kcal, protéines, lipides et glucides)
* Suivi détaillé des nutriments (sucre, graisses saturées et sel)

### Fonctionnalités sociales
* Système d'abonnements pour suivre d'autres utilisateurs
* Publication de posts pour partager vos plannings ou programmes
* Interactions via des likes et des commentaires

---

## Technologies utilisées

* **Frontend :** React, TypeScript, Vite, shadcn, Tailwind et Framer Motion
* **Backend :** Node.js avec Express et Prisma
* **Base de données :** PostgreSQL (hébergée sur Supabase)
* **Infrastructure & Conteneurisation :** Docker

---
## Lancement du projet en local

Si vous souhaitez faire tourner le projet sur votre machine en local avec votre propre base de données suivez les étapes ci-dessous

### 1. Variables d'environnement
Créez un fichier `.env` à la racine du dossier web et ajoutez-y les variables suivantes en les complétant avec vos propres identifiants de base de données :

```env
# À remplir avec vos propres accès de base de données
DATABASE_URL= 
DIRECT_URL=
JWT_SECRET=

# Configuration locale par défaut
VITE_URL="http://localhost:3000"
CORS="http://localhost:5173" 
```

### Initialisation de la base de données (Supabase)

Avant de lancer l'application pour la première fois, vous devez peupler la base de données avec les ingrédients nettoyés. Exécutez le script Python localement sur votre machine : 

```bash
npm install
```

Puis lancez la création des tables sur Supabase :

```bash
npx prisma db push
```

Une fois les tables créées peuplez la base de données avec le script Python :

```bash
cd data
python nettoyage.py
cd ..
```

### Avec Docker 

Cette méthode lance le frontend et le backend en même temps

```bash
docker compose up --build
```

### Avec Node
Si vous préférez lancer le projet directement avec Node :

ensuite on met en place prisma en s'assurant que l'env est bien rempli :

```bash
npx prisma generate
```

suite a cela nous pouvons lancer le backend :

```bash
npm run start
```

suite a cela nous pouvons lancer le frontend :

```bash
npm run dev
```

## Architecture

Directory structure:
└── aksil03-co2k/
    ├── README.Docker.md
    ├── README.md
    ├── components.json
    ├── compose.yaml
    ├── cypress.config.ts
    ├── Dockerfile
    ├── eslint.config.js
    ├── index.html
    ├── jest.config.cjs
    ├── package.json
    ├── postcss.config.js
    ├── prisma.config.ts
    ├── server.ts
    ├── tailwind.config.js
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vercel.json
    ├── vite.config.ts
    ├── .dockerignore
    ├── cypress/
    │   ├── e2e/
    │   │   ├── communaute.cy.ts
    │   │   ├── connexion.cy.ts
    │   │   ├── inscription.cy.ts
    │   │   ├── mon_compte.cy.ts
    │   │   ├── panel.cy.ts
    │   │   ├── Plannings.cy.ts
    │   │   └── profil.cy.ts
    │   ├── fixtures/
    │   │   └── example.json
    │   └── support/
    │       ├── commands.ts
    │       └── e2e.ts
    ├── data/
    │   └── nettoyage.py
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── App.css
        ├── App.tsx
        ├── index.css
        ├── main.tsx
        ├── middleware.tsx
        ├── components/
        │   ├── CardPost.tsx
        │   ├── CardsGestion.tsx
        │   ├── index.ts
        │   ├── Modals.tsx
        │   ├── Navbar.tsx
        │   ├── Nutrition.tsx
        │   ├── UICommuns.tsx
        │   └── ui/
        │       ├── badge.tsx
        │       ├── button.tsx
        │       ├── card.tsx
        │       ├── dialog.tsx
        │       ├── dropdown-menu.tsx
        │       ├── form.tsx
        │       ├── input.tsx
        │       ├── label.tsx
        │       ├── progress.tsx
        │       ├── select.tsx
        │       ├── separator.tsx
        │       ├── sonner.tsx
        │       └── tabs.tsx
        ├── lib/
        │   ├── api.ts
        │   ├── constants-logic.ts
        │   ├── constants.tsx
        │   ├── db.ts
        │   ├── types.ts
        │   ├── utils.ts
        │   ├── planning/
        │   │   ├── generator.ts
        │   │   ├── impact.ts
        │   │   ├── rules.ts
        │   │   ├── solver.ts
        │   │   └── rules/
        │   │       ├── ruleHelpers.ts
        │   │       ├── rules_coll.ts
        │   │       ├── rules_matin.ts
        │   │       └── rules_repas.ts
        │   └── queries/
        │       ├── aliments.queries.ts
        │       ├── communaute.queries.ts
        │       ├── index.ts
        │       ├── planning.queries.ts
        │       ├── programmes.queries.ts
        │       └── utilisateur.queries.ts
        ├── middlewares/
        │   └── auth.ts
        ├── pages/
        │   ├── Accueil.tsx
        │   ├── Dashboard.tsx
        │   ├── Connexion/
        │   │   ├── Connexion.tsx
        │   │   └── Inscription.tsx
        │   └── Dashboard/
        │       ├── Communaute.tsx
        │       ├── Mon_compte.tsx
        │       ├── Panel.tsx
        │       ├── Plannings.tsx
        │       └── Profil.tsx
        ├── providers/
        │   └── theme-provider.tsx
        ├── routes/
        │   ├── aliments.routes.ts
        │   ├── auth.routes.ts
        │   ├── communaute.routes.ts
        │   ├── planning.routes.ts
        │   ├── programmes.routes.ts
        │   └── utilisateur.routes.ts
        └── tests/
            ├── aliments.queries.test.ts
            ├── communaute.queries.test.ts
            ├── planning.queries.test.ts
            ├── programmes.queries.test.ts
            └── utilisateur.queries.test.ts


## Données utilisées

Pour réaliser notre projet, nous avons utilisé deux documents xlsx provenant du site : [https://www.data.gouv.fr](https://www.data.gouv.fr/)

## Les Tests

Pour vérifier le bon fonctionnement de l'application, plusieurs tests sont disponibles :

### Tests unitaires (Jest)

```bash
npm run test:unit
```

### Tests E2E (Cypress)

```bash
npm run start
npm run dev
npm run test:e2e
```

### Executer l'ensemble des tests

```bash
npm run test
```

## Déploiement

L'application est déployée de façon découplée pour optimiser l'expérience utilisateur dû au fait que nous utilisons des versions gratuites :
* **Frontend (Vercel) :** Hébergé sous forme de site statique. Le contenu est servi instantanément et ne s'endort jamais
* **Backend (Render) :** Déployé pour faire tourner l'API Express en continu
* **Base de données :** PostgreSQL hébergé sur Supabase connectée à l'API sur Render

## Auteurs

* **[Bounif Aksil / Amedjkane Amar / Laamouri Abderrafie / Smail Elias]**

