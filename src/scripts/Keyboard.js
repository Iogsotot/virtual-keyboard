/* eslint-disable no-param-reassign */
/* eslint-disable import/extensions */

import * as storage from './storage.js';
import create from './utils/create.js';
import language from './layouts/index.js'; // { en, ru}
import Key from './Key.js';

const main = create('main', '',
// здесь прописываем наши HTML элементы вида 'тег', 'класс', 'содержание'
  [create('h1', 'title', 'Virtual Keyboard')]);

export default class Keyboard {
  constructor(rowsOrder) {
    this.rowsOrder = rowsOrder;
    this.soundEnabled = true;
    // смотрим значение в объекте по ключу
    this.keysPressed = {};
    this.isCaps = false;
    this.isShift = false;
    this.keyBase = [];
    this.sounds = new Map();
    this.sounds.set('ru', document.getElementById('ruSound'));
    this.sounds.set('en', document.getElementById('enSound'));
    this.sounds.set('fn', document.getElementById('fnSound'));
    this.sounds.set('num', document.getElementById('numSound'));

    this.sounds.set('mic', document.getElementById('micSound'));
    this.sounds.set('lang', document.getElementById('langSound'));
    this.sounds.set('ghost', document.getElementById('ghostSound'));
    this.sounds.set('ctrl', document.getElementById('ctrlSound'));
    this.sounds.set('alt', document.getElementById('altSound'));
    this.sounds.set('caps', document.getElementById('capsSound'));
    this.sounds.set('tab', document.getElementById('tabSound'));
    this.sounds.set('shift', document.getElementById('shiftSound'));
    this.sounds.set('close', document.getElementById('closeSound'));
  }

  // ru or en
  init(langCode) {
    // console.log(langCode);
    // console.log(this.keyBase);
    this.keyBase = language[langCode]; // массив
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
      // rowElement.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;
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
    // обработка кликов
    this.container.addEventListener('mousedown', this.preHandleEvent);
    this.container.addEventListener('mouseup', this.preHandleEvent);
  }

  // функция обработки кликов
  preHandleEvent = (e) => {
    // отменяем всплытие (развернуть комментарий)
    e.stopPropagation();
    // ищем ближайшей элемент .keyboard__key (как при querySelector)
    const keyDiv = e.target.closest('.keyboard__key');
    if (!keyDiv) return;
    const { dataset: { code } } = keyDiv; // деструктуризация (ES6+)
    keyDiv.addEventListener('mouseleave', this.resetButtonState);

    // создаём кастомный объект
    this.handleEvent({ code, type: e.type });
    // console.log(this.handleEvent)
  }

  // // отжатие кнопки, когда мышка ушла
  // resetButtonState = ({ target: { dataset: { code } } }) => {
  //   // if (code.match('Shift')) this.switchUpperCase(false);
  //   // this.resetPressedButtons(code);
  //   const keyObj = this.keyButtons.find((key) => key.code === code);
  //   // убираем подсветку
  //   keyObj.div.classList.remove('active');
  //   // снимаем listener
  //   keyObj.removeEventListener('mouseleave', this.resetButtonsState);
  // }

  changeSoundSetting() {
    if (this.soundEnabled) this.soundEnabled = false;
    else this.soundEnabled = true;
    storage.set('kbSoundEnabled', this.soundEnabled);
  }

  // стрелочная функция для сохранения контекста
  handleEvent = (e) => {
    // один обработчик для всех событий
    if (e.stopPropagation) e.stopPropagation();
    // деструктуризация
    const { code, type } = e;
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (!keyObj) return;
    // вешаем постоянный фокус на textarea
    this.output.focus();

    if (this.soundEnabled) {
      // добавляем звук(смотрим в объект клавиши)
      this.sounds.get(keyObj.sound).play();
    }

    if (type.match(/keydown|mousedown/)) {
      if (!type.match(/mouse/)) e.preventDefault();

      // флаг состояния шифта
      if (code.match(/Shift/)) this.isShift = true;
      if (this.isShift) this.switchUpperCase(true);

      if (code.match(/SoundKeySwitch/)) this.changeSoundSetting();

      if (code.match(/Control|Alt|Caps|Shift/) && e.repeat) return;

      // Смена языка
      if (code.match(/Control/)) this.ctrlKey = true;
      if (code.match(/Alt/)) this.altKey = true;

      if (code.match(/Control/) && this.altKey) this.switchLang();
      if (code.match(/Alt/) && this.ctrlKey) this.switchLang();

      // подсветка кнопок
      keyObj.div.classList.add('active');

      // залипание класса для капса
      if (code.match(/Caps/) && !this.isCaps) {
        this.isCaps = true;
        this.switchUpperCase(true);
      } else if (code.match(/Caps/) && this.isCaps) {
        this.isCaps = false;
        this.switchUpperCase(false);
        keyObj.div.classList.remove('active');
      }

      // // залипание класса для шифта
      // if (code.match(/Shift/) && !this.isShift) {
      //   this.isShift = true;
      //   this.switchUpperCase(true);
      // } else if (code.match(/Shift/) && this.isShift) {
      //   this.isShift = false;
      //   this.switchUpperCase(false);
      //   keyObj.div.classList.remove('active');
      // }

      // проверяем статус капслока
      if (!this.isCaps) {
        this.printToOutput(keyObj, this.isShift ? keyObj.shift : keyObj.small);
      } else if (this.isCaps) {
        if (this.isShift) {
          this.printToOutput(keyObj, keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
        } else {
          this.printToOutput(keyObj, !keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
        }
      }

      this.keysPressed[keyObj.code] = keyObj;
      // console.log(keyObj);
      // console.log(this.keysPressed);

      // работа кнопки
    } else if (type.match(/keyup|mouseup/)) {
      this.resetPressedButtons(code);
      if (code.match(/Shift/)) {
        this.isShift = false;
        this.switchUpperCase(false);
      }
      if (code.match(/Control/)) this.ctrlKey = false;
      if (code.match(/Alt/)) this.altKey = false;

      if (!code.match(/Caps/)) keyObj.div.classList.remove('active');
    }
  }
 
  // отжатие кнопки, когда мышка ушла
  resetButtonState = ({ target: { dataset: { code } } }) => {
    if (code.match('Shift')) {
      this.switchUpperCase(false);
      this.isShift = false;
      // убираем подсветку
      this.keysPressed[code].div.classList.remove('active');
    }
    if (code.match(/Control/)) this.ctrlKey = false;
    if (code.match(/Alt/)) this.altKey = false;
    this.resetPressedButtons(code);
    this.output.focus();
  }

  // ?????
  resetPressedButtons = (targetCode) => {
    if (!this.keysPressed[targetCode]) return;
    // убираем подсветку
    if (!this.isCaps) this.keysPressed[targetCode].div.classList.remove('active');
    // снимаем listener
    this.keysPressed[targetCode].div.removeEventListener('mouseleave', this.resetButtonState);
    delete this.keysPressed[targetCode];
  }

  // сменя языка по хоткею
  switchLang = () => {
    // получаем аббревиатуру языка
    const LangAbbr = Object.keys(language); // получаем массив языков
    let langIndex = LangAbbr.indexOf(this.container.dataset.language); // 1 default
    this.keyBase = langIndex + 1 < LangAbbr.length ? language[LangAbbr[langIndex += 1]]
      : language[LangAbbr[langIndex -= langIndex]]; // обнуляем индекс языка

    this.container.dataset.language = LangAbbr[langIndex];
    storage.set('kbLang', LangAbbr[langIndex]);

    this.keyButtons.forEach((button) => {
      // итерация по всем кнопкам, смотрим в их базу и ищем объект key,
      // проверяем равенство с button.code
      const keyObj = this.keyBase.find((key) => key.code === button.code);
      if (!keyObj) return;
      // eslint-disable-next-line no-param-reassign
      button.shift = keyObj.shift;
      button.small = keyObj.small;
      button.sound = keyObj.sound;

      if (keyObj.shift && keyObj.shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/g)) {
        button.sub.innerHTML = keyObj.shift;
      } else {
        button.sub.innerHTML = '';
      }
      button.letter.innerHTML = keyObj.small;
    });

    // проверяем зажатый капс
    if (this.isCaps) this.switchUpperCase(true);
  }

  // подъём регистра в изображении клавиатуры
  switchUpperCase(isTrue) {
    if (isTrue) {
      this.keyButtons.forEach((button) => {
        if (button.sub) {
          if (this.isShift) {
            button.sub.classList.add('sub-active'); // класс для Uppercase
            button.letter.classList.add('sub-inactive'); // оно же
          }
        }

        if (!button.isFnKey && this.isCaps && !this.isShift && !button.sub.innerHTML) {
          button.letter.innerHTML = button.shift;
        } else if (!button.isFnKey && this.isCaps && this.isShift) {
          button.letter.innerHTML = button.small;
        } else if (!button.isFnKey && !button.sub.innerHTML) {
          button.letter.innerHTML = button.shift;
        }
      });
    } else {
      this.keyButtons.forEach((button) => {
        // если пришла кнопка со спецсимволом
        if (button.sub.innerHTML && !button.isFnKey) {
          button.sub.classList.remove('sub-active'); // класс для Uppercase
          button.letter.classList.remove('sub-inactive'); // оно же

          if (!this.isCaps) {
            button.letter.innerHTML = button.small;
          } else if (!this.isCaps) {
            button.letter.innerHTML = button.shift;
          }
        } else if (!button.isFnKey) {
          if (this.isCaps) {
            button.letter.innerHTML = button.shift;
          } else {
            button.letter.innerHTML = button.small;
          }
        }
      });
    }
  }

  // вывод
  printToOutput(keyObj, symbol) {
    // находим значение курсора
    let cursorPos = this.output.selectionStart;
    const left = this.output.value.slice(0, cursorPos);
    const right = this.output.value.slice(cursorPos);

    const fnButtonsHandler = {
      Tab: () => {
        this.output.value = `${left}\t${right}`;
        cursorPos += 1;
      },
      ArrowLeft: () => {
        cursorPos = cursorPos - 1 >= 0 ? cursorPos - 1 : 0;
      },
      ArrowRight: () => {
        cursorPos += 1;
      },
      // считает количество знаков до первого перевода позиции (перевода каретки)
      // регулярка - первый перевод стоки и любые символы после него
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
        cursorPos += 1;
      },
      // Backspace удаляет один символ слева (см. подробнее метод slice())
      Backspace: () => {
        this.output.value = `${left.slice(0, -1)}${right}`;
        cursorPos -= 1;
      },
      // Delete убирает один символ справа
      Delete: () => {
        this.output.value = `${left}${right.slice(1)}`;
      },
      Space: () => {
        this.output.value = `${left} ${right}`;
        cursorPos += 1;
      },
    };

    // на вход берем keyObj
    // fnButtonsHandler[keyObj.code]()  - мы вызываем метод, который находится в
    // fnButtons Handler по адресу keyObj.code
    if (fnButtonsHandler[keyObj.code]) fnButtonsHandler[keyObj.code]();

    // если нам пришла не FnKey, то сдвигаем курсор на 1
    else if (!keyObj.isFnKey) {
      cursorPos += 1;
      // режем строку пополам, склеиваем: левая часть + новый символ(или ничего) + правая часть
      this.output.value = `${left}${symbol || ''}${right}`;
    }
    // обновляем позицию курсора
    // setSelectionRange(0, 3) - произойдет выделение текста с 1 по 4 символ
    this.output.setSelectionRange(cursorPos, cursorPos);
  }
}
