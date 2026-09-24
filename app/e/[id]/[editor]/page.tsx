import { redirect } from 'next/navigation';

export default async function EditorSlugShortLinkPage({
  params
}: {
  params: Promise<{ id: string; editor: string }>;
}) {
  const { id, editor } = await params;
  if (!id) {
    redirect('/');
  }
  const decodedEditor = decodeURIComponent(editor || '');
  redirect(`/portal/editor/${id}?editor=${encodeURIComponent(decodedEditor)}`);
}
