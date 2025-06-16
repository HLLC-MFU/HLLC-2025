// import React from "react";
// import {
//   Modal,
//   ModalContent,
//   ModalHeader,
//   ModalBody,
//   ModalFooter,
//   Button,
//   useDisclosure,
// } from "@heroui/react";

// export default function App() {
//   const {isOpen, onOpen, onClose} = useDisclosure();
//   const [backdrop, setBackdrop] = React.useState("opaque");

//   const backdrops = ["opaque", "blur", "transparent"];

//   const handleOpen = (backdrop) => {
//     setBackdrop(backdrop);
//     onOpen();
//   };

//   return (
//     <>
//       <div className="flex flex-wrap gap-3">
//         {backdrops.map((b) => (
//           <Button
//             key={b}
//             className="capitalize"
//             color="warning"
//             variant="flat"
//             onPress={() => handleOpen(b)}
//           >
//             {b}
//           </Button>
//         ))}
//       </div>
//       <Modal backdrop={backdrop} isOpen={isOpen} onClose={onClose}>
//         <ModalContent>
//           {(onClose) => (
//             <>
//               <ModalHeader className="flex flex-col gap-1">Modal Title</ModalHeader>
//               <ModalBody>
//                 <p>
//                   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non
//                   risus hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor
//                   quam.
//                 </p>
//               </ModalBody>
//               <ModalFooter>
//                 <Button color="danger" variant="light" onPress={onClose}>
//                   Close
//                 </Button>
//                 <Button color="primary" onPress={onClose}>
//                   Action
//                 </Button>
//               </ModalFooter>
//             </>
//           )}
//         </ModalContent>
//       </Modal>
//     </>
//   );
// }

