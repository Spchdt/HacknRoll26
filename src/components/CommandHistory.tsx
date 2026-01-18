import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CommandHistoryProps {
  commands: string[];
  output: string[];
  className?: string;
  username?: string | null;
}

export default function CommandHistory({
  commands,
  output,
  className,
  username,
}: CommandHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        'p-4 rounded-lg font-mono text-sm overflow-y-auto transition-colors',
        'bg-gray-950 text-green-400',
        className
      )}
    >
      {output.length === 0 && commands.length === 0 ? (
        <div className='text-green-400'>
          <p>{username ? `Welcome to Gitty, ${username}!` : 'Welcome to Gitty!'}</p>
          <p className="mt-1">Type "git init" to start the daily puzzle.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {output.map((line, index) => (
            <div
              key={index}
              className={cn(
                line.startsWith('$') ? 'text-white font-bold' : '',
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
