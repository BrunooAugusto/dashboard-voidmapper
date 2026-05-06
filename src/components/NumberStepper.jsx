export default function NumberStepper({ value = 0, onChange, min = 0, max = 999 }) {
  function decrement() {
    if (value > min) onChange(value - 1)
  }
  function increment() {
    if (value < max) onChange(value + 1)
  }

  return (
    <div className="h-[52px] flex items-center rounded-[10px] bg-input-bg border border-border-soft overflow-hidden select-none">
      <button
        type="button"
        onClick={decrement}
        className="w-12 h-full flex items-center justify-center text-ink-500 hover:bg-page text-xl font-light border-r border-border-soft transition-colors"
      >
        −
      </button>
      <span className="flex-1 text-center text-sm font-medium text-ink-500">{value}</span>
      <button
        type="button"
        onClick={increment}
        className="w-12 h-full flex items-center justify-center text-ink-900 hover:bg-page text-xl font-semibold border-l border-border-soft transition-colors"
      >
        +
      </button>
    </div>
  )
}
