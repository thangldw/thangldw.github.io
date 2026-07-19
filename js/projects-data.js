(function (global) {
  global.portfolioProjects = [
    {
      id: 'ragops',
      title: 'RAGOps',
      description: 'An evaluation and release-gate platform for production RAG and agent systems. Compare a candidate against an accepted baseline, detect quality and safety regressions, and produce auditable reports.',
      featuredDescription: 'Evaluation and release gates for production RAG and agent systems.',
      href: 'https://thangldw.github.io/ragops/',
      ariaLabel: 'Open the RAGOps showcase',
      icon: 'fa-shield-halved',
      status: 'v1.0',
      tags: ['AI evaluation', 'Red team', 'FastAPI', 'CI/CD'],
      cta: 'Open RAGOps',
      featured: true,
      featuredOrder: 1
    },
    {
      id: 'maintainer-defense',
      title: 'Awesome Maintainer Defense',
      description: 'A read-only, reversible defense system for open-source maintainers. Audit repository governance, GitHub Actions, and moderation risk offline, then review generated patches and deployable defense profiles.',
      featuredDescription: 'Offline, reversible security audits and defense profiles for open-source maintainers.',
      href: 'https://github.com/thangldw/awesome-maintainer-defense',
      ariaLabel: 'Open Awesome Maintainer Defense on GitHub',
      icon: 'fa-shield-halved',
      status: 'v1.0',
      tags: ['OSS security', 'Offline auditor', 'Supply chain', 'Python'],
      cta: 'Open on GitHub',
      featured: true,
      featuredOrder: 2
    },
    {
      id: 'proofline',
      title: 'Proofline',
      description: 'Local-first engineering decision memory for recovering why systems were built a certain way. It preserves immutable source versions and keeps every grounded answer traceable to exact source lines.',
      featuredDescription: 'Traceable decision memory with immutable sources and exact citations.',
      href: 'https://thangldw.github.io/proofline/',
      ariaLabel: 'Open the Proofline showcase',
      icon: 'fa-link',
      status: 'v0.14.17',
      tags: ['Local-first', 'Provenance', 'Exact citations', 'SQLite FTS5'],
      cta: 'Open Proofline',
      featured: true,
      featuredOrder: 3
    },
    {
      id: 'namiquant',
      title: 'NamiQuant',
      description: 'A private research and decision-support workspace for exploring market signals, portfolio risk, and disciplined investment workflows across multiple markets.',
      href: '/apps/namiquant/',
      ariaLabel: 'View the public NamiQuant case study',
      icon: 'fa-chart-line',
      status: 'Private',
      statusClass: 'private',
      tags: ['Market research', 'Decision support', 'Risk awareness', 'Multi-market'],
      cta: 'View public overview',
      featured: false
    },
    {
      id: 'kakeflow',
      title: 'KakeFlow',
      description: 'A released local-first household finance app for macOS. It turns bank, card, wallet, receipt, spreadsheet, PDF, and securities data into a reviewable ledger with source evidence and reconciliation.',
      featuredDescription: 'Released local-first household finance for macOS, with reviewable reconciliation and source evidence.',
      href: '/apps/kakeflow/',
      ariaLabel: 'Open KakeFlow',
      icon: 'fa-wallet',
      status: 'v1.0.0',
      tags: ['Household finance', 'Local-first', 'Reconciliation', 'Tauri · React'],
      cta: 'Open KakeFlow',
      featured: true,
      featuredOrder: 4
    },
    {
      id: 'data-copilot',
      title: 'Data Copilot',
      description: 'A browser-native natural-language analytics workbench. Ask questions, inspect generated SQL, run it with DuckDB-WASM, and chart the result—or bring your own CSV.',
      featuredDescription: 'In-browser natural-language analytics powered by SQL, DuckDB, and Parquet.',
      href: '/apps/data-copilot/',
      ariaLabel: 'Open Data Copilot',
      icon: 'fa-wand-magic-sparkles',
      status: 'Live',
      tags: ['NL→SQL', 'DuckDB-WASM', 'Parquet', 'GitHub Actions'],
      cta: 'Open Data Copilot',
      featured: true,
      featuredOrder: 5
    },
    {
      id: 'pipeline',
      title: 'Pipeline Observability',
      description: 'The ELT job behind Data Copilot, instrumented—freshness, per-ticker coverage, run history, and data-quality telemetry committed by its own scheduled workflow.',
      featuredDescription: 'Freshness, coverage, and run-history monitoring for a production data pipeline.',
      href: '/apps/pipeline/',
      ariaLabel: 'Open Pipeline Observability',
      icon: 'fa-satellite-dish',
      status: 'Live',
      tags: ['GitHub Actions', 'Observability', 'Data quality'],
      cta: 'Open Pipeline',
      featured: true,
      featuredOrder: 6
    },
    {
      id: 'earthquake-intelligence',
      title: 'Earthquake Intelligence',
      description: 'An evidence-led view of one year of USGS seismic activity across East and Southeast Asia, with a geographic activity field, weekly rhythm, regional comparisons, and transparent natural-language analysis.',
      featuredDescription: 'Explore where seismic activity clusters, which events matter, and how depth changes by region.',
      href: '/apps/earthquake-intelligence/',
      ariaLabel: 'Open Earthquake Intelligence',
      icon: 'fa-wave-square',
      status: 'Live',
      tags: ['USGS', 'Geospatial', 'Time series', 'Data storytelling'],
      cta: 'Explore earthquakes',
      featured: true,
      featuredOrder: 7
    },
    {
      id: 'city-climate',
      title: 'Asian City Climate',
      description: 'A like-for-like comparison of temperature, rain, PM2.5, and AQI across Tokyo, Seoul, Taipei, Bangkok, Singapore, and Shanghai, built from Open-Meteo and CAMS public signals.',
      featuredDescription: 'Compare climate and air quality across six Asian cities through a consistent 365-day lens.',
      href: '/apps/city-climate/',
      ariaLabel: 'Open Asian City Climate and Air Quality',
      icon: 'fa-sun',
      status: 'Live',
      tags: ['Open-Meteo', 'CAMS', 'Climate', 'Air quality'],
      cta: 'Compare cities',
      featured: true,
      featuredOrder: 8
    }
  ];

  global.portfolioLanguageCollection = {
    title: 'N1 Language Lab',
    description: '12 browser-based tools for Japanese vocabulary, kanji, grammar, and reading.',
    href: '/apps/#language',
    label: 'Language Collection'
  };
})(window);
