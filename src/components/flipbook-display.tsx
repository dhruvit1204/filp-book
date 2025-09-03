
"use client";

import * as React from "react";
import HTMLFlipBook from "react-pageflip";
import { ArrowLeft, ArrowRight, Download, RotateCcw, Loader2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

type FlipbookDisplayProps = {
  pages: string[];
  originalFile: File;
  onReset: () => void;
};

const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode; number: number }>(
  ({ children, number }, ref) => {
    return (
      <div
        ref={ref}
        className="flex items-center justify-center bg-background shadow-inner"
        data-density="hard"
      >
        <div className="flex h-full w-full flex-col items-center justify-between p-4">
          <div className="flex-grow flex items-center justify-center">{children}</div>
          <div className="text-sm text-muted-foreground">{number}</div>
        </div>
      </div>
    );
  }
);
Page.displayName = "Page";

export function FlipbookDisplay({ pages, originalFile, onReset }: FlipbookDisplayProps) {
  const flipbookRef = React.useRef<any>(null);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [bookDimensions, setBookDimensions] = React.useState({ width: 300, height: 420 });
  const [isDownloading, setIsDownloading] = React.useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const onInit = React.useCallback(() => {
    if (flipbookRef.current) {
        const pageCount = flipbookRef.current.pageFlip().getPageCount();
        setTotalPages(pageCount);
    }
  }, []);

  React.useEffect(() => {
    const calculateDimensions = () => {
      const screenWidth = window.innerWidth * 0.9;
      const screenHeight = window.innerHeight * 0.7;
      
      const aspectRatio = isMobile ? 3 / 4.2 : 5.8 / 4.2;
      
      let width, height;

      if ((screenWidth / screenHeight) > aspectRatio) {
        height = screenHeight;
        width = height * aspectRatio;
      } else {
        width = screenWidth;
        height = width / aspectRatio;
      }
      
      setBookDimensions({ width: Math.min(width, isMobile ? 300 : 800), height: Math.min(height, isMobile ? 420 : 560) });
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, [isMobile]);
  
  const handleFlip = React.useCallback((e: { data: number }) => {
    setCurrentPage(e.data);
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      
      for (const pageUrl of pages) {
        const imageBytes = await fetch(pageUrl).then((res) => res.arrayBuffer());
        // The images are created as PNGs, so we should embed them as such.
        const image = await pdfDoc.embedPng(imageBytes);

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const originalName = originalFile.name.replace(/\.pdf$/i, '');
      a.download = `${originalName}-flipbook.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error creating flipbook PDF:", error);
      toast({
        variant: "destructive",
        title: "Download Error",
        description: "Failed to create the flipbook PDF. Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const a11yPageLabel = isMobile ? 'Page' : 'Pages';
  const a11yCurrentPage = isMobile ? currentPage + 1 : (totalPages > 0 ? `${Math.min(currentPage * 2 + 1, totalPages)}-${Math.min(currentPage * 2 + 2, totalPages)}` : '1');

  return (
    <div className="w-full flex flex-col items-center gap-6">
       <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Your Flipbook is Ready!</h2>
            <p className="mt-2 text-muted-foreground">
                Use the arrows to navigate through the pages of '{originalFile.name}'.
            </p>
        </div>

      <div className="relative" style={{ width: bookDimensions.width, height: bookDimensions.height }}>
        <div className="drop-shadow-2xl">
          <HTMLFlipBook
            width={bookDimensions.width / (isMobile ? 1 : 2)}
            height={bookDimensions.height}
            size="stretch"
            minWidth={150}
            maxWidth={1000}
            minHeight={210}
            maxHeight={1400}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            onFlip={handleFlip}
            onInit={onInit}
            ref={flipbookRef}
            className="rounded-lg overflow-hidden"
          >
            {pages.map((pageUrl, index) => (
              <Page number={index + 1} key={index}>
                <img
                  src={pageUrl}
                  alt={`Page ${index + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </Page>
            ))}
          </HTMLFlipBook>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <Button
          variant="outline"
          onClick={() => flipbookRef.current?.pageFlip()?.flipPrev()}
          disabled={currentPage === 0}
          aria-label="Previous Page"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm font-medium text-muted-foreground" aria-live="polite">
          {totalPages > 0 ? `${a11yPageLabel} ${a11yCurrentPage} of ${totalPages}` : 'Loading...'}
        </span>

        <Button
          variant="outline"
          onClick={() => flipbookRef.current?.pageFlip()?.flipNext()}
          disabled={!totalPages || currentPage >= (isMobile ? totalPages - 1 : (totalPages / 2) - 1)}
          aria-label="Next Page"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-3 mt-4">
        <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90" disabled={isDownloading}>
            {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            Download as PDF
        </Button>
        <Button variant="secondary" onClick={onReset} disabled={isDownloading}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Start Over
        </Button>
      </div>
    </div>
  );
}
