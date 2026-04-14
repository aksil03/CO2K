import pandas as pd
import numpy as np
import re
import json
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

class DB:
    _conn = None

    def get():
        if not DB._conn or DB._conn.closed:
            DB._conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        return DB._conn

#fonction de nettoyage des numériques des dataset
def nettoyer_chiffre(x):
    if pd.isna(x):
        return np.nan 
    if isinstance(x, str):
        x = x.lower().strip()
        x = x.replace('<', '').replace(',', '.').replace('tr', '0')
        if x == '-' or x == '' or x == 'nan':
            return np.nan 
    try:
        return float(x)
    except:
        return np.nan

#fonction de nettoyage des noms pour la recherche et l'uniformisation
def nettoyer_nom(nom_brut):
    n = str(nom_brut).lower()
    dictionnaire_corrections = {
        'oeufss': 'oeufs', 'miettesss': 'miettes',
        'maïss': 'maïs', 'mais ': 'maïs ', 'pate ': 'pâte ', 'chaise ': 'chair '
    }
    for faute, correction in dictionnaire_corrections.items():
        n = n.replace(faute, correction)

    nom_propre = ""
    on_garde = True
    for caractere in n:
        if caractere == "(":
            on_garde = False
        elif caractere == ")":
            on_garde = True
            continue
        if on_garde:
            nom_propre += caractere
    return nom_propre.strip().capitalize()

