/**
 * EduFlow Pro - File Storage Engine (FileReader & FileWriter)
 * Demonstrates Task 3 Requirements (File I/O in JSON and CSV format)
 */

import { studentManager } from './studentManager.js';
import { exceptionManager, InvalidDataFormatException } from './exceptionHandler.js';

export class FileStorageEngine {
  /**
   * Export all student data to JSON file (FileWriter simulation)
   */
  static exportJSON() {
    return exceptionManager.execute(() => {
      const data = studentManager.arrayList;
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const filename = `eduflow_students_${new Date().toISOString().split('T')[0]}.json`;

      FileStorageEngine.triggerDownload(blob, filename);
      return filename;
    }, "ExportJSONFile");
  }

  /**
   * Export all student data to CSV file (FileWriter simulation)
   */
  static exportCSV() {
    return exceptionManager.execute(() => {
      const data = studentManager.arrayList;
      if (!data || data.length === 0) {
        throw new Error("No student records available to export.");
      }

      const headers = ["ID", "Name", "Email", "Major", "GPA", "EnrollmentStatus", "RegistrationDate", "Skills", "EmergencyContact", "Notes"];
      const rows = data.map(s => [
        `"${s.id}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.email}"`,
        `"${s.major}"`,
        s.gpa,
        `"${s.enrollmentStatus}"`,
        `"${s.registrationDate}"`,
        `"${(s.skills || []).join('; ')}"`,
        `"${(s.emergencyContact || '').replace(/"/g, '""')}"`,
        `"${(s.notes || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `eduflow_students_${new Date().toISOString().split('T')[0]}.csv`;

      FileStorageEngine.triggerDownload(blob, filename);
      return filename;
    }, "ExportCSVFile");
  }

  /**
   * Import data from JSON or CSV file using FileReader API
   */
  static importFile(file) {
    return new Promise((resolve) => {
      if (!file) {
        const result = exceptionManager.execute(() => {
          throw new InvalidDataFormatException("No file selected for import.");
        }, "ImportFile");
        resolve(result);
        return;
      }

      const reader = new FileReader();
      const fileName = file.name.toLowerCase();

      reader.onload = (e) => {
        const content = e.target.result;
        let importResult;

        if (fileName.endsWith('.json')) {
          importResult = FileStorageEngine.parseJSONContent(content);
        } else if (fileName.endsWith('.csv')) {
          importResult = FileStorageEngine.parseCSVContent(content);
        } else {
          importResult = exceptionManager.execute(() => {
            throw new InvalidDataFormatException(`Unsupported file extension in '${file.name}'. Only .json and .csv files are supported.`);
          }, "ImportFile");
        }

        resolve(importResult);
      };

      reader.onerror = () => {
        const result = exceptionManager.execute(() => {
          throw new InvalidDataFormatException(`Failed to read file '${file.name}' using FileReader.`);
        }, "FileReaderError");
        resolve(result);
      };

      reader.readAsText(file);
    });
  }

  static parseJSONContent(content) {
    return exceptionManager.execute(() => {
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (err) {
        throw new InvalidDataFormatException("Invalid JSON syntax: " + err.message);
      }

      if (!Array.isArray(parsed)) {
        throw new InvalidDataFormatException("JSON root structure must be an Array of student objects.");
      }

      let importedCount = 0;
      let skippedCount = 0;

      parsed.forEach(item => {
        if (!item.name || !item.email || !item.major || item.gpa === undefined) {
          skippedCount++;
          return;
        }

        const res = studentManager.addStudent(item);
        if (res.success) {
          importedCount++;
        } else {
          skippedCount++;
        }
      });

      return { importedCount, skippedCount, totalProcessed: parsed.length };
    }, "ParseJSONImport");
  }

  static parseCSVContent(content) {
    return exceptionManager.execute(() => {
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        throw new InvalidDataFormatException("CSV file must contain a header row and at least one data row.");
      }

      // Basic CSV splitter respecting quotes
      const parseCSVLine = (line) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur.replace(/^"|"$/g, '').trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.replace(/^"|"$/g, '').trim());
        return result;
      };

      const header = parseCSVLine(lines[0]).map(h => h.toLowerCase());
      let importedCount = 0;
      let skippedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 4) continue;

        const rowObj = {};
        header.forEach((h, index) => {
          rowObj[h] = cols[index] !== undefined ? cols[index] : '';
        });

        const studentPayload = {
          id: rowObj['id'] || undefined,
          name: rowObj['name'] || rowObj['fullname'],
          email: rowObj['email'],
          major: rowObj['major'],
          gpa: rowObj['gpa'],
          enrollmentStatus: rowObj['enrollmentstatus'] || rowObj['status'] || 'Full-Time',
          registrationDate: rowObj['registrationdate'] || new Date().toISOString().split('T')[0],
          skills: rowObj['skills'] ? rowObj['skills'].split(';').map(s => s.trim()) : [],
          emergencyContact: rowObj['emergencycontact'] || '',
          notes: rowObj['notes'] || ''
        };

        if (studentPayload.name && studentPayload.email && studentPayload.major) {
          const res = studentManager.addStudent(studentPayload);
          if (res.success) importedCount++;
          else skippedCount++;
        } else {
          skippedCount++;
        }
      }

      return { importedCount, skippedCount, totalLines: lines.length - 1 };
    }, "ParseCSVImport");
  }

  static triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
