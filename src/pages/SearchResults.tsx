import { useSearchParams } from 'react-router-dom';
import BuildList from '@/components/BuildList';
import SearchService from '@/services/SearchService';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: builds, isLoading, error } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      return await SearchService.searchBuilds(query);
    },
    enabled: !!query,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Search Results: {query}</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Searching for builds...</span>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            An error occurred while searching. Please try again.
          </div>
        ) : builds && builds.length > 0 ? (
          <BuildList builds={builds} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No builds found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
