import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UserDao } from '../dao/user.dao.js';
import { User } from '../entities/user.entity.js';

vi.mock('bcrypt', () => ({ hash: vi.fn().mockResolvedValue('hashed-password') }));

describe('UsersService', () => {
  const activeUser = {
    id: 1,
    name: 'Ana Pérez',
    email: 'ana@example.com',
    passwordHash: 'stored-hash',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  } as User;

  const buildService = () => {
    const userDao = {
      findAll: vi.fn().mockResolvedValue([activeUser]),
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(activeUser),
      update: vi.fn().mockResolvedValue(activeUser),
      softDelete: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue(undefined),
    } as unknown as UserDao;
    return { service: new UsersService(userDao), userDao };
  };

  it('creates a user with a hashed password and never returns the hash', async () => {
    const { service, userDao } = buildService();
    const result = await service.create({
      name: 'Ana Pérez',
      email: 'ana@example.com',
      password: 'password-123',
    });

    expect(userDao.create).toHaveBeenCalledWith({
      name: 'Ana Pérez',
      email: 'ana@example.com',
      passwordHash: 'hashed-password',
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects a duplicate email, including one belonging to a deleted user', async () => {
    const { service, userDao } = buildService();
    vi.mocked(userDao.findByEmail).mockResolvedValue(activeUser);

    await expect(
      service.create({ name: 'Ana Pérez', email: 'ana@example.com', password: 'password-123' }),
    ).rejects.toThrow(ConflictException);
  });

  it('lists active users by default and maps them to response DTOs', async () => {
    const { service, userDao } = buildService();
    const result = await service.findAll();

    expect(userDao.findAll).toHaveBeenCalledWith(false);
    expect(result[0]).not.toHaveProperty('passwordHash');
  });

  it('updates supplied fields and hashes a new password', async () => {
    const { service, userDao } = buildService();
    vi.mocked(userDao.findById).mockResolvedValue(activeUser);

    await service.update(1, { name: 'Ana María', password: 'new-password' });

    expect(userDao.update).toHaveBeenCalledWith(activeUser, {
      name: 'Ana María',
      passwordHash: 'hashed-password',
    });
  });

  it('soft deletes an active user and returns its deletion timestamp', async () => {
    const { service, userDao } = buildService();
    vi.mocked(userDao.findById)
      .mockResolvedValueOnce(activeUser)
      .mockResolvedValueOnce({ ...activeUser, deletedAt: new Date() });

    const result = await service.remove(1);

    expect(userDao.softDelete).toHaveBeenCalledWith(1);
    expect(result.deletedAt).toBeInstanceOf(Date);
  });

  it('restores a deleted user and rejects restoration of an active user', async () => {
    const { service, userDao } = buildService();
    vi.mocked(userDao.findById)
      .mockResolvedValueOnce({ ...activeUser, deletedAt: new Date() })
      .mockResolvedValueOnce(activeUser);

    await expect(service.restore(1)).resolves.toMatchObject({ id: 1, deletedAt: null });
    expect(userDao.restore).toHaveBeenCalledWith(1);

    vi.mocked(userDao.findById).mockResolvedValueOnce(activeUser);
    await expect(service.restore(1)).rejects.toThrow(BadRequestException);
  });

  it('throws conflict exception when trying to change email to a different one', async () => {
    const { service, userDao } = buildService();
    vi.mocked(userDao.findById).mockResolvedValue(activeUser);

    await expect(service.update(1, { email: 'different@example.com' })).rejects.toThrow(ConflictException);
  });

  it('allows updating with the same email without throwing conflict', async () => {
    const { service, userDao } = buildService();
    vi.mocked(userDao.findById).mockResolvedValue(activeUser);

    await expect(service.update(1, { email: 'ana@example.com' })).resolves.toBeDefined();
  });

  it('throws not found when restoring a user that does not exist', async () => {
    const { service, userDao } = buildService();
    vi.mocked(userDao.findById).mockResolvedValue(null);

    await expect(service.restore(999)).rejects.toThrow(NotFoundException);
  });

  it('throws not found when an active user does not exist', async () => {
    const { service, userDao } = buildService();
    vi.mocked(userDao.findById).mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
