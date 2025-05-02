import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { preprocessSelexData } from "../../redux/selex-data";
import { clearPreprocessingDirty } from "../../redux/preprocessing-config";

export const usePreprocessSelexData = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { forwardAdapter, reverseAdapter, targetLength, tolerance, minCount } =
    useSelector((state: RootState) => state.preprocessingConfig);
  const { experimentName } = useSelector(
    (state: RootState) => state.pageConfig
  );
  const isDirty = useSelector(
    (state: RootState) => state.preprocessingConfig.isDirty
  );
  const isValidParams = useSelector(
    (state: RootState) => state.preprocessingConfig.isValidParams
  );

  const handleClickNext = useCallback(async () => {
    if (!isDirty) {
      // do nothing and go to next page
      router.push("?page=raptgen");
      return;
    }

    setIsLoading(true);

    try {
      await dispatch(
        // dispatch and wait for pre-processing to finish
        preprocessSelexData({
          forwardAdapter,
          reverseAdapter,
          targetLength,
          tolerance,
          minCount,
        })
      );
      await dispatch(clearPreprocessingDirty());
      setIsLoading(false);
      router.push("?page=raptgen");
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  }, [
    isDirty,
    router,
    dispatch,
    forwardAdapter,
    reverseAdapter,
    targetLength,
    tolerance,
    minCount,
  ]);

  const handleClickBack = useCallback(() => {
    router.push("/trainer");
  }, [router]);

  return {
    isLoading,
    handleClickNext,
    handleClickBack,
    canProceed: isValidParams && !!experimentName,
  };
};
