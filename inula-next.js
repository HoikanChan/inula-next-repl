// src/store.ts
var Store = {};
if (!("global" in Store)) {
  if (globalThis) {
    Store.global = globalThis;
  } else {
    Store.global = {};
  }
}
if (!("document" in Store)) {
  if (typeof document !== "undefined") {
    Store.document = document;
  }
}
var InulaStore = { ...Store, delegatedEvents: /* @__PURE__ */ new Set() };

// src/lifecycle.ts
var addDidMount = (func) => {
  if (!InulaStore.global.DidMountStore)
    InulaStore.global.DidMountStore = [];
  InulaStore.global.DidMountStore.push(func);
};
var addWillUnmount = (func) => {
  if (!InulaStore.global.WillUnmountScopedStore)
    InulaStore.global.WillUnmountScopedStore = [];
  const currentStore = InulaStore.global.WillUnmountScopedStore[InulaStore.global.WillUnmountScopedStore.length - 1];
  if (!currentStore)
    return;
  currentStore.push(func);
};
var addDidUnmount = (func) => {
  if (!InulaStore.global.DidUnmountScopedStore)
    InulaStore.global.DidUnmountScopedStore = [];
  const currentStore = InulaStore.global.DidUnmountScopedStore[InulaStore.global.DidUnmountScopedStore.length - 1];
  if (!currentStore)
    return;
  currentStore.push(func);
};
var runDidMount = () => {
  const didMountStore = InulaStore.global.DidMountStore;
  if (!didMountStore || didMountStore.length === 0)
    return;
  for (let i = didMountStore.length - 1; i >= 0; i--) {
    didMountStore[i]();
  }
  InulaStore.global.DidMountStore = void 0;
};

// src/scheduler.ts
var p = Promise.resolve();
function schedule(task) {
  p.then(task);
}

// src/Nodes/utils.ts
var getDOMElements = (node) => {
  return toDOMElements(node.nodes ?? []);
};
function createElement(tagName) {
  return document.createElement(tagName);
}
var toDOMElements = (nodes) => {
  const elements = [];
  loopShallowElements(nodes, (el) => {
    elements.push(el);
  });
  return elements;
};
var loopShallowElements = (nodes, runFunc) => {
  const stack = [...nodes].reverse();
  while (stack.length > 0) {
    const node = stack.pop();
    if (node == null)
      continue;
    if (node instanceof HTMLElement || node instanceof Text) {
      runFunc(node);
    } else if (node.nodes) {
      stack.push(...[...node.nodes].reverse());
    }
  }
};
var addParentElement = (nodes, parentEl) => {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if ("inulaType" in node) {
      node.parentEl = parentEl;
      node.nodes && addParentElement(node.nodes, parentEl);
    }
  }
};
var getFlowIndexFromNodes = (nodes, stopNode) => {
  let index = 0;
  const stack = [...nodes].reverse();
  while (stack.length > 0) {
    const node = stack.pop();
    if (node === stopNode)
      break;
    if ("inulaType" in node) {
      node.nodes && stack.push(...[...node.nodes].reverse());
    } else {
      index++;
    }
  }
  return index;
};
var appendNodesWithSibling = (nodes, parentEl, nextSibling) => {
  if (nextSibling)
    return insertNodesBefore(nodes, parentEl, nextSibling);
  return appendNodes(nodes, parentEl);
};
var appendNodesWithIndex = (nodes, parentEl, index, length) => {
  length = length ?? parentEl.childNodes.length;
  if (length !== index)
    return insertNodesBefore(nodes, parentEl, parentEl.childNodes[index]);
  return appendNodes(nodes, parentEl);
};
var insertNodesBefore = (nodes, parentEl, nextSibling) => {
  let count = 0;
  loopShallowElements(nodes, (el) => {
    parentEl.insertBefore(el, nextSibling);
    count++;
  });
  return count;
};
var appendNodes = (nodes, parentEl) => {
  let count = 0;
  loopShallowElements(nodes, (el) => {
    parentEl.appendChild(el);
    count++;
  });
  return count;
};
var arrayEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length)
    return false;
  return arr1.every((item, idx) => item === arr2[idx]);
};
var cached = (deps, prevDeps) => {
  if (prevDeps && prevDeps.length === 0)
    return false;
  if (!prevDeps || deps.length !== prevDeps.length)
    return false;
  return deps.every((dep, i) => !(dep instanceof Object) && prevDeps[i] === dep);
};
var InitDirtyBitsMask = 4294967295;
var update = (node) => {
  node.update?.(node);
};
var willReact = (dirtyBits, reactBits) => {
  return reactBits === 0 || reactBits & dirtyBits;
};
var init = (nodes) => {
  for (let i = 0; i < nodes.length; i++) {
    update(nodes[i], InitDirtyBitsMask);
  }
};
function withDefault(value, defaultValue) {
  return value === void 0 ? defaultValue : value;
}

