import AddJobButton from "./AddJobButton";
import JobCard from "./JobCard";

const SideBar: React.FC = () => {
  return (
    <>
      <AddJobButton />
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
    </>
  );
};

export default SideBar;
