import { create } from 'zustand';

interface AppState {
  selectedApplicationId: string | null;
  sidebarOpen: boolean;
  filterStatus: string | null;
  filterIndustry: string | null;
  dateRangeStart: Date | null;
  dateRangeEnd: Date | null;
  setSelectedApplication: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setFilterStatus: (status: string | null) => void;
  setFilterIndustry: (industry: string | null) => void;
  setDateRange: (start: Date | null, end: Date | null) => void;
  resetFilters: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedApplicationId: null,
  sidebarOpen: true,
  filterStatus: null,
  filterIndustry: null,
  dateRangeStart: null,
  dateRangeEnd: null,
  setSelectedApplication: (id) => set({ selectedApplicationId: id }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterIndustry: (industry) => set({ filterIndustry: industry }),
  setDateRange: (start, end) => set({ dateRangeStart: start, dateRangeEnd: end }),
  resetFilters: () => set({
    filterStatus: null,
    filterIndustry: null,
    dateRangeStart: null,
    dateRangeEnd: null,
  }),
}));
