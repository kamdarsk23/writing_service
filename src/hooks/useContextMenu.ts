import { useCallback, useState } from 'react';

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetId: string | null;
  targetType: 'folder' | 'work' | null;
}

const initialState: ContextMenuState = {
  visible: false,
  x: 0,
  y: 0,
  targetId: null,
  targetType: null,
};

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>(initialState);

  const show = useCallback(
    (e: React.MouseEvent, targetId: string, targetType: 'folder' | 'work') => {
      e.preventDefault();
      e.stopPropagation();
      setMenu({ visible: true, x: e.clientX, y: e.clientY, targetId, targetType });
    },
    [],
  );

  const hide = useCallback(() => {
    setMenu(initialState);
  }, []);

  return { menu, show, hide };
}
