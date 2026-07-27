import { create } from 'zustand';
import axiosInstance from '../util/axiosInstance';
import toast from 'react-hot-toast';

export const useDocumentsStore = create((set, get) => ({
  documents: [],
  isLoading: false,
  isUploading: false,
  error: null,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get('/documents/'); 
      set({ documents: response.data || [], isLoading: false });
    } catch (error) {
      const errMsg = error.response?.data?.detail || 'Failed to fetch documents';
      set({ isLoading: false, error: errMsg });
      toast.error(errMsg);
    }
  },

 
  uploadDocument: async (file, userId, customName, courseId = null) => {
    set({ isUploading: true, error: null });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId); 
    
    // Append the custom name to the form data
    if (customName) {
      formData.append('custom_name', customName);
    }

    if (courseId) {
      formData.append('course_id', courseId);
    }
    
    try {
      const response = await axiosInstance.post('/quiz/upload_document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      await get().fetchDocuments();
      
      set({ isUploading: false });
      toast.success(response.data.message || 'Document uploaded successfully');
      
      return response.data;
    } catch (error) {
      const errMsg = error.response?.data?.detail || 'Failed to upload document';
      set({ isUploading: false, error: errMsg });
      toast.error(errMsg);
      throw error;
    }
  },

  deleteDocument: async (docId) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/documents/${docId}`);
      
      set((state) => ({
        documents: state.documents.filter((doc) => doc.document_id !== docId),
        isLoading: false
      }));
      
      toast.success('Document deleted successfully');
    } catch (error) {
      const errMsg = error.response?.data?.detail || 'Failed to delete document';
      set({ isLoading: false, error: errMsg });
      toast.error(errMsg);
    }
  }
}));