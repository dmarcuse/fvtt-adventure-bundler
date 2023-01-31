import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/main.ts',
    output: {
        file: 'module/js/main.js',
        format: 'es',
        sourcemap: true,
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        terser(),
        typescript(),
    ],
}
