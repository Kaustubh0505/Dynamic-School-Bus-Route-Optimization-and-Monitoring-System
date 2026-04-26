import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../api/axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RefreshCw, CheckCircle, Clock, MapPin, Wifi, WifiOff, Users, UserCheck, UserX, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Fix default marker icons broken by Vite/webpack bundling
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const POLL_INTERVAL = 5000;

// Component to fly the map to updated coords
const MapPanner: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 1.2 });
  }, [lat, lng, map]);
  return null;
};

type AttendanceStatus = 'PRESENT' | 'ABSENT' | null;

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  location?: { lat: number; lng: number };
}

interface ChildBusInfo {
  student: StudentInfo;
  busAssignment: any;
}

const ParentDashboard: React.FC = () => {
  const [busId, setBusId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [children, setChildren] = useState<ChildBusInfo[]>([]);
  const [routeStops, setRouteStops] = useState<{ lat: number; lng: number; name: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [attendanceLoading, setAttendanceLoading] = useState<Record<string, boolean>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Step 1: Resolve bus for parent's children
  const resolveChildBus = useCallback(async () => {
    try {
      const res = await api.get('/buses/my-child-bus');
      const data: ChildBusInfo[] = res.data;
      setChildren(data);

      // Get bus ID from first child's assignment
      if (data.length > 0 && data[0].busAssignment?.busId) {
        const resolvedBusId = data[0].busAssignment.busId._id || data[0].busAssignment.busId;
        setBusId(resolvedBusId);
        return resolvedBusId;
      }
      return null;
    } catch (err) {
      console.error('Failed to resolve child bus', err);
      // Fallback: try to find any bus with tracking data
      try {
        const allBuses = await api.get('/buses');
        if (allBuses.data.length > 0) {
          const first = allBuses.data[0];
          setBusId(first._id);
          return first._id;
        }
      } catch (e) { /* ignore */ }
      return null;
    }
  }, []);

  const fetchLocation = useCallback(async (targetBusId?: string) => {
    const id = targetBusId || busId;
    if (!id) return;
    try {
      const res = await api.get(`/tracking/${id}`);
      if (res.data?.lat) {
        setLocation({ lat: res.data.lat, lng: res.data.lng });
        setLastUpdated(new Date());
        setIsLive(true);
      }
    } catch {
      setIsLive(false);
    }
  }, [busId]);

  const fetchRouteStops = useCallback(async (targetBusId?: string) => {
    const id = targetBusId || busId;
    if (!id) return;
    try {
      const res = await api.get(`/buses/${id}/students`);
      if (res.data?.route) {
        setRouteStops(res.data.route);
      }
    } catch (err) {
      console.error('Failed to fetch route stops', err);
    }
  }, [busId]);

  const fetchAttendanceForChildren = useCallback(async (childList: ChildBusInfo[]) => {
    for (const childInfo of childList) {
      try {
        const attRes = await api.get(`/attendance/${childInfo.student.id}`);
        if (attRes.data?.status) {
          setAttendanceMap(prev => ({ ...prev, [childInfo.student.id]: attRes.data.status }));
        }
      } catch (err) {
        // No attendance for today yet
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const resolvedBusId = await resolveChildBus();
      if (resolvedBusId) {
        await Promise.allSettled([
          fetchLocation(resolvedBusId),
          fetchRouteStops(resolvedBusId),
        ]);
      }
      // Fetch attendance for resolved children
      const res = await api.get('/buses/my-child-bus').catch(() => ({ data: [] }));
      if (res.data.length > 0) {
        await fetchAttendanceForChildren(res.data);
      }
      setLoading(false);
    };
    init();
  }, [resolveChildBus, fetchLocation, fetchRouteStops, fetchAttendanceForChildren]);

  // Start polling after initial load
  useEffect(() => {
    if (busId) {
      intervalRef.current = setInterval(() => fetchLocation(), POLL_INTERVAL);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [busId, fetchLocation]);

  const markAttendance = async (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    setAttendanceLoading(prev => ({ ...prev, [studentId]: true }));
    try {
      await api.post('/attendance/mark', { studentId, status });
      setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
      showToast(`Attendance marked as ${status}`, status === 'PRESENT' ? 'success' : 'info');
    } catch (err) {
      console.error('Attendance update failed:', err);
      showToast('Failed to update attendance. Please try again.', 'error');
    } finally {
      setAttendanceLoading(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const defaultCenter: [number, number] = location ? [location.lat, location.lng] : [40.7128, -74.0060];

  // Build route polyline coordinates
  const routePolyline: [number, number][] = routeStops.map(s => [s.lat, s.lng]);
  if (location) routePolyline.unshift([location.lat, location.lng]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Parent Portal</h2>
          <p className="text-gray-500">Live bus tracking, boarding status and attendance for your child.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${isLive ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {isLive ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isLive ? 'Live' : 'Offline'}
          </div>
          <button
            onClick={() => { fetchLocation(); fetchRouteStops(); }}
            className="p-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium pr-1">Refresh</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Map - takes 3 cols */}
        <section className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[480px]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50/50">
            <div className="flex items-center gap-2 text-gray-800 font-bold">
              <MapPin className="w-5 h-5 text-[#FFC107]" />
              Live Map
              {isLive && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-1" />}
            </div>
            {location && (
              <div className="text-xs font-mono text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-200 flex gap-3 shadow-sm">
                <span><span className="text-yellow-600 font-bold">LAT</span> {location.lat.toFixed(5)}</span>
                <span><span className="text-yellow-600 font-bold">LNG</span> {location.lng.toFixed(5)}</span>
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-3">
                <div className="w-8 h-8 border-2 border-[#FFC107] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm font-medium">Acquiring bus signal...</p>
              </div>
            ) : (
              <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ height: '100%', width: '100%', minHeight: '400px' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                {location && (
                  <>
                    <MapPanner lat={location.lat} lng={location.lng} />
                    <Marker position={[location.lat, location.lng]}>
                      <Popup className="font-sans">
                        <div className="text-center py-1">
                          <strong className="text-gray-900">🚌 School Bus</strong>
                          <p className="text-xs text-gray-500 mt-1">
                            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                          </p>
                          {lastUpdated && (
                            <p className="text-xs text-gray-400 mt-1">
                              Updated {lastUpdated.toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}

                {/* Route stop markers - Only showing your own children's stops */}
                {routeStops.map((stop, i) => {
                  const isMyChildStop = children.some(c => c.student.name === stop.name);
                  if (!isMyChildStop) return null;

                  return (
                    <Marker key={i} position={[stop.lat, stop.lng]}>
                      <Popup>
                        <div className="text-center py-1 font-sans">
                          <strong className="text-gray-900">📍 {stop.name} (Your Child)</strong>
                          <p className="text-xs text-gray-500 mt-1">Pickup: {stop.time}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Route polyline */}
                {routePolyline.length > 1 && (
                  <Polyline
                    positions={routePolyline}
                    pathOptions={{
                      color: '#FFC107',
                      weight: 4,
                      opacity: 0.8,
                      dashArray: '10, 8'
                    }}
                  />
                )}
              </MapContainer>
            )}
          </div>

          {!location && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-3 z-10 pointer-events-none">
              <MapPin className="w-12 h-12 text-gray-300" />
              <p className="text-gray-500 text-sm font-medium text-center px-4">No GPS signal yet.<br />Waiting for driver to update location.</p>
            </div>
          )}
        </section>

        {/* Child card - takes 2 cols */}
        <section className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-gray-900 mb-5 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FFC107]" />
            My Children
          </h3>

          <div className="space-y-4 flex-1">
            {children.length > 0 ? (
              children.map(childInfo => {
                const child = childInfo.student;
                return (
                  <div
                    key={child.id}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 transition-all hover:border-gray-200 hover:bg-gray-50"
                  >
                    {/* Top row: avatar + name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-yellow-200 bg-yellow-100 text-yellow-700 font-black text-lg shadow-sm">
                        {child.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-gray-900 truncate">{child.name}</h4>
                        <p className="text-xs text-gray-500 font-medium">{child.email}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3 text-gray-400" />
                          Morning Route
                        </p>
                      </div>
                    </div>

                    {/* Attendance toggle row */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Today's Attendance</span>
                      
                      <div className="flex items-center gap-2">
                        {attendanceLoading[child.id] ? (
                          <div className="flex items-center gap-2 text-gray-500 text-xs py-2 px-1 font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating status...
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => markAttendance(child.id, 'PRESENT')}
                              disabled={!!attendanceMap[child.id]}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${attendanceMap[child.id] === 'PRESENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : attendanceMap[child.id] ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm'}`}
                            >
                              <UserCheck className="w-4 h-4" />
                              Present
                            </button>
                            <button
                              onClick={() => markAttendance(child.id, 'ABSENT')}
                              disabled={!!attendanceMap[child.id]}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${attendanceMap[child.id] === 'ABSENT' ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' : attendanceMap[child.id] ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm'}`}
                            >
                              <UserX className="w-4 h-4" />
                              Absent
                            </button>
                          </>
                        )}
                      </div>

                      {attendanceMap[child.id] && (
                        <p className={`text-[10px] uppercase font-black tracking-widest mt-1 text-center ${attendanceMap[child.id] === 'PRESENT' ? 'text-emerald-500' : 'text-red-500'}`}>
                          Confirmed {attendanceMap[child.id]} for today
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <Users className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm font-medium">No children linked to your account yet.<br/>Please contact the administrator.</p>
              </div>
            )}
          </div>

          {/* Route Stops Info */}
          {routeStops.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Route Stops</h4>
              <div className="space-y-2">
                {routeStops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-black text-[10px] flex-shrink-0 border border-yellow-200">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 font-semibold flex-1 truncate">{stop.name}</span>
                    <span className="text-gray-400 font-mono font-bold">{stop.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lastUpdated && (
            <p className="text-[10px] font-semibold text-gray-400 mt-6 text-center">
              LIVE TRACKING ENABLED · LAST BEACON: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default ParentDashboard;
