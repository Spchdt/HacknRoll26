import type {
  GitGraph,
  Commit,
  Branch,
  FileTarget,
  CommandResult,
  GameCommand,
  Puzzle,
  PuzzleConstraints,
} from './types';
import { generateCommitHash, getBranchColor, deepClone, cloneGitGraph } from './utils';

/**
 * GitEngine - Manages the git-like graph structure and command execution
 */
export class GitEngine {
  private graph: GitGraph;
  private files: FileTarget[];
  private constraints: PuzzleConstraints;

  constructor(puzzle: Puzzle) {
    this.graph = cloneGitGraph(puzzle.initialGraph);
    this.files = deepClone(puzzle.files);
    this.constraints = puzzle.constraints;
  }

  getGraph(): GitGraph {
    // Return a clone so React detects state changes
    return cloneGitGraph(this.graph);
  }

  getFiles(): FileTarget[] {
    // Return a clone so React detects state changes
    return deepClone(this.files);
  }

  getCurrentCommit(): Commit | null {
    const ref = this.graph.isDetached
      ? this.graph.headRef
      : this.graph.branches.get(this.graph.headRef)?.tipCommitId;
    
    return ref ? this.graph.commits.get(ref) || null : null;
  }

  getCurrentBranch(): Branch | null {
    if (this.graph.isDetached) return null;
    return this.graph.branches.get(this.graph.headRef) || null;
  }

  /**
   * Execute a git command and return the result
   */
  executeCommand(command: GameCommand): CommandResult {
    if (!this.constraints.allowedCommands.includes(command.type)) {
      return {
        success: false,
        message: `Command '${command.type}' is not allowed in this puzzle`,
      };
    }

    switch (command.type) {
      case 'commit':
        return this.commit(command.args[0] || 'Commit');
      case 'branch':
        return this.branch(command.args[0]);
      case 'checkout':
        return this.checkout(command.args[0]);
      case 'merge':
        return this.merge(command.args[0]);
      case 'rebase':
        return this.rebase(command.args[0]);
      case 'undo':
        return { success: false, message: 'Undo is handled by the game state manager' };
      default:
        return { success: false, message: `Unknown command: ${command.type}` };
    }
  }

  /**
   * Create a new commit at the current position
   */
  private commit(message: string): CommandResult {
    const currentCommit = this.getCurrentCommit();
    const currentBranch = this.getCurrentBranch();

    if (!currentCommit) {
      return { success: false, message: 'No current commit found' };
    }

    // Check max commits constraint
    const commitCount = Array.from(this.graph.commits.values()).length;
    if (commitCount >= this.constraints.maxCommits) {
      return { success: false, message: `Maximum commits (${this.constraints.maxCommits}) reached` };
    }

    const newCommitId = generateCommitHash();
    const newDepth = currentCommit.depth + 1;
    const branchName = currentBranch?.name || currentCommit.branch;

    const newCommit: Commit = {
      id: newCommitId,
      message,
      parentIds: [currentCommit.id],
      branch: branchName,
      depth: newDepth,
      timestamp: Date.now(),
    };

    this.graph.commits.set(newCommitId, newCommit);

    // Update branch pointer if not detached
    if (currentBranch) {
      currentBranch.tipCommitId = newCommitId;
      this.graph.branches.set(currentBranch.name, currentBranch);
    } else {
      // Detached HEAD moves to new commit
      this.graph.headRef = newCommitId;
    }

    // Check for file collection
    const collectedFiles = this.checkFileCollection(branchName, newDepth);

    // Check win condition
    const allFilesCollected = this.files.every(f => f.collected);
    const gameWon = allFilesCollected && branchName === 'main';

    return {
      success: true,
      message: `Created commit ${newCommitId.slice(0, 7)}: ${message}`,
      newState: cloneGitGraph(this.graph),
      filesCollected: collectedFiles,
      gameWon,
    };
  }

  /**
   * Create a new branch at the current position
   */
  private branch(branchName: string): CommandResult {
    if (!branchName) {
      return { success: false, message: 'Branch name is required' };
    }

    if (this.graph.branches.has(branchName)) {
      return { success: false, message: `Branch '${branchName}' already exists` };
    }

    // Check max branches constraint
    if (this.graph.branches.size >= this.constraints.maxBranches) {
      return { success: false, message: `Maximum branches (${this.constraints.maxBranches}) reached` };
    }

    const currentCommit = this.getCurrentCommit();
    if (!currentCommit) {
      return { success: false, message: 'No current commit found' };
    }

    const newBranch: Branch = {
      name: branchName,
      tipCommitId: currentCommit.id,
      color: getBranchColor(branchName),
    };

    this.graph.branches.set(branchName, newBranch);

    return {
      success: true,
      message: `Created branch '${branchName}'`,
      newState: cloneGitGraph(this.graph),
    };
  }

