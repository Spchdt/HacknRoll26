import { useState } from 'react';
import { User, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SetNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (username: string) => void;
  isLoading?: boolean;
}

export default function SetNameModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: SetNameModalProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = username.trim();
    
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (trimmed.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setError('Only letters, numbers, - and _ allowed');
      return;
    }
    
    setError('');
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-gray-700" />
          </div>
          <h2 className="text-xl font-bold">Join the Leaderboard</h2>
          <p className="text-gray-600 text-sm mt-1">
            Choose a username to appear on the leaderboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              disabled={isLoading}
              className={cn(
                'w-full px-4 py-3 border rounded-lg text-center font-mono',
                'focus:outline-none focus:ring-2 focus:ring-black',
                error ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="your_username"
              autoFocus
              maxLength={20}
            />
            {error && (
              <p className="text-red-500 text-sm mt-1 text-center">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className={cn(
              'w-full py-3 bg-black text-white rounded-lg font-bold',
              'hover:bg-gray-800 transition-colors',
              'disabled:bg-gray-300 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? 'Saving...' : 'Save Username'}
          </button>
        </form>

        {/* Skip option */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-700"
        >
          Skip for now
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Your progress will still be saved even if you skip.
        </p>
      </div>
    </div>
  );
}
