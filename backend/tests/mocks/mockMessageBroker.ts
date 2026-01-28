import { vi } from 'vitest';
import { IMessageBroker } from '@application/ports/IMessageBroker.js';

export const mockMessageBroker: IMessageBroker = {
  publish: vi.fn(),
};
