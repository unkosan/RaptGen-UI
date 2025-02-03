import { useCallback, useEffect, useState } from "react";

function useIsLoading(): [boolean, () => void, () => void] {
  const [currentJobs, setCurrentJobs] = useState(0);
  const lock = useCallback(() => {
    setCurrentJobs((prev) => prev + 1);
  }, []);
  const unlock = useCallback(() => {
    setCurrentJobs((prev) => prev - 1);
  }, [currentJobs]);
  const isLoading = currentJobs > 0;

  return [isLoading, lock, unlock];
}

function useAsyncMemo<T>(
  asyncFunction: () => Promise<T>,
  deps: any[],
  defaultValue: T
): T {
  const [value, setValue] = useState<T>(defaultValue);
  const func = useCallback(asyncFunction, deps);
  useEffect(() => {
    func().then(setValue);
  }, [func, ...deps]);
  return value;
}

function useStateWithPredicate<T>(
  initialValue: T,
  predicate: (value: T) => boolean,
  initialTrue: boolean = false
): [T, (value: T) => boolean, boolean] {
  const [value, _setValue] = useState<T>(initialValue);
  const [isValid, setIsValid] = useState<boolean>(
    initialTrue ? true : predicate(value)
  );
  const setValue = useCallback((value: T) => {
    _setValue(value);
    const isValid = predicate(value);
    setIsValid(isValid);
    return isValid;
  }, []);

  return [value, setValue, isValid];
}

export { useIsLoading, useAsyncMemo, useStateWithPredicate };
