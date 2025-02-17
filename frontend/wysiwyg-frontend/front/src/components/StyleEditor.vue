<template>
<!--  <pre>{{ JSON.stringify(classInfo, null, "  ") }}</pre>-->
  <div class="flex flex-col flex-wrap w-full">
    <div v-if="editingPadding">
      <div class="flex flex-row items-center mb-2">
        <label class="mr-4" style="width: 4em">Padding:</label>
        <PaddingEditor :modelValue="classInfo.padding"
                       @update:modelValue="p => handleClassInfoUpdate({ padding: p })" />
      </div>
      <div class="flex flex-row items-center">
        <label class="mr-4" style="width: 4em">Margin:</label>
        <PaddingEditor :modelValue="classInfo.margin"
                       @update:modelValue="p => handleClassInfoUpdate({ margin: p })" />
      </div>
    </div>
    <div class="flex flex-col md:flex-row">
      <div class="flex-1 mr-2 flex flex-col">
        <div class="flex flex-row items-center shrink-0">
          <label class="my-2 grow">Classes:</label>
          <div class="flex flex-row items-center mr-6">
            <i class="pi pi-arrows-alt" style="font-size: 1.2rem"></i>
            <InputSwitch v-model="editingPadding" class="ml-2" />
          </div>
        </div>
        <AutoComplete :modelValue="classInfo.list"
                      @update:modelValue="l => handleClassInfoUpdate({ list: l })"
                      :separator="/ /" :multiple="true" :suggestions="classSuggestions"
                      @complete="ev => searchClasses(ev)"
                      class="autocomplete-w-full grow" />
      </div>
      <div class="flex-1 flex flex-col">
        <div class="flex flex-row shrink-0">
          <label class="my-2 grow">Style:</label>
        </div>
        <div class="style-editor p-inputtext grow" ref="codeMirrorWrapper"></div>
<!--        <prism-editor v-if="isMounted"
                      class="style-editor p-inputtext grow" :highlight="highlightCss"
                      :style="{ height: (nodeStyleLines * 1.35 + 1.1) + 'em' }"
                      :modelValue="nodeStyle" @update:modelValue="handleStyleUpdate"
                      :readonly="false" :line-numbers="nodeStyleLines > 1" />-->
      </div>
    </div>
  </div>
</template>

