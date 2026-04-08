---
name: branch-update-policy
description: A skill for updating branches different to the main branch in a git repository, after the main branch is pushed.
---

1. **Trigger**: pushing to the main branch
2. **Action**: update "tucuchess" branch with the new changes from main. Prefer a rebase strategy to keep history clean.
3. **Verification**: ensure the "tucuchess" branch is up to date with main and that there are no merge conflicts. If conflicts arise, solve them.
4. **Push**: push the updated "tucuchess" branch to the remote repository.
5. **Back to normal**: return to main branch.
