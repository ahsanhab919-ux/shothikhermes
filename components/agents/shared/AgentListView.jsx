import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import AgentCard from "./AgentCard";

const PAGE_SIZE = 6;

const AgentListView = ({
  agents = [],
  onSelect,
  filterOptions = [],
  sortOptions = [],
}) => {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);

  const filteredAgents = useMemo(() => {
    let result = agents;
    if (filter && filter !== "all") {
      result = result.filter((a) => a.type === filter);
    }
    if (sort && sort !== "default") {
      result = [...result].sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "date") return (b.createdAt || 0) - (a.createdAt || 0);
        return 0;
      });
    }
    return result;
  }, [agents, filter, sort]);

  const pageCount = Math.ceil(filteredAgents.length / PAGE_SIZE);
  const pagedAgents = filteredAgents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pageCount, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPage(1);
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>,
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPage(i);
            }}
            isActive={i === page}
          >
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    if (endPage < pageCount) {
      if (endPage < pageCount - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
      items.push(
        <PaginationItem key={pageCount}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPage(pageCount);
            }}
          >
            {pageCount}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {filterOptions.length > 0 && (
          <div>
            <span className="mr-1 inline text-sm">Filter:</span>
            <Select
              value={filter}
              onValueChange={(value) => {
                setFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-fit">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {sortOptions.length > 0 && (
          <div>
            <span className="mr-1 inline text-sm">Sort:</span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger size="sm" className="w-fit">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      {pagedAgents.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-center">
          No agents found.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {pagedAgents.map((agent) => (
            <div key={agent.id}>
              <AgentCard
                name={agent.name}
                description={agent.description}
                icon={agent.icon}
                actions={agent.actions}
                onClick={onSelect ? () => onSelect(agent) : undefined}
              />
            </div>
          ))}
        </div>
      )}
      {pageCount > 1 && (
        <div className="mt-3 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(Math.max(1, page - 1));
                  }}
                  className={cn(page === 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(Math.min(pageCount, page + 1));
                  }}
                  className={cn(
                    page === pageCount && "pointer-events-none opacity-50",
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default AgentListView;
