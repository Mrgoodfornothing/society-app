import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion'; 
import { User, Mail, Lock, Phone, Home, LayoutDashboard } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    flatNumber: '',
    phone: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      // 1. Send data to Backend
      const { data } = await axios.post('/api/users', formData);
      
      // 2. Save Login info
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      toast.success('Registration Successful!');
      
      // 3. Go to Dashboard
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration Failed');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:bg-purple-900 dark:opacity-20"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 dark:bg-indigo-900 dark:opacity-20"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-md p-8 rounded-2xl relative z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 mb-2 shadow-lg">
             <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Join Society Connect</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Create your resident account</p>
        </div>

        <form onSubmit={submitHandler} className="space-y-4">
          <InputGroup icon={<User />} name="name" placeholder="Full Name" onChange={handleChange} />
          <InputGroup icon={<Mail />} name="email" type="email" placeholder="Email Address" onChange={handleChange} />
          <InputGroup icon={<Lock />} name="password" type="password" placeholder="Password" onChange={handleChange} />
          <div className="grid grid-cols-2 gap-4">
            <InputGroup icon={<Home />} name="flatNumber" placeholder="Flat No." onChange={handleChange} />
            <InputGroup icon={<Phone />} name="phone" placeholder="Phone" onChange={handleChange} />
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg mt-2 transition-all">
            Sign Up
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/" className="text-indigo-600 font-bold hover:underline">Login here</Link>
        </p>
      </motion.div>
    </div>
  );
};

// Reusable Input Component
const InputGroup = ({ icon, name, type = "text", placeholder, onChange }) => (
  <div className="relative">
    <div className="absolute top-3.5 left-3 text-slate-400 w-5 h-5">{icon}</div>
    <input
      required
      type={type}
      name={name}
      placeholder={placeholder}
      onChange={onChange}
      className="input-field !pl-12"
    />
  </div>
);

export default Register;