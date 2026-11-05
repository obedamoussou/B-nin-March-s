/* =========================================================
   CONFIGURATION — source des données (classeur partagé en
   « Tous les utilisateurs disposant du lien : lecteur »)
   ========================================================= */
export const SHEET_ID = '1ka5mBLkQhFu2pkjnEbuTcm8GCIog1LSmGqM0ZW2MfVA';
export const TABS = {
  marches: { name: 'Général', gid: '806934945' },
  stats: { name: 'Statistiques', gid: '1500365956' },
  zones: { name: 'Villes et Poles', gid: '0' }
};
export const REFRESH_EVERY = 5 * 60 * 1000; // resynchronisation automatique toutes les 5 minutes

/* Vue initiale : tout le Bénin */
export const BENIN_BOUNDS = [[6.15, 0.75], [12.45, 3.9]];

/* Couleur de chaque zone, repérée par son nom normalisé (sans « Pôle », accents, espaces) */
export const ZONE_COLORS = {
  grandnokoue: '#f4c542',
  sudest: '#b18cff',
  sudouest: '#2ec5c9',
  centre: '#ff7a59',
  nordest: '#2fd08a',
  nordouest: '#4f9dff'
};
export const ZONE_FALLBACK_COLORS = ['#f78fb3', '#9ad0ec', '#e0c097', '#a3e635'];

/* Fonds de carte */
export const BASEMAPS = {
  sombre: {
    label: 'Sombre',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    maxNativeZoom: 16,
    attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap'
  },
  plan: {
    label: 'Plan',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxNativeZoom: 19,
    attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap'
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    maxNativeZoom: 19,
    attribution: '&copy; Esri, Maxar, Earthstar Geographics'
  }
};
