import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  // FIX: Replaced JSX.Element with React.ReactElement to avoid relying on global JSX namespace.
  icon: React.ReactElement;
}

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.197-5.931m-3.803-3.803A4 4 0 017 10h12a4 4 0 013.803 5.931m-14.803-3.803A4 4 0 017 10h.01M17 10h.01" />
    </svg>
);

const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m0 0a7.5 7.5 0 100-11.494m0 11.494a7.5 7.5 0 110-11.494" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253V4.5a2.25 2.25 0 012.25-2.25h.008a2.25 2.25 0 012.25 2.25v1.753M12 6.253V4.5a2.25 2.25 0 00-2.25-2.25h-.008a2.25 2.25 0 00-2.25 2.25v1.753" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.753V21a2.25 2.25 0 01-2.25-2.25h-.008a2.25 2.25 0 01-2.25-2.25V15m4.5 3.753V21a2.25 2.25 0 002.25-2.25h.008a2.25 2.25 0 002.25-2.25V15" />
    </svg>
);

const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);


const navItems: NavItem[] = [
  { to: '/tro-ly-ai', label: 'Trợ lý AI', icon: <MicrophoneIcon /> },
  { to: '/ai-on-thi', label: 'AI ôn thi', icon: <BrainIcon /> },
  { to: '/ai-tao-de-thi', label: 'AI tạo đề thi', icon: <BookIcon /> },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const baseLinkClass = "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors duration-200";
  const activeLinkClass = "bg-blue-600 text-white";

  return (
    <div className={`relative bg-gray-800 text-white flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
            {isOpen && <span className="text-2xl font-bold">AI THCS</span>}
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                <div className={`transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`}>
                    <ChevronLeftIcon />
                </div>
            </button>
        </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
            title={item.label}
          >
            {item.icon}
            {isOpen && <span className="ml-4 font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;