
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

/**
 * ユーザープロフィールの取得
 */
export async function GET() {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error: any) {
        console.error("GET Profile Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * ユーザープロフィールの更新（名前・パスワード）
 */
export async function PUT(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const json = await req.json();
        const { name, currentPassword, newPassword } = json;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const updateData: any = {};

        // 名前のみ更新の場合
        if (name) {
            updateData.name = name;
        }

        // パスワード更新の場合
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: "現在のパスワードを入力してください" }, { status: 400 });
            }

            // 現在のパスワード確認
            const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isMatch) {
                return NextResponse.json({ error: "現在のパスワードが正しくありません" }, { status: 400 });
            }

            // 新しいパスワードのハッシュ化
            const salt = await bcrypt.genSalt(10);
            updateData.passwordHash = await bcrypt.hash(newPassword, salt);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "更新する内容がありません" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        return NextResponse.json({
            message: "プロフィールを更新しました",
            user: updatedUser,
        });
    } catch (error: any) {
        console.error("PUT Profile Error:", error);
        return NextResponse.json(
            { error: "更新に失敗しました", details: error.message },
            { status: 500 }
        );
    }
}
