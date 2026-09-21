const DEFAULT_TTL_MS = 15 * 60 * 1000;

type TemporaryImage = { uri: string; expiresAt: number };

export function createTemporaryImageStore(
  now: () => number = () => Date.now(),
  ttlMs = DEFAULT_TTL_MS,
) {
  const images = new Map<string, TemporaryImage>();
  const cleanup = () => {
    const current = now();
    for (const [id, image] of images) {
      if (image.expiresAt <= current) images.delete(id);
    }
  };
  return {
    put(uri: string) {
      cleanup();
      const id = crypto.randomUUID();
      images.set(id, { uri, expiresAt: now() + ttlMs });
      return { id, expiresAt: images.get(id)!.expiresAt };
    },
    get(id: string) {
      cleanup();
      return images.get(id)?.uri;
    },
    delete(id: string) {
      return images.delete(id);
    },
    size() {
      cleanup();
      return images.size;
    },
  };
}

export type TemporaryImageStore = ReturnType<typeof createTemporaryImageStore>;
