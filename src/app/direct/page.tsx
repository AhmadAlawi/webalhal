"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { MarketListings } from "@/components/home/MarketListings";
import { MarketListFilters } from "@/components/market/MarketListFilters";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { canCreateDirectListing } from "@/lib/permissions";
import { DEFAULT_PAGE_SIZE, type MarketListFilterState } from "@/lib/market-list-filters";

export default function DirectPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MarketListFilterState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortOrder: "desc",
  });
  const { user } = useAuth();

  return (
    <>
      <PageHeader title="البيع المباشر" backHref="/" />
      <PageContainer className="py-8">
        <div className="mb-4 flex justify-end">
          {canCreateDirectListing(user?.roleId) && (
            <Link href="/direct/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                عرض جديد
              </Button>
            </Link>
          )}
        </div>
        <MarketListFilters
          kind="direct"
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <MarketListings tab="direct" searchQuery={search} listFilters={filters} source="open" />
      </PageContainer>
    </>
  );
}
