import dotenv from 'dotenv'
dotenv.config()

import { findFreePorts } from 'find-free-ports'
import path from 'path'
import vuePlugin from '@vitejs/plugin-vue'

//import tailwindcss from '@tailwindcss/vite'
import { tsImport } from 'tsx/esm/api'
const tailwindcss = (await tsImport('./tailwindcss-vite.ts', import.meta.url)).default

import Markdown from 'unplugin-vue-markdown/vite'
import MarkdownItAnchor from 'markdown-it-anchor'
import MarkdownItSub from 'markdown-it-sub'
import MarkdownItSup from 'markdown-it-sup'
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItDefList from 'markdown-it-deflist'
import MarkdownItAbbr from 'markdown-it-abbr'
import MarkdownItMark from 'markdown-it-mark'
import MarkdownItKatex from 'markdown-it-katex'
import MarkdownItTaskLists from 'markdown-it-task-lists'
import MarkdownItTableOfContents from 'markdown-it-table-of-contents'
//import MarkdownItMermaid from 'markdown-it-mermaid'

import { highlight } from '@live-change/frontend-base/lezer.js'

import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from 'unplugin-vue-components/resolvers'

import { visualizer } from 'rollup-plugin-visualizer'
import viteImages from 'vite-plugin-vue-images'
import viteCompression from 'vite-plugin-compression'
import checker from 'vite-plugin-checker'
import { searchForWorkspaceRoot } from 'vite'
import { fileURLToPath } from 'url'

import { mkdir } from 'fs/promises'

await mkdir('build-stats', { recursive: true })


const ssrTransformCustomDir = () => {
  return {
    props: [],
    needRuntime: true
  }
}

let version = process.env.VERSION ?? 'unknown'

export default async ({ command, mode, version }, options = {
  ssrDisabledDirectives: ['ripple', 'styleclass', 'badge', 'shared-element', 'lazy']
}) => {
  //console.log("VITE CONFIG", command, mode, process.argv)
  return {
    define: {
      ENV_MODE: JSON.stringify(mode),
      ENV_VERSION: JSON.stringify(version || process.env.VERSION || 'unknown'),
    },
    server: {
      allowedHosts: true,
      hmr: {
        port: +(process.env.HMR_PORT ?? (await findFreePorts())[0])
      },
      fs: {
        allow: [
          searchForWorkspaceRoot(process.cwd()),
          path.dirname(fileURLToPath(import.meta.resolve('primeicons/package.json'))),
          path.dirname(fileURLToPath(import.meta.resolve('primevue/package.json'))),
          path.dirname(fileURLToPath(import.meta.resolve('@fortawesome/fontawesome-free/package.json'))),
          path.dirname(fileURLToPath(import.meta.resolve('boxicons/package.json'))),
        ]
      }
    },
    plugins: [
      //checker({ typescript: true }),
      vuePlugin({
        include: [/\.vue$/, /\.md$/],
        template: {
          compilerOptions: {
            //   whitespace: "preserve",
            directiveTransforms: {
              ...(Object.fromEntries(options.ssrDisabledDirectives.map(d => [d, ssrTransformCustomDir]))),
            }
          }
        },
      }),
      tailwindcss({
        sources: [
          '@live-change/frontend-base/src',
          '@live-change/access-control-frontend/src',
          '@live-change/content-frontend/src',
          '@live-change/blog-frontend/src',
          '@live-change/image-frontend/src',
          '@live-change/security-frontend/src',
          '@live-change/upload-frontend/src',
          '@live-change/url-frontend/src',
          '@live-change/user-frontend/src',
          '@live-change/wysiwyg-frontend/src',
          '@live-change/flow-frontend/src',
          '@live-change/task-frontend/src',
          '@live-change/balance-frontend/src',
          '@live-change/billing-frontend/src',
          '@live-change/survey-frontend/src',
          '@live-change/peer-connection-frontend/src',
          '@live-change/video-call-frontend/src',
          '@live-change/frontend-auto-form/src',
          '@live-change/db-web/src',          
        ].map(p => ({
          base: path.dirname(fileURLToPath(import.meta.resolve(p))),
          pattern: '**/*.{vue,css,scss,sass,less,styl,md}',
          negated: false
        }))
      }),
      Markdown({
        headEnabled: true,
        markdownItOptions: {
          html: true,
          linkify: true,
          typographer: true,
          highlight,
        },
        markdownItSetup(md) {
          md.disable('code')
          md.use(MarkdownItSub)
          md.use(MarkdownItSup)
          md.use(MarkdownItFootnote)
          md.use(MarkdownItDefList)
          md.use(MarkdownItAbbr)
          md.use(MarkdownItMark)
          md.use(MarkdownItKatex)
          md.use(MarkdownItTaskLists)
          //md.use(MarkdownItMermaid)
          md.use(MarkdownItAnchor)
          md.use(MarkdownItTableOfContents, {
            includeLevel: [1, 2, 3],
            containerClass: 'table-of-contents',
          })
        },
        wrapperClasses: 'markdown-body'
      }),
      Components({
        types: [{
          from: 'vue-router',
          names: ['RouterLink', 'RouterView'],
        }],
        resolvers: [
          PrimeVueResolver({
          })
        ],
        // allow auto load markdown components under `./src/components/`
        dirs: ['src/components'],
        // search for subdirectories
        deep: true,
        extensions: ['vue', 'md'],
        dts: true,
        // allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      }),
      viteImages({ extensions: ['jpg', 'jpeg', 'png', 'svg', 'webp'] }),
      viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
      viteCompression({ algorithm: 'gzip', ext: '.gz' }),
      viteCompression({ algorithm: 'deflate', ext: '.zz' }),
      visualizer({
        filename: `../build-stats/${process.argv.slice(3).map(a=>a.replace(/[\./-]/g,'')).join('-')}.html`
      }),
    ],
    build: {
      minify: false,
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [
          /node_modules/
        ]
      },
    },
    ssr: {
      external: [
        ...(command === 'build' ? [
        ]: [
          '@live-change/dao',
        ]),
        '@live-change/uid',
        '@live-change/framework',
        '@live-change/framework/lib/utils/validators.js',
        '@live-change/relations-plugin',
/*        '@live-change/db-web',
        '@live-change/db',
        '@live-change/db-store-indexeddb',
        '@live-change/db-store-rbtree',*/
        'debug',
        'vite',
        'pica'
      ],
      noExternal: [
        ...(command === 'build' ? [
          '@live-change/dao',
        ]: [

        ]),
        '@live-change/vue3-components',
        '@live-change/dao-vue3',
        '@live-change/vue3-ssr',
        '@live-change/email-service',
        '@live-change/password-authentication-service',
        '@live-change/db-admin',
        '@live-change/user-frontend',
        '@live-change/frontend-base',
        '@live-change/frontend-utils',
        '@live-change/access-control-frontend',
        '@live-change/content-frontend',
        '@live-change/blog-frontend',
        '@live-change/image-frontend',
        '@live-change/security-frontend',
        '@live-change/upload-frontend',
        '@live-change/url-frontend',
        '@live-change/user-frontend',
        '@live-change/wysiwyg-frontend',
        '@live-change/flow-frontend',
        '@live-change/task-frontend',
        '@live-change/balance-frontend',
        '@live-change/billing-frontend',
        '@live-change/survey-frontend',
        '@live-change/peer-connection-frontend',
        '@live-change/video-call-frontend',
        '@live-change/frontend-auto-form',
        '@live-change/db-web',
        '@live-change/db',
        '@live-change/db-store-indexeddb',
        '@live-change/db-store-rbtree',
        'vue3-scroll-border',
        'pretty-bytes',
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
        '@live-change/relations-plugin',
        '@live-change/db-web',
        '@live-change/db',
        '@live-change/db-store-indexeddb',
        '@live-change/db-store-rbtree',
        'debug',
        'pica'
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
    },

    resolvers: [{
      fileToRequest (filePath) {
        console.log('@@@', filePath);
        if (filePath.startsWith(srcPath)) {
          return `/@/${path.relative(srcPath, filePath)}`;
        }
      },
      requestToFile (publicPath) {
        if (publicPath.startsWith('/@/')) {
          return path.join(srcPath, publicPath.replace(/^\/@\//, ''));
        }
      },
    }],
  }
}

