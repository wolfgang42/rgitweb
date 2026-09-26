import { useEffect, useMemo } from "react";

export function useObjectUrl(
  bytes: Uint8Array | undefined,
): string | undefined {
  const objectUrl = useMemo(() => {
    if (!bytes) {
      return;
    }
    return URL.createObjectURL(new Blob([new Uint8Array(bytes)]));
  }, [bytes]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return objectUrl;
}
