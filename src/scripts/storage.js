export function set(name, value) {
  window.localStorage.setItem(name, JSON.stringify(value));
}

export function get(name, subst = null) {
  // subst - подстраховка
  return JSON.parse(window.localStorage.getItem(name || subst));
}

export function del(name, subst = null) {
  return window.localStorage.removeItem(name || subst);
}

// eslint-disable-next-line eol-last
// lang = get('kbLang', '"ru"');