import { useState } from 'react';
import { X, AlertCircle, Camera } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface FailedDeliveryModalProps {
  deliveryId: string;
  customerName: string;
  onClose: () => void;
  onSubmit: (data: { reason: string; notes: string; photoUrls: string[] }) => Promise<void>;
}

const FAILURE_REASONS = [
  'Customer Unavailable',
  'Customer Not Responding',
  'Wrong Address',
  'Address Not Found',
  'Refused Delivery',
  'Customer Requested Reschedule',
  'Incomplete Address',
  'Unsafe Location',
  'Payment Issue',
  'Other'
];

export default function FailedDeliveryModal({
  customerName,
  onClose,
  onSubmit
}: FailedDeliveryModalProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      alert('Please select a failure reason');
      return;
    }

    if (!notes.trim()) {
      alert('Please provide additional details');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ reason, notes, photoUrls });
      onClose();
    } catch (error) {
      console.error('Failed to mark delivery as failed:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = (urls: string[]) => {
    setPhotoUrls(prev => [...prev, ...urls]);
    setShowPhotoUpload(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              Mark Delivery Failed
            </h2>
            <p className="text-sm text-gray-600 mt-1">{customerName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={submitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Failure Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={submitting}
            >
              <option value="">Select a reason...</option>
              {FAILURE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details *
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what happened and any other relevant details..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={submitting}
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidence Photos (Optional)
            </label>
            
            {!showPhotoUpload && (
              <button
                type="button"
                onClick={() => setShowPhotoUpload(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 transition-colors"
                disabled={submitting}
              >
                <Camera className="w-5 h-5" />
                <span>Add Photos</span>
              </button>
            )}

            {showPhotoUpload && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <ImageUpload
                  onUpload={handlePhotoUpload}
                  maxImages={3}
                  type="failed-delivery"
                />
              </div>
            )}

            {photoUrls.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">
                  {photoUrls.length} photo{photoUrls.length > 1 ? 's' : ''} attached
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {photoUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotoUrls(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        disabled={submitting}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Note:</strong> This action will mark the delivery as failed and notify the admin.
              Make sure all information is accurate.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason || !notes.trim()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Mark as Failed'}
          </button>
        </div>
      </div>
    </div>
  );
}
