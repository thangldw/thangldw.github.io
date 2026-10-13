---
version: alpha
colors:
  canvas: "#f6f5f1"
  text: "#23291f"
  accent: "#965025"
typography:
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: "1.6"
---

## Overview

An adult certification learner's anime study workspace. Selected robot academy mockup is the visual truth. The signature is a soft white robot in a quiet study nook beside a readable syllabus and topic context. Deliver one source-backed AWS RDS topic, not a full certification engine.

## Colors

The authoritative owner is the exact mirror of portfolio public/css/tokens.css; public/css/site-shell.css is the final entry stylesheet. shared-source-manifest.json records hashes. Route CSS uses semantic roles only. Pastel grouping uses existing brand-soft, accent-soft and success-soft tokens; no competing palette.

## Typography

Canonical Inter variable font, readable body scale and CJK font stacks from tokens.css. Original lesson text stays English. All interface navigation and guidance are Vietnamese. Original question text stays English or Japanese; Japanese support remains optional Vietnamese.

## Layout

Desktop sidebar, two-column corpus/context, upper-right robot illustration. Narrow view becomes horizontal navigation, one content column and a compact illustration. Readers scroll naturally.

## Elevation & Depth

Flat grouping and borders. No route shadows or gradients.

## Shapes

Use shared radii and logo recipe. Illustration remains a raster asset.

## Components

Canonical site shell owns brand, control recipes, theme, focus and scrollbars. Shared Button, stage strip and feedback region serve all study steps. Phosphor supplies icons. Native radio and dialog behavior are retained.

## Do's and Don'ts

Hide lesson clues before recall. Separate self-assessment and scored application. No AI grading, pass prediction, simulated full exam, protected bank import or new review scheduler. Do not overwrite real study storage.

## JLPT variation

The same shell and robot serve a Japanese-language profile. Corpus rows use vocabulary/grammar/reading/listening study groups rather than AWS weights. The lesson contrasts negation scope, then uses written recall and an original short reading passage. Japanese source text uses canonical CJK font stacks at 16px with relaxed line height; optional Vietnamese explanations are disclosures. No new palette or session engine.

## Vietnamese learner interface

The interface is Vietnamese only; there is no UI language selector. Header brand uses the same desktop column boundary as navigation and the same text axis. Course selector sits over main content. Technical source language is retained independently of UI language. Body guidance and session lifecycle messages are Vietnamese; Japanese source glyphs keep their explicit CJK stack.

## Connected practice

Luyện câu hỏi reuses the shared Button, canonical native select and shell controls. It is a focused reader/scoring surface: no mascot overlays, corpus graphics or invented progress metrics. The header names Ngân hàng câu hỏi rather than showing a competing lesson selector. Choose the certification once in the practice setup. The controlled catalog is metadata-only; question text remains in its original language and support is optional.

## Study mode navigation

Luyện đề nhanh is the default destination. Học để nhớ groups guided learning, recall and apply. Recall writing is an optional disclosure; mental recall can reveal guidance with no input. Shared palette, typography, logo and Button owner remain unchanged.

## Independent certification workspaces

Learning is a directory. Native links open /<catalog slug>/ in this preview; the certification is fixed by the URL and its header. No certification dropdown. Default workspace view is quick practice. Guided lessons exist only for AWS and JLPT; other certificates show explicit unavailable lesson states. Persisted bank sessions stay isolated by canonical cert ID. Existing production certification routes are not changed by the preview.

Navigation order: Hôm nay → Tổng quan → Học để nhớ → Luyện đề nhanh → Kiểm tra tiến độ. Default view remains quick practice; menu order is independent of the initial destination.

## Source-backed practice insights

All certification workspaces share LearningNavigation and BankInsights. Today derives next actions from the saved bank queue; Overview and Progress use controlled API index metadata joined by stable question ID to local practice result metadata. Bank session storage owns an additive practiceProgress projection (latest result, attempt count, last session identity); reloading feedback is idempotent and queue reset preserves history. Legacy results backfill only the queue still stored, with no invented timestamps or prior attempts. Written self-check remains separate from objective results. Guided lesson demo state never contributes to practice statistics. API prompts, explanations, keys and tokens remain excluded from persistence.

Bank index metadata is shared only in bounded memory for five minutes, including in-flight deduplication; errors are evicted and are retryable. This avoids quota-consuming requests on each navigation and does not cache protected prompts or feedback. Today starts a new setup only for an already completed queue; history persists. Empty banks cannot start.
