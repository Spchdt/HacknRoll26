/**
 * Centralized color configuration for light and dark modes
 * Use these constants throughout the app for consistent theming
 */

export const colors = {
  // Background colors
  bg: {
    primary: {
      light: 'bg-white',
      dark: 'bg-gray-900',
    },
    secondary: {
      light: 'bg-gray-50',
      dark: 'bg-gray-800',
    },
    tertiary: {
      light: 'bg-gray-100',
      dark: 'bg-gray-700',
    },
    input: {
      light: 'bg-white',
      dark: 'bg-gray-700',
    },
    hover: {
      light: 'hover:bg-gray-100',
      dark: 'hover:bg-gray-700',
    },
    terminal: 'bg-gray-950', // Always black regardless of theme
  },

  // Text colors
  text: {
    primary: {
      light: 'text-black',
      dark: 'text-white',
    },
    secondary: {
      light: 'text-gray-600',
      dark: 'text-gray-300',
    },
    tertiary: {
      light: 'text-gray-500',
      dark: 'text-gray-400',
    },
    muted: {
      light: 'text-gray-400',
      dark: 'text-gray-500',
    },
    link: {
      light: 'text-black hover:text-gray-600',
      dark: 'text-blue-400 hover:text-blue-300',
    },
    terminal: 'text-green-400', // Terminal text color
    success: {
      light: 'text-green-600',
      dark: 'text-green-400',
    },
    error: {
      light: 'text-red-600',
      dark: 'text-red-400',
    },
  },

  // Border colors
  border: {
    light: 'border-gray-200',
    dark: 'border-gray-600',
  },
  borderDivider: {
    light: 'border-gray-300',
    dark: 'border-gray-700',
  },

  // Button colors
  button: {
    primary: {
      light: 'bg-black text-white hover:bg-gray-800',
      dark: 'bg-gray-600 text-white hover:bg-gray-500',
    },
    secondary: {
      light: 'bg-gray-200 text-black hover:bg-gray-300',
      dark: 'bg-gray-700 text-white hover:bg-gray-600',
    },
    ghost: {
      light: 'bg-transparent text-black hover:bg-gray-100',
      dark: 'bg-transparent text-white hover:bg-gray-700',
    },
  },

  // Input field colors
  input: {
    bg: {
      light: 'bg-white',
      dark: 'bg-gray-700',
    },
    border: {
      light: 'border-gray-300',
      dark: 'border-gray-600',
    },
    text: {
      light: 'text-black',
      dark: 'text-white',
    },
    placeholder: {
      light: 'placeholder-gray-400',
      dark: 'placeholder-gray-500',
    },
  },

  // Modal/Box colors
  box: {
    bg: {
      light: 'bg-white',
      dark: 'bg-gray-800',
    },
    border: {
      light: 'border-gray-300',
      dark: 'border-gray-700',
    },
  },

  // Highlight/Focus colors
  focus: {
    light: 'focus:ring-gray-300 focus:border-gray-400',
    dark: 'focus:ring-gray-600 focus:border-gray-500',
  },

  // Table colors
  table: {
    header: {
      light: 'bg-gray-100',
      dark: 'bg-gray-800',
    },
    row: {
      light: 'hover:bg-gray-50',
      dark: 'hover:bg-gray-700',
    },
    border: {
      light: 'border-gray-300',
      dark: 'border-gray-700',
    },
  },

  // Card colors
  card: {
    bg: {
      light: 'bg-white',
      dark: 'bg-gray-800',
    },
    border: {
      light: 'border-gray-200',
      dark: 'border-gray-700',
    },
  },

  // Badge/Tag colors
  badge: {
    bg: {
      light: 'bg-gray-200',
      dark: 'bg-gray-700',
    },
    text: {
      light: 'text-gray-800',
      dark: 'text-gray-200',
    },
  },

  // Dropdown/Menu colors
  dropdown: {
    bg: {
      light: 'bg-white',
      dark: 'bg-gray-800',
    },
    item: {
      light: 'hover:bg-gray-100',
      dark: 'hover:bg-gray-700',
    },
  },
};

/**
 * Helper function to get color pair for light/dark mode
 * Usage: getColorPair(colors.text.primary, isDarkMode)
 */
export const getColorPair = (
  colorPair: { light: string; dark: string },
  isDarkMode: boolean
): string => {
  return isDarkMode ? colorPair.dark : colorPair.light;
};

/**
 * Helper function to merge color classes with cn utility
 * Usage: mergeColors(colors.button.primary, additionalClass, isDarkMode)
 */
export const mergeColors = (
  colorClass: string | { light: string; dark: string },
  additionalClass?: string,
  isDarkMode?: boolean
): string => {
  let baseClass = typeof colorClass === 'string' ? colorClass : isDarkMode ? colorClass.dark : colorClass.light;
  return additionalClass ? `${baseClass} ${additionalClass}` : baseClass;
};
