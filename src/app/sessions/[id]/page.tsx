import { notFound } from "next/navigation";
import { SessionWorkspace } from "@/components/session-workspace";
import { getSession } from "@/server/repository";
export const dynamic = "force-dynamic";
export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const detail = getSession((await params).id);
  if (!detail) notFound();
  return <SessionWorkspace initial={detail} />;
}
