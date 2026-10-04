import { ErrorPanel } from "../components/ErrorPanel.js";
import { LoadingPanel } from "../components/LoadingPanel.js";
import { RefCommitRow } from "../components/RefCommitRow.js";
import { useAsync } from "../hooks/useAsync.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { repoDisplayName } from "../paths.js";
import { useRepo } from "../repoOutletContext.js";

export function RefsPage() {
  const { repository, url } = useRepo();
  useDocumentTitle(`${repoDisplayName(url)} — refs`);
  const state = useAsync(() => repository.refs(), [repository]);
  const configState = useAsync(() => repository.config(), [repository]);

  if (state.status === "loading") {
    return <LoadingPanel />;
  }
  if (state.status === "error") {
    return <ErrorPanel error={state.error} />;
  }

  const branches = state.data.filter((ref) =>
    ref.name.startsWith("refs/heads/"),
  );
  const tags = state.data.filter((ref) => ref.name.startsWith("refs/tags/"));
  const remotes =
    configState.status === "success"
      ? [...(configState.data ?? [])]
          .map(([key, values]) => {
            const name = /^remote\.(.*)\.url$/.exec(key)?.[1];
            if (name === undefined) return;
            return { name, urls: values.filter((v) => v !== null) };
          })
          .filter((remote) => remote !== undefined)
      : [];

  return (
    <div>
      <section>
        <h2>Branches</h2>
        <table className="ref-table">
          <tbody>
            {branches.map((ref) => (
              <RefCommitRow
                key={ref.name}
                repoUrl={url}
                repository={repository}
                reference={ref}
              />
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Tags</h2>
        <table className="ref-table">
          <tbody>
            {tags.map((ref) => (
              <RefCommitRow
                key={ref.name}
                repoUrl={url}
                repository={repository}
                reference={ref}
              />
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Remotes</h2>
        <table className="ref-table">
          <tbody>
            {configState.status === "loading" ? (
              <tr>
                <td colSpan={2}>…</td>
              </tr>
            ) : configState.status === "error" ? (
              <tr>
                <td colSpan={2} className="error-inline">
                  failed to load
                </td>
              </tr>
            ) : remotes.length === 0 ? (
              <tr>
                <td colSpan={2}>No remotes configured</td>
              </tr>
            ) : (
              remotes.map((remote) => (
                <tr key={remote.name}>
                  <td>{remote.name}</td>
                  <td className="remote-url">
                    {remote.urls.map((url, index) => (
                      <div key={index}>
                        <a href={url}>{url}</a>
                      </div>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
