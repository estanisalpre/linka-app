export interface InterestOption {
  value: string;
  label: string;
  icon: string;
}

export interface InterestCategory {
  title: string;
  emoji: string;
  items: InterestOption[];
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    title: "Música",
    emoji: "🎵",
    items: [
      { value: "musica", label: "Música", icon: "musical-notes" },
      { value: "rock", label: "Rock", icon: "radio" },
      { value: "jazz", label: "Jazz", icon: "musical-note" },
      { value: "electronica", label: "Electrónica", icon: "headset" },
      { value: "reggaeton", label: "Reggaetón", icon: "disc" },
      { value: "clasica", label: "Clásica", icon: "piano" },
      { value: "pop", label: "Pop", icon: "star" },
    ],
  },
  {
    title: "Deporte",
    emoji: "🏃",
    items: [
      { value: "futbol", label: "Fútbol", icon: "football" },
      { value: "gym", label: "Gym", icon: "barbell" },
      { value: "running", label: "Running", icon: "walk" },
      { value: "natacion", label: "Natación", icon: "water" },
      { value: "ciclismo", label: "Ciclismo", icon: "bicycle" },
      { value: "yoga", label: "Yoga", icon: "body" },
      { value: "tenis", label: "Tenis", icon: "tennisball" },
      { value: "basketball", label: "Basketball", icon: "basketball" },
    ],
  },
  {
    title: "Entretenimiento",
    emoji: "🎬",
    items: [
      { value: "cine", label: "Cine", icon: "film" },
      { value: "series", label: "Series", icon: "tv" },
      { value: "gaming", label: "Gaming", icon: "game-controller" },
      { value: "anime", label: "Anime", icon: "sparkles" },
      { value: "podcasts", label: "Podcasts", icon: "mic" },
      { value: "teatro", label: "Teatro", icon: "easel" },
      { value: "stand_up", label: "Stand-up", icon: "happy" },
    ],
  },
  {
    title: "Estilo de vida",
    emoji: "🌍",
    items: [
      { value: "viajes", label: "Viajes", icon: "airplane" },
      { value: "gastronomia", label: "Gastronomía", icon: "restaurant" },
      { value: "naturaleza", label: "Naturaleza", icon: "leaf" },
      { value: "fotografia", label: "Fotografía", icon: "camera" },
      { value: "moda", label: "Moda", icon: "shirt" },
      { value: "playa", label: "Playa", icon: "sunny" },
      { value: "montaña", label: "Montaña", icon: "earth" },
    ],
  },
  {
    title: "Mente",
    emoji: "📚",
    items: [
      { value: "libros", label: "Libros", icon: "book" },
      { value: "ciencia", label: "Ciencia", icon: "flask" },
      { value: "filosofia", label: "Filosofía", icon: "school" },
      { value: "idiomas", label: "Idiomas", icon: "language" },
      { value: "escritura", label: "Escritura", icon: "create" },
      { value: "historia", label: "Historia", icon: "library" },
      { value: "psicologia", label: "Psicología", icon: "bulb" },
    ],
  },
  {
    title: "Tecnología",
    emoji: "💻",
    items: [
      { value: "tecnologia", label: "Tecnología", icon: "laptop" },
      { value: "programacion", label: "Programación", icon: "code-slash" },
      { value: "diseno", label: "Diseño", icon: "color-palette" },
      { value: "ia", label: "Inteligencia Artificial", icon: "hardware-chip" },
      { value: "gadgets", label: "Gadgets", icon: "phone-portrait" },
    ],
  },
  {
    title: "Creatividad",
    emoji: "🎨",
    items: [
      { value: "arte", label: "Arte", icon: "brush" },
      { value: "cocina", label: "Cocina", icon: "pizza" },
      { value: "danza", label: "Danza", icon: "musical-notes-outline" },
      { value: "manualidades", label: "Manualidades", icon: "construct" },
      {
        value: "fotografia_art",
        label: "Fotografía artística",
        icon: "aperture",
      },
    ],
  },
  {
    title: "Bienestar",
    emoji: "🌱",
    items: [
      { value: "meditacion", label: "Meditación", icon: "heart" },
      { value: "nutricion", label: "Nutrición", icon: "nutrition" },
      { value: "autodesarrollo", label: "Autodesarrollo", icon: "rocket" },
      { value: "voluntariado", label: "Voluntariado", icon: "people" },
      { value: "mindfulness", label: "Mindfulness", icon: "flower" },
    ],
  },
];

// Flat list of all interests for backward compat
export const ALL_INTERESTS: InterestOption[] = INTEREST_CATEGORIES.flatMap(
  (cat) => cat.items,
);

// Random icon for custom-typed interests
const CUSTOM_ICONS = [
  "heart",
  "star",
  "flash",
  "diamond",
  "planet",
  "leaf",
  "flame",
  "gift",
  "trophy",
  "ribbon",
];
export function randomIcon(): string {
  return CUSTOM_ICONS[Math.floor(Math.random() * CUSTOM_ICONS.length)];
}
