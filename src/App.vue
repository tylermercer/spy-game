<template>
  <div id="app" :class="flickering? 'flickering' : ''">
    <nav>
      <button v-if="!prefersReducedMotion" @click="() => flickering = !flickering">Toggle CRT flicker</button>
    </nav>
    <main class="content">
      <Loader v-if="stats == null && errorMessage === ''"/>
      <p v-else-if="errorMessage !== ''">{{errorMessage}}</p>
      <DataDisplay :stats="stats" v-else />
    </main>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import Loader from './components/Loader.vue'
import DataDisplay from './components/DataDisplay.vue'
import { getStats, Stats } from './getStats'

@Component<App>({
  components: {
    Loader,
    DataDisplay
  },
  created() {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    this.prefersReducedMotion = (!mediaQuery || mediaQuery.matches);

    if (this.prefersReducedMotion) {
      this.flickering = false;
    } else {
      if (localStorage && localStorage.getItem('flicker') == 'false') {
        this.flickering = false;
      }
    }
    this.getGameStats()
  },
})
export default class App extends Vue {

  private stats: Stats | null = null
  private errorMessage: string = ''

  private prefersReducedMotion: boolean = false
  private flickering: boolean = true

  @Watch('flickering')
  private saveFlickering(newVal: boolean) {
    if (localStorage) {
      localStorage.setItem('flicker', '' + newVal)
    }
  }
  public async getGameStats() {
    try {
      this.stats = await getStats();
    }
    catch (e) {
      this.errorMessage = e.message;
    }
  }
}
</script>

<style>
:root {
  --color-text: #75fa69;
  --color-text-flicker: #3ada5c;
  --color-bg: black;
  --color-link: #42b983;
}
h1,
h2,
h3,
h4,
h5,
h6,
th {
  font-family: 'VT323', monospace;
}
button {
  border: 1px solid var(--color-text);
}
a {
  color: var(--color-link);
}
* {
  color: var(--color-text);
  background-color: black;
  font-family: 'Overpass Mono', monospace;
}
.flickering * {
  animation-duration: 0.05s;
  animation-name: textflicker;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;
}
body {
  margin: 0;
}
nav {
  width: 100%;
}
nav button {
  margin-left: auto;
  display: block;
}
@media screen and (max-width: 600px) {
  nav button {
    padding: 20px;
  }
}
#app .content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
}
@keyframes textflicker {
  from {
    text-shadow: 0.5px 0 0 var(--color-text-flicker), -1px 0 0 var(--color-text);
  }
  to {
    text-shadow: 1px 0.25px 1px var(--color-text-flicker), -0.5px -0.25px 1px var(--color-text);
  }
}
</style>
