import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        files: ['src/js/**/*.js', 'build/tests/runtime.test.js'],
        extends: [js.configs.recommended],
        rules: {
            'no-var': 'error',
            'prefer-const': 'error',
            eqeqeq: ['error', 'always'],
            'no-console': 'error',
        },
    },
    { files: ['src/js/**/*.js'], languageOptions: { globals: globals.browser } },
    { files: ['build/tests/runtime.test.js'], languageOptions: { globals: globals.node } },
]);
