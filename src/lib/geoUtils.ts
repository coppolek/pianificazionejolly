// Utility per calcolo distanze geografiche, geocoding e ottimizzazione percorsi equi

// Database di coordinate delle province e principali città italiane per geocoding immediato e affidabile
export const ITALIAN_CITIES_COORDS: Record<string, { lat: number; lng: number }> = {
  // Lombardia
  'MILANO': { lat: 45.4642, lng: 9.1900 },
  'MI': { lat: 45.4642, lng: 9.1900 },
  // Emilia-Romagna e territorio Romagna / Riviera
  'BOLOGNA': { lat: 44.4949, lng: 11.3426 },
  'BO': { lat: 44.4949, lng: 11.3426 },
  'IMOLA': { lat: 44.3533, lng: 11.7144 },
  'MORDANO': { lat: 44.4319, lng: 11.8153 },
  'CASTEL SAN PIETRO TERME': { lat: 44.3986, lng: 11.5894 },
  'PARMA': { lat: 44.8015, lng: 10.3279 },
  'PR': { lat: 44.8015, lng: 10.3279 },
  'MODENA': { lat: 44.6471, lng: 10.9252 },
  'MO': { lat: 44.6471, lng: 10.9252 },
  'REGGIO EMILIA': { lat: 44.6983, lng: 10.6312 },
  'RE': { lat: 44.6983, lng: 10.6312 },
  'FERRARA': { lat: 44.8381, lng: 11.6198 },
  'FE': { lat: 44.8381, lng: 11.6198 },
  'COMACCHIO': { lat: 44.6917, lng: 12.1833 },
  'CENTO': { lat: 44.7267, lng: 11.2900 },
  'PIACENZA': { lat: 45.0526, lng: 9.6930 },
  'PC': { lat: 45.0526, lng: 9.6930 },
  'RAVENNA': { lat: 44.4178, lng: 12.2035 },
  'RA': { lat: 44.4178, lng: 12.2035 },
  'CERVIA': { lat: 44.2625, lng: 12.3503 },
  'MILANO MARITTIMA': { lat: 44.2764, lng: 12.3528 },
  'FAENZA': { lat: 44.2897, lng: 11.8775 },
  'LUGO': { lat: 44.4214, lng: 11.9089 },
  'ALFONSINE': { lat: 44.5056, lng: 12.0425 },
  'RUSSI': { lat: 44.3756, lng: 12.0333 },
  'BAGNACAVALLO': { lat: 44.4167, lng: 11.9833 },
  'FORLI': { lat: 44.2227, lng: 12.0407 },
  'FORLÌ': { lat: 44.2227, lng: 12.0407 },
  'FORLIMPOPOLI': { lat: 44.1889, lng: 12.1289 },
  'BERTINORO': { lat: 44.1500, lng: 12.1333 },
  'MELDOLA': { lat: 44.1311, lng: 12.0622 },
  'PREDAPPIO': { lat: 44.1056, lng: 11.9844 },
  'SANTA SOFIA': { lat: 43.9458, lng: 11.9089 },
  'BAGNO DI ROMAGNA': { lat: 43.8344, lng: 11.9611 },
  'CESENA': { lat: 44.1391, lng: 12.2432 },
  'FC': { lat: 44.1391, lng: 12.2432 },
  'CESENATICO': { lat: 44.2014, lng: 12.4019 },
  'SAVIGNANO SUL RUBICONE': { lat: 44.0894, lng: 12.3967 },
  'SAVIGNANO': { lat: 44.0894, lng: 12.3967 },
  'SAN MAURO PASCOLI': { lat: 44.1075, lng: 12.4172 },
  'SAN MAURO': { lat: 44.1075, lng: 12.4172 },
  'GAMBETTOLA': { lat: 44.1206, lng: 12.3361 },
  'GATTEO': { lat: 44.1167, lng: 12.4000 },
  'GATTEO A MARE': { lat: 44.1708, lng: 12.4358 },
  'LONGIANO': { lat: 44.0753, lng: 12.3275 },
  'SARSINA': { lat: 43.9189, lng: 12.1439 },
  'MERCATO SARACENO': { lat: 43.9611, lng: 12.2000 },
  'VERGHERETO': { lat: 43.7917, lng: 12.0000 },
  'RIMINI': { lat: 44.0678, lng: 12.5695 },
  'RN': { lat: 44.0678, lng: 12.5695 },
  'SANTARCANGELO DI ROMAGNA': { lat: 44.0633, lng: 12.4468 },
  'SANTARCANGELO': { lat: 44.0633, lng: 12.4468 },
  'BELLARIA-IGEA MARINA': { lat: 44.1481, lng: 12.4642 },
  'BELLARIA': { lat: 44.1481, lng: 12.4642 },
  'IGEA MARINA': { lat: 44.1350, lng: 12.4820 },
  'RICCIONE': { lat: 43.9995, lng: 12.6565 },
  'MISANO ADRIATICO': { lat: 43.9789, lng: 12.7003 },
  'MISANO': { lat: 43.9789, lng: 12.7003 },
  'CATTOLICA': { lat: 43.9634, lng: 12.7408 },
  'CORIANO': { lat: 43.9667, lng: 12.6000 },
  'SAN GIOVANNI IN MARIGNANO': { lat: 43.9392, lng: 12.7139 },
  'SAN CLEMENTE': { lat: 43.9347, lng: 12.6272 },
  'MORCIANO DI ROMAGNA': { lat: 43.9167, lng: 12.6500 },
  'MORCIANO': { lat: 43.9167, lng: 12.6500 },
  'SALUDECIO': { lat: 43.8744, lng: 12.6686 },
  'MONDAINO': { lat: 43.8561, lng: 12.6719 },
  'MONTEFIORE CONCA': { lat: 43.8894, lng: 12.6106 },
  'GEMMANO': { lat: 43.9033, lng: 12.5800 },
  'MONTESCUDO': { lat: 43.9214, lng: 12.5414 },
  'MONTE COLOMBO': { lat: 43.9214, lng: 12.5414 },
  'VERUCCHIO': { lat: 43.9833, lng: 12.4167 },
  'VILLA VERUCCHIO': { lat: 44.0200, lng: 12.4300 },
  'POGGIO TORRIANA': { lat: 44.0417, lng: 12.4167 },
  'POGGIO BERNI': { lat: 44.0417, lng: 12.4167 },
  'TORRIANA': { lat: 43.9833, lng: 12.3833 },
  'NOVAFELTRIA': { lat: 43.8917, lng: 12.2889 },
  'SAN LEO': { lat: 43.8967, lng: 12.3439 },
  'TALAMELLO': { lat: 43.9039, lng: 12.2861 },
  'PENNABILLI': { lat: 43.8167, lng: 12.2667 },
  'SANT\'AGATA FELTRIA': { lat: 43.8667, lng: 12.2167 },
  'SAN MARINO': { lat: 43.9424, lng: 12.4578 },
  'DOGANA': { lat: 43.9780, lng: 12.4900 },
  // Marche limitrofe
  'PESARO': { lat: 43.9102, lng: 12.9133 },
  'FANO': { lat: 43.8433, lng: 13.0189 },
  'URBINO': { lat: 43.7262, lng: 12.6366 },
  'TAVULLIA': { lat: 43.8986, lng: 12.7533 },
  'GRADARA': { lat: 43.9406, lng: 12.7719 },
  'GABICCE MARE': { lat: 43.9667, lng: 12.7667 },
  'GABICCE': { lat: 43.9667, lng: 12.7667 },
  'FERMIGNANO': { lat: 43.6761, lng: 12.6456 },
  'MONDOLFO': { lat: 43.7511, lng: 13.0978 },
  'SANT\'IPPOLITO': { lat: 43.6833, lng: 12.8719 },
  'PIOBBICO': { lat: 43.5889, lng: 12.5119 },
  'CAGLI': { lat: 43.5500, lng: 12.6500 },
  'FOSSOMBRONE': { lat: 43.6897, lng: 12.8067 },

  // Toscana
  'FIRENZE': { lat: 43.7696, lng: 11.2558 },
  'FI': { lat: 43.7696, lng: 11.2558 },
  'LIVORNO': { lat: 43.5485, lng: 10.3106 },
  'LI': { lat: 43.5485, lng: 10.3106 },
  'PISA': { lat: 43.7228, lng: 10.4017 },
  'PI': { lat: 43.7228, lng: 10.4017 },
  'SIENA': { lat: 43.3188, lng: 11.3308 },
  'SI': { lat: 43.3188, lng: 11.3308 },
  'AREZZO': { lat: 43.4632, lng: 11.8796 },
  'AR': { lat: 43.4632, lng: 11.8796 },
  'LUCCA': { lat: 43.8430, lng: 10.5079 },
  'LU': { lat: 43.8430, lng: 10.5079 },
  'PISTOIA': { lat: 43.9333, lng: 10.9167 },
  'PT': { lat: 43.9333, lng: 10.9167 },
  'PRATO': { lat: 43.8777, lng: 11.1022 },
  'PO': { lat: 43.8777, lng: 11.1022 },
  'GROSSETO': { lat: 42.7606, lng: 11.1135 },
  'GR': { lat: 42.7606, lng: 11.1135 },
  'MASSA': { lat: 44.0371, lng: 10.1415 },
  'CARRARA': { lat: 44.0793, lng: 10.1017 },
  'MS': { lat: 44.0371, lng: 10.1415 },

  // Piemonte & Valle d'Aosta
  'TORINO': { lat: 45.0703, lng: 7.6869 },
  'TO': { lat: 45.0703, lng: 7.6869 },
  'NOVARA': { lat: 45.4469, lng: 8.6212 },
  'NO': { lat: 45.4469, lng: 8.6212 },
  'ALESSANDRIA': { lat: 44.9129, lng: 8.6152 },
  'AL': { lat: 44.9129, lng: 8.6152 },
  'ASTI': { lat: 44.9008, lng: 8.2069 },
  'AT': { lat: 44.9008, lng: 8.2069 },
  'CUNEO': { lat: 44.3845, lng: 7.5427 },
  'CN': { lat: 44.3845, lng: 7.5427 },
  'VERCELLI': { lat: 45.3217, lng: 8.4239 },
  'VC': { lat: 45.3217, lng: 8.4239 },
  'BIELLA': { lat: 45.5663, lng: 8.0533 },
  'BI': { lat: 45.5663, lng: 8.0533 },
  'VERBANIA': { lat: 45.9234, lng: 8.5517 },
  'VB': { lat: 45.9234, lng: 8.5517 },
  'AOSTA': { lat: 45.7371, lng: 7.3201 },
  'AO': { lat: 45.7371, lng: 7.3201 },

  // Veneto
  'VENEZIA': { lat: 45.4408, lng: 12.3155 },
  'VE': { lat: 45.4408, lng: 12.3155 },
  'VERONA': { lat: 45.4384, lng: 10.9916 },
  'VR': { lat: 45.4384, lng: 10.9916 },
  'PADOVA': { lat: 45.4064, lng: 11.8768 },
  'PD': { lat: 45.4064, lng: 11.8768 },
  'VICENZA': { lat: 45.5455, lng: 11.5354 },
  'VI': { lat: 45.5455, lng: 11.5354 },
  'TREVISO': { lat: 45.6669, lng: 12.2430 },
  'TV': { lat: 45.6669, lng: 12.2430 },
  'ROVIGO': { lat: 45.0703, lng: 11.7906 },
  'RO': { lat: 45.0703, lng: 11.7906 },
  'BELLUNO': { lat: 46.1425, lng: 12.2167 },
  'BL': { lat: 46.1425, lng: 12.2167 },

  // Liguria
  'GENOVA': { lat: 44.4056, lng: 8.9463 },
  'GE': { lat: 44.4056, lng: 8.9463 },
  'SAVONA': { lat: 44.3079, lng: 8.4811 },
  'SV': { lat: 44.3079, lng: 8.4811 },
  'LA SPEZIA': { lat: 44.1025, lng: 9.8241 },
  'SP': { lat: 44.1025, lng: 9.8241 },
  'IMPERIA': { lat: 43.8864, lng: 8.0264 },
  'IM': { lat: 43.8864, lng: 8.0264 },

  // Marche & Umbria
  'ANCONA': { lat: 43.6158, lng: 13.5189 },
  'AN': { lat: 43.6158, lng: 13.5189 },
  'PU': { lat: 43.9102, lng: 12.9133 },
  'MACERATA': { lat: 43.3002, lng: 13.4531 },
  'MC': { lat: 43.3002, lng: 13.4531 },
  'FERMO': { lat: 43.1609, lng: 13.7183 },
  'FM': { lat: 43.1609, lng: 13.7183 },
  'ASCOLI PICENO': { lat: 42.8549, lng: 13.5759 },
  'AP': { lat: 42.8549, lng: 13.5759 },
  'PERUGIA': { lat: 43.1107, lng: 12.3908 },
  'PG': { lat: 43.1107, lng: 12.3908 },
  'TERNI': { lat: 42.5641, lng: 12.6406 },
  'TR': { lat: 42.5641, lng: 12.6406 },

  // Lazio
  'ROMA': { lat: 41.9028, lng: 12.4964 },
  'RM': { lat: 41.9028, lng: 12.4964 },
  'LATINA': { lat: 41.4676, lng: 12.9037 },
  'LT': { lat: 41.4676, lng: 12.9037 },
  'FROSINONE': { lat: 41.6416, lng: 13.3512 },
  'FR': { lat: 41.6416, lng: 13.3512 },
  'VITERBO': { lat: 42.4207, lng: 12.1077 },
  'VT': { lat: 42.4207, lng: 12.1077 },
  'RIETI': { lat: 42.4042, lng: 12.8628 },
  'RI': { lat: 42.4042, lng: 12.8628 },

  // Campania
  'NAPOLI': { lat: 40.8518, lng: 14.2681 },
  'NA': { lat: 40.8518, lng: 14.2681 },
  'SALERNO': { lat: 40.6824, lng: 14.7681 },
  'SA': { lat: 40.6824, lng: 14.7681 },
  'CASERTA': { lat: 41.0821, lng: 14.3323 },
  'CE': { lat: 41.0821, lng: 14.3323 },
  'AVELLINO': { lat: 40.9149, lng: 14.7906 },
  'AV': { lat: 40.9149, lng: 14.7906 },
  'BENEVENTO': { lat: 41.1307, lng: 14.7788 },
  'BN': { lat: 41.1307, lng: 14.7788 },

  // Puglia
  'BARI': { lat: 41.1171, lng: 16.8719 },
  'BA': { lat: 41.1171, lng: 16.8719 },
  'LECCE': { lat: 40.3515, lng: 18.1750 },
  'LE': { lat: 40.3515, lng: 18.1750 },
  'TARANTO': { lat: 40.4644, lng: 17.2470 },
  'TA': { lat: 40.4644, lng: 17.2470 },
  'FOGGIA': { lat: 41.4622, lng: 15.5447 },
  'FG': { lat: 41.4622, lng: 15.5447 },
  'BRINDISI': { lat: 40.6321, lng: 17.9418 },
  'BR': { lat: 40.6321, lng: 17.9418 },
  'BARLETTA': { lat: 41.3197, lng: 16.2825 },
  'ANDRIA': { lat: 41.2269, lng: 16.2974 },
  'TRANI': { lat: 41.2727, lng: 16.4172 },
  'BT': { lat: 41.2727, lng: 16.4172 },

  // Calabria
  'REGGIO CALABRIA': { lat: 38.1113, lng: 15.6473 },
  'RC': { lat: 38.1113, lng: 15.6473 },
  'CATANZARO': { lat: 38.9098, lng: 16.5877 },
  'CZ': { lat: 38.9098, lng: 16.5877 },
  'COSENZA': { lat: 39.3090, lng: 16.2502 },
  'CS': { lat: 39.3090, lng: 16.2502 },
  'CROTONE': { lat: 39.0808, lng: 17.1272 },
  'KR': { lat: 39.0808, lng: 17.1272 },
  'VIBO VALENTIA': { lat: 38.6756, lng: 16.1009 },
  'VV': { lat: 38.6756, lng: 16.1009 },

  // Sicilia
  'PALERMO': { lat: 38.1157, lng: 13.3615 },
  'PA': { lat: 38.1157, lng: 13.3615 },
  'CATANIA': { lat: 37.5079, lng: 15.0873 },
  'CT': { lat: 37.5079, lng: 15.0873 },
  'MESSINA': { lat: 38.1938, lng: 15.5540 },
  'ME': { lat: 38.1938, lng: 15.5540 },
  'SIRACUSA': { lat: 37.0755, lng: 15.2866 },
  'SR': { lat: 37.0755, lng: 15.2866 },
  'RAGUSA': { lat: 36.9269, lng: 14.7306 },
  'RG': { lat: 36.9269, lng: 14.7306 },
  'TRAPANI': { lat: 38.0176, lng: 12.5365 },
  'TP': { lat: 38.0176, lng: 12.5365 },
  'AGRIGENTO': { lat: 37.3111, lng: 13.5765 },
  'AG': { lat: 37.3111, lng: 13.5765 },
  'CALTANISSETTA': { lat: 37.4922, lng: 14.0622 },
  'CL': { lat: 37.4922, lng: 14.0622 },
  'ENNA': { lat: 37.5678, lng: 14.2792 },
  'EN': { lat: 37.5678, lng: 14.2792 },

  // Sardegna
  'CAGLIARI': { lat: 39.2238, lng: 9.1217 },
  'CA': { lat: 39.2238, lng: 9.1217 },
  'SASSARI': { lat: 40.7259, lng: 8.5556 },
  'SS': { lat: 40.7259, lng: 8.5556 },
  'NUORO': { lat: 40.3207, lng: 9.3283 },
  'NU': { lat: 40.3207, lng: 9.3283 },
  'ORISTANO': { lat: 39.9064, lng: 8.5925 },
  'OR': { lat: 39.9064, lng: 8.5925 },

  // Abruzzo & Molise
  'L\'AQUILA': { lat: 42.3498, lng: 13.3995 },
  'AQ': { lat: 42.3498, lng: 13.3995 },
  'PESCARA': { lat: 42.4618, lng: 14.2140 },
  'PE': { lat: 42.4618, lng: 14.2140 },
  'CHIETI': { lat: 42.3512, lng: 14.1675 },
  'CH': { lat: 42.3512, lng: 14.1675 },
  'TERAMO': { lat: 42.6589, lng: 13.7039 },
  'TE': { lat: 42.6589, lng: 13.7039 },
  'CAMPOBASSO': { lat: 41.5604, lng: 14.6627 },
  'CB': { lat: 41.5604, lng: 14.6627 },
  'ISERNIA': { lat: 41.5969, lng: 14.2347 },
  'IS': { lat: 41.5969, lng: 14.2347 },

  // Basilicata
  'POTENZA': { lat: 40.6404, lng: 15.8056 },
  'PZ': { lat: 40.6404, lng: 15.8056 },
  'MATERA': { lat: 40.6664, lng: 16.6043 },
  'MT': { lat: 40.6664, lng: 16.6043 },

  // Trentino-Alto Adige & Friuli-Venezia Giulia
  'TRENTO': { lat: 46.0748, lng: 11.1217 },
  'TN': { lat: 46.0748, lng: 11.1217 },
  'BOLZANO': { lat: 46.4983, lng: 11.3548 },
  'BZ': { lat: 46.4983, lng: 11.3548 },
  'TRIESTE': { lat: 45.6495, lng: 13.7768 },
  'TS': { lat: 45.6495, lng: 13.7768 },
  'UDINE': { lat: 46.0711, lng: 13.2346 },
  'UD': { lat: 46.0711, lng: 13.2346 },
  'PORDENONE': { lat: 45.9566, lng: 12.6606 },
  'PN': { lat: 45.9566, lng: 12.6606 },
  'GORIZIA': { lat: 45.9409, lng: 13.6217 },
  'GO': { lat: 45.9409, lng: 13.6217 }
};

