
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { model } from "@/lib/ai";

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const json = await req.json();
        const { studentId, positionId } = json;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { company: true },
        });

        if (!user || !user.company) {
            return NextResponse.json({ error: "User or Company not found" }, { status: 404 });
        }

        const student = await prisma.student.findUnique({
            where: { id: parseInt(studentId), companyId: user.companyId },
            include: { episodes: true },
        });

        const position = await prisma.position.findUnique({
            where: { id: parseInt(positionId), companyId: user.companyId },
        });

        if (!student || !position) {
            return NextResponse.json({ error: "Student or Position not found" }, { status: 404 });
        }

        // データの準備
        const company = user.company;
        const companyFeatures = JSON.parse(company.features || "[]").join("、");
        const studentStrength = JSON.parse(student.strengthTags || "[]").join("、");

        // エピソードの結合（タイトルと詳細）
        const episodesText = student.episodes
            .map((ep, i) => `エピソード${i + 1}:【${ep.title}】\n内容: ${ep.detail}\n実績: ${ep.achievementText}\n`)
            .join("\n");

        const positionDuties = JSON.parse(position.duties || "[]").join("\n- ");
        const positionRequirements = JSON.parse(position.requirements || "[]").join("\n- ");

        // ガイドラインの準備
        const guidelines = company.scoutGuidelines ? JSON.parse(company.scoutGuidelines) : [];
        const mindsetList = guidelines.filter((g: any) => g.category === "mindset").map((g: any) => g.content);
        const structureList = guidelines.filter((g: any) => g.category === "structure").map((g: any) => g.content);
        const ngWordsList = guidelines.filter((g: any) => g.category === "ngWords").map((g: any) => g.content);

        const guidelineText = `
【重要：ユーザー定義ノウハウ】
以下のガイドラインを必ず遵守してください。
[基本スタンス・マインド]
${mindsetList.map((t: string) => `- ${t}`).join("\n")}

[構成ルール]
${structureList.map((t: string) => `- ${t}`).join("\n")}

[NGワード・禁止事項（絶対に使わないこと）]
${ngWordsList.map((t: string) => `- ${t}`).join("\n")}
`;

        // プロンプトの構築
        const prompt = `
你是プロの新卒採用スカウトライターです。
以下の情報を元に、学生一人ひとりに個別化された、魅力的なスカウトメールを作成してください。

${guidelineText}

【企業情報】
会社名: ${company.name}
特徴: ${companyFeatures}
紹介文: ${company.description}
採用担当: ${company.recruiterSignature}

【募集ポジション】
職種名: ${position.name}
概要: ${position.summary}
業務内容:
- ${positionDuties}
必須要件:
- ${positionRequirements}

【学生情報】
氏名: ${student.name}
大学: ${student.university} ${student.faculty}
強みタグ: ${studentStrength}
価値観: ${student.valueText}

【学生のエピソード（ガクチカ）】
${episodesText}

【作成指示】
以下の構成でスカウト文章を作成してください。件名は不要です。本文のみ作成してください。

1. **挨拶とアプローチ理由**: 「${student.university}の${student.name}様、はじめまして」から始め、なぜこの学生に声をかけたのか、エピソードや強み（${studentStrength}）に具体的に触れながら、「あなたの〇〇という点に非常に魅力を感じました」と伝えてください。ここが最も重要です。定型文に見えないよう、エピソードの具体的な内容を必ず引用してください。
2. **会社紹介**: 学生の価値観（${student.valueText}）や強みにリンクさせる形で、会社の魅力を簡潔に伝えてください。
3. **ポジション提案**: 今回募集している「${position.name}」が、学生にとってなぜおすすめなのか、キャリアの観点から提案してください。
4. **結び**: カジュアル面談への招待など、次のアクションを促してください。署名は「${company.recruiterSignature}」を使用してください。
5. **最重要項目**: 上記の【重要：ユーザー定義ノウハウ】で指定されたルールは、デフォルトの指示よりも優先して厳守してください。

文体は丁寧ですが、熱意が伝わるように少しエモーショナルにしてください。文字数は600〜800文字程度を目安にしてください。
`;

        // AI生成の実行
        const { text } = await generateText({
            model: model,
            prompt: prompt,
            temperature: 0.7,
        });

        return NextResponse.json({
            content: text,
            studentName: student.name,
            positionName: position.name
        });

    } catch (error) {
        console.error("Error generating scout:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
