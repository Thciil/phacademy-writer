'use client';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Processing...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
}
