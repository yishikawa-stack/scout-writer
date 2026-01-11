
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { model } from "@/lib/ai";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        // Geminiへ渡すプロンプト
        const prompt = `
あなたは優秀な採用アシスタントです。
以下のテキストは、求人媒体や管理画面からコピー＆ペーストされた学生の情報です。
このテキストから、スカウト作成に必要な「学生プロフィール」と「エピソード（ガクチカ）」を抽出し、JSON形式で出力してください。

【抽出項目とルール】
- name: 氏名
- nameKana: 氏名のフリガナ（あれば）
- university: 大学名
- faculty: 学部・学科・専攻
- studentId: 管理番号やID
- strengthTags: 学生の強み（単語の配列）
- valueText: 大事にしている価値観や将来の目標
- notes: 面談メモ、特記事項、その他スカウトに関係しそうな全ての補足情報
- episodes: 活動実績（ガクチカ）の配列

【制約事項】
- JSON形式のみを出力してください。Markdownブロック(\`\`\`json)や余計な解説は一切不要です。
- 該当する情報がない項目は、空配列 [] または空文字 "" にしてください。
- 文脈から明らかに学生本人の情報ではないものは無視してください。

【出力JSONフォーマット】
{
  "name": "",
  "nameKana": "",
  "university": "",
  "faculty": "",
  "studentId": "",
  "strengthTags": [],
  "valueText": "",
  "notes": "",
  "episodes": [
    {
      "title": "エピソードのタイトル（簡潔に）",
      "detail": "取り組みの詳細",
      "achievementText": "実績・数値"
    }
  ]
}

【解析対象テキスト】
${text.slice(0, 50000)}
`;

        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
        }

        const { text: generatedText } = await generateText({
            model: model,
            prompt: prompt,
            temperature: 0.1,
        });

        console.log("AI Raw Response:", generatedText); // デバッグ用ログ

        // JSONブロック抽出の強化
        let jsonString = generatedText;
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonString = jsonMatch[0];
        }

        let result;
        try {
            result = JSON.parse(jsonString);
        } catch (e) {
            console.error("JSON Parse Error:", e, jsonString);
            return NextResponse.json({
                error: "AI抽出データのパースに失敗しました。",
                detail: e instanceof Error ? e.message : String(e),
                raw: generatedText
            }, { status: 500 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error("Error analyzing student text:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                detail: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
