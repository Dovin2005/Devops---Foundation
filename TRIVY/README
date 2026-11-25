# Trivy – Installation, Configuration and Practical Usage

## 1. Introduction

Trivy is an open-source security vulnerability scanner developed by Aqua Security.

It helps DevOps engineers and developers identify security vulnerabilities, exposed secrets, and configuration issues in applications, container images, filesystems, and infrastructure configurations.

Trivy helps identify security risks before deploying applications into production.

## 2. Why Do We Use Trivy?

We use Trivy to:

- Identify known vulnerabilities in operating-system packages.
- Find vulnerable application dependencies.
- Scan Docker images before deployment.
- Detect exposed secrets such as API keys and passwords.
- Identify security misconfigurations in supported configuration files.
- Generate security reports.
- Verify whether vulnerabilities have been resolved after remediation.

**Important:** Trivy detects security issues. It does not automatically fix every vulnerability. Developers and DevOps engineers must analyse and remediate the findings.

## 3. How Does Trivy Work?

Trivy analyses the target provided by the user.

It identifies installed packages, supported dependency files, configuration files, and potential secrets. It then compares package information against its vulnerability database and applies the selected scanners.

### Basic working process

1. Select a target to scan.
2. Select the required security scanners.
3. Trivy analyses the target.
4. It checks detected packages against its vulnerability database.
5. It identifies vulnerabilities and other security findings.
6. It generates the results in the terminal or a report file.
7. Engineers analyse and remediate the findings.
8. Run another scan to verify the fixes.

### Trivy scanning types

| Scan type | Purpose |
|---|---|
| Image scanning | Scans container images |
| Repository scanning | Scans local Git repositories |
| Filesystem scanning | Scans local directories and files |
| Configuration scanning | Detects supported configuration misconfigurations |

## 4. Understanding Trivy Scanners

Trivy supports different scanners.

| Scanner | Purpose |
|---|---|
| `vuln` | Detects known software vulnerabilities |
| `misconfig` | Detects configuration misconfigurations |
| `secret` | Detects potential exposed credentials |
| `license` | Analyses software dependency licences |

### Vulnerability severity levels

| Severity | Description |
|---|---|
| CRITICAL | Extremely serious vulnerability |
| HIGH | Serious vulnerability |
| MEDIUM | Moderate vulnerability |
| LOW | Lower-severity vulnerability |
| UNKNOWN | Severity is not determined |

### What is CVE?

CVE stands for Common Vulnerabilities and Exposures.

It is a unique identifier assigned to a publicly known security vulnerability.

Example:

`CVE-2025-XXXXX`

### Understanding vulnerability report fields

| Field | Description |
|---|---|
| Library | Vulnerable package name |
| Vulnerability | CVE identifier |
| Severity | Vulnerability severity |
| Installed Version | Currently installed package version |
| Fixed Version | Version containing an available fix |
| Title | Vulnerability description |
| Status | Finding status, where provided |

**Note:** An available fixed version does not mean the installed package is already patched. An empty fixed-version field means Trivy has not reported a known fixed version for that finding.

---

## 5. Environment Details

Practical testing environment:

| Component | Version / Details |
|---|---|
| Operating System | Ubuntu 24.04.5 LTS |
| Architecture | x86_64 |
| Trivy Version | 0.76.2 |
| Project | Doccure |
| Project Directory | `/opt/doccure` |
| Docker Image Tested | `jellyfin/jellyfin:latest` |

## 6. Trivy Installation on Ubuntu 24.04

The following steps install Trivy using its official Debian/Ubuntu APT repository.

### Step 1: Install required packages

```bash
sudo apt-get update
sudo apt-get install -y wget gnupg
```

### Step 2: Add the Trivy GPG key

```bash
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | \
gpg --dearmor | \
sudo tee /usr/share/keyrings/trivy.gpg > /dev/null
```

### Step 3: Add the Trivy repository

```bash
echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main" | \
sudo tee -a /etc/apt/sources.list.d/trivy.list
```

