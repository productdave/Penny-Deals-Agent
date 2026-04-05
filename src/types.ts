export interface TrackedItem {
  id: string;
  name: string;
  description: string;
  status: string;
  updatedAt: string;
  bestPrice: number;
  targetPrice: number;
  /** 'absolute' (default) or 'percent_off' (target vs reference × (1 − %/100)) */
  targetMode?: 'absolute' | 'percent_off' | string | null;
  targetPercent?: number | null;
  targetReferencePrice?: number | null;
  image: string;
  url?: string;
}

export interface PennyResponse {
  reasoning?: string | null;
  conclusion?: 'BUY' | 'WAIT' | 'TRACK' | null;
  confidence?: 'High' | 'Medium' | 'Low' | null;
  next_steps?: string[];
}

export interface Message {
  id: string;
  sender: 'PENNY' | 'YOU';
  text: string;
  isChipActive?: boolean;
  hasCards?: boolean;
  pennyResponse?: PennyResponse;
}

export type ChatFlowState = 'IDLE' | 'ASKED_PRICE' | 'ASKED_ALERT';
