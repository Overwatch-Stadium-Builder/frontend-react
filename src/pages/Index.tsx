import { useState } from "react";
import BuildList from "@/components/BuildList";
import HeroGrid from "@/components/HeroGrid";
import { Build } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import ExternalLinkConfirm from "@/components/ExternalLinkConfirm";

const Index = () => {
  const { data: recentBuilds, isLoading } = useQuery({
    queryKey: ['recent-builds'],
    queryFn: async () => {
      const response = await fetch('https://owapi.luciousdev.nl/api/recent-builds?limit=4');
      if (!response.ok) {
        throw new Error('Failed to fetch recent builds');
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
    }
  });

  return (
    <div className="min-h-screen">
      {/* Beta Warning */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
        <div className="container mx-auto px-4">
          <p className="font-bold">BETA</p>
          <p>
            This website is still being developed, some features might not work like expected.
            If you run into any issues please join the{" "}
            <a
              href="https://discord.gg/yHQEugWXWg"
              className="font-semibold underline text-yellow-800 hover:text-yellow-600"
            >
              Discord
            </a>.
            {" "}For uptime status please look at{" "}
            <a
              href="/status"
              className="font-semibold underline text-yellow-800 hover:text-yellow-600"
            >
              this page
            </a>.
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary to-primary/80 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Overwatch Stadium Build Arena
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Create, share, and discover the best stadium mode builds for your favorite Overwatch heroes
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto py-8 px-4 space-y-12">
        {/* Recent Builds */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Recent Builds</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading recent builds...</span>
            </div>
          ) : recentBuilds && recentBuilds.length > 0 ? (
            <BuildList builds={recentBuilds} />
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No builds found. Be the first to create one!
            </p>
          )}
        </div>

        {/* Hero Browser */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Browse Heroes</h2>
          <p className="text-muted-foreground">
            Select a hero to view available builds or create your own
          </p>
          <HeroGrid />
        </div>
      </section>
    </div>
  );
};

export default Index;