// src/Nodes/CompNode/node.ts
var BUILTIN_PROPS = ["ref", "key"];
var compStack = [];
function getCurrentCompNode() {
  return compStack[compStack.length - 1];
}
function enterCompNode(compNode) {
  compStack.push(compNode);
}
function leaveCompNode() {
  compStack.pop();
}
var ReactiveNode = class {
  cachedDependenciesMap;
  computations;
  derivedCount;
  owner;
  constructor() {
    this.owner = getCurrentCompNode();
  }
  deriveState(updateDerivedFunc, dependenciesFunc, reactBits) {
    if (!this.computations)
      this.computations = [];
    updateDerivedFunc();
    if (!this.cachedDependenciesMap)
      this.cachedDependenciesMap = {};
    if (this.derivedCount === void 0)
      this.derivedCount = 0;
    const cacheKey = `derived$${this.derivedCount}`;
    this.cachedDependenciesMap[cacheKey] = dependenciesFunc();
    this.computations.push([updateDerivedFunc, dependenciesFunc, reactBits, cacheKey]);
    this.derivedCount++;
  }
  watch(updateDerivedFunc, dependenciesFunc, reactBits) {
    this.deriveState(updateDerivedFunc, dependenciesFunc, reactBits);
  }
  updateState(dirty) {
    if (!this.computations)
      return;
    for (let i = 0; i < this.computations.length; i++) {
      const computation = this.computations[i];
      if (computation.length === 1) {
        const [updateFn] = computation;
        updateFn();
        continue;
      }
      const [updateDerivedFunc, dependenciesFunc, reactBits, cacheKey] = computation;
      if (!reactBits) {
        updateDerivedFunc();
        continue;
      }
      if (!(dirty & reactBits))
        continue;
      const dependencies = dependenciesFunc();
      const cachedDeps = this.cachedDependenciesMap?.[cacheKey];
      if (cached(dependencies, cachedDeps))
        continue;
      updateDerivedFunc();
      this.cachedDependenciesMap[cacheKey] = dependencies;
    }
  }
  // ---- Out of component update START ----
  // ---- PROPS START ----
  updatePropMap;
  addProp(propName, updatePropFunc, waveBits) {
    if (!this.updatePropMap)
      this.updatePropMap = {};
    this.updatePropMap[propName] = [updatePropFunc, waveBits];
  }
  updateProp(propName, valueFunc, dependencies, reactBits) {
    if (BUILTIN_PROPS.includes(propName)) {
      return;
    }
    if (!this.updatePropMap)
      return;
    if (!(reactBits & this.owner.dirtyBits))
      return;
    const cacheKey = `prop$${propName}`;
    const cachedDeps = this.cachedDependenciesMap?.[cacheKey];
    if (cached(dependencies, cachedDeps))
      return;
    if (this.updatePropMap["$whole$"]) {
      const [updatePropFunc, waveBits] = this.updatePropMap["$whole$"];
      if (propName === "*spread*") {
        this.wave(updatePropFunc(valueFunc()), waveBits);
      } else {
        this.wave(updatePropFunc({ [propName]: valueFunc() }), waveBits);
      }
    } else if (this.updatePropMap[propName]) {
      const [updatePropFunc, waveBits] = this.updatePropMap[propName];
      this.wave(updatePropFunc(valueFunc()), waveBits);
    } else {
      const [updatePropFunc, waveBits] = this.updatePropMap["$rest$"];
      this.wave(updatePropFunc({ [propName]: valueFunc() }), waveBits);
    }
    if (!this.cachedDependenciesMap)
      this.cachedDependenciesMap = {};
    this.cachedDependenciesMap[cacheKey] = dependencies;
  }
  // ---- PROP END ----
  // ---- CONTEXT START ----
  updateContextMap;
  addContext(context, contextName, updateContextFunc, waveBits) {
    if (!this.updateContextMap)
      this.updateContextMap = {};
    this.updateContextMap[contextName] = [context.id, updateContextFunc, waveBits];
  }
  updateContext(contextId, contextName, value) {
    if (!this.updateContextMap || !(contextName in this.updateContextMap))
      return;
    const [expectedContextId, updateContextFunc, waveBits] = this.updateContextMap[contextName];
    if (contextId !== expectedContextId)
      return;
    this.wave(updateContextFunc(value), waveBits);
  }
  // ---- CONTEXT END ----
  // ---- HOOKS START ----
  useHook(hookNode, updateHookReturn, hookUpdater) {
    updateHookReturn(hookNode.value());
    hookNode.triggerUpdate = () => {
      updateHookReturn(hookNode.value());
    };
    hookUpdater(hookNode);
    if (!this.computations)
      this.computations = [];
    if (this.derivedCount === void 0)
      this.derivedCount = 0;
    this.computations.push([
      () => {
        hookUpdater(hookNode);
      }
    ]);
  }
  // ---- HOOKS END ----
  // ---- Lifecycles
  didMount(fn) {
    addDidMount(fn);
  }
  willUnmount(fn) {
    addWillUnmount(fn);
  }
  didUnmount(fn) {
    addDidUnmount(fn);
  }
};
var CompNode = class extends ReactiveNode {
  inulaType = 0 /* Comp */;
  // ---- All children nodes
  nodes;
  // ---- Update functions
  updater;
  subComponents;
  slices;
  constructor(parentComponents) {
    super();
    for (let i = 0; i < parentComponents.length; i++) {
      if (parentComponents[i].subComponents) {
        parentComponents[i].subComponents.push(this);
      } else {
        parentComponents[i].subComponents = [this];
      }
    }
    this.dirtyBits = InitDirtyBitsMask;
  }
  // ---- In component update START----
  wave(_, dirty) {
    if (this.dirtyBits && this.dirtyBits !== InitDirtyBitsMask) {
      this.dirtyBits |= dirty;
      return;
    }
    this.dirtyBits = dirty;
    this.updateState(dirty);
    this.updateViewAsync(dirty);
  }
  dirtyBits;
  /**
   * @brief Update view asynchronously
   * @param dirty
   * @returns
   */
  updateViewAsync(dirty) {
    schedule(() => {
      for (let i = 0; i < (this.nodes?.length ?? 0); i++) {
        update(this.nodes[i]);
      }
      for (let i = 0; i < (this.subComponents?.length ?? 0); i++) {
        this.subComponents[i].wave(null, dirty);
      }
      for (let i = 0; i < (this.slices?.length ?? 0); i++) {
        update(this.slices[i]);
      }
      delete this.dirtyBits;
    });
  }
  prepare() {
    return this;
  }
  init(node) {
    this.nodes = [node];
    compStack.pop();
    delete this.dirtyBits;
    return this;
  }
  update() {
    this.updater?.(this);
  }
};
var compBuilder = (...parentComponents) => {
  const comp = new CompNode(parentComponents);
  enterCompNode(comp);
  return comp;
};
var createCompNode = (compFn, props, updater) => {
  if (props && props["*spread*"]) {
    const spreadProps = props["*spread*"];
    delete props["*spread*"];
    Object.assign(props, spreadProps);
  }
  const compNode = compFn(props);
  if (updater)
    compNode.updater = updater;
  return compNode;
};
function createChildren(nodesFn, compNode) {
  const getter = () => {
    enterCompNode(compNode);
    let children = nodesFn();
    leaveCompNode();
    if (!Array.isArray(children)) {
      children = [children];
    }
    if (compNode.slices) {
      compNode.slices.push(...children);
    } else {
      compNode.slices = [...children];
    }
    return children;
  };
  getter.$$isChildren = true;
  return getter;
}

