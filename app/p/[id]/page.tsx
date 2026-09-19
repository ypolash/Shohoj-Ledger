import { redirect } from 'next/navigation';

export default async function ShortLinkPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) {
    redirect('/');
  }
  redirect(`/portal/project/${id}`);
}
