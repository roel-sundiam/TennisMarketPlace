// Comprehensive Philippines location data
// Includes major cities, municipalities, and their corresponding regions

export const philippinesLocations = [
  // NCR (National Capital Region)
  { city: 'Manila', region: 'NCR', province: 'Metro Manila' },
  { city: 'Quezon City', region: 'NCR', province: 'Metro Manila' },
  { city: 'Caloocan', region: 'NCR', province: 'Metro Manila' },
  { city: 'Las Piñas', region: 'NCR', province: 'Metro Manila' },
  { city: 'Makati', region: 'NCR', province: 'Metro Manila' },
  { city: 'Malabon', region: 'NCR', province: 'Metro Manila' },
  { city: 'Mandaluyong', region: 'NCR', province: 'Metro Manila' },
  { city: 'Marikina', region: 'NCR', province: 'Metro Manila' },
  { city: 'Muntinlupa', region: 'NCR', province: 'Metro Manila' },
  { city: 'Navotas', region: 'NCR', province: 'Metro Manila' },
  { city: 'Parañaque', region: 'NCR', province: 'Metro Manila' },
  { city: 'Pasay', region: 'NCR', province: 'Metro Manila' },
  { city: 'Pasig', region: 'NCR', province: 'Metro Manila' },
  { city: 'Pateros', region: 'NCR', province: 'Metro Manila' },
  { city: 'San Juan', region: 'NCR', province: 'Metro Manila' },
  { city: 'Taguig', region: 'NCR', province: 'Metro Manila' },
  { city: 'Valenzuela', region: 'NCR', province: 'Metro Manila' },

  // Region I (Ilocos Region)
  { city: 'Dagupan', region: 'Region I', province: 'Pangasinan' },
  { city: 'Laoag', region: 'Region I', province: 'Ilocos Norte' },
  { city: 'San Carlos', region: 'Region I', province: 'Pangasinan' },
  { city: 'Urdaneta', region: 'Region I', province: 'Pangasinan' },
  { city: 'Alaminos', region: 'Region I', province: 'Pangasinan' },
  { city: 'Vigan', region: 'Region I', province: 'Ilocos Sur' },
  { city: 'Candon', region: 'Region I', province: 'Ilocos Sur' },

  // Region II (Cagayan Valley)
  { city: 'Tuguegarao', region: 'Region II', province: 'Cagayan' },
  { city: 'Ilagan', region: 'Region II', province: 'Isabela' },
  { city: 'Cauayan', region: 'Region II', province: 'Isabela' },
  { city: 'Santiago', region: 'Region II', province: 'Isabela' },

  // Region III (Central Luzon)
  { city: 'Angeles', region: 'Region III', province: 'Pampanga' },
  { city: 'Antipolo', region: 'Region III', province: 'Rizal' },
  { city: 'Balanga', region: 'Region III', province: 'Bataan' },
  { city: 'Baliuag', region: 'Region III', province: 'Bulacan' },
  { city: 'Cabanatuan', region: 'Region III', province: 'Nueva Ecija' },
  { city: 'Malolos', region: 'Region III', province: 'Bulacan' },
  { city: 'Meycauayan', region: 'Region III', province: 'Bulacan' },
  { city: 'Muñoz', region: 'Region III', province: 'Nueva Ecija' },
  { city: 'Olongapo', region: 'Region III', province: 'Zambales' },
  { city: 'Palayan', region: 'Region III', province: 'Nueva Ecija' },
  { city: 'San Fernando', region: 'Region III', province: 'Pampanga' },
  { city: 'San Jose del Monte', region: 'Region III', province: 'Bulacan' },
  { city: 'Tarlac', region: 'Region III', province: 'Tarlac' },

  // CALABARZON (Region IV-A)
  { city: 'Antipolo', region: 'CALABARZON', province: 'Rizal' },
  { city: 'Bacoor', region: 'CALABARZON', province: 'Cavite' },
  { city: 'Batangas', region: 'CALABARZON', province: 'Batangas' },
  { city: 'Biñan', region: 'CALABARZON', province: 'Laguna' },
  { city: 'Cabuyao', region: 'CALABARZON', province: 'Laguna' },
  { city: 'Calamba', region: 'CALABARZON', province: 'Laguna' },
  { city: 'Cavite City', region: 'CALABARZON', province: 'Cavite' },
  { city: 'Dasmariñas', region: 'CALABARZON', province: 'Cavite' },
  { city: 'General Santos', region: 'CALABARZON', province: 'Cavite' },
  { city: 'General Trias', region: 'CALABARZON', province: 'Cavite' },
  { city: 'Imus', region: 'CALABARZON', province: 'Cavite' },
  { city: 'Lipa', region: 'CALABARZON', province: 'Batangas' },
  { city: 'Los Baños', region: 'CALABARZON', province: 'Laguna' },
  { city: 'Lucena', region: 'CALABARZON', province: 'Quezon' },
  { city: 'San Pablo', region: 'CALABARZON', province: 'Laguna' },
  { city: 'San Pedro', region: 'CALABARZON', province: 'Laguna' },
  { city: 'Santa Rosa', region: 'CALABARZON', province: 'Laguna' },
  { city: 'Tagaytay', region: 'CALABARZON', province: 'Cavite' },
  { city: 'Tanauan', region: 'CALABARZON', province: 'Batangas' },
  { city: 'Trece Martires', region: 'CALABARZON', province: 'Cavite' },

  // MIMAROPA (Region IV-B)
  { city: 'Boac', region: 'MIMAROPA', province: 'Marinduque' },
  { city: 'Calapan', region: 'MIMAROPA', province: 'Oriental Mindoro' },
  { city: 'Mamburao', region: 'MIMAROPA', province: 'Occidental Mindoro' },
  { city: 'Puerto Princesa', region: 'MIMAROPA', province: 'Palawan' },
  { city: 'Romblon', region: 'MIMAROPA', province: 'Romblon' },

  // Region V (Bicol Region)
  { city: 'Iriga', region: 'Region V', province: 'Camarines Sur' },
  { city: 'Legazpi', region: 'Region V', province: 'Albay' },
  { city: 'Ligao', region: 'Region V', province: 'Albay' },
  { city: 'Masbate', region: 'Region V', province: 'Masbate' },
  { city: 'Naga', region: 'Region V', province: 'Camarines Sur' },
  { city: 'Sorsogon', region: 'Region V', province: 'Sorsogon' },
  { city: 'Tabaco', region: 'Region V', province: 'Albay' },

  // Region VI (Western Visayas)
  { city: 'Bacolod', region: 'Region VI', province: 'Negros Occidental' },
  { city: 'Bago', region: 'Region VI', province: 'Negros Occidental' },
  { city: 'Cadiz', region: 'Region VI', province: 'Negros Occidental' },
  { city: 'Escalante', region: 'Region VI', province: 'Negros Occidental' },
  { city: 'Himamaylan', region: 'Region VI', province: 'Negros Occidental' },
  { city: 'Iloilo City', region: 'Region VI', province: 'Iloilo' },
  { city: 'Kabankalan', region: 'Region VI', province: 'Negros Occidental' },
  { city: 'La Carlota', region: 'Region VI', province: 'Negros Occidental' },
  { city: 'Passi', region: 'Region VI', province: 'Iloilo' },
  { city: 'Roxas', region: 'Region VI', province: 'Capiz' },
  { city: 'Sagay', region: 'Region VI', province: 'Negros Occidental' },
  { city: 'San Carlos', region: 'Region VI', province: 'Negros Occidental' },
  { city: 'Silay', region: 'Region VI', province: 'Negros Occidental' },
  { city: 'Sipalay', region: 'Region VI', province: 'Negros Occidental' },
  { city: 'Talisay', region: 'Region VI', province: 'Negros Occidental' },
  { city: 'Victorias', region: 'Region VI', province: 'Negros Occidental' },

  // Region VII (Central Visayas)
  { city: 'Bais', region: 'Region VII', province: 'Negros Oriental' },
  { city: 'Bayawan', region: 'Region VII', province: 'Negros Oriental' },
  { city: 'Bogo', region: 'Region VII', province: 'Cebu' },
  { city: 'Canlaon', region: 'Region VII', province: 'Negros Oriental' },
  { city: 'Carcar', region: 'Region VII', province: 'Cebu' },
  { city: 'Cebu City', region: 'Region VII', province: 'Cebu' },
  { city: 'Danao', region: 'Region VII', province: 'Cebu' },
  { city: 'Dumaguete', region: 'Region VII', province: 'Negros Oriental' },
  { city: 'Lapu-Lapu', region: 'Region VII', province: 'Cebu' },
  { city: 'Mandaue', region: 'Region VII', province: 'Cebu' },
  { city: 'Naga', region: 'Region VII', province: 'Cebu' },
  { city: 'San Fernando', region: 'Region VII', province: 'Cebu' },
  { city: 'Talisay', region: 'Region VII', province: 'Cebu' },
  { city: 'Toledo', region: 'Region VII', province: 'Cebu' },

  // Region VIII (Eastern Visayas)
  { city: 'Baybay', region: 'Region VIII', province: 'Leyte' },
  { city: 'Borongan', region: 'Region VIII', province: 'Eastern Samar' },
  { city: 'Calbayog', region: 'Region VIII', province: 'Samar' },
  { city: 'Catbalogan', region: 'Region VIII', province: 'Samar' },
  { city: 'Maasin', region: 'Region VIII', province: 'Southern Leyte' },
  { city: 'Ormoc', region: 'Region VIII', province: 'Leyte' },
  { city: 'Tacloban', region: 'Region VIII', province: 'Leyte' },

  // Region IX (Zamboanga Peninsula)
  { city: 'Dapitan', region: 'Region IX', province: 'Zamboanga del Norte' },
  { city: 'Dipolog', region: 'Region IX', province: 'Zamboanga del Norte' },
  { city: 'Isabela', region: 'Region IX', province: 'Basilan' },
  { city: 'Pagadian', region: 'Region IX', province: 'Zamboanga del Sur' },
  { city: 'Zamboanga City', region: 'Region IX', province: 'Zamboanga del Sur' },

  // Region X (Northern Mindanao)
  { city: 'Butuan', region: 'Region X', province: 'Agusan del Norte' },
  { city: 'Cagayan de Oro', region: 'Region X', province: 'Misamis Oriental' },
  { city: 'El Salvador', region: 'Region X', province: 'Misamis Oriental' },
  { city: 'Gingoog', region: 'Region X', province: 'Misamis Oriental' },
  { city: 'Iligan', region: 'Region X', province: 'Lanao del Norte' },
  { city: 'Malaybalay', region: 'Region X', province: 'Bukidnon' },
  { city: 'Oroquieta', region: 'Region X', province: 'Misamis Occidental' },
  { city: 'Ozamiz', region: 'Region X', province: 'Misamis Occidental' },
  { city: 'Tangub', region: 'Region X', province: 'Misamis Occidental' },
  { city: 'Valencia', region: 'Region X', province: 'Bukidnon' },

  // Region XI (Davao Region)
  { city: 'Davao City', region: 'Region XI', province: 'Davao del Sur' },
  { city: 'Digos', region: 'Region XI', province: 'Davao del Sur' },
  { city: 'Island Garden City of Samal', region: 'Region XI', province: 'Davao del Norte' },
  { city: 'Mati', region: 'Region XI', province: 'Davao Oriental' },
  { city: 'Panabo', region: 'Region XI', province: 'Davao del Norte' },
  { city: 'Tagum', region: 'Region XI', province: 'Davao del Norte' },

  // Region XII (SOCCSKSARGEN)
  { city: 'Cotabato City', region: 'Region XII', province: 'Maguindanao' },
  { city: 'General Santos', region: 'Region XII', province: 'South Cotabato' },
  { city: 'Koronadal', region: 'Region XII', province: 'South Cotabato' },
  { city: 'Kidapawan', region: 'Region XII', province: 'Cotabato' },
  { city: 'Tacurong', region: 'Region XII', province: 'Sultan Kudarat' },

  // ARMM (Autonomous Region in Muslim Mindanao)
  { city: 'Bongao', region: 'ARMM', province: 'Tawi-Tawi' },
  { city: 'Jolo', region: 'ARMM', province: 'Sulu' },
  { city: 'Lamitan', region: 'ARMM', province: 'Basilan' },
  { city: 'Marawi', region: 'ARMM', province: 'Lanao del Sur' },

  // Region XIII (Caraga)
  { city: 'Bayugan', region: 'Region XIII', province: 'Agusan del Sur' },
  { city: 'Bislig', region: 'Region XIII', province: 'Surigao del Sur' },
  { city: 'Butuan', region: 'Region XIII', province: 'Agusan del Norte' },
  { city: 'Cabadbaran', region: 'Region XIII', province: 'Agusan del Norte' },
  { city: 'Surigao City', region: 'Region XIII', province: 'Surigao del Norte' },
  { city: 'Tandag', region: 'Region XIII', province: 'Surigao del Sur' },

  // CAR (Cordillera Administrative Region)
  { city: 'Baguio', region: 'CAR', province: 'Benguet' },
  { city: 'Tabuk', region: 'CAR', province: 'Kalinga' }
];

// Helper function to get all cities
export const getCities = () => {
  return philippinesLocations
    .map(location => location.city)
    .sort((a, b) => a.localeCompare(b));
};

// Helper function to get all unique regions
export const getRegions = () => {
  return [...new Set(philippinesLocations.map(location => location.region))]
    .sort((a, b) => a.localeCompare(b));
};

// Helper function to get region by city
export const getRegionByCity = (cityName) => {
  const location = philippinesLocations.find(
    location => location.city.toLowerCase() === cityName.toLowerCase()
  );
  return location ? location.region : null;
};

// Helper function to get cities by region
export const getCitiesByRegion = (regionName) => {
  return philippinesLocations
    .filter(location => location.region === regionName)
    .map(location => location.city)
    .sort((a, b) => a.localeCompare(b));
};

export default philippinesLocations;