let i18n = () => {
  return i18n.languages[i18n.config.language]
}

i18n.languages = {
  en: require('./en')
}

let lang = "en"
if(typeof window != 'undefined') {

  function handleHashCmd() {
    let hashCmd = document.location.hash.split(":")
    if(hashCmd[0] == "#lang") {
      if(hashCmd[1] == "x") delete localStorage.forceLang
      else if(i18n.languages[hashCmd[1]]) localStorage.forceLang = hashCmd[1]
      else alert(`Language "${hashCmd[1]}" not found. Available languages: ${Object.keys(i18n.languages).join(", ")}`)
    }
  }

  handleHashCmd()
  window.addEventListener("hashchange", handleHashCmd)

  if(localStorage.forceLang) {
    console.warn("FORCED LANGUAGE", localStorage.forceLang)
    lang = localStorage.forceLang
  }
}


if(typeof window != 'undefined') window.i18n = i18n

i18n.config = {
  language: lang,
  locale: lang
}



module.exports = i18n
