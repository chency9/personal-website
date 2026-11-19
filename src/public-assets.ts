declare const __OFFLINE_ASSETS__: Record<string, string>;

/** Resolve public files in both the development site and the portable HTML. */
export function publicAsset(path: string): string {
  return import.meta.env.MODE === 'offline' ? __OFFLINE_ASSETS__[path] : path;
}
