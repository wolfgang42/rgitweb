import { Link } from "react-router";

import { useAsync } from "../hooks/useAsync.js";
import { treePath } from "../paths.js";
import { peelToCommit } from "../utils/resolveCommit.js";
import { type Ref, type Repository } from "../../git/index.js";

import { CommitSummary } from "./CommitSummary.js";

/**
 * Table row showing a ref name plus the summary of the commit it points at.
 * Fetches that commit lazily/independently so a slow one doesn't block the
 * rest of the ref list from rendering.
 */
export function RefCommitRow({
  repoUrl,
  repository,
  reference,
}: {
  readonly repoUrl: string;
  readonly repository: Repository;
  readonly reference: Ref;
}) {
  const name = reference.name.replace(/^refs\/(?:heads|tags)\//, "");
  const state = useAsync(
    () =>
      peelToCommit(repository, reference.oid).then((oid) =>
        repository.getCommit(oid),
      ),
    [repository, reference.oid],
  );
  return (
    <tr>
      <td className="ref-name">
        <Link to={treePath(repoUrl, name)}>{name}</Link>
      </td>
      {state.status === "success" ? (
        <td colSpan={4}>
          <CommitSummary repoUrl={repoUrl} commit={state.data} />
        </td>
      ) : state.status === "error" ? (
        <td colSpan={4} className="error-inline">
          failed to load
        </td>
      ) : (
        <td colSpan={4}>…</td>
      )}
    </tr>
  );
}
