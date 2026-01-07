import { useApi } from '@live-change/vue3-ssr'
import { ObservableValue } from '@live-change/dao'
import { ref, computed, onUnmounted, getCurrentInstance } from 'vue'

export class Locale {
  constructor(context) {
    this.localeObservable
    this.localeRef = ref()
    this.context = context ?? getCurrentInstance().appContext
    this.api = useApi(context)

    this.language = computed(() =>
      this.localeRef.value?.language ?? this.localeRef.value?.capturedLanguage
      ?? (typeof navigator != 'undefined' && navigator.language)
    )
    this.currency = computed(() =>
      nonEmptyObject(this.localeRef.value?.currency) ?? nonEmptyObject(this.localeRef.value?.capturedCurrency)
      ?? 'usd'
    )
    this.dateTime = computed(() =>
      nonEmptyObject(this.localeRef.value?.dateTime) ?? nonEmptyObject(this.localeRef.value?.capturedDateTime)
      ?? new Intl.DateTimeFormat().resolvedOptions()
    )
    this.list = computed(() =>
      nonEmptyObject(this.localeRef.value?.list) ?? nonEmptyObject(this.localeRef.value?.capturedList)
      ?? new Intl.ListFormat().resolvedOptions()
    )
    this.number = computed(() =>
      nonEmptyObject(this.localeRef.value?.number) ?? nonEmptyObject(this.localeRef.value?.capturedNumber)
      ?? new Intl.NumberFormat().resolvedOptions()
    )
    this.plural = computed(() =>
      nonEmptyObject(this.localeRef.value?.plural) ?? nonEmptyObject(this.localeRef.value?.capturedPlural)
      ?? new Intl.PluralRules().resolvedOptions()
    )
    this.relativeTime = computed(() =>
      nonEmptyObject(this.localeRef.value?.relativeTime) ??
      nonEmptyObject(this.localeRef.value?.capturedRelativeTime)
      ?? new Intl.RelativeTimeFormat().resolvedOptions()
    )
    this.timezoneOffset = computed(() => 
      getTimeZoneOffset(new Date(), this.dateTime.value?.timeZone)
      - getTimeZoneOffset(new Date(), undefined) // server timezone offset
    )

  }

  async getOtherOwnerLocale(owner) {
    if(this.localeObservable) this.localeObservable.unbindProperty(this.localeRef, 'value')
    if(typeof window === 'undefined') {
      const value = await this.api.get(this.api.views.localeSettings.localeSettings(owner))
      this.localeObservable = new ObservableValue(value)
    } else {
      this.localeObservable = this.api.observable(this.api.views.localeSettings.localeSettings(owner))
    }
    this.localeObservable.bindProperty(this.localeRef, 'value')
    this.localeObservable.wait()
    return this.localeObservable.getValue()
  }

  async getOtherUserOrSessionLocale(user, session) {
    if(this.localeObservable) this.localeObservable.unbindProperty(this.localeRef, 'value')
    const path = this.api.views.localeSettings.userOrSessionLocaleSettings({ user, session })
    if(typeof window === 'undefined') {
      const value = await this.api.get(path)
      this.localeObservable = new ObservableValue(value)
    } else {
      this.localeObservable = this.api.observable(path)
    }
    this.localeObservable.bindProperty(this.localeRef, 'value')
    this.localeObservable.wait()
    return this.localeObservable.getValue()
  }


  getLanguage() {
    const language = this.localeRef.value?.language ?? this.localeRef.value?.capturedLanguage
    return language && language.slice(0, 2)
  }

  async getLocale() {
    return (async () => {
      await this.getLocaleObservable()
      await this.localeObservable.wait()
      return this.localeObservable.getValue()
    })()
  }

  async getLocaleObservable() {
    return (async () => {
      if(this.localeObservable) return this.localeObservable
      if(!this.api.views.localeSettings) { // no locale settings service available
        this.localeObservable = new ObservableValue(null)
      } else if(typeof window === 'undefined') {
        const value = await this.api.get(this.api.views.localeSettings.myLocaleSettings({}))
        this.localeObservable = new ObservableValue(value)
      } else {
        this.localeObservable = this.api.observable(this.api.views.localeSettings.myLocaleSettings({}))
      }
      this.localeObservable.bindProperty(this.localeRef, 'value')
      return this.localeObservable
    })()
  }

  async watchLocale(callback) {
    return (async () => {
      const observable = await this.getLocaleObservable()
      const observer = { set: callback }
      observable.observe(observer)
      onUnmounted(() => observable.unobserve(observer))
      await observable.wait()
      return observable.getValue()
    })()
  }

  updateLocale(localSettingsUpdate) {
    if(!this.api.actions.localeSettings) return console.error("No locale settings service available!")
    return this.api.actions.localeSettings.setOrUpdateMyLocaleSettings(localSettingsUpdate)
  }

  async captureLocale(force = false) {
    if(typeof window === 'undefined') return // capture only on client
    if(typeof navigator === 'undefined') return // capture only on client
    return (async () => {
      const localeSettings = await this.getLocale()
      //console.log("LOCALE SETTINGS", JSON.stringify(localeSettings, null, '  '))

      const capturedLanguage = navigator.language
      const capturedDateTime = new Intl.DateTimeFormat().resolvedOptions()
      const capturedList = new Intl.ListFormat().resolvedOptions()
      const capturedNumber = new Intl.NumberFormat().resolvedOptions()
      const capturedPlural = new Intl.PluralRules().resolvedOptions()
      const capturedRelativeTime = new Intl.RelativeTimeFormat().resolvedOptions()

      const capturedLocaleSettings = {
        capturedLanguage,
        capturedDateTime,
        capturedList,
        capturedNumber,
        capturedPlural,
        capturedRelativeTime
      }

      //console.log("CAPTURED LOCALE SETTINGS", JSON.stringify(capturedLocaleSettings, null, '  '))

      /*console.log("language", localeSettings.capturedLanguage !== capturedLanguage)
      console.log("dateTime", JSON.stringify(capturedDateTime) !== JSON.stringify(localeSettings.capturedDateTime))
      console.log("list", JSON.stringify(capturedList) !== JSON.stringify(localeSettings.capturedList))
      console.log("number", JSON.stringify(capturedNumber) !== JSON.stringify(localeSettings.capturedNumber))
      console.log("plural", JSON.stringify(capturedPlural) !== JSON.stringify(localeSettings.capturedPlural))
      console.log("relativeTime", JSON.stringify(capturedRelativeTime) !== JSON.stringify(localeSettings.capturedRelativeTime))
  */
      if(force || !localeSettings
        || localeSettings.capturedLanguage !== capturedLanguage
        || JSON.stringify(localeSettings.capturedDateTime) !== JSON.stringify(capturedDateTime)
        || JSON.stringify(localeSettings.capturedList) !== JSON.stringify(capturedList)
        || JSON.stringify(localeSettings.capturedNumber) !== JSON.stringify(capturedNumber)
        || JSON.stringify(localeSettings.capturedPlural) !== JSON.stringify(capturedPlural)
        || JSON.stringify(localeSettings.capturedRelativeTime) !== JSON.stringify(capturedRelativeTime)
      ) {
        const update = {
          capturedLanguage,
          capturedDateTime,
          capturedList,
          capturedNumber,
          capturedPlural,
          capturedRelativeTime
        }
        console.log("UPDATE LOCALE SETTINGS", update)
        await this.updateLocale(update)
      }
    })()
  }

  localTime(date) {
    if(typeof window !== 'undefined') return date // convert to local time only on server
    return new Date(new Date(date).getTime() - this.timezoneOffset?.value * 60 * 1000)
  }

}

function getTimeZoneOffset(d, tz) {
  const a = d.toLocaleString("ja", { timeZone: tz }).split(/[/\s:]/)
  a[1]--
  const t1 = Date.UTC.apply(null, a)
  const t2 = new Date(d).setMilliseconds(0)
  return (t2 - t1) / 60 / 1000
}

function nonEmptyObject(obj) { /// because command form can add empty objects on language change
  if(!obj) return undefined
  if(Object.keys(obj).length === 0) return undefined
  return obj
}

export function useLocale(context) {
  context = context ?? getCurrentInstance().appContext
  if(!context.config.globalProperties.$locale) {
    context.config.globalProperties.$locale = new Locale(context)
  }
  return context = context.config.globalProperties.$locale
}
