import { Link } from "react-router";

import { ErrorPanel } from "../components/ErrorPanel.js";
import { LoadingPanel } from "../components/LoadingPanel.js";
import { OidLink } from "../components/OidLink.js";
import { Readme } from "../components/Readme.js";
import { useAsync } from "../hooks/useAsync.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { logPath, refsPath, repoDisplayName } from "../paths.js";
import { useRepo } from "../repoOutletContext.js";
import { summaryLine } from "../utils/format.js";
import {
  type Head,
  NotFoundError,
  type Ref,
  type Repository,
} from "../../git/index.js";

interface SummaryData {
  readonly head: Head;
  readonly headCommit: Awaited<ReturnType<Repository["getCommit"]>>;
  readonly refs: readonly Ref[];
  readonly description: string | undefined;
}

const DEFAULT_DESCRIPTIONS = new Set([
  "Unnamed repository; edit this file to name it for gitweb.",
  "Unnamed repository; edit this file 'description' to name the repository.",
]);

async function loadSummary(repository: Repository): Promise<SummaryData> {
  const head = await repository.head();
  const [refs, headCommit] = await Promise.all([
    repository.refs(),
    repository.getCommit(head.oid),
  ]);
  let description: string | undefined;
  try {
    const text = await repository.description();
    const firstLine = text.trim().split(/\r?\n/, 1)[0] ?? "";
    if (firstLine && !DEFAULT_DESCRIPTIONS.has(firstLine)) {
      description = firstLine;
    }
  } catch (error) {
    if (!(error instanceof NotFoundError)) {
      throw error;
    }
  }
  return { head, headCommit, refs, description };
}

export function SummaryPage() {
  const { repository, url, defaultRev } = useRepo();
  useDocumentTitle(`${repoDisplayName(url)} — summary`);
  const state = useAsync(() => loadSummary(repository), [repository]);

  if (state.status === "loading") {
    return <LoadingPanel />;
  }
  if (state.status === "error") {
    return <ErrorPanel error={state.error} />;
  }

  const { refs, headCommit } = state.data;
  const branches = refs.filter((ref) => ref.name.startsWith("refs/heads/"));
  const tags = refs.filter((ref) => ref.name.startsWith("refs/tags/"));
  const headName =
    state.data.head.symref?.replace(/^refs\/heads\//, "") ??
    state.data.head.oid;

  return (
    <div>
      {state.data.description && <p>{state.data.description}</p>}
      <p>
        <strong>{headName}</strong> -{" "}
        <Link to={refsPath(url)}>
          {branches.length} branches, {tags.length} tags
        </Link>
      </p>
      <div className="section-heading">
        <p className="summary">
          <OidLink repoUrl={url} oid={headCommit.oid} />{" "}
          {summaryLine(headCommit.message)}
        </p>
        <Link to={logPath(url, defaultRev)}>view log →</Link>
      </div>
      <Readme repository={repository} treeOid={headCommit.tree} />
    </div>
  );
}