// src/Nodes/HTMLNode/utils.ts
var insertNode = (el, node, position) => {
  if (node == null)
    return;
  if (!el.nodes)
    el.nodes = Array.from(el.childNodes);
  el.nodes.splice(position, 0, node);
  const flowIdx = getFlowIndexFromNodes(el.nodes, node);
  appendNodesWithIndex([node], el, flowIdx);
  addParentElement([node], el);
};
var shouldUpdate = (node, key, dependencies, reactBits) => {
  if (!willReact(node.__$owner.dirtyBits, reactBits))
    return false;
  if (cached(dependencies, node[`c$${key}`]))
    return false;
  node[`c$${key}`] = dependencies;
  return true;
};
var getElementByPosition = (element, ...positions) => {
  let current = element;
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    if (i < 2) {
      if (pos === 0) {
        current = current.firstChild;
      } else {
        let temp = current.firstChild;
        for (let j = 0; j < pos; j++) {
          temp = temp.nextSibling;
        }
        current = temp;
      }
    } else {
      current = current.childNodes[pos];
    }
  }
  return current;
};

// src/Nodes/HTMLNode/html.ts
var createHTMLNode = (tag, update2, ...childrenNodes) => {
  const node = InulaStore.document.createElement(tag);
  node.update = _update.bind(null, node, update2);
  node.__$owner = getCurrentCompNode();
  update2?.(node);
  node.nodes = childrenNodes;
  appendNodes(childrenNodes, node);
  addParentElement(childrenNodes, node);
  return node;
};
var _update = (node, htmlUpdate) => {
  htmlUpdate?.(node);
  for (let i = 0; i < (node.nodes?.length ?? 0); i++) {
    update(node.nodes[i]);
  }
};
var _setHTMLProp = (node, key, value) => {
  node[key] = value;
};
var isCustomProperty = (name) => name.startsWith("--");
var _setStyle = (node, newStyle) => {
  const style = node.style;
  const prevStyle = node.prevStyle ?? {};
  for (const key in prevStyle) {
    if (prevStyle.hasOwnProperty(key) && (!newStyle || !newStyle.hasOwnProperty(key))) {
      if (isCustomProperty(key)) {
        style.removeProperty(key);
      } else if (key === "float") {
        style.cssFloat = "";
      } else {
        style[key] = "";
      }
    }
  }
  for (const key in newStyle) {
    const prevValue = prevStyle[key];
    const newValue = newStyle[key];
    if (newStyle.hasOwnProperty(key) && newValue !== prevValue) {
      if (newValue == null || newValue === "" || typeof newValue === "boolean") {
        if (isCustomProperty(key)) {
          style.removeProperty(key);
        } else if (key === "float") {
          style.cssFloat = "";
        } else {
          style[key] = "";
        }
      } else if (isCustomProperty(key)) {
        style.setProperty(key, newValue);
      } else if (key === "float") {
        style.cssFloat = newValue;
      } else if (typeof newValue === "number") {
        node.style[key] = newValue + "px";
      } else {
        node.style[key] = newValue;
      }
    }
  }
  node.prevStyle = { ...newStyle };
};
var _setDataset = (node, value) => {
  Object.assign(node.dataset, value);
};
var _setHTMLProps = (node, value) => {
  Object.entries(value).forEach(([key, v]) => {
    if (key === "style")
      return _setStyle(node, v);
    if (key === "dataset")
      return _setDataset(node, v);
    _setHTMLProp(node, key, v);
  });
};
var _setHTMLAttr = (node, key, value) => {
  if (key === "className") {
    node.setAttribute("class", value);
  } else {
    node.setAttribute(key, value);
  }
};
var _setHTMLAttrs = (node, value) => {
  Object.entries(value).forEach(([key, v]) => {
    if (key === "style")
      return _setStyle(node, v);
    if (key === "ref")
      return setRef(node, v);
    _setHTMLAttr(node, key, v);
  });
};
var _setEvent = (node, key, value) => {
  const prevEvent = node[`me$${key}`];
  if (prevEvent)
    node.removeEventListener(key, prevEvent);
  node.addEventListener(key, value);
  node[`me$${key}`] = value;
};
var eventHandler = (e) => {
  const key = `de$${e.type}`;
  for (const node of e.composedPath()) {
    if (node[key])
      node[key](e);
    if (e.cancelBubble)
      return;
  }
};
var _delegateEvent = (node, key, value) => {
  if (node[`de$${key}`])
    return;
  node[`de$${key}`] = value;
  if (!InulaStore.delegatedEvents.has(key)) {
    InulaStore.delegatedEvents.add(key);
    InulaStore.document.addEventListener(key, eventHandler);
  }
};
var setHTMLProp = (node, key, valueFunc, dependencies, reactBits) => {
  if (!shouldUpdate(node, key, dependencies, reactBits))
    return;
  _setHTMLProp(node, key, valueFunc());
};
var setStyle = (node, newStyleFunc, dependencies, reactBits) => {
  if (reactBits) {
    if (!shouldUpdate(node, "style", dependencies, reactBits))
      return;
    _setStyle(node, newStyleFunc());
  } else {
    _setStyle(node, newStyleFunc);
  }
};
var setDataset = (node, valueFunc, dependencies, reactBits) => {
  if (!shouldUpdate(node, "dataset", dependencies, reactBits))
    return;
  _setDataset(node, valueFunc());
};
var setHTMLProps = (node, valueFunc, dependencies, reactBits) => {
  if (reactBits) {
    if (!shouldUpdate(node, "htmlProps", dependencies, reactBits))
      return;
    _setHTMLProps(node, valueFunc());
  } else {
    _setHTMLProps(node, valueFunc);
  }
};
var setHTMLAttrs = (node, valueFunc, dependencies, reactBits) => {
  if (!shouldUpdate(node, "htmlAttrs", dependencies, reactBits))
    return;
  _setHTMLAttrs(node, valueFunc());
};
var setHTMLAttr = (node, key, valueFunc, dependencies, reactBits) => {
  if (reactBits) {
    if (!shouldUpdate(node, "htmlAttrs", dependencies, reactBits))
      return;
    _setHTMLAttr(node, key, valueFunc());
  } else {
    _setHTMLProps(node, valueFunc);
  }
};
var setEvent = _setEvent;
var delegateEvent = _delegateEvent;
function setRef(node, refFn) {
  if (node.__$owner.dirtyBits === InitDirtyBitsMask) {
    refFn();
  }
}

// src/Nodes/HTMLNode/text.ts
var createTextNode = (text, update2) => {
  const node = InulaStore.document.createTextNode(text);
  node.update = update2;
  node.__$owner = getCurrentCompNode();
  return node;
};
var _setText = (node, text) => {
  node.textContent = text;
};
var setText = (node, text, dependencies, reactBits) => {
  if (!shouldUpdate(node, "text", dependencies, reactBits))
    return;
  _setText(node, text);
};

// src/Nodes/HTMLNode/template.ts
var createTemplate = (template) => {
  const templateElement = InulaStore.document.createElement("template");
  templateElement.innerHTML = template;
  return templateElement.content.children[0];
};
var createTemplateNode = (template, getUpdater, ...nodesToInsert) => {
  const node = template.cloneNode(true);
  node.__$owner = getCurrentCompNode();
  const updater = getUpdater?.(node) ?? null;
  node.update = _update2.bind(null, node, updater);
  node.dirtyBits = InitDirtyBitsMask;
  if (nodesToInsert.length > 0) {
    const insertOperations = [];
    for (let i = 0; i < nodesToInsert.length; i++) {
      const [lastPos, nodeToInsert, ...position] = nodesToInsert[i];
      const parentElement = getElementByPosition(node, ...position);
      insertOperations.push([parentElement, nodeToInsert, lastPos]);
    }
    node.nodesInserted = [];
    for (let i = 0; i < insertOperations.length; i++) {
      const [parentElement, nodeToInsert, lastPos] = insertOperations[i];
      insertNode(parentElement, nodeToInsert, lastPos);
      addParentElement([nodeToInsert], parentElement);
      node.nodesInserted.push(nodeToInsert);
    }
  }
  if (updater) {
    updater(node);
  }
  return node;
};
var _update2 = (node, updater) => {
  if (updater) {
    updater(node);
  }
  for (let i = 0; i < (node.nodesInserted?.length ?? 0); i++) {
    update(node.nodesInserted[i]);
  }
};
var templateAddNodeToUpdate = (node, nodeToAdd) => {
  if (!node.elementsRetrieved)
    node.elementsRetrieved = [];
  if (node.elementsRetrieved.includes(nodeToAdd))
    return;
  node.elementsRetrieved.push(nodeToAdd);
  addParentElement([nodeToAdd], node);
};
var templateGetElement = (templateNode, ...positions) => {
  const node = getElementByPosition(templateNode, ...positions);
  node.__$owner = getCurrentCompNode();
  templateAddNodeToUpdate(templateNode, node);
  return node;
};

// src/render.ts
var render = (compNode, container) => {
  if (container == null) {
    throw new Error("Render target is empty. Please provide a valid DOM element.");
  }
  container.innerHTML = "";
  insertNode(container, compNode, 0);
  runDidMount();
};

// src/Nodes/UtilNodes/fragment.ts
var FragmentNode = class {
  inulaType = 7 /* Fragment */;
  nodes;
  dirtyBits;
  constructor(nodes) {
    this.nodes = nodes;
  }
  update() {
    for (let i = 0; i < this.nodes.length; i++) {
      update(this.nodes[i], this.dirtyBits);
    }
  }
};
var createFragmentNode = (...nodes) => {
  return new FragmentNode(nodes);
};

// src/Nodes/UtilNodes/context.ts
var ContextNode = class {
  inulaType = 5 /* Context */;
  owner;
  nodes;
  updater;
  contextId;
  contexts = {};
  consumers = [];
  constructor(contextId, updater) {
    if (!InulaStore.global.CurrentContextStore)
      InulaStore.global.CurrentContextStore = [];
    this.contextId = contextId;
    this.updater = updater;
    this.owner = getCurrentCompNode();
    this.init();
    InulaStore.global.CurrentContextStore.push(this);
  }
  init() {
    this.updater?.(this);
  }
  with(...children) {
    this.nodes = children;
    InulaStore.global.CurrentContextStore.pop();
    return this;
  }
  update() {
    for (let i = 0; i < (this.nodes?.length ?? 0); i++) {
      update(this.nodes[i]);
    }
    this.updater?.(this);
  }
  cachedDependenciesMap;
  updateContext(contextName, valueFunc, deps, reactBits) {
    if (!willReact(this.owner.dirtyBits, reactBits))
      return;
    if (!this.cachedDependenciesMap)
      this.cachedDependenciesMap = {};
    const cachedDeps = this.cachedDependenciesMap[contextName];
    if (cached(deps, cachedDeps))
      return;
    const value = valueFunc();
    this.contexts[contextName] = value;
    this.consumers.forEach((consumer) => consumer.updateContext(this.contextId, contextName, value));
    this.cachedDependenciesMap[contextName] = deps;
  }
};
var createContextNode = (context, updater) => {
  return new ContextNode(context.id, updater);
};
var createContext = (defaultValue) => {
  return {
    id: Symbol("inula-context"),
    defaultValue
  };
};
var removeConsumer = (contextNode, compNode) => {
  const index = contextNode.consumers.indexOf(compNode);
  if (index > -1)
    contextNode.consumers.splice(index, 1);
};
var useContext = (context, compNode) => {
  if (!InulaStore.global.CurrentContextStore) {
    return context.defaultValue ?? {};
  }
  for (let i = InulaStore.global.CurrentContextStore.length - 1; i >= 0; i--) {
    const currentContext = InulaStore.global.CurrentContextStore[i];
    if (currentContext.contextId === context.id) {
      if (compNode) {
        currentContext.consumers.push(compNode);
        addWillUnmount(removeConsumer.bind(null, currentContext, compNode));
      }
      return currentContext.contexts;
    }
  }
  return context.defaultValue ?? {};
};

