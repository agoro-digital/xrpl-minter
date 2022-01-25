import type * as xrpl from 'xrpl';
import { getTokenIdFromResponse } from '../src';

describe('getTokenIdFromResponse()', () => {
  test('Should return empty string if meta in the res is undefined', () => {
    const res = {
      id: 'someId',
    } as xrpl.TxResponse;
    expect(getTokenIdFromResponse(res)).toBe('');
  });
  test('Should return an empty string if result meta is a string', () => {
    const res = {
      id: 'someId',
      result: {
        meta: '',
      },
    } as xrpl.TxResponse;
    expect(getTokenIdFromResponse(res)).toBe('');
  });
  test('If there are no modified nodes found, should return an empty string', () => {
    const res = {
      id: 'someId',
      result: {
        meta: {
          AffectedNodes: [{}],
        },
      },
    } as xrpl.TxResponse;
    expect(getTokenIdFromResponse(res)).toBe('');
  });
  test('if no currentNfts are found, should return an empty string', () => {
    const res = {
      id: 'someId',
      result: {
        meta: {
          AffectedNodes: [
            {
              ModifiedNode: {
                LedgerEntryType: 'NFTokenPage',
                FinalFields: {},
              },
            },
          ],
        },
      },
    } as xrpl.TxResponse;
    expect(getTokenIdFromResponse(res)).toBe('');
  });
  test('if no previous NFTs are found, should return an empty string', () => {
    const res = {
      id: 'someId',
      result: {
        meta: {
          AffectedNodes: [
            {
              ModifiedNode: {
                LedgerEntryType: 'NFTokenPage',
                FinalFields: {
                  NonFungibleTokens: [
                    {
                      NonFungibleToken: {
                        TokenID: '',
                      },
                    },
                  ],
                },
                PreviousFields: {},
              },
            },
          ],
        },
      },
    };
    //@ts-expect-error - making types fit needs for tests
    expect(getTokenIdFromResponse(res)).toBe('');
  });

  test('Should return an empty string if no match is found', () => {
    const tokenId = '1234sdflkjasdfadf';
    const res = {
      id: 'someId',
      result: {
        meta: {
          AffectedNodes: [
            {
              ModifiedNode: {
                LedgerEntryType: 'NFTokenPage',
                FinalFields: {
                  NonFungibleTokens: [
                    {
                      NonFungibleToken: {
                        TokenID: tokenId,
                      },
                    },
                  ],
                },
                PreviousFields: {
                  NonFungibleTokens: [
                    {
                      NonFungibleToken: {
                        TokenID: tokenId,
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    };
    //@ts-expect-error - making types fit needs for tests
    expect(getTokenIdFromResponse(res)).toBe('');
  });
  test('Should return the tokenID if a match is found', () => {
    const tokenId = '1234sdflkjasdfadf';
    const res = {
      id: 'someId',
      result: {
        meta: {
          AffectedNodes: [
            {
              ModifiedNode: {
                LedgerEntryType: 'NFTokenPage',
                FinalFields: {
                  NonFungibleTokens: [
                    {
                      NonFungibleToken: {
                        TokenID: tokenId,
                      },
                    },
                  ],
                },
                PreviousFields: {
                  NonFungibleTokens: [
                    {
                      NonFungibleToken: {
                        TokenID: 'asdlkfjadsf98',
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    };
    //@ts-expect-error - making types fit needs for tests
    expect(getTokenIdFromResponse(res)).toBe(tokenId);
  });
});
