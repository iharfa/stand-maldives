// Every piece of public site text the admin can edit (Admin → Site content), with its default.
// SECTIONS drives both the admin editor and the settings API whitelist; add a field here and it shows up in both.
// Field types: text, textarea, number, select, checkbox, image, list (items with their own fields).

const text = (key, label, extra) => ({ key, label, type: "text", ...extra });
const area = (key, label, rows = 3) => ({ key, label, type: "textarea", rows });
const titleDesc = [text("title", "Title"), area("desc", "Description", 2)];

export const SECTIONS = {
  site: {
    label: "Site & header",
    fields: [
      text("name", "Site name"),
      text("tagline", "Tagline under the logo"),
      { key: "logo", label: "Logo (leave blank for the default)", type: "image" },
      text("submitButton", "Header button text"),
      text("navDatabase", "Nav label: database"),
      text("navLeaderboard", "Nav label: leaderboard"),
      text("footerContact", "Footer contact line"),
      area("footerNote", "Footer note (optional)", 2),
      { key: "rate", label: "Exchange rate (MVR per 1 USD)", type: "number", step: 0.01 },
      { key: "displayCurrency", label: "Show amounts as", type: "select", options: ["Original", "USD", "MVR"] },
      { key: "showCorroboration", label: "Show “Corroborated by N contributors”", type: "checkbox" },
    ],
  },
  home: {
    label: "Database page",
    fields: [
      text("eyebrow", "Eyebrow"),
      text("title", "Title"),
      area("intro1", "Intro paragraph"),
      area("intro2", "Second paragraph"),
      text("ctaPrimary", "Primary button"),
      text("ctaSecondary", "Secondary button"),
      { key: "pillars", label: "Numbered points", type: "list", fields: titleDesc, blank: { title: "", desc: "" } },
      text("emptyTitle", "No results title"),
      text("emptyBody", "No results text"),
      text("verifyEyebrow", "Verification section eyebrow"),
      area("verifyTitle", "Verification section title", 2),
      { key: "tiers", label: "Tier explanations (Unverified, Verified, Admin verified)", type: "list", fixed: true, fields: [text("label", "Label"), text("sub", "Subtitle"), area("desc", "Description", 2)] },
      area("verifyNote", "Verification footnote"),
    ],
  },
  resort: {
    label: "Resort page",
    fields: [
      text("backLink", "Back link"),
      text("emptyTitle", "No figures title"),
      area("emptyBody", "No figures text", 2),
      text("emptyCta", "No figures button (resort name is added)"),
    ],
  },
  leaderboard: {
    label: "Leaderboard",
    fields: [text("eyebrow", "Eyebrow"), text("title", "Title"), area("note", "Footnote (exchange rate is added automatically)", 2)],
  },
  submit: {
    label: "Submit form",
    fields: [
      text("eyebrow", "Eyebrow"),
      text("title", "Title"),
      area("intro", "Intro"),
      text("evidenceTitle", "Evidence box title"),
      text("evidenceHint", "Evidence box hint"),
      text("emailLabel", "Email option title"),
      area("emailHint", "Email option text", 2),
      text("humanLabel", "Confirmation checkbox"),
      text("thanksTitle", "Thank-you title"),
      area("thanksBody", "Thank-you text", 2),
      text("asideTitle", "Side panel title"),
      { key: "asidePoints", label: "Side panel points", type: "list", fields: titleDesc, blank: { title: "", desc: "" } },
    ],
  },
  terms: { label: "Terms page", fields: [text("title", "Title"), area("body", "Text (blank line = new paragraph)", 16)] },
  moderation: { label: "Moderation policy", fields: [text("title", "Title"), area("body", "Text (blank line = new paragraph)", 16)] },
  privacy: { label: "Privacy page", fields: [text("title", "Title"), area("body", "Text (blank line = new paragraph)", 16)] },
};

