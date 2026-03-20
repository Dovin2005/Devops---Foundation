                                  # 🚀 DevOps Git Branch Workflow (dev → qa → main)


# This project demonstrates a basic **Git branching strategy** used in real DevOps environments, including:

          * Repository setup
          * Branch creation (main, dev, qa)
          * Working in dev branch
          * Pull Request workflow
          * Fetch, Revert, Abort usage
          

# Branch Strategy

          main → Production
          qa   → Testing
          dev  → Development

   ## Workflow:

          dev → qa → main


# STEP:1 Initial Setup

   ## Configure Git identity

         git config --global user.name "Your Name"
         git config --global user.email "your-email@gmail.com"

   ## Initialize repository

         git init
         git remote add origin <repo-url>


# STEP:2 Create Branches

   ## Create main:

         git branch -M main
         git push -u origin main


   ## Create dev:

         git checkout -b dev
         git push -u origin dev


   ## Create qa:

         git checkout main
         git checkout -b qa
         git push -u origin qa


# STEP:3 Working in dev Branch

   ## Switch to dev:

         git checkout dev

 
   ### Make changes:


         git add .
         git commit -m "Update README"
         git push


   ## Merge Workflow

    ### dev → qa

        git checkout qa
        git merge dev
        git push

    ### qa → main

        git checkout main
        git merge qa
        git push


# STEP:4 Git Fetch

    Fetch downloads changes without merging.

        git fetch
        git fetch origin dev


     Used for:

          * Checking updates
          * CI/CD pipelines
          * Avoiding conflicts


# STEP:5 Git Revert (Safe Rollback)

      Revert creates a new commit that undoes a previous commit.

                git revert <commit-id>

      Revert last commit:

               git revert HEAD --no-edit


      Use cases:

            * Production bug
            * Wrong commit pushed
            * Safe rollback


# STEP:6 Git Abort (Cancel Operation)

    Abort cancels an ongoing merge or rebase.

      Merge abort:

          git merge --abort

      Rebase abort:

        git rebase --abort

  Used when:

       * Merge conflict messy
       * Release issues
       * CI/CD failures

Abort does not affect GitHub.

# STEP:7 Useful Commands

   ## Check branch:

            git branch


   ## Check status:

            git status


   ## View history:

             git log --oneline


   ## Pull latest:

             git pull


   ## Push changes:

             git push



