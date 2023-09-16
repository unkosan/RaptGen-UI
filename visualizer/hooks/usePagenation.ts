import { useState, useCallback, useEffect } from "react";

const usePagenation = (total: number, pageSize: number) => {
  // pageIndex starts from 1
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(1);
  const [startIndex, setStartIndex] = useState<number>(0);
  const [endIndex, setEndIndex] = useState<number>(0);

  const setPageIndexCallback = useCallback(() => {
    const pageCount = Math.ceil(total / pageSize);
    if (pageIndex > pageCount) {
      setPageIndex(pageCount);
      return;
    } else if (pageIndex < 1) {
      setPageIndex(1);
      return;
    }
    setPageCount(pageCount);

    const startIndex = (pageIndex - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, total - 1);
    setStartIndex(startIndex);
    setEndIndex(endIndex);
  }, [total, pageSize, pageIndex]);

  useEffect(() => {
    setPageIndexCallback();
  }, [setPageIndexCallback]);

  return {
    pageIndex,
    setPageIndex,
    pageCount,
    startIndex,
    endIndex,
  };
};

export default usePagenation;
