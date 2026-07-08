/**
 * Button.jsx — reusable button component
 *
 * Variants: primary (sky blue), secondary (slate outline), danger (red)
 * Sizes: sm, md (default), lg
 * Handles loading state with a spinner and disabled state.
 */

const VARIANT_CLASSES = {
  primary: 'bg-sky-600 hover:bg-sky-500 text-white border-transparent focus-visible:ring-sky-500',
  secondary: 'bg-transparent hover:bg-slate-800 text-slate-300 border-slate-700 focus-visible:ring-slate-500',
  danger: 'bg-red-600 hover:bg-red-500 text-white border-transparent focus-visible:ring-red-500',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-100 border-transparent focus-visible:ring-slate-500',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

function LoadingDots() {
  return (
    <svg className="animate-spin h-4 w-4 mr-2 inline" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium border rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      className={`${base} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <LoadingDots />}
      {children}
    </button>
  );
}
