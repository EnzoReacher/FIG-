const DEFAULT_TTL_MS = 15 * 60 * 1000;

export type TemporaryImageInput = {
  ownerId: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  bytesBase64: string;
  sizeBytes: number;
};
type TemporaryImage = TemporaryImageInput & {
  id: string;
  createdAt: number;
  expiresAt: number;
};

export interface TemporaryImageStore {
  put(input: TemporaryImageInput): Pick<TemporaryImage, 'id' | 'expiresAt'>;
  take(id: string, ownerId: string): TemporaryImage | undefined;
  delete(id: string, ownerId: string): boolean;
  size(): number;
}

export function createTemporaryImageStore(
  now: () => number = () => Date.now(),
  ttlMs = DEFAULT_TTL_MS,
): TemporaryImageStore {
  const images = new Map<string, TemporaryImage>();
  const cleanup = () => {
    const current = now();
    for (const [id, image] of images) {
      if (image.expiresAt <= current) images.delete(id);
    }
  };
  return {
    put(input) {
      cleanup();
      const id = crypto.randomUUID();
      const createdAt = now();
      const image = { ...input, id, createdAt, expiresAt: createdAt + ttlMs };
      images.set(id, image);
      return { id, expiresAt: image.expiresAt };
    },
    take(id, ownerId) {
      cleanup();
      const image = images.get(id);
      if (!image || image.ownerId !== ownerId) return undefined;
      images.delete(id);
      return image;
    },
    delete(id, ownerId) {
      const image = images.get(id);
      return image?.ownerId === ownerId ? images.delete(id) : false;
    },
    size() {
      cleanup();
      return images.size;
    },
  };
}
