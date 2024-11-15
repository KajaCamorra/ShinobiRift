export default function GameLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <div className="min-h-screen flex bg-gray-900 text-white">
        {/* We'll add ResizableSidePanel here later */}
        <div className="flex-1">
          {/* We'll add Header here later */}
          <main className="p-4">
            {children}
          </main>
          {/* We'll add BottomPanel here later */}
        </div>
      </div>
    )
  }