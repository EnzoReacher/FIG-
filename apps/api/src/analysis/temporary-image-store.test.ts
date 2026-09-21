import { describe, expect, it } from 'vitest';
import { createTemporaryImageStore } from './temporary-image-store.js';

describe('temporary image store', () => {
  it('expires stale images and cleans them up', () => {
    let now = 1_000;
    const store = createTemporaryImageStore(() => now, 100);
    const image = store.put({
      ownerId: 'user',
      mediaType: 'image/jpeg',
      bytesBase64: 'aW1hZ2U=',
      sizeBytes: 5,
    });
    expect(store.take(image.id, 'other')).toBeUndefined();
    expect(store.take(image.id, 'user')?.bytesBase64).toBe('aW1hZ2U=');
    now = 1_101;
    expect(store.cleanup()).toBe(0);
    expect(store.size()).toBe(0);
  });

  it('reports expiry cleanup without leaking image data', () => {
    let now = 1_000;
    const store = createTemporaryImageStore(() => now, 100);
    const response = store.put({
      ownerId: 'user',
      mediaType: 'image/webp',
      bytesBase64: 'aW1hZ2U=',
      sizeBytes: 5,
    });
    expect(response).toEqual({ id: expect.any(String), expiresAt: 1_100 });
    expect(response).not.toHaveProperty('bytesBase64');
    now = 1_101;
    expect(store.cleanup()).toBe(1);
  });

  it('deletes an image explicitly', () => {
    const store = createTemporaryImageStore(() => 1_000);
    const image = store.put({
      ownerId: 'user',
      mediaType: 'image/png',
      bytesBase64: 'aW1hZ2U=',
      sizeBytes: 5,
    });
    expect(store.delete(image.id, 'other')).toBe(false);
    expect(store.delete(image.id, 'user')).toBe(true);
  });
});
