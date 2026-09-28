export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--surface-bg)', minHeight: 0 }}>
      {children}
    </div>
  );
}
