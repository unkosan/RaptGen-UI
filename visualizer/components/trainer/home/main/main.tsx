import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useDispatch } from "react-redux";

const Main: React.FC = () => {
  const parentId = useSelector((state: RootState) => state.pageConfig.parentId);
  const childId = useSelector((state: RootState) => state.pageConfig.childId);

  const [latent, setLatent] = React.useState<{
    coordsX: number[];
    coordsY: number[];
    randomRegions: number[];
    duplicates: number[];
  }>({
    coordsX: [],
    coordsY: [],
    randomRegions: [],
    duplicates: [],
  });

  const [losses, setLosses] = React.useState<{
    trainLoss: number[];
    testLoss: number[];
    testRecon: number[];
    testKld: number[];
  }>({
    trainLoss: [],
    testLoss: [],
    testRecon: [],
    testKld: [],
  });

  const dispatch = useDispatch();

  if (!parentId) {
    return <div>Please click the entry on the left</div>;
  } else {
    return (
      <div>
        ParentId is {parentId}. childId is {childId}
      </div>
    );
  }
};

export default Main;
