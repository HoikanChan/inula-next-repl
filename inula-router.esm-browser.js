import Inula, { createContext, useContext, Children, createElement, useState, useRef, useLayoutEffect, useMemo, isValidElement, cloneElement } from 'openinula';
import { jsx } from 'openinula/jsx-runtime';

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */

function isBrowser() {
  return typeof window !== 'undefined' && window.document && typeof window.document.createElement === 'function';
}
function getDefaultConfirmation(message, callBack) {
  callBack(window.confirm(message));
}

// 判断浏览器是否支持pushState方法，pushState是browserHistory实现的基础
function isSupportHistory() {
  return isBrowser() && window.history && 'pushState' in window.history;
}

// 判断浏览器是否支持PopState事件
function isSupportsPopState() {
  return window.navigator.userAgent.indexOf('Trident') === -1;
}

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */

var Action = /*#__PURE__*/function (Action) {
  Action["pop"] = "POP";
  Action["push"] = "PUSH";
  Action["replace"] = "REPLACE";
  return Action;
}({});
var EventType = /*#__PURE__*/function (EventType) {
  EventType["PopState"] = "popstate";
  EventType["HashChange"] = "hashchange";
  return EventType;
}({});

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}

function createPath(path) {
  var search = path.search,
    hash = path.hash;
  var pathname = path.pathname || '/';
  if (search && search !== '?') {
    pathname += search.startsWith('?') ? search : '?' + search;
  }
  if (hash && hash !== '#') {
    pathname += hash.startsWith('#') ? hash : '#' + hash;
  }
  return pathname;
}
function parsePath(url) {
  if (!url) {
    return {};
  }
  var parsedPath = {};
  var hashIdx = url.indexOf('#');
  if (hashIdx > -1) {
    parsedPath.hash = url.substring(hashIdx);
    url = url.substring(0, hashIdx);
  }
  var searchIdx = url.indexOf('?');
  if (searchIdx > -1) {
    parsedPath.search = url.substring(searchIdx);
    url = url.substring(0, searchIdx);
  }
  if (url) {
    parsedPath.pathname = url;
  }
  return parsedPath;
}
function createLocation(current, to, state, key) {
  var pathname = typeof current === 'string' ? current : current.pathname;
  var urlObj = typeof to === 'string' ? parsePath(to) : to;
  // 随机key长度取6
  var getRandKey = genRandomKey(6);
  var location = _extends({
    pathname: pathname,
    search: '',
    hash: '',
    state: state,
    key: typeof key === 'string' ? key : getRandKey()
  }, urlObj);
  if (!location.pathname) {
    location.pathname = '/';
  }
  return location;
}
function isLocationEqual(p1, p2) {
  return p1.pathname === p2.pathname && p1.search === p2.search && p1.hash === p2.hash;
}
function addHeadSlash(path) {
  if (path[0] === '/') {
    return path;
  }
  return '/' + path;
}
function stripHeadSlash(path) {
  if (path[0] === '/') {
    return path.substring(1);
  }
  return path;
}
function normalizeSlash(path) {
  var tempPath = addHeadSlash(path);
  if (tempPath[tempPath.length - 1] === '/') {
    return tempPath.substring(0, tempPath.length - 1);
  }
  return tempPath;
}
function hasBasename(path, prefix) {
  return path.toLowerCase().indexOf(prefix.toLowerCase()) === 0 && ['/', '?', '#', ''].includes(path.charAt(prefix.length));
}
function stripBasename(path, prefix) {
  return hasBasename(path, prefix) ? path.substring(prefix.length) : path;
}

// 使用随机生成的Key记录被访问过的URL，当Block被被触发时利用delta值跳转到之前的页面
function createMemoryRecord(initVal, fn) {
  var visitedRecord = [fn(initVal)];
  function getDelta(to, form) {
    var toIdx = visitedRecord.lastIndexOf(fn(to));
    if (toIdx === -1) {
      toIdx = 0;
    }
    var fromIdx = visitedRecord.lastIndexOf(fn(form));
    if (fromIdx === -1) {
      fromIdx = 0;
    }
    return toIdx - fromIdx;
  }
  function addRecord(current, newRecord, action) {
    var curVal = fn(current);
    var NewVal = fn(newRecord);
    if (action === Action.push) {
      var prevIdx = visitedRecord.lastIndexOf(curVal);
      var newVisitedRecord = visitedRecord.slice(0, prevIdx + 1);
      newVisitedRecord.push(NewVal);
      visitedRecord = newVisitedRecord;
    }
    if (action === Action.replace) {
      var _prevIdx = visitedRecord.lastIndexOf(curVal);
      if (_prevIdx !== -1) {
        visitedRecord[_prevIdx] = NewVal;
      }
    }
  }
  return {
    getDelta: getDelta,
    addRecord: addRecord
  };
}
function genRandomKey(length) {
  var end = length + 2;
  return function () {
    return Math.random().toString(18).substring(2, end);
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}

function _createForOfIteratorHelper$1(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$1(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function () {}; return { s: F, n: function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function (e) { throw e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function () { it = it.call(o); }, n: function () { var step = it.next(); normalCompletion = step.done; return step; }, e: function (e) { didErr = true; err = e; }, f: function () { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray$1(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$1(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen); }
function _arrayLikeToArray$1(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */
var TransitionManager = /*#__PURE__*/function () {
  function TransitionManager() {
    _classCallCheck(this, TransitionManager);
    this.prompt = void 0;
    this.listeners = void 0;
    this.prompt = null;
    this.listeners = [];
  }
  _createClass(TransitionManager, [{
    key: "setPrompt",
    value: function setPrompt(prompt) {
      var _this = this;
      this.prompt = prompt;

      // 清除Prompt
      return function () {
        if (_this.prompt === prompt) {
          _this.prompt = null;
        }
      };
    }

    // 使用发布订阅模式管理history的监听者
  }, {
    key: "addListener",
    value: function addListener(func) {
      var _this2 = this;
      var isActive = true;
      var listener = function (args) {
        if (isActive) {
          func(args);
        }
      };
      this.listeners.push(listener);
      return function () {
        isActive = false;
        // 移除对应的监听者
        _this2.listeners = _this2.listeners.filter(function (item) {
          return item !== listener;
        });
      };
    }
  }, {
    key: "notifyListeners",
    value: function notifyListeners(args) {
      var _iterator = _createForOfIteratorHelper$1(this.listeners),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var listener = _step.value;
          listener(args);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }, {
    key: "confirmJumpTo",
    value: function confirmJumpTo(location, action, userConfirmationFunc, callBack) {
      if (this.prompt !== null) {
        var result = typeof this.prompt === 'function' ? this.prompt(location, action) : this.prompt;
        if (typeof result === 'string') {
          typeof userConfirmationFunc === 'function' ? userConfirmationFunc(result, callBack) : callBack(true);
        } else {
          callBack(result !== false);
        }
      } else {
        callBack(true);
      }
    }
  }]);
  return TransitionManager;
}();

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */

function warning(condition, message) {
  if (condition) {
    if (console && typeof console.warn === 'function') {
      console.warn(message);
    }
  }
}

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */

// 抽取BrowserHistory和HashHistory中相同的方法
function getBaseHistory(transitionManager, setListener, browserHistory) {
  function go(step) {
    browserHistory.go(step);
  }
  function goBack() {
    browserHistory.go(-1);
  }
  function goForward() {
    browserHistory.go(1);
  }
  function listen(listener) {
    var cancel = transitionManager.addListener(listener);
    setListener(1);
    return function () {
      setListener(-1);
      cancel();
    };
  }
  var isBlocked = false;
  function block() {
    var prompt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var unblock = transitionManager.setPrompt(prompt);
    if (!isBlocked) {
      setListener(1);
      isBlocked = true;
    }
    return function () {
      if (isBlocked) {
        isBlocked = false;
        setListener(-1);
      }
      unblock();
    };
  }
  function getUpdateStateFunc(historyProps) {
    return function (nextState) {
      if (nextState) {
        _extends(historyProps, nextState);
      }
      historyProps.length = browserHistory.length;
      var args = {
        location: historyProps.location,
        action: historyProps.action
      };
      transitionManager.notifyListeners(args);
    };
  }
  return {
    go: go,
    goBack: goBack,
    goForward: goForward,
    listen: listen,
    block: block,
    getUpdateStateFunc: getUpdateStateFunc
  };
}

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */
function createBrowserHistory() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var supportHistory = isSupportHistory();
  var isSupportPopState = isSupportsPopState();
  var browserHistory = window.history;
  var _options$forceRefresh = options.forceRefresh,
    forceRefresh = _options$forceRefresh === void 0 ? false : _options$forceRefresh,
    _options$getUserConfi = options.getUserConfirmation,
    getUserConfirmation = _options$getUserConfi === void 0 ? getDefaultConfirmation : _options$getUserConfi;
  var basename = options.basename ? normalizeSlash(options.basename) : '';
  var initLocation = getLocation(getHistoryState());
  var recordOperator = createMemoryRecord(initLocation, function (l) {
    return l.key;
  });
  var transitionManager = new TransitionManager();
  var _getBaseHistory = getBaseHistory(transitionManager, setListener, browserHistory),
    go = _getBaseHistory.go,
    goBack = _getBaseHistory.goBack,
    goForward = _getBaseHistory.goForward,
    listen = _getBaseHistory.listen,
    block = _getBaseHistory.block,
    getUpdateStateFunc = _getBaseHistory.getUpdateStateFunc;
  var history = {
    action: Action.pop,
    length: browserHistory.length,
    location: initLocation,
    go: go,
    goBack: goBack,
    goForward: goForward,
    listen: listen,
    block: block,
    push: push,
    replace: replace,
    createHref: createHref
  };
  var updateState = getUpdateStateFunc(history);
  function getHistoryState() {
    return supportHistory ? window.history.state : {};
  }
  function getLocation(historyState) {
    var _window$location = window.location,
      search = _window$location.search,
      hash = _window$location.hash;
    var _ref = historyState || {},
      key = _ref.key,
      state = _ref.state;
    var pathname = window.location.pathname;
    pathname = basename ? stripBasename(pathname, basename) : pathname;
    return createLocation('', {
      pathname: pathname,
      search: search,
      hash: hash
    }, state, key);
  }

  // 拦截页面POP事件后，防止返回到的页面被重复拦截
  var forceJump = false;
  function handlePopState(location) {
    if (forceJump) {
      forceJump = false;
      updateState(undefined);
    } else {
      var action = Action.pop;
      var callback = function (isJump) {
        if (isJump) {
          // 执行跳转行为
          updateState({
            action: action,
            location: location
          });
        } else {
          revertPopState(location, history.location);
        }
      };
      transitionManager.confirmJumpTo(location, action, getUserConfirmation, callback);
    }
  }
  function popStateListener(event) {
    handlePopState(getLocation(event.state));
  }
  function hashChangeListener() {
    var location = getLocation(getHistoryState());
    handlePopState(location);
  }
  var listenerCount = 0;
  function setListener(count) {
    listenerCount += count;
    if (listenerCount === 1 && count === 1) {
      window.addEventListener(EventType.PopState, popStateListener);
      if (!isSupportPopState) {
        window.addEventListener(EventType.HashChange, hashChangeListener);
      }
    } else if (listenerCount === 0) {
      window.removeEventListener(EventType.PopState, popStateListener);
      if (!isSupportPopState) {
        window.removeEventListener(EventType.HashChange, hashChangeListener);
      }
    }
  }

  // 取消页面跳转并恢复到跳转前的页面
  function revertPopState(form, to) {
    var delta = recordOperator.getDelta(to, form);
    if (delta !== 0) {
      go(delta);
      forceJump = true;
    }
  }
  function createHref(path) {
    return basename + createPath(path);
  }
  function push(to, state) {
    var action = Action.push;
    var location = createLocation(history.location, to, state, undefined);
    transitionManager.confirmJumpTo(location, action, getUserConfirmation, function (isJump) {
      if (!isJump) {
        return;
      }
      var href = createHref(location);
      var key = location.key,
        state = location.state;
      if (supportHistory) {
        if (forceRefresh) {
          window.location.href = href;
        } else {
          browserHistory.pushState({
            key: key,
            state: state
          }, '', href);
          recordOperator.addRecord(history.location, location, action);
          updateState({
            action: action,
            location: location
          });
        }
      } else {
        warning(state !== undefined, 'Browser history cannot push state in browsers that do not support HTML5 history');
        window.location.href = href;
      }
    });
  }
  function replace(to, state) {
    var action = Action.replace;
    var location = createLocation(history.location, to, state, undefined);
    transitionManager.confirmJumpTo(location, action, getUserConfirmation, function (isJump) {
      if (!isJump) {
        return;
      }
      var href = createHref(location);
      var key = location.key,
        state = location.state;
      if (supportHistory) {
        if (forceRefresh) {
          window.location.replace(href);
        } else {
          browserHistory.replaceState({
            key: key,
            state: state
          }, '', href);
          recordOperator.addRecord(history.location, location, action);
          updateState({
            action: action,
            location: location
          });
        }
      } else {
        warning(state !== undefined, 'Browser history cannot push state in browsers that do not support HTML5 history');
        window.location.replace(href);
      }
    });
  }
  return history;
}

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */
// 获取#前的内容
function stripHash(path) {
  var idx = path.indexOf('#');
  return idx === -1 ? path : path.substring(0, idx);
}

// 获取#后的内容
function getHashContent(path) {
  var idx = path.indexOf('#');
  return idx === -1 ? '' : path.substring(idx + 1);
}
function createHashHistory() {
  var option = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var browserHistory = window.history;
  var _option$hashType = option.hashType,
    hashType = _option$hashType === void 0 ? 'slash' : _option$hashType,
    _option$getUserConfir = option.getUserConfirmation,
    getUserConfirmation = _option$getUserConfir === void 0 ? getDefaultConfirmation : _option$getUserConfir;
  var basename = option.basename ? normalizeSlash(option.basename) : '';
  var pathDecoder = addHeadSlash;
  var pathEncoder = hashType === 'slash' ? addHeadSlash : stripHeadSlash;
  function getLocation() {
    var hashPath = pathDecoder(getHashContent(window.location.hash));
    if (basename) {
      hashPath = stripBasename(hashPath, basename);
    }
    return createLocation('', hashPath, undefined, 'default');
  }
  var initLocation = getLocation();
  var memRecords = createMemoryRecord(initLocation, createPath);
  var transitionManager = new TransitionManager();
  function createHref(location) {
    var tag = document.querySelector('base');
    var base = tag && tag.getAttribute('href') ? stripHash(window.location.href) : '';
    return base + '#' + pathEncoder(basename + createPath(location));
  }
  var forceNextPop = false;
  var ignorePath = null;
  var _getBaseHistory = getBaseHistory(transitionManager, setListener, browserHistory),
    go = _getBaseHistory.go,
    goBack = _getBaseHistory.goBack,
    goForward = _getBaseHistory.goForward,
    listen = _getBaseHistory.listen,
    block = _getBaseHistory.block,
    getUpdateStateFunc = _getBaseHistory.getUpdateStateFunc;
  var history = {
    action: Action.pop,
    length: browserHistory.length,
    location: initLocation,
    go: go,
    goBack: goBack,
    goForward: goForward,
    push: push,
    replace: replace,
    listen: listen,
    block: block,
    createHref: createHref
  };
  var updateState = getUpdateStateFunc(history);
  function push(to, state) {
    warning(state !== undefined, 'Hash history does not support state, it will be ignored');
    var action = Action.push;
    var location = createLocation(history.location, to, undefined, '');
    transitionManager.confirmJumpTo(location, action, getUserConfirmation, function (isJump) {
      if (!isJump) {
        return;
      }
      var path = createPath(location);
      var encodedPath = pathEncoder(basename + path);
      // 前后hash不一样才进行跳转
      if (getHashContent(window.location.href) !== encodedPath) {
        ignorePath = encodedPath;
        window.location.hash = encodedPath;
        memRecords.addRecord(history.location, location, action);
        updateState({
          action: action,
          location: location
        });
      } else {
        updateState(undefined);
      }
    });
  }
  function replace(to, state) {
    warning(state !== undefined, 'Hash history does not support state, it will be ignored');
    var action = Action.replace;
    var location = createLocation(history.location, to, undefined, '');
    transitionManager.confirmJumpTo(location, action, getUserConfirmation, function (isJump) {
      if (!isJump) {
        return;
      }
      var path = createPath(location);
      var encodedPath = pathEncoder(basename + path);
      if (getHashContent(window.location.href) !== encodedPath) {
        ignorePath = path;
        window.location.replace(stripHash(window.location.href) + '#' + encodedPath);
      }
      memRecords.addRecord(history.location, location, action);
      updateState({
        action: action,
        location: location
      });
    });
  }
  function handleHashChange() {
    var hashPath = getHashContent(window.location.href);
    var encodedPath = pathEncoder(hashPath);
    if (hashPath !== encodedPath) {
      window.location.replace(stripHash(window.location.href) + '#' + encodedPath);
    } else {
      var location = getLocation();
      var prevLocation = history.location;
      if (!forceNextPop && isLocationEqual(location, prevLocation)) {
        return;
      }
      if (ignorePath === createPath(location)) {
        return;
      }
      ignorePath = null;
      handlePopState(location);
    }
  }
  function handlePopState(location) {
    if (forceNextPop) {
      forceNextPop = false;
      updateState(undefined);
    } else {
      var action = Action.pop;
      var callback = function (isJump) {
        if (isJump) {
          updateState({
            action: action,
            location: location
          });
        } else {
          revertPopState(location);
        }
      };
      transitionManager.confirmJumpTo(location, action, getUserConfirmation, callback);
    }
  }

  // 在跳转行为被Block后，用History.go()跳转回之前的页面
  function revertPopState(form) {
    var to = history.location;
    var delta = memRecords.getDelta(to, form);
    if (delta !== 0) {
      go(delta);
      forceNextPop = true;
    }
  }
  var listenerCount = 0;
  function setListener(delta) {
    listenerCount += delta;
    if (listenerCount === 1 && delta === 1) {
      window.addEventListener(EventType.HashChange, handleHashChange);
    } else if (listenerCount === 0) {
      window.removeEventListener(EventType.HashChange, handleHashChange);
    }
  }
  return history;
}

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */
function createNamedContext(name, defaultValue) {
  var context = createContext(defaultValue);
  context.displayName = name;
  return context;
}
var RouterContext = createNamedContext('Router', {});

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */

var TokenType = /*#__PURE__*/function (TokenType) {
  TokenType["Delimiter"] = "delimiter";
  TokenType["Static"] = "static";
  TokenType["Param"] = "param";
  TokenType["WildCard"] = "wildcard";
  TokenType["LBracket"] = "(";
  TokenType["RBracket"] = ")";
  TokenType["Pattern"] = "pattern";
  return TokenType;
}({});

// 解析URL中的动态参数，以实现TypeScript提示功能

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */

/**
 * @description 将url中的//转换为/
 */
function cleanPath(path) {
  return path.replace(/\/+/g, '/');
}
function scoreCompare(score1, score2) {
  var score1Length = score1.length;
  var score2Length = score2.length;
  var end = Math.min(score1Length, score2Length);
  for (var i = 0; i < end; i++) {
    var delta = score2[i] - score1[i];
    if (delta !== 0) {
      return delta;
    }
  }
  if (score1Length === score2Length) {
    return 0;
  }
  return score1Length > score2Length ? -1 : 1;
}

// 把正则表达式的特殊符号加两个反斜杠进行转义
function escapeStr(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
}

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */
var validChar = /[^/:()*?$^+]/;

// 对Url模板进行词法解析，解析结果为Tokens
function lexer(path) {
  var tokens = [];
  if (!path) {
    return tokens;
  }
  var urlPath = cleanPath(path);
  if (urlPath !== '*' && !urlPath.startsWith('/')) {
    throw new Error("Url must start with \"/\".");
  }
  var getLiteral = function () {
    var name = '';
    while (i < urlPath.length && validChar.test(urlPath[i])) {
      name += urlPath[i];
      skipChar(1);
    }
    return name;
  };
  var skipChar = function (step) {
    i += step;
  };
  var i = 0;
  while (i < urlPath.length) {
    var curChar = urlPath[i];
    var prevChar = urlPath[i - 1];
    if (curChar === '/') {
      tokens.push({
        type: TokenType.Delimiter,
        value: urlPath[i]
      });
      skipChar(1);
      continue;
    }
    // dynamic params (/:a)
    if (prevChar === '/' && curChar === ':') {
      skipChar(1);
      tokens.push({
        type: TokenType.Param,
        value: getLiteral()
      });
      continue;
    }
    // wildCard params (/:*)
    if ((prevChar === '/' || prevChar === undefined) && curChar === '*') {
      tokens.push({
        type: TokenType.WildCard,
        value: urlPath[i]
      });
      skipChar(1);
      continue;
    }
    // static params
    if (prevChar === '/' && validChar.test(curChar)) {
      tokens.push({
        type: TokenType.Static,
        value: getLiteral()
      });
      continue;
    }
    if (curChar === '(') {
      tokens.push({
        type: TokenType.LBracket,
        value: '('
      });
      skipChar(1);
      continue;
    }
    if (curChar === ')') {
      tokens.push({
        type: TokenType.RBracket,
        value: ')'
      });
      skipChar(1);
      continue;
    }
    if (['*', '?', '$', '^', '+'].includes(curChar)) {
      tokens.push({
        type: TokenType.Pattern,
        value: curChar
      });
      skipChar(1);
      continue;
    }
    if (validChar.test(curChar)) {
      tokens.push({
        type: TokenType.Pattern,
        value: getLiteral()
      });
      continue;
    }
    // 跳过非法字符
    skipChar(1);
  }
  return tokens;
}

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function () {}; return { s: F, n: function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function (e) { throw e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function () { it = it.call(o); }, n: function () { var step = it.next(); normalCompletion = step.done; return step; }, e: function (e) { didErr = true; err = e; }, f: function () { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

// 不同类型参数的匹配得分
var MatchScore = /*#__PURE__*/function (MatchScore) {
  MatchScore[MatchScore["static"] = 10] = "static";
  MatchScore[MatchScore["param"] = 6] = "param";
  MatchScore[MatchScore["wildcard"] = 3] = "wildcard";
  MatchScore[MatchScore["placeholder"] = -1] = "placeholder";
  return MatchScore;
}(MatchScore || {});
var defaultOption = {
  // url匹配时是否大小写敏感
  caseSensitive: true,
  // 是否严格匹配url结尾的/
  strictMode: false,
  // 是否完全精确匹配
  exact: false
};
// 正则表达式中需要转义的字符
var REGEX_CHARS_RE = /[.+*?^${}()[\]/\\]/g;
// 用于匹配两个//中的的值
var BASE_PARAM_PATTERN = '[^/]+';
var DefaultDelimiter = '/#?';

/**
 * URL匹配整体流程
 * 1.词法解析，将URL模板解析为Token
 * 2.使用Token生成正则表达式
 * 3.利用正则表达式解析URL中参数或填充URL模板
 */

function createPathParser(pathname) {
  var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultOption;
  var _option$caseSensitive = option.caseSensitive,
    caseSensitive = _option$caseSensitive === void 0 ? defaultOption.caseSensitive : _option$caseSensitive,
    _option$strictMode = option.strictMode,
    strictMode = _option$strictMode === void 0 ? defaultOption.strictMode : _option$strictMode,
    _option$exact = option.exact,
    exact = _option$exact === void 0 ? defaultOption.exact : _option$exact;
  var pattern = '^';
  var keys = [];
  var scores = [];
  var tokens = lexer(pathname);
  var onlyHasWildCard = tokens.length === 1 && tokens[0].type === TokenType.WildCard;
  var tokenCount = tokens.length;
  var lastToken = tokens[tokenCount - 1];
  var asteriskCount = 0;

  /**
   * 用于支持URL中的可选参数/:parma?
   * @description 向前扫描到下一个分隔符/，检查其中是否有?
   * @param currentIdx
   */
  var lookToNextDelimiter = function (currentIdx) {
    var hasOptionalParam = false;
    while (currentIdx < tokens.length && tokens[currentIdx].type !== TokenType.Delimiter) {
      if (tokens[currentIdx].value === '?' || tokens[currentIdx].value === '*') {
        hasOptionalParam = true;
      }
      currentIdx++;
    }
    return hasOptionalParam;
  };
  for (var tokenIdx = 0; tokenIdx < tokenCount; tokenIdx++) {
    var token = tokens[tokenIdx];
    var nextToken = tokens[tokenIdx + 1];
    switch (token.type) {
      case TokenType.Delimiter:
        var hasOptional = lookToNextDelimiter(tokenIdx + 1);
        pattern += "/" + (hasOptional ? '?' : '');
        break;
      case TokenType.Static:
        pattern += token.value.replace(REGEX_CHARS_RE, '\\$&');
        if (nextToken && nextToken.type === TokenType.Pattern) {
          pattern += "(." + nextToken.value + ")";
          keys.push(String(asteriskCount));
          asteriskCount++;
        }
        scores.push(MatchScore.static);
        break;
      case TokenType.Param:
        // 动态参数支持形如/:param、/:param*、/:param?、/:param(\\d+)的形式
        var paramRegexp = '';
        if (nextToken) {
          switch (nextToken.type) {
            case TokenType.LBracket:
              // 跳过当前Token和左括号
              tokenIdx += 2;
              while (tokens[tokenIdx].type !== TokenType.RBracket) {
                paramRegexp += tokens[tokenIdx].value;
                tokenIdx++;
              }
              paramRegexp = "(" + paramRegexp + ")";
              break;
            case TokenType.Pattern:
              tokenIdx++;
              paramRegexp += "(" + (nextToken.value === '*' ? '.*' : BASE_PARAM_PATTERN) + ")" + nextToken.value;
              break;
          }
        }
        pattern += paramRegexp ? "(?:" + paramRegexp + ")" : "(" + BASE_PARAM_PATTERN + ")";
        keys.push(token.value);
        scores.push(MatchScore.param);
        break;
      case TokenType.WildCard:
        keys.push(token.value);
        pattern += "((?:" + BASE_PARAM_PATTERN + ")" + (onlyHasWildCard ? '?' : '') + "(?:/(?:" + BASE_PARAM_PATTERN + "))*)";
        scores.push(onlyHasWildCard ? MatchScore.wildcard : MatchScore.placeholder);
        break;
    }
  }
  var isWildCard = lastToken.type === TokenType.WildCard;
  if (!isWildCard && !exact) {
    if (!strictMode) {
      pattern += "(?:[" + escapeStr(DefaultDelimiter) + "](?=$))?";
    }
    if (lastToken.type !== TokenType.Delimiter) {
      pattern += "(?=[" + escapeStr(DefaultDelimiter) + "]|$)";
    }
  } else {
    pattern += strictMode ? '$' : "[" + escapeStr(DefaultDelimiter) + "]?$";
  }
  var flag = caseSensitive ? '' : 'i';
  var regexp = new RegExp(pattern, flag);

  /**
   * @description 根据给定Pattern解析path
   */
  function parse(path) {
    var reMatch = path.match(regexp);
    if (!reMatch) {
      return null;
    }
    var matchedPath = reMatch[0];
    var params = {};
    var parseScore = Array.from(scores);
    for (var i = 1; i < reMatch.length; i++) {
      var param = reMatch[i];
      var key = keys[i - 1];
      if (key === '*' && param) {
        var value = param.split('/');
        if (!Array.isArray(params['*'])) {
          params['*'] = value;
        } else {
          var _params$;
          (_params$ = params['*']).push.apply(_params$, value);
        }
        // 完成通配符参数解析后将placeholder替换为wildcard参数的分值
        parseScore.splice.apply(parseScore, [scores.indexOf(MatchScore.placeholder), 1].concat(new Array(value.length).fill(MatchScore.wildcard)));
      } else {
        params[key] = param ? param : undefined;
      }
    }
    var isExact = path === matchedPath;
    var url = path === '/' && matchedPath === '' ? '/' : matchedPath;
    return {
      isExact: isExact,
      path: pathname,
      url: url,
      score: parseScore,
      params: params
    };
  }

  /**
   * @description 使用给定参数填充pattern，得到目标URL
   */
  function compile(params) {
    var path = '';
    var _iterator = _createForOfIteratorHelper(tokens),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _token = _step.value;
        switch (_token.type) {
          case TokenType.Static:
            path += _token.value;
            break;
          case TokenType.Param:
            if (!params[_token.value]) {
              throw new Error('Param is invalid.');
            }
            path += params[_token.value];
            break;
          case TokenType.WildCard:
            var wildCard = params['*'];
            if (wildCard instanceof Array) {
              path += wildCard.join('/');
            } else {
              path += wildCard;
            }
            break;
          case TokenType.Delimiter:
            path += _token.value;
            break;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    return path;
  }
  return {
    get regexp() {
      return regexp;
    },
    get keys() {
      return keys;
    },
    compile: compile,
    parse: parse
  };
}

/**
 * @description 依次使用pathname与pattern进行匹配，根据匹配分数取得分数最高结果
 */
function matchPath(pathname, pattern, option) {
  var patterns = Array.isArray(pattern) ? [].concat(pattern) : [pattern];
  var matchedResults = [];
  var _iterator2 = _createForOfIteratorHelper(patterns),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var item = _step2.value;
      var parser = createPathParser(item, option);
      var matched = parser.parse(pathname);
      if (matched) {
        matchedResults.push(matched);
      }
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  return !matchedResults.length ? null : matchedResults.sort(function (a, b) {
    return scoreCompare(a.score, b.score);
  })[0];
}
function generatePath(path, params) {
  var parser = createPathParser(path);
  return parser.compile(params);
}

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */
function useHistory() {
  return useContext(RouterContext).history;
}
function useLocation() {
  return useContext(RouterContext).location;
}
function useParams() {
  var match = useContext(RouterContext).match;
  return match ? match.params : {};
}
function useRouteMatch(path) {
  var pathname = useLocation().pathname;
  var match = useContext(RouterContext).match;
  if (path) {
    return matchPath(pathname, path);
  }
  return match;
}

function Route(props) {
  var context = useContext(RouterContext);
  var computed = props.computed,
    location = props.location,
    path = props.path;
  var children = props.children,
    component = props.component,
    render = props.render;
  var match;
  var routeLocation = location || context.location;
  if (computed) {
    match = computed;
  } else if (path) {
    match = matchPath(routeLocation.pathname, path);
  } else {
    match = context.match;
  }
  var newProps = _extends({}, context, {
    location: routeLocation,
    match: match
  });
  if (Array.isArray(children) && Children.count(children) === 0) {
    children = null;
  }

  /**
   * 按顺序获取需要渲染的组件
   * 1.children
   * 2.component
   * 3.render
   * 都没有匹配到返回Null
   */
  var getChildren = function () {
    // 如果 match 存在
    if (newProps.match) {
      if (children) {
        if (typeof children === 'function') {
          return children(newProps);
        }
        return children;
      }
      if (component) {
        return createElement(component, newProps);
      } else if (render) {
        return render(newProps);
      } else {
        return null;
      }
    } else {
      // match为null
      if (typeof children === 'function') {
        return children(newProps);
      }
      return null;
    }
  };
  return jsx(RouterContext.Provider, {
    value: newProps,
    children: getChildren()
  });
}

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */
function Router(props) {
  var history = props.history,
    _props$children = props.children,
    children = _props$children === void 0 ? null : _props$children;
  var _useState = useState(props.history.location),
    location = _useState[0],
    setLocation = _useState[1];
  console.log('location:', location);
  var pendingLocation = useRef(null);

  // 在Router加载时就监听history地址变化，以保证在始渲染时重定向能正确触发
  var unListen = useRef(history.listen(function (arg) {
    pendingLocation.current = arg.location;
  }));

  // 模拟componentDidMount和componentWillUnmount
  useLayoutEffect(function () {
    if (unListen.current) {
      unListen.current();
    }
    // 监听history中的位置变化
    unListen.current = history.listen(function (arg) {
      setLocation(arg.location);
    });
    if (pendingLocation.current) {
      setLocation(pendingLocation.current);
    }
    return function () {
      if (unListen.current) {
        unListen.current();
        unListen.current = null;
        pendingLocation.current = null;
      }
    };
  }, []);
  var initContextValue = useMemo(function () {
    return {
      history: history,
      location: location,
      match: {
        isExact: location.pathname === '/',
        params: {},
        path: '/',
        score: [],
        url: '/'
      }
    };
  }, [location]);
  return jsx(RouterContext.Provider, {
    value: initContextValue,
    children: children
  });
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */
function LifeCycle(props) {
  // 使用ref保存上一次的props，防止重新渲染
  var prevProps = useRef(null);
  var isMount = useRef(false);
  var onMount = props.onMount,
    onUpdate = props.onUpdate,
    onUnmount = props.onUnmount;
  useLayoutEffect(function () {
    // 首次挂载 模拟componentDidMount
    if (!isMount.current) {
      isMount.current = true;
      if (onMount) {
        onMount();
      }
    } else {
      // 不是首次渲染 模拟componentDidUpdate
      if (onUpdate) {
        prevProps.current ? onUpdate(prevProps.current) : onUpdate();
      }
    }
    prevProps.current = props;
  });

  // 模拟componentWillUnmount
  useLayoutEffect(function () {
    return function () {
      if (onUnmount) {
        onUnmount();
      }
    };
  }, []);
  return null;
}

var _excluded$2 = ["state"];
function Redirect(props) {
  var to = props.to,
    _props$push = props.push,
    push = _props$push === void 0 ? false : _props$push,
    computed = props.computed;
  var context = useContext(RouterContext);
  var history = context.history;
  var calcLocation = function () {
    if (computed) {
      if (typeof to === 'string') {
        var parser = createPathParser(to);
        var target = parser.compile(computed.params);
        return parsePath(target);
      } else {
        var pathname = to.pathname ? addHeadSlash(to.pathname) : '/';
        var _parser = createPathParser(pathname);
        var _target = _parser.compile(computed.params);
        return _extends({}, to, {
          pathname: _target
        });
      }
    }
    return typeof to === 'string' ? parsePath(to) : to;
  };
  var navigate = push ? history.push : history.replace;
  var _calcLocation = calcLocation(),
    state = _calcLocation.state,
    path = _objectWithoutPropertiesLoose(_calcLocation, _excluded$2);
  var onMountFunc = function () {
    navigate(path, state);
  };
  var onUpdateFunc = function (prevProps) {
    // 如果当前页面与重定向前页面不一致，执行跳转
    var prevPath = prevProps === null || prevProps === void 0 ? void 0 : prevProps.data;
    if (!isLocationEqual(prevPath, path)) {
      navigate(path, state);
    }
  };
  return jsx(LifeCycle, {
    onMount: onMountFunc,
    onUpdate: onUpdateFunc,
    data: path
  });
}

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */
function Switch(props) {
  var context = useContext(RouterContext);
  var location = props.location || context.location;
  var element = null;
  var match = null;

  // 使用forEach不会给InulaNode增加key属性,防止重新渲染
  Children.forEach(props.children, function (node) {
    if (match === null && isValidElement(node)) {
      element = node;
      var strict;
      var sensitive;
      var path;
      var from;

      // node可能是Route和Redirect
      if (node.type === Route) {
        var _ref = node.props;
        strict = _ref.strict;
        sensitive = _ref.sensitive;
        path = _ref.path;
      } else if (node.type === Redirect) {
        var _ref2 = node.props;
        path = _ref2.path;
        strict = _ref2.strict;
        from = _ref2.from;
      }
      var exact = node.props.exact;
      var target = path || from;

      // 更新匹配状态，一旦匹配到停止遍历
      if (target) {
        match = matchPath(location.pathname, target, {
          strictMode: strict,
          caseSensitive: sensitive,
          exact: exact
        });
      } else {
        match = context.match;
      }
    }
  });
  if (match && element) {
    // 使用cloneElement复制已有组件并更新其Props
    return cloneElement(element, {
      location: location,
      computed: match
    });
  }
  return null;
}

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */
function Prompt(props) {
  var context = useContext(RouterContext);
  var message = props.message,
    _props$when = props.when,
    when = _props$when === void 0 ? true : _props$when;
  if (typeof when === 'function' && when(context.location) === false || !when) {
    return null;
  }
  var navigate = context.history.block;
  var release = null;
  var onMountFunc = function () {
    release = message ? navigate(message) : null;
  };
  var onUpdateFunc = function (prevProps) {
    if (prevProps && prevProps.data !== message) {
      if (release) {
        release();
      }
      release = message ? navigate(message) : null;
    }
  };
  var onUnmountFunc = function () {
    if (release) {
      release();
    }
    release = null;
  };
  return jsx(LifeCycle, {
    onMount: onMountFunc,
    onUpdate: onUpdateFunc,
    onUnmount: onUnmountFunc,
    data: message
  });
}

function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    var _useContext = useContext(RouterContext),
      history = _useContext.history,
      location = _useContext.location,
      match = _useContext.match;
    var routeProps = {
      history: history,
      location: location,
      match: match
    };
    return jsx(Component, _extends({}, props, routeProps));
  }
  return ComponentWithRouterProp;
}

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */
function HashRouter(props) {
  var historyRef = useRef();
  if (historyRef.current === null || historyRef.current === undefined) {
    historyRef.current = createHashHistory({
      basename: props.basename,
      getUserConfirmation: props.getUserConfirmation,
      hashType: props.hashType
    });
  }
  return jsx(Router, {
    history: historyRef.current,
    children: props.children
  });
}

/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */
function BrowserRouter(props) {
  // 使用Ref持有History对象，防止重复渲染
  var historyRef = useRef();
  if (historyRef.current === null || historyRef.current === undefined) {
    historyRef.current = createBrowserHistory({
      basename: props.basename,
      forceRefresh: props.forceRefresh,
      getUserConfirmation: props.getUserConfirmation
    });
  }
  return jsx(Router, {
    history: historyRef.current,
    children: props.children
  });
}

var _excluded$1 = ["to", "replace", "component", "onClick", "target"];
var isModifiedEvent = function (event) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
};
var checkTarget = function (target) {
  return !target || target === '_self';
};
function Link(props) {
  var to = props.to,
    replace = props.replace;
    props.component;
    var onClick = props.onClick,
    target = props.target,
    other = _objectWithoutPropertiesLoose(props, _excluded$1);
  var tag = props.tag || 'a';
  var context = useContext(RouterContext);
  var history = context.history;
  var location = typeof to === 'function' ? to(context.location) : to;
  var state;
  var path;
  if (typeof location === 'string') {
    path = parsePath(location);
  } else {
    var pathname = location.pathname,
      hash = location.hash,
      search = location.search;
    path = {
      pathname: pathname,
      hash: hash,
      search: search
    };
    state = location.state;
  }
  var href = history.createHref(path);
  var linkClickEvent = function (event) {
    try {
      if (onClick) {
        onClick(event);
      }
    } catch (e) {
      event.preventDefault();
      throw e;
    }
    if (!event.defaultPrevented && event.button === 0 && checkTarget(target) && !isModifiedEvent(event)) {
      // 不是相同的路径执行push操作，是相同的路径执行replace
      var isSamePath = createPath(context.location) === createPath(path);
      var navigate = replace || isSamePath ? history.replace : history.push;
      event.preventDefault();
      navigate(path, state);
    }
  };
  var linkProps = _extends({
    href: href,
    onClick: linkClickEvent
  }, other);
  return Inula.createElement(tag, linkProps);
}

var _excluded = ["to", "isActive"];
function NavLink(props) {
  var to = props.to,
    isActive = props.isActive,
    rest = _objectWithoutPropertiesLoose(props, _excluded);
  var context = useContext(RouterContext);
  var toLocation = typeof to === 'function' ? to(context.location) : to;
  var _ref = typeof toLocation === 'string' ? parsePath(toLocation) : toLocation,
    pathname = _ref.pathname;
  var match = pathname ? matchPath(context.location.pathname, pathname) : null;
  var isLinkActive = match && isActive ? isActive(match, context.location) : false;
  var page = 'page';
  var otherProps = _extends({
    'aria-current': isLinkActive ? page : false
  }, rest);
  return jsx(Link, _extends({
    to: to
  }, otherProps));
}

export { BrowserRouter, HashRouter, Link, NavLink, Prompt, Redirect, Route, Router, Switch, RouterContext as __RouterContext, createBrowserHistory, createHashHistory, generatePath, matchPath, useHistory, useLocation, useParams, useRouteMatch, withRouter };
//# sourceMappingURL=router.js.map
