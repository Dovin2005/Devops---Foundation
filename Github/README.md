# 🚀 DevOps Git Branch Workflow (dev → qa → main)

This project demonstrates a basic **Git branching strategy** used in real DevOps environments, including:

* Repository setup
* Branch creation (main, dev, qa)
* Working in dev branch
* Pull Request workflow
* Fetch, Revert, Abort usage

---

## 📁 Branch Strategy

```
main → Production
qa   → Testing
dev  → Development
```

Workflow:

```
dev → qa → main
```

---

## ⚙️ Initial Setup

### Configure Git identity

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@gmail.com"
```

### Initialize repository

```bash
git init
git remote add origin <repo-url>
```

---

## 🌿 Create Branches

Create main:

```bash
git branch -M main
git push -u origin main
```

Create dev:

```bash
git checkout -b dev
git push -u origin dev
```

Create qa:

```bash
git checkout main
git checkout -b qa
git push -u origin qa
```

---

## 💻 Working in dev Branch

Switch to dev:

```bash
git checkout dev
```

Make changes:

```bash
git add .
git commit -m "Update README"
git push
```

---

## 🔁 Merge Workflow

### dev → qa

```bash
git checkout qa
git merge dev
git push
```

### qa → main

```bash
git checkout main
git merge qa
git push
```

---

## 📥 Git Fetch

Fetch downloads changes without merging.

```bash
git fetch
git fetch origin dev
```

Used for:

* Checking updates
* CI/CD pipelines
* Avoiding conflicts

---

## ↩️ Git Revert (Safe Rollback)

Revert creates a new commit that undoes a previous commit.

```bash
git revert <commit-id>
```

Revert last commit:

```bash
git revert HEAD --no-edit
```

Use cases:

* Production bug
* Wrong commit pushed
* Safe rollback

---

## 🛑 Git Abort (Cancel Operation)

Abort cancels an ongoing merge or rebase.

Merge abort:

```bash
git merge --abort
```

Rebase abort:

```bash
git rebase --abort
```

Used when:

* Merge conflict messy
* Release issues
* CI/CD failures

Abort does not affect GitHub.

---

## 🔎 Useful Commands

Check branch:

```bash
git branch
```

Check status:

```bash
git status
```

View history:

```bash
git log --oneline
```

Pull latest:

```bash
git pull
```

Push changes:

```bash
git push
```


