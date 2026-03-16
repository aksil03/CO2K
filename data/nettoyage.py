import pandas as pd
import numpy as np
import re
import json

#fonction de nettoyage des numériques des dataset
def nettoyer_chiffre(x):
    if pd.isna(x):
        return 0.0
    if isinstance(x, str):
        x = x.lower().strip()
        x = x.replace('<', '').replace(',', '.').replace('tr', '0')
        if x == '-' or x == '' or x == 'nan':
            return 0.0
    try:
        return float(x)
    except:
        return 0.0

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
            'Energie, Règlement UE N° 1169/2011 (kcal/100 g)': 'cal',
            'Protéines, N x 6.25 (g/100 g)': 'prot',
            'Glucides (g/100 g)': 'glu',
            'Sucres (g/100 g)': 'sucre',
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


        colonnes_chiffres = ['cal', 'prot', 'glu', 'sucre', 'lip', 'gras_sat', 'co2_kg']
        for col in colonnes_chiffres:
           donnees_finales[col] = donnees_finales[col].apply(nettoyer_chiffre)







        # Recalcul calories si 0 coefficients d'Atwater
        for i in donnees_finales.index:
    
           if donnees_finales.at[i, 'cal'] == 0:

              p = donnees_finales.at[i, 'prot']
              g = donnees_finales.at[i, 'glu']
              l = donnees_finales.at[i, 'lip']
        
              total = (p * 4) + (g * 4) + (l * 9)
        

              donnees_finales.at[i, 'cal'] = total

        # 1. On remplace les 0 par desNaN 
        donnees_finales['co2_kg'] = donnees_finales['co2_kg'].replace(0.0, np.nan)

       # On calcule la moyenne CO2 pour chaque sous-catégorie
        moyennes_sous_grp = donnees_finales.groupby('sous_categorie')['co2_kg'].mean()

        for i in donnees_finales.index:
          if pd.isna(donnees_finales.at[i, 'co2_kg']):
             ma_sous_cat = donnees_finales.at[i, 'sous_categorie']
             donnees_finales.at[i, 'co2_kg'] = moyennes_sous_grp.get(ma_sous_cat)



# On fait pareil avec la catégorie générale au cas ou la sous-catégorie est vide
        moyennes_cat = donnees_finales.groupby('categorie')['co2_kg'].mean()

        for i in donnees_finales.index:
            if pd.isna(donnees_finales.at[i, 'co2_kg']):
               ma_cat = donnees_finales.at[i, 'categorie']
               donnees_finales.at[i, 'co2_kg'] = moyennes_cat.get(ma_cat)
               donnees_finales['nom_propre'] = donnees_finales['nom'].apply(nettoyer_nom)

        return donnees_finales
    except Exception as e:
        print("Erreur etape d'extraction ")
        return None

