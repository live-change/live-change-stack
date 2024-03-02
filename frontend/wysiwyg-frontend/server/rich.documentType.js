module.exports = {
  "marks": {
    "link": {
      "inclusive": true,
      "attrs": {
        "href": {
          "default": null
        },
        "target": {
          "default": "_blank"
        },
        "class": {
          "default": null
        }
      }
    },
    "bold": {},
    "italic": {},
    "underline": {},
    "strike": {}
  },
  "nodes": {
    "paragraph": {
      "content": "inline*",
      "group": "block"
    },
    "horizontalRule": {
      "group": "block"
    },
    "heading": {
      "content": "inline*",
      "group": "block",
      "defining": true,
      "attrs": {
        "level": {
          "default": 1
        }
      }
    },
    "blockquote": {
      "content": "block+",
      "group": "block",
      "defining": true
    },
    "codeBlock": {
      "content": "text*",
      "marks": "",
      "group": "block",
      "code": true,
      "defining": true,
      "attrs": {
        "language": {
          "default": null
        }
      }
    },
    "bulletList": {
      "content": "listItem+",
      "group": "block list"
    },
    "orderedList": {
      "content": "listItem+",
      "group": "block list",
      "attrs": {
        "start": {
          "default": 1
        }
      }
    },
    "listItem": {
      "content": "paragraph block*",
      "defining": true
    },
    "image": {
      "content": "",
      "marks": "",
      "group": "block",
      "inline": false,
      "atom": true,
      "selectable": true,
      "draggable": true,
      "attrs": {
        "image": {
          "default": null
        }
      }
    },
    "doc": {
      "content": "block+"
    },
    "text": {
      "group": "inline"
    },
    "hardBreak": {
      "group": "inline",
      "inline": true,
      "selectable": false
    }
  },
  "topNode": "doc"
}
