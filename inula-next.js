// src/store.js
import { Store } from "@openinula/store";
if (!("global" in Store)) {
  if (typeof window !== "undefined") {
    Store.global = window;
  } else if (typeof global !== "undefined") {
    Store.global = global;
  } else {
    Store.global = {};
  }
}
if (!("document" in Store)) {
  if (typeof document !== "undefined") {
    Store.document = document;
  }
}
var DLStore = { ...Store, delegatedEvents: /* @__PURE__ */ new Set() };
function setGlobal(globalObj) {
  DLStore.global = globalObj;
}
function setDocument(customDocument) {
  DLStore.document = customDocument;
}
function cached(deps, prevDeps) {
  if (!prevDeps || deps.length !== prevDeps.length)
    return false;
  return deps.every((dep, i) => !(dep instanceof Object) && prevDeps[i] === dep);
}

// src/DLNode.js
var DLNodeType = {
  Comp: 0,
  For: 1,
  Cond: 2,
  Env: 3,
  Exp: 4,
  Snippet: 5,
  Try: 6
};
var DLNode = class {
  /**
   * @brief Node type: HTML, Text, Custom, For, If, Env, Expression
   */
  _$dlNodeType;
  /**
   * @brief Constructor
   * @param nodeType
   * @return {void}
   */
  constructor(nodeType) {
    this._$dlNodeType = nodeType;
  }
  /**
   * @brief Node element
   *  Either one real element for HTMLNode and TextNode
   *  Or an array of DLNode for CustomNode, ForNode, IfNode, EnvNode, ExpNode
   */
  get _$el() {
    return DLNode.toEls(this._$nodes);
  }
  /**
   * @brief Loop all child DLNodes to get all the child elements
   * @param nodes
   * @returns HTMLElement[]
   */
  static toEls(nodes) {
    const els = [];
    this.loopShallowEls(nodes, (el) => {
      els.push(el);
    });
    return els;
  }
  // ---- Loop nodes ----
  /**
   * @brief Loop all elements shallowly,
   *  i.e., don't loop the child nodes of dom elements and only call runFunc on dom elements
   * @param nodes
   * @param runFunc
   */
  static loopShallowEls(nodes, runFunc) {
    const stack = [...nodes].reverse();
    while (stack.length > 0) {
      const node = stack.pop();
      if (!("_$dlNodeType" in node))
        runFunc(node);
      else
        node._$nodes && stack.push(...[...node._$nodes].reverse());
    }
  }
  /**
   * @brief Add parentEl to all nodes until the first element
   * @param nodes
   * @param parentEl
   */
  static addParentEl(nodes, parentEl) {
    nodes.forEach((node) => {
      if ("_$dlNodeType" in node) {
        node._$parentEl = parentEl;
        node._$nodes && DLNode.addParentEl(node._$nodes, parentEl);
      }
    });
  }
  // ---- Flow index and add child elements ----
  /**
   * @brief Get the total count of dom elements before the stop node
   * @param nodes
   * @param stopNode
   * @returns total count of dom elements
   */
  static getFlowIndexFromNodes(nodes, stopNode) {
    let index = 0;
    const stack = [...nodes].reverse();
    while (stack.length > 0) {
      const node = stack.pop();
      if (node === stopNode)
        break;
      if ("_$dlNodeType" in node) {
        node._$nodes && stack.push(...[...node._$nodes].reverse());
      } else {
        index++;
      }
    }
    return index;
  }
  /**
   * @brief Given an array of nodes, append them to the parentEl
   *  1. If nextSibling is provided, insert the nodes before the nextSibling
   *  2. If nextSibling is not provided, append the nodes to the parentEl
   * @param nodes
   * @param parentEl
   * @param nextSibling
   * @returns Added element count
   */
  static appendNodesWithSibling(nodes, parentEl, nextSibling) {
    if (nextSibling)
      return this.insertNodesBefore(nodes, parentEl, nextSibling);
    return this.appendNodes(nodes, parentEl);
  }
  /**
   * @brief Given an array of nodes, append them to the parentEl using the index
   *  1. If the index is the same as the length of the parentEl.childNodes, append the nodes to the parentEl
   *  2. If the index is not the same as the length of the parentEl.childNodes, insert the nodes before the node at the index
   * @param nodes
   * @param parentEl
   * @param index
   * @param length
   * @returns Added element count
   */
  static appendNodesWithIndex(nodes, parentEl, index, length) {
    length = length ?? parentEl.childNodes.length;
    if (length !== index)
      return this.insertNodesBefore(nodes, parentEl, parentEl.childNodes[index]);
    return this.appendNodes(nodes, parentEl);
  }
  /**
   * @brief Insert nodes before the nextSibling
   * @param nodes
   * @param parentEl
   * @param nextSibling
   * @returns Added element count
   */
  static insertNodesBefore(nodes, parentEl, nextSibling) {
    let count = 0;
    this.loopShallowEls(nodes, (el) => {
      parentEl.insertBefore(el, nextSibling);
      count++;
    });
    return count;
  }
  /**
   * @brief Append nodes to the parentEl
   * @param nodes
   * @param parentEl
   * @returns Added element count
   */
  static appendNodes(nodes, parentEl) {
    let count = 0;
    this.loopShallowEls(nodes, (el) => {
      parentEl.appendChild(el);
      count++;
    });
    return count;
  }
  // ---- Lifecycle ----
  /**
   * @brief Add willUnmount function to node
   * @param node
   * @param func
   */
  static addWillUnmount(node, func) {
    const willUnmountStore = DLStore.global.WillUnmountStore;
    const currentStore = willUnmountStore[willUnmountStore.length - 1];
    if (!currentStore)
      return;
    currentStore.push(func.bind(null, node));
  }
  /**
   * @brief Add didUnmount function to node
   * @param node
   * @param func
   */
  static addDidUnmount(node, func) {
    const didUnmountStore = DLStore.global.DidUnmountStore;
    const currentStore = didUnmountStore[didUnmountStore.length - 1];
    if (!currentStore)
      return;
    currentStore.push(func.bind(null, node));
  }
  /**
   * @brief Add didUnmount function to global store
   * @param func
   */
  static addDidMount(node, func) {
    if (!DLStore.global.DidMountStore)
      DLStore.global.DidMountStore = [];
    DLStore.global.DidMountStore.push(func.bind(null, node));
  }
  /**
   * @brief Run all didMount functions and reset the global store
   */
  static runDidMount() {
    const didMountStore = DLStore.global.DidMountStore;
    if (!didMountStore || didMountStore.length === 0)
      return;
    for (let i = didMountStore.length - 1; i >= 0; i--) {
      didMountStore[i]();
    }
    DLStore.global.DidMountStore = [];
  }
};

// src/HTMLNode.js
function cache(el, key, deps) {
  if (deps.length === 0)
    return false;
  const cacheKey = `$${key}`;
  if (cached(deps, el[cacheKey]))
    return true;
  el[cacheKey] = deps;
  return false;
}
function setStyle(el, value) {
  Object.entries(value).forEach(([key, value2]) => {
    if (key.startsWith("--")) {
      el.style.setProperty(key, value2);
    } else {
      el.style[key] = value2;
    }
  });
}
function setDataset(el, value) {
  Object.assign(el.dataset, value);
}
function setHTMLProp(el, key, valueFunc, deps) {
  if (cache(el, key, deps))
    return;
  el[key] = valueFunc();
}
function setHTMLProps(el, value) {
  Object.entries(value).forEach(([key, v]) => {
    if (key === "style")
      return setStyle(el, v);
    if (key === "dataset")
      return setDataset(el, v);
    setHTMLProp(el, key, () => v, []);
  });
}
function setHTMLAttr(el, key, valueFunc, deps) {
  if (cache(el, key, deps))
    return;
  el.setAttribute(key, valueFunc());
}
function setHTMLAttrs(el, value) {
  Object.entries(value).forEach(([key, v]) => {
    setHTMLAttr(el, key, () => v, []);
  });
}
function setEvent(el, key, value) {
  const prevEvent = el[`$on${key}`];
  if (prevEvent)
    el.removeEventListener(key, prevEvent);
  el.addEventListener(key, value);
  el[`$on${key}`] = value;
}
function eventHandler(e) {
  const key = `$$${e.type}`;
  for (const node of e.composedPath()) {
    if (node[key])
      node[key](e);
    if (e.cancelBubble)
      return;
  }
}
function delegateEvent(el, key, value) {
  if (el[`$$${key}`] === value)
    return;
  el[`$$${key}`] = value;
  if (!DLStore.delegatedEvents.has(key)) {
    DLStore.delegatedEvents.add(key);
    DLStore.document.addEventListener(key, eventHandler);
  }
}
function createElement(tag) {
  return DLStore.document.createElement(tag);
}
function insertNode(el, node, position) {
  if (!el._$nodes)
    el._$nodes = Array.from(el.childNodes);
  el._$nodes.splice(position, 0, node);
  const flowIdx = DLNode.getFlowIndexFromNodes(el._$nodes, node);
  DLNode.appendNodesWithIndex([node], el, flowIdx);
  DLNode.addParentEl([node], el);
}
function forwardHTMLProp(el, key, valueFunc, deps) {
  if (key === "style")
    return setStyle(el, valueFunc());
  if (key === "dataset")
    return setDataset(el, valueFunc());
  if (key === "element")
    return;
  if (key === "prop")
    return setHTMLProps(el, valueFunc());
  if (key === "attr")
    return setHTMLAttrs(el, valueFunc());
  if (key === "innerHTML")
    return setHTMLProp(el, "innerHTML", valueFunc, deps);
  if (key === "textContent")
    return setHTMLProp(el, "textContent", valueFunc, deps);
  if (key === "forwardProp")
    return;
  if (key.startsWith("on")) {
    return setEvent(el, key.slice(2).toLowerCase(), valueFunc());
  }
  setHTMLAttr(el, key, valueFunc, deps);
}

// src/scheduler.js
var p = Promise.resolve();
function schedule(task) {
  p.then(task);
}