### Step 4: Update package information

```bash
sudo apt-get update
```

### Step 5: Install Trivy

```bash
sudo apt-get install -y trivy
```

### Step 6: Verify installation

```bash
trivy --version
```

Expected installed version in our practical environment:

```text
Version: 0.76.2
```

---

## 7. Basic Trivy Commands

### Check Trivy version

```bash
trivy --version
```

Displays the installed Trivy version.

### Display available commands

```bash
trivy --help
```

Displays Trivy command-line usage information.

### Update vulnerability database

```bash
trivy image --download-db-only
```

Downloads the vulnerability database used for image scanning.

Trivy also manages its databases and caches automatically when required during normal scanning.

---

## 8. Docker Image Vulnerability Scanning

Trivy can scan container images without starting the containers.

It analyses operating-system packages and supported application dependencies inside the image.

### Step 1: List available Docker images

```bash
docker images
```

### Step 2: Scan a Docker image

```bash
trivy image jellyfin/jellyfin:latest
```

### Step 3: Scan with specific scanners

```bash
trivy image \
  --scanners vuln,misconfig,secret \
  jellyfin/jellyfin:latest
```

### What does Docker image scanning check?

- Operating-system packages.
- Application dependencies.
- Known vulnerabilities.
- Supported image configuration issues.
- Potential exposed secrets.

### Step 4: Understand the scan results

Review:

- Package name.
- Installed package version.
- CVE identifier.
- Severity.
- Fixed version.

Prioritise findings based on severity, exposure, exploitability, and application impact.

---

## 9. Practical Docker Image Testing – Jellyfin

We used Jellyfin as a practical example to understand how vulnerabilities can be reduced by updating operating-system packages.

### Original Docker Compose configuration

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    ports:
      - "8096:8096/tcp"
    volumes:
      - /mnt/jellyfin/config:/config
      - /mnt/jellyfin/cache:/cache
      - /mnt/cloud-media:/cloud-media
      - /mnt/jelly-media:/jelly-media
    restart: unless-stopped
```

### Step 1: Scan the original image

```bash
trivy image jellyfin/jellyfin:latest
```

The scan identified vulnerabilities in Debian operating-system packages and the bundled .NET runtime.

### Step 2: Create a test Dockerfile

```dockerfile
FROM jellyfin/jellyfin:latest

RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*
```

### Step 3: Build the test image

```bash
docker build -t jellyfin/jellyfin:trivy-test .
```

### Step 4: Scan the updated test image

```bash
trivy image jellyfin/jellyfin:trivy-test
```

### Observations

- Updating Debian packages reduced some operating-system vulnerabilities.
- The test image size increased after package updates.
- Some vulnerabilities remained after the update.
- The bundled .NET runtime findings were not resolved by updating Debian packages.

Our test report showed Debian findings reducing from approximately 127 to 68.

### Step 5: Investigate the .NET runtime

We inspected the runtime configuration:

```bash
cat /jellyfin/jellyfin.runtimeconfig.json
```

The configuration showed:

```json
{
  "runtimeOptions": {
    "tfm": "net10.0",
    "includedFrameworks": [
      {
        "name": "Microsoft.NETCore.App",
        "version": "10.0.14"
      },
      {
        "name": "Microsoft.AspNetCore.App",
        "version": "10.0.14"
      }
    ]
  }
}
```

Trivy reported a vulnerability affecting the bundled .NET runtime version 10.0.14, with 10.0.15 reported as a fixed version.

**Conclusion:**

Updating operating-system packages does not necessarily update application-bundled runtimes.

The correct remediation is to use a compatible Jellyfin image containing a patched runtime, test the image, and validate the application before deployment.

This was a test exercise. We did not replace the production Jellyfin image.

---

## 10. Repository Scanning

Repository scanning analyses supported dependency files, configuration files, and secrets in a local Git repository.

### Step 1: Navigate to the project

```bash
cd /opt/doccure
```

### Step 2: Run a repository scan

```bash
trivy repo \
  --scanners vuln,misconfig,secret \
  .