// src/Nodes/MutableNodes/context.ts
var MutableContextNode = class {
  savedContextNodes = [];
  parentEl;
  owner;
  /**
   * @brief Mutable node is a node that this._$nodes can be changed, things need to pay attention:
   *  1. The environment of the new nodes should be the same as the old nodes
   *  2. The new nodes should be added to the parentEl
   *  3. The old nodes should be removed from the parentEl
   * @param type
   */
  constructor() {
    this.owner = getCurrentCompNode();
    if (InulaStore.global.CurrentContextStore && InulaStore.global.CurrentContextStore.length > 0) {
      this.savedContextNodes = [...InulaStore.global.CurrentContextStore];
    }
  }
  /**
   * @brief Initialize the new nodes, add parentEl to all nodes
   * @param nodes
   */
  initNewNodes(nodes) {
    addParentElement(nodes, this.parentEl);
  }
  /**
   * @brief Generate new nodes in the saved environment
   * @param newNodesFunc
   * @returns
   */
  newNodesInContext(newNodesFunc) {
    if (!this.savedContextNodes) {
      const newNodes2 = newNodesFunc();
      this.initNewNodes(newNodes2);
      return newNodes2;
    }
    const currentEnvNodes = InulaStore.global.CurrentContextStore;
    InulaStore.global.CurrentContextStore = [...this.savedContextNodes];
    const newNodes = newNodesFunc();
    InulaStore.global.CurrentContextStore = currentEnvNodes;
    this.initNewNodes(newNodes);
    return newNodes;
  }
  /**
   * @brief Remove nodes from parentEl and run willUnmount and didUnmount
   * @param nodes
   * @param removeEl Only remove outermost element
   */
  removeNodes(nodes) {
    loopShallowElements(nodes, (node) => {
      this.parentEl.removeChild(node);
    });
  }
  initUnmountStore() {
    if (!InulaStore.global.WillUnmountScopedStore)
      InulaStore.global.WillUnmountScopedStore = [];
    if (!InulaStore.global.DidUnmountScopedStore)
      InulaStore.global.DidUnmountScopedStore = [];
    InulaStore.global.WillUnmountScopedStore.push([]);
    InulaStore.global.DidUnmountScopedStore.push([]);
  }
};

// src/Nodes/MutableNodes/lifecycle.ts
var MutableLifecycleNode = class extends MutableContextNode {
  willUnmountScopedStore;
  didUnmountScopedStore;
  setUnmountFuncs() {
    this.willUnmountScopedStore = InulaStore.global.WillUnmountScopedStore.pop();
    this.didUnmountScopedStore = InulaStore.global.WillUnmountScopedStore.pop();
  }
  runWillUnmount() {
    if (!this.willUnmountScopedStore)
      return;
    for (let i = 0; i < this.willUnmountScopedStore.length; i++)
      this.willUnmountScopedStore[i]();
  }
  runDidUnmount() {
    if (!this.didUnmountScopedStore)
      return;
    for (let i = this.didUnmountScopedStore.length - 1; i >= 0; i--)
      this.didUnmountScopedStore[i]();
  }
  removeNodes(nodes) {
    this.runWillUnmount();
    super.removeNodes(nodes);
    this.runDidUnmount();
  }
  newNodesInContext(newNodesFunc) {
    enterCompNode(this.owner);
    this.initUnmountStore();
    const newNodes = super.newNodesInContext(newNodesFunc);
    this.setUnmountFuncs();
    leaveCompNode();
    return newNodes;
  }
};

// src/Nodes/MutableNodes/expression.ts
var ExpNode = class extends MutableLifecycleNode {
  inulaType = 2 /* Cond */;
  nodes;
  updater;
  reactBits;
  dependenciesFunc;
  cachedDeps;
  constructor(updater, dependenciesFunc, reactBits) {
    super();
    this.updater = updater;
    this.reactBits = reactBits;
    this.dependenciesFunc = dependenciesFunc;
    this.initUnmountStore();
    this.nodes = this.getExpressionResult();
    this.setUnmountFuncs();
  }
  update() {
    if (!(this.reactBits & this.owner.dirtyBits))
      return;
    if (cached(this.dependenciesFunc(), this.cachedDeps))
      return;
    const prevFuncs = [this.willUnmountScopedStore, this.didUnmountScopedStore];
    const newNodes = this.newNodesInContext(() => this.getExpressionResult());
    const newFuncs = [this.willUnmountScopedStore, this.didUnmountScopedStore];
    [this.willUnmountScopedStore, this.didUnmountScopedStore] = prevFuncs;
    if (this.nodes && this.nodes.length > 0) {
      this.removeNodes(this.nodes);
    }
    [this.willUnmountScopedStore, this.didUnmountScopedStore] = newFuncs;
    this.nodes = newNodes;
    if (this.nodes.length === 0)
      return;
    const flowIndex = getFlowIndexFromNodes(this.parentEl.nodes, this);
    const nextSibling = this.parentEl.childNodes[flowIndex];
    appendNodesWithSibling(this.nodes, this.parentEl, nextSibling);
    init(this.nodes);
    runDidMount();
  }
  getExpressionResult() {
    let nodes = this.updater();
    if (!Array.isArray(nodes))
      nodes = [nodes];
    return nodes.flat(1).map((node) => {
      if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") {
        return createTextNode(`${node}`, () => {
        });
      }
      if (typeof node === "function" && node.$$isChildren) {
        return node();
      }
      return node;
    }).flat(1).filter((node) => node !== void 0 && node !== null && typeof node !== "boolean");
  }
};
var createExpNode = (updater, dependenciesFunc, reactBits) => {
  return new ExpNode(updater, dependenciesFunc, reactBits);
};

