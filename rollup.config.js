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
        // Trim preceding ../../ from paths so that mapped source files render
        // in the correct part of the file tree
        sourcemapPathTransform: (relativeSourcePath) => {
            return relativeSourcePath.replace(/^..\/..\//, "");
        }
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        terser(),
        typescript(),
    ],
}
