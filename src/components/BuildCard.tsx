import { Build } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { heroes } from "@/data/heroes";
import { useNavigate } from "react-router-dom";
import { Heart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BuildService from "@/services/BuildService";

interface BuildCardProps {
  build: Build;
}

const BuildCard = ({ build }: BuildCardProps) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn, userId, token } = useAuth();
  const { toast } = useToast();
  const buildService = new BuildService();
  
  const hero = heroes.find(h => h.id === build.heroId);
  
  // Check if build is saved when component mounts
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!isLoggedIn || !userId) return;
      
      try {
        const saved = await buildService.isBuildSaved(userId, build.id);
        setIsSaved(saved);
      } catch (error) {
        console.error("Error checking if build is saved:", error);
      }
    };
    
    checkIfSaved();
  }, [isLoggedIn, userId, build.id]);
  
  const getBorderClass = () => {
    if (!hero) return 'border-gray-200';
    
    switch (hero.role) {
      case 'Tank':
        return 'border-[#5fc0d1]';
      case 'DPS':
        return 'border-[#e61b23]';
      case 'Support':
        return 'border-[#13bf75]';
      default:
        return 'border-gray-200';
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn || !userId) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to save builds",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (isSaved) {
        // Unsave build
        const success = await buildService.unsaveBuild(userId, build.id);
        if (success) {
          setIsSaved(false);
          toast({
            title: "Build Unsaved",
            description: "This build has been removed from your saved builds"
          });
        }
      } else {
        // Save build
        const success = await buildService.saveBuild(userId, build.id);
        if (success) {
          setIsSaved(true);
          toast({
            title: "Build Saved",
            description: "This build has been added to your saved builds"
          });
        }
      }
    } catch (error) {
      console.error("Error saving/unsaving build:", error);
      toast({
        title: "Error",
        description: "Failed to save/unsave build. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card 
      className={`cursor-pointer overflow-hidden border-2 ${getBorderClass()}`}
      onClick={() => navigate(`/build/${build.id || build.buildId}`)}
    >
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{build.title}</CardTitle>
          {build.isVerified && (
            <Badge variant="default" className="bg-green-600">
              <Check className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img 
              src={hero?.imageUrl} 
              alt={hero?.name} 
              className="w-full h-full object-cover" 
            />
          </div>
          <span>{hero?.name}</span>
          <span className="text-xs px-2 py-1 bg-secondary/10 rounded-full ml-auto">
            {hero?.role}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {build.rounds[0]?.explanation.substring(0, 100)}...
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          By {build.userName || "Anonymous"}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={isSaved ? "text-red-500" : ""}
          onClick={handleSave}
          disabled={isLoading}
        >
          <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
          <span className="sr-only">{isSaved ? "Unsave" : "Save"}</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BuildCard;
