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

  // temporary code
  useEffect(() => {
    dispatch({
      type: "pageConfig/set",
      payload: {
        parentId: "18b1e0e0-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
        childId: 1,
      },
    });
  });

  if (!parentId) return <div>Please click the entry on the left</div>;

  return <div>Please click the entry on the left</div>;
};

export default Main;
