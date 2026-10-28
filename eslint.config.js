import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        files: ['**/*.js', '**/*.mjs'],
        extends: [js.configs.recommended],
        rules: {
            'no-var': 'error',
            'prefer-const': 'error',
            eqeqeq: ['error', 'always'],
        },
    },
    {
        files: ['src/js/**/*.js'],
        languageOptions: { globals: globals.browser },
        rules: { 'no-console': 'error' },
    },
    {
        files: ['build/**/*.js', 'build/**/*.mjs', '*.config.js'],
        languageOptions: { globals: globals.node },
    },
    {
        files: ['build/browser/**/*.js'],
        languageOptions: { globals: { ...globals.node, ...globals.browser } },
    },
]);