#extraction et tri de colonnes
def extraire_donnees():
    try:
        tableau_nutrition = pd.read_excel('Table Ciqual 2020_FR_2020 07 07.xls')

        renommer_colonnes = {
            'alim_code': 'code',
            'alim_nom_fr': 'nom',
            'alim_grp_nom_fr': 'categorie',
            'alim_ssgrp_nom_fr': 'sous_categorie',
            'alim_ssssgrp_nom_fr': 'precision_categorie',
            'Energie, Règlement UE N° 1169/2011 (kcal/100 g)': 'cal',
            'Protéines, N x 6.25 (g/100 g)': 'prot',
            'Glucides (g/100 g)': 'glu',
            'Saccharose (g/100 g)': 'sucre',
            'Sodium (mg/100 g)': 'sodium',
            'Lipides (g/100 g)': 'lip',
            'AG saturés (g/100 g)': 'gras_sat'
        }

        tableau_nutrition = tableau_nutrition.rename(columns=renommer_colonnes)

        tableau_nutrition['categorie'] = tableau_nutrition['categorie'].fillna('').str.lower()

        plats_interdits = ['entrées et plats composés', 'pizzas', 'desserts']

        for mot in plats_interdits:
            tableau_nutrition = tableau_nutrition[tableau_nutrition['categorie'].str.contains(mot) == False]

        colonnes_utiles = list(renommer_colonnes.values())

        tableau_nutrition = tableau_nutrition[colonnes_utiles].copy()

        tableau_co2 = pd.read_csv('agribalyse-31-synthese.csv', sep=',', encoding='utf-8')
        tableau_co2 = tableau_co2[['Code CIQUAL', 'Changement climatique']].copy()
        tableau_co2.columns = ['code', 'co2_kg']

        tableau_nutrition['code'] = tableau_nutrition['code'].astype(str).str.split('.').str[0].str.strip()

        tableau_co2['code'] = tableau_co2['code'].astype(str).str.split('.').str[0].str.strip()

        donnees_finales = pd.merge(tableau_nutrition, tableau_co2, on='code', how='left')

        colonnes_chiffres = ['cal', 'prot', 'glu', 'sucre', 'sodium', 'lip', 'gras_sat', 'co2_kg']
        for col in colonnes_chiffres:
            donnees_finales[col] = donnees_finales[col].apply(nettoyer_chiffre)

        # Recalcul calories si 0 coefficients d'Atwater
        for i in donnees_finales.index:
            p = donnees_finales.at[i, 'prot']
            g = donnees_finales.at[i, 'glu']
            l = donnees_finales.at[i, 'lip']
            cal = donnees_finales.at[i, 'cal']
            cat = str(donnees_finales.at[i, 'sous_categorie']).lower()

            # 1. On devine une macro manquante si on a les calories
            if pd.notna(cal) and cal > 0:
                if pd.isna(g) and pd.notna(p) and pd.notna(l):
                    donnees_finales.at[i, 'glu'] = max(0, round((cal - (p * 4) - (l * 9)) / 4, 2))
                elif pd.isna(p) and pd.notna(g) and pd.notna(l):
                    donnees_finales.at[i, 'prot'] = max(0, round((cal - (g * 4) - (l * 9)) / 4, 2))
                elif pd.isna(l) and pd.notna(p) and pd.notna(g):
                    donnees_finales.at[i, 'lip'] = max(0, round((cal - (p * 4) - (g * 4)) / 9, 2))

            p, g, l, cal = donnees_finales.loc[i, ['prot', 'glu', 'lip', 'cal']] 
            
            if (pd.isna(cal) or cal == 0) and (pd.isna(g) or g == 0):
                # Famille des Féculents secs
                if any(x in cat for x in ['céréales', 'pains', 'biscottes', 'riz', 'pâtes']):
                    donnees_finales.at[i, 'glu'] = 78.0
                    donnees_finales.at[i, 'prot'] = 8.0
                    donnees_finales.at[i, 'lip'] = 2.0
                elif 'fruits' in cat:
                    donnees_finales.at[i, 'glu'] = 12.0
                    donnees_finales.at[i, 'prot'] = 0.8
                elif 'légumes' in cat:
                    donnees_finales.at[i, 'glu'] = 5.0
                    donnees_finales.at[i, 'prot'] = 1.5

            # 3. Recalcul final de la calorie pour la cohérence
            p_f = donnees_finales.at[i, 'prot'] if pd.notna(donnees_finales.at[i, 'prot']) else 0
            g_f = donnees_finales.at[i, 'glu'] if pd.notna(donnees_finales.at[i, 'glu']) else 0
            l_f = donnees_finales.at[i, 'lip'] if pd.notna(donnees_finales.at[i, 'lip']) else 0
            
            if pd.isna(donnees_finales.at[i, 'cal']) or donnees_finales.at[i, 'cal'] == 0:
                donnees_finales.at[i, 'cal'] = (p_f * 4) + (g_f * 4) + (l_f * 9)

        donnees_finales['co2_kg'] = donnees_finales['co2_kg'].replace(0.0, np.nan)
        moyennes_sous_grp = donnees_finales.groupby('sous_categorie')['co2_kg'].mean()

        for i in donnees_finales.index:
            if pd.isna(donnees_finales.at[i, 'co2_kg']):
                ma_sous_cat = donnees_finales.at[i, 'sous_categorie']
                donnees_finales.at[i, 'co2_kg'] = moyennes_sous_grp.get(ma_sous_cat)

        moyennes_cat = donnees_finales.groupby('categorie')['co2_kg'].mean()
        for i in donnees_finales.index:
            if pd.isna(donnees_finales.at[i, 'co2_kg']):
                ma_cat = donnees_finales.at[i, 'categorie']
                donnees_finales.at[i, 'co2_kg'] = moyennes_cat.get(ma_cat)
        
        # On remplace les nan restants par 0.0 pour eviter les erreurs
        cols_to_fix = ['prot', 'glu', 'lip', 'cal', 'sucre', 'gras_sat', 'sodium', 'co2_kg']
        for col in cols_to_fix:
            donnees_finales[col] = donnees_finales[col].fillna(0.0)

        donnees_finales['sel'] = (donnees_finales['sodium'] * 2.5) / 1000
        donnees_finales['nom_propre'] = donnees_finales['nom'].apply(nettoyer_nom)

        return donnees_finales

    except Exception as e:
        print(e)
        return None