// src/CompNode.js
var CompNode = class extends DLNode {
  /**
   * @brief Constructor, Comp type
   * @internal
   *  * key - private property key
   *  * $$key - dependency number, e.g. 0b1, 0b10, 0b100
   *  * $s$key - set of properties that depend on this property
   *  * $p$key - exist if this property is a prop
   *  * $e$key - exist if this property is an env
   *  * $en$key - exist if this property is an env, and it's the innermost env that contains this env
   *  * $w$key - exist if this property is a watcher
   *  * $f$key - a function that returns the value of this property, called when the property's dependencies change
   *  * _$children - children nodes of type PropView
   *  * _$contentKey - the key key of the content prop
   *  * _$forwardProps - exist if this node is forwarding props
   *  * _$forwardPropsId - the keys of the props that this node is forwarding, collected in _$setForwardProp
   *  * _$forwardPropsSet - contain all the nodes that are forwarding props to this node, collected with _$addForwardProps
   */
  constructor() {
    super(DLNodeType.Comp);
  }
  setUpdateFunc({ updateState, updateProp, updateContext, getUpdateViews, didUnmount, willUnmount: willUnmount2, didMount: didMount2 }) {
    this.updateState = updateState;
    this._$updateProp = updateProp;
    if (updateContext)
      this.updateContext = updateContext;
    this.getUpdateViews = getUpdateViews;
    this.didUnmount = didUnmount;
    this.willUnmount = willUnmount2;
    this.didMount = didMount2;
  }
  updateProp(...args) {
    this._$updateProp(...args);
  }
  /**
   * @brief Init function, called explicitly in the subclass's constructor
   */
  init() {
    this._$notInitd = true;
    const willCall = () => {
      this._$callUpdatesBeforeInit();
      this.didMount && DLNode.addDidMount(this, this.didMount.bind(this));
      this.willUnmount && DLNode.addWillUnmount(this, this.willUnmount.bind(this));
      DLNode.addDidUnmount(this, this._$setUnmounted.bind(this));
      this.didUnmount && DLNode.addDidUnmount(this, this.didUnmount.bind(this));
      if (this.getUpdateViews) {
        const result = this.getUpdateViews();
        if (Array.isArray(result)) {
          const [baseNode, updateView] = result;
          this.updateView = updateView;
          this._$nodes = baseNode;
        } else {
          this.updateView = result;
        }
      }
    };
    if (this._$catchable) {
      this._$catchable(willCall)();
      if (this._$update)
        this._$update = this._$catchable(this._$update.bind(this));
      this.updateDerived = this._$catchable(this.updateDerived.bind(this));
      delete this._$catchable;
    } else {
      willCall();
    }
    return this;
  }
  _$setUnmounted() {
    this._$unmounted = true;
  }
  /**
   * @brief Call updates manually before the node is mounted
   */
  _$callUpdatesBeforeInit() {
    this.updateState(-1);
    delete this._$notInitd;
  }
  /**
   * @brief Set all the props to forward
   * @param key
   * @param value
   * @param deps
   */
  _$setPropToForward(key, value, deps) {
    this._$forwardPropsSet.forEach((node) => {
      if (node._$dlNodeType === DLNodeType.Comp) {
        node._$setProp(key, () => value, deps);
        return;
      }
      if (node instanceof HTMLElement) {
        forwardHTMLProp(node, key, () => value, deps);
      }
    });
  }
  /**
   * @brief Define forward props
   * @param key
   * @param value
   */
  _$setForwardProp(key, valueFunc, deps) {
    const notInitd = "_$notInitd" in this;
    if (!notInitd && this._$cache(key, deps))
      return;
    const value = valueFunc();
    if (key === "_$content" && this._$contentKey) {
      this[this._$contentKey] = value;
      this.updateDerived(this._$contentKey);
    }
    this[key] = value;
    this.updateDerived(key);
    if (notInitd)
      this._$forwardPropsId.push(key);
    else
      this._$setPropToForward(key, value, deps);
  }
  /**
   * @brief Cache the deps and return true if the deps are the same as the previous deps
   * @param key
   * @param deps
   * @returns
   */
  _$cache(key, deps) {
    if (!deps || !deps.length)
      return false;
    const cacheKey = `$cc$${key}`;
    if (cached(deps, this[cacheKey]))
      return true;
    this[cacheKey] = deps;
    return false;
  }
  /**
   * @brief Set the content prop, the key is stored in _$contentKey
   * @param value
   */
  _$setContent(valueFunc, deps) {
    if ("_$forwardProps" in this)
      return this._$setForwardProp("_$content", valueFunc, deps);
    const contentKey = this._$contentKey;
    if (!contentKey)
      return;
    if (this._$cache(contentKey, deps))
      return;
    this[contentKey] = valueFunc();
    this.updateDerived(contentKey);
  }
  /**
   * @brief Set a prop directly, if this is a forwarded prop, go and init forwarded props
   * @param key
   * @param value
   * @param deps
   */
  _$setProp(key, valueFunc, deps) {
    if (this._$cache(key, deps))
      return;
    this[key] = valueFunc();
    this.updateProp(key, this[key]);
  }
  _$setProps(valueFunc, deps) {
    if (this._$cache("props", deps))
      return;
    const props = valueFunc();
    if (!props)
      return;
    Object.entries(props).forEach(([key, value]) => {
      this._$setProp(key, () => value, []);
    });
  }
  // ---- Update functions
  /**
   * @brief Update an env, called in EnvNode._$update
   * @param key
   * @param value
   * @param context
   */
  _$updateContext(key, value, context) {
    if (!this.updateContext)
      return;
    this.updateContext(context, key, value);
  }
  /**
   * @brief Update a prop
   */
  _$ud(exp, key) {
    this.updateDerived(key);
    return exp;
  }
  /**
   * @brief Update properties that depend on this property
   * @param {any} newValue
   * @param {number} bit
   */
  updateDerived(newValue, bit) {
    if ("_$notInitd" in this)
      return;
    this.updateState(bit);
    if (!inMount()) {
      this._$updateView(bit);
    }
  }
  /**
   *
   * @param {number} bit
   * @private
   */
  _$updateView(bit) {
    if (!bit)
      return;
    if ("_$depNumsToUpdate" in this) {
      this._$depNumsToUpdate.push(bit);
    } else {
      this._$depNumsToUpdate = [bit];
      schedule(() => {
        if (this._$unmounted)
          return;
        const depNums = this._$depNumsToUpdate;
        if (depNums.length > 0) {
          const depNum = depNums.reduce((acc, cur) => acc | cur, 0);
          this.updateView(depNum);
        }
        delete this._$depNumsToUpdate;
      });
    }
  }
};
var View = CompNode;
function update(dlNode, key) {
  dlNode.updateDerived(key);
}

// src/HookNode.js
var HookNode = class extends CompNode {
  /**
   *
   * @param {HookNode | CompNode} currentComp
   * @param {number}bitMap
   */
  constructor(currentComp2, bitMap) {
    super();
    this.parent = currentComp2;
    this.bitMap = bitMap;
  }
  /**
   * update prop
   * @param {string} propName
   * @param {any }value
   */
  updateHook(propName, value) {
    this.update();
  }
  emitUpdate() {
    this.parent.updateDerived(null, this.bitMap);
  }
  setUpdateFunc({ value, ...updater }) {
    super.setUpdateFunc(updater);
    this.value = value;
  }
  updateProp(...args) {
    if (!inMount()) {
      super.updateProp(...args);
    }
  }
};

