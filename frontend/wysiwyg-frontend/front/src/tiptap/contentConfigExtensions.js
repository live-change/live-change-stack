import Document from '@tiptap/extension-document'

import Paragraph from "@tiptap/extension-paragraph"
import HardBreak from "@tiptap/extension-hard-break"
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import Heading from '@tiptap/extension-heading'
import Blockqoute from "@tiptap/extension-blockquote"
//import CodeBlock from "@tiptap/extension-code-block"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import ListItem from "@tiptap/extension-list-item"
import Link from "@tiptap/extension-link"

import Text from '@tiptap/extension-text'

import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from "@tiptap/extension-underline"
import Strike from "@tiptap/extension-strike"

import ImageNode from "./ImageNode.js"

import CodeBlockNode  from "./CodeBlockNode.js";

import ComponentNode from "./ComponentNode.js"
import SlotNode from "./SlotNode.js"

export const marksExtensions = {
  bold: [Bold],
  italic: [Italic],
  underline: [Underline],
  strike: [Strike],
  link: [Link.configure({
    openOnClick: false,
  })],
}

export const nodesExtensions = {
  doc: [Document],
  paragraph: [Paragraph],
  text: [Text],

  hardBreak: [HardBreak],
  horizontalRule: [HorizontalRule],

  heading: [Heading],
  blockquote: [Blockqoute],
  //codeBlock:  [CodeBlock]
  codeBlock: [CodeBlockNode],

  bulletList: [BulletList],
  orderedList: [OrderedList],
  listItem: [ListItem],

  image: [ImageNode],

  component: [ComponentNode],

  slot: [SlotNode],
}

export function getExtensions(contentConfig) {
  const extensions = []
  for(const mark in contentConfig.marks) {
    extensions.push(...marksExtensions[mark])
  }
  for(const node in contentConfig.nodes) {
    extensions.push(...nodesExtensions[node])
  }
  return extensions
}
