import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type Variant = 'solid' | 'outline' | 'link' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  icon?: IconName
  children: ReactNode
}

// ปุ่มทั่วไป
export function Button({ variant = 'outline', size = 'md', icon, className = '', children, ...rest }: ButtonProps) {
  const cls = variant === 'link' ? 'ulink' : `btn btn-${variant} btn-${size}`
  return (
    <button type="button" className={`${cls} ${className}`.trim()} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName
  label: string
  badge?: number
  badgeColor?: 'accent' | 'accent-2'
}

// ปุ่มไอคอน มีตัวเลขมุมขวาบนได้
export function IconButton({ icon, label, badge, badgeColor = 'accent', className = '', ...rest }: IconButtonProps) {
  return (
    <button type="button" className={`icon-btn ${className}`.trim()} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={18} stroke={1.8} />
      {!!badge && (
        <span key={badge} className={`badge badge-${badgeColor}`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}
