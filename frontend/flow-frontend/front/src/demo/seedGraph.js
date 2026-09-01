export const STORAGE_KEY = 'flow-frontend-demo-graph'

export function createSeedGraph() {
  return {
    nodes: [
      {
        id: 'source',
        type: 'source',
        position: { x: 80, y: 140 },
        record: { sku: 'ABC-12', qty: 2, nip: '1234567890' }
      },
      {
        id: 'enrich',
        type: 'enrich',
        position: { x: 420, y: 140 },
        field: 'vatRate',
        value: 23
      },
      {
        id: 'output',
        type: 'output',
        position: { x: 760, y: 140 }
      }
    ],
    edges: [
      {
        id: 'e-source-enrich',
        src: { node: 'source', port: 'out' },
        dest: { node: 'enrich', port: 'in' }
      },
      {
        id: 'e-enrich-output',
        src: { node: 'enrich', port: 'out' },
        dest: { node: 'output', port: 'in' }
      }
    ]
  }
}
