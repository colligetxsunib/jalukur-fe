/**
 * BentoCard — kartu modular untuk layout bento (design.md §1.2, §5.3).
 *
 * Surface + radius lg (24px) + soft shadow. Varian:
 *  - plain   : kartu biasa.
 *  - feature : border 2px + strip aksen warna di kiri (kepribadian, anti-slop).
 *  - action  : brutal offset shadow + interaktif (bisa di-tap).
 *
 * `span` memudahkan tata letak grid bento (col-span-2 untuk kartu penting).
 * Bila `onClick` diberikan, kartu jadi tombol (role/tabIndex/keyboard) dengan feedback tap.
 */

import React from 'react'
import { haptic, HAPTIC } from '../../lib/haptics'

type Accent = 'brand' | 'safe' | 'match' | 'reach' | 'danger' | 'sky' | 'coral' | 'none'
type Variant = 'plain' | 'feature' | 'action'

export interface BentoCardProps {
  variant?: Variant
  accent?: Accent
  /** Lebar grid: 1 = col-span-1, 2 = col-span-2 (full di grid 2 kolom). */
  span?: 1 | 2
  onClick?: () => void
  className?: string
  children: React.ReactNode
  as?: 'div' | 'section' | 'article'
}

const ACCENT_STRIP: Record<Accent, string> = {
  brand: 'before:bg-brand-500',
  safe: 'before:bg-safe',
  match: 'before:bg-match',
  reach: 'before:bg-reach',
  danger: 'before:bg-danger',
  sky: 'before:bg-accent-sky',
  coral: 'before:bg-accent-coral',
  none: '',
}

export const BentoCard: React.FC<BentoCardProps> = ({
  variant = 'plain',
  accent = 'none',
  span = 1,
  onClick,
  className = '',
  children,
  as = 'div',
}) => {
  const interactive = typeof onClick === 'function'

  const base =
    'relative rounded-3xl bg-[var(--color-cream-card)] p-4 ' +
    'transition-[transform,box-shadow,border-color] duration-[160ms] ease-[cubic-bezier(0.22,1,0.36,1)]'

  const variantCls =
    variant === 'feature'
      ? 'border-2 border-[var(--color-ink)] shadow-[var(--shadow-brutal)] ' +
        (accent !== 'none'
          ? 'overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-2 ' +
            ACCENT_STRIP[accent]
          : '')
      : variant === 'action'
        ? 'border-2 border-[var(--color-ink)] shadow-[var(--shadow-brutal)]'
        : 'border-2 border-[var(--color-ink)] shadow-[var(--shadow-brutal)]'

  const interactiveCls = interactive
    ? 'cursor-pointer active:scale-[0.98] ' +
      (variant === 'action'
        ? 'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
        : 'hover:border-[color-mix(in_srgb,var(--color-ink)_28%,transparent)]') +
      ' focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50'
    : ''

  const spanCls = span === 2 ? 'col-span-2' : ''

  const cls = [base, variantCls, interactiveCls, spanCls, className].filter(Boolean).join(' ')

  if (interactive) {
    const handleActivate = () => {
      haptic(HAPTIC.select)
      onClick?.()
    }
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleActivate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleActivate()
          }
        }}
        className={cls}
      >
        {children}
      </div>
    )
  }

  const Tag = as
  return <Tag className={cls}>{children}</Tag>
}

export default BentoCard
