import { useState } from "react";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createWorkflowShare } from "@/lib/api/services/shares.api";

interface ShareWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
}

export function ShareWorkflowModal({
  open,
  onOpenChange,
  workflowId,
}: ShareWorkflowModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const response = await createWorkflowShare(workflowId);
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/shared/${response.token}`);
    } catch (err) {
      console.error("Failed to generate share link:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenLink = () => {
    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Diagram Preview
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!shareUrl ? (
            <Button
              onClick={handleGenerateLink}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                "Generate Share Link"
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button size="icon" variant="outline" onClick={handleOpenLink}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setShareUrl(null)}
                className="w-full"
              >
                Generate New Link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
