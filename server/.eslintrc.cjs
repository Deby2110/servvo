module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: ['node_modules', 'uploads', '.eslintrc.cjs'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
