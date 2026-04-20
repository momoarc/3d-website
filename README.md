# Porte Prestige — Site Web & CRM

Site e-commerce premium pour vendeur de portes en Algérie.  
Architecture : HTML/CSS/JS statique · COD (Cash on Delivery) · Zéro dépendance backend.

---

## Structure du projet

| Fichier | Description |
|---|---|
| `index.html` | Site public — showroom 3D, catalogue, formulaire COD |
| `admin.html` | Tableau de bord propriétaire — commandes, produits, équipe, marketing, livraison |
| `crm.html` | Portail agent — accès limité par rôle pour les employés |
| `showroom-360.html` | Showroom 3D immersif (Three.js) |
| `showroom.js` | Logique Three.js du showroom |

---

## Fonctionnalités

### Site Public
- Showroom 3D interactif (Three.js, panorama clickable)
- Catalogue produits filtrable par catégorie
- Formulaire de commande COD complet (nom, téléphone, wilaya, commune, adresse)
- Click-to-call, WhatsApp direct
- Tracking pixels : Meta, TikTok, Snapchat, GA4

### Admin (`admin.html`)
- **Commandes** — pipeline complet (Nouveau → Livré), export CSV
- **Produits** — CRUD catalogue, showroom configurator
- **Équipe** — création d'employés avec accès individuels, rôles, mots de passe
- **Performances** — leaderboard agents, activité par heure, journal global
- **Livraison** — 8 transporteurs algériens (Yalidine, Procolis, Maystro, Ecotrack, Guepex, ZR Express, Noest, Atlas) avec API token, sync statuts auto
- **Marketing** — Meta/TikTok/Snapchat/Google Ads pixels + Conversions API, générateur UTM, attribution leads, campagnes ROAS
- **Backend** — intégration Airtable + webhook n8n

### CRM Agent (`crm.html`)
- Login individuel par employé
- Accès filtré par rôle (Confirmation / Livraison / Superviseur)
- Logging de toutes les actions
- Performances personnelles + objectifs

---

## Stack technique

- HTML5 / CSS3 / Vanilla JS — zéro framework, zéro build step
- Three.js (CDN) — showroom 3D
- localStorage — persistance des données (remplaçable par Airtable via n8n)
- n8n (self-hosted) — automatisations, proxy API livraison, pixels conversion
- Airtable — CRM backend recommandé

---

## Lancer en local

Double-cliquer sur `START-SERVER.bat` (Windows) ou :

```bash
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

---

## Déploiement (recommandé : Netlify)

1. Connecter ce repo GitHub à [netlify.com](https://netlify.com)
2. Base directory : `/` — aucun build command
3. Publish directory : `/`
4. Deploy → URL publique en < 1 minute, CDN mondial, HTTPS automatique, gratuit

---

## Services de livraison supportés

| Service | API | Statut |
|---|---|---|
| Yalidine | `X-API-ID` + `X-API-TOKEN` | ✅ |
| Procolis | `token` header | ✅ |
| Maystro Delivery | `Authorization: Token` | ✅ |
| Ecotrack | `Authorization: Bearer` | ✅ |
| Guepex | `Authorization: Bearer` | ✅ |
| ZR Express | `Authorization: Bearer` | ✅ |
| Noest Express | `X-API-KEY` + `X-SECRET` | ✅ |
| Atlas Express | `Authorization: Bearer` | ✅ |

---

## Variables à ne jamais committer

- Tokens API transporteurs (configurés dans admin.html → Livraison)
- Tokens Meta / TikTok / Snapchat / Google (configurés dans admin.html → Marketing)
- Mots de passe employés (stockés dans localStorage, pas dans les fichiers)

---

*Projet en développement actif.*
