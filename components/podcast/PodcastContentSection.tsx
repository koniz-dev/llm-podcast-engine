"use client"

import { useState } from "react"
import { motion } from 'framer-motion'
import { Check, Copy, FileText, Loader2, Radio } from "lucide-react"
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
      className="flex min-h-[30rem] min-w-0 flex-1 flex-col overflow-hidden rounded-[1.35rem] border border-white/[0.07] bg-[#0c0c0a] lg:min-h-0"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="flex min-h-16 items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-300" /> : <Radio className="h-3.5 w-3.5 text-emerald-400" />}
            <p className={`truncate text-sm font-medium ${isError ? 'text-red-300' : 'text-stone-200'}`}>{currentStatus || 'Preparing workspace…'}</p>
          </div>
          {wordCount > 0 && <p className="mt-0.5 text-xs text-stone-600">{wordCount.toLocaleString()} words · live transcript</p>}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={copyScript} disabled={!newsScript} className="shrink-0 rounded-lg text-stone-500 hover:bg-white/5 hover:text-white">
          {copied ? <Check className="mr-1.5 h-4 w-4 text-emerald-400" /> : <Copy className="mr-1.5 h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1" ref={scrollAreaRef}>
        <div className="p-5 sm:p-8 lg:p-10">
          {newsScript ? (
            <article className="mx-auto max-w-3xl whitespace-pre-wrap text-[15px] leading-8 text-stone-300 first-letter:text-4xl first-letter:font-semibold first-letter:text-orange-300">{newsScript}</article>
          ) : (
            <div className="mx-auto max-w-xl py-10 text-center" aria-label="Generating script">
              <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-orange-300/10 bg-orange-300/[0.06] text-orange-300"><FileText className="h-6 w-6" /></div>
              <p className="text-sm font-medium text-stone-300">Shaping your story</p>
              <p className="mt-1 text-xs text-stone-600">The transcript will start appearing here in a moment.</p>
              <div className="mt-8 space-y-3 text-left">
                {[92, 76, 86, 61, 80].map((width, index) => (
                  <div key={width} className="h-2.5 animate-pulse rounded-full bg-white/[0.045]" style={{ width: `${width}%`, animationDelay: `${index * 90}ms` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {showAudio && (
        <div className="border-t border-white/[0.06] p-3 sm:p-4">
          <AudioPlayer {...audioPlayerProps} />
        </div>
      )}
    </motion.section>
  )
}
