// eslint-disable import/extensions
import create from './utils/create.js';

export default class Key {
  constructor({ small, shift, code }) {
    this.code = code;
    this.small = small;
    this.shift = shift;
    this.isFnKey = Boolean(small.match(/Ctrl|arr|Alt|Shift|Tab|Back|Del|Enter|Caps|Esc\Win/));

    // проверяем, что если в объекте по ключу shift лежит не буквы и не цифры, то 
    // создаём элемент div с классом sub и записывает в свойства экземпляра класса Key
    if(shift && shift.match(/[^a-zA-Zа-ЯА-яёЁ0-9]/)) {
      this.sub = create('div', 'sub', this.shift);
    } else {
      this.sub = create('div', 'sub', '');
    }

    this.letter = create('div', 'letter', small);
    this.div = create('div', 'keyboard__key', [this.sub, this.letter], null, ['code', this.code],
      this.isFnKey ? ['fn', 'true'] : ['fn', 'false']);  //для стилей
  }
}
