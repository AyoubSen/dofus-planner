// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        theme: {
          'bg-primary': 'var(--theme-bg-primary)',
          'bg-secondary': 'var(--theme-bg-secondary)',
          'bg-tertiary': 'var(--theme-bg-tertiary)',
          'bg-card': 'var(--theme-bg-card)',
          'bg-card-hover': 'var(--theme-bg-card-hover)',
          'text-primary': 'var(--theme-text-primary)',
          'text-secondary': 'var(--theme-text-secondary)',
          'text-muted': 'var(--theme-text-muted)',
          'border': 'var(--theme-border)',
          'border-hover': 'var(--theme-border-hover)',
          'accent-orange': 'var(--theme-accent-orange)',
          'accent-orange-hover': 'var(--theme-accent-orange-hover)',
          'accent-blue': 'var(--theme-accent-blue)',
          'accent-blue-hover': 'var(--theme-accent-blue-hover)',
          'accent-emerald': 'var(--theme-accent-emerald)',
          'accent-emerald-hover': 'var(--theme-accent-emerald-hover)',
          'accent-yellow': 'var(--theme-accent-yellow)',
          'accent-yellow-hover': 'var(--theme-accent-yellow-hover)',
          'accent-purple': 'var(--theme-accent-purple)',
          'accent-red': 'var(--theme-accent-red)',
          'header-bg': 'var(--theme-header-bg)',
          'footer-bg': 'var(--theme-footer-bg)',
        }
      },
      borderRadius: {
        'theme-card': 'var(--theme-card-radius)',
        'theme-button': 'var(--theme-button-radius)',
        'theme-input': 'var(--theme-input-radius)',
      },
      boxShadow: {
        'theme-sm': 'var(--theme-shadow-sm)',
        'theme-md': 'var(--theme-shadow-md)',
        'theme-lg': 'var(--theme-shadow-lg)',
        'theme-glow-orange': 'var(--theme-shadow-glow-orange)',
        'theme-glow-blue': 'var(--theme-shadow-glow-blue)',
      },
      backdropBlur: {
        'theme': 'var(--theme-card-backdrop)',
      }
    }
  }
}
