import { SeedProduct } from './types';

const JERSEY_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const KID_SIZES = ['6 ans', '8 ans', '10 ans', '12 ans', '14 ans'];
const ONE_SIZE = ['Unique'];

const photo = (id: string) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`;

const SHIRT = photo('1183266');
const KIT = photo('274422');
const ACCESSORY = photo('1618200');

export const seedProducts: SeedProduct[] = [
  {
    name: 'Maillot Domicile 2026-2027',
    price: 25000,
    category: 'Maillots',
    type: 'Domicile',
    description:
      "Maillot officiel domicile de la saison 2026-2027, floque du logo du club. Maille respirante adaptee a la chaleur de Dakar, coupe standard.",
    sizes: JERSEY_SIZES,
    image: SHIRT,
    inStock: true,
  },
  {
    name: 'Maillot Extérieur 2026-2027',
    price: 25000,
    category: 'Maillots',
    type: 'Extérieur',
    description:
      "Maillot officiel exterieur de la saison 2026-2027. Meme maille que le domicile, coloris clair pour les deplacements.",
    sizes: JERSEY_SIZES,
    image: SHIRT,
    inStock: true,
  },
  {
    name: 'Maillot Third 2026-2027',
    price: 27000,
    category: 'Maillots',
    type: 'Third',
    description:
      "Troisieme jeu de la saison, produit en serie limitee. Col rond et motif rappelant les couleurs du quartier de Cambérène.",
    sizes: JERSEY_SIZES,
    image: SHIRT,
    inStock: true,
  },
  {
    name: 'Maillot Gardien 2026-2027',
    price: 25000,
    category: 'Maillots',
    type: 'Autre',
    description:
      "Maillot de gardien manches longues, renforts aux coudes. Le meme que celui porte en championnat.",
    sizes: JERSEY_SIZES,
    image: SHIRT,
    inStock: true,
  },
  {
    name: 'Maillot Domicile enfant',
    price: 18000,
    category: 'Maillots',
    type: 'Domicile',
    description:
      "Version enfant du maillot domicile, du 6 au 14 ans. Coupe large et maille legere pour jouer dedans, pas seulement le porter.",
    sizes: KID_SIZES,
    image: SHIRT,
    inStock: true,
  },
  {
    name: 'Maillot Domicile 2025-2026 (saison passée)',
    price: 15000,
    category: 'Maillots',
    type: 'Domicile',
    description:
      "Le maillot de la saison de la montee en Ligue 1, propose au prix de destockage. Stocks limites aux tailles restantes.",
    sizes: ['M', 'L', 'XL'],
    image: SHIRT,
    inStock: false,
  },
  {
    name: "Survêtement d'entraînement",
    price: 45000,
    category: 'Accessoires',
    type: 'Autre',
    description:
      "Veste et pantalon d'entrainement, identiques a ceux du groupe professionnel. Poches zippees, bas de jambe ajustable.",
    sizes: JERSEY_SIZES,
    image: KIT,
    inStock: true,
  },
  {
    name: 'Polo officiel du club',
    price: 18000,
    category: 'Accessoires',
    type: 'Autre',
    description: "Polo pique brode du logo, a porter en dehors du stade. Coton peigne.",
    sizes: JERSEY_SIZES,
    image: KIT,
    inStock: true,
  },
  {
    name: 'Écharpe officielle',
    price: 6000,
    category: 'Accessoires',
    type: 'Autre',
    description:
      "Echarpe tissee double face, aux couleurs du club. Celle que les tribunes levent avant le coup d'envoi.",
    sizes: ONE_SIZE,
    image: ACCESSORY,
    inStock: true,
  },
  {
    name: 'Casquette brodée',
    price: 9000,
    category: 'Accessoires',
    type: 'Autre',
    description: 'Casquette ajustable, logo brode sur le devant. Coton, visiere preformee.',
    sizes: ONE_SIZE,
    image: ACCESSORY,
    inStock: true,
  },
  {
    name: 'Ballon officiel taille 5',
    price: 20000,
    category: 'Accessoires',
    type: 'Autre',
    description:
      "Ballon de match taille 5, cousu machine. Celui utilise aux seances d'entrainement de l'equipe premiere.",
    sizes: ['Taille 5'],
    image: KIT,
    inStock: true,
  },
  {
    name: 'Ballon enfant taille 3',
    price: 12000,
    category: 'Accessoires',
    type: 'Autre',
    description: "Ballon leger taille 3, pour les categories U11 et en dessous.",
    sizes: ['Taille 3'],
    image: KIT,
    inStock: true,
  },
  {
    name: 'Sac de sport',
    price: 22000,
    category: 'Accessoires',
    type: 'Autre',
    description:
      "Sac de sport a compartiment chaussures separe. Bandouliere reglable, tissu enduit resistant a la poussiere.",
    sizes: ONE_SIZE,
    image: KIT,
    inStock: true,
  },
  {
    name: 'Gourde isotherme',
    price: 5000,
    category: 'Accessoires',
    type: 'Autre',
    description: 'Gourde 750 ml en inox, garde frais plusieurs heures. Logo grave.',
    sizes: ONE_SIZE,
    image: ACCESSORY,
    inStock: true,
  },
  {
    name: 'Drapeau de supporter',
    price: 7500,
    category: 'Accessoires',
    type: 'Autre',
    description: 'Drapeau 90 x 150 cm avec hampe, pour les tribunes et les deplacements.',
    sizes: ONE_SIZE,
    image: ACCESSORY,
    inStock: true,
  },
  {
    name: 'Mug du club',
    price: 4500,
    category: 'Accessoires',
    type: 'Autre',
    description: "Mug ceramique 33 cl, logo sur les deux faces. Passe au lave-vaisselle.",
    sizes: ONE_SIZE,
    image: ACCESSORY,
    inStock: true,
  },
  {
    name: 'Porte-clés métal',
    price: 2500,
    category: 'Accessoires',
    type: 'Autre',
    description: 'Porte-cles en metal emaille, logo du club. Le cadeau qui tient dans une poche.',
    sizes: ONE_SIZE,
    image: ACCESSORY,
    inStock: true,
  },
  {
    name: 'Maillot Third 2026-2027 — édition signée',
    price: 60000,
    category: 'Maillots',
    type: 'Third',
    description:
      "Maillot third signe par le groupe professionnel, tirage numerote. Vente au profit du centre de formation.",
    sizes: ['L', 'XL'],
    image: SHIRT,
    inStock: true,
    isVisible: false,
  },
];
