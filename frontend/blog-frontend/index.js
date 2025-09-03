import BlogPost from './front/src/components/BlogPost.vue'
import BlogPostEditor from './front/src/components/BlogPostEditor.vue'
import BlogPostPreview from './front/src/components/BlogPostPreview.vue'

export { BlogPost, BlogPostEditor, BlogPostPreview }

import { catchAllBlogRoute, blogEditRoutes, blogSitemap } from "./front/src/components/routes.js"

export { catchAllBlogRoute, blogEditRoutes, blogSitemap }

import en from "./front/locales/en.json"
import pl from "./front/locales/pl.json"
const locales = { en, pl }
export { locales }
