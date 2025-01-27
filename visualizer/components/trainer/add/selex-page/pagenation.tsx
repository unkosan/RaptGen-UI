import { Button, Spinner } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { useRouter } from "next/router";
import { preprocessSelexData } from "../redux/selex-data";
import { clearPreprocessingDirty } from "../redux/preprocessing-config";
import { useIsLoading } from "~/hooks/common";

const Pagination: React.FC = () => {
  const dispatch = useDispatch();
  const pageConfig = useSelector((state: RootState) => state.pageConfig);
  const preprocessingConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );
  const isDirty = useSelector(
    (state: RootState) => state.preprocessingConfig.isDirty
  );
  const isValidParams = useSelector(
    (state: RootState) => state.preprocessingConfig.isValidParams
  );

  const router = useRouter();
  const [isLoading, lock, unlock] = useIsLoading();

  const onClickNextButton = async () => {
    if (!isDirty) {
      router.push("?page=raptgen");
    }

    lock();
    try {
      await dispatch(
        preprocessSelexData({
          forwardAdapter: preprocessingConfig.forwardAdapter,
          reverseAdapter: preprocessingConfig.reverseAdapter,
          targetLength: preprocessingConfig.targetLength,
          tolerance: preprocessingConfig.tolerance,
          minCount: preprocessingConfig.minCount,
        })
      );
      await dispatch(clearPreprocessingDirty());
      unlock();
      router.push("?page=raptgen");
    } catch (e) {
      console.error(e);
      unlock();
    }
  };

  return (
    <div className="d-flex justify-content-between my-3">
      <Button href="/trainer" variant="primary">
        <div className="align-items-center d-flex">
          <ChevronLeft />
          &nbsp; Back
        </div>
      </Button>
      <Button
        onClick={onClickNextButton}
        disabled={
          !isValidParams || isLoading || pageConfig.experimentName === ""
        }
        variant="primary"
      >
        {isLoading ? (
          <Spinner animation="border" size="sm" />
        ) : (
          <div className="align-items-center d-flex">
            Next &nbsp;
            <ChevronRight />
          </div>
        )}
      </Button>
    </div>
  );
};

export default Pagination;
