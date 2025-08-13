/**
 * Viu.js - A lightweight, zero-configuration, and fully Vue.js compatible
 * frontend framework. This is a complete rewrite from scratch to
 * enhance portability and eliminate dependencies.
 * * @version 1.0.0
 * @author John Mwirigi Mahugu | johnmahugu at gmail dot com
 * @copyright 2025 John Mwirigi Mahugu
 * @timestamp 2025-08-07 04:13:14 EAT
 */

var VIU = (function() {
    'use strict';

    // Utility functions
    const EMPTY_OBJ = {};
    const EMPTY_ARR = [];
    const NOOP = () => {};
    const NO = () => false;
    const extend = Object.assign;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const hasOwn = (val, key) => hasOwnProperty.call(val, key);
    const isArray = Array.isArray;
    const isMap = (val) => toTypeString(val) === '[object Map]';
    const isSet = (val) => toTypeString(val) === '[object Set]';
    const isDate = (val) => val instanceof Date;
    const isString = (val) => typeof val === 'string';
    const isSymbol = (val) => typeof val === 'symbol';
    const isObject = (val) => val !== null && typeof val === 'object';
    const objectToString = Object.prototype.toString;
    const toTypeString = (value) => objectToString.call(value);
    const toRawType = (value) => toTypeString(value).slice(8, -1);
    const isPlainObject = (val) => toTypeString(val) === '[object Object]';
    const isFunction = (val) => typeof val === 'function';
    const isPromise = (val) => {
        return isObject(val) && isFunction(val.then) && isFunction(val.catch);
    };

    // String manipulation utilities
    const cacheStringFunction = (fn) => {
        const cache = Object.create(null);
        return (str) => {
            const hit = cache[str];
            return hit || (cache[str] = fn(str));
        };
    };

    const camelizeRE = /-(\w)/g;
    const camelize = cacheStringFunction((str) => {
        return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '');
    });

    const hyphenateRE = /\B([A-Z])/g;
    const hyphenate = cacheStringFunction((str) => {
        return str.replace(hyphenateRE, '-$1').toLowerCase();
    });

    const capitalize = cacheStringFunction((str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Reactivity System
    let activeEffect;
    let shouldTrack = true;
    const effectStack = [];

    class ReactiveEffect {
        constructor(fn, scheduler = null, scope) {
            this.fn = fn;
            this.scheduler = scheduler;
            this.active = true;
            this.deps = [];
            this.parent = undefined;
            recordEffectScope(this, scope);
        }

        run() {
            if (!this.active) {
                return this.fn();
            }

            let parent = activeEffect;
            let lastShouldTrack = shouldTrack;
            while (parent) {
                if (parent === this) {
                    return;
                }
                parent = parent.parent;
            }

            try {
                this.parent = activeEffect;
                activeEffect = this;
                shouldTrack = true;
                return this.fn();
            } finally {
                activeEffect = this.parent;
                shouldTrack = lastShouldTrack;
                this.parent = undefined;
            }
        }

        stop() {
            if (this.active) {
                cleanupEffect(this);
                if (this.onStop) {
                    this.onStop();
                }
                this.active = false;
            }
        }
    }

    function cleanupEffect(effect) {
        const { deps } = effect;
        if (deps.length) {
            for (let i = 0; i < deps.length; i++) {
                deps[i].delete(effect);
            }
            deps.length = 0;
        }
    }

    function effect(fn, options = {}) {
        if (fn.effect) {
            fn = fn.effect.fn;
        }

        const _effect = new ReactiveEffect(fn);
        if (options) {
            extend(_effect, options);
        }

        if (!options.lazy) {
            _effect.run();
        }

        const runner = _effect.run.bind(_effect);
        runner.effect = _effect;
        return runner;
    }

    function stop(runner) {
        runner.effect.stop();
    }

    // Track and trigger
    const targetMap = new WeakMap();

    function track(target, type, key) {
        if (shouldTrack && activeEffect) {
            let depsMap = targetMap.get(target);
            if (!depsMap) {
                targetMap.set(target, (depsMap = new Map()));
            }
            let dep = depsMap.get(key);
            if (!dep) {
                depsMap.set(key, (dep = createDep()));
            }
            trackEffects(dep);
        }
    }

    function trackEffects(dep) {
        let shouldTrack = false;
        shouldTrack = !dep.has(activeEffect);

        if (shouldTrack) {
            dep.add(activeEffect);
            activeEffect.deps.push(dep);
        }
    }

    function trigger(target, type, key, newValue, oldValue, oldTarget) {
        const depsMap = targetMap.get(target);
        if (!depsMap) {
            return;
        }

        let deps = [];
        if (type === 'clear') {
            deps = [...depsMap.values()];
        } else if (key === 'length' && isArray(target)) {
            depsMap.forEach((dep, key) => {
                if (key === 'length' || key >= newValue) {
                    deps.push(dep);
                }
            });
        } else {
            if (key !== void 0) {
                deps.push(depsMap.get(key));
            }

            switch (type) {
                case 'add':
                    if (!isArray(target)) {
                        deps.push(depsMap.get(''));
                        if (isMap(target)) {
                            deps.push(depsMap.get(''));
                        }
                    } else if (isIntegerKey(key)) {
                        deps.push(depsMap.get('length'));
                    }
                    break;
                case 'delete':
                    if (!isArray(target)) {
                        deps.push(depsMap.get(''));
                        if (isMap(target)) {
                            deps.push(depsMap.get(''));
                        }
                    }
                    break;
                case 'set':
                    if (isMap(target)) {
                        deps.push(depsMap.get(''));
                    }
                    break;
            }
        }

        if (deps.length === 1) {
            if (deps[0]) {
                triggerEffects(deps[0]);
            }
        } else {
            const effects = [];
            for (const dep of deps) {
                if (dep) {
                    effects.push(...dep);
                }
            }
            triggerEffects(createDep(effects));
        }
    }

    function triggerEffects(dep) {
        const effects = isArray(dep) ? dep : [...dep];
        for (const effect of effects) {
            if (effect.computed) {
                triggerEffect(effect);
            }
        }
        for (const effect of effects) {
            if (!effect.computed) {
                triggerEffect(effect);
            }
        }
    }

    function triggerEffect(effect) {
        if (effect !== activeEffect || effect.allowRecurse) {
            if (effect.scheduler) {
                effect.scheduler();
            } else {
                effect.run();
            }
        }
    }

    const createDep = (effects) => {
        const dep = new Set(effects);
        dep.w = 0;
        dep.n = 0;
        return dep;
    };

    const isIntegerKey = (key) => {
        return isString(key) &&
            key !== 'NaN' &&
            key[0] !== '-' &&
            '' + parseInt(key, 10) === key;
    };

    // Reactive handlers
    const get = createGetter();
    const shallowGet = createGetter(false, true);
    const readonlyGet = createGetter(true);
    const shallowReadonlyGet = createGetter(true, true);

    const set = createSetter();
    const shallowSet = createSetter(true);

    function createGetter(isReadonly = false, shallow = false) {
        return function get(target, key, receiver) {
            if (key === "__v_isReactive") {
                return !isReadonly;
            } else if (key === "__v_isReadonly") {
                return isReadonly;
            } else if (key === "__v_isShallow") {
                return shallow;
            } else if (
                key === "__v_raw" &&
                receiver === 
                (isReadonly
                    ? shallow
                        ? shallowReadonlyMap
                        : readonlyMap
                    : shallow
                        ? shallowReactiveMap
                        : reactiveMap
                ).get(target)
            ) {
                return target;
            }

            const targetIsArray = isArray(target);

            if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
                return Reflect.get(arrayInstrumentations, key, receiver);
            }

            const res = Reflect.get(target, key, receiver);

            if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
                return res;
            }

            if (!isReadonly) {
                track(target, "get", key);
            }

            if (shallow) {
                return res;
            }

            if (isRef(res)) {
                return targetIsArray && isIntegerKey(key) ? res : res.value;
            }

            if (isObject(res)) {
                return isReadonly ? readonly(res) : reactive(res);
            }

            return res;
        };
    }

    function createSetter(shallow = false) {
        return function set(target, key, value, receiver) {
            let oldValue = target[key];

            if (isReadonly(oldValue) && isRef(oldValue) && !isRef(value)) {
                return false;
            }

            if (!shallow) {
                if (!isShallow(value) && !isReadonly(value)) {
                    oldValue = toRaw(oldValue);
                    value = toRaw(value);
                }
                if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
                    oldValue.value = value;
                    return true;
                }
            }

            const hadKey = isArray(target) && isIntegerKey(key) 
                ? Number(key) < target.length 
                : hasOwn(target, key);
            const result = Reflect.set(target, key, value, receiver);

            if (target === toRaw(receiver)) {
                if (!hadKey) {
                    trigger(target, "add", key, value);
                } else if (hasChanged(value, oldValue)) {
                    trigger(target, "set", key, value, oldValue);
                }
            }

            return result;
        };
    }

    function deleteProperty(target, key) {
        const hadKey = hasOwn(target, key);
        const oldValue = target[key];
        const result = Reflect.deleteProperty(target, key);
        if (result && hadKey) {
            trigger(target, "delete", key, undefined, oldValue);
        }
        return result;
    }

    function has(target, key) {
        const result = Reflect.has(target, key);
        if (!isSymbol(key) || !builtInSymbols.has(key)) {
            track(target, "has", key);
        }
        return result;
    }

    function ownKeys(target) {
        track(target, "iterate", isArray(target) ? 'length' : '');
        return Reflect.ownKeys(target);
    }

    const mutableHandlers = {
        get,
        set,
        deleteProperty,
        has,
        ownKeys
    };

    const readonlyHandlers = {
        get: readonlyGet,
        set(target, key) {
            console.warn(
                `Set operation on key "${String(key)}" failed: target is readonly.`,
                target
            );
            return true;
        },
        deleteProperty(target, key) {
            console.warn(
                `Delete operation on key "${String(key)}" failed: target is readonly.`,
                target
            );
            return true;
        }
    };

    const shallowReactiveHandlers = extend({}, mutableHandlers, {
        get: shallowGet,
        set: shallowSet
    });

    const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
        get: shallowReadonlyGet
    });

    // Array instrumentations
    const arrayInstrumentations = createArrayInstrumentations();

    function createArrayInstrumentations() {
        const instrumentations = {};
        (['includes', 'indexOf', 'lastIndexOf']).forEach(key => {
            instrumentations[key] = function (...args) {
                const arr = toRaw(this);
                for (let i = 0, l = this.length; i < l; i++) {
                    track(arr, "get", i + "");
                }
                const res = arr[key](...args);
                if (res === -1 || res === false) {
                    return arr[key](...args.map(toRaw));
                } else {
                    return res;
                }
            };
        });

        (['push', 'pop', 'shift', 'unshift', 'splice']).forEach(key => {
            instrumentations[key] = function (...args) {
                pauseTracking();
                const res = toRaw(this)[key].apply(this, args);
                resetTracking();
                return res;
            };
        });

        return instrumentations;
    }

    const builtInSymbols = new Set(
        Object.getOwnPropertyNames(Symbol)
            .filter(key => key !== 'arguments' && key !== 'caller')
            .map(key => Symbol[key])
            .filter(isSymbol)
    );

    const isNonTrackableKeys = (key) => {
        return key === '__proto__' || key === '__v_isRef' || key === '__isVue';
    };

    // Reactive maps
    const reactiveMap = new WeakMap();
    const shallowReactiveMap = new WeakMap();
    const readonlyMap = new WeakMap();
    const shallowReadonlyMap = new WeakMap();

    function targetTypeMap(rawType) {
        switch (rawType) {
            case 'Object':
            case 'Array':
                return 1;
            case 'Map':
            case 'Set':
            case 'WeakMap':
            case 'WeakSet':
                return 2;
            default:
                return 0;
        }
    }

    function getTargetType(value) {
        return value["__v_skip"] || !Object.isExtensible(value)
            ? 0
            : targetTypeMap(toRawType(value));
    }

    // Main reactive functions
    function reactive(target) {
        if (isReadonly(target)) {
            return target;
        }
        return createReactiveObject(
            target,
            false,
            mutableHandlers,
            null,
            reactiveMap
        );
    }

    function shallowReactive(target) {
        return createReactiveObject(
            target,
            false,
            shallowReactiveHandlers,
            null,
            shallowReactiveMap
        );
    }

    function readonly(target) {
        return createReactiveObject(
            target,
            true,
            readonlyHandlers,
            null,
            readonlyMap
        );
    }

    function shallowReadonly(target) {
        return createReactiveObject(
            target,
            true,
            shallowReadonlyHandlers,
            null,
            shallowReadonlyMap
        );
    }

    function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
        if (!isObject(target)) {
            console.warn(`value cannot be made reactive: ${String(target)}`);
            return target;
        }

        if (target["__v_raw"] && !(isReadonly && target["__v_isReactive"])) {
            return target;
        }

        const existingProxy = proxyMap.get(target);
        if (existingProxy) {
            return existingProxy;
        }

        const targetType = getTargetType(target);
        if (targetType === 0) {
            return target;
        }

        const proxy = new Proxy(
            target,
            targetType === 2 ? collectionHandlers : baseHandlers
        );
        proxyMap.set(target, proxy);
        return proxy;
    }

    function isReactive(value) {
        if (isReadonly(value)) {
            return isReactive(value["__v_raw"]);
        }
        return !!(value && value["__v_isReactive"]);
    }

    function isReadonly(value) {
        return !!(value && value["__v_isReadonly"]);
    }

    function isShallow(value) {
        return !!(value && value["__v_isShallow"]);
    }

    function isProxy(value) {
        return isReactive(value) || isReadonly(value);
    }

    function toRaw(observed) {
        const raw = observed && observed["__v_raw"];
        return raw ? toRaw(raw) : observed;
    }

    function markRaw(value) {
        Object.defineProperty(value, "__v_skip", {
            configurable: true,
            enumerable: false,
            value: true
        });
        return value;
    }

    const toReactive = (value) => isObject(value) ? reactive(value) : value;
    const toReadonly = (value) => isObject(value) ? readonly(value) : value;

    // Ref implementation
    function trackRefValue(ref) {
        if (shouldTrack && activeEffect) {
            ref = toRaw(ref);
            trackEffects(ref.dep || (ref.dep = createDep()));
        }
    }

    function triggerRefValue(ref, newVal) {
        ref = toRaw(ref);
        if (ref.dep) {
            triggerEffects(ref.dep);
        }
    }

    function isRef(r) {
        return !!(r && r.__v_isRef === true);
    }

    function ref(value) {
        return createRef(value, false);
    }

    function shallowRef(value) {
        return createRef(value, true);
    }

    function createRef(rawValue, shallow) {
        if (isRef(rawValue)) {
            return rawValue;
        }
        return new RefImpl(rawValue, shallow);
    }

    class RefImpl {
        constructor(value, __v_isShallow) {
            this.__v_isShallow = __v_isShallow;
            this.dep = undefined;
            this.__v_isRef = true;
            this._rawValue = __v_isShallow ? value : toRaw(value);
            this._value = __v_isShallow ? value : toReactive(value);
        }

        get value() {
            trackRefValue(this);
            return this._value;
        }

        set value(newVal) {
            const useDirectValue = this.__v_isShallow || isShallow(newVal) || isReadonly(newVal);
            newVal = useDirectValue ? newVal : toRaw(newVal);
            if (hasChanged(newVal, this._rawValue)) {
                this._rawValue = newVal;
                this._value = useDirectValue ? newVal : toReactive(newVal);
                triggerRefValue(this, newVal);
            }
        }
    }

    function unref(ref) {
        return isRef(ref) ? ref.value : ref;
    }

    const shallowUnwrapHandlers = {
        get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
        set: (target, key, value, receiver) => {
            const oldValue = target[key];
            if (isRef(oldValue) && !isRef(value)) {
                oldValue.value = value;
                return true;
            } else {
                return Reflect.set(target, key, value, receiver);
            }
        }
    };

    function proxyRefs(objectWithRefs) {
        return isReactive(objectWithRefs) 
            ? objectWithRefs 
            : new Proxy(objectWithRefs, shallowUnwrapHandlers);
    }

    // Computed
    const computedRefImpl = class ComputedRefImpl {
        constructor(getter, _setter, isReadonly, isSSR) {
            this._setter = _setter;
            this.dep = undefined;
            this.__v_isRef = true;
            this["__v_isReadonly"] = isReadonly;
            this._dirty = true;
            this.effect = new ReactiveEffect(getter, () => {
                if (!this._dirty) {
                    this._dirty = true;
                    triggerRefValue(this);
                }
            });
            this.effect.computed = this;
            this.effect.active = this._cacheable = !isSSR;
            this["__v_isReadonly"] = isReadonly;
        }

        get value() {
            const self = toRaw(this);
            trackRefValue(self);
            if (self._dirty || !self._cacheable) {
                self._dirty = false;
                self._value = self.effect.run();
            }
            return self._value;
        }

        set value(newValue) {
            this._setter(newValue);
        }
    };

    function computed(getterOrOptions, debugOptions, isSSR = false) {
        let getter;
        let setter;

        const onlyGetter = isFunction(getterOrOptions);
        if (onlyGetter) {
            getter = getterOrOptions;
            setter = () => {
                console.warn('Write operation failed: computed value is readonly');
            };
        } else {
            getter = getterOrOptions.get;
            setter = getterOrOptions.set;
        }

        const cRef = new computedRefImpl(getter, setter, onlyGetter || !setter, isSSR);

        return cRef;
    }

    // Watch implementation
    const INITIAL_WATCHER_VALUE = {};

    function watch(source, cb, options) {
        return doWatch(source, cb, options);
    }

    function watchEffect(effect, options) {
        return doWatch(effect, null, options);
    }

    function watchPostEffect(effect, options) {
        return doWatch(
            effect,
            null,
            extend({}, options, { flush: 'post' })
        );
    }

    function watchSyncEffect(effect, options) {
        return doWatch(
            effect,
            null,
            extend({}, options, { flush: 'sync' })
        );
    }

    function doWatch(source, cb, { immediate, deep, flush, onTrack, onTrigger } = EMPTY_OBJ) {
        let getter;
        let forceTrigger = false;
        let isMultiSource = false;

        if (isRef(source)) {
            getter = () => source.value;
            forceTrigger = isShallow(source);
        } else if (isReactive(source)) {
            getter = () => source;
            deep = true;
        } else if (isArray(source)) {
            isMultiSource = true;
            forceTrigger = source.some(s => isReactive(s) || isShallow(s));
            getter = () => source.map(s => {
                if (isRef(s)) {
                    return s.value;
                } else if (isReactive(s)) {
                    return traverse(s);
                } else if (isFunction(s)) {
                    return callWithErrorHandling(s, 'watch getter');
                } else {
                    console.warn('invalid watch source', s);
                }
            });
        } else if (isFunction(source)) {
            if (cb) {
                getter = () => callWithErrorHandling(source, 'watch getter');
            } else {
                getter = () => {
                    if (cleanup) {
                        cleanup();
                    }
                    return callWithAsyncErrorHandling(source, 'watch callback', [onCleanup]);
                };
            }
        } else {
            getter = NOOP;
            console.warn('invalid watch source', source);
        }

        if (cb && deep) {
            const baseGetter = getter;
            getter = () => traverse(baseGetter());
        }

        let cleanup;
        let onCleanup = (fn) => {
            cleanup = effect.onStop = () => {
                callWithErrorHandling(fn, 'watch cleanup');
            };
        };

        let oldValue = isMultiSource 
            ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) 
            : INITIAL_WATCHER_VALUE;

        const job = () => {
            if (!effect.active) {
                return;
            }
            if (cb) {
                const newValue = effect.run();
                if (
                    deep ||
                    forceTrigger ||
                    (isMultiSource
                        ? newValue.some((v, i) => hasChanged(v, oldValue[i]))
                        : hasChanged(newValue, oldValue)) ||
                    (isArray(newValue) && newValue.length === 0)
                ) {
                    if (cleanup) {
                        cleanup();
                    }
                    callWithAsyncErrorHandling(cb, 'watch callback', [
                        newValue,
                        oldValue === INITIAL_WATCHER_VALUE
                            ? undefined
                            : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE
                                ? []
                                : oldValue,
                        onCleanup
                    ]);
                    oldValue = newValue;
                }
            } else {
                effect.run();
            }
        };

        job.allowRecurse = !!cb;

        let scheduler;
        if (flush === 'sync') {
            scheduler = job;
        } else if (flush === 'post') {
            scheduler = () => queuePostRenderEffect(job);
        } else {
            job.pre = true;
            scheduler = () => queueJob(job);
        }

        const effect = new ReactiveEffect(getter, scheduler);

        if (cb) {
            if (immediate) {
                job();
            } else {
                oldValue = effect.run();
            }
        } else if (flush === 'post') {
            queuePostRenderEffect(effect.run.bind(effect));
        } else {
            effect.run();
        }

        return () => {
            effect.stop();
        };
    }

    function traverse(value, seen) {
        if (!isObject(value) || value["__v_skip"]) {
            return value;
        }
        seen = seen || new Set();
        if (seen.has(value)) {
            return value;
        }
        seen.add(value);
        if (isRef(value)) {
            traverse(value.value, seen);
        } else if (isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                traverse(value[i], seen);
            }
        } else if (isSet(value) || isMap(value)) {
            value.forEach((v) => {
                traverse(v, seen);
            });
        } else if (isPlainObject(value)) {
            for (const key in value) {
                traverse(value[key], seen);
            }
        }
        return value;
    }

    // Utility functions for effects
    const hasChanged = (value, oldValue) => !Object.is(value, oldValue);

    let shouldTrackEffect = true;
    const trackStack = [];

    function pauseTracking() {
        trackStack.push(shouldTrack);
        shouldTrack = false;
    }

    function enableTracking() {
        trackStack.push(shouldTrack);
        shouldTrack = true;
    }

    function resetTracking() {
        const last = trackStack.pop();
        shouldTrack = last === undefined ? true : last;
    }

    // Effect scope
    let activeEffectScope;

    class EffectScope {
        constructor(detached = false) {
            this.detached = detached;
            this.active = true;
            this.effects = [];
            this.cleanups = [];
            this.parent = activeEffectScope;
            if (!detached && activeEffectScope) {
                this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(this) - 1;
            }
        }

        run(fn) {
            if (this.active) {
                const currentEffectScope = activeEffectScope;
                try {
                    activeEffectScope = this;
                    return fn();
                } finally {
                    activeEffectScope = currentEffectScope;
                }
            } else {
                console.warn(`cannot run an inactive effect scope.`);
            }
        }

        on() {
            activeEffectScope = this;
        }

        off() {
            activeEffectScope = this.parent;
        }

        stop(fromParent) {
            if (this.active) {
                let i, l;
                for (i = 0, l = this.effects.length; i < l; i++) {
                    this.effects[i].stop();
                }
                for (i = 0, l = this.cleanups.length; i < l; i++) {
                    this.cleanups[i]();
                }
                if (this.scopes) {
                    for (i = 0, l = this.scopes.length; i < l; i++) {
                        this.scopes[i].stop(true);
                    }
                }
                if (!this.detached && this.parent && !fromParent) {
                    const last = this.parent.scopes.pop();
                    if (last && last !== this) {
                        this.parent.scopes[this.index] = last;
                        last.index = this.index;
                    }
                }
                this.active = false;
            }
        }
    }

    function effectScope(detached) {
        return new EffectScope(detached);
    }

    function recordEffectScope(effect, scope = activeEffectScope) {
        if (scope && scope.active) {
            scope.effects.push(effect);
        }
    }

    function getCurrentScope() {
        return activeEffectScope;
    }

    function onScopeDispose(fn) {
        if (activeEffectScope) {
            activeEffectScope.cleanups.push(fn);
        } else {
            console.warn(`onScopeDispose() is called when there is no active effect scope to be associated with.`);
        }
    }

    // Scheduler
    const queue = [];
    const pendingPostFlushCbs = [];
    let isFlushing = false;
    let isFlushPending = false;

    const resolvedPromise = Promise.resolve();
    let currentFlushPromise = null;

    function nextTick(fn) {
        const p = currentFlushPromise || resolvedPromise;
        return fn ? p.then(this ? fn.bind(this) : fn) : p;
    }

    function queueJob(job) {
        if ((!queue.length || !queue.includes(job, isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex)) &&
            job !== currentPreFlushParentJob) {
            if (job.id == null) {
                queue.push(job);
            } else {
                queue.splice(findInsertionIndex(job.id), 0, job);
            }
            queueFlush();
        }
    }

    function queuePostFlushCb(cb) {
        if (!isArray(cb)) {
            if (!pendingPostFlushCbs.length ||
                !pendingPostFlushCbs.includes(cb, pendingPostFlushCbs.indexOf(currentPostFlushParentJob) + 1)) {
                pendingPostFlushCbs.push(cb);
            }
        } else {
            pendingPostFlushCbs.push(...cb);
        }
        queueFlush();
    }

    function queuePostRenderEffect(fn) {
        queuePostFlushCb(fn);
    }

    function flushPreFlushCbs(seen, i = isFlushing ? flushIndex + 1 : 0) {
        for (; i < queue.length; i++) {
            const cb = queue[i];
            if (cb && cb.pre) {
                queue.splice(i, 1);
                i--;
                cb();
            }
        }
    }

    function flushPostFlushCbs(seen) {
        if (pendingPostFlushCbs.length) {
            const deduped = [...new Set(pendingPostFlushCbs)];
            pendingPostFlushCbs.length = 0;

            if (currentPostFlushParentJob) {
                currentPostFlushParentJob.push(...deduped);
                return;
            }

            currentPostFlushParentJob = deduped;

            deduped.sort((a, b) => getId(a) - getId(b));

            for (postFlushIndex = 0; postFlushIndex < deduped.length; postFlushIndex++) {
                deduped[postFlushIndex]();
            }
            currentPostFlushParentJob = null;
            postFlushIndex = 0;
        }
    }

    const getId = (job) => job.id == null ? Infinity : job.id;

    function queueFlush() {
        if (!isFlushing && !isFlushPending) {
            isFlushPending = true;
            currentFlushPromise = resolvedPromise.then(flushJobs);
        }
    }

    function findInsertionIndex(id) {
        let start = flushIndex + 1;
        let end = queue.length;

        while (start < end) {
            const middle = (start + end) >>> 1;
            const middleJobId = getId(queue[middle]);
            middleJobId < id ? (start = middle + 1) : (end = middle);
        }

        return start;
    }

    let flushIndex = 0;
    let postFlushIndex = 0;
    let currentPreFlushParentJob = null;
    let currentPostFlushParentJob = null;

    function flushJobs(seen) {
        isFlushPending = false;
        isFlushing = true;

        flushPreFlushCbs(seen);

        queue.sort((a, b) => getId(a) - getId(b));

        const check = NOOP;

        try {
            for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
                const job = queue[flushIndex];
                if (job && job.active !== false) {
                    if (true && check(job)) {
                        continue;
                    }
                    callWithErrorHandling(job, 'scheduler flush');
                }
            }
        } finally {
            flushIndex = 0;
            queue.length = 0;

            flushPostFlushCbs(seen);

            isFlushing = false;
            currentFlushPromise = null;

            if (queue.length || pendingPostFlushCbs.length) {
                flushJobs(seen);
            }
        }
    }

    // Error handling
    function callWithErrorHandling(fn, type, args) {
        let res;
        try {
            res = args ? fn(...args) : fn();
        } catch (err) {
            handleError(err, type);
        }
        return res;
    }

    function callWithAsyncErrorHandling(fn, type, args) {
        if (isFunction(fn)) {
            const res = callWithErrorHandling(fn, type, args);
            if (res && isPromise(res)) {
                res.catch(err => {
                    handleError(err, type);
                });
            }
            return res;
        }

        const values = [];
        for (let i = 0; i < fn.length; i++) {
            values.push(callWithAsyncErrorHandling(fn[i], type, args));
        }
        return values;
    }

    function handleError(err, type) {
        console.error(`Unhandled error${type ? ` in ${type}` : ``}:`, err);
    }

    // Component utilities
    function toDisplayString(val) {
        return val == null
            ? ''
            : isArray(val) || (isPlainObject(val) && (val.toString === objectToString || !isFunction(val.toString)))
                ? JSON.stringify(normalize(val), replacer, 2)
                : String(val);
    }

    function normalize(val) {
        return val;
    }

    function replacer(key, val) {
        if (val && val.__v_isRef) {
            return val.value;
        } else if (isMap(val)) {
            return {
                [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val]) => {
                    entries[`${key} =>`] = val;
                    return entries;
                }, {})
            };
        } else if (isSet(val)) {
            return {
                [`Set(${val.size})`]: [...val.values()]
            };
        } else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
            return String(val);
        }
        return val;
    }

    // Style utilities
    function normalizeStyle(value) {
        if (isArray(value)) {
            const res = {};
            for (let i = 0; i < value.length; i++) {
                const item = value[i];
                const normalized = isString(item)
                    ? parseStringStyle(item)
                    : normalizeStyle(item);
                if (normalized) {
                    for (const key in normalized) {
                        res[key] = normalized[key];
                    }
                }
            }
            return res;
        } else if (isString(value)) {
            return value;
        } else if (isObject(value)) {
            return value;
        }
    }

    const listDelimiterRE = /;(?![^(]*\))/g;
    const propertyDelimiterRE = /:(.+)/;

    function parseStringStyle(cssText) {
        const ret = {};
        cssText.split(listDelimiterRE).forEach(item => {
            if (item) {
                const tmp = item.split(propertyDelimiterRE);
                tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
            }
        });
        return ret;
    }

    function normalizeClass(value) {
        let res = '';
        if (isString(value)) {
            res = value;
        } else if (isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                const normalized = normalizeClass(value[i]);
                if (normalized) {
                    res += normalized + ' ';
                }
            }
        } else if (isObject(value)) {
            for (const name in value) {
                if (value[name]) {
                    res += name + ' ';
                }
            }
        }
        return res.trim();
    }

    // VIU Application API
    function createApp(rootComponent, rootProps) {
        const context = createAppContext();
        const installedPlugins = new Set();

        let isMounted = false;

        const app = {
            _uid: uid++,
            _component: rootComponent,
            _props: rootProps,
            _container: null,
            _context: context,
            _instance: null,

            version: '1.0.0',

            get config() {
                return context.config;
            },

            set config(v) {
                console.warn('app.config cannot be replaced. Modify individual options instead.');
            },

            use(plugin, ...options) {
                if (installedPlugins.has(plugin)) {
                    console.warn('Plugin has already been applied to target app.');
                } else if (plugin && isFunction(plugin.install)) {
                    installedPlugins.add(plugin);
                    plugin.install(app, ...options);
                } else if (isFunction(plugin)) {
                    installedPlugins.add(plugin);
                    plugin(app, ...options);
                } else {
                    console.warn('A plugin must either be a function or an object with an "install" function.');
                }
                return app;
            },

            mixin(mixin) {
                if (__VUE_OPTIONS_API__) {
                    if (!context.mixins.includes(mixin)) {
                        context.mixins.push(mixin);
                    } else {
                        console.warn('Mixin has already been applied to target app');
                    }
                } else {
                    console.warn('Mixins are only available in builds supporting Options API');
                }
                return app;
            },

            component(name, component) {
                if (!component) {
                    return context.components[name];
                }
                if (context.components[name]) {
                    console.warn(`Component "${name}" has already been registered in target app.`);
                }
                context.components[name] = component;
                return app;
            },

            directive(name, directive) {
                if (!directive) {
                    return context.directives[name];
                }
                if (context.directives[name]) {
                    console.warn(`Directive "${name}" has already been registered in target app.`);
                }
                context.directives[name] = directive;
                return app;
            },

            mount(rootContainer, isHydrate, isSVG) {
                if (!isMounted) {
                    const vnode = createVNode(rootComponent, rootProps);
                    vnode.appContext = context;

                    if (isHydrate && hydrate) {
                        hydrate(vnode, rootContainer);
                    } else {
                        render(vnode, rootContainer, isSVG);
                    }
                    isMounted = true;
                    app._container = rootContainer;
                    rootContainer.__vue_app__ = app;

                    return getExposeProxy(vnode.component) || vnode.component.proxy;
                } else {
                    console.warn('App has already been mounted.');
                }
            },

            unmount() {
                if (isMounted) {
                    render(null, app._container);
                    delete app._container.__vue_app__;
                } else {
                    console.warn('Cannot unmount an app that is not mounted.');
                }
            },

            provide(key, value) {
                if (key in context.provides) {
                    console.warn(`App already provides property with key "${String(key)}". It will be overwritten with the new value.`);
                }
                context.provides[key] = value;
                return app;
            }
        };

        return app;
    }

    function createAppContext() {
        return {
            app: null,
            config: {
                isNativeTag: NO,
                performance: false,
                globalProperties: {},
                optionMergeStrategies: {},
                errorHandler: undefined,
                warnHandler: undefined,
                compilerOptions: {}
            },
            mixins: [],
            components: {},
            directives: {},
            provides: Object.create(null),
            optionsCache: new WeakMap(),
            propsCache: new WeakMap(),
            emitsCache: new WeakMap()
        };
    }

    let uid = 0;

    // VNode creation and management
    const Fragment = Symbol('Fragment');
    const Text = Symbol('Text');
    const Comment = Symbol('Comment');
    const Static = Symbol('Static');

    function createVNode(type, props, children, patchFlag, dynamicProps, isBlockNode) {
        const vnode = {
            __v_isVNode: true,
            __v_skip: true,
            type,
            props,
            key: props && normalizeKey(props),
            ref: props && normalizeRef(props),
            scopeId: currentScopeId,
            slotScopeIds: null,
            children,
            component: null,
            suspense: null,
            ssContent: null,
            ssFallback: null,
            dirs: null,
            transition: null,
            el: null,
            anchor: null,
            target: null,
            targetAnchor: null,
            staticCount: 0,
            shapeFlag: getShapeFlag(type),
            patchFlag,
            dynamicProps,
            dynamicChildren: null,
            appContext: null
        };

        if (children) {
            vnode.shapeFlag |= isString(children)
                ? 8 /* TEXT_CHILDREN */
                : 16 /* ARRAY_CHILDREN */;
        }

        if (isBlockNode && currentBlock) {
            currentBlock.push(vnode);
        }

        return vnode;
    }

    function cloneVNode(vnode, extraProps, mergeRef = false) {
        const { props, ref, patchFlag, children } = vnode;
        const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;

        const cloned = {
            __v_isVNode: true,
            __v_skip: true,
            type: vnode.type,
            props: mergedProps,
            key: mergedProps && normalizeKey(mergedProps),
            ref: extraProps && extraProps.ref
                ? mergeRef && ref
                    ? isArray(ref)
                        ? ref.concat(normalizeRef(extraProps))
                        : [ref, normalizeRef(extraProps)]
                    : normalizeRef(extraProps)
                : ref,
            scopeId: vnode.scopeId,
            slotScopeIds: vnode.slotScopeIds,
            children: children,
            target: vnode.target,
            targetAnchor: vnode.targetAnchor,
            staticCount: vnode.staticCount,
            shapeFlag: vnode.shapeFlag,
            patchFlag: extraProps && vnode.type !== Fragment
                ? patchFlag === -1
                    ? 16
                    : patchFlag | 16
                : patchFlag,
            dynamicProps: vnode.dynamicProps,
            dynamicChildren: vnode.dynamicChildren,
            appContext: vnode.appContext,
            dirs: vnode.dirs,
            transition: vnode.transition,
            component: vnode.component,
            suspense: vnode.suspense,
            ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
            ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
            el: vnode.el,
            anchor: vnode.anchor
        };

        return cloned;
    }

    function getShapeFlag(type) {
        return isString(type)
            ? 1 /* ELEMENT */
            : isObject(type)
                ? 4 /* STATEFUL_COMPONENT */
                : isFunction(type)
                    ? 2 /* FUNCTIONAL_COMPONENT */
                    : 0;
    }

    function normalizeKey(props) {
        return props.key != null ? props.key : null;
    }

    function normalizeRef(props) {
        return (
            props.ref != null
                ? isString(props.ref) || isRef(props.ref) || isFunction(props.ref)
                    ? { i: currentRenderingInstance, r: props.ref, k: props.refKey }
                    : props.ref
                : null
        );
    }

    function mergeProps(...args) {
        const ret = {};
        for (let i = 0; i < args.length; i++) {
            const toMerge = args[i];
            for (const key in toMerge) {
                if (key === 'class') {
                    if (ret.class !== toMerge.class) {
                        ret.class = normalizeClass([ret.class, toMerge.class]);
                    }
                } else if (key === 'style') {
                    ret.style = normalizeStyle([ret.style, toMerge.style]);
                } else if (key.startsWith('on') && isFunction(toMerge[key])) {
                    const existing = ret[key];
                    const incoming = toMerge[key];
                    if (existing !== incoming && !(isArray(existing) && existing.includes(incoming))) {
                        ret[key] = existing
                            ? [].concat(existing, incoming)
                            : incoming;
                    }
                } else if (key !== '') {
                    ret[key] = toMerge[key];
                }
            }
        }
        return ret;
    }

    // Rendering
    let currentRenderingInstance = null;
    let currentScopeId = null;
    let currentBlock = null;

    function render(vnode, container, isSVG) {
        if (vnode == null) {
            if (container._vnode) {
                unmount(container._vnode, null, null, true);
            }
        } else {
            patch(container._vnode || null, vnode, container, null, null, null, isSVG);
        }
        flushPostFlushCbs();
        container._vnode = vnode;
    }

    function patch(
        n1,
        n2,
        container,
        anchor = null,
        parentComponent = null,
        parentSuspense = null,
        isSVG = false,
        slotScopeIds = null,
        optimized = false
    ) {
        if (n1 === n2) {
            return;
        }

        if (n1 && !isSameVNodeType(n1, n2)) {
            anchor = getNextHostNode(n1);
            unmount(n1, parentComponent, parentSuspense, true);
            n1 = null;
        }

        if (n2.patchFlag === -2) {
            optimized = false;
            n2.dynamicChildren = null;
        }

        const { type, ref, shapeFlag } = n2;
        switch (type) {
            case Text:
                processText(n1, n2, container, anchor);
                break;
            case Comment:
                processCommentNode(n1, n2, container, anchor);
                break;
            case Static:
                if (n1 == null) {
                    mountStaticNode(n2, container, anchor, isSVG);
                }
                break;
            case Fragment:
                processFragment(
                    n1,
                    n2,
                    container,
                    anchor,
                    parentComponent,
                    parentSuspense,
                    isSVG,
                    slotScopeIds,
                    optimized
                );
                break;
            default:
                if (shapeFlag & 1) {
                    processElement(
                        n1,
                        n2,
                        container,
                        anchor,
                        parentComponent,
                        parentSuspense,
                        isSVG,
                        slotScopeIds,
                        optimized
                    );
                } else if (shapeFlag & 6) {
                    processComponent(
                        n1,
                        n2,
                        container,
                        anchor,
                        parentComponent,
                        parentSuspense,
                        isSVG,
                        slotScopeIds,
                        optimized
                    );
                }
        }

        if (ref != null && parentComponent) {
            setRef(ref, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
        }
    }

    function isSameVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }

    // Basic VIU directives (similar to Vue directives)
    const ViuDirectives = {
        // v-model directive
        model: {
            created(el, binding, vnode) {
                // Initialize model binding
            },
            mounted(el, binding) {
                // Set up event listeners
            },
            beforeUpdate(el, binding, vnode, prevVNode) {
                // Update before DOM update
            },
            updated(el, binding, vnode, prevVNode) {
                // Update after DOM update
            }
        },

        // v-show directive
        show: {
            beforeMount(el, { value }, { transition }) {
                el._vod = el.style.display === 'none' ? '' : el.style.display;
                if (transition && value) {
                    transition.beforeEnter(el);
                } else {
                    setDisplay(el, value);
                }
            },
            mounted(el, { value }, { transition }) {
                if (transition && value) {
                    transition.enter(el);
                }
            },
            updated(el, { value, oldValue }, { transition }) {
                if (!value === !oldValue) return;
                if (transition) {
                    if (value) {
                        transition.beforeEnter(el);
                        setDisplay(el, true);
                        transition.enter(el);
                    } else {
                        transition.leave(el, () => {
                            setDisplay(el, false);
                        });
                    }
                } else {
                    setDisplay(el, value);
                }
            },
            beforeUnmount(el, { value }) {
                setDisplay(el, value);
            }
        }
    };

    function setDisplay(el, value) {
        el.style.display = value ? el._vod : 'none';
    }

    // Export the main VIU API
    const VIU = {
        // Core reactivity
        reactive,
        ref,
        readonly,
        computed,
        watch,
        watchEffect,
        isRef,
        isReactive,
        isReadonly,
        isProxy,
        unref,
        proxyRefs,
        toRef: (object, key, defaultValue) => {
            if (isRef(object[key])) {
                return object[key];
            }
            const r = {
                __v_isRef: true,
                get value() {
                    const val = object[key];
                    return val === undefined ? defaultValue : val;
                },
                set value(val) {
                    object[key] = val;
                }
            };
            Object.defineProperty(r, '__v_key', { value: key, configurable: true });
            return r;
        },
        toRefs: (object) => {
            if (!isProxy(object)) {
                console.warn(`toRefs() expects a reactive object but received a plain one.`);
            }
            const ret = isArray(object) ? new Array(object.length) : {};
            for (const key in object) {
                ret[key] = VIU.toRef(object, key);
            }
            return ret;
        },
        toRaw,
        markRaw,
        shallowRef,
        shallowReactive,
        shallowReadonly,
        customRef: (factory) => {
            return new CustomRefImpl(factory);
        },

        // Effect and scheduling
        effect,
        stop,
        nextTick,
        
        // App creation
        createApp,
        
        // Component utilities  
        defineComponent: (options) => options,
        
        // Lifecycle (stubs for compatibility)
        onMounted: (fn) => {
            if (currentInstance) {
                currentInstance.mounted = currentInstance.mounted || [];
                currentInstance.mounted.push(fn);
            }
        },
        onUnmounted: (fn) => {
            if (currentInstance) {
                currentInstance.unmounted = currentInstance.unmounted || [];
                currentInstance.unmounted.push(fn);
            }
        },
        onUpdated: (fn) => {
            if (currentInstance) {
                currentInstance.updated = currentInstance.updated || [];
                currentInstance.updated.push(fn);
            }
        },
        onBeforeMount: (fn) => {
            if (currentInstance) {
                currentInstance.beforeMount = currentInstance.beforeMount || [];
                currentInstance.beforeMount.push(fn);
            }
        },
        onBeforeUnmount: (fn) => {
            if (currentInstance) {
                currentInstance.beforeUnmount = currentInstance.beforeUnmount || [];
                currentInstance.beforeUnmount.push(fn);
            }
        },
        onBeforeUpdate: (fn) => {
            if (currentInstance) {
                currentInstance.beforeUpdate = currentInstance.beforeUpdate || [];
                currentInstance.beforeUpdate.push(fn);
            }
        },

        // Provide/Inject
        provide: (key, value) => {
            if (!currentInstance) {
                console.warn(`provide() can only be used inside setup().`);
            } else {
                let provides = currentInstance.provides;
                const parentProvides = currentInstance.parent && currentInstance.parent.provides;
                if (parentProvides === provides) {
                    provides = currentInstance.provides = Object.create(parentProvides);
                }
                provides[key] = value;
            }
        },
        inject: (key, defaultValue, treatDefaultAsFactory = false) => {
            const instance = currentInstance;
            if (instance) {
                const provides = instance.parent == null
                    ? instance.vnode.appContext && instance.vnode.appContext.provides
                    : instance.parent.provides;
                
                if (provides && key in provides) {
                    return provides[key];
                } else if (arguments.length > 1) {
                    return treatDefaultAsFactory && isFunction(defaultValue)
                        ? defaultValue.call(instance.proxy)
                        : defaultValue;
                } else {
                    console.warn(`injection "${String(key)}" not found.`);
                }
            } else {
                console.warn(`inject() can only be used inside setup() or functional components.`);
            }
        },

        // Directives
        directives: ViuDirectives,

        // Version
        version: '1.0.0'
    };

    // CustomRef implementation
    class CustomRefImpl {
        constructor(factory) {
            this.dep = undefined;
            this.__v_isRef = true;

            const { get, set } = factory(
                () => trackRefValue(this),
                () => triggerRefValue(this)
            );
            this._get = get;
            this._set = set;
        }

        get value() {
            return this._get();
        }

        set value(newVal) {
            this._set(newVal);
        }
    }

    // Component instance tracking
    let currentInstance = null;

    // Stub implementations for complex features
    function processText(n1, n2, container, anchor) {
        if (n1 == null) {
            hostInsert(
                (n2.el = hostCreateText(n2.children)),
                container,
                anchor
            );
        } else {
            const el = (n2.el = n1.el);
            if (n2.children !== n1.children) {
                hostSetText(el, n2.children);
            }
        }
    }

    function processCommentNode(n1, n2, container, anchor) {
        if (n1 == null) {
            hostInsert(
                (n2.el = hostCreateComment(n2.children || '')),
                container,
                anchor
            );
        } else {
            n2.el = n1.el;
        }
    }

    function mountStaticNode(n2, container, anchor, isSVG) {
        // Static node mounting logic
    }

    function processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) {
        // Fragment processing logic
    }

    function processElement(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) {
        // Element processing logic
    }

    function processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) {
        // Component processing logic
    }

    function unmount(vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) {
        // Unmounting logic
    }

    function getNextHostNode(vnode) {
        // Get next host node logic
        return null;
    }

    function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
        // Ref setting logic
    }

    function getExposeProxy(instance) {
        return instance.proxy;
    }

    // Host operations (DOM manipulation)
    const hostInsert = (child, parent, anchor) => {
        parent.insertBefore(child, anchor || null);
    };

    const hostRemove = (child) => {
        const parent = child.parentNode;
        if (parent) {
            parent.removeChild(child);
        }
    };

    const hostSetText = (node, text) => {
        node.nodeValue = text;
    };

    const hostCreateText = (text) => document.createTextNode(text);
    const hostCreateComment = (text) => document.createComment(text);

    // Make VIU available globally and as module
    if (typeof window !== 'undefined') {
        window.VIU = VIU;
    }

    return VIU;

})();