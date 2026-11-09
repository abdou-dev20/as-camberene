import {
  ArticleRecord,
  AlbumRecord,
  GalleryItemRecord,
  HeroSlideRecord,
  LegendRecord,
  MatchRecord,
  ListParams,
  ProductRecord,
  TeamMemberRecord,
  TeamRecord,
  articles as articlesApi,
  albums as albumsApi,
  gallery as galleryApi,
  heroSlides as heroSlidesApi,
  history as historyApi,
  matches as matchesApi,
  legends as legendsApi,
  products as productsApi,
  teamMembers as teamMembersApi,
  teams as teamsApi,
} from '../services/site/content.service';
import {
  Article,
  Album,
  GalleryItem,
  HeroSlide,
  HistoryEvent,
  Legend,
  Match,
  Product,
  Team,
  TeamMember,
} from '../types';
import { getMatches } from '../services/fconnect/matches.service';
import { toMatches } from '../adapters/match.adapter';
import { isFconnectConfigured } from '../config/env';
import { ApiResource, useApiResource } from './useApiResource';

export const useArticles = (params: ListParams = {}): ApiResource<Article[]> =>
  useApiResource<Article[]>(
    (signal) => articlesApi.list(params, signal),
    [],
    { deps: [JSON.stringify(params)] }
  );

export const useProducts = (params: ListParams = {}): ApiResource<Product[]> =>
  useApiResource<Product[]>(
    (signal) => productsApi.list(params, signal),
    [],
    { deps: [JSON.stringify(params)] }
  );

export const useLegends = (params: ListParams = {}): ApiResource<Legend[]> =>
  useApiResource<Legend[]>(
    (signal) => legendsApi.list(params, signal),
    [],
    { deps: [JSON.stringify(params)] }
  );

export const useHeroSlides = (): ApiResource<HeroSlide[]> =>
  useApiResource<HeroSlideRecord[]>(
    (signal) => heroSlidesApi.list({ sort: 'rank created_at' }, signal),
    [],
    { deps: [] }
  );

export const useMatches = (): ApiResource<Match[]> => {
  const site = useApiResource<MatchRecord[]>(
    (signal) => matchesApi.list({ sort: 'date time' }, signal),
    [],
    { deps: [] }
  );

  const external = useApiResource<Match[]>(
    (signal) => getMatches({ limit: 50 }, signal).then(toMatches),
    [],
    { enabled: isFconnectConfigured() }
  );

  return { ...site, data: site.data.length > 0 ? site.data : external.data };
};

export const useTeams = (): ApiResource<Team[]> =>
  useApiResource<TeamRecord[]>(
    (signal) => teamsApi.list({ sort: 'rank name' }, signal),
    [],
    { deps: [] }
  );

export const useTeamMembers = (team?: string): ApiResource<TeamMember[]> =>
  useApiResource<TeamMemberRecord[]>(
    (signal) => teamMembersApi.list(team ? { team } : {}, signal),
    [],
    { deps: [team] }
  );

export const useAlbums = (category?: string): ApiResource<Album[]> =>
  useApiResource<AlbumRecord[]>(
    (signal) => albumsApi.list(category ? { category } : {}, signal),
    [],
    { deps: [category] }
  );

export const useAlbum = (id: string | undefined): ApiResource<Album | null> =>
  useApiResource<AlbumRecord | null>(
    (signal) => albumsApi.get(String(id), signal),
    null,
    { enabled: Boolean(id), deps: [id] }
  );

export const useHistoryEvents = (): ApiResource<HistoryEvent[]> =>
  useApiResource<HistoryEvent[]>(
    (signal) => historyApi.list({ sort: 'year' }, signal),
    []
  );

const findById = <T extends { id: unknown }>(items: T[], id: string | undefined): T | undefined =>
  id ? items.find((item) => String(item.id) === String(id)) : undefined;

export const useArticle = (id: string | undefined) => {
  const list = useArticles();
  const known = findById(list.data, id);

  const single = useApiResource<ArticleRecord | null>(
    (signal) => articlesApi.get(id!, signal),
    null,
    { enabled: Boolean(id) && !known && !list.loading, deps: [id, Boolean(known)] }
  );

  return {
    article: known ?? single.data ?? undefined,
    loading: list.loading || single.loading,
    reload: single.reload,
  };
};

export const useProductRecord = (id: string | undefined) => {
  const list = useProducts();
  const known = findById(list.data, id);

  const single = useApiResource<ProductRecord | null>(
    (signal) => productsApi.get(id!, signal),
    null,
    { enabled: Boolean(id) && !known && !list.loading, deps: [id, Boolean(known)] }
  );

  return { product: known ?? single.data ?? undefined, loading: list.loading || single.loading };
};

export const useLegend = (id: string | undefined) => {
  const list = useLegends();
  const known = findById(list.data, id);

  const single = useApiResource<LegendRecord | null>(
    (signal) => legendsApi.get(id!, signal),
    null,
    { enabled: Boolean(id) && !known && !list.loading, deps: [id, Boolean(known)] }
  );

  return { legend: known ?? single.data ?? undefined, loading: list.loading || single.loading };
};

export const useMatch = (id: string | undefined) => {
  const single = useApiResource<MatchRecord | null>(
    (signal) => matchesApi.get(id!, signal),
    null,
    { enabled: Boolean(id), deps: [id] }
  );
  return { match: single.data ?? undefined, loading: single.loading, error: single.error };
};

export const useMatchGallery = (matchId: string | undefined): ApiResource<GalleryItem[]> =>
  useApiResource<GalleryItemRecord[]>(
    (signal) => galleryApi.list({ category: 'match', match: matchId }, signal),
    [],
    { enabled: Boolean(matchId), deps: [matchId] }
  );
