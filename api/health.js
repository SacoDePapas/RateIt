import { prisma } from '../lib/prisma.js';

export default async function handler(_request, response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Database health check failed', error);
    return response.status(500).json({ ok: false, error: 'Database unavailable' });
  }
}
