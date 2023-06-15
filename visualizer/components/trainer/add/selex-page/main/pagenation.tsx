import { Button, Spinner } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import React, { useEffect } from "react";
import { sum } from "lodash";

const Pagination: React.FC = () => {
  const dispatch = useDispatch();
  const selexData = useSelector((state: RootState) => state.selexData);
  const preprocessingConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );
  const isDirty = useSelector(
    (state: RootState) => state.preprocessingConfig.isDirty
  );
  const isValidParams = useSelector(
    (state: RootState) => state.preprocessingConfig.isValidParams
  );

  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    (async () => {
      if (isDirty) {
        const seqs = selexData.sequences;
        const dups = selexData.duplicates;
        const forwardAdapter = preprocessingConfig.forwardAdapter;
        const reverseAdapter = preprocessingConfig.reverseAdapter;
        if (!seqs || !forwardAdapter || !reverseAdapter) {
          return;
        }
        const masks = seqs.map((seq) => {
          return seq.startsWith(forwardAdapter) && seq.endsWith(reverseAdapter);
        });
        const randomRegions = seqs.map((seq, i) => {
          if (masks[i]) {
            return seq.slice(
              forwardAdapter.length,
              seq.length - reverseAdapter.length
            );
          } else {
            return "";
          }
        });

        dispatch({
          type: "selexData",
          payload: {
            ...selexData,
            sequences: seqs,
            duplicates: dups,
            randomRegions: randomRegions,
            adapterMatched: masks,
            totolLength: sum(dups),
            uniqueLength: seqs.length,
            matchedLength: sum(masks),
            uniqueRatio: seqs.length / sum(dups),
          },
        });
      }
      dispatch({
        type: "preprocessingConfig/set",
        payload: {
          ...preprocessingConfig,
          isDirty: false,
        },
      });
      dispatch({
        type: "pageConfig/setPseudoRoute",
        payload: "/train",
      });
    })().then(() => {
      setIsLoading(false);
    });
  }, [isLoading]);

  const onClickNext = () => {
    setIsLoading(true);
  };

  return (
    <div className="d-flex justify-content-between my-3">
      {/* {`isDirty: ${isDirty} isAllValid: ${isValidParams} `} */}
      <Button href="/trainer" variant="primary">
        <ChevronLeft />
        Back
      </Button>
      <Button onClick={onClickNext} disabled={!isValidParams} variant="primary">
        {isLoading ? (
          <Spinner animation="border" size="sm" />
        ) : (
          <>
            Next
            <ChevronRight />
          </>
        )}
      </Button>
    </div>
  );
};

export default Pagination;
