import { model } from "@/lib/ai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "テキストが空です" }, { status: 400 });
        }

        const prompt = `
あなたは優秀な採用・広報コンサルタントです。提供された資料（スカウト作成のノウハウやガイドライン、研修資料）から、スカウト文を作成する際に役立つ情報を抽出し、以下のJSON形式で整理してください。

【抽出ルール】
1. mindset: スカウトを送る際の「心構え」「スタンス」「学生に対する姿勢」などをリストアップしてください。
2. structure: 文章の「構成」「具体的なテクニック」「盛り込むべき要素」などをリストアップしてください。
3. ngWords: 「使ってはいけない言葉」「避けるべき表現」「注意点」などをリストアップしてください。

Markdownタグや解説は含めず、純粋なJSONのみを返してください。
値はすべて文字列の配列（string[]）にしてください。

【出力フォーマット】
{
  "mindset": ["心構え1", "心構え2"],
  "structure": ["構成ルール1", "構成ルール2"],
  "ngWords": ["NGワード1", "注意点1"]
}

【対象資料】
${text}
`;

        const { text: responseText } = await generateText({
            model: model,
            prompt: prompt,
        });

        // JSONをパースして返す
        try {
            const cleanJson = responseText.replace(/```json|```/g, "").trim();
            const data = JSON.parse(cleanJson);
            return NextResponse.json(data);
        } catch (e) {
            console.error("AI Response JSON Parse Error. Response:", responseText);
            return NextResponse.json({ error: "AIの応答を解析できませんでした" }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Guidelines Analyze API Full Error:", error);
        return NextResponse.json({
            error: "サーバー側でエラーが発生しました",
            details: error.message || String(error)
        }, { status: 500 });
    }
}