def lancer_nettoyage():
    df_global = extraire_donnees()
    if df_global is None:
        return "Problème d'extraction"

    junk = r'aromatisé|sucré|aux fruits|chocolat|vanille|caramel|crème dessert|flan|brisée|feuilletée|sablée|phyllo|filo|pizza| aux | à la | au | avec | farci|gratin|riz au lait|riz cantonais|salade|poudre|farine|sirop|confit|biscuit|cake|bonbon|alcool|amidon|fécule|tapioca|préemballé|nugget|croquette|préparation|gâteau|dessert|glace|sorbet|soupe|saké|boisson|jus de|nectar|smoothie|bière|vin|cola|saké|liquide|son de|rillette|rognon|foie|abat|sang|langue|tripes|tête|museau|pied|andouille'
    sport_exclude = r'jaune d\'oeuf|oeuf, jaune|oeuf, blanc|oeufs de lompe|oeufs de cabillaud|sandwich|burger|kebab|pané[e]?|frit[e]?|chips|fajita|brick|son d\'avoine'
    interdits = junk + "|" + sport_exclude
    
    interdits = junk + "|" + sport_exclude

    masque_sale = df_global['nom'].str.contains(interdits, case=False, na=False)

    df_clean = df_global[~masque_sale].copy()

    condiments = r'vinaigrette|pesto|bolognaise|ketchup|mayonnaise|moutarde|sauce tomate|sauce curry|aïoli|sauce burger|harissa|sauce bourguignonne|sauce au poivre'

    plats_intrus = r'museau|langue|tripes|pied|haricot|maquereau|boulette|canard|viande|poisson|poulet|agneau|sauté|riz|pâte|ravioli|thon'

    df_sauces_brut = df_global[df_global['nom'].str.contains(condiments, case=False, na=False)].copy()

    masque_intrus = df_sauces_brut['nom'].str.contains(plats_intrus, case=False, na=False)

    df_sauces_final = df_sauces_brut[~masque_intrus].copy()

    # On isole les viandes avec un bon taux de protéines pour la bonne nutrition
    viandes = df_clean[df_clean['sous_categorie'].str.contains('viandes|charcuteries|volailles', case=False, na=False) & (df_clean['prot'] >= 14)].copy()
    
    # Nos listes de mots pour le tri 
    mots_rouge = r'boeuf|bœuf|agneau|cheval|canard|autruche|cerf|chevreuil|mouton'
    mots_volaille = r'poulet|poule|dinde|caille|pintade|volaille|chapon|faisan|oie'
    mots_blanche = r'veau|chevreau'

    #on range sous forme de bacs
    bacs_aliments = {
        'PROT_PORC': viandes[viandes['nom'].str.contains(r'porc|lardon|saucisson|chorizo|jambon|bacon|salami|coppa|pancetta|mortadelle', case=False, na=False)],
        'PROT_VIANDE_ROUGE': viandes[viandes['nom'].str.contains(mots_rouge, case=False, na=False) & ~viandes['nom'].str.contains('porc|lardon', case=False, na=False)],
        'PROT_VOLAILLE': viandes[viandes['nom'].str.contains(mots_volaille, case=False, na=False) & ~viandes['nom'].str.contains('porc|lardon', case=False, na=False)],
        'PROT_BLANCHE_AUTRE': viandes[viandes['nom'].str.contains(mots_blanche, case=False, na=False) & ~viandes['nom'].str.contains('porc|lardon', case=False, na=False)],
        'PROT_P': df_clean[df_clean['sous_categorie'].str.contains('poissons|mollusques|crustacés', case=False, na=False) & (df_clean['prot'] >= 14)],
        'PROT_VEG': df_clean[(df_clean['sous_categorie'].str.contains('œufs|oeufs', case=False, na=False)) | (df_clean['nom'].str.contains(r'\btofu\b|\bseitan\b|\bsoja\b|\btempeh\b', case=False, na=False))],
        'S_HOT': df_sauces_final[df_sauces_final['nom'].str.contains(r'pesto|bolognaise|napolitaine|sauce tomate', case=False, na=False)],
        'S_COLD': df_sauces_final[df_sauces_final['nom'].str.contains(r'ketchup|mayonnaise|moutarde', case=False, na=False)],
        'VINAIGRETTE': df_sauces_final[df_sauces_final['nom'].str.contains(r'vinaigrette', case=False, na=False)],
        'RIZ': df_clean[df_clean['nom'].str.contains(r'\briz\b|\bquinoa\b|\blentille\b', case=False, na=False)],
        'SEMOU': df_clean[df_clean['nom'].str.contains(r'semoule|graine de couscous', case=False, na=False)],
        'POTATO': df_clean[df_clean['nom'].str.contains(r'pomme de terre|manioc|igname|patate douce', case=False, na=False)],
        'PAIN': df_clean[df_clean['nom'].str.contains(r'pain complet|pain de seigle|baguette|pain de mie', case=False, na=False)],
        'WRAP': df_global[df_global['nom'].str.contains(r'tortilla souple|wrap', case=False, na=False)],

        'LEG': df_clean[df_clean['sous_categorie'].str.contains('légumes', case=False, na=False)],
        'LAITUE': df_clean[df_clean['nom'].str.contains(r'laitue|mâche|scarole|roquette', case=False, na=False)],
        'FROMAGE': df_clean[df_clean['sous_categorie'].str.contains('fromages', case=False, na=False)],
        'FRUIT_ENTIER': df_clean[(df_clean['sous_categorie'] == 'fruits') & ~df_clean['nom'].str.contains('pulpe|séch|sec', case=False, na=False)],
        'FRUIT_PULPE': df_clean[df_clean['nom'].str.contains('pulpe', case=False, na=False) & (df_clean['sous_categorie'] == 'fruits')],
        'CERE': df_clean[df_clean['nom'].str.contains(r'\bavoine\b|\bflocon\b|\bmuesli\b', case=False, na=False)],
        'LAIT': df_clean[df_clean['nom'].str.contains('yaourt|skyr|fromage blanc', case=False, na=False)],
        'S_HOT': df_sauces_final[df_sauces_final['nom'].str.contains(r'pesto|bolognaise|sauce tomate', case=False, na=False)],
        'S_COLD': df_sauces_final[df_sauces_final['nom'].str.contains(r'ketchup|mayonnaise|moutarde|sauce bourguignonne|aïoli|sauce au poivre|sauce burger|harissa', case=False, na=False)],
        'VINAIGRETTE': df_sauces_final[df_sauces_final['nom'].str.contains(r'vinaigrette', case=False, na=False)],
        'BC': df_global[df_global['nom'].str.contains(r'beurre de cacahuète|pâte d\'arachide', case=False, na=False)],
        'GAL_RIZ': df_global[df_global['nom'].str.contains("Galette de riz", case=False, na=False)]
    }

    #liste final
    mon_dictionnaire_final = {}

    for nom_du_bac in bacs_aliments:
        tableau_actuel = bacs_aliments[nom_du_bac]
        propres = tableau_actuel.drop_duplicates(subset=['nom_propre']).sort_values('nom_propre')

        # liste des bacs
        liste_pour_json = []
        
        for index, ligne in propres.iterrows():
            
            # conversion CO2
            score_co2 = round(ligne['co2_kg'] / 10, 2)
            
            # TRAITEMENT MACROS
            
            p = round(ligne['prot'], 2)
            if p <= 0: p = "N/A"
            
            l = round(ligne['lip'], 2)
            if l <= 0: l = "N/A"
            
            g = round(ligne['glu'], 2)
            if g <= 0: g = "N/A"
            
            s = round(ligne['sucre'], 2)
            if s <= 0: s = "N/A"
            
            gras_s = round(ligne['gras_sat'], 2)
            if gras_s <= 0: gras_s = "N/A"

            # Objet Json
            info_aliment = {
                "nom": str(ligne['nom_propre']),
                "co2": score_co2,
                "cal": int(ligne['cal']),
                "prot": p,
                "lip": l,
                "gras_sat": gras_s,
                "glu": g,
                "sucre": s
            }
            
            liste_pour_json.append(info_aliment)

        mon_dictionnaire_final[nom_du_bac] = liste_pour_json
    
    f = open('database_co2k.json', 'w', encoding='utf-8')
    
    json.dump(mon_dictionnaire_final, f, ensure_ascii=False, indent=4)
    f.close()

lancer_nettoyage()