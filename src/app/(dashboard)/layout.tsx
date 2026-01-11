
import { auth } from "@/lib/auth";
import DashboardHeader from "@/components/DashboardHeader";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader user={session?.user} />
            <main className="py-10">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 mb-8">{children}</div>
            </main>
        </div>
    );
}
