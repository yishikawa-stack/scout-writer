
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// スカウト履歴一覧取得
export async function GET() {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const scouts = await prisma.scout.findMany({
            where: { companyId: user.companyId },
            include: {
                student: { select: { name: true, university: true } },
                position: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(scouts);
    } catch (error) {
        console.error("Error fetching scouts:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// スカウト保存
export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const json = await req.json();
        const { studentId, positionId, subject, body, status } = json;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const scout = await prisma.scout.create({
            data: {
                companyId: user.companyId,
                studentId: parseInt(studentId),
                positionId: parseInt(positionId),
                subject: subject || "スカウトメール",
                body,
                status: status || "DRAFT",
                episodeIds: "[]", // 今回は簡易的に空配列または使用したエピソードを記録するが、APIのbodyには含めていないため一旦空
            },
        });

        // 学生の最終スカウト日を更新
        await prisma.student.update({
            where: { id: parseInt(studentId) },
            data: { lastScoutedAt: new Date() },
        });

        return NextResponse.json(scout);
    } catch (error) {
        console.error("Error saving scout:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