// src/ContextProvider.js
var ContextProvider = class extends DLNode {
  constructor(ctx, envs, depsArr) {
    super(DLNodeType.Env);
    if (!("DLEnvStore" in DLStore.global))
      DLStore.global.envNodeMap = /* @__PURE__ */ new Map();
    this.context = ctx;
    this.envs = envs;
    this.depsArr = depsArr;
    this.updateNodes = /* @__PURE__ */ new Set();
    this.replaceContextValue();
  }
  cached(deps, name) {
    if (!deps || !deps.length)
      return false;
    if (cached(deps, this.depsArr[name]))
      return true;
    this.depsArr[name] = deps;
    return false;
  }
  /**
   * @brief Update a specific env, and update all the comp nodes that depend on this env
   * @param name - The name of the environment variable to update
   * @param value - The new value of the environment variable
   */
  updateContext(name, valueFunc, deps) {
    if (this.cached(deps, name))
      return;
    const value = valueFunc();
    this.envs[name] = value;
    this.updateNodes.forEach((node) => {
      node._$updateContext(name, value, this.context);
    });
  }
  replaceContextValue() {
    this.prevValue = this.context.value;
    this.prevEnvNode = DLStore.global.envNodeMap.get(this.context.id);
    this.context.value = this.envs;
    DLStore.global.envNodeMap.set(this.context.id, this);
  }
  /**
   * @brief Add a node to this.updateNodes, delete the node from this.updateNodes when it unmounts
   * @param node - The node to add
   */
  addNode(node) {
    this.updateNodes.add(node);
    DLNode.addWillUnmount(node, this.updateNodes.delete.bind(this.updateNodes, node));
  }
  /**
   * @brief Set this._$nodes, and exit the current env
   * @param nodes - The nodes to set
   */
  initNodes(nodes) {
    this._$nodes = nodes;
    this.context.value = this.prevValue;
    if (this.prevEnvNode) {
      DLStore.global.envNodeMap.set(this.context.id, this.prevEnvNode);
    } else {
      DLStore.global.envNodeMap.delete(this.context.id);
    }
    this.prevValue = null;
    this.prevEnvNode = null;
  }
};
function replaceEnvNodes(envNodeMap) {
  for (const [ctxId, envNode] of envNodeMap.entries()) {
    envNode.replaceContextValue();
  }
}

// src/TextNode.js
function createTextNode(value, deps) {
  const node = DLStore.document.createTextNode(value);
  node.$$deps = deps;
  return node;
}
function updateText(node, valueFunc, deps) {
  if (cached(deps, node.$$deps))
    return;
  const value = valueFunc();
  node.textContent = value;
  node.$$deps = deps;
}

// src/PropView.js
var PropView = class {
  propViewFunc;
  dlUpdateFunc = /* @__PURE__ */ new Set();
  /**
   * @brief PropView constructor, accept a function that returns a list of DLNode
   * @param propViewFunc - A function that when called, collects and returns an array of DLNode instances
   */
  constructor(propViewFunc) {
    this.propViewFunc = propViewFunc;
  }
  /**
   * @brief Build the prop view by calling the propViewFunc and add every single instance of the returned DLNode to dlUpdateNodes
   * @returns An array of DLNode instances returned by propViewFunc
   */
  build() {
    let update2;
    const addUpdate = (updateFunc) => {
      update2 = updateFunc;
      this.dlUpdateFunc.add(updateFunc);
    };
    const newNodes = this.propViewFunc(addUpdate);
    if (newNodes.length === 0)
      return [];
    if (update2) {
      DLNode.addWillUnmount(newNodes[0], this.dlUpdateFunc.delete.bind(this.dlUpdateFunc, update2));
    }
    return newNodes;
  }
  /**
   * @brief Update every node in dlUpdateNodes
   * @param changed - A parameter indicating what changed to trigger the update
   */
  update(...args) {
    this.dlUpdateFunc.forEach((update2) => {
      update2(...args);
    });
  }
};
function insertChildren(el, propView) {
  insertNode(el, { _$nodes: propView.build(), _$dlNodeType: 7 }, 0);
}

// src/MutableNode/MutableNode.js
var MutableNode = class extends DLNode {
  /**
   * @brief Mutable node is a node that this._$nodes can be changed, things need to pay attention:
   *  1. The environment of the new nodes should be the same as the old nodes
   *  2. The new nodes should be added to the parentEl
   *  3. The old nodes should be removed from the parentEl
   * @param type
   */
  constructor(type) {
    super(type);
    const envNodeMap = DLStore.global.envNodeMap;
    if (envNodeMap) {
      this.savedEnvNodes = new Map([...envNodeMap]);
    }
  }
  /**
   * @brief Initialize the new nodes, add parentEl to all nodes
   * @param nodes
   */
  initNewNodes(nodes) {
    DLNode.addParentEl(nodes, this._$parentEl);
  }
  /**
   * @brief Generate new nodes in the saved environment
   * @param newNodesFunc
   * @returns
   */
  geneNewNodesInEnv(newNodesFunc) {
    if (!this.savedEnvNodes) {
      const newNodes2 = newNodesFunc();
      this.initNewNodes(newNodes2);
      return newNodes2;
    }
    const currentEnvNodes = DLStore.global.envNodeMap;
    replaceEnvNodes(this.savedEnvNodes);
    const newNodes = newNodesFunc();
    replaceEnvNodes(currentEnvNodes);
    this.initNewNodes(newNodes);
    return newNodes;
  }
  initUnmountStore() {
    DLStore.global.WillUnmountStore.push([]);
    DLStore.global.DidUnmountStore.push([]);
  }
  /**
   * @brief Remove nodes from parentEl and run willUnmount and didUnmount
   * @param nodes
   * @param removeEl Only remove outermost element
   */
  removeNodes(nodes) {
    DLNode.loopShallowEls(nodes, (node) => {
      this._$parentEl.removeChild(node);
    });
  }
};

