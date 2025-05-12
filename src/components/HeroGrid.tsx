import { useState } from "react";
import HeroCard from "./HeroCard";
import { Button } from "@/components/ui/button";
import { Role, Hero } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const HeroGrid = () => {
  const [selectedRole, setSelectedRole] = useState<Role | 'All'>('All');
  
  const { data: heroes, isLoading } = useQuery({
    queryKey: ['heroes'],
    queryFn: async () => {
      const response = await fetch('https://owapi.luciousdev.nl/api/heroes');
      if (!response.ok) {
        throw new Error('Failed to fetch heroes');
      }
      return response.json();
    }
  });

  const roleOrder = { Tank: 1, DPS: 2, Support: 3 };

  const filteredHeroes = isLoading || !heroes
    ? []
    : selectedRole === 'All'
      ? heroes.sort((a: Hero, b: Hero) => roleOrder[a.role] - roleOrder[b.role])
      : heroes
          .filter((hero: Hero) => hero.role === selectedRole)
          .sort((a: Hero, b: Hero) => roleOrder[a.role] - roleOrder[b.role]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={selectedRole === 'All' ? "default" : "outline"}
          onClick={() => setSelectedRole('All')}
        >
          All
        </Button>
        <Button 
          variant={selectedRole === 'Tank' ? "default" : "outline"}
          onClick={() => setSelectedRole('Tank')}
          className="border-[#5fc0d1] text-[#5fc0d1] hover:text-[#5fc0d1]"
        >
          Tank
        </Button>
        <Button 
          variant={selectedRole === 'DPS' ? "default" : "outline"}
          onClick={() => setSelectedRole('DPS')}
          className="border-[#e61b23] text-[#e61b23] hover:text-[#e61b23]"
        >
          DPS
        </Button>
        <Button 
          variant={selectedRole === 'Support' ? "default" : "outline"}
          onClick={() => setSelectedRole('Support')}
          className="border-[#13bf75] text-[#13bf75] hover:text-[#13bf75]"
        >
          Support
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading heroes...</span>
        </div>
      ) : filteredHeroes.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredHeroes.map((hero: Hero) => (
            <HeroCard key={hero.id} hero={hero} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No heroes found for this role.
        </div>
      )}
    </div>
  );
};

export default HeroGrid;