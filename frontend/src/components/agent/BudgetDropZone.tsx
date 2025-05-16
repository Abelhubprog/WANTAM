/**
 * Budget DropZone component for analyzing budget PDFs
 */
import React, { useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

interface BudgetDropZoneProps {
  className?: string;
}

interface SummaryResult {
  id?: string;
  summary: string;
  fileName: string;
  fileUrl: string;
  keyPoints: string[];
  timestamp: string;
}

/**
 * Component for uploading and analyzing budget PDFs
 */
export default function BudgetDropZone({ className = '' }: BudgetDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Check if file is a PDF
    if (!file.type || !file.type.includes('pdf')) {
      setError('Please upload a PDF file');
      return;
    }
    
    // Upload and process the file
    await uploadFile(file);
  }, []);
  
  // Handle drag events
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const onDropHandler = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    onDrop(files);
  }, [onDrop]);
  
  // Handle file input change
  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onDrop(files);
  }, [onDrop]);
  
  // Open file dialog
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Upload and process file
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSummary(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/agent/budget', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process budget file');
      }
      
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Copy summary to clipboard
  const copySummary = async () => {
    if (!summary) return;
    
    try {
      await navigator.clipboard.writeText(summary.summary);
      alert('Summary copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };
  
  // Share summary link
  const shareSummary = async () => {
    if (!summary) return;
    
    try {
      // In a full implementation, we'd generate a real share link
      const shareUrl = `https://wantam.ink/budget/${summary.id || 'latest'}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Budget Analysis: ${summary.fileName}`,
          text: 'Check out this budget analysis by WANTAM',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className={`${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white">Budget-in-a-Minute</h2>
        <p className="text-white/70 mt-2">
          Upload any Kenyan budget PDF for an instant, easy-to-understand summary
        </p>
      </div>
      
      {!summary && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-kenyan-green bg-kenyan-green/10'
              : 'border-white/30 hover:border-white/50 bg-primary-black/20'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDragEnter={onDragEnter}
          onDrop={onDropHandler}
          onClick={openFileDialog}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf"
            onChange={onFileInputChange}
          />
          
          <div className="mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-white/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <p className="text-white text-lg mb-2">
            {isDragging ? 'Drop your budget PDF here' : 'Drag & drop your budget PDF here'}
          </p>
          <p className="text-white/50">or click to browse files</p>
        </div>
      )}
      
      {isUploading && (
        <div className="text-center p-8 bg-primary-black/30 border border-white/10 rounded-xl mt-6">
          <div className="w-12 h-12 border-t-4 border-kenyan-green rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Analyzing budget document...</p>
          <p className="text-white/50 text-sm mt-2">This will take a few moments</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 mt-6 bg-kenyan-red/20 border border-kenyan-red/50 rounded-xl">
          <p className="text-white">{error}</p>
        </div>
      )}
      
      {summary && (
        <div className="mt-6 bg-primary-black/30 border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">
              Budget Summary
            </h3>
            <span className="text-white/50 text-sm">
              {new Date(summary.timestamp).toLocaleDateString()}
            </span>
          </div>
          
          <div className="p-4 bg-primary-black/50 rounded-lg mb-4">
            <p className="text-sm text-white/50 mb-2">
              File: {summary.fileName}
            </p>
            
            <div className="whitespace-pre-line text-white">
              {summary.summary}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copySummary}
              className="px-4 py-2 bg-kenyan-green hover:bg-kenyan-green/90 text-white rounded-lg flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              Copy
            </button>
            
            <button
              onClick={shareSummary}
              className="px-4 py-2 bg-electric-blue hover:bg-electric-blue/90 text-white rounded-lg flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </button>
            
            <button
              onClick={() => setSummary(null)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
            >
              Upload Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
