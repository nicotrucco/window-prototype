/* Window — entitlement state and archive expiry.

   The model (WINDOW_BUILD_BRIEF §9): free gets the whole catalogue — every scene,
   voice arming, the full moment. What free doesn't get is memory and automation.

     trial        days 1-7, everything unlocked, no card
     free         day 8+, rolling 14-day archive, watermarked shares
     window-plus  permanent archive, scheduled scenes, generated phrases

   Expiry is the primary conversion driver, and it only works if the user can WATCH
   it coming. Silent deletion converts nobody and just feels bad — so every photo
   carries a visible countdown, and the second ask fires at first expiry. */

(function () {
  const KEY = "window-app-tier";
  const TRIAL_DAYS = 7;
  const FREE_ARCHIVE_DAYS = 14;
  const DAY = 86400000;

  function load() {
    let t;
    try { t = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { t = null; }
    if (!t) {
      t = { installedAt: Date.now(), plus: false, asked: {} };
      localStorage.setItem(KEY, JSON.stringify(t));
    }
    return t;
  }
  const save = t => localStorage.setItem(KEY, JSON.stringify(t));

  const daysSinceInstall = () => Math.floor((Date.now() - load().installedAt) / DAY);

  function status() {
    const t = load();
    if (t.plus) return "window-plus";
    return daysSinceInstall() < TRIAL_DAYS ? "trial" : "free";
  }

  const isPlus = () => status() === "window-plus";
  const inTrial = () => status() === "trial";
  /* during the trial nothing expires — the loss only starts on day 8 */
  const archiveIsPermanent = () => status() !== "free";

  const trialDaysLeft = () => Math.max(0, TRIAL_DAYS - daysSinceInstall());

  /* ms until a given entry fades, or null if it never will */
  function expiresIn(entry) {
    if (archiveIsPermanent()) return null;
    const born = new Date(entry.createdAt).getTime();
    return Math.max(0, born + FREE_ARCHIVE_DAYS * DAY - Date.now());
  }

  /* the countdown the user actually reads */
  function expiryLabel(entry) {
    const ms = expiresIn(entry);
    if (ms === null) return null;
    const days = Math.floor(ms / DAY);
    if (days >= 3) return window.UI.f("fades_days", days);
    if (days >= 1) return days === 1 ? window.UI.t("fades_tomorrow") : window.UI.f("fades_days", days);
    const hrs = Math.floor(ms / 3600000);
    if (hrs >= 1) return window.UI.f("fades_hours", hrs);
    return window.UI.t("fades_hour");
  }
  /* is this one close enough to hurt? drives the warm/urgent styling */
  const isFading = entry => {
    const ms = expiresIn(entry);
    return ms !== null && ms < 3 * DAY;
  };

  const expired = entry => expiresIn(entry) === 0;

  /* --- the two ask moments (BRIEF §4.7) ---
     day 8 is weak on its own; first expiry is the one that lands. */
  function pendingAsk(entries) {
    const t = load();
    if (t.plus) return null;

    if (status() === "free" && !t.asked.day8) return "day8";

    if (status() === "free" && !t.asked.expiry) {
      const soon = entries.some(e => {
        const ms = expiresIn(e);
        return ms !== null && ms < 2 * DAY;
      });
      if (soon) return "expiry";
    }
    return null;
  }
  function markAsked(which) {
    const t = load();
    t.asked[which] = Date.now();
    save(t);
  }

  /* prototype affordance — lets us jump the clock while testing the paywall */
  function debugSetInstalledDaysAgo(n) {
    const t = load();
    t.installedAt = Date.now() - n * DAY;
    t.asked = {};
    save(t);
  }
  function setPlus(on) {
    const t = load();
    t.plus = !!on;
    save(t);
  }

  window.Tier = {
    status, isPlus, inTrial, archiveIsPermanent, trialDaysLeft,
    expiresIn, expiryLabel, isFading, expired,
    pendingAsk, markAsked,
    debugSetInstalledDaysAgo, setPlus,
    TRIAL_DAYS, FREE_ARCHIVE_DAYS
  };
})();
