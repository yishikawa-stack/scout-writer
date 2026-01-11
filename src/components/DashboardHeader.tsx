
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default function DashboardHeader({ user }: { user: any }) {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
                                Scout Writer
                            </Link>
                        </div>
                        <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/dashboard"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                ダッシュボード
                            </Link>
                            <Link
                                href="/company"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                企業設定
                            </Link>
                            <Link
                                href="/guidelines"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                ノウハウ設定
                            </Link>
                            <Link
                                href="/students"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                学生管理
                            </Link>
                            <Link
                                href="/scouts"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                スカウト履歴
                            </Link>
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        <div className="ml-3 relative flex items-center gap-6">
                            <Link
                                href="/profile"
                                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-1"
                                title="マイページへ"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {user?.name}
                            </Link>
                            <form
                                action={async () => {
                                    "use server";
                                    await signOut();
                                }}
                            >
                                <button
                                    type="submit"
                                    className="text-sm text-red-600 hover:text-red-900 font-medium"
                                >
                                    ログアウト
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
