import { SeedGalleryItem } from './types';

const image = (id: string) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop`;

const day = (offset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const seedGalleryItems: SeedGalleryItem[] = [
  {
    image: image('1884574'),
    title: "L'ouverture du score",
    description: 'La frappe qui lance la rencontre, devant un stade plein.',
    category: 'match',
    date: day(-21),
  },
  {
    image: image('274422'),
    title: 'Tour d’honneur',
    description: 'Les joueurs saluent le virage après la victoire.',
    category: 'match',
    date: day(-14),
  },
  {
    image: image('3621104'),
    title: 'Reprise collective',
    description: 'Premier entraînement de la semaine au centre de formation.',
    category: 'entrainement',
    date: day(-5),
  },
  {
    image: image('863988'),
    title: 'Travail devant le but',
    description: 'Séance de finition pour les attaquants.',
    category: 'entrainement',
    date: day(-3),
  },
  {
    image: image('2277981'),
    title: 'Les supporters au stade',
    description: 'Le virage de Cambérène un soir de match.',
    category: 'club',
    date: day(-14),
  },
  {
    image: image('163444'),
    title: 'Le trophée au club',
    description: 'La coupe exposée au siège, après le titre.',
    category: 'club',
    date: day(-60),
  },
];
