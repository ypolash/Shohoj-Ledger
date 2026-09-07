export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  );
}
