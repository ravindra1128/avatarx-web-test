import React from 'react';
import { Loader2 } from 'lucide-react';

const FeedbackModal = ({
  open,
  title = 'Feedback',
  placeholder = 'Type your feedback...',
  submitLabel = 'Submit',
  onClose,
  onSubmit,
}) => {
  const [text, setText] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) setText('');
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit?.(text.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-28 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-gray-300"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || !text.trim()}
            className="px-5 py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {submitLabel}</span>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;

