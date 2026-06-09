# Executive Summary

## Objective

Give IT a clear implementation handoff for the MVA procurement prototype: business process, role permissions, closed-loop data flow, current technical state, and a containerized UAT deployment path.

## Current Implemented State

- Frontend: single-page procurement prototype with role-specific screens, dense tables, workflow status modules, role guards, quote/price helper modules, carryover/warehouse logic, and local in-memory workflow state.
- Backend: Node.js HTTP server with static hosting and JSON/multipart APIs.
- Database: MySQL optional pool with memory fallback. Current SQL includes users, sessions, OM assignments, UAT feedback, attachments, audit events, item/material/FTV/customs support tables.
- Attachments: local file retention MVP is deployed for OM internal test. Metadata is stored in MySQL; files are stored under a local upload root.

## Not Yet Persisted

The main workflow is not fully persisted yet:

- request packages
- request items and demand rows
- Dept DRI and Cost Manager approval records
- OM PAS Demand No and quote result workflow
- Requester quote confirmation and amendment flow
- OM export package workflow
- Buyer Handoff PR/PO/progress
- warehouse/carryover workflow ledgers as persisted DB contracts

## Implementation Principle

Do not copy the overloaded frontend row object into one database table. Define workflow-owned tables first, then API contracts, then frontend hydration/actions.

## Recommended Deployment Path

Docker Compose is the recommended UAT handoff path. It runs:

- Node app container
- MySQL container
- named MySQL data volume
- named upload volume

The existing native Mac mini LaunchAgent deployment remains a fallback when IT prefers local Homebrew MySQL and a local Node service.
