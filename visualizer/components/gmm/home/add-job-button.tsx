import Link from "next/link";
import { Button } from "react-bootstrap";
import { PlusLg } from "react-bootstrap-icons";

const AddJobButton: React.FC = () => {
  return (
    <Link href="/gmm/add" style={{ textDecoration: "none" }}>
      <Button variant="primary text-start" className="d-grid gap-2 w-100">
        <div className="d-flex align-items-center">
          <PlusLg className="mr-2" />
          &nbsp; Add a New Training Job
        </div>
      </Button>
    </Link>
  );
};

export default AddJobButton;
