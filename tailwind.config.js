/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
		fontFamily: {
			sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
			heading: ['Inter', 'system-ui', 'sans-serif'],
			body: ['Inter', 'system-ui', 'sans-serif'],
		},
		borderRadius: {
			lg: 'var(--radius)',
			md: 'calc(var(--radius) - 2px)',
			sm: 'calc(var(--radius) - 4px)'
		},
		boxShadow: {
			card: '0 1px 2px rgba(15, 23, 42, 0.06)',
			'card-hover': '0 4px 12px rgba(15, 23, 42, 0.08)',
		},
  		colors: {
  			navy: {
  				50: '#EEF2F8', 100: '#D8E0EC', 200: '#B9C6D8', 300: '#94A6BF',
  				400: '#6F84A6', 500: '#4E6788', 600: '#344F73', 700: '#16335C',
  				800: '#102744', 900: '#0B1F3A',
  			},
  			gold: {
  				50: '#FBF5E1', 100: '#F4E6B8', 200: '#E8D08A', 300: '#DDBD5C',
  				400: '#D4AC3D', 500: '#C9A227', 600: '#B08C1E', 700: '#8F721A',
  				800: '#6E5816', 900: '#4A3C12',
  			},
  			success: {
  				DEFAULT: '#15803D', 50: '#F0FDF4', 100: '#DCFCE7', 600: '#15803D', 700: '#166534',
  			},
  			warning: {
  				DEFAULT: '#B45309', 50: '#FFFBEB', 100: '#FEF3C7', 600: '#B45309', 700: '#92400E',
  			},
  			danger: {
  				DEFAULT: '#B91C1C', 50: '#FEF2F2', 100: '#FEE2E2', 600: '#B91C1C', 700: '#991B1B',
  			},
  			info: {
  				DEFAULT: '#1D4ED8', 50: '#EFF6FF', 100: '#DBEAFE', 600: '#1D4ED8', 700: '#1E40AF',
  			},
  			neutral: {
  				DEFAULT: '#64748B', 50: '#F8FAFC', 100: '#F1F5F9', 600: '#64748B', 700: '#475569',
  			},
  			meta: '#94A3B8',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
