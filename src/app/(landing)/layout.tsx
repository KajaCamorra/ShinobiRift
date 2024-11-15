export default function LandingLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* We'll add header/navigation here later */}
        <main>
          {children}
        </main>
        {/* We'll add footer here later */}
      </div>
    )
  }