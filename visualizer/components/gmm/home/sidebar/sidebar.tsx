import Link from "next/link";
import { Button } from "react-bootstrap";
import { PlusLg } from "react-bootstrap-icons";
import JobCard from "./job-card";
import { z } from "zod";
import { responsePostGMMJobsSearch } from "~/services/route/gmm";
import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";

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

type Jobs = z.infer<typeof responsePostGMMJobsSearch>;

const SideBar: React.FC = () => {
  const [jobs, setJobs] = useState<Jobs>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Update jobs per 5 second
  useEffect(() => {
    const updateFunc = async () => {
      const res = await apiClient.searchGMMJobs({
        search_regex: searchQuery ? searchQuery : undefined,
      });
      setJobs(res);
    };
    updateFunc();
    const interval = setInterval(updateFunc, 5000);

    return () => clearInterval(interval);
  }, [searchQuery]);

  return (
    <div>
      <AddJobButton />
      {jobs.map((job) => (
        <JobCard
          key={job.uuid}
          name={job.name}
          status={job.status}
          nCompleted={job.trials_current}
          nTotal={job.trials_total}
          duration={job.duration}
          uuid={job.uuid}
        />
      ))}
    </div>
  );
};

export default SideBar;
