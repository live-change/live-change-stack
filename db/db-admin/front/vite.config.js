import path from 'path'
import vuePlugin from '@vitejs/plugin-vue'
import { defineConfig, searchForWorkspaceRoot } from 'vite'
import findFreePorts from "find-free-ports"
import { visualizer } from 'rollup-plugin-visualizer'
import viteImages from 'vite-plugin-vue-images'
import viteCompression from 'vite-plugin-compression'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { accessSync, readFileSync } from 'fs'

const packageJsonPath = dirname(fileURLToPath(import.meta.url))
  .split('/').map((part, i, arr) =>
    join(arr.slice(0, arr.length - i).join('/'), 'package.json')
  ).find(p => { try { accessSync(p); return true } catch(e) { return false }})
const packageJson = packageJsonPath ? JSON.parse(readFileSync(packageJsonPath, 'utf-8')) : {}
const version = process.env.VERSION ?? packageJson.version ?? 'unknown'

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
      ENV_VERSION: JSON.stringify(version)
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
              'shared-element': ssrTransformCustomDir,
              'lazy': ssrTransformCustomDir,
            }
          }
        },
      }),
      tailwindcss(),
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
          /live-change-stack\/framework\//,
          /live-change-stack\/uid\//,
          /live-change-stack\/dao\//,
          /live-change-stack\/dao-sockjs\//,
          /live-change-stack\/dao-websocket\//,
          /live-change-stack\/dao-message\//,
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
        { find: 'universal-websocket-client', replacement: 'universal-websocket-client/browser.js' },
        { find: 'sockjs-client', replacement: 'sockjs-client/dist/sockjs.min.js' }
      ],
    }
  }
})
