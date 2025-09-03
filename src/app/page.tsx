
"use client";

import * as React from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Book, FileText } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { PdfUploader } from "@/components/pdf-uploader";
import { FlipbookDisplay } from "@/components/flipbook-display";

// Set worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PDFPageProxy {
  getViewport(options: { scale: number }): { width: number; height: number };
  render(params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: any;
  }): { promise: Promise<void> };
}

interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

export default function Home() {
  const { toast } = useToast();
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [pages, setPages] = React.useState<string[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const processPdf = React.useCallback(async (file: File) => {
    setIsProcessing(true);
    setPages([]);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdf = (await pdfjsLib.getDocument(fileBuffer)
        .promise) as PDFDocumentProxy;
      const numPages = pdf.numPages;
      const pageImages: string[] = [];
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not get canvas context");
      }

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        // Use a higher scale for better quality
        const viewport = page.getViewport({ scale: 2.0 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport })
          .promise;
        // Use PNG for better quality, which is what pdf-lib will expect.
        pageImages.push(canvas.toDataURL("image/png"));
      }
      
      canvas.remove();
      setPages(pageImages);

    } catch (error) {
      console.error("Error processing PDF:", error);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: "Failed to process the PDF file. Please try a different file.",
      });
      setPdfFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleFileSelect = (file: File | null) => {
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a valid PDF file.",
        });
        return;
      }
      setPdfFile(file);
      processPdf(file);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setPages([]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Book className="h-6 w-6 mr-2" />
            <span className="font-bold">PagePilot</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 container py-8 flex flex-col items-center justify-center">
        {pages.length > 0 && pdfFile ? (
          <FlipbookDisplay
            pages={pages}
            originalFile={pdfFile}
            onReset={handleReset}
          />
        ) : (
          <div className="w-full max-w-2xl text-center">
            <div className="mb-4 inline-block rounded-lg bg-primary/10 p-4">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
              PDF to Flipbook Converter
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Turn your PDFs into engaging, interactive flipbooks with a single click.
            </p>
            <div className="mt-8">
              <PdfUploader
                onFileSelect={handleFileSelect}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        )}
      </main>
      <footer className="py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
          
        </div>
      </footer>
    </div>
  );
}
