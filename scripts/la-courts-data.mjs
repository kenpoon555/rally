/**
 * Single source of truth for LA-metro court seeds (closed beta, all 10 launch sports).
 *
 * Consumed by:
 *   - scripts/seed-la-courts.mjs        (service-role insert)
 *   - scripts/gen-la-courts-sql.mjs     (emits supabase/scripts/seed_la_courts.sql)
 *
 * Coordinates are [lng, lat] — PostGIS POINT order.
 * `google_place_id` uses a stable `seed-la-*` slug so seeding is idempotent and
 * never calls Google Places (these are static rows, $0 to seed).
 *
 * Coverage spans 7 LA regions so Create Game shows real courts metro-wide:
 *   Westside · South Bay · SGV · SFV · DTLA/Central · Eastside · Long Beach/SE
 */

/** @typedef {{ name: string, sport_type: string, google_place_id: string, region: string, coordinates: [number, number] }} Court */

/** @type {Court[]} */
export const courts = [
  // ── Basketball ──────────────────────────────────────────────────────────
  { name: 'Monrovia Recreation Park Basketball Courts', sport_type: 'Basketball', google_place_id: 'seed-monrovia-rec-park-basketball', region: 'SGV', coordinates: [-118.0019, 34.1442] },
  { name: 'Julian Fisher Park Basketball Courts', sport_type: 'Basketball', google_place_id: 'seed-julian-fisher-park-basketball', region: 'SGV', coordinates: [-117.9954, 34.1418] },
  { name: 'Venice Beach Basketball Courts', sport_type: 'Basketball', google_place_id: 'seed-la-venice-beach-basketball', region: 'Westside', coordinates: [-118.469, 33.985] },
  { name: 'Pan Pacific Park Basketball Courts', sport_type: 'Basketball', google_place_id: 'seed-la-pan-pacific-basketball', region: 'Central', coordinates: [-118.359, 34.073] },
  { name: 'Van Nuys Sherman Oaks Recreation Center Basketball', sport_type: 'Basketball', google_place_id: 'seed-la-van-nuys-basketball', region: 'SFV', coordinates: [-118.451, 34.151] },
  { name: 'Westwood Recreation Center Basketball', sport_type: 'Basketball', google_place_id: 'seed-la-westwood-rec-basketball', region: 'Westside', coordinates: [-118.445, 34.052] },
  { name: 'Stoner Recreation Center Basketball', sport_type: 'Basketball', google_place_id: 'seed-la-stoner-rec-basketball', region: 'Westside', coordinates: [-118.452, 34.030] },
  { name: 'Poinsettia Recreation Center Basketball', sport_type: 'Basketball', google_place_id: 'seed-la-poinsettia-basketball', region: 'Central', coordinates: [-118.345, 34.085] },
  { name: 'Gilbert Lindsay Recreation Center Basketball', sport_type: 'Basketball', google_place_id: 'seed-la-gilbert-lindsay-basketball', region: 'Central', coordinates: [-118.273, 34.005] },
  { name: 'Lincoln Park Recreation Center Basketball', sport_type: 'Basketball', google_place_id: 'seed-la-lincoln-park-basketball', region: 'Eastside', coordinates: [-118.207, 34.072] },
  { name: 'Hazard Park Basketball Courts', sport_type: 'Basketball', google_place_id: 'seed-la-hazard-park-basketball', region: 'Eastside', coordinates: [-118.205, 34.048] },
  { name: 'Garvey Ranch Park Basketball (Monterey Park)', sport_type: 'Basketball', google_place_id: 'seed-la-garvey-ranch-basketball', region: 'SGV', coordinates: [-118.122, 34.060] },
  { name: 'Balboa Sports Complex Basketball (Encino)', sport_type: 'Basketball', google_place_id: 'seed-la-balboa-sports-basketball', region: 'SFV', coordinates: [-118.502, 34.184] },
  { name: 'Live Oak Park Basketball (Manhattan Beach)', sport_type: 'Basketball', google_place_id: 'seed-la-live-oak-basketball', region: 'South Bay', coordinates: [-118.404, 33.892] },
  { name: 'Houghton Park Basketball (Long Beach)', sport_type: 'Basketball', google_place_id: 'seed-la-houghton-park-basketball', region: 'Long Beach', coordinates: [-118.189, 33.866] },
  { name: 'Furman Park Basketball (Downey)', sport_type: 'Basketball', google_place_id: 'seed-la-furman-park-basketball', region: 'Long Beach', coordinates: [-118.135, 33.945] },

  // ── Pickleball ──────────────────────────────────────────────────────────
  { name: 'Griffith Park Pickleball Courts', sport_type: 'Pickleball', google_place_id: 'seed-la-griffith-park-pickleball', region: 'Central', coordinates: [-118.296, 34.132] },
  { name: 'Santa Monica Memorial Park Pickleball', sport_type: 'Pickleball', google_place_id: 'seed-la-santa-monica-memorial-pickleball', region: 'Westside', coordinates: [-118.491, 34.024] },
  { name: 'Culver City Syd Kronenthal Park Pickleball', sport_type: 'Pickleball', google_place_id: 'seed-la-culver-syd-kronenthal-pickleball', region: 'Westside', coordinates: [-118.395, 34.008] },
  { name: 'Mar Vista Recreation Center Pickleball', sport_type: 'Pickleball', google_place_id: 'seed-la-mar-vista-rec-pickleball', region: 'Westside', coordinates: [-118.432, 34.005] },
  { name: 'Cheviot Hills Recreation Center Pickleball', sport_type: 'Pickleball', google_place_id: 'seed-la-cheviot-hills-pickleball', region: 'Westside', coordinates: [-118.405, 34.038] },
  { name: 'Glendale Pacific Park Pickleball', sport_type: 'Pickleball', google_place_id: 'seed-la-glendale-pacific-pickleball', region: 'SFV', coordinates: [-118.255, 34.146] },
  { name: 'Pasadena Victory Park Pickleball', sport_type: 'Pickleball', google_place_id: 'seed-la-pasadena-victory-pickleball', region: 'SGV', coordinates: [-118.108, 34.165] },
  { name: 'Arcadia County Park Pickleball', sport_type: 'Pickleball', google_place_id: 'seed-la-arcadia-county-pickleball', region: 'SGV', coordinates: [-118.027, 34.118] },
  { name: 'Ralph Foy Park Pickleball (Burbank)', sport_type: 'Pickleball', google_place_id: 'seed-la-ralph-foy-pickleball', region: 'SFV', coordinates: [-118.317, 34.181] },
  { name: 'El Segundo Recreation Park Pickleball', sport_type: 'Pickleball', google_place_id: 'seed-la-el-segundo-pickleball', region: 'South Bay', coordinates: [-118.416, 33.918] },
  { name: 'Wilson Park Pickleball (Torrance)', sport_type: 'Pickleball', google_place_id: 'seed-la-wilson-park-pickleball', region: 'South Bay', coordinates: [-118.336, 33.836] },
  { name: 'El Dorado Park Pickleball (Long Beach)', sport_type: 'Pickleball', google_place_id: 'seed-la-el-dorado-pickleball', region: 'Long Beach', coordinates: [-118.084, 33.806] },
  { name: 'Apollo Park Pickleball (Downey)', sport_type: 'Pickleball', google_place_id: 'seed-la-apollo-park-pickleball', region: 'Long Beach', coordinates: [-118.118, 33.927] },
  { name: 'Eagle Rock Recreation Center Pickleball', sport_type: 'Pickleball', google_place_id: 'seed-la-eagle-rock-pickleball', region: 'Eastside', coordinates: [-118.211, 34.146] },

  // ── Badminton ───────────────────────────────────────────────────────────
  { name: 'Elite Badminton Center (City of Industry)', sport_type: 'Badminton', google_place_id: 'seed-elite-badminton-city-industry', region: 'SGV', coordinates: [-117.9178, 34.0195] },
  { name: 'San Gabriel Valley Badminton Club (El Monte)', sport_type: 'Badminton', google_place_id: 'seed-sgv-badminton-el-monte', region: 'SGV', coordinates: [-118.027, 34.0686] },
  { name: 'Los Angeles Badminton Club (El Monte)', sport_type: 'Badminton', google_place_id: 'seed-la-badminton-el-monte', region: 'SGV', coordinates: [-118.032, 34.0755] },
  { name: 'Pasadena Badminton Club', sport_type: 'Badminton', google_place_id: 'seed-la-pasadena-badminton', region: 'SGV', coordinates: [-118.085, 34.146] },
  { name: 'Bintang Badminton (Monterey Park)', sport_type: 'Badminton', google_place_id: 'seed-la-bintang-badminton', region: 'SGV', coordinates: [-118.118, 34.045] },
  { name: 'South Bay Badminton (Torrance)', sport_type: 'Badminton', google_place_id: 'seed-la-south-bay-badminton', region: 'South Bay', coordinates: [-118.330, 33.852] },
  { name: 'Stardust Badminton (City of Industry)', sport_type: 'Badminton', google_place_id: 'seed-la-stardust-badminton', region: 'SGV', coordinates: [-117.905, 34.018] },
  { name: 'Synergy Badminton Academy (Hacienda Heights)', sport_type: 'Badminton', google_place_id: 'seed-la-synergy-badminton', region: 'SGV', coordinates: [-117.969, 33.993] },

  // ── Tennis ──────────────────────────────────────────────────────────────
  { name: 'Griffith Park Tennis Courts', sport_type: 'Tennis', google_place_id: 'seed-la-griffith-park-tennis', region: 'Central', coordinates: [-118.303, 34.128] },
  { name: 'Echo Park Recreation Center Tennis', sport_type: 'Tennis', google_place_id: 'seed-la-echo-park-tennis', region: 'Eastside', coordinates: [-118.26, 34.073] },
  { name: 'Exposition Park Tennis Courts', sport_type: 'Tennis', google_place_id: 'seed-la-exposition-park-tennis', region: 'Central', coordinates: [-118.287, 34.014] },
  { name: 'Westwood Recreation Center Tennis', sport_type: 'Tennis', google_place_id: 'seed-la-westwood-rec-tennis', region: 'Westside', coordinates: [-118.446, 34.053] },
  { name: 'Cheviot Hills Tennis Courts', sport_type: 'Tennis', google_place_id: 'seed-la-cheviot-hills-tennis', region: 'Westside', coordinates: [-118.404, 34.037] },
  { name: 'Reed Park Tennis (Santa Monica)', sport_type: 'Tennis', google_place_id: 'seed-la-reed-park-tennis', region: 'Westside', coordinates: [-118.494, 34.023] },
  { name: 'Balboa Park Tennis (Encino)', sport_type: 'Tennis', google_place_id: 'seed-la-balboa-park-tennis', region: 'SFV', coordinates: [-118.500, 34.178] },
  { name: 'Brookside Tennis (Pasadena)', sport_type: 'Tennis', google_place_id: 'seed-la-brookside-tennis', region: 'SGV', coordinates: [-118.168, 34.162] },
  { name: 'Arcadia County Park Tennis', sport_type: 'Tennis', google_place_id: 'seed-la-arcadia-county-tennis', region: 'SGV', coordinates: [-118.027, 34.118] },
  { name: 'Billie Jean King Tennis Center (Long Beach)', sport_type: 'Tennis', google_place_id: 'seed-la-bjk-tennis-long-beach', region: 'Long Beach', coordinates: [-118.115, 33.815] },
  { name: 'Wilson Park Tennis (Torrance)', sport_type: 'Tennis', google_place_id: 'seed-la-wilson-park-tennis', region: 'South Bay', coordinates: [-118.336, 33.836] },
  { name: 'Glendale Pacific Park Tennis', sport_type: 'Tennis', google_place_id: 'seed-la-glendale-pacific-tennis', region: 'SFV', coordinates: [-118.255, 34.146] },
  { name: 'El Dorado Park Tennis (Long Beach)', sport_type: 'Tennis', google_place_id: 'seed-la-el-dorado-tennis', region: 'Long Beach', coordinates: [-118.084, 33.806] },
  { name: 'Lincoln Park Tennis Courts', sport_type: 'Tennis', google_place_id: 'seed-la-lincoln-park-tennis', region: 'Eastside', coordinates: [-118.207, 34.072] },

  // ── Volleyball ──────────────────────────────────────────────────────────
  { name: 'Santa Monica Beach Volleyball Courts', sport_type: 'Volleyball', google_place_id: 'seed-la-santa-monica-beach-volleyball', region: 'Westside', coordinates: [-118.499, 34.008] },
  { name: 'Manhattan Beach Sand Dune Park Volleyball', sport_type: 'Volleyball', google_place_id: 'seed-la-manhattan-beach-volleyball', region: 'South Bay', coordinates: [-118.414, 33.884] },
  { name: 'Hermosa Beach Pier Volleyball Courts', sport_type: 'Volleyball', google_place_id: 'seed-la-hermosa-beach-volleyball', region: 'South Bay', coordinates: [-118.399, 33.862] },
  { name: 'Will Rogers State Beach Volleyball', sport_type: 'Volleyball', google_place_id: 'seed-la-will-rogers-volleyball', region: 'Westside', coordinates: [-118.524, 34.030] },
  { name: 'Venice Beach Volleyball Courts', sport_type: 'Volleyball', google_place_id: 'seed-la-venice-beach-volleyball', region: 'Westside', coordinates: [-118.474, 33.986] },
  { name: 'Marine Park Volleyball (Santa Monica)', sport_type: 'Volleyball', google_place_id: 'seed-la-marine-park-volleyball', region: 'Westside', coordinates: [-118.471, 34.010] },
  { name: 'Dockweiler Beach Volleyball (Playa del Rey)', sport_type: 'Volleyball', google_place_id: 'seed-la-dockweiler-volleyball', region: 'Westside', coordinates: [-118.437, 33.921] },
  { name: 'Redondo Beach Volleyball Courts', sport_type: 'Volleyball', google_place_id: 'seed-la-redondo-beach-volleyball', region: 'South Bay', coordinates: [-118.392, 33.842] },
  { name: 'Westwood Recreation Center Volleyball', sport_type: 'Volleyball', google_place_id: 'seed-la-westwood-rec-volleyball', region: 'Westside', coordinates: [-118.445, 34.052] },
  { name: 'Granada Beach Volleyball (Long Beach)', sport_type: 'Volleyball', google_place_id: 'seed-la-granada-beach-volleyball', region: 'Long Beach', coordinates: [-118.143, 33.760] },

  // ── Soccer ──────────────────────────────────────────────────────────────
  { name: 'Griffith Park Soccer Fields', sport_type: 'Soccer', google_place_id: 'seed-la-griffith-park-soccer', region: 'Central', coordinates: [-118.318, 34.125] },
  { name: 'LA Soccer Park (Downey)', sport_type: 'Soccer', google_place_id: 'seed-la-soccer-park-downey', region: 'Long Beach', coordinates: [-118.141, 33.942] },
  { name: 'Mar Vista Recreation Center Soccer Field', sport_type: 'Soccer', google_place_id: 'seed-la-mar-vista-soccer', region: 'Westside', coordinates: [-118.432, 34.005] },
  { name: 'Balboa Sports Complex Soccer (Encino)', sport_type: 'Soccer', google_place_id: 'seed-la-balboa-sports-soccer', region: 'SFV', coordinates: [-118.502, 34.184] },
  { name: 'Exposition Park Soccer Fields', sport_type: 'Soccer', google_place_id: 'seed-la-exposition-park-soccer', region: 'Central', coordinates: [-118.288, 34.016] },
  { name: 'Cheviot Hills Soccer Fields', sport_type: 'Soccer', google_place_id: 'seed-la-cheviot-hills-soccer', region: 'Westside', coordinates: [-118.405, 34.038] },
  { name: 'Pan Pacific Park Soccer Field', sport_type: 'Soccer', google_place_id: 'seed-la-pan-pacific-soccer', region: 'Central', coordinates: [-118.359, 34.073] },
  { name: 'Brookside Soccer (Pasadena)', sport_type: 'Soccer', google_place_id: 'seed-la-brookside-soccer', region: 'SGV', coordinates: [-118.168, 34.162] },
  { name: 'El Dorado Park Soccer (Long Beach)', sport_type: 'Soccer', google_place_id: 'seed-la-el-dorado-soccer', region: 'Long Beach', coordinates: [-118.084, 33.806] },
  { name: 'Columbia Park Soccer (Torrance)', sport_type: 'Soccer', google_place_id: 'seed-la-columbia-park-soccer', region: 'South Bay', coordinates: [-118.354, 33.866] },
  { name: 'Lincoln Park Soccer Field', sport_type: 'Soccer', google_place_id: 'seed-la-lincoln-park-soccer', region: 'Eastside', coordinates: [-118.207, 34.072] },
  { name: 'Verdugo Park Soccer (Glendale)', sport_type: 'Soccer', google_place_id: 'seed-la-verdugo-park-soccer', region: 'SFV', coordinates: [-118.232, 34.165] },

  // ── Squash ──────────────────────────────────────────────────────────────
  { name: 'Los Angeles Athletic Club Squash Courts', sport_type: 'Squash', google_place_id: 'seed-la-athletic-club-squash', region: 'Central', coordinates: [-118.252, 34.047] },
  { name: 'UCLA John Wooden Center Squash', sport_type: 'Squash', google_place_id: 'seed-la-ucla-wooden-squash', region: 'Westside', coordinates: [-118.445, 34.071] },
  { name: 'USC Lyon Center Squash', sport_type: 'Squash', google_place_id: 'seed-la-usc-lyon-squash', region: 'Central', coordinates: [-118.288, 34.024] },
  { name: 'Equinox Sports Club LA Squash (West LA)', sport_type: 'Squash', google_place_id: 'seed-la-equinox-westla-squash', region: 'Westside', coordinates: [-118.444, 34.047] },
  { name: 'Caltech Braun Athletic Center Squash (Pasadena)', sport_type: 'Squash', google_place_id: 'seed-la-caltech-braun-squash', region: 'SGV', coordinates: [-118.125, 34.137] },

  // ── Racquetball ─────────────────────────────────────────────────────────
  { name: '24 Hour Fitness Hollywood Racquetball', sport_type: 'Racquetball', google_place_id: 'seed-la-hollywood-racquetball', region: 'Central', coordinates: [-118.326, 34.098] },
  { name: 'YMCA West Los Angeles Racquetball', sport_type: 'Racquetball', google_place_id: 'seed-la-ymca-wla-racquetball', region: 'Westside', coordinates: [-118.448, 34.042] },
  { name: 'Spectrum Club El Segundo Racquetball', sport_type: 'Racquetball', google_place_id: 'seed-la-spectrum-el-segundo-racquetball', region: 'South Bay', coordinates: [-118.389, 33.917] },
  { name: 'LA Fitness Long Beach Racquetball', sport_type: 'Racquetball', google_place_id: 'seed-la-lafitness-long-beach-racquetball', region: 'Long Beach', coordinates: [-118.158, 33.808] },
  { name: 'Pasadena YMCA Racquetball', sport_type: 'Racquetball', google_place_id: 'seed-la-pasadena-ymca-racquetball', region: 'SGV', coordinates: [-118.146, 34.156] },
  { name: 'Glendale YMCA Racquetball', sport_type: 'Racquetball', google_place_id: 'seed-la-glendale-ymca-racquetball', region: 'SFV', coordinates: [-118.255, 34.146] },

  // ── Table Tennis ────────────────────────────────────────────────────────
  { name: 'Spin Los Angeles Table Tennis', sport_type: 'Table Tennis', google_place_id: 'seed-la-spin-dtla-table-tennis', region: 'Central', coordinates: [-118.256, 34.04] },
  { name: 'LA Table Tennis Club (El Monte)', sport_type: 'Table Tennis', google_place_id: 'seed-la-table-tennis-el-monte', region: 'SGV', coordinates: [-118.032, 34.0755] },
  { name: 'Westside Table Tennis (Culver City)', sport_type: 'Table Tennis', google_place_id: 'seed-la-westside-table-tennis', region: 'Westside', coordinates: [-118.396, 34.025] },
  { name: 'South Bay Table Tennis Club (Gardena)', sport_type: 'Table Tennis', google_place_id: 'seed-la-south-bay-table-tennis', region: 'South Bay', coordinates: [-118.309, 33.888] },
  { name: 'Pasadena Table Tennis Club', sport_type: 'Table Tennis', google_place_id: 'seed-la-pasadena-table-tennis', region: 'SGV', coordinates: [-118.131, 34.158] },
  { name: 'ICC Table Tennis (San Gabriel)', sport_type: 'Table Tennis', google_place_id: 'seed-la-icc-table-tennis', region: 'SGV', coordinates: [-118.106, 34.096] },

  // ── Ultimate Frisbee ────────────────────────────────────────────────────
  { name: 'Mar Vista Recreation Center Ultimate Field', sport_type: 'Ultimate Frisbee', google_place_id: 'seed-la-mar-vista-ultimate', region: 'Westside', coordinates: [-118.432, 34.005] },
  { name: 'Culver City Blair Hills Park Ultimate Field', sport_type: 'Ultimate Frisbee', google_place_id: 'seed-la-blair-hills-ultimate', region: 'Westside', coordinates: [-118.405, 34.005] },
  { name: 'Rancho Park Ultimate Field (West LA)', sport_type: 'Ultimate Frisbee', google_place_id: 'seed-la-rancho-park-ultimate', region: 'Westside', coordinates: [-118.424, 34.042] },
  { name: 'Griffith Park Ultimate Field', sport_type: 'Ultimate Frisbee', google_place_id: 'seed-la-griffith-park-ultimate', region: 'Central', coordinates: [-118.295, 34.135] },
  { name: 'Balboa Park Ultimate Field (Encino)', sport_type: 'Ultimate Frisbee', google_place_id: 'seed-la-balboa-park-ultimate', region: 'SFV', coordinates: [-118.500, 34.178] },
  { name: 'Recreation Park Ultimate Field (Long Beach)', sport_type: 'Ultimate Frisbee', google_place_id: 'seed-la-recreation-park-ultimate', region: 'Long Beach', coordinates: [-118.155, 33.792] },
];

/** Sorted unique sport list (for logging / validation). */
export const sports = [...new Set(courts.map((c) => c.sport_type))].sort();

/** Sorted unique region list. */
export const regions = [...new Set(courts.map((c) => c.region))].sort();
