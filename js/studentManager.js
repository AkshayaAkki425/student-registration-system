/**
 * EduFlow Pro - Student Data Manager & Java Collections Simulator (CGPA 10.0 Scale)
 * Demonstrates Task 1 (CRUD & Filtering) and Task 2 (ArrayList, HashMap, HashSet)
 */

import { INITIAL_STUDENTS } from './sampleData.js';
import {
  exceptionManager,
  DuplicateStudentException,
  InvalidGPAException,
  StudentNotFoundException
} from './exceptionHandler.js';

class StudentManager {
  constructor() {
    this.arrayList = [];
    this.hashMapById = new Map();
    this.hashMapByEmail = new Map();
    this.hashSetEmails = new Set();
    this.hashSetSkills = new Set();
    this.listeners = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    const saved = localStorage.getItem("eduflow_students");
    let data = INITIAL_STUDENTS;
    if (saved) {
      try {
        data = JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse localStorage, resetting to initial data.");
      }
    }
    this.rebuildCollections(data);
  }

  saveToStorage() {
    localStorage.setItem("eduflow_students", JSON.stringify(this.arrayList));
  }

  rebuildCollections(studentsArray) {
    this.arrayList = [];
    this.hashMapById.clear();
    this.hashMapByEmail.clear();
    this.hashSetEmails.clear();
    this.hashSetSkills.clear();

    studentsArray.forEach(s => {
      this.arrayList.push(s);
      this.hashMapById.set(s.id, s);
      this.hashMapByEmail.set(s.email.toLowerCase(), s);
      this.hashSetEmails.add(s.email.toLowerCase());
      
      if (Array.isArray(s.skills)) {
        s.skills.forEach(skill => this.hashSetSkills.add(skill));
      }
    });

    this.notify();
  }

  addStudent(studentData) {
    return exceptionManager.execute(() => {
      // Validate CGPA on 10.0 scale
      const gpaNum = parseFloat(studentData.gpa);
      if (isNaN(gpaNum) || gpaNum < 0.00 || gpaNum > 10.00) {
        throw new InvalidGPAException(`Invalid CGPA value: '${studentData.gpa}'. CGPA must be between 0.00 and 10.00.`, { gpa: studentData.gpa });
      }

      const normalizedEmail = (studentData.email || "").trim().toLowerCase();
      if (!normalizedEmail) {
        throw new Error("Student email address cannot be empty.");
      }

      if (this.hashSetEmails.has(normalizedEmail)) {
        throw new DuplicateStudentException(`The email address '${normalizedEmail}' is already registered in the HashSet index.`, { email: normalizedEmail });
      }

      const newId = studentData.id || `STU-${1000 + this.arrayList.length + Math.floor(Math.random() * 900)}`;

      if (this.hashMapById.has(newId)) {
        throw new DuplicateStudentException(`Student ID '${newId}' already exists in the HashMap index.`, { id: newId });
      }

      const newStudent = {
        id: newId,
        name: studentData.name.trim(),
        email: normalizedEmail,
        major: studentData.major,
        gpa: parseFloat(gpaNum.toFixed(2)),
        enrollmentStatus: studentData.enrollmentStatus || "Full-Time",
        registrationDate: studentData.registrationDate || new Date().toISOString().split("T")[0],
        skills: Array.isArray(studentData.skills) ? studentData.skills : (studentData.skills ? studentData.skills.split(',').map(s => s.trim()) : []),
        emergencyContact: studentData.emergencyContact || "N/A",
        notes: studentData.notes || ""
      };

      this.arrayList.push(newStudent);
      this.hashMapById.set(newId, newStudent);
      this.hashMapByEmail.set(normalizedEmail, newStudent);
      this.hashSetEmails.add(normalizedEmail);
      newStudent.skills.forEach(skill => this.hashSetSkills.add(skill));

      this.saveToStorage();
      this.notify();

      return newStudent;
    }, "AddStudent");
  }

  updateStudent(studentId, updatedFields) {
    return exceptionManager.execute(() => {
      const existing = this.hashMapById.get(studentId);
      if (!existing) {
        throw new StudentNotFoundException(`Cannot update: Student ID '${studentId}' not found.`, { id: studentId });
      }

      if (updatedFields.gpa !== undefined) {
        const gpaNum = parseFloat(updatedFields.gpa);
        if (isNaN(gpaNum) || gpaNum < 0.00 || gpaNum > 10.00) {
          throw new InvalidGPAException(`Invalid updated CGPA: '${updatedFields.gpa}'. Must be between 0.00 and 10.00.`, { gpa: updatedFields.gpa });
        }
        updatedFields.gpa = parseFloat(gpaNum.toFixed(2));
      }

      if (updatedFields.email) {
        const newEmail = updatedFields.email.trim().toLowerCase();
        if (newEmail !== existing.email && this.hashSetEmails.has(newEmail)) {
          throw new DuplicateStudentException(`Email '${newEmail}' belongs to another student.`, { email: newEmail });
        }
        this.hashSetEmails.delete(existing.email);
        this.hashMapByEmail.delete(existing.email);
        this.hashSetEmails.add(newEmail);
        this.hashMapByEmail.set(newEmail, existing);
        existing.email = newEmail;
      }

      Object.assign(existing, updatedFields);

      this.saveToStorage();
      this.notify();
      return existing;
    }, "UpdateStudent");
  }

  deleteStudent(studentId) {
    return exceptionManager.execute(() => {
      const student = this.hashMapById.get(studentId);
      if (!student) {
        throw new StudentNotFoundException(`Delete failed: Student ID '${studentId}' does not exist.`, { id: studentId });
      }

      const idx = this.arrayList.findIndex(s => s.id === studentId);
      if (idx !== -1) {
        this.arrayList.splice(idx, 1);
      }

      this.hashMapById.delete(studentId);
      this.hashMapByEmail.delete(student.email);
      this.hashSetEmails.delete(student.email);

      this.saveToStorage();
      this.notify();
      return true;
    }, "DeleteStudent");
  }

  getStudentById(studentId) {
    return this.hashMapById.get(studentId) || null;
  }

  queryStudents({ search = "", major = "ALL", status = "ALL", gpaMin = 0, sortBy = "name", sortOrder = "asc" }) {
    let result = [...this.arrayList];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.major.toLowerCase().includes(q) ||
        s.skills.some(skill => skill.toLowerCase().includes(q))
      );
    }

    if (major !== "ALL") {
      result = result.filter(s => s.major === major);
    }

    if (status !== "ALL") {
      result = result.filter(s => s.enrollmentStatus === status);
    }

    if (gpaMin > 0) {
      result = result.filter(s => s.gpa >= gpaMin);
    }

    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }

  getStats() {
    const total = this.arrayList.length;
    if (total === 0) {
      return { total: 0, avgGpa: "0.00", topPerformer: null, majorsCount: 0, skillsCount: 0 };
    }

    const sumGpa = this.arrayList.reduce((acc, s) => acc + s.gpa, 0);
    const avgGpa = (sumGpa / total).toFixed(2);

    const sortedByGpa = [...this.arrayList].sort((a, b) => b.gpa - a.gpa);
    const topPerformer = sortedByGpa[0];

    const uniqueMajors = new Set(this.arrayList.map(s => s.major));

    return {
      total,
      avgGpa,
      topPerformer,
      majorsCount: uniqueMajors.size,
      skillsCount: this.hashSetSkills.size,
      majorBreakdown: this.getMajorBreakdown()
    };
  }

  getMajorBreakdown() {
    const counts = {};
    this.arrayList.forEach(s => {
      counts[s.major] = (counts[s.major] || 0) + 1;
    });
    return counts;
  }

  resetToSampleData() {
    this.rebuildCollections(INITIAL_STUDENTS);
    this.saveToStorage();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.arrayList));
  }
}

export const studentManager = new StudentManager();
