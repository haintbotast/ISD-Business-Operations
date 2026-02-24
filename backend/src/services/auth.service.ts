import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError, JwtPayload } from '../types';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    role: string;
  };
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResult> {
    const user = await prisma.user.findUnique({ where: { username } });

    // Intentionally vague error message to prevent username enumeration
    if (!user || !user.isActive) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
    }

    const payload: JwtPayload = { id: user.id, username: user.username, role: user.role };
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError(500, 'INTERNAL_ERROR', 'Server misconfiguration');

    const token = jwt.sign(payload, secret, {
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as jwt.SignOptions['expiresIn'],
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    };
  },

  async getById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, isActive: true },
      select: { id: true, username: true, displayName: true, role: true },
    });
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    return user;
  },
};
