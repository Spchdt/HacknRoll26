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
  const allCollected = collectedCount === totalCount;

  return (
    <div className={cn('bg-white border rounded-lg p-3', className)}>
      <div className="flex items-center gap-4 flex-wrap">
        {/* Header with progress */}
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Target size={16} />
            Files
          </h3>
          <span className="text-sm font-mono">
            {collectedCount}/{totalCount}
          </span>
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* File list - horizontal */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded text-sm border',
                file.collected 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              {file.collected ? (
                <Check size={14} className="text-green-600 shrink-0" />
              ) : (
                <FileText size={14} className="text-gray-400 shrink-0" />
              )}
              <span
                className={cn(
                  'font-mono text-xs',
                  file.collected && 'line-through'
                )}
              >
                {file.name}
              </span>
              <span className="text-xs text-gray-400">
                @{file.branch}/{file.depth}
              </span>
            </div>
          ))}
        </div>

        {/* Win condition hint */}
        {allCollected && (
          <div className="text-sm text-amber-600 font-medium">
            ✨ Merge to main to win!
          </div>
        )}
      </div>
    </div>
  );
}
