import axios from "axios";

const BASE_URL = "http://localhost:8080/api";

export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});