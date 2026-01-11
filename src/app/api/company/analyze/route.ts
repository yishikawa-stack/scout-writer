
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { model } from "@/lib/ai";

/**
 * 企業資料（テキスト）をAIで解析してプロファイル情報を抽出するAPI
 * クライアント側でPDFから抽出されたテキストを受け取ります。
 */
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { text: extractedText } = await req.json();

        if (!extractedText || !extractedText.trim()) {
            return NextResponse.json({ error: "解析対象のテキストがありません。" }, { status: 400 });
        }

        // AIによる情報の構造化
        const truncatedText = extractedText.slice(0, 50000);

        const prompt = `
あなたは企業の採用コンサルタントです。提供された資料テキストから企業プロファイルを抽出し、JSON形式で出力してください。
Markdownタグや解説は含めず、純粋なJSONのみを返してください。

【抽出項目】
- name: 正式な会社名
- shortName: 会社名の略称（例：〇〇社、〇〇など。文章内で自然に使える形式）
- description: 300文字程度の紹介文
- features: 特徴（最大5つの配列）
- commonPositions: 募集職種（配列）
- idealCandidateBullets: 求める人物像（配列）
- selectionFlowText: 選考フローに関する記述

【資料テキスト】
${truncatedText}
`;

        const { text: aiResponse } = await generateText({
            model: model,
            prompt: prompt,
            temperature: 0.1,
        });

        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;

        try {
            const result = JSON.parse(jsonString);
            return NextResponse.json(result);
        } catch (e) {
            console.error("AI JSON Parse Error:", e);
            return NextResponse.json({ error: "AI解析結果の構造化に失敗しました。" }, { status: 500 });
        }

    } catch (error) {
        console.error("API Global Error:", error);
        return NextResponse.json({
            error: "解析処理中にエラーが発生しました。",
            detail: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
