import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { GitGraph, Commit, FileTarget } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

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
    
    // Get branch names from graph
    const graphBranchNames = graph.branches instanceof Map 
      ? Array.from(graph.branches.keys())
      : Object.keys(graph.branches || {});
    
    // Also include branches from file targets (even if not created yet)
    const fileBranchNames = files.map(f => f.branch);
    const allBranchNames = [...new Set([...graphBranchNames, ...fileBranchNames])];
    
    // Sort: main first, then alphabetically
    const sortedBranches = allBranchNames.sort((a, b) => {
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

    // Handle both Map and plain object formats for commits
    const commits = graph.commits instanceof Map 
      ? Array.from(graph.commits.values())
      : Object.values(graph.commits || {});
    
    const sortedCommits = commits.sort((a: any, b: any) => (a.depth ?? 0) - (b.depth ?? 0));
    
    // Grid dimensions
    const maxCommitDepth = sortedCommits.length > 0 ? Math.max(...sortedCommits.map((c: any) => c.depth ?? 0)) : 0;
    const maxFileDepth = files.length > 0 ? Math.max(...files.map(f => f.depth)) : 0;
    const maxDepth = Math.max(maxCommitDepth, maxFileDepth);
    const numRows = sortedBranches.length;
    const numCols = maxDepth + 1;

    // Position commits
    sortedCommits.forEach((commit: any) => {
      const lane = branchLaneMap.get(commit.branch) ?? 0;
      const x = PADDING_LEFT + (commit.depth ?? 0) * CELL_WIDTH;
      const y = PADDING_TOP + lane * CELL_HEIGHT;
      const color = laneColors.get(commit.branch) || DEFAULT_COLORS[0];
      nodePositions.set(commit.id, { x, y, commit, color, lane });
    });

    // Build connections
    sortedCommits.forEach((commit: any) => {
      const toPos = nodePositions.get(commit.id);
      if (!toPos) return;
      // Handle both 'parentIds' and 'parents' from API
      const parentIds = commit.parentIds || commit.parents || [];
      parentIds.forEach((parentId: string) => {
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
      gridInfo: { numRows, numCols, maxDepth },
      dimensions: { width, height },
    };
  }, [graph, files]);

  // HEAD position - handle both Map and plain object
  const headCommitId = graph.isDetached
    ? graph.headRef
    : (graph.branches instanceof Map 
        ? graph.branches.get(graph.headRef)?.tipCommitId
        : (graph.branches as any)?.[graph.headRef]?.tipCommitId);
  const currentBranchName = graph.isDetached ? null : graph.headRef;

  // File positions - show ALL files (even on branches not yet created)
  const filePositions = useMemo(() => {
    return files.map((file) => {
        const matchingNode = nodes.find(
          n => n.commit.branch === file.branch && n.commit.depth === file.depth
        );
        if (matchingNode) {
          return { file, x: matchingNode.x, y: matchingNode.y };
        }
        // Even if no commit exists at this position, show the file target
        const lane = lanes.find(l => l.name === file.branch);
        const x = PADDING_LEFT + file.depth * CELL_WIDTH;
        const y = lane ? lane.y : PADDING_TOP + lanes.length * CELL_HEIGHT;
        return { file, x, y };
      });
  }, [files, nodes, lanes]);

  // Track scroll position and container size for off-screen indicators
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollInfo, setScrollInfo] = useState({ scrollLeft: 0, scrollTop: 0, clientWidth: 0, clientHeight: 0 });

  const updateScrollInfo = useCallback(() => {
    if (containerRef.current) {
      const { scrollLeft, scrollTop, clientWidth, clientHeight } = containerRef.current;
      setScrollInfo({ scrollLeft, scrollTop, clientWidth, clientHeight });
    }
  }, []);

  useEffect(() => {
    updateScrollInfo();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollInfo);
      window.addEventListener('resize', updateScrollInfo);
      return () => {
        container.removeEventListener('scroll', updateScrollInfo);
        window.removeEventListener('resize', updateScrollInfo);
      };
    }
  }, [updateScrollInfo]);

  // Calculate off-screen uncollected targets
  const offScreenTargets = useMemo(() => {
    const uncollected = filePositions.filter(fp => !fp.file.collected);
    const { scrollLeft, scrollTop, clientWidth, clientHeight } = scrollInfo;
    const padding = 40; // Account for container padding
    
    let left = 0, right = 0, top = 0, bottom = 0;
    
    uncollected.forEach(({ x, y }) => {
      if (x < scrollLeft + padding) left++;
      if (x > scrollLeft + clientWidth - padding) right++;
      if (y < scrollTop + padding) top++;
      if (y > scrollTop + clientHeight - padding) bottom++;
    });
    
    return { left, right, top, bottom };
  }, [filePositions, scrollInfo]);

  return (
    <div 
      ref={containerRef}
      className={cn('relative bg-gray-50 rounded-lg overflow-auto border border-gray-200 p-2', className)}
    >
      {/* Off-screen target indicators */}
      {offScreenTargets.left > 0 && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg">
          <ChevronLeft size={18} />
          <span>{offScreenTargets.left} target{offScreenTargets.left > 1 ? 's' : ''}</span>
        </div>
      )}
      {offScreenTargets.right > 0 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg">
          <span>{offScreenTargets.right} target{offScreenTargets.right > 1 ? 's' : ''}</span>
          <ChevronRight size={18} />
        </div>
      )}
      {offScreenTargets.top > 0 && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg">
          <ChevronUp size={18} />
          <span>{offScreenTargets.top} target{offScreenTargets.top > 1 ? 's' : ''}</span>
        </div>
      )}
      {offScreenTargets.bottom > 0 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg">
          <span>{offScreenTargets.bottom} target{offScreenTargets.bottom > 1 ? 's' : ''}</span>
          <ChevronDown size={18} />
        </div>
      )}
      
      <svg width={dimensions.width} height={dimensions.height} className="min-w-full min-h-full">
        {/* Grid dots */}
        {Array.from({ length: gridInfo.maxDepth + 3 }).map((_, col) =>
          Array.from({ length: gridInfo.numRows }).map((_, row) => (
            <circle
              key={`dot-${col}-${row}`}
              cx={PADDING_LEFT + col * CELL_WIDTH}
              cy={PADDING_TOP + row * CELL_HEIGHT}
              r={2}
              fill="#d1d5db"
            />
          ))
        )}
        
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
          const shortHash = node.commit.id.slice(0, 7);
          return (
            <g key={node.commit.id}>
              <circle cx={node.x} cy={node.y} r={NODE_RADIUS} fill={node.color} stroke="white" strokeWidth={2} />
              {/* Commit hash - below node */}
              <text x={node.x} y={node.y + NODE_RADIUS + 12} textAnchor="middle" 
                fontSize="9" fontFamily="monospace" fill="#666">
                {shortHash}
              </text>
              {isHead && (
                <>
                  <line x1={node.x - 20} y1={node.y + NODE_RADIUS + 20} x2={node.x + 20} y2={node.y + NODE_RADIUS + 20}
                    stroke="#000" strokeWidth={2} />
                  <text x={node.x} y={node.y + NODE_RADIUS + 34} textAnchor="middle"
                    fontSize="10" fontWeight="bold" fill="#000">HEAD</text>
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
            {/* Document icon */}
            <rect 
              x={x - 5} y={y - 6} 
              width={10} height={12} 
              rx={1}
              fill="none" 
              stroke={file.collected ? '#22c55e' : '#f59e0b'} 
              strokeWidth={1.5}
            />
            <path 
              d={`M ${x - 3} ${y - 2} h 6 M ${x - 3} ${y + 1} h 4`}
              stroke={file.collected ? '#22c55e' : '#f59e0b'}
              strokeWidth={1}
              strokeLinecap="round"
            />
            {file.collected && (
              <path 
                d={`M ${x - 2} ${y} l 2 2 l 4 -4`}
                stroke="#22c55e"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
            <text x={x} y={y - NODE_RADIUS - 10} textAnchor="middle"
              className="text-[10px] font-medium" fill={file.collected ? '#22c55e' : '#666'}>
              {file.name}
            </text>
          </g>
        ))}
      </svg>
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
