import { Link } from "react-router";

import { ErrorPanel } from "../components/ErrorPanel.js";
import { LoadingPanel } from "../components/LoadingPanel.js";
import { loadConfig } from "../config.js";
import { useAsync } from "../hooks/useAsync.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { repoRoot } from "../paths.js";

export function StartPage() {
  useDocumentTitle("rgitweb");
  const state = useAsync(loadConfig, []);

  return (
    <div className="page start-page">
      <h1>rgitweb</h1>
      <p>
        A fully static, client-side Git repository browser — no server-side
        logic involved. It reads a repository's dumb-HTTP layout (
        <code>info/refs</code>, loose objects, and pack files fetched with HTTP
        Range requests) straight from the browser, so the host must serve it
        over CORS (including{" "}
        <code>Access-Control-Expose-Headers: Accept-Ranges, Content-Range</code>
        ). Most Git hosts don't, which is why this page lists only repositories
        configured for this deployment rather than taking an arbitrary URL.
      </p>
      {state.status === "loading" ? (
        <LoadingPanel />
      ) : state.status === "error" ? (
        <ErrorPanel error={state.error} />
      ) : state.data?.featuredRepos.length ? (
        <section>
          <h2>Repositories</h2>
          <ul className="featured-list">
            {state.data.featuredRepos.map((repo) => (
              <li key={repo.url}>
                <Link to={repoRoot(repo.url)}>{repo.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p>
          No repositories are configured for this deployment. See{" "}
          <code>src/ui/config.ts</code> in the rgitweb source to add one.
        </p>
      )}
    </div>
  );
}
