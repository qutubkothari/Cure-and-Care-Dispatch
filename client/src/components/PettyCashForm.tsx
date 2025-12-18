import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface PettyCashFormProps {
  onClose: () => void;
  onSubmit: (data: { amount: number; category: string; description: string; receiptUrl?: string }) => Promise<void>;
}

const CATEGORIES = [
  'PETROL',
  'TOLL',
  'PARKING',
  'MAINTENANCE',
  'OTHER'
];

export default function PettyCashForm({ onClose, onSubmit }: PettyCashFormProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !category || !description) {
      alert('Please fill all required fields');
      return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        amount: amountNum,
        category,
        description,
        receiptUrl: receiptUrl || undefined
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit petty cash:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiptUpload = (urls: string[]) => {
    if (urls.length > 0) {
      setReceiptUrl(urls[0]);
      setShowReceiptUpload(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-accent-600" />
              Request Petty Cash
            </h2>
            <p className="text-sm text-gray-600 mt-1">Submit expense reimbursement request</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={submitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₹) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              disabled={submitting}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              disabled={submitting}
              required
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the expense and reason for reimbursement..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              disabled={submitting}
              required
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt (Optional)
            </label>
            
            {!receiptUrl && !showReceiptUpload && (
              <button
                type="button"
                onClick={() => setShowReceiptUpload(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-accent-500 transition-colors"
                disabled={submitting}
              >
                <DollarSign className="w-5 h-5" />
                <span>Upload Receipt</span>
              </button>
            )}

            {showReceiptUpload && !receiptUrl && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <ImageUpload
                  onUpload={handleReceiptUpload}
                  maxImages={1}
                  type="receipt"
                />
              </div>
            )}

            {receiptUrl && (
              <div className="relative">
                <img
                  src={receiptUrl}
                  alt="Receipt"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setReceiptUrl('');
                    setShowReceiptUpload(false);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  disabled={submitting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Your request will be reviewed by the admin. You'll be notified once it's approved or rejected.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !amount || !category || !description}
              className="px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
