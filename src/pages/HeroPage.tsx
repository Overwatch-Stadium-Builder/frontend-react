import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import BuildList from "@/components/BuildList";
import { Loader2, ArrowLeft } from "lucide-react";

const HeroPage = () => {
  const { heroId } = useParams<{ heroId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, token } = useAuth();
  
  const { data: hero, isLoading: heroLoading } = useQuery({
    queryKey: ['hero', heroId],
    queryFn: async () => {
      const response = await fetch(`https://owapi.luciousdev.nl/api/heroes/${heroId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch hero');
      }
      return response.json();
    }
  });

  const { data: heroBuilds, isLoading: buildsLoading } = useQuery({
    queryKey: ['hero-builds', heroId],
    queryFn: async () => {
      const response = await fetch(`https://owapi.luciousdev.nl/api/builds?hero_id=${heroId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch builds for hero');
      }
      
      const data = await response.json();
      
      // Format the builds data
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
    },
    enabled: !!heroId
  });

  if (heroLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading hero details...</span>
      </div>
    );
  }

  if (!hero) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <h2 className="text-xl font-semibold">Hero Not Found</h2>
          <p className="mt-2">The hero you're looking for doesn't exist.</p>
          <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Get border color based on role
  const getBorderClass = () => {
    switch (hero.role) {
      case 'Tank':
        return 'border-[#5fc0d1] bg-[#5fc0d1]/10';
      case 'DPS':
        return 'border-[#e61b23] bg-[#e61b23]/10';
      case 'Support':
        return 'border-[#13bf75] bg-[#13bf75]/10';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className={`flex flex-col md:flex-row border-2 rounded-lg overflow-hidden mb-8 ${getBorderClass()}`}>
        <div className="md:w-1/3 relative aspect-video md:aspect-auto">
          <img 
            src={hero.image_url} 
            alt={hero.name}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="p-6 md:w-2/3 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{hero.name}</h1>
              <p className="text-lg text-muted-foreground">{hero.role}</p>
            </div>
            {isLoggedIn && (
              <Button onClick={() => navigate(`/create-build?hero=${heroId}`)}>
                Create Build
              </Button>
            )}
          </div>
          <div className="flex-1">
            {hero.description && <p className="mb-4">{hero.description}</p>}
            
            <div className="mt-auto">
              <h3 className="text-lg font-semibold">Abilities</h3>
              <ul className="list-disc list-inside mt-2">
                {hero.abilities?.map((ability: string, i: number) => (
                  <li key={i}>{ability}</li>
                )) || (
                  <li>No abilities information available</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Builds for {hero.name}</h2>
        {buildsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading builds...</span>
          </div>
        ) : heroBuilds && heroBuilds.length > 0 ? (
          <BuildList builds={heroBuilds} />
        ) : (
          <div className="text-center py-8 bg-muted rounded-lg">
            <p className="text-muted-foreground">No builds found for this hero yet.</p>
            {isLoggedIn ? (
              <Button onClick={() => navigate(`/create-build?hero=${heroId}`)} className="mt-4">
                Create the first build!
              </Button>
            ) : (
              <Button onClick={() => navigate('/login')} className="mt-4">
                Log in to create a build
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroPage;
