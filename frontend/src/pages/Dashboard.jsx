import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { LogOut, Home, CreditCard, Menu, X, Bell, Wrench, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState({});
  const [bills, setBills] = useState([]);
  const [notices, setNotices] = useState([]);
  const [complaints, setComplaints] = useState([]); // <--- NEW STATE
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Complaint Form State
  const [complaintForm, setComplaintForm] = useState({ title: '', description: '', category: 'Plumbing' });

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/');
    } else {
      const parsedUser = JSON.parse(userInfo);
      setUser(parsedUser);
      fetchBills(parsedUser.token);
      fetchNotices(parsedUser.token);
      fetchComplaints(parsedUser.token); // <--- FETCH ON LOAD
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

  const fetchComplaints = async (token) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/complaints/my', config);
      setComplaints(data);
    } catch (error) { console.error(error); }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/complaints', complaintForm, config);
      toast.success('Ticket Raised Successfully!');
      setComplaintForm({ title: '', description: '', category: 'Plumbing' });
      fetchComplaints(user.token); // Refresh list
    } catch (error) {
      toast.error('Failed to raise ticket');
    }
  };

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  // Payment Logic Placeholder (Keep your existing Razorpay logic here)
  const handlePayment = (amount, id) => { /* ... */ };

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
          <SidebarItem icon={<Wrench size={20} />} text="Helpdesk" active={activeTab === 'helpdesk'} isOpen={isSidebarOpen} onClick={() => setActiveTab('helpdesk')} />
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
           
           {/* TAB 1 & 2: BILLS (Simplified for brevity, keep your code) */}
           {(activeTab === 'overview' || activeTab === 'bills') && (
             <div><h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Your Bills</h3>
             {/* ... Your Bill Grid Here ... */}
             </div>
           )}

           {/* TAB 3: NOTICES (Keep your code) */}
           {activeTab === 'community' && <div><h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Community Notices</h3>
             {/* ... Your Notice List Here ... */}
           </div>}

           {/* TAB 4: HELPDESK (NEW) */}
           {activeTab === 'helpdesk' && (
             <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
               
               {/* FORM */}
               <div className="glass p-6 rounded-xl h-fit">
                 <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Raise a Ticket</h3>
                 <form onSubmit={handleComplaintSubmit} className="space-y-4">
                   <div>
                     <label className="text-sm text-slate-500">Category</label>
                     <select className="input-field mt-1" value={complaintForm.category} onChange={(e) => setComplaintForm({...complaintForm, category: e.target.value})}>
                       <option>Plumbing</option><option>Electrical</option><option>Security</option><option>Cleanliness</option><option>Other</option>
                     </select>
                   </div>
                   <input type="text" placeholder="Title (e.g., Leaking Tap)" className="input-field" required value={complaintForm.title} onChange={(e) => setComplaintForm({...complaintForm, title: e.target.value})} />
                   <textarea placeholder="Describe the issue..." className="input-field h-24" required value={complaintForm.description} onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}></textarea>
                   <button className="bg-indigo-600 text-white w-full py-3 rounded-lg font-bold hover:bg-indigo-700 transition">Submit Ticket</button>
                 </form>
               </div>

               {/* LIST */}
               <div>
                 <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Your Tickets</h3>
                 <div className="space-y-4">
                   {complaints.map(ticket => (
                     <div key={ticket._id} className="glass p-4 rounded-xl border-l-4 border-l-orange-500">
                       <div className="flex justify-between items-start">
                         <span className="text-xs font-bold uppercase bg-orange-100 text-orange-600 px-2 py-1 rounded">{ticket.category}</span>
                         {ticket.status === 'resolved' ? 
                           <span className="flex items-center text-green-600 text-sm font-bold"><CheckCircle size={16} className="mr-1"/> Resolved</span> : 
                           <span className="text-sm text-slate-400">Open</span>
                         }
                       </div>
                       <h4 className="font-bold mt-2 dark:text-white">{ticket.title}</h4>
                       <p className="text-sm text-slate-500 mt-1">{ticket.description}</p>
                     </div>
                   ))}
                   {complaints.length === 0 && <p className="text-slate-500">No tickets raised yet.</p>}
                 </div>
               </div>
             </div>
           )}

        </main>
      </div>
    </div>
  );
};

// Helper
const SidebarItem = ({ icon, text, active, isOpen, onClick }) => (
  <div onClick={onClick} className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
    {icon} {isOpen && <span className="ml-3 font-medium">{text}</span>}
  </div>
);

export default Dashboard;