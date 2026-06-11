'use client'

import { useState, useRef, useCallback, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

export default function TagInput({ value, onChange, placeholder = 'Ajouter une valeur...' }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
  }, [value, onChange])

  const removeTag = useCallback((index: number) => {
    const updated = value.filter((_, i) => i !== index)
    onChange(updated)
  }, [value, onChange])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    const newTags = pasted
      .split(/[,;\n]/)
      .map(v => v.trim())
      .filter(Boolean)

    if (newTags.length > 0) {
      const combined = [...value]
      newTags.forEach(tag => {
        if (!combined.includes(tag)) {
          combined.push(tag)
        }
      })
      onChange(combined)
      setInputValue('')
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 min-h-[38px] px-2.5 py-1.5 bg-[#08080a] border border-white/[0.08] rounded-md focus-within:border-[#c9a84c]/40 transition-colors cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-medium bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30 animate-in fade-in duration-150"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeTag(index)
            }}
            className="ml-0.5 hover:bg-[#c9a84c]/25 rounded-full p-0.5 transition-colors"
            aria-label={`Supprimer ${tag}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onPaste={handlePaste}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] bg-transparent text-[#f5f5f0] text-[12px] outline-none placeholder:text-[#606060]"
      />
    </div>
  )
}
