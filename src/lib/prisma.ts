// Prismaクライアントの共通インスタンス
// Prisma 7 + SQLite (libSQL) アダプター構成

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    // Vercel (Postgres) 環境では DATABASE_URL をそのまま使用
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
        return new PrismaClient();
    }

    // ローカル (SQLite) 環境向けの既存設定
    const adapter = new PrismaLibSql({
        url: `file:./dev.db`,
    });
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
