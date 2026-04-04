export interface TrackedItem {
  id: string;
  name: string;
  description: string;
  status: string;
  updatedAt: string;
  bestPrice: number;
  targetPrice: number;
  image: string;
}

export interface Message {
  id: string;
  sender: 'PENNY' | 'YOU';
  text: string;
  isChipActive?: boolean;
  hasCards?: boolean;
}

export type ChatFlowState = 'IDLE' | 'ASKED_PRICE' | 'ASKED_ALERT';
