import axiosClient from "../../../lib/axiosClient";

export interface AdminDashboardStats {
  total_mentors: number;
  total_trainees: number;
  total_departments: number;
  active_mentors: number;
  active_trainees: number;
}

export const dashboardService = {
  async getStats(): Promise<AdminDashboardStats> {
    const response = await axiosClient.get<AdminDashboardStats>("/admin/dashboard/stats");
    return response.data;
  },
};
