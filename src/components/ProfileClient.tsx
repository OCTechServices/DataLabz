'use client'

import { useState, useEffect } from 'react'
import { sanitizeCss } from '@/lib/sanitize-css'
import type { Profile, WorldTheme } from '@/types/database'

interface Props {
  profile: Profile
}

const THEMES: { value: WorldTheme; label: string; desc: string }[] = [
  { value: 'pixel-dark', label: 'Pixel Dark', desc: 'Retro dungeon, dark aesthetic' },
  { value: 'pixel-light', label: 'Pixel Light', desc: 'Bright Pokémon overworld vibes' },
  { value: 'glam', label: 'Glam', desc: 'Hot pink, fashion-forward' },
]

const AI_PROMPT = `I'm styling a web app called DATA.LABZ — a dark co-working platform built with Next.js and Tailwind CSS.

Generate custom CSS to make it look like: [DESCRIBE YOUR DESIRED LOOK HERE — e.g. "early 2000s MySpace with a blue and pink color scheme", "neon cyberpunk terminal", "clean minimal white office"]

Rules you MUST follow:
- Every single declaration MUST end with !important (required to override Tailwind)
- Only use the selectors listed below — these are the only ones that exist in the app
- Do not invent class names — unlisted selectors will silently do nothing

Selectors that work:
  body, main                              page background and base text
  h1, h2                                  headings
  a                                       links
  a:hover                                 link hover state
  button                                  all buttons
  input, textarea                         form fields
  .rounded-xl                             cards and panels
  .rounded-xl h2                          card headings
  .border-zinc-800                        bordered containers
  .text-zinc-500                          muted / secondary text
  .text-zinc-400                          lighter muted text
  .bg-zinc-900                            dark panel backgrounds
  .bg-black                               page-level dark backgrounds
  .font-bold                              bold text elements
  .tracking-tight                         tight letter-spacing headings

Output only valid CSS — no explanations, no markdown fences, no comments outside the CSS.`

export default function ProfileClient({ profile }: Props) {
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [theme, setTheme] = useState<WorldTheme>(profile.theme ?? 'pixel-dark')
  const [customCss, setCustomCss] = useState(profile.custom_css ?? '')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Live preview — inject CSS as the user types so changes are visible before saving
  useEffect(() => {
    const id = 'custom-user-css'
    let el = document.getElementById(id) as HTMLStyleElement | null
    if (!customCss.trim()) { el?.remove(); return }
    if (!el) {
      el = document.createElement('style')
      el.id = id
      document.head.appendChild(el)
    }
    el.textContent = sanitizeCss(customCss)
    return () => { document.getElementById(id)?.remove() }
  }, [customCss])

  function copyPrompt() {
    navigator.clipboard.writeText(AI_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')

    const sanitized = customCss.trim() ? sanitizeCss(customCss) : null

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim(),
          theme,
          custom_css: sanitized,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save.'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">

      {/* Display name */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-400 uppercase tracking-wider">Display name</label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          minLength={2}
          maxLength={32}
          required
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
        />
      </div>

      {/* Theme picker */}
      <div className="space-y-3">
        <label className="text-xs text-zinc-400 uppercase tracking-wider">Virtual Hive theme</label>
        <p className="text-xs text-zinc-600">Controls how your co-working world looks.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEMES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              className={`text-left p-4 rounded-xl border transition-colors space-y-1 ${
                theme === t.value
                  ? 'border-white bg-zinc-800'
                  : 'border-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  t.value === 'pixel-dark' ? 'bg-zinc-400' :
                  t.value === 'pixel-light' ? 'bg-green-400' :
                  'bg-pink-400'
                }`} />
                <span className="text-sm font-medium text-white">{t.label}</span>
              </div>
              <p className="text-xs text-zinc-500 pl-4">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom style — AI-assisted */}
      <div className="space-y-3">
        <label className="text-xs text-zinc-400 uppercase tracking-wider">
          Custom style <span className="text-zinc-600 normal-case">(MySpace-style, optional)</span>
        </label>

        {/* Step 1 */}
        <div className="border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-zinc-300 font-medium">Step 1 — Generate your CSS with AI</p>
              <p className="text-xs text-zinc-600">
                Copy this prompt, paste it into ChatGPT, Claude, or any AI. Fill in the one blank line describing your desired look, then paste the output below.
              </p>
            </div>
            <button
              type="button"
              onClick={copyPrompt}
              className="shrink-0 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              {copied ? 'Copied ✓' : 'Copy prompt'}
            </button>
          </div>
          <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-500 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {AI_PROMPT}
          </pre>
        </div>

        {/* Step 2 */}
        <div className="space-y-2">
          <p className="text-xs text-zinc-300 font-medium">Step 2 — Paste the output here</p>
          <p className="text-xs text-zinc-600">Changes apply live as you paste — you&apos;ll see the page update in real time before saving.</p>
          <textarea
            value={customCss}
            onChange={e => setCustomCss(e.target.value)}
            maxLength={10000}
            rows={10}
            spellCheck={false}
            placeholder="Paste AI-generated CSS here…"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-xs text-zinc-300 placeholder-zinc-700 font-mono focus:outline-none focus:border-zinc-400 resize-y"
          />
          <p className="text-xs text-zinc-700">{customCss.length.toLocaleString()} / 10,000 chars</p>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-3 bg-white text-black font-semibold rounded-lg text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save profile'}
      </button>

    </form>
  )
}
