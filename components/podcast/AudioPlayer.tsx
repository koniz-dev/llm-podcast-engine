"use client"

import { Button } from "@/components/ui/button"
import { Download, Loader2, Waves } from "lucide-react"

export interface AudioPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>
  audioSrc: string
  isAudioLoading: boolean
  onDownload: () => void
  onLoadStart: () => void
  onLoadedData: () => void
}

export const AudioPlayer = ({ audioRef, audioSrc, isAudioLoading, onDownload, onLoadStart, onLoadedData }: AudioPlayerProps) => (
  <div className="rounded-xl border border-orange-300/10 bg-gradient-to-r from-orange-300/[0.07] to-white/[0.025] p-3 sm:p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-300 text-[#17120b]"><Waves className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">Your episode is ready</p>
          <p className="text-xs text-stone-500">Generated locally · ready to play</p>
        </div>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onDownload} disabled={isAudioLoading} className="shrink-0 text-stone-400 hover:bg-white/5 hover:text-white">
        <Download className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Download</span>
      </Button>
    </div>
    <div className="relative">
      <audio
        ref={audioRef}
        key={audioSrc}
        src={audioSrc}
        className="h-10 w-full accent-orange-500"
        controls
        preload="metadata"
        onLoadStart={onLoadStart}
        onLoadedData={onLoadedData}
      />
      {isAudioLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-[#191813] text-xs text-stone-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-orange-300" /> Loading audio…
        </div>
      )}
    </div>
  </div>
)

