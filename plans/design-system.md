# Massage Bot Design System
## Glassmorphism + Premium Animations

---

## 📋 Зміст

1. [Design Tokens](#1-design-tokens)
2. [Glassmorphism Foundation](#2-glassmorphism-foundation)
3. [Animation System](#3-animation-system)
4. [Component Library](#4-component-library)
5. [Page Designs](#5-page-designs)
6. [Admin Access Button](#6-admin-access-button)
7. [Implementation Guide](#7-implementation-guide)

---

## 1. Design Tokens

### 1.1 Кольорова палітра

```css
/* ============================================
   PREMIUM COLOR PALETTE
   ============================================ */

:root {
  /* Primary Gradient Colors */
  --color-primary-50: #f5f3ff;
  --color-primary-100: #ede9fe;
  --color-primary-200: #ddd6fe;
  --color-primary-300: #c4b5fd;
  --color-primary-400: #a78bfa;
  --color-primary-500: #8b5cf6;  /* Main Violet */
  --color-primary-600: #7c3aed;
  --color-primary-700: #6d28d9;
  --color-primary-800: #5b21b6;
  --color-primary-900: #4c1d95;

  /* Pink Accent */
  --color-pink-300: #f9a8d4;
  --color-pink-400: #f472b6;
  --color-pink-500: #ec4899;  /* Main Pink */
  --color-pink-600: #db2777;

  /* Blue Accent */
  --color-blue-300: #93c5fd;
  --color-blue-400: #60a5fa;
  --color-blue-500: #3b82f6;  /* Main Blue */
  --color-blue-600: #2563eb;

  /* Cyan Accent */
  --color-cyan-300: #67e8f9;
  --color-cyan-400: #22d3ee;
  --color-cyan-500: #06b6d4;

  /* Neutral Colors */
  --color-white: #ffffff;
  --color-black: #000000;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Glassmorphism Backgrounds */
  --glass-white: rgba(255, 255, 255, 0.1);
  --glass-white-medium: rgba(255, 255, 255, 0.2);
  --glass-white-strong: rgba(255, 255, 255, 0.3);
  --glass-dark: rgba(0, 0, 0, 0.2);
  --glass-dark-medium: rgba(0, 0, 0, 0.4);
  --glass-dark-strong: rgba(0, 0, 0, 0.6);

  /* Gradient Definitions */
  --gradient-primary: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #3b82f6 100%);
  --gradient-primary-soft: linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #60a5fa 100%);
  --gradient-sunset: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
  --gradient-ocean: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  --gradient-aurora: linear-gradient(135deg, #8b5cf6 0%, #ec4899 25%, #3b82f6 50%, #06b6d4 100%);
  --gradient-dark: linear-gradient(180deg, #1f2937 0%, #111827 100%);
  
  /* Glass Border Gradients */
  --border-gradient-primary: linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(236, 72, 153, 0.3), rgba(59, 130, 246, 0.5));
  --border-gradient-glow: linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.6));
}
```

### 1.2 Типографіка

```css
:root {
  /* Font Families */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Cal Sans', 'Inter', sans-serif; /* For headings */
  
  /* Font Sizes */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Letter Spacing */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
}
```

### 1.3 Spacing & Layout

```css
:root {
  /* Spacing Scale */
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */

  /* Border Radius */
  --radius-sm: 0.375rem;   /* 6px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-xl: 1rem;       /* 16px */
  --radius-2xl: 1.25rem;   /* 20px */
  --radius-3xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Premium Glow Shadows */
  --shadow-glow-primary: 0 0 40px rgba(139, 92, 246, 0.3);
  --shadow-glow-pink: 0 0 40px rgba(236, 72, 153, 0.3);
  --shadow-glow-blue: 0 0 40px rgba(59, 130, 246, 0.3);
  --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  
  /* Z-Index Scale */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
}
```

---

## 2. Glassmorphism Foundation

### 2.1 Core Glass Classes

```css
/* ============================================
   GLASSMORPHISM UTILITY CLASSES
   ============================================ */

/* Base Glass Panel */
.glass {
  background: var(--glass-white);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-dark {
  background: var(--glass-dark);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-strong {
  background: var(--glass-white-strong);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Glass with Gradient Border */
.glass-bordered {
  position: relative;
  background: var(--glass-white-medium);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: var(--radius-2xl);
}

.glass-bordered::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: var(--border-gradient-primary);
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* Premium Card Glass */
.glass-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 
    0 8px 32px 0 rgba(31, 38, 135, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-2xl);
}

/* Floating Glass Panel */
.glass-float {
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  border-radius: var(--radius-3xl);
}

/* Glass Input */
.glass-input {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  transition: all 0.3s ease;
}

.glass-input:focus {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  outline: none;
}

/* Glass Button */
.glass-button {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-xl);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-button:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.glass-button:active {
  transform: translateY(0);
}
```

### 2.2 Gradient Backgrounds

```css
/* ============================================
   PREMIUM BACKGROUNDS
   ============================================ */

/* Animated Gradient Background */
.bg-gradient-animated {
  background: linear-gradient(-45deg, #8b5cf6, #ec4899, #3b82f6, #06b6d4);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Mesh Gradient Background */
.bg-mesh {
  background-color: #0f172a;
  background-image: 
    radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%),
    radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%),
    radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%),
    radial-gradient(at 0% 50%, hsla(253,16%,7%,1) 0, transparent 50%),
    radial-gradient(at 50% 50%, hsla(225,39%,30%,1) 0, transparent 50%),
    radial-gradient(at 100% 50%, hsla(339,49%,30%,1) 0, transparent 50%),
    radial-gradient(at 0% 100%, hsla(253,16%,7%,1) 0, transparent 50%),
    radial-gradient(at 50% 100%, hsla(225,39%,30%,1) 0, transparent 50%),
    radial-gradient(at 100% 100%, hsla(339,49%,30%,1) 0, transparent 50%);
}

/* Soft Aurora Background */
.bg-aurora {
  background: 
    radial-gradient(ellipse at top, rgba(139, 92, 246, 0.15), transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(236, 72, 153, 0.15), transparent 50%),
    radial-gradient(ellipse at bottom left, rgba(59, 130, 246, 0.15), transparent 50%),
    #0f172a;
}

/* Noise Texture Overlay */
.bg-noise {
  position: relative;
}

.bg-noise::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
}
```

---

## 3. Animation System

### 3.1 Page Transitions

```typescript
// ============================================
// PAGE TRANSITION VARIANTS (Framer Motion)
// ============================================

export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1],
    },
  },
};

export const slideVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  }),
};

export const fadeScaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};
```

### 3.2 Stagger Animations

```typescript
// ============================================
// STAGGER CONTAINER VARIANTS
// ============================================

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const cardStagger = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const listStagger = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};
```

### 3.3 Micro-interactions

```typescript
// ============================================
// HOVER & TAP ANIMATIONS
// ============================================

export const buttonHover = {
  rest: {
    scale: 1,
    boxShadow: '0 0 0 rgba(139, 92, 246, 0)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

export const cardHover = {
  rest: {
    y: 0,
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  },
  hover: {
    y: -8,
    boxShadow: '0 20px 40px 0 rgba(31, 38, 135, 0.25)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

export const glowHover = {
  rest: {
    filter: 'brightness(1)',
  },
  hover: {
    filter: 'brightness(1.1)',
    transition: {
      duration: 0.3,
    },
  },
};

export const iconSpin = {
  rest: { rotate: 0 },
  hover: { 
    rotate: 180,
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

export const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const shimmerAnimation = {
  background: [
    'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
    'linear-gradient(90deg, rgba(255,255,255,0) 100%, rgba(255,255,255,0.1) 150%, rgba(255,255,255,0) 200%)',
  ],
  backgroundSize: '200% 100%',
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
};
```

### 3.4 Special Effects

```typescript
// ============================================
// SPECIAL ANIMATION EFFECTS
// ============================================

export const morphingGradient = {
  animate: {
    background: [
      'radial-gradient(circle at 0% 0%, #8b5cf6 0%, transparent 50%)',
      'radial-gradient(circle at 100% 0%, #ec4899 0%, transparent 50%)',
      'radial-gradient(circle at 100% 100%, #3b82f6 0%, transparent 50%)',
      'radial-gradient(circle at 0% 100%, #06b6d4 0%, transparent 50%)',
      'radial-gradient(circle at 0% 0%, #8b5cf6 0%, transparent 50%)',
    ],
    transition: {
      duration: 10,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const gradientText = {
  background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #3b82f6)',
  backgroundSize: '200% 200%',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  animation: {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};
```

---

## 4. Component Library

### 4.1 GlassCard Component

```typescript
// components/ui/GlassCard.tsx
import { motion } from 'framer-motion';
import { cardStagger, cardHover } from '../../shared/animations/variants';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'float' | 'gradient';
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className = '',
  variant = 'default',
  hover = true,
  onClick,
}: GlassCardProps) {
  const variants = {
    default: 'glass-card',
    bordered: 'glass-bordered',
    float: 'glass-float',
    gradient: 'glass-card bg-gradient-to-br from-white/10 to-white/5',
  };

  return (
    <motion.div
      className={`${variants[variant]} ${className}`}
      variants={cardStagger}
      initial="rest"
      whileHover={hover ? 'hover' : undefined}
      animate="rest"
      {...(onClick && { onClick, style: { cursor: 'pointer' } })}
    >
      {hover && (
        <motion.div
          variants={cardHover}
          className="absolute inset-0 rounded-inherit pointer-events-none"
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
```

### 4.2 GradientButton Component

```typescript
// components/ui/GradientButton.tsx
import { motion } from 'framer-motion';
import { buttonHover } from '../../shared/animations/variants';

interface GradientButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function GradientButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled,
  loading,
}: GradientButtonProps) {
  const baseStyles = 'relative overflow-hidden font-medium rounded-xl transition-all';
  
  const variants = {
    primary: 'bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25',
    secondary: 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-400 text-white shadow-lg shadow-blue-500/25',
    ghost: 'bg-transparent border border-white/20 text-white hover:bg-white/10',
    glass: 'glass-button text-white',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      variants={buttonHover}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0 opacity-0 hover:opacity-100"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        }}
        animate={{
          x: ['-100%', '100%'],
          transition: { duration: 0.6, ease: 'easeInOut' },
        }}
      />
      
      {loading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          Завантаження...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
```

### 4.3 GlassInput Component

```typescript
// components/ui/GlassInput.tsx
import { motion } from 'framer-motion';

interface GlassInputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  error?: string;
}

export function GlassInput({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  icon,
  error,
}: GlassInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-white/80">{label}</label>
      )}
      <motion.div
        className="relative"
        whileFocus={{ scale: 1.01 }}
      >
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full glass-input py-3 px-4 
            ${icon ? 'pl-12' : ''}
            text-white placeholder-white/40
            transition-all duration-300
            focus:ring-2 focus:ring-purple-500/50
          `}
        />
      </motion.div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
```

### 4.4 SectionHeader Component

```typescript
// components/ui/SectionHeader.tsx
import { motion } from 'framer-motion';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

export function SectionHeader({
  title,
  subtitle,
  align = 'left',
  size = 'md',
}: SectionHeaderProps) {
  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const titleSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl md:text-5xl',
  };

  return (
    <motion.div
      className={`${alignStyles[align]} mb-8`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2
        className={`
          ${titleSizes[size]} font-bold mb-3
          bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400
          bg-clip-text text-transparent
        `}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-white/60 text-lg">{subtitle}</p>
      )}
    </motion.div>
  );
}
```

### 4.5 ServiceCard Component

```typescript
// components/cards/ServiceCard.tsx
import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';

interface ServiceCardProps {
  name: string;
  description?: string;
  imageUrl?: string;
  minPrice: number;
  duration: string;
  onBook: () => void;
}

export function ServiceCard({
  name,
  description,
  imageUrl,
  minPrice,
  duration,
  onBook,
}: ServiceCardProps) {
  return (
    <GlassCard className="p-0 overflow-hidden group">
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <motion.img
          src={imageUrl || '/placeholder-service.jpg'}
          alt={name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.6 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Duration Badge */}
        <div className="absolute top-3 right-3 glass px-3 py-1 rounded-full">
          <span className="text-sm text-white/90">{duration}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-semibold text-white mb-2">{name}</h3>
        {description && (
          <p className="text-white/60 text-sm mb-4 line-clamp-2">{description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-white/50">Від</span>
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
              {minPrice} ₴
            </p>
          </div>
          
          <motion.button
            onClick={onBook}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-pink-500 rounded-xl text-white font-medium shadow-lg shadow-purple-500/25"
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)' }}
            whileTap={{ scale: 0.95 }}
          >
            Записатись
          </motion.button>
        </div>
      </div>
    </GlassCard>
  );
}
```

### 4.6 MasterCard Component

```typescript
// components/cards/MasterCard.tsx
import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { Star } from 'lucide-react'; // або інша іконка

interface MasterCardProps {
  name: string;
  photoUrl?: string;
  specialization?: string;
  rating: number;
  reviewCount: number;
  isActive?: boolean;
  onSelect?: () => void;
}

export function MasterCard({
  name,
  photoUrl,
  specialization,
  rating,
  reviewCount,
  isActive,
  onSelect,
}: MasterCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
    >
      <GlassCard 
        className={`p-4 cursor-pointer transition-all ${
          isActive ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-transparent' : ''
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <motion.img
              src={photoUrl || '/placeholder-avatar.jpg'}
              alt={name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white/20"
              whileHover={{ scale: 1.1 }}
            />
            {isActive && (
              <motion.div
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">{name}</h4>
            {specialization && (
              <p className="text-sm text-white/60 truncate">{specialization}</p>
            )}
            
            {/* Rating */}
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium text-white">{rating.toFixed(1)}</span>
              <span className="text-sm text-white/50">({reviewCount})</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
```

### 4.7 BottomNav Component (Redesigned)

```typescript
// components/layout/BottomNav.tsx
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Calendar, Bell, User } from 'lucide-react'; // іконки

const navItems = [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/booking', icon: Calendar, labelKey: 'nav.booking' },
  { path: '/waitlist', icon: Bell, labelKey: 'nav.waitlist' },
  { path: '/profile', icon: User, labelKey: 'nav.profile' },
];

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass Background */}
      <div className="glass-float mx-4 mb-4 rounded-2xl">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center py-2 px-4"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-pink-500/20 rounded-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
                
                <motion.span
                  className="text-xs mt-1"
                  animate={{
                    color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {t(item.labelKey)}
                </motion.span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
```

---

## 5. Page Designs

### 5.1 HomePage Design

```typescript
// pages/home/HomePage.tsx - Design Specification

/**
 * HOMEPAGE LAYOUT STRUCTURE:
 * 
 * 1. HERO SECTION
 *    - Full-width gradient background with aurora effect
 *    - Animated gradient text headline
 *    - Quick booking CTA button
 *    - Floating decorative elements
 * 
 * 2. SERVICES CAROUSEL
 *    - Horizontal scrollable cards with snap points
 *    - Glass cards with image, title, price
 *    - Stagger animation on scroll
 * 
 * 3. MASTERS SHOWCASE
 *    - Grid layout (2 columns on mobile, 4 on desktop)
 *    - Avatar with glow effect on hover
 *    - Rating and specialization
 * 
 * 4. PROMOTIONS BANNER
 *    - Full-width glass panel
 *    - Countdown timer for limited offers
 *    - Swipeable cards
 * 
 * 5. REVIEWS SECTION
 *    - Testimonial cards with glass effect
 *    - Star ratings with animation
 *    - Avatar stack of recent reviewers
 * 
 * 6. LOCATION & CONTACT
 *    - Map integration placeholder
 *    - Contact info in glass card
 *    - Quick action buttons
 * 
 * 7. FOOTER
 *    - Minimal glass footer
 *    - Social links with hover effects
 */

export const HomePageDesign = {
  hero: {
    background: 'bg-aurora with animated gradient orbs',
    headline: {
      text: 'Преміум масаж у серці міста',
      style: 'text-4xl md:text-6xl font-bold gradient-text',
      animation: 'fade-in-up with stagger on letters',
    },
    cta: {
      text: 'Записатись зараз',
      style: 'gradient-button-primary with glow effect',
    },
  },
  services: {
    layout: 'horizontal-scroll with snap-x',
    cardStyle: 'glass-card with image overlay',
    animation: 'stagger-children 0.1s delay',
  },
  masters: {
    layout: 'grid-cols-2 md:grid-cols-4',
    cardStyle: 'glass-card with avatar ring effect',
    hover: 'scale up with shadow increase',
  },
  promotions: {
    layout: 'full-width glass-float banner',
    countdown: 'digital display with flip animation',
  },
  reviews: {
    layout: 'carousel with 3 visible cards',
    cardStyle: 'glass-card with quote icon',
    rating: 'animated star fill',
  },
};
```

**HomePage Visual Mockup:**

```
┌─────────────────────────────────────────┐
│  [Aurora Background with Animated Orbs] │
│                                         │
│   Преміум масаж                         │
│   у серці міста                         │
│   [Gradient Text Animation]             │
│                                         │
│   [✨ Записатись зараз ✨]              │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🔥 Акційні пропозиції                  │
│  ┌─────────────────────────────────┐    │
│  │ [Glass Banner with Countdown]   │    │
│  │ -20% на перший візит!           │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  💆 Наші послуги              [Всі >]   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │[Image]  │ │[Image]  │ │[Image]  │   │
│  │Масаж    │ │СПА      │ │...      │   │
│  │Від 800₴ │ │Від 1200₴│ │         │   │
│  │[Запис]  │ │[Запис]  │ │         │   │
│  └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  👤 Наші майстри                        │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │[A]  │ │[A]  │ │[A]  │ │[A]  │       │
│  │Анна │ │Олег │ │...  │ │...  │       │
│  │⭐4.9│ │⭐5.0│ │     │ │     │       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
└─────────────────────────────────────────┘
```

### 5.2 BookingPage Design

```typescript
// pages/booking/BookingPage.tsx - Design Specification

/**
 * BOOKING WIZARD STRUCTURE:
 * 
 * PROGRESS INDICATOR:
 * - Glass stepper with 4 steps
 * - Animated progress line
 * - Checkmark animation for completed steps
 * 
 * STEP 1: SERVICE SELECTION
 * - Category tabs with glass effect
 * - Service cards with image, description, price
 * - Multi-select with chip display
 * - Duration selector per service
 * 
 * STEP 2: MASTER SELECTION
 * - Filter by specialization
 * - Master cards with availability indicator
 * - "Any master" option with dice animation
 * 
 * STEP 3: DATE & TIME
 * - Custom calendar with glass days
 * - Time slots grid with availability
 * - Selected slot highlight with glow
 * 
 * STEP 4: CONFIRMATION
 * - Order summary glass panel
 * - Promo code input with validation
 * - Final price with discount breakdown
 * - Booking button with success animation
 */

export const BookingPageDesign = {
  stepper: {
    style: 'glass with connecting line',
    animation: 'progress fill with spring',
    steps: ['Послуга', 'Майстер', 'Час', 'Підтвердження'],
  },
  serviceStep: {
    layout: 'category-tabs + scrollable cards',
    cardStyle: 'glass-card with selection ring',
    selection: 'checkmark appear with scale bounce',
  },
  masterStep: {
    layout: 'filter-chips + master grid',
    availability: 'green dot pulse animation',
    cardStyle: 'glass-card with hover lift',
  },
  datetimeStep: {
    calendar: 'glass-calendar custom styled',
    slots: 'time-slot grid with glass buttons',
    selection: 'purple glow with scale effect',
  },
  confirmStep: {
    summary: 'glass-float panel with sections',
    promo: 'glass-input with validate button',
    cta: 'full-width gradient button with shimmer',
  },
};
```

**BookingPage Visual Flow:**

```
┌─────────────────────────────────────────┐
│  ← Назад                                │
│  ───────●────  [Stepper]                │
│  1  2  3  4                             │
├─────────────────────────────────────────┤
│  Оберіть послугу                        │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │Всі     │ │Масаж   │ │СПА     │...    │
│  │[Active]│ │       │ │       │       │
│  └────────┘ └────────┘ └────────┘       │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [Image]  Класичний масаж        │    │
│  │          ⏱ 60/90/120 хв        │    │
│  │          від 800₴               │    │
│  │          [○] [○] [●]           │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [Image]  СПА-програма           │    │
│  │          ⏱ 120 хв               │    │
│  │          2500₴                  │    │
│  │          [✓ Selected]           │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [        Далі (1 послуга) →        ]   │
└─────────────────────────────────────────┘
```

### 5.3 ProfilePage Design

```typescript
// pages/profile/ProfilePage.tsx - Design Specification

/**
 * PROFILE PAGE STRUCTURE:
 * 
 * HEADER:
 * - Large avatar with edit overlay on hover
 * - User name with gradient text
 * - Telegram connection badge
 * - Quick stats (bookings, loyalty points)
 * 
 * LOYALTY CARD:
 * - Premium glass card with gradient border
 * - Progress bar to next level
 * - Current discount badge
 * - History of earned points
 * 
 * UPCOMING BOOKINGS:
 * - Timeline view with glass cards
 * - Countdown to next appointment
 * - Quick actions (reschedule, cancel)
 * 
 * BOOKING HISTORY:
 * - Accordion list with glass panels
 * - Filter by status (completed, cancelled)
 * - Rebook button with animation
 * 
 * SETTINGS:
 * - Language selector with flag icons
 * - Notification preferences
 * - Privacy settings
 * - Logout button with confirm modal
 */

export const ProfilePageDesign = {
  header: {
    avatar: '128px with ring gradient and edit overlay',
    name: 'gradient-text animation',
    stats: '3 glass stat cards in row',
  },
  loyalty: {
    card: 'glass-bordered with premium glow',
    progress: 'animated gradient fill bar',
    level: 'badge with star icon and pulse',
  },
  bookings: {
    upcoming: 'timeline with glass cards',
    history: 'accordion with slide animation',
    empty: 'illustration with CTA button',
  },
  settings: {
    layout: 'glass sections with dividers',
    language: 'segmented control with flags',
    toggle: 'glass-switch with spring',
  },
};
```

### 5.4 AdminPanel Design

```typescript
// pages/admin/AdminDashboardPage.tsx - Design Specification

/**
 * ADMIN PANEL STRUCTURE:
 * 
 * SIDEBAR:
 * - Collapsible glass sidebar
 * - Icons with label on expand
 * - Active item with gradient indicator
 * - User profile mini-card at bottom
 * 
 * DASHBOARD:
 * - Revenue card with chart placeholder
 * - Stats grid with glass cards
 * - Recent activity feed
 * - Quick action buttons
 * 
 * TABLES:
 * - Glass table headers
 * - Row hover with highlight
 * - Sortable columns
 * - Action dropdowns
 * 
 * MODALS:
 * - Glass modal backdrop
 * - Form inputs with validation
 * - Confirmation with animation
 */

export const AdminPanelDesign = {
  sidebar: {
    style: 'glass-dark with collapsible width',
    active: 'gradient indicator with slide animation',
    collapse: 'icon-only mode with tooltip',
  },
  dashboard: {
    revenue: 'large glass-float card with gradient',
    stats: '4-column grid of glass cards',
    chart: 'placeholder for future integration',
  },
  tables: {
    header: 'glass-strong sticky header',
    row: 'glass with hover highlight',
    actions: 'glass-button dropdown',
  },
  modals: {
    backdrop: 'glass-dark with blur',
    content: 'glass-float with max-width',
    animation: 'scale-up with fade',
  },
};
```

---

## 6. Admin Access Button

### 6.1 Implementation Specification

```typescript
// components/admin/AdminAccessButton.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useIsAdmin } from '../../shared/stores/auth';
import { Shield, ChevronRight } from 'lucide-react';

export function AdminAccessButton() {
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  if (!isAdmin) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, x: 50, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 50, scale: 0.9 }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 25,
          delay: 0.5 
        }}
        onClick={() => navigate('/admin')}
        className="
          fixed right-4 top-4 z-50
          flex items-center gap-2
          px-4 py-2.5
          glass-card
          text-white/90 font-medium text-sm
          group
          hover:shadow-glow-primary
        "
        whileHover={{ scale: 1.05, x: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Icon with glow */}
        <motion.div
          className="relative"
          animate={{ 
            rotate: [0, 5, -5, 0],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatDelay: 3 
          }}
        >
          <Shield className="w-5 h-5 text-violet-400" />
          
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-violet-400/30"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        </motion.div>

        <span className="hidden sm:inline">Адмін-панель</span>
        
        <motion.div
          className="ml-1"
          initial={{ x: 0 }}
          whileHover={{ x: 3 }}
        >
          <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white" />
        </motion.div>
      </motion.button>
    </AnimatePresence>
  );
}
```

### 6.2 Integration Points

```typescript
// app/App.tsx - Integration

import { AdminAccessButton } from '../components/admin/AdminAccessButton';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TelegramProvider>
        <AuthInitializer />
        
        {/* Admin Button - visible on all pages for admins */}
        <AdminAccessButton />
        
        <AppRouter />
      </TelegramProvider>
    </QueryClientProvider>
  );
}
```

### 6.3 Alternative Inline Button

```typescript
// components/admin/InlineAdminButton.tsx
// For placement in BottomNav or Profile page

export function InlineAdminButton() {
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  if (!isAdmin) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 mb-4 cursor-pointer group"
      onClick={() => navigate('/admin')}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-white">Адмін-панель</h4>
            <p className="text-sm text-white/60">Керування салоном</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
      </div>
    </motion.div>
  );
}
```

---

## 7. Implementation Guide

### 7.1 CSS Setup (index.css additions)

```css
/* ============================================
   DESIGN SYSTEM IMPLEMENTATION
   Add to apps/web/src/index.css
   ============================================ */

/* Import Inter font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Base dark theme setup */
:root {
  /* Override existing variables */
  --color-bg: #0f172a;
  --color-text: #f8fafc;
  --color-hint: #94a3b8;
  
  /* Animation durations */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}

/* Global dark background */
body {
  background: #0f172a;
  background-image: 
    radial-gradient(ellipse at 0% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 100% 0%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 100% 100%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 0% 100%, rgba(6, 182, 212, 0.1) 0%, transparent 50%);
  background-attachment: fixed;
  color: var(--color-text);
  font-family: 'Inter', system-ui, sans-serif;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.5);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.7);
}

/* Utility classes */
.gradient-text {
  background: linear-gradient(135deg, #8b5cf6, #ec4899, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-balance {
  text-wrap: balance;
}

/* Safe area for mobile */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

/* Prevent content shift */
html {
  overflow-y: scroll;
}
```

### 7.2 Animation Variants File

```typescript
// shared/animations/variants.ts
// Create this file with all animation variants from section 3

export * from './pageTransitions';
export * from './staggerAnimations';
export * from './microInteractions';
export * from './specialEffects';
```

### 7.3 Tailwind Config Extensions

```javascript
// tailwind.config.ts additions
// Add these to extend the theme

const config = {
  theme: {
    extend: {
      colors: {
        glass: {
          white: 'rgba(255, 255, 255, 0.1)',
          'white-medium': 'rgba(255, 255, 255, 0.2)',
          'white-strong': 'rgba(255, 255, 255, 0.3)',
          dark: 'rgba(0, 0, 0, 0.2)',
        },
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'gradient-shift': 'gradientShift 15s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s linear infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
};
```

### 7.4 Phased Implementation Plan

**Phase 1: Foundation (1-2 дні)**
1. Оновити CSS змінні в [`index.css`](apps/web/src/index.css)
2. Додати glassmorphism utility classes
3. Створити файл з animation variants
4. Налаштувати темний фон для всього додатку

**Phase 2: Core Components (2-3 дні)**
1. Створити [`GlassCard`](components/ui/GlassCard.tsx) компонент
2. Створити [`GradientButton`](components/ui/GradientButton.tsx)
3. Створити [`SectionHeader`](components/ui/SectionHeader.tsx)
4. Оновити [`BottomNav`](components/layout/BottomNav.tsx)

**Phase 3: Page Redesigns (3-4 дні)**
1. Редизайн [`HomePage`](apps/web/src/pages/home/HomePage.tsx)
2. Редизайн [`BookingPage`](apps/web/src/pages/booking/BookingPage.tsx)
3. Редизайн [`ProfilePage`](apps/web/src/pages/profile/ProfilePage.tsx)
4. Редизайн Admin pages

**Phase 4: Polish (1-2 дні)**
1. Додати [`AdminAccessButton`](components/admin/AdminAccessButton.tsx)
2. Тестування анімацій на різних пристроях
3. Оптимізація продуктивності
4. Фінальні правки

### 7.5 Performance Considerations

```typescript
// Performance optimizations for animations

// 1. Use will-change sparingly
const optimizedStyle = {
  willChange: 'transform, opacity',
};

// 2. Use transform instead of position properties
<motion.div
  animate={{ 
    x: 100,  // Good ✓
    // left: 100, // Bad ✗
  }}
/>

// 3. Use layout animations carefully
<motion.div
  layout
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
/>

// 4. Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// 5. Use reduced motion preference
const prefersReducedMotion = 
  typeof window !== 'undefined' && 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={prefersReducedMotion ? {} : animationVariants}
/>
```

---

## 📎 Appendix

### A. Icon Recommendations

Використовуйте **Lucide React** або **Phosphor Icons**:

```bash
npm install lucide-react
# або
npm install @phosphor-icons/react
```

### B. Font Recommendations

- **Primary**: Inter (вже підключено через Google Fonts)
- **Display**: Cal Sans (для заголовків, опціонально)
- **Fallback**: system-ui stack

### C. Testing Checklist

- [ ] Анімації працюють плавно (60fps)
- [ ] Glass ефекти відображаються коректно в Safari
- [ ] Темний режим підтримується
- [ ] Адаптивність на всіх розмірах екрану
- [ ] Доступність (кольоровий контраст, focus states)
- [ ] Працює з `prefers-reduced-motion`
- [ ] Telegram WebApp інтеграція не порушена

---

*Design System created for Massage Bot v2.0*
*Last updated: 2026-03-03*
