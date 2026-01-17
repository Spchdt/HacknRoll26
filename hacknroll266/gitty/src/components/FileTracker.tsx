import { FileText, Check, Target } from 'lucide-react';
import type { FileTarget } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FileTrackerProps {
  files: FileTarget[];
  className?: string;
}

export default function FileTracker({ files, className }: FileTrackerProps) {
  const collectedCount = files.filter((f) => f.collected).length;
  const totalCount = files.length;
  const progress = totalCount > 0 ? (collectedCount / totalCount) * 100 : 0;

  return (
    <div className={cn('bg-white border rounded-lg p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Target size={16} />
          Files to Collect
        </h3>
        <span className="text-sm font-mono">
          {collectedCount}/{totalCount}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* File list */}
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className={cn(
              'flex items-center gap-2 p-2 rounded text-sm',
              file.collected ? 'bg-green-50' : 'bg-gray-50'
            )}
          >
            {file.collected ? (
              <Check size={16} className="text-green-600 flex-shrink-0" />
            ) : (
              <FileText size={16} className="text-gray-400 flex-shrink-0" />
            )}
            <span
              className={cn(
                'font-mono flex-1',
                file.collected && 'line-through text-gray-400'
              )}
            >
              {file.name}
            </span>
            <span className="text-xs text-gray-500">
              {file.branch}@{file.depth}
            </span>
          </div>
        ))}
      </div>

      {/* Win condition hint */}
      {collectedCount === totalCount && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
          <strong>All files collected!</strong> Merge to main branch to win.
        </div>
      )}
    </div>
  );
}
