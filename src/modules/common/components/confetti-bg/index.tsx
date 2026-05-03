/**
 * ConfettiBg — Lightweight CSS-only decorative confetti background.
 * Renders scattered confetti dots/shapes using pseudo-random absolute positioning.
 * No JS animation libs — pure CSS with Tailwind animation classes.
 *
 * Usage: <ConfettiBg /> as a sibling inside a relative-positioned parent.
 */

const CONFETTI_PIECES = [
  { color: "#FF6B35", size: 8, top: "5%", left: "8%", delay: "0s", shape: "circle" },
  { color: "#FF4F6F", size: 6, top: "12%", left: "25%", delay: "0.4s", shape: "rect" },
  { color: "#FFD166", size: 10, top: "8%", left: "42%", delay: "0.8s", shape: "circle" },
  { color: "#7B2FF7", size: 7, top: "15%", left: "60%", delay: "0.2s", shape: "rect" },
  { color: "#FF2D87", size: 9, top: "4%", left: "78%", delay: "0.6s", shape: "circle" },
  { color: "#FF6B35", size: 6, top: "18%", left: "92%", delay: "1.0s", shape: "rect" },
  { color: "#FFD166", size: 8, top: "22%", left: "15%", delay: "0.3s", shape: "circle" },
  { color: "#9B5FFF", size: 7, top: "10%", left: "52%", delay: "0.7s", shape: "rect" },
  { color: "#FF4F6F", size: 5, top: "20%", left: "70%", delay: "1.1s", shape: "circle" },
  { color: "#FF6B35", size: 8, top: "6%", left: "35%", delay: "0.5s", shape: "rect" },
  { color: "#7B2FF7", size: 6, top: "25%", left: "85%", delay: "0.9s", shape: "circle" },
  { color: "#FFD166", size: 9, top: "3%", left: "5%", delay: "1.3s", shape: "rect" },
] as const

export default function ConfettiBg({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {CONFETTI_PIECES.map((piece, i) => (
        <span
          key={i}
          className="absolute animate-float opacity-60"
          style={{
            top: piece.top,
            left: piece.left,
            width: piece.size,
            height: piece.shape === "rect" ? piece.size * 0.5 : piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.shape === "circle" ? "50%" : "2px",
            animationDelay: piece.delay,
            transform: piece.shape === "rect" ? `rotate(${i * 30}deg)` : undefined,
          }}
        />
      ))}
    </div>
  )
}
