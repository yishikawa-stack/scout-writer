
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// @ts-ignore
import type { PrismaClient } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "必要事項をすべて入力してください" },
                { status: 400 }
            );
        }

        // メールアドレスの重複チェック
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "このメールアドレスは既に登録されています" },
                { status: 400 }
            );
        }

        // パスワードのハッシュ化
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // トランザクションでユーザーと会社情報を一気に作成
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. 新しい会社データを作成 (Prismaの型エラー回避のため生SQLを使用)
            const companyFields = [
                "株式会社〇〇",
                "文字を記入",
                "文字を記入",
                JSON.stringify(["文字を記入"]),
                JSON.stringify(["文字を記入"]),
                JSON.stringify(["文字を記入"]),
                JSON.stringify({
                    mindset: ["文字を記入"],
                    structure: ["文字を記入"],
                    ngWords: ["文字を記入"]
                })
            ];

            await tx.$executeRawUnsafe(
                `INSERT INTO companies (
                    name, short_name, description, features, common_positions, ideal_candidate_bullets, scout_guidelines, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                ...companyFields
            );

            // 最後に挿入されたIDを取得
            const lastIdResult: any = await tx.$queryRawUnsafe(`SELECT last_insert_rowid() as id`);
            const companyId = Number(lastIdResult[0].id);

            // 2. ユーザーを作成
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash: passwordHash,
                    companyId: companyId,
                },
            });

            return { user, companyId };
        });

        return NextResponse.json({
            message: "ユーザー登録が完了しました",
            user: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
            },
        });
    } catch (error: any) {
        console.error("SIGNUP ERROR:", error);
        return NextResponse.json(
            {
                error: "サーバー内部でエラーが発生しました",
                details: error.message || String(error),
            },
            { status: 500 }
        );
    }
}
