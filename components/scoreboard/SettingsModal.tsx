"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CloseIcon, MenuIcon, PencilIcon } from "./UiIcons";

type Props = {
  onClose: () => void;
  onEdit: () => void;
};

export function SettingsModal({ onClose, onEdit }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        initial={{ y: 16, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 12, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative flex h-[390px] w-[844px] flex-col bg-black text-white"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-8 top-6 flex flex-col items-center text-white"
          aria-label="Exit settings"
        >
          <CircleShell>
            <MenuIcon className="h-8 w-8" />
          </CircleShell>
          <span className="mt-1 text-3xl font-black">Exit</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-8 top-6 flex flex-col items-center text-white"
          aria-label="Close settings"
        >
          <CircleShell>
            <CloseIcon className="h-8 w-8" />
          </CircleShell>
          <span className="mt-1 text-3xl font-black">Close</span>
        </button>

        <div className="mx-auto mt-24 grid grid-cols-3 gap-8">
          <motion.button
            type="button"
            onClick={onEdit}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.04 }}
            className="flex flex-col items-center text-white"
          >
            <CircleShell>
              <PencilIcon className="h-8 w-8" />
            </CircleShell>
            <span className="mt-2 text-4xl font-black">Edit</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CircleShell({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow">
      {children}
    </span>
  );
}
