# Git Workflow Best Practices

## Core Principles

### Small, Atomic Commits
- **One logical change per commit** - Each commit should represent a single, complete idea
- **Commit early, commit often** - Don't accumulate large changes
- **Test before committing** - Ensure each commit leaves the code in a working state

### Git as Safety Net
- **Use git to enable experimentation** - Make bold changes knowing you can revert
- **Branch for features** - Keep main branch stable, experiment in feature branches
- **Commit before refactoring** - Save working state before making changes
- **Use git diff to review changes** - Always review what you're committing

### Commit Message Standards
```
Brief description of what changed (50 chars max)

Longer explanation if needed:
- Why this change was made
- What problem it solves
- Any side effects or considerations

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Development Workflow

### 1. Before Starting Work
```bash
git status                    # Check current state
git diff                      # Review any uncommitted changes
git add . && git commit       # Commit any pending work
```

### 2. Making Changes
```bash
# Make smallest possible change
# Test the change
git add specific-files        # Stage only related files
git commit -m "descriptive message"
```

### 3. Testing Changes
- **Build succeeds**: `npm run build` (if applicable)
- **Tests pass**: `npm test` (if applicable)
- **Functionality works**: Manual testing of the feature
- **No regressions**: Quick check that existing features still work

### 4. When Things Go Wrong
```bash
git diff                      # See what changed
git checkout -- file.ts      # Discard changes to specific file
git reset --hard HEAD        # Nuclear option: discard all changes
git log --oneline -10         # See recent commits
git revert commit-hash        # Safely undo a specific commit
```

## Anti-Patterns to Avoid

- ❌ **Large, multi-feature commits** - Hard to review and revert
- ❌ **Committing broken code** - Breaks git bisect and collaboration
- ❌ **Fear of committing** - Leads to large, risky changes
- ❌ **Committing without testing** - Introduces bugs into history
- ❌ **Generic commit messages** - "fix stuff", "updates", "wip"

## Integration with Development

### When Building Features
1. **Start with tests/schemas** - Define the interface first
2. **Implement minimal version** - Get something working quickly
3. **Commit working state** - Even if incomplete
4. **Iterate in small steps** - Each step is a commit
5. **Refactor with confidence** - Git safety net enables bold improvements

### When Debugging
1. **Commit current state** - Save progress before investigating
2. **Make minimal test changes** - One variable at a time
3. **Commit fixes immediately** - Don't accumulate debug changes
4. **Document what you learned** - In commit messages

### When Refactoring
1. **Commit before refactoring** - Ensure you can get back to working state
2. **Refactor in small steps** - Move, rename, extract - one at a time
3. **Test after each step** - Ensure functionality is preserved
4. **Commit each refactoring step** - Granular history helps with debugging

## Emergency Procedures

### "I broke everything"
```bash
git status                    # See what's broken
git diff                      # See what changed
git checkout -- .            # Discard all uncommitted changes
```

### "I committed broken code"
```bash
git log --oneline -5          # Find the bad commit
git revert bad-commit-hash    # Create new commit that undoes the bad one
```

### "I need to go back to working version"
```bash
git log --oneline -10         # Find last known good commit
git reset --hard good-commit  # DANGER: Loses all changes after that commit
```

## Benefits of This Approach

- **Faster development** - Less fear of breaking things
- **Better debugging** - Git bisect to find when bugs were introduced
- **Easier collaboration** - Small, understandable changes
- **Learning from history** - Git log becomes documentation
- **Confident refactoring** - Always have escape hatch

Remember: Git is your friend, not your enemy. Use it liberally to enable rapid, confident development.