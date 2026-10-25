// ===== Мобильное меню =====
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

function setMenu(open) {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  nav.classList.toggle('is-open', open);
  document.body.classList.toggle('is-locked', open);
}

burger.addEventListener('click', () => {
  setMenu(burger.getAttribute('aria-expanded') !== 'true');
});

// Закрываем меню при переходе по ссылке и по Esc
nav.addEventListener('click', (event) => {
  if (event.target.closest('a, button')) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) {
    setMenu(false);
    burger.focus();
  }
});

// При переходе на десктопную ширину меню сбрасываем
window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
  if (event.matches) setMenu(false);
});

// ===== Модальные окна =====
document.querySelectorAll('[data-modal-open]').forEach((button) => {
  button.addEventListener('click', () => {
    document.getElementById(button.dataset.modalOpen)?.showModal();
  });
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelector('[data-modal-close]')?.addEventListener('click', () => dialog.close());
  // Клик по затемнённому фону закрывает окно
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

// ===== Формы заявок =====
const PHONE_DIGITS_MIN = 10;

function setError(input, message) {
  const error = input.closest('.field')?.querySelector('.field__error');
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (error) error.textContent = message;
}

function validate(form) {
  let firstInvalid = null;

  const name = form.elements.name;
  const nameError = name.value.trim().length < 2 ? 'Укажите имя' : '';
  setError(name, nameError);
  if (nameError) firstInvalid ??= name;

  const phone = form.elements.phone;
  const digits = phone.value.replace(/\D/g, '');
  const phoneError = digits.length < PHONE_DIGITS_MIN ? 'Укажите номер телефона полностью' : '';
  setError(phone, phoneError);
  if (phoneError) firstInvalid ??= phone;

  const consent = form.elements.consent;
  const consentError = form.querySelector('[data-consent-error]');
  consentError.textContent = consent.checked ? '' : 'Нужно согласие на обработку данных';
  if (!consent.checked) firstInvalid ??= consent;

  firstInvalid?.focus();
  return !firstInvalid;
}

// [ЗАГЛУШКА: отправка заявок ещё не подключена — заменить на запрос к серверу/сервису]
async function sendRequest(data) {
  console.info('Заявка (не отправлена, нет бэкенда):', data);
  return { ok: false };
}

document.querySelectorAll('[data-form]').forEach((form) => {
  const status = form.querySelector('.form__status');
  const submit = form.querySelector('[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    status.className = 'form__status';
    if (!validate(form)) return;

    submit.disabled = true;
    const data = Object.fromEntries(new FormData(form));
    const result = await sendRequest(data);
    submit.disabled = false;

    if (result.ok) {
      form.reset();
      status.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
      status.classList.add('is-success');
    } else {
      status.textContent = 'Отправка заявок пока не подключена. Позвоните нам по телефону.';
      status.classList.add('is-error');
    }
  });

  // Снимаем ошибку, как только пользователь начал исправлять поле
  form.addEventListener('input', (event) => {
    if (event.target.matches('.field__input')) setError(event.target, '');
    if (event.target.name === 'consent') form.querySelector('[data-consent-error]').textContent = '';
  });
});

// Текущий год в подвале
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});
