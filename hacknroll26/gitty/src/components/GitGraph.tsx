import { useMemo } from 'react';
import type { GitGraph, Commit, FileTarget } from '@/lib/types';
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
  color: string;
  lane: number;
}

// Layout constants
const NODE_RADIUS = 14;
const CELL_WIDTH = 80;
const CELL_HEIGHT = 70;
const PADDING_LEFT = 100;
const PADDING_TOP = 50;

// Branch colors
const BRANCH_COLORS: Record<string, string> = {
  main: '#F59E0B',
  master: '#3B82F6',
  feature: '#A855F7',
  develop: '#84CC16',
};

const DEFAULT_COLORS = ['#F59E0B', '#A855F7', '#3B82F6', '#84CC16', '#EC4899', '#14B8A6'];

function getBranchColor(name: string, idx: number): string {
  return BRANCH_COLORS[name.toLowerCase()] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
}

export default function GitGraphComponent({ graph, files, className }: GitGraphProps) {
  // Calculate grid dimensions and positions
  const { nodes, connections, lanes, gridInfo, dimensions } = useMemo(() => {
    const nodePositions = new Map<string, NodePosition>();
    const connectionsList: { from: NodePosition; to: NodePosition; color: string }[] = [];
    
    // Get all branches (including from files)
    const branchNames = Array.from(graph.branches.keys());
    const fileBranches = files.map(f => f.branch).filter(b => !branchNames.includes(b));
    const allBranches = [...new Set([...branchNames, ...fileBranches])];
    
    // Sort: main first, then alphabetically
    const sortedBranches = allBranches.sort((a, b) => {
      if (a === 'main' || a === 'master') return -1;
      if (b === 'main' || b === 'master') return 1;
      return a.localeCompare(b);
    });

    const branchLaneMap = new Map<string, number>();
    const laneColors = new Map<string, string>();
    sortedBranches.forEach((name, idx) => {
      branchLaneMap.set(name, idx);
      laneColors.set(name, getBranchColor(name, idx));
    });

    const sortedCommits = Array.from(graph.commits.values()).sort((a, b) => a.depth - b.depth);
    
    // Grid dimensions
    const maxCommitDepth = Math.max(...sortedCommits.map(c => c.depth), 0);
    const maxFileDepth = Math.max(...files.map(f => f.depth), 0);
    const maxDepth = Math.max(maxCommitDepth, maxFileDepth);
    const numRows = sortedBranches.length;
    const numCols = maxDepth + 1;

    // Position commits
    sortedCommits.forEach((commit) => {
      const lane = branchLaneMap.get(commit.branch) ?? 0;
      const x = PADDING_LEFT + commit.depth * CELL_WIDTH;
      const y = PADDING_TOP + lane * CELL_HEIGHT;
      const color = laneColors.get(commit.branch) || DEFAULT_COLORS[0];
      nodePositions.set(commit.id, { x, y, commit, color, lane });
    });

    // Build connections
    sortedCommits.forEach((commit) => {
      const toPos = nodePositions.get(commit.id);
      if (!toPos) return;
      commit.parentIds.forEach((parentId) => {
        const fromPos = nodePositions.get(parentId);
        if (fromPos) {
          connectionsList.push({ from: fromPos, to: toPos, color: toPos.color });
        }
      });
    });

    const width = PADDING_LEFT + numCols * CELL_WIDTH + 40;
    const height = PADDING_TOP + numRows * CELL_HEIGHT + 30;

    const lanesInfo = sortedBranches.map((name, idx) => ({
      name,
      y: PADDING_TOP + idx * CELL_HEIGHT,
      color: laneColors.get(name) || DEFAULT_COLORS[0],
    }));

    return {
      nodes: Array.from(nodePositions.values()),
      connections: connectionsList,
      lanes: lanesInfo,
      gridInfo: { numRows, numCols },
      dimensions: { width, height },
    };
  }, [graph, files]);

  // HEAD position
  const headCommitId = graph.isDetached
    ? graph.headRef
    : graph.branches.get(graph.headRef)?.tipCommitId;
  const currentBranchName = graph.isDetached ? null : graph.headRef;

  // File positions
  const filePositions = useMemo(() => {
    return files.map((file) => {
      const matchingNode = nodes.find(
        n => n.commit.branch === file.branch && n.commit.depth === file.depth
      );
      if (matchingNode) {
        return { file, x: matchingNode.x, y: matchingNode.y };
      }
      const lane = lanes.find(l => l.name === file.branch);
      const x = PADDING_LEFT + file.depth * CELL_WIDTH;
      const y = lane ? lane.y : PADDING_TOP + lanes.length * CELL_HEIGHT;
      return { file, x, y };
    });
  }, [files, nodes, lanes]);

  return (
    <div className={cn('relative bg-white rounded-lg overflow-auto border border-gray-200', className)}>
      <svg width={dimensions.width} height={dimensions.height} className="min-w-full min-h-full">
        {/* Branch labels */}
        {lanes.map((lane) => {
          const isCurrent = lane.name === currentBranchName;
          return (
            <g key={lane.name}>
              {isCurrent && (
                <rect x={4} y={lane.y - 12} width={72} height={24} rx={4}
                  fill="none" stroke="#000" strokeWidth={2} />
              )}
              <rect x={6} y={lane.y - 10} width={68} height={20} rx={3} fill={lane.color} />
              <text x={40} y={lane.y + 4} textAnchor="middle" className="text-[10px] font-bold" fill="white">
                {isCurrent ? `* ${lane.name}` : lane.name}
              </text>
            </g>
          );
        })}

        {/* Lane lines */}
        {lanes.map((lane) => {
          const laneNodes = nodes.filter(n => n.commit.branch === lane.name);
          if (laneNodes.length === 0) return null;
          const minX = Math.min(...laneNodes.map(n => n.x));
          const maxX = Math.max(...laneNodes.map(n => n.x));
          return (
            <line key={`line-${lane.name}`} x1={minX} y1={lane.y} x2={maxX} y2={lane.y}
              stroke={lane.color} strokeWidth={3} strokeLinecap="round" />
          );
        })}

        {/* Cross-lane connections */}
        {connections.filter(c => c.from.lane !== c.to.lane).map((conn, i) => (
          <path key={i} d={createCurve(conn.from, conn.to)} fill="none"
            stroke={conn.color} strokeWidth={3} strokeLinecap="round" />
        ))}

        {/* Commit nodes */}
        {nodes.map((node) => {
          const isHead = node.commit.id === headCommitId;
          return (
            <g key={node.commit.id}>
              <circle cx={node.x} cy={node.y} r={NODE_RADIUS} fill={node.color} stroke="white" strokeWidth={2} />
              {isHead && (
                <>
                  <line x1={node.x} y1={node.y + NODE_RADIUS + 4} x2={node.x} y2={node.y + NODE_RADIUS + 18}
                    stroke="#000" strokeWidth={2} />
                  <text x={node.x} y={node.y + NODE_RADIUS + 30} textAnchor="middle"
                    className="text-[10px] font-bold" fill="#000">HEAD</text>
                </>
              )}
            </g>
          );
        })}

        {/* File targets */}
        {filePositions.map(({ file, x, y }) => (
          <g key={file.id}>
            <circle cx={x} cy={y} r={NODE_RADIUS + 6} fill="none"
              stroke={file.collected ? '#22c55e' : '#f59e0b'} strokeWidth={2}
              strokeDasharray={file.collected ? undefined : '5,3'} />
            <text x={x} y={y + 4} textAnchor="middle" className="text-[10px]" 
              fill={file.collected ? '#22c55e' : '#f59e0b'}>
              {file.collected ? '✓' : '📄'}
            </text>
            <text x={x} y={y - NODE_RADIUS - 10} textAnchor="middle"
              className="text-[10px] font-medium" fill={file.collected ? '#22c55e' : '#666'}>
              {file.name}
            </text>
          </g>
        ))}
      </svg>

      {/* Compact legend */}
      <div className="absolute bottom-2 right-2 bg-white/95 rounded-lg px-3 py-2 text-xs flex flex-col gap-1 border border-gray-200 shadow-sm">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          Collected
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-dashed border-amber-500" />
          Target
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[10px] font-bold">HEAD</span>
          Current
        </span>
      </div>
    </div>
  );
}

function createCurve(from: NodePosition, to: NodePosition): string {
  const midX = from.x + (to.x - from.x) * 0.4;
  return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
}

export function GitGraphSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center bg-white rounded-lg border border-gray-200', className)}>
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-xs mt-2">Loading...</p>
      </div>
    </div>
  );
}
