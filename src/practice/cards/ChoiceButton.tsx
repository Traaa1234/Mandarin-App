import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// A big answer button that wobbles when wrong and glows when it is the answer being shown.
export default function ChoiceButton({
  onPress,
  wobble,
  highlight,
  label,
  children,
}: {
  onPress: () => void;
  wobble: boolean;
  highlight: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onPress}
      aria-label={label}
      animate={wobble ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex min-h-24 min-w-24 items-center justify-center rounded-3xl p-2 shadow-md active:scale-95 ${
        highlight ? 'bg-[#ffe8a3] ring-4 ring-[#f59f00]' : 'bg-white'
      }`}
    >
      {children}
    </motion.button>
  );
}
