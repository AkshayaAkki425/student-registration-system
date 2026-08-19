/**
 * EduFlow Pro - Custom Exceptions & Try-Catch Exception Engine
 * Demonstrates Task 2 Exception Handling Requirements
 */

export class CustomException extends Error {
  constructor(name, message, code = "ERR_GENERIC", details = {}) {
    super(message);
    this.name = name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class DuplicateStudentException extends CustomException {
  constructor(message = "A student with this Email or ID already exists in the system.", details = {}) {
    super("DuplicateStudentException", message, "ERR_DUPLICATE_STUDENT", details);
  }
}

export class InvalidGPAException extends CustomException {
  constructor(message = "CGPA must be a valid numeric value between 0.00 and 10.00.", details = {}) {
    super("InvalidGPAException", message, "ERR_INVALID_GPA", details);
  }
}

export class CourseCapacityExceededException extends CustomException {
  constructor(message = "The selected course section has reached its maximum enrollment capacity.", details = {}) {
    super("CourseCapacityExceededException", message, "ERR_CAPACITY_EXCEEDED", details);
  }
}

export class StudentNotFoundException extends CustomException {
  constructor(message = "The requested Student Record could not be found in the database.", details = {}) {
    super("StudentNotFoundException", message, "ERR_STUDENT_NOT_FOUND", details);
  }
}

export class InvalidDataFormatException extends CustomException {
  constructor(message = "Uploaded file content violates the required JSON/CSV schema format.", details = {}) {
    super("InvalidDataFormatException", message, "ERR_INVALID_FORMAT", details);
  }
}

class ExceptionManager {
  constructor() {
    this.logs = [];
    this.listeners = [];
  }

  execute(actionFn, contextName = "Operation") {
    try {
      const result = actionFn();
      this.logSuccess(contextName);
      return { success: true, data: result, error: null };
    } catch (error) {
      const exceptionObj = error instanceof CustomException
        ? error
        : new CustomException("RuntimeException", error.message || "An unexpected error occurred.");
      
      this.logException(exceptionObj, contextName);
      this.notifyListeners(exceptionObj);
      return { success: false, data: null, error: exceptionObj };
    }
  }

  logException(exception, context) {
    const entry = {
      id: "EXP-" + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toLocaleTimeString(),
      type: exception.name,
      code: exception.code,
      message: exception.message,
      context,
      stack: `com.eduflow.exceptions.${exception.name}: ${exception.message}\n` +
             `  at com.eduflow.service.StudentService.process(${context}.java:42)\n` +
             `  at com.eduflow.controller.RegistrationController.handleSubmit(RegistrationController.java:88)\n` +
             `  at com.eduflow.AppMain.main(AppMain.java:15)`
    };
    this.logs.unshift(entry);
    if (this.logs.length > 50) this.logs.pop();
  }

  logSuccess(context) {
    const entry = {
      id: "LOG-" + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toLocaleTimeString(),
      type: "SUCCESS",
      code: "OK_200",
      message: `Operation '${context}' executed successfully without throwing exceptions.`,
      context,
      stack: null
    };
    this.logs.unshift(entry);
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notifyListeners(exception) {
    this.listeners.forEach(fn => fn(exception));
  }
}

export const exceptionManager = new ExceptionManager();
