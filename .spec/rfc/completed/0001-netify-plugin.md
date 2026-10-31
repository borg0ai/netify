# RFC 0001: Netify reusable plugin (Umbrella)

**Status:** Implemented

**Type:** Umbrella

## Summary

Make netify installable into any repository as a plugin so every listed skill and graph is used on every task, with a hook enforcing it. Children own the design: 0002 enforcement hook and config, 0003 plugin packaging and install, 0004 skill rules and renames.

## Problem

Netify today is a prompt-only skill used in one repository. The requirement that every listed capability is used cannot be met by instructions alone, and the skill cannot be installed with its enforcement elsewhere.

## Goals

Close when 0002, 0003 and 0004 are Implemented, all parts ship as one version 0.3.0 under a single `v0.3.0` tag, and the open verifications recorded in the children are resolved or disclosed.

## Non-goals

Enforcement on agents without a hook mechanism (prompt rules only there). Evidence verification beyond table wording. New capabilities beyond the default 12.

## Children

| RFC | Concern |
|-----|---------|
| [0004](0004-skill-rules-rename.md) | Netify skill rules and renames |
| [0003](0003-plugin-packaging.md) | Netify plugin packaging and install |
| [0002](0002-enforcement-hook.md) | Netify enforcement hook and .netify.json |

## Acceptance

Umbrella closes when listed children meet the Goals criteria; never reopen for new work.
