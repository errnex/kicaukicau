/* config.js — ubah sesuai repo lo sebelum deploy.
   PIN ini cuma gerbang lunak di browser, bukan keamanan server.
   Jangan taruh token atau rahasia apa pun di file ini. */
window.PROMPTLIB_CONFIG = {
  // PIN mode admin. GANTI sebelum deploy.
  ADMIN_PIN: "admin123",

  // Repo GitHub tempat prompts.json tinggal.
  // Buat repo baru (misal: prompt-library) dan isi dengan file-file project ini.
  GITHUB_OWNER: "errnex",
  GITHUB_REPO: "prompt-library",
  GITHUB_BRANCH: "main",
  GITHUB_PATH: "prompts.json",
};
