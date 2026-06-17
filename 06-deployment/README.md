# Deployment Entry

Deployment assets for the Mac mini UAT host.

## Mac mini

- Runbook: `mac-mini/README.md`
- Deploy script: `mac-mini/deploy.sh`
- Hotfix helper: `mac-mini/hotfix.sh`
- Source-to-runtime sync: `mac-mini/sync-runtime-from-source.sh`

Runtime secrets such as `.env` are local-only and must not be committed.
