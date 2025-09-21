# Wallonie Taxe Sim — paquet corrigé

## Structure
- backend/ (API Node/Express, ESM)
  - server.js
  - providers/
    - db.js        (PostgreSQL helper)
    - carquery.js  (JSONP parsing OK)
    - rdw.js       (RDW helpers)
    - multi.js     (CarQuery + DB fallback)
- frontend/
  - index.html
  - config.js

## Render — Service Node (backend)
- Build Command: `cd backend && npm install`
- Start Command: `cd backend && npm start`
- Env vars:
  - DATABASE_URL = (ta Postgres – **External** si tu testes depuis ton PC, **Internal** si même réseau Render)
  - PGSSL = require
  - PORT = 3000

## Render — Static site (frontend)
- Déploie le dossier `frontend/`
- Variable (optionnel): API_BASE = https://wallonie-taxe-sim.onrender.com
  (sinon, c'est codé en dur dans frontend/config.js)

## Tests
- GET https://<backend>/health  -> { ok: true, provider: "multi" }
- GET https://<backend>/api/makes -> doit lister beaucoup de marques (via CarQuery)
- Frontend -> choisir marque > modèle > année > moteur
  - si moteur avec trim_id (depuis DB), /api/quote renvoie TMC et taxe
  - sinon "(spécs manquantes)"