// src/MutableNode/ForNode.js
var ForNode = class extends MutableNode {
  array;
  nodeFunc;
  depNum;
  nodesMap = /* @__PURE__ */ new Map();
  updateArr = [];
  /**
   * @brief Getter for nodes
   */
  get _$nodes() {
    const nodes = [];
    for (let idx = 0; idx < this.array.length; idx++) {
      nodes.push(...this.nodesMap.get(this.keys?.[idx] ?? idx));
    }
    return nodes;
  }
  /**
   * @brief Constructor, For type
   * @param array
   * @param nodeFunc
   * @param keys
   */
  constructor(array, depNum, keys, nodeFunc) {
    super(DLNodeType.For);
    this.array = [...array];
    this.keys = keys;
    this.depNum = depNum;
    this.addNodeFunc(nodeFunc);
  }
  /**
   * @brief To be called immediately after the constructor
   * @param nodeFunc
   */
  addNodeFunc(nodeFunc) {
    this.nodeFunc = nodeFunc;
    this.array.forEach((item, idx) => {
      this.initUnmountStore();
      const key = this.keys?.[idx] ?? idx;
      const nodes = nodeFunc(item, idx, this.updateArr);
      this.nodesMap.set(key, nodes);
      this.setUnmountMap(key);
    });
    ForNode.addWillUnmount(this, this.runAllWillUnmount.bind(this));
    ForNode.addDidUnmount(this, this.runAllDidUnmount.bind(this));
  }
  /**
   * @brief Update the view related to one item in the array
   * @param nodes
   * @param item
   */
  updateItem(idx, array, changed) {
    this.updateArr[idx]?.(changed ?? this.depNum, array[idx]);
  }
  updateItems(changed) {
    for (let idx = 0; idx < this.array.length; idx++) {
      this.updateItem(idx, this.array, changed);
    }
  }
  /**
   * @brief Non-array update function
   * @param changed
   */
  update(changed) {
    if (!(~this.depNum & changed))
      return;
    this.updateItems(changed);
  }
  /**
   * @brief Array-related update function
   * @param newArray
   * @param newKeys
   */
  updateArray(newArray, newKeys) {
    if (newKeys) {
      this.updateWithKey(newArray, newKeys);
      return;
    }
    this.updateWithOutKey(newArray);
  }
  /**
   * @brief Shortcut to generate new nodes with idx and key
   */
  getNewNodes(idx, key, array, updateArr) {
    this.initUnmountStore();
    const nodes = this.geneNewNodesInEnv(() => this.nodeFunc(array[idx], idx, updateArr ?? this.updateArr));
    this.setUnmountMap(key);
    this.nodesMap.set(key, nodes);
    return nodes;
  }
  /**
   * @brief Set the unmount map by getting the last unmount map from the global store
   * @param key
   */
  setUnmountMap(key) {
    const willUnmountMap = DLStore.global.WillUnmountStore.pop();
    if (willUnmountMap && willUnmountMap.length > 0) {
      if (!this.willUnmountMap)
        this.willUnmountMap = /* @__PURE__ */ new Map();
      this.willUnmountMap.set(key, willUnmountMap);
    }
    const didUnmountMap = DLStore.global.DidUnmountStore.pop();
    if (didUnmountMap && didUnmountMap.length > 0) {
      if (!this.didUnmountMap)
        this.didUnmountMap = /* @__PURE__ */ new Map();
      this.didUnmountMap.set(key, didUnmountMap);
    }
  }
  /**
   * @brief Run all the unmount functions and clear the unmount map
   */
  runAllWillUnmount() {
    if (!this.willUnmountMap || this.willUnmountMap.size === 0)
      return;
    this.willUnmountMap.forEach((funcs) => {
      for (let i = 0; i < funcs.length; i++)
        funcs[i]?.();
    });
    this.willUnmountMap.clear();
  }
  /**
   * @brief Run all the unmount functions and clear the unmount map
   */
  runAllDidUnmount() {
    if (!this.didUnmountMap || this.didUnmountMap.size === 0)
      return;
    this.didUnmountMap.forEach((funcs) => {
      for (let i = funcs.length - 1; i >= 0; i--)
        funcs[i]?.();
    });
    this.didUnmountMap.clear();
  }
  /**
   * @brief Run the unmount functions of the given key
   * @param key
   */
  runWillUnmount(key) {
    if (!this.willUnmountMap || this.willUnmountMap.size === 0)
      return;
    const funcs = this.willUnmountMap.get(key);
    if (!funcs)
      return;
    for (let i = 0; i < funcs.length; i++)
      funcs[i]?.();
    this.willUnmountMap.delete(key);
  }
  /**
   * @brief Run the unmount functions of the given key
   */
  runDidUnmount(key) {
    if (!this.didUnmountMap || this.didUnmountMap.size === 0)
      return;
    const funcs = this.didUnmountMap.get(key);
    if (!funcs)
      return;
    for (let i = funcs.length - 1; i >= 0; i--)
      funcs[i]?.();
    this.didUnmountMap.delete(key);
  }
  /**
   * @brief Remove nodes from parentEl and run willUnmount and didUnmount
   * @param nodes
   * @param key
   */
  removeNodes(nodes, key) {
    this.runWillUnmount(key);
    super.removeNodes(nodes);
    this.runDidUnmount(key);
    this.nodesMap.delete(key);
  }
  /**
   * @brief Update the nodes without keys
   * @param newArray
   */
  updateWithOutKey(newArray) {
    const preLength = this.array.length;
    const currLength = newArray.length;
    if (preLength === currLength) {
      for (let idx = 0; idx < this.array.length; idx++) {
        this.updateItem(idx, newArray);
      }
      this.array = [...newArray];
      return;
    }
    const parentEl = this._$parentEl;
    if (preLength < currLength) {
      let flowIndex = ForNode.getFlowIndexFromNodes(parentEl._$nodes, this);
      const length = parentEl.childNodes.length;
      for (let idx = 0; idx < currLength; idx++) {
        if (idx < preLength) {
          flowIndex += ForNode.getFlowIndexFromNodes(this.nodesMap.get(idx));
          this.updateItem(idx, newArray);
          continue;
        }
        const newNodes = this.getNewNodes(idx, idx, newArray);
        ForNode.appendNodesWithIndex(newNodes, parentEl, flowIndex, length);
      }
      ForNode.runDidMount();
      this.array = [...newArray];
      return;
    }
    for (let idx = 0; idx < currLength; idx++) {
      this.updateItem(idx, newArray);
    }
    for (let idx = currLength; idx < preLength; idx++) {
      const nodes = this.nodesMap.get(idx);
      this.removeNodes(nodes, idx);
    }
    this.updateArr.splice(currLength, preLength - currLength);
    this.array = [...newArray];
  }
  /**
   * @brief Update the nodes with keys
   * @param newArray
   * @param newKeys
   */
  updateWithKey(newArray, newKeys) {
    if (newKeys.length !== new Set(newKeys).size) {
      throw new Error("Inula-Next: Duplicate keys in for loop are not allowed");
    }
    const prevKeys = this.keys;
    this.keys = newKeys;
    if (ForNode.arrayEqual(prevKeys, this.keys)) {
      for (let idx = 0; idx < newArray.length; idx++) {
        this.updateItem(idx, newArray);
      }
      this.array = [...newArray];
      return;
    }
    const parentEl = this._$parentEl;
    if (this.keys.length === 0) {
      const parentNodes = parentEl._$nodes ?? [];
      if (parentNodes.length === 1 && parentNodes[0] === this) {
        this.runAllWillUnmount();
        parentEl.innerHTML = "";
        this.runAllDidUnmount();
      } else {
        for (let prevIdx = 0; prevIdx < prevKeys.length; prevIdx++) {
          const prevKey = prevKeys[prevIdx];
          this.removeNodes(this.nodesMap.get(prevKey), prevKey);
        }
      }
      this.nodesMap.clear();
      this.updateArr = [];
      this.array = [];
      return;
    }
    const flowIndex = ForNode.getFlowIndexFromNodes(parentEl._$nodes, this);
    if (prevKeys.length === 0) {
      const nextSibling = parentEl.childNodes[flowIndex];
      for (let idx = 0; idx < this.keys.length; idx++) {
        const newNodes = this.getNewNodes(idx, this.keys[idx], newArray);
        ForNode.appendNodesWithSibling(newNodes, parentEl, nextSibling);
      }
      ForNode.runDidMount();
      this.array = [...newArray];
      return;
    }
    const shuffleKeys = [];
    const newUpdateArr = [];
    for (let prevIdx = 0; prevIdx < prevKeys.length; prevIdx++) {
      const prevKey = prevKeys[prevIdx];
      if (this.keys.includes(prevKey)) {
        shuffleKeys.push(prevKey);
        newUpdateArr.push(this.updateArr[prevIdx]);
        continue;
      }
      this.removeNodes(this.nodesMap.get(prevKey), prevKey);
    }
    let length = parentEl.childNodes.length;
    let newFlowIndex = flowIndex;
    for (let idx = 0; idx < this.keys.length; idx++) {
      const key = this.keys[idx];
      const prevIdx = shuffleKeys.indexOf(key);
      if (prevIdx !== -1) {
        newFlowIndex += ForNode.getFlowIndexFromNodes(this.nodesMap.get(key));
        newUpdateArr[prevIdx]?.(this.depNum, newArray[idx]);
        continue;
      }
      newUpdateArr.splice(idx, 0, null);
      const newNodes = this.getNewNodes(idx, key, newArray, newUpdateArr);
      shuffleKeys.splice(idx, 0, key);
      const count = ForNode.appendNodesWithIndex(newNodes, parentEl, newFlowIndex, length);
      newFlowIndex += count;
      length += count;
    }
    ForNode.runDidMount();
    if (ForNode.arrayEqual(this.keys, shuffleKeys)) {
      this.array = [...newArray];
      this.updateArr = newUpdateArr;
      return;
    }
    newFlowIndex = flowIndex;
    const bufferNodes = /* @__PURE__ */ new Map();
    for (let idx = 0; idx < this.keys.length; idx++) {
      const key = this.keys[idx];
      const prevIdx = shuffleKeys.indexOf(key);
      const bufferedNode = bufferNodes.get(key);
      if (bufferedNode) {
        const bufferedFlowIndex = ForNode.getFlowIndexFromNodes(bufferedNode);
        const lastEl = ForNode.toEls(bufferedNode).pop();
        const nextSibling = parentEl.childNodes[newFlowIndex + bufferedFlowIndex];
        if (lastEl !== nextSibling && lastEl.nextSibling !== nextSibling) {
          ForNode.insertNodesBefore(bufferedNode, parentEl, nextSibling);
        }
        newFlowIndex += bufferedFlowIndex;
        delete bufferNodes[idx];
      } else if (prevIdx === idx) {
        newFlowIndex += ForNode.getFlowIndexFromNodes(this.nodesMap.get(key));
        continue;
      } else {
        const prevKey = shuffleKeys[idx];
        bufferNodes.set(prevKey, this.nodesMap.get(prevKey));
        const childNodes = this.nodesMap.get(key);
        const lastEl = ForNode.toEls(childNodes).pop();
        const nextSibling = parentEl.childNodes[newFlowIndex];
        if (lastEl !== nextSibling && lastEl.nextSibling !== nextSibling) {
          newFlowIndex += ForNode.insertNodesBefore(childNodes, parentEl, nextSibling);
        }
      }
      const tempKey = shuffleKeys[idx];
      shuffleKeys[idx] = shuffleKeys[prevIdx];
      shuffleKeys[prevIdx] = tempKey;
      const tempUpdateFunc = newUpdateArr[idx];
      newUpdateArr[idx] = newUpdateArr[prevIdx];
      newUpdateArr[prevIdx] = tempUpdateFunc;
    }
    this.array = [...newArray];
    this.updateArr = newUpdateArr;
  }
  /**
   * @brief Compare two arrays
   * @param arr1
   * @param arr2
   * @returns
   */
  static arrayEqual(arr1, arr2) {
    if (arr1.length !== arr2.length)
      return false;
    return arr1.every((item, idx) => item === arr2[idx]);
  }
};

