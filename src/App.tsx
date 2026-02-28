import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Package, 
  Users, 
  MessageSquare, 
  LogOut, 
  Plus, 
  Search, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Weight, 
  DollarSign,
  User as UserIcon,
  LayoutDashboard,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, UserRole, Load, Truck as TruckType, Message, Review } from './types';
import { TRUCK_TYPES } from './constants';
import { format } from 'date-fns';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Context ---
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Components ---

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">TruckFlow</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                    {user.name[0]}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900 leading-none">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">Login</Link>
                <Link to="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(user.role === 'shipper' ? [
      { to: '/post-load', label: 'Post a Load', icon: Plus },
      { to: '/my-loads', label: 'My Loads', icon: Package },
    ] : []),
    ...(user.role === 'driver' ? [
      { to: '/search-loads', label: 'Search Loads', icon: Search },
      { to: '/post-truck', label: 'Post Truck', icon: Truck },
    ] : []),
    ...(user.role === 'admin' ? [
      { to: '/admin/users', label: 'Manage Users', icon: Users },
      { to: '/admin/all-loads', label: 'All Loads', icon: Package },
    ] : []),
    { to: '/messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] hidden md:block">
      <div className="p-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center space-x-3 px-3 py-2.5 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-all group"
          >
            <link.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{link.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
};

// --- Pages ---

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <UserIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500">Sign in to manage your logistics</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Sign In
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-gray-500">
          Don't have an account? <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};

const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: '', password: '', role: 'shipper' as UserRole, name: '', company: '', phone: ''
  });
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(formData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-500">Join the TruckFlow network today</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" required 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" required 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'shipper'})}
                  className={cn(
                    "py-2 px-4 rounded-lg border text-sm font-medium transition-all",
                    formData.role === 'shipper' ? "bg-indigo-50 border-indigo-600 text-indigo-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  Shipper
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'driver'})}
                  className={cn(
                    "py-2 px-4 rounded-lg border text-sm font-medium transition-all",
                    formData.role === 'driver' ? "bg-indigo-50 border-indigo-600 text-indigo-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  Driver / Carrier
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
              <input 
                type="text" 
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors mt-4"
          >
            Create Account
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ activeLoads: 0, completedLoads: 0, totalUsers: 0 });

  useEffect(() => {
    fetch('/api/stats', {
      headers: { 'Authorization': user?.id.toString() || '' }
    }).then(res => res.json()).then(setStats);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-500">Here's what's happening with your logistics today.</p>
      </header>

      {!user?.is_approved && user?.role !== 'admin' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-3">
          <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Account Pending Approval</p>
            <p className="text-sm text-amber-700">An admin will review your profile shortly. You can still browse loads but cannot post or apply yet.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Active Loads</p>
          <p className="text-3xl font-bold text-gray-900">{stats.activeLoads}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-50 p-2 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Completed Deliveries</p>
          <p className="text-3xl font-bold text-gray-900">{stats.completedLoads}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-50 p-2 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Network Users</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Package className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New load posted in Chicago, IL</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <span className="text-xs font-semibold text-indigo-600">$1,200</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to={user?.role === 'shipper' ? '/post-load' : '/search-loads'} className="p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors group">
              <Plus className="h-6 w-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-bold text-indigo-900">{user?.role === 'shipper' ? 'Post New Load' : 'Find Loads'}</p>
            </Link>
            <Link to="/messages" className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group">
              <MessageSquare className="h-6 w-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-bold text-green-900">Open Chat</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostLoadPage = () => {
  const [formData, setFormData] = useState({
    pickup_location: '', delivery_location: '', weight: '', truck_type: TRUCK_TYPES[0], rate: '', contact_details: ''
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/loads', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': user?.id.toString() || ''
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) navigate('/my-loads');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Post a New Load</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input 
                  type="text" required 
                  value={formData.pickup_location}
                  onChange={(e) => setFormData({...formData, pickup_location: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="City, State"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input 
                  type="text" required 
                  value={formData.delivery_location}
                  onChange={(e) => setFormData({...formData, delivery_location: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="City, State"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
              <div className="relative">
                <Weight className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input 
                  type="text" required 
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="45,000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Truck Type</label>
              <select 
                value={formData.truck_type}
                onChange={(e) => setFormData({...formData, truck_type: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input 
                  type="number" required 
                  value={formData.rate}
                  onChange={(e) => setFormData({...formData, rate: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="1500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Details</label>
              <input 
                type="text" required 
                value={formData.contact_details}
                onChange={(e) => setFormData({...formData, contact_details: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Phone or Email"
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors mt-6"
          >
            Post Load
          </button>
        </form>
      </div>
    </div>
  );
};

const MyLoadsPage = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const { user } = useAuth();

  const fetchMyLoads = async () => {
    const res = await fetch('/api/shipper/loads', {
      headers: { 'Authorization': user?.id.toString() || '' }
    });
    const data = await res.json();
    setLoads(data);
  };

  useEffect(() => {
    fetchMyLoads();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`/api/loads/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': user?.id.toString() || '' }
    });
    if (res.ok) fetchMyLoads();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Posted Loads</h2>
        <Link to="/post-load" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Post New Load</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Route</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rate</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loads.map((load) => (
              <tr key={load.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{load.pickup_location}</span>
                    <span className="text-xs text-gray-400">to</span>
                    <span className="text-sm font-bold text-gray-900">{load.delivery_location}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    <p>{load.truck_type}</p>
                    <p className="text-xs text-gray-400">{load.weight} lbs</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-gray-900">${load.rate}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    load.status === 'available' ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  )}>
                    {load.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleDelete(load.id)} className="text-red-600 hover:text-red-800 text-sm font-bold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PostTruckPage = () => {
  const [formData, setFormData] = useState({
    current_location: '', truck_type: TRUCK_TYPES[0], availability_date: '', contact: ''
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/trucks', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': user?.id.toString() || ''
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) navigate('/dashboard');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Post Your Truck Availability</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
            <input 
              type="text" required 
              value={formData.current_location}
              onChange={(e) => setFormData({...formData, current_location: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="City, State"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Truck Type</label>
            <select 
              value={formData.truck_type}
              onChange={(e) => setFormData({...formData, truck_type: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Available Date</label>
            <input 
              type="date" required 
              value={formData.availability_date}
              onChange={(e) => setFormData({...formData, availability_date: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
            <input 
              type="text" required 
              value={formData.contact}
              onChange={(e) => setFormData({...formData, contact: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Phone or Email"
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors mt-6">
            Post Truck
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { user } = useAuth();

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': user?.id.toString() || '' }
    });
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id: number) => {
    const res = await fetch(`/api/admin/users/${id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': user?.id.toString() || '' }
    });
    if (res.ok) fetchUsers();
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm capitalize text-gray-600">{u.role}</span>
                </td>
                <td className="px-6 py-4">
                  {u.is_approved ? (
                    <span className="text-green-600 text-xs font-bold">Approved</span>
                  ) : (
                    <span className="text-amber-600 text-xs font-bold">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {!u.is_approved && (
                    <button onClick={() => handleApprove(u.id)} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-700">Approve</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminAllLoadsPage = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetch('/api/loads').then(res => res.json()).then(setLoads);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">All Platform Loads</h2>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Route</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Shipper</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Rate</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loads.map((l) => (
              <tr key={l.id}>
                <td className="px-6 py-4 text-sm font-medium">{l.pickup_location} → {l.delivery_location}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{l.shipper_name}</td>
                <td className="px-6 py-4 text-sm font-bold">${l.rate}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-600">{l.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const MessagesPage = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchMessages = async () => {
    if (!selectedChat) return;
    const res = await fetch(`/api/messages/${selectedChat}`, {
      headers: { 'Authorization': user?.id.toString() || '' }
    });
    const data = await res.json();
    setMessages(data);
  };

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': user?.id.toString() || ''
      },
      body: JSON.stringify({ receiverId: selectedChat, content: newMessage })
    });
    if (res.ok) {
      setNewMessage('');
      fetchMessages();
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-white">
      <div className="w-80 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Messages</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {/* Placeholder chat list */}
          {[1, 2, 3].map(i => (
            <button 
              key={i}
              onClick={() => setSelectedChat(i)}
              className={cn(
                "w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3",
                selectedChat === i && "bg-indigo-50"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">U</div>
              <div>
                <p className="text-sm font-bold text-gray-900">User {i}</p>
                <p className="text-xs text-gray-500 truncate">Last message preview...</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedChat ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">U</div>
              <h4 className="font-bold text-gray-900">User {selectedChat}</h4>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map(m => (
                <div key={m.id} className={cn(
                  "max-w-[70%] p-3 rounded-2xl text-sm",
                  m.sender_id === user?.id ? "bg-indigo-600 text-white ml-auto rounded-tr-none" : "bg-white text-gray-900 rounded-tl-none shadow-sm"
                )}>
                  {m.content}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700">Send</button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SearchLoadsPage = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [filters, setFilters] = useState({ pickup: '', delivery: '', type: '' });
  const { user } = useAuth();

  const fetchLoads = async () => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`/api/loads?${params}`);
    const data = await res.json();
    setLoads(data);
  };

  useEffect(() => {
    fetchLoads();
  }, []);

  const handleApply = async (loadId: number) => {
    const res = await fetch(`/api/loads/${loadId}/apply`, {
      method: 'POST',
      headers: { 'Authorization': user?.id.toString() || '' }
    });
    if (res.ok) alert('Application sent!');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input 
            type="text" placeholder="Pickup Location" 
            className="px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.pickup} onChange={(e) => setFilters({...filters, pickup: e.target.value})}
          />
          <input 
            type="text" placeholder="Delivery Location" 
            className="px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.delivery} onChange={(e) => setFilters({...filters, delivery: e.target.value})}
          />
          <select 
            className="px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}
          >
            <option value="">All Truck Types</option>
            {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button 
            onClick={fetchLoads}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loads.map((load) => (
          <motion.div 
            layout
            key={load.id} 
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider">{load.truck_type}</span>
              <span className="text-lg font-bold text-gray-900">${load.rate}</span>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Pickup</p>
                  <p className="text-sm font-bold text-gray-900">{load.pickup_location}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Delivery</p>
                  <p className="text-sm font-bold text-gray-900">{load.delivery_location}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                  <UserIcon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-gray-600">{load.shipper_name}</span>
              </div>
              <button 
                onClick={() => handleApply(load.id)}
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('truckflow_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setUser(data);
    localStorage.setItem('truckflow_user', JSON.stringify(data));
  };

  const signup = async (formData: any) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setUser(data);
    localStorage.setItem('truckflow_user', JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('truckflow_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/post-load" element={<PrivateRoute><PostLoadPage /></PrivateRoute>} />
                <Route path="/my-loads" element={<PrivateRoute><MyLoadsPage /></PrivateRoute>} />
                <Route path="/search-loads" element={<PrivateRoute><SearchLoadsPage /></PrivateRoute>} />
                <Route path="/post-truck" element={<PrivateRoute><PostTruckPage /></PrivateRoute>} />
                <Route path="/admin/users" element={<PrivateRoute><AdminUsersPage /></PrivateRoute>} />
                <Route path="/admin/all-loads" element={<PrivateRoute><AdminAllLoadsPage /></PrivateRoute>} />
                <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                {/* Add more routes as needed */}
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}
