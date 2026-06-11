'use client'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: React.ReactNode
}

export default function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="h-20 w-20 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center mb-6">
        <span className="text-[#c9a84c]">{icon}</span>
      </div>
      <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">{title}</h1>
      <p className="text-[#a0a09a] text-sm mt-2 text-center max-w-md">{description}</p>
      <div className="mt-6 px-4 py-2 rounded-full bg-[#1a1a1e] border border-white/[0.06]">
        <span className="text-[#606060] text-xs">🚧 En cours de développement</span>
      </div>
    </div>
  )
}
