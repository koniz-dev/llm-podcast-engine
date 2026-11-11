import { Github, Radio } from "lucide-react"

interface HeaderProps {
  title: string
}

export const Header = ({ title }: HeaderProps) => (
  <header className="relative z-20 border-b border-white/[0.06] bg-[#090907]/75 backdrop-blur-xl">
    <div className="mx-auto flex h-[4.5rem] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-[0.9rem] bg-orange-300 text-[#17120b] shadow-[0_10px_30px_rgba(253,186,116,0.18)]">
          <Radio className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-[-0.02em] text-white">{title}</h1>
          <p className="hidden text-[11px] uppercase tracking-[0.16em] text-stone-600 sm:block">Stories, voiced beautifully</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a href="https://github.com/koniz-dev/llm-podcast-engine" target="_blank" rel="noreferrer" aria-label="Open project on GitHub" className="hidden h-9 w-9 place-items-center rounded-full border border-white/[0.08] text-stone-500 transition hover:border-white/15 hover:bg-white/5 hover:text-white sm:grid">
          <Github className="h-4 w-4" />
        </a>
        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-[11px] font-medium text-stone-400">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" /><span className="relative h-2 w-2 rounded-full bg-emerald-400" /></span>
          Local engine
        </div>
      </div>
    </div>
  </header>
)
