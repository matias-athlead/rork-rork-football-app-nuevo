// Tipado centralizado de rutas para evitar el uso de "as any" en navegación
// Uso: router.push(route('/profile/123'))

export type AppRoute =
  | '/onboarding'
  | '/login'
  | '/register'
  | '/forgot-password'
  | '/(tabs)'
  | '/(tabs)/profile'
  | '/(tabs)/search'
  | '/(tabs)/rankings'
  | '/(tabs)/notifications'
  | '/(tabs)/create'
  | '/messages'
  | '/settings'
  | '/edit-profile'
  | '/rankings'
  | '/ai-analysis'
  | '/radar-stats'
  | '/notification-settings'
  | '/privacy-settings'
  | '/blocked-users'
  | '/help-support'
  | '/premium';

export type DynamicAppRoute =
  | `/profile/${string}`
  | `/post/${string}`
  | `/chat/${string}`
  | `/post-comments/${string}`
  | `/audio-call/${string}`
  | `/video-call/${string}`
  | `/edit-post/${string}`;

export type AnyAppRoute = AppRoute | DynamicAppRoute;

// Helper para usar en router.push() con tipado correcto
export function route(path: AnyAppRoute): AnyAppRoute {
  return path;
}
