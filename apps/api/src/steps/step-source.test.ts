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
    expect(
      (await repository.sync('user', '2026-01-01', 1600, 'manual')).source,
    ).toBe('manual');
  });

  it('keeps users and local days isolated', async () => {
    const repository = createInMemoryStepRepository();
    await repository.sync('user-a', '2026-01-01', 100, 'manual');
    await repository.sync('user-a', '2026-01-02', 200, 'expo-pedometer');
    await repository.sync('user-b', '2026-01-01', 300, 'manual');
    expect((await repository.get('user-a', '2026-01-01'))?.steps).toBe(100);
    expect((await repository.get('user-a', '2026-01-02'))?.steps).toBe(200);
    expect((await repository.get('user-b', '2026-01-01'))?.steps).toBe(300);
  });
});
