import AddJobButton from "./AddJobButton";
import JobCard from "./JobCard";
import ChildJobCard from "./job-card/child-job-card";
import JobCardAlt from "./job-card/job-card";

const SideBar: React.FC = () => {
  return (
    <>
      <AddJobButton />
      <div style={{ height: "1rem" }} />
      <legend>Running</legend>
      <JobCard
        name={"aloha"}
        status="suspended"
        currentEpoch={341}
        totalEpoch={1000}
        duration={20}
        multiple={{
          currentIndex: 1,
          reiteration: 10,
          totalDuration: 100,
        }}
      />
      <JobCardAlt />
    </>
  );
};

export default SideBar;
