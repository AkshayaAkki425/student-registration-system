/**
 * EduFlow Pro - Java Code Showcase, Git Commit Simulator & README Generator
 * Demonstrates Task 3 GitHub & Documentation requirements
 */

export const JAVA_SOURCE_CODE = `package com.eduflow;

import java.io.*;
import java.util.*;

// ==========================================
// 1. CUSTOM EXCEPTIONS (Task 2)
// ==========================================
class DuplicateStudentException extends Exception {
    public DuplicateStudentException(String message) {
        super(message);
    }
}

class InvalidGPAException extends Exception {
    public InvalidGPAException(String message) {
        super(message);
    }
}

class StudentNotFoundException extends Exception {
    public StudentNotFoundException(String message) {
        super(message);
    }
}

// ==========================================
// 2. STUDENT MODEL (Task 1)
// ==========================================
class Student implements Serializable {
    private String id;
    private String name;
    private String email;
    private String major;
    private double gpa;
    private String status;

    public Student(String id, String name, String email, String major, double gpa, String status) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.major = major;
        this.gpa = gpa;
        this.status = status;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getMajor() { return major; }
    public double getGpa() { return gpa; }
    public String getStatus() { return status; }

    public void setGpa(double gpa) { this.gpa = gpa; }
    public void setMajor(String major) { this.major = major; }

    @Override
    public String toString() {
        return String.format("[ID: %s] %-18s | Email: %-25s | Major: %-18s | GPA: %.2f | Status: %s",
                id, name, email, major, gpa, status);
    }

    public String toCSV() {
        return String.format("%s,%s,%s,%s,%.2f,%s", id, name, email, major, gpa, status);
    }
}

// ==========================================
// 3. STUDENT MANAGEMENT SYSTEM (Task 1, 2, 3)
// ==========================================
public class StudentRegistrationSystem {

    // Collections (Task 2)
    private static List<Student> studentList = new ArrayList<>();             // ArrayList (Ordered)
    private static Map<String, Student> studentMap = new HashMap<>();        // HashMap (Fast O(1) ID lookup)
    private static Set<String> registeredEmails = new HashSet<>();          // HashSet (Unique email validation)

    private static final String DATA_FILE = "students.csv";
    private static Scanner scanner = new Scanner(System.in);

    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println("   WELCOME TO EDUFLOW STUDENT REGISTRATION SYSTEM");
        System.out.println("=================================================");

        // Task 3: Load existing records from file on startup
        loadFromFile();

        boolean running = true;
        while (running) {
            printMenu();
            System.out.print("Enter your choice (1-7): ");
            String choiceStr = scanner.nextLine().trim();

            try {
                int choice = Integer.parseInt(choiceStr);
                switch (choice) {
                    case 1 -> registerNewStudent();
                    case 2 -> displayAllStudents();
                    case 3 -> findStudentById();
                    case 4 -> updateStudentGPA();
                    case 5 -> deleteStudent();
                    case 6 -> saveToFile();
                    case 7 -> {
                        saveToFile(); // Auto-save on exit
                        running = false;
                        System.out.println("Thank you for using EduFlow Registration System. Goodbye!");
                    }
                    default -> System.out.println("[Error] Invalid choice! Please select 1 through 7.");
                }
            } catch (NumberFormatException e) {
                System.out.println("[Exception Captured] Choice must be a valid integer number.");
            } catch (Exception e) {
                System.out.println("[Captured Exception] " + e.getMessage());
            }
            System.out.println();
        }
    }

    private static void printMenu() {
        System.out.println("\n--- MAIN MENU ---");
        System.out.println("1. Register New Student (Task 1 & 2)");
        System.out.println("2. Display All Students (ArrayList)");
        System.out.println("3. Find Student by ID (HashMap O(1))");
        System.out.println("4. Update Student GPA (Try-Catch)");
        System.out.println("5. Delete Student (Collections Cleanup)");
        System.out.println("6. Export Data to File (FileWriter Task 3)");
        System.out.println("7. Save & Exit System");
    }

    // Task 1 & 2: User Input + Exception Handling + Collections
    private static void registerNewStudent() throws DuplicateStudentException, InvalidGPAException {
        System.out.println("\n--- REGISTER NEW STUDENT ---");

        System.out.print("Enter Student ID (e.g. STU-1007): ");
        String id = scanner.nextLine().trim();
        if (studentMap.containsKey(id)) {
            throw new DuplicateStudentException("Student ID '" + id + "' already exists in HashMap!");
        }

        System.out.print("Enter Full Name: ");
        String name = scanner.nextLine().trim();

        System.out.print("Enter Email Address: ");
        String email = scanner.nextLine().trim().toLowerCase();
        if (registeredEmails.contains(email)) {
            throw new DuplicateStudentException("Email '" + email + "' already registered in HashSet!");
        }

        System.out.print("Enter Major/Course: ");
        String major = scanner.nextLine().trim();

        System.out.print("Enter GPA (0.00 - 4.00): ");
        double gpa;
        try {
            gpa = Double.parseDouble(scanner.nextLine().trim());
            if (gpa < 0.0 || gpa > 4.0) {
                throw new InvalidGPAException("GPA must be between 0.00 and 4.00.");
            }
        } catch (NumberFormatException e) {
            throw new InvalidGPAException("GPA must be a valid decimal number (e.g. 3.75).");
        }

        System.out.print("Enter Status (Full-Time / Part-Time): ");
        String status = scanner.nextLine().trim();

        Student student = new Student(id, name, email, major, gpa, status);

        // Add to collections
        studentList.add(student);
        studentMap.put(id, student);
        registeredEmails.add(email);

        System.out.println("[SUCCESS] Student registered successfully!");
    }

    private static void displayAllStudents() {
        System.out.println("\n--- ALL REGISTERED STUDENTS (" + studentList.size() + " Total) ---");
        if (studentList.isEmpty()) {
            System.out.println("No student records found.");
            return;
        }
        for (int i = 0; i < studentList.size(); i++) {
            System.out.printf("%2d. %s\n", (i + 1), studentList.get(i));
        }
    }

    private static void findStudentById() throws StudentNotFoundException {
        System.out.print("\nEnter Student ID to search: ");
        String id = scanner.nextLine().trim();

        // O(1) Lookup in HashMap
        Student s = studentMap.get(id);
        if (s == null) {
            throw new StudentNotFoundException("No student found with ID: " + id);
        }

        System.out.println("\n[Record Found via HashMap Lookup]:");
        System.out.println(s);
    }

    private static void updateStudentGPA() throws StudentNotFoundException, InvalidGPAException {
        System.out.print("\nEnter Student ID to update GPA: ");
        String id = scanner.nextLine().trim();

        Student s = studentMap.get(id);
        if (s == null) {
            throw new StudentNotFoundException("Cannot update: Student ID '" + id + "' not found.");
        }

        System.out.print("Enter New GPA: ");
        try {
            double newGpa = Double.parseDouble(scanner.nextLine().trim());
            if (newGpa < 0.0 || newGpa > 4.0) {
                throw new InvalidGPAException("GPA must be between 0.00 and 4.00.");
            }
            s.setGpa(newGpa);
            System.out.println("[SUCCESS] GPA updated to " + newGpa);
        } catch (NumberFormatException e) {
            throw new InvalidGPAException("GPA must be numeric.");
        }
    }

    private static void deleteStudent() throws StudentNotFoundException {
        System.out.print("\nEnter Student ID to delete: ");
        String id = scanner.nextLine().trim();

        Student s = studentMap.get(id);
        if (s == null) {
            throw new StudentNotFoundException("Delete failed: Student ID '" + id + "' not found.");
        }

        studentList.remove(s);
        studentMap.remove(id);
        registeredEmails.remove(s.getEmail());

        System.out.println("[SUCCESS] Student record deleted from all collections.");
    }

    // Task 3: File I/O - FileWriter
    private static void saveToFile() {
        try (PrintWriter writer = new PrintWriter(new FileWriter(DATA_FILE))) {
            writer.println("ID,Name,Email,Major,GPA,Status");
            for (Student s : studentList) {
                writer.println(s.toCSV());
            }
            System.out.println("[File Saved] Data exported to " + DATA_FILE);
        } catch (IOException e) {
            System.out.println("[File Error] Could not write to file: " + e.getMessage());
        }
    }

    // Task 3: File I/O - FileReader
    private static void loadFromFile() {
        File file = new File(DATA_FILE);
        if (!file.exists()) return;

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line = reader.readLine(); // Header line
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length >= 6) {
                    String id = parts[0];
                    String name = parts[1];
                    String email = parts[2];
                    String major = parts[3];
                    double gpa = Double.parseDouble(parts[4]);
                    String status = parts[5];

                    Student s = new Student(id, name, email, major, gpa, status);
                    studentList.add(s);
                    studentMap.put(id, s);
                    registeredEmails.add(email.toLowerCase());
                }
            }
            System.out.println("[System Initialization] Loaded " + studentList.size() + " student records from " + DATA_FILE);
        } catch (Exception e) {
            System.out.println("[System Notice] Initialized with empty student database.");
        }
    }
}
`;

