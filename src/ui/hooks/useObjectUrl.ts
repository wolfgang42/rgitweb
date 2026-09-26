import { useEffect, useMemo } from "react";

import mime from "mime/lite";

export function useObjectUrl(
  bytes: Uint8Array | undefined,
  filename: string,
): string | undefined {
  const objectUrl = useMemo(() => {
    if (!bytes) {
      return;
    }
    return URL.createObjectURL(
      new Blob([new Uint8Array(bytes)], { type: mime.getType(filename) ?? "" }),
    );
  }, [bytes, filename]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return objectUrl;
}
