
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Episode {
    title: string;
    detail: string;
    abstractComment: string;
    achievementText: string;
    tags: string[];
}

export default function NewStudentPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const [analyzing, setAnalyzing] = useState(false);
    const [analyzeText, setAnalyzeText] = useState("");

    // 学生基本情報
    const [name, setName] = useState("");
    const [nameKana, setNameKana] = useState("");
    const [university, setUniversity] = useState("");
    const [faculty, setFaculty] = useState("");
    const [notes, setNotes] = useState("");
    const [strengthTagsInput, setStrengthTagsInput] = useState("");
    const [valueText, setValueText] = useState("");

    // エピソード（初期状態で空の1つを用意してもいいが、0からスタート）
    const [episodes, setEpisodes] = useState<Episode[]>([]);

    const handleAnalyze = async () => {
        if (!analyzeText.trim()) return;
        if (!confirm("テキストを解析して入力を自動化しますか？\n現在入力されている内容は上書きされます。")) return;

        setAnalyzing(true);
        try {
            const res = await fetch("/api/students/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: analyzeText }),
            });
            const data = await res.json();

            if (res.ok) {
                if (data.name) setName(data.name);
                if (data.nameKana) setNameKana(data.nameKana);
                if (data.university) setUniversity(data.university);
                if (data.faculty) setFaculty(data.faculty);
                if (data.strengthTags && Array.isArray(data.strengthTags)) {
                    setStrengthTagsInput(data.strengthTags.join(" "));
                }
                if (data.valueText) setValueText(data.valueText);

                // メモ欄にIDと詳細メモを統合
                let combinedNotes = "";
                if (data.studentId) combinedNotes += `【管理ID】${data.studentId}\n`;
                if (data.notes) combinedNotes += data.notes;
                if (combinedNotes) setNotes(combinedNotes);

                if (data.episodes && Array.isArray(data.episodes)) {
                    const newEpisodes = data.episodes.map((ep: any) => ({
                        title: ep.title || "",
                        detail: ep.detail || "",
                        abstractComment: "",
                        achievementText: ep.achievementText || "",
                        tags: [],
                    }));
                    setEpisodes(newEpisodes);
                }
                alert("自動入力が完了しました！");
            } else {
                const errorMsg = data.error || "Unknown error";
                const detailMsg = data.detail ? `\n詳細: ${data.detail}` : "";
                alert(`解析に失敗しました: ${errorMsg}${detailMsg}`);
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました");
        } finally {
            setAnalyzing(false);
        }
    };

    const addEpisode = () => {
        setEpisodes([
            ...episodes,
            {
                title: "",
                detail: "",
                abstractComment: "",
                achievementText: "",
                tags: [],
            },
        ]);
    };

    const updateEpisode = (index: number, field: keyof Episode, value: any) => {
        const newEpisodes = [...episodes];
        newEpisodes[index] = { ...newEpisodes[index], [field]: value };
        setEpisodes(newEpisodes);
    };

    const removeEpisode = (index: number) => {
        const newEpisodes = [...episodes];
        newEpisodes.splice(index, 1);
        setEpisodes(newEpisodes);
    };

    const updateEpisodeTags = (index: number, tagsInput: string) => {
        // コンマ区切りなどでタグ化する簡易実装。
        // 本来はタグ入力UIを使うと良いが、文字列配列として扱う
        // ここでは単純に文字列配列を保持するが、入力は「カンマ区切り」とする
        const tags = tagsInput.split("、").map(t => t.trim()).filter(Boolean);
        const newEpisodes = [...episodes];
        newEpisodes[index] = { ...newEpisodes[index], tags };
        setEpisodes(newEpisodes);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // 強みタグの処理（全角/半角スペースなどで分割）
            const strengthTags = strengthTagsInput
                .split(/[、,\s]+/)
                .map((t) => t.trim())
                .filter(Boolean);

            const payload = {
                name,
                nameKana,
                university,
                faculty,
                notes,
                strengthTags,
                valueText,
                episodes,
            };

            const res = await fetch("/api/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const newStudent = await res.json();
                router.push(`/students/${newStudent.id}/scout`); // 生成画面へ直接遷移
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

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between px-4 sm:px-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        学生情報の新規登録
                    </h2>
                </div>
            </div>

            {/* AI自動解析エリア */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-2">🤖 テキストから自動入力</h3>
                <p className="text-sm text-blue-700 mb-4">
                    求人媒体や管理画面のテキストを全選択して貼り付けてください。AIが氏名、ガクチカ、強みなどを自動抽出します。
                </p>
                <div className="space-y-4">
                    <textarea
                        rows={6}
                        value={analyzeText}
                        onChange={(e) => setAnalyzeText(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 placeholder-gray-400 text-gray-900"
                        placeholder="ここにテキストを貼り付けてください..."
                    />
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleAnalyze}
                            disabled={analyzing || !analyzeText.trim()}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-gray-400"
                        >
                            {analyzing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    解析中...
                                </>
                            ) : (
                                "AI解析を実行"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                1. 基本情報
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                スカウト対象となる学生の基本的なプロフィールを入力してください。
                            </p>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        氏名 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        氏名（カナ）
                                    </label>
                                    <input
                                        type="text"
                                        value={nameKana}
                                        onChange={(e) => setNameKana(e.target.value)}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        大学名 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={university}
                                        onChange={(e) => setUniversity(e.target.value)}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                        placeholder="例: 早稲田大学"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        学部・学科
                                    </label>
                                    <input
                                        type="text"
                                        value={faculty}
                                        onChange={(e) => setFaculty(e.target.value)}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                        placeholder="例: 商学部"
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label className="block text-sm font-medium text-gray-700">
                                        メモ（社内共有用）
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                2. 強み・価値観
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                AIが学生の特徴をつかむために重要な情報です。
                            </p>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    強みタグ（スペース区切りで入力）
                                </label>
                                <input
                                    type="text"
                                    value={strengthTagsInput}
                                    onChange={(e) => setStrengthTagsInput(e.target.value)}
                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                                    placeholder="リーダーシップ 粘り強さ ホスピタリティ"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    大事にしている価値観・ありたい姿
                                </label>
                                <textarea
                                    rows={4}
                                    value={valueText}
                                    onChange={(e) => setValueText(e.target.value)}
                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                                    placeholder="例: 「周囲を巻き込んで大きな成果を出したい」と考えている。"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                3. エピソード
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                学生のガクチカや自己PRを入力します。AIはこのエピソードを使ってスカウト文章を生成します。
                            </p>
                            <button
                                type="button"
                                onClick={addEpisode}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                                + エピソードを追加
                            </button>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                            {episodes.length === 0 && (
                                <div className="text-gray-500 text-sm italic py-4">
                                    エピソードが登録されていません。「エピソードを追加」ボタンを押して登録してください。
                                </div>
                            )}
                            {episodes.map((episode, index) => (
                                <div key={index} className="border rounded-md p-4 bg-gray-50 relative">
                                    <button
                                        type="button"
                                        onClick={() => removeEpisode(index)}
                                        className="absolute top-4 right-4 text-red-600 hover:text-red-800 text-sm"
                                    >
                                        削除
                                    </button>
                                    <h4 className="font-medium text-gray-900 mb-4">エピソード {index + 1}</h4>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                タイトル <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={episode.title}
                                                onChange={(e) => updateEpisode(index, "title", e.target.value)}
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                                placeholder="例: サッカー部でのチーム改革"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                具体的な内容 <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                rows={5}
                                                required
                                                value={episode.detail}
                                                onChange={(e) => updateEpisode(index, "detail", e.target.value)}
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                                placeholder="具体的な取り組み内容、苦労した点、工夫した点など"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                抽象化コメント（AIへのヒント）
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={episode.abstractComment}
                                                onChange={(e) => updateEpisode(index, "abstractComment", e.target.value)}
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                                placeholder="例: 粘り強さとリーダーシップを発揮している"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    実績（定量/定性）
                                                </label>
                                                <input
                                                    type="text"
                                                    value={episode.achievementText}
                                                    onChange={(e) => updateEpisode(index, "achievementText", e.target.value)}
                                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                                    placeholder="例: 全国大会ベスト8"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    関連タグ（「、」区切り）
                                                </label>
                                                <input
                                                    type="text"
                                                    value={episode.tags.join("、")}
                                                    onChange={(e) => updateEpisodeTags(index, e.target.value)}
                                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                                    placeholder="例: リーダーシップ、継続力"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pb-10">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    >
                        キャンセル
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
                    >
                        {saving ? "保存中..." : "保存してスカウト生成へ"}
                    </button>
                </div>
            </form>
        </div>
    );
}