export const GIT_HISTORY = [
  {
    hash: "a1b2c3d",
    tag: "Task 1 Milestone",
    date: "2026-08-01",
    author: "Intern Developer",
    message: "feat(task1): Implement Student Management Console App with Scanner, loops, and conditional logic",
    details: "Built core Student class, console menu loop, user input Scanner reading, and basic CRUD commands."
  },
  {
    hash: "e4f5g6h",
    tag: "Task 2 Milestone",
    date: "2026-08-05",
    author: "Intern Developer",
    message: "feat(task2): Refactor data structures to Java Collections & add custom exception handling",
    details: "Integrated ArrayList for order, HashMap for O(1) ID lookup, HashSet for duplicate email checking, and implemented try-catch blocks with custom exceptions (DuplicateStudentException, InvalidGPAException)."
  },
  {
    hash: "i7j8k9l",
    tag: "Task 3 Milestone",
    date: "2026-08-08",
    author: "Intern Developer",
    message: "feat(task3): Add CSV File Persistence via FileReader/FileWriter & setup GitHub repository",
    details: "Added automatic data loading from CSV on startup and auto-save on shutdown. Created comprehensive README documentation and pushed to GitHub."
  },
  {
    hash: "m0n1p2q",
    tag: "EduFlow Pro Web App",
    date: "2026-08-12",
    author: "Antigravity AI Pair Developer",
    message: "feat(eduflow): Transform Java internship tasks into EduFlow Pro Web Application",
    details: "Built glassmorphic single-page web dashboard, live Collections Inspector, Try-Catch Exception simulator, drag-and-drop CSV/JSON file manager, and GitHub code showcase center."
  }
];

