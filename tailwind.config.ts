// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        theme: {
          'bg-primary': 'var(--color-bg-primary)',
          'bg-secondary': 'var(--color-bg-secondary)',
          'bg-hover': 'var(--color-bg-hover)',
          'border': 'var(--color-border)',
          'border-hover': 'var(--color-border-hover)',
          'text-primary': 'var(--color-text-primary)',
          'text-secondary': 'var(--color-text-secondary)',
          'accent': 'var(--color-accent)',
          'accent-hover': 'var(--color-accent-hover)',
        }
      },
      borderRadius: {
        'theme': 'var(--border-radius)',
      },
      boxShadow: {
        'theme-glow': '0 0 15px var(--color-accent-glow)',
      }
    }
  }
}