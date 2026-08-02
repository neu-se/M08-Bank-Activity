import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'

export default tseslint.config(
  {
    ignores: ['node_modules', 'dist'],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/quotes': [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: 'always' },
      ],
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/indent': ['error', 2],
      '@stylistic/max-len': ['error', { code: 100, ignoreUrls: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // The flat config file is not part of the tsconfig project, so exempt it
    // from the type-checked rules that require type information.
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
)