def generer_sql(donnees):
    try:
        conn = DB.get()
        cur = conn.cursor()
        cur.execute('DELETE FROM "Aliment"')

        lignes = []
        for bac, aliments in donnees.items():
            for a in aliments:
                def v(k): return 0.0 if a[k] == "N/A" or a[k] is None else a[k]
                
                lignes.append((
                    a['nom'], bac, a['co2'], a['cal'],
                    v('prot'), v('lip'), v('glu'), v('sucre'), v('gras_sat'), v('sel'), a['estSnack'], a['estPlat'], a['estSandwich'], a['estVege']
                ))
        sql = 'INSERT INTO "Aliment" (nom, bac, co2, cal, prot, lip, glu, sucre, gras_sat, sel, "estSnack", "estPlat", "estSandwich", "estVege") VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)'
        cur.executemany(sql, lignes)
        
        conn.commit()

    except Exception as e:
        conn.rollback() 

def lancer_nettoyage():
    df_global = extraire_donnees()
    if df_global is None:
        return "Problème d'extraction"

    # copie du dataframe
    df_clean = df_global.copy()

    df_clean['ratio_temp'] = df_clean['sucre'] / df_clean['glu'].replace(0, np.nan)
    
    moyennes_ratio = df_clean.groupby('categorie')['ratio_temp'].mean().fillna(0.10)

    # On définit les bacs avec les filtres de catégories ou de nom
    bacs_aliments = {
        'PROT_PORC': df_clean[
            (
                (df_clean['precision_categorie'].str.contains('jambons cuits|jambons secs et crus|porc', case=False, na=False)) |
                (df_clean['precision_categorie'].str.contains('saucissons secs', case=False, na=False)) |
                ((df_clean['precision_categorie'].str.contains('abats|saucisses et assimilés', case=False, na=False)) & 
                (df_clean['nom'].str.contains('porc', case=False, na=False))) |
                (df_clean['nom'].str.contains(r'lardon|chorizo|salami|coppa|pancetta|mortadelle|bacon', case=False, na=False))
            ) & 
            ~df_clean['nom'].str.contains(r'dinde|poulet|volaille|Pâté|Omelette|Pélardon', case=False, na=False)
        ],

        'PROT_VIANDE_ROUGE': df_clean[
            (
                (df_clean['precision_categorie'].str.contains('bœuf et veau|agneau et mouton|gibier', case=False, na=False))
            ) & 
            ~df_clean['nom'].str.contains('veau|faisan|porc|lardon|dinde|volaille|poulet|poules|Pâté', case=False, na=False) &
            ~df_clean['nom'].str.contains('bourguignon|pot-au-feu|sanglier', case=False, na=False)
        ],

        'PROT_VOLAILLE': df_clean[
            (
                (df_clean['precision_categorie'].str.contains(r'^poulet$|^dinde$', case=False, na=False)) |
                ((df_clean['precision_categorie'].str.contains('autres viandes', case=False, na=False)) & 
                 (df_clean['nom'].str.contains('poule', case=False, na=False))) |
                (df_clean['nom'].str.contains(r'canard|oie|chapon|caille|pintade|coquelet|faisan', case=False, na=False))
            ) &
            ~df_clean['nom'].str.contains(r'rillette|veau|lapin|génisse|agneau|Pâté|Terrine', case=False, na=False) &
            ~df_clean['nom'].str.contains('porc|lardon|bacon|Biscuit|Foie gras|Graisse|Huile|Lotte|Mousse|Oeuf|Pomme|Tomme|Saucisse', case=False, na=False)
        ],

        'PROT_BLANCHE_AUTRE': df_clean[
            ((df_clean['precision_categorie'].str.contains('bœuf et veau', case=False, na=False)) & (df_clean['nom'].str.contains('veau', case=False, na=False))) |
            ((df_clean['precision_categorie'].str.contains('autres viandes', case=False, na=False)) & (df_clean['nom'].str.contains('lapin', case=False, na=False))) &
            ~df_clean['nom'].str.contains('ris|terrine|pâté|pate|boeuf|bœuf|porc', case=False, na=False)
        ],

        'PROT_P': df_clean[
            (df_clean['sous_categorie'].str.contains('poissons crus', case=False, na=False)) &
            ~df_clean['nom'].str.contains('Foie', case=False, na=False)
        ],

        'PROT_VEG': df_clean[
            (df_clean['sous_categorie'].str.contains('oeufs|œufs', case=False, na=False) & 
             ~df_clean['nom'].str.contains('omelette|tortilla|poudre|jaune', case=False, na=False)) |
            (df_clean['precision_categorie'].str.contains('substituts de produits carnés|substituts de charcuteries pour végétariens', case=False, na=False))
        ],

        'S_HOT_WHITE': df_clean[
            (df_clean['precision_categorie'].str.contains('sauces chaudes', case=False, na=False)) &
            (df_clean['nom'].str.contains(r'crème|fromage|roquefort|béchamel|carbonara|hollandaise|beurre|échalote', case=False, na=False))
        ],

        'S_HOT_RED': df_clean[
            (df_clean['precision_categorie'].str.contains('sauces chaudes', case=False, na=False)) &
            (df_clean['nom'].str.contains(r'tomate|bolognaise|olives|rosso|arrabbiata', case=False, na=False))
        ],

        'S_HOT_ASIA': df_clean[
            (
                df_clean['precision_categorie'].str.contains(r'sauces chaudes|sauces condimentaires', case=False, na=False)
            ) &
            (
                df_clean['nom'].str.contains(r'indienne|curry|tandoori|tikka|aigre douce|soja|thaï|nuoc mam|saté', case=False, na=False)
            )
        ],

        'S_COLD': df_clean[
            (df_clean['precision_categorie'].str.contains('sauces condimentaires', case=False, na=False)) &
            ~df_clean['nom'].str.contains(
                r'sauce froide|sauce crudités|sauce salade|sauce soja|sauce végétale|sauce vinaigrette', 
                case=False, na=False
            )
        ],

        'VINAIGRETTE': df_clean[
            (df_clean['precision_categorie'].str.contains('sauces condimentaires', case=False, na=False)) &
            (df_clean['nom'].str.contains(r'vinaigrette|sauce salade|sauce crudité', case=False, na=False))
        ],

        'RIZ': df_clean[
            (df_clean['precision_categorie'].str.contains('pâtes, riz et céréales crus', case=False, na=False)) & 
            (df_clean['nom'].str.contains('riz', case=False, na=False)) &
            (~df_clean['nom'].str.contains('galette|boisson|vermicelle', case=False, na=False))
        ],

        'PATE': df_clean[
            (df_clean['precision_categorie'].str.contains('pâtes, riz et céréales crus', case=False, na=False)) & 
            (df_clean['nom'].str.contains(r'pâte|coquillette|spaghetti|fusilli|penne|macaroni|lasagne', case=False, na=False)) &
            (~df_clean['nom'].str.contains(r'nouille|vermicelle|asiatique|gnocchi', case=False, na=False))
        ],

        'NOUILLE': df_clean[
            (df_clean['precision_categorie'].str.contains('pâtes, riz et céréales crus', case=False, na=False)) & 
            (df_clean['nom'].str.contains(r'nouille|vermicelle|asiatique', case=False, na=False)) &
            (~df_clean['nom'].str.contains(r'gnocchi', case=False, na=False))
        ],

        'GNOCCHI': df_clean[
            (df_clean['nom'].str.contains(r'gnocchi', case=False, na=False))
        ],

        'CERE_REPAS': df_clean[
            (df_clean['precision_categorie'].str.contains('pâtes, riz et céréales crus', case=False, na=False)) & 
            (df_clean['nom'].str.contains(r'blé|boulgour|orge|quinoa|sarrasin|épeautre|millet|sorgho|frik', case=False, na=False)) &
            (~df_clean['nom'].str.contains(r'avoine|riz|pâte|petit déjeuner', case=False, na=False))
        ],

       'SEMOU': df_clean[
            (df_clean['nom'].str.contains(r'semoule|graine de couscous|polenta', case=False, na=False)) &
            ~df_clean['nom'].str.contains(r'dessert|gâteau', case=False, na=False)
        ],

       'POTATO': df_clean[
            (df_clean['sous_categorie'].str.contains('pommes de terre et autres tubercules', case=False, na=False)) &
            ~df_clean['nom'].str.contains(r'plantain|chips|fruit à pain|tapioca|frites|Potatoes', case=False, na=False)
        ],

        'PAIN': df_clean[
            df_clean['precision_categorie'].str.contains('pains', case=False, na=False) & 
            df_clean['nom'].str.contains(r'pain|bagel', case=False, na=False) & 
            ~df_clean['nom'].str.contains('muffin', case=False, na=False)
        ],

        'WRAP': df_global[df_global['nom'].str.contains(r'tortilla souple|wrap', case=False, na=False)],

        'LEG': df_clean[
            (df_clean['precision_categorie'].str.contains('légumes crus', case=False, na=False)) &
            ~df_clean['nom'].str.contains(r'laitue|mâche|scarole|roquette|sucrine|chicorée|batavia|iceberg|mesclun', case=False, na=False) &
            ~df_clean['nom'].str.contains(
                r'oseille|persil|ciboulette|aneth|basilic|menthe|coriandre|thym|laurier|romarin|zeste|citronnelle|légumes|julienne|Petits pois et carottes|salade', 
                case=False, na=False
            )
        ],

        'LAITUE': df_clean[
            (df_clean['nom'].str.contains(r'laitue|mâche|scarole|roquette|sucrine|chicorée|batavia|iceberg|mesclun|salade', case=False, na=False)) &
            (df_clean['precision_categorie'].str.contains(r'légumes crus', case=False, na=False)) &
            ~df_clean['nom'].str.contains(r'poisson|poulet|volaille|instant|solub|boisson', case=False, na=False)
        ],

        'FROMAGE': df_clean[df_clean['sous_categorie'].str.contains('fromages', case=False, na=False)],

        'FRUIT_ENTIER': df_clean[
            (df_clean['precision_categorie'].str.contains(r'fruits cru[e]?s?', case=False, na=False)) & 
            ~df_clean['nom'].str.contains('pulpe|zeste|citron|citronnelle|rhubarbe', case=False, na=False) &
            ~df_clean['nom'].str.contains('Fruit cru', case=False, na=False)
        ],

        'FRUIT_PULPE': df_clean[
            df_clean['precision_categorie'].str.contains('fruits crus', case=False, na=False) & 
            df_clean['nom'].str.contains('pulpe', case=False, na=False)
        ],

        'CERE': df_clean[
            (
                (df_clean['sous_categorie'].str.contains('céréales de petit-déjeuner', case=False, na=False)) |
                (df_clean['nom'].str.contains(r'\bavoine\b', case=False, na=False))
            ) &
            (df_clean['sucre'] <= 7) & 
            ~df_clean['nom'].str.contains(
                r'boisson|dessert|huile|saucisson|cresson|son|bouilli|miel|chocolat|fourré|glacé|sucre|caramel', 
                case=False, na=False
            )
        ],

        'LAIT': df_clean[
            (
                (df_clean['precision_categorie'].str.contains('yaourts et spécialités laitières type yaourt|fromages blancs', case=False, na=False))
            ) &
            ~df_clean['nom'].str.contains(
                r'boisson|faisselle|kéfir|lait fermenté|mousse|spécialité laitière type encas', 
                case=False, na=False
            )
        ],

        'OLEAGINEUX': df_clean[
            (df_clean['sous_categorie'].str.contains('fruits à coque et graines oléagineuses', case=False, na=False)) &
            ~df_clean['nom'].str.contains(
                r"beurre de cacahuète|farine de châtaigne|luzerne|mélange apéritif|graine|Crème|Tahin|Pâte", 
                case=False, na=False
            )
        ],

        'BC': df_global[df_global['nom'].str.contains(r"beurre de cacahuète|pâte d'arachide|Tahin ou Purée de sésame", case=False, na=False)],

        'GAL_RIZ': df_clean[
            (df_clean['precision_categorie'].str.contains('biscottes et pains grillés', case=False, na=False)) &
            ~df_clean['nom'].str.contains(r'croûton|croûtons|chapelure|gressin', case=False, na=False)
        ],

        'HUILE': df_clean[
            (df_clean['sous_categorie'].str.contains(r'huiles et graisses végétales', case=False, na=False)) &
            (df_clean['nom'].str.contains(
                r"Huile de colza|Huile de noix|Huile d'olive vierge extra|Huile d'avocat|Huile de lin|Huile de noisette|Huile de sésame", case=False, na=False)) &
            (~df_clean['nom'].str.contains(r"margarine|friture|palme|coco|cacao", case=False, na=False))
        ],
    }

    # dictionnaire final et génération des fichiers
    mon_dictionnaire_final = {}

    for nom_du_bac in bacs_aliments:
        tableau_actuel = bacs_aliments[nom_du_bac].copy()
        
        # attrape : cru, crue, crus, crues...
        tableau_actuel['cle_base'] = tableau_actuel['nom'].str.replace(r', (cru[e]?s?|cuit[e]?s?|bouilli[e]?s?|rôti[e]?s?|poêlé[e]?s?).*', '', regex=True, case=False).str.strip()
        
        # Score de priorité on cherche cuit avec ou sans e
        tableau_actuel['priorite'] = tableau_actuel['nom'].str.contains(r'cuit[e]?|bouilli[e]?|rôti[e]?|poêlé[e]?', case=False, na=False).astype(int)
        
        propres = tableau_actuel.sort_values(['cle_base', 'priorite']).drop_duplicates(subset=['cle_base'], keep='first')
        
        # On trie ensuite par nom propre pour l'affichage final
        propres = propres.sort_values('nom_propre')

        liste_pour_json = []
        
        for index, ligne in propres.iterrows():

            nom_nettoye = str(ligne['nom_propre']).lower()
            
            est_snack = False
            est_plat = False
            est_sandwich = False
            est_vege = True
            
            bacs_sucres = ['CERE', 'LAIT', 'FRUIT_ENTIER', 'FRUIT_PULPE', 'BC', 'OLEAGINEUX', 'GAL_RIZ']
            
            bacs_sales = [
                'PROT_PORC', 'PROT_VIANDE_ROUGE', 'PROT_VOLAILLE', 'PROT_BLANCHE_AUTRE', 
                'PROT_P', 'PROT_VEG', 
                'RIZ', 'PATE', 'NOUILLE', 'GNOCCHI', 'CERE_REPAS', 'SEMOU', 'POTATO', 
                'WRAP', 'LEG', 'LAITUE', 
                'S_HOT_WHITE', 'S_HOT_RED', 'S_HOT_ASIA', 'S_COLD', 'VINAIGRETTE', 'FROMAGE', 'HUILE'
            ]

            bacs_carnes = ['PROT_PORC', 'PROT_VIANDE_ROUGE', 'PROT_VOLAILLE', 'PROT_BLANCHE_AUTRE']
            
            if nom_du_bac in bacs_carnes:
                est_vege = False

            if est_vege:
                interdits = ['bolognaise', 'carbonara', 'lardon', 'poulet', 'boeuf', 'jambon', 'steak', 'porc', 'viande']
                
                if any(m in nom_nettoye for m in interdits if m.strip()):
                    est_vege = False

            bacs_ok = ['PAIN', 'WRAP', 'LAITUE', 'FROMAGE', 'S_COLD']
            if nom_du_bac in bacs_ok:
                est_sandwich = True

            if nom_du_bac.startswith('PROT'):
                est_sandwich = True
            
            if nom_du_bac == 'LEG':
               if 'avocat' in nom_nettoye:
                   est_snack = True
               else:
                   est_snack = False

            if nom_du_bac == 'LEG':
                mots_ok = ['avocat', 'poivron', 'champignon', 'aubergine', 'carotte', 'oignon', 'épinard', 'concombre', 'courgette', 'tomate', 'piment', 'radis', 'endive', 'échalote']
                if any(m in nom_nettoye for m in mots_ok):
                    est_sandwich = True

            if nom_du_bac in bacs_sucres:
                est_snack = True
                
            if nom_du_bac in bacs_sales or nom_du_bac.startswith('PROT'):
                est_plat = True

            if nom_du_bac == 'PAIN':
                est_plat = True
                pains_repas = ['burger', 'panini', 'pita', 'hamburger', 'bagel']
                est_snack = not any(x in nom_nettoye for x in pains_repas)
            
            elif nom_du_bac == 'PROT_VEG' and ('oeuf' in nom_nettoye or 'œuf' in nom_nettoye):
                est_snack = True
                est_plat = True

            sel_final = ligne['sel']
            
            if sel_final <= 0.0001:
                if 'PROT_PORC' in nom_du_bac or 'PROT_VIANDE' in nom_du_bac or 'PROT_VOLAILLE' in nom_du_bac:
                    sel_final = 0.15 
                elif 'PROT_P' in nom_du_bac:
                    sel_final = 0.20  
                elif 'PROT_VEG' in nom_du_bac:
                    sel_final = 0.30 
                elif 'FROMAGE' in nom_du_bac:
                    sel_final = 1.20 
                elif 'LAIT' in nom_du_bac:
                    sel_final = 0.10
                elif nom_du_bac in ['RIZ', 'PATE', 'NOUILLE', 'GNOCCHI', 'CERE_REPAS', 'SEMOU', 'POTATO', 'PAIN', 'CERE']:
                    sel_final = 0.02  
                elif nom_du_bac in ['LEG', 'LAITUE', 'FRUIT_ENTIER']:
                    sel_final = 0.02  
                else:
                    sel_final = 0.05 
            
            lip = float(ligne['lip'])
            gras_sat_final = float(ligne['gras_sat'])
            if gras_sat_final <= 0.0001 and lip > 0:
                if any(x in nom_du_bac for x in ['PORC', 'VIANDE', 'VOLAILLE', 'FROMAGE', 'LAIT']):
                    gras_sat_final = lip * 0.40
                elif nom_du_bac == 'HUILE':
                    gras_sat_final = lip * 0.12 
                else:
                    gras_sat_final = lip * 0.15


            sucre_saccharose = float(ligne['sucre'])
            glu = float(ligne['glu'])
            nom_bas = str(ligne['nom_propre']).lower()

            est_sucre_nom = any(x in nom_bas for x in ['sucré', 'chocolat', 'aromatisé', 'miel', 'sirop'])
            est_sain_nom = any(x in nom_bas for x in ['nature', 'allégé', 'édulcorant', 'brut'])

            if sucre_saccharose > 0.0001:
                sucre_final = sucre_saccharose
            
            elif est_sucre_nom and not est_sain_nom:
                sucre_final = glu * 0.60
                
            elif est_sain_nom:
                sucre_final = 0.0
                
            elif glu > 0:
                if 'FRUIT' in nom_du_bac:
                    sucre_final = glu * 0.50
                elif any(x in nom_du_bac for x in ['RIZ', 'PATE', 'POTATO']):
                    sucre_final = 0.0
                else:
                    ratio_moyen = moyennes_ratio.get(ligne['categorie'], 0.10)
                    sucre_final = glu * ratio_moyen
            else:
                sucre_final = 0.0

            score_co2 = round(ligne['co2_kg'] / 10, 2)
            
            # Formatage 
            def fmt(val): 
                try:
                    v = float(val)
                    return round(v, 2) if v > 0 else 0.0
                except:
                    return 0.0

            info_aliment = {
                "nom": str(ligne['nom_propre']),
                "co2": score_co2,
                "cal": int(ligne['cal']),
                "prot": fmt(ligne['prot']),
                "lip": fmt(ligne['lip']),
                "gras_sat": fmt(gras_sat_final),
                "glu": fmt(ligne['glu']),
                "sucre": fmt(sucre_final),
                "sel": round(sel_final, 3),
                "estSnack": est_snack,
                "estPlat": est_plat,
                "estSandwich": est_sandwich,
                "estVege": est_vege
            }
            liste_pour_json.append(info_aliment)

        mon_dictionnaire_final[nom_du_bac] = liste_pour_json
    
    with open('database_co2k.json', 'w', encoding='utf-8') as f:
        import json
        json.dump(mon_dictionnaire_final, f, ensure_ascii=False, indent=4)
    
    generer_sql(mon_dictionnaire_final)

lancer_nettoyage()