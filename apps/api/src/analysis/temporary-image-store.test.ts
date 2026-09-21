import { describe, expect, it } from 'vitest';
import { createTemporaryImageStore } from './temporary-image-store.js';

describe('temporary image store', () => {
  it('expires stale images and cleans them up', () => {
    let now = 1_000;
    const store = createTemporaryImageStore(() => now, 100);
    const image = store.put('file:///temporary.jpg');
    expect(store.get(image.id)).toBe('file:///temporary.jpg');
    now = 1_101;
    expect(store.get(image.id)).toBeUndefined();
    expect(store.size()).toBe(0);
  });

  it('deletes an image explicitly', () => {
    const store = createTemporaryImageStore(() => 1_000);
    const image = store.put('file:///temporary.jpg');
    expect(store.delete(image.id)).toBe(true);
    expect(store.get(image.id)).toBeUndefined();
  });
});