// src/Nodes/MutableNodes/conditional.ts
var ConditionalNode = class extends MutableLifecycleNode {
  inulaType = 2 /* Cond */;
  nodes;
  currentBranch = -1;
  updater;
  reactBits;
  constructor(updater, reactBits) {
    super();
    this.updater = updater;
    this.reactBits = reactBits;
    this.initUnmountStore();
    this.nodes = updater(this);
    this.setUnmountFuncs();
  }
  conditionCacheMap;
  branch(branchNum) {
    if (this.currentBranch === branchNum)
      return true;
    this.currentBranch = branchNum;
    return false;
  }
  cachedCondition(branchNum, valueFunc, dependencies) {
    if (!this.conditionCacheMap)
      this.conditionCacheMap = {};
    const [cachedValue, cachedDeps] = this.conditionCacheMap[branchNum] ?? [null, null];
    if (cached(dependencies, cachedDeps))
      return cachedValue;
    const value = valueFunc();
    this.conditionCacheMap[branchNum] = [value, dependencies];
    return value;
  }
  update() {
    const prevBranch = this.currentBranch;
    const prevFuncs = [this.willUnmountScopedStore, this.didUnmountScopedStore];
    const newNodes = this.newNodesInContext(() => this.updater(this));
    if (prevBranch === this.currentBranch) {
      [this.willUnmountScopedStore, this.didUnmountScopedStore] = prevFuncs;
      for (let i = 0; i < this.nodes.length; i++) {
        update(this.nodes[i]);
      }
      return;
    }
    const newFuncs = [this.willUnmountScopedStore, this.didUnmountScopedStore];
    [this.willUnmountScopedStore, this.didUnmountScopedStore] = prevFuncs;
    if (this.nodes && this.nodes.length > 0) {
      this.removeNodes(this.nodes);
    }
    [this.willUnmountScopedStore, this.didUnmountScopedStore] = newFuncs;
    this.nodes = newNodes;
    if (this.nodes.length === 0)
      return;
    const flowIndex = getFlowIndexFromNodes(this.parentEl.nodes, this);
    const nextSibling = this.parentEl.childNodes[flowIndex];
    appendNodesWithSibling(this.nodes, this.parentEl, nextSibling);
    init(this.nodes);
    runDidMount();
  }
};
var createConditionalNode = (updater, reactBits) => {
  return new ConditionalNode(updater, reactBits);
};

// src/Nodes/UtilNodes/Suspense.ts
var suspenseContext = null;
function getSuspenseContext() {
  if (!suspenseContext) {
    suspenseContext = createContext();
  }
  return suspenseContext;
}
function Suspense({
  fallback,
  children
}) {
  const $$self = compBuilder();
  $$self.addProp("fallback", (value) => fallback = value, 1);
  $$self.addProp("children", (value) => children = value, 2);
  let didSuspend = false;
  function resolve(toSuspend) {
    $$self.wave(
      didSuspend = toSuspend,
      4
      /*0b100*/
    );
  }
  return $$self.prepare().init(createContextNode(getSuspenseContext(), ($$node) => {
    $$node.updateContext("resolve", () => resolve, [], 0);
  }).with(createConditionalNode(($$node) => {
    if ($$node.cachedCondition(0, () => didSuspend, [didSuspend])) {
      if ($$node.branch(0))
        return [];
      return [createExpNode(() => fallback, () => [fallback], 1)];
    } else {
      if ($$node.branch(1))
        return [];
      return [createExpNode(() => children, () => [children], 2)];
    }
  }, 4)));
}
function lazy(promiseConstructor) {
  let result = null;
  let status = "init";
  return function(props) {
    const {
      resolve
    } = useContext(getSuspenseContext());
    if (status === "init") {
      resolve(true);
      promiseConstructor().then(function(module) {
        result = module.default;
        status = "fullfilled";
        resolve(false);
      }, function(error) {
        status = "rejected";
        result = error;
      });
    }
    if (status === "fullfilled") {
      return result(props);
    }
    return null;
  };
}

// src/Nodes/HookNode/index.ts
var HookNode = class extends ReactiveNode {
  value;
  triggerUpdate;
  constructor() {
    super();
  }
  wave(_, dirty) {
    this.updateState(dirty);
    this.triggerUpdate?.();
  }
  init(value) {
    this.value = value;
    return this;
  }
};
var hookBuilder = () => {
  return new HookNode();
};

