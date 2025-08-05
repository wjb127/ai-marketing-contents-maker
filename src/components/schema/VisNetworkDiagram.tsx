'use client'

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from 'reactflow'
import { Box, useColorModeValue } from '@chakra-ui/react'

// Import ReactFlow styles
import 'reactflow/dist/style.css'

interface SchemaData {
  tables: Array<{
    name: string
    description: string
    columns: Array<{
      name: string
      type: string
      primaryKey?: boolean
    }>
    relationships: Array<{
      type: string
      table: string
      column: string
    }>
  }>
}

interface ReactFlowDiagramProps {
  schemaData: SchemaData
  type: 'network' | 'hierarchy'
}

export default function ReactFlowDiagram({ schemaData, type }: ReactFlowDiagramProps) {
  const bgColor = useColorModeValue('white', 'gray.800')

  // Create nodes from schema data
  const initialNodes: Node[] = useMemo(() => {
    return schemaData.tables.map((table, index) => {
      let bgColor = '#E3F2FD' // default blue
      let borderColor = '#1976D2'
      
      if (table.name === 'users') {
        bgColor = '#E3F2FD'
        borderColor = '#1976D2'
      } else if (table.name === 'contents') {
        bgColor = '#F3E5F5'
        borderColor = '#7B1FA2'
      } else if (table.name === 'schedules') {
        bgColor = '#E8F5E8'
        borderColor = '#388E3C'
      } else if (table.name === 'payments') {
        bgColor = '#FFF3E0'
        borderColor = '#F57C00'
      }

      const keyColumns = table.columns
        .filter(col => col.primaryKey || col.name.includes('_id'))
        .slice(0, 4)

      // Position nodes based on type
      let position
      if (type === 'hierarchy') {
        // Hierarchical layout
        if (table.name === 'users') {
          position = { x: 400, y: 50 }
        } else if (table.name === 'contents') {
          position = { x: 200, y: 250 }
        } else if (table.name === 'schedules') {
          position = { x: 400, y: 250 }
        } else if (table.name === 'payments') {
          position = { x: 600, y: 250 }
        } else {
          position = { x: index * 200, y: 400 }
        }
      } else {
        // Network layout - spread them out
        const angle = (index / schemaData.tables.length) * 2 * Math.PI
        const radius = 200
        position = {
          x: 400 + Math.cos(angle) * radius,
          y: 300 + Math.sin(angle) * radius
        }
      }

      return {
        id: table.name,
        type: 'default',
        position,
        data: {
          label: (
            <div style={{ 
              padding: '12px',
              backgroundColor: bgColor,
              border: `2px solid ${borderColor}`,
              borderRadius: '8px',
              minWidth: '180px',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '14px', 
                marginBottom: '4px',
                color: borderColor
              }}>
                {table.name.toUpperCase()}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#666',
                marginBottom: '8px'
              }}>
                {table.description}
              </div>
              <div style={{ fontSize: '10px', textAlign: 'left' }}>
                {keyColumns.map((col, idx) => (
                  <div key={idx} style={{ marginBottom: '2px' }}>
                    {col.primaryKey ? '🔑' : '🔗'} {col.name}
                  </div>
                ))}
              </div>
            </div>
          )
        },
        style: {
          background: 'transparent',
          border: 'none',
          width: 'auto',
          height: 'auto'
        }
      }
    })
  }, [schemaData, type])

  // Create edges from relationships
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = []
    
    schemaData.tables.forEach((table) => {
      table.relationships.forEach((rel) => {
        const targetTable = schemaData.tables.find(t => t.name === rel.table)
        if (targetTable && table.name !== rel.table) {
          edges.push({
            id: `${table.name}-${rel.table}`,
            source: table.name,
            target: rel.table,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: '#4A5568',
              strokeWidth: 2
            },
            markerEnd: {
              type: 'arrowclosed',
              color: '#4A5568'
            }
          })
        }
      })
    })

    return edges
  }, [schemaData])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onInit = useCallback((reactFlowInstance: any) => {
    console.log('ReactFlow loaded:', reactFlowInstance)
  }, [])

  return (
    <Box
      height="500px"
      bg={bgColor}
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      overflow="hidden"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            if (node.id === 'users') return '#1976D2'
            if (node.id === 'contents') return '#7B1FA2'
            if (node.id === 'schedules') return '#388E3C'
            if (node.id === 'payments') return '#F57C00'
            return '#666'
          }}
          style={{
            height: 80,
            width: 120
          }}
        />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </Box>
  )
}