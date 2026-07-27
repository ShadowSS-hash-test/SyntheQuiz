import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MyCourses from '../components/MyCourses';
import CreateQuiz from '../components/CreateQuiz';
import Documents from '../components/Documents';
import Profile from '../components/Profile';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('courses');

  const renderContent = () => {
    switch (activeTab) {
      case 'courses':
        return <MyCourses />;
      case 'create-quiz':
        return <CreateQuiz />;
      case 'documents':
        return <Documents />;
      case 'profile':
        return <Profile />;
      default:
        return <MyCourses />;
    }
  };

  return (
    // Changed min-h-screen to h-screen to lock the height.
    // This forces the main tag's overflow-y-auto to handle scrolling.
    <div className="h-screen w-full bg-gray-950 font-sans text-gray-100 flex overflow-hidden">
      {/* Fixed Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Dynamic Main Workspace */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
        {/* Background glow kept consistent with your other views */}
        <div className="pointer-events-none  inset-0 overflow-hidden fixed">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px]" />
        </div>
        
        <div className="relative z-10">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;