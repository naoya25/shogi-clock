export const AppRoute = {
  timer: "/timer",
  settings: "/settings",
} as const;

type RouteQuery = Record<
  string,
  string | number | boolean | null | undefined
>;

function withQuery(path: string, query?: RouteQuery): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs.length > 0 ? `${path}?${qs}` : path;
}

export const appPath = {
  timer: (query?: { rule?: string }) => withQuery(AppRoute.timer, query),
  settings: (query?: { rule?: string }) => withQuery(AppRoute.settings, query),
} as const;