export const DEFAULTS = {
  site: {
    name: "Stand Maldives",
    tagline: "by the workers for the workers",
    logo: "",
    submitButton: "Submit service charge",
    navDatabase: "Service charge",
    navLeaderboard: "Leaderboard",
    footerContact: "standmaldives.com · @standmaldives",
    footerNote: "",
    rate: 15.42,
    displayCurrency: "Original",
    showCorroboration: true,
  },
  home: {
    eyebrow: "Service charge database",
    title: "Service Charge: Maldives Resorts",
    intro1: "Stand is an information platform for Maldives resort workers, local and expatriate. Check what each resort paid in service charge for a given month, compare resorts, and add the figure you received.",
    intro2: "Workers submit anonymously. An admin reviews every figure before it goes public, and each one is labelled by how it was verified, so you know how much to trust it.",
    ctaPrimary: "Submit Service Charge Information",
    ctaSecondary: "See the top 10 resorts",
    pillars: [
      { title: "Anonymity", desc: "Contribute without an account or exposing your identity." },
      { title: "Moderation", desc: "Nothing goes public just because someone submitted it." },
      { title: "Transparency", desc: "Every figure shows its tier: Unverified, Verified or Admin Verified." },
    ],
    emptyTitle: "No published figures match these filters",
    emptyBody: "Try another month or atoll, or submit a figure you know.",
    verifyEyebrow: "How figures are verified",
    verifyTitle: "Nothing is published until a moderator has reviewed it.",
    tiers: [
      { label: "Unverified", sub: "Community Submitted", desc: "Submitted with no evidence, or evidence not yet reviewed." },
      { label: "Verified", sub: "Documentation Reviewed", desc: "Contributor supplied evidence (payslip, screenshot, etc.) and an admin reviewed it." },
      { label: "Admin Verified", sub: "Confirmed by Stand", desc: "An authorized admin entered or personally confirmed the figure." },
    ],
    verifyNote: "When several workers independently report the same resort, month and amount, the entry is marked as corroborated. Evidence is never shown publicly; only the resulting label is.",
  },
  resort: {
    backLink: "← Service charge database",
    emptyTitle: "No published figures for this resort yet.",
    emptyBody: "If you work here, you can report a recent month's service charge. You don't need an account.",
    emptyCta: "Submit a figure for",
  },
  leaderboard: {
    eyebrow: "Leaderboard",
    title: "Top 10 resorts",
    note: "Yearly averages include resorts with at least three reported months.",
  },
  submit: {
    eyebrow: "Contribute",
    title: "Submit Service Charge Information",
    intro: "No account needed. Your submission goes to a moderator first and is only published once it has been reviewed.",
    evidenceTitle: "Upload a payslip, screenshot, bank statement or internal announcement",
    evidenceHint: "PDF, JPG or PNG, up to 4 MB in total. Only moderators can see it.",
    emailLabel: "Leave an email (optional)",
    emailHint: "Only if you're happy for a moderator to ask you about this figure. Never shown publicly.",
    humanLabel: "I confirm I'm a person, not an automated script",
    thanksTitle: "Thank you. Your figure is in the review queue.",
    thanksBody: "A moderator will review it before anything is published.",
    asideTitle: "About anonymity",
    asidePoints: [
      { title: "No login required", desc: "Submit without an account. No username is shown with your figure." },
      { title: "Evidence stays private", desc: "Only moderators see uploaded documents. The public sees the resulting verification label, never the file." },
      { title: "Email is optional", desc: "Leave one only if you want a moderator to be able to reach you. It is never published." },
      { title: "Keep it factual", desc: "We publish figures, not claims about individuals." },
    ],
  },
  terms: {
    title: "Terms of use",
    body: "Stand Maldives publishes service charge figures reported by resort workers. Figures are shared for information only and may contain errors; each one is labelled with how it was verified.\n\nWhen you submit a figure you confirm it is, to the best of your knowledge, what you were paid for that month. Do not submit figures you know to be false, and do not include personal information about other people.\n\nModerators may edit, merge, decline or remove any submission. Published figures may be corrected or removed at any time.\n\nThis text is a starting point. Replace it with terms reviewed for your organisation.",
  },
  moderation: {
    title: "Moderation policy",
    body: "Every submission is reviewed by a moderator before it is published. Nothing appears on the site just because it was submitted.\n\nUnverified: submitted without evidence. Verified: the contributor supplied evidence such as a payslip, screenshot, bank statement or internal announcement, and a moderator reviewed it. Admin verified: an authorised admin entered or personally confirmed the figure.\n\nWhen several workers independently report the same resort, month and amount, the figure is marked as corroborated.\n\nEvidence files are only ever seen by moderators. They are never published. We publish figures, not claims about individuals; submissions that name or target people are declined.",
  },
  privacy: {
    title: "Privacy",
    body: "You can submit without an account. We store the resort, month, amount, currency and payout period you report.\n\nIf you attach evidence, the file is kept in private storage that only moderators can open. If you leave an email, it is used only to contact you about that submission and is never shown publicly.\n\nYour IP address is used briefly to limit automated submissions and is not stored with your figure.\n\nThis text is a starting point. Replace it with a privacy notice reviewed for your organisation.",
  },
};

// Keeps only the fields the schema knows, coerced to their type, falling back to the default. Run on every admin save.
const str = (v, d) => (typeof v === "string" ? v.slice(0, 20000) : d);
export function sanitizeSection(key, value) {
  const v = value && typeof value === "object" ? value : {};
  const out = {};
  for (const f of SECTIONS[key].fields) {
    const d = DEFAULTS[key][f.key], x = v[f.key];
    if (f.type === "number") out[f.key] = Number(x) > 0 && Number.isFinite(Number(x)) ? Number(x) : d;
    else if (f.type === "checkbox") out[f.key] = !!x;
    else if (f.type === "select") out[f.key] = f.options.includes(x) ? x : d;
    else if (f.type === "image") out[f.key] = typeof x === "string" && /^(\/(?!\/)|https:\/\/)/.test(x) ? x : "";
    else if (f.type === "list") {
      const items = (Array.isArray(x) ? x : d).filter((it) => it && typeof it === "object")
        .map((it) => Object.fromEntries(f.fields.map((sf) => [sf.key, str(it[sf.key], "")])));
      out[f.key] = f.fixed ? d.map((di, i) => ({ ...di, ...items[i] })) : items;
    } else out[f.key] = str(x, d);
  }
  return out;
}

// Stored values are merged over the defaults per section, so fields added later still get a value.
export function withDefaults(stored = {}) {
  const out = {};
  for (const key of Object.keys(DEFAULTS)) out[key] = { ...DEFAULTS[key], ...(stored[key] || {}) };
  return out;
}
