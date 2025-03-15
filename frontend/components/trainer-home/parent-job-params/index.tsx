import { z } from "zod";
import { responseGetItem } from "~/services/route/train";

type ParentItem = z.infer<typeof responseGetItem>;

export const ParentJobParams: React.FC<{
  item: ParentItem;
}> = ({ item }) => {
  return (
    <p>
      <span className="fw-semibold">Start time: </span>
      {new Date(item.start * 1000).toLocaleString()}
      <br />
      <span className="fw-semibold">The number of models to train: </span>
      {item.reiteration}
    </p>
  );
};
