<template>
  <div class="bodyWrapper">
    <div class="col-8 card error-card">
      <h2 class="card-title text-center">{{i18n.title}}</h2>
      <div class="card-body col-12">
        <h5>{{i18n.description}}</h5>
        <h5>{{Math.random() > 0.5 ? i18n.funFact1 : i18n.funFact2}}</h5>
        <blockquote class="quote-wrapper-blockquote">
          {{i18n['quote' + quoteNum].text}}
          <span>{{i18n['quote' + quoteNum].author}}</span>
        </blockquote>
      </div>
    </div>
  </div>
</template>

<script>
  import i18n from 'i18n'
  export default {
    name: "PageNotFound",
    data () {
      return {
        quoteNum: Math.floor(Math.random() * 4) + 1
      }
    },
    computed: {
      i18n() { return i18n().pageNotFound }
    }
  }
</script>

<style scoped>
  .quote-wrapper-blockquote{
    font-size: 1.4em;
    width:60%;
    margin:50px auto;
    font-family:Open Sans;
    font-style:italic;
    color: #4C2E7D;
    padding:1.2em 30px 1.2em 75px;
    border-left:8px solid #4C2E7D;
    line-height:1.6;
    position: relative;
    background:#EDEDED;
  }

  .quote-wrapper-blockquote::before{
    font-family:Arial;
    content: "\201C";
    color:#4C2E7D;
    font-size:4em;
    position: absolute;
    left: 10px;
    top:-10px;
  }

  .quote-wrapper-blockquote::after{
    content: '';
  }

  .quote-wrapper-blockquote span{
    display:block;
    color:#4C2E7D;
    font-style: normal;
    font-weight: bold;
    margin-top:1em;
  }
  .bodyWrapper {
    padding-top: 50px;
  }
  .error-card {
    margin-right: auto;
    margin-left: auto;
    padding: 20px;
  }
</style>