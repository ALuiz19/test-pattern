import { User } from '../../src/domain/User.js';

/**
 * Object Mother: fornece usuários prontos e fixos.
 * Usuários são simples e mudam pouco entre os testes, então alguns
 * métodos nomeados bastam para cobrir os casos.
 */
export class UserMother {
    static umUsuarioPadrao() {
        return new User(1, 'Cliente Padrão', 'padrao@email.com', 'PADRAO');
    }

    static umUsuarioPremium() {
        return new User(2, 'Cliente Premium', 'premium@email.com', 'PREMIUM');
    }
}
