<template>
  <div class="flex flex-row w-full justify-content-evenly">
    <div class="surface-card shadow-1 border-round px-3 py-1">
      <h2>Built shelters</h2>

      <div>

      </div>

      <command-form service="testTasks" action="buildShelter" reset-on-done v-slot="{ data, definition }">
        <pre>{{ definition.properties }}</pre>
        <pre>{{data}}</pre>

        <div class="text text-xl">
          Size:
        </div>
        <div class="pl-2">
          <div class="flex flex-row align-items-center">
            <label for="role" class="mr-2 w-5rem text-right">Width:</label>
            <InputNumber v-model="data.size.width" mode="decimal"
                         showButtons :min="3" :max="9" />
          </div>
          <div class="flex flex-row align-items-center">
            <label for="role" class="mr-2 w-5rem text-right">Height:</label>
            <InputNumber v-model="data.size.height" mode="decimal" showButtons :min="3" :max="9" />
          </div>
          <div class="flex flex-row align-items-center">
            <label for="role" class="mr-2 w-5rem text-right">Length:</label>
            <InputNumber v-model="data.size.length" mode="decimal" showButtons :min="3" :max="9" />
          </div>

          <div class="flex flex-row align-items-center">
            <label for="role" class="mr-2 w-5rem">Wood type:</label>
            <Dropdown id="role" class="w-14rem" v-model="data.woodType" placeholder="Select a Wood type"
                      :options="definition.properties.woodType.options" />
          </div>

          <div class="text-right">
            <Button type="submit" icon="pi pi-play" label="Build" class="mt-2" />
          </div>
        </div>

      </command-form>
    </div>
    <div class="surface-card shadow-1 border-round px-3 py-1">
      <h2>Tasks</h2>

    </div>
  </div>
</template>

<script setup>



</script>

<style scoped>

</style>
