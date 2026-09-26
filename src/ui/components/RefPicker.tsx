import { useId, useRef } from "react";

import { Link } from "react-router";

import { type Ref, type Repository } from "../../git/index.js";
import { useAsync } from "../hooks/useAsync.js";
import { treePath } from "../paths.js";
import { shortOid } from "../utils/format.js";

function shortRefName(name: string): string {
  return name.replace(/^refs\/(?:heads|tags)\//, "");
}

function displayRevision(rev: string): string {
  return /^[0-9a-f]{40}$/i.test(rev) ? shortOid(rev) : shortRefName(rev);
}

export function RefPicker({
  repoUrl,
  repository,
  rev,
  path,
}: {
  readonly repoUrl: string;
  readonly repository: Repository;
  readonly rev: string;
  readonly path: string;
}) {
  const popoverId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const state = useAsync(() => repository.refs(), [repository]);
  const isOid = /^[0-9a-f]{40}$/i.test(rev);

  const branches =
    state.status === "success"
      ? state.data
          .filter((ref) => ref.name.startsWith("refs/heads/"))
          .toSorted((a, b) => a.name.localeCompare(b.name))
      : [];
  const tags =
    state.status === "success"
      ? state.data
          .filter((ref) => ref.name.startsWith("refs/tags/"))
          .toSorted((a, b) => a.name.localeCompare(b.name))
      : [];

  function renderRefs(label: string, refs: readonly Ref[]) {
    if (refs.length === 0) return null;
    return (
      <div className="ref-picker-group" aria-label={label}>
        <h2>{label}</h2>
        <ul>
          {refs.map((reference) => {
            const name = shortRefName(reference.name);
            const isCurrent = rev === name || rev === reference.name;
            return (
              <li key={reference.name}>
                <Link
                  to={treePath(repoUrl, reference.name, path)}
                  aria-current={isCurrent ? "page" : undefined}
                  onClick={() => popoverRef.current?.hidePopover()}
                >
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="ref-picker">
      <button
        type="button"
        className="ref-picker-trigger"
        popoverTarget={popoverId}
        aria-label={`Choose ref, currently ${rev}`}
      >
        <span className={isOid ? "oid" : undefined} title={rev}>
          {displayRevision(rev)}
        </span>
        <span aria-hidden="true">▾</span>
      </button>
      <div
        id={popoverId}
        ref={popoverRef}
        className="ref-picker-popover"
        popover="auto"
        aria-label="Choose a branch or tag"
      >
        {state.status === "loading" ? (
          <p className="ref-picker-message">Loading refs…</p>
        ) : state.status === "error" ? (
          <p className="ref-picker-message error-inline">
            Failed to load refs.
          </p>
        ) : branches.length + tags.length === 0 ? (
          <p className="ref-picker-message">No branches or tags.</p>
        ) : (
          <>
            {renderRefs("Branches", branches)}
            {renderRefs("Tags", tags)}
          </>
        )}
      </div>
    </div>
  );
}
