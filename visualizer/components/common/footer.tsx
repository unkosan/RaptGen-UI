// export const Footer: React.FC = () => {
//   return (
//     <footer className="fixed-bottom">
//       <div className="container d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top">
//         <div className="col-md-4 d-flex align-items-center">
//           <p>Test</p>
//         </div>
//         <ul className="nav col-md-4 justify-content-end list-unstyled d-flex">
//           <li className="ms-3">
//             <a href="#">Home</a>
//           </li>
//           <li className="ms-3">
//             <a href="#">GitHub</a>
//           </li>
//         </ul>
//       </div>
//     </footer>
//   );
// };

// import React from "react";

export const Footer: React.FC = () => {
  const footerStyle = {
    // position: "absolute" as const,
    // bottom: 0,
    // left: 0,
    // width: "100%",
    // backgroundColor: "dark",
    // padding: "1rem",
    // color: "white",
    marginTop: "auto",
  };

  return (
    <footer style={footerStyle} className="">
      <div className="container mt-2">
        <div className="row">
          <div className="mx-auto text-white">
            <p className="text-muted">Place footer content here.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
