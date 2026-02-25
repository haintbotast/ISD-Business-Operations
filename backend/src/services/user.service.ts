import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { AppError } from '../types';
import type { CreateUserDto, UpdateUserDto, UserDto } from '../types';

const BCRYPT_ROUNDS = 12;

function toDto(user: {
  id: string;
  username: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}): UserDto {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

export const userService = {
  async list(): Promise<UserDto[]> {
    const users = await prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { username: 'asc' }],
      select: { id: true, username: true, displayName: true, role: true, isActive: true, createdAt: true },
    });
    return users.map(toDto);
  },

  async create(data: CreateUserDto): Promise<UserDto> {
    const exists = await prisma.user.findUnique({ where: { username: data.username } });
    if (exists) throw new AppError(409, 'USER_EXISTS', `Username "${data.username}" is already taken`);

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        displayName: data.displayName,
        role: data.role,
      },
      select: { id: true, username: true, displayName: true, role: true, isActive: true, createdAt: true },
    });
    return toDto(user);
  },

  async update(id: string, data: UpdateUserDto): Promise<UserDto> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: { id: true, username: true, displayName: true, role: true, isActive: true, createdAt: true },
    });
    return toDto(updated);
  },

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
  },
};
