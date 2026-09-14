import { Metadata } from "next";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CommunityChat } from "./components/CommunityChat";

export const metadata: Metadata = {
  title: "Community & Collaboration Hub | Shohoj Ledger",
  description: "Connect, chat, share files, and collaborate across staff and members in real time.",
};

export default async function CommunityPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden bg-white dark:bg-slate-950">
      <CommunityChat />
    </div>
  );
}
