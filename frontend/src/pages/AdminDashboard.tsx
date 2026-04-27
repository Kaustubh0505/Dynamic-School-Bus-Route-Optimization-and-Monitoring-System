import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { Bus, Map, Users, AlertTriangle, Loader2, Info, Clock, AlertCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
// import { useToast } from '../context/ToastContext';
import { io, Socket } from 'socket.io-client';

interface DashboardMetrics {
  activeBuses: number;
  routesCompleted: number;
  studentsBoarded: number;
  alerts: number;
}

interface FleetBus {
  busId: string;
  driverName: string;
  status: string;
  capacity: number;
  currentLoad: number;
}

interface Alert {
  _id: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [fleet, setFleet] = useState<FleetBus[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  // const { showToast } = useToast();

  const fetchAdminData = useCallback(async () => {
    try {
      const [metricsRes, fleetRes, alertsRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/fleet'),
        api.get('/admin/alerts')
      ]);
      setMetrics(metricsRes.data);
      setFleet(fleetRes.data);
      setAlerts(alertsRes.data);
    } catch (err) {
      console.error('Failed to update admin dashboard', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
    
    // Connect to WebSocket server
    const socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      withCredentials: true
    });
    socketRef.current = socket;

    // Listen for global fleet events
    socket.on('fleet_location_update', () => {
      fetchAdminData(); // Refresh fleet metrics
    });

    socket.on('fleet_boarding_update', () => {
      fetchAdminData(); // Refresh boardings
    });

    return () => { 
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [fetchAdminData]);

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="font-medium animate-pulse">Syncing fleet telemetry...</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Active Buses', value: metrics?.activeBuses || 0, sub: 'Global fleet', icon: Bus, color: 'indigo' },
    { label: 'Routes Active', value: metrics?.routesCompleted || 0, sub: 'Currently tracking', icon: Map, color: 'emerald' },
    { label: 'Students Boarded', value: metrics?.studentsBoarded || 0, sub: 'Today total', icon: Users, color: 'purple' },
    { label: 'Active Alerts', value: metrics?.alerts || 0, sub: 'Requires attention', icon: AlertTriangle, color: 'amber' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">Fleet Monitoring</h2>
          <p className="text-gray-500 font-medium">Live operational oversight of school transit systems.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/manage"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
          >
            <Settings className="w-4 h-4" />
            Manage
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-bold bg-[#FFC107] border border-yellow-400 px-4 py-1.5 rounded-full text-gray-900 shadow-sm tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-pulse" />
            Real-Time Sync Ready
          </div>
        </div>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-yellow-200 hover:shadow-md transition-all">
            <div className={`absolute -top-4 -right-4 p-5 text-gray-100 opacity-[0.4] group-hover:text-yellow-100 transition-all duration-500 group-hover:scale-110`}>
              <Icon className="w-24 h-24" />
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 relative z-10">{label}</p>
            <h3 className="text-4xl font-black text-gray-900 relative z-10">{value}</h3>
            <p className="text-xs text-gray-400 mt-2 font-medium relative z-10">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fleet Table - 2 Columns */}
        <section className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#FFC107] rounded-full" />
              <h3 className="text-lg font-bold text-gray-900">Live Fleet Status</h3>
            </div>

          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="p-5">Bus Reg</th>
                  <th className="p-4">Command/Driver</th>
                  <th className="p-4">Pulse Status</th>
                  <th className="p-4">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {fleet.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-400 font-medium italic">No active buses detected in system logs.</td>
                  </tr>
                ) : (
                  fleet.map((bus, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                      <td className="p-5 font-mono text-sm font-black text-gray-900">{bus.busId}</td>
                      <td className="p-4 text-gray-600 font-semibold">{bus.driverName}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border shadow-sm ${bus.status === 'Maintenance' ? 'bg-amber-50 text-amber-600 border-amber-200' : bus.status === 'Route Complete' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                          {bus.status === 'Maintenance' && <AlertTriangle className="w-3 h-3 mr-1.5" />}
                          {bus.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className="h-full bg-[#FFC107] transition-all duration-1000" 
                              style={{ width: `${Math.min(100, (bus.currentLoad / bus.capacity) * 100)}%` }} 
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-gray-500">{bus.currentLoad}/{bus.capacity}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* System Alerts - 1 Column */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2 border-b border-gray-200 pb-4">
           <AlertTriangle className="w-5 h-5 text-[#FFC107]" />
           <h3 className="text-lg font-bold text-gray-900">System Feed</h3>
          </div>
          
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500">
                <Info className="w-8 h-8 mb-2 mx-auto font-light text-gray-300" />
                <p className="text-sm font-medium">No critical alerts detected.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert._id} className={`p-4 border rounded-2xl transition-all shadow-sm ${alert.severity === 'high' ? 'bg-red-50 border-red-200' : alert.severity === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg mt-0.5 shadow-sm ${alert.severity === 'high' ? 'bg-red-100 text-red-600' : alert.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                      {alert.type === 'DELAY' ? <Clock className="w-4 h-4" /> : alert.type === 'EMERGENCY' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold leading-snug ${alert.severity === 'high' ? 'text-red-900' : alert.severity === 'medium' ? 'text-amber-900' : 'text-gray-800'}`}>{alert.message}</p>
                      <p className={`text-[10px] mt-2 font-black uppercase tracking-wider ${alert.severity === 'high' ? 'text-red-500' : alert.severity === 'medium' ? 'text-amber-500' : 'text-gray-400'}`}>
                        {new Date(alert.createdAt).toLocaleTimeString()} · SECURE CHANNEL
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
