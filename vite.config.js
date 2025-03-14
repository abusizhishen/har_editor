//自动导入ui-组件 比如说ant-design-vue  element-plus等
import {AntDesignVueResolver} from "unplugin-vue-components/resolvers";
import Vue from '@vitejs/plugin-vue'
import {defineConfig} from "vite";
import AutoImport from 'unplugin-auto-import/vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        Vue(),
        AutoImport({ /* options */
            resolvers: [
                AntDesignVueResolver(),
            ],
        }),

    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        // 进一步细分 vendor
                        if (id.includes('ant-design-vue')) return 'antd';
                        if (id.includes('lodash')) return 'lodash';
                        return 'vendor';
                    }
                },
            },
        },
    },
})
