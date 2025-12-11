import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { 
  Users, FileText, Bell, LogOut, Plus, LayoutDashboard, X, Check, MessageCircle, Wrench, CheckCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState({});
  const [residents, setResidents] = useState([]); // List of residents
  
  // Modal State
  const [showBillModal, setShowBillModal] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/');
    } else {
      const parsedUser = JSON.parse(userInfo);
      if (parsedUser.role !== 'admin') {
        navigate('/dashboard');
      }
      setUser(parsedUser);
      fetchResidents(parsedUser.token); // Load residents on start
    }
  }, [navigate]);

  const fetchResidents = async (token) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/users', config);
      setResidents(data);
    } catch (error) {
      console.error(error);
    }
  };

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans transition-colors duration-300">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-20 shadow-xl hidden md:flex">
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Admin Panel</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={<Users size={20} />} label="Residents" active={activeTab === 'residents'} onClick={() => setActiveTab('residents')} />
          <SidebarItem icon={<FileText size={20} />} label="Manage Bills" active={activeTab === 'bills'} onClick={() => setActiveTab('bills')} />
          <SidebarItem icon={<Bell size={20} />} label="Notices" active={activeTab === 'notices'} onClick={() => setActiveTab('notices')} />
          <SidebarItem icon={<Wrench size={20} />} label="Helpdesk" active={activeTab === 'helpdesk'} onClick={() => setActiveTab('helpdesk')} />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={logoutHandler} className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 glass flex items-center justify-between px-8 z-10">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white capitalize">{activeTab} Management</h2>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
             {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative">
           <div className="absolute top-0 left-0 w-full h-full bg-slate-50 dark:bg-slate-900 -z-10"></div>
           
           {activeTab === 'overview' && <OverviewTab residentsCount={residents.length} />}
           {activeTab === 'residents' && <ResidentsTab residents={residents} />}
           {activeTab === 'bills' && <BillsTab residents={residents} openModal={() => setShowBillModal(true)} />}
           {activeTab === 'notices' && <NoticesTab />}
           {activeTab === 'helpdesk' && <HelpdeskTab />}
        </main>
      </div>

      {/* CREATE BILL MODAL */}
      {showBillModal && (
        <CreateBillModal 
          residents={residents} 
          closeModal={() => setShowBillModal(false)} 
          token={user.token} 
        />
      )}
    </div>
  );
};

// --- SUB COMPONENTS ---

const OverviewTab = ({ residentsCount }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <StatCard title="Total Residents" value={residentsCount} icon={<Users />} color="bg-blue-500" />
    <StatCard title="Total Revenue" value="₹ 0" icon={<FileText />} color="bg-green-500" />
  </div>
);