<script setup>
  import AutoComplete from "primevue/autocomplete"
  import InputSwitch from 'primevue/inputswitch';

  import PaddingEditor from "./PaddingEditor.vue"

  import { EditorState as CMState } from '@codemirror/state'
  import { EditorView as CMView, keymap as cmKeymap, drawSelection } from '@codemirror/view'
  import {css} from "@codemirror/lang-css"

  import { ref, computed, watch, provide, defineEmits, defineProps, onMounted, toRefs } from 'vue'
  import {defaultKeymap} from "@codemirror/commands";
  import {defaultHighlightStyle, syntaxHighlighting} from "@codemirror/language";
  import {exitCode} from "@tiptap/pm/commands";
  import {redo, undo} from "@tiptap/pm/history";

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const props = defineProps({
    nodeControl: {
      type: Object,
      required: true
    }
  })

  const { nodeControl } = toRefs(props)

  const editingPadding = ref(false)

  function extract(info, regex, setter) {
    const rest = []
    const list = info.list
    for(let i = 0; i < list.length; i++) {
      const match = list[i].match(regex)
      if(match) setter(...match.slice(1))
        else rest.push(list[i])
    }
    info.list = rest
  }

  function extractClasses(info) {
    info.padding = { }
    if(editingPadding.value) {
      extract(info, /^p([xyltrb])?-(\d+)$/, (dir, size) => {
        if (dir) info.padding[dir] = size
        else info.padding.all = size
      })
      info.margin = {}
      extract(info, /^m([xyltrb])?-(\d+)$/, (dir, size) => {
        if (dir) info.margin[dir] = size
        else info.margin.all = size
      })
    }
  }
  function recombinePadding(list, padding, prefix = 'p') {
    if(padding.all !== undefined) list.push(`${prefix}-${padding.all}`)
    if(padding.x !== undefined) list.push(`${prefix}x-${padding.x}`)
    if(padding.y !== undefined) list.push(`${prefix}y-${padding.y}`)
    if(padding.t !== undefined) list.push(`${prefix}t-${padding.t}`)
    if(padding.r !== undefined) list.push(`${prefix}r-${padding.r}`)
    if(padding.b !== undefined) list.push(`${prefix}b-${padding.b}`)
    if(padding.l !== undefined) list.push(`${prefix}l-${padding.l}`)
  }
  function recombineClasses(info) {
    const { padding, margin, list } = info
    if(editingPadding.value) {
      recombinePadding(list, padding, 'p')
      recombinePadding(list, margin, 'm')
    }
  }

  const insertableClasses = ['flex', 'grow']
  const nodeClass = computed(() => {
    console.log("nodeControl", nodeControl.value)
    return nodeControl.value.attrs.class
  })
  const classInfo = computed(() => {
    const list = nodeClass.value ? nodeClass.value.split(' ') : []
    const info = { list }
    extractClasses(info)
    return info
  })
  const classSuggestions = ref()
  function searchClasses(event) {
    const query = event.query.toLowerCase()
    console.log("SEARCH CLASSES", query)
    classSuggestions.value = [
      ...(insertableClasses.find(c => c == event.query) ? [] : [event.query]),
      ...(insertableClasses.filter((c) => {
        return c.toLowerCase().startsWith(query)
      }))
    ]
  }
  function handleClassInfoUpdate(change) {
    let info = JSON.parse(JSON.stringify(classInfo.value))
    info = { ...info, ...change }
    recombineClasses(info)
    console.log("INFO", info)
    nodeControl.value.updateAttributes({ attrs: {
      ...nodeControl.value.attrs,
      class: info.list.join(' ')
    }})
  }

  const nodeStyle = computed(() => {
    return nodeControl.value.attrs.style
  })
  const nodeStyleLines = computed(() => (nodeStyle.value || '').split('\n').length)

  function handleStyleUpdate(style) {
    console.log("NC", nodeControl.value)
    nodeControl.value.updateAttributes({ attrs: {
      ...nodeControl.value.attrs,
      style
    }})
  }


  const codeMirrorWrapper = ref()

  let cmView, cmState

  const dispatch = (tr) => {
    console.log("TR", tr)
    cmView.setState(tr.state)
    if(tr.docChanged) handleStyleUpdate(tr.newDoc.toString())
  }

  onMounted(() => {
    //console.log("WRAPPER", codeMirrorWrapper.value)
    cmView = new CMView({
      dispatch,
      parent: codeMirrorWrapper.value,
    })
    cmState = CMState.create({
      doc: nodeStyle.value || '',
      extensions: [
        cmKeymap.of([
          ...defaultKeymap,
          ...[
            { key: "Ctrl-z", mac: "Cmd-z", run: () => undo(view.state, view.dispatch) },
            { key: "Shift-Ctrl-z", mac: "Shift-Cmd-z", run: () => redo(view.state, view.dispatch) },
            { key: "Ctrl-y", mac: "Cmd-y", run: () => redo(view.state, view.dispatch) }
          ]
        ]),
        drawSelection(),
        syntaxHighlighting(defaultHighlightStyle),
        css(),
      ],
    })
  })

</script>

<style lang="scss">
  .autocomplete-w-full > ul {
    width: 100%;
  }
  .style-editor:focus-within {
    box-shadow: 0 0 0 0.2rem #b7e0b8;
    border-color: #4CAF50;
  }
  .style-editor {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 0;
    & > .cm-editor {
      margin: 0;
      padding: 0.5em;
    }
    .cm-focused {
      outline: none;
    }
  }

</style>
