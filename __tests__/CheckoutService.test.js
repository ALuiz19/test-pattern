import { CheckoutService } from '../src/services/CheckoutService.js';
import { Item } from '../src/domain/Item.js';
import { UserMother } from './builders/UserMother.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';

const CARTAO = { numero: '4111111111111111', validade: '12/30', cvv: '123' };

describe('CheckoutService', () => {
    describe('quando o pagamento falha', () => {
        it('retorna null e não gera pedido', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder().build();
            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: false }) };
            const repositoryDummy = {};
            const emailDummy = {};
            const checkoutService = new CheckoutService(gatewayStub, repositoryDummy, emailDummy);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, CARTAO);

            // Assert (verificação de estado)
            expect(pedido).toBeNull();
        });
    });

    describe('quando um cliente Premium finaliza a compra', () => {
        let gatewayStub;
        let repositoryStub;
        let emailMock;
        let pedido;

        beforeEach(async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder()
                .comUser(UserMother.umUsuarioPremium())
                .comItens([new Item('Teclado', 150), new Item('Mouse', 50)])
                .build();
            gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            repositoryStub = {
                salvar: jest.fn().mockImplementation(async (p) => ({ ...p, id: 42 })),
            };
            emailMock = { enviarEmail: jest.fn().mockResolvedValue(undefined) };
            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailMock);

            // Act
            pedido = await checkoutService.processarPedido(carrinho, CARTAO);
        });

        it('cobra o valor com 10% de desconto', () => {
            // Assert
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, CARTAO);
        });

        it('envia um e-mail de confirmação para o cliente', () => {
            // Assert (verificação de comportamento)
            expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                'premium@email.com',
                'Seu Pedido foi Aprovado!',
                'Pedido 42 no valor de R$180'
            );
        });

        it('retorna o pedido salvo com status PROCESSADO', () => {
            // Assert
            expect(pedido).toMatchObject({ id: 42, totalFinal: 180, status: 'PROCESSADO' });
        });
    });

    describe('quando um cliente Padrão finaliza a compra', () => {
        it('cobra o valor cheio, sem desconto', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder()
                .comUser(UserMother.umUsuarioPadrao())
                .comItens([new Item('Teclado', 150), new Item('Mouse', 50)])
                .build();
            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const repositoryStub = {
                salvar: jest.fn().mockImplementation(async (p) => ({ ...p, id: 7 })),
            };
            const emailStub = { enviarEmail: jest.fn().mockResolvedValue(undefined) };
            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailStub);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, CARTAO);

            // Assert
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(200, CARTAO);
            expect(pedido.totalFinal).toBe(200);
        });
    });

    describe('quando o envio de e-mail falha', () => {
        afterEach(() => jest.restoreAllMocks());

        it('conclui o checkout mesmo assim', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder().build();
            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const repositoryStub = { salvar: jest.fn().mockResolvedValue({ id: 99 }) };
            const emailStub = { enviarEmail: jest.fn().mockRejectedValue(new Error('SMTP fora do ar')) };
            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailStub);
            jest.spyOn(console, 'error').mockImplementation(() => {});

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, CARTAO);

            // Assert
            expect(pedido).toEqual({ id: 99 });
        });
    });
});
