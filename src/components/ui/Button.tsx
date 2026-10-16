/**
 * Button — primitif tombol JalurKu (design.md §5.3).
 *
 * Varian:
 *  - primary   : brand Grape, CTA utama. `brutal` menambah border + offset shadow.
 *  - volt       : Volt Lime, untuk 1 aksi "paling diinginkan" per layar (teks gelap).
 *  - secondary : surface + border 2px.
 *  - ghost      : tanpa background, aksi minor.
 *  - danger     : aksi destruktif / gate (merah).
 *
 * Aturan: min-height 48px (target ≥ 44pt), feedback tap (scale 0.96) + haptic,
 * state loading & disabled jelas. Thumb-first: pakai `block`/`w-full` di bottom bar.
 */

import React from 'react'
import { Loader2 } from 'lucide-react'
import { haptic, type HapticPattern, HAPTIC } from '../../lib/haptics'

type Variant = 'primary' | 'volt' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  /** Tambah border tegas + offset shadow (soft neo-brutalism) untuk CTA utama. */
  brutal?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  /** Pola getar saat ditekan; default HAPTIC.tap. `false` untuk mematikan. */
  haptics?: HapticPattern | false
}

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 ' +
    'disabled:bg-brand-500/50 shadow-soft',
  volt:
    'bg-accent-lime text-slate-900 hover:brightness-95 active:brightness-90 ' +
    'disabled:opacity-50 shadow-soft font-bold',
  secondary:
    'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ' +
    'border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 ' +
    'dark:hover:border-slate-600 active:bg-slate-50 dark:active:bg-slate-800',
  ghost:
    'bg-transparent text-slate-700 dark:text-slate-200 ' +
    'hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200/70 dark:active:bg-slate-700',
  danger:
    'bg-danger text-white hover:brightness-110 active:brightness-95 disabled:opacity-50 shadow-soft',
}

const SIZE: Record<Size, string> = {
  sm: 'min-h-[40px] px-3 text-sm gap-1.5 rounded-[10px]',
  md: 'min-h-[48px] px-4 text-sm gap-2 rounded-2xl',
  lg: 'min-h-[52px] px-5 text-base gap-2 rounded-2xl',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  block = false,
  brutal = false,
  loading = false,
  loadingText = 'Sebentar…',
  leftIcon,
  rightIcon,
  haptics = HAPTIC.tap,
  className = '',
  children,
  disabled,
  onClick,
  ...rest
}) => {
  const isDisabled = disabled || loading

  const brutalCls = brutal
    ? 'border-2 border-slate-900 dark:border-slate-100 shadow-[var(--shadow-brutal)] ' +
      'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
    : ''

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return
    if (typeof haptics === 'number' || Array.isArray(haptics)) haptic(haptics)
    onClick?.(e)
  }

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={handleClick}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center font-semibold select-none',
        'transition-[transform,background-color,box-shadow,filter] duration-[160ms]',
        'ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
        'disabled:cursor-not-allowed',
        !isDisabled ? 'active:scale-[0.96] cursor-pointer' : '',
        VARIANT[variant],
        SIZE[size],
        brutalCls,
        block ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  )
}

export default Button
