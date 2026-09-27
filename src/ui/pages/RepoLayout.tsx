import { Link, NavLink, Outlet, useParams } from "react-router";

import { LoadingPanel } from "../components/LoadingPanel.js";
import { useAsync } from "../hooks/useAsync.js";
import {
  logPath,
  refsPath,
  repoDisplayName,
  summaryPath,
  treePath,
} from "../paths.js";
import { getRepository } from "../repoCache.js";
import { type RepoOutletContext } from "../repoOutletContext.js";

function mirrorUrl(
  config: ReadonlyMap<string, readonly (string | null)[]>,
): string | undefined {
  for (const [key, values] of config) {
    // push mirror
    const pushMirror = key.endsWith(".mirror") && values.includes("true");
    // fetch mirror
    const fetchMirror =
      key.endsWith(".fetch") && values.includes("+refs/*:refs/*");
    if (pushMirror || fetchMirror) {
      const remoteName = key.slice("remote.".length, key.lastIndexOf("."));
      if (key.startsWith("remote.") && remoteName) {
        const urls = config.get(`remote.${remoteName}.url`);
        const url = urls?.find((value): value is string => value !== null);
        if (url) return url;
      }
    }
  }
  return undefined;
}

function defaultRevFromHead(
  headSymref: string | undefined,
  headOid: string,
): string {
  if (headSymref?.startsWith("refs/heads/")) {
    return headSymref.slice("refs/heads/".length);
  }
  return headOid;
}

export function RepoLayout() {
  const { repoUrl: encodedRepoUrl } = useParams<{ repoUrl: string }>();
  // React Router already fully decodes matched path params, including
  // literal slashes that were percent-encoded to keep the URL to one segment.
  const repoUrl = encodedRepoUrl ?? "";

  const state = useAsync(async () => {
    const repository = await getRepository(repoUrl);
    const [head, config] = await Promise.all([
      repository.head(),
      repository.config(),
    ]);
    return {
      repository,
      defaultRev: defaultRevFromHead(head.symref, head.oid),
      mirrorUrl: config ? mirrorUrl(config) : undefined,
    };
  }, [repoUrl]);

  if (state.status === "loading") {
    return (
      <div className="page">
        <LoadingPanel label="Opening repository…" />
      </div>
    );
  }
  if (state.status === "error") throw state.error;

  const context: RepoOutletContext = {
    repository: state.data.repository,
    url: repoUrl,
    defaultRev: state.data.defaultRev,
  };
  return (
    <div className="page repo-page">
      <header className="repo-header">
        <h1>
          <Link to={summaryPath(repoUrl)}>{repoDisplayName(repoUrl)}</Link>
        </h1>
        <p className="repo-url">
          git clone {new URL(repoUrl, globalThis.location.href).href}
          {state.data.mirrorUrl && (
            <>
              {" — mirror of "}
              <a href={state.data.mirrorUrl}>{state.data.mirrorUrl}</a>
            </>
          )}
        </p>
        <nav className="tabs">
          <NavLink to={summaryPath(repoUrl)} end>
            summary
          </NavLink>
          <NavLink to={refsPath(repoUrl)}>refs</NavLink>
          <NavLink to={logPath(repoUrl, context.defaultRev)}>log</NavLink>
          <NavLink to={treePath(repoUrl, context.defaultRev)}>tree</NavLink>
        </nav>
      </header>
      <main>
        <Outlet context={context} />
      </main>
    </div>
  );
}
