# Upstream Update Workflow

The contractor keeps modifications in a separate repository.

```bash
git remote add upstream https://github.com/qiek007/shopify-marketing-web.git
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

Use a dedicated integration branch when local changes are extensive. Resolve conflicts in the contractor repository; do not request direct push access to upstream.
