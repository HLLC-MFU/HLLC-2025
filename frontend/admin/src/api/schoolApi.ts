import { Schools } from "@/types/schools";
import { axiosInstance } from "./axiosInstance";
import { endpoints } from "./endpoints";

export const getSchools = () => axiosInstance.get(endpoints.schools);

export const getSchoolById = (id: number) =>
  axiosInstance.get(`${endpoints.schools}/${id}`);

export const createSchool = (data: Schools) =>
  axiosInstance.post(endpoints.schools, data);

export const updateSchool = (id: number, data: Schools) =>
  axiosInstance.put(`${endpoints.schools}/${id}`, data);

export const deleteSchool = (id: number) =>
  axiosInstance.delete(`${endpoints.schools}/${id}`);
