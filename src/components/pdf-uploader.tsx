"use client";

import * as React from "react";
import { UploadCloud, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type PdfUploaderProps = {
  onFileSelect: (file: File | null) => void;
  isProcessing: boolean;
};

export function PdfUploader({ onFileSelect, isProcessing }: PdfUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileSelect(file);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0] || null;
    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-12 text-center transition-colors duration-200",
        isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      aria-label="PDF Upload Area"
    >
      <Input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />

      {isProcessing ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">Processing your PDF...</p>
          <p className="text-sm text-muted-foreground">Please wait a moment.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <UploadCloud className="h-10 w-10 text-primary" />
          <p className="text-lg font-medium">
            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-sm">PDF files only</p>
        </div>
      )}
    </div>
  );
}
