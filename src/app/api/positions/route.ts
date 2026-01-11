
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ポジション一覧取得
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

        const positions = await prisma.position.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: "desc" },
        });

        const parsedPositions = positions.map((pos) => ({
            ...pos,
            duties: pos.duties ? JSON.parse(pos.duties) : [],
            requirements: pos.requirements ? JSON.parse(pos.requirements) : [],
        }));

        return NextResponse.json(parsedPositions);
    } catch (error: any) {
        console.error("Error fetching positions:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}

// ポジション新規作成
export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const json = await req.json();
        const { name, summary, duties, requirements } = json;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const position = await prisma.position.create({
            data: {
                companyId: user.companyId,
                name,
                summary,
                duties: JSON.stringify(duties || []),
                requirements: JSON.stringify(requirements || []),
                isActive: true,
            },
        });

        return NextResponse.json(position);
    } catch (error: any) {
        console.error("Error creating position:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
