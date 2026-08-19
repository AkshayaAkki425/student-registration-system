/**
 * EduFlow Pro - Main Application Controller
 * Coordinates UI events, tab switching, modal dialogs, and component renders
 */

import { studentManager } from './studentManager.js';
import { exceptionManager, DuplicateStudentException, InvalidGPAException, StudentNotFoundException, CourseCapacityExceededException } from './exceptionHandler.js';
import { FileStorageEngine } from './fileStorage.js';
import { JAVA_SOURCE_CODE, GIT_HISTORY } from './codeShowcase.js';

class AppController {
  constructor() {
    this.currentViewMode = "table";
    this.editingStudentId = null;

    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.initIcons();
      this.initTheme();
      this.bindNavigation();
      this.bindDirectoryControls();
      this.bindModal();
      this.bindExceptionPlayground();
      this.bindFileStorage();
      this.bindCodeShowcase();

      studentManager.subscribe(() => this.render());
      exceptionManager.subscribe((exp) => this.showToast(exp.message, "error"));

      this.render();
    });
  }

  initIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  initTheme() {
    const savedTheme = localStorage.getItem("eduflow_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateThemeIcon(savedTheme);

    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("eduflow_theme", next);
        this.updateThemeIcon(next);
      });
    }
  }

  updateThemeIcon(theme) {
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.innerHTML = theme === "dark" ? `<i data-lucide="sun"></i>` : `<i data-lucide="moon"></i>`;
      this.initIcons();
    }
  }

  bindNavigation() {
    const tabBtns = document.querySelectorAll(".nav-tab-btn");
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTabId = btn.getAttribute("data-tab");

        tabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".tab-pane").forEach(pane => {
          pane.classList.remove("active");
        });

        const targetPane = document.getElementById(targetTabId);
        if (targetPane) {
          targetPane.classList.add("active");
        }
      });
    });
  }

  bindDirectoryControls() {
    const searchInput = document.getElementById("search-input");
    const majorSelect = document.getElementById("filter-major");
    const statusSelect = document.getElementById("filter-status");
    const sortSelect = document.getElementById("sort-by");

    const triggerSearch = () => this.renderDirectory();

    if (searchInput) searchInput.addEventListener("input", triggerSearch);
    if (majorSelect) majorSelect.addEventListener("change", triggerSearch);
    if (statusSelect) statusSelect.addEventListener("change", triggerSearch);
    if (sortSelect) sortSelect.addEventListener("change", triggerSearch);

    const btnTable = document.getElementById("view-mode-table");
    const btnGrid = document.getElementById("view-mode-grid");

    if (btnTable && btnGrid) {
      btnTable.addEventListener("click", () => {
        this.currentViewMode = "table";
        btnTable.classList.add("active");
        btnGrid.classList.remove("active");
        document.getElementById("container-table-view").style.display = "block";
        document.getElementById("container-grid-view").style.display = "none";
      });

      btnGrid.addEventListener("click", () => {
        this.currentViewMode = "grid";
        btnGrid.classList.add("active");
        btnTable.classList.remove("active");
        document.getElementById("container-table-view").style.display = "none";
        document.getElementById("container-grid-view").style.display = "grid";
      });
    }
  }

  render() {
    this.renderStats();
    this.renderDirectory();
    this.renderCollectionsInspector();
    this.renderConsoleLogs();
    this.initIcons();
  }

  renderStats() {
    const stats = studentManager.getStats();
    document.getElementById("stat-total-students").textContent = stats.total;
    document.getElementById("stat-avg-gpa").textContent = stats.avgGpa;
    document.getElementById("stat-majors-count").textContent = stats.majorsCount;
    document.getElementById("stat-skills-count").textContent = stats.skillsCount;
  }

  renderDirectory() {
    const search = document.getElementById("search-input")?.value || "";
    const major = document.getElementById("filter-major")?.value || "ALL";
    const status = document.getElementById("filter-status")?.value || "ALL";
    const sortBy = document.getElementById("sort-by")?.value || "name";

    const students = studentManager.queryStudents({ search, major, status, sortBy });

    const tableBody = document.getElementById("student-table-body");
    if (tableBody) {
      if (students.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
              <i data-lucide="user-x" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
              <p>No student records match your criteria.</p>
            </td>
          </tr>
        `;
      } else {
        tableBody.innerHTML = students.map(s => `
          <tr>
            <td><code class="font-mono" style="color: var(--secondary);">${s.id}</code></td>
            <td><strong>${s.name}</strong></td>
            <td><span style="color: var(--text-muted);">${s.email}</span></td>
            <td><span class="badge badge-major">${s.major}</span></td>
            <td>
              <span class="badge badge-gpa ${s.gpa < 7.0 ? 'gpa-low' : ''}">
                <i data-lucide="award" style="width: 12px; height: 12px; margin-right: 2px;"></i> ${s.gpa.toFixed(2)}
              </span>
            </td>
            <td><span class="badge badge-status">${s.enrollmentStatus}</span></td>
            <td>
              <div class="skills-tags">
                ${(s.skills || []).slice(0, 3).map(sk => `<span class="tag">${sk}</span>`).join('')}
                ${(s.skills || []).length > 3 ? `<span class="tag">+${s.skills.length - 3}</span>` : ''}
              </div>
            </td>
            <td style="text-align: right;">
              <button class="icon-btn btn-edit-student" data-id="${s.id}" title="Edit Student">
                <i data-lucide="edit-3"></i>
              </button>
              <button class="icon-btn btn-delete-student" data-id="${s.id}" title="Delete Student" style="color: var(--danger);">
                <i data-lucide="trash-2"></i>
              </button>
            </td>
          </tr>
        `).join('');
      }
    }

    const gridContainer = document.getElementById("container-grid-view");
    if (gridContainer) {
      if (students.length === 0) {
        gridContainer.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);" class="glass">
            <p>No student records match your criteria.</p>
          </div>
        `;
      } else {
        gridContainer.innerHTML = students.map(s => {
          const initials = s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          return `
            <div class="student-card glass">
              <div class="card-header-user">
                <div class="user-avatar">${initials}</div>
                <div class="user-info">
                  <h3>${s.name}</h3>
                  <p class="font-mono">${s.id} • ${s.email}</p>
                </div>
              </div>

              <div class="card-badge-row">
                <span class="badge badge-major">${s.major}</span>
                <span class="badge badge-gpa ${s.gpa < 7.0 ? 'gpa-low' : ''}">CGPA: ${s.gpa.toFixed(2)}</span>
                <span class="badge badge-status">${s.enrollmentStatus}</span>
              </div>

              <div class="skills-tags">
                ${(s.skills || []).map(sk => `<span class="tag">${sk}</span>`).join('')}
              </div>

              <div class="card-footer-actions">
                <button class="btn btn-secondary btn-edit-student" data-id="${s.id}" style="flex: 1; justify-content: center;">
                  <i data-lucide="edit-3"></i> Edit
                </button>
                <button class="btn btn-danger btn-delete-student" data-id="${s.id}" style="padding: 0.5rem 0.75rem;">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    document.querySelectorAll(".btn-edit-student").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        this.openEditModal(id);
      });
    });

    document.querySelectorAll(".btn-delete-student").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        if (confirm(`Are you sure you want to delete student ID '${id}'?`)) {
          const res = studentManager.deleteStudent(id);
          if (res.success) {
            this.showToast(`Student ID '${id}' deleted successfully.`, "success");
          }
        }
      });
    });

    this.initIcons();
  }

  bindModal() {
    const modal = document.getElementById("student-modal");
    const openBtn = document.getElementById("btn-open-add-modal");
    const closeBtn = document.getElementById("btn-close-modal");
    const cancelBtn = document.getElementById("btn-cancel-modal");
    const form = document.getElementById("student-form");

    if (openBtn) {
      openBtn.addEventListener("click", () => this.openAddModal());
    }

    const closeModal = () => {
      if (modal) modal.classList.remove("active");
    };

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }
  }

  openAddModal() {
    this.editingStudentId = null;
    document.getElementById("modal-title").innerHTML = `<i data-lucide="user-plus"></i> Register New Student`;
    document.getElementById("student-form").reset();
    document.getElementById("form-student-id").value = "";
    document.getElementById("student-modal").classList.add("active");
    this.initIcons();
  }

  openEditModal(studentId) {
    const student = studentManager.getStudentById(studentId);
    if (!student) return;

    this.editingStudentId = studentId;
    document.getElementById("modal-title").innerHTML = `<i data-lucide="edit-3"></i> Edit Student [${studentId}]`;
    document.getElementById("form-student-id").value = student.id;
    document.getElementById("form-name").value = student.name;
    document.getElementById("form-email").value = student.email;
    document.getElementById("form-major").value = student.major;
    document.getElementById("form-gpa").value = student.gpa;
    document.getElementById("form-status").value = student.enrollmentStatus;
    document.getElementById("form-skills").value = (student.skills || []).join(", ");
    document.getElementById("form-emergency").value = student.emergencyContact || "";
    document.getElementById("form-notes").value = student.notes || "";

    document.getElementById("student-modal").classList.add("active");
    this.initIcons();
  }

  handleFormSubmit() {
    const payload = {
      name: document.getElementById("form-name").value,
      email: document.getElementById("form-email").value,
      major: document.getElementById("form-major").value,
      gpa: document.getElementById("form-gpa").value,
      enrollmentStatus: document.getElementById("form-status").value,
      skills: document.getElementById("form-skills").value.split(",").map(s => s.trim()).filter(Boolean),
      emergencyContact: document.getElementById("form-emergency").value,
      notes: document.getElementById("form-notes").value
    };

    let result;
    if (this.editingStudentId) {
      result = studentManager.updateStudent(this.editingStudentId, payload);
    } else {
      result = studentManager.addStudent(payload);
    }

    if (result.success) {
      this.showToast(`Student record ${this.editingStudentId ? 'updated' : 'registered'} successfully!`, "success");
      document.getElementById("student-modal").classList.remove("active");
    }
  }

  renderCollectionsInspector() {
    const arrElem = document.getElementById("collections-arraylist-preview");
    if (arrElem) {
      const sampleList = studentManager.arrayList.slice(0, 3).map((s, idx) => ({
        index: idx,
        id: s.id,
        name: s.name,
        cgpa: s.gpa
      }));
      arrElem.innerHTML = `<pre><code>ArrayList&lt;Student&gt; (Size: ${studentManager.arrayList.length})\n` +
                          JSON.stringify(sampleList, null, 2) + `\n... ${Math.max(0, studentManager.arrayList.length - 3)} more items</code></pre>`;
    }

    const mapElem = document.getElementById("collections-hashmap-preview");
    if (mapElem) {
      const mapObj = {};
      let count = 0;
      for (let [key, val] of studentManager.hashMapById.entries()) {
        if (count >= 3) break;
        mapObj[key] = { name: val.name, major: val.major, email: val.email };
        count++;
      }
      mapElem.innerHTML = `<pre><code>HashMap&lt;String, Student&gt; (Keys: ${studentManager.hashMapById.size})\n` +
                          JSON.stringify(mapObj, null, 2) + `</code></pre>`;
    }

    const setElem = document.getElementById("collections-hashset-preview");
    if (setElem) {
      const emailsArray = Array.from(studentManager.hashSetEmails).slice(0, 4);
      const skillsArray = Array.from(studentManager.hashSetSkills).slice(0, 6);
      setElem.innerHTML = `<pre><code>HashSet&lt;String&gt; registeredEmails (${studentManager.hashSetEmails.size}):\n` +
                          JSON.stringify(emailsArray, null, 2) + `\n\n` +
                          `HashSet&lt;String&gt; skillTags (${studentManager.hashSetSkills.size}):\n` +
                          JSON.stringify(skillsArray, null, 2) + `</code></pre>`;
    }
  }

  bindExceptionPlayground() {
    document.getElementById("btn-trigger-duplicate")?.addEventListener("click", () => {
      exceptionManager.execute(() => {
        const first = studentManager.arrayList[0];
        if (!first) throw new Error("Database empty");
        throw new DuplicateStudentException(`The email address '${first.email}' is already registered in HashSet!`);
      }, "TestDuplicateException");
    });

    document.getElementById("btn-trigger-gpa")?.addEventListener("click", () => {
      exceptionManager.execute(() => {
        throw new InvalidGPAException("Entered CGPA '11.50' exceeds maximum allowed bound [0.00 - 10.00].");
      }, "TestGPAException");
    });

    document.getElementById("btn-trigger-notfound")?.addEventListener("click", () => {
      exceptionManager.execute(() => {
        throw new StudentNotFoundException("Query failed: Student record 'STU-9999' does not exist in HashMap index.");
      }, "TestNotFoundException");
    });

    document.getElementById("btn-trigger-capacity")?.addEventListener("click", () => {
      exceptionManager.execute(() => {
        throw new CourseCapacityExceededException("Course 'Computer Science 101' has reached its max capacity (60/60 enrolled).");
      }, "TestCapacityException");
    });

    document.getElementById("btn-clear-logs")?.addEventListener("click", () => {
      exceptionManager.clearLogs();
      this.renderConsoleLogs();
    });
  }

  renderConsoleLogs() {
    const output = document.getElementById("console-log-output");
    if (!output) return;

    const logs = exceptionManager.getLogs();
    if (logs.length === 0) {
      output.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 2rem;">Console clear. Trigger an exception above to view stack traces.</div>`;
      return;
    }

    output.innerHTML = logs.map(l => `
      <div class="log-entry ${l.type === 'SUCCESS' ? 'log-success' : 'log-error'}">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span style="font-weight: 700; color: ${l.type === 'SUCCESS' ? 'var(--success)' : 'var(--danger)'};">[${l.type}] ${l.code}</span>
          <span style="color: var(--text-muted); font-size: 0.75rem;">${l.timestamp} • ${l.context}</span>
        </div>
        <div>${l.message}</div>
        ${l.stack ? `<pre style="margin-top: 0.5rem; font-size: 0.75rem; color: #f87171; background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 4px; overflow-x: auto;">${l.stack}</pre>` : ''}
      </div>
    `).join('');
  }

  bindFileStorage() {
    document.getElementById("btn-export-csv")?.addEventListener("click", () => {
      const res = FileStorageEngine.exportCSV();
      if (res.success) {
        this.showToast(`Exported records to ${res.data}`, "success");
      }
    });

    document.getElementById("btn-export-json")?.addEventListener("click", () => {
      const res = FileStorageEngine.exportJSON();
      if (res.success) {
        this.showToast(`Exported JSON file to ${res.data}`, "success");
      }
    });

    document.getElementById("btn-reset-data")?.addEventListener("click", () => {
      if (confirm("Reset student database back to initial sample records?")) {
        studentManager.resetToSampleData();
        this.showToast("Database reset to sample dataset.", "success");
      }
    });

    const dropzone = document.getElementById("file-dropzone");
    const fileInput = document.getElementById("file-input-element");

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());

      fileInput.addEventListener("change", async (e) => {
        if (e.target.files.length > 0) {
          await this.handleFileUpload(e.target.files[0]);
          fileInput.value = "";
        }
      });

      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "var(--secondary)";
      });

      dropzone.addEventListener("dragleave", () => {
        dropzone.style.borderColor = "var(--primary)";
      });

      dropzone.addEventListener("drop", async (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "var(--primary)";
        if (e.dataTransfer.files.length > 0) {
          await this.handleFileUpload(e.dataTransfer.files[0]);
        }
      });
    }
  }

  async handleFileUpload(file) {
    const res = await FileStorageEngine.importFile(file);
    if (res.success) {
      const info = res.data;
      this.showToast(`Imported ${info.importedCount || 0} student records successfully! (${info.skippedCount || 0} skipped/duplicate)`, "success");
    }
  }

  bindCodeShowcase() {
    const codePreview = document.getElementById("java-code-preview");
    if (codePreview) {
      codePreview.innerHTML = `<pre><code>${this.escapeHTML(JAVA_SOURCE_CODE)}</code></pre>`;
    }

    document.getElementById("btn-download-java")?.addEventListener("click", () => {
      const blob = new Blob([JAVA_SOURCE_CODE], { type: "text/x-java-source" });
      FileStorageEngine.triggerDownload(blob, "StudentRegistrationSystem.java");
      this.showToast("Downloaded StudentRegistrationSystem.java", "success");
    });

    const timelineContainer = document.getElementById("git-timeline-container");
    if (timelineContainer) {
      timelineContainer.innerHTML = GIT_HISTORY.map(item => `
        <div class="timeline-item">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span class="badge badge-major">${item.tag}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${item.date}</span>
          </div>
          <p style="font-weight: 700; font-size: 0.9rem; margin-bottom: 0.25rem;">${item.message}</p>
          <p style="font-size: 0.8rem; color: var(--text-muted);">${item.details}</p>
          <div style="margin-top: 0.5rem; font-size: 0.75rem;" class="font-mono">
            <span style="color: var(--secondary);">commit ${item.hash}</span> by ${item.author}
          </div>
        </div>
      `).join('');
    }
  }

  showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" style="color: ${type === 'success' ? 'var(--success)' : 'var(--danger)'};"></i>
      <div style="flex: 1;">${message}</div>
    `;

    container.appendChild(toast);
    this.initIcons();

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

new AppController();
