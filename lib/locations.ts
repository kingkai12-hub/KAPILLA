/** Case-insensitive lookup for location coordinates */
export function getLocationCoords(name: string): { lat: number; lng: number } | undefined {
  if (!name || typeof name !== 'string') return undefined;
  const key = Object.keys(locationCoords).find(k => k.toLowerCase() === name.trim().toLowerCase());
  return key ? locationCoords[key] : undefined;
}

/**
 * Comprehensive Tanzania Location Database
 * Includes major cities, regional centers, districts, towns, villages, and landmarks
 * Total: 200+ locations across all regions
 */
export const locationCoords: Record<string, { lat: number, lng: number }> = {
  // ========== MAJOR CITIES ==========
  "Dar es Salaam": { lat: -6.8151812, lng: 39.2864692 },
  "Mwanza": { lat: -2.5164, lng: 32.9175 },
  "Arusha": { lat: -3.3869, lng: 36.6830 },
  "Dodoma": { lat: -6.1630, lng: 35.7516 },
  "Mbeya": { lat: -8.9094, lng: 33.4608 },
  "Morogoro": { lat: -6.8278, lng: 37.6591 },
  "Tanga": { lat: -5.0889, lng: 39.0983 },
  "Zanzibar City": { lat: -6.1659, lng: 39.2026 },
  "Moshi": { lat: -3.3500, lng: 37.3333 },
  "Tabora": { lat: -5.0167, lng: 32.8000 },
  "Iringa": { lat: -7.7667, lng: 35.7000 },
  "Kigoma": { lat: -4.8769, lng: 29.6267 },
  "Songea": { lat: -10.6833, lng: 35.6500 },
  "Sumbawanga": { lat: -7.9667, lng: 31.6167 },
  "Shinyanga": { lat: -3.6667, lng: 33.4167 },
  "Musoma": { lat: -1.5000, lng: 33.8000 },
  "Bukoba": { lat: -1.3316, lng: 31.8128 },
  "Lindi": { lat: -9.9969, lng: 39.7145 },
  "Mtwara": { lat: -10.2736, lng: 40.1828 },
  "Singida": { lat: -4.8167, lng: 34.7500 },

  // ========== DAR ES SALAAM REGION ==========
  "Kinondoni": { lat: -6.7833, lng: 39.2333 },
  "Ilala": { lat: -6.8167, lng: 39.2833 },
  "Temeke": { lat: -6.8500, lng: 39.2667 },
  "Ubungo": { lat: -6.7833, lng: 39.2500 },
  "Kigamboni": { lat: -6.8667, lng: 39.3167 },
  "Mbagala": { lat: -6.8667, lng: 39.2500 },
  "Mwenge": { lat: -6.7667, lng: 39.2333 },
  "Posta": { lat: -6.8167, lng: 39.2833 },
  "Kariakoo": { lat: -6.8167, lng: 39.2667 },
  "Magomeni": { lat: -6.8000, lng: 39.2667 },
  "Sinza": { lat: -6.7833, lng: 39.2500 },
  "Mikocheni": { lat: -6.7667, lng: 39.2500 },
  "Msasani": { lat: -6.7667, lng: 39.2667 },
  "Oysterbay": { lat: -6.7833, lng: 39.2667 },
  "Masaki": { lat: -6.7833, lng: 39.2833 },
  "Upanga": { lat: -6.8000, lng: 39.2833 },
  "Kurasini": { lat: -6.8500, lng: 39.2833 },
  "Mbezi": { lat: -6.7500, lng: 39.2167 },
  "Goba": { lat: -6.7333, lng: 39.2000 },
  "Bunju": { lat: -6.7167, lng: 39.2000 },
  "Kunduchi": { lat: -6.6667, lng: 39.2167 },
  "Tegeta": { lat: -6.6500, lng: 39.2333 },
  "Mbweni": { lat: -6.8333, lng: 39.2333 },
  "Kijichi": { lat: -6.8833, lng: 39.2500 },
  "Kibaha": { lat: -6.7667, lng: 38.9167 },
  "Bagamoyo": { lat: -6.4442, lng: 38.9056 },
  "Kisarawe": { lat: -6.9667, lng: 38.9833 },
  "Mkuranga": { lat: -7.1167, lng: 39.2667 },

  // ========== ARUSHA REGION ==========
  "Karatu": { lat: -3.3333, lng: 35.6667 },
  "Monduli": { lat: -3.3000, lng: 36.4500 },
  "Longido": { lat: -2.6833, lng: 36.7000 },
  "Ngorongoro": { lat: -3.1667, lng: 35.5000 },
  "Mbulu": { lat: -3.8500, lng: 35.5333 },
  "Babati": { lat: -4.2167, lng: 35.7500 },
  "Hanang": { lat: -4.4500, lng: 35.4500 },
  "Kiteto": { lat: -4.1667, lng: 36.5000 },
  "Simanjiro": { lat: -3.7500, lng: 37.0000 },
  "Namanga": { lat: -2.5500, lng: 36.7833 },
  "Usa River": { lat: -3.3667, lng: 36.8500 },
  "Tengeru": { lat: -3.3667, lng: 36.8167 },
  "Ngaramtoni": { lat: -3.3167, lng: 36.7500 },
  "Mto wa Mbu": { lat: -3.3500, lng: 35.8500 },

  // ========== KILIMANJARO REGION ==========
  "Same": { lat: -4.0667, lng: 37.7333 },
  "Mwanga": { lat: -3.8333, lng: 37.7833 },
  "Rombo": { lat: -3.3333, lng: 37.6667 },
  "Hai": { lat: -3.3333, lng: 37.2500 },
  "Siha": { lat: -3.1667, lng: 37.2500 },
  "Machame": { lat: -3.2833, lng: 37.2333 },
  "Marangu": { lat: -3.2833, lng: 37.5167 },
  "Himo": { lat: -3.4000, lng: 37.5333 },
  "Taveta": { lat: -3.4000, lng: 37.6833 },

  // ========== TANGA REGION ==========
  "Korogwe": { lat: -5.1500, lng: 38.4833 },
  "Lushoto": { lat: -4.7833, lng: 38.2833 },
  "Handeni": { lat: -5.4333, lng: 38.0167 },
  "Pangani": { lat: -5.4333, lng: 38.9667 },
  "Muheza": { lat: -5.1667, lng: 38.7833 },
  "Mkinga": { lat: -5.0000, lng: 39.0000 },
  "Bumbuli": { lat: -4.8333, lng: 38.2500 },
  "Mlalo": { lat: -4.7500, lng: 38.3333 },
  "Soni": { lat: -4.8667, lng: 38.3167 },
  "Amani": { lat: -5.1000, lng: 38.6333 },

  // ========== MOROGORO REGION ==========
  "Kilosa": { lat: -6.8333, lng: 36.9833 },
  "Mikumi": { lat: -7.4069, lng: 36.9772 },
  "Ifakara": { lat: -8.1333, lng: 36.6833 },
  "Mahenge": { lat: -8.6667, lng: 36.7000 },
  "Ulanga": { lat: -8.5833, lng: 36.7500 },
  "Kilombero": { lat: -8.2500, lng: 36.5000 },
  "Mvomero": { lat: -6.4167, lng: 37.6667 },
  "Turiani": { lat: -6.3333, lng: 37.6667 },
  "Melela": { lat: -6.5000, lng: 37.5833 },
  "Kidatu": { lat: -7.7167, lng: 36.9667 },
  "Kidodi": { lat: -7.6667, lng: 36.9500 },

  // ========== PWANI (COAST) REGION ==========
  "Chalinze": { lat: -6.6372, lng: 38.3544 },
  "Kibiti": { lat: -7.7167, lng: 38.9500 },
  "Utete": { lat: -7.9667, lng: 38.9333 },
  "Ikwiriri": { lat: -7.8333, lng: 38.7667 },
  "Bungu": { lat: -7.2667, lng: 38.8333 },
  "Mafia Island": { lat: -7.9167, lng: 39.7833 },
  "Kilindoni": { lat: -7.9167, lng: 39.6667 },
  "Rufiji": { lat: -7.9667, lng: 38.7667 },

  // ========== MWANZA REGION ==========
  "Magu": { lat: -2.5833, lng: 33.4333 },
  "Sengerema": { lat: -2.6333, lng: 32.6500 },
  "Geita": { lat: -2.8667, lng: 32.2500 },
  "Kwimba": { lat: -2.8333, lng: 33.2500 },
  "Misungwi": { lat: -2.8333, lng: 33.0833 },
  "Ukerewe": { lat: -1.9833, lng: 32.9833 },
  "Ilemela": { lat: -2.5333, lng: 32.9167 },
  "Nyamagana": { lat: -2.5167, lng: 32.9000 },
  "Buhongwa": { lat: -2.4500, lng: 33.0500 },
  "Lamadi": { lat: -2.5500, lng: 33.1000 },

  // ========== KAGERA REGION ==========
  "Muleba": { lat: -1.8333, lng: 31.6500 },
  "Karagwe": { lat: -1.5833, lng: 31.1333 },
  "Ngara": { lat: -2.5167, lng: 30.6500 },
  "Biharamulo": { lat: -2.6333, lng: 31.3000 },
  "Kyerwa": { lat: -1.2500, lng: 31.2500 },
  "Missenyi": { lat: -1.2500, lng: 31.5833 },
  "Nshamba": { lat: -1.4167, lng: 31.7500 },
  "Kamachumu": { lat: -1.3833, lng: 31.6667 },
  "Kyaka": { lat: -1.5000, lng: 31.4167 },

  // ========== MARA REGION ==========
  "Tarime": { lat: -1.3500, lng: 34.3667 },
  "Bunda": { lat: -2.0500, lng: 33.8667 },
  "Serengeti": { lat: -2.3333, lng: 34.8333 },
  "Rorya": { lat: -1.4167, lng: 34.0833 },
  "Butiama": { lat: -1.7500, lng: 33.9667 },
  "Mugumu": { lat: -2.0000, lng: 34.7333 },

  // ========== SIMIYU REGION ==========
  "Bariadi": { lat: -2.8000, lng: 33.9833 },
  "Maswa": { lat: -2.9167, lng: 33.5833 },
  "Meatu": { lat: -3.5000, lng: 34.2500 },
  "Itilima": { lat: -3.5833, lng: 34.6667 },
  "Busega": { lat: -3.7500, lng: 33.8333 },

  // ========== SHINYANGA REGION ==========
  "Kahama": { lat: -3.8333, lng: 32.6000 },
  "Kishapu": { lat: -3.6167, lng: 33.5833 },
  "Ushetu": { lat: -3.3833, lng: 33.5167 },
  "Msalala": { lat: -3.5833, lng: 33.0833 },

  // ========== TABORA REGION ==========
  "Nzega": { lat: -4.2167, lng: 33.1833 },
  "Igunga": { lat: -4.2833, lng: 33.8833 },
  "Urambo": { lat: -5.0667, lng: 32.0500 },
  "Sikonge": { lat: -5.6333, lng: 32.7667 },
  "Kaliua": { lat: -5.5833, lng: 31.7500 },
  "Uyui": { lat: -5.0833, lng: 32.9167 },

  // ========== KIGOMA REGION ==========
  "Kasulu": { lat: -4.5667, lng: 30.1000 },
  "Kibondo": { lat: -3.5833, lng: 30.5833 },
  "Uvinza": { lat: -5.1000, lng: 30.3833 },
  "Kakonko": { lat: -3.2833, lng: 30.9500 },
  "Buhigwe": { lat: -4.0833, lng: 30.0833 },
  "Ujiji": { lat: -4.9167, lng: 29.6833 },

  // ========== KATAVI REGION ==========
  "Mpanda": { lat: -6.3500, lng: 31.0667 },
  "Mlele": { lat: -6.5833, lng: 31.4667 },
  "Tanganyika": { lat: -6.8333, lng: 30.5000 },

  // ========== RUKWA REGION ==========
  "Sumbawanga": { lat: -7.9667, lng: 31.6167 },
  "Nkasi": { lat: -7.5833, lng: 31.2500 },
  "Kalambo": { lat: -8.5833, lng: 31.2000 },

  // ========== MBEYA REGION ==========
  "Chunya": { lat: -8.5333, lng: 33.4167 },
  "Mbarali": { lat: -8.5833, lng: 33.9167 },
  "Kyela": { lat: -9.5833, lng: 33.8500 },
  "Rungwe": { lat: -9.1333, lng: 33.6667 },
  "Busokelo": { lat: -8.9167, lng: 33.5833 },
  "Tukuyu": { lat: -9.2500, lng: 33.6500 },
  "Itigi": { lat: -5.7000, lng: 34.4833 },
  "Makambako": { lat: -8.8436, lng: 34.8258 },
  "Chimala": { lat: -8.7167, lng: 33.8333 },
  "Igawa": { lat: -8.7833, lng: 33.7500 },
  "Uyole": { lat: -8.9167, lng: 33.5167 },

  // ========== SONGWE REGION ==========
  "Mbozi": { lat: -9.1333, lng: 32.9833 },
  "Tunduma": { lat: -9.3000, lng: 32.7667 },
  "Vwawa": { lat: -9.1167, lng: 32.9667 },
  "Momba": { lat: -9.2833, lng: 33.2167 },
  "Ileje": { lat: -9.5500, lng: 33.1667 },

  // ========== IRINGA REGION ==========
  "Njombe": { lat: -9.3333, lng: 34.7667 },
  "Ludewa": { lat: -10.1500, lng: 34.7833 },
  "Makete": { lat: -9.0833, lng: 34.5833 },
  "Mufindi": { lat: -8.5833, lng: 35.2500 },
  "Kilolo": { lat: -7.9167, lng: 35.9167 },
  "Dabaga": { lat: -7.8333, lng: 35.9833 },
  "Izazi": { lat: -7.7833, lng: 35.8500 },
  "Mafinga": { lat: -9.1667, lng: 35.0667 },
  "Wanging'ombe": { lat: -9.5833, lng: 34.9167 },

  // ========== DODOMA REGION ==========
  "Kondoa": { lat: -4.9000, lng: 35.7833 },
  "Kongwa": { lat: -6.2000, lng: 36.4167 },
  "Mpwapwa": { lat: -6.3500, lng: 36.4833 },
  "Bahi": { lat: -5.9667, lng: 35.3167 },
  "Chemba": { lat: -6.0333, lng: 35.0833 },
  "Chamwino": { lat: -6.3333, lng: 35.9167 },
  "Itigi": { lat: -5.7000, lng: 34.4833 },

  // ========== SINGIDA REGION ==========
  "Manyoni": { lat: -5.7500, lng: 34.8333 },
  "Ikungi": { lat: -5.2500, lng: 34.7500 },
  "Iramba": { lat: -4.7500, lng: 34.5833 },
  "Mkalama": { lat: -4.3333, lng: 34.8333 },

  // ========== LINDI REGION ==========
  "Kilwa Masoko": { lat: -8.9333, lng: 39.5167 },
  "Nachingwea": { lat: -10.3833, lng: 38.7667 },
  "Liwale": { lat: -9.9833, lng: 37.8333 },
  "Ruangwa": { lat: -10.2667, lng: 38.9500 },
  "Kilwa Kivinje": { lat: -8.7833, lng: 39.4167 },

  // ========== MTWARA REGION ==========
  "Masasi": { lat: -10.7167, lng: 38.8000 },
  "Newala": { lat: -10.9500, lng: 39.2833 },
  "Tandahimba": { lat: -10.7833, lng: 39.4667 },
  "Nanyumbu": { lat: -10.5833, lng: 39.5833 },
  "Mtwara Mikindani": { lat: -10.2667, lng: 40.1833 },

  // ========== RUVUMA REGION ==========
  "Mbinga": { lat: -10.9333, lng: 34.9833 },
  "Tunduru": { lat: -11.1000, lng: 37.3500 },
  "Namtumbo": { lat: -10.4667, lng: 36.1333 },
  "Nyasa": { lat: -11.4167, lng: 35.2500 },
  "Songea Rural": { lat: -10.7500, lng: 35.5833 },

  // ========== ZANZIBAR ==========
  "Stone Town": { lat: -6.1639, lng: 39.1920 },
  "Nungwi": { lat: -5.7333, lng: 39.2833 },
  "Kendwa": { lat: -5.7500, lng: 39.2667 },
  "Paje": { lat: -6.2833, lng: 39.5500 },
  "Jambiani": { lat: -6.3000, lng: 39.5667 },
  "Matemwe": { lat: -5.8833, lng: 39.3667 },
  "Kiwengwa": { lat: -5.9667, lng: 39.3500 },
  "Uroa": { lat: -6.0667, lng: 39.4167 },
  "Chwaka": { lat: -6.1333, lng: 39.4333 },
  "Bwejuu": { lat: -6.2667, lng: 39.5500 },
  "Makunduchi": { lat: -6.3667, lng: 39.5000 },
  "Fumba": { lat: -6.2667, lng: 39.1667 },
  "Pemba Island": { lat: -5.2000, lng: 39.7500 },
  "Wete": { lat: -5.0667, lng: 39.7333 },
  "Chake Chake": { lat: -5.2500, lng: 39.7667 },
  "Mkoani": { lat: -5.3667, lng: 39.7333 },

  // ========== INTERNATIONAL BORDERS ==========
  "Nairobi (Kenya)": { lat: -1.2921, lng: 36.8219 },
  "Mombasa (Kenya)": { lat: -4.0435, lng: 39.6682 },
  "Kampala (Uganda)": { lat: 0.3476, lng: 32.5825 },
  "Kigali (Rwanda)": { lat: -1.9441, lng: 30.0619 },
  "Bujumbura (Burundi)": { lat: -3.3731, lng: 29.3644 },
  "Lubumbashi (DRC)": { lat: -11.6600, lng: 27.4794 },
  "Lusaka (Zambia)": { lat: -15.3875, lng: 28.3228 },
  "Lilongwe (Malawi)": { lat: -13.9626, lng: 33.7741 },
  "Mutukula (Uganda Border)": { lat: -1.0000, lng: 31.4167 },
  "Sirari (Kenya Border)": { lat: -1.2500, lng: 34.4833 },
  "Horohoro (Rwanda Border)": { lat: -2.4833, lng: 30.5833 },
  "Kasumulu (Malawi Border)": { lat: -9.6667, lng: 33.8833 },
  "Nakonde (Zambia Border)": { lat: -9.3333, lng: 32.7500 },
};
