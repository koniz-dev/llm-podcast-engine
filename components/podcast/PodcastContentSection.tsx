"use client"

import { useState } from "react"
import { motion } from 'framer-motion'
import { Check, Copy, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { AudioPlayer, type AudioPlayerProps } from "./AudioPlayer"

interface PodcastContentSectionProps {
  isLoading: boolean
  newsScript: string
  currentStatus: string
  showAudio: boolean
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
  audioPlayerProps: AudioPlayerProps
}

export const PodcastContentSection = ({
  isLoading,
  newsScript,
  currentStatus,
  showAudio,
  scrollAreaRef,
  audioPlayerProps,
}: PodcastContentSectionProps) => {
  const [copied, setCopied] = useState(false)
  const wordCount = newsScript.trim() ? newsScript.trim().split(/\s+/).length : 0
  const isError = currentStatus.startsWith('Error:')

  const copyScript = async () => {
    await navigator.clipboard.writeText(newsScript)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <motion.section
      className="flex min-h-[30rem] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20 lg:min-h-0"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-400" />}
            <p className={`truncate text-sm font-medium ${isError ? 'text-red-300' : 'text-slate-200'}`}>{currentStatus || 'Preparing workspace…'}</p>
          </div>
          {wordCount > 0 && <p className="mt-0.5 text-xs text-slate-600">{wordCount.toLocaleString()} words</p>}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={copyScript} disabled={!newsScript} className="shrink-0 text-slate-500 hover:bg-white/5 hover:text-white">
          {copied ? <Check className="mr-1.5 h-4 w-4 text-emerald-400" /> : <Copy className="mr-1.5 h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1" ref={scrollAreaRef}>
        <div className="p-5 sm:p-6">
          {newsScript ? (
            <article className="whitespace-pre-wrap text-[15px] leading-7 text-slate-300">{newsScript}</article>
          ) : (
            <div className="space-y-3 py-3" aria-label="Generating script">
              {[92, 76, 86, 61, 80].map((width, index) => (
                <div key={width} className="h-3 animate-pulse rounded-full bg-white/5" style={{ width: `${width}%`, animationDelay: `${index * 90}ms` }} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {showAudio && (
        <div className="border-t border-white/5 p-3 sm:p-4">
          <AudioPlayer {...audioPlayerProps} />
        </div>
      )}
    </motion.section>
  )
}
