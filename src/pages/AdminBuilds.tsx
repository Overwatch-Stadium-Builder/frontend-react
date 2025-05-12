import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Build } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const AdminBuilds = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, token } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You must be logged in as an admin to view this page.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const fetchBuilds = async () => {
      try {
        const response = await fetch('https://owapi.luciousdev.nl/api/builds/admin', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Format the builds data
        const formattedBuilds = data.map((build: any) => ({
          id: build.id,
          userId: build.user_id,
          heroId: build.hero_id,
          heroName: build.hero_name,
          heroRole: build.hero_role,
          title: build.title,
          createdAt: build.created_at,
          userName: build.username,
          isVerified: build.is_verified === 1,
          rounds: build.rounds || []
        }));
        
        setBuilds(formattedBuilds);
      } catch (error) {
        console.error("Error fetching builds:", error);
        toast({
          title: "Error",
          description: "Failed to load builds. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBuilds();
  }, [navigate, toast, token, isAdmin]);

  const handleVerify = async (buildId: number) => {
    try {
      const response = await fetch(`https://owapi.luciousdev.nl/api/builds/${buildId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setBuilds(
          builds.map((build) =>
            build.id === buildId ? { ...build, isVerified: true } : build
          )
        );
        
        toast({
          title: "Build Verified",
          description: "The build has been verified successfully.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to verify build. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying build:", error);
      toast({
        title: "Error",
        description: "Failed to verify build. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (buildId: number) => {
    try {
      const response = await fetch(`https://owapi.luciousdev.nl/api/builds/${buildId}/unverify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setBuilds(
          builds.map((build) =>
            build.id === buildId ? { ...build, isVerified: false } : build
          )
        );
        
        toast({
          title: "Build Rejected",
          description: "The build has been rejected.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to reject build. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error rejecting build:", error);
      toast({
        title: "Error",
        description: "Failed to reject build. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Builds</h1>
          <p className="text-muted-foreground">Verify or reject user builds</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading builds...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Pending Builds</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {builds.filter(build => !build.isVerified).map((build) => (
              <Card key={build.id} className="border-2 border-yellow-400/20">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{build.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        By {build.userName} • Created {new Date(build.createdAt || "").toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">
                        {build.rounds && build.rounds[0]?.explanation ? 
                          build.rounds[0].explanation.substring(0, 100) + "..." : 
                          "No explanation provided."}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/build/${build.id}`)}>
                        View Details
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleReject(build.id as number)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="default" 
                          size="icon"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleVerify(build.id as number)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {builds.filter(build => !build.isVerified).length === 0 && (
              <div className="col-span-full text-center py-8">
                No pending builds to review
              </div>
            )}
          </div>

          <h2 className="text-xl font-semibold mt-8">Verified Builds</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {builds.filter(build => build.isVerified).map((build) => (
              <Card key={build.id} className="border-2 border-green-400/20">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{build.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          By {build.userName} • Created {new Date(build.createdAt || "").toLocaleDateString()}
                        </p>
                      </div>
                      <span className="bg-green-600/20 text-green-600 text-xs px-2 py-1 rounded-full">
                        Verified
                      </span>
                    </div>
                    <div>
                      <p className="text-sm">
                        {build.rounds && build.rounds[0]?.explanation ? 
                          build.rounds[0].explanation.substring(0, 100) + "..." : 
                          "No explanation provided."}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/build/${build.id}`)}>
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleReject(build.id as number)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {builds.filter(build => build.isVerified).length === 0 && (
              <div className="col-span-full text-center py-8">
                No verified builds yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBuilds;
