import { useEffect, useState } from "react";

export type QueryState = {
  search: string;
  sort: string;
  page: number;
  limit: number;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

type UseQueryStateProps = {
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  onSearchChange?: (search: string) => void;
  onSortChange?: (sort: string) => void;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
};

const DEFAULT_QUERY = {
  search: "",
  sort: "",
  page: 1,
  limit: 10,
};

const useQueryState = ({
  search: searchProp,
  sort: sortProp,
  page: pageProp,
  limit: limitProp,
  onSearchChange: onSearchChangeProp,
  onSortChange: onSortChangeProp,
  onPageChange: onPageChangeProp,
  onLimitChange: onLimitChangeProp,
}: UseQueryStateProps = {}): QueryState => {
  const [search, setSearch] = useState(searchProp ?? DEFAULT_QUERY.search);
  const [sort, setSort] = useState(sortProp ?? DEFAULT_QUERY.sort);
  const [page, setPage] = useState(pageProp ?? DEFAULT_QUERY.page);
  const [limit, setLimit] = useState(limitProp ?? DEFAULT_QUERY.limit);

  const handleChangeChange = (value: string) => {
    setSearch(value);
    onSearchChangeProp?.(value);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    onSortChangeProp?.(value);
  };

  const handlePageChange = (value: number) => {
    setPage(value);
    onPageChangeProp?.(value);
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    onLimitChangeProp?.(value);
  };

  useEffect(() => {
    if (searchProp !== undefined && searchProp !== search) {
      setSearch(searchProp);
    }
  }, [searchProp, search]);

  useEffect(() => {
    if (sortProp !== undefined && sortProp !== sort) {
      setSort(sortProp);
    }
  }, [sortProp, sort]);

  useEffect(() => {
    if (pageProp !== undefined && pageProp !== page) {
      setPage(pageProp);
    }
  }, [pageProp, page]);

  useEffect(() => {
    if (limitProp !== undefined && limitProp !== limit) {
      setLimit(limitProp);
    }
  }, [limitProp, limit]);

  return {
    search,
    sort,
    page,
    limit,
    onSearchChange: handleChangeChange,
    onSortChange: handleSortChange,
    onPageChange: handlePageChange,
    onLimitChange: handleLimitChange,
  };
};

export default useQueryState;
