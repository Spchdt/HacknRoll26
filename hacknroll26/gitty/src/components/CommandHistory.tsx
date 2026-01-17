import type { GameCommand } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CommandHistoryProps {
  commands: GameCommand[];
  output: string[];
  className?: string;
}

export default function CommandHistory({
  commands,
  output,
  className,
}: CommandHistoryProps) {
  return (
    <div
      className={cn(
        'bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-y-auto',
        className
      )}
    >
      {output.length === 0 && commands.length === 0 ? (
        <div className="text-gray-500">
          <p>Welcome to Gitty! 🎮</p>
          <p className="mt-1">Type git commands to play. Try:</p>
          <p className="mt-1 text-green-400">$ git commit -m "first"</p>
        </div>
      ) : (
        <div className="space-y-1">
          {output.map((line, index) => (
            <div
              key={index}
              className={cn(
                line.startsWith('$') ? 'text-white' : '',
                line.startsWith('Error') || line.startsWith('error')
                  ? 'text-red-400'
                  : '',
                line.startsWith('✓') || line.includes('Success')
                  ? 'text-green-400'
                  : '',
                line.startsWith('⚠') ? 'text-yellow-400' : ''
              )}
            >
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
