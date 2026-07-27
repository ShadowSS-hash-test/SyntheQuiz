import React from 'react';
import Navbar from '../components/Navbar'; // Adjust path if needed
import hom1 from '../assets/hom1.jpg';
import { Brain, Upload, Sparkles, Check, ArrowRight } from "lucide-react";
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const BrainIcon   = () => <Brain size={20} />;
const UploadIcon  = () => <Upload size={20} />;
const SparkleIcon = () => <Sparkles size={20} />;
const ArrowIcon   = () => <ArrowRight size={18} />;

// --- Helper Components with Glass Effect ---
const FeatureCard = ({ icon, title, description }) => (
  <div className="rounded-3xl p-6 border border-gray-500/30 bg-gray-800/40 backdrop-blur-md flex flex-col gap-3 hover:border-blue-500/50 hover:bg-gray-800/60 transition-all duration-300 shadow-xl">
    <div className="w-10 h-10 rounded-2xl bg-gray-800/80 border border-gray-600/50 text-blue-400 flex items-center justify-center shadow-sm">
      {icon}
    </div>
    <h3 className="font-bold text-white text-base">{title}</h3>
    <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
  </div>
);

const StatPill = ({ value, label }) => (
  <div className="flex flex-col items-center px-6 py-4 bg-gray-800/40 backdrop-blur-md rounded-2xl shadow-lg border border-gray-500/30 hover:bg-gray-800/60 transition-colors">
    <span className="text-2xl font-black text-white">{value}</span>
    <span className="text-xs text-gray-400 mt-0.5">{label}</span>
  </div>
);

