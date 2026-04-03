import { useHistoryStore } from '@/store/historyStore'

export function useHistory() {
  return useHistoryStore()
}
