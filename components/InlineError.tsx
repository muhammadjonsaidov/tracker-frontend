import React from 'react';
import { AlertCircle } from 'lucide-react';

const InlineError: React.FC<{ message: string }> = ({ message }) => (
  <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
    <AlertCircle className="h-5 w-5 shrink-0" />
    <span>{message}</span>
  </div>
);

export default InlineError;
