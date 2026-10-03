import { useParams, useSearchParams, Link } from "react-router";

import { ErrorPanel } from "../components/ErrorPanel.js";
import { CommitSummary } from "../components/CommitSummary.js";
import { LoadingPanel } from "../components/LoadingPanel.js";
import { RefPicker } from "../components/RefPicker.js";
import { useAsync } from "../hooks/useAsync.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { logPath, repoDisplayName } from "../paths.js";
import { useRepo } from "../repoOutletContext.js";
import { resolveCommitOid } from "../utils/resolveCommit.js";
import { type Commit, type Oid, type Repository } from "../../git/index.js";

const PAGE_SIZE = 50;

interface LogPageResult {
  readonly commits: readonly Commit[];
  readonly hasMore: boolean;
}

async function fetchPage(
  repository: Repository,
  rev: string,
  from: Oid | undefined,
): Promise<LogPageResult> {
  const startOid = from ?? (await resolveCommitOid(repository, rev));
  const commits: Commit[] = [];
  let skippedCursor = from === undefined;
  for await (const commit of repository.log(startOid, {
    limit: PAGE_SIZE + 2,
  })) {
    if (!skippedCursor) {
      if (commit.oid === from) {
        skippedCursor = true;
      }
      continue;
    }
    commits.push(commit);
    if (commits.length > PAGE_SIZE) {
      break;
    }
  }
  const hasMore = commits.length > PAGE_SIZE;
  return { commits: commits.slice(0, PAGE_SIZE), hasMore };
}

export function LogPage() {
  const { repository, url } = useRepo();
  const { ref: routeRev } = useParams<{ ref: string }>();
  const rev = routeRev ?? "";
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") ?? undefined;

  useDocumentTitle(`${repoDisplayName(url)} — log (${rev})`);

  const state = useAsync(
    () => fetchPage(repository, rev, from),
    [repository, rev, from],
  );

  if (state.status === "loading") {
    return <LoadingPanel />;
  }
  if (state.status === "error") {
    return <ErrorPanel error={state.error} />;
  }

  const { commits, hasMore } = state.data;
  const last = commits.at(-1);

  return (
    <div>
      <RefPicker
        repoUrl={url}
        repository={repository}
        rev={rev}
        path=""
        destination="log"
      />
      <div className="log-commits">
        {commits.map((commit) => (
          <CommitSummary key={commit.oid} repoUrl={url} commit={commit} />
        ))}
      </div>
      {commits.length === 0 && <p>No commits.</p>}
      {hasMore && last && (
        <p>
          <Link to={logPath(url, rev, { from: last.oid })}>older →</Link>
        </p>
      )}
    </div>
  );
}
