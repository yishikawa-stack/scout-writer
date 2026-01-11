
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Student {
    id: number;
    name: string;
    university: string;
    faculty: string;
    strengthTags: string[];
    createdAt: string;
    lastScoutedAt: string | null;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const router = useRouter();

    const fetchStudents = async (searchQuery = "") => {
        setLoading(true);
        try {
            const url = searchQuery
                ? `/api/students?q=${encodeURIComponent(searchQuery)}`
                : "/api/students";
            const res = await fetch(url);
            const data = await res.json();
            if (!data.error) {
                setStudents(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStudents(search);
    };

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between px-4 sm:px-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        学生管理
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        スカウト対象の学生情報を管理します。
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Link
                        href="/students/new"
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        新規学生登録
                    </Link>
                </div>
            </div>

            {/* 検索フォーム */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="名前または大学名で検索"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                />
                <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                    検索
                </button>
            </form>

            {/* 一覧表示 */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">読み込み中...</div>
            ) : students.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        学生が登録されていません
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        まずは「新規学生登録」からデータを追加してください。
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/students/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            新規学生登録
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul role="list" className="divide-y divide-gray-200">
                        {students.map((student) => (
                            <li key={student.id}>
                                <div className="flex items-center px-4 py-4 sm:px-6 hover:bg-gray-50 transition duration-150 ease-in-out">
                                    <div className="min-w-0 flex-1 flex items-center">
                                        <div className="flex-shrink-0">
                                            <span className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                                                {student.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-indigo-600 truncate">
                                                    {student.name}
                                                </p>
                                                <p className="mt-2 flex items-center text-sm text-gray-500">
                                                    <svg
                                                        className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                        />
                                                    </svg>
                                                    <span className="truncate">
                                                        {student.university} {student.faculty}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="hidden md:block">
                                                <div className="flex gap-2 flex-wrap">
                                                    {student.strengthTags.slice(0, 3).map((tag, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {student.strengthTags.length > 3 && (
                                                        <span className="text-xs text-gray-500 py-1">
                                                            +{student.strengthTags.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-xs text-gray-500">
                                                    登録日: {new Date(student.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/students/${student.id}/scout`}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none shadow-sm"
                                        >
                                            スカウト生成
                                        </Link>
                                        <Link
                                            href={`/students/${student.id}/edit`}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none shadow-sm"
                                        >
                                            編集
                                        </Link>
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
