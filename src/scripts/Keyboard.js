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
    this.keyBase = language[langCode];    // массив
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

      //флаг состояния шифта
      if (code.match(/Shift/)) this.shiftKey = true;


      //подсветка кнопок
      keyObj.div.classList.add('active');

      // Смена языка
      if (code.match(/Control/)) this.ctrlKey = true;
      if (code.match(/Alt/)) this.altKey = true;

      if (code.match(/Control/) && this.altKey) this.switchLang();
      if (code.match(/Alt/) && this.ctrlKey) this.switchLang();


      //проверяем статус капслока
      if (!this.isCaps) {
        this.printToOutput(keyObj, this.shiftKey ? keyObj.shift : keyObj.small);
      } else if (this.isCaps) {
        if (this.shiftKey) {
          this.printToOutput(keyObj, keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
        } else {
          this.printToOutput(keyObj, !keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
        }
      }


      // работа кнопки
    } else if (type.match(/keyup|mouseup/)) {
      keyObj.div.classList.remove('active');

      if (code.match(/Shift/)) this.shiftKey = false;
      if (code.match(/Control/)) this.ctrlKey = false;
      if (code.match(/Alt/)) this.altKey = false;
    }
  }

  // сменя языка по хоткею
  switchLang = () => {
    // получаем аббревиатуту языка
    const LangAbbr = Object.keys(language); // получаем массив языков
    let langIndex = LangAbbr.indexOf(this.container.dataset.language);  // 1 default
    this.keyBase = langIndex + 1 < LangAbbr.length ? language[LangAbbr[langIndex++]]  //langIndex += 1
      : language[LangAbbr[langIndex -= langIndex]];    //обнуляем индекс языка

      this.container.dataset.language = LangAbbr[langIndex];
      storage.set('kbLang', LangAbbr[langIndex]);

      this.keyButtons.forEach((button) => {
        // итерация по всем кнопкам, смотрим в их базу и ищем объект key, проверяем равенство с button.code
        const keyObj = this.keyBase.find((key) => key.code === button.code);
        if (!keyObj) return;
        button.shift = keyObj.shift;
        button.small = keyObj.small;

        if (keyObj.shift && keyObj.shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/g)) {
          button.sub.innerHTML = keyObj.shift;
        } else {
          button.sub.innerHTML = '';
        }
        button.letter.innerHTML = keyObj.small;
      });
  }


  //
  printToOutput(keyObj, symbol) {
    //находим значение курсора
    let cursorPos = this.output.selectionStart;
    const left = this.output.value(0, cursorPos);
    const right = this.output.value.slice(cursorPos);

    const fnButtonsHandler = {
      Tab: () => {
        this.output.value = `${left}\t${right}`;
      },
      ArrowLeft: () => {
        cursorPos = cursorPos-- >= 0 ? cursorPos-- : 0;
      },
      ArrowLeft: () => {
        cursorPos++
      },
      // считает количество знаков до первого перевода позиции (перевода каретки)
      //регулярка - первый перевод стоки и любые символы после него
      ArrowUp: () => {
        const positionFromLeft = this.output.value.slice(0, cursorPos).match(/(\n).*$(?!\1)/g) || [[1]];
        cursorPos -= positionFromLeft[0].length;
      },
      ArrowDown: () => {
        const positionFromLeft = this.output.value.slice(cursorPos).match(/^.*(\n).*$(?!\1)/) || [[1]];
        cursorPos += positionFromLeft[0].length;
      },
      Enter: () => {
        this.output.value = `${left}\n${right}`;
        cursorPos++;
      },
      // Backspace удаляет один символ слева (см. подробнее метод slice())
      Backspace: () => {
        this.output.value = `${left.slice(0, -1)}${right}`;
        cursorPos--;
      },
      // Delete убирает один символ справа
      Delete: () => {
        this.output.value = `${left}${right.slice(1)}`;
      },
      Space: () => {
        this.output.value = `${left} ${right}`;
        cursorPos++;
      }
    }

    // на вход берем keyObj
    // fnButtonsHandler[keyObj.code]()  - мы вызываем метод, который находится в 
    // fnButtons Handler по адресу keyObj.code
    if (fnButtonsHandler[keyObj.code]) fnButtonsHandler[keyObj.code]();

    //если нам пришла не FnKey, то сдвигаем курсор на 1
    else if (!keyObj.isFnKey) {
      cursorPos++;
      //режем строку пополам, склеиваем: левая часть + новый символ(или ничего) + правая часть
      this.output.value = `${left}${symbol || ''}${right}`;
    }
    //обновляем позицию курсора
    // setSelectionRange(0, 3) - произойдет выделение текста с 1 по 4 символ
    this.output.setSelectionRange(cursorPos, cursorPos);
  }

}
