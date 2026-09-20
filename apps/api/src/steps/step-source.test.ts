import { describe, expect, it } from 'vitest';
import { createInMemoryStepRepository } from './step-repository.js';
import { MockStepSource } from './step-source.js';

describe('steps', () => {
  it('supports mock permission and idempotent non-decreasing sync', async () => {
    const source = new MockStepSource(1234);
    expect(await source.permission()).toBe('granted');
    const repository = createInMemoryStepRepository();
    const first = await repository.sync('user', '2026-01-01', 1234);
    const same = await repository.sync('user', '2026-01-01', 500);
    expect(same.steps).toBe(first.steps);
    expect((await repository.sync('user', '2026-01-01', 1500)).steps).toBe(
      1500,
    );
  });
});
