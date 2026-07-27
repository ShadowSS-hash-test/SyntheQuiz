import React, { useState, useEffect, useRef } from 'react';
import { FileText, Trash2, Search, Database, Calendar, UploadCloud, AlertCircle, X, ChevronDown } from 'lucide-react';
import { useDocumentsStore } from '../stores/useDocumentStore';
import { useUserStore } from '../stores/useUserStore';
import useCourseStore from '../stores/useCourseStore'; // Import course store

const Documents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);
  
  const { documents, fetchDocuments, deleteDocument, uploadDocument, isLoading, isUploading } = useDocumentsStore();
  const { user } = useUserStore(); 
  const { courses, fetchCourses } = useCourseStore(); // Fetch courses for the dropdown

  // Modal States
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, docId: null });
  
  // Added courseId to modal state
  const [uploadModal, setUploadModal] = useState({ isOpen: false, file: null, customName: '', courseId: '' });

  useEffect(() => {
    fetchDocuments();
    fetchCourses();
  }, [fetchDocuments, fetchCourses]);

  // --- DELETE HANDLERS ---
  const handleDeleteClick = (documentId) => {
    setDeleteModal({ isOpen: true, docId: documentId });
  };

  const confirmDelete = async () => {
    const { docId } = deleteModal;
    setDeleteModal({ isOpen: false, docId: null });
    if (docId) {
      try {
        await deleteDocument(docId);
      } catch (error) {
        console.error("Delete failed", error);
      }
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, docId: null });
  };

  // --- UPLOAD HANDLERS ---
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const userId = user?.user_id || user?.id;
    if (!userId) {
      alert("User ID is missing. Please log in.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadModal({ 
      isOpen: true, 
      file: file, 
      customName: file.name,
      courseId: '' // Default to unassigned
    });
  };

  const confirmUpload = async () => {
    const userId = user?.user_id || user?.id;
    const { file, customName, courseId } = uploadModal;

    setUploadModal({ isOpen: false, file: null, customName: '', courseId: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      // Pass the courseId if one was selected
      await uploadDocument(file, userId, customName.trim() || file.name, courseId || null); 
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  const cancelUpload = () => {
    setUploadModal({ isOpen: false, file: null, customName: '', courseId: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredDocs = documents.filter(doc => 
    doc.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.course_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-20 relative">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">
            Knowledge Base
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Source Documents</h1>
          <p className="text-sm text-gray-400 mt-2">
            Manage files embedded in your vector database for RAG quizzes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search files or courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/60 border border-gray-600/40 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept=".pdf,.docx,.txt" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
          >
            <UploadCloud size={18} />
            {isUploading ? 'Processing...' : 'Upload File'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/40 border border-gray-600/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <FileText size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{documents.length}</p>
            <p className="text-xs text-gray-400 font-semibold uppercase">Total Files</p>
          </div>
        </div>
        <div className="bg-gray-800/40 border border-gray-600/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <Database size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">Active</p>
            <p className="text-xs text-gray-400 font-semibold uppercase">Vector Store</p>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700/60 bg-gray-800/60 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4 font-semibold">Filename</th>
                <th className="px-6 py-4 font-semibold">Course ID</th>
                <th className="px-6 py-4 font-semibold">Uploaded</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400 text-sm">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                      Loading documents...
                    </div>
                  </td>
                </tr>
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.document_id} className="hover:bg-gray-800/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                        <span className="text-sm font-semibold text-gray-200">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-700/50 border border-gray-600/50 text-gray-300 text-xs font-bold rounded-full">
                        {doc.course_id || 'Global (Unassigned)'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar size={14} />
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '--'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteClick(doc.document_id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        title="Delete document and remove from vector database"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400 text-sm">
                    No documents found matching "{searchQuery}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Upload/Rename Modal */}
      {uploadModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
          onClick={cancelUpload}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Configure Document</h3>
              <button onClick={cancelUpload} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Document Name
                </label>
                <input
                  type="text"
                  value={uploadModal.customName}
                  onChange={(e) => setUploadModal({ ...uploadModal, customName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Assign to Course (Optional)
                </label>
                <div className="relative">
                  <select
                    value={uploadModal.courseId}
                    onChange={(e) => setUploadModal({ ...uploadModal, courseId: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                  >
                    <option value="">-- No Course (Global) --</option>
                    {courses.map(course => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.course_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-800 bg-gray-900/50">
              <button 
                onClick={cancelUpload}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmUpload}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Upload File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
          onClick={cancelDelete}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Document?</h3>
              <p className="text-sm text-gray-400">
                This will permanently remove the document and all its embedded data from the vector database. This action cannot be undone.
              </p>
            </div>
            <div className="flex border-t border-gray-800">
              <button 
                onClick={cancelDelete}
                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-colors border-r border-gray-800"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Documents;