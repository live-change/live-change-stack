import { useApi } from '@live-change/vue3-ssr'


export async function startTopUp({value, price, currency}, api = useApi()) {
  return await api.actions.billing.topUp({ value, price, currency })
}