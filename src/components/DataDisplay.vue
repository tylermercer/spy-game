<template>
  <div class="container">
    <table>
      <thead>
        <tr>
          <th v-for="col in stats.headers" :key="col">{{col}}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in stats.data" :key="JSON.stringify(row)">
          <td v-for="(col, i) in stats.headers" :key="row + col">{{row[i]}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { getStats, Stats } from './../getStats'

@Component
export default class HelloWorld extends Vue {
  @Prop() private stats!: Stats;
}
</script>

<style scoped>
th, td {
  padding: 10px;
  border: 1px solid var(--color-text);
}
table {
  border-collapse: collapse;
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
