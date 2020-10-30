export function set(name, value) {
  window.localStorage.setItem(name, JSON.stringify(value));
}

export function get(name, subst = null) {
  return JSON.parse(window.localStorage.getItem(name || subst));      //subst - подстраховка
}

export function del(name, subst = null) {
  return window.localStorage.removeItem(name || subst);
}

// lang = get('kbLang', '"ru"');