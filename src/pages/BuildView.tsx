import { useParams, useNavigate } from "react-router-dom";
import BuildViewer from "@/components/BuildViewer";
import BuildCreator from "@/components/BuildCreator";
import { useEffect, useState } from "react";
import { Build } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import BuildService from "@/services/BuildService";
import { useAuth } from "@/contexts/AuthContext";

interface BuildViewProps {
  isEditing?: boolean;
}

const BuildView = ({ isEditing = false }: BuildViewProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [build, setBuild] = useState<Build | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin, token } = useAuth();
  const buildService = new BuildService();

  useEffect(() => {
    // Check if editing route and not admin
    if (isEditing && !token) {
      toast({
        title: "Access Denied",
        description: "You must be logged in to edit builds.",
        variant: "destructive",
      });
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    
    const fetchBuild = async () => {
      try {
        if (id) {
          try {
            const response = await fetch(`https://owapi.luciousdev.nl/api/builds/${id}`, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data) {
                const formattedBuild: Build = {
                  id: data.id,
                  userId: data.user_id,
                  heroId: data.hero_id,
                  heroName: data.hero_name,
                  heroRole: data.hero_role,
                  title: data.title,
                  createdAt: data.created_at,
                  userName: data.username,
                  isVerified: data.is_verified === 1,
                  rounds: data.rounds.map((round: any) => ({
                    id: round.id,
                    buildId: round.build_id,
                    roundNumber: round.round_number,
                    explanation: round.explanation,
                    items: round.items || [],
                    powers: round.powers || []
                  }))
                };
                setBuild(formattedBuild);
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            console.error("Error fetching from API:", error);
          }
          
          // Fallback to service
          const buildData = await buildService.getBuildById(Number(id));
          if (buildData) {
            setBuild(buildData);
          }
        }
      } catch (error) {
        console.error("Error fetching build:", error);
        toast({
          title: "Error",
          description: "Failed to load the build. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBuild();
  }, [id, isEditing, navigate, toast, token]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center h-64">
        <div className="animate-pulse">Loading build...</div>
      </div>
    );
  }

  if (!build) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <h2 className="text-xl font-semibold">Build Not Found</h2>
          <p className="mt-2">The build you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Edit Build</h1>
        <BuildCreator editingBuild={build} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <BuildViewer build={build} isAdmin={isAdmin} />
    </div>
  );
};

export default BuildView;
