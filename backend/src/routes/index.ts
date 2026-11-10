import { Router } from 'express';
import Article from '../models/Article.model';
import Product from '../models/Product.model';
import Legend from '../models/Legend.model';
import HistoryEvent from '../models/HistoryEvent.model';
import Player from '../models/Player.model';
import HeroSlide from '../models/HeroSlide.model';
import Match from '../models/Match.model';
import Team from '../models/Team.model';
import GalleryItem from '../models/GalleryItem.model';
import { buildResourceRouter } from '../lib/resource';
import { syncMatchStats } from '../lib/matchStats';
import {
  articlePatchSchema,
  articleSchema,
  galleryItemPatchSchema,
  galleryItemSchema,
  heroSlidePatchSchema,
  heroSlideSchema,
  historyEventPatchSchema,
  historyEventSchema,
  matchPatchSchema,
  matchSchema,
  legendPatchSchema,
  legendSchema,
  playerPatchSchema,
  playerSchema,
  teamPatchSchema,
  teamSchema,
  productPatchSchema,
  productSchema,
} from '../validators/content';
import authRoutes from './auth.routes';
import userRoutes from './users.routes';
import orderRoutes from './orders.routes';
import commentRoutes from './comments.routes';
import uploadRoutes from './uploads.routes';
import ticketRoutes from './tickets.routes';
import shareRoutes from './share.routes';
import settingsRoutes from './settings.routes';
import playerOfMonthRoutes from './playerOfMonth.routes';
import donationRoutes from './donations.routes';
import albumRoutes from './albums.routes';

const router = Router();

router.use('/auth', authRoutes);

router.use('/users', userRoutes);

router.use(
  '/articles',
  buildResourceRouter({
    model: Article,
    permission: 'articles:write',
    createSchema: articleSchema,
    updateSchema: articlePatchSchema,
    defaultSort: '-publishedAt',
    publicFilter: { status: 'published' },
    searchable: ['title', 'excerpt', 'content'],
    filters: ['category', 'status'],
  })
);

router.use('/articles/:articleId/comments', commentRoutes);

router.use(
  '/products',
  buildResourceRouter({
    model: Product,
    permission: 'products:write',
    createSchema: productSchema,
    updateSchema: productPatchSchema,
    defaultSort: '-created_at',
    publicFilter: { isVisible: true },
    searchable: ['name', 'description'],
    filters: ['category', 'type'],
  })
);

router.use(
  '/legends',
  buildResourceRouter({
    model: Legend,
    permission: 'legends:write',
    createSchema: legendSchema,
    updateSchema: legendPatchSchema,
    defaultSort: 'rank name',
    searchable: ['name', 'position', 'biography'],
    filters: ['era'],
  })
);

router.use(
  '/history',
  buildResourceRouter({
    model: HistoryEvent,
    permission: 'history:write',
    createSchema: historyEventSchema,
    updateSchema: historyEventPatchSchema,
    defaultSort: 'year',
    searchable: ['title', 'description'],
    filters: ['phase'],
  })
);

router.use(
  '/teams',
  buildResourceRouter({
    model: Team,
    permission: 'players:write',
    createSchema: teamSchema,
    updateSchema: teamPatchSchema,
    defaultSort: 'rank name',
    publicFilter: { isVisible: true },
    searchable: ['name', 'subtitle', 'coach'],
    filters: ['category', 'slug'],
  })
);

router.use(
  '/players',
  buildResourceRouter({
    model: Player,
    permission: 'players:write',
    createSchema: playerSchema,
    updateSchema: playerPatchSchema,
    defaultSort: 'team rank number name',
    publicFilter: { isVisible: true },
    searchable: ['name', 'position', 'role'],
    filters: ['team', 'line', 'kind', 'status'],
  })
);

router.use(
  '/hero',
  buildResourceRouter({
    model: HeroSlide,
    permission: 'hero:write',
    createSchema: heroSlideSchema,
    updateSchema: heroSlidePatchSchema,
    defaultSort: 'rank created_at',
    publicFilter: { isVisible: true },
    searchable: ['title', 'kicker'],
  })
);

router.use(
  '/matches',
  buildResourceRouter({
    model: Match,
    permission: 'matches:write',
    createSchema: matchSchema,
    updateSchema: matchPatchSchema,
    defaultSort: 'date time',
    searchable: ['opponent', 'competition'],
    filters: ['status', 'venue', 'competition'],
    afterWrite: (before, after) => syncMatchStats(before, after),
  })
);

router.use(
  '/gallery',
  buildResourceRouter({
    model: GalleryItem,
    permission: 'gallery:write',
    createSchema: galleryItemSchema,
    updateSchema: galleryItemPatchSchema,
    defaultSort: '-rank -date -created_at',
    publicFilter: { isVisible: true },
    searchable: ['title', 'description'],
    filters: ['category', 'match', 'album'],
  })
);

router.use('/orders', orderRoutes);

router.use('/tickets', ticketRoutes);

router.use('/donations', donationRoutes);

router.use('/settings', settingsRoutes);

router.use('/player-of-month', playerOfMonthRoutes);

router.use('/albums', albumRoutes);

router.use('/share', shareRoutes);

router.use('/uploads', uploadRoutes);

export default router;
