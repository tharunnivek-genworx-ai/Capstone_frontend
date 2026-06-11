import axiosClient from "../../../lib/axiosClient";

export interface TraineeOut {
  traineeid: string;
  email: string;
  fullname: string;
  employeeid: string | null;
  isactive: boolean;
}

export const mentorService = {
  async searchTrainees(query: string, limit = 20): Promise<TraineeOut[]> {
    const response = await axiosClient.get<TraineeOut[]>("/mentor/trainees/search", {
      params: { q: query, limit },
    });
    return response.data;
  },
};
