import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'destructive';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark shadow-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 active:bg-slate-100 font-medium shadow-xs',
  destructive:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 font-semibold shadow-sm',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
