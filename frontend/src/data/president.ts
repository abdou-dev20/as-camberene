export interface PresidentAxis {
  id: string;
  title: string;
  description: string;
}

export const president = {
  name: 'Cheikhou THIOME',
  role: "Président de l'A.S.C Cambérène",
  photo: '/assets/img/president-cheikhou-thiome.jpg',
  electedOn: '30 août 2026',
  pullQuote: "Ce n'est pas l'histoire d'un seul homme, c'est notre histoire.",
  salutation: 'Chères Cambérènoises, chers Cambérènois,',
  addressees:
    "Chers membres, joueurs, encadreurs, supporters et partenaires de l'ASC Cambérène,",
  paragraphs: [
    "C'est avec beaucoup d'humilité et un profond sentiment de responsabilité que je m'adresse à vous aujourd'hui. Le 30 août 2026, vous m'avez accordé votre confiance pour présider aux destinées de notre club, et je mesure pleinement ce que cette confiance représente. Elle n'appartient pas à un homme seul : elle appartient à cette communauté tout entière, à celles et ceux qui, depuis 1965, portent le maillot vert et jaune de l'ASC Cambérène avec fierté. Ce n'est pas l'histoire d'un seul homme, c'est notre histoire.",
    "Notre club est bien plus qu'une équipe qui évolue en Ligue 1 aujourd'hui. Il est un patrimoine collectif, un lieu de rassemblement pour le village de Cambérène, et un espace où plusieurs générations se sont retrouvées autour des mêmes valeurs de travail, de solidarité et d'appartenance. C'est cet héritage que nous avons le devoir de préserver, et c'est sur cette base que nous allons construire l'avenir.",
    "Le mandat qui s'ouvre repose sur une vision claire, celle que j'ai eu l'honneur de partager avec vous tout au long de la campagne. Elle s'articule autour de cinq axes qui guideront notre action au quotidien. D'abord, une gouvernance rénovée, plus transparente et plus rigoureuse dans la gestion de notre club, pour que chaque Cambérènois puisse avoir confiance dans la façon dont l'ASC Cambérène est administrée. Ensuite, l'excellence sportive, avec un travail de fond sur la formation, l'encadrement et la compétitivité de nos équipes, pour que le club retrouve durablement la place qu'il mérite. Nous voulons également consolider nos ressources et nos partenariats, en nous appuyant sur les autorités locales, les opérateurs économiques et toutes les bonnes volontés qui souhaitent accompagner notre projet. La communication du club sera aussi renforcée, pour que chaque membre et chaque supporter se sente informé et associé à la vie de l'ASC Cambérène, où qu'il se trouve. Enfin, nous porterons une attention particulière au développement du multisports, pour que le club s'ouvre à d'autres disciplines et touche un public plus large, notamment nos jeunes.",
    "Rien de tout cela ne se fera seul, et rien de tout cela ne se fera dans la précipitation. Je crois profondément à un leadership de service, à l'écoute, au dialogue et au rassemblement plutôt qu'à la confrontation. Mon rôle, et celui de toute l'équipe dirigeante qui m'accompagne, sera de fédérer les énergies de Cambérène autour d'un projet commun, dans le respect de chacun et dans la continuité de ce que nos aînés ont bâti depuis près de soixante ans.",
    "Je tiens à remercier chaleureusement toutes celles et ceux qui ont cru en ce projet, qui l'ont porté à mes côtés, et qui continueront à le faire dans les mois et les années à venir. Je remercie également les autorités municipales de Cambérène pour leur disponibilité et leur soutien constant à notre club.",
    "À vous tous, membres, joueurs, familles, supporters et partenaires, je dis simplement ceci : la porte de l'ASC Cambérène vous est grande ouverte. Ensemble, continuons à écrire cette histoire qui est la nôtre.",
  ],
  closing: 'Avec tout mon engagement,',
};

export const presidentAxes: PresidentAxis[] = [
  {
    id: 'gouvernance',
    title: 'Gouvernance rénovée',
    description:
      "Une gestion plus transparente et plus rigoureuse, pour que chaque Cambérènois puisse avoir confiance dans la façon dont le club est administré.",
  },
  {
    id: 'sportif',
    title: 'Excellence sportive',
    description:
      "Un travail de fond sur la formation, l'encadrement et la compétitivité des équipes, pour retrouver durablement la place que le club mérite.",
  },
  {
    id: 'ressources',
    title: 'Ressources & partenariats',
    description:
      "Des ressources consolidées avec les autorités locales, les opérateurs économiques et toutes les bonnes volontés qui souhaitent accompagner le projet.",
  },
  {
    id: 'communication',
    title: 'Communication renforcée',
    description:
      "Chaque membre et chaque supporter informé et associé à la vie de l'ASC Cambérène, où qu'il se trouve.",
  },
  {
    id: 'multisports',
    title: 'Développement du multisports',
    description:
      "Un club ouvert à d'autres disciplines, pour toucher un public plus large et, en premier lieu, nos jeunes.",
  },
];
