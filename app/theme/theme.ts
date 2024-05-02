import {
  type CSSVariablesResolver,
  createTheme,
  rem,
  type VariantColorsResolver,
  defaultVariantColorsResolver,
  parseThemeColor,
  Button
} from '@mantine/core'

const variantColorResolver: VariantColorsResolver = (input) => {
  const defaultResolvedColors = defaultVariantColorsResolver(input)
  const parsedColor = parseThemeColor({
    color: input.color || input.theme.primaryColor,
    theme: input.theme
  })

  // Override some properties for button variant
  if (input.variant === 'outline' && parsedColor.color === 'black') {
    return {
      ...defaultResolvedColors,
      hover: 'var(--mantine-color-text)',
      hoverColor: 'var(--mantine-color-body)'
    }
  }

  // Completely override variant
  if (input.variant === 'outline' && parsedColor.color === 'white') {
    return {
      background: 'transparent',
      border: `${rem(1)} solid var(--mantine-color-body)`,
      color: 'var(--mantine-color-body)',
      hover: 'var(--mantine-color-body)',
      hoverColor: 'var(--mantine-color-text)'
    }
  }

  return defaultResolvedColors
}

const theme = createTheme({
  fontFamily:
    '"Rajdhani", -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji',
  headings: {
    fontFamily:
      '"Rajdhani", -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji'
  },
  defaultRadius: 0,
  cursorType: 'pointer',
  activeClassName: '',
  primaryColor: 'dark',
  other: {
    borderWidth: rem(2),
    fontWeights: {
      regular: '400',
      medium: '500',
      semiBold: '600',
      bold: '700'
    },
    headerHeight: rem(75)
  },
  variantColorResolver,
  components: {
    Button: Button.extend({
      styles: {
        root: {
          transition: 'color .2s, background .2s'
        }
      }
    })
  }
})

export const resolver: CSSVariablesResolver = (theme) => ({
  variables: {
    '--mantine-border-width': theme.other.borderWidth,
    '--mantine-fw-rg': theme.other.fontWeights.regular,
    '--mantine-fw-md': theme.other.fontWeights.medium,
    '--mantine-fw-sb': theme.other.fontWeights.semiBold,
    '--mantine-fw-b': theme.other.fontWeights.bold,
    '--mantine-header-height': theme.other.headerHeight
  },
  light: {
    '--mantine-color-anchor': 'var(--mantine-color-text)',
    '--mantine-color-dark-filled': 'var(--mantine-color-text)',
    '--mantine-color-dark-filled-hover': 'var(--mantine-color-text)',
    '--mantine-color-dark-outline': 'var(--mantine-color-text)',
    '--mantine-color-dark-light-color': 'var(--mantine-color-text)'
  },
  dark: {}
})

export default theme
