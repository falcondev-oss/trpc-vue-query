<script lang="ts" setup>
import { useTRPC } from './useTRPC';


const { data: greeting } = useTRPC().hello.useQuery({ input: 'world' });
</script>

<template>
  <div>
    <h1>{{ greeting }}</h1>
  </div>
</template>