import { Link } from "react-router";

import { type Repository } from "../../git/index.js";
import { repoDisplayName, treePath } from "../paths.js";

import { RefPicker } from "./RefPicker.js";

export function Breadcrumbs({
  repoUrl,
  repository,
  rev,
  path,
  isTree,
}: {
  readonly repoUrl: string;
  readonly repository: Repository;
  readonly rev: string;
  readonly path: string;
  readonly isTree: boolean;
}) {
  const segments = path.split("/").filter((segment) => segment.length > 0);
  return (
    <div className="path-toolbar">
      <RefPicker
        repoUrl={repoUrl}
        repository={repository}
        rev={rev}
        path={path}
      />
      <nav className="breadcrumbs" aria-label="Path">
        <Link to={treePath(repoUrl, rev, "")}>{repoDisplayName(repoUrl)}</Link>
        {segments.map((segment, index) => {
          const segmentPath = segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          return (
            <span key={segmentPath}>
              <span className="breadcrumbs-separator">{" / "}</span>
              {isLast ? (
                <>
                  <span>{segment}</span>
                  {isTree && (
                    <span className="breadcrumbs-separator">{" /"}</span>
                  )}
                </>
              ) : (
                <Link to={treePath(repoUrl, rev, segmentPath)}>{segment}</Link>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}