const Homepage = () => {
  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-100 overflow-hidden">
      
      {/* Imported Navigation Component */}
      <Navbar />

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Column */}
        <div className="max-w-xl animate-fade-in-up delay-200">
          <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6 text-white">
            <span className="text-blue-500">Generate custom quizzes</span>
            <br />
            and master any topic instantly
          </h1>
          
          <p className="text-lg text-gray-400 mb-10 leading-relaxed max-w-md">
            Upload your notes or enter a topic to instantly generate tailored questions using AI. Handpick the best questions, build your ultimate quiz, and accelerate your learning experience.
          </p>

          {/* Integration/Trusted Logos Mimic */}
          <div className="flex items-center space-x-8 mb-10 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
             <div className="font-bold text-xl flex items-center space-x-1 text-gray-300"><span className="w-5 h-5 bg-green-500 rounded-sm inline-block shadow-[0_0_10px_rgba(34,197,94,0.4)]"></span><span>Upload</span></div>
             <div className="font-bold text-xl flex items-center space-x-1 text-gray-300"><span className="w-5 h-5 bg-purple-500 rounded-sm inline-block shadow-[0_0_10px_rgba(168,85,247,0.4)]"></span><span>Generate</span></div>
             <div className="font-bold text-xl flex items-center space-x-1 text-gray-300"><span className="w-5 h-5 bg-red-500 rounded-full inline-block shadow-[0_0_10px_rgba(239,68,68,0.4)]"></span><span>Refine</span></div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to={"/dashboard"}>
               <button className="px-8 py-4 text-base font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center">
              Start generating <span className="ml-2 font-normal">›</span>
            </button>
            
            </Link>
         
          
          </div>
        </div>

        {/* Right Column */}
        <div className="relative mt-12 lg:mt-0 animate-fade-in-up delay-400">
          <div className="relative rounded-3xl overflow-hidden aspect-4/3 bg-gray-800 border border-gray-700 shadow-2xl">
            <img 
              src={hom1}
              alt="Student laughing and studying on laptop" 
              className="w-full h-full object-cover object-center opacity-90"
            />
            <div className="absolute inset-0 bg-linear-to-tr from-gray-900/40 to-transparent"></div>
          </div>

          {/* Floating Card 1 (Top Left) */}
          <div className="absolute -top-8 -left-8 bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-500/30 w-48 flex flex-col items-center animate-float">
            <div className="relative w-24 h-24 mb-4">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-gray-700/50 stroke-current" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent"></circle>
                <circle className="text-blue-500 stroke-current" strokeWidth="10" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset="50.24" transform="rotate(-90 50 50)"></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">12</span>
              </div>
            </div>
            <p className="text-sm font-bold text-center text-white">Questions Kept</p>
            <p className="text-xs text-gray-300 text-center">Current Quiz</p>
          </div>

          {/* Floating Card 2 (Bottom Right) */}
          <div className="absolute -bottom-8 -right-8 bg-gray-800/50 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-gray-500/30 w-64 animate-float-delayed">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded text-[10px] flex items-center justify-center bg-blue-900/50 text-blue-400">✓</span>
                    <span className="text-xs font-bold text-gray-100">Cell Biology</span>
                  </div>
                </div>
                <div className="w-full bg-gray-700/60 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full w-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded text-[10px] flex items-center justify-center bg-gray-700/60 text-gray-300">Gen</span>
                    <span className="text-xs font-bold text-gray-100">Genetics</span>
                  </div>
                </div>
                <div className="w-full bg-gray-700/60 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full w-[60%] shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                </div>
              </div>
               <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded text-[10px] flex items-center justify-center bg-gray-700/60 text-gray-300">+</span>
                    <span className="text-xs font-bold text-gray-100">Add Custom Topic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── STATS STRIP ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-16 animate-fade-in-up [animation-delay:600ms]">
        <div className="bg-gray-800/40 backdrop-blur-md rounded-3xl border border-gray-500/30 px-8 py-6 flex flex-wrap justify-around gap-6 shadow-2xl">
          <StatPill value="2 paths"  label="Plain text + RAG" />
          <StatPill value="< 10s"    label="Quiz generation time" />
          <StatPill value="100 pg"   label="Max document size" />
          <StatPill value="∞"        label="Questions per session" />
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-12 pb-20 animate-fade-in-up [animation-delay:800ms]">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">What you get</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            Built for learners who care
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<UploadIcon />}
            title="Upload your notes"
            description="PDF, DOCX, or TXT — SyntheQuiz chunks and embeds your documents so every question is grounded in what you actually need to learn."
          />
          <FeatureCard
            icon={<SparkleIcon />}
            title="Describe any topic"
            description="No document? No problem. Type a topic and difficulty level and get a full quiz generated from the AI's knowledge in seconds."
          />
          <FeatureCard
            icon={<BrainIcon />}
            title="Curate & save"
            description="Generate multiple question sets, hand-pick the best questions from each, and save your curated final quiz — ready to practice."
          />
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how" className="max-w-7xl mx-auto px-6 lg:px-12 pb-24 animate-fade-in-up [animation-delay:1000ms]">
        <div className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-3xl px-10 py-12 text-white shadow-2xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl font-bold">Three steps, done.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: "01", title: "Upload or describe", body: "Drop in your course material or type a topic. SyntheQuiz handles the rest." },
              { step: "02", title: "Generate & review", body: "Get 5–30 questions instantly. Review them, remove what doesn't fit, add more if needed." },
              { step: "03", title: "Save your quiz", body: "Save your curated question set linked to a subject. Pick it up anytime to study." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col gap-3">
                <span className="text-5xl font-extrabold text-blue-500/80 drop-shadow-md">{s.step}</span>
                <h3 className="font-bold text-white text-lg">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-24 animate-fade-in-up [animation-delay:1200ms]">
        <div
          className="rounded-3xl px-10 py-16 text-center relative overflow-hidden shadow-2xl border border-blue-500/30 bg-linear-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-xl"
        >
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-blue-500 opacity-20 blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-indigo-400 opacity-20 blur-2xl animate-pulse-slow" />
          
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 relative z-10">
            Ready to build better quizzes?
          </h2>
          <p className="text-blue-200 text-base mb-8 relative z-10 max-w-lg mx-auto">
            Free to start. Upload your first document and see the magic happen in seconds.
          </p>

          <Link to="/signup">

             <button className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 hover:cursor-pointer hover:bg-white hover:text-blue-900 font-bold text-sm px-8 py-4 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] relative z-10">
            Create your account <ArrowIcon />
          </button>
          
          
          </Link>
       
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <Footer></Footer>
   

    </div>
  );
}; 

export default Homepage;