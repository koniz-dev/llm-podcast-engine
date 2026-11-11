"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, HardDrive, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AppStatus } from "@/types/podcast"

export function LocalStatus() {
  const [status, setStatus] = useState<AppStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/status', { cache: 'no-store' })
      setStatus(response.ok ? await response.json() : null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading && !status) {
    return <div className="h-10 animate-pulse rounded-xl border border-white/10 bg-white/5" />
  }

  if (!status) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
        <span>Could not check the local server configuration.</span>
        <Button variant="ghost" size="sm" onClick={refresh}>Retry</Button>
      </div>
    )
  }

  if (!status.ready) {
    return (
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-amber-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <p className="text-sm font-medium">Local setup needs API keys</p>
              <p className="mt-1 text-xs leading-5 text-amber-100/70">
                Add {status.missingVariables.join(', ')} to <code className="rounded bg-black/25 px-1.5 py-0.5">.env.local</code>, then restart the dev server.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading} className="text-amber-100 hover:bg-amber-300/10 hover:text-white">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh configuration</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-2.5 text-xs text-slate-300">
      <span className="flex items-center gap-2 text-emerald-300">
        <CheckCircle2 className="h-4 w-4" /> Local configuration found
      </span>
      <span className="flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-slate-500" /> {status.storageMode} storage
      </span>
      <span className="truncate text-slate-500">{status.model}</span>
    </div>
  )
}
