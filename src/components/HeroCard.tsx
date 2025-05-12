import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Hero } from "@/types";

interface HeroCardProps {
  hero: Hero;
  mini?: boolean;
}

const HeroCard = ({ hero, mini = false }: HeroCardProps) => {
  if (mini) {
    return (
      <Link 
        to={`/hero/${hero.id}`} 
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors"
      >
        <img
          src={hero.cover_image_url}
          alt={hero.name}
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="font-medium">{hero.name}</span>
      </Link>
    );
  }

  return (
    <Link to={`/hero/${hero.id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <div className="aspect-square overflow-hidden">
          <img 
            src={hero.cover_image_url} 
            alt={hero.name}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold">{hero.name}</h3>
          <p className="text-sm text-muted-foreground">{hero.role}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default HeroCard;
