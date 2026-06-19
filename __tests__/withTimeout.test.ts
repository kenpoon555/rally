import { withTimeout } from '../src/utils/withTimeout';

describe('withTimeout', () => {
  it('resolves when promise settles before deadline', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 100, 'test')).resolves.toBe('ok');
  });

  it('rejects when promise exceeds deadline', async () => {
    await expect(
      withTimeout(
        new Promise((resolve) => {
          setTimeout(() => resolve('late'), 50);
        }),
        10,
        'slow'
      )
    ).rejects.toThrow('slow timed out after 10ms');
  });
});
