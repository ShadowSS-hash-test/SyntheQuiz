import { create } from "zustand";
import axiosInstance from "../util/axiosInstance";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
    user: null,
    loading: false,
    checkingAuth: true,

    signup: async ({ first_name, last_name, email, password, user_type }) => {
        set({ loading: true });
        try {
            const res = await axiosInstance.post("/users/register", {
                first_name, last_name, email, password, user_type
            });
            set({ loading: false, user: res.data.user });
            toast.success("Signed up successfully");
        } catch (error) {
            set({ loading: false });
            toast.error(error.response?.data?.detail || error.response?.data?.message || "An error occurred");
        }
    },

    login: async ({ email, password }) => {
        set({ loading: true });
        try {
            const res = await axiosInstance.post("/users/login", { email, password });
            set({ loading: false, user: res.data.user });
            toast.success("Logged in successfully");
        } catch (error) {
            set({ loading: false });
            toast.error(error.response?.data?.detail || error.response?.data?.message || "An error occurred");
        }
    },

    checkAuth: async () => {
        set({ checkingAuth: true });
        try {
            const res = await axiosInstance.get("/users/me");
            set({ user: res.data, checkingAuth: false });
        } catch (error) {
            console.log(error.message);
            set({ checkingAuth: false, user: null });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/users/logout");
            toast.success("Logged out successfully");
            set({ user: null });
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.detail || error.response?.data?.message || "An error occurred during logout");
        }
    },

    updateProfile: async (updates) => {
        set({ loading: true });
        try {
            const id = get().user?.user_id;
            const res = await axiosInstance.patch(`/users/${id}`, updates);
            set({ loading: false, user: { ...get().user, ...res.data } });
            toast.success("Profile updated successfully");
            return true;
        } catch (error) {
            set({ loading: false });
            toast.error(error.response?.data?.detail || error.response?.data?.message || "Failed to update profile");
            return false;
        }
    },

    deleteAccount: async () => {
        set({ loading: true });
        try {
            const id = get().user?.user_id;
            await axiosInstance.delete(`/users/${id}`);
            set({ loading: false, user: null });
            toast.success("Account deleted successfully");
        } catch (error) {
            set({ loading: false });
            toast.error(error.response?.data?.detail || error.response?.data?.message || "Failed to delete account");
        }
    },
}));

export default useUserStore;