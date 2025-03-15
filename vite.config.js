//自动导入ui-组件 比如说ant-design-vue  element-plus等
import Components from "unplugin-vue-components/vite";
//ant-design-vue
import {AntDesignVueResolver} from "unplugin-vue-components/resolvers";
import Vue from '@vitejs/plugin-vue'
import {defineConfig} from "vite";
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        Vue(),
        Components({
            //ant-design-vue   importStyle = false 样式就没了
            resolvers: [
                AntDesignVueResolver({importStyle: "less", resolveIcons: true}),
            ],
        }),
        // viteCompression({
        //     algorithm: 'brotliCompress', // 或 'gzip'
        //     threshold: 20480 // 对大于 10KB 的文件压缩
        // })
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
