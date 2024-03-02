<template>
<!--  <pre>{{ JSON.stringify(metadata, null, "  ") }}</pre>-->
</template>

<script setup>
  const props = defineProps({
    objectType: {
      type: String,
      required: true
    },
    object: {
      type: String,
      required: true
    }
  })

  import { computed, ref, onMounted } from 'vue'
  import { path, live } from '@live-change/vue3-ssr'
  import { useHost } from "@live-change/frontend-base"
  const host = useHost()

  const p = path()

  const metadataLivePath = computed(
    () => p.content.objectOwnedMetadata({ objectType: props.objectType, object: props.object })
           .with(metadata => p.image.image({ image: metadata.og.image }).bind('ogImage'))
  )
  const canonicalUrlLivePath = computed(
    () =>  p.url.targetOwnedCanonical({ targetType: props.objectType, target: props.object })
  )
  const [metadata, canonical] = await Promise.all([
    live(metadataLivePath),
    live(canonicalUrlLivePath)
  ])

  function metaProperty(name, value) {
    return value ? { property: name, content: value } : undefined
  }
  function metaProperties(name, value) {
    if(!value) return []
    return value.map(v => ({ property: name, content: v }))
  }
  function metaPropertiesObjects(name, value) {
    if(!value) return []
    return value.map(v => {
      for(let key in v) {
        return { property: name+':'+key, content: v[key] }
      }
    })
  }
  import { useHead } from '@vueuse/head'
  const m = metadata.value
  const canonicalUrlDomain = canonical.value?.domain || host
  const canonicalUrl = `https://${canonicalUrlDomain}/${canonical.value?.path ?? ''}`

  let ogImage = []
  if(m) {
    if (m.ogImage) {
      const image = m.ogImage
      ogImage = [
        {property: 'og:image', content: `https://${canonicalUrlDomain}/api/image/image/${image.id}`},
        {property: 'og:image:width', content: image.width},
        {property: 'og:image:height', content: image.height},
        {property: 'og:image:type', content: 'image/' + image.extension}
      ]
    }

    useHead(computed(() => ({
      title: m.title,
      description: m.description,
      link: [
        {rel: 'canonical', href: canonicalUrl}
      ],
      meta: [
        metaProperty('og:title', m.og.title),
        metaProperty('og:description', m.og.description),
        ...ogImage,
        metaProperty('og:determiner', m.og.determiner),
        metaProperty('og:locale', m.og.locale),
        ...metaProperties('og:locale:alternate', m.og.localeAlternate),
        metaProperty('og:type', m.og.type),

        metaProperty('og:music:duration', m.og.music.duration),
        ...metaPropertiesObjects('og:music:album', m.og.music.album),
        ...metaPropertiesObjects('og:music:song', m.og.music.song),
        ...metaProperties('og:music:musician', m.og.music.duration),
        metaProperty('og:music:release_date', m.og.music.releaseDate),
        ...metaProperties('og:music:creator', m.og.music.creator),

        metaProperty('og:video:duration', m.og.video.duration),
        metaProperty('og:viceo:release_date', m.og.video.releaseDate),
        ...metaPropertiesObjects('og:video:duration', m.og.video.actors),
        ...metaProperties('og:video:director', m.og.video.director),
        ...metaProperties('og:video:writer', m.og.video.writer),
        ...metaProperties('og:video:series', m.og.video.series),
        ...metaProperties('og:video:tag', m.og.video.tag),

        ...metaProperties('og:profile:first_name', m.og.profile.firstName),
        ...metaProperties('og:profile:last_name', m.og.profile.lastName),
        ...metaProperties('og:profile:username', m.og.profile.username),
        ...metaProperties('og:profile:gender', m.og.profile.gender),

        metaProperty('og:article:published_time', m.og.article.publishedTime),
        metaProperty('og:article:modified_time', m.og.article.modifiedTime),
        metaProperty('og:article:expiration_time', m.og.article.expirationTime),
        ...metaProperties('og:article:author', m.og.article.author),
        metaProperty('og:article:section', m.og.article.section),
        ...metaProperties('og:article:tag', m.og.article.tag),

        ...metaProperties('og:book:author', m.og.book.author),
        metaProperty('og:book:isbn', m.og.book.isbn),
        metaProperty('og:book:release_date', m.og.book.releaseDate),
        ...metaProperties('og:book:tag', m.og.book.tag),

        {property: 'og:url', content: canonicalUrl},


        /*      { property: 'og:url', content: m.url },
              { property: 'og:type', content: 'website' },
              { property: 'twitter:card', content: 'summary_large_image' },
              { property: 'twitter:title', content: metadata.value.title },
              { property: 'twitter:description', content: metadata.value.description },
              { property: 'twitter:image', content: metadata.value.image },
              { property: 'twitter:url', content: metadata.value.url }*/
      ].filter(x => !!x)
    })))
  }
</script>

<style scoped>

</style>
