export const AppRoute = {
  timer: "/timer",
  settings: "/settings",
} as const;

export const appPath = {
  timer: () => AppRoute.timer,
  settings: () => AppRoute.settings,
} as const;

