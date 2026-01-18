import { useState, useRef, useEffect } from 'react';
import { Send, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDarkMode } from '@/layouts/MainLayout';
import { COMMAND_ALIASES } from '@/lib/types';

interface CommandInputProps {
  onSubmit: (command: string) => void;
  disabled?: boolean;
  history?: string[];
  className?: string;
  branches?: string[];
}

const BASE_SUGGESTIONS = [
  'git init',
  'git commit -m "message"',
  'git checkout',
  'git branch',
  'git merge',
  'git rebase',
  'undo',
];

export default function CommandInput({
  onSubmit,
  disabled = false,
  history = [],
  className,
  branches = [],
}: CommandInputProps) {
  const { isDarkMode } = useDarkMode();
  const [command, setCommand] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate dynamic suggestions based on available branches
  const getSuggestions = () => {
    const suggestions = [...BASE_SUGGESTIONS];
    
    if (branches.length > 0) {
      branches.forEach(branch => {
        suggestions.push(`git checkout ${branch}`);
        suggestions.push(`git merge ${branch}`);
        suggestions.push(`git rebase ${branch}`);
      });
    }
    
    return suggestions;
  };

  // Filter suggestions based on current input
  const filteredSuggestions = command.length > 0
    ? getSuggestions().filter((s) =>
        s.toLowerCase().includes(command.toLowerCase()) && 
        s.toLowerCase() !== command.toLowerCase() // Don't show if already typed exactly
      ).slice(0, 5) // Limit to 5 suggestions
    : [];

  // Reset suggestion index when suggestions change
  useEffect(() => {
    setSuggestionIndex(-1);
  }, [command]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || disabled) return;

    // Expand aliases - must match exactly (with space or end of string after alias)
    let expandedCommand = command.trim();
    for (const [alias, full] of Object.entries(COMMAND_ALIASES)) {
      // Check if command starts with alias followed by space or is exactly the alias
      if (expandedCommand === alias || expandedCommand.startsWith(alias + ' ')) {
        expandedCommand = full + expandedCommand.slice(alias.length);
        break;
      }
    }

    onSubmit(expandedCommand);
    setCommand('');
    setHistoryIndex(-1);
    setShowSuggestions(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      // Navigation for suggestions
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
      } else if ((e.key === 'Enter' || e.key === 'Tab') && suggestionIndex >= 0) {
        e.preventDefault();
        setCommand(filteredSuggestions[suggestionIndex]);
        setShowSuggestions(false);
        setSuggestionIndex(-1);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSuggestionIndex(-1);
      } else if (e.key === 'Tab') {
        // Default tab behavior if no specific selection
        e.preventDefault();
        setCommand(filteredSuggestions[0]);
        setShowSuggestions(false);
      }
    } else {
      // Navigation for history
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length > 0) {
          const newIndex = Math.min(historyIndex + 1, history.length - 1);
          setHistoryIndex(newIndex);
          setCommand(history[history.length - 1 - newIndex] || '');
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setCommand(history[history.length - 1 - newIndex] || '');
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setCommand('');
        }
      } else if (e.key === 'Tab' && filteredSuggestions.length > 0) {
        e.preventDefault();
        setCommand(filteredSuggestions[0]);
        setShowSuggestions(false);
      }
    }
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className={cn('absolute bottom-full left-0 right-0 mb-1 border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300')}>
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                'w-full px-3 py-2 text-left text-sm font-mono',
                index === suggestionIndex
                  ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black')
                  : (isDarkMode ? 'hover:bg-gray-700 focus:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 focus:bg-gray-100 text-gray-800')
              )}
              onClick={() => {
                setCommand(suggestion);
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
              onMouseEnter={() => setSuggestionIndex(index)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <span className={cn('absolute left-3 top-1/2 -translate-y-1/2 font-mono', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
            $
          </span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => {
              setCommand(e.target.value);
              setShowSuggestions(e.target.value.length > 1);
              setHistoryIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(command.length > 1)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            disabled={disabled}
            className={cn(
              'w-full pl-7 pr-4 py-2 border rounded-md font-mono text-sm',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-gray-500'
                : 'bg-white border-gray-300 text-black focus:ring-black',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            placeholder="git commit -m 'Initial commit'"
            autoComplete="off"
            spellCheck={false}
          />

          {/* History navigation hint */}
          {history.length > 0 && (
            <div className={cn('absolute right-2 top-1/2 -translate-y-1/2 flex flex-col', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
              <ChevronUp size={12} />
              <ChevronDown size={12} />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={disabled || !command.trim()}
          className={cn(
            'text-white p-2 rounded-md transition-colors',
            isDarkMode
              ? 'bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700'
              : 'bg-black hover:bg-gray-800 disabled:bg-gray-300',
            'disabled:cursor-not-allowed'
          )}
        >
          <Send size={20} />
        </button>
      </form>

      {/* Quick command buttons */}
      <div className="flex gap-2 mt-2 flex-wrap">
        {['commit', 'checkout', 'branch', 'merge', 'rebase'].map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => {
              if (cmd === 'commit') {
                setCommand('git commit -m "');
              } else {
                setCommand(`git ${cmd} `);
              }
              inputRef.current?.focus();
            }}
            disabled={disabled}
            className={cn(
              'px-2 py-1 text-xs font-mono rounded border',
              isDarkMode
                ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
