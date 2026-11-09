import { siteApi } from '../../lib/api';
import { compressImage } from '../../lib/compressImage';
import {
  Article,
  Comment,
  Album,
  GalleryItem,
  HeroSlide,
  HistoryEvent,
  Legend,
  Match,
  Product,
  Team,
  TeamMember,
} from '../../types';
import { siteMediaUrl } from './media';

export type ArticleRecord = Article & { id: string };
export type ProductRecord = Product & { id: string };
export type LegendRecord = Legend & { id: string };
export type HistoryEventRecord = HistoryEvent & { id: string };
export type HeroSlideRecord = HeroSlide & { id: string };
export type MatchRecord = Match & { id: string };
export type TeamRecord = Team & { id: string };
export type GalleryItemRecord = GalleryItem & { id: string };
export type AlbumRecord = Album & { id: string };
export type TeamMemberRecord = TeamMember;

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ItemResponse<T> {
  success: boolean;
  data: T;
}

export interface ListParams {
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;

  [key: string]: string | number | boolean | undefined;
}

const resource = <T extends { id: string }>(path: string, normalize: (row: T) => T) => ({
  list: async (params: ListParams = {}, signal?: AbortSignal): Promise<T[]> => {
    const response = await siteApi.get<ListResponse<T>>(path, {
      query: params,
      auth: true,
      signal,
    });
    return response.data.map(normalize);
  },

  get: async (id: string, signal?: AbortSignal): Promise<T> => {
    const response = await siteApi.get<ItemResponse<T>>(`${path}/${id}`, { auth: true, signal });
    return normalize(response.data);
  },

  create: async (payload: Partial<T>): Promise<T> => {
    const response = await siteApi.post<ItemResponse<T>>(path, payload, { auth: true });
    return normalize(response.data);
  },

  update: async (id: string, payload: Partial<T>): Promise<T> => {
    const response = await siteApi.put<ItemResponse<T>>(`${path}/${id}`, payload, { auth: true });
    return normalize(response.data);
  },

  remove: async (id: string): Promise<void> => {
    await siteApi.del(`${path}/${id}`, { auth: true });
  },
});

const normalizeComment = (comment: Comment): Comment => ({
  ...comment,
  timestamp: String(comment.timestamp),
});

const normalizeArticle = (article: ArticleRecord): ArticleRecord => ({
  ...article,

  image: siteMediaUrl(article.image),
  publishedAt: String(article.publishedAt),
  comments: (article.comments ?? []).map(normalizeComment),
});

const normalizeProduct = (product: ProductRecord): ProductRecord => {
  const images = (product.images ?? []).map((image) => siteMediaUrl(image)).filter(Boolean);
  return {
    ...product,
    image: siteMediaUrl(product.image) || images[0] || 'assets/img/vue-du-t-shirt-du-joueur-de-football.jpg',
    images: images.length > 0 ? images : [siteMediaUrl(product.image)].filter(Boolean),
  };
};

const normalizeLegend = (legend: LegendRecord): LegendRecord => ({
  ...legend,
  photo: siteMediaUrl(legend.photo, 'assets/img/vue-du-ballon-de-football.jpg'),
});

const normalizeTeamMember = (member: TeamMemberRecord): TeamMemberRecord => ({
  ...member,

  photo: siteMediaUrl(member.photo),
});

const normalizeHeroSlide = (slide: HeroSlideRecord): HeroSlideRecord => ({
  ...slide,
  image: slide.image ? siteMediaUrl(slide.image) : undefined,
});

const normalizeTeam = (team: TeamRecord): TeamRecord => ({
  ...team,
  image: siteMediaUrl(team.image),
});

const normalizeGalleryItem = <T extends GalleryItem>(item: T): T => ({
  ...item,
  image: siteMediaUrl(item.image),
  createdAt:
    String((item as unknown as { created_at?: string }).created_at ?? item.createdAt ?? '') ||
    undefined,
});

const normalizeMatch = (match: MatchRecord): MatchRecord => ({
  ...match,
  image: match.image ? siteMediaUrl(match.image) : undefined,
});

const normalizeHistoryEvent = (event: HistoryEventRecord): HistoryEventRecord => ({
  ...event,
  image: event.image ? siteMediaUrl(event.image) : undefined,
});

const normalizeAlbum = (album: AlbumRecord): AlbumRecord => ({
  ...album,
  cover: siteMediaUrl(album.cover),
  photos: album.photos?.map(normalizeGalleryItem),
});

export const articles = resource<ArticleRecord>('/articles', normalizeArticle);
export const products = resource<ProductRecord>('/products', normalizeProduct);
export const legends = resource<LegendRecord>('/legends', normalizeLegend);
export const history = resource<HistoryEventRecord>('/history', normalizeHistoryEvent);
export const teamMembers = resource<TeamMemberRecord>('/players', normalizeTeamMember);
export const heroSlides = resource<HeroSlideRecord>('/hero', normalizeHeroSlide);
export const matches = resource<MatchRecord>('/matches', normalizeMatch);
export const teams = resource<TeamRecord>('/teams', normalizeTeam);
export const gallery = resource<GalleryItemRecord>('/gallery', normalizeGalleryItem);
export const albums = resource<AlbumRecord>('/albums', normalizeAlbum);

export const postComment = async (
  articleId: string,
  payload: { author: string; content: string }
): Promise<Comment> => {
  const response = await siteApi.post<ItemResponse<Comment>>(
    `/articles/${articleId}/comments`,
    payload
  );
  return normalizeComment(response.data);
};

export const uploadImage = async (file: File): Promise<string> => {
  const response = await siteApi.upload<ItemResponse<{ url: string }>>(
    '/uploads',
    await compressImage(file)
  );
  return response.data.url;
};