```

### Explanation

- `trivy repo` – Scans a local Git repository.
- `--scanners` – Selects the scanners.
- `vuln` – Checks known vulnerabilities.
- `misconfig` – Checks supported configuration misconfigurations.
- `secret` – Checks for potential exposed secrets.
- `.` – Uses the current directory as the scan target.

### What does repository scanning check?

**Vulnerability scanning:**

- Composer dependencies.
- npm dependencies.
- Yarn dependencies.
- Other supported dependency manifests and lockfiles.

**Misconfiguration scanning:**

- Supported Dockerfiles.
- Kubernetes YAML files.
- Infrastructure configuration files.
- Other supported configuration formats.

**Secret scanning:**

- API keys.
- Passwords.
- Access tokens.
- Other credential-like strings.

### Example scan logs

```text
Number of language-specific files num=33

[composer] Detecting vulnerabilities...
[npm] Detecting vulnerabilities...
[yarn] Detecting vulnerabilities...

Detected config files num=1
```

These messages indicate that Trivy detected supported language-specific and configuration files for analysis.

### Dependency remediation process

1. Identify the vulnerable package.
2. Find the project that uses the package.
3. Check the available fixed version.
4. Update the dependency and lockfile.
5. Test the application.
6. Run Trivy again to verify the result.

Do not blindly upgrade all dependencies in production.

---

## 11. Secret Scanning

Trivy can identify strings that look like sensitive credentials.

Examples include:

- API keys.
- Passwords.
- Tokens.
- Private keys.

### Important: False positives

Not every secret finding is a genuine credential leak.

For example:

- Stripe Publishable Keys are intended to be public.
- Stripe Secret Keys must remain private.

Always verify the finding before deciding what action to take.

If a genuine secret has been exposed:

1. Revoke or rotate the credential.
2. Remove it from the source code.
3. Store it securely using environment variables or a secrets manager.
4. Review repository history if the credential was committed.
5. Run another secret scan.

Never share unredacted reports containing real credentials.

---

## 12. Filesystem Scanning

Filesystem scanning is used to scan a local directory or filesystem path.

Unlike repository scanning, the target does not have to be a Git repository.

### Command

```bash
cd /opt/doccure

trivy fs \
  --scanners vuln,misconfig,secret \
  .
```

### Explanation

- `trivy fs` – Performs filesystem scanning.
- `--scanners` – Selects the required scanners.
- `.` – Scans the current directory.

Filesystem scanning can identify vulnerabilities in supported dependency files, configuration misconfigurations, and potential secrets.

---

## 13. Generating Trivy Reports

Trivy supports different report formats.

### A. Terminal report

```bash
trivy repo .
```

Displays the scan results directly in the terminal.

### B. JSON report

```bash
trivy repo \
  --scanners vuln,misconfig,secret \
  --format json \
  --output /opt/trivy-reports/doccure-full-report.json \
  .
```

JSON reports are useful for automation and further analysis.

**Security note:** Protect reports containing secret findings because they may include sensitive matched content.

Set restricted permissions:

```bash
chmod 600 /opt/trivy-reports/doccure-full-report.json
```

### C. HTML report

Create the report directory:

```bash
mkdir -p /opt/trivy-reports
```

Download the HTML template:

```bash
wget -O /opt/trivy-reports/html.tpl \
https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/html.tpl
```

Navigate to the project:

```bash
cd /opt/doccure
```

Generate the HTML report:

```bash
trivy repo \
  --scanners vuln,misconfig \
  --format template \
  --template "@/opt/trivy-reports/html.tpl" \
  --output /opt/trivy-reports/doccure-report.html \
  .
