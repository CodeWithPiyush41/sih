import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'destructive';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-signal text-white hover:bg-signal-hover active:bg-signal-active disabled:bg-ink-muted/40 disabled:text-white/70 disabled:cursor-not-allowed',
  secondary:
    'bg-transparent border border-border text-ink hover:border-border-strong hover:bg-bg',
  destructive:
    'bg-transparent border border-danger text-danger hover:bg-danger-tint',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-btn px-4 py-2.5 text-body font-medium transition-colors duration-150 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
