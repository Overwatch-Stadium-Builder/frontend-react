import { Build } from "@/types";
import BuildCard from "./BuildCard";

interface BuildListProps {
  builds: Build[];
  title?: string;
}

const BuildList = ({ builds, title }: BuildListProps) => {
  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}
      <div className="build-grid">
        {builds.map((build) => (
          <BuildCard key={build.id || build.buildId} build={build} />
        ))}
      </div>
      {builds.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No builds found</p>
        </div>
      )}
    </div>
  );
};

export default BuildList;
