<script setup lang="ts">
const { data: hello } = useTRPC().hello.useQuery({ text: 'client' })
</script>

<template>
  <div>
    <p>{{ hello?.greeting }}</p>
  </div>
</template>
