import { Button } from "react-bootstrap";
import { Plus, PlusLg } from "react-bootstrap-icons";

const AddJobButton: React.FC = () => {
  return (
    <div className="d-grid gap-2">
      <Button variant="primary text-start">
        <PlusLg className="mr-2" />
        &nbsp; Add a New Training Job
      </Button>
    </div>
  );
};

export default AddJobButton;
