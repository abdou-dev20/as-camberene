import { SeedArticle } from './types';

const image = (id: string) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop`;

const STADIUM = image('274422');
const MATCH = image('1884574');
const TRAINING = image('3621104');
const TROPHY = image('163444');
const CROWD = image('2277981');
const SHIRT = image('1183266');

export const seedArticles: SeedArticle[] = [
  {
    title: 'Champion de Ligue 2 : l’ASC Cambérène retrouve l’élite',
    excerpt:
      "Soixante ans apres sa fondation, le club decroche le titre de Ligue 2 et accede pour la premiere fois a la Ligue 1 professionnelle.",
    content:
      "Le club a valide sa montee en Ligue 1 senegalaise au terme d'une saison ou il n'aura jamais quitte le podium. Le titre de champion de Ligue 2, acquis en juin 2025, couronne un travail de fond entame plusieurs saisons plus tot : structuration du centre de formation, stabilisation de l'encadrement technique, fidelisation d'un noyau de joueurs formes au club.\n\nFonde en 1965 a l'initiative de la communaute layene de Cambérène, le club n'avait jamais atteint l'elite sous l'ere professionnelle. Cette accession change l'echelle de tout : calendrier, exigences d'infrastructure, exposition mediatique.\n\nLa direction a fixe un objectif clair pour la premiere saison parmi l'elite : le maintien, sans renier l'identite de jeu ni la place faite aux joueurs du quartier.",
    category: 'Club',
    author: 'Cellule communication',
    publishedAt: '2025-07-10',
    status: 'published',
    image: TROPHY,
    comments: [
      { author: 'SupporterASC', content: "Soixante ans d'attente, ca valait le coup !", daysAfter: 0 },
      { author: 'Ndeye F.', content: 'Bravo aux joueurs et au staff. On y croit pour le maintien.', daysAfter: 1 },
      { author: 'Alioune', content: 'Rendez-vous au stade pour la premiere en Ligue 1.', daysAfter: 3 },
    ],
  },
  {
    title: 'Première saison en Ligue 1 : le maintien assuré à deux journées de la fin',
    excerpt:
      "Le club boucle son exercice 2025-2026 a la onzieme place, avec quatre points d'avance sur le barragiste.",
    content:
      "Le maintien etait l'objectif annonce en juillet ; il est acquis a deux journees de la fin. Onzieme au classement final, l'equipe aura tenu son rang a domicile — sept victoires sur quinze receptions — et concede l'essentiel de son retard a l'exterieur.\n\nLe bilan comptable cache un enseignement plus important : neuf joueurs issus du centre de formation ont dispute au moins dix rencontres de championnat. C'etait le pari du club en montant, et il est tenu.\n\nL'intersaison servira a renforcer le milieu de terrain et a securiser les cadres, sans bouleverser un groupe qui vient d'apprendre le niveau.",
    category: 'Matchs',
    author: 'Cellule communication',
    publishedAt: '2026-05-24',
    status: 'published',
    image: MATCH,
    comments: [
      { author: 'Mamadou S.', content: 'Objectif rempli. Maintenant on construit.', daysAfter: 1 },
    ],
  },
  {
    title: 'Reprise de l’entraînement : le groupe au complet le 15 juillet',
    excerpt:
      "Le staff a convoque trente-deux joueurs, dont six elements du centre de formation, pour lancer la preparation.",
    content:
      "La reprise s'est faite au terrain de Cambérène, devant plusieurs centaines de supporters venus assister a la premiere seance. Trente-deux joueurs ont repondu present, dont six jeunes issus des U19 associes au groupe pour toute la preparation.\n\nLe programme prevoit trois semaines de travail foncier, quatre matchs amicaux et un stage de cinq jours a Saly. Le staff medical a mis en place un suivi individualise pour les joueurs revenus de blessure la saison passee.\n\nLe premier match officiel de la saison 2026-2027 est prevu mi-septembre.",
    category: 'Équipe',
    author: 'Service technique',
    publishedAt: '2026-07-15',
    status: 'published',
    image: TRAINING,
  },
  {
    title: 'Amical : victoire 2-1 face au Jaraaf en préparation',
    excerpt:
      "Deux buts en seconde periode ont suffi pour renverser une rencontre engagee, disputee devant un public nombreux.",
    content:
      "Menes a la pause apres une frappe lointaine, les Cambérènois ont repris la rencontre en main des le retour des vestiaires. L'egalisation est venue d'un corner, la seconde d'une contre-attaque conclue par un joueur du cru.\n\nLe staff retiendra surtout l'heure de jeu tres aboutie, et le temps de jeu accorde a cinq joueurs de moins de vingt ans. Le prochain amical se jouera a l'exterieur, dans une semaine.",
    category: 'Matchs',
    author: 'Cellule communication',
    publishedAt: '2026-08-02',
    status: 'published',
    image: MATCH,
    comments: [
      { author: 'Ibrahima D.', content: 'La seconde periode etait un vrai plaisir a regarder.', daysAfter: 0 },
      { author: 'Fatou B.', content: 'Content de voir les jeunes autant utilises.', daysAfter: 2 },
    ],
  },
  {
    title: 'Mercato : trois recrues pour renforcer le milieu',
    excerpt:
      "Un meneur de jeu, un recuperateur et un ailier rejoignent le groupe professionnel pour la saison 2026-2027.",
    content:
      "Le club a annonce l'arrivee de trois joueurs, tous engages pour deux saisons. Le premier, meneur de jeu de vingt-cinq ans, arrive libre apres trois saisons en Ligue 1. Le deuxieme, recuperateur, avait ete forme dans un club de la region de Thies. Le troisieme est un ailier gauche revenant d'un pret concluant.\n\nLa direction sportive precise que ces arrivees repondent au constat de la saison passee : un entrejeu trop court dans les fins de match. Deux departs sont encore possibles d'ici la fermeture du marche.",
    category: 'Transferts',
    author: 'Direction sportive',
    publishedAt: '2026-08-08',
    status: 'published',
    image: TRAINING,
  },
  {
    title: 'Prolongation : le capitaine s’engage jusqu’en 2029',
    excerpt:
      "Formé au club, capitaine depuis trois saisons, il prolonge de trois ans et devient le joueur le plus capé de l'ere professionnelle.",
    content:
      "Arrive au club a douze ans, passe par toutes les categories de jeunes, il portera le brassard au moins jusqu'en 2029. La prolongation a ete signee en presence de sa famille et du president.\n\n« Je n'ai jamais envisage de partir au moment ou le club atteint enfin la Ligue 1 », a-t-il declare. Il compte 214 matchs officiels sous ce maillot.",
    category: 'Transferts',
    author: 'Direction sportive',
    publishedAt: '2026-07-28',
    status: 'published',
    image: STADIUM,
    comments: [
      { author: 'Cheikh N.', content: 'Le symbole du club. Merci capitaine.', daysAfter: 0 },
    ],
  },
  {
    title: 'Le centre de formation accueille vingt-deux nouveaux pensionnaires',
    excerpt:
      "Les detections organisees en juin dans quatre quartiers de Dakar ont abouti a vingt-deux integrations en U15 et U17.",
    content:
      "Plus de six cents jeunes se sont presentes aux journees de detection organisees en juin. Vingt-deux ont ete retenus et rejoignent les categories U15 et U17 pour la saison.\n\nChaque integration s'accompagne d'un suivi scolaire : le club conditionne la poursuite en categorie superieure a l'assiduite en classe. Trois educateurs supplementaires ont ete recrutes pour encadrer les nouveaux effectifs.",
    category: 'Équipe',
    author: 'Centre de formation',
    publishedAt: '2026-07-05',
    status: 'published',
    image: TRAINING,
  },
  {
    title: 'Abonnements 2026-2027 : ouverture de la campagne',
    excerpt:
      "Trois formules sont proposees, de 15 000 a 100 000 FCFA pour la saison complete, avec un tarif preferentiel jusqu'au 31 aout.",
    content:
      "La campagne d'abonnement pour la saison 2026-2027 est ouverte. Trois formules sont proposees : Supporter a 15 000 FCFA, Premium a 35 000 FCFA et Elite VIP a 100 000 FCFA, chacune donnant acces a toutes les rencontres a domicile.\n\nLes abonnes beneficient d'une reduction sur la boutique, d'un acces prioritaire a la billetterie des matchs a l'exterieur, et d'une place reservee jusqu'a un quart d'heure avant le coup d'envoi.\n\nLes abonnes de la saison passee conservent leur place s'ils renouvellent avant la fin du mois d'aout.",
    category: 'Club',
    author: 'Service billetterie',
    publishedAt: '2026-06-20',
    status: 'published',
    image: CROWD,
  },
  {
    title: 'Le nouveau maillot 2026-2027 dévoilé',
    excerpt:
      "Presente lors d'une soiree au centre culturel de Cambérène, le maillot domicile est disponible en boutique a 25 000 FCFA.",
    content:
      "Le maillot domicile de la saison 2026-2027 a ete presente devant les supporters et les partenaires du club. La coupe reste classique ; le motif du col reprend un dessin propose par un supporter lors du concours organise au printemps.\n\nLe maillot est en vente en boutique et sur ce site au prix de 25 000 FCFA, du S au XXL, ainsi qu'en version enfant a 18 000 FCFA. Les jeux exterieur et third seront devoiles avant la reprise du championnat.",
    category: 'Club',
    author: 'Cellule communication',
    publishedAt: '2026-07-20',
    status: 'published',
    image: SHIRT,
    comments: [
      { author: 'Awa T.', content: 'Le col est magnifique. Deja commande.', daysAfter: 1 },
      { author: 'Moussa K.', content: 'Bonne idee, le concours avec les supporters.', daysAfter: 2 },
    ],
  },
  {
    title: 'Journée portes ouvertes au terrain de Cambérène',
    excerpt:
      "Le club a ouvert ses installations aux familles du quartier : ateliers, rencontres avec les joueurs et visite des vestiaires.",
    content:
      "Une journee portes ouvertes s'est tenue au terrain du club. Ateliers de jonglage pour les plus jeunes, tournoi a cinq entre quartiers, visite des vestiaires et seance de dedicaces avec le groupe professionnel.\n\nLe club a profite de la journee pour presenter son projet de renovation des vestiaires et de la tribune, dont les travaux doivent commencer a l'intersaison prochaine.",
    category: 'Club',
    author: 'Cellule communication',
    publishedAt: '2026-06-08',
    status: 'published',
    image: CROWD,
  },
  {
    title: 'Rénovation de la tribune : le calendrier des travaux',
    excerpt: "Brouillon — a completer avec le montant definitif et le nom de l'entreprise retenue.",
    content:
      "Article en preparation. Points a couvrir : calendrier des travaux, capacite apres renovation, financement, consequences sur l'accueil du public pendant la saison.",
    category: 'Club',
    author: 'Cellule communication',
    publishedAt: '2026-08-25',
    status: 'draft',
    image: STADIUM,
  },
  {
    title: 'Portrait : le parcours de notre gardien numéro un',
    excerpt: 'Brouillon — entretien realise, reste a relire avant publication.',
    content:
      "Article en preparation. Entretien realise le 20 aout, a relire et a completer avec les statistiques de la saison passee.",
    category: 'Équipe',
    author: 'Cellule communication',
    publishedAt: '2026-08-28',
    status: 'draft',
    image: TRAINING,
  },
];
