/**
 * Custom hook for managing dialog open/close state with imperative handle.
 * Provides standardized dialog control interface.
 *
 * By Kunal Das (https://kunaldasx.vercel.app)
 */

import {
  type ForwardedRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";

export interface DialogRef {
  closeDialog: () => void;
  openDialog: () => void;
}

interface UseDialogStateOptions {
  canClose?: () => boolean;
  onClose?: () => void;
}

export const useDialogState = (
  ref: ForwardedRef<DialogRef>,
  options: UseDialogStateOptions = {},
) => {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = useCallback(() => setIsOpen(true), []);

  const closeDialog = useCallback(() => {
    if (options.canClose && !options.canClose()) {
      return;
    }
    setIsOpen(false);
    options.onClose?.();
  }, [options]);

  useImperativeHandle(ref, () => ({
    openDialog,
    closeDialog,
  }));

  return { isOpen, setIsOpen, openDialog, closeDialog };
};
