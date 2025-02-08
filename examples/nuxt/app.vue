<script setup lang="ts">

const { data: hello, suspense } = useTRPC().hello.useQuery({ text: 'client' })

onServerPrefetch(async () => {
  await suspense()
})

</script>

<template>
  <div>
    <p>{{ hello?.greeting }}</p>
  </div>
</template>
