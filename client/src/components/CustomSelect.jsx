import React, { useEffect, useMemo, useRef, useState } from 'react'

const normalizeOptions = (options = []) => options.map((option) => (
  typeof option === 'string' || typeof option === 'number'
    ? { value: String(option), label: String(option) }
    : { value: String(option.value), label: option.label }
))

const CustomSelect = ({
  label,
  value = '',
  options = [],
  onChange,
  placeholder = 'Select option',
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  variant = 'default',
}) => {
  const [open, setOpen] = useState(false)
  const selectRef = useRef(null)
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options])
  const selectedOption = normalizedOptions.find(option => option.value === String(value))

  useEffect(() => {
    const handleClickOutside = (event) => {
      if(selectRef.current && !selectRef.current.contains(event.target)){
        setOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if(event.key === 'Escape'){
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSelect = (nextValue) => {
    onChange?.(nextValue)
    setOpen(false)
  }

  const isHeroVariant = variant === 'hero'
  const triggerClassName = isHeroVariant
    ? `flex w-full items-center justify-between gap-3 bg-transparent text-left text-sm text-slate-700 outline-none transition focus:outline-none disabled:cursor-not-allowed disabled:text-slate-400 ${buttonClassName}`
    : `flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm outline-none transition hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${buttonClassName}`

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {label && <span className='mb-2 block text-sm font-semibold text-slate-700'>{label}</span>}
      <button
        type='button'
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        className={triggerClassName}
      >
        <span className={`${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <span className={`h-2 w-2 shrink-0 rotate-45 border-b-2 border-r-2 border-slate-400 transition ${open ? 'rotate-[225deg]' : ''}`}></span>
      </button>

      {open && !disabled && (
        <div className={`absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl ${menuClassName}`}>
          {normalizedOptions.map((option) => {
            const selected = option.value === String(value)
            return (
              <button
                key={option.value}
                type='button'
                onClick={() => handleSelect(option.value)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${selected ? 'bg-primary/10 font-semibold text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
              >
                <span>{option.label}</span>
                {selected && <span className='h-2 w-2 rounded-full bg-primary'></span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CustomSelect
