import Metadata from './front/src/components/Metadata.vue'
import MetadataEditor from './front/src/components/MetadataEditor.vue'
import Content from './front/src/components/Content.vue'
import ContentEditor from './front/src/components/ContentEditor.vue'
import ContentPreview from './front/src/components/ContentPreview.vue'
import ContentSettings from './front/src/components/ContentSettings.vue'

export { Metadata, MetadataEditor, Content, ContentEditor, ContentPreview, ContentSettings }

import NotFoundAdminButtons from './front/src/components/NotFoundAdminButtons.vue'
import NotAuthorizedAdminButtons from "./front/src/components/NotAuthorizedAdminButtons.vue"
import ContentAdminButtons from './front/src/components/ContentAdminButtons.vue'
import UrlContent from './front/src/components/UrlContent.vue'

export { NotFoundAdminButtons, NotAuthorizedAdminButtons, ContentAdminButtons, UrlContent }

import Page from './front/src/components/Page.vue'
import PageEditor from './front/src/components/PageEditor.vue'
import PagePreview from './front/src/components/PagePreview.vue'

export { Page, PageEditor, PagePreview }

import { catchAllPagesRoute, contentEditRoutes, pagesSitemap } from "./front/src/components/routes"

export { catchAllPagesRoute, contentEditRoutes, pagesSitemap }
