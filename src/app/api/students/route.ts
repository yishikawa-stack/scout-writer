
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 学生一覧取得
export async function GET(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q");

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const whereClause: any = {
            companyId: user.companyId,
        };

        if (search) {
            whereClause.OR = [
                { name: { contains: search } },
                { university: { contains: search } },
            ];
        }

        const students = await prisma.student.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
        });

        // タグなどをパースして返す
        const parsedStudents = students.map((student) => ({
            ...student,
            strengthTags: student.strengthTags
                ? JSON.parse(student.strengthTags)
                : [],
        }));

        return NextResponse.json(parsedStudents);
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// 学生新規作成
export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
            episodes, // エピソードも同時に登録可能にする
        } = json;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // トランザクションで学生とエピソードを同時に作成
        const newStudent = await prisma.$transaction(async (tx) => {
            const student = await tx.student.create({
                data: {
                    companyId: user.companyId,
                    name,
                    nameKana,
                    university,
                    faculty,
                    notes,
                    strengthTags: JSON.stringify(strengthTags || []),
                    valueText,
                },
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

        return NextResponse.json(newStudent);
    } catch (error) {
        console.error("Error creating student:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
