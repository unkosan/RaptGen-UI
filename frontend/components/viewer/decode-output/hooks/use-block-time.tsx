import { useCallback, useEffect, useState } from "react";

export const useBlockTime = (
  millisecond: number
): { lock: boolean; setLock: () => void } => {
  const [lockState, setLockState] = useState<boolean>(false);
  const setLock = useCallback(() => {
    setLockState(true);
  }, []);
  useEffect(() => {
    if (!lockState) {
      return;
    }
    setTimeout(() => {
      setLockState(false);
    }, millisecond);
  }, [lockState, millisecond]);
  return { lock: lockState, setLock };
};
