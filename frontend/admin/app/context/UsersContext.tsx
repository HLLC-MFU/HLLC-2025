// "use client"

// import React from 'react';

// interface UserType {
//     usersData: any;
//     setUsersData: (data: any) => void;
// }

// const UserContext = React.createContext<UserType | undefined>(undefined);

// export const UsersData = () => {
//     return React.useContext(UserContext);
// };

// export const UsersProvider = ({ children }: { children: React.ReactNode }) => {
//     const [usersData, setUsersData] = React.useState([]);

//     React.useEffect(() => {
//         const fetchUsers = async () => {
//             try {
//                 const res = await fetch("http://localhost:8080/api/users");
//                 const data = await res.json();
//                 setUsersData(data);
//             } catch (error) {
//                 console.log("Error: ", error);
//             }
//         };

//         fetchUsers();
//     }, [])

//     return (
//         <UserContext.Provider value={{ usersData, setUsersData }}>
//             {children}
//         </UserContext.Provider>
//     )
// };
