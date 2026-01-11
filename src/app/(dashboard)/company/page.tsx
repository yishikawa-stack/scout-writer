"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// クライアントサイドでのみ import するための型定義
import type * as PDFJS from "pdfjs-dist";

interface Company {
    id: number;
    name: string;
    shortName: string;
    recruiterSignature: string;
    description: string;
    features: string[];
    commonPositions: string[];
    idealCandidateBullets: string[];
    selectionFlowText: string;
    offerSpeedText: string;
}

export default function CompanyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [company, setCompany] = useState<Company | null>(null);

    useEffect(() => {
        fetch("/api/company")
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    console.error(data.error);
                } else {
                    setCompany(data);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !company) return;

        if (!confirm("資料を解析して企業情報を自動入力しますか？\n現在入力されている内容は上書きされます。")) {
            e.target.value = ""; // リセット
            return;
        }

        setAnalyzing(true);
        try {
            // 1. プロジェクト内の pdfjs-dist をクライアントサイドで動的インポート
            // Next.js (Turbopack) 環境で外部URLのimportがエラーになる問題を回避するため
            // node_modules 内のライブラリを標準的な方法で読み込みます。
            let pdfjsLib;
            try {
                // @ts-ignore
                pdfjsLib = await import("pdfjs-dist");

                // ワーカーの設定
                // Next.js の public フォルダから配信されるべきですが、
                // 今回は最も確実な「別プロセスを使わない(MainThread)ワーカー」設定または
                // CDNフォールバックではなく、npmライブラリ内参照を使用します。
                // 開発環境(Turbopack)では以下の設定が最も安定します。
                // @ts-ignore
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
            } catch (err: any) {
                console.error("PDF.js Load Error:", err);
                throw new Error(`PDF解析エンジンの初期化に失敗しました。\n詳細: ${err.message || String(err)}`);
            }

            // 2. ブラウザ側でPDFをテキストに変換
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

            let pdf;
            try {
                pdf = await loadingTask.promise;
            } catch (err: any) {
                console.error("PDF Parsing Error:", err);
                throw new Error(`PDFファイルの読み取りに失敗しました。ファイルが壊れているか、読み取れない形式の可能性があります。\n詳細: ${err.message || String(err)}`);
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
                throw new Error("PDFから文字を読み取れませんでした。画像形式(スキャンされたPDF)の可能性があります。");
            }

            // 3. 抽出したテキストをサーバー（AI）へ送る
            const res = await fetch("/api/company/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: fullText }),
            });

            const data = await res.json();

            if (res.ok) {
                setCompany({
                    ...company,
                    name: data.name || company.name,
                    shortName: data.shortName || company.shortName,
                    description: data.description || company.description,
                    features: data.features && data.features.length > 0 ? data.features : company.features,
                    commonPositions: data.commonPositions && data.commonPositions.length > 0 ? data.commonPositions : company.commonPositions,
                    idealCandidateBullets: data.idealCandidateBullets && data.idealCandidateBullets.length > 0 ? data.idealCandidateBullets : company.idealCandidateBullets,
                    selectionFlowText: data.selectionFlowText || company.selectionFlowText,
                });
                alert("自動入力が完了しました！内容を確認して保存してください。");
            } else {
                const errorMsg = data.error || "Unknown error";
                alert(`AI解析に失敗しました: ${errorMsg}`);
            }
        } catch (error: any) {
            console.error("Final catch error:", error);
            alert(`エラーが発生しました:\n${error.message || String(error)}`);
        } finally {
            setAnalyzing(false);
            e.target.value = ""; // リセット
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/company", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(company),
            });

            if (res.ok) {
                alert("保存しました");
                router.refresh();
            } else {
                alert("エラーが発生しました");
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました");
        } finally {
            setSaving(false);
        }
    };

    const addListItem = (field: keyof Company) => {
        if (!company) return;
        const list = company[field] as string[];
        setCompany({ ...company, [field]: [...list, ""] });
    };

    const updateListItem = (field: keyof Company, index: number, value: string) => {
        if (!company) return;
        const list = [...(company[field] as string[])];
        list[index] = value;
        setCompany({ ...company, [field]: list });
    };

    const removeListItem = (field: keyof Company, index: number) => {
        if (!company) return;
        const list = [...(company[field] as string[])];
        list.splice(index, 1);
        setCompany({ ...company, [field]: list });
    };

    if (loading) return <div className="text-center py-10">読み込み中...</div>;
    if (!company) return <div className="text-center py-10">エラーが発生しました</div>;

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between px-4 sm:px-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        企業プロファイル設定
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        スカウト文章の自動生成に使用する基本情報を設定します。
                    </p>
                </div>
            </div>

            {/* 自動解析アップロードエリア */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium text-indigo-900">📄 資料からAI自動入力</h3>
                    <p className="text-sm text-indigo-700 mt-1">
                        会社説明資料や中期経営計画書（PDF）をアップロードすると、AIが内容を解析して以下のフォームを自動入力します。
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <label className={`
                        relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                        ${analyzing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'}
                        focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500
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

            <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
                <div className="space-y-8 divide-y divide-gray-200 bg-white p-6 rounded-lg shadow">
                    {/* 基本情報 */}
                    <div>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-2 mb-4">
                                    1. 基本情報
                                </h3>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    会社名 <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        required
                                        value={company.name}
                                        onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2 text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    会社名（略称）
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        value={company.shortName || ""}
                                        onChange={(e) => setCompany({ ...company, shortName: e.target.value })}
                                        placeholder="例: 〇〇社"
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2 text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">
                                    採用担当者の署名 <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        required
                                        value={company.recruiterSignature || ""}
                                        onChange={(e) => setCompany({ ...company, recruiterSignature: e.target.value })}
                                        placeholder="例: 株式会社〇〇 採用担当の田中です！"
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2 text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 会社紹介 */}
                    <div className="pt-8">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-2 mb-4">
                            2. 会社紹介
                        </h3>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">
                                    会社紹介テキスト <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        rows={4}
                                        required
                                        value={company.description || ""}
                                        onChange={(e) => setCompany({ ...company, description: e.target.value })}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2 text-gray-900"
                                        placeholder="事業内容やミッションなどを入力してください"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 会社の特徴 */}
                    <div className="pt-8">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-2 mb-4">
                            3. 会社の特徴
                        </h3>
                        <div className="space-y-4">
                            {company.features.map((feature, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={feature}
                                        onChange={(e) => updateListItem("features", index, e.target.value)}
                                        className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2 text-gray-900"
                                        placeholder="例: 設立5年で売上300%成長"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeListItem("features", index)}
                                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => addListItem("features")}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                                + 特徴を追加
                            </button>
                        </div>
                    </div>

                    {/* 募集ポジション共通 */}
                    <div className="pt-8">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-2 mb-4">
                            4. 募集ポジション共通情報
                        </h3>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                よく使う職種名
                            </label>
                            <div className="space-y-4">
                                {company.commonPositions.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => updateListItem("commonPositions", index, e.target.value)}
                                            className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2 text-gray-900"
                                            placeholder="例: ソリューション営業"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeListItem("commonPositions", index)}
                                            className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addListItem("commonPositions")}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                    + 職種を追加
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                こんな方にぴったりです（求める人物像）
                            </label>
                            <div className="space-y-4">
                                {company.idealCandidateBullets.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => updateListItem("idealCandidateBullets", index, e.target.value)}
                                            className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2 text-gray-900"
                                            placeholder="例: 若いうちから裁量を持って働きたい方"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeListItem("idealCandidateBullets", index)}
                                            className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addListItem("idealCandidateBullets")}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                    + 人物像を追加
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 選考フロー */}
                    <div className="pt-8">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-2 mb-4">
                            5. 選考フロー・メッセージ
                        </h3>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">
                                    説明会・選考フローについて <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        rows={3}
                                        required
                                        value={company.selectionFlowText || ""}
                                        onChange={(e) => setCompany({ ...company, selectionFlowText: e.target.value })}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2 text-gray-900"
                                        placeholder="例: 会社説明会のあとは書類選考と面接2回を予定しています"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">
                                    内定までの期間（目安）
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        value={company.offerSpeedText || ""}
                                        onChange={(e) => setCompany({ ...company, offerSpeedText: e.target.value })}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2 text-gray-900"
                                        placeholder="例: 最短2週間で内定出しが可能です"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-5 pb-10">
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard")}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
                        >
                            {saving ? "保存中..." : "保存する"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
