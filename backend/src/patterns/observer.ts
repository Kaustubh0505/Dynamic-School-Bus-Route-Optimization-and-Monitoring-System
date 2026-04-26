/**
 * Observer Pattern Implementation
 * Facilitates loosely coupled event notifications, specifically
 * for broadcasting boarding status updates to parents.
 */

// IObserver Interface
export interface IObserver {
  update(studentId: string, status: string): void | Promise<void>;
}

// ISubject Interface
export interface ISubject {
  addObserver(observer: IObserver): void;
  removeObserver(observer: IObserver): void;
  notify(studentId: string, status: string): void;
}

import Student from '../models/student.model';
import User from '../models/user.model';
import { mailService } from '../services/mail.service';

// Concrete Observer: Sends Notifications to Parents
export class ParentNotifierObserver implements IObserver {
  async update(studentId: string, status: string): Promise<void> {
    try {
      // 1. Fetch student info
      const student = await Student.findById(studentId);
      if (!student) {
        console.error(`[Observer Error] Student ${studentId} not found.`);
        return;
      }

      // 2. Fetch parent info
      const parent = await User.findById(student.parentId);
      if (!parent || !parent.email) {
        console.error(`[Observer Error] Parent for student ${student.name} not found or has no email.`);
        return;
      }

      // 3. Send Email
      await mailService.sendBoardingNotification(parent.email, student.name, status);
      
      console.log(`[Observer Alert] Email Notification Sent to ${parent.email}: Student ${student.name} marked as ${status}.`);
    } catch (error) {
      console.error('[Observer Error] Failed to send notification:', error);
    }
  }
}

// Concrete Subject: Boarding Subject
export class BoardingSubject implements ISubject {
  private observers: IObserver[] = [];

  addObserver(observer: IObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: IObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  notify(studentId: string, status: string): void {
    for (const observer of this.observers) {
      observer.update(studentId, status);
    }
  }
}

// Export a singleton instance of the subject to maintain global observer state
export const boardingEventNotifier = new BoardingSubject();

// Register our specific observers immediately
boardingEventNotifier.addObserver(new ParentNotifierObserver());
