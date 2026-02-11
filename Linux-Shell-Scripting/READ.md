# 🐧 Linux Shell Scripting – Basic Monitoring & File Check Scripts

This repository contains simple Bash scripts created while learning Linux shell scripting fundamentals.

I practiced:

- Disk usage monitoring
- CPU usage monitoring
- File & directory existence checking
- Conditional statements (`if`, `elif`, `else`, `fi`)
- Command substitution `$(...)`
- Pipes (`|`)
- Text processing with `awk` and `sed`

---

## 📁 Scripts in This Repository

---

##  1️⃣ Disk Usage Check (`disk-check.sh`)

Checks root (`/`) disk usage and prints a warning if it is above 80%.

### 📜 Script:

```bash
#!/bin/bash

usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$usage" -gt 80 ]; then
    echo "⚠ Disk usage is HIGH: $usage%"
else
    echo "Disk usage is normal: $usage%"
fi

▶ Run:
chmod +x disk-check.sh
./disk-check.sh

2️⃣ CPU Usage Check (cpu-check.sh)

Checks CPU usage and alerts if it is higher than 80%.

📜 Script:
#!/bin/bash


cpu=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')


if (( $(echo "$cpu > 80" | bc -l) )); then
    echo "⚠ CPU usage is HIGH: $cpu%"
else
    echo "CPU usage is normal: $cpu%"
fi

⚠ This script requires bc.
Install if missing:

sudo apt install bc
▶ Run:
chmod +x cpu-check.sh
./cpu-check.sh

3️⃣ File / Directory Check (file-check.sh)

Checks whether a given path is:

A file

A directory

Or does not exist

📜 Script:
#!/bin/bash


if [ -z "$1" ]; then
    echo "Usage: $0 <path>"
    exit 1
fi


if [ -f "$1" ]; then
    echo "File exists"
elif [ -d "$1" ]; then
    echo "Directory exists"
else
    echo "No such file or directory"
fi
▶ Run:
chmod +x file-check.sh
./file-check.sh /etc/passwd
./file-check.sh /etc
./file-check.sh testfile

📚 What I Learned

Through these scripts I practiced:

Creating Bash scripts

Using variables

Reading command output into variables

Using if / elif / else

Monitoring system resources

Working with Linux pipelines

Parsing output using awk and sed
