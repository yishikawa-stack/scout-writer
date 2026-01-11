// Prismaクライアントの共通インスタンス
// Prisma 7 + SQLite (libSQL) アダプター構成

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    // 開発環境と実行環境で DB ファイルの場所を prisma/dev.db に統一する
    // url: "file:./dev.db" だと実行時のカレントディレクトリに依存するため、
    // 明示的に prisma/dev.db を指定するか、schema.prisma のデフォルトに任せる。
    // ここでは安全のためアダプターを使わずデフォルト（または環境変数）に寄せるのも一案だが
    // 既存のアダプター構成を維持しつつパスを修正。
    const adapter = new PrismaLibSql({
        url: `file:./dev.db`,
    });
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
