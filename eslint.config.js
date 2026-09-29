import tseslint from '@electron-toolkit/eslint-config-ts'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['out', 'dist', 'node_modules', '**/*.d.ts', 'e2e/**'] },
  tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off'
    }
  },
  {
    files: ['electron/**/*.ts', 'providers/**/*.ts'],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ['shared/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser }
    }
  }
)
