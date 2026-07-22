import React from 'react'

const Footer = () => {
  return (
       <footer className="border-t border-gray-500/20 py-10 bg-gray-900/60 backdrop-blur-lg animate-fade-in [animation-delay:1400ms]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="text-lg font-extrabold tracking-widest uppercase text-white">
              Synthe<span className="text-blue-500">Quiz</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">{new Date().getFullYear()}</p>
          
          <div className="flex gap-6">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
  )
}

export default Footer