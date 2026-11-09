import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../lib/api';

export type ResourceSource = 'api' | 'fallback';

export interface ApiResource<T> {
  data: T;
  loading: boolean;
  error: ApiError | null;
  source: ResourceSource;
  reload: () => void;
}

export interface ResourceOptions {
  enabled?: boolean;
  deps?: readonly unknown[];
}

export function useApiResource<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  fallback: T,
  { enabled = true, deps = [] }: ResourceOptions = {}
): ApiResource<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<ApiError | null>(null);
  const [source, setSource] = useState<ResourceSource>('fallback');
  const [attempt, setAttempt] = useState(0);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  useEffect(() => {
    if (!enabled) {
      setData(fallbackRef.current);
      setSource('fallback');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);

    loaderRef
      .current(controller.signal)
      .then((result) => {
        if (!active) return;
        setData(result);
        setSource('api');
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const apiError =
          cause instanceof ApiError ? cause : new ApiError(0, 'Erreur inattendue du serveur.');
        setError(apiError);
        setData(fallbackRef.current);
        setSource('fallback');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, enabled, ...deps]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { data, loading, error, source, reload };
}

export default useApiResource;
