import java.io.*;
import java.util.*;

/**
 * EduFlow - Student Registration & Academic Management System
 * Comprehensive Reference Implementation covering Tasks 1, 2, and 3 (10.0 CGPA Scale).
 */

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
        return String.format("[ID: %s] %-18s | Email: %-25s | Major: %-18s | CGPA: %.2f | Status: %s",
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

    // Java Collections (Task 2)
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
        System.out.println("4. Update Student CGPA (Try-Catch)");
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

        System.out.print("Enter CGPA (0.00 - 10.00): ");
        double gpa;
        try {
            gpa = Double.parseDouble(scanner.nextLine().trim());
            if (gpa < 0.0 || gpa > 10.0) {
                throw new InvalidGPAException("CGPA must be between 0.00 and 10.00.");
            }
        } catch (NumberFormatException e) {
            throw new InvalidGPAException("CGPA must be a valid decimal number (e.g. 8.50).");
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
        System.out.print("\nEnter Student ID to update CGPA: ");
        String id = scanner.nextLine().trim();

        Student s = studentMap.get(id);
        if (s == null) {
            throw new StudentNotFoundException("Cannot update: Student ID '" + id + "' not found.");
        }

        System.out.print("Enter New CGPA (0.00 - 10.00): ");
        try {
            double newGpa = Double.parseDouble(scanner.nextLine().trim());
            if (newGpa < 0.0 || newGpa > 10.0) {
                throw new InvalidGPAException("CGPA must be between 0.00 and 10.00.");
            }
            s.setGpa(newGpa);
            System.out.println("[SUCCESS] CGPA updated to " + newGpa);
        } catch (NumberFormatException e) {
            throw new InvalidGPAException("CGPA must be numeric.");
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
            writer.println("ID,Name,Email,Major,CGPA,Status");
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