// src/Nodes/MutableNodes/for.ts
var ForNode = class extends MutableContextNode {
  inulaType = 1 /* For */;
  dataReactBits;
  nodesMap = /* @__PURE__ */ new Map();
  nodeFunc;
  dataFunc;
  data;
  keysFunc;
  keys;
  /**
   * @brief Getter for nodes
   */
  cachedNodes;
  nodesDirty = true;
  get nodes() {
    if (!this.nodesDirty)
      return this.cachedNodes;
    const nodes = [];
    for (let idx = 0; idx < this.data.length; idx++) {
      nodes.push(...this.nodesMap.get(this.keys?.[idx] ?? idx));
    }
    this.cachedNodes = nodes;
    this.nodesDirty = false;
    return nodes;
  }
  setNodesMap(key, nodes) {
    this.nodesMap.set(key, nodes);
    this.nodesDirty = true;
  }
  /**
   * @brief Constructor, For type
   * @param data
   * @param nodeFunc
   * @param keys
   */
  constructor(dataFunc, keysFunc, nodeFunc, dataReactBits) {
    super();
    this.dataFunc = dataFunc;
    this.keysFunc = keysFunc;
    this.nodeFunc = nodeFunc;
    this.data = [...dataFunc()];
    if (keysFunc)
      this.keys = [...keysFunc()];
    this.update();
    this.dataReactBits = dataReactBits;
  }
  updateItemFuncArr = [];
  /**
   * @brief Update the view related to one item in the data
   * @param nodes
   * @param item
   */
  updateItem(idx, data) {
    this.updateItemFuncArr[idx]?.(data[idx], idx);
    for (const node of this.nodesMap.get(this.keys?.[idx] ?? idx)) {
      update(node);
    }
  }
  updateItems() {
    for (let idx = 0; idx < this.data.length; idx++) {
      this.updateItem(idx, this.data);
    }
  }
  notInitialized = true;
  /**
   * @brief Non-data update function
   * @param changed
   */
  update() {
    if (this.notInitialized) {
      for (let idx = 0; idx < this.data.length; idx++) {
        let item = this.data[idx];
        this.initUnmountStore();
        const key = this.keys?.[idx] ?? idx;
        const nodes = this.nodeFunc(this, this.updateItemFuncArr, item, key, idx);
        this.setNodesMap(key, nodes);
        this.setUnmountMap(key);
      }
      addWillUnmount(this.runAllWillUnmount.bind(this));
      addDidUnmount(this.runAllDidUnmount.bind(this));
      delete this.notInitialized;
      for (const nodes of this.nodesMap.values()) {
        for (const node of nodes) {
          update(node);
        }
      }
      runDidMount();
      return;
    }
    if (!(~this.dataReactBits & this.owner.dirtyBits)) {
      this.updateArray();
      return;
    }
    this.updateItems();
  }
  /**
   * @brief Array-related update function
   * @param newData
   * @param newKeys
   */
  updateArray() {
    if (this.keysFunc) {
      this.updateWithKey();
      return;
    }
    this.updateWithOutKey();
  }
  /**
   * @brief Shortcut to generate new nodes with idx and key
   */
  getNewNodes(idx, key, data, updateItemFuncArr) {
    this.initUnmountStore();
    enterCompNode(this.owner);
    const nodes = this.newNodesInContext(
      () => this.nodeFunc(this, updateItemFuncArr ?? this.updateItemFuncArr, data[idx], key, idx)
    );
    for (const node of nodes) {
      update(node);
    }
    leaveCompNode();
    this.setUnmountMap(key);
    this.setNodesMap(key, nodes);
    return nodes;
  }
  willUnmountMap = /* @__PURE__ */ new Map();
  didUnmountMap = /* @__PURE__ */ new Map();
  /**
   * @brief Set the unmount map by getting the last unmount map from the global store
   * @param key
   */
  setUnmountMap(key) {
    const willUnmountStore = InulaStore.global.WillUnmountScopedStore.pop();
    if (willUnmountStore && willUnmountStore.length > 0) {
      if (!this.willUnmountMap)
        this.willUnmountMap = /* @__PURE__ */ new Map();
      this.willUnmountMap.set(key, willUnmountStore);
    }
    const didUnmountStore = InulaStore.global.DidUnmountScopedStore.pop();
    if (didUnmountStore && didUnmountStore.length > 0) {
      if (!this.didUnmountMap)
        this.didUnmountMap = /* @__PURE__ */ new Map();
      this.didUnmountMap.set(key, didUnmountStore);
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
  removeNodesInLifeCycle(nodes, key) {
    this.runWillUnmount(key);
    super.removeNodes(nodes);
    this.runDidUnmount(key);
    this.nodesMap.delete(key);
  }
  /**
   * @brief Update the nodes without keys
   * @param newData
   */
  updateWithOutKey() {
    const newData = this.dataFunc();
    const preLength = this.data.length;
    const currLength = newData.length;
    if (preLength === currLength) {
      for (let idx = 0; idx < this.data.length; idx++) {
        this.updateItem(idx, newData);
      }
      this.data = [...newData];
      return;
    }
    const parentEl = this.parentEl;
    if (preLength < currLength) {
      let flowIndex = getFlowIndexFromNodes(parentEl.nodes, this);
      const length = parentEl.childNodes.length;
      for (let idx = 0; idx < currLength; idx++) {
        if (idx < preLength) {
          flowIndex += getFlowIndexFromNodes(this.nodesMap.get(idx));
          this.updateItem(idx, newData);
          continue;
        }
        const newNodes = this.getNewNodes(idx, idx, newData);
        appendNodesWithIndex(newNodes, parentEl, flowIndex, length);
      }
      runDidMount();
      this.data = [...newData];
      return;
    }
    for (let idx = 0; idx < currLength; idx++) {
      this.updateItem(idx, newData);
    }
    for (let idx = currLength; idx < preLength; idx++) {
      const nodes = this.nodesMap.get(idx);
      this.removeNodesInLifeCycle(nodes, idx);
    }
    this.updateItemFuncArr.splice(currLength, preLength - currLength);
    this.data = [...newData];
  }
  /**
   * @brief Update the nodes with keys
   * @param newData
   * @param newKeys
   */
  updateWithKey() {
    const newData = this.dataFunc();
    const newKeys = this.keysFunc();
    if (newKeys.length !== new Set(newKeys).size) {
      throw new Error("Inula: Duplicate keys in for loop are not allowed");
    }
    const prevKeys = this.keys;
    this.keys = newKeys;
    if (arrayEqual(prevKeys, this.keys)) {
      for (let idx = 0; idx < newData.length; idx++) {
        this.updateItem(idx, newData);
      }
      this.data = [...newData];
      return;
    }
    const parentEl = this.parentEl;
    if (this.keys.length === 0) {
      const parentNodes = parentEl.nodes ?? [];
      if (parentNodes.length === 1 && parentNodes[0] === this) {
        this.runAllWillUnmount();
        parentEl.innerHTML = "";
        this.runAllDidUnmount();
      } else {
        for (let prevIdx = 0; prevIdx < prevKeys.length; prevIdx++) {
          const prevKey = prevKeys[prevIdx];
          this.removeNodesInLifeCycle(this.nodesMap.get(prevKey), prevKey);
        }
      }
      this.nodesMap.clear();
      this.updateItemFuncArr = [];
      this.data = [];
      return;
    }
    const flowIndex = getFlowIndexFromNodes(parentEl.nodes, this);
    if (prevKeys.length === 0) {
      const nextSibling = parentEl.childNodes[flowIndex];
      for (let idx = 0; idx < this.keys.length; idx++) {
        const newNodes = this.getNewNodes(idx, this.keys[idx], newData);
        appendNodesWithSibling(newNodes, parentEl, nextSibling);
      }
      runDidMount();
      this.data = [...newData];
      return;
    }
    const shuffleKeys = [];
    const newUpdateArr = [];
    for (let prevIdx = 0; prevIdx < prevKeys.length; prevIdx++) {
      const prevKey = prevKeys[prevIdx];
      if (this.keys.includes(prevKey)) {
        shuffleKeys.push(prevKey);
        newUpdateArr.push(this.updateItemFuncArr[prevIdx]);
        continue;
      }
      this.removeNodesInLifeCycle(this.nodesMap.get(prevKey), prevKey);
    }
    let length = parentEl.childNodes.length;
    let newFlowIndex = flowIndex;
    for (let idx = 0; idx < this.keys.length; idx++) {
      const key = this.keys[idx];
      const prevIdx = shuffleKeys.indexOf(key);
      if (prevIdx !== -1) {
        newFlowIndex += getFlowIndexFromNodes(this.nodesMap.get(key));
        newUpdateArr[prevIdx]?.(this.owner.dirtyBits, newData[idx]);
        continue;
      }
      newUpdateArr.splice(idx, 0, null);
      const newNodes = this.getNewNodes(idx, key, newData, newUpdateArr);
      shuffleKeys.splice(idx, 0, key);
      const count = appendNodesWithIndex(newNodes, parentEl, newFlowIndex, length);
      newFlowIndex += count;
      length += count;
    }
    runDidMount();
    if (arrayEqual(this.keys, shuffleKeys)) {
      this.data = [...newData];
      this.updateItemFuncArr = newUpdateArr;
      return;
    }
    newFlowIndex = flowIndex;
    const bufferNodes = /* @__PURE__ */ new Map();
    for (let idx = 0; idx < this.keys.length; idx++) {
      const key = this.keys[idx];
      const prevIdx = shuffleKeys.indexOf(key);
      const bufferedNode = bufferNodes.get(key);
      if (bufferedNode) {
        const bufferedFlowIndex = getFlowIndexFromNodes(bufferedNode);
        const lastEl = toDOMElements(bufferedNode).pop();
        const nextSibling = parentEl.childNodes[newFlowIndex + bufferedFlowIndex];
        if (lastEl !== nextSibling && lastEl.nextSibling !== nextSibling) {
          insertNodesBefore(bufferedNode, parentEl, nextSibling);
        }
        newFlowIndex += bufferedFlowIndex;
        bufferNodes.delete(key);
      } else if (prevIdx === idx) {
        newFlowIndex += getFlowIndexFromNodes(this.nodesMap.get(key));
        continue;
      } else {
        const prevKey = shuffleKeys[idx];
        bufferNodes.set(prevKey, this.nodesMap.get(prevKey));
        const childNodes = this.nodesMap.get(key);
        const lastEl = toDOMElements(childNodes).pop();
        const nextSibling = parentEl.childNodes[newFlowIndex];
        if (lastEl !== nextSibling && lastEl.nextSibling !== nextSibling) {
          newFlowIndex += insertNodesBefore(childNodes, parentEl, nextSibling);
        }
      }
      const tempKey = shuffleKeys[idx];
      shuffleKeys[idx] = shuffleKeys[prevIdx];
      shuffleKeys[prevIdx] = tempKey;
      const tempUpdateFunc = newUpdateArr[idx];
      newUpdateArr[idx] = newUpdateArr[prevIdx];
      newUpdateArr[prevIdx] = tempUpdateFunc;
    }
    this.data = [...newData];
    this.updateItemFuncArr = newUpdateArr;
  }
};
var createForNode = (dataFunc, keysFunc, nodeFunc, dataReactBits) => {
  return new ForNode(dataFunc, keysFunc, nodeFunc, dataReactBits);
};

// src/Nodes/macros.ts
function watch(effect) {
  throw new Error("Watch should not be called directly, please check the docs for more information");
}
function didMount(effect) {
  throw new Error("DidMount should not be called directly, please check the docs for more information");
}
function willUnmount(effect) {
  throw new Error("WillUnmount should not be called directly, please check the docs for more information");
}
function didUnmount(effect) {
  throw new Error("DidUnmount should not be called directly, please check the docs for more information");
}
export {
  CompNode,
  ContextNode,
  HookNode,
  InitDirtyBitsMask,
  ReactiveNode,
  Suspense,
  addParentElement,
  appendNodes,
  appendNodesWithIndex,
  appendNodesWithSibling,
  arrayEqual,
  cached,
  compBuilder,
  createChildren,
  createCompNode,
  createConditionalNode,
  createContext,
  createContextNode,
  createElement,
  createExpNode,
  createForNode,
  createFragmentNode,
  createHTMLNode,
  createTemplate,
  createTemplateNode,
  createTextNode,
  delegateEvent,
  didMount,
  didUnmount,
  enterCompNode,
  getCurrentCompNode,
  getDOMElements,
  getElementByPosition,
  getFlowIndexFromNodes,
  hookBuilder,
  init,
  insertNode,
  insertNodesBefore,
  lazy,
  leaveCompNode,
  loopShallowElements,
  render,
  setDataset,
  setEvent,
  setHTMLAttr,
  setHTMLAttrs,
  setHTMLProp,
  setHTMLProps,
  setRef,
  setStyle,
  setText,
  shouldUpdate,
  templateAddNodeToUpdate,
  templateGetElement,
  toDOMElements,
  update,
  useContext,
  watch,
  willReact,
  willUnmount,
  withDefault
};
//# sourceMappingURL=index.js.map