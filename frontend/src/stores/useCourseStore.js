import { create } from "zustand";
import axiosInstance from "../util/axiosInstance";
import { toast } from "react-hot-toast";

export const useCourseStore = create((set, get) => ({
  courses: [],
  loading: false,
  error: null,

  // Fetch all courses 
  fetchCourses: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get("/courses/getAllCourses");
      set({ courses: res.data, loading: false });
    } catch (error) {
      set({ loading: false, error: error.message });
      toast.error("Failed to fetch courses");
    }
  },

  // Get a single course by ID
  getCourseById: async (courseId) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get(`/courses/${courseId}`);
      set({ loading: false });
      return res.data;
    } catch (error) {
      set({ loading: false });
      toast.error("Failed to load course details");
      return null;
    }
  },

  // Create a new course
  createCourse: async (courseData) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.post("/courses", courseData);
      set((state) => ({ 
        courses: [...state.courses, res.data], 
        loading: false 
      }));
      toast.success("Course created successfully!");
      return res.data;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.detail || "Failed to create course");
      return null;
    }
  },

  // Update a course
  updateCourse: async (courseId, updateData) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.patch(`/courses/${courseId}`, updateData);
      set((state) => ({
        courses: state.courses.map((c) => 
          c.course_id === courseId ? { ...c, ...res.data } : c
        ),
        loading: false
      }));
      toast.success("Course updated successfully");
      return res.data;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.detail || "Failed to update course");
      return null;
    }
  },

  // Delete a course
  deleteCourse: async (courseId) => {
    set({ loading: true });
    try {
      await axiosInstance.delete(`/courses/${courseId}`);
      set((state) => ({
        courses: state.courses.filter((c) => c.course_id !== courseId),
        loading: false
      }));
      toast.success("Course deleted successfully");
      return true;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.detail || "Failed to delete course");
      return false;
    }
  }
}));

export default useCourseStore;