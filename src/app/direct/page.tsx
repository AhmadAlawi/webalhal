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
import { useI18n } from "@/context/I18nContext";
import { DEFAULT_PAGE_SIZE, type MarketListFilterState } from "@/lib/market-list-filters";

export default function DirectPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MarketListFilterState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortOrder: "desc",
  });
  const { user } = useAuth();

  return (
    <>
      <PageHeader title={t("direct.title")} backHref="/" />
      <PageContainer className="py-8">
        <div className="mb-4 flex justify-end">
          {canCreateDirectListing(user?.roleId) && (
            <Link href="/direct/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                {t("direct.newListing")}
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
