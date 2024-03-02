module.exports = {
  "marks": {
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
      "inline": false,
      "atom": false,
      "selectable": true,
      "draggable": true,
      "attrs": {
        "language": {
          "default": "text"
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
    },
    "component": {
      "content": "(block | slot)*",
      "marks": "",
      "group": "block",
      "inline": false,
      "selectable": true,
      "draggable": true,
      "attrs": {
        "is": {
          "default": "card"
        },
        "attrs": {
          "default": {}
        }
      }
    },
    "slot": {
      "content": "block*",
      "marks": "",
      "group": "slot",
      "inline": false,
      "selectable": false,
      "draggable": false,
      "attrs": {
        "name": {
          "default": "default"
        },
        "tag": {
          "default": "div"
        },
        "attrs": {
          "default": {}
        }
      }
    }
  },
  "topNode": "doc"
}
