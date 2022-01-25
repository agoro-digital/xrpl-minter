import { mockClient, mockWallet } from './test-utils';
import { listNftsForAccount, mint } from '../src/xls-20';
import type { NFT } from '../src/types';
import { Client, Wallet } from 'xrpl';
jest.mock('xrpl');

const ClientMock = (
  Client as jest.MockedClass<typeof Client>
).mockImplementation(jest.fn().mockImplementation(() => mockClient));
const WalletMock = (
  Wallet as jest.MockedClass<typeof Wallet>
).mockImplementation(jest.fn().mockImplementation(() => mockWallet));

describe('xls-20', () => {
  afterEach(() => {
    ClientMock.mockClear();
    WalletMock.mockClear();
    mockClient.mockClear();
  });
  describe('mint()', () => {
    beforeEach(() => {
      //@ts-expect-error - only setting types needed
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      WalletMock.fromSeed.mockReturnValue({ classicAddress: 'some-address' });
    });

    test('Should connect the xrp client to the correct server', async () => {
      const server = 'some-mock-server';
      await mint(server, {
        TokenTaxon: 0,
        walletSecret: 'secret',
      });
      expect(ClientMock).toHaveBeenCalledWith(server);
    });
    test('Should call submitAndWait with the correct args', async () => {
      const mockTx = {
        TransactionType: 'NFTokenMint',
        TokenTaxon: 0,
        Account: 'some-address',
      };
      await mint('some-mock-server', {
        ...mockTx,
        walletSecret: 'some-secret',
      });
      expect(mockClient.submitAndWait).toHaveBeenCalledWith(mockTx, {
        wallet: { classicAddress: 'some-address' },
      });
    });
    test('Should disconnect from the xrpl server', async () => {
      await mint('some-server', {
        TokenTaxon: 0,
        walletSecret: 'secret',
      });

      expect(mockClient.disconnect).toHaveBeenCalledTimes(1);
    });
    test('Should return the response from submitAndWait()', async () => {
      const mockReturn = {
        response: 'some-response',
      };
      mockClient.submitAndWait.mockReturnValue(mockReturn);
      const expected = await mint('some-mock-server', {
        TokenTaxon: 0,
        walletSecret: 'secret',
      });
      expect(expected).toStrictEqual(mockReturn);
    });
  });

  describe('listNftsForAccount()', () => {
    let nfts: NFT[];
    beforeAll(() => {
      nfts = [
        {
          Flags: 1,
          Issuer: 'some-issuer-address',
          TokenID: 'sdjkfh98qy3f23fwf',
          TokenTaxon: 0,
          URI: 'ipfs://asjkdhf982q3fasdfadsf',
          nft_serial: 0,
        },
      ];
    });
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      mockClient.request.mockReturnValue({
        result: {
          account_nfts: nfts,
        },
      });
    });
    test('Should connect the xrp client to the correct server', async () => {
      const server = 'some-mock-server';

      await listNftsForAccount(server, 'some-address');
      expect(ClientMock).toHaveBeenCalledWith(server);
    });
    test('Should call make the correct client request', async () => {
      const walletAddress = 'some-address';
      await listNftsForAccount('some-mock-server', walletAddress);

      expect(mockClient.request).toHaveBeenCalledWith({
        command: 'account_nfts',
        account: walletAddress,
      });
    });
    test('Should deisconnect from the xrpl server', async () => {
      await listNftsForAccount('some-mock-server', 'address');
      expect(mockClient.disconnect).toHaveBeenCalledTimes(1);
    });
    test('Should return the nfts from the client request', async () => {
      const actual = await listNftsForAccount('some-mock-server', 'address');
      expect(actual).toStrictEqual(nfts);
    });
  });
});
