
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const scoutId = parseInt(id);

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const scout = await prisma.scout.findUnique({
            where: { id: scoutId, companyId: user.companyId },
            include: {
                student: true,
                position: true,
            },
        });

        if (!scout) {
            return NextResponse.json({ error: "Scout not found" }, { status: 404 });
        }

        return NextResponse.json(scout);
    } catch (error) {
        console.error("Error fetching scout:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
