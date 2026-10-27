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

// ===== Фильтр проектов =====
const filterButtons = document.querySelectorAll('[data-filter]');
const projectItems = document.querySelectorAll('[data-projects] [data-category]');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    projectItems.forEach((item) => {
      item.hidden = category !== 'all' && item.dataset.category !== category;
    });
  });
});

// ===== Анимации =====
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Тень у шапки после начала прокрутки (не чаще одного раза за кадр)
const header = document.getElementById('header');
let headerTicking = false;

function updateHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 8);
  headerTicking = false;
}

window.addEventListener('scroll', () => {
  if (!headerTicking) {
    headerTicking = true;
    requestAnimationFrame(updateHeader);
  }
}, { passive: true });
updateHeader();

// Плавное появление блоков при прокрутке
const REVEAL_SELECTOR = [
  '.section__head', '.section > .container > .eyebrow', '.section > .container > .section__title',
  '.about__content', '.about__media', '.card', '.tags', '.step', '.project', '.clients__item',
  '.service', '.scope__col', '.contact-card', '.request__info', '.request .form', '.requisites',
  '.cta-band__inner',
].join(',');
const STAGGER_MS = 90;
const STAGGER_MAX = 4;

if (!reduceMotion && 'IntersectionObserver' in window) {
  // После появления возвращаем элементу обычные hover-переходы
  function cleanupReveal(event) {
    const el = event.currentTarget;
    if (event.target !== el || event.propertyName !== 'transform') return;
    el.classList.remove('reveal', 'is-visible');
    el.style.transitionDelay = '';
    el.removeEventListener('transitionend', cleanupReveal);
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.addEventListener('transitionend', cleanupReveal);
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  const toReveal = [...document.querySelectorAll(REVEAL_SELECTOR)]
    // То, что уже видно при загрузке, не прячем — иначе текст мигнёт
    .filter((el) => el.getBoundingClientRect().top >= window.innerHeight);

  // Прячем мгновенно, без анимации «исчезновения»
  toReveal.forEach((el) => {
    el.style.transition = 'none';
    el.classList.add('reveal');
  });
  void document.body.offsetHeight; // применяем стили до возврата переходов

  toReveal.forEach((el) => {
    el.style.transition = '';
    // Карточки в одном ряду появляются друг за другом
    const index = [...el.parentElement.children].indexOf(el);
    el.style.transitionDelay = `${Math.min(index, STAGGER_MAX) * STAGGER_MS}ms`;
    revealObserver.observe(el);
  });
}

// Ленивые картинки проявляются после загрузки
document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
  if (img.complete) return;
  img.classList.add('is-loading');
  const show = () => {
    img.classList.add('is-loaded');
    img.classList.remove('is-loading');
  };
  img.addEventListener('load', show, { once: true });
  img.addEventListener('error', show, { once: true });
});

// Сколько полных лет компании (чтобы цифра не устаревала)
document.querySelectorAll('[data-years-since]').forEach((el) => {
  const since = new Date(el.dataset.yearsSince);
  const now = new Date();
  let years = now.getFullYear() - since.getFullYear();
  if (now < new Date(now.getFullYear(), since.getMonth(), since.getDate())) years -= 1;
  el.textContent = years;
});

// Текущий год в подвале
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});
