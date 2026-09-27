import { Link } from "react-router";

import { ErrorPanel } from "../components/ErrorPanel.js";
import { LoadingPanel } from "../components/LoadingPanel.js";
import { loadConfig } from "../config.js";
import { useAsync } from "../hooks/useAsync.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { repoDisplayName, repoRoot } from "../paths.js";

export function StartPage() {
  useDocumentTitle("rgitweb");
  const state = useAsync(loadConfig, []);
  const featuredRepos =
    state.status === "success" ? state.data?.featuredRepos : undefined;
  const homeHtml =
    state.status === "success" ? state.data?.homeHtml : undefined;

  return (
    <div className="page start-page">
      {homeHtml && <div dangerouslySetInnerHTML={{ __html: homeHtml }} />}
      {state.status === "loading" ? (
        <LoadingPanel />
      ) : state.status === "error" ? (
        <ErrorPanel error={state.error} />
      ) : featuredRepos === undefined ? (
        <p>
          No repositories are configured for this deployment. See{" "}
          <code>src/ui/config.ts</code> in the rgitweb source to add one.
        </p>
      ) : featuredRepos.length > 0 ? (
        <section>
          <h2>Repositories</h2>
          <ul className="featured-list">
            {featuredRepos.map((repo) => (
              <li key={repo.url}>
                <Link to={repoRoot(repo.url)}>
                  {repo.name ?? repoDisplayName(repo.url)}
                </Link>
                {repo.description && (
                  <p className="featured-description">{repo.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
