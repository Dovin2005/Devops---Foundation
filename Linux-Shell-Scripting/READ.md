# 🐧 Linux Shell Scripting Basics – Monitoring Scripts

This repository contains beginner-friendly shell scripts created while learning Linux system administration and Bash scripting.

The scripts focus on:

- 📂 File & Directory existence checking  
- 💽 Disk usage monitoring  
- 🧠 CPU usage monitoring  
- Conditional logic using `if / elif / else`  
- Using tools like `awk`, `sed`, and pipes (`|`)

---

## 📁 Scripts in This Repository

### 1️⃣ File Existence Check

**File:** `file-check.sh`

Checks whether a given path:

- Exists
- Is a regular file
- Is a directory

#### ▶ Run:

```bash
chmod +x file-check.sh
./file-check.sh /etc/passwd
./file-check.sh /etc
./file-check.sh somefile
