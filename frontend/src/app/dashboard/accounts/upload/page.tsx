"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, FileArchive, CheckCircle, AlertCircle, Loader2, Info, ArrowLeft } from "lucide-react";

export default function TDataUploadPage() {
  const router = useRouter();
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<null | { uploaded: number; failed: number; errors: string[] }>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.zip'));
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.name.endsWith('.zip'));
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!apiId || !apiHash || files.length === 0) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("api_id", apiId);
    formData.append("api_hash", apiHash);
    files.forEach(file => formData.append("files", file));

    try {
      const response = await fetch("/api/v1/accounts/upload/bulk", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setResult({
        uploaded: data.total_accounts || 0,
        failed: data.failed || 0,
        errors: [],
      });
    } catch (error) {
      setResult({
        uploaded: 0,
        failed: files.length,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/accounts")}
            className="p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Import TData Accounts</h1>
            <p className="text-xs text-muted-foreground">Upload Telegram Desktop session files</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Info Banner */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-4 pb-4 flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">What is TData?</h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                TData is the Telegram Desktop Portable format. Upload your existing Telegram Desktop session files to import accounts.
                Each ZIP file can contain multiple accounts.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Credentials */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">API Credentials</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Telegram API ID</label>
              <Input value={apiId} onChange={e => setApiId(e.target.value)} placeholder="Enter your Telegram API ID" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Telegram API Hash</label>
              <Input value={apiHash} onChange={e => setApiHash(e.target.value)} placeholder="Enter your Telegram API Hash" />
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API credentials from <a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">my.telegram.org</a>
            </p>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Upload TData Files</CardTitle></CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground text-sm">Drop TData ZIP files here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".zip"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-foreground">{files.length} file(s) selected</p>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileArchive className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <span className="text-red-500 text-lg leading-none">×</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Button */}
        <Button
          onClick={handleSubmit}
          disabled={!apiId || !apiHash || files.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" /> Import Accounts ({files.length})
            </>
          )}
        </Button>

        {/* Results */}
        {result && (
          <Card className={result.uploaded > 0 ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20" : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                {result.uploaded > 0 ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
                <div>
                  <h4 className="font-semibold text-sm">
                    {result.uploaded > 0 ? "Import Successful!" : "Import Failed"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {result.uploaded} account(s) imported, {result.failed} failed
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2 mb-3">
                  <p className="font-medium text-sm text-red-700 dark:text-red-400">Errors:</p>
                  {result.errors.map((error, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 p-2 rounded">
                      {error}
                    </p>
                  ))}
                </div>
              )}

              {result.uploaded > 0 && (
                <div className="flex gap-2">
                  <Button onClick={() => router.push("/dashboard/accounts")} className="flex-1">
                    View Imported Accounts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
