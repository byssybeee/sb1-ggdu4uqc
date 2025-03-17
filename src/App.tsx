import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { Upload, Sun, Moon, Download, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { removeBackground } from './api/backgroundRemover';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setError(null);
      setIsProcessing(true);
      setUploadProgress(0);
      setProcessedImage(null);

      // Read and set original image
      const reader = new FileReader();
      reader.onload = () => {
        setOriginalImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      try {
        // Show progress while processing
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 500);

        const result = await removeBackground(file);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        setProcessedImage(result);
      } catch (err) {
        console.error('Error processing image:', err);
        setError(err instanceof Error ? err.message : 'Failed to process image');
        setProcessedImage(null);
        setUploadProgress(0);
      } finally {
        setIsProcessing(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: false,
    maxSize: 25 * 1024 * 1024 // 25MB max size
  });

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = 'removed-background.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={clsx(
      'min-h-screen transition-colors duration-200',
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    )}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ImageIcon className="w-8 h-8" />
            Background Remover
          </h1>
          <button
            onClick={toggleTheme}
            className={clsx(
              'p-2 rounded-full',
              theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
            )}
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        {/* Main Content */}
        <div className={clsx(
          'rounded-xl p-8 mb-8',
          theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-lg'
        )}>
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {!originalImage ? (
            <div
              {...getRootProps()}
              className={clsx(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
                theme === 'dark' ? 'hover:border-gray-500' : 'hover:border-gray-400'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">Drag & drop your image here</p>
              <p className="text-sm text-gray-500">or click to select a file</p>
              <p className="text-xs text-gray-400 mt-2">Supports PNG, JPG, JPEG (max 25MB)</p>
            </div>
          ) : (
            <div>
              {isProcessing ? (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin mb-4" />
                  <p className="mb-4">Processing your image...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <>
                  <ReactCompareSlider
                    itemOne={<ReactCompareSliderImage src={originalImage} alt="Original" />}
                    itemTwo={<ReactCompareSliderImage src={processedImage || originalImage} alt="Processed" />}
                    className="rounded-lg overflow-hidden h-[500px] mb-6"
                  />
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => {
                        setOriginalImage(null);
                        setProcessedImage(null);
                        setError(null);
                        setUploadProgress(0);
                      }}
                      className={clsx(
                        'px-6 py-2 rounded-lg font-medium',
                        theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                      )}
                    >
                      Upload New Image
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={!processedImage}
                      className={clsx(
                        'px-6 py-2 rounded-lg font-medium flex items-center gap-2',
                        processedImage
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-300 cursor-not-allowed text-white'
                      )}
                    >
                      <Download className="w-5 h-5" />
                      Download Result
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500">
          <p>Upload an image to remove its background instantly</p>
        </footer>
      </div>
    </div>
  );
}

export default App;