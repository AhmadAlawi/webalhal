"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { MarketListings } from "@/components/home/MarketListings";
import { PageContainer } from "@/components/layout/PageContainer";
import { MarketListFilters } from "@/components/market/MarketListFilters";
import { useI18n } from "@/context/I18nContext";
import { DEFAULT_PAGE_SIZE, type MarketListFilterState } from "@/lib/market-list-filters";

export default function AuctionsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MarketListFilterState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortOrder: "desc",
  });

  return (
    <>
      <PageHeader title={t("auctions.title")} subtitle={t("auctions.subtitle")} backHref="/" />
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
