import { useEffect } from "react";
import { Tab } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BuildList from "@/components/BuildList";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { userId, token, isLoggedIn } = useAuth();
  const { toast } = useToast();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to view your profile.",
        variant: "destructive",
      });
      navigate("/login", { state: { from: "/profile" } });
    }
  }, [isLoggedIn, navigate, toast]);

  const { data: myBuilds, isLoading: myBuildsLoading } = useQuery({
    queryKey: ['my-builds', userId],
    queryFn: async () => {
      if (!userId || !token) return [];
      
      try {
        const response = await fetch(`https://owapi.luciousdev.nl/api/builds?user_id=${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch your builds');
        }
        
        const data = await response.json();
        return data.map((build: any) => ({
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
      } catch (error) {
        console.error("Error fetching builds:", error);
        toast({
          title: "Error",
          description: "Failed to load your builds. Please try again later.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!userId && !!token && isLoggedIn
  });

  const { data: savedBuilds, isLoading: savedBuildsLoading } = useQuery({
    queryKey: ['saved-builds', userId],
    queryFn: async () => {
      if (!userId || !token) return [];
    
      try {
        const response = await fetch(`https://owapi.luciousdev.nl/api/users/${userId}/get-saved-builds`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
    
        if (!response.ok) {
          console.error("Failed response:", await response.text());
          throw new Error('Failed to fetch saved builds');
        }
    
        const savedBuilds = await response.json();
    
        // OPTIONAL: Fetch detailed info for each build (e.g., from /api/builds/:id)
        // Only do this if your savedBuilds data lacks full details.
        const detailedBuilds = await Promise.all(savedBuilds.map(async (build: any) => {
          const res = await fetch(`https://owapi.luciousdev.nl/api/builds/${build.build_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          return await res.json();
        }));
    
        // For now, just map over savedBuilds directly
        const test = savedBuilds.map((build: any, index: number) => {
          const detailed = detailedBuilds[index];
          
          return {
            id: build.id,
            userId: build.user_id,
            heroId: detailed.hero_id,
            buildId: build.build_id,
            heroName: build.hero_name,
            heroRole: build.hero_role,
            title: build.title,
            createdAt: build.created_at,
            userName: build.username,
            isVerified: build.is_verified === 1,
            rounds: build.rounds || []
          };
        });
        return test;
      } catch (error) {
        console.error("Error fetching saved builds:", error);
        toast({
          title: "Error",
          description: "Failed to load your saved builds. Please try again later.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!userId && !!token && isLoggedIn
  });

  if (!isLoggedIn) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground">Manage your builds and saved content</p>
        </div>
        <Button onClick={() => navigate("/create-build")}>Create New Build</Button>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden">
        <Tab.Group>
          <Tab.List className="flex bg-muted">
            <Tab
              className={({ selected }) =>
                `flex-1 py-4 text-center font-medium transition-colors ${
                  selected
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              My Builds
            </Tab>
            <Tab
              className={({ selected }) =>
                `flex-1 py-4 text-center font-medium transition-colors ${
                  selected
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              Saved Builds
            </Tab>
          </Tab.List>
          <Tab.Panels className="p-6">
            <Tab.Panel>
              {myBuildsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading your builds...</span>
                </div>
              ) : myBuilds && myBuilds.length > 0 ? (
                <BuildList builds={myBuilds} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  You haven't created any builds yet.
                </div>
              )}
            </Tab.Panel>
            <Tab.Panel>
              {savedBuildsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading saved builds...</span>
                </div>
              ) : savedBuilds && savedBuilds.length > 0 ? (
                <BuildList builds={savedBuilds} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  You haven't saved any builds yet.
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default Profile;
