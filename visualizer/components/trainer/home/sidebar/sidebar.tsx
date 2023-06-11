import AddJobButton from "./add-job-button";
import JobCard from "./job-card/job-card";

const SideBar: React.FC = () => {
  return (
    <>
      <AddJobButton />
      <div style={{ height: "1rem" }} />
      <legend>Running</legend>
      <JobCard
        name={"aloha"}
        status="progress"
        isSelected={true}
        duration={1500}
        onClick={() => {
          console.log("clicked job card");
        }}
        onChildClick={(id) => {
          console.log(`clicked child job card ${id}`);
        }}
        series={[
          {
            id: 0,
            duration: 1000,
            status: "success",
            epochsCurrent: 492,
            epochsTotal: 1000,
          },
          {
            id: 1,
            duration: 400,
            status: "progress",
            epochsCurrent: 192,
            epochsTotal: 1000,
          },
        ]}
      />
      <legend>Finished</legend>
      <JobCard
        name={"aloha"}
        status="success"
        isSelected={false}
        duration={10000}
        series={[
          {
            id: 0,
            duration: 10000,
            status: "success",
            epochsCurrent: -1,
            epochsTotal: 1000,
          },
        ]}
      />
    </>
  );
};

export default SideBar;
