(function () {
  "use strict";

  // Public Amplitude project API key. Never place the Amplitude secret key in browser files.
  const AMPLITUDE_PUBLIC_KEY = "12fe7899f9b221a616d3252d8861a417";
  const CONSENT_STORAGE_KEY = "menu-mood-lab-analytics-consent-v1";
  const SDK_URL = "https://cdn.amplitude.com/libs/analytics-browser-2.48.1-min.js.gz";
  const SDK_INTEGRITY = "sha384-Sk+l9VwU+jvx8zsmLuRDNUQE+0K4h0xsyjdrfb/czM6hRumd1igYdOvGwa0LAGcq";

  const banner = document.getElementById("analytics-consent");
  const settingsButton = document.getElementById("analytics-settings");
  const acceptButton = document.getElementById("analytics-accept");
  const rejectButton = document.getElementById("analytics-reject");

  if (!banner || !settingsButton || !acceptButton || !rejectButton) return;

  function getStoredConsent() {
    try { return localStorage.getItem(CONSENT_STORAGE_KEY); } catch (_) { return null; }
  }
  function storeConsent(value) {
    try { localStorage.setItem(CONSENT_STORAGE_KEY, value); } catch (_) { /* Storage can be unavailable. */ }
  }

  let consent = getStoredConsent();
  let sdkLoading = false;
  let sdkLoaded = false;
  let pageViewSent = false;

  function track(eventName, properties) {
    if (consent !== "accepted" || !sdkLoaded) return;
    try {
      window.amplitude.track(eventName, properties || {});
    } catch (error) {
      console.warn("[Menu Mood Lab] Amplitude event could not be queued.", error);
    }
  }

  function trackPageView() {
    if (pageViewSent) return;
    pageViewSent = true;
    track("Landing Page Viewed", {
      campaign: "menu-mood-lab",
      page_path: location.pathname
    });
  }

  function loadAnalytics() {
    if (consent !== "accepted") return;
    if (sdkLoaded) {
      window.amplitude.setOptOut(false);
      trackPageView();
      return;
    }
    if (sdkLoading) return;

    sdkLoading = true;
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.integrity = SDK_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.onload = function () {
      sdkLoading = false;
      if (!window.amplitude || typeof window.amplitude.init !== "function") {
        console.warn("[Menu Mood Lab] Amplitude SDK not available.");
        return;
      }
      try {
        // Analytics only. No automatic capture, session replay or sensitive form collection.
        window.amplitude.init(AMPLITUDE_PUBLIC_KEY, undefined, { autocapture: false });
        sdkLoaded = true;
        if (consent === "accepted") trackPageView();
        else window.amplitude.setOptOut(true);
      } catch (error) {
        console.warn("[Menu Mood Lab] Could not initialize analytics.", error);
      }
    };
    script.onerror = function () {
      sdkLoading = false;
      console.warn("[Menu Mood Lab] Amplitude SDK did not load; the site still works without analytics.");
    };
    document.head.appendChild(script);
  }

  function choose(value) {
    consent = value;
    storeConsent(value);
    banner.hidden = true;
    settingsButton.setAttribute("aria-label", "방문 분석 설정 변경");
    if (value === "accepted") {
      loadAnalytics();
    } else if (sdkLoaded) {
      window.amplitude.setOptOut(true);
    }
  }

  acceptButton.addEventListener("click", function () { choose("accepted"); });
  rejectButton.addEventListener("click", function () { choose("rejected"); });
  settingsButton.addEventListener("click", function () { banner.hidden = false; });

  // Default is no analytics. Load the SDK only after a visitor opts in.
  if (consent === "accepted") loadAnalytics();
  else if (consent !== "rejected") banner.hidden = false;

  // Track only the interactions users actually perform; no personal inputs are captured.
  document.addEventListener("click", function (event) {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!button) return;
    const menu = document.getElementById("food-name");

    if (button.matches("[data-mood]")) {
      track("Menu Mood Selected", { mood: button.dataset.mood || "unknown", menu_name: menu ? menu.textContent : "" });
    } else if (button.id === "reroll") {
      track("Menu Recommendation Rerolled", { menu_name: menu ? menu.textContent : "" });
    } else if (button.id === "save-menu") {
      // The original app handles local saving synchronously on its own button listener.
      // Check the outcome in a microtask rather than falsely counting unsuccessful saves.
      Promise.resolve().then(function () {
        if (button.textContent && button.textContent.includes("저장 완료")) {
          track("Menu Saved", { menu_name: menu ? menu.textContent : "" });
        }
      });
    }
  });
})();
