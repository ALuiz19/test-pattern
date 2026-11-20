import { Carrinho } from '../../src/domain/Carrinho.js';
import { Item } from '../../src/domain/Item.js';
import { UserMother } from './UserMother.js';

/**
 * Data Builder: monta um Carrinho válido com valores padrão e deixa
 * o teste mudar só o que importa para o cenário.
 */
export class CarrinhoBuilder {
    constructor() {
        this.user = UserMother.umUsuarioPadrao();
        this.itens = [new Item('Produto Padrão', 100)];
    }

    comUser(user) {
        this.user = user;
        return this;
    }

    comItens(itens) {
        this.itens = [...itens];
        return this;
    }

    comItem(nome, preco) {
        this.itens.push(new Item(nome, preco));
        return this;
    }

    vazio() {
        this.itens = [];
        return this;
    }

    build() {
        return new Carrinho(this.user, [...this.itens]);
    }
}
