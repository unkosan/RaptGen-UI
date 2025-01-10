import Link from "next/link";
import { Button } from "react-bootstrap";
import { PlusLg } from "react-bootstrap-icons";

const AddJobButton: React.FC = () => {
  return (
    <Link href="/gmm/add">
      <div className="d-grid gap-2">
        <Button variant="primary text-start">
          <div className="d-flex align-items-center">
            <PlusLg className="mr-2" />
            &nbsp; Add a New Training Job
          </div>
        </Button>
      </div>
    </Link>
  );
};

export default AddJobButton;
