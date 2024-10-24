import { useApi } from '@live-change/vue3-ssr'

export function startTopUp({value, price, currency}, api = useApi()) {
  api.request(['wallet', 'topUp'], {value, price, currency})

}