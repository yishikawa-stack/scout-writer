
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState<{ type: "success" | "error"; content: string } | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/user/profile");
            const data = await res.json();
            if (res.ok) {
                setName(data.name);
                setEmail(data.email);
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ type: "error", content: "新しいパスワードが一致しません" });
            setSaving(false);
            return;
        }

        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    currentPassword: currentPassword || undefined,
                    newPassword: newPassword || undefined,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", content: "プロフィールを更新しました" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                // セッション（表示名）を更新
                await update({ name });
            } else {
                setMessage({ type: "error", content: data.error || "更新に失敗しました" });
            }
        } catch (error) {
            setMessage({ type: "error", content: "通信エラーが発生しました" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center py-20">読み込み中...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        マイページ
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        ご自身の登録情報の確認と変更ができます。
                    </p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-md ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.content}
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <form onSubmit={handleUpdateProfile} className="divide-y divide-gray-200">
                    <div className="px-4 py-5 sm:p-6 space-y-6">
                        {/* 基本情報 */}
                        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">登録名（アカウント名）</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">登録メールアドレス</label>
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="mt-1 block w-full border border-gray-100 bg-gray-50 rounded-md shadow-sm p-2 text-gray-500 cursor-not-allowed"
                                    title="メールアドレスは変更できません"
                                />
                                <p className="mt-1 text-xs text-gray-400">※メールアドレスの変更は管理者にお問い合わせください。</p>
                            </div>
                        </div>

                        <hr />

                        {/* パスワード変更 */}
                        <div className="space-y-4 pt-2">
                            <h3 className="text-lg font-medium text-gray-900">パスワードの変更</h3>
                            <p className="text-sm text-gray-500">パスワードを変更する場合のみ入力してください。</p>

                            <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">現在のパスワード</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                                        autoComplete="current-password"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">新しいパスワード</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                                        autoComplete="new-password"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">新しいパスワード（確認用）</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-4 py-4 sm:px-6 bg-gray-50 text-right">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {saving ? "更新中..." : "登録情報を更新する"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
