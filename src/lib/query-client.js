import { QueryClient } from '@tanstack/react-query';

// Rate-limit-friendly defaults (live 429s, 2026-10-15).
// - staleTime 60s: data a page already has is reused for 60s, so tab switches and remounts don't refetch.
// - retry: up to 3 times for 429 / 5xx / network errors, with exponential backoff + jitter (honors Retry-After when present).
//   4xx other than 429 (bad request, forbidden, not found) are not retried.
// - refetchOnWindowFocus false (unchanged), refetchOnReconnect false.
const statusOf = (error) =>
	error?.status ?? error?.response?.status ?? error?.statusCode ?? (/\b429\b/.test(String(error?.message || '')) ? 429 : undefined);

const retryAfterMs = (error) => {
	const h = error?.response?.headers;
	const v = typeof h?.get === 'function' ? h.get('retry-after') : h?.['retry-after'];
	const n = Number(v);
	return Number.isFinite(n) && n > 0 ? Math.min(n * 1000, 30000) : null;
};

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000,
			gcTime: 10 * 60 * 1000,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
			retry: (failureCount, error) => {
				const s = statusOf(error);
				if (s === 429 || s === undefined || s >= 500) return failureCount < 3;
				return false;
			},
			retryDelay: (attempt, error) => retryAfterMs(error) ?? Math.min(1000 * 2 ** attempt, 15000) + Math.floor(Math.random() * 400),
		},
		mutations: {
			// Never auto-retry writes except on 429 (the server rejected it before doing anything).
			retry: (failureCount, error) => statusOf(error) === 429 && failureCount < 2,
			retryDelay: (attempt, error) => retryAfterMs(error) ?? 1500 * 2 ** attempt,
		},
	},
});
