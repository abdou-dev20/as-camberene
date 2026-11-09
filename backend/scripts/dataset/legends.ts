import { SeedLegend } from './types';

const portrait = (id: string) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=1000&fit=crop`;

const P1 = portrait('1222271');
const P2 = portrait('220453');
const P3 = portrait('91227');
const P4 = portrait('1516680');

export const seedLegends: SeedLegend[] = [
  {
    name: 'Ousseynou Thiaw',
    position: 'Milieu défensif',
    period: '1968-1979',
    nationality: 'Sénégal',
    photo: P1,
    achievements: [
      'Capitaine pendant huit saisons',
      'Premier joueur du club à dépasser 300 matchs',
      'Vainqueur du tournoi régional 1974',
      'Entraîneur des jeunes après sa carrière',
    ],
    stats: { matches: 312, goals: 21, assists: 48, trophies: 3 },
    biography:
      "Figure des premieres annees du club, il en fut le capitaine pendant huit saisons. Reconnu pour son placement et sa lecture du jeu plus que pour ses statistiques, il a forme apres sa carriere plusieurs generations de joueurs du quartier.",
    quote: "On ne joue pas pour un maillot, on joue pour ceux qui l'ont porte avant.",
    jerseyNumber: 4,
    era: 'Classic Era',
    isHallOfFame: true,
    rank: 1,
  },
  {
    name: 'Abdou Karim Sène',
    position: 'Attaquant',
    period: '1981-1990',
    nationality: 'Sénégal',
    photo: P2,
    achievements: [
      'Meilleur buteur du club sur une saison (28 buts)',
      'Trois fois meilleur buteur régional',
      'Premier joueur du club appelé en sélection',
    ],
    stats: { matches: 246, goals: 158, assists: 37, trophies: 2 },
    biography:
      "Buteur de la decennie 1980, il detient toujours le record de buts sur une saison. Son jeu de tete et sa presence dans la surface ont marque une generation de supporters.",
    quote: "Un attaquant se juge sur les matchs difficiles, pas sur les larges victoires.",
    jerseyNumber: 9,
    era: 'Classic Era',
    isHallOfFame: true,
    rank: 2,
  },
  {
    name: 'Malick Ndoye',
    position: 'Gardien',
    period: '1992-2004',
    nationality: 'Sénégal',
    photo: P3,
    achievements: [
      'Douze saisons consécutives comme titulaire',
      'Record de clean sheets du club',
      'Capitaine de 1998 à 2004',
    ],
    stats: { matches: 341, goals: 0, assists: 2, trophies: 4 },
    biography:
      "Douze saisons dans les buts, dont six avec le brassard. Sa longevite reste inegalee au club, et son record de matchs sans encaisser tient toujours.",
    quote: "Le gardien parle peu pendant la semaine et beaucoup le dimanche.",
    jerseyNumber: 1,
    era: 'Golden Age',
    isHallOfFame: true,
    rank: 3,
  },
  {
    name: 'Ibrahima Faye',
    position: 'Milieu offensif',
    period: '1996-2005',
    nationality: 'Sénégal',
    photo: P4,
    achievements: [
      'Meilleur passeur du club toutes époques confondues',
      'Deux titres régionaux',
      'Auteur du but décisif de la finale 2001',
    ],
    stats: { matches: 268, goals: 64, assists: 121, trophies: 3 },
    biography:
      "Meneur de jeu de la periode faste du club, il en reste le meilleur passeur. Son but en finale 2001 figure encore sur les affiches du club-house.",
    quote: 'La derniere passe vaut mieux que le dernier geste.',
    jerseyNumber: 10,
    era: 'Golden Age',
    isHallOfFame: true,
    rank: 4,
  },
  {
    name: 'Cheikh Diagne',
    position: 'Défenseur central',
    period: '2002-2012',
    nationality: 'Sénégal',
    photo: P1,
    achievements: [
      'Dix saisons au club',
      'Capitaine de 2008 à 2012',
      'Formé au centre de formation du club',
    ],
    stats: { matches: 289, goals: 18, assists: 11, trophies: 2 },
    biography:
      "Premier produit du centre de formation a franchir la barre des 250 matchs. Sa carriere entiere s'est deroulee au club, ce qui reste rare.",
    quote: "Partir aurait ete plus simple. Rester avait plus de sens.",
    jerseyNumber: 5,
    era: 'Modern Era',
    isHallOfFame: true,
    rank: 5,
  },
  {
    name: 'Lamine Bâ',
    position: 'Ailier droit',
    period: '2006-2013',
    nationality: 'Sénégal',
    photo: P2,
    achievements: [
      'Meilleur passeur du club sur trois saisons',
      'Premier transfert international de l’histoire du club',
    ],
    stats: { matches: 187, goals: 52, assists: 76, trophies: 1 },
    biography:
      "Ailier rapide et provocateur, il fut le premier joueur du club transfere a l'etranger. Son depart a finance la premiere renovation du terrain d'entrainement.",
    quote: "J'ai emporte le quartier avec moi, partout ou j'ai joue.",
    jerseyNumber: 7,
    era: 'Modern Era',
    isHallOfFame: false,
    rank: 6,
  },
  {
    name: 'Serigne Mbaye',
    position: 'Latéral gauche',
    period: '2010-2018',
    nationality: 'Sénégal',
    photo: P3,
    achievements: [
      'Huit saisons au club',
      'Meilleur centreur du championnat régional 2014',
      'Éducateur au centre de formation depuis 2019',
    ],
    stats: { matches: 221, goals: 12, assists: 58, trophies: 1 },
    biography:
      "Lateral infatigable, il a joue huit saisons avant de rejoindre l'encadrement des jeunes, ou il entraine aujourd'hui les U17.",
    quote: 'Un couloir se tient sur quatre-vingt-dix minutes, pas sur dix.',
    jerseyNumber: 3,
    era: 'Modern Era',
    isHallOfFame: false,
    rank: 7,
  },
  {
    name: 'Papa Amadou Gueye',
    position: 'Attaquant',
    period: '2015-2022',
    nationality: 'Sénégal',
    photo: P4,
    achievements: [
      'Meilleur buteur de la montée en Ligue 2',
      'Capitaine lors de la saison 2021-2022',
      'Formé au club',
    ],
    stats: { matches: 176, goals: 89, assists: 29, trophies: 2 },
    biography:
      "Buteur de l'accession en Ligue 2, forme au club et capitaine de sa derniere saison. Il a pris sa retraite sportive au club, apres y avoir tout joue.",
    quote: 'Marquer chez soi, devant les siens : rien ne remplace ca.',
    jerseyNumber: 11,
    era: 'Modern Era',
    isHallOfFame: true,
    rank: 8,
  },
];
