"use client"

import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"

export interface AudioPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>
  audioSrc: string
  isAudioLoading: boolean
  onDownload: () => void
  onLoadStart: () => void
  onLoadedData: () => void
}

export const AudioPlayer = ({ audioRef, audioSrc, isAudioLoading, onDownload, onLoadStart, onLoadedData }: AudioPlayerProps) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
    <div className="mb-2 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white">Your episode</p>
        <p className="text-xs text-slate-500">Generated locally and ready to play.</p>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onDownload} disabled={isAudioLoading} className="text-slate-400 hover:bg-white/5 hover:text-white">
        <Download className="mr-1.5 h-4 w-4" /> Download
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
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-[#151922] text-xs text-slate-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-orange-400" /> Loading audio…
        </div>
      )}
    </div>
  </div>
)

