import { parser as javascriptParser } from "@lezer/javascript"
import { parser as htmlParser } from "@lezer/html"
import { parser as markdownParser } from "@lezer/markdown"
import { parser as cssParser } from "@lezer/css"
import { parser as jsonParser } from "@lezer/json"
import { parser as cppParser } from "@lezer/cpp"
import { parser as sassParser } from "@lezer/sass"
import { parser as javaParser } from "@lezer/java"
import { parser as pythonParser } from "@lezer/python"
import { parser as phpParser } from "@lezer/php"
import { parser as rustParser } from "@lezer/rust"
import { parser as xmlParser } from "@lezer/xml"

import { highlightTree } from "@lezer/highlight"
import { defaultHighlightStyle } from "@codemirror/language"

const parsers = {
  javascript: javascriptParser,
  html: htmlParser,
  markdown: markdownParser,
  css: cssParser,
  json: jsonParser,
  cpp: cppParser,
  sass: sassParser,
  java: javaParser,
  python: pythonParser,
  php: phpParser,
  rust: rustParser,
  scss: sassParser,
  less: cssParser,
  stylus: cssParser,
  ts: javascriptParser,
  tsx: javascriptParser,
  jsx: javascriptParser,
  vue: htmlParser,
  xml: xmlParser,
}

function highlight(code, language) {
  //console.log("HIGHLIGHT", language, code)
  const parser = parsers[language]
  if(parser) {
    const tree = parser.parse(code)
    let pos = 0
    const output = []
    highlightTree(tree, defaultHighlightStyle, (from, to, classes) => {
      if (from > pos) output.push(`<span>${
          code.slice(pos, from).replace(/</g, "&lt;").replace(/>/g, "&gt;")
      }</span>`)
      console.log("HIGHLIGHT", from, to, classes, code.slice(from, to))
      output.push(`<span class="${classes}">${
          code.slice(from, to).replace(/</g, "&lt;").replace(/>/g, "&gt;")
      }</span>`)
      pos = to
    })
    if (code.length > pos) output.push(`<span>${
        code.slice(pos).replace(/</g, "&lt;").replace(/>/g, "&gt;")
    }</span>`)
    return `<pre class="code${language ? ' code-language-'+language : ''}">${output.join('')}</pre>`
  }
}

export {
  parsers, highlight
}