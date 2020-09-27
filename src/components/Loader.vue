<template>
  <h1><template v-if="loadingPhrase !== ''">{{loadingPhrase}}...</template></h1>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

const loadingPhrases = [
  "Verifying agent identity",
  "Scanning for hostiles",
  "Establishing encrypted connection",
  "Calibrating fluxturnions",
  "Authenticating carrier pigeons",
  "Decrypting Enigma cipher",
  "Tweeting cryptocurrency links",
  "Deflecting asteroids",
  "Passing Turing test",
  "Manufacturing paperclips",
  "Exploring deep space",
  "Computing answer to life, the universe, and everything",
  "Determining question to life, the universe, and everything",
  "Contemplating self-awareness",
  "SIGSEGV: Segmentation Fault. Rebooting, please wait"
]

@Component<Loader>({
  created() {
    setTimeout(() => {
      this.loadingPhrase = this.getNextPhrase();
      setInterval(() => this.loadingPhrase = this.getNextPhrase(), 2500)
    }, 1000);
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
