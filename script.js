const translations = {
  en: { greeting: "Hello, Nairobi 👋", localTimeLabel: "Local time:", refresh: "Refresh time" },
  sw: { greeting: "Hujambo Nairobi 👋", localTimeLabel: "Wakati wa eneo:", refresh: "Sasisha wakati" }
};

function updateTime(){
  const el = document.querySelector('#local-time span');
  const now = new Date();
  el.textContent = now.toLocaleString('en-KE', {hour12:true});
}

function applyLanguage(lang){
  const t = translations[lang] || translations.en;
  document.getElementById('greeting').textContent = t.greeting;
  // Replace the label text node (safe even if structure changes)
  const localTimeEl = document.getElementById('local-time');
  if (localTimeEl) {
    localTimeEl.childNodes[0] && (localTimeEl.childNodes[0].textContent = t.localTimeLabel + ' ');
  }
  document.getElementById('refresh').textContent = t.refresh;
  document.getElementById('lang-select').value = lang;
  localStorage.setItem('preferredLang', lang);
}

// Attach handlers
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('preferredLang') || 'en';
  applyLanguage(saved);
  updateTime();
  document.getElementById('refresh').addEventListener('click', updateTime);
  document.getElementById('lang-select').addEventListener('change', (e) => applyLanguage(e.target.value));
});
