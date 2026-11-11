"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Link2, List, Mic, Plus, X } from "lucide-react"
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
      className={`${isExpanded ? 'lg:w-1/2' : 'lg:w-[46%]'} flex min-w-0 flex-col gap-5`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-orange-400">New episode</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Choose what to turn into audio</h2>
        <p className="mt-1 text-sm text-slate-500">Use one focused article for the cleanest result, or combine up to {MAX_URLS} sources.</p>
      </div>

      <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onModeChange('single')}
          disabled={isLoading}
          className={mode === 'single'
            ? 'bg-white/10 text-white shadow-sm hover:bg-white/10'
            : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}
        >
          <Link2 className="mr-2 h-4 w-4" /> Single source
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onModeChange('multiple')}
          disabled={isLoading}
          className={mode === 'multiple'
            ? 'bg-white/10 text-white shadow-sm hover:bg-white/10'
            : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}
        >
          <List className="mr-2 h-4 w-4" /> Multiple
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          {mode === 'single' ? (
            <motion.div key="single" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
              <label htmlFor="single-url" className="mb-2 block text-sm font-medium text-slate-300">Article URL</label>
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
                className="h-12 border-white/10 bg-black/25 text-white placeholder:text-slate-600 focus-visible:border-orange-400 focus-visible:ring-orange-400/20"
              />
              <p className={`mt-2 text-xs ${singleUrlInvalid ? 'text-red-400' : 'text-slate-600'}`}>
                {singleUrlInvalid ? 'Enter a complete public http:// or https:// URL.' : 'Tip: a direct article URL works better than a homepage.'}
              </p>
            </motion.div>
          ) : (
            <motion.div key="multiple" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex h-full min-h-0 flex-col">
              <label htmlFor="multiple-url" className="mb-2 block text-sm font-medium text-slate-300">Sources <span className="font-normal text-slate-600">{urls.length}/{MAX_URLS}</span></label>
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
                  className="h-11 min-w-0 flex-1 border-white/10 bg-black/25 text-white placeholder:text-slate-600 focus-visible:border-orange-400 focus-visible:ring-orange-400/20"
                />
                <Button type="button" onClick={onAddUrl} disabled={addDisabled} className="h-11 bg-orange-500 text-black hover:bg-orange-400">
                  <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add</span>
                </Button>
              </div>
              <p className={`mt-2 min-h-4 text-xs ${newUrlInvalid || duplicateUrl ? 'text-red-400' : 'text-slate-600'}`}>
                {newUrlInvalid ? 'Enter a complete public URL.' : duplicateUrl ? 'That source is already in the list.' : reachedUrlLimit ? 'Source limit reached.' : 'Each source is trimmed automatically to protect your free-tier quota.'}
              </p>

              <ScrollArea className="mt-3 min-h-0 flex-1 pr-3">
                <div className="space-y-2">
                  {urls.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-600">No sources yet.</div>
                  ) : urls.map((url) => (
                    <motion.div layout key={url} className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.035] px-3 py-2.5">
                      <Link2 className="h-4 w-4 shrink-0 text-orange-400/70" />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-300" title={url}>{url}</span>
                      <Button type="button" variant="ghost" size="sm" disabled={isLoading} onClick={() => onRemoveUrl(url)} className="h-8 w-8 p-0 text-slate-600 hover:bg-red-500/10 hover:text-red-400">
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

      <div className="space-y-4 border-t border-white/5 pt-5">
        <VoiceSelector selectedVoiceId={selectedVoiceId} onVoiceChange={onVoiceChange} />

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="h-12 flex-1 bg-orange-500 font-medium text-black shadow-lg shadow-orange-500/10 hover:bg-orange-400 disabled:shadow-none"
          >
            {isLoading ? <Flame className="mr-2 h-4 w-4 animate-pulse" /> : <Mic className="mr-2 h-4 w-4" />}
            {isLoading ? 'Creating your episode…' : 'Generate podcast'}
          </Button>
          {isLoading && (
            <Button type="button" variant="outline" onClick={onCancel} className="h-12 border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </motion.section>
  )
}
