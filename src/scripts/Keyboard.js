/* eslint-disable import/extensions */
/* eslint-disable import/extensions */

import * as storage from './storage.js';
import create from './utils/create.js';
import language from './layouts/index.js'; // { en, ru}
import Key from './Key.js';

const main = create('main', '',
// здесь прописываем наши HTML элементы вида 'тег', 'класс', 'содержание'
  [create('h1', 'title', 'Virtual Keyboard'),
    create('p', 'text', 'Чудесная клавиатура!')]);

export default class Keyboard {
  constructor(rowsOrder) {
    this.rowsOrder = rowsOrder;
    // смотрим значение в объекте по ключу
    this.keyPressed = {};
    this.isCaps = false;
  }

  // ru or en
  init(langCode) {
    this.keyBase = language[langCode];
    // output - вывод, равнозначно можно назвать как textarea
    // по сути output это замена querySelector
    this.output = create('textarea', 'output', null, main,
      ['placeholder', 'Жмякни на кнопку, чтобы начать...'],
      ['rows', 5],
      ['cols', 50],
      ['spellcheck', false],
      ['autocorrect', 'off']);
    this.container = create('div', 'keyboard', null, main, ['language', langCode]);
    document.body.prepend(main);
    return this;
  }

  generateLayout() {
    this.keyButtons = []; // Key() - инстансы кнопок
    this.rowsOrder.forEach((row, i) => {
      const rowElement = create('div', 'keyboard__row', null, this.container, ['row', i + 1]);
      rowElement.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;
      row.forEach((code) => {
        // получаем значение из rowOrder и ищем этот объект в layouts по ключу
        const keyObj = this.keyBase.find((key) => key.code === code);
        if (keyObj) {
          const keyButton = new Key(keyObj);
          this.keyButtons.push(keyButton);
          // keyButton - это экземпляр класса
          rowElement.appendChild(keyButton.div);
        }
      });
    });


    document.addEventListener('keydown', this.handleEvent);
    document.addEventListener('keyup', this.handleEvent);
    // document.addEventListener('mousedown', this.handleEvent);
    // document.addEventListener('mouseup', this.handleEvent);
  }
  // стрелочная функция для сохранения контекста
  handleEvent = (e) => {
    //один обработчик для всех событий
    if (e.stopPropagation) e.stopPropagation();
    // деструктуризация
    const { code, type } = e;
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (!keyObj) return;
    // вешаем постоянный фокус на textarea
    this.output.focus();

    if (type.match(/keydown|mousedown/)) {
      if (type.match(/key/)) e.preventDefault();
      //подсветка кнопок
      keyObj.div.classList.add('active');

    } else if (type.match(/keyup|mouseup/)) {
      keyObj.div.classList.remove('active');
    }
  }
}
