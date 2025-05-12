import { useState, useEffect } from "react";
import { Build, Round } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Share2, Check, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BuildViewerProps {
  build: Build;
  isAdmin?: boolean;
}

const BuildViewer = ({ build, isAdmin = false }: BuildViewerProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeRound, setActiveRound] = useState<string>("1");
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { isLoggedIn, userId, token } = useAuth();
  
  // Check if user is authorized to delete (is admin or build creator)
  const canDelete = isAdmin || (isLoggedIn && userId === build.userId);
  
  // Filter out rounds with empty explanations
  const validRounds = build.rounds.filter(round => round.explanation.trim() !== '');
  
  // Set the first valid round as active when component loads
  useEffect(() => {
    if (validRounds.length > 0) {
      setActiveRound(validRounds[0].roundNumber.toString());
    }
  }, [build.id]);
  
  // Check if build is saved when component loads
  useEffect(() => {
    if (isLoggedIn && userId && build.id) {
      const checkIfSaved = async () => {
        try {
          const response = await fetch(`https://owapi.luciousdev.nl/api/users/${userId}/saved-builds/${build.id}/check`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setSaved(data.isSaved);
          } else {
            console.error("Failed to check if build is saved:", await response.text());
          }
        } catch (error) {
          console.error("Error checking if build is saved:", error);
        }
      };
      checkIfSaved();
    }
  }, [build.id, isLoggedIn, userId, token]);

  const calculateTotalCost = (round: Round): number => {
    return round.items.reduce((total, item) => total + (item.cost || 0), 0);
  };

  const getRarityBadgeClass = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common":
        return "bg-green-500 text-white";
      case "rare":
        return "bg-blue-500 text-white";
      case "epic":
        return "bg-purple-600 text-white";
      default:
        return "bg-gray-300 text-black";
    }
  };
  

  const handleSave = async () => {
    if (!isLoggedIn || !userId || !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save builds.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let response;
      
      if (saved) {
        // Unsave the build
        response = await fetch(`https://owapi.luciousdev.nl/api/users/${userId}/saved-builds/${build.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // Save the build
        response = await fetch(`https://owapi.luciousdev.nl/api/users/${userId}/saved-builds/${build.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      if (response.ok) {
        setSaved(!saved);
        toast({
          title: saved ? "Build unsaved" : "Build saved",
          description: saved 
            ? "This build has been removed from your saved builds." 
            : "This build has been added to your saved builds.",
        });
      } else {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error;
        } catch (e) {
          errorMessage = `Failed to ${saved ? "unsave" : "save"} build.`;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error ${saved ? "unsaving" : "saving"} build:`, error);
      toast({
        title: "Error",
        description: `Failed to ${saved ? "unsave" : "save"} build.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    // Copy current URL to clipboard
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast({
        title: "Share link copied",
        description: "The link to this build has been copied to your clipboard.",
      });
    }).catch(err => {
      toast({
        title: "Failed to copy link",
        description: "Could not copy the link to your clipboard.",
        variant: "destructive",
      });
    });
  };

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://owapi.luciousdev.nl/api/builds/${build.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast({
          title: "Build Verified",
          description: "This build has been marked as verified.",
        });
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to verify build.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying build:", error);
      toast({
        title: "Error",
        description: "Failed to verify build.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnverify = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://owapi.luciousdev.nl/api/builds/${build.id}/unverify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast({
          title: "Build Unverified",
          description: "This build has been marked as unverified.",
        });
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to unverify build.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error unverifying build:", error);
      toast({
        title: "Error",
        description: "Failed to unverify build.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBuild = async () => {
    if (!isLoggedIn || !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete this build.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`https://owapi.luciousdev.nl/api/builds/${build.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Build Deleted",
          description: "The build has been successfully deleted.",
        });
        // Redirect to home page after deletion
        navigate('/');
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete build.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting build:", error);
      toast({
        title: "Error",
        description: "Failed to delete build.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const getRoleBadgeClass = () => {
    if (!build.heroName) return "bg-gray-200 text-gray-700";
    
    // Based on the hero role if available
    const roleMap: Record<string, string> = {
      "Tank": "bg-[#5fc0d1]/20 text-[#5fc0d1]",
      "DPS": "bg-[#e61b23]/20 text-[#e61b23]",
      "Support": "bg-[#13bf75]/20 text-[#13bf75]"
    };
    
    return roleMap[build.heroRole || ""] || "bg-gray-200 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{build.title}</h1>
            {build.isVerified && (
              <Badge variant="default" className="bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary">
              {build.heroName && (
                <img
                  src={`/images/${build.heroName.toLowerCase()}.png`}
                  alt={build.heroName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
            <span className="font-medium">{build.heroName}</span>
            {build.heroRole && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeClass()}`}
              >
                {build.heroRole}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Created by {build.userName || "Anonymous"} on{" "}
            {new Date(build.createdAt || "").toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          {isLoggedIn && (
            <Button
              variant={saved ? "default" : "outline"}
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
            >
              <Heart className={`h-4 w-4 mr-2 ${saved ? "fill-current" : ""}`} />
              {saved ? "Saved" : "Save"}
            </Button>
          )}
          {isAdmin && (
            <>
              {!build.isVerified ? (
                <Button 
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleVerify}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnverify}
                  disabled={isLoading}
                >
                  Unverify
                </Button>
              )}
              <Button
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/edit-build/${build.id}`)}
              >
                Edit
              </Button>
            </>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeRound} onValueChange={setActiveRound} className="w-full">
            <TabsList className="grid grid-cols-7 w-full mb-6">
              {Array.from({ length: 7 }, (_, i) => (
                <TabsTrigger
                  key={i + 1}
                  value={(i + 1).toString()}
                  disabled={!build.rounds[i]?.explanation}
                  className="text-center"
                >
                  {i + 1}
                </TabsTrigger>
              ))}
            </TabsList>
            {Array.from({ length: 7 }, (_, i) => {
              const round = build.rounds[i];
              return (
                <TabsContent key={i + 1} value={(i + 1).toString()}>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">Round {i + 1}</h3>
                        {round?.items?.length > 0 && (
                          <Badge className="bg-amber-600">
                            Total Cost: {calculateTotalCost(round)}
                          </Badge>
                        )}
                      </div>
                      {round?.explanation ? (
                        <div className="prose max-w-none">
                          <p>{round.explanation}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">
                          No explanation provided for this round.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Items</h4>
                        {round?.items && round.items.length > 0 ? (
                          <div className="space-y-3">
                            {round.items.map((item) => (
                              <div key={item.id} className="bg-secondary/10 rounded-md p-3 space-y-1">
                                <div className="flex justify-between">
                                  <h5 className="font-medium">{item.name}</h5>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{item.category}</Badge>
                                    <Badge variant="secondary">Cost: {item.cost}</Badge>
                                    <Badge className={getRarityBadgeClass(item.rarity)}>{item.rarity}</Badge>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">No items selected for this round.</p>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-semibold">Powers</h4>
                        {round?.powers && round.powers.length > 0 ? (
                          <div className="space-y-3">
                            {round.powers.map((power) => (
                              <div key={power.id} className="bg-secondary/10 rounded-md p-3 space-y-1">
                                <h5 className="font-medium">{power.name}</h5>
                                <p className="text-sm text-muted-foreground">{power.description}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">No powers selected for this round.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Link to="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Build</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this build? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBuild} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuildViewer;
