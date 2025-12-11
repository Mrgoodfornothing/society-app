import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  FileText, 
  Bell, 
  LogOut, 
  Plus, 
  LayoutDashboard,
  Search
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState({});

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/');
    } else {
      const parsedUser = JSON.parse(userInfo);
      if (parsedUser.role !== 'admin') {
        navigate('/dashboard'); // Kick non-admins out
      }
      setUser(parsedUser);
    }
  }, [navigate]);

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans transition-colors duration-300">
      
      {/* ADMIN SIDEBAR */}
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-20 shadow-xl">
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Admin Panel
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Residents" 
            active={activeTab === 'residents'} 
            onClick={() => setActiveTab('residents')} 
          />
          <SidebarItem 
            icon={<FileText size={20} />} 
            label="Manage Bills" 
            active={activeTab === 'bills'} 
            onClick={() => setActiveTab('bills')} 
          />
          <SidebarItem 
            icon={<Bell size={20} />} 
            label="Notices" 
            active={activeTab === 'notices'} 
            onClick={() => setActiveTab('notices')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={logoutHandler} className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 glass flex items-center justify-between px-8 z-10">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white capitalize">
            {activeTab} Management
          </h2>
          <div className="flex items-center space-x-4">
             <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
               {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {user.name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
           <div className="absolute top-0 left-0 w-full h-full bg-slate-50 dark:bg-slate-900 -z-10"></div>
           
           {/* RENDER CONTENT BASED ON TAB */}
           {activeTab === 'overview' && <OverviewTab />}
           {activeTab === 'residents' && <ResidentsTab />}
           {activeTab === 'bills' && <BillsTab />}
           {activeTab === 'notices' && <NoticesTab />}

        </main>
      </div>
    </div>
  );
};

// --- SUB COMPONENTS (PLACEHOLDERS FOR NOW) ---

const OverviewTab = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <StatCard title="Total Residents" value="12" icon={<Users />} color="bg-blue-500" />
    <StatCard title="Pending Dues" value="₹ 45,000" icon={<FileText />} color="bg-orange-500" />
    <StatCard title="Active Notices" value="3" icon={<Bell />} color="bg-purple-500" />
  </div>
);

const ResidentsTab = () => (
  <div className="glass p-8 rounded-xl text-center">
    <h3 className="text-xl text-slate-600 dark:text-slate-300">Resident List Loading...</h3>
    <p className="text-sm text-slate-400">We will connect the database here soon.</p>
  </div>
);

const BillsTab = () => (
  <div className="glass p-8 rounded-xl text-center">
    <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center mx-auto space-x-2 hover:bg-indigo-700 transition">
      <Plus size={20} />
      <span>Create New Bill</span>
    </button>
    <p className="mt-4 text-slate-500">Select a resident to generate a bill.</p>
  </div>
);

const NoticesTab = () => (
  <div className="glass p-8 rounded-xl text-center">
    <h3 className="text-xl text-slate-600 dark:text-slate-300">Notice Board</h3>
    <p className="text-sm text-slate-400">Announcements will appear here.</p>
  </div>
);

// --- UI HELPERS ---

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${
      active 
      ? 'bg-indigo-50 text-indigo-600 dark:bg-slate-700 dark:text-indigo-400 font-medium shadow-sm' 
      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const StatCard = ({ title, value, icon, color }) => (
  <motion.div whileHover={{ y: -5 }} className="glass p-6 rounded-xl flex items-center space-x-4">
    <div className={`p-4 rounded-lg text-white shadow-lg ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-sm">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
    </div>
  </motion.div>
);

export default AdminDashboard;