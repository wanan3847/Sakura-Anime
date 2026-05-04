import { create } from "zustand";

interface AppState {
  searchHistory: string[];
  addSearchHistory: (keyword: string) => void;
  clearSearchHistory: () => void;
  isLoginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  searchHistory:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("searchHistory") || "[]")
      : [],
  addSearchHistory: (keyword) =>
    set((state) => {
      const history = [keyword, ...state.searchHistory.filter((k) => k !== keyword)].slice(0, 20);
      if (typeof window !== "undefined") {
        localStorage.setItem("searchHistory", JSON.stringify(history));
      }
      return { searchHistory: history };
    }),
  clearSearchHistory: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("searchHistory");
    }
    set({ searchHistory: [] });
  },
  isLoginModalOpen: false,
  setLoginModalOpen: (open) => set({ isLoginModalOpen: open }),
}));
