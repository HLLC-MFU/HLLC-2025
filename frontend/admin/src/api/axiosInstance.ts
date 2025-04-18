import axios from "axios";

const BASE_URL = "https://6801e55781c7e9fbcc43a6d0.mockapi.io/api";

export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});