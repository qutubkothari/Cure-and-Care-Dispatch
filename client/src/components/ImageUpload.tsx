import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader } from 'lucide-react';
import { uploadImages } from '../services/api';

interface ImageUploadProps {
  onUpload: (urls: string[]) => void;
  maxImages?: number;
  type: string;
}

export default function ImageUpload({ onUpload, maxImages = 5, type }: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedFiles.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one image');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadImages(selectedFiles, type);
      const urls = response.data.urls || [];
      onUpload(urls);
      
      // Clear selections
      setSelectedFiles([]);
      setPreviews([]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
          disabled={uploading || selectedFiles.length >= maxImages}
        >
          <Camera className="w-5 h-5" />
          <span>Take Photo</span>
        </button>
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
          disabled={uploading || selectedFiles.length >= maxImages}
        >
          <Upload className="w-5 h-5" />
          <span>Choose Files</span>
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {previews.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Selected: {selectedFiles.length} / {maxImages} images
          </p>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <span>Upload {selectedFiles.length} Image{selectedFiles.length > 1 ? 's' : ''}</span>
          )}
        </button>
      )}
    </div>
  );
}
