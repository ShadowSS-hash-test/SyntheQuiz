import React, { useState } from 'react';
import { User, Mail, Save, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';

const Profile = () => {
  // State for the updateable fields
  const [firstName, setFirstName] = useState('Dr. Alan');
  const [lastName, setLastName] = useState('Turing');
  
  // Read-only state (typically fetched from user session)
  const [email] = useState('alan.turing@university.edu');

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    

    
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Profile updated successfully.');
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    }, 1000);
  };

  const handleDeleteAccount = async () => {
    const isConfirmed = window.confirm(
      "Are you absolutely sure? This action cannot be undone. It will permanently delete your account, courses, documents, and generated quizzes."
    );

    if (isConfirmed) {
  
      console.log("Account deletion triggered.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">
          Account
        </p>
        <h1 className="text-3xl lg:text-4xl font-bold text-white">Profile Settings</h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* ── PERSONAL INFORMATION SETTINGS ───────────────────────────── */}
        <div className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-700/50">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Personal Information</h2>
              <p className="text-sm text-gray-400">Update your name and educator details</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 ml-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder-gray-500"
                  placeholder="Enter your first name"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 ml-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder-gray-500"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-gray-900/30 border border-gray-700/50 rounded-xl pl-11 pr-4 py-3 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 ml-1">Your email address cannot be changed.</p>
            </div>

            <div className="pt-4 flex items-center justify-between">
              {saveMessage ? (
                <span className="flex items-center gap-2 text-sm text-green-400 font-medium animate-fade-in-up">
                  <CheckCircle2 size={16} /> {saveMessage}
                </span>
              ) : (
                <span /> // Spacer
              )}
              
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* ── DANGER ZONE ─────────────────────────────────────────────────── */}
        <div className="bg-red-950/20 backdrop-blur-md border border-red-900/30 rounded-3xl p-8 shadow-xl mt-4">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-red-900/30">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Danger Zone</h2>
              <p className="text-sm text-red-400/80">Irreversible account actions</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="max-w-xl">
              <h3 className="text-base font-bold text-white mb-1">Delete Account</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Permanently delete your account and all associated data. This will immediately cascade and erase all your uploaded documents, generated quizzes, and courses.
              </p>
            </div>
            
            <button
              onClick={handleDeleteAccount}
              className="shrink-0 px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-semibold rounded-full shadow-lg hover:bg-red-600 hover:text-white hover:border-red-500 transition-all flex items-center gap-2"
            >
              <Trash2 size={18} />
              Delete Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;