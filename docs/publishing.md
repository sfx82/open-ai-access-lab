# Publish the prepared release (owner actions only)

Nothing in this preparation pushes, merges, creates a GitHub release or deploys. All commands below are instructions for an explicitly approved future publication.

## Configure approval before the first dispatch

1. In repository **Settings > Pages > Build and deployment**, choose **GitHub Actions** as the source.
2. In **Settings > Environments**, create/configure `github-pages`. Set deployment branches to **Selected branches and tags**, with branch `main` only. Configure **Required reviewers** with the authorized owner/reviewer. Disable administrator bypass if appropriate for the team. These remote settings cannot be enforced by the workflow YAML and have not been changed here.
3. Protect `main` through repository branch rules and require review before merging the release PR.

The workflow has no push, pull-request or scheduled deployment trigger. It accepts only manual `workflow_dispatch`, defaults `approve_publication` to false, and gates both jobs on `refs/heads/main` plus explicit approval input. A dispatch on a feature branch skips both jobs. Environment approval provides a second gate when configured; the manual input alone is not a substitute for required reviewer settings.

## Review and publish after explicit owner consent

From the repository, inspect the local commit and verify:

```sh
git status --short
python benchmarks/validate_report.py public/results/ollama-v0.1-run01.json --source results/ollama-v0.1-run01.json
python -m unittest discover -s tests -v
npm test
npm run lint
npm run build
```

Only after consent to publish code:

```sh
git push -u origin feat/mvp-v0.1
```

Open a pull request from `feat/mvp-v0.1` to `main`, review the source, public JSON and workflow, then merge only after owner approval. No benchmark execution is required by the workflow.

After the approved merge, open **Actions > Publish reviewed GitHub Pages > Run workflow**, choose **main**, check the explicit publication confirmation and run. Review the commit SHA, then approve the waiting `github-pages` deployment in **Review deployments**. Do not approve if branch/environment protections are missing.

Expected site: https://sfx82.github.io/open-ai-access-lab/ . Vite base path and same-origin report URLs use `/open-ai-access-lab/`. Only `dist/` is uploaded, not local reports, source files or environment settings. Check the two medians, all six repetitions, hardware and JSON download after deployment.

Official references: [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).
