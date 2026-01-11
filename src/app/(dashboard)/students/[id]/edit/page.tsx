
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface Episode {
    id?: number;
    title: string;
    detail: string;
    abstractComment: string;
    achievementText: string;
    tags: string[];
}

export default function EditStudentPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 学生基本情報
    const [name, setName] = useState("");
    const [nameKana, setNameKana] = useState("");
    const [university, setUniversity] = useState("");
    const [faculty, setFaculty] = useState("");
    const [notes, setNotes] = useState("");
    const [strengthTagsInput, setStrengthTagsInput] = useState("");
    const [valueText, setValueText] = useState("");
    const [episodes, setEpisodes] = useState<Episode[]>([]);

    useEffect(() => {
        // データ取得
        fetch(`/api/students/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (!data.error) {
                    setName(data.name);
                    setNameKana(data.nameKana || "");
                    setUniversity(data.university);
                    setFaculty(data.faculty || "");
                    setNotes(data.notes || "");
                    setStrengthTagsInput((data.strengthTags || []).join(" "));
                    setValueText(data.valueText || "");
                    setEpisodes(
                        data.episodes.map((ep: any) => ({
                            id: ep.id,
                            title: ep.title,
                            detail: ep.detail,
                            abstractComment: ep.abstractComment || "",
                            achievementText: ep.achievementText || "",
                            tags: ep.tags || [],
                        }))
                    );
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

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
        const tags = tagsInput.split("、").map((t) => t.trim()).filter(Boolean);
        const newEpisodes = [...episodes];
        newEpisodes[index] = { ...newEpisodes[index], tags };
        setEpisodes(newEpisodes);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
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

            const res = await fetch(`/api/students/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                alert("保存しました");
                router.push("/students");
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

    const handleDelete = async () => {
        if (!confirm("本当に削除しますか？この操作は取り消せません。")) return;

        try {
            const res = await fetch(`/api/students/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                alert("削除しました");
                router.push("/students");
            } else {
                alert("削除に失敗しました");
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました");
        }
    };

    if (loading) return <div className="text-center py-10">読み込み中...</div>;

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between px-4 sm:px-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        学生情報の編集
                    </h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                    >
                        削除する
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                1. 基本情報
                            </h3>
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
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                            <button
                                type="button"
                                onClick={addEpisode}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                                + エピソードを追加
                            </button>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
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
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                        {saving ? "保存中..." : "変更を保存する"}
                    </button>
                </div>
            </form>
        </div>
    );
}
