# Next2Care Planning

Planningssysteem voor Next2Care: zorginstellingen zetten diensten open, zzp'ers melden zich aan, Next2Care keurt goed. Alles live, zonder losse mails en Excel-lijsten.

## Stand van zaken

| Onderdeel | Status |
| --- | --- |
| Werkend prototype (alle rollen, live planning, inlogportaal) | Klaar, zie `prototype/` |
| Next.js-project met MongoDB-koppeling en datamodel | Klaar |
| MongoDB Atlas koppelen | **Volgende stap** |
| Inloggen met e-mail en wachtwoord | Na de koppeling |
| Schermen overzetten uit het prototype | Daarna |

## Techniek

- **Next.js 15** (App Router, TypeScript)
- **MongoDB** via Mongoose (`src/lib/db.ts`, modellen in `src/models/index.ts`)
- Huisstijl: navy `#0F1322`, Plus Jakarta Sans

## Lokaal starten

```bash
npm install
cp .env.example .env.local   # vul MONGODB_URI in
npm run dev                  # http://localhost:3000
```

`GET /api/health` laat zien of de database bereikbaar is.

## MongoDB koppelen (Atlas)

1. Maak een gratis cluster op [MongoDB Atlas](https://www.mongodb.com/atlas), regio **Europa** (bijv. Frankfurt of Amsterdam), voor de AVG.
2. *Database Access*: maak een databasegebruiker met een sterk wachtwoord.
3. *Network Access*: voeg het IP-adres van je hosting toe (voor lokaal testen je eigen IP).
4. *Connect → Drivers*: kopieer de connection string naar `MONGODB_URI` in `.env.local` (en later in de hostingomgeving).
5. Start de app; de startpagina toont "Database: Verbonden".

## Datamodel

| Collectie | Inhoud |
| --- | --- |
| `users` | Inlogaccounts met rol: admin (Next2Care), planner, zzp |
| `institutions` | Zorginstellingen met afdelingen |
| `zzpprofiles` | Zzp'ers: functies, KvK, BIG, beschikbaarheid |
| `shifts` | Diensten met status, aanmeldingen, toegewezen zzp'er en gewerkte uren |
| `notifications` | Meldingen per gebruiker |
| `auditlogs` | Wie wat wanneer heeft gewijzigd |

Geen patiëntgegevens in dit systeem: diensten beschrijven alleen afdeling en functie.

## Klantdemo

`prototype/next2care-demo.html` is een losse demoversie voor de klant: voorbeeldgegevens (datums lopen mee met vandaag), vrij wisselen tussen rollen, een rondleiding in 9 stappen en een knop "Opnieuw beginnen". Hij heeft geen login of database nodig en synchroniseert live tussen twee open vensters. De demo wordt gebouwd uit het prototype:

```bash
cd prototype && node build-demo.js   # gebruikt demo-layer.js en demo-ui.js
```

## Prototype en tests

`prototype/next2care-planning.html` is het werkende prototype (gepubliceerd op claude.ai). In `prototype/tests/` staan de automatische controles (happy flow, sad flow, inloggen):

```bash
cd prototype/tests && npm init -y && npm i jsdom@24
node flows.js ../next2care-planning.html
node extra.js ../next2care-planning.html
node login.js ../next2care-planning.html
```
