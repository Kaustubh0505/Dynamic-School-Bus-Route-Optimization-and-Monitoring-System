import Bus, { IBus } from '../models/bus.model';
import Attendance from '../models/attendance.model';
import Route from '../models/route.model';
import Student from '../models/student.model';
import BusAssignment from '../models/busAssignment.model';
import mongoose from 'mongoose';

class BusService {
  async createBus(data: Partial<IBus>): Promise<IBus> {
    const bus = new Bus(data);
    return await bus.save();
  }

  async getAllBuses(): Promise<IBus[]> {
    return await Bus.find().populate('driverId', 'name email');
  }

  async getBusById(id: string): Promise<IBus | null> {
    return await Bus.findById(id).populate('driverId', 'name email');
  }

  async updateBus(id: string, data: Partial<IBus>): Promise<IBus | null> {
    return await Bus.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteBus(id: string): Promise<IBus | null> {
    return await Bus.findByIdAndDelete(id);
  }

  /**
   * Get students assigned to this bus with their today's attendance.
   * Uses the BusAssignment + Student models for proper relationships.
   */
  async getStudentsForBus(busId: string): Promise<any> {
    // Get all student assignments for this bus
    const assignments = await BusAssignment.find({
      busId: new mongoose.Types.ObjectId(busId)
    });

    const studentIds = assignments.map(a => a.studentId);

    // Fetch the actual student documents
    const students = await Student.find({ _id: { $in: studentIds } })
      .populate('parentId', 'name email');

    // Get today's attendance for these students
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const attendanceRecords = await Attendance.find({
      studentId: { $in: studentIds },
      date: startOfDay
    });

    const presentIds = attendanceRecords
      .filter(r => r.status === 'PRESENT')
      .map(r => r.studentId.toString());

    const absentIds = attendanceRecords
      .filter(r => r.status === 'ABSENT')
      .map(r => r.studentId.toString());

    const finalPresentIds = presentIds;


    // Get current route for this bus
    const routeDoc = await Route.findOne({ busId: new mongoose.Types.ObjectId(busId) });

    return {
      presentStudents: students
        .filter(s => finalPresentIds.includes(s._id.toString()))
        .map(s => ({
          id: s._id.toString(),
          name: s.name,
          email: s.email,
          location: s.location,
          parent: s.parentId
        })),
      absentStudents: [],

      route: routeDoc ? routeDoc.stops.map(stop => ({
        name: stop.stopName,
        lat: stop.location.lat,
        lng: stop.location.lng,
        time: stop.pickupTimeWindow.start
      })) : []
    };
  }

  async addStudentToBus(busId: string, studentData: { name: string, email: string }): Promise<any> {
    // Check if student already exists
    let student = await Student.findOne({ name: studentData.name });

    if (!student) {
      // Create a new student (parentId will need to be set properly via admin)
      student = new Student({
        name: studentData.name,
        email: studentData.email || `student_${Date.now()}@busdemo.com`,
        parentId: new mongoose.Types.ObjectId(), // placeholder
        location: {
          lat: 40.7128 + Math.random() * 0.02 - 0.01,
          lng: -74.0060 + Math.random() * 0.02 - 0.01,
          address: 'Demo Address'
        }
      });
      await student.save();
    }

    // Assign to bus
    await BusAssignment.findOneAndUpdate(
      { studentId: student._id },
      { busId: new mongoose.Types.ObjectId(busId), assignedAt: new Date() },
      { upsert: true, new: true }
    );

    return { id: student._id.toString(), name: student.name, email: student.email };
  }

  /**
   * Get the bus assigned to a specific driver
   */
  async getBusForDriver(driverId: string): Promise<IBus | null> {
    return await Bus.findOne({
      driverId: new mongoose.Types.ObjectId(driverId),
      status: 'active'
    });
  }
}

export default new BusService();
