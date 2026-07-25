(function (global) {
  global.portfolioProjects = [
    {
      id: 'bizroll',
      title: 'BizRoll',
      description: 'A 2–4 player economic strategy board game with multiplayer rooms, AI opponents, auctions, market cycles, secret objectives, and Black Swan events.',
      featuredDescription: 'A multiplayer economic strategy game shaped by auctions, AI opponents, market cycles, and Black Swan events.',
      href: 'https://thangldw.github.io/bizroll/',
      ariaLabel: 'Open BizRoll',
      icon: 'fa-cubes-stacked',
      accent: 'rose',
      status: 'Live',
      tags: ['Board game', 'Multiplayer', 'AI opponents', 'Market simulation'],
      category: 'games',
      cta: 'Open BizRoll',
      featured: true,
      featuredOrder: 0
    },
    {
      id: 'diskora',
      title: 'Diskora',
      description: 'A native macOS storage intelligence and cleanup app. Inspect where space goes, review safe and deep-clean candidates, detect exact or similar files and photos, and remove only what you approve.',
      featuredDescription: 'Native macOS storage analysis and review-first cleanup, including duplicates and developer leftovers.',
      href: 'https://github.com/thangldw/toolbox/releases/tag/diskora-v1.0.0',
      ariaLabel: 'Download Diskora 1.0.0 for macOS from GitHub Releases',
      icon: 'fa-magnifying-glass-chart',
      accent: 'blue',
      status: 'v1.0.0',
      tags: ['macOS', 'Storage analysis', 'Safe cleanup', 'Duplicate files'],
      category: 'developer-tools',
      cta: 'Download Diskora',
      featured: true,
      featuredOrder: 1
    },
    {
      id: 'changeora',
      title: 'Changeora',
      description: 'A local-first macOS change journal that records filesystem snapshots and explains what changed between them. Review added, modified, and removed items without uploading private metadata.',
      featuredDescription: 'Local-first filesystem snapshots that make changes on your Mac visible and explainable.',
      href: 'https://github.com/thangldw/toolbox/releases/tag/changeora-v1.0.0',
      ariaLabel: 'Download Changeora 1.0.0 for macOS from GitHub Releases',
      icon: 'fa-arrows-rotate',
      accent: 'violet',
      status: 'v1.0.0',
      tags: ['macOS', 'Change journal', 'Local-first', 'Filesystem snapshots'],
      category: 'developer-tools',
      cta: 'Download Changeora',
      featured: true,
      featuredOrder: 2
    },
    {
      id: 'ragops',
      title: 'RAGOps',
      description: 'An evaluation and release-gate platform for production RAG and agent systems. Compare a candidate against an accepted baseline, detect quality and safety regressions, and produce auditable reports.',
      featuredDescription: 'Evaluation and release gates for production RAG and agent systems.',
      href: 'https://github.com/thangldw/ragops',
      ariaLabel: 'Open RAGOps on GitHub',
      icon: 'fa-shield-halved',
      accent: 'green',
      status: 'v1.0',
      tags: ['AI evaluation', 'Red team', 'FastAPI', 'CI/CD'],
      category: 'data-ai',
      cta: 'Open on GitHub',
      featured: true,
      featuredOrder: 3
    },
    {
      id: 'maintainer-defense',
      title: 'Awesome Maintainer Defense',
      description: 'A read-only, reversible defense system for open-source maintainers. Audit repository governance, GitHub Actions, and moderation risk offline, then review generated patches and deployable defense profiles.',
      featuredDescription: 'Offline, reversible security audits and defense profiles for open-source maintainers.',
      href: 'https://github.com/thangldw/awesome-maintainer-defense',
      ariaLabel: 'Open Awesome Maintainer Defense on GitHub',
      icon: 'fa-shield-halved',
      accent: 'rust',
      status: 'v1.0',
      tags: ['OSS security', 'Offline auditor', 'Supply chain', 'Python'],
      category: 'developer-tools',
      cta: 'Open on GitHub',
      featured: true,
      featuredOrder: 4
    },
    {
      id: 'proofline',
      title: 'Proofline',
      description: 'Local-first engineering decision memory for recovering why systems were built a certain way. It preserves immutable source versions and keeps every grounded answer traceable to exact source lines.',
      featuredDescription: 'Traceable decision memory with immutable sources and exact citations.',
      href: 'https://github.com/thangldw/proofline',
      ariaLabel: 'Open Proofline on GitHub',
      icon: 'fa-link',
      accent: 'indigo',
      status: 'v0.14.17',
      tags: ['Local-first', 'Provenance', 'Exact citations', 'SQLite FTS5'],
      category: 'developer-tools',
      cta: 'Open on GitHub',
      featured: true,
      featuredOrder: 5
    },
    {
      id: 'kakeflow',
      title: 'KakeFlow',
      description: 'A released local-first household finance app for macOS. It turns bank, card, wallet, receipt, spreadsheet, PDF, and securities data into a reviewable ledger with source evidence and reconciliation.',
      featuredDescription: 'Released local-first household finance for macOS, with reviewable reconciliation and source evidence.',
      href: 'https://github.com/thangldw/kakeflow-releases',
      ariaLabel: 'Open KakeFlow releases on GitHub',
      icon: 'fa-wallet',
      accent: 'ochre',
      status: 'v1.0.0',
      tags: ['Household finance', 'Local-first', 'Reconciliation', 'Tauri · React'],
      category: 'personal-finance',
      cta: 'View releases',
      featured: true,
      featuredOrder: 7
    }
  ];

  global.portfolioLanguageCollection = {
    title: 'Certification Study',
    description: 'Focused dashboards, exam practice, notes, and local learning history for G検定, 3級FP, BJT, SG, AP, JLPT N1, TOEIC, PMP, and AWS SAA.',
    href: '/apps/cert/',
    label: '9 certification programs'
  };

  global.portfolioLearningCollections = [
    {
      id: 'certification-study',
      title: 'Certification Study',
      description: 'One focused study space for G検定, 3級FP, BJT, SG, AP, JLPT N1, TOEIC, PMP, and AWS SAA.',
      href: '/apps/cert/',
      ariaLabel: 'Open the certification study programs',
      icon: 'fa-graduation-cap',
      accent: 'rust',
      status: 'Collection',
      tags: ['9 certifications', 'Exam practice', 'Local-first'],
      category: 'certification-study'
    }
  ];
})(window);