// src/MutableNode/FlatNode.js
var FlatNode = class extends MutableNode {
  willUnmountFuncs = [];
  didUnmountFuncs = [];
  setUnmountFuncs() {
    this.willUnmountFuncs = DLStore.global.WillUnmountStore.pop();
    this.didUnmountFuncs = DLStore.global.DidUnmountStore.pop();
  }
  runWillUnmount() {
    for (let i = 0; i < this.willUnmountFuncs.length; i++)
      this.willUnmountFuncs[i]();
  }
  runDidUnmount() {
    for (let i = this.didUnmountFuncs.length - 1; i >= 0; i--)
      this.didUnmountFuncs[i]();
  }
  removeNodes(nodes) {
    this.runWillUnmount();
    super.removeNodes(nodes);
    this.runDidUnmount();
  }
  geneNewNodesInEnv(newNodesFunc) {
    this.initUnmountStore();
    const nodes = super.geneNewNodesInEnv(newNodesFunc);
    this.setUnmountFuncs();
    return nodes;
  }
};

// src/MutableNode/ExpNode.js
var ExpNode = class extends FlatNode {
  /**
   * @brief Constructor, Exp type, accept a function that returns a list of nodes
   * @param nodesFunc
   */
  constructor(value, deps) {
    super(DLNodeType.Exp);
    this.initUnmountStore();
    this._$nodes = ExpNode.formatNodes(value);
    this.setUnmountFuncs();
    this.deps = this.parseDeps(deps);
    ExpNode.addWillUnmount(this, this.runWillUnmount.bind(this));
    ExpNode.addDidUnmount(this, this.runDidUnmount.bind(this));
  }
  parseDeps(deps) {
    return deps.map((dep) => {
      if (dep?.prototype?._$init)
        return dep.toString();
      if (dep?.propViewFunc)
        return dep.propViewFunc.toString();
      return dep;
    });
  }
  cache(deps) {
    if (!deps || !deps.length)
      return false;
    deps = this.parseDeps(deps);
    if (cached(deps, this.deps))
      return true;
    this.deps = deps;
    return false;
  }
  /**
   * @brief Generate new nodes and replace the old nodes
   */
  update(valueFunc, deps) {
    if (this.cache(deps))
      return;
    this.removeNodes(this._$nodes);
    const newNodes = this.geneNewNodesInEnv(() => ExpNode.formatNodes(valueFunc()));
    if (newNodes.length === 0) {
      this._$nodes = [];
      return;
    }
    const parentEl = this._$parentEl;
    const flowIndex = ExpNode.getFlowIndexFromNodes(parentEl._$nodes, this);
    const nextSibling = parentEl.childNodes[flowIndex];
    ExpNode.appendNodesWithSibling(newNodes, parentEl, nextSibling);
    ExpNode.runDidMount();
    this._$nodes = newNodes;
  }
  /**
   * @brief Format the nodes
   * @param nodes
   * @returns New nodes
   */
  static formatNodes(nodes) {
    if (!Array.isArray(nodes))
      nodes = [nodes];
    return nodes.flat(1).filter((node) => node !== void 0 && node !== null && typeof node !== "boolean").map((node) => {
      if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") {
        return DLStore.document.createTextNode(`${node}`);
      }
      if ("propViewFunc" in node)
        return node.build();
      return node;
    }).flat(1);
  }
};

