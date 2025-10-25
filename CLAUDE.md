# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered quiz application built with Vue 3, Vite, and integrates with:
- **Anthropic Claude API** (@anthropic-ai/sdk) - for AI-powered quiz generation and evaluation
- **Supabase** (@supabase/supabase-js) - for backend database and authentication
- **Pinia** - for state management
- **Vue Router** - for client-side routing

## Development Commands

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Starts Vite dev server with hot-reload at http://localhost:5173 (default)

### Production Build
```bash
npm run build
```
Compiles and minifies for production into `dist/` directory

### Preview Production Build
```bash
npm run preview
```
Locally preview the production build

## Architecture

### Application Structure
- **Entry Point**: `src/main.js` - initializes Vue app with Pinia (state management) and Vue Router
- **Root Component**: `src/App.vue` - contains the main layout with navigation using RouterLink/RouterView
- **Router**: `src/router/index.js` - uses createWebHistory for routing, supports lazy-loaded routes
- **State Management**: `src/stores/` - Pinia stores using composition API syntax (setup stores)
- **Views**: `src/views/` - route-level components (HomeView, AboutView)
- **Components**: `src/components/` - reusable Vue components

### Path Aliases
The project uses `@` as an alias for the `src/` directory (configured in vite.config.js)
```javascript
import Something from '@/components/Something.vue'
```

### State Management Pattern
Pinia stores use the Composition API (setup) syntax:
```javascript
export const useStore = defineStore('storeName', () => {
  const state = ref()
  const getter = computed(() => ...)
  function action() { ... }
  return { state, getter, action }
})
```

### Router Configuration
- Uses `createWebHistory` (not hash mode)
- Supports lazy-loaded routes with `() => import('./Component.vue')`
- Base URL from `import.meta.env.BASE_URL`

## Environment Variables

The project uses Vite environment variables (prefix with `VITE_`):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_ANTHROPIC_API_KEY` - Anthropic API key for Claude

Access in code using `import.meta.env.VITE_*`

## Node Version Requirements

Required Node.js versions: `^20.19.0 || >=22.12.0`

## Key Dependencies

- Vue 3 (^3.5.22) - Composition API with `<script setup>`
- Vite 7 (^7.1.11) - build tool and dev server
- @anthropic-ai/sdk (^0.67.0) - Claude API integration
- @supabase/supabase-js (^2.76.1) - Supabase client
- Pinia (^3.0.3) - state management
- Vue Router (^4.6.3) - routing
- vite-plugin-vue-devtools (^8.0.3) - Vue DevTools integration in development

## Vue 3 Component Patterns

This project uses Vue 3 Composition API with `<script setup>` syntax. When creating or modifying components:
- Use `<script setup>` for component logic
- Import reactive primitives from 'vue': `ref`, `computed`, `watch`, etc.
- No need to explicitly return values - all top-level bindings are automatically exposed to template
