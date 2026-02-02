import React from 'react';
import { Key } from 'lucide-react';

export const ApiKeySelector: React.FC = () => {
  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
    } else {
      alert("API Key selection is not available in this environment. Using default env key.");
    }
  };

  return (
    <button
      onClick={handleSelectKey}
      className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
      title="Select Paid API Key for Veo/High-Res Models"
    >
      <Key size={14} />
      <span>Billing Account</span>
    </button>
  );
};