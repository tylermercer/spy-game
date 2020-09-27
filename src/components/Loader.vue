<template>
  <div class="container">
    <p>{{loadingPhrase}}...</p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

const loadingPhrases = [
  "Verifying agent identity",
  "Scanning for hostiles",
  "Establishing Enigma cipher",
  "Authenticating carrier pigeons"
]

@Component<Loader>({
  created() {
    this.loadingPhrase = this.getNextPhrase();
    setInterval(() => this.loadingPhrase = this.getNextPhrase(), 3000)
  }
})
export default class Loader extends Vue {

  private index = -1;
  private loadingPhrase: string = ''


  private getNextPhrase() : string {
    this.index += 1;
    if (this.index >= loadingPhrases.length) {
      this.index = 0;
    }
    return loadingPhrases[this.index];
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
