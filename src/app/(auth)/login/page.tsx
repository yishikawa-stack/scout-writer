
"use client";

import { useActionState } from "react";
import { authenticate } from "@/lib/actions";
import Link from "next/link";

export default function LoginPage() {
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined
    );

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        ログイン
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        新卒スカウト文章自動生成サービス
                    </p>
                </div>
                <form action={formAction} className="mt-8 space-y-6">
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                メールアドレス
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                placeholder="メールアドレス"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                パスワード
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                placeholder="パスワード"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label
                                htmlFor="remember-me"
                                className="ml-2 block text-gray-900"
                            >
                                ログイン状態を保持
                            </label>
                        </div>
                        <div className="text-right">
                            <a
                                href="#"
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                忘れましたか？
                            </a>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
                        >
                            {isPending ? "ログイン中..." : "ログイン"}
                        </button>
                    </div>

                    <div className="pt-4 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-600">
                            アカウントをお持ちでないですか？
                        </p>
                        <Link
                            href="/signup"
                            className="mt-2 inline-block font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            新規アカウントを作成する
                        </Link>
                    </div>

                    {errorMessage && (
                        <div className="text-red-500 text-sm text-center">
                            {errorMessage}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
