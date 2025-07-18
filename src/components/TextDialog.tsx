import React, { useRef } from 'react';

interface TextDialogProps {
  open: boolean;
  title: string;
  text: string;
  onClose: () => void;
  copyButtonText?: string;
}

const TextDialog: React.FC<TextDialogProps> = ({ open, title, text, onClose, copyButtonText = '复制全部' }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  if (!open) return null;

  const handleCopy = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
      document.execCommand('copy');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
        <textarea
          ref={textareaRef}
          value={text}
          readOnly
          rows={10}
          className="w-full p-2 border border-gray-300 rounded mb-4 text-sm font-mono resize-none bg-gray-50 focus:outline-none"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            关闭
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {copyButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextDialog; 