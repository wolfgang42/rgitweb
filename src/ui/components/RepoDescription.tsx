import { useAsync } from "../hooks/useAsync.js";
import { NotFoundError, type Repository } from "../../git/index.js";

import { ErrorPanel } from "./ErrorPanel.js";

const DEFAULT_DESCRIPTIONS = new Set([
  "Unnamed repository; edit this file to name it for gitweb.",
  "Unnamed repository; edit this file 'description' to name the repository.",
]);

async function loadDescription(
  repository: Repository,
): Promise<string | undefined> {
  try {
    const text = await repository.description();
    const firstLine = text.trim().split(/\r?\n/, 1)[0] ?? "";
    if (firstLine && !DEFAULT_DESCRIPTIONS.has(firstLine)) {
      return firstLine;
    }
  } catch (error) {
    if (!(error instanceof NotFoundError)) {
      throw error;
    }
  }
  return undefined;
}

/** Repo description from the `description` file, unless it's still the gitweb default placeholder. */
export function RepoDescription({
  repository,
}: {
  readonly repository: Repository;
}) {
  const state = useAsync(() => loadDescription(repository), [repository]);

  if (state.status === "error") {
    return <ErrorPanel error={state.error} />;
  }
  if (state.status !== "success" || !state.data) {
    return null;
  }

  return <p>{state.data}</p>;
}
