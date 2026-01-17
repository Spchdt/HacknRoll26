import { useMemo } from 'react';
import type { GitGraph, Commit, Branch, FileTarget } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GitGraphProps {
  graph: GitGraph;
  files: FileTarget[];
  className?: string;
}

interface NodePosition {
  x: number;
  y: number;
  commit: Commit;
  branch: Branch | null;
}

const NODE_RADIUS = 16;
const NODE_SPACING_X = 100;
const NODE_SPACING_Y = 60;
const BRANCH_OFFSET = 80;

export default function GitGraphComponent({ graph, files, className }: GitGraphProps) {
  // Calculate positions for all commits
  const { nodes, connections, dimensions } = useMemo(() => {
    const branchOrder = Array.from(graph.branches.keys());
    const nodePositions = new Map<string, NodePosition>();
    const connectionsList: { from: NodePosition; to: NodePosition; isMerge?: boolean }[] = [];

    // Sort commits by depth
    const sortedCommits = Array.from(graph.commits.values()).sort(
      (a, b) => a.depth - b.depth
    );

    // Calculate positions
    sortedCommits.forEach((commit) => {
      const branchIndex = branchOrder.indexOf(commit.branch);
      const x = BRANCH_OFFSET + branchIndex * BRANCH_OFFSET;
      const y = 40 + commit.depth * NODE_SPACING_Y;

      const branch = graph.branches.get(commit.branch) || null;
      nodePositions.set(commit.id, { x, y, commit, branch });
    });

    // Calculate connections
    sortedCommits.forEach((commit) => {
      const toPos = nodePositions.get(commit.id);
      if (!toPos) return;

      commit.parentIds.forEach((parentId, index) => {
        const fromPos = nodePositions.get(parentId);
        if (fromPos) {
          connectionsList.push({
            from: fromPos,
            to: toPos,
            isMerge: index > 0,
          });
        }
      });
    });

    const maxX = Math.max(...Array.from(nodePositions.values()).map(n => n.x)) + BRANCH_OFFSET;
    const maxY = Math.max(...Array.from(nodePositions.values()).map(n => n.y)) + NODE_SPACING_Y;

    return {
      nodes: Array.from(nodePositions.values()),
      connections: connectionsList,
      dimensions: { width: Math.max(maxX, 300), height: Math.max(maxY, 200) },
    };
  }, [graph]);

  // Get current HEAD position
  const headCommitId = graph.isDetached
    ? graph.headRef
    : graph.branches.get(graph.headRef)?.tipCommitId;

  // File positions for display
  const filePositions = useMemo(() => {
    return files.map((file) => {
      const branchOrder = Array.from(graph.branches.keys());
      const branchIndex = branchOrder.indexOf(file.branch);
      return {
        file,
        x: BRANCH_OFFSET + branchIndex * BRANCH_OFFSET + NODE_RADIUS + 10,
        y: 40 + file.depth * NODE_SPACING_Y,
      };
    });
  }, [files, graph.branches]);

  return (
    <div className={cn('relative bg-gray-50 rounded-lg overflow-auto', className)}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="min-w-full min-h-full"
      >
        {/* Branch labels */}
        {Array.from(graph.branches.values()).map((branch, index) => (
          <g key={branch.name}>
            <text
              x={BRANCH_OFFSET + index * BRANCH_OFFSET}
              y={20}
              textAnchor="middle"
              className="text-xs font-mono font-bold fill-current"
              style={{ fill: branch.color }}
            >
              {branch.name}
            </text>
          </g>
        ))}

        {/* Connections */}
        {connections.map((conn, index) => {
          const isCurrentPath = conn.to.commit.id === headCommitId;
          return (
            <path
              key={index}
              d={createConnectionPath(conn.from, conn.to)}
              fill="none"
              stroke={conn.to.branch?.color || '#6b7280'}
              strokeWidth={isCurrentPath ? 3 : 2}
              strokeDasharray={conn.isMerge ? '4,4' : undefined}
              opacity={0.6}
            />
          );
        })}

        {/* Commit nodes */}
        {nodes.map((node) => {
          const isHead = node.commit.id === headCommitId;
          const isBranchTip = Array.from(graph.branches.values()).some(
            (b) => b.tipCommitId === node.commit.id
          );

          return (
            <g key={node.commit.id}>
              {/* Outer ring for HEAD */}
              {isHead && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS + 4}
                  fill="none"
                  stroke="#000"
                  strokeWidth={2}
                  className="animate-pulse"
                />
              )}

              {/* Commit circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                fill={node.branch?.color || '#6b7280'}
                stroke={isHead ? '#000' : 'white'}
                strokeWidth={2}
              />

              {/* Commit hash */}
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                className="text-[10px] font-mono fill-white font-bold"
              >
                {node.commit.id.slice(0, 4)}
              </text>

              {/* Branch tip indicator */}
              {isBranchTip && !isHead && (
                <circle
                  cx={node.x + NODE_RADIUS - 4}
                  cy={node.y - NODE_RADIUS + 4}
                  r={4}
                  fill="#22c55e"
                  stroke="white"
                  strokeWidth={1}
                />
              )}
            </g>
          );
        })}

        {/* File targets */}
        {filePositions.map(({ file, x, y }) => (
          <g key={file.id}>
            <rect
              x={x}
              y={y - 10}
              width={80}
              height={20}
              rx={4}
              fill={file.collected ? '#22c55e' : '#f59e0b'}
              opacity={0.9}
            />
            <text
              x={x + 40}
              y={y + 4}
              textAnchor="middle"
              className="text-[10px] font-mono fill-white"
            >
              {file.collected ? '✓ ' : ''}{file.name.slice(0, 10)}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-white/90 rounded p-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Collected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Target</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-black" />
          <span>HEAD</span>
        </div>
      </div>
    </div>
  );
}

// Create SVG path for connection
function createConnectionPath(from: NodePosition, to: NodePosition): string {
  if (from.x === to.x) {
    // Straight line
    return `M ${from.x} ${from.y + NODE_RADIUS} L ${to.x} ${to.y - NODE_RADIUS}`;
  }

  // Curved path for branch/merge
  const midY = (from.y + to.y) / 2;
  return `
    M ${from.x} ${from.y + NODE_RADIUS}
    C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - NODE_RADIUS}
  `;
}

// Simple view when graph is empty or for loading state
export function GitGraphSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center bg-gray-50 rounded-lg', className)}>
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Loading git graph...</p>
      </div>
    </div>
  );
}
