'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Heading { id: string; text: string; level: number }

export function ManualReader({ bodyHtml }: { bodyHtml: string }) {
  const articleRef = useRef<HTMLElement>(null)
  const [activeId, setActiveId] = useState('')
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState(0)
  const [headings, setHeadings] = useState<Heading[]>([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const [allDone, setAllDone] = useState(false)

  const storageKey = `manual-done-${typeof window !== 'undefined' ? window.location.pathname : ''}`

  useEffect(() => {
    if (!articleRef.current) return
    const els = articleRef.current.querySelectorAll('h2, h3')
    setHeadings(Array.from(els).map(h => ({
      id: h.id,
      text: h.textContent || '',
      level: h.tagName === 'H2' ? 2 : 3,
    })))
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed: string[] = JSON.parse(saved)
        setCompletedIds(new Set(parsed))
        if (parsed.length > 0 && headings.length > 0 && parsed.length >= headings.length) {
          setAllDone(true)
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headings.length])

  useEffect(() => {
    if (completedIds.size === 0) return
    try {
      localStorage.setItem(storageKey, JSON.stringify([...completedIds]))
    } catch {}
  }, [completedIds, storageKey])

  useEffect(() => {
    if (headings.length === 0 || completedIds.size < headings.length) {
      setAllDone(false)
      return
    }
    setAllDone(true)
    setShowCelebration(true)
    const t = setTimeout(() => setShowCelebration(false), 4000)
    return () => clearTimeout(t)
  }, [completedIds.size, headings.length])

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0)

      if (!articleRef.current) return
      const els = articleRef.current.querySelectorAll('h2, h3')
      let current = ''
      for (const h of els) {
        const rect = h.getBoundingClientRect()
        if (rect.top <= 140) current = h.id
      }
      setActiveId(prev => prev !== current ? current : prev)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!articleRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setCompletedIds(prev => {
              if (prev.has(entry.target.id)) return prev
              const next = new Set(prev)
              next.add(entry.target.id)
              return next
            })
          }
        })
      },
      { threshold: 0.25 }
    )
    const els = articleRef.current.querySelectorAll('h2, h3')
    els.forEach(h => observer.observe(h))
    return () => observer.disconnect()
  }, [headings.length])

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setTocOpen(false)
  }, [])

  const pct = headings.length > 0 ? Math.round((completedIds.size / headings.length) * 100) : 0

  return (
    <>
      {/* ── Progress bar ── */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-50 bg-white/5">
        <div
          className="h-full bg-[hsl(var(--primary))] transition-all duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* ── Celebration toast ── */}
      {showCelebration && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/30 rounded-xl px-5 py-3 shadow-lg shadow-[hsl(var(--primary))]/5">
            <p className="text-[hsl(var(--primary))] font-semibold text-sm flex items-center gap-2">
              <span>✦</span> Guide completed — you&apos;ve read everything!
            </p>
          </div>
        </div>
      )}

      {/* ── Layout wrapper ── */}
      <div className="flex flex-col lg:flex-row gap-0 lg:gap-10 relative">
        {/* ── Article ── */}
        <div className="min-w-0 flex-1">
          <article
            ref={articleRef}
            className="manual-body"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          {/* ── Completion banner ── */}
          {allDone && (
            <div className="mt-12 rounded-xl border border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5 p-6 text-center">
              <div className="text-3xl mb-2">✦</div>
              <p className="text-[hsl(var(--primary))] font-semibold text-sm">You&apos;ve completed this guide</p>
              <p className="text-white/40 text-xs mt-1">All sections have been read</p>
            </div>
          )}
        </div>

        {/* ── Desktop TOC ── */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide py-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Sections</h3>
              <span className="text-[11px] text-white/30 font-mono">{pct}%</span>
            </div>
            <div className="space-y-0.5">
              {headings.map(h => (
                <button
                  key={h.id}
                  onClick={() => scrollTo(h.id)}
                  className={`w-full text-left text-sm py-1.5 px-2 rounded-lg transition-all ${
                    activeId === h.id
                      ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 font-medium'
                      : 'text-white/40 hover:text-white/60'
                  } ${h.level === 3 ? 'pl-6 text-xs' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full border inline-flex items-center justify-center shrink-0 transition-colors ${
                      completedIds.has(h.id)
                        ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))]'
                        : 'border-white/10'
                    }`}>
                      {completedIds.has(h.id) && (
                        <span className="text-[8px] text-black font-bold leading-none">✓</span>
                      )}
                    </span>
                    <span className="truncate">{h.text}</span>
                  </span>
                </button>
              ))}
            </div>
            {headings.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[hsl(var(--primary))] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Mobile TOC trigger ── */}
        <button
          onClick={() => setTocOpen(true)}
          className="lg:hidden fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full bg-[hsl(var(--primary))] text-black flex items-center justify-center shadow-lg shadow-[hsl(var(--primary))]/20 hover:scale-105 active:scale-95 transition-transform"
          aria-label="Open guide sections"
        >
          <span className="text-sm font-bold">{pct > 0 ? `${pct}%` : '☰'}</span>
        </button>

        {/* ── Mobile TOC drawer ── */}
        {tocOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/60" onClick={() => setTocOpen(false)} />
            <div className="relative ml-auto w-72 max-w-[85vw] bg-[#0a0a0f] border-l border-white/5 h-full overflow-y-auto p-5 animate-slide-in-right">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-white">Sections</h3>
                <button onClick={() => setTocOpen(false)} className="text-white/40 hover:text-white/70 text-lg leading-none">&times;</button>
              </div>
              <div className="space-y-1">
                {headings.map(h => (
                  <button
                    key={h.id}
                    onClick={() => scrollTo(h.id)}
                    className={`w-full text-left text-sm py-2 px-3 rounded-lg transition-all ${
                      activeId === h.id
                        ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 font-medium'
                        : 'text-white/50 hover:text-white/70 hover:bg-white/[0.02]'
                    } ${h.level === 3 ? 'pl-8 text-xs' : ''}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`w-3.5 h-3.5 rounded-full border inline-flex items-center justify-center shrink-0 transition-colors ${
                        completedIds.has(h.id)
                          ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))]'
                          : 'border-white/10'
                      }`}>
                        {completedIds.has(h.id) && (
                          <span className="text-[9px] text-black font-bold leading-none">✓</span>
                        )}
                      </span>
                      {h.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
