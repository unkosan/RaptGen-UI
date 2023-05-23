import React from "react";
import { Badge, Card, ProgressBar } from "react-bootstrap";

type Props =
  | {
      name: string;
      status: "success" | "failure" | "pending";
    }
  | {
      name: string;
      status: "suspended" | "progress";
      totalEpoch: number;
      currentEpoch: number;
      duration: number;
      multiple?: {
        currentIndex: number;
        reiteration: number;
        totalDuration: number;
      };
    };

const JobCard: React.FC<Props> = (props) => {
  const { name, status } = props;
  let contentHead: JSX.Element = <Card.Title>{name}</Card.Title>;
  if (status === "progress") {
    const durationText = props.multiple
      ? "Total Duration " + props.multiple.totalDuration + " sec"
      : "Running for " + props.duration + " sec";
    contentHead = (
      <div className="d-flex justify-content-between">
        {contentHead}
        <div className="text-muted">{durationText}</div>
      </div>
    );
  } else {
    contentHead = (
      <div className="d-flex justify-content-between">
        {contentHead}
        <div>
          {status === "success" && <Badge bg="success">{status}</Badge>}
          {status === "failure" && <Badge bg="danger">{status}</Badge>}
          {status === "pending" && <Badge bg="warning">{status}</Badge>}
          {status === "suspended" && <Badge bg="warning">{status}</Badge>}
        </div>
      </div>
    );
  }

  let contentBody: JSX.Element = <></>;
  let contentFoot: JSX.Element = <></>;
  if (status === "progress" || status === "suspended") {
    contentBody = props.multiple ? (
      <>
        <Card>
          <Card.Body>
            <div className="d-flex justify-content-between">
              <Card.Title>Model No.{props.multiple.currentIndex}</Card.Title>
              <div className="text-muted">Running for {props.duration} sec</div>
            </div>
            <div>
              epoch {props.currentEpoch} / {props.totalEpoch}
            </div>
          </Card.Body>
          <ProgressBar now={(props.currentEpoch / props.totalEpoch) * 100} />
        </Card>
        iteration {props.multiple.currentIndex} / {props.multiple.reiteration}
      </>
    ) : (
      <>
        epoch {props.currentEpoch} / {props.totalEpoch}
      </>
    );
    contentFoot = props.multiple ? (
      <ProgressBar
        now={(props.multiple.currentIndex / props.multiple.reiteration) * 100}
      />
    ) : (
      <ProgressBar now={(props.currentEpoch / props.totalEpoch) * 100} />
    );
  }

  return (
    <Card className="mb-3">
      <Card.Body>
        {contentHead}
        {contentBody}
      </Card.Body>
      {contentFoot}
    </Card>
  );
};

// const JobCard: React.FC<Props> = (props) => {
//   const { name, status } = props;
//   let card: JSX.Element;
//   if (status === "success" || status === "failure" || status === "pending") {
//     card = (
//       <Card>
//         <Card.Body className={"mh-1"}>
//           <div className="d-flex justify-content-between">
//             <div>
//               <Card.Title>{name}</Card.Title>
//             </div>
//             <div>
//               {status === "success" && <Badge bg="success">{status}</Badge>}
//               {status === "failure" && <Badge bg="danger">{status}</Badge>}
//               {status === "pending" && <Badge bg="warning">{status}</Badge>}
//             </div>
//           </div>
//         </Card.Body>
//       </Card>
//     );
//   } else if (status === "suspended" || status === "progress") {
//     const { totalEpoch, currentEpoch, duration } = props;
//     const { multiple } = props;
//     if (multiple) {
//       const { currentIndex, totalDuration } = multiple;
//       card = (
//         <Card>
//           <Card.Body>
//             <div className="d-flex justify-content-between">
//               <div>
//                 <Card.Title>{name}</Card.Title>
//               </div>
//               <div className="text-muted">
//                 Total Duration {totalDuration} seconds
//               </div>
//             </div>
//             <Card>
//               <Card.Body>
//                 <div className="d-flex justify-content-between">
//                   <Card.Title>Model No.{currentIndex}</Card.Title>
//                   <div className="text-muted">
//                     Running for {duration} seconds
//                   </div>
//                 </div>
//                 <div className="d-flex justify-content-between">
//                   <div>
//                     {currentEpoch} / {totalEpoch} epochs
//                   </div>
//                 </div>
//               </Card.Body>
//               <div>
//                 <ProgressBar now={currentEpoch} max={totalEpoch} />
//               </div>
//             </Card>
//           </Card.Body>
//         </Card>
//       );
//     } else {
//       card = (
//         <Card>
//           <Card.Body>
//             <div className="d-flex justify-content-between">
//               <div>
//                 <Card.Title>{name}</Card.Title>
//               </div>
//               <div className="text-muted">Running for {duration} seconds</div>
//             </div>
//             <div className="d-flex justify-content-between">
//               <div>
//                 {currentEpoch} / {totalEpoch} epochs
//               </div>
//             </div>
//           </Card.Body>
//           <div>
//             <ProgressBar now={currentEpoch} max={totalEpoch} />
//           </div>
//         </Card>
//       );
//     }
//   } else {
//     console.log("Invalid status: ", status);
//     card = <></>;
//   }
//   return <div>{card}</div>;
// };

export default JobCard;
