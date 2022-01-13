export const mockClient = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  submitAndWait: jest.fn(),
  request: jest.fn(),
  mockClear() {
    this.connect.mockClear();
    this.disconnect.mockClear();
    this.submitAndWait.mockClear();
    this.request.mockClear();
  },
};

export const mockWallet = {
  fromSeed: jest.fn(),
};
