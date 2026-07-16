(() => {
  "use strict";

  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#primary-nav");

  function closeMenu() {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  }

  menuButton?.addEventListener("click", () => {
    const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(willOpen));
    navigation?.classList.toggle("is-open", willOpen);
  });
  navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeMenu();
  });

  const screenData = {
    overview: {
      src: "assets/screenshots/kakeflow-overview.png",
      title: "ホーム",
      subtitle: "世帯の状況・重要アクション・データ品質",
      status: "CONFIRMED DATA",
      alt: "KakeFlow のホーム画面",
      description: "集計結果だけでなく、カード引落、予算超過、重複候補、低信頼度 OCR など、対応が必要な項目を先に表示します。",
    },
    transactions: {
      src: "assets/screenshots/kakeflow-transactions.png",
      title: "取引",
      subtitle: "確定済み元帳・検索・証跡・ドリルダウン",
      status: "LEDGER",
      alt: "KakeFlow の確定済み取引画面",
      description: "対象月、口座、家族、計上基準を切り替えながら、確定済み台帳を検索し、原本まで掘り下げます。",
    },
    import: {
      src: "assets/screenshots/kakeflow-import-inbox.png",
      title: "インポート",
      subtitle: "ファイル検出・レビュー・転記",
      status: "REVIEW GATED",
      alt: "KakeFlow の Import Inbox 画面",
      description: "ファイルの検出から抽出、マッピング、レビュー、転記までの処理段階と、確認が必要な理由を表示します。",
    },
  };

  const tabs = [...document.querySelectorAll('[role="tab"][data-screen]')];
  const screenImage = document.querySelector("#screen-image");
  const screenTitle = document.querySelector("#screen-title");
  const screenSubtitle = document.querySelector("#screen-subtitle");
  const screenStatus = document.querySelector("#screen-status");
  const screenCaption = document.querySelector("#screen-caption");
  const screenPanel = document.querySelector("#screen-panel");

  function selectScreen(tab, moveFocus = false) {
    const screen = screenData[tab.dataset.screen];
    if (!screen || !screenImage || !screenTitle || !screenSubtitle || !screenStatus || !screenCaption || !screenPanel) return;
    tabs.forEach((candidate) => {
      const selected = candidate === tab;
      candidate.setAttribute("aria-selected", String(selected));
      candidate.tabIndex = selected ? 0 : -1;
    });
    screenImage.src = screen.src;
    screenImage.alt = screen.alt;
    screenTitle.textContent = screen.title;
    screenSubtitle.textContent = screen.subtitle;
    screenStatus.textContent = screen.status;
    screenCaption.textContent = screen.description;
    screenPanel.setAttribute("aria-labelledby", tab.id);
    if (moveFocus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectScreen(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      selectScreen(tabs[nextIndex], true);
    });
  });
})();
