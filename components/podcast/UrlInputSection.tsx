"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Flame, Link2, List, Mic2, Plus, X } from "lucide-react"
import { MAX_URLS } from "@/constants/podcast"
import { validateUrl } from "@/lib/podcast"
import type { UrlMode } from "@/types/podcast"
import { VoiceSelector } from "./VoiceSelector"

interface UrlInputSectionProps {
  mode: UrlMode
  urls: string[]
  singleUrl: string
  newUrl: string
  selectedVoiceId: string | null
  onModeChange: (mode: UrlMode) => void
  onUrlChange: (url: string) => void
  onSingleUrlChange: (url: string) => void
  onVoiceChange: (voiceId: string) => void
  onAddUrl: () => void
  onRemoveUrl: (url: string) => void
  onGenerate: () => void
  onCancel: () => void
  isLoading: boolean
  isExpanded: boolean
}

export const UrlInputSection = ({
  mode,
  urls,
  singleUrl,
  newUrl,
  selectedVoiceId,
  onModeChange,
  onUrlChange,
  onSingleUrlChange,
  onVoiceChange,
  onAddUrl,
  onRemoveUrl,
  onGenerate,
  onCancel,
  isLoading,
  isExpanded,
}: UrlInputSectionProps) => {
  const normalizedSingleUrl = singleUrl.trim()
  const normalizedNewUrl = newUrl.trim()
  const singleUrlInvalid = Boolean(normalizedSingleUrl) && !validateUrl(normalizedSingleUrl)
  const newUrlInvalid = Boolean(normalizedNewUrl) && !validateUrl(normalizedNewUrl)
  const duplicateUrl = Boolean(normalizedNewUrl) && urls.includes(normalizedNewUrl)
  const reachedUrlLimit = urls.length >= MAX_URLS
  const hasSources = mode === 'single' ? Boolean(normalizedSingleUrl) && !singleUrlInvalid : urls.length > 0
  const canGenerate = Boolean(selectedVoiceId) && hasSources && !isLoading
  const addDisabled = !normalizedNewUrl || newUrlInvalid || duplicateUrl || reachedUrlLimit || isLoading

  return (
    <motion.section
      layout
      className={`${isExpanded ? 'lg:w-[45%]' : 'lg:w-[43%]'} flex min-w-0 flex-col gap-5 rounded-[1.35rem] border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6 lg:p-7`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div>
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300"><span className="grid h-5 w-5 place-items-center rounded-full bg-orange-300 text-[10px] text-black">1</span> Build your episode</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-stone-50">What should we talk about?</h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">One focused article gives the cleanest result. Combine up to {MAX_URLS} sources for a richer briefing.</p>
      </div>

      <div className="grid grid-cols-2 rounded-xl border border-white/[0.07] bg-black/20 p-1.5">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onModeChange('single')}
          disabled={isLoading}
          className={mode === 'single'
            ? 'bg-[#292720] text-white shadow-sm hover:bg-[#292720]'
            : 'text-stone-500 hover:bg-white/5 hover:text-stone-200'}
        >
          <Link2 className="mr-2 h-4 w-4" /> Single source
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onModeChange('multiple')}
          disabled={isLoading}
          className={mode === 'multiple'
            ? 'bg-[#292720] text-white shadow-sm hover:bg-[#292720]'
            : 'text-stone-500 hover:bg-white/5 hover:text-stone-200'}
        >
          <List className="mr-2 h-4 w-4" /> Multiple
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          {mode === 'single' ? (
            <motion.div key="single" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
              <label htmlFor="single-url" className="mb-2.5 block text-sm font-medium text-stone-300">Article URL</label>
              <Input
                id="single-url"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://example.com/article"
                value={singleUrl}
                disabled={isLoading}
                aria-invalid={singleUrlInvalid}
                onChange={(event) => onSingleUrlChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && canGenerate) onGenerate()
                }}
                className="h-13 rounded-xl border-white/[0.09] bg-black/25 px-4 text-white placeholder:text-stone-700 focus-visible:border-orange-300/60 focus-visible:ring-orange-300/15"
              />
              <p className={`mt-2.5 text-xs leading-5 ${singleUrlInvalid ? 'text-red-400' : 'text-stone-600'}`}>
                {singleUrlInvalid ? 'Enter a complete public http:// or https:// URL.' : 'Tip: a direct article URL works better than a homepage.'}
              </p>
            </motion.div>
          ) : (
            <motion.div key="multiple" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex h-full min-h-0 flex-col">
              <label htmlFor="multiple-url" className="mb-2.5 flex items-center justify-between text-sm font-medium text-stone-300">Sources <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] font-normal text-stone-500">{urls.length}/{MAX_URLS}</span></label>
              <div className="flex gap-2">
                <Input
                  id="multiple-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://example.com/article"
                  value={newUrl}
                  disabled={isLoading || reachedUrlLimit}
                  aria-invalid={newUrlInvalid || duplicateUrl}
                  onChange={(event) => onUrlChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !addDisabled) onAddUrl()
                  }}
                  className="h-12 min-w-0 flex-1 rounded-xl border-white/[0.09] bg-black/25 px-4 text-white placeholder:text-stone-700 focus-visible:border-orange-300/60 focus-visible:ring-orange-300/15"
                />
                <Button type="button" onClick={onAddUrl} disabled={addDisabled} className="h-12 rounded-xl bg-orange-300 px-4 text-[#17120b] hover:bg-orange-200">
                  <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add</span>
                </Button>
              </div>
              <p className={`mt-2.5 min-h-4 text-xs ${newUrlInvalid || duplicateUrl ? 'text-red-400' : 'text-stone-600'}`}>
                {newUrlInvalid ? 'Enter a complete public URL.' : duplicateUrl ? 'That source is already in the list.' : reachedUrlLimit ? 'Source limit reached.' : 'Each source is trimmed automatically to protect your free-tier quota.'}
              </p>

              <ScrollArea className="mt-3 min-h-0 flex-1 pr-3">
                <div className="space-y-2">
                  {urls.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-8 text-center text-sm text-stone-600">Your source list is empty.</div>
                  ) : urls.map((url) => (
                    <motion.div layout key={url} className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.035] px-3 py-2.5 transition hover:border-white/10 hover:bg-white/[0.05]">
                      <Link2 className="h-4 w-4 shrink-0 text-orange-300/70" />
                      <span className="min-w-0 flex-1 truncate text-sm text-stone-300" title={url}>{url}</span>
                      <Button type="button" variant="ghost" size="sm" disabled={isLoading} onClick={() => onRemoveUrl(url)} className="h-8 w-8 p-0 text-stone-600 hover:bg-red-500/10 hover:text-red-400">
                        <X className="h-4 w-4" /><span className="sr-only">Remove {url}</span>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4 border-t border-white/[0.06] pt-5">
        <VoiceSelector selectedVoiceId={selectedVoiceId} onVoiceChange={onVoiceChange} />

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="group h-13 flex-1 rounded-xl bg-orange-300 font-semibold text-[#17120b] shadow-[0_12px_30px_rgba(253,186,116,0.12)] hover:bg-orange-200 disabled:shadow-none"
          >
            {isLoading ? <Flame className="mr-2 h-4 w-4 animate-pulse" /> : <Mic2 className="mr-2 h-4 w-4" />}
            {isLoading ? 'Creating your episode…' : 'Generate podcast'}
            {!isLoading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
          </Button>
          {isLoading && (
            <Button type="button" variant="outline" onClick={onCancel} className="h-13 rounded-xl border-white/10 bg-transparent text-stone-300 hover:bg-white/5 hover:text-white">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </motion.section>
  )
}
