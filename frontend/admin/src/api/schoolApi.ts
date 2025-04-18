import { axiosInstance } from "./axiosInstance";
import { endpoints } from "./endpoints";

export const getSchools = () => axiosInstance.get(endpoints.schools);

export const getSchoolById = (id: string) =>
  axiosInstance.get(`${endpoints.schools}/${id}`);

export const createSchool = (data: any) =>
  axiosInstance.post(endpoints.schools, data);

export const updateSchool = (id: string, data: any) =>
  axiosInstance.put(`${endpoints.schools}/${id}`, data);

export const deleteSchool = (id: string) =>
  axiosInstance.delete(`${endpoints.schools}/${id}`);
