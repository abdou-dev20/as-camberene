import Joi from 'joi';
import { ARTICLE_CATEGORIES } from '../models/Article.model';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '../models/Product.model';
import { LEGEND_ERAS } from '../models/Legend.model';
import { MATCH_STATUSES, MATCH_VENUES, SCORER_SIDES } from '../models/Match.model';
import { TEAM_CATEGORIES } from '../models/Team.model';
import { GALLERY_CATEGORIES } from '../models/GalleryItem.model';
import { ALBUM_CATEGORIES } from '../models/Album.model';
import {
  PLAYER_KINDS,
  PLAYER_LINES,
  PLAYER_STATUSES,
  STRONG_FEET,
} from '../models/Player.model';

const asPatch = (schema: Joi.ObjectSchema): Joi.ObjectSchema =>
  schema
    .fork(Object.keys(schema.describe().keys), (field) => field.optional())
    .min(1)
    .prefs({ noDefaults: true });

export const articleSchema = Joi.object({
  title: Joi.string().trim().max(250).required(),
  content: Joi.string().allow('').max(50000).default(''),
  excerpt: Joi.string().allow('').max(1000).default(''),
  image: Joi.string().allow('').max(500).default(''),
  imagePosition: Joi.string().pattern(/^\d{1,3}% \d{1,3}%$/).default('50% 50%'),
  category: Joi.string().valid(...ARTICLE_CATEGORIES).default('Club'),
  publishedAt: Joi.date().default(() => new Date()),
  author: Joi.string().trim().max(120).default('ASC Cambérène'),
  status: Joi.string().valid('draft', 'published').default('draft'),
});

export const productSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(...PRODUCT_CATEGORIES).default('Accessoires'),
  type: Joi.string().valid(...PRODUCT_TYPES).default('Autre'),
  image: Joi.string().allow('').max(500).default(''),
  images: Joi.array().items(Joi.string().max(500)).default([]),
  description: Joi.string().allow('').max(5000).default(''),
  sizes: Joi.array().items(Joi.string().max(20)).default([]),
  inStock: Joi.boolean().default(true),
  isVisible: Joi.boolean().default(true),
});

export const legendSchema = Joi.object({
  name: Joi.string().trim().max(150).required(),
  position: Joi.string().allow('').max(100).default(''),
  period: Joi.string().allow('').max(50).default(''),
  nationality: Joi.string().allow('').max(100).default(''),
  photo: Joi.string().allow('').max(500).default(''),
  achievements: Joi.array().items(Joi.string().max(300)).default([]),
  stats: Joi.object({
    matches: Joi.number().min(0).default(0),
    goals: Joi.number().min(0).default(0),
    assists: Joi.number().min(0).default(0),
    trophies: Joi.number().min(0).default(0),
  }).default({ matches: 0, goals: 0, assists: 0, trophies: 0 }),
  biography: Joi.string().allow('').max(10000).default(''),
  quote: Joi.string().allow('').max(500).default(''),
  jerseyNumber: Joi.number().min(0).max(99).default(0),
  era: Joi.string().valid(...LEGEND_ERAS).default('Modern Era'),
  isHallOfFame: Joi.boolean().default(false),
  rank: Joi.number().default(0),
});

export const historyEventSchema = Joi.object({
  year: Joi.number().integer().min(1800).max(new Date().getFullYear() + 5).required(),
  dateLabel: Joi.string().allow('').max(60),
  title: Joi.string().trim().max(250).required(),
  description: Joi.string().allow('').max(5000).default(''),
  tags: Joi.array().items(Joi.string().max(60)).default([]),
  image: Joi.string().allow('').max(500),
  phase: Joi.string().allow('').max(80),
});

export const heroSlideSchema = Joi.object({
  image: Joi.string().allow('').max(500).default(''),
  youtube: Joi.string().allow('').max(500).default(''),
  kicker: Joi.string().trim().max(80).required(),
  title: Joi.string().trim().max(250).required(),
  link: Joi.string().allow('').max(500).default('/news'),
  linkLabel: Joi.string().allow('').max(80).default('En savoir plus'),
  rank: Joi.number().default(0),
  isVisible: Joi.boolean().default(true),
});

export const matchSchema = Joi.object({
  opponent: Joi.string().trim().max(150).required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'La date doit être au format AAAA-MM-JJ',
  }),
  time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).default('16:00').messages({
    'string.pattern.base': "L'heure doit être au format HH:MM",
  }),
  venue: Joi.string().valid(...MATCH_VENUES).default('Domicile'),
  competition: Joi.string().allow('').max(120).default('Ligue 1 Sénégal'),
  result: Joi.object({
    home: Joi.number().integer().min(0).max(99).required(),
    away: Joi.number().integer().min(0).max(99).required(),
  })
    .allow(null)
    .default(null),
  status: Joi.string().valid(...MATCH_STATUSES).default('À venir'),
  scorers: Joi.array()
    .items(
      Joi.object({
        player: Joi.string().hex().length(24).allow(null).empty('').default(null),
        name: Joi.string().trim().max(150).required(),
        minute: Joi.number().integer().min(0).max(130).default(0),
        side: Joi.string().valid(...SCORER_SIDES).default('club'),
        assistName: Joi.string().trim().allow('').max(150).default(''),
        assistPlayer: Joi.string().hex().length(24).allow(null).empty('').default(null),
      })
    )
    .max(30)
    .default([]),
  image: Joi.string().allow('').max(500).default(''),
});

export const teamSchema = Joi.object({
  slug: Joi.string()
    .trim()
    .lowercase()
    .max(80)
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .required()
    .messages({
      'string.pattern.base': 'Identifiant invalide : minuscules, chiffres et tirets uniquement',
    }),
  name: Joi.string().trim().max(120).required(),
  category: Joi.string().valid(...TEAM_CATEGORIES).default('youth'),
  ageRange: Joi.string().allow('').max(40).default(''),
  subtitle: Joi.string().allow('').max(120).default(''),
  description: Joi.string().allow('').max(2000).default(''),
  coach: Joi.string().allow('').max(120).default(''),
  training: Joi.string().allow('').max(200).default(''),
  stadium: Joi.string().allow('').max(200).default(''),
  achievements: Joi.array().items(Joi.string().max(120)).default([]),
  stats: Joi.object({
    wins: Joi.number().integer().min(0).default(0),
    draws: Joi.number().integer().min(0).default(0),
    losses: Joi.number().integer().min(0).default(0),
  }).default({ wins: 0, draws: 0, losses: 0 }),
  established: Joi.string().allow('').max(20).default(''),
  image: Joi.string().allow('').max(500).default(''),
  rank: Joi.number().default(0),
  isVisible: Joi.boolean().default(true),
});

export const galleryItemSchema = Joi.object({
  image: Joi.string().max(500).required(),
  title: Joi.string().trim().max(200).required(),
  description: Joi.string().allow('').max(2000).default(''),
  category: Joi.string().valid(...GALLERY_CATEGORIES).default('club'),
  match: Joi.string().hex().length(24).allow(null, '').default(null),
  album: Joi.string().hex().length(24).allow(null, '').default(null),
  date: Joi.string().allow('').pattern(/^(\d{4}-\d{2}-\d{2})?$/).default('').messages({
    'string.pattern.base': 'La date doit être au format AAAA-MM-JJ',
  }),
  rank: Joi.number().default(0),
  isVisible: Joi.boolean().default(true),
});

export const albumSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  description: Joi.string().allow('').max(2000).default(''),
  cover: Joi.string().allow('').max(500).default(''),
  category: Joi.string().valid(...ALBUM_CATEGORIES).default('club'),
  match: Joi.string().hex().length(24).allow(null, '').default(null),
  date: Joi.string().allow('').pattern(/^(\d{4}-\d{2}-\d{2})?$/).default('').messages({
    'string.pattern.base': 'La date doit être au format AAAA-MM-JJ',
  }),
  rank: Joi.number().default(0),
  isVisible: Joi.boolean().default(true),
});

export const playerSchema = Joi.object({
  kind: Joi.string().valid(...PLAYER_KINDS).default('player'),
  name: Joi.string().trim().max(150).required(),
  team: Joi.string()
    .trim()
    .max(80)
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .required()
    .messages({ 'string.pattern.base': 'Identifiant d’équipe invalide' }),
  number: Joi.number().integer().min(0).max(99).default(0),
  line: Joi.string().valid(...PLAYER_LINES).default('Milieu'),
  position: Joi.string().allow('').max(100).default(''),
  role: Joi.string().allow('').max(100).default(''),
  photo: Joi.string().allow('').max(500).default(''),
  status: Joi.string().valid(...PLAYER_STATUSES).default('actif'),
  birthDate: Joi.date().allow(null).default(null),
  nationality: Joi.string().allow('').max(100).default(''),
  height: Joi.number().min(0).max(260).default(0),
  weight: Joi.number().min(0).max(200).default(0),
  strongFoot: Joi.string().valid(...STRONG_FEET, '').default(''),
  stats: Joi.object({
    matches: Joi.number().min(0).default(0),
    goals: Joi.number().min(0).default(0),
    assists: Joi.number().min(0).default(0),
    yellowCards: Joi.number().min(0).default(0),
    redCards: Joi.number().min(0).default(0),
  }).default({ matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }),
  biography: Joi.string().allow('').max(10000).default(''),
  joinedYear: Joi.number().integer().min(0).max(new Date().getFullYear() + 1).default(0),
  rank: Joi.number().default(0),
  isVisible: Joi.boolean().default(true),
  isFeatured: Joi.boolean().default(false),
});

export const commentSchema = Joi.object({
  author: Joi.string().trim().min(2).max(80).required(),
  content: Joi.string().trim().min(2).max(2000).required(),
});

export const articlePatchSchema = asPatch(articleSchema);
export const productPatchSchema = asPatch(productSchema);
export const legendPatchSchema = asPatch(legendSchema);
export const historyEventPatchSchema = asPatch(historyEventSchema);
export const playerPatchSchema = asPatch(playerSchema);
export const heroSlidePatchSchema = asPatch(heroSlideSchema);
export const matchPatchSchema = asPatch(matchSchema);
export const galleryItemPatchSchema = asPatch(galleryItemSchema);
export const albumPatchSchema = asPatch(albumSchema);

export const teamPatchSchema = asPatch(teamSchema).fork(['slug'], (f) => f.forbidden());
