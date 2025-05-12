import { useState, useEffect } from "react";
import { Link, ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import ExternalLinkConfirm from "@/components/ExternalLinkConfirm";

interface VersionInfo {
  api: string;
  frontend: string;
}

const Footer = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        const response = await fetch("https://owapi.luciousdev.nl/api/health");
        if (!response.ok) {
          throw new Error("Failed to fetch version info");
        }
        const data = await response.json();
        setVersionInfo(data);
        setError(false);
      } catch (err) {
        console.error("Error fetching version info:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVersionInfo();
  }, []);

  return (
    <footer className="mt-auto py-6 bg-secondary/5">
      <div className="container mx-auto px-4">
        <Separator className="mb-4" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info size={16} />
            {loading ? (
              <span>Loading version info...</span>
            ) : error ? (
              <span>Version info unavailable</span>
            ) : (
              <span>
                Frontend: v{versionInfo?.frontend} | API: v{versionInfo?.api}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="/status" 
              className={cn(
                "flex items-center gap-1 text-sm",
                "text-muted-foreground hover:text-primary transition-colors"
              )}
            >
              <Link size={16} />
              <span>Status</span>
            </a>
            
            <a 
              href="https://discord.gg/yHQEugWXWg"
              className={cn(
                "flex items-center gap-1 text-sm",
                "text-muted-foreground hover:text-primary transition-colors"
              )}
            >
              <span>Discord</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