  /**
   * Checkout to a branch or commit
   */
  private checkout(target: string): CommandResult {
    if (!target) {
      return { success: false, message: 'Checkout target is required' };
    }

    // Check if target is a branch
    if (this.graph.branches.has(target)) {
      const branch = this.graph.branches.get(target)!;
      const tipCommit = this.graph.commits.get(branch.tipCommitId);
      this.graph.headRef = target;
      this.graph.isDetached = false;
      
      // Show commit info to help user know where they are
      const commitInfo = tipCommit 
        ? `\n  → HEAD at ${branch.tipCommitId.slice(0, 7)}: "${tipCommit.message}"`
        : '';
      
      return {
        success: true,
        message: `Switched to branch '${target}'${commitInfo}`,
        newState: cloneGitGraph(this.graph),
      };
    }

    // Check if target is a commit
    if (this.graph.commits.has(target)) {
      this.graph.headRef = target;
      this.graph.isDetached = true;
      return {
        success: true,
        message: `HEAD is now at ${target.slice(0, 7)}`,
        newState: cloneGitGraph(this.graph),
      };
    }

    // Try short hash match
    const matchingCommit = Array.from(this.graph.commits.keys()).find(
      id => id.startsWith(target)
    );

    if (matchingCommit) {
      this.graph.headRef = matchingCommit;
      this.graph.isDetached = true;
      return {
        success: true,
        message: `HEAD is now at ${matchingCommit.slice(0, 7)}`,
        newState: cloneGitGraph(this.graph),
      };
    }

    return { success: false, message: `pathspec '${target}' did not match any branch or commit` };
  }

  /**
   * Merge a branch into the current branch
   */
  private merge(branchName: string): CommandResult {
    if (!branchName) {
      return { success: false, message: 'Branch name is required' };
    }

    const currentBranch = this.getCurrentBranch();
    if (!currentBranch) {
      return { success: false, message: 'Cannot merge in detached HEAD state' };
    }

    const targetBranch = this.graph.branches.get(branchName);
    if (!targetBranch) {
      return { success: false, message: `Branch '${branchName}' not found` };
    }

    const currentCommit = this.getCurrentCommit();
    const targetCommit = this.graph.commits.get(targetBranch.tipCommitId);

    if (!currentCommit || !targetCommit) {
      return { success: false, message: 'Could not resolve commits for merge' };
    }

    // Check if fast-forward is possible
    if (this.isAncestor(currentCommit.id, targetCommit.id)) {
      // Fast-forward merge
      currentBranch.tipCommitId = targetCommit.id;
      this.graph.branches.set(currentBranch.name, currentBranch);
      
      // Check win condition after fast-forward
      const allFilesCollected = this.files.every(f => f.collected);
      const gameWon = allFilesCollected && currentBranch.name === 'main';
      
      return {
        success: true,
        message: `Fast-forward merge: ${currentBranch.name} -> ${branchName}`,
        newState: cloneGitGraph(this.graph),
        gameWon,
      };
    }

    // Create merge commit
    const mergeCommitId = generateCommitHash();
    const mergeCommit: Commit = {
      id: mergeCommitId,
      message: `Merge branch '${branchName}' into ${currentBranch.name}`,
      parentIds: [currentCommit.id, targetCommit.id],
      branch: currentBranch.name,
      depth: Math.max(currentCommit.depth, targetCommit.depth) + 1,
      timestamp: Date.now(),
    };

    this.graph.commits.set(mergeCommitId, mergeCommit);
    currentBranch.tipCommitId = mergeCommitId;
    this.graph.branches.set(currentBranch.name, currentBranch);

    // Check for file collection (merge might collect files from both branches)
    const collectedFiles = this.checkFileCollection(currentBranch.name, mergeCommit.depth);

    // Check win condition
    const allFilesCollected = this.files.every(f => f.collected);
    const gameWon = allFilesCollected && currentBranch.name === 'main';

    return {
      success: true,
      message: `Merged '${branchName}' into '${currentBranch.name}'`,
      newState: cloneGitGraph(this.graph),
      filesCollected: collectedFiles,
      gameWon,
    };
  }

