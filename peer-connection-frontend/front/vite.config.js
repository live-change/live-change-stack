const path = require('path')
const vuePlugin = require('@vitejs/plugin-vue')
import { defineConfig } from 'vite'
import findFreePorts from "find-free-ports"
import { visualizer } from 'rollup-plugin-visualizer'
import viteImages from 'vite-plugin-vue-images'
import viteCompression from 'vite-plugin-compression'

const ssrTransformCustomDir = () => {
  return {
    props: [],
    needRuntime: true
  }
}

export default defineConfig(async ({ command, mode }) => {
  return {
    define: {
      ENV_BASE_HREF: JSON.stringify(process.env.BASE_HREF || 'http://localhost:8001')
    },
    server: {
      hmr: {
        port: (await findFreePorts())[0]
      }
    },
    plugins: [
      vuePlugin({
        template: {
          compilerOptions: {
            //   whitespace: "preserve",
            directiveTransforms: {
              'ripple': ssrTransformCustomDir,
              'styleclass': ssrTransformCustomDir,
              'badge': ssrTransformCustomDir,
              'shared-element': ssrTransformCustomDir
            }
          }
        },
      }),
      viteImages({ extensions: ['jpg', 'jpeg', 'png', 'svg', 'webp'] }),
      viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
      viteCompression({ algorithm: 'gzip', ext: '.gz' }),
      viteCompression({ algorithm: 'deflate', ext: '.zz' }),
      visualizer({
        filename: '../stats.html'
      }),
    ],
    build: {
      minify: false,
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [
          /node_modules/,
          /live-change-framework\/framework\//,
          /live-change-framework\/uid\//,
          /live-change-dao\/dao\//,
          /live-change-dao\/dao-sockjs\//,
          /live-change-dao\/dao-websocket\//,
        ]
      }
    },
    ssr: {
      external: [
        '@live-change/dao',
        '@live-change/vue-api',
        '@live-change/vue-api-session',
        '@live-change/uid',
        '@live-change/framework',
        '@live-change/framework/lib/utils/validators.js',
        'debug',
        'vite'
      ],
      noExternal: [
        '@live-change/vue3-components',
        '@live-change/dao-vue3',
        '@live-change/vue3-ssr',
        'vue3-scroll-border'
      ]
    },
    optimizeDeps: {
      include: [
        '@live-change/vue-api',
        '@live-change/vue-api-session',
        '@live-change/dao',
        '@live-change/dao-sockjs',
        '@live-change/dao-websocket',
        '@live-change/uid',
        '@live-change/framework',
        '@live-change/framework/lib/utils/validators.js',
        'debug'
      ]
    },

    resolve: {
      alias: [
        { find: 'debug', replacement: 'debug/src/browser.js' },
        { find: 'universal-websocket-client', replacement: 'universal-websocket-client/browser.js' },
        { find: 'sockjs-client', replacement: 'sockjs-client/dist/sockjs.min.js' },
        { find: '@', replacement: path.resolve(__dirname, './src') },
        { find: '#user', replacement: path.resolve(__dirname, '.') }
      ],
    },
    resolvers: [{
      fileToRequest(filePath) {
        console.log('@@@', filePath);
        if (filePath.startsWith(srcPath)) {
          return `/@/${path.relative(srcPath, filePath)}`
        }
      },
      requestToFile(publicPath) {
        if (publicPath.startsWith('/@/')) {
          return path.join(srcPath, publicPath.replace(/^\/@\//, ''))
        }
      },
    }],
  }
})
