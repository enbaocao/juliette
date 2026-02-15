'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';

type UploadMode = 'file' | 'youtube';

export default function VideoUpload() {
  const [mode, setMode] = useState<UploadMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileSelect = useCallback((selectedFile: File) => {
    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid video file (MP4, WebM, MOV, or AVI)');
      return;
    }

    // Validate file size (max 500MB for MVP)
    const maxSize = 500 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 500MB');
      return;
    }

    setFile(selectedFile);
    setError('');

    // Auto-generate title from filename if empty
    if (!title) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(fileName);
    }
  }, [title]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'file') {
      if (!file || !title) {
        setError('Please select a file and enter a title');
        return;
      }
    } else {
      if (!youtubeUrl) {
        setError('Please enter a YouTube URL');
        return;
      }
    }

    setUploading(true);
    setError('');

    try {
      if (mode === 'file') {
        // File upload
        const formData = new FormData();
        formData.append('file', file!);
        formData.append('title', title);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const data = await response.json();
        toast({ message: 'Video uploaded successfully!', type: 'success' });
        router.push(`/videos/${data.videoId}`);
      } else {
        // YouTube URL
        const response = await fetch('/api/upload-youtube', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ youtube_url: youtubeUrl }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add YouTube video');
        }

        const data = await response.json();
        toast({ message: 'YouTube video added successfully!', type: 'success' });
        router.push(`/videos/${data.video_id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tab Switcher */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => {
              setMode('file');
              setError('');
            }}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${mode === 'file'
                ? 'border-[#ffc8dd] text-[#1a1a1a] dark:text-gray-200'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload File
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('youtube');
              setError('');
            }}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${mode === 'youtube'
                ? 'border-[#ffc8dd] text-[#1a1a1a] dark:text-gray-200'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              YouTube Link
            </div>
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'file' ? (
          <>
            {/* Drag and Drop Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
                  ? 'border-[#ffc8dd] bg-[#ffe5ec] dark:bg-pink-900/20'
                  : 'border-gray-300 dark:border-gray-700'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />

              {!file ? (
                <div>
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="mt-4">
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-[#e8a0b4] hover:text-[#d4899e] font-medium"
                    >
                      Choose a video file
                    </label>
                    <span className="text-gray-600 dark:text-gray-400"> or drag and drop</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    MP4, WebM, MOV, or AVI up to 500MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="h-8 w-8 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">{file.name}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Video Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction to Calculus - Derivatives"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent dark:bg-gray-800"
                disabled={uploading}
                required
              />
            </div>
          </>
        ) : (
          /* YouTube URL Input */
          <div className="space-y-4">
            <div>
              <label htmlFor="youtube-url" className="block text-sm font-medium mb-2">
                YouTube URL
              </label>
              <input
                type="url"
                id="youtube-url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent dark:bg-gray-800"
                disabled={uploading}
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Paste a YouTube video link to download and transcribe it
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Indeterminate Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <span className="text-sm text-gray-600">Uploading...</span>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="h-2 rounded-full bg-[#ffc8dd] animate-indeterminate" />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            mode === 'file'
              ? !file || !title || uploading
              : !youtubeUrl || uploading
          }
          className="w-full py-3 px-4 bg-[#ffc8dd] hover:bg-[#ffbcd5] disabled:bg-gray-400 disabled:cursor-not-allowed text-[#1a1a1a] font-medium rounded-lg transition-colors"
        >
          {uploading
            ? mode === 'file'
              ? 'Uploading...'
              : 'Adding Video...'
            : mode === 'file'
              ? 'Upload Video'
              : 'Add YouTube Video'}
        </button>
      </form>
    </div>
  );
}