  /**
   * Rebase current branch onto target
   */
  private rebase(targetBranch: string): CommandResult {
    if (!targetBranch) {
      return { success: false, message: 'Target branch is required' };
    }

    const currentBranch = this.getCurrentBranch();
    if (!currentBranch) {
      return { success: false, message: 'Cannot rebase in detached HEAD state' };
    }

    const target = this.graph.branches.get(targetBranch);
    if (!target) {
      return { success: false, message: `Branch '${targetBranch}' not found` };
    }

    const currentCommit = this.getCurrentCommit();
    const targetCommit = this.graph.commits.get(target.tipCommitId);

    if (!currentCommit || !targetCommit) {
      return { success: false, message: 'Could not resolve commits for rebase' };
    }

    // Find commits to replay
    const commitsToReplay = this.getCommitsBetween(currentBranch.tipCommitId, target.tipCommitId);

    if (commitsToReplay.length === 0) {
      // Check win condition even if already up to date
      const allFilesCollected = this.files.every(f => f.collected);
      const gameWon = allFilesCollected && currentBranch.name === 'main';
      
      return {
        success: true,
        message: 'Already up to date',
        newState: cloneGitGraph(this.graph),
        gameWon,
      };
    }

    // Replay commits
    let newParentId = target.tipCommitId;
    for (const commit of commitsToReplay) {
      const newCommitId = generateCommitHash();
      const newCommit: Commit = {
        id: newCommitId,
        message: commit.message,
        parentIds: [newParentId],
        branch: currentBranch.name,
        depth: (this.graph.commits.get(newParentId)?.depth || 0) + 1,
        timestamp: Date.now(),
      };
      this.graph.commits.set(newCommitId, newCommit);
      newParentId = newCommitId;
    }

    // Update branch pointer
    currentBranch.tipCommitId = newParentId;
    this.graph.branches.set(currentBranch.name, currentBranch);

    const newCommit = this.graph.commits.get(newParentId)!;
    const collectedFiles = this.checkFileCollection(currentBranch.name, newCommit.depth);

    const allFilesCollected = this.files.every(f => f.collected);
    const gameWon = allFilesCollected && currentBranch.name === 'main';

    return {
      success: true,
      message: `Rebased '${currentBranch.name}' onto '${targetBranch}'`,
      newState: cloneGitGraph(this.graph),
      filesCollected: collectedFiles,
      gameWon,
    };
  }

  /**
   * Check if a commit is an ancestor of another
   */
  private isAncestor(potentialAncestorId: string, commitId: string): boolean {
    const visited = new Set<string>();
    const queue = [commitId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === potentialAncestorId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const commit = this.graph.commits.get(current);
      if (commit) {
        queue.push(...commit.parentIds);
      }
    }

    return false;
  }

  /**
   * Get commits between two points (for rebase)
   */
  private getCommitsBetween(fromId: string, toId: string): Commit[] {
    const commits: Commit[] = [];
    const visited = new Set<string>();
    
    let current = this.graph.commits.get(fromId);
    
    while (current && !visited.has(current.id) && current.id !== toId) {
      visited.add(current.id);
      commits.unshift(current);
      if (current.parentIds.length > 0) {
        current = this.graph.commits.get(current.parentIds[0]);
      } else {
        break;
      }
    }

    return commits;
  }

  /**
   * Check if files are collected at the current position
   */
  private checkFileCollection(branch: string, depth: number): FileTarget[] {
    const collected: FileTarget[] = [];

    for (const file of this.files) {
      if (!file.collected && file.branch === branch && file.depth === depth) {
        file.collected = true;
        collected.push(file);
      }
    }

    return collected;
  }

  /**
   * Restore graph state from a snapshot
   */
  restoreState(graph: GitGraph, files: FileTarget[]): void {
    this.graph = cloneGitGraph(graph);
    this.files = deepClone(files);
  }
}

/**
 * Create an initial puzzle graph for testing
 */
export function createTestPuzzle(): Puzzle {
  const initialCommitId = generateCommitHash();
  
  const commits = new Map<string, Commit>();
  commits.set(initialCommitId, {
    id: initialCommitId,
    message: 'Initial commit',
    parentIds: [],
    branch: 'main',
    depth: 0,
    timestamp: Date.now(),
  });

  const branches = new Map<string, Branch>();
  branches.set('main', {
    name: 'main',
    tipCommitId: initialCommitId,
    color: getBranchColor('main'),
  });

  const initialGraph: GitGraph = {
    commits,
    branches,
    headRef: 'main',
    isDetached: false,
  };

  const files: FileTarget[] = [
    { id: '1', name: 'README.md', branch: 'main', depth: 1, collected: false },
    { id: '2', name: 'index.ts', branch: 'feature', depth: 2, collected: false },
    { id: '3', name: 'config.json', branch: 'main', depth: 3, collected: false },
  ];

  return {
    id: 'test-puzzle',
    date: new Date().toISOString().split('T')[0],
    difficulty: 'medium',
    files,
    initialGraph,
    solution: [],
    parScore: 8,
    constraints: {
      maxCommands: 20,  // Allow some buffer above par
      maxCommits: 15,
      maxCheckouts: 10,
      maxBranches: 5,
      allowedCommands: ['commit', 'branch', 'checkout', 'merge', 'rebase', 'undo'],
    },
  };
}

/**
 * Serialize GitGraph for storage (Maps to objects)
 */
export function serializeGraph(graph: GitGraph): object {
  return {
    commits: Object.fromEntries(graph.commits),
    branches: Object.fromEntries(graph.branches),
    headRef: graph.headRef,
    isDetached: graph.isDetached,
  };
}

/**
 * Deserialize GitGraph from storage
 */
export function deserializeGraph(data: ReturnType<typeof serializeGraph>): GitGraph {
  return {
    commits: new Map(Object.entries((data as { commits: Record<string, Commit> }).commits)),
    branches: new Map(Object.entries((data as { branches: Record<string, Branch> }).branches)),
    headRef: (data as { headRef: string }).headRef,
    isDetached: (data as { isDetached: boolean }).isDetached,
  };
}
