import { useApi } from '@live-change/vue3-ssr'
import { ObservableValue } from '@live-change/dao'
import { ref, computed, onUnmounted, getCurrentInstance } from 'vue'

let localeObservable
let localeRef = ref()

export async function getOtherOwnerLocale(owner, context) {
  if(localeObservable) localeObservable.unbindProperty(localeRef, 'value')
  if(typeof window === 'undefined') {
    const value = await api.get(api.views.localeSettings.localeSettings(owner))
    localeObservable = new ObservableValue(value)
  } else {
    localeObservable = api.observable(api.views.localeSettings.localeSettings(owner))
  }
  localeObservable.bindProperty(localeRef, 'value')
  localeObservable.wait()
  return localeObservable.getValue()
}

export function getLocale(context) {
  context = context ?? getCurrentInstance().appContext
  return (async () => {
    await getLocaleObservable(context)
    await localeObservable.wait()
    return localeObservable.getValue()
  })()
}

export function getLocaleObservable(context) {
  context = context ?? getCurrentInstance().appContext
  return (async () => {
    if(localeObservable) return localeObservable
    const api = useApi(context)
    if(typeof window === 'undefined') {
      const value = await api.get(api.views.localeSettings.myLocaleSettings({}))
      localeObservable = new ObservableValue(value)
    } else {
      localeObservable = api.observable(api.views.localeSettings.myLocaleSettings({}))
    }
    localeObservable.bindProperty(localeRef, 'value')
    return localeObservable
  })()
}

export function watchLocale(callback, context) {
  context = context ?? getCurrentInstance().appContext
  return (async () => {
    const observable = await getLocaleObservable(context)
    const observer = { set: callback }
    observable.observe(observer)
    onUnmounted(() => observable.unobserve(observer))
    await observable.wait()
    return observable.getValue()
  })()
}

export function updateLocale(localSettingsUpdate, context) {
  const api = useApi(context)
  return api.actions.localeSettings.setOrUpdateMyLocaleSettings(localSettingsUpdate)
}
export function captureLocale(context) {
  context = context || getCurrentInstance().appContext
  if(typeof navigator === 'undefined') return
  return (async () => {
    const localeSettings = await getLocale(context)
    console.log("LOCALE SETTINGS", localeSettings)

    const dateTimeOptions = new Intl.DateTimeFormat().resolvedOptions()
    const listOptions = new Intl.ListFormat().resolvedOptions()
    const numberOptions = new Intl.NumberFormat().resolvedOptions()
    const pluralOptions = new Intl.PluralRules().resolvedOptions()
    const relativeTimeOptions = new Intl.RelativeTimeFormat().resolvedOptions()

    if(!localeSettings
      || localeSettings.capturedLanguage !== navigator.language
      || JSON.stringify(localeSettings.capturedDateTime) !== JSON.stringify(dateTimeOptions)
      || JSON.stringify(localeSettings.capturedList) !== JSON.stringify(listOptions)
      || JSON.stringify(localeSettings.capturedNumber) !== JSON.stringify(numberOptions)
      || JSON.stringify(localeSettings.capturedPlural) !== JSON.stringify(pluralOptions)
      || JSON.stringify(localeSettings.capturedRelativeTime) !== JSON.stringify(relativeTimeOptions)
    ) {
      const update = {
        capturedLanguage: navigator.language,
        capturedDateTime: dateTimeOptions,
        capturedList: listOptions,
        capturedNumber: numberOptions,
        capturedPlural: pluralOptions,
        capturedRelativeTime: relativeTimeOptions
      }
      console.log("CAPTURED LOCALE SETTINGS", update)
      await updateLocale(update, context)
    }
  })()
}

function getTimeZoneOffset(d, tz) {
  const a = d.toLocaleString("ja", {timeZone: tz}).split(/[/\s:]/)
  a[1]--
  const t1 = Date.UTC.apply(null, a)
  const t2 = new Date(d).setMilliseconds(0)
  return (t2 - t1) / 60 / 1000
}

export const language = computed(() => localeRef.value?.language ?? localeRef.value?.capturedLanguage ??
    (typeof navigator != 'undefined' && navigator.language))
export const currency = computed(() => localeRef.value?.currency ?? localeRef.value?.capturedCurrency ?? 'usd')
export const dateTime = computed(() => localeRef.value?.dateTime ?? localeRef.value?.capturedDateTime
  ?? new Intl.DateTimeFormat().resolvedOptions())
export const list = computed(() => localeRef.value?.list ?? localeRef.value?.capturedList
  ?? new Intl.ListFormat().resolvedOptions())
export const number = computed(() => localeRef.value?.number ?? localeRef.value?.capturedNumber
  ?? new Intl.NumberFormat().resolvedOptions())
export const plural = computed(() => localeRef.value?.plural ?? localeRef.value?.capturedPlural
  ?? new Intl.PluralRules().resolvedOptions())
export const relativeTime = computed(() => localeRef.value?.relativeTime ?? localeRef.value?.capturedRelativeTime
  ?? new Intl.RelativeTimeFormat().resolvedOptions())

export const timezoneOffset = computed(() => getTimeZoneOffset(new Date(), dateTime.value?.timeZone))

export function localTime(date) {
  return new Date(new Date(date).getTime() + timezoneOffset?.value)
}

export function useLocale(context) {
  return {
    language,
    currency,
    dateTime,
    list,
    number,
    plural,
    relativeTime,
    timezoneOffset,
    localTime
  }
}

