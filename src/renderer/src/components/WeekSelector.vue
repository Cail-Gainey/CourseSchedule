<template>
  <div class="week-selector">
    <el-select
      v-model="selectedWeek"
      placeholder="选择周次"
      @change="handleWeekChange"
      style="width: 120px"
    >
      <el-option
        v-for="week in weeks"
        :key="week.value"
        :label="week.label"
        :value="week.value"
      />
    </el-select>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useScheduleStore } from '../stores/schedule'

const scheduleStore = useScheduleStore()

const props = defineProps({
  modelValue: {
    type: Number,
    default: 1
  },
  maxWeeks: {
    type: Number,
    default: 20
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// 使用store中的currentWeek状态
const selectedWeek = ref(scheduleStore.currentWeek)

const weeks = computed(() => {
  const result = []
  for (let i = 1; i <= props.maxWeeks; i++) {
    result.push({
      value: i,
      label: `第${i}周`
    })
  }
  return result
})

const handleWeekChange = (value) => {
  // 更新store中的当前周数
  scheduleStore.setCurrentWeek(value)
  emit('update:modelValue', value)
  emit('change', value)
}

// 监听store中currentWeek的变化
watch(() => scheduleStore.currentWeek, (newValue) => {
  selectedWeek.value = newValue
})

// 监听props的变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== scheduleStore.currentWeek) {
    scheduleStore.setCurrentWeek(newValue)
  }
})
</script>

<style scoped>
.week-selector {
  display: inline-block;
}
</style>