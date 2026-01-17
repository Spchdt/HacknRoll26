import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { File, CheckCircle } from 'lucide-react';
import type { GitGraph, FileTarget } from '../types';

interface GitGraphViewProps {
  graph: GitGraph | null;
  fileTargets: FileTarget[];
  branches: string[];
  maxDepth: number;
}

// Vibrant branch colors (like the reference image)
const BRANCH_COLORS = [
  '#3b82f6', // blue - main
  '#eab308', // yellow
  '#ec4899', // pink/magenta
  '#06b6d4', // cyan
  '#22c55e', // green
  '#f43f5e', // red
  '#a855f7', // purple
  '#f97316', // orange
];

const NODE_RADIUS = 8;
const NODE_RADIUS_HEAD = 10;
const CELL_WIDTH = 70;
const CELL_HEIGHT = 50;
const PADDING_X = 60;
const PADDING_Y = 40;

export function GitGraphView({ graph, fileTargets, branches, maxDepth }: GitGraphViewProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle pinch zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastDistance = 0;

    const getTouchDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastDistance = getTouchDistance(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const currentDistance = getTouchDistance(e.touches);
        const delta = currentDistance - lastDistance;
        
        setScale(prev => {
          const newScale = Math.max(0.5, Math.min(3, prev + delta * 0.005));
          return newScale;
        });
        
        lastDistance = currentDistance;
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const { nodes, edges, filePositions, branchLines } = useMemo(() => {
    if (!graph) {
      return { nodes: [], edges: [], filePositions: [], branchLines: [] };
    }

    const nodePositions: Record<string, { x: number; y: number; branchIndex: number }> = {};
    const nodes: Array<{
      id: string;
      x: number;
      y: number;
      branchIndex: number;
      isHead: boolean;
      isBranchTip: boolean;
      branchName: string | null;
      isFilled: boolean;
    }> = [];
    const edges: Array<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      fromBranchIndex: number;
      toBranchIndex: number;
      isMerge: boolean;
    }> = [];

    // Horizontal layout: x = depth (left to right), y = branch (top to bottom)
    Object.values(graph.commits).forEach((commit) => {
      const branchIndex = branches.indexOf(commit.branch);
      const x = PADDING_X + commit.depth * CELL_WIDTH;
      const y = PADDING_Y + branchIndex * CELL_HEIGHT;

      nodePositions[commit.id] = { x, y, branchIndex };

      const isHead =
        (graph.head.type === 'attached' &&
          graph.branches[graph.head.ref]?.tipCommitId === commit.id) ||
        (graph.head.type === 'detached' && graph.head.ref === commit.id);

      const branchTip = Object.entries(graph.branches).find(
        ([_, branch]) => branch.tipCommitId === commit.id
      );

      nodes.push({
        id: commit.id,
        x,
        y,
        branchIndex: branchIndex >= 0 ? branchIndex : 0,
        isHead,
        isBranchTip: !!branchTip,
        branchName: branchTip ? branchTip[0] : null,
        isFilled: true,
      });
    });

    // Create edges between commits
    Object.values(graph.commits).forEach((commit) => {
      commit.parents.forEach((parentId, index) => {
        const fromPos = nodePositions[parentId];
        const toPos = nodePositions[commit.id];
        if (fromPos && toPos) {
          edges.push({
            fromX: fromPos.x,
            fromY: fromPos.y,
            toX: toPos.x,
            toY: toPos.y,
            fromBranchIndex: fromPos.branchIndex,
            toBranchIndex: toPos.branchIndex,
            isMerge: index > 0,
          });
        }
      });
    });

    // Calculate file target positions (horizontal)
    const filePositions = fileTargets.map((file) => {
      const branchIndex = branches.indexOf(file.branch);
      return {
        ...file,
        x: PADDING_X + file.depth * CELL_WIDTH,
        y: PADDING_Y + branchIndex * CELL_HEIGHT,
        branchIndex: branchIndex >= 0 ? branchIndex : 0,
      };
    });

    // Create continuous branch lines
    const branchLines = branches.map((branch, branchIndex) => {
      const branchCommits = Object.values(graph.commits)
        .filter((c) => c.branch === branch)
        .sort((a, b) => a.depth - b.depth);
      
      const minDepth = branchCommits.length > 0 ? branchCommits[0].depth : 0;
      const maxDepthForBranch = branchCommits.length > 0 
        ? branchCommits[branchCommits.length - 1].depth 
        : 0;
      
      return {
        branch,
        branchIndex,
        startX: PADDING_X + minDepth * CELL_WIDTH,
        endX: PADDING_X + maxDepthForBranch * CELL_WIDTH,
        y: PADDING_Y + branchIndex * CELL_HEIGHT,
        color: BRANCH_COLORS[branchIndex % BRANCH_COLORS.length],
      };
    });

    return { nodes, edges, filePositions, branchLines };
  }, [graph, fileTargets, branches]);

  const svgWidth = PADDING_X * 2 + (maxDepth + 2) * CELL_WIDTH;
  const svgHeight = PADDING_Y * 2 + branches.length * CELL_HEIGHT;

  if (!graph) {
    return (
      <div className="git-graph-placeholder">
        <p>Start a game to see the Git graph</p>
      </div>
    );
  }

  // Generate curved path for edges (horizontal flow with curves for branch changes)
  const generateEdgePath = (edge: typeof edges[0]) => {
    const { fromX, fromY, toX, toY } = edge;
    
    if (fromY === toY) {
      // Same branch - straight horizontal line
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    } else {
      // Different branches - curved connection
      const midX = (fromX + toX) / 2;
      return `M ${fromX} ${fromY} 
              C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
    }
  };

  return (
    <div ref={containerRef} className="git-graph-container horizontal" style={{ transform: `scale(${scale})`, transformOrigin: '0 0', transition: 'transform 0.1s' }}>
      <svg
        className="git-graph-svg"
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width={CELL_WIDTH} height={CELL_HEIGHT} patternUnits="userSpaceOnUse">
            <path d={`M ${CELL_WIDTH} 0 L 0 0 0 ${CELL_HEIGHT}`} fill="none" stroke="#e5e7eb" strokeWidth="1" />
          </pattern>
        </defs>
        
        {/* Fill the entire background with grid */}
        <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

        {/* Branch labels on the left */}
        {branches.map((branch, index) => (
          <text
            key={branch}
            x={10}
            y={PADDING_Y + index * CELL_HEIGHT + 4}
            fill={BRANCH_COLORS[index % BRANCH_COLORS.length]}
            fontSize={12}
            fontWeight="bold"
            fontFamily="monospace"
          >
            {branch}
          </text>
        ))}

        {/* Continuous branch lines */}
        {branchLines.map((line) => (
          <motion.line
            key={line.branch}
            x1={line.startX}
            y1={line.y}
            x2={line.endX}
            y2={line.y}
            stroke={line.color}
            strokeWidth={3}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}

        {/* Edge connections (merges and branch connections) */}
        {edges.map((edge, index) => {
          const color = BRANCH_COLORS[edge.toBranchIndex % BRANCH_COLORS.length];
          return (
            <motion.path
              key={`edge-${index}`}
              d={generateEdgePath(edge)}
              stroke={color}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            />
          );
        })}

        {/* File targets */}
        {filePositions.map((file) => (
          <motion.g key={file.id}>
            {!file.collected && (
              <motion.circle
                cx={file.x}
                cy={file.y}
                r={NODE_RADIUS + 8}
                fill="none"
                stroke={BRANCH_COLORS[file.branchIndex % BRANCH_COLORS.length]}
                strokeWidth={2}
                strokeDasharray="4,4"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.g>
        ))}

        {/* Commit nodes */}
        {nodes.map((node) => {
          const color = BRANCH_COLORS[node.branchIndex % BRANCH_COLORS.length];
          const radius = node.isHead ? NODE_RADIUS_HEAD : NODE_RADIUS;
          
          // Check if this node has a file target
          const hasFile = filePositions.find(
            (f) => f.x === node.x && f.y === node.y
          );
          const fileCollected = hasFile?.collected;
          
          return (
            <motion.g key={node.id}>
              {/* Node circle */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill={node.isBranchTip && !node.isHead ? 'transparent' : color}
                stroke={color}
                strokeWidth={3}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
              
              {/* HEAD indicator */}
              {node.isHead && (
                <>
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 5}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={2}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  />
                  <motion.text
                    x={node.x}
                    y={node.y - radius - 10}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={10}
                    fontWeight="bold"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    HEAD
                  </motion.text>
                </>
              )}
              
              {/* File collected indicator */}
              {hasFile && (
                <motion.text
                  x={node.x}
                  y={node.y + radius + 16}
                  textAnchor="middle"
                  fontSize={14}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {fileCollected ? '✅' : '📄'}
                </motion.text>
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="graph-legend horizontal">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#fff', border: '2px solid #fff' }} />
          <span>HEAD</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot filled" style={{ background: '#3b82f6' }} />
          <span>Commit</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot hollow" style={{ border: '2px solid #3b82f6' }} />
          <span>Branch Tip</span>
        </div>
        <div className="legend-item">
          <span>📄</span>
          <span>File</span>
        </div>
        <div className="legend-item">
          <span>✅</span>
          <span>Collected</span>
        </div>
      </div>
    </div>
  );
}