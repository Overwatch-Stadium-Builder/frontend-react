import { Build } from '@/types';

class SearchService {
  async searchBuilds(query: string): Promise<Build[]> {
    try {
      const response = await fetch(`https://owapi.luciousdev.nl/api/builds/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Search request failed');
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
      console.error('Error searching builds:', error);
      return [];
    }
  }
}

export default new SearchService();
