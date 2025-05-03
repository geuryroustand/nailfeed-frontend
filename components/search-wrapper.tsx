"use client";

import AdvancedSearch from "@/components/search/advanced-search";
import SearchResults from "@/components/search/search-results";

export function SearchWrapper() {
  return (
    <div className="mb-6">
      <AdvancedSearch
        onSearch={(filters) => {
          console.log("Search filters:", filters);
          // The actual filtering is handled by the SearchContext
        }}
      />
      <SearchResults />
    </div>
  );
}
