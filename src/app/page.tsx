
"use client";

import { useState, useRef, useCallback } from 'react';
import { translateFileContent } from "@/ai/flows/translate-file-content";
import { retryTranslation } from "@/ai/flows/retry-translation";
import { readTranslatedText } from "@/ai/flows/read-translated-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Download, FileUp, Play } from 'lucide-react';

export default function Home() {
  const [fileContent, setFileContent] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    const file = e.target.files?.[0];
    if (!file) {
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target?.result as string);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setIsLoading(false);
      toast({
        title: "File reading error",
        description: "There was an error reading the file. Please try again.",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const handleTranslate = useCallback(async () => {
    setIsLoading(true);
    setTranslatedText('');
    setAudioUrl('');
    try {
      // Attempt translation with retry mechanism
      const translationResult = await retryTranslation({ text: fileContent, attempts: 3 });

      if (translationResult) {
        setTranslatedText(translationResult.translatedText);
        setAudioUrl(translationResult.audioBlobUrl);
      } else {
        toast({
          title: "Translation failed",
          description: "The translation could not be completed. Please check the file content and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Translation error",
        description: error.message || "An error occurred during translation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [fileContent, toast]);

  const handlePlay = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  }, []);

  const handleDownload = () => {
    const blob = new Blob([translatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translated.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-8 bg-primary">
      <Card className="w-full max-w-2xl p-4 space-y-4 bg-white shadow-md rounded-lg">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-semibold">LinguaFile</h1>
          <p className="text-muted-foreground">Translate your English text files to Russian</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* File Upload Section */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="file-upload" className="block text-sm font-medium text-foreground">
              Upload Text File (.txt, .csv)
            </label>
            <div className="flex items-center space-x-4">
              <Input
                id="file-upload"
                type="file"
                accept=".txt,.csv"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              {isLoading && <Skeleton className="w-16 h-8" />}
            </div>
          </div>

          {/* Translation Display Section */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="translated-text" className="block text-sm font-medium text-foreground">
              Translated Russian Text
            </label>
            <Textarea
              id="translated-text"
              value={translatedText}
              readOnly
              placeholder="Translated text will appear here..."
              className="bg-primary rounded-md"
            />
          </div>

          {/* Action Buttons Section */}
          <div className="flex items-center space-x-4">
            <Button onClick={handleTranslate} disabled={isLoading || !fileContent}>
              {isLoading ? 'Translating...' : 'Translate'}
            </Button>
            {translatedText && (
              <>
                <Button variant="secondary" onClick={handlePlay} disabled={isLoading || !audioUrl}>
                  <Play className="mr-2 h-4 w-4" />
                  Read Aloud
                  <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />
                </Button>
                <Button variant="secondary" onClick={handleDownload} disabled={isLoading || !translatedText}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
