export interface HdvScanActiveItem {
  itemName: string
  source: string
  updatedAt: string
}

export interface HdvScanResult {
  id: string
  itemName: string
  price: number
  candidates: number[]
  confidence: 'low' | 'medium' | 'high'
  source: string
  createdAt: string
}

const state = {
  activeItem: null as HdvScanActiveItem | null,
  results: [] as HdvScanResult[],
}

export const getHdvScanState = () => state

