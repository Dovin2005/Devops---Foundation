# 🐧 Linux Shell Scripting – Monitoring & Service Check Basics

This repository contains beginner-level Bash scripts created while learning Linux shell scripting and Linux system administration fundamentals.


The focus of this project is:


- File and directory existence checking
- Disk usage monitoring
- CPU usage monitoring
- Linux system service status checking
- Conditional logic using `if`, `elif`, `else`, and `fi`
- Using `awk`, `sed`, and pipes (`|`)
- Command-line automation fundamentals


---


## 📁 Scripts in This Repository

---

## 1️⃣ File / Directory Check (`file-check.sh`)


### 📜 Script:


```bash
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

2️⃣ Disk Usage Check (disk-check.sh)

📜 Script:
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


3️⃣ CPU Usage Check (cpu-check.sh)

📜 Script:
#!/bin/bash


cpu=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')


if (( $(echo "$cpu > 80" | bc -l) )); then
    echo "⚠ CPU usage is HIGH: $cpu%"
else
    echo "CPU usage is normal: $cpu%"
fi

⚠ Requires bc:

sudo apt install bc

▶ Run:
chmod +x cpu-check.sh
./cpu-check.sh

4️⃣ System Service Check (service.sh)

📜 Script:
#!/bin/bash


if [ -z "$1" ]; then
    echo "Usage: $0 <service-name>"
    exit 1
fi


service=$1


if systemctl is-active --quiet "$service"; then
    echo "✅ $service is RUNNING"
else
    echo "❌ $service is NOT running"
fi

▶ Run:
chmod +x service.sh
./service.sh nginx
./service.sh sshd
./service.sh apache2

📚 What I Learned

Through this project I practiced:

Bash scripting fundamentals

Using script arguments

Creating variables

Conditional logic

Parsing Linux command output

Working with pipelines

Checking system services using systemctl

Monitoring Linux system resources
