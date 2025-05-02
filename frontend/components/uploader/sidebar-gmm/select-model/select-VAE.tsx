// import React, { useEffect, useState } from "react";
// import { Form } from "react-bootstrap";
// import { useDispatch } from "react-redux";
// import { apiClient } from "~/services/api-client";

// type Props = {
//   setVaeName: React.Dispatch<React.SetStateAction<string>>;
//   setVaeIsValid: React.Dispatch<React.SetStateAction<boolean>>;
// };

// const SelectVAE: React.FC<Props> = (props) => {
//   const [value, setValue] = useState<string>("");
//   const [nameList, setNameList] = useState<string[]>([""]);

//   useEffect(() => {
//     if (value !== "") {
//       props.setVaeName(value);
//       props.setVaeIsValid(true);
//     } else {
//       props.setVaeIsValid(false);
//     }
//   }, [value]);

//   const dispatch = useDispatch();

//   // retrieve VAE model names
//   useEffect(() => {
//     (async () => {
//       const res = await apiClient.getVAEModelNames();
//       if (res.status === "success") {
//         setNameList(res.data);
//         if (res.data.length > 0) {
//           setValue(res.data[0]);
//         } else {
//           setValue("");
//         }
//       }
//     })();
//   }, []);

//   // retrieve VAE data
//   useEffect(() => {
//     (async () => {
//       if (value === "") {
//         return;
//       }

//       const res = await apiClient.getSelexData({
//         queries: {
//           VAE_model_name: value,
//         },
//       });

//       if (res.status === "success") {
//         const rawData = res.data;
//         const vaeData = rawData.Sequence.map((value, index) => {
//           return {
//             key: index,
//             sequence: value,
//             randomRegion: rawData.Without_Adapters[index],
//             duplicates: rawData.Duplicates[index],
//             coordX: rawData.coord_x[index],
//             coordY: rawData.coord_y[index],
//             isSelected: false,
//             isShown: true,
//           };
//         });

//         dispatch({
//           type: "vaeConfig/setShowMinCount",
//           payload: 3,
//         });

//         dispatch({
//           type: "vaeData/set",
//           payload: vaeData,
//         });
//       }
//     })();
//   }, [value]);

//   return (
//     <Form.Select
//       value={value}
//       onChange={(e) => setValue(e.currentTarget.value)}
//     >
//       {nameList.map((name) => (
//         <option key={name}>{name}</option>
//       ))}
//     </Form.Select>
//   );
// };

// export default SelectVAE;
