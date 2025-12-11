import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import Axios
import { motion } from 'framer-motion';
import { LogOut, Home, CreditCard, Users, Menu, X, CheckCircle, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState({});
  const [bills, setBills] = useState([]); // Store bills here
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    
    if (!userInfo) {
      navigate('/');
    } else {
      const parsedUser = JSON.parse(userInfo);
      setUser(parsedUser);
      fetchBills(parsedUser.token); // Fetch bills on load
    }
  }, [navigate]);

  // Function to get bills from Backend
  const fetchBills = async (token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const { data } = await axios.get('/api/bills/mybills', config);
      setBills(data);
    } catch (error) {
      console.error("Error fetching bills", error);
    }
  };

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  // Handle the Payment Button Click
  const handlePayment = async (billAmount, billId) => {
    try {
      // 1. Create Order
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data: order } = await axios.post('/api/payment/order', { amount: billAmount }, config);

      // 2. Configure Razorpay Options
      const options = {
        key: "rzp_test_RqD258d3jIqnzq", // <--- PASTE YOUR KEY ID HERE (Use public key only)
        amount: order.amount,
        currency: "INR",
        name: "Society Connect",
        description: "Maintenance Bill",
        order_id: order.id,
        handler: async function (response) {
          // 3. Verify Payment on Backend
          try {
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              billId: billId
            };
            await axios.post('/api/payment/verify', verifyData, config);
            
            toast.success("Payment Successful!");
            fetchBills(user.token); // Refresh the list to show "Paid"
          } catch (error) {
            toast.error("Payment Verification Failed");
          }
        },
        theme: {
          color: "#4F46E5",
        },
      };

      // 4. Open the Popup
      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (error) {
      console.error(error);
      toast.error("Something went wrong with payment");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
      
      {/* SIDEBAR */}
      <motion.div 
        animate={{ width: isSidebarOpen ? '250px' : '80px' }}
        className="h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col shadow-xl z-20"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Society App</h1>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={<Home size={20} />} text="Overview" active isOpen={isSidebarOpen} />
          <SidebarItem icon={<CreditCard size={20} />} text="My Bills" isOpen={isSidebarOpen} />
          <SidebarItem icon={<Users size={20} />} text="Community" isOpen={isSidebarOpen} />
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={logoutHandler} className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20 transition-colors">
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 glass z-10 flex items-center justify-between px-6 sticky top-0">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            Welcome back, {user.name?.split(' ')[0]} 👋
          </h2>
          <div className="flex items-center space-x-4">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
               {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {user.name?.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 relative">
           <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
           
           <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Your Bills</h3>
              
              {/* BILLS LIST */}
              {bills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bills.map((bill) => (
                    <motion.div 
                      key={bill._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all"
                    >
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
                          <div className="flex items-center text-green-500">
                            <CheckCircle size={18} className="mr-1"/> Paid
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // EMPTY STATE
                <div className="glass p-12 rounded-xl text-center flex flex-col items-center">
                   <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                     <Clock className="w-8 h-8 text-slate-400" />
                   </div>
                   <h4 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-200">No Pending Bills</h4>
                   <p className="text-slate-500">You are all caught up!</p>
                </div>
              )}
           </div>
        </main>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, text, active, isOpen }) => (
  <div className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
    {icon}
    {isOpen && <span className="ml-3 font-medium">{text}</span>}
  </div>
);

export default Dashboard;