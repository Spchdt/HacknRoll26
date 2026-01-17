import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { GitGraph, FileTarget } from '../types';

interface GitGraphViewProps {
  graph: GitGraph | null;
  fileTargets: FileTarget[];
  branches: string[];
  maxDepth: number;
}

interface NodePosition {
  x: number;
  y: number;
}

const CELL_WIDTH = 80;
const CELL_HEIGHT = 60;
const PADDING = 40;

export function GitGraphView({ graph, fileTargets, branches, maxDepth }: GitGraphViewProps) {
  const { nodes, edges, filePositions } = useMemo(() => {
    if (!graph) {
      return { nodes: [], edges: [], filePositions: [] };
    }

    const nodePositions: Record<string, NodePosition> = {};
    const nodes: Array<{
      id: string;
      x: number;
      y: number;
      isHead: boolean;
      isBranchTip: boolean;
      branchName: string | null;
    }> = [];
    const edges: Array<{
      from: NodePosition;
      to: NodePosition;
      isMerge: boolean;
    }> = [];

    // Calculate positions for each commit based on branch and depth
    Object.values(graph.commits).forEach((commit) => {
      const branchIndex = branches.indexOf(commit.branch);
      const x = PADDING + branchIndex * CELL_WIDTH;
      const y = PADDING + commit.depth * CELL_HEIGHT;

      nodePositions[commit.id] = { x, y };

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
        isHead,
        isBranchTip: !!branchTip,
        branchName: branchTip ? branchTip[0] : null,
      });
    });

    // Create edges between commits
    Object.values(graph.commits).forEach((commit) => {
      commit.parents.forEach((parentId, index) => {
        if (nodePositions[parentId] && nodePositions[commit.id]) {
          edges.push({
            from: nodePositions[parentId],
            to: nodePositions[commit.id],
            isMerge: index > 0,
          });
        }
      });
    });

    // Calculate file target positions
    const filePositions = fileTargets.map((file) => {
      const branchIndex = branches.indexOf(file.branch);
      return {
        ...file,
        x: PADDING + branchIndex * CELL_WIDTH,
        y: PADDING + file.depth * CELL_HEIGHT,
      };
    });

    return { nodes, edges, filePositions };
  }, [graph, fileTargets, branches]);

  const svgWidth = PADDING * 2 + branches.length * CELL_WIDTH;
  const svgHeight = PADDING * 2 + (maxDepth + 1) * CELL_HEIGHT;

  if (!graph) {
    return (
      <div className="git-graph-placeholder">
        <p>Start a game to see the Git graph</p>
      </div>
    );
  }

  return (
    <div className="git-graph-container">
      {/* Branch labels */}
      <div className="branch-labels">
        {branches.map((branch, index) => (
          <div
            key={branch}
            className="branch-label"
            style={{ left: PADDING + index * CELL_WIDTH }}
          >
            {branch}
          </div>
        ))}
      </div>

      <svg
        className="git-graph-svg"
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        {/* Grid lines (optional, for debugging) */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, index) => (
          <motion.path
            key={index}
            d={`M ${edge.from.x} ${edge.from.y} 
                C ${edge.from.x} ${(edge.from.y + edge.to.y) / 2},
                  ${edge.to.x} ${(edge.from.y + edge.to.y) / 2},
                  ${edge.to.x} ${edge.to.y}`}
            stroke={edge.isMerge ? '#f59e0b' : '#6b7280'}
            strokeWidth={2}
            fill="none"
            strokeDasharray={edge.isMerge ? '5,5' : 'none'}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}

        {/* File targets */}
        {filePositions.map((file) => (
          <motion.g key={file.id}>
            <motion.rect
              x={file.x - 15}
              y={file.y - 15}
              width={30}
              height={30}
              rx={4}
              fill={file.collected ? '#22c55e' : '#3b82f6'}
              opacity={0.3}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />
            <motion.text
              x={file.x}
              y={file.y + 4}
              textAnchor="middle"
              fontSize={14}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {file.collected ? '✅' : '📄'}
            </motion.text>
          </motion.g>
        ))}

        {/* Commit nodes */}
        {nodes.map((node) => (
          <motion.g key={node.id}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.isHead ? 14 : 10}
              fill={node.isHead ? '#22c55e' : '#6b7280'}
              stroke={node.isHead ? '#16a34a' : '#4b5563'}
              strokeWidth={2}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
            {node.isHead && (
              <motion.text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fontSize={10}
                fill="white"
                fontWeight="bold"
              >
                HEAD
              </motion.text>
            )}
            {node.branchName && !node.isHead && (
              <motion.text
                x={node.x + 18}
                y={node.y + 4}
                fontSize={10}
                fill="#9ca3af"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {node.branchName}
              </motion.text>
            )}
          </motion.g>
        ))}
      </svg>

      {/* Legend */}
      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-dot head" /> HEAD
        </div>
        <div className="legend-item">
          <span className="legend-dot commit" /> Commit
        </div>
        <div className="legend-item">
          <span className="legend-icon">📄</span> File (uncollected)
        </div>
        <div className="legend-item">
          <span className="legend-icon">✅</span> File (collected)
        </div>
      </div>
    </div>
  );
}
