import { redirect } from 'next/navigation';

export default async function EditorShortLinkPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const search = searchParams ? await searchParams : {};
  if (!id) {
    redirect('/');
  }

  const query = new URLSearchParams();
  if (search) {
    Object.entries(search).forEach(([key, val]) => {
      if (typeof val === 'string') {
        query.set(key, val);
      } else if (Array.isArray(val)) {
        val.forEach(item => query.append(key, item));
      }
    });
  }

  const qs = query.toString();
  redirect(`/portal/editor/${id}${qs ? `?${qs}` : ''}`);
}

