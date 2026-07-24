import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Search, Database, Calendar } from 'lucide-react';

const Documents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState([]);

  // Mock data - replace with GET /rag/documents
  useEffect(() => {
    setDocuments([
      { id: 1, filename: 'CS201_Syllabus_Fall2026.pdf', courseCode: 'CS201', uploadedAt: '2026-07-20', size: '1.2 MB' },
      { id: 2, filename: 'Lecture_4_Trees_and_Graphs.docx', courseCode: 'CS201', uploadedAt: '2026-07-21', size: '3.4 MB' },
      { id: 3, filename: 'Cell_Division_Notes_Ch5.pdf', courseCode: 'BIO301', uploadedAt: '2026-07-22', size: '5.1 MB' },
      { id: 4, filename: 'Intro_to_Python_Syntax.txt', courseCode: 'CS101', uploadedAt: '2026-07-23', size: '45 KB' },
    ]);
  }, []);

  const handleDelete = (id) => {
    // TODO: Wire up to DELETE /rag/documents/{id}
    setDocuments((docs) => docs.filter((doc) => doc.id !== id));
  };

  const filteredDocs = documents.filter(doc => 
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-20">
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

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search files or courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800/60 border border-gray-600/40 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
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
                <th className="px-6 py-4 font-semibold">Course</th>
                <th className="px-6 py-4 font-semibold">Size</th>
                <th className="px-6 py-4 font-semibold">Uploaded</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-800/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                        <span className="text-sm font-semibold text-gray-200">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-700/50 border border-gray-600/50 text-gray-300 text-xs font-bold rounded-full">
                        {doc.courseCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {doc.size}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar size={14} />
                        {doc.uploadedAt}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
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
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">
                    No documents found matching "{searchQuery}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Documents;