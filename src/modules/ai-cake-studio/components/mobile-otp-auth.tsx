"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"

type Step = "mobile" | "otp" | "success"

interface Props {
  attemptsLimit?: number
}

export default function MobileOtpAuth({ attemptsLimit = 3 }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("mobile")
  const [mobile, setMobile] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendIn, setResendIn] = useState(0)
  const [isNewUser, setIsNewUser] = useState(false)
  const otpInputRef = useRef<HTMLInputElement>(null)

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  const sendOtp = async () => {
    setError("")
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to send OTP. Please try again.")
        return
      }
      setStep("otp")
      setResendIn(30)
      setTimeout(() => otpInputRef.current?.focus(), 80)
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setError("")
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP sent to your mobile")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Verification failed. Please try again.")
        return
      }
      setIsNewUser(data.isNewUser)
      setStep("success")
      // Refresh server components so the customer session is picked up
      setTimeout(() => router.refresh(), 1000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/40 p-4"
    >
      <div className="mb-3">
        <p className="text-sm font-bold text-slate-800">🔐 Quick sign-in to generate</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {attemptsLimit} free designs on sign up · No password · No email needed
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Mobile input ── */}
        {step === "mobile" && (
          <motion.div
            key="mobile"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-2"
          >
            <div className="flex gap-2">
              <span className="flex items-center rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-500 select-none">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                placeholder="Mobile number"
                className="flex-1 rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
              <button
                type="button"
                onClick={sendOtp}
                disabled={loading || mobile.length !== 10}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white transition hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z" />
                  </svg>
                ) : "Send OTP"}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </motion.div>
        )}

        {/* ── Step 2: OTP input ── */}
        {step === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-2"
          >
            <p className="text-xs text-slate-500">
              OTP sent to +91 {mobile} ·{" "}
              <button
                type="button"
                className="text-violet-600 underline underline-offset-2"
                onClick={() => { setStep("mobile"); setOtp(""); setError("") }}
              >
                Change
              </button>
            </p>
            <div className="flex gap-2">
              <input
                ref={otpInputRef}
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                placeholder="6-digit OTP"
                className="flex-1 rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm tracking-[0.4em] text-slate-800 placeholder:tracking-normal placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
              <button
                type="button"
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white transition hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z" />
                  </svg>
                ) : "Verify"}
              </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <p className="text-xs text-slate-400">
              {resendIn > 0 ? (
                `Resend OTP in ${resendIn}s`
              ) : (
                <button
                  type="button"
                  onClick={sendOtp}
                  className="text-violet-600 underline underline-offset-2"
                >
                  Resend OTP
                </button>
              )}
            </p>
          </motion.div>
        )}

        {/* ── Step 3: Success ── */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 rounded-xl bg-green-50 p-3 border border-green-200"
          >
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-bold text-green-800">
                {isNewUser ? "Welcome to CrossFriend! 🎉" : "Welcome back! 👋"}
              </p>
              <p className="text-xs text-green-600">
                {isNewUser
                  ? `Account created · Loading your ${attemptsLimit} free designs...`
                  : "You're signed in · Loading your session..."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
