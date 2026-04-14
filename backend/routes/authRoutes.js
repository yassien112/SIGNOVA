import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';

export function createAuthRouter({ prisma, jwtSecret }) {
  const router = express.Router();

  router.post(
    '/register',
    asyncHandler(async (req, res) => {
      const { name, email, password, role } = req.body;
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, role }
      });

      const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });

      return res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        token
      });
    })
  );

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      await prisma.user.update({ where: { id: user.id }, data: { isOnline: true } });

      const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        token
      });
    })
  );

  return router;
}
