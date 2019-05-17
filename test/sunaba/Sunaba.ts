/* eslint-env mocha */
import Sunaba from '../../src/sunaba/Sunaba';
import TokenType from '../../src/sunaba/TokenType';

import assert = require('assert');
// import fs = require('fs');

suite('sunaba.Sunaba', () => {
  setup(() => {
  });

  teardown(() => {
  });

  test('isInName', () => {
    assert.equal(true, Sunaba.isInName('a'));
    assert.equal(true, Sunaba.isInName('z'));
    assert.equal(true, Sunaba.isInName('A'));
    assert.equal(true, Sunaba.isInName('Z'));
    assert.equal(true, Sunaba.isInName('0'));
    assert.equal(true, Sunaba.isInName('9'));

    assert.equal(true, Sunaba.isInName('@'));
    assert.equal(true, Sunaba.isInName('$'));
    assert.equal(true, Sunaba.isInName('&'));
    assert.equal(true, Sunaba.isInName('?'));
    assert.equal(true, Sunaba.isInName('_'));
    assert.equal(true, Sunaba.isInName('\''));

    assert.equal(true, Sunaba.isInName('≤'));
    assert.equal(true, Sunaba.isInName('あ'));
    assert.equal(true, Sunaba.isInName('０'));
    assert.equal(true, Sunaba.isInName('→'));

    assert.equal(false, Sunaba.isInName('<'));
  });

  test('readKeyword', () => {
    assert.equal(TokenType.TOKEN_WHILE_PRE, Sunaba.readKeyword('while', Sunaba.locales.japanese));
    assert.equal(TokenType.TOKEN_DEF_PRE,   Sunaba.readKeyword('def',   Sunaba.locales.japanese));
    assert.equal(TokenType.TOKEN_IF_PRE,    Sunaba.readKeyword('if',    Sunaba.locales.japanese));
    assert.equal(TokenType.TOKEN_CONST,     Sunaba.readKeyword('const', Sunaba.locales.japanese));
    assert.equal(TokenType.TOKEN_OUT,       Sunaba.readKeyword('out',   Sunaba.locales.japanese));
    assert.equal(TokenType.TOKEN_UNKNOWN,   Sunaba.readKeyword('hoge',  Sunaba.locales.japanese));

    assert.equal(TokenType.TOKEN_WHILE_POST, Sunaba.readKeyword('なかぎり', Sunaba.locales.japanese));
    assert.equal(TokenType.TOKEN_WHILE_POST, Sunaba.readKeyword('な限り',   Sunaba.locales.japanese));
    assert.equal(TokenType.TOKEN_IF_POST,    Sunaba.readKeyword('なら',     Sunaba.locales.japanese));
    assert.equal(TokenType.TOKEN_DEF_POST,   Sunaba.readKeyword('とは',     Sunaba.locales.japanese));
    assert.equal(TokenType.TOKEN_CONST,      Sunaba.readKeyword('定数',     Sunaba.locales.japanese));
    assert.equal(TokenType.TOKEN_OUT,        Sunaba.readKeyword('出力',     Sunaba.locales.japanese));
  });

  test('readInstruction', () => {
    const table = [
      'i', 'add', 'sub', 'mul', 'div', 'lt', 'le', 'eq', 'ne',
      'ld', 'st', 'fld', 'fst', 'j', 'bz', 'call', 'ret', 'pop',
    ];

    table.forEach((instruction) => {
      assert.equal(instruction, Sunaba.readInstruction(instruction));
    });

    assert.equal('', Sunaba.readInstruction('hoge'));
  });

  test('readNumber', () => {
    /* eslint space-in-parens: 0, no-restricted-globals: 0 */
    assert.equal( 1234, Sunaba.readNumber(' 1234 ',  1, 4));
    assert.equal(-1234, Sunaba.readNumber(' -1234 ', 1, 5));
    assert.equal(    0, Sunaba.readNumber(' 0 ',     1, 1));
    assert.equal(    0, Sunaba.readNumber(' -0 ',    1, 2));

    assert.equal(true, isNaN(Sunaba.readNumber(' x ', 1, 1)));
  });
});
