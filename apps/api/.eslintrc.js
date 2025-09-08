module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  env: { node: true, es2020: true },
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
  },
};