// src/MutableNode/CondNode.js
var CondNode = class extends FlatNode {
  /**
   * @brief Constructor, If type, accept a function that returns a list of nodes
   * @param caseFunc
   */
  constructor(depNum, condFunc) {
    super(DLNodeType.Cond);
    this.depNum = depNum;
    this.cond = -1;
    this.condFunc = condFunc;
    this.initUnmountStore();
    this._$nodes = this.condFunc(this);
    this.setUnmountFuncs();
    CondNode.addWillUnmount(this, this.runWillUnmount.bind(this));
    CondNode.addDidUnmount(this, this.runDidUnmount.bind(this));
  }
  /**
   * @brief Update the nodes in the environment
   */
  updateCond(key) {
    const prevFuncs = [this.willUnmountFuncs, this.didUnmountFuncs];
    const newNodes = this.geneNewNodesInEnv(() => this.condFunc(this));
    if (this.didntChange) {
      [this.willUnmountFuncs, this.didUnmountFuncs] = prevFuncs;
      this.didntChange = false;
      this.updateFunc?.(this.depNum, key);
      return;
    }
    const newFuncs = [this.willUnmountFuncs, this.didUnmountFuncs];
    [this.willUnmountFuncs, this.didUnmountFuncs] = prevFuncs;
    this._$nodes && this._$nodes.length > 0 && this.removeNodes(this._$nodes);
    [this.willUnmountFuncs, this.didUnmountFuncs] = newFuncs;
    if (newNodes.length === 0) {
      this._$nodes = [];
      return;
    }
    const parentEl = this._$parentEl;
    const flowIndex = CondNode.getFlowIndexFromNodes(parentEl._$nodes, this);
    const nextSibling = parentEl.childNodes[flowIndex];
    CondNode.appendNodesWithSibling(newNodes, parentEl, nextSibling);
    CondNode.runDidMount();
    this._$nodes = newNodes;
  }
  /**
   * @brief The update function of IfNode's childNodes is stored in the first child node
   * @param changed
   */
  update(changed) {
    if (!(~this.depNum & changed))
      return;
    this.updateFunc?.(changed);
  }
};

// src/MutableNode/TryNode.js
var TryNode = class extends FlatNode {
  constructor(tryFunc, catchFunc) {
    super(DLNodeType.Try);
    this.tryFunc = tryFunc;
    const catchable = this.getCatchable(catchFunc);
    this.envNode = new ContextProvider({ _$catchable: catchable });
    const nodes = tryFunc(this.setUpdateFunc.bind(this), catchable) ?? [];
    this.envNode.initNodes(nodes);
    this._$nodes = nodes;
  }
  update(changed) {
    this.updateFunc?.(changed);
  }
  setUpdateFunc(updateFunc) {
    this.updateFunc = updateFunc;
  }
  getCatchable(catchFunc) {
    return (callback) => (...args) => {
      try {
        return callback(...args);
      } catch (e) {
        Promise.resolve().then(() => {
          const nodes = this.geneNewNodesInEnv(() => catchFunc(this.setUpdateFunc.bind(this), e));
          this._$nodes && this.removeNodes(this._$nodes);
          const parentEl = this._$parentEl;
          const flowIndex = FlatNode.getFlowIndexFromNodes(parentEl._$nodes, this);
          const nextSibling = parentEl.childNodes[flowIndex];
          FlatNode.appendNodesWithSibling(nodes, parentEl, nextSibling);
          FlatNode.runDidMount();
          this._$nodes = nodes;
        });
      }
    };
  }
};

// src/index.js
function initStore() {
  DLStore.global.WillUnmountStore = [];
  DLStore.global.DidUnmountStore = [];
}
function render(compFn, idOrEl) {
  let el = idOrEl;
  if (typeof idOrEl === "string") {
    const elFound = DLStore.document.getElementById(idOrEl);
    if (elFound)
      el = elFound;
    else {
      throw new Error(`Inula-Next: Element with id ${idOrEl} not found`);
    }
  }
  initStore();
  el.innerHTML = "";
  const dlNode = Comp(compFn);
  insertNode(el, dlNode, 0);
  DLNode.runDidMount();
}
function untrack(callback) {
  return callback();
}
var required = null;
function use() {
  console.error(
    "Inula-Next: use() is not supported be called directly. You can only assign `use(model)` to a Inula-Next class property. Any other expressions are not allowed."
  );
}
var currentComp = null;
function inMount() {
  return !!currentComp;
}
function Comp(compFn, props = {}) {
  return mountNode(() => new CompNode(), compFn, props);
}
function mountNode(ctor, compFn, props) {
  const compNode = ctor();
  let prevNode = currentComp;
  try {
    currentComp = compNode;
    compFn(props);
  } catch (err) {
    throw err;
  } finally {
    currentComp = prevNode;
  }
  return compNode;
}
function createComponent(compUpdater) {
  if (!currentComp) {
    throw new Error("Should not call createComponent outside the component function");
  }
  currentComp.setUpdateFunc(compUpdater);
  return currentComp;
}
function notCached(node, cacheSymbol, cacheValues) {
  if (!cacheValues || !cacheValues.length)
    return false;
  if (!node.$nonkeyedCache) {
    node.$nonkeyedCache = {};
  }
  if (!cached(cacheValues, node.$nonkeyedCache[cacheSymbol])) {
    return true;
  }
  node.$nonkeyedCache[cacheSymbol] = cacheValues;
  return false;
}
function didMount() {
  throw new Error("lifecycle should be compiled, check the babel plugin");
}
function willUnmount() {
  throw new Error("lifecycle should be compiled, check the babel plugin");
}
function didUnMount() {
  throw new Error("lifecycle should be compiled, check the babel plugin");
}
function createContext(defaultVal) {
  return {
    id: Symbol("inula-ctx"),
    value: defaultVal
  };
}
function useContext(ctx, key) {
  const envNodeMap = DLStore.global.envNodeMap;
  if (envNodeMap) {
    const envNode = envNodeMap.get(ctx.id);
    if (envNode) {
      envNode.addNode(currentComp);
    }
  }
  if (key) {
    return ctx.value[key];
  }
  return ctx.value;
}
function useHook(hookFn, params, bitMap) {
  if (currentComp) {
    const props = params.reduce((obj, val, idx) => ({ ...obj, [`p${idx}`]: val }), {});
    return mountNode(() => new HookNode(currentComp, bitMap), hookFn, props);
  }
}
function createHook(compUpdater) {
  if (!currentComp) {
    throw new Error("Should not call createComponent outside the component function");
  }
  currentComp.setUpdateFunc(compUpdater);
  return currentComp;
}
function runOnce(fn) {
  if (currentComp) {
    fn();
  }
}
export {
  Comp,
  CompNode,
  CondNode,
  ContextProvider,
  ExpNode,
  ForNode,
  PropView,
  TryNode,
  View,
  createComponent,
  createContext,
  createElement,
  createHook,
  createTextNode,
  delegateEvent,
  didMount,
  didUnMount,
  forwardHTMLProp,
  inMount,
  insertChildren,
  insertNode,
  notCached,
  render,
  replaceEnvNodes,
  required,
  runOnce,
  setDataset,
  setDocument,
  setEvent,
  setGlobal,
  setHTMLAttr,
  setHTMLAttrs,
  setHTMLProp,
  setHTMLProps,
  setStyle,
  untrack,
  update,
  updateText,
  use,
  useContext,
  useHook,
  willUnmount
};
//# sourceMappingURL=index.js.map