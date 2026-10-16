import { prisma } from '../lib/prisma.js';
import { verifyToken } from '@clerk/backend';

const categories = { books: 'BOOK', movies: 'MOVIE', anime: 'ANIME', music: 'MUSIC', tv: 'TV' };

function bodyOf(request) {
  if (!request.body) return {};
  return typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
}

function entryId(request) {
  return request.query?.id || new URL(request.url, 'http://localhost').searchParams.get('id');
}

function normalizeCategory(value) {
  return categories[value] || (Object.values(categories).includes(value) ? value : null);
}

function characterData(body) {
  return [
    ...(Array.isArray(body.favorite) ? body.favorite : []).filter(Boolean).map(name => ({ name: String(name), kind: 'favorite' })),
    ...(Array.isArray(body.disliked) ? body.disliked : []).filter(Boolean).map(name => ({ name: String(name), kind: 'disliked' })),
  ];
}

function mediaData(body, category, bookTypeId) {
  return {
    title: body.title.trim(),
    creator: body.author || body.creator || '',
    category,
    bookTypeId: category === 'BOOK' ? bookTypeId || null : null,
    coverUrl: body.image || body.coverUrl || null,
    description: body.description || '',
    opinion: body.opinion || '',
    rating: Math.max(0, Math.min(5, Number(body.rating) || 0)),
    status: body.status || 'Want to explore',
  };
}

async function resolveBookTypeId(userId, body, currentId = null) {
  if (!body.bookType?.trim()) return currentId;
  const bookType = await prisma.bookType.upsert({
    where: { userId_name: { userId, name: body.bookType.trim() } },
    update: {},
    create: { userId, name: body.bookType.trim() },
  });
  return bookType.id;
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
      const id = entryId(request);
      const entries = await prisma.mediaEntry.findMany({
        where: { userId, ...(id ? { id } : {}) },
        include: { bookType: true, characters: true },
        orderBy: { createdAt: 'desc' },
      });
      if (id && !entries[0]) return response.status(404).json({ error: 'Entry not found' });
      return response.status(200).json(id ? entries[0] : entries);
    }

    if (request.method === 'POST') {
      const body = bodyOf(request);
      const category = normalizeCategory(body.category);
      if (!category) {
        return response.status(400).json({ error: 'Invalid media category' });
      }
      if (!body.title?.trim()) return response.status(400).json({ error: 'Title is required' });
      const bookTypeId = category === 'BOOK' ? await resolveBookTypeId(userId, body) : null;
      const entry = await prisma.mediaEntry.create({
        data: { userId, ...mediaData(body, category, bookTypeId), characters: { create: characterData(body) } },
        include: { bookType: true, characters: true },
      });
      return response.status(201).json(entry);
    }

    if (request.method === 'PATCH' || request.method === 'PUT') {
      const id = entryId(request);
      if (!id) return response.status(400).json({ error: 'Entry id is required' });
      const body = bodyOf(request);
      if (!body.title?.trim()) return response.status(400).json({ error: 'Title is required' });
      const existing = await prisma.mediaEntry.findFirst({ where: { id, userId } });
      if (!existing) return response.status(404).json({ error: 'Entry not found' });
      const category = normalizeCategory(body.category) || existing.category;
      const bookTypeId = category === 'BOOK' ? await resolveBookTypeId(userId, body, existing.bookTypeId) : null;
      const entry = await prisma.mediaEntry.update({
        where: { id },
        data: {
          ...mediaData(body, category, bookTypeId),
          characters: { deleteMany: {}, create: characterData(body) },
        },
        include: { bookType: true, characters: true },
      });
      return response.status(200).json(entry);
    }

    if (request.method === 'DELETE') {
      const id = entryId(request);
      if (!id) return response.status(400).json({ error: 'Entry id is required' });
      const existing = await prisma.mediaEntry.findFirst({ where: { id, userId } });
      if (!existing) return response.status(404).json({ error: 'Entry not found' });
      await prisma.mediaEntry.delete({ where: { id } });
      return response.status(204).end();
    }

    response.setHeader('Allow', 'GET, POST, PATCH, PUT, DELETE');
    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Entries API failed', error);
    return response.status(500).json({ error: 'Unable to process entry' });
  }
}
