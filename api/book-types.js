import { prisma } from '../lib/prisma.js';
import { verifyToken } from '@clerk/backend';

async function authenticate(request) {
  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) return null;
  const verifiedToken = await verifyToken(token, {
    jwtKey: process.env.CLERK_JWT_KEY,
    authorizedParties: (process.env.CLERK_AUTHORIZED_PARTIES || '').split(',').map(value => value.trim()).filter(Boolean),
  });
  return verifiedToken.sub;
}

function bodyOf(request) {
  if (!request.body) return {};
  return typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
}

export default async function handler(request, response) {
  try {
    const userId = await authenticate(request);
    if (!userId) return response.status(401).json({ error: 'Missing or invalid Clerk session' });

    if (request.method === 'GET') {
      const types = await prisma.bookType.findMany({ where: { userId }, orderBy: { name: 'asc' } });
      return response.status(200).json(types);
    }

    if (request.method === 'POST') {
      const name = bodyOf(request).name?.trim();
      if (!name) return response.status(400).json({ error: 'Book type name is required' });
      const type = await prisma.bookType.upsert({
        where: { userId_name: { userId, name } },
        update: {},
        create: { userId, name },
      });
      return response.status(201).json(type);
    }

    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Book types API failed', error);
    return response.status(500).json({ error: 'Unable to process book type' });
  }
}
