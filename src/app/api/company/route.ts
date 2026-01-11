
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * データの「型汚染」を徹底的に剥ぎ取る。
 * 文字列の中にJSONが入っている場合、それが「本物のオブジェクト/配列」になるまで再帰的に剥がす。
 */
const deepParse = (val: any): any => {
    if (val === null || val === undefined) return [];
    if (typeof val === "string") {
        try {
            const trimmed = val.trim();
            if (!trimmed) return [];
            const parsed = JSON.parse(trimmed);
            return deepParse(parsed);
        } catch (e) {
            return val;
        }
    }
    return val;
};

/**
 * 送信または保存用に「純粋な配列またはオブジェクト」であることを保証する。
 */
const ensureValidData = (val: any) => {
    const parsed = deepParse(val);
    return (parsed && typeof parsed === "object") ? parsed : [];
};

/**
 * 企業情報の取得
 */
export async function GET() {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { company: true },
        });

        if (!user || !user.company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        const company = user.company;

        return NextResponse.json({
            ...company,
            features: ensureValidData(company.features),
            commonPositions: ensureValidData(company.commonPositions),
            idealCandidateBullets: ensureValidData(company.idealCandidateBullets),
            scoutGuidelines: ensureValidData(company.scoutGuidelines),
        });
    } catch (error) {
        console.error("GET Company Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * 企業情報の更新
 */
export async function PUT(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const json = await req.json();
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user || !user.companyId) {
            return NextResponse.json({ error: "User or Company not found" }, { status: 404 });
        }

        const {
            name,
            shortName,
            recruiterSignature,
            description,
            features,
            commonPositions,
            idealCandidateBullets,
            selectionFlowText,
            offerSpeedText,
            scoutGuidelines,
        } = json;

        // 【最重要】保存前に「何重もの文字列化」をすべて解体し、一重のJSON文字列にする
        const cleanFeatures = JSON.stringify(ensureValidData(features));
        const cleanPositions = JSON.stringify(ensureValidData(commonPositions));
        const cleanBullets = JSON.stringify(ensureValidData(idealCandidateBullets));
        const cleanGuidelines = JSON.stringify(ensureValidData(scoutGuidelines));

        const now = new Date().toISOString();
        const companyId = Number(user.companyId);

        // Prismaの update で「Invalid invocation」が出るのを防ぐため、
        // 生SQLを使用してDBを直接更新する。これにより型不整合のエラーをバイパスする。
        await prisma.$executeRawUnsafe(`
            UPDATE companies 
            SET 
                name = ?, 
                short_name = ?, 
                recruiter_signature = ?, 
                description = ?, 
                features = ?, 
                common_positions = ?, 
                ideal_candidate_bullets = ?, 
                selection_flow_text = ?, 
                offer_speed_text = ?, 
                scout_guidelines = ?, 
                updated_at = ? 
            WHERE id = ?
        `,
            name || "文字を記入",
            shortName || "文字を記入",
            recruiterSignature || "",
            description || "文字を記入",
            cleanFeatures,
            cleanPositions,
            cleanBullets,
            selectionFlowText || "文字を記入",
            offerSpeedText || "文字を記入",
            cleanGuidelines,
            now,
            companyId
        );

        // 更新後のデータを再取得
        const updatedCompany = await prisma.company.findUnique({
            where: { id: companyId }
        });

        if (!updatedCompany) {
            throw new Error("Failed to retrieve updated company");
        }

        return NextResponse.json({
            ...updatedCompany,
            features: ensureValidData(updatedCompany.features),
            commonPositions: ensureValidData(updatedCompany.commonPositions),
            idealCandidateBullets: ensureValidData(updatedCompany.idealCandidateBullets),
            scoutGuidelines: ensureValidData(updatedCompany.scoutGuidelines),
        });
    } catch (error: any) {
        console.error("CRITICAL SQL UPDATE ERROR:", error);
        return NextResponse.json(
            {
                error: "更新に失敗しました（生SQLエラー）",
                details: error.message || String(error)
            },
            { status: 500 }
        );
    }
}
