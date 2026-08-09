"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

/**
 * The hero's primary action: describe a cake, go to the Studio with it already typed.
 *
 * Deliberately a real input rather than a button labelled "Start designing". The Studio's whole
 * proposition is that you describe a cake in your own words, so the homepage should ask for those
 * words rather than describe the experience of being asked for them. Submitting carries the text
 * through, so the first thing a visitor sees in the Studio is their own idea, not an empty form.
 *
 * The placeholder cycles through prompts real people actually used. They are far stranger and more
 * convincing than anything invented — "a cake shaped like a vintage red rotary telephone" says what
 * this tool does in a way "Describe your dream cake" never could.
 */
export default function PromptBar({ examples }: { examples: string[] }) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (examples.length < 2) return

    // Pauses while the visitor is typing — a placeholder changing under someone's hands reads as a
    // glitch, and it is invisible once there is text anyway.
    if (value) return

    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (media.matches) return

    const timer = setInterval(() => setIndex((i) => (i + 1) % examples.length), 3800)
    return () => clearInterval(timer)
  }, [examples.length, value])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const prompt = value.trim()

    // sessionStorage under `cf-use-prompt`, not a query parameter — this is the handoff the Studio
    // already listens for (the gallery's "Use this prompt" uses the same key), and it reads nothing
    // from the URL. A ?prompt= would have looked like it worked and silently dropped the text,
    // which is the one thing this control must not do.
    if (prompt) {
      try {
        sessionStorage.setItem("cf-use-prompt", JSON.stringify({ prompt }))
      } catch {
        // Private mode, or storage full. Losing the prefill is a worse first impression than a
        // blank Studio, but it is not a reason to block the navigation.
      }
    }

    router.push("/ai-cake-studio")
  }

  const placeholder = examples[index] ?? "A cake shaped like a stack of books…"

  return (
    <form onSubmit={submit} className="w-full">
      <label htmlFor="hero-prompt" className="sr-only">
        Describe the cake you want
      </label>

      <div className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/10 p-1.5 backdrop-blur-sm transition focus-within:border-cf-purple-300 focus-within:bg-white/[0.14]">
        <input
          id="hero-prompt"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          maxLength={300}
          className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-base text-white placeholder:text-white/40 focus:outline-none sm:px-5 sm:py-3"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#1A0B2E] transition hover:bg-cf-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-7 sm:py-3 sm:text-base"
        >
          Design it
        </button>
      </div>

      <p className="mt-3 text-sm text-white/45">
        Free to try · no account needed · a local baker makes it for real
      </p>
    </form>
  )
}
