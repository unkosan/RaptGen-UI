import { useRouter } from "next/router";
import { Button } from "react-bootstrap";
import { PlusLg } from "react-bootstrap-icons";

const AddJobButton: React.FC = () => {
  const { push } = useRouter();

  return (
    <Button
      variant="primary text-start"
      className="d-grid gap-2 w-100"
      onClick={() => push("/trainer/add")}
    >
      <div className="d-flex align-items-center">
        <PlusLg className="mr-2" />
        &nbsp; Add a New Training Job
      </div>
    </Button>
  );
};

export default AddJobButton;
