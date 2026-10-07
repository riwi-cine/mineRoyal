import { RedisService } from './redis.service.js';
import type { Redis } from 'ioredis';

describe('RedisService', () => {
  it('rotates a stored token value atomically with an expiry', async () => {
    const client = {
      on: vi.fn(),
      eval: vi.fn().mockResolvedValue(1),
    } as unknown as Redis;
    const service = new RedisService(client);

    await expect(service.rotateValue('auth:session:session-1', 'old-hash', 'new-hash', 600)).resolves.toBe(true);

    const [script, keyCount, key, currentValue, nextValue, ttl] = vi.mocked(client.eval).mock.calls[0];
    expect(script).toContain("redis.call('GET', KEYS[1]) == ARGV[1]");
    expect(script).toContain("redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])");
    expect([keyCount, key, currentValue, nextValue, ttl]).toEqual([
      1,
      'auth:session:session-1',
      'old-hash',
      'new-hash',
      600,
    ]);

    vi.mocked(client.eval).mockResolvedValue(0);
    await expect(service.rotateValue('auth:session:session-1', 'old-hash', 'new-hash', 600)).resolves.toBe(false);
  });
});