```

**Note:** The standard HTML template does not display secret findings. Use the separate protected JSON report for secret scan results.

### D. Verify generated reports

```bash
ls -lh /opt/trivy-reports/
```

### E. Open the HTML report

On a server without a desktop browser, copy the HTML file to your laptop:

```bash
scp root@SERVER_IP:/opt/trivy-reports/doccure-report.html ~/Downloads/
```

Open the file on your laptop:

```bash
xdg-open ~/Downloads/doccure-report.html
```

Alternatively, open the HTML file in a browser and use Print → Save as PDF.

**Note:** Avoid launching Chromium as root with `--no-sandbox` just to open the report. Use a normal desktop user account.

---

## 14. Does Trivy Modify Application Files?

No. Normal Trivy scanning is read-only.

Trivy analyses files and package information to identify security findings.

It does not automatically:

- Modify application source code.
- Upgrade vulnerable dependencies.
- Rewrite Dockerfiles.
- Fix Kubernetes configurations.
- Remove exposed credentials.

Scanning may use CPU, memory, network bandwidth, and disk space for analysis and database downloads.

---

## 15. Real-World DevSecOps Workflow

A typical workflow for using Trivy in a DevOps environment:

```text
Developer pushes code to GitLab
             |
             v
       CI/CD Pipeline
             |
             v
        Trivy Scan
             |
             v
     Generate Scan Report
             |
             v
    Analyse Vulnerabilities
             |
             v
     Fix Identified Issues
             |
             v
        Rescan Project
             |
             v
      Validate Application
             |
             v
        Deploy Application
```

### Responsibilities

**Developer:**

- Fix vulnerable application dependencies.
- Remove hardcoded credentials.
- Correct application-related security issues.

**DevOps Engineer:**

- Scan Docker images.
- Analyse infrastructure configuration findings.
- Review scan reports.
- Coordinate remediation.
- Integrate scanning into CI/CD.
- Verify fixes before deployment.

---

## 16. Important Commands Reference

| Command | Purpose |
|---|---|
| `trivy --version` | Check installed version |
| `trivy --help` | Display help |
| `trivy image IMAGE` | Scan a container image |
| `trivy repo .` | Scan a local Git repository |
| `trivy fs .` | Scan a filesystem path |
| `docker images` | List Docker images |
| `docker build -t NAME .` | Build a Docker image |
| `ls -lh DIRECTORY` | List files and sizes |
| `chmod 600 FILE` | Restrict file permissions |
| `scp SOURCE DESTINATION` | Transfer a file over SSH |

---

## 17. Learning Summary and Next Steps

### Practical topics covered

- Understanding Trivy and its purpose.
- Installing Trivy on Ubuntu.
- Checking the installed Trivy version.
- Understanding CVEs and severity levels.
- Docker image vulnerability scanning.
- Testing Docker image package updates.
- Investigating bundled .NET runtime vulnerabilities.
- Repository scanning.
- Dependency vulnerability analysis.
- Secret scanning and false positives.
- Understanding filesystem scanning.
- Generating HTML and JSON reports.
- Understanding remediation and rescanning.

### Further practical exercises

The following topics are additional steps toward production-level DevSecOps usage:

- Complete filesystem scan and report analysis.
- Practical dependency remediation and verification.
- Dockerfile and Kubernetes manifest scanning exercises.
- Jenkins pipeline integration.
- GitLab CI/CD integration.
- Configuring pipeline failure rules based on severity.
- Automating report storage and review.

## 18. Conclusion

Trivy is a useful security scanning tool for DevOps and DevSecOps workflows.

It helps identify known vulnerabilities, exposed secrets, and supported configuration misconfigurations in applications, container images, filesystems, and infrastructure configurations.

The recommended workflow is:

**Scan → Analyse → Fix → Rescan → Validate → Deploy**

Using Trivy regularly helps teams identify security risks earlier in the software delivery lifecycle.

---

## Official Documentation

- Trivy Documentation: https://trivy.dev/
- Trivy Installation Guide: https://www.trivy.dev/docs/latest/getting-started/installation/
- Trivy GitHub Repository: https://github.com/aquasecurity/trivy
