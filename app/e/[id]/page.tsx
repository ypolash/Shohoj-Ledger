import { redirect } from 'next/navigation';

export default async function EditorShortLinkPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) {
    redirect('/');
  }
  redirect(`/portal/editor/${id}`);
}
