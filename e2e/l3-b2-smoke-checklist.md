# L3 + B2 remediation smoke checklist

Copy this checklist into the remediation PR description and run it against a
deployment containing both frontend and study-agent-service changes.

- [ ] Start Generate All for a two-topic queue (a topic and subtopic).
- [ ] Open the pending leaf on Generate page 1; confirm “Queued in Generate All”
      is visible and manual generate/regenerate cannot be started.
- [ ] When that leaf becomes the running step, confirm Material page 2 shows
      Progress and the setup page does not show the queued banner.
- [ ] With only Previous, Removed, or mentor-archive versions left, confirm the
      History Hub appears.
- [ ] Restore or create a workspace draft (or make a version live); confirm the
      History Hub disappears.
- [ ] Start, pause, or recover a study-material run while history-only versions
      exist; confirm Progress wins over the History Hub.
