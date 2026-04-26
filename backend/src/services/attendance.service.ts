import Attendance, { IAttendance } from '../models/attendance.model';
import mongoose from 'mongoose';
import routeOptimizationEngine, { NearestNeighborStrategy } from './routeOptimization.service';
import Student from '../models/student.model';
import Bus from '../models/bus.model';
import BusAssignment from '../models/busAssignment.model';
import Route from '../models/route.model';
import TrafficSimulator from './trafficSimulation.service';

export class AttendanceService {
  /**
   * Mark attendance status for a student (upserts once per day).
   * Triggers route re-optimization after marking.
   */
  async markAttendance(studentId: string, status: 'PRESENT' | 'ABSENT'): Promise<IAttendance> {
    if (!mongoose.isValidObjectId(studentId)) {
      throw new Error(`Invalid studentId: "${studentId}" is not a valid MongoDB ObjectId`);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      studentId: new mongoose.Types.ObjectId(studentId),
      date: startOfDay,
    });

    if (existing) {
      throw new Error('Attendance status has already been set for today.');
    }

    const record = await Attendance.create({
      studentId: new mongoose.Types.ObjectId(studentId),
      date: startOfDay,
      status
    });

    // Trigger route re-optimization automatically
    await this.triggerRouteOptimization();

    return record as IAttendance;
  }

  /**
   * Get today's attendance record for a specific student.
   */
  async getAttendance(studentId: string): Promise<IAttendance | null> {
    if (!mongoose.isValidObjectId(studentId)) {
      throw new Error(`Invalid studentId: "${studentId}"`);
    }
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return Attendance.findOne({
      studentId: new mongoose.Types.ObjectId(studentId),
      date: startOfDay,
    }).populate('studentId', 'name email');
  }

  /**
   * Auto-triggers route re-optimization based on current attendance.
   * Uses real student locations and traffic simulation.
   * Only present students are assigned to routes.
   */
  private async triggerRouteOptimization(): Promise<void> {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Get today's attendance records
      const attendanceRecords = await Attendance.find({ date: startOfDay }).lean();
      const presentIds = attendanceRecords
        .filter(r => r.status === 'PRESENT')
        .map(r => r.studentId.toString());
      const absentIds = attendanceRecords
        .filter(r => r.status === 'ABSENT')
        .map(r => r.studentId.toString());

      // Get all active buses
      const buses = await Bus.find({ status: 'active' }).lean();
      if (buses.length === 0) return;

      // For each bus, optimize the route for assigned students
      for (const bus of buses) {
        const busId = (bus._id as any).toString();

        // Get students assigned to this bus
        const assignments = await BusAssignment.find({
          busId: bus._id
        }).lean();

        if (assignments.length === 0) continue;

        const studentIds = assignments.map(a => a.studentId);
        const students = await Student.find({ _id: { $in: studentIds } }).lean();

        if (students.length === 0) continue;

        // Build student inputs with real locations
        const studentInputs = students.map(s => ({
          id: (s._id as any).toString(),
          name: s.name,
          present: presentIds.includes((s._id as any).toString()) ||
                   !absentIds.includes((s._id as any).toString()), // unmarked = present
          location: { lat: s.location.lat, lng: s.location.lng }
        }));

        const busInputs = [{
          id: busId,
          capacity: bus.capacity
        }];

        // Run optimization
        routeOptimizationEngine.setStrategy(new NearestNeighborStrategy());
        const optimizedRoutes = routeOptimizationEngine.generateOptimizedRoute(studentInputs, busInputs);

        // Generate traffic conditions and dynamic pickup windows
        for (const busResult of optimizedRoutes) {
          const stopCount = busResult.stops.length;
          const trafficConditions = TrafficSimulator.simulateTraffic(stopCount, 'MORNING');
          const pickupWindows = TrafficSimulator.calculatePickupWindows('07:00', stopCount, trafficConditions);

          const stops = busResult.stops.map((s: any, idx: number) => ({
            stopName: s.studentName,
            location: s.location,
            pickupTimeWindow: pickupWindows[idx] || { start: '07:00', end: '07:15' }
          }));

          // Upsert route for the bus
          await Route.findOneAndUpdate(
            { busId: new mongoose.Types.ObjectId(busResult.busId) },
            {
              name: `Morning Route - Bus ${busResult.busId.substring(0, 4).toUpperCase()}`,
              stops: stops
            },
            { upsert: true, new: true }
          );
        }
      }

      console.log(`[Attendance] Routes re-optimized with traffic simulation for ${buses.length} bus(es).`);
    } catch (err) {
      console.error('[Attendance] Route optimization failed:', err);
    }
  }
}

export const attendanceService = new AttendanceService();
