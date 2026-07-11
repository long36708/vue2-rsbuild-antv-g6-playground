/**
 * 全局 keep-alive 缓存组件
 *
 * @see https://ustbhuangyi.github.io/vue-analysis/v2/extend/keep-alive.html
 * @see https://github.com/HuangZhaoPing/dynamic-keep-alive
 */

/**
 * 全局 KeepAlive 组件实例计数器
 *
 * @type {number}
 */
let instance = 0;

/**
 * 创建一个新的 GlobalKeepAlive 组件
 *
 * @param {?string} name 组件名
 * @return {ComponentOptions<Vue>}
 */
export function createGlobalKeepAlive(name) {
  // 新创建的 GlobalKeepAlive 组件绑定的唯一缓存
  const cache = new KeepAliveCache();
  Object.freeze(cache);

  // 新创建的 GlobalKeepAlive 组件名
  const componentName = 'GlobalKeepAlive' + firstCharToUpper(name || ('Instance' + (instance++)));

  // 新创建的 GlobalKeepAlive 组件配置对象
  return {
    name: componentName,
    props: {
      // 手工指定缓存的 key
      cacheKey: String,
      // 组件名是否缓存的过滤器
      cacheFilter: [Function, RegExp]
    },
    data() {
      return {
        cache
      };
    },
    render() {
      const slot = this.$slots.default;
      const vnode = getFirstComponentChild(slot);
      if (vnode && vnode.componentOptions && this.shouldCache(vnode)) {
        this.addToCache(vnode);
      }
      return vnode || (slot && slot[0]);
    },
    methods: {
      shouldCache(vnode) {
        const componentOptions = vnode && vnode.componentOptions;
        if (!componentOptions) {
          throw new TypeError('invalid VNode object');
        }

        if (typeof this.cacheFilter === 'function') {
          const name = componentOptions.Ctor.options.name;
          const options = componentOptions.Ctor.options;
          return !!(name && this.cacheFilter(name, options));
        }
        if (this.cacheFilter instanceof RegExp) {
          const name = componentOptions.Ctor.options.name;
          return !!(name && this.cacheFilter.test(name));
        }
        return true;
      },
      addToCache(vnode) {
        const componentOptions = vnode && vnode.componentOptions;
        if (!componentOptions) {
          throw new TypeError('invalid VNode object');
        }

        let key;
        if (this.cacheKey != null) {
          key = String(this.cacheKey);
        } else {
          key = `${componentOptions.Ctor.options.name}#${componentOptions.Ctor.cid}`;
        }
        this.cache.put(key, vnode);
      }
    },
    _globalCache: cache
  };
}

/**
 * 全局 KeepAlive 组件缓存
 */
class KeepAliveCache {
  constructor() {
    this.cache = new Map();
  }

  /**
     * 缓存键值遍历
     *
     * @returns {Iterator<string>}
     */
  keys() {
    return this.cache.keys();
  }

  /**
     * 添加 VNode 缓存项
     *
     * @param {string} key 缓存键值
     * @param {VNode} vnode 缓存 VNode 对象
     */
  put(key, vnode) {
    const cached = this.cache.get(key);
    if (cached) {
      vnode.componentInstance = cached.componentInstance;
      this.cache.delete(key);
      this.cache.set(key, cached);
    } else {
      this.cache.set(key, vnode);
    }
    vnode.data.keepAlive = true;
  }

  /**
     * 删除 VNode 缓存项
     *
     * @param {string} key 缓存键值
     */
  remove(key) {
    const cached = this.cache.get(key);
    if (cached) {
      if (cached.componentInstance) {
        cached.componentInstance.$destroy();
      } else {
        throw new Error('cannot destroy component instance of a fresh-created vue virtual node');
      }
    }
    this.cache.delete(key);
  }

  /**
     * 清除 VNode 缓存
     *
     * @param {?number} keep 最多保留近期多少项缓存
     */
  clear(keep) {
    keep = (keep ? Math.min(Math.max(keep, 0), this.cache.size) : 0);
    let count = this.cache.size - keep;
    for (const key of this.cache.keys()) {
      if (!(count--)) break;
      this.remove(key);
    }
  }
}

/**
 * 获取插槽第一个 VNode 节点
 *
 * @param {Array<VNode|null>} children 渲染时得到的组件插槽
 * @return {VNode|null} 第一个 VNode 节点
 */
function getFirstComponentChild(children) {
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child != null && (child.componentOptions != null || (child.isComment && child.asyncFactory))) {
        return child;
      }
    }
  }
}

/**
 * 首字母转大写
 *
 * @param {string} name 名字字符串
 * @return {string} 转换后的名字
 */
function firstCharToUpper(name) {
  if (name.length > 0) {
    return name.slice(0, 1).toUpperCase() + name.slice(1);
  }
  return name;
}

/**
 * 默认的 GlobalKeepAlive 组件实例
 *
 * @type {ComponentOptions<Vue>}
 */
export default createGlobalKeepAlive('Default');
