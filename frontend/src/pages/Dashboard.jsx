import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { LogOut, Home, CreditCard, Users, Menu, X, CheckCircle, Clock, Bell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState({});
  const [bills, setBills] = useState([]);
  const [notices, setNotices] = useState([]); // Store notices
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // Tab State

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/');
    } else {
      const parsedUser = JSON.parse(userInfo);
      setUser(parsedUser);
      fetchBills(parsedUser.token);
      fetchNotices(parsedUser.token); // Fetch notices
    }
  }, [navigate]);

  const fetchBills = async (token) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/bills/mybills', config);
      setBills(data);
    } catch (error) { console.error(error); }
  };

  const fetchNotices = async (token) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/notices', config);
      setNotices(data);
    } catch (error) { console.error(error); }
  };

  // Payment Logic (Same as before)
  const handlePayment = async (billAmount, billId) => {
     // ... (Keep your existing payment code here) ...
     // Since I can't copy-paste your exact previous payment code, 
     // PLEASE PASTE YOUR EXISTING handlePayment FUNCTION HERE
  };

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
      
      {/* SIDEBAR */}
      <motion.div animate={{ width: isSidebarOpen ? '250px' : '80px' }} className="h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col shadow-xl z-20">
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Society App</h1>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={<Home size={20} />} text="Overview" active={activeTab === 'overview'} isOpen={isSidebarOpen} onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={<CreditCard size={20} />} text="My Bills" active={activeTab === 'bills'} isOpen={isSidebarOpen} onClick={() => setActiveTab('bills')} />
          <SidebarItem icon={<Bell size={20} />} text="Community" active={activeTab === 'community'} isOpen={isSidebarOpen} onClick={() => setActiveTab('community')} />
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={logoutHandler} className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 glass flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Welcome back, {user.name} 👋</h2>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">{theme === 'dark' ? '🌙' : '☀️'}</button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 relative">
           
           {/* TAB 1: OVERVIEW & BILLS */}
           {(activeTab === 'overview' || activeTab === 'bills') && (
             <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Your Bills</h3>
                {bills.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* ... (Your Bill Mapping Code - Paste from previous file) ... */}
                    {/* Make sure to map over `bills` here and show the cards */}
                     {bills.map((bill) => (
                        <div key={bill._id} className="glass p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                           {/* ... bill details ... */}
                           <h4 className="font-bold dark:text-white">{bill.title}</h4>
                           <p className="text-slate-500">₹{bill.amount}</p>
                           {/* Simplified button for brevity in this snippet */}
                           <button className="bg-indigo-600 text-white px-4 py-2 rounded mt-2">Pay Now</button>
                        </div>
                     ))}
                  </div>
                ) : (
                  <div className="glass p-12 text-center text-slate-500">No pending bills.</div>
                )}
             </div>
           )}

           {/* TAB 2: COMMUNITY (NOTICES) */}
           {activeTab === 'community' && (
             <div className="max-w-3xl mx-auto space-y-6">
               <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Community Notices</h3>
               {notices.map((notice) => (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={notice._id} className="glass p-6 rounded-xl border-l-4 border-l-indigo-500">
                    <span className="text-xs font-bold uppercase bg-indigo-100 text-indigo-600 px-2 py-1 rounded">{notice.type}</span>
                    <h4 className="text-xl font-bold mt-2 text-slate-800 dark:text-white">{notice.title}</h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{notice.description}</p>
                    <p className="text-xs text-slate-400 mt-4">Posted on {new Date(notice.createdAt).toLocaleDateString()}</p>
                 </motion.div>
               ))}
               {notices.length === 0 && <p className="text-center text-slate-500">No notices yet.</p>}
             </div>
           )}
        </main>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, text, active, isOpen, onClick }) => (
  <div onClick={onClick} className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
    {icon}
    {isOpen && <span className="ml-3 font-medium">{text}</span>}
  </div>
);

export default Dashboard;