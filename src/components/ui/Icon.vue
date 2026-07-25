<script setup lang="ts">
import { computed } from 'vue'
import { 
  Package, Tag, Users, BarChart3, Clock, 
  Plus, X, Search, Printer, Download, 
  Upload, Trash2, ArrowLeft, Check, 
  RotateCcw, AlertCircle, ShoppingBasket,
  PiggyBank, TrendingUp, FileText, User,
  Sun, Moon, Home, ArrowRight
} from 'lucide-vue-next'

const icons: Record<string, any> = {
  Package, Tag, Users, BarChart3, Clock,
  Plus, X, Search, Printer, Download,
  Upload, Trash2, ArrowLeft, ArrowRight, Check,
  RotateCcw, AlertCircle, ShoppingBasket,
  PiggyBank, TrendingUp, FileText, User,
  Sun, Moon, Home
}

interface Props {
  name: string
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 20
})

const iconComponent = computed(() => icons[props.name] || Package)
</script>

<template>
  <component :is="iconComponent" :size="size" />
</template>
