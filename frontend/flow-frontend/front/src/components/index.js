import { ref, unref, reactive, computed, inject, provide, watch } from "vue"

export function useFlow(options) {
  const existingFlow = inject("flow")
  if(existingFlow && options) throw new Error("Flow already exists")
  if(existingFlow) return existingFlow

  const nodes = options?.nodes ?? ref([])
  const edges = options?.edges ?? ref([])

  const dragState = ref(null)
  const container = ref(null)
  const viewport = ref(null)

  const nodeViews = reactive(new Map())

  const size = reactive({
    width: options.width ?? 1024,
    height: options.height ?? 1024,
  })

  const position = reactive({ x: 0, y: 0 })
  const scale = ref(1)

  function updatePositionAndScale(x, y, s) {
    const viewportRect = viewport.value.getBoundingClientRect()
    const vWidth = viewportRect.width
    const vHeight = viewportRect.height
    if(s < vWidth / size.width) s = vWidth / size.width
    if(s < vHeight / size.height) s = vHeight / size.height
    if(options.maxZoom && s > options.maxZoom) s = options.maxZoom
    if(options.minZoom && s < options.minZoom) s = options.minZoom

    if(x > 0) x = 0
    if(y > 0) y = 0
    if(x + size.width * s < vWidth) x = vWidth - size.width * s
    if(y + size.height * s < vHeight) y = vHeight - size.height * s
    position.x = x
    position.y = y
    scale.value = s
  }

  function zoom(event, by) {
    const viewportRect = viewport.value.getBoundingClientRect()
    const vWidth = viewportRect.width
    const vHeight = viewportRect.height

    const zoomEventX = event.clientX - viewportRect.x
    const zoomEventY = event.clientY - viewportRect.y

    const zoomCenterX = zoomEventX / scale.value - position.x / scale.value
    const zoomCenterY = zoomEventY / scale.value - position.y / scale.value

    let s = scale.value * by

    if(s < vWidth / size.width) s = vWidth / size.width
    if(s < vHeight / size.height) s = vHeight / size.height
    if(options.maxZoom && s > options.maxZoom) s = options.maxZoom
    if(options.minZoom && s < options.minZoom) s = options.minZoom

    const newBy = s / scale.value

    const newZoomCenterX = zoomCenterX * newBy
    const newZoomCenterY = zoomCenterY * newBy

    const dx = (newZoomCenterX - zoomCenterX) * scale.value
    const dy = (newZoomCenterY - zoomCenterY) * scale.value

    updatePositionAndScale(position.x - dx, position.y - dy, s)
  }

  function getEventPosition(event) {
    const containerRect = container.value.getBoundingClientRect()
    return {
      x: (event.clientX - containerRect.left) / scale.value,
      y: (event.clientY - containerRect.top) / scale.value
    }
  }

 function getElementPosition(element, at = [0,0]) {
    const elementRect = element.getBoundingClientRect()
    const containerRect = container.value.getBoundingClientRect()
    return {
      x: (elementRect.left + elementRect.width * at[0] - containerRect.left) / scale.value,
      y: (elementRect.top + elementRect.height * at[1] - containerRect.top) / scale.value,
    }
  }

  function getElementRect(element) {
    const containerRect = container.value.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    return {
      x: (elementRect.left - containerRect.left)/scale.value,
      y: (elementRect.top - containerRect.top)/scale.value,
      width: elementRect.width / scale.value,
      height: elementRect.height / scale.value,
    }
  }

  function findNode(nodeId) {
    if(options.findNode) return options.findNode(nodeId)
    if(options.findNodeIndex) return unref(nodes)[options.findNodeIndex(nodeId)]
    return unref(nodes).value.find(n => n.id == node)
  }
  function findNodeIndex(nodeId) {
    nodeId = getNodeId(nodeId)
    if(options.findNodeIndex) return options.findNodeIndex(nodeId)
    return unref(nodes).value.findIndex(n => n.id == node)
  }
  function getNodeId(nodeId) {
    if(typeof nodeId == "string") return nodeId
    if(options.getNodeId) return options.getNodeId(nodeId)
    return nodeId.id
  }
  function getNode(node) {
    if(typeof node == "string") return findNode(node)
    return node
  }

  function findEdge(edgeId) {
    if(options.findEdge) return options.findEdge(edgeId)
    if(options.findEdgeIndex) return unref(edges)[options.findEdgeIndex(edgeId)]
    return unref(edges).value.find(e => e.id == edgeId)
  }
  function findEdgeIndex(edgeId) {
    edgeId = getEdgeId(edgeId)
    if(options.findEdgeIndex) return options.findEdgeIndex(edgeId)
    return unref(edges).value.findIndex(e => e.id == edgeId)
  }
  function getEdgeId(edgeId) {
    if(typeof edgeId == "string") return edgeId
    if(options.getEdgeId) return options.getEdgeId(edgeId)
    return edgeId.id
  }
  function getEdge(edge) {
    if(typeof edge == "string") return findEdge(edge)
    return edge
  }

  function setNodeElement(nodeId, element) {
    nodeId = getNodeId(nodeId)
    //console.log("setNodeElement", nodeId, element)
    if(!element) {
      nodeViews.delete(nodeId)
      return
    }
    const nodeView = nodeViews.get(nodeId)
    if(!nodeView) {
      nodeViews.set(nodeId, {
        node: nodeId,
        element,
        rect: getElementRect(element),
        ports: reactive(new Map()),
      })
      return
    }
    nodeView.element = element
  }

  function setPortElement(nodeId, portId, element, direction) {
    nodeId = getNodeId(nodeId)
    if (typeof portId != "string") portId = portId.id ?? `${nodeId}/${portId.name}`
    console.log("setPortElement", nodeId, portId, element)
    const nodeView = nodeViews.get(nodeId)
    if(!nodeView) {
      return
    }
    if(!element) {
      nodeView.ports.delete(portId)
      return
    }
    nodeView.ports.set(portId, {
      port: portId,
      element,
      rect: getElementRect(element),
      direction,
    })
  }

  function invalidatePortView(portView) {
    portView.rect = getElementRect(portView.element)
  }

  function invalidateNodeView(nodeView) {
    if(!nodeView.element) {
      if(typeof nodeView == "string") {
        nodeView = nodeViews.get(nodeView)
      } else {
        nodeView = nodeViews.get(getNodeId(nodeView))
      }
    }
    nodeView.rect = getElementRect(nodeView.element)
    for(const portView of nodeView.ports.values()) {
      invalidatePortView(portView)
    }
  }

  function getPortView(nodeId, portId) {
    nodeId = getNodeId(nodeId)
    if (typeof portId != "string") portId = portId.id ?? `${nodeId}/${portId.name}`
    const nodeView = nodeViews.get(nodeId)
    if(!nodeView) return null
    return nodeView.ports.get(portId)
  }

  function getNearestPortView(position, maxDistance = 50, filter = (nodeId, portId) => true) {
    const maxNodeDistance = maxDistance * 2
    const maxDistanceSqr = maxDistance ** 2
    let nearestPortView = null
    let nearestNodeView = null
    let nearestDistanceSqr = Infinity
    for(const nodeView of nodeViews.values()) {
      // check if position is near node
      const rect = nodeView.rect
      //console.log("getNearestPortView", nodeView.node, nodeView.rect)
      if(position.x < rect.x - maxNodeDistance) continue
      if(position.x > rect.x + rect.width + maxNodeDistance) continue
      if(position.y < rect.y - maxNodeDistance) continue
      if(position.y > rect.y + rect.height + maxNodeDistance) continue
      //console.log('dist ok')
      if(filter(nodeView.node, null) === false) continue
      //console.log('node ok')
      // check all ports
      for(const portView of nodeView.ports.values()) {
        const portPosition = {
          x: portView.rect.x + portView.rect.width / 2,
          y: portView.rect.y + portView.rect.height / 2,
        }
        //console.log("port", portView.port, portPosition)
        const distanceSqr = (position.x - portPosition.x) ** 2 + (position.y - portPosition.y) ** 2
        if(distanceSqr > maxDistanceSqr) continue
        //console.log("port dist ok")
        if(filter(nodeView.node, portView.port) === false) continue
        if(distanceSqr < nearestDistanceSqr) {
          nearestPortView = portView
          nearestNodeView = nodeView
          nearestDistanceSqr = distanceSqr
        }
      }
    }
    return {
      portView: nearestPortView,
      nodeView: nearestNodeView,
      distance: Math.sqrt(nearestDistanceSqr),
    }
  }

  watch(() => container.value, () => {
    for(const nodeView of nodeViews.values()) {
      invalidateNodeView(nodeView)
    }
  }, { immediate: true })

  function startDragNode(node, event) {
    node = getNode(node)
    dragState.value = {
      type: "dragNode",
      node,
      initialPosition: {
        x: node.position.x,
        y: node.position.y
      },
      startPosition: getEventPosition(event)
    }
  }

  function startDrawEdge(nodeId, portId, event, newEdgeOptions) {
    console.log("startDrawEdge", nodeId, portId, event)
    nodeId = getNodeId(nodeId)
    if (typeof portId != "string") portId = portId.id ?? `${node.id}/${portId.name}`
    dragState.value = {
      type: "drawEdge",
      node: nodeId,
      port: portId,
      edge: newEdgeOptions
    }
  }

  function deleteEdge(edgeId) {
    edgeId = getEdgeId(edgeId)
    const edgeIndex = findEdgeIndex(edgeId)
    if(edgeIndex < 0) return
    if(options.deleteEdge) {
      options.deleteEdge(unref(edges)[edgeIndex])
    } else {
      edges.splice(edgeIndex, 1)
    }
  }

  function deleteNode(nodeId) {
    nodeId = getNodeId(nodeId)
    const nodeIndex = findNodeIndex(nodeId)
    if(nodeIndex < 0) return
    const edgesToDelete = unref(edges).filter(e => e.src.node == nodeId || e.dest.node == nodeId)
    for(const edge of edgesToDelete) {
      deleteEdge(edge)
    }
    if(options.deleteNode) {
      options.deleteNode(unref(nodes)[nodeIndex])
    } else {
      nodes.splice(nodeIndex, 1)
    }
  }

  function startDragEdgeEnd(edge, end, event) {
    edge = getEdge(edge)
    deleteEdge(edge)
    const otherEnd = {
      'dest': 'src',
      'src': 'dest',
    }[end]
    dragState.value = {
      type: "drawEdge",
      node: edge[otherEnd].node,
      port: edge[otherEnd].port,
      edge
    }
  }


  function updateNode(nodeId, value) {
    nodeId = getNodeId(nodeId)
    const node = findNode(nodeId)
    //console.log("updateNode", nodeId, node, nodes, JSON.stringify(node, null, 2))
    if(options.updateNode) {
      if (typeof value == "function") {
        options.updateNode(node, value)
      } else {
        options.updateNode(node, (node) => {
          for (const key in value) {
            if (key != "id") node[key] = value[key]
          }
          return node
        })
      }
    } else {
      if (typeof value == "function") {
        value(node)
      } else {
        for (const key in value) {
          if (key != "id") node[key] = value[key]
        }
      }
    }
    //console.log("updatedNode", nodeId, node, nodes, JSON.stringify(node, null, 2))
  }

  let nextEdgeId = 0
  function generateEdgeId() {
    if(options.uidGenerator) return options.uidGenerator()
    return `e${(nextEdgeId++).toFixed().padStart(4, "0")}`
  }

  let nextNodeId = 0
  function generateNodeId() {
    if(options.uidGenerator) return options.uidGenerator()
    return `n${(nextNodeId++).toFixed().padStart(4, "0")}`
  }

  let nextPortId = 0
  function generatePortId() {
    if(options.uidGenerator) return options.uidGenerator()
    return `p${(nextPortId++).toFixed().padStart(4, "0")}`
  }

  const flow = {
    nodes,
    edges,

    dragState,
    container,
    viewport,

    nodeViews,

    position, size, scale,

    options,

    findNodeIndex,
    findNode,
    getNodeId,
    getNode,

    updateNode,
    deleteNode,
    deleteEdge,

    startDragNode,
    startDrawEdge,
    startDragEdgeEnd,
    updatePositionAndScale,
    zoom,

    getPortView,
    getNearestPortView,

    invalidateNodeView,
    invalidatePortView,

    generateEdgeId,
    generateNodeId,
    generatePortId,

    setNodeElement,
    setPortElement,

    getEventPosition,
    getElementPosition,
    getElementRect,
  }
  provide("flow", flow)

  return flow
}