import React from 'react';
import { Route } from 'react-router-dom';
import SearchResults from './pages/SearchResults';

// Export the search route for potential use in other files
export const searchRoutes = (
  <Route key="search" path="/search" element={<SearchResults />} />
);
