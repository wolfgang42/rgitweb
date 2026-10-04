import { useState } from "react";

import { useParams } from "react-router";

import { ErrorPanel } from "../components/ErrorPanel.js";
import { CommitSummary } from "../components/CommitSummary.js";
import { LoadingPanel } from "../components/LoadingPanel.js";
import { RefPicker } from "../components/RefPicker.js";
import { useAsync } from "../hooks/useAsync.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { repoDisplayName } from "../paths.js";
import { useRepo } from "../repoOutletContext.js";
import { resolveCommitOid } from "../utils/resolveCommit.js";
import { type Commit, type Repository } from "../../git/index.js";

const PAGE_SIZE = 50;

interface Page {
  readonly commits: readonly Commit[];
  readonly done: boolean;
}

async function readPage(iterator: AsyncGenerator<Commit>): Promise<Page> {
  const commits: Commit[] = [];
  while (commits.length < PAGE_SIZE) {
    const next = await iterator.next();
    if (next.done) {
      return { commits, done: true };
    }
    commits.push(next.value);
  }
  return { commits, done: false };
}

async function fetchFirstPage(repository: Repository, rev: string) {
  const iterator = repository.log(await resolveCommitOid(repository, rev));
  return { iterator, page: await readPage(iterator) };
}

function LogList({
  url,
  iterator,
  firstPage,
}: {
  readonly url: string;
  readonly iterator: AsyncGenerator<Commit>;
  readonly firstPage: Page;
}) {
  const [{ commits, done }, setPage] = useState(firstPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();

  const loadMore = () => {
    setLoading(true);
    setError(undefined);
    readPage(iterator).then(
      (next) => {
        setPage((previous) => ({
          commits: [...previous.commits, ...next.commits],
          done: next.done,
        }));
        setLoading(false);
      },
      (error_: unknown) => {
        setError(error_);
        setLoading(false);
      },
    );
  };

  return (
    <>
      <div className="log-commits">
        {commits.map((commit) => (
          <CommitSummary key={commit.oid} repoUrl={url} commit={commit} />
        ))}
      </div>
      {commits.length === 0 && <p>No commits.</p>}
      {error !== undefined && <ErrorPanel error={error} />}
      {loading && <LoadingPanel />}
      {!done && !loading && (
        <p>
          <button type="button" onClick={loadMore}>
            Load more
          </button>
        </p>
      )}
    </>
  );
}

export function LogPage() {
  const { repository, url } = useRepo();
  const { ref: routeRev } = useParams<{ ref: string }>();
  const rev = routeRev ?? "";

  useDocumentTitle(`${repoDisplayName(url)} — log (${rev})`);

  const state = useAsync(
    () => fetchFirstPage(repository, rev),
    [repository, rev],
  );

  if (state.status === "loading") {
    return <LoadingPanel />;
  }
  if (state.status === "error") {
    return <ErrorPanel error={state.error} />;
  }

  return (
    <div>
      <RefPicker
        repoUrl={url}
        repository={repository}
        rev={rev}
        path=""
        destination="log"
      />
      <LogList
        url={url}
        iterator={state.data.iterator}
        firstPage={state.data.page}
      />
    </div>
  );
}
