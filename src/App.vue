<template>
  <div id="app-root">
    <router-view />
  </div>
</template>

<script setup lang="ts">
console.debug('[upctl-web] deploy_ver=20260510.011')
</script>

<style>
html, body, #app-root { height: 100%; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
a { color: #1a73e8; text-decoration: none; }
</style>
