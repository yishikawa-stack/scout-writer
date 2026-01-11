
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const positionId = parseInt(id);

    try {
        const json = await req.json();
        const { name, summary, duties, requirements, isActive } = json;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 権限チェック
        const existing = await prisma.position.findUnique({
            where: { id: positionId, companyId: user.companyId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Position not found" }, { status: 404 });
        }

        const updated = await prisma.position.update({
            where: { id: positionId },
            data: {
                name,
                summary,
                duties: JSON.stringify(duties || []),
                requirements: JSON.stringify(requirements || []),
                isActive: isActive !== undefined ? isActive : existing.isActive,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error updating position:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const positionId = parseInt(id);

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await prisma.position.delete({
            where: { id: positionId, companyId: user.companyId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting position:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