const ResidentsTab = ({ residents }) => (
  <div className="glass p-6 rounded-xl">
    <h3 className="font-bold mb-4 text-slate-700 dark:text-white">Resident List</h3>
    <table className="w-full text-left">
      <thead>
        <tr className="text-slate-400 text-sm border-b border-slate-200 dark:border-slate-700">
          <th className="pb-3">Name</th>
          <th className="pb-3">Flat</th>
          <th className="pb-3">Phone</th>
        </tr>
      </thead>
      <tbody>
        {residents.map((r) => (
          <tr key={r._id} className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-3 text-slate-700 dark:text-slate-300">{r.name}</td>
            <td className="py-3 text-slate-500">{r.flatNumber}</td>
            <td className="py-3 text-slate-500">{r.phone}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const BillsTab = ({ residents, openModal }) => (
  <div className="glass p-8 rounded-xl text-center">
    <div className="mb-6">
      <h3 className="text-xl font-bold text-slate-700 dark:text-white">Billing Center</h3>
      <p className="text-slate-500">Issue maintenance bills to residents.</p>
    </div>
    <button onClick={openModal} className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center mx-auto space-x-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30">
      <Plus size={20} />
      <span>Create New Bill</span>
    </button>
  </div>
);

// --- NOTICES TAB (With WhatsApp Share) ---
const NoticesTab = () => {
  const [notices, setNotices] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', type: 'info' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/notices', config);
      setNotices(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post('/api/notices', formData, config);
      toast.success('Notice Posted!');
      setFormData({ title: '', description: '', type: 'info' });
      fetchNotices();
    } catch (error) {
      toast.error('Failed to post notice');
    }
    setLoading(false);
  };

  const shareToWhatsApp = (notice) => {
    const text = `📢 *Society Notice: ${notice.title}*\n\n${notice.description}\n\n- Secretary`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 1. CREATE FORM */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Post New Announcement</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <input 
            type="text" 
            placeholder="Title (e.g., Water Tank Cleaning)" 
            className="input-field"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
          <textarea 
            placeholder="Description..." 
            className="input-field h-24"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          ></textarea>
          <div className="flex items-center space-x-4">
            <select 
              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="info">ℹ️ Info</option>
              <option value="urgent">🚨 Urgent</option>
              <option value="event">🎉 Event</option>
            </select>
            <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition w-full">
              {loading ? 'Posting...' : 'Post Notice'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. NOTICE LIST */}
      <div className="grid gap-4">
        {notices.map((notice) => (
          <div key={notice._id} className="glass p-5 rounded-xl border-l-4 border-l-indigo-500 relative">
             <div className="flex justify-between items-start">
                <div>
                   <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                      notice.type === 'urgent' ? 'bg-red-100 text-red-600' : 
                      notice.type === 'event' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                   }`}>{notice.type}</span>
                   <h4 className="text-lg font-bold mt-2 text-slate-800 dark:text-white">{notice.title}</h4>
                   <p className="text-slate-600 dark:text-slate-300 mt-1">{notice.description}</p>
                   <p className="text-xs text-slate-400 mt-2">{new Date(notice.createdAt).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => shareToWhatsApp(notice)}
                  className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition shadow-lg"
                  title="Share to WhatsApp Group"
                >
                  <MessageCircle size={20} />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- HELPDESK TAB (NEW FEATURE) ---
const HelpdeskTab = () => {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/complaints/all', config);
      setTickets(data);
    } catch (error) {
      console.error(error);
    }
  };

  const markResolved = async (id) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`/api/complaints/${id}`, { status: 'resolved' }, config);
      toast.success('Ticket Marked Resolved');
      fetchTickets(); // Refresh
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  return (
    <div className="grid gap-4">
      {tickets.map(ticket => (
        <div key={ticket._id} className="glass p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-bold uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded">{ticket.category}</span>
              <span className="text-sm text-slate-500">Raised by: <span className="font-bold text-indigo-600">{ticket.resident?.name} ({ticket.resident?.flatNumber})</span></span>
            </div>
            <h4 className="text-lg font-bold dark:text-white">{ticket.title}</h4>
            <p className="text-slate-600 dark:text-slate-400">{ticket.description}</p>
          </div>
          
          {ticket.status === 'open' ? (
            <button onClick={() => markResolved(ticket._id)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition shadow-lg whitespace-nowrap">
              Mark Resolved
            </button>
          ) : (
             <span className="flex items-center text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200 whitespace-nowrap">
               <CheckCircle size={16} className="mr-1"/> Resolved
             </span>
          )}
        </div>
      ))}
      {tickets.length === 0 && <div className="glass p-8 text-center text-slate-500">No active complaints.</div>}
    </div>
  );
};

// --- MODAL COMPONENT ---
const CreateBillModal = ({ residents, closeModal, token }) => {
  const [formData, setFormData] = useState({
    residentId: '',
    title: 'Monthly Maintenance',
    amount: '',
    dueDate: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('/api/bills', formData, config);
      toast.success('Bill Created Successfully!');
      closeModal();
    } catch (error) {
      toast.error('Failed to create bill');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass w-full max-w-lg p-6 rounded-xl relative">
        <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X /></button>
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Issue New Bill</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-500 mb-1">Select Resident</label>
            <select 
              required
              className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-indigo-500"
              onChange={(e) => setFormData({...formData, residentId: e.target.value})}
            >
              <option value="">-- Choose Flat --</option>
              {residents.map(r => (
                <option key={r._id} value={r._id}>{r.name} - {r.flatNumber}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-500 mb-1">Bill Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Amount (₹)</label>
              <input type="number" required placeholder="2000" onChange={(e) => setFormData({...formData, amount: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Due Date</label>
              <input type="date" required onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="input-field" />
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition mt-4">
            Generate Bill
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// Helper
const SidebarItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${active ? 'bg-indigo-50 text-indigo-600 dark:bg-slate-700 dark:text-indigo-400 font-medium' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
    {icon} <span>{label}</span>
  </button>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className="glass p-6 rounded-xl flex items-center space-x-4">
    <div className={`p-4 rounded-lg text-white shadow-lg ${color}`}>{icon}</div>
    <div><p className="text-slate-500 text-sm">{title}</p><h3 className="text-2xl font-bold dark:text-white">{value}</h3></div>
  </div>
);

export default AdminDashboard;