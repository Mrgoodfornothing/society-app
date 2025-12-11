import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Download, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

// Register Chart Components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminAnalytics = ({ residents, bills }) => {
  
  // 1. Calculate Real Stats
  const totalRevenue = bills.reduce((acc, bill) => acc + (bill.status === 'paid' ? bill.amount : 0), 0);
  const pendingAmount = bills.reduce((acc, bill) => acc + (bill.status === 'pending' ? bill.amount : 0), 0);
  const paidCount = bills.filter(b => b.status === 'paid').length;
  const pendingCount = bills.filter(b => b.status === 'pending').length;

  // 2. Chart Data Configuration
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], // Static for MVP, can be dynamic later
    datasets: [
      {
        label: 'Revenue Collection (₹)',
        data: [12000, 15000, 8000, 22000, 18000, totalRevenue || 5000], // Last one is real-ish
        backgroundColor: 'rgba(79, 70, 229, 0.7)',
        borderRadius: 6,
      },
    ],
  };

  const statusData = {
    labels: ['Paid Bills', 'Pending Bills'],
    datasets: [
      {
        data: [paidCount, pendingCount],
        backgroundColor: ['#10B981', '#F59E0B'],
        borderWidth: 0,
      },
    ],
  };

  // 3. Excel Export Logic
  const exportToExcel = () => {
    // Flatten data for Excel
    const dataToExport = bills.map(bill => ({
      Title: bill.title,
      Amount: bill.amount,
      Status: bill.status.toUpperCase(),
      Date: new Date(bill.createdAt).toLocaleDateString(),
      Resident_ID: bill.resident // In a real app, you'd match this ID to a Name
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financials");
    
    // Generate Buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    saveAs(data, `Society_Financials_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-700 dark:text-white">Financial Health</h3>
        <button 
          onClick={exportToExcel}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-lg"
        >
          <Download size={18} />
          <span>Export Report</span>
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-xl border-l-4 border-indigo-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm">Total Revenue</p>
                    <h3 className="text-2xl font-bold dark:text-white">₹ {totalRevenue}</h3>
                </div>
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><TrendingUp size={20} /></div>
            </div>
        </div>
        <div className="glass p-6 rounded-xl border-l-4 border-red-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm">Pending Dues</p>
                    <h3 className="text-2xl font-bold text-red-500">₹ {pendingAmount}</h3>
                </div>
                <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={20} /></div>
            </div>
        </div>
        <div className="glass p-6 rounded-xl border-l-4 border-green-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm">Collection Rate</p>
                    <h3 className="text-2xl font-bold text-green-500">
                       {paidCount + pendingCount > 0 ? ((paidCount / (paidCount + pendingCount)) * 100).toFixed(0) : 0}%
                    </h3>
                </div>
                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircle size={20} /></div>
            </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-xl">
          <h4 className="font-bold mb-4 text-slate-700 dark:text-white">Revenue Trend</h4>
          <Bar data={revenueData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="glass p-6 rounded-xl flex flex-col items-center">
          <h4 className="font-bold mb-4 text-slate-700 dark:text-white">Payment Status</h4>
          <div className="w-64">
            <Doughnut data={statusData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;