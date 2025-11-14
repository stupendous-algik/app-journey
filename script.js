function normalizePhone(input) {
  // Remove spaces and plus sign
  let p = input.replace(/\s+/g, '').replace(/^\+/, '');

  // Accept 07..., 01..., 2547..., 2541...
  if (/^(07|01)\d{8}$/.test(p)) {
    return '254' + p.slice(1);
  }
  if (/^254(7|1)\d{8}$/.test(p)) {
    return p;
  }
  return null;
}

function renderReminders() {
  const list = document.getElementById('reminder-list');
  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');

  if (reminders.length === 0) {
    list.innerHTML = '<p>No reminders saved yet.</p>';
    return;
  }

  list.innerHTML = reminders
    .map(r => `
      <div class="reminder-item">
        <strong>${r.phone}</strong><br>
        Amount: Ksh ${r.amount}
      </div>
    `)
    .join('');
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
    renderReminders();
  });
});