// Cache locale per geocoding
const geocodeCache: Record<string, { lat: number; lng: number }> = {};

/**
 * Risolve le coordinate per una data località (indirizzo, comune, provincia)
 */
export async function resolveCoordinates(
  address?: string,
  city?: string,
  province?: string,
  knownLat?: number,
  knownLng?: number
): Promise<{ lat: number; lng: number } | null> {
  if (knownLat !== undefined && knownLng !== undefined && !isNaN(knownLat) && !isNaN(knownLng)) {
    return { lat: knownLat, lng: knownLng };
  }

  const cleanCity = (city || '').trim().toUpperCase();
  const cleanProv = (province || '').trim().toUpperCase();

  // 1. Match diretto su città nota
  if (cleanCity && ITALIAN_CITIES_COORDS[cleanCity]) {
    return ITALIAN_CITIES_COORDS[cleanCity];
  }

  // 2. Match su provincia nota
  if (cleanProv && ITALIAN_CITIES_COORDS[cleanProv]) {
    return ITALIAN_CITIES_COORDS[cleanProv];
  }

  const fullQuery = [address, city, province, 'Italia'].filter(Boolean).join(', ');
  if (!fullQuery || fullQuery === 'Italia') {
    return null;
  }

  const cacheKey = fullQuery.toUpperCase();
  if (geocodeCache[cacheKey]) {
    return geocodeCache[cacheKey];
  }

  // Prova geocoding con fallback a query più semplice
  try {
    const encoded = encodeURIComponent(fullQuery);
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`, {
      headers: { 'Accept-Language': 'it' }
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        geocodeCache[cacheKey] = coords;
        return coords;
      }
    }
  } catch (err) {
    // In caso di errore di rete o offline, usa le coordinate di default
  }

  // Fallback se comune/provincia contiene parzialmente una provincia nota
  for (const [key, coords] of Object.entries(ITALIAN_CITIES_COORDS)) {
    if (cleanCity.includes(key) || cleanProv.includes(key)) {
      geocodeCache[cacheKey] = coords;
      return coords;
    }
  }

  return null;
}

/**
 * Calcola la distanza tra due punti geografici con formula dell'Haversine,
 * applicando un fattore di tortuosità stradale (1.28x) per stimare i km effettivi di guida.
 */
export function calculateDrivingDistanceKm(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  if (p1.lat === p2.lat && p1.lng === p2.lng) return 0;

  const R = 6371; // Raggio medio terra in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistanceKm = R * c;

  // Fattore di tortuosità stradale realistico (rete viaria urbana/extraurbana)
  const roadFactor = 1.28;
  const drivingKm = Math.round(straightDistanceKm * roadFactor * 10) / 10;
  return drivingKm;
}

/**
 * Calcola il tempo stimato di percorrenza in minuti (velocità media ponderata 50 km/h + 10 min margine/parcheggio)
 */
export function estimateTravelMinutes(km: number): number {
  if (km <= 0.5) return 5;
  const drivingMinutes = (km / 50) * 60;
  return Math.round(drivingMinutes + 10);
}

/**
 * Descrizione leggibile di una località
 */
export function formatLocationName(item: { address?: string; city?: string; province?: string; name?: string }): string {
  const parts = [];
  if (item.address) parts.push(item.address);
  if (item.city) parts.push(item.city);
  if (item.province) parts.push(`(${item.province})`);
  return parts.length > 0 ? parts.join(', ') : item.name || 'Domicilio';
}

/**
 * Estrae il nome di un comune o città nota da un testo (es. nome cantiere "CONDOMINIO TERMINUS - RIMINI")
 */
export function extractCityFromText(text?: string): string {
  if (!text) return '';
  const clean = text.trim().toUpperCase();
  
  // Controlla se c'è un trattino seguito dalla città, es: "CANTIERE - RIMINI" o "HOTEL (RICCIONE)"
  const dashMatch = clean.match(/[-–—/]\s*([A-ZÀ-Ú'\s]+)$/);
  if (dashMatch) {
    const candidate = dashMatch[1].trim();
    if (ITALIAN_CITIES_COORDS[candidate]) return candidate;
  }

  // Cerca per corrispondenza esatta di parole chiave ordinate per lunghezza decrescente
  const sortedCities = Object.keys(ITALIAN_CITIES_COORDS).filter(k => k.length > 2).sort((a, b) => b.length - a.length);
  for (const city of sortedCities) {
    if (clean.includes(city)) {
      return city;
    }
  }
  return '';
}

/**
 * Calcolo sincrono e immediato della distanza stimata, ideale per il rendering UI
 */
export function getTripEstimateSync(
  employee?: { address?: string; city?: string; province?: string; lat?: number; lng?: number; name?: string },
  workSiteOrName?: { address?: string; city?: string; province?: string; lat?: number; lng?: number; name?: string } | string
): { travelKm: number; travelTimeMinutes: number; fromLocation: string; toLocation: string } {
  if (!employee) {
    return { travelKm: 0, travelTimeMinutes: 0, fromLocation: '', toLocation: '' };
  }

  const wsObj = typeof workSiteOrName === 'string' 
    ? { name: workSiteOrName, city: extractCityFromText(workSiteOrName) }
    : { ...workSiteOrName, city: workSiteOrName?.city || extractCityFromText(workSiteOrName?.name) };

  const fromCity = (employee.city || '').trim().toUpperCase();
  const toCity = (wsObj.city || '').trim().toUpperCase();

  const fromCoords = (employee.lat && employee.lng) 
    ? { lat: employee.lat, lng: employee.lng }
    : (fromCity && ITALIAN_CITIES_COORDS[fromCity] ? ITALIAN_CITIES_COORDS[fromCity] : (employee.province && ITALIAN_CITIES_COORDS[employee.province.toUpperCase()] ? ITALIAN_CITIES_COORDS[employee.province.toUpperCase()] : null));

  const toCoords = (wsObj.lat && wsObj.lng)
    ? { lat: wsObj.lat, lng: wsObj.lng }
    : (toCity && ITALIAN_CITIES_COORDS[toCity] ? ITALIAN_CITIES_COORDS[toCity] : (wsObj.province && ITALIAN_CITIES_COORDS[wsObj.province.toUpperCase()] ? ITALIAN_CITIES_COORDS[wsObj.province.toUpperCase()] : null));

  const fromLocation = formatLocationName(employee);
  const toLocation = formatLocationName(wsObj);

  if (fromCoords && toCoords) {
    let km = calculateDrivingDistanceKm(fromCoords, toCoords);
    if (km === 0) {
      // Se sono nello stesso comune, stima tragitto urbano standard
      km = 3.5;
    }
    const minutes = estimateTravelMinutes(km);
    return { travelKm: km, travelTimeMinutes: minutes, fromLocation, toLocation };
  }

  // Stima di fallback minima plausibile se non geocodificato
  return { 
    travelKm: fromCity && toCity && fromCity === toCity ? 3.5 : 8.0, 
    travelTimeMinutes: fromCity && toCity && fromCity === toCity ? 12 : 18, 
    fromLocation, 
    toLocation 
  };
}

/**
 * Calcola i km di percorrenza e i minuti stimati tra un operatore e un cantiere
 */
export async function calculateTripKmAndMinutes(
  employee?: { address?: string; city?: string; province?: string; lat?: number; lng?: number },
  workSite?: { address?: string; city?: string; province?: string; lat?: number; lng?: number; name?: string }
): Promise<{ travelKm: number; travelTimeMinutes: number; fromLocation: string; toLocation: string }> {
  if (!employee || !workSite) {
    return { travelKm: 0, travelTimeMinutes: 0, fromLocation: '', toLocation: '' };
  }

  const effectiveWsCity = workSite.city || extractCityFromText(workSite.name);
  const fromLocation = formatLocationName(employee);
  const toLocation = formatLocationName({ ...workSite, city: effectiveWsCity });

  // Risolve coordinate operatore
  const empCoords = await resolveCoordinates(
    employee.address,
    employee.city,
    employee.province,
    employee.lat,
    employee.lng
  );

  // Risolve coordinate cantiere
  const wsCoords = await resolveCoordinates(
    workSite.address,
    effectiveWsCity,
    workSite.province,
    workSite.lat,
    workSite.lng
  );

  if (!empCoords || !wsCoords) {
    // Fallback con stima sincrona
    const syncRes = getTripEstimateSync(employee, { ...workSite, city: effectiveWsCity });
    return syncRes;
  }

  let travelKm = calculateDrivingDistanceKm(empCoords, wsCoords);
  if (travelKm === 0) {
    // Stesso comune / stessa coordinate generica: tragitto urbano stimato
    travelKm = 3.5;
  }
  const travelTimeMinutes = estimateTravelMinutes(travelKm);

  return { travelKm, travelTimeMinutes, fromLocation, toLocation };
}

