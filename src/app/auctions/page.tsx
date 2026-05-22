"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { MarketListings } from "@/components/home/MarketListings";
import { PageContainer } from "@/components/layout/PageContainer";
import { MarketListFilters } from "@/components/market/MarketListFilters";
import { DEFAULT_PAGE_SIZE, type MarketListFilterState } from "@/lib/market-list-filters";

export default function AuctionsPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MarketListFilterState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortOrder: "desc",
  });

  return (
    <>
      <PageHeader title="المزادات" subtitle="تصفح المزادات المفتوحة وزايد مباشرة" backHref="/" />
      <PageContainer className="py-8">
        <MarketListFilters
          kind="auctions"
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <MarketListings tab="auctions" searchQuery={search} listFilters={filters} source="open" />
      </PageContainer>
    </>
  );
}
