-- CreateEnum
CREATE TYPE "MediaCategory" AS ENUM ('BOOK', 'MOVIE', 'ANIME', 'MUSIC', 'TV');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaEntry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "creator" TEXT NOT NULL DEFAULT '',
    "category" "MediaCategory" NOT NULL,
    "bookTypeId" TEXT,
    "coverUrl" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "opinion" TEXT NOT NULL DEFAULT '',
    "rating" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Want to explore',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,

    CONSTRAINT "CharacterTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomFrame" (
    "id" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RoomFrame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemoteIcon" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "imageUrl" TEXT,
    "glyph" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RemoteIcon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "BookType_userId_idx" ON "BookType"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BookType_userId_name_key" ON "BookType"("userId", "name");

-- CreateIndex
CREATE INDEX "MediaEntry_userId_category_idx" ON "MediaEntry"("userId", "category");

-- CreateIndex
CREATE INDEX "MediaEntry_bookTypeId_idx" ON "MediaEntry"("bookTypeId");

-- CreateIndex
CREATE INDEX "CharacterTag_entryId_kind_idx" ON "CharacterTag"("entryId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "RoomFrame_userId_slot_key" ON "RoomFrame"("userId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "RemoteIcon_userId_section_key" ON "RemoteIcon"("userId", "section");

-- AddForeignKey
ALTER TABLE "BookType" ADD CONSTRAINT "BookType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaEntry" ADD CONSTRAINT "MediaEntry_bookTypeId_fkey" FOREIGN KEY ("bookTypeId") REFERENCES "BookType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaEntry" ADD CONSTRAINT "MediaEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterTag" ADD CONSTRAINT "CharacterTag_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "MediaEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomFrame" ADD CONSTRAINT "RoomFrame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemoteIcon" ADD CONSTRAINT "RemoteIcon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
