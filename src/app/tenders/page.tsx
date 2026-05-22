"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { MarketListings } from "@/components/home/MarketListings";
import { MarketListFilters } from "@/components/market/MarketListFilters";
import { DEFAULT_PAGE_SIZE, type MarketListFilterState } from "@/lib/market-list-filters";

export default function TendersPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MarketListFilterState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortOrder: "desc",
  });

  return (
    <>
      <PageHeader title="المناقصات" subtitle="تصفح المناقصات المفتوحة" backHref="/" />
      <PageContainer className="py-8">
        <MarketListFilters
          kind="tenders"
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <MarketListings tab="tenders" searchQuery={search} listFilters={filters} source="open" />
      </PageContainer>
    </>
  );
}
