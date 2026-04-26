import { useEffect, useRef, useState } from 'react'

type Props = {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
}

export function SearchableSelect({ label, options, value, onChange, placeholder = 'Select or type...', clearable = false, disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query.trim()
    ? options.filter((opt) => opt.toLowerCase().includes(query.toLowerCase()))
    : options

  function handleSelect(opt: string) {
    onChange(opt)
    setQuery('')
    setOpen(false)
  }

  function handleInputChange(val: string) {
    setQuery(val)
    onChange(val)
    setOpen(true)
  }

  function handleFocus() {
    if (!disabled) setOpen(true)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  return (
    <div className={`searchable-select${disabled ? ' searchable-select--disabled' : ''}`} ref={containerRef}>
      <label>
        {label}
        <div className="searchable-select-control">
          <input
            ref={inputRef}
            value={open ? query : value}
            onChange={(e) => { if (!disabled) handleInputChange(e.target.value) }}
            onFocus={handleFocus}
            placeholder={value || placeholder}
            autoComplete="off"
            readOnly={disabled}
          />
          <span className="searchable-select-arrow" aria-hidden>▾</span>
        </div>
      </label>

      {open && (filtered.length > 0 || (clearable && value)) ? (
        <ul className="searchable-select-list" role="listbox">
          {clearable && value && (
            <li
              key="__clear__"
              role="option"
              aria-selected={false}
              className="searchable-select-option searchable-select-clear"
              onMouseDown={() => handleSelect('')}
            >
              — Clear selection —
            </li>
          )}
          {filtered.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={opt === value ? 'searchable-select-option selected' : 'searchable-select-option'}
              onMouseDown={() => handleSelect(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
