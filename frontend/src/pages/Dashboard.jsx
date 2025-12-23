import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Home, CreditCard, Menu, X, Bell, Wrench, CheckCircle, Phone, Shield, Zap, Droplet, Flame, User, MessageSquare
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import ChatTab from './ChatTab';

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState({});
  const [bills, setBills] = useState([]);
  const [notices, setNotices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  
  // Desktop Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Mobile Sidebar State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [activeTab, setActiveTab] = useState('overview');

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
      fetchComplaints(parsedUser.token);
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

  // --- FIXED PAYMENT HANDLER ---
  const handlePayment = async (billAmount, billId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // 1. Create Order
      const { data: order } = await axios.post('/api/bills/create-order', { amount: billAmount }, config);

      // 2. Configure Options
      const options = {
        key: "rzp_test_RqD258d3jIqnzq", // Your Key
        amount: order.amount,
        currency: "INR",
        name: "Society Connect",
        description: "Maintenance Bill",
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify Payment
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              billId: billId
            };
            await axios.post('/api/bills/verify-payment', verifyData, config);
            
            toast.success("Payment Successful! Email Sent.");
            fetchBills(user.token); // Refresh bills to show 'Paid'
          } catch (error) {
            console.error("Verification Error", error);
            toast.error("Payment Verification Failed");
          }
        },
        prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone
        },
        theme: { color: "#4F46E5" },
      };

      // 4. Open Razorpay
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      console.error("Payment Start Error:", error);
      toast.error("Payment failed to start.");
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/complaints', complaintForm, config);
      toast.success('Ticket Raised Successfully!');
      setComplaintForm({ title: '', description: '', category: 'Plumbing' });
      fetchComplaints(user.token);
    } catch (error) {
      toast.error('Failed to raise ticket');
    }
  };

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  const emergencyContacts = [
    { name: "Main Gate Security", phone: "+91 98765 43210", icon: <Shield className="text-blue-500" />, desc: "24/7 Guard" },
    { name: "Society Secretary", phone: "+91 99887 76655", icon: <Phone className="text-green-500" />, desc: "Admin Office" },
    { name: "Lift Technician", phone: "+91 12345 67890", icon: <Wrench className="text-orange-500" />, desc: "Otis Support" },
    { name: "Plumber", phone: "+91 11223 34455", icon: <Droplet className="text-cyan-500" />, desc: "On-Call" },
    { name: "Electrician", phone: "+91 55667 78899", icon: <Zap className="text-yellow-500" />, desc: "On-Call" },
    { name: "Fire Brigade", phone: "101", icon: <Flame className="text-red-500" />, desc: "Emergency" },
  ];

  const handleNavClick = (tabName) => {
    setActiveTab(tabName);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
      
      {/* 1. DESKTOP SIDEBAR */}
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
          <SidebarItem icon={<MessageSquare size={20} />} text="Group Chat" active={activeTab === 'chat'} isOpen={isSidebarOpen} onClick={() => setActiveTab('chat')} />
          <SidebarItem icon={<Bell size={20} />} text="Community" active={activeTab === 'community'} isOpen={isSidebarOpen} onClick={() => setActiveTab('community')} />
          <SidebarItem icon={<Wrench size={20} />} text="Helpdesk" active={activeTab === 'helpdesk'} isOpen={isSidebarOpen} onClick={() => setActiveTab('helpdesk')} />
          <SidebarItem icon={<Phone size={20} />} text="Directory" active={activeTab === 'directory'} isOpen={isSidebarOpen} onClick={() => setActiveTab('directory')} />
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={logoutHandler} className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.div>

      {/* 2. MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              className="relative w-64 h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Society App</h1>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                <SidebarItem icon={<Home size={20} />} text="Overview" active={activeTab === 'overview'} isOpen={true} onClick={() => handleNavClick('overview')} />
                <SidebarItem icon={<CreditCard size={20} />} text="My Bills" active={activeTab === 'bills'} isOpen={true} onClick={() => handleNavClick('bills')} />
                <SidebarItem icon={<MessageSquare size={20} />} text="Group Chat" active={activeTab === 'chat'} isOpen={true} onClick={() => handleNavClick('chat')} />
                <SidebarItem icon={<Bell size={20} />} text="Community" active={activeTab === 'community'} isOpen={true} onClick={() => handleNavClick('community')} />
                <SidebarItem icon={<Wrench size={20} />} text="Helpdesk" active={activeTab === 'helpdesk'} isOpen={true} onClick={() => handleNavClick('helpdesk')} />
                <SidebarItem icon={<Phone size={20} />} text="Directory" active={activeTab === 'directory'} isOpen={true} onClick={() => handleNavClick('directory')} />
              </nav>
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <button onClick={logoutHandler} className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 glass flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="md:hidden p-2 mr-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-200">
              Welcome, {user.name?.split(' ')[0]}
            </h2>
          </div>
          <div className="flex items-center">
              {/* NEW: Edit Profile Button */}
              <button onClick={() => setShowProfileModal(true)} className="p-2 mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                  <User size={20} />
              </button>
              
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                  {theme === 'dark' ? '🌙' : '☀️'}
              </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
           
           {/* TAB 1 & 2: BILLS */}
           {(activeTab === 'overview' || activeTab === 'bills') && (
             <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-slate-800 dark:text-white">Your Bills</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bills.length > 0 ? bills.map((bill) => (
                  <div key={bill._id} className="glass p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                     <div className="flex justify-between items-start mb-4">
                       <div className="p-3 bg-indigo-50 dark:bg-slate-700 rounded-lg">
                         <CreditCard className="text-indigo-600 dark:text-indigo-400" size={24} />
                       </div>
                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bill.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                         {bill.status.toUpperCase()}
                       </span>
                     </div>
                     <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{bill.title}</h4>
                     <p className="text-slate-500 text-sm mb-4">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                     <div className="flex items-center justify-between mt-4">
                       <span className="text-2xl font-bold text-slate-900 dark:text-white">₹ {bill.amount}</span>
                       {bill.status === 'pending' ? (
                         <button 
                           onClick={() => handlePayment(bill.amount, bill._id)}
                           className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-80 transition"
                         >
                           Pay Now
                         </button>
                       ) : (
                         <div className="flex items-center text-green-500"><CheckCircle size={18} className="mr-1"/> Paid</div>
                       )}
                     </div>
                  </div>
                )) : <div className="glass p-12 text-center text-slate-500">No pending bills.</div>}
                </div>
             </div>
           )}

           {activeTab === 'chat' && (
              <div className="max-w-4xl mx-auto">
                <ChatTab user={user} />
              </div>
           )}

           {activeTab === 'community' && <div><h3 className="text-xl sm:text-2xl font-bold mb-6 text-slate-800 dark:text-white">Community Notices</h3>
              <div className="max-w-3xl mx-auto space-y-6">
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
           </div>}

           {activeTab === 'helpdesk' && (
             <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
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
               <div>
                 <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Your Tickets</h3>
                 <div className="space-y-4">
                   {complaints.map(ticket => (
                     <div key={ticket._id} className="glass p-4 rounded-xl border-l-4 border-l-orange-500">
                       <div className="flex justify-between items-start">
                         <span className="text-xs font-bold uppercase bg-orange-100 text-orange-600 px-2 py-1 rounded">{ticket.category}</span>
                         {ticket.status === 'resolved' ? <span className="flex items-center text-green-600 text-sm font-bold"><CheckCircle size={16} className="mr-1"/> Resolved</span> : <span className="text-sm text-slate-400">Open</span>}
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

           {activeTab === 'directory' && (
             <div>
               <h3 className="text-xl sm:text-2xl font-bold mb-6 text-slate-800 dark:text-white">Emergency Directory</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {emergencyContacts.map((contact, index) => (
                   <motion.div 
                      key={index} 
                      whileHover={{ scale: 1.02 }}
                      className="glass p-6 rounded-xl flex items-center justify-between"
                   >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full text-2xl">
                          {contact.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white">{contact.name}</h4>
                          <p className="text-sm text-slate-500">{contact.desc}</p>
                        </div>
                      </div>
                      <a 
                        href={`tel:${contact.phone}`} 
                        className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-lg transition"
                      >
                        <Phone size={20} />
                      </a>
                   </motion.div>
                 ))}
               </div>
             </div>
           )}
        </main>
        
        {/* EDIT PROFILE MODAL RENDERED HERE */}
        {showProfileModal && <EditProfileModal user={user} close={() => setShowProfileModal(false)} updateUser={setUser} />}
        
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, text, active, isOpen, onClick }) => (
  <div onClick={onClick} className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
    {icon} {isOpen && <span className="ml-3 font-medium">{text}</span>}
  </div>
);

// --- NEW COMPONENT: EDIT PROFILE MODAL ---
const EditProfileModal = ({ user, close, updateUser }) => {
    const [form, setForm] = useState({ name: user.name, phone: user.phone || '', flatNumber: user.flatNumber || '' });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.put('/api/users/profile', form, config);
            
            // Update Local Storage
            const updatedUser = { ...user, ...data };
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            updateUser(updatedUser); // Update Parent State
            
            toast.success("Profile Updated!");
            close();
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass w-full max-w-md p-6 rounded-xl relative">
                <button onClick={close} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X /></button>
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Edit Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-sm text-slate-500">Name</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field"/></div>
                    <div><label className="text-sm text-slate-500">Phone</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field"/></div>
                    <div><label className="text-sm text-slate-500">Flat Number</label><input type="text" value={form.flatNumber} onChange={e => setForm({...form, flatNumber: e.target.value})} className="input-field"/></div>
                    <button className="bg-indigo-600 text-white w-full py-3 rounded-lg font-bold hover:bg-indigo-700">Save Changes</button>
                </form>
            </motion.div>
        </div>
    );
};

export default Dashboard;