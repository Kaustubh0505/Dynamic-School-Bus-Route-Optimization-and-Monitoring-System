import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import {
  Bus, Users, UserPlus, Trash2, Edit3, Plus, X, Loader2, GraduationCap,
  ChevronDown, ChevronUp, Save
} from 'lucide-react';

/* ── Types ── */
interface BusItem { _id: string; registrationNumber: string; capacity: number; driverId: any; status: string; }
interface UserItem { _id: string; name: string; email: string; role: string; }
interface StudentItem { _id: string; name: string; email: string; parentId: any; location: any; grade?: string; }

/* ── Tab Button ── */
const TabBtn: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
      active ? 'bg-[#FFC107] text-gray-900 shadow-md shadow-yellow-400/20' : 'bg-white text-gray-500 border border-gray-200 hover:text-gray-900 hover:border-gray-300'
    }`}
  >
    {icon}{label}
  </button>
);

const AdminManage: React.FC = () => {
  const [tab, setTab] = useState<'buses' | 'users' | 'students'>('buses');
  const { showToast } = useToast();

  /* ─────── BUS STATE ─────── */
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [busLoading, setBusLoading] = useState(true);
  const [showBusForm, setShowBusForm] = useState(false);
  const [busForm, setBusForm] = useState({ registrationNumber: '', capacity: 30, driverId: '', status: 'active' });
  const [editingBusId, setEditingBusId] = useState<string | null>(null);

  /* ─────── USER STATE ─────── */
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userLoading, setUserLoading] = useState(true);

  /* ─────── STUDENT STATE ─────── */
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentLoading, setStudentLoading] = useState(true);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', email: '', parentId: '', lat: '40.7128', lng: '-74.006', grade: '', busId: '' });
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // ── Fetch Functions ──
  const fetchBuses = useCallback(async () => {
    setBusLoading(true);
    try {
      const res = await api.get('/buses');
      setBuses(res.data);
    } catch (err) { console.error(err); }
    finally { setBusLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUserLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
    finally { setUserLoading(false); }
  }, []);

  const fetchStudents = useCallback(async () => {
    setStudentLoading(true);
    try {
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (err) { console.error(err); }
    finally { setStudentLoading(false); }
  }, []);

  useEffect(() => {
    fetchBuses(); fetchUsers(); fetchStudents();
  }, [fetchBuses, fetchUsers, fetchStudents]);

  // ── Bus Handlers ──
  const handleBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        registrationNumber: busForm.registrationNumber,
        capacity: Number(busForm.capacity),
        status: busForm.status,
      };
      if (busForm.driverId) payload.driverId = busForm.driverId;

      if (editingBusId) {
        await api.put(`/buses/${editingBusId}`, payload);
        showToast('Bus updated successfully', 'success');
      } else {
        await api.post('/buses', payload);
        showToast('Bus created successfully', 'success');
      }
      setShowBusForm(false);
      setEditingBusId(null);
      setBusForm({ registrationNumber: '', capacity: 30, driverId: '', status: 'active' });
      fetchBuses();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save bus', 'error');
    }
  };

  const handleDeleteBus = async (id: string) => {
    if (!confirm('Delete this bus?')) return;
    try {
      await api.delete(`/buses/${id}`);
      showToast('Bus deleted', 'success');
      fetchBuses();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete', 'error');
    }
  };

  const startEditBus = (bus: BusItem) => {
    setBusForm({
      registrationNumber: bus.registrationNumber,
      capacity: bus.capacity,
      driverId: bus.driverId?._id || '',
      status: bus.status
    });
    setEditingBusId(bus._id);
    setShowBusForm(true);
  };

  // ── Student Handlers ──
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: studentForm.name,
        email: studentForm.email,
        parentId: studentForm.parentId,
        location: {
          lat: parseFloat(studentForm.lat),
          lng: parseFloat(studentForm.lng),
        },
        grade: studentForm.grade,
      };

      const res = await api.post('/students', payload);
      showToast('Student created successfully', 'success');

      // Assign to bus if selected
      if (studentForm.busId) {
        await api.post('/students/assign', {
          studentId: res.data._id,
          busId: studentForm.busId
        });
        showToast('Student assigned to bus', 'success');
      }

      setShowStudentForm(false);
      setStudentForm({ name: '', email: '', parentId: '', lat: '40.7128', lng: '-74.006', grade: '', busId: '' });
      fetchStudents();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create student', 'error');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      showToast('Student deleted', 'success');
      fetchStudents();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user? This action is irreversible.')) return;
    try {
      await api.delete(`/users/${id}`);
      showToast('User deleted', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete', 'error');
    }
  };

  // ── Filter helpers ──
  const drivers = users.filter(u => u.role === 'DRIVER');
  const parents = users.filter(u => u.role === 'PARENT');

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans pb-12">
      <header className="border-b border-gray-200 pb-6">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">Fleet Management</h2>
        <p className="text-gray-500 font-medium">Manage buses, users, students, and assignments.</p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3">
        <TabBtn active={tab === 'buses'} icon={<Bus className="w-4 h-4" />} label={`Buses (${buses.length})`} onClick={() => setTab('buses')} />
        <TabBtn active={tab === 'users'} icon={<Users className="w-4 h-4" />} label={`Users (${users.length})`} onClick={() => setTab('users')} />
        <TabBtn active={tab === 'students'} icon={<GraduationCap className="w-4 h-4" />} label={`Students (${students.length})`} onClick={() => setTab('students')} />
      </div>

      {/* ═══════ BUSES TAB ═══════ */}
      {tab === 'buses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Bus Fleet</h3>
            <button
              onClick={() => { setShowBusForm(!showBusForm); setEditingBusId(null); setBusForm({ registrationNumber: '', capacity: 30, driverId: '', status: 'active' }); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFC107] rounded-xl font-bold text-sm text-gray-900 shadow-sm hover:bg-yellow-400 transition-all"
            >
              {showBusForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showBusForm ? 'Cancel' : 'Add Bus'}
            </button>
          </div>

          {/* Bus Form */}
          {showBusForm && (
            <form onSubmit={handleBusSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-900">{editingBusId ? 'Edit Bus' : 'New Bus'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Registration Number</label>
                  <input type="text" required value={busForm.registrationNumber}
                    onChange={e => setBusForm(p => ({ ...p, registrationNumber: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                    placeholder="BUS-004"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Capacity</label>
                  <input type="number" required min={1} value={busForm.capacity}
                    onChange={e => setBusForm(p => ({ ...p, capacity: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Assign Driver</label>
                  <select value={busForm.driverId} onChange={e => setBusForm(p => ({ ...p, driverId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                  >
                    <option value="">Unassigned</option>
                    {drivers.map(d => <option key={d._id} value={d._id}>{d.name} ({d.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Status</label>
                  <select value={busForm.status} onChange={e => setBusForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-[#FFC107] rounded-xl font-bold text-sm text-gray-900 hover:bg-yellow-400 transition-all shadow-sm">
                <Save className="w-4 h-4" />
                {editingBusId ? 'Update Bus' : 'Create Bus'}
              </button>
            </form>
          )}

          {/* Bus List */}
          {busLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
          ) : buses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
              <Bus className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No buses yet. Add your first bus above.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {buses.map(bus => (
                <div key={bus._id} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-yellow-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-200">
                      <Bus className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{bus.registrationNumber}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Capacity: {bus.capacity} · Driver: {bus.driverId?.name || 'Unassigned'} ·{' '}
                        <span className={`font-bold ${bus.status === 'active' ? 'text-emerald-500' : bus.status === 'maintenance' ? 'text-amber-500' : 'text-gray-400'}`}>
                          {bus.status.toUpperCase()}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditBus(bus)} className="p-2 text-gray-400 hover:text-[#FFC107] transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteBus(bus._id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ USERS TAB ═══════ */}
      {tab === 'users' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900">All Users</h3>
          {userLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 text-[10px] font-black uppercase tracking-[0.15em] border-b border-gray-100">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-semibold text-gray-900">{user.name}</td>
                      <td className="p-4 text-gray-500 text-sm">{user.email}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          user.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                          user.role === 'DRIVER' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDeleteUser(user._id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════ STUDENTS TAB ═══════ */}
      {tab === 'students' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Students & Assignments</h3>
            <button
              onClick={() => setShowStudentForm(!showStudentForm)}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFC107] rounded-xl font-bold text-sm text-gray-900 shadow-sm hover:bg-yellow-400 transition-all"
            >
              {showStudentForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {showStudentForm ? 'Cancel' : 'Add Student'}
            </button>
          </div>

          {/* Student Form */}
          {showStudentForm && (
            <form onSubmit={handleStudentSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-900">New Student</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Name</label>
                  <input type="text" required value={studentForm.name}
                    onChange={e => setStudentForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Email</label>
                  <input type="email" value={studentForm.email}
                    onChange={e => setStudentForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]" placeholder="jane@student.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Parent</label>
                  <select required value={studentForm.parentId} onChange={e => setStudentForm(p => ({ ...p, parentId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FFC107]">
                    <option value="">Select Parent</option>
                    {parents.map(p => <option key={p._id} value={p._id}>{p.name} ({p.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Grade</label>
                  <input type="text" value={studentForm.grade}
                    onChange={e => setStudentForm(p => ({ ...p, grade: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]" placeholder="5th" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Latitude</label>
                  <input type="text" required value={studentForm.lat}
                    onChange={e => setStudentForm(p => ({ ...p, lat: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Longitude</label>
                  <input type="text" required value={studentForm.lng}
                    onChange={e => setStudentForm(p => ({ ...p, lng: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Assign to Bus</label>
                  <select value={studentForm.busId} onChange={e => setStudentForm(p => ({ ...p, busId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FFC107]">
                    <option value="">No bus assignment</option>
                    {buses.filter(b => b.status === 'active').map(b => <option key={b._id} value={b._id}>{b.registrationNumber} (Cap: {b.capacity})</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-[#FFC107] rounded-xl font-bold text-sm text-gray-900 hover:bg-yellow-400 transition-all shadow-sm">
                <Save className="w-4 h-4" />
                Create Student
              </button>
            </form>
          )}

          {/* Student List */}
          {studentLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
              <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No students yet. Add your first student above.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {students.map(student => (
                <div key={student._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:border-yellow-200 transition-all">
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer"
                    onClick={() => setExpandedStudent(expandedStudent === student._id ? null : student._id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-200 font-bold text-blue-600">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{student.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {student.grade ? `Grade ${student.grade}` : ''} · Parent: {student.parentId?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student._id); }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedStudent === student._id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                  {expandedStudent === student._id && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div><span className="font-bold text-gray-400 uppercase tracking-wider">Email</span><p className="text-gray-700 font-medium mt-1">{student.email || 'N/A'}</p></div>
                        <div><span className="font-bold text-gray-400 uppercase tracking-wider">Location</span><p className="text-gray-700 font-mono font-medium mt-1">{student.location?.lat?.toFixed(4)}, {student.location?.lng?.toFixed(4)}</p></div>
                        <div><span className="font-bold text-gray-400 uppercase tracking-wider">Address</span><p className="text-gray-700 font-medium mt-1">{student.location?.address || 'N/A'}</p></div>
                        <div><span className="font-bold text-gray-400 uppercase tracking-wider">Parent Email</span><p className="text-gray-700 font-medium mt-1">{student.parentId?.email || 'N/A'}</p></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminManage;
