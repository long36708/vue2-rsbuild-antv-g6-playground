import oxlint from 'eslint-plugin-oxlint'
import antfu from '@antfu/eslint-config'

export default [
    {
        ignores: [
            'node_modules',
            'dist',
            '*.config.js',
            '*.config.mjs',
            '*.config.ts',
            '*.min.js',
            'public',
        ],
    },
    ...(await antfu({
        vue: {
            vueVersion: 2,
            // 设置成false就不会报错
            sfcBlocks: false,
            overrides: {
                'vue/html-self-closing': 'off',
            },
        },
    })),
    {
        files: ['**/*.js', '**/*.jsx'],
        plugins: {
            oxlint,
        },
        rules: oxlint.configs.recommended.rules,
    },
]
