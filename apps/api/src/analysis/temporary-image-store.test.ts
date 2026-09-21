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
    expect(store.size()).toBe(0);
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
