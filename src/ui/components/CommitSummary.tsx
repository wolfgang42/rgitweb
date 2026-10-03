import { type Commit } from "../../git/index.js";

import { OidLink } from "./OidLink.js";
import { RelativeDate } from "./RelativeDate.js";

const COMMIT_MESSAGE_PATTERN =
  /^(?<subject>[^\r\n]*)(?:[\r\n]+(?<remainder>.*))?$/s;

export function CommitSummary({
  repoUrl,
  commit,
}: {
  readonly repoUrl: string;
  readonly commit: Commit;
}) {
  const message = COMMIT_MESSAGE_PATTERN.exec(commit.message);
  const subject = message?.groups?.subject ?? <em>no subject</em>;
  const remainder = message?.groups?.remainder;
  const samePerson =
    commit.author.name === commit.committer.name &&
    commit.author.email === commit.committer.email;
  const sameDate =
    commit.author.date.getTime() === commit.committer.date.getTime();

  return (
    <div className="commit-summary">
      {remainder ? (
        <details className="commit-summary-details">
          <summary
            className="commit-summary-heading"
            title="Toggle full commit message"
          >
            <span className="commit-summary-subject">{subject}</span>
            <span className="commit-summary-more">…</span>
          </summary>
          <pre>{remainder}</pre>
        </details>
      ) : (
        <div className="commit-summary-heading">
          <span className="commit-summary-subject">{subject}</span>
        </div>
      )}
      <div className="commit-summary-meta">
        <OidLink repoUrl={repoUrl} oid={commit.oid} /> {commit.author.name}{" "}
        authored <RelativeDate date={commit.author.date} />
        {samePerson && sameDate ? null : sameDate ? (
          <>
            {" and "}
            {commit.committer.name} committed{" "}
            <RelativeDate date={commit.committer.date} />
          </>
        ) : samePerson ? (
          <>
            {", committed "}
            <RelativeDate date={commit.committer.date} />
          </>
        ) : (
          <>
            {"; "}
            {commit.committer.name} committed{" "}
            <RelativeDate date={commit.committer.date} />
          </>
        )}
      </div>
    </div>
  );
}
