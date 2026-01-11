
"use client";

import { useState, useEffect } from "react";

interface Position {
    id: number;
    name: string;
    summary: string;
    duties: string[];
    requirements: string[];
    isActive: boolean;
}

export default function PositionsPage() {
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPos, setEditingPos] = useState<Position | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchPositions();
    }, []);

    const fetchPositions = async () => {
        try {
            const res = await fetch("/api/positions");
            const data = await res.json();
            if (!data.error) {
                setPositions(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingPos({
            id: 0,
            name: "",
            summary: "",
            duties: [""],
            requirements: [""],
            isActive: true,
        });
        setIsModalOpen(true);
    };

    const handleEdit = (pos: Position) => {
        setEditingPos({ ...pos });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("本当に削除しますか？")) return;
        try {
            const res = await fetch(`/api/positions/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchPositions();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPos) return;

        // 空リスト除去
        const duties = editingPos.duties.filter((d) => d.trim());
        const requirements = editingPos.requirements.filter((r) => r.trim());

        const payload = { ...editingPos, duties, requirements };
        const method = editingPos.id === 0 ? "POST" : "PUT";
        const url =
            editingPos.id === 0 ? "/api/positions" : `/api/positions/${editingPos.id}`;

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                setIsModalOpen(false);
                fetchPositions();
            } else {
                alert(`エラーが発生しました: ${data.details || data.error || "不明なエラー"}`);
            }
        } catch (error: any) {
            console.error(error);
            alert(`エラーが発生しました: ${error.message}`);
        }
    };

    // リスト操作ヘルパー
    const updateList = (field: "duties" | "requirements", index: number, value: string) => {
        if (!editingPos) return;
        const list = [...editingPos[field]];
        list[index] = value;
        setEditingPos({ ...editingPos, [field]: list });
    };
    const addToList = (field: "duties" | "requirements") => {
        if (!editingPos) return;
        setEditingPos({ ...editingPos, [field]: [...editingPos[field], ""] });
    };
    const removeFromList = (field: "duties" | "requirements", index: number) => {
        if (!editingPos) return;
        const list = [...editingPos[field]];
        list.splice(index, 1);
        setEditingPos({ ...editingPos, [field]: list });
    };

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between px-4 sm:px-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        ポジション管理
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        募集要項や業務内容を管理します。
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <button
                        onClick={handleCreate}
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                        新規ポジション作成
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">読み込み中...</div>
            ) : positions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">ポジションが登録されていません</p>
                    <button
                        onClick={handleCreate}
                        className="mt-4 text-indigo-600 font-medium hover:text-indigo-500"
                    >
                        新規作成する
                    </button>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {positions.map((pos) => (
                            <li key={pos.id} className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{pos.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{pos.summary}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(pos)}
                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium px-3 py-1 border border-indigo-200 rounded hover:bg-indigo-50"
                                    >
                                        編集
                                    </button>
                                    <button
                                        onClick={() => handleDelete(pos.id)}
                                        className="text-red-600 hover:text-red-900 text-sm font-medium px-3 py-1 border border-red-200 rounded hover:bg-red-50"
                                    >
                                        削除
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 簡易モーダル */}
            {isModalOpen && editingPos && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        {/* 背景オーバーレイ */}
                        <div
                            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                            aria-hidden="true"
                            onClick={() => setIsModalOpen(false)}
                        ></div>

                        {/* モーダル本体の配置用スペーサー */}
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                            &#8203;
                        </span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-50">
                            <form onSubmit={handleSubmit} className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 divider-b pb-2">
                                    {editingPos.id === 0 ? "新規ポジション作成" : "ポジション編集"}
                                </h3>

                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">ポジション名 *</label>
                                        <input
                                            type="text"
                                            required
                                            value={editingPos.name}
                                            onChange={(e) => setEditingPos({ ...editingPos, name: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="例: 営業職、エンジニアなど"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">概要 *</label>
                                        <textarea
                                            required
                                            rows={3}
                                            value={editingPos.summary}
                                            onChange={(e) => setEditingPos({ ...editingPos, summary: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="このポジションのミッションや特徴を記入してください"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">業務内容</label>
                                        {editingPos.duties.map((duty, idx) => (
                                            <div key={idx} className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={duty}
                                                    onChange={(e) => updateList("duties", idx, e.target.value)}
                                                    className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900"
                                                    placeholder="例: 新規顧客へのテレアポ"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromList("duties", idx)}
                                                    className="text-red-500 px-2 font-bold hover:bg-red-50 rounded"
                                                    title="削除"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addToList("duties")}
                                            className="mt-1 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                        >
                                            <span className="mr-1">+</span> 業務内容を追加
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">必要なスキル・要件</label>
                                        {editingPos.requirements.map((req, idx) => (
                                            <div key={idx} className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={req}
                                                    onChange={(e) => updateList("requirements", idx, e.target.value)}
                                                    className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900"
                                                    placeholder="例: コミュニケーション能力"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromList("requirements", idx)}
                                                    className="text-red-500 px-2 font-bold hover:bg-red-50 rounded"
                                                    title="削除"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addToList("requirements")}
                                            className="mt-1 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                        >
                                            <span className="mr-1">+</span> 要件を追加
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8 border-t pt-4 sm:flex sm:flex-row-reverse gap-3">
                                    <button
                                        type="submit"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:w-auto sm:text-sm"
                                    >
                                        この内容で保存する
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-6 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                                    >
                                        キャンセル
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
