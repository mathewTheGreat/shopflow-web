import { create } from 'zustand'

interface UIState {
    isSidebarOpen: boolean
    toggleSidebar: () => void
    setSidebarOpen: (isOpen: boolean) => void
    isSearchModalOpen: boolean
    setSearchModalOpen: (isOpen: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: true,
    toggleSidebar: () => set((state: UIState) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
    isSearchModalOpen: false,
    setSearchModalOpen: (isOpen: boolean) => set({ isSearchModalOpen: isOpen }),
}))
