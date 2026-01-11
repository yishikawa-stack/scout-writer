"use client";

import { useState, useEffect } from "react";

// クライアントサイドでのみ import するための型定義
import type * as PDFJS from "pdfjs-dist";

interface GuidelineItem {
    category: "mindset" | "structure" | "ngWords";
    content: string;
}

export default function GuidelinesPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    // カテゴリごとのリスト管理
    const [mindsetList, setMindsetList] = useState<string[]>([]);
    const [structureList, setStructureList] = useState<string[]>([]);
    const [ngWordsList, setNgWordsList] = useState<string[]>([]);

    // 他の企業情報も保持しておく必要がある（APIがPUTで全更新のため）
    const [companyData, setCompanyData] = useState<any>(null);

    useEffect(() => {
        fetch("/api/company")
            .then((res) => res.json())
            .then((data) => {
                if (!data.error) {
                    setCompanyData(data);
                    const guidelines: GuidelineItem[] = data.scoutGuidelines || [];

                    setMindsetList(guidelines.filter(g => g.category === "mindset").map(g => g.content));
                    setStructureList(guidelines.filter(g => g.category === "structure").map(g => g.content));
                    setNgWordsList(guidelines.filter(g => g.category === "ngWords").map(g => g.content));
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        if (!companyData) return;
        setSaving(true);

        // ガイドラインを統合
        const guidelines: GuidelineItem[] = [
            ...mindsetList.filter(s => s.trim()).map(c => ({ category: "mindset", content: c }) as const),
            ...structureList.filter(s => s.trim()).map(c => ({ category: "structure", content: c }) as const),
            ...ngWordsList.filter(s => s.trim()).map(c => ({ category: "ngWords", content: c }) as const),
        ];

        // 送信データのクリーンアップ。
        // features 等が文字列として入っている可能性があるため、オブジェクトであることを保証する。
        try {
            const res = await fetch("/api/company", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...companyData,
                    scoutGuidelines: guidelines,
                }),
            });

            if (res.ok) {
                alert("保存しました！");
            } else {
                const errorData = await res.json();
                console.error("Save Error:", errorData);
                alert(`保存に失敗しました:\n${errorData.details || errorData.error || "Unknown error"}`);
            }
        } catch (error: any) {
            console.error(error);
            alert(`エラーが発生しました:\n${error.message || String(error)}`);
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("資料を解析してノウハウを自動入力しますか？\n現在入力されている内容は上書きされます。")) {
            e.target.value = "";
            return;
        }

        setAnalyzing(true);
        try {
            // 1. プロジェクト内の pdfjs-dist を動的インポート (企業情報で成功した方式)
            let pdfjsLib;
            try {
                // @ts-ignore
                pdfjsLib = await import("pdfjs-dist");
                // @ts-ignore
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
            } catch (err: any) {
                console.error("PDF.js Engine Load Error:", err);
                throw new Error(`PDF解析エンジンの初期化に失敗しました。ネット制限または環境の影響です。\n詳細: ${err.message || String(err)}`);
            }

            // 2. ブラウザ側でPDFテキストを抽出
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

            let pdf;
            try {
                pdf = await loadingTask.promise;
            } catch (err: any) {
                console.error("PDF Parse Error:", err);
                throw new Error(`PDFファイルの読み取りに失敗しました。詳細: ${err.message || String(err)}`);
            }

            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                // @ts-ignore
                const pageText = textContent.items.map((item: any) => item.str).join(" ");
                fullText += pageText + "\n";
            }

            if (!fullText.trim()) {
                throw new Error("PDFから文字を読み取れませんでした。");
            }

            // 3. AIによる解析リクエスト
            const res = await fetch("/api/guidelines/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: fullText }),
            });

            const data = await res.json();

            if (res.ok) {
                setMindsetList(data.mindset && data.mindset.length > 0 ? data.mindset : mindsetList);
                setStructureList(data.structure && data.structure.length > 0 ? data.structure : structureList);
                setNgWordsList(data.ngWords && data.ngWords.length > 0 ? data.ngWords : ngWordsList);
                alert("自動入力が完了しました！内容を確認して保存してください。");
            } else {
                throw new Error(data.details || data.error || "AI解析に失敗しました");
            }
        } catch (error: any) {
            console.error("Final catch error:", error);
            alert(`エラーが発生しました:\n${error.message || String(error)}`);
        } finally {
            setAnalyzing(false);
            e.target.value = "";
        }
    };

    const addDefaultItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[]) => {
        setter([...list, ""]);
    };

    const updateItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[], index: number, value: string) => {
        const newList = [...list];
        newList[index] = value;
        setter(newList);
    };

    const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[], index: number) => {
        const newList = [...list];
        newList.splice(index, 1);
        setter(newList);
    };

    if (loading) return <div className="text-center py-20">読み込み中...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="md:flex md:items-center md:justify-between px-4 sm:px-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        スカウト作成ノウハウ設定
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        AIがスカウト文章を作成する際に遵守すべき、あなた独自のルールやノウハウを設定します。
                    </p>
                </div>
            </div>

            {/* 自動解析アップロードエリア（企業情報ページと同じデザイン・方式） */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium text-emerald-900">📄 資料からノウハウを自動抽出</h3>
                    <p className="text-sm text-emerald-700 mt-1">
                        社内マニュアルや成功事例（PDF）をアップロードすると、AIが「心構え」「構成」「NG辞書」を自動作成します。
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <label className={`
                        relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                        ${analyzing ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'}
                        focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500
                    `}>
                        {analyzing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                解析中...
                            </>
                        ) : (
                            <>
                                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                資料を選択 (PDF)
                            </>
                        )}
                        <input
                            type="file"
                            accept=".pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={analyzing}
                            onChange={handleFileUpload}
                        />
                    </label>
                </div>
            </div>

            <div className="space-y-8">
                {/* 1. 基本スタンス */}
                <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            1. 基本スタンス・マインドセット
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {mindsetList.map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => updateItem(setMindsetList, mindsetList, idx, e.target.value)}
                                    className="flex-1 border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
                                    placeholder="例：学生に媚びず、対等なパートナーとして接する"
                                />
                                <button
                                    onClick={() => removeItem(setMindsetList, mindsetList, idx)}
                                    className="text-red-500 p-2 hover:bg-red-50 rounded"
                                >
                                    削除
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => addDefaultItem(setMindsetList, mindsetList)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            + ルールを追加
                        </button>
                    </div>
                </div>

                {/* 2. 構成ルール */}
                <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            2. 文章構成・テクニック
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {structureList.map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                                <textarea
                                    rows={2}
                                    value={item}
                                    onChange={(e) => updateItem(setStructureList, structureList, idx, e.target.value)}
                                    className="flex-1 border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
                                    placeholder="例：冒頭の挨拶の後、エピソードへの感想を必ず3行以上入れる"
                                />
                                <button
                                    onClick={() => removeItem(setStructureList, structureList, idx)}
                                    className="text-red-500 p-2 hover:bg-red-50 rounded self-start"
                                >
                                    削除
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => addDefaultItem(setStructureList, structureList)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            + ルールを追加
                        </button>
                    </div>
                </div>

                {/* 3. NGワード */}
                <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-red-900 bg-red-50">
                            3. NGワード・禁止事項
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {ngWordsList.map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => updateItem(setNgWordsList, ngWordsList, idx, e.target.value)}
                                    className="flex-1 border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
                                    placeholder="例：「アットホーム」という表現は使用不可"
                                />
                                <button
                                    onClick={() => removeItem(setNgWordsList, ngWordsList, idx)}
                                    className="text-red-500 p-2 hover:bg-red-50 rounded"
                                >
                                    削除
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => addDefaultItem(setNgWordsList, ngWordsList)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            + 禁止事項を追加
                        </button>
                    </div>
                </div>

                <div className="flex justify-end pb-10">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
                    >
                        {saving ? "保存中..." : "設定を保存して終了"}
                    </button>
                </div>
            </div>
        </div>
    );
}
