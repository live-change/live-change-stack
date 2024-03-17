import path from 'path'
import { fileURLToPath } from 'url';
import vuePlugin from '@vitejs/plugin-vue'
import { defineConfig, searchForWorkspaceRoot } from 'vite'
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
  //console.log("VITE CONFIG", command, mode)
  return {
    define: {
      ENV_BASE_HREF: JSON.stringify(process.env.BASE_HREF || 'http://localhost:8001')
    },
    server: {
      hmr: {
        port: (await findFreePorts())[0]
      },
      fs: {
        allow: [
          searchForWorkspaceRoot(process.cwd()),
          path.dirname(fileURLToPath(import.meta.resolve('primeicons/package.json'))),
          path.dirname(fileURLToPath(import.meta.resolve('@fortawesome/fontawesome-free/package.json'))),
        ],
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
          /live-change-dao\/dao-message\//,
        ]
      }
    },
    ssr: {
      external: [
        ...(command == 'build' ? [
        ]: [
          '@live-change/dao'
        ]),
        '@live-change/uid',
        '@live-change/framework',
        '@live-change/framework/lib/utils/validators.js',
        'debug',
        'vite'
      ],
      noExternal: [
        ...(command == 'build' ? [
          '@live-change/dao',
        ]: [
        ]),
        '@live-change/vue3-components',
        '@live-change/dao-vue3',
        '@live-change/vue3-ssr',
        'vue3-scroll-border',
        'primevue',
        'primevue/usetoast',
        'primevue/useconfirm',
        'primevue/usedialog'
      ]
    },
    optimizeDeps: {
      include: [
        '@live-change/dao',
        '@live-change/dao-sockjs',
        '@live-change/dao-websocket',
        '@live-change/dao-message',
        '@live-change/uid',
        '@live-change/framework',
        '@live-change/framework/lib/utils/validators.js',
        'debug'
      ],
      exclude: [
        'primevue',
        'primevue/usetoast',
        'primevue/useconfirm',
        'primevue/usedialog',
      ]
    },

    resolve: {
      alias: [
        { find: 'debug', replacement: 'debug/src/browser.js' },
        { find: 'universal-websocket-client', replacement: 'universal-websocket-client/browser.js' },
        { find: 'sockjs-client', replacement: 'sockjs-client/dist/sockjs.min.js' }
      ],
    }
  }
})
