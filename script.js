function normalizePhone(input) {
  let p = input.replace(/\s+/g, '').replace(/^\+/, '');
  if (/^(07|01)\d{8}$/.test(p)) return '254' + p.slice(1);
  if (/^254(7|1)\d{8}$/.test(p)) return p;
  return null;
}

function renderReminders(highlightLast = false) {
  const list = document.getElementById('reminder-list');
  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');

  if (reminders.length === 0) {
    list.innerHTML = '<p>No reminders saved yet.</p>';
    return;
  }

  list.innerHTML = reminders
    .map((r, index) => `
      <div class="reminder-item" data-index="${index}">
        <div class="reminder-phone">${r.phone}</div>
        <div class="reminder-meta">Amount: <span class="reminder-amount">Ksh ${r.amount}</span></div>
      </div>
    `)
    .join('');

  if (highlightLast) {
    const items = document.querySelectorAll('.reminder-item');
    const lastItem = items[items.length - 1];
    lastItem.classList.add('flash');
    setTimeout(() => lastItem.classList.remove('flash'), 600);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reminder-form');

  renderReminders();

  form.addEventListener('submit', e => {
    e.preventDefault();

    const phoneInput = document.getElementById('phone').value.trim();
    const amountInput = document.getElementById('amount').value.trim();
    const phone = normalizePhone(phoneInput);

    if (!phone) {
      alert('Invalid phone number. Use formats: 07..., 01..., or 2547..., 2541...');
      return;
    }

    if (amountInput === '' || Number(amountInput) <= 0) {
      alert('Enter a valid airtime amount.');
      return;
    }

    const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    reminders.push({ phone, amount: Number(amountInput) });
    localStorage.setItem('reminders', JSON.stringify(reminders));

    form.reset();
    renderReminders(true); // highlight the newly added item
  });
});