export const README_MARKDOWN = `# EduFlow Pro - Student Registration & Academic Management Hub

> A modern, full-featured Student Registration System web application built by expanding Java Internship Tasks 1, 2, and 3 into a professional software project.

---

## 🌟 Overview & Internship Milestones

This project integrates three foundational internship milestones into a unified application:

| Milestone | Core Concept | Implementation Highlights |
| :--- | :--- | :--- |
| **Task 1** | **Java Fundamentals & Control Flow** | Scanner input, conditional logic, loops, Student entity design, GPA calculation. |
| **Task 2** | **Collections & Exception Handling** | \`ArrayList\` (roster), \`HashMap\` ($O(1)$ lookup), \`HashSet\` (deduplication), try-catch blocks, and custom exception classes. |
| **Task 3** | **File I/O & Version Control** | CSV/JSON file reading/writing (\`FileReader\` / \`FileWriter\`), Git version control, and GitHub documentation. |

---

## 🚀 Key Features

1. **Interactive Registration Dashboard**: Full CRUD management of student records with real-time analytics.
2. **Java Collections Visualizer**: Visual breakdown showing how data behaves in \`ArrayList\`, \`HashMap\` ($O(1)$ search), and \`HashSet\` (unique emails & tags).
3. **Try-Catch & Exception Simulator**: Live console demonstrating custom Java exceptions:
   - \`DuplicateStudentException\`
   - \`InvalidGPAException\`
   - \`CourseCapacityExceededException\`
   - \`StudentNotFoundException\`
4. **File Persistence Engine**: Drag-and-drop CSV/JSON import (\`FileReader\`) and instant export (\`FileWriter\`).
5. **Git Repository & Code Hub**: Embedded git history timeline, live README viewer, and downloadable \`StudentRegistrationSystem.java\`.

---

## 🛠️ How to Run Locally

### Option 1: Web Application (EduFlow Pro)
Run using Python's built-in HTTP server:
\`\`\`bash
cd student-registration-app
python3 -m http.server 8000
\`\`\`
Then open your browser at \`http://localhost:8000\`.

### Option 2: Standalone Java Console App
Compile and run the single-file Java implementation:
\`\`\`bash
javac StudentRegistrationSystem.java
java com.eduflow.StudentRegistrationSystem
\`\`\`

---

## 📄 License
MIT License. Created as part of the Advanced Java Developer Internship Program.
`;
