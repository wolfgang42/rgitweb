/** A repository shown in the start page's featured-repositories list. */
export interface FeaturedRepo {
  readonly url: string;
  readonly name?: string;
}

/** Runtime site configuration loaded from the URL in `VITE_CONFIG_PATH`. */
export interface Config {
  /** Omit to show the setup message; an empty array suppresses it. */
  readonly featuredRepos?: readonly FeaturedRepo[];
  readonly homeHtml?: string;
}

/**
 * Fetches the configured JSON file at runtime, or returns `undefined` when
 * `VITE_CONFIG_PATH` is unset.
 */
export async function loadConfig(): Promise<Config | undefined> {
  const configPath = import.meta.env.VITE_CONFIG_PATH as string | undefined;
  if (!configPath) return undefined;
  const response = await fetch(configPath);
  if (!response.ok) {
    throw new Error(
      `Failed to load config from ${configPath}: ${response.status}`,
    );
  }
  return (await response.json()) as Config;
}
