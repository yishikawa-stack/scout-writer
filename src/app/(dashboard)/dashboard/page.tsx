
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
    const session = await auth();

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
                    <div className="text-sm text-gray-500">
                        ようこそ、{session?.user?.name} さん
                    </div>
                </div>
            </header>
            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* 企業設定 */}
                            <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg font-medium text-gray-900">1. 企業プロファイル設定</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        まずは企業の魅力や特徴を登録しましょう。これがスカウト文章の基礎になります。
                                    </p>
                                    <div className="mt-4">
                                        <a href="/company" className="text-indigo-600 hover:text-indigo-500 font-medium">
                                            設定画面へ &rarr;
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* 学生管理 */}
                            <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg font-medium text-gray-900">2. 学生情報の登録</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        スカウトしたい学生のプロフィールやエピソード（ガクチカ）を登録します。
                                    </p>
                                    <div className="mt-4">
                                        <a href="/students" className="text-indigo-600 hover:text-indigo-500 font-medium">
                                            学生一覧へ &rarr;
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* ポジション管理 */}
                            <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg font-medium text-gray-900">3. ポジション管理</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        募集する職種や要件を定義します。スカウト生成時に選択します。
                                    </p>
                                    <div className="mt-4">
                                        <a href="/positions" className="text-indigo-600 hover:text-indigo-500 font-medium">
                                            ポジション一覧へ &rarr;
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
