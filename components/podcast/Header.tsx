import { Radio } from "lucide-react"

interface HeaderProps {
  title: string
}

export const Header = ({ title }: HeaderProps) => (
  <header className="border-b border-white/5 bg-black/30 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 text-black shadow-lg shadow-orange-500/20">
          <Radio className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-white sm:text-lg">{title}</h1>
          <p className="hidden text-xs text-slate-500 sm:block">Turn any article into something worth hearing.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        Local workspace
      </div>
    </div>
  </header>
)
