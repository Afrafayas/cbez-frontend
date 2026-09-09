import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FiltersState {
  searchQuery: string;
  searchCategory: string;
  selectedCategory: string;
  filterBrand: string;
  filterMinPrice: string;
  filterMaxPrice: string;
  filterInStockOnly: boolean;
  filterCity: string;
  filterMaxBudget: string;
  filterLocationSearch: string;
  filterVerifiedOnly: boolean;
  filterMinRating: string;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'stock' | 'rating' | 'newest' | 'alphabetical';
}

const initialState: FiltersState = {
  searchQuery: '',
  searchCategory: 'All Categories',
  selectedCategory: 'All Categories',
  filterBrand: '',
  filterMinPrice: '',
  filterMaxPrice: '',
  filterInStockOnly: false,
  filterCity: 'All Cities',
  filterMaxBudget: 'Any Budget',
  filterLocationSearch: '',
  filterVerifiedOnly: false,
  filterMinRating: '0',
  sortBy: 'featured',
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSearchCategory(state, action: PayloadAction<string>) {
      state.searchCategory = action.payload;
    },
    setSelectedCategory(state, action: PayloadAction<string>) {
      state.selectedCategory = action.payload;
    },
    setFilterBrand(state, action: PayloadAction<string>) {
      state.filterBrand = action.payload;
    },
    setFilterMinPrice(state, action: PayloadAction<string>) {
      state.filterMinPrice = action.payload;
    },
    setFilterMaxPrice(state, action: PayloadAction<string>) {
      state.filterMaxPrice = action.payload;
    },
    setFilterInStockOnly(state, action: PayloadAction<boolean>) {
      state.filterInStockOnly = action.payload;
    },
    setFilterCity(state, action: PayloadAction<string>) {
      state.filterCity = action.payload;
    },
    setFilterMaxBudget(state, action: PayloadAction<string>) {
      state.filterMaxBudget = action.payload;
    },
    setFilterLocationSearch(state, action: PayloadAction<string>) {
      state.filterLocationSearch = action.payload;
    },
    setFilterVerifiedOnly(state, action: PayloadAction<boolean>) {
      state.filterVerifiedOnly = action.payload;
    },
    setFilterMinRating(state, action: PayloadAction<string>) {
      state.filterMinRating = action.payload;
    },
    setSortBy(state, action: PayloadAction<'featured' | 'price-asc' | 'price-desc' | 'stock' | 'rating' | 'newest' | 'alphabetical'>) {
      state.sortBy = action.payload;
    },
    clearFilters(state) {
      state.searchQuery = '';
      state.searchCategory = 'All Categories';
      state.selectedCategory = 'All Categories';
      state.filterBrand = '';
      state.filterMinPrice = '';
      state.filterMaxPrice = '';
      state.filterInStockOnly = false;
      state.filterCity = 'All Cities';
      state.filterMaxBudget = 'Any Budget';
      state.filterLocationSearch = '';
      state.filterVerifiedOnly = false;
      state.filterMinRating = '0';
      state.sortBy = 'featured';
    },
  },
});

export const {
  setSearchQuery,
  setSearchCategory,
  setSelectedCategory,
  setFilterBrand,
  setFilterMinPrice,
  setFilterMaxPrice,
  setFilterInStockOnly,
  setFilterCity,
  setFilterMaxBudget,
  setFilterLocationSearch,
  setFilterVerifiedOnly,
  setFilterMinRating,
  setSortBy,
  clearFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;
