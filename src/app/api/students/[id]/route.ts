
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 学生詳細取得
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const student = await prisma.student.findUnique({
            where: {
                id: studentId,
                companyId: user.companyId, // 自社の学生のみ参照可能
            },
            include: {
                episodes: true,
            },
        });

        if (!student) {
            return NextResponse.json(
                { error: "Student not found" },
                { status: 404 }
            );
        }

        // パースして返す
        const parsedStudent = {
            ...student,
            strengthTags: student.strengthTags
                ? JSON.parse(student.strengthTags)
                : [],
            episodes: student.episodes.map((ep) => ({
                ...ep,
                tags: ep.tags ? JSON.parse(ep.tags) : [],
            })),
        };

        return NextResponse.json(parsedStudent);
    } catch (error) {
        console.error("Error fetching student:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// 学生更新
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const studentId = parseInt(id);

    try {
        const json = await req.json();
        const {
            name,
            nameKana,
            university,
            faculty,
            notes,
            strengthTags,
            valueText,
            episodes,
        } = json;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 更新処理（トランザクション）
        // エピソードは全削除→全再作成がシンプルだが、IDが変わると不都合がある場合はupdate/createを使い分ける。
        // 今回はシンプルに、既存エピソードを削除して再作成する方針でいく（仕様書上そこまで複雑な要件がないため）

        // まず権限チェック
        const existingStudent = await prisma.student.findUnique({
            where: { id: studentId, companyId: user.companyId },
        });

        if (!existingStudent) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        const updatedStudent = await prisma.$transaction(async (tx) => {
            // 学生情報の更新
            const student = await tx.student.update({
                where: { id: studentId },
                data: {
                    name,
                    nameKana,
                    university,
                    faculty,
                    notes,
                    strengthTags: JSON.stringify(strengthTags || []),
                    valueText,
                },
            });

            // エピソードの更新（既存を削除して再登録）
            // ※注意: IDが変わるため、スカウト履歴などでエピソードIDを参照している場合は問題になる可能性があるが、
            // 今回のスカウト履歴にはエピソードID配列しか保存しない想定なので、表示用データとしてはスカウトテーブルに保存済みテキストを使うため影響小と判断。
            await tx.studentEpisode.deleteMany({
                where: { studentId: student.id },
            });

            if (episodes && Array.isArray(episodes)) {
                for (const episode of episodes) {
                    await tx.studentEpisode.create({
                        data: {
                            studentId: student.id,
                            title: episode.title,
                            detail: episode.detail,
                            abstractComment: episode.abstractComment,
                            achievementText: episode.achievementText,
                            tags: JSON.stringify(episode.tags || []),
                        },
                    });
                }
            }

            return student;
        });

        return NextResponse.json(updatedStudent);
    } catch (error) {
        console.error("Error updating student:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// 学生削除
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const studentId = parseInt(id);

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 削除（カスケード削除設定によりエピソードも消えるはずだが明示的にチェックも可）
        await prisma.student.delete({
            where: {
                id: studentId,
                companyId: user.companyId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting student:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
