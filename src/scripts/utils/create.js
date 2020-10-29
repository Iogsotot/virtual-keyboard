/* eslint-disable linebreak-style */
/* @param {String} el             */
/* @param {String} classNames     */
/* @param {HTMLElement} progeny  */ // child or children
/* @param {HTMLElement} parent   */
/* @param {...array} dataAttr   */

// ... - rest operator
export default function create(el, classNames, progeny, parent, ...dataAttr) {
  let element = null;
  try { // попробуй выполнить этот код
    element = document.createElement(el);
  } catch (error) { // не получилось? тогда это делай
    throw new Error('не получилось сделать новый элемент');
  }

  /* высыпаем массив: превращаем строки в массив, ... -spread operator  */
  if (classNames) element.classList.add(...classNames.split(' ')); // если пришло !underfind

  /* проверяем передали ли мы массив */
  if (progeny && Array.isArray(progeny)) {
    progeny.forEach((progenyElement) => progenyElement && element.appendChild(progenyElement));
  } else if (progeny && typeof progeny === 'object') {
    element.appendChild(progeny);
  } else if (progeny && typeof progeny === 'string') {
    element.innerHTML = progeny;
  }

  /* проверяем что пришло нам в parent */
  if (parent) {
    parent.appendChild(element);
  }

  // проверяем ...dataAttr.
  // dataAttr - двумерный массив: [['attrName', 'attrValue'], ['attrName', 'attrValue']]
  /* нам может придти: <span id="" data-code="" disabled></span> el.dataset.code = "" */
  if (dataAttr.length) { // length = 0 => false
    dataAttr.forEach(([attrName, attrValue]) => { // деструктуризация(ES6+)
      if (attrValue === '') {
        element.setAttribute(attrName, '');
      } else if (attrName.match(/value|id|placeholder|cols|rows|autocorrect|spellcheck/)) {
        element.setAttribute(attrName, attrValue);
      } else { // если мы сюда упали, значит пришёл data-attr
        element.dataset[attrName] = attrValue;
      }
    });
  }
  return element;
}
