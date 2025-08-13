# VIU.js Framework Documentation

**Version:** 1.0.0  
**Author:** John Mwirigi Mahugu  
**License:** MIT  
**Date:** August 2025

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Architecture Overview](#architecture-overview)
4. [Configuration Reference](#configuration-reference)
5. [Core Features](#core-features)
6. [API Reference](#api-reference)
7. [Deployment Guide](#deployment-guide)
8. [Best Practices](#best-practices)
9. [Migration Guide](#migration-guide)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

VIU.js is a lightweight, zero-configuration, and fully Vue.js compatible frontend framework. Built from scratch to enhance portability and eliminate dependencies, VIU.js provides a modern reactive programming experience with familiar Vue.js APIs.

### Key Features

- **Zero Dependencies**: No external libraries required
- **Vue.js Compatible**: Familiar API for Vue developers
- **Lightweight**: Minimal footprint for optimal performance
- **Reactive System**: Advanced reactivity with computed properties and watchers
- **Component-Based**: Modern component architecture
- **TypeScript Ready**: Full TypeScript support

### Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

---

## Getting Started

### Installation

#### CDN (Recommended for Quick Start)

```html
<!DOCTYPE html>
<html>
<head>
    <title>VIU.js App</title>
</head>
<body>
    <div id="app">{{ message }}</div>
    
    <script src="path/to/viu.js"></script>
    <script>
        const { createApp, ref } = VIU;
        
        createApp({
            setup() {
                const message = ref('Hello VIU.js!');
                return { message };
            }
        }).mount('#app');
    </script>
</body>
</html>
```

#### NPM/Yarn Installation

```bash
# NPM
npm install viu-js

# Yarn
yarn add viu-js
```

```javascript
import { createApp, ref } from 'viu-js';

const app = createApp({
    setup() {
        const message = ref('Hello VIU.js!');
        return { message };
    }
});

app.mount('#app');
```

### Your First VIU.js Application

```html
<!DOCTYPE html>
<html>
<head>
    <title>Counter App</title>
    <style>
        .container { max-width: 400px; margin: 50px auto; padding: 20px; }
        button { padding: 10px 20px; margin: 5px; }
        .counter { font-size: 2em; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div id="app">
        <div class="container">
            <h1>VIU.js Counter</h1>
            <div class="counter">{{ count }}</div>
            <button @click="increment">+</button>
            <button @click="decrement">-</button>
            <button @click="reset">Reset</button>
        </div>
    </div>

    <script src="viu.js"></script>
    <script>
        const { createApp, ref, computed } = VIU;
        
        createApp({
            setup() {
                const count = ref(0);
                
                const increment = () => count.value++;
                const decrement = () => count.value--;
                const reset = () => count.value = 0;
                
                return {
                    count,
                    increment,
                    decrement,
                    reset
                };
            }
        }).mount('#app');
    </script>
</body>
</html>
```

---

## Architecture Overview

### Core Architecture

VIU.js is built on four main pillars:

1. **Reactivity System**: Fine-grained reactive state management
2. **Component System**: Reusable component architecture
3. **Rendering Engine**: Efficient virtual DOM implementation
4. **Scheduler**: Optimized update batching and timing

```
┌─────────────────────────────────────────────┐
│                VIU.js Framework             │
├─────────────────────────────────────────────┤
│  Application Layer                          │
│  ├── Components                             │
│  ├── Directives                             │
│  └── Plugins                                │
├─────────────────────────────────────────────┤
│  Reactivity Layer                           │
│  ├── Reactive Objects                       │
│  ├── Refs                                   │
│  ├── Computed Properties                    │
│  └── Watchers                               │
├─────────────────────────────────────────────┤
│  Virtual DOM Layer                          │
│  ├── VNode Creation                         │
│  ├── Diff Algorithm                         │
│  └── Patch Operations                       │
├─────────────────────────────────────────────┤
│  Runtime Layer                              │
│  ├── Scheduler                              │
│  ├── Effect System                          │
│  └── Error Handling                         │
└─────────────────────────────────────────────┘
```

### Reactivity System

VIU.js uses a proxy-based reactivity system similar to Vue 3:

```javascript
// Reactive object creation
const state = VIU.reactive({
    count: 0,
    user: {
        name: 'John',
        email: 'john@example.com'
    }
});

// Automatic dependency tracking
VIU.effect(() => {
    console.log(`Count is: ${state.count}`);
});

state.count++; // Triggers effect automatically
```

### Component Lifecycle

```
┌─────────────────┐
│   beforeMount   │
└─────────┬───────┘
          │
┌─────────▼───────┐
│     mounted     │
└─────────┬───────┘
          │
┌─────────▼───────┐    ┌─────────────────┐
│  beforeUpdate   │◄───┤  State Change   │
└─────────┬───────┘    └─────────────────┘
          │
┌─────────▼───────┐
│     updated     │
└─────────┬───────┘
          │
┌─────────▼───────┐
│ beforeUnmount   │
└─────────┬───────┘
          │
┌─────────▼───────┐
│   unmounted     │
└─────────────────┘
```

---

## Configuration Reference

### Application Configuration

```javascript
const app = VIU.createApp({
    // Component definition
});

// Global configuration
app.config = {
    // Error handler
    errorHandler: (err, instance, info) => {
        console.error('VIU Error:', err, info);
    },
    
    // Warning handler
    warnHandler: (msg, instance, trace) => {
        console.warn('VIU Warning:', msg);
    },
    
    // Global properties
    globalProperties: {
        $http: httpClient,
        $utils: utilities
    },
    
    // Performance tracking
    performance: true,
    
    // Native tag check
    isNativeTag: (tag) => {
        return ['div', 'span', 'p', 'h1', 'h2', 'h3'].includes(tag);
    }
};
```

### Compiler Options

```javascript
app.config.compilerOptions = {
    // Whitespace handling
    preserveWhitespace: false,
    
    // Comment preservation
    comments: false,
    
    // Delimiters for interpolation
    delimiters: ['{{', '}}'],
    
    // Transform asset URLs
    transformAssetUrls: {
        img: 'src',
        video: ['src', 'poster'],
        audio: 'src'
    }
};
```

---

## Core Features

### Reactivity System

#### Reactive Objects

```javascript
const { reactive, readonly, shallowReactive } = VIU;

// Deep reactive object
const state = reactive({
    count: 0,
    nested: {
        value: 'hello'
    }
});

// Readonly proxy
const readonlyState = readonly(state);

// Shallow reactive (only first level)
const shallowState = shallowReactive({
    count: 0,
    nested: { value: 'hello' } // Not reactive
});
```

#### Refs

```javascript
const { ref, shallowRef, isRef, unref } = VIU;

// Basic ref
const count = ref(0);
console.log(count.value); // 0
count.value = 1;

// Shallow ref
const obj = shallowRef({ nested: { value: 1 } });

// Utilities
console.log(isRef(count)); // true
console.log(unref(count)); // 1 (unwrapped value)
```

#### Computed Properties

```javascript
const { computed, ref } = VIU;

const count = ref(1);
const plusOne = computed(() => count.value + 1);

console.log(plusOne.value); // 2
count.value++; // triggers computed update
console.log(plusOne.value); // 3

// Writable computed
const fullName = computed({
    get() {
        return firstName.value + ' ' + lastName.value;
    },
    set(newValue) {
        [firstName.value, lastName.value] = newValue.split(' ');
    }
});
```

#### Watchers

```javascript
const { watch, watchEffect, ref } = VIU;

const count = ref(0);

// Basic watcher
const stopWatcher = watch(count, (newValue, oldValue) => {
    console.log(`Count changed from ${oldValue} to ${newValue}`);
});

// Watch multiple sources
watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
    console.log('Multiple values changed');
});

// WatchEffect - automatic dependency tracking
watchEffect(() => {
    console.log(`Count is ${count.value}`);
});

// Cleanup
stopWatcher();
```

### Component System

#### Basic Component

```javascript
const { defineComponent, ref } = VIU;

const MyComponent = defineComponent({
    props: {
        title: {
            type: String,
            required: true
        },
        count: {
            type: Number,
            default: 0
        }
    },
    
    setup(props, { emit, slots, attrs }) {
        const localCount = ref(props.count);
        
        const increment = () => {
            localCount.value++;
            emit('update', localCount.value);
        };
        
        return {
            localCount,
            increment
        };
    },
    
    template: `
        <div>
            <h2>{{ title }}</h2>
            <p>Count: {{ localCount }}</p>
            <button @click="increment">Increment</button>
        </div>
    `
});
```

#### Component Registration

```javascript
const app = VIU.createApp({});

// Global component
app.component('MyComponent', MyComponent);

// Local component
const App = {
    components: {
        MyComponent
    },
    template: `<MyComponent title="Hello" :count="5" />`
};
```

### Lifecycle Hooks

```javascript
const { onMounted, onUnmounted, onUpdated, onBeforeMount } = VIU;

export default defineComponent({
    setup() {
        onBeforeMount(() => {
            console.log('Component about to mount');
        });
        
        onMounted(() => {
            console.log('Component mounted');
        });
        
        onUpdated(() => {
            console.log('Component updated');
        });
        
        onUnmounted(() => {
            console.log('Component unmounted');
        });
    }
});
```

### Provide/Inject

```javascript
const { provide, inject, ref } = VIU;

// Parent component
const Parent = defineComponent({
    setup() {
        const theme = ref('dark');
        provide('theme', theme);
        
        return { theme };
    }
});

// Child component
const Child = defineComponent({
    setup() {
        const theme = inject('theme', 'light'); // Default value
        return { theme };
    }
});
```

### Directives

#### Built-in Directives

```html
<!-- v-show -->
<div v-show="isVisible">Conditionally shown</div>

<!-- v-model (basic implementation) -->
<input v-model="inputValue" />
```

#### Custom Directives

```javascript
const app = VIU.createApp({});

app.directive('focus', {
    mounted(el) {
        el.focus();
    }
});

app.directive('highlight', {
    mounted(el, binding) {
        el.style.backgroundColor = binding.value || 'yellow';
    },
    updated(el, binding) {
        el.style.backgroundColor = binding.value || 'yellow';
    }
});
```

---

## API Reference

### Application API

#### createApp(rootComponent, rootProps?)

Creates an application instance.

```javascript
const app = VIU.createApp({
    setup() {
        return { message: 'Hello World' };
    }
});
```

**Parameters:**
- `rootComponent`: The root component definition
- `rootProps?`: Optional props for the root component

**Returns:** Application instance

#### app.mount(selector)

Mounts the application to a DOM element.

```javascript
app.mount('#app');
app.mount(document.getElementById('app'));
```

#### app.unmount()

Unmounts the application.

```javascript
app.unmount();
```

#### app.use(plugin, ...options)

Installs a plugin.

```javascript
app.use(MyPlugin, { option1: 'value1' });
```

#### app.component(name, definition?)

Registers or retrieves a global component.

```javascript
// Register
app.component('MyComponent', componentDefinition);

// Retrieve
const component = app.component('MyComponent');
```

#### app.directive(name, definition?)

Registers or retrieves a global directive.

```javascript
// Register
app.directive('focus', directiveDefinition);

// Retrieve  
const directive = app.directive('focus');
```

### Reactivity API

#### reactive(target)

Creates a reactive proxy of an object.

```javascript
const state = VIU.reactive({
    count: 0,
    nested: { value: 'hello' }
});
```

#### readonly(target)

Creates a readonly proxy of an object.

```javascript
const readonlyState = VIU.readonly(state);
```

#### ref(value)

Creates a reactive reference.

```javascript
const count = VIU.ref(0);
const user = VIU.ref({ name: 'John' });
```

#### computed(getterOrOptions)

Creates a computed property.

```javascript
// Getter only
const doubled = VIU.computed(() => count.value * 2);

// Getter and setter
const fullName = VIU.computed({
    get: () => firstName.value + ' ' + lastName.value,
    set: (value) => {
        [firstName.value, lastName.value] = value.split(' ');
    }
});
```

#### watch(source, callback, options?)

Creates a watcher.

```javascript
VIU.watch(
    source,
    (newValue, oldValue) => {
        // Handle change
    },
    {
        immediate: true,
        deep: true,
        flush: 'post'
    }
);
```

#### watchEffect(effect, options?)

Creates an effect that automatically tracks dependencies.

```javascript
VIU.watchEffect(() => {
    console.log(`Count: ${count.value}`);
});
```

### Utility Functions

#### isRef(value)

Checks if a value is a ref.

```javascript
console.log(VIU.isRef(count)); // true
console.log(VIU.isRef(5)); // false
```

#### isReactive(value)

Checks if a value is reactive.

```javascript
console.log(VIU.isReactive(state)); // true
```

#### isReadonly(value)

Checks if a value is readonly.

```javascript
console.log(VIU.isReadonly(readonlyState)); // true
```

#### isProxy(value)

Checks if a value is a proxy (reactive or readonly).

```javascript
console.log(VIU.isProxy(state)); // true
```

#### toRaw(proxy)

Returns the raw object from a proxy.

```javascript
const raw = VIU.toRaw(state);
```

#### markRaw(object)

Marks an object to never be converted to a proxy.

```javascript
const obj = VIU.markRaw({ api: externalAPI });
```

#### unref(value)

Returns the value if it's not a ref, or the ref's value if it is.

```javascript
const value = VIU.unref(possibleRef);
```

#### toRef(object, key)

Creates a ref for a property on a reactive object.

```javascript
const countRef = VIU.toRef(state, 'count');
```

#### toRefs(object)

Converts all properties of a reactive object to refs.

```javascript
const { count, name } = VIU.toRefs(state);
```

### Lifecycle Hooks

```javascript
VIU.onBeforeMount(callback)
VIU.onMounted(callback)
VIU.onBeforeUpdate(callback)
VIU.onUpdated(callback)
VIU.onBeforeUnmount(callback)
VIU.onUnmounted(callback)
```

### Advanced API

#### nextTick(callback?)

Executes a callback after the next DOM update cycle.

```javascript
await VIU.nextTick();
// DOM has been updated

VIU.nextTick(() => {
    // DOM has been updated
});
```

#### effect(fn, options?)

Creates a reactive effect.

```javascript
const runner = VIU.effect(() => {
    console.log(count.value);
});

// Stop the effect
VIU.stop(runner);
```

---

## Deployment Guide

### Production Build

#### Minification

For production, ensure VIU.js is minified:

```bash
# Using terser
npx terser viu.js -o viu.min.js -c -m

# Using uglify-js
npx uglify-js viu.js -o viu.min.js -c -m
```

#### CDN Deployment

Host VIU.js on a CDN for optimal performance:

```html
<script src="https://cdn.yourdomain.com/viu.min.js"></script>
```

### Webpack Configuration

```javascript
// webpack.config.js
module.exports = {
    resolve: {
        alias: {
            'viu': 'viu-js'
        }
    },
    externals: {
        'viu-js': 'VIU'
    }
};
```

### Vite Configuration

```javascript
// vite.config.js
export default {
    define: {
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false
    },
    build: {
        rollupOptions: {
            external: ['viu-js'],
            output: {
                globals: {
                    'viu-js': 'VIU'
                }
            }
        }
    }
};
```

### Performance Optimization

#### Bundle Splitting

```javascript
// Dynamic imports for code splitting
const AsyncComponent = VIU.defineAsyncComponent(() =>
    import('./components/AsyncComponent.js')
);
```

#### Tree Shaking

```javascript
// Import only what you need
import { ref, computed, watch } from 'viu-js';
```

#### Lazy Loading

```javascript
const routes = [
    {
        path: '/admin',
        component: () => import('./views/Admin.vue')
    }
];
```

---

## Best Practices

### Component Design

#### Single Responsibility

```javascript
// ✅ Good - Single responsibility
const UserProfile = defineComponent({
    props: ['user'],
    setup(props) {
        return { user: props.user };
    }
});

// ❌ Bad - Multiple responsibilities
const UserDashboard = defineComponent({
    // Handles user profile, posts, settings, etc.
});
```

#### Prop Validation

```javascript
const MyComponent = defineComponent({
    props: {
        title: {
            type: String,
            required: true,
            validator: (value) => value.length > 0
        },
        count: {
            type: Number,
            default: 0,
            validator: (value) => value >= 0
        }
    }
});
```

### State Management

#### Reactive vs Ref

```javascript
// ✅ Use reactive for objects
const user = reactive({
    name: 'John',
    email: 'john@example.com',
    preferences: {
        theme: 'dark'
    }
});

// ✅ Use ref for primitives
const count = ref(0);
const isLoading = ref(false);
const userName = ref('');
```

#### Computed Properties

```javascript
// ✅ Good - Pure computation
const fullName = computed(() => 
    `${firstName.value} ${lastName.value}`
);

// ❌ Bad - Side effects in computed
const badComputed = computed(() => {
    api.trackEvent('computed-accessed'); // Side effect
    return someValue.value;
});
```

### Performance

#### Avoid Reactive Overhead

```javascript
// ✅ Good - Mark non-reactive data
const config = markRaw({
    apiUrl: 'https://api.example.com',
    timeout: 5000
});

// ✅ Good - Use shallowRef for large objects
const largeDataset = shallowRef(bigData);
```

#### Optimize Watchers

```javascript
// ✅ Good - Specific property watching
watch(() => user.name, (newName) => {
    // Only triggers when name changes
});

// ❌ Bad - Watching entire object
watch(user, () => {
    // Triggers on any property change
}, { deep: true });
```

### Error Handling

#### Component Error Boundaries

```javascript
const ErrorBoundary = defineComponent({
    setup() {
        const error = ref(null);
        
        const handleError = (err) => {
            error.value = err;
            console.error('Component error:', err);
        };
        
        return { error, handleError };
    }
});
```

#### Async Error Handling

```javascript
const { watchEffect } = VIU;

watchEffect(async () => {
    try {
        const data = await fetchData();
        // Handle data
    } catch (error) {
        console.error('Fetch error:', error);
        // Handle error state
    }
});
```

### Testing

#### Unit Testing Components

```javascript
// test/component.test.js
import { mount } from '@vue/test-utils';
import MyComponent from '../MyComponent.js';

describe('MyComponent', () => {
    test('renders correctly', () => {
        const wrapper = mount(MyComponent, {
            props: { title: 'Test' }
        });
        
        expect(wrapper.text()).toContain('Test');
    });
    
    test('emits event on click', async () => {
        const wrapper = mount(MyComponent);
        await wrapper.find('button').trigger('click');
        
        expect(wrapper.emitted()).toHaveProperty('click');
    });
});
```

#### Testing Reactivity

```javascript
import { ref, computed } from 'viu-js';

describe('Reactivity', () => {
    test('computed updates when dependency changes', () => {
        const count = ref(1);
        const doubled = computed(() => count.value * 2);
        
        expect(doubled.value).toBe(2);
        
        count.value = 5;
        expect(doubled.value).toBe(10);
    });
});
```

---

## Migration Guide

### From Vue 2 to VIU.js

#### Options API to Composition API

**Vue 2:**
```javascript
export default {
    data() {
        return {
            count: 0
        };
    },
    computed: {
        doubled() {
            return this.count * 2;
        }
    },
    methods: {
        increment() {
            this.count++;
        }
    }
};
```

**VIU.js:**
```javascript
export default defineComponent({
    setup() {
        const count = ref(0);
        const doubled = computed(() => count.value * 2);
        const increment = () => count.value++;
        
        return { count, doubled, increment };
    }
});
```

#### Lifecycle Migration

**Vue 2:**
```javascript
export default {
    created() {
        // Component created
    },
    mounted() {
        // Component mounted
    },
    destroyed() {
        // Component destroyed
    }
};
```

**VIU.js:**
```javascript
export default defineComponent({
    setup() {
        onMounted(() => {
            // Component mounted
        });
        
        onUnmounted(() => {
            // Component unmounted
        });
    }
});
```

### From Vue 3 to VIU.js

Most Vue 3 Composition API code works directly with VIU.js:

```javascript
// This works in both Vue 3 and VIU.js
const { ref, computed, watch, onMounted } = VIU; // or Vue

export default defineComponent({
    setup() {
        const count = ref(0);
        const doubled = computed(() => count.value * 2);
        
        watch(count, (newValue) => {
            console.log(`Count: ${newValue}`);
        });
        
        onMounted(() => {
            console.log('Mounted');
        });
        
        return { count, doubled };
    }
});
```

---

## Troubleshooting

### Common Issues

#### Reactivity Not Working

**Problem:** Changes to reactive data don't trigger updates.

**Solutions:**
```javascript
// ❌ Problem - Destructuring loses reactivity
const { count } = reactive({ count: 0 });

// ✅ Solution - Use toRefs
const { count } = toRefs(reactive({ count: 0 }));

// ❌ Problem - Assigning new object
let state = reactive({ count: 0 });
state = { count: 1 }; // Loses reactivity

// ✅ Solution - Mutate properties
let state = reactive({ count: 0 });
state.count = 1;
```

#### Memory Leaks

**Problem:** Watchers or effects not being cleaned up.

**Solutions:**
```javascript
// ✅ Store unwatch function and call it
const unwatch = watch(source, callback);
onUnmounted(() => unwatch());

// ✅ Use watchEffect with scope
const scope = effectScope();
scope.run(() => {
    watchEffect(() => {
        // Effect logic
    });
});
// Later: scope.stop();
```

#### Performance Issues

**Problem:** Too many reactive objects or deep watching.

**Solutions:**
```javascript
// ✅ Use shallowReactive for large objects
const largeObject = shallowReactive(bigData);

// ✅ Use markRaw for static data
const config = markRaw(staticConfig);

// ✅ Optimize watchers
watch(() => user.name, callback); // Instead of watching entire user
```

### Debugging

#### Reactive Debugging

```javascript
// Enable reactivity debugging
VIU.effect(() => {
    console.log('Dependencies:', activeEffect?.deps);
});

// Check if value is reactive
console.log('Is reactive:', VIU.isReactive(value));
console.log('Is ref:', VIU.isRef(value));
console.log('Raw value:', VIU.toRaw(value));
```

#### Component Debugging

```javascript
// Component instance debugging
const app = VIU.createApp({
    setup() {
        // Access current instance
        const instance = getCurrentInstance();
        console.log('Component instance:', instance);
        
        return {};
    }
});
```

### Error Messages

#### "Cannot access before initialization"

This typically occurs when trying to use reactive values before they're defined.

```javascript
// ❌ Problem
const doubled = computed(() => count.value * 2);
const count = ref(0); // Defined after use

// ✅ Solution
const count = ref(0);
const doubled = computed(() => count.value * 2);
```

#### "Invalid watch source"

This occurs when watching non-reactive values.

```javascript
// ❌ Problem
let count = 0;
watch(count, callback); // count is not reactive

// ✅ Solution
const count = ref(0);
watch(count, callback);
```

---

## Changelog

### Version 1.0.0 (August 2025)

- Initial release
- Complete reactivity system
- Component architecture
- Vue.js compatibility layer
- Comprehensive API coverage
- Performance optimizations
- Zero-dependency implementation

---

## Contributing

### Development Setup

```bash
git clone https://github.com/johnmahugu/viu-js.git
cd viu-js
npm install
npm run dev
```

### Testing

```bash
npm run test
npm run test:watch
npm run test:coverage
```

### Building

```bash
npm run build
npm run build:minified
```

### Code Style

- Use ES2020+ features
- Follow JSDoc commenting
- Maintain TypeScript compatibility
- Keep dependencies minimal

---

## License

MIT License - see LICENSE file for details.

---

## Support

- **Documentation**: [https://viu-js.dev](https://viu-js.dev)
- **Issues**: [GitHub Issues](https://github.com/johnmahugu/viu-js/issues)
- **Discussions**: [GitHub Discussions](https://github.com/johnmahugu/viu-js/discussions)
- **Email**: johnmahugu@gmail.com

---

*VIU.js - Lightweight, powerful, and Vue.js compatible.*