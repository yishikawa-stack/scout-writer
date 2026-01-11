
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Scout {
    id: number;
    subject: string;
    body: string;
    status: "DRAFT" | "SENT";
    createdAt: string;
    student: {
        name: string;
        university: string;
    };
    position: {
        name: string;
    };
}

export default function ScoutHistoryPage() {
    const [scouts, setScouts] = useState<Scout[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/scouts")
            .then((res) => res.json())
            .then((data) => {
                if (!data.error) {
                    setScouts(data);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-center py-20">読み込み中...</div>;

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between px-4 sm:px-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        スカウト履歴
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        作成したスカウトメールの履歴です。
                    </p>
                </div>
            </div>

            {scouts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">スカウト履歴がありません</p>
                    <div className="mt-4">
                        <Link
                            href="/students"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                        >
                            学生一覧から作成する
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {scouts.map((scout) => (
                            <li key={scout.id} className="block hover:bg-gray-50">
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-indigo-600 truncate">
                                            {scout.subject || "(件名なし)"}
                                        </p>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${scout.status === "SENT"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                            >
                                                {scout.status === "SENT" ? "送信済" : "下書き"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                To: {scout.student.name} ({scout.student.university})
                                            </p>
                                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                Position: {scout.position.name}
                                            </p>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                            <p>
                                                作成日: {new Date(scout.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 line-clamp-2">{scout.body}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
