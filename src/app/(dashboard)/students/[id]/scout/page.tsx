
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Position {
    id: number;
    name: string;
}

export default function ScoutGeneratePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [student, setStudent] = useState<any>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [selectedPositionId, setSelectedPositionId] = useState<string>("");

    // 生成結果
    const [generatedSubject, setGeneratedSubject] = useState("");
    const [generatedBody, setGeneratedBody] = useState("");
    const [isGenerated, setIsGenerated] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentRes, positionRes] = await Promise.all([
                    fetch(`/api/students/${id}`),
                    fetch("/api/positions"),
                ]);

                const studentData = await studentRes.json();
                const positionData = await positionRes.json();

                if (studentData.error) throw new Error(studentData.error);

                setStudent(studentData);
                setPositions(positionData);
                if (positionData.length > 0) {
                    setSelectedPositionId(positionData[0].id.toString());
                }
            } catch (error) {
                console.error(error);
                alert("データの読み込みに失敗しました");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleGenerate = async () => {
        if (!selectedPositionId) return;
        setGenerating(true);
        setGeneratedBody(""); // クリア
        setIsGenerated(false);

        try {
            const res = await fetch("/api/scouts/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: id,
                    positionId: selectedPositionId,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setGeneratedBody(data.content);
                // 件名は簡易的に生成
                setGeneratedSubject(`【特別スカウト】${data.studentName}様へ特別なオファーのご案内`);
                setIsGenerated(true);
            } else {
                alert("生成に失敗しました: " + data.error);
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました");
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async (status: "DRAFT" | "SENT") => {
        if (!isGenerated) return;

        try {
            const res = await fetch("/api/scouts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: id,
                    positionId: selectedPositionId,
                    subject: generatedSubject,
                    body: generatedBody,
                    status,
                }),
            });

            if (res.ok) {
                const message = status === "SENT" ? "スカウトを送信済みとして保存しました" : "下書き保存しました";
                alert(message);
                router.push("/scouts");
            } else {
                alert("保存に失敗しました");
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました");
        }
    };

    if (loading) return <div className="text-center py-20">読み込み中...</div>;
    if (!student) return <div className="text-center py-20">学生データが見つかりません</div>;

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between px-4 sm:px-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        スカウト文章生成
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {student.name} ({student.university}) 宛のスカウトを作成します。
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左カラム：設定 */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">生成設定</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    募集ポジション
                                </label>
                                <select
                                    value={selectedPositionId}
                                    onChange={(e) => setSelectedPositionId(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                                >
                                    {positions.map((pos) => (
                                        <option key={pos.id} value={pos.id}>
                                            {pos.name}
                                        </option>
                                    ))}
                                </select>
                                {positions.length === 0 && (
                                    <p className="mt-2 text-sm text-red-600">
                                        ポジションが登録されていません。<Link href="/positions" className="underline">登録はこちら</Link>
                                    </p>
                                )}
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating || positions.length === 0}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400 transition-colors"
                                >
                                    {generating ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            AI生成中...
                                        </span>
                                    ) : (
                                        "スカウト文章を生成する"
                                    )}
                                </button>
                                <p className="mt-2 text-xs text-gray-500 text-center">
                                    生成には数秒〜数十秒かかる場合があります。
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 学生情報のサマリ */}
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">学生情報サマリ</h3>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-gray-500">強みタグ</dt>
                                <dd className="font-medium flex flex-wrap gap-1 mt-1">
                                    {student.strengthTags.map((tag: string, i: number) => (
                                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            {tag}
                                        </span>
                                    ))}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">価値観リスト</dt>
                                <dd className="text-gray-900 mt-1">{student.valueText}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">エピソード数</dt>
                                <dd className="text-gray-900 mt-1">{student.episodes.length}件</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* 右カラム：生成結果エディタ */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow sm:rounded-lg p-6 h-full flex flex-col">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">生成結果・編集</h3>

                        {generating ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-lg">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                                <p className="text-gray-500">AIが学生の情報を分析し、最適な文章を書いています...</p>
                                <p className="text-xs text-gray-400 mt-2">（約10〜30秒お待ちください）</p>
                            </div>
                        ) : !isGenerated ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 query-dashed border-gray-200 rounded-lg bg-gray-50">
                                <p className="text-gray-500">左側のボタンからスカウト文章を生成してください。</p>
                            </div>
                        ) : (
                            <div className="space-y-4 flex-1 flex flex-col">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">件名</label>
                                    <input
                                        type="text"
                                        value={generatedSubject}
                                        onChange={(e) => setGeneratedSubject(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 font-medium"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700">本文</label>
                                    <textarea
                                        value={generatedBody}
                                        onChange={(e) => setGeneratedBody(e.target.value)}
                                        className="mt-1 block w-full h-[500px] border border-gray-300 rounded-md shadow-sm p-4 font-mono text-sm leading-relaxed resize-none bg-white text-gray-900 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => handleSave("DRAFT")}
                                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                    >
                                        下書き preservation
                                    </button>
                                    <button
                                        onClick={() => handleSave("SENT")}
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                    >
                                        送信済みとして保存
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
