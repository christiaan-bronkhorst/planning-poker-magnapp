'use client';

import { useParams } from 'next/navigation';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Session: {sessionId}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Session room implementation coming soon...
        </p>
      </div>
    </div>
  );
}