import { useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setSearchQuery,
  setSelectedCategory,
  setFilterCity,
  setFilterMaxBudget,
  setFilterBrand,
  setSortBy,
  setFilterLocationSearch,
} from '../store/filtersSlice';

export function useFilterSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters);

  // Flag to know whether we finished reading the URL params for the first time
  const isInitializedRef = useRef(false);
  const isUpdatingUrlRef = useRef(false);

  // -------------------------------------------------------------
  // 1. URL ➡️ REDUX (Runs on mount & when browser back/forward is used)
  // -------------------------------------------------------------
  useEffect(() => {
    // Only sync on the main marketplace/home page
    if (location.pathname !== '/' && location.pathname !== '') {
      return;
    }

    if (isUpdatingUrlRef.current) {
      isUpdatingUrlRef.current = false;
      return;
    }

    const q = searchParams.get('search');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const budget = searchParams.get('budget');
    const brand = searchParams.get('brand');
    const locSearch = searchParams.get('location');
    const sort = searchParams.get('sortBy');

    if (q !== null && q !== filters.searchQuery) {
      dispatch(setSearchQuery(q));
    }
    if (category !== null && category !== filters.selectedCategory) {
      dispatch(setSelectedCategory(category));
    }
    if (city !== null && city !== filters.filterCity) {
      dispatch(setFilterCity(city));
    }
    if (budget !== null && budget !== filters.filterMaxBudget) {
      dispatch(setFilterMaxBudget(budget));
    }
    if (brand !== null && brand !== filters.filterBrand) {
      dispatch(setFilterBrand(brand));
    }
    if (locSearch !== null && locSearch !== filters.filterLocationSearch) {
      dispatch(setFilterLocationSearch(locSearch));
    }
    if (
      sort !== null &&
      sort !== filters.sortBy &&
      ['featured', 'price-asc', 'price-desc', 'stock', 'rating', 'newest', 'alphabetical'].includes(sort)
    ) {
      dispatch(setSortBy(sort as any));
    }

    isInitializedRef.current = true;
  }, [searchParams, location.pathname, dispatch]);

  // -------------------------------------------------------------
  // 2. REDUX ➡️ URL (Runs when user selects/types filters)
  // -------------------------------------------------------------
  useEffect(() => {
    // Only sync to URL on home page after initial read is done
    if (!isInitializedRef.current || (location.pathname !== '/' && location.pathname !== '')) {
      return;
    }

    const newParams = new URLSearchParams(searchParams);

    // Search Query
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      newParams.set('search', filters.searchQuery.trim());
    } else {
      newParams.delete('search');
    }

    // Category
    if (filters.selectedCategory && filters.selectedCategory !== 'All Categories') {
      newParams.set('category', filters.selectedCategory);
    } else {
      newParams.delete('category');
    }

    // City
    if (filters.filterCity && filters.filterCity !== 'All Cities') {
      newParams.set('city', filters.filterCity);
    } else {
      newParams.delete('city');
    }

    // Budget
    if (filters.filterMaxBudget && filters.filterMaxBudget !== 'Any Budget') {
      newParams.set('budget', filters.filterMaxBudget);
    } else {
      newParams.delete('budget');
    }

    // Brand
    if (filters.filterBrand && filters.filterBrand.trim() !== '') {
      newParams.set('brand', filters.filterBrand.trim());
    } else {
      newParams.delete('brand');
    }

    // Location Search (e.g. area / landmark)
    if (filters.filterLocationSearch && filters.filterLocationSearch.trim() !== '') {
      newParams.set('location', filters.filterLocationSearch.trim());
    } else {
      newParams.delete('location');
    }

    // Sort By
    if (filters.sortBy && filters.sortBy !== 'featured') {
      newParams.set('sortBy', filters.sortBy);
    } else {
      newParams.delete('sortBy');
    }

    // Only update if search query string actually changed
    const currentQueryString = searchParams.toString();
    const newQueryString = newParams.toString();

    if (currentQueryString !== newQueryString) {
      isUpdatingUrlRef.current = true;
      setSearchParams(newParams, { replace: true });
    }
  }, [
    filters.searchQuery,
    filters.selectedCategory,
    filters.filterCity,
    filters.filterMaxBudget,
    filters.filterBrand,
    filters.filterLocationSearch,
    filters.sortBy,
    location.pathname,
    searchParams,
    setSearchParams,
  ]);
}
