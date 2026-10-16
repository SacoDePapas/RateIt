import { prisma } from '../lib/prisma.js';
import { verifyToken } from '@clerk/backend';

const categories = { books: 'BOOK', movies: 'MOVIE', anime: 'ANIME', music: 'MUSIC', tv: 'TV' };

function bodyOf(request) {
  if (!request.body) return {};
  return typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
}

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

export default async function handler(request, response) {
  try {
    const userId = await authenticate(request);
    if (!userId) return response.status(401).json({ error: 'Missing or invalid Clerk session' });

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `${userId}@clerk.local`, displayName: userId },
    });

    if (request.method === 'GET') {
      const entries = await prisma.mediaEntry.findMany({
        where: { userId },
        include: { bookType: true, characters: true },
        orderBy: { createdAt: 'desc' },
      });
      return response.status(200).json(entries);
    }

    if (request.method === 'POST') {
      const body = bodyOf(request);
      const category = categories[body.category] || body.category;
      if (!categories[body.category] && !Object.values(categories).includes(category)) {
        return response.status(400).json({ error: 'Invalid media category' });
      }
      if (!body.title?.trim()) return response.status(400).json({ error: 'Title is required' });

      let bookTypeId;
      if (category === 'BOOK' && body.bookType?.trim()) {
        const bookType = await prisma.bookType.upsert({
          where: { userId_name: { userId, name: body.bookType.trim() } },
          update: {},
          create: { userId, name: body.bookType.trim() },
        });
        bookTypeId = bookType.id;
      }

      const characterNames = [
        ...(body.favorite || []).map(name => ({ name, kind: 'favorite' })),
        ...(body.disliked || []).map(name => ({ name, kind: 'disliked' })),
      ];
      const entry = await prisma.mediaEntry.create({
        data: {
          userId,
          title: body.title.trim(),
          creator: body.author || body.creator || '',
          category,
          bookTypeId,
          coverUrl: body.image || body.coverUrl || null,
          description: body.description || '',
          opinion: body.opinion || '',
          rating: Math.max(0, Math.min(5, Number(body.rating) || 0)),
          status: body.status || 'Want to explore',
          characters: { create: characterNames },
        },
        include: { bookType: true, characters: true },
      });
      return response.status(201).json(entry);
    }

    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Entries API failed', error);
    return response.status(500).json({ error: 'Unable to process entry' });
  }
}
