import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExternalLink, AlertTriangle } from "lucide-react";

interface ExternalLinkConfirmProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const ExternalLinkConfirm = ({ href, children, className = "" }: ExternalLinkConfirmProps) => {
  const [open, setOpen] = useState(false);
  
  // Function to check if URL is external
  const isExternalLink = (url: string) => {
    if (!url) return false;
    
    // Check if it's a relative URL or uses the site's domain
    if (url.startsWith('/') || url.startsWith('#')) return false;
    
    try {
      // Check if URL has a different hostname than the current site
      const urlObj = new URL(url);
      const currentHostname = window.location.hostname;
      return urlObj.hostname !== currentHostname;
    } catch (e) {
      // If URL parsing fails, assume it's not external
      return false;
    }
  };
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isExternalLink(href)) {
      e.preventDefault();
      setOpen(true);
    }
    // If not external, normal link behavior occurs
  };
  
  const handleContinue = () => {
    setOpen(false);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <a 
        href={href} 
        onClick={handleClick}
        className={className}
        rel={isExternalLink(href) ? "noopener noreferrer" : undefined}
        target={isExternalLink(href) ? "_blank" : undefined}
      >
        {children}
        {isExternalLink(href) && (
          <ExternalLink className="inline-block ml-1" size={14} />
        )}
      </a>
      
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              External Link Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              You're about to visit an external website:
              <div className="mt-1 p-2 bg-secondary/20 rounded-md break-all font-mono text-sm">
                {href}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Please be cautious and never share passwords, API keys, or other sensitive information on external websites.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleContinue}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ExternalLinkConfirm;
