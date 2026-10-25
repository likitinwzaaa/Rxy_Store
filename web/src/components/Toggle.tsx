type Props = {
  on: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}

export function Toggle({ on, onChange, label, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      className={on ? 'tgl on' : 'tgl'}
      onClick={() => onChange(!on)}
    >
      <span className="knob" />
    </button>
  )
}
