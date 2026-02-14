import VideoUpload from '@/components/upload/VideoUpload';

export const metadata = {
  title: 'Upload Video - Juliette',
  description: 'Upload an educational video for transcription and AI-powered Q&A',
};

export default function UploadPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Educational Video</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a video to get started. We'll automatically transcribe it and prepare it for
            AI-powered questions and answers.
          </p>
        </div>

        <VideoUpload />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">1. Upload</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload your educational video (lecture, tutorial, lesson, etc.)
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">2. Transcribe</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We'll automatically transcribe your video with timestamps
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">3. Ask Questions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get explanations, practice problems, or animated visualizations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
