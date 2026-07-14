import { useState } from "react";

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return {
    isOpen,
    isCollapsed,
    openSidebar: () => setIsOpen(true),
    closeSidebar: () => setIsOpen(false),
    toggleCollapse: () => setIsCollapsed((v) => !v),
  };
}