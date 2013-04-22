/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

(function() {

var ACE_NAMESPACE = "ace";

var global = (function() {
    return this;
})();


if (!ACE_NAMESPACE && typeof acequirejs !== "undefined")
    return;


var _define = function(module, deps, payload) {
    if (typeof module !== 'string') {
        if (_define.original)
            _define.original.apply(window, arguments);
        else {
            console.error('dropping module because define wasn\'t a string.');
            console.trace();
        }
        return;
    }

    if (arguments.length == 2)
        payload = deps;

    if (!_define.modules)
        _define.modules = {};

    _define.modules[module] = payload;
};
var _acequire = function(parentId, module, callback) {
    if (Object.prototype.toString.call(module) === "[object Array]") {
        var params = [];
        for (var i = 0, l = module.length; i < l; ++i) {
            var dep = lookup(parentId, module[i]);
            if (!dep && _acequire.original)
                return _acequire.original.apply(window, arguments);
            params.push(dep);
        }
        if (callback) {
            callback.apply(null, params);
        }
    }
    else if (typeof module === 'string') {
        var payload = lookup(parentId, module);
        if (!payload && _acequire.original)
            return _acequire.original.apply(window, arguments);

        if (callback) {
            callback();
        }

        return payload;
    }
    else {
        if (_acequire.original)
            return _acequire.original.apply(window, arguments);
    }
};

var normalizeModule = function(parentId, moduleName) {
    if (moduleName.indexOf("!") !== -1) {
        var chunks = moduleName.split("!");
        return normalizeModule(parentId, chunks[0]) + "!" + normalizeModule(parentId, chunks[1]);
    }
    if (moduleName.charAt(0) == ".") {
        var base = parentId.split("/").slice(0, -1).join("/");
        moduleName = base + "/" + moduleName;

        while(moduleName.indexOf(".") !== -1 && previous != moduleName) {
            var previous = moduleName;
            moduleName = moduleName.replace(/\/\.\//, "/").replace(/[^\/]+\/\.\.\//, "");
        }
    }

    return moduleName;
};
var lookup = function(parentId, moduleName) {

    moduleName = normalizeModule(parentId, moduleName);

    var module = _define.modules[moduleName];
    if (!module) {
        return null;
    }

    if (typeof module === 'function') {
        var exports = {};
        var mod = {
            id: moduleName,
            uri: '',
            exports: exports,
            packaged: true
        };

        var req = function(module, callback) {
            return _acequire(moduleName, module, callback);
        };

        var returnValue = module(req, exports, mod);
        exports = returnValue || mod.exports;
        _define.modules[moduleName] = exports;
        return exports;
    }

    return module;
};

function exportAce(ns) {
    var acequire = function(module, callback) {
        return _acequire("", module, callback);
    };    

    var root = global;
    if (ns) {
        if (!global[ns])
            global[ns] = {};
        root = global[ns];
    }

    if (!root.define || !root.define.packaged) {
        _define.original = root.define;
        root.define = _define;
        root.define.packaged = true;
    }

    if (!root.acequire || !root.acequire.packaged) {
        _acequire.original = root.acequire;
        root.acequire = acequire;
        root.acequire.packaged = true;
    }
}

exportAce(ACE_NAMESPACE);

})();

ace.define('ace/ace', ["require", 'exports', 'module' , 'ace/lib/fixoldbrowsers', 'ace/lib/dom', 'ace/lib/event', 'ace/editor', 'ace/edit_session', 'ace/undomanager', 'ace/virtual_renderer', 'ace/multi_select', 'ace/worker/worker_client', 'ace/keyboard/hash_handler', 'ace/placeholder', 'ace/mode/folding/fold_mode', 'ace/theme/textmate', 'ace/config'], function(acequire, exports, module) {


acequire("./lib/fixoldbrowsers");

var dom = acequire("./lib/dom");
var event = acequire("./lib/event");

var Editor = acequire("./editor").Editor;
var EditSession = acequire("./edit_session").EditSession;
var UndoManager = acequire("./undomanager").UndoManager;
var Renderer = acequire("./virtual_renderer").VirtualRenderer;
var MultiSelect = acequire("./multi_select").MultiSelect;
acequire("./worker/worker_client");
acequire("./keyboard/hash_handler");
acequire("./placeholder");
acequire("./mode/folding/fold_mode");
acequire("./theme/textmate");

exports.config = acequire("./config");
exports.acequire = acequire;
exports.edit = function(el) {
    if (typeof(el) == "string") {
        var _id = el;
        var el = document.getElementById(_id);
        if (!el)
            throw "ace.edit can't find div #" + _id;
    }

    if (el.env && el.env.editor instanceof Editor)
        return el.env.editor;

    var doc = exports.createEditSession(dom.getInnerText(el));
    el.innerHTML = '';

    var editor = new Editor(new Renderer(el));
    new MultiSelect(editor);
    editor.setSession(doc);

    var env = {
        document: doc,
        editor: editor,
        onResize: editor.resize.bind(editor, null)
    };
    event.addListener(window, "resize", env.onResize);
    editor.on("destroy", function() {
        event.removeListener(window, "resize", env.onResize);
    });
    el.env = editor.env = env;
    return editor;
};
exports.createEditSession = function(text, mode) {
    var doc = new EditSession(text, doc);
    doc.setUndoManager(new UndoManager());
    return doc;
}
exports.EditSession = EditSession;
exports.UndoManager = UndoManager;
});

ace.define('ace/lib/fixoldbrowsers', ["require", 'exports', 'module' , 'ace/lib/regexp', 'ace/lib/es5-shim'], function(acequire, exports, module) {


acequire("./regexp");
acequire("./es5-shim");

});
 
ace.define('ace/lib/regexp', ["require", 'exports', 'module' ], function(acequire, exports, module) {

    var real = {
            exec: RegExp.prototype.exec,
            test: RegExp.prototype.test,
            match: String.prototype.match,
            replace: String.prototype.replace,
            split: String.prototype.split
        },
        compliantExecNpcg = real.exec.call(/()??/, "")[1] === undefined, // check `exec` handling of nonparticipating capturing groups
        compliantLastIndexIncrement = function () {
            var x = /^/g;
            real.test.call(x, "");
            return !x.lastIndex;
        }();

    if (compliantLastIndexIncrement && compliantExecNpcg)
        return;
    RegExp.prototype.exec = function (str) {
        var match = real.exec.apply(this, arguments),
            name, r2;
        if ( typeof(str) == 'string' && match) {
            if (!compliantExecNpcg && match.length > 1 && indexOf(match, "") > -1) {
                r2 = RegExp(this.source, real.replace.call(getNativeFlags(this), "g", ""));
                real.replace.call(str.slice(match.index), r2, function () {
                    for (var i = 1; i < arguments.length - 2; i++) {
                        if (arguments[i] === undefined)
                            match[i] = undefined;
                    }
                });
            }
            if (this._xregexp && this._xregexp.captureNames) {
                for (var i = 1; i < match.length; i++) {
                    name = this._xregexp.captureNames[i - 1];
                    if (name)
                       match[name] = match[i];
                }
            }
            if (!compliantLastIndexIncrement && this.global && !match[0].length && (this.lastIndex > match.index))
                this.lastIndex--;
        }
        return match;
    };
    if (!compliantLastIndexIncrement) {
        RegExp.prototype.test = function (str) {
            var match = real.exec.call(this, str);
            if (match && this.global && !match[0].length && (this.lastIndex > match.index))
                this.lastIndex--;
            return !!match;
        };
    }

    function getNativeFlags (regex) {
        return (regex.global     ? "g" : "") +
               (regex.ignoreCase ? "i" : "") +
               (regex.multiline  ? "m" : "") +
               (regex.extended   ? "x" : "") + // Proposed for ES4; included in AS3
               (regex.sticky     ? "y" : "");
    }

    function indexOf (array, item, from) {
        if (Array.prototype.indexOf) // Use the native array method if available
            return array.indexOf(item, from);
        for (var i = from || 0; i < array.length; i++) {
            if (array[i] === item)
                return i;
        }
        return -1;
    }

});

ace.define('ace/lib/es5-shim', ["require", 'exports', 'module' ], function(acequire, exports, module) {

function Empty() {}

if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        var target = this;
        if (typeof target != "function") {
            throw new TypeError("Function.prototype.bind called on incompatible " + target);
        }
        var args = slice.call(arguments, 1); // for normal call
        var bound = function () {

            if (this instanceof bound) {

                var result = target.apply(
                    this,
                    args.concat(slice.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return this;

            } else {
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );

            }

        };
        if(target.prototype) {
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            Empty.prototype = null;
        }
        return bound;
    };
}
var call = Function.prototype.call;
var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
var slice = prototypeOfArray.slice;
var _toString = call.bind(prototypeOfObject.toString);
var owns = call.bind(prototypeOfObject.hasOwnProperty);
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if ((supportsAccessors = owns(prototypeOfObject, "__defineGetter__"))) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
}
if ([1,2].splice(0).length != 2) {
    if(function() { // test IE < 9 to splice bug - see issue #138
        function makeArray(l) {
            var a = new Array(l+2);
            a[0] = a[1] = 0;
            return a;
        }
        var array = [], lengthBefore;
        
        array.splice.apply(array, makeArray(20));
        array.splice.apply(array, makeArray(26));

        lengthBefore = array.length; //46
        array.splice(5, 0, "XXX"); // add one element

        lengthBefore + 1 == array.length

        if (lengthBefore + 1 == array.length) {
            return true;// has right splice implementation without bugs
        }
    }()) {//IE 6/7
        var array_splice = Array.prototype.splice;
        Array.prototype.splice = function(start, deleteCount) {
            if (!arguments.length) {
                return [];
            } else {
                return array_splice.apply(this, [
                    start === void 0 ? 0 : start,
                    deleteCount === void 0 ? (this.length - start) : deleteCount
                ].concat(slice.call(arguments, 2)))
            }
        };
    } else {//IE8
        Array.prototype.splice = function(pos, removeCount){
            var length = this.length;
            if (pos > 0) {
                if (pos > length)
                    pos = length;
            } else if (pos == void 0) {
                pos = 0;
            } else if (pos < 0) {
                pos = Math.max(length + pos, 0);
            }

            if (!(pos+removeCount < length))
                removeCount = length - pos;

            var removed = this.slice(pos, pos+removeCount);
            var insert = slice.call(arguments, 2);
            var add = insert.length;            
            if (pos === length) {
                if (add) {
                    this.push.apply(this, insert);
                }
            } else {
                var remove = Math.min(removeCount, length - pos);
                var tailOldPos = pos + remove;
                var tailNewPos = tailOldPos + add - remove;
                var tailCount = length - tailOldPos;
                var lengthAfterRemove = length - remove;

                if (tailNewPos < tailOldPos) { // case A
                    for (var i = 0; i < tailCount; ++i) {
                        this[tailNewPos+i] = this[tailOldPos+i];
                    }
                } else if (tailNewPos > tailOldPos) { // case B
                    for (i = tailCount; i--; ) {
                        this[tailNewPos+i] = this[tailOldPos+i];
                    }
                } // else, add == remove (nothing to do)

                if (add && pos === lengthAfterRemove) {
                    this.length = lengthAfterRemove; // truncate array
                    this.push.apply(this, insert);
                } else {
                    this.length = lengthAfterRemove + add; // reserves space
                    for (i = 0; i < add; ++i) {
                        this[pos+i] = insert[i];
                    }
                }
            }
            return removed;
        };
    }
}
if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
        return _toString(obj) == "[object Array]";
    };
}
var boxedString = Object("a"),
    splitString = boxedString[0] != "a" || !(0 in boxedString);

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            thisp = arguments[1],
            i = -1,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        while (++i < length) {
            if (i in self) {
                fun.call(thisp, self[i], i, object);
            }
        }
    };
}
if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            result = Array(length),
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self)
                result[i] = fun.call(thisp, self[i], i, object);
        }
        return result;
    };
}
if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                    object,
            length = self.length >>> 0,
            result = [],
            value,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                value = self[i];
                if (fun.call(thisp, value, i, object)) {
                    result.push(value);
                }
            }
        }
        return result;
    };
}
if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !fun.call(thisp, self[i], i, object)) {
                return false;
            }
        }
        return true;
    };
}
if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, object)) {
                return true;
            }
        }
        return false;
    };
}
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        if (!length && arguments.length == 1) {
            throw new TypeError("reduce of empty array with no initial value");
        }

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }
                if (++i >= length) {
                    throw new TypeError("reduce of empty array with no initial value");
                }
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        }

        return result;
    };
}
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        if (!length && arguments.length == 1) {
            throw new TypeError("reduceRight of empty array with no initial value");
        }

        var result, i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }
                if (--i < 0) {
                    throw new TypeError("reduceRight of empty array with no initial value");
                }
            } while (true);
        }

        do {
            if (i in this) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        } while (i--);

        return result;
    };
}
if (!Array.prototype.indexOf || ([0, 1].indexOf(1, 2) != -1)) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }

        var i = 0;
        if (arguments.length > 1) {
            i = toInteger(arguments[1]);
        }
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    };
}
if (!Array.prototype.lastIndexOf || ([0, 1].lastIndexOf(0, -3) != -1)) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }
        var i = length - 1;
        if (arguments.length > 1) {
            i = Math.min(i, toInteger(arguments[1]));
        }
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && sought === self[i]) {
                return i;
            }
        }
        return -1;
    };
}
if (!Object.getPrototypeOf) {
    Object.getPrototypeOf = function getPrototypeOf(object) {
        return object.__proto__ || (
            object.constructor ?
            object.constructor.prototype :
            prototypeOfObject
        );
    };
}
if (!Object.getOwnPropertyDescriptor) {
    var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a " +
                         "non-object: ";
    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT + object);
        if (!owns(object, property))
            return;

        var descriptor, getter, setter;
        descriptor =  { enumerable: true, configurable: true };
        if (supportsAccessors) {
            var prototype = object.__proto__;
            object.__proto__ = prototypeOfObject;

            var getter = lookupGetter(object, property);
            var setter = lookupSetter(object, property);
            object.__proto__ = prototype;

            if (getter || setter) {
                if (getter) descriptor.get = getter;
                if (setter) descriptor.set = setter;
                return descriptor;
            }
        }
        descriptor.value = object[property];
        return descriptor;
    };
}
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
        return Object.keys(object);
    };
}
if (!Object.create) {
    var createEmpty;
    if (Object.prototype.__proto__ === null) {
        createEmpty = function () {
            return { "__proto__": null };
        };
    } else {
        createEmpty = function () {
            var empty = {};
            for (var i in empty)
                empty[i] = null;
            empty.constructor =
            empty.hasOwnProperty =
            empty.propertyIsEnumerable =
            empty.isPrototypeOf =
            empty.toLocaleString =
            empty.toString =
            empty.valueOf =
            empty.__proto__ = null;
            return empty;
        }
    }

    Object.create = function create(prototype, properties) {
        var object;
        if (prototype === null) {
            object = createEmpty();
        } else {
            if (typeof prototype != "object")
                throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
            var Type = function () {};
            Type.prototype = prototype;
            object = new Type();
            object.__proto__ = prototype;
        }
        if (properties !== void 0)
            Object.defineProperties(object, properties);
        return object;
    };
}

function doesDefinePropertyWork(object) {
    try {
        Object.defineProperty(object, "sentinel", {});
        return "sentinel" in object;
    } catch (exception) {
    }
}
if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document == "undefined" ||
        doesDefinePropertyWork(document.createElement("div"));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
        var definePropertyFallback = Object.defineProperty;
    }
}

if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
    var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: "
    var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " +
                                      "on this javascript engine";

    Object.defineProperty = function defineProperty(object, property, descriptor) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT_TARGET + object);
        if ((typeof descriptor != "object" && typeof descriptor != "function") || descriptor === null)
            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);
        if (definePropertyFallback) {
            try {
                return definePropertyFallback.call(Object, object, property, descriptor);
            } catch (exception) {
            }
        }
        if (owns(descriptor, "value")) {

            if (supportsAccessors && (lookupGetter(object, property) ||
                                      lookupSetter(object, property)))
            {
                var prototype = object.__proto__;
                object.__proto__ = prototypeOfObject;
                delete object[property];
                object[property] = descriptor.value;
                object.__proto__ = prototype;
            } else {
                object[property] = descriptor.value;
            }
        } else {
            if (!supportsAccessors)
                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
            if (owns(descriptor, "get"))
                defineGetter(object, property, descriptor.get);
            if (owns(descriptor, "set"))
                defineSetter(object, property, descriptor.set);
        }

        return object;
    };
}
if (!Object.defineProperties) {
    Object.defineProperties = function defineProperties(object, properties) {
        for (var property in properties) {
            if (owns(properties, property))
                Object.defineProperty(object, property, properties[property]);
        }
        return object;
    };
}
if (!Object.seal) {
    Object.seal = function seal(object) {
        return object;
    };
}
if (!Object.freeze) {
    Object.freeze = function freeze(object) {
        return object;
    };
}
try {
    Object.freeze(function () {});
} catch (exception) {
    Object.freeze = (function freeze(freezeObject) {
        return function freeze(object) {
            if (typeof object == "function") {
                return object;
            } else {
                return freezeObject(object);
            }
        };
    })(Object.freeze);
}
if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
        return object;
    };
}
if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
        return false;
    };
}
if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
        return false;
    };
}
if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
        if (Object(object) === object) {
            throw new TypeError(); // TODO message
        }
        var name = '';
        while (owns(object, name)) {
            name += '?';
        }
        object[name] = true;
        var returnValue = owns(object, name);
        delete object[name];
        return returnValue;
    };
}
if (!Object.keys) {
    var hasDontEnumBug = true,
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null}) {
        hasDontEnumBug = false;
    }

    Object.keys = function keys(object) {

        if (
            (typeof object != "object" && typeof object != "function") ||
            object === null
        ) {
            throw new TypeError("Object.keys called on a non-object");
        }

        var keys = [];
        for (var name in object) {
            if (owns(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }
        return keys;
    };

}
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}
var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
if (!String.prototype.trim || ws.trim()) {
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
        trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
        return String(this).replace(trimBeginRegexp, "").replace(trimEndRegexp, "");
    };
}

function toInteger(n) {
    n = +n;
    if (n !== n) { // isNaN
        n = 0;
    } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
}

function isPrimitive(input) {
    var type = typeof input;
    return (
        input === null ||
        type === "undefined" ||
        type === "boolean" ||
        type === "number" ||
        type === "string"
    );
}

function toPrimitive(input) {
    var val, valueOf, toString;
    if (isPrimitive(input)) {
        return input;
    }
    valueOf = input.valueOf;
    if (typeof valueOf === "function") {
        val = valueOf.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    toString = input.toString;
    if (typeof toString === "function") {
        val = toString.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    throw new TypeError();
}
var toObject = function (o) {
    if (o == null) { // this matches both null and undefined
        throw new TypeError("can't convert "+o+" to object");
    }
    return Object(o);
};

});

ace.define('ace/lib/dom', ["require", 'exports', 'module' ], function(acequire, exports, module) {


if (typeof document == "undefined")
    return;

var XHTML_NS = "http://www.w3.org/1999/xhtml";

exports.getDocumentHead = function(doc) {
    if (!doc)
        doc = document;
    return doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
}

exports.createElement = function(tag, ns) {
    return document.createElementNS ?
           document.createElementNS(ns || XHTML_NS, tag) :
           document.createElement(tag);
};

exports.hasCssClass = function(el, name) {
    var classes = el.className.split(/\s+/g);
    return classes.indexOf(name) !== -1;
};
exports.addCssClass = function(el, name) {
    if (!exports.hasCssClass(el, name)) {
        el.className += " " + name;
    }
};
exports.removeCssClass = function(el, name) {
    var classes = el.className.split(/\s+/g);
    while (true) {
        var index = classes.indexOf(name);
        if (index == -1) {
            break;
        }
        classes.splice(index, 1);
    }
    el.className = classes.join(" ");
};

exports.toggleCssClass = function(el, name) {
    var classes = el.className.split(/\s+/g), add = true;
    while (true) {
        var index = classes.indexOf(name);
        if (index == -1) {
            break;
        }
        add = false;
        classes.splice(index, 1);
    }
    if(add)
        classes.push(name);

    el.className = classes.join(" ");
    return add;
};
exports.setCssClass = function(node, className, include) {
    if (include) {
        exports.addCssClass(node, className);
    } else {
        exports.removeCssClass(node, className);
    }
};

exports.hasCssString = function(id, doc) {
    var index = 0, sheets;
    doc = doc || document;

    if (doc.createStyleSheet && (sheets = doc.styleSheets)) {
        while (index < sheets.length)
            if (sheets[index++].owningElement.id === id) return true;
    } else if ((sheets = doc.getElementsByTagName("style"))) {
        while (index < sheets.length)
            if (sheets[index++].id === id) return true;
    }

    return false;
};

exports.importCssString = function importCssString(cssText, id, doc) {
    doc = doc || document;
    if (id && exports.hasCssString(id, doc))
        return null;
    
    var style;
    
    if (doc.createStyleSheet) {
        style = doc.createStyleSheet();
        style.cssText = cssText;
        if (id)
            style.owningElement.id = id;
    } else {
        style = doc.createElementNS
            ? doc.createElementNS(XHTML_NS, "style")
            : doc.createElement("style");

        style.appendChild(doc.createTextNode(cssText));
        if (id)
            style.id = id;

        exports.getDocumentHead(doc).appendChild(style);
    }
};

exports.importCssStylsheet = function(uri, doc) {
    if (doc.createStyleSheet) {
        doc.createStyleSheet(uri);
    } else {
        var link = exports.createElement('link');
        link.rel = 'stylesheet';
        link.href = uri;

        exports.getDocumentHead(doc).appendChild(link);
    }
};

exports.getInnerWidth = function(element) {
    return (
        parseInt(exports.computedStyle(element, "paddingLeft"), 10) +
        parseInt(exports.computedStyle(element, "paddingRight"), 10) + 
        element.clientWidth
    );
};

exports.getInnerHeight = function(element) {
    return (
        parseInt(exports.computedStyle(element, "paddingTop"), 10) +
        parseInt(exports.computedStyle(element, "paddingBottom"), 10) +
        element.clientHeight
    );
};

if (window.pageYOffset !== undefined) {
    exports.getPageScrollTop = function() {
        return window.pageYOffset;
    };

    exports.getPageScrollLeft = function() {
        return window.pageXOffset;
    };
}
else {
    exports.getPageScrollTop = function() {
        return document.body.scrollTop;
    };

    exports.getPageScrollLeft = function() {
        return document.body.scrollLeft;
    };
}

if (window.getComputedStyle)
    exports.computedStyle = function(element, style) {
        if (style)
            return (window.getComputedStyle(element, "") || {})[style] || "";
        return window.getComputedStyle(element, "") || {};
    };
else
    exports.computedStyle = function(element, style) {
        if (style)
            return element.currentStyle[style];
        return element.currentStyle;
    };

exports.scrollbarWidth = function(document) {
    var inner = exports.createElement("ace_inner");
    inner.style.width = "100%";
    inner.style.minWidth = "0px";
    inner.style.height = "200px";
    inner.style.display = "block";

    var outer = exports.createElement("ace_outer");
    var style = outer.style;

    style.position = "absolute";
    style.left = "-10000px";
    style.overflow = "hidden";
    style.width = "200px";
    style.minWidth = "0px";
    style.height = "150px";
    style.display = "block";

    outer.appendChild(inner);

    var body = document.documentElement;
    body.appendChild(outer);

    var noScrollbar = inner.offsetWidth;

    style.overflow = "scroll";
    var withScrollbar = inner.offsetWidth;

    if (noScrollbar == withScrollbar) {
        withScrollbar = outer.clientWidth;
    }

    body.removeChild(outer);

    return noScrollbar-withScrollbar;
};
exports.setInnerHtml = function(el, innerHtml) {
    var element = el.cloneNode(false);//document.createElement("div");
    element.innerHTML = innerHtml;
    el.parentNode.replaceChild(element, el);
    return element;
};

if ("textContent" in document.documentElement) {
    exports.setInnerText = function(el, innerText) {
        el.textContent = innerText;
    };

    exports.getInnerText = function(el) {
        return el.textContent;
    };
}
else {
    exports.setInnerText = function(el, innerText) {
        el.innerText = innerText;
    };

    exports.getInnerText = function(el) {
        return el.innerText;
    };
}

exports.getParentWindow = function(document) {
    return document.defaultView || document.parentWindow;
};

});

ace.define('ace/lib/event', ["require", 'exports', 'module' , 'ace/lib/keys', 'ace/lib/useragent', 'ace/lib/dom'], function(acequire, exports, module) {


var keys = acequire("./keys");
var useragent = acequire("./useragent");
var dom = acequire("./dom");

exports.addListener = function(elem, type, callback) {
    if (elem.addEventListener) {
        return elem.addEventListener(type, callback, false);
    }
    if (elem.attachEvent) {
        var wrapper = function() {
            callback(window.event);
        };
        callback._wrapper = wrapper;
        elem.attachEvent("on" + type, wrapper);
    }
};

exports.removeListener = function(elem, type, callback) {
    if (elem.removeEventListener) {
        return elem.removeEventListener(type, callback, false);
    }
    if (elem.detachEvent) {
        elem.detachEvent("on" + type, callback._wrapper || callback);
    }
};
exports.stopEvent = function(e) {
    exports.stopPropagation(e);
    exports.preventDefault(e);
    return false;
};

exports.stopPropagation = function(e) {
    if (e.stopPropagation)
        e.stopPropagation();
    else
        e.cancelBubble = true;
};

exports.preventDefault = function(e) {
    if (e.preventDefault)
        e.preventDefault();
    else
        e.returnValue = false;
};
exports.getButton = function(e) {
    if (e.type == "dblclick")
        return 0;
    if (e.type == "contextmenu" || (e.ctrlKey && useragent.isMac))
        return 2;
    if (e.preventDefault) {
        return e.button;
    }
    else {
        return {1:0, 2:2, 4:1}[e.button];
    }
};

if (document.documentElement.setCapture) {
    exports.capture = function(el, eventHandler, releaseCaptureHandler) {
        var called = false;
        function onReleaseCapture(e) {
            eventHandler(e);

            if (!called) {
                called = true;
                releaseCaptureHandler(e);
            }

            exports.removeListener(el, "mousemove", eventHandler);
            exports.removeListener(el, "mouseup", onReleaseCapture);
            exports.removeListener(el, "losecapture", onReleaseCapture);

            el.releaseCapture();
        }

        exports.addListener(el, "mousemove", eventHandler);
        exports.addListener(el, "mouseup", onReleaseCapture);
        exports.addListener(el, "losecapture", onReleaseCapture);
        el.setCapture();
    };
}
else {
    exports.capture = function(el, eventHandler, releaseCaptureHandler) {
        function onMouseUp(e) {
            eventHandler && eventHandler(e);
            releaseCaptureHandler && releaseCaptureHandler(e);

            document.removeEventListener("mousemove", eventHandler, true);
            document.removeEventListener("mouseup", onMouseUp, true);

            e.stopPropagation();
        }

        document.addEventListener("mousemove", eventHandler, true);
        document.addEventListener("mouseup", onMouseUp, true);
    };
}

exports.addMouseWheelListener = function(el, callback) {
    var factor = 8;
    var listener = function(e) {
        if (e.wheelDelta !== undefined) {
            if (e.wheelDeltaX !== undefined) {
                e.wheelX = -e.wheelDeltaX / factor;
                e.wheelY = -e.wheelDeltaY / factor;
            } else {
                e.wheelX = 0;
                e.wheelY = -e.wheelDelta / factor;
            }
        }
        else {
            if (e.axis && e.axis == e.HORIZONTAL_AXIS) {
                e.wheelX = (e.detail || 0) * 5;
                e.wheelY = 0;
            } else {
                e.wheelX = 0;
                e.wheelY = (e.detail || 0) * 5;
            }
        }
        callback(e);
    };
    exports.addListener(el, "DOMMouseScroll", listener);
    exports.addListener(el, "mousewheel", listener);
};

exports.addMultiMouseDownListener = function(el, timeouts, eventHandler, callbackName) {
    var clicks = 0;
    var startX, startY, timer;
    var eventNames = {
        2: "dblclick",
        3: "tripleclick",
        4: "quadclick"
    };

    exports.addListener(el, "mousedown", function(e) {
        if (exports.getButton(e) != 0) {
            clicks = 0;
        } else {
            var isNewClick = Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5;

            if (!timer || isNewClick)
                clicks = 0;

            clicks += 1;

            if (timer)
                clearTimeout(timer)
            timer = setTimeout(function() {timer = null}, timeouts[clicks - 1] || 600);
        }
        if (clicks == 1) {
            startX = e.clientX;
            startY = e.clientY;
        }

        eventHandler[callbackName]("mousedown", e);

        if (clicks > 4)
            clicks = 0;
        else if (clicks > 1)
            return eventHandler[callbackName](eventNames[clicks], e);
    });

    if (useragent.isOldIE) {
        exports.addListener(el, "dblclick", function(e) {
            clicks = 2;
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(function() {timer = null}, timeouts[clicks - 1] || 600);
            eventHandler[callbackName]("mousedown", e);
            eventHandler[callbackName](eventNames[clicks], e);
        });
    }
};

function normalizeCommandKeys(callback, e, keyCode) {
    var hashId = 0;
    if ((useragent.isOpera && !("KeyboardEvent" in window)) && useragent.isMac) {
        hashId = 0 | (e.metaKey ? 1 : 0) | (e.altKey ? 2 : 0)
            | (e.shiftKey ? 4 : 0) | (e.ctrlKey ? 8 : 0);
    } else {
        hashId = 0 | (e.ctrlKey ? 1 : 0) | (e.altKey ? 2 : 0)
            | (e.shiftKey ? 4 : 0) | (e.metaKey ? 8 : 0);
    }

    if (keyCode in keys.MODIFIER_KEYS) {
        switch (keys.MODIFIER_KEYS[keyCode]) {
            case "Alt":
                hashId = 2;
                break;
            case "Shift":
                hashId = 4;
                break;
            case "Ctrl":
                hashId = 1;
                break;
            default:
                hashId = 8;
                break;
        }
        keyCode = 0;
    }

    if (hashId & 8 && (keyCode == 91 || keyCode == 93)) {
        keyCode = 0;
    }
    if (!hashId && !(keyCode in keys.FUNCTION_KEYS) && !(keyCode in keys.PRINTABLE_KEYS)) {
        return false;
    }
    return callback(e, hashId, keyCode);
}

exports.addCommandKeyListener = function(el, callback) {
    var addListener = exports.addListener;
    if (useragent.isOldGecko || (useragent.isOpera && !("KeyboardEvent" in window))) {
        var lastKeyDownKeyCode = null;
        addListener(el, "keydown", function(e) {
            lastKeyDownKeyCode = e.keyCode;
        });
        addListener(el, "keypress", function(e) {
            return normalizeCommandKeys(callback, e, lastKeyDownKeyCode);
        });
    } else {
        var lastDown = null;

        addListener(el, "keydown", function(e) {
            lastDown = e.keyIdentifier || e.keyCode;
            return normalizeCommandKeys(callback, e, e.keyCode);
        });
    }
};

if (window.postMessage && !useragent.isOldIE) {
    var postMessageId = 1;
    exports.nextTick = function(callback, win) {
        win = win || window;
        var messageName = "zero-timeout-message-" + postMessageId;
        exports.addListener(win, "message", function listener(e) {
            if (e.data == messageName) {
                exports.stopPropagation(e);
                exports.removeListener(win, "message", listener);
                callback();
            }
        });
        win.postMessage(messageName, "*");
    };
}


exports.nextFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame;

if (exports.nextFrame)
    exports.nextFrame = exports.nextFrame.bind(window);
else
    exports.nextFrame = function(callback) {
        setTimeout(callback, 17);
    };
});

ace.define('ace/lib/keys', ["require", 'exports', 'module' , 'ace/lib/oop'], function(acequire, exports, module) {


var oop = acequire("./oop");
var Keys = (function() {
    var ret = {
        MODIFIER_KEYS: {
            16: 'Shift', 17: 'Ctrl', 18: 'Alt', 224: 'Meta'
        },

        KEY_MODS: {
            "ctrl": 1, "alt": 2, "option" : 2,
            "shift": 4, "meta": 8, "command": 8, "cmd": 8
        },

        FUNCTION_KEYS : {
            8  : "Backspace",
            9  : "Tab",
            13 : "Return",
            19 : "Pause",
            27 : "Esc",
            32 : "Space",
            33 : "PageUp",
            34 : "PageDown",
            35 : "End",
            36 : "Home",
            37 : "Left",
            38 : "Up",
            39 : "Right",
            40 : "Down",
            44 : "Print",
            45 : "Insert",
            46 : "Delete",
            96 : "Numpad0",
            97 : "Numpad1",
            98 : "Numpad2",
            99 : "Numpad3",
            100: "Numpad4",
            101: "Numpad5",
            102: "Numpad6",
            103: "Numpad7",
            104: "Numpad8",
            105: "Numpad9",
            112: "F1",
            113: "F2",
            114: "F3",
            115: "F4",
            116: "F5",
            117: "F6",
            118: "F7",
            119: "F8",
            120: "F9",
            121: "F10",
            122: "F11",
            123: "F12",
            144: "Numlock",
            145: "Scrolllock"
        },

        PRINTABLE_KEYS: {
           32: ' ',  48: '0',  49: '1',  50: '2',  51: '3',  52: '4', 53:  '5',
           54: '6',  55: '7',  56: '8',  57: '9',  59: ';',  61: '=', 65:  'a',
           66: 'b',  67: 'c',  68: 'd',  69: 'e',  70: 'f',  71: 'g', 72:  'h',
           73: 'i',  74: 'j',  75: 'k',  76: 'l',  77: 'm',  78: 'n', 79:  'o',
           80: 'p',  81: 'q',  82: 'r',  83: 's',  84: 't',  85: 'u', 86:  'v',
           87: 'w',  88: 'x',  89: 'y',  90: 'z', 107: '+', 109: '-', 110: '.',
          188: ',', 190: '.', 191: '/', 192: '`', 219: '[', 220: '\\',
          221: ']', 222: '\''
        }
    };
    for (var i in ret.FUNCTION_KEYS) {
        var name = ret.FUNCTION_KEYS[i].toLowerCase();
        ret[name] = parseInt(i, 10);
    }
    oop.mixin(ret, ret.MODIFIER_KEYS);
    oop.mixin(ret, ret.PRINTABLE_KEYS);
    oop.mixin(ret, ret.FUNCTION_KEYS);
    ret.enter = ret["return"];
    ret.escape = ret.esc;
    ret.del = ret["delete"];
    ret[173] = '-';

    return ret;
})();
oop.mixin(exports, Keys);

exports.keyCodeToString = function(keyCode) {
    return (Keys[keyCode] || String.fromCharCode(keyCode)).toLowerCase();
}

});

ace.define('ace/lib/oop', ["require", 'exports', 'module' ], function(acequire, exports, module) {


exports.inherits = (function() {
    var tempCtor = function() {};
    return function(ctor, superCtor) {
        tempCtor.prototype = superCtor.prototype;
        ctor.super_ = superCtor.prototype;
        ctor.prototype = new tempCtor();
        ctor.prototype.constructor = ctor;
    };
}());

exports.mixin = function(obj, mixin) {
    for (var key in mixin) {
        obj[key] = mixin[key];
    }
    return obj;
};

exports.implement = function(proto, mixin) {
    exports.mixin(proto, mixin);
};

});

ace.define('ace/lib/useragent', ["require", 'exports', 'module' ], function(acequire, exports, module) {
exports.OS = {
    LINUX: "LINUX",
    MAC: "MAC",
    WINDOWS: "WINDOWS"
};
exports.getOS = function() {
    if (exports.isMac) {
        return exports.OS.MAC;
    } else if (exports.isLinux) {
        return exports.OS.LINUX;
    } else {
        return exports.OS.WINDOWS;
    }
};
if (typeof navigator != "object")
    return;

var os = (navigator.platform.match(/mac|win|linux/i) || ["other"])[0].toLowerCase();
var ua = navigator.userAgent;
exports.isWin = (os == "win");
exports.isMac = (os == "mac");
exports.isLinux = (os == "linux");
exports.isIE = 
    (navigator.appName == "Microsoft Internet Explorer" || navigator.appName.indexOf("MSAppHost") >= 0)
    && parseFloat(navigator.userAgent.match(/MSIE ([0-9]+[\.0-9]+)/)[1]);
    
exports.isOldIE = exports.isIE && exports.isIE < 9;
exports.isGecko = exports.isMozilla = window.controllers && window.navigator.product === "Gecko";
exports.isOldGecko = exports.isGecko && parseInt((navigator.userAgent.match(/rv\:(\d+)/)||[])[1], 10) < 4;
exports.isOpera = window.opera && Object.prototype.toString.call(window.opera) == "[object Opera]";
exports.isWebKit = parseFloat(ua.split("WebKit/")[1]) || undefined;

exports.isChrome = parseFloat(ua.split(" Chrome/")[1]) || undefined;

exports.isAIR = ua.indexOf("AdobeAIR") >= 0;

exports.isIPad = ua.indexOf("iPad") >= 0;

exports.isTouchPad = ua.indexOf("TouchPad") >= 0;

});

ace.define('ace/editor', ["require", 'exports', 'module' , 'ace/lib/fixoldbrowsers', 'ace/lib/oop', 'ace/lib/lang', 'ace/lib/useragent', 'ace/keyboard/textinput', 'ace/mouse/mouse_handler', 'ace/mouse/fold_handler', 'ace/keyboard/keybinding', 'ace/edit_session', 'ace/search', 'ace/range', 'ace/lib/event_emitter', 'ace/commands/command_manager', 'ace/commands/default_commands', 'ace/config'], function(acequire, exports, module) {


acequire("./lib/fixoldbrowsers");

var oop = acequire("./lib/oop");
var lang = acequire("./lib/lang");
var useragent = acequire("./lib/useragent");
var TextInput = acequire("./keyboard/textinput").TextInput;
var MouseHandler = acequire("./mouse/mouse_handler").MouseHandler;
var FoldHandler = acequire("./mouse/fold_handler").FoldHandler;
var KeyBinding = acequire("./keyboard/keybinding").KeyBinding;
var EditSession = acequire("./edit_session").EditSession;
var Search = acequire("./search").Search;
var Range = acequire("./range").Range;
var EventEmitter = acequire("./lib/event_emitter").EventEmitter;
var CommandManager = acequire("./commands/command_manager").CommandManager;
var defaultCommands = acequire("./commands/default_commands").commands;
var config = acequire("./config");
var Editor = function(renderer, session) {
    var container = renderer.getContainerElement();
    this.container = container;
    this.renderer = renderer;

    this.commands = new CommandManager(useragent.isMac ? "mac" : "win", defaultCommands);
    this.textInput  = new TextInput(renderer.getTextAreaContainer(), this);
    this.renderer.textarea = this.textInput.getElement();
    this.keyBinding = new KeyBinding(this);
    this.$mouseHandler = new MouseHandler(this);
    new FoldHandler(this);

    this.$blockScrolling = 0;
    this.$search = new Search().set({
        wrap: true
    });

    this.setSession(session || new EditSession(""));
    config.resetOptions(this);
    config._emit("editor", this);
};

(function(){

    oop.implement(this, EventEmitter);
    this.setKeyboardHandler = function(keyboardHandler) {
        if (!keyboardHandler) {
            this.keyBinding.setKeyboardHandler(null);
        } else if (typeof keyboardHandler == "string") {
            this.$keybindingId = keyboardHandler;
            var _self = this;
            config.loadModule(["keybinding", keyboardHandler], function(module) {
                if (_self.$keybindingId == keyboardHandler)
                    _self.keyBinding.setKeyboardHandler(module && module.handler);
            });
        } else {
            delete this.$keybindingId;
            this.keyBinding.setKeyboardHandler(keyboardHandler);
        }
    };
    this.getKeyboardHandler = function() {
        return this.keyBinding.getKeyboardHandler();
    };
    this.setSession = function(session) {
        if (this.session == session)
            return;

        if (this.session) {
            var oldSession = this.session;
            this.session.removeEventListener("change", this.$onDocumentChange);
            this.session.removeEventListener("changeMode", this.$onChangeMode);
            this.session.removeEventListener("tokenizerUpdate", this.$onTokenizerUpdate);
            this.session.removeEventListener("changeTabSize", this.$onChangeTabSize);
            this.session.removeEventListener("changeWrapLimit", this.$onChangeWrapLimit);
            this.session.removeEventListener("changeWrapMode", this.$onChangeWrapMode);
            this.session.removeEventListener("onChangeFold", this.$onChangeFold);
            this.session.removeEventListener("changeFrontMarker", this.$onChangeFrontMarker);
            this.session.removeEventListener("changeBackMarker", this.$onChangeBackMarker);
            this.session.removeEventListener("changeBreakpoint", this.$onChangeBreakpoint);
            this.session.removeEventListener("changeAnnotation", this.$onChangeAnnotation);
            this.session.removeEventListener("changeOverwrite", this.$onCursorChange);
            this.session.removeEventListener("changeScrollTop", this.$onScrollTopChange);
            this.session.removeEventListener("changeScrollLeft", this.$onScrollLeftChange);

            var selection = this.session.getSelection();
            selection.removeEventListener("changeCursor", this.$onCursorChange);
            selection.removeEventListener("changeSelection", this.$onSelectionChange);
        }

        this.session = session;

        this.$onDocumentChange = this.onDocumentChange.bind(this);
        session.addEventListener("change", this.$onDocumentChange);
        this.renderer.setSession(session);

        this.$onChangeMode = this.onChangeMode.bind(this);
        session.addEventListener("changeMode", this.$onChangeMode);

        this.$onTokenizerUpdate = this.onTokenizerUpdate.bind(this);
        session.addEventListener("tokenizerUpdate", this.$onTokenizerUpdate);

        this.$onChangeTabSize = this.renderer.onChangeTabSize.bind(this.renderer);
        session.addEventListener("changeTabSize", this.$onChangeTabSize);

        this.$onChangeWrapLimit = this.onChangeWrapLimit.bind(this);
        session.addEventListener("changeWrapLimit", this.$onChangeWrapLimit);

        this.$onChangeWrapMode = this.onChangeWrapMode.bind(this);
        session.addEventListener("changeWrapMode", this.$onChangeWrapMode);

        this.$onChangeFold = this.onChangeFold.bind(this);
        session.addEventListener("changeFold", this.$onChangeFold);

        this.$onChangeFrontMarker = this.onChangeFrontMarker.bind(this);
        this.session.addEventListener("changeFrontMarker", this.$onChangeFrontMarker);

        this.$onChangeBackMarker = this.onChangeBackMarker.bind(this);
        this.session.addEventListener("changeBackMarker", this.$onChangeBackMarker);

        this.$onChangeBreakpoint = this.onChangeBreakpoint.bind(this);
        this.session.addEventListener("changeBreakpoint", this.$onChangeBreakpoint);

        this.$onChangeAnnotation = this.onChangeAnnotation.bind(this);
        this.session.addEventListener("changeAnnotation", this.$onChangeAnnotation);

        this.$onCursorChange = this.onCursorChange.bind(this);
        this.session.addEventListener("changeOverwrite", this.$onCursorChange);

        this.$onScrollTopChange = this.onScrollTopChange.bind(this);
        this.session.addEventListener("changeScrollTop", this.$onScrollTopChange);

        this.$onScrollLeftChange = this.onScrollLeftChange.bind(this);
        this.session.addEventListener("changeScrollLeft", this.$onScrollLeftChange);

        this.selection = session.getSelection();
        this.selection.addEventListener("changeCursor", this.$onCursorChange);

        this.$onSelectionChange = this.onSelectionChange.bind(this);
        this.selection.addEventListener("changeSelection", this.$onSelectionChange);

        this.onChangeMode();

        this.$blockScrolling += 1;
        this.onCursorChange();
        this.$blockScrolling -= 1;

        this.onScrollTopChange();
        this.onScrollLeftChange();
        this.onSelectionChange();
        this.onChangeFrontMarker();
        this.onChangeBackMarker();
        this.onChangeBreakpoint();
        this.onChangeAnnotation();
        this.session.getUseWrapMode() && this.renderer.adjustWrapLimit();
        this.renderer.updateFull();

        this._emit("changeSession", {
            session: session,
            oldSession: oldSession
        });
    };
    this.getSession = function() {
        return this.session;
    };
    this.setValue = function(val, cursorPos) {
        this.session.doc.setValue(val);

        if (!cursorPos)
            this.selectAll();
        else if (cursorPos == 1)
            this.navigateFileEnd();
        else if (cursorPos == -1)
            this.navigateFileStart();

        return val;
    };
    this.getValue = function() {
        return this.session.getValue();
    };
    this.getSelection = function() {
        return this.selection;
    };
    this.resize = function(force) {
        this.renderer.onResize(force);
    };
    this.setTheme = function(theme) {
        this.renderer.setTheme(theme);
    };
    this.getTheme = function() {
        return this.renderer.getTheme();
    };
    this.setStyle = function(style) {
        this.renderer.setStyle(style);
    };
    this.unsetStyle = function(style) {
        this.renderer.unsetStyle(style);
    };
    this.setFontSize = function(size) {
        this.setOption("fontSize", size);
    };

    this.$highlightBrackets = function() {
        if (this.session.$bracketHighlight) {
            this.session.removeMarker(this.session.$bracketHighlight);
            this.session.$bracketHighlight = null;
        }

        if (this.$highlightPending) {
            return;
        }
        var self = this;
        this.$highlightPending = true;
        setTimeout(function() {
            self.$highlightPending = false;

            var pos = self.session.findMatchingBracket(self.getCursorPosition());
            if (pos) {
                var range = new Range(pos.row, pos.column, pos.row, pos.column+1);
            } else if (self.session.$mode.getMatching) {
                var range = self.session.$mode.getMatching(self.session);
            }
            if (range)
                self.session.$bracketHighlight = self.session.addMarker(range, "ace_bracket", "text");
        }, 50);
    };
    this.focus = function() {
        var _self = this;
        setTimeout(function() {
            _self.textInput.focus();
        });
        this.textInput.focus();
    };
    this.isFocused = function() {
        return this.textInput.isFocused();
    };
    this.blur = function() {
        this.textInput.blur();
    };
    this.onFocus = function() {
        if (this.$isFocused)
            return;
        this.$isFocused = true;
        this.renderer.showCursor();
        this.renderer.visualizeFocus();
        this._emit("focus");
    };
    this.onBlur = function() {
        if (!this.$isFocused)
            return;
        this.$isFocused = false;
        this.renderer.hideCursor();
        this.renderer.visualizeBlur();
        this._emit("blur");
    };

    this.$cursorChange = function() {
        this.renderer.updateCursor();
    };
    this.onDocumentChange = function(e) {
        var delta = e.data;
        var range = delta.range;
        var lastRow;

        if (range.start.row == range.end.row && delta.action != "insertLines" && delta.action != "removeLines")
            lastRow = range.end.row;
        else
            lastRow = Infinity;
        this.renderer.updateLines(range.start.row, lastRow);

        this._emit("change", e);
        this.$cursorChange();
    };

    this.onTokenizerUpdate = function(e) {
        var rows = e.data;
        this.renderer.updateLines(rows.first, rows.last);
    };


    this.onScrollTopChange = function() {
        this.renderer.scrollToY(this.session.getScrollTop());
    };

    this.onScrollLeftChange = function() {
        this.renderer.scrollToX(this.session.getScrollLeft());
    };
    this.onCursorChange = function() {
        this.$cursorChange();

        if (!this.$blockScrolling) {
            this.renderer.scrollCursorIntoView();
        }

        this.$highlightBrackets();
        this.$updateHighlightActiveLine();
        this._emit("changeSelection");
    };

    this.$updateHighlightActiveLine = function() {
        var session = this.getSession();

        var highlight;
        if (this.$highlightActiveLine) {
            if ((this.$selectionStyle != "line" || !this.selection.isMultiLine()))
                highlight = this.getCursorPosition();
        }

        if (session.$highlightLineMarker && !highlight) {
            session.removeMarker(session.$highlightLineMarker.id);
            session.$highlightLineMarker = null;
        } else if (!session.$highlightLineMarker && highlight) {
            var range = new Range(highlight.row, highlight.column, highlight.row, Infinity);
            range.id = session.addMarker(range, "ace_active-line", "screenLine");
            session.$highlightLineMarker = range;
        } else if (highlight) {
            session.$highlightLineMarker.start.row = highlight.row;
            session.$highlightLineMarker.end.row = highlight.row;
            session.$highlightLineMarker.start.column = highlight.column;
            session._emit("changeBackMarker");
        }
    };

    this.onSelectionChange = function(e) {
        var session = this.session;

        if (session.$selectionMarker) {
            session.removeMarker(session.$selectionMarker);
        }
        session.$selectionMarker = null;

        if (!this.selection.isEmpty()) {
            var range = this.selection.getRange();
            var style = this.getSelectionStyle();
            session.$selectionMarker = session.addMarker(range, "ace_selection", style);
        } else {
            this.$updateHighlightActiveLine();
        }

        var re = this.$highlightSelectedWord && this.$getSelectionHighLightRegexp()
        this.session.highlight(re);

        this._emit("changeSelection");
    };

    this.$getSelectionHighLightRegexp = function() {
        var session = this.session;

        var selection = this.getSelectionRange();
        if (selection.isEmpty() || selection.isMultiLine())
            return;

        var startOuter = selection.start.column - 1;
        var endOuter = selection.end.column + 1;
        var line = session.getLine(selection.start.row);
        var lineCols = line.length;
        var needle = line.substring(Math.max(startOuter, 0),
                                    Math.min(endOuter, lineCols));
        if ((startOuter >= 0 && /^[\w\d]/.test(needle)) ||
            (endOuter <= lineCols && /[\w\d]$/.test(needle)))
            return;

        needle = line.substring(selection.start.column, selection.end.column);
        if (!/^[\w\d]+$/.test(needle))
            return;

        var re = this.$search.$assembleRegExp({
            wholeWord: true,
            caseSensitive: true,
            needle: needle
        });

        return re;
    };


    this.onChangeFrontMarker = function() {
        this.renderer.updateFrontMarkers();
    };

    this.onChangeBackMarker = function() {
        this.renderer.updateBackMarkers();
    };


    this.onChangeBreakpoint = function() {
        this.renderer.updateBreakpoints();
    };

    this.onChangeAnnotation = function() {
        this.renderer.setAnnotations(this.session.getAnnotations());
    };


    this.onChangeMode = function(e) {
        this.renderer.updateText();
        this._emit("changeMode", e);
    };


    this.onChangeWrapLimit = function() {
        this.renderer.updateFull();
    };

    this.onChangeWrapMode = function() {
        this.renderer.onResize(true);
    };


    this.onChangeFold = function() {
        this.$updateHighlightActiveLine();
        this.renderer.updateFull();
    };

    this.getCopyText = function() {
        var text = "";
        if (!this.selection.isEmpty())
            text = this.session.getTextRange(this.getSelectionRange());

        this._emit("copy", text);
        return text;
    };
    this.onCopy = function() {
        this.commands.exec("copy", this);
    };
    this.onCut = function() {
        this.commands.exec("cut", this);
    };
    this.onPaste = function(text) {
        if (this.$readOnly)
            return;
        this._emit("paste", text);
        this.insert(text);
    };


    this.execCommand = function(command, args) {
        this.commands.exec(command, this, args);
    };
    this.insert = function(text) {
        var session = this.session;
        var mode = session.getMode();
        var cursor = this.getCursorPosition();

        if (this.getBehavioursEnabled()) {
            var transform = mode.transformAction(session.getState(cursor.row), 'insertion', this, session, text);
            if (transform)
                text = transform.text;
        }

        text = text.replace("\t", this.session.getTabString());
        if (!this.selection.isEmpty()) {
            cursor = this.session.remove(this.getSelectionRange());
            this.clearSelection();
        }
        else if (this.session.getOverwrite()) {
            var range = new Range.fromPoints(cursor, cursor);
            range.end.column += text.length;
            this.session.remove(range);
        }

        this.clearSelection();

        var start = cursor.column;
        var lineState = session.getState(cursor.row);
        var line = session.getLine(cursor.row);
        var shouldOutdent = mode.checkOutdent(lineState, line, text);
        var end = session.insert(cursor, text);

        if (transform && transform.selection) {
            if (transform.selection.length == 2) { // Transform relative to the current column
                this.selection.setSelectionRange(
                    new Range(cursor.row, start + transform.selection[0],
                              cursor.row, start + transform.selection[1]));
            } else { // Transform relative to the current row.
                this.selection.setSelectionRange(
                    new Range(cursor.row + transform.selection[0],
                              transform.selection[1],
                              cursor.row + transform.selection[2],
                              transform.selection[3]));
            }
        }
        if (session.getDocument().isNewLine(text)) {
            var lineIndent = mode.getNextLineIndent(lineState, line.slice(0, cursor.column), session.getTabString());

            this.moveCursorTo(cursor.row+1, 0);

            var size = session.getTabSize();
            var minIndent = Number.MAX_VALUE;

            for (var row = cursor.row + 1; row <= end.row; ++row) {
                var indent = 0;

                line = session.getLine(row);
                for (var i = 0; i < line.length; ++i)
                    if (line.charAt(i) == '\t')
                        indent += size;
                    else if (line.charAt(i) == ' ')
                        indent += 1;
                    else
                        break;
                if (/[^\s]/.test(line))
                    minIndent = Math.min(indent, minIndent);
            }

            for (var row = cursor.row + 1; row <= end.row; ++row) {
                var outdent = minIndent;

                line = session.getLine(row);
                for (var i = 0; i < line.length && outdent > 0; ++i)
                    if (line.charAt(i) == '\t')
                        outdent -= size;
                    else if (line.charAt(i) == ' ')
                        outdent -= 1;
                session.remove(new Range(row, 0, row, i));
            }
            session.indentRows(cursor.row + 1, end.row, lineIndent);
        }
        if (shouldOutdent)
            mode.autoOutdent(lineState, session, cursor.row);
    };

    this.onTextInput = function(text) {
        this.keyBinding.onTextInput(text);
    };

    this.onCommandKey = function(e, hashId, keyCode) {
        this.keyBinding.onCommandKey(e, hashId, keyCode);
    };
    this.setOverwrite = function(overwrite) {
        this.session.setOverwrite(overwrite);
    };
    this.getOverwrite = function() {
        return this.session.getOverwrite();
    };
    this.toggleOverwrite = function() {
        this.session.toggleOverwrite();
    };
    this.setScrollSpeed = function(speed) {
        this.setOption("scrollSpeed", speed);
    };
    this.getScrollSpeed = function() {
        return this.getOption("scrollSpeed");
    };
    this.setDragDelay = function(dragDelay) {
        this.setOption("dragDelay", dragDelay);
    };
    this.getDragDelay = function() {
        return this.getOption("dragDelay");
    };
    this.setSelectionStyle = function(val) {
        this.setOption("selectionStyle", val);
    };
    this.getSelectionStyle = function() {
        return this.getOption("selectionStyle");
    };
    this.setHighlightActiveLine = function(shouldHighlight) {
        this.setOption("highlightActiveLine", shouldHighlight);
    };
    this.getHighlightActiveLine = function() {
        return this.getOption("highlightActiveLine");
    };
    this.setHighlightGutterLine = function(shouldHighlight) {
        this.setOption("highlightGutterLine", shouldHighlight);
    };

    this.getHighlightGutterLine = function() {
        return this.getOption("highlightGutterLine");
    };
    this.setHighlightSelectedWord = function(shouldHighlight) {
        this.setOption("highlightSelectedWord", shouldHighlight);
    };
    this.getHighlightSelectedWord = function() {
        return this.$highlightSelectedWord;
    };

    this.setAnimatedScroll = function(shouldAnimate){
        this.renderer.setAnimatedScroll(shouldAnimate);
    };

    this.getAnimatedScroll = function(){
        return this.renderer.getAnimatedScroll();
    };
    this.setShowInvisibles = function(showInvisibles) {
        this.renderer.setShowInvisibles(showInvisibles);
    };
    this.getShowInvisibles = function() {
        return this.renderer.getShowInvisibles();
    };

    this.setDisplayIndentGuides = function(display) {
        this.renderer.setDisplayIndentGuides(display);
    };

    this.getDisplayIndentGuides = function() {
        return this.renderer.getDisplayIndentGuides();
    };
    this.setShowPrintMargin = function(showPrintMargin) {
        this.renderer.setShowPrintMargin(showPrintMargin);
    };
    this.getShowPrintMargin = function() {
        return this.renderer.getShowPrintMargin();
    };
    this.setPrintMarginColumn = function(showPrintMargin) {
        this.renderer.setPrintMarginColumn(showPrintMargin);
    };
    this.getPrintMarginColumn = function() {
        return this.renderer.getPrintMarginColumn();
    };
    this.setReadOnly = function(readOnly) {
        this.setOption("readOnly", readOnly);
    };
    this.getReadOnly = function() {
        return this.getOption("readOnly");
    };
    this.setBehavioursEnabled = function (enabled) {
        this.setOption("behavioursEnabled", enabled);
    };
    this.getBehavioursEnabled = function () {
        return this.getOption("behavioursEnabled");
    };
    this.setWrapBehavioursEnabled = function (enabled) {
        this.setOption("wrapBehavioursEnabled", enabled);
    };
    this.getWrapBehavioursEnabled = function () {
        return this.getOption("wrapBehavioursEnabled");
    };
    this.setShowFoldWidgets = function(show) {
        this.setOption("showFoldWidgets", show);

    };
    this.getShowFoldWidgets = function() {
        return this.getOption("showFoldWidgets");
    };

    this.setFadeFoldWidgets = function(fade) {
        this.setOption("fadeFoldWidgets", fade);
    };

    this.getFadeFoldWidgets = function() {
        return this.getOption("fadeFoldWidgets");
    };
    this.remove = function(dir) {
        if (this.selection.isEmpty()){
            if (dir == "left")
                this.selection.selectLeft();
            else
                this.selection.selectRight();
        }

        var range = this.getSelectionRange();
        if (this.getBehavioursEnabled()) {
            var session = this.session;
            var state = session.getState(range.start.row);
            var new_range = session.getMode().transformAction(state, 'deletion', this, session, range);
            if (new_range)
                range = new_range;
        }

        this.session.remove(range);
        this.clearSelection();
    };
    this.removeWordRight = function() {
        if (this.selection.isEmpty())
            this.selection.selectWordRight();

        this.session.remove(this.getSelectionRange());
        this.clearSelection();
    };
    this.removeWordLeft = function() {
        if (this.selection.isEmpty())
            this.selection.selectWordLeft();

        this.session.remove(this.getSelectionRange());
        this.clearSelection();
    };
    this.removeToLineStart = function() {
        if (this.selection.isEmpty())
            this.selection.selectLineStart();

        this.session.remove(this.getSelectionRange());
        this.clearSelection();
    };
    this.removeToLineEnd = function() {
        if (this.selection.isEmpty())
            this.selection.selectLineEnd();

        var range = this.getSelectionRange();
        if (range.start.column == range.end.column && range.start.row == range.end.row) {
            range.end.column = 0;
            range.end.row++;
        }

        this.session.remove(range);
        this.clearSelection();
    };
    this.splitLine = function() {
        if (!this.selection.isEmpty()) {
            this.session.remove(this.getSelectionRange());
            this.clearSelection();
        }

        var cursor = this.getCursorPosition();
        this.insert("\n");
        this.moveCursorToPosition(cursor);
    };
    this.transposeLetters = function() {
        if (!this.selection.isEmpty()) {
            return;
        }

        var cursor = this.getCursorPosition();
        var column = cursor.column;
        if (column === 0)
            return;

        var line = this.session.getLine(cursor.row);
        var swap, range;
        if (column < line.length) {
            swap = line.charAt(column) + line.charAt(column-1);
            range = new Range(cursor.row, column-1, cursor.row, column+1);
        }
        else {
            swap = line.charAt(column-1) + line.charAt(column-2);
            range = new Range(cursor.row, column-2, cursor.row, column);
        }
        this.session.replace(range, swap);
    };
    this.toLowerCase = function() {
        var originalRange = this.getSelectionRange();
        if (this.selection.isEmpty()) {
            this.selection.selectWord();
        }

        var range = this.getSelectionRange();
        var text = this.session.getTextRange(range);
        this.session.replace(range, text.toLowerCase());
        this.selection.setSelectionRange(originalRange);
    };
    this.toUpperCase = function() {
        var originalRange = this.getSelectionRange();
        if (this.selection.isEmpty()) {
            this.selection.selectWord();
        }

        var range = this.getSelectionRange();
        var text = this.session.getTextRange(range);
        this.session.replace(range, text.toUpperCase());
        this.selection.setSelectionRange(originalRange);
    };
    this.indent = function() {
        var session = this.session;
        var range = this.getSelectionRange();

        if (range.start.row < range.end.row || range.start.column < range.end.column) {
            var rows = this.$getSelectedRows();
            session.indentRows(rows.first, rows.last, "\t");
        } else {
            var indentString;

            if (this.session.getUseSoftTabs()) {
                var size        = session.getTabSize(),
                    position    = this.getCursorPosition(),
                    column      = session.documentToScreenColumn(position.row, position.column),
                    count       = (size - column % size);

                indentString = lang.stringRepeat(" ", count);
            } else
                indentString = "\t";
            return this.insert(indentString);
        }
    };
    this.blockIndent = function() {
        var rows = this.$getSelectedRows();
        this.session.indentRows(rows.first, rows.last, "\t");
    };
    this.blockOutdent = function() {
        var selection = this.session.getSelection();
        this.session.outdentRows(selection.getRange());
    };
    this.sortLines = function() {
        var rows = this.$getSelectedRows();
        var session = this.session;

        var lines = [];
        for (i = rows.first; i <= rows.last; i++)
            lines.push(session.getLine(i));

        lines.sort(function(a, b) {
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            if (a.toLowerCase() > b.toLowerCase()) return 1;
            return 0;
        });

        var deleteRange = new Range(0, 0, 0, 0);
        for (var i = rows.first; i <= rows.last; i++) {
            var line = session.getLine(i);
            deleteRange.start.row = i;
            deleteRange.end.row = i;
            deleteRange.end.column = line.length;
            session.replace(deleteRange, lines[i-rows.first]);
        }
    };
    this.toggleCommentLines = function() {
        var state = this.session.getState(this.getCursorPosition().row);
        var rows = this.$getSelectedRows();
        this.session.getMode().toggleCommentLines(state, this.session, rows.first, rows.last);
    };
    this.getNumberAt = function( row, column ) {
        var _numberRx = /[\-]?[0-9]+(?:\.[0-9]+)?/g
        _numberRx.lastIndex = 0

        var s = this.session.getLine(row)
        while (_numberRx.lastIndex < column) {
            var m = _numberRx.exec(s)
            if(m.index <= column && m.index+m[0].length >= column){
                var number = {
                    value: m[0],
                    start: m.index,
                    end: m.index+m[0].length
                }
                return number;
            }
        }
        return null;
    };
    this.modifyNumber = function(amount) {
        var row = this.selection.getCursor().row;
        var column = this.selection.getCursor().column;
        var charRange = new Range(row, column-1, row, column);

        var c = this.session.getTextRange(charRange);
        if (!isNaN(parseFloat(c)) && isFinite(c)) {
            var nr = this.getNumberAt(row, column);
            if (nr) {
                var fp = nr.value.indexOf(".") >= 0 ? nr.start + nr.value.indexOf(".") + 1 : nr.end;
                var decimals = nr.start + nr.value.length - fp;

                var t = parseFloat(nr.value);
                t *= Math.pow(10, decimals);


                if(fp !== nr.end && column < fp){
                    amount *= Math.pow(10, nr.end - column - 1);
                } else {
                    amount *= Math.pow(10, nr.end - column);
                }

                t += amount;
                t /= Math.pow(10, decimals);
                var nnr = t.toFixed(decimals);
                var replaceRange = new Range(row, nr.start, row, nr.end);
                this.session.replace(replaceRange, nnr);
                this.moveCursorTo(row, Math.max(nr.start +1, column + nnr.length - nr.value.length));

            }
        }
    };
    this.removeLines = function() {
        var rows = this.$getSelectedRows();
        var range;
        if (rows.first === 0 || rows.last+1 < this.session.getLength())
            range = new Range(rows.first, 0, rows.last+1, 0);
        else
            range = new Range(
                rows.first-1, this.session.getLine(rows.first-1).length,
                rows.last, this.session.getLine(rows.last).length
            );
        this.session.remove(range);
        this.clearSelection();
    };

    this.duplicateSelection = function() {
        var sel = this.selection;
        var doc = this.session;
        var range = sel.getRange();
        var reverse = sel.isBackwards();
        if (range.isEmpty()) {
            var row = range.start.row;
            doc.duplicateLines(row, row);
        } else {
            var point = reverse ? range.start : range.end;
            var endPoint = doc.insert(point, doc.getTextRange(range), false);
            range.start = point;
            range.end = endPoint;

            sel.setSelectionRange(range, reverse)
        }
    };
    this.moveLinesDown = function() {
        this.$moveLines(function(firstRow, lastRow) {
            return this.session.moveLinesDown(firstRow, lastRow);
        });
    };
    this.moveLinesUp = function() {
        this.$moveLines(function(firstRow, lastRow) {
            return this.session.moveLinesUp(firstRow, lastRow);
        });
    };
    this.moveText = function(range, toPosition) {
        return this.session.moveText(range, toPosition);
    };
    this.copyLinesUp = function() {
        this.$moveLines(function(firstRow, lastRow) {
            this.session.duplicateLines(firstRow, lastRow);
            return 0;
        });
    };
    this.copyLinesDown = function() {
        this.$moveLines(function(firstRow, lastRow) {
            return this.session.duplicateLines(firstRow, lastRow);
        });
    };
    this.$moveLines = function(mover) {
        var selection = this.selection;
        if (!selection.inMultiSelectMode || this.inVirtualSelectionMode) {
            var range = selection.toOrientedRange();
            var rows = this.$getSelectedRows(range);
            var linesMoved = mover.call(this, rows.first, rows.last);
            range.moveBy(linesMoved, 0);
            selection.fromOrientedRange(range);
        } else {
            var ranges = selection.rangeList.ranges;
            selection.rangeList.detach(this.session);

            for (var i = ranges.length; i--; ) {
                var rangeIndex = i;
                var rows = ranges[i].collapseRows();
                var last = rows.end.row;
                var first = rows.start.row;
                while (i--) {
                    var rows = ranges[i].collapseRows();
                    if (first - rows.end.row <= 1)
                        first = rows.end.row;
                    else
                        break;
                }
                i++;

                var linesMoved = mover.call(this, first, last);
                while (rangeIndex >= i) {
                    ranges[rangeIndex].moveBy(linesMoved, 0);
                    rangeIndex--;
                }
            }
            selection.fromOrientedRange(selection.ranges[0]);
            selection.rangeList.attach(this.session);
        }
    };
    this.$getSelectedRows = function() {
        var range = this.getSelectionRange().collapseRows();

        return {
            first: range.start.row,
            last: range.end.row
        };
    };

    this.onCompositionStart = function(text) {
        this.renderer.showComposition(this.getCursorPosition());
    };

    this.onCompositionUpdate = function(text) {
        this.renderer.setCompositionText(text);
    };

    this.onCompositionEnd = function() {
        this.renderer.hideComposition();
    };
    this.getFirstVisibleRow = function() {
        return this.renderer.getFirstVisibleRow();
    };
    this.getLastVisibleRow = function() {
        return this.renderer.getLastVisibleRow();
    };
    this.isRowVisible = function(row) {
        return (row >= this.getFirstVisibleRow() && row <= this.getLastVisibleRow());
    };
    this.isRowFullyVisible = function(row) {
        return (row >= this.renderer.getFirstFullyVisibleRow() && row <= this.renderer.getLastFullyVisibleRow());
    };
    this.$getVisibleRowCount = function() {
        return this.renderer.getScrollBottomRow() - this.renderer.getScrollTopRow() + 1;
    };

    this.$moveByPage = function(dir, select) {
        var renderer = this.renderer;
        var config = this.renderer.layerConfig;
        var rows = dir * Math.floor(config.height / config.lineHeight);

        this.$blockScrolling++;
        if (select == true) {
            this.selection.$moveSelection(function(){
                this.moveCursorBy(rows, 0);
            });
        } else if (select == false) {
            this.selection.moveCursorBy(rows, 0);
            this.selection.clearSelection();
        }
        this.$blockScrolling--;

        var scrollTop = renderer.scrollTop;

        renderer.scrollBy(0, rows * config.lineHeight);
        if (select != null)
            renderer.scrollCursorIntoView(null, 0.5);

        renderer.animateScrolling(scrollTop);
    };
    this.selectPageDown = function() {
        this.$moveByPage(1, true);
    };
    this.selectPageUp = function() {
        this.$moveByPage(-1, true);
    };
    this.gotoPageDown = function() {
       this.$moveByPage(1, false);
    };
    this.gotoPageUp = function() {
        this.$moveByPage(-1, false);
    };
    this.scrollPageDown = function() {
        this.$moveByPage(1);
    };
    this.scrollPageUp = function() {
        this.$moveByPage(-1);
    };
    this.scrollToRow = function(row) {
        this.renderer.scrollToRow(row);
    };
    this.scrollToLine = function(line, center, animate, callback) {
        this.renderer.scrollToLine(line, center, animate, callback);
    };
    this.centerSelection = function() {
        var range = this.getSelectionRange();
        var pos = {
            row: Math.floor(range.start.row + (range.end.row - range.start.row) / 2),
            column: Math.floor(range.start.column + (range.end.column - range.start.column) / 2)
        }
        this.renderer.alignCursor(pos, 0.5);
    };
    this.getCursorPosition = function() {
        return this.selection.getCursor();
    };
    this.getCursorPositionScreen = function() {
        return this.session.documentToScreenPosition(this.getCursorPosition());
    };
    this.getSelectionRange = function() {
        return this.selection.getRange();
    };
    this.selectAll = function() {
        this.$blockScrolling += 1;
        this.selection.selectAll();
        this.$blockScrolling -= 1;
    };
    this.clearSelection = function() {
        this.selection.clearSelection();
    };
    this.moveCursorTo = function(row, column) {
        this.selection.moveCursorTo(row, column);
    };
    this.moveCursorToPosition = function(pos) {
        this.selection.moveCursorToPosition(pos);
    };
    this.jumpToMatching = function(select) {
        var cursor = this.getCursorPosition();

        var range = this.session.getBracketRange(cursor);
        if (!range) {
            range = this.find({
                needle: /[{}()\[\]]/g,
                preventScroll:true,
                start: {row: cursor.row, column: cursor.column - 1}
            });
            if (!range)
                return;
            var pos = range.start;
            if (pos.row == cursor.row && Math.abs(pos.column - cursor.column) < 2)
                range = this.session.getBracketRange(pos);
        }

        pos = range && range.cursor || pos;
        if (pos) {
            if (select) {
                if (range && range.isEqual(this.getSelectionRange()))
                    this.clearSelection();
                else
                    this.selection.selectTo(pos.row, pos.column);
            } else {
                this.clearSelection();
                this.moveCursorTo(pos.row, pos.column);
            }
        }
    };
    this.gotoLine = function(lineNumber, column, animate) {
        this.selection.clearSelection();
        this.session.unfold({row: lineNumber - 1, column: column || 0});

        this.$blockScrolling += 1;
        this.moveCursorTo(lineNumber - 1, column || 0);
        this.$blockScrolling -= 1;

        if (!this.isRowFullyVisible(lineNumber - 1))
            this.scrollToLine(lineNumber - 1, true, animate);
    };
    this.navigateTo = function(row, column) {
        this.clearSelection();
        this.moveCursorTo(row, column);
    };
    this.navigateUp = function(times) {
        if (this.selection.isMultiLine() && !this.selection.isBackwards()) {
            var selectionStart = this.selection.anchor.getPosition();
            return this.moveCursorToPosition(selectionStart);
        }
        this.selection.clearSelection();
        times = times || 1;
        this.selection.moveCursorBy(-times, 0);
    };
    this.navigateDown = function(times) {
        if (this.selection.isMultiLine() && this.selection.isBackwards()) {
            var selectionEnd = this.selection.anchor.getPosition();
            return this.moveCursorToPosition(selectionEnd);
        }
        this.selection.clearSelection();
        times = times || 1;
        this.selection.moveCursorBy(times, 0);
    };
    this.navigateLeft = function(times) {
        if (!this.selection.isEmpty()) {
            var selectionStart = this.getSelectionRange().start;
            this.moveCursorToPosition(selectionStart);
        }
        else {
            times = times || 1;
            while (times--) {
                this.selection.moveCursorLeft();
            }
        }
        this.clearSelection();
    };
    this.navigateRight = function(times) {
        if (!this.selection.isEmpty()) {
            var selectionEnd = this.getSelectionRange().end;
            this.moveCursorToPosition(selectionEnd);
        }
        else {
            times = times || 1;
            while (times--) {
                this.selection.moveCursorRight();
            }
        }
        this.clearSelection();
    };
    this.navigateLineStart = function() {
        this.selection.moveCursorLineStart();
        this.clearSelection();
    };
    this.navigateLineEnd = function() {
        this.selection.moveCursorLineEnd();
        this.clearSelection();
    };
    this.navigateFileEnd = function() {
        var scrollTop = this.renderer.scrollTop;
        this.selection.moveCursorFileEnd();
        this.clearSelection();
        this.renderer.animateScrolling(scrollTop);
    };
    this.navigateFileStart = function() {
        var scrollTop = this.renderer.scrollTop;
        this.selection.moveCursorFileStart();
        this.clearSelection();
        this.renderer.animateScrolling(scrollTop);
    };
    this.navigateWordRight = function() {
        this.selection.moveCursorWordRight();
        this.clearSelection();
    };
    this.navigateWordLeft = function() {
        this.selection.moveCursorWordLeft();
        this.clearSelection();
    };
    this.replace = function(replacement, options) {
        if (options)
            this.$search.set(options);

        var range = this.$search.find(this.session);
        var replaced = 0;
        if (!range)
            return replaced;

        if (this.$tryReplace(range, replacement)) {
            replaced = 1;
        }
        if (range !== null) {
            this.selection.setSelectionRange(range);
            this.renderer.scrollSelectionIntoView(range.start, range.end);
        }

        return replaced;
    };
    this.replaceAll = function(replacement, options) {
        if (options) {
            this.$search.set(options);
        }

        var ranges = this.$search.findAll(this.session);
        var replaced = 0;
        if (!ranges.length)
            return replaced;

        this.$blockScrolling += 1;

        var selection = this.getSelectionRange();
        this.clearSelection();
        this.selection.moveCursorTo(0, 0);

        for (var i = ranges.length - 1; i >= 0; --i) {
            if(this.$tryReplace(ranges[i], replacement)) {
                replaced++;
            }
        }

        this.selection.setSelectionRange(selection);
        this.$blockScrolling -= 1;

        return replaced;
    };

    this.$tryReplace = function(range, replacement) {
        var input = this.session.getTextRange(range);
        replacement = this.$search.replace(input, replacement);
        if (replacement !== null) {
            range.end = this.session.replace(range, replacement);
            return range;
        } else {
            return null;
        }
    };
    this.getLastSearchOptions = function() {
        return this.$search.getOptions();
    };
    this.find = function(needle, options, animate) {
        if (!options)
            options = {};

        if (typeof needle == "string" || needle instanceof RegExp)
            options.needle = needle;
        else if (typeof needle == "object")
            oop.mixin(options, needle);

        var range = this.selection.getRange();
        if (options.needle == null) {
            needle = this.session.getTextRange(range)
                || this.$search.$options.needle;
            if (!needle) {
                range = this.session.getWordRange(range.start.row, range.start.column);
                needle = this.session.getTextRange(range);
            }
            this.$search.set({needle: needle});
        }

        this.$search.set(options);
        if (!options.start)
            this.$search.set({start: range});

        var newRange = this.$search.find(this.session);
        if (options.preventScroll)
            return newRange;
        if (newRange) {
            this.revealRange(newRange, animate);
            return newRange;
        }
        if (options.backwards)
            range.start = range.end;
        else
            range.end = range.start;
        this.selection.setRange(range);
    };
    this.findNext = function(options, animate) {
        this.find({skipCurrent: true, backwards: false}, options, animate);
    };
    this.findPrevious = function(options, animate) {
        this.find(options, {skipCurrent: true, backwards: true}, animate);
    };

    this.revealRange = function(range, animate) {
        this.$blockScrolling += 1;
        this.session.unfold(range);
        this.selection.setSelectionRange(range);
        this.$blockScrolling -= 1;

        var scrollTop = this.renderer.scrollTop;
        this.renderer.scrollSelectionIntoView(range.start, range.end, 0.5);
        if (animate != false)
            this.renderer.animateScrolling(scrollTop);
    };
    this.undo = function() {
        this.$blockScrolling++;
        this.session.getUndoManager().undo();
        this.$blockScrolling--;
        this.renderer.scrollCursorIntoView(null, 0.5);
    };
    this.redo = function() {
        this.$blockScrolling++;
        this.session.getUndoManager().redo();
        this.$blockScrolling--;
        this.renderer.scrollCursorIntoView(null, 0.5);
    };
    this.destroy = function() {
        this.renderer.destroy();
        this._emit("destroy", this);
    };
    this.setAutoScrollEditorIntoView = function(enable) {
        if (enable === false)
            return;
        var rect;
        var self = this;
        var shouldScroll = false;
        if (!this.$scrollAnchor)
            this.$scrollAnchor = document.createElement("div");
        var scrollAnchor = this.$scrollAnchor;
        scrollAnchor.style.cssText = "position:absolute";
        this.container.insertBefore(scrollAnchor, this.container.firstChild);
        var onChangeSelection = this.on("changeSelection", function() {
            shouldScroll = true;
        });
        var onBeforeRender = this.renderer.on("beforeRender", function() {
            if (shouldScroll)
                rect = self.renderer.container.getBoundingClientRect();
        });
        var onAfterRender = this.renderer.on("afterRender", function() {
            if (shouldScroll && rect && self.isFocused()) {
                var renderer = self.renderer;
                var pos = renderer.$cursorLayer.$pixelPos;
                var config = renderer.layerConfig;
                var top = pos.top - config.offset;
                if (pos.top >= 0 && top + rect.top < 0) {
                    shouldScroll = true;
                } else if (pos.top < config.height &&
                    pos.top + rect.top + config.lineHeight > window.innerHeight) {
                    shouldScroll = false;
                } else {
                    shouldScroll = null;
                }
                if (shouldScroll != null) {
                    scrollAnchor.style.top = top + "px";
                    scrollAnchor.style.left = pos.left + "px";
                    scrollAnchor.style.height = config.lineHeight + "px";
                    scrollAnchor.scrollIntoView(shouldScroll);
                }
                shouldScroll = rect = null;
            }
        });
        this.setAutoScrollEditorIntoView = function(enable) {
            if (enable === true)
                return;
            delete this.setAutoScrollEditorIntoView;
            this.removeEventListener("changeSelection", onChangeSelection);
            this.renderer.removeEventListener("afterRender", onAfterRender);
            this.renderer.removeEventListener("beforeRender", onBeforeRender);
        };
    };

}).call(Editor.prototype);



config.defineOptions(Editor.prototype, "editor", {
    selectionStyle: {
        set: function(style) {
            this.onSelectionChange();
            this._emit("changeSelectionStyle", {data: style});
        },
        initialValue: "line"
    },
    highlightActiveLine: {
        set: function() {this.$updateHighlightActiveLine();},
        initialValue: true
    },
    highlightSelectedWord: {
        set: function(shouldHighlight) {this.$onSelectionChange();},
        initialValue: true
    },
    readOnly: {
        set: function(readOnly) {
            this.textInput.setReadOnly(readOnly);
            var cursorLayer = this.renderer.$cursorLayer;
            cursorLayer && cursorLayer.setBlinking(!readOnly);
        },
        initialValue: false
    },
    behavioursEnabled: {initialValue: true},
    wrapBehavioursEnabled: {initialValue: true},

    hScrollBarAlwaysVisible: "renderer",
    highlightGutterLine: "renderer",
    animatedScroll: "renderer",
    showInvisibles: "renderer",
    showPrintMargin: "renderer",
    printMarginColumn: "renderer",
    printMargin: "renderer",
    fadeFoldWidgets: "renderer",
    showFoldWidgets: "renderer",
    showGutter: "renderer",
    displayIndentGuides: "renderer",
    fontSize: "renderer",
    fontFamily: "renderer",

    scrollSpeed: "$mouseHandler",
    dragDelay: "$mouseHandler",
    focusTimout: "$mouseHandler",

    firstLineNumber: "session",
    overwrite: "session",
    newLineMode: "session",
    useWorker: "session",
    useSoftTabs: "session",
    tabSize: "session",
    wrap: "session",
    foldStyle: "session"
});

exports.Editor = Editor;
});

ace.define('ace/lib/lang', ["require", 'exports', 'module' ], function(acequire, exports, module) {


exports.stringReverse = function(string) {
    return string.split("").reverse().join("");
};

exports.stringRepeat = function (string, count) {
    var result = '';
    while (count > 0) {
        if (count & 1)
            result += string;

        if (count >>= 1)
            string += string;
    }
    return result;
};

var trimBeginRegexp = /^\s\s*/;
var trimEndRegexp = /\s\s*$/;

exports.stringTrimLeft = function (string) {
    return string.replace(trimBeginRegexp, '');
};

exports.stringTrimRight = function (string) {
    return string.replace(trimEndRegexp, '');
};

exports.copyObject = function(obj) {
    var copy = {};
    for (var key in obj) {
        copy[key] = obj[key];
    }
    return copy;
};

exports.copyArray = function(array){
    var copy = [];
    for (var i=0, l=array.length; i<l; i++) {
        if (array[i] && typeof array[i] == "object")
            copy[i] = this.copyObject( array[i] );
        else 
            copy[i] = array[i];
    }
    return copy;
};

exports.deepCopy = function (obj) {
    if (typeof obj != "object") {
        return obj;
    }
    
    var copy = obj.constructor();
    for (var key in obj) {
        if (typeof obj[key] == "object") {
            copy[key] = this.deepCopy(obj[key]);
        } else {
            copy[key] = obj[key];
        }
    }
    return copy;
};

exports.arrayToMap = function(arr) {
    var map = {};
    for (var i=0; i<arr.length; i++) {
        map[arr[i]] = 1;
    }
    return map;

};

exports.createMap = function(props) {
    var map = Object.create(null);
    for (var i in props) {
        map[i] = props[i];
    }
    return map;
};
exports.arrayRemove = function(array, value) {
  for (var i = 0; i <= array.length; i++) {
    if (value === array[i]) {
      array.splice(i, 1);
    }
  }
};

exports.escapeRegExp = function(str) {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
};

exports.escapeHTML = function(str) {
    return str.replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/'/g, "&#39;").replace(/</g, "&#60;");
};

exports.getMatchOffsets = function(string, regExp) {
    var matches = [];

    string.replace(regExp, function(str) {
        matches.push({
            offset: arguments[arguments.length-2],
            length: str.length
        });
    });

    return matches;
};
exports.deferredCall = function(fcn) {

    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var deferred = function(timeout) {
        deferred.cancel();
        timer = setTimeout(callback, timeout || 0);
        return deferred;
    };

    deferred.schedule = deferred;

    deferred.call = function() {
        this.cancel();
        fcn();
        return deferred;
    };

    deferred.cancel = function() {
        clearTimeout(timer);
        timer = null;
        return deferred;
    };

    return deferred;
};


exports.delayedCall = function(fcn, defaultTimeout) {
    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var _self = function(timeout) {
        timer && clearTimeout(timer);
        timer = setTimeout(callback, timeout || defaultTimeout);
    };

    _self.delay = _self;
    _self.schedule = function(timeout) {
        if (timer == null)
            timer = setTimeout(callback, timeout || 0);
    };

    _self.call = function() {
        this.cancel();
        fcn();
    };

    _self.cancel = function() {
        timer && clearTimeout(timer);
        timer = null;
    };

    _self.isPending = function() {
        return timer;
    };

    return _self;
};
});

ace.define('ace/keyboard/textinput', ["require", 'exports', 'module' , 'ace/lib/event', 'ace/lib/useragent', 'ace/lib/dom', 'ace/lib/lang'], function(acequire, exports, module) {


var event = acequire("../lib/event");
var useragent = acequire("../lib/useragent");
var dom = acequire("../lib/dom");
var lang = acequire("../lib/lang");
var BROKEN_SETDATA = useragent.isChrome < 18;

var TextInput = function(parentNode, host) {
    var text = dom.createElement("textarea");
    text.className = "ace_text-input";
    if (useragent.isTouchPad)
        text.setAttribute("x-palm-disable-auto-cap", true);

    text.wrap = "off";
    text.autocorrect = "off";
    text.autocapitalize = "off";
    text.spellcheck = false;

    text.style.bottom = "2000em";
    parentNode.insertBefore(text, parentNode.firstChild);

    var PLACEHOLDER = "\x01\x01";

    var cut = false;
    var copied = false;
    var pasted = false;
    var inComposition = false;
    var tempStyle = '';
    var isSelectionEmpty = true;
    try { var isFocused = document.activeElement === text; } catch(e) {}
    
    event.addListener(text, "blur", function() {
        host.onBlur();
        isFocused = false;
    });
    event.addListener(text, "focus", function() {
        isFocused = true;
        host.onFocus();
        resetSelection();
    });
    this.focus = function() { text.focus(); };
    this.blur = function() { text.blur(); };
    this.isFocused = function() {
        return isFocused;
    };
    var syncSelection = lang.delayedCall(function() {
        isFocused && resetSelection(isSelectionEmpty);
    });
    var syncValue = lang.delayedCall(function() {
         if (!inComposition) {
            text.value = PLACEHOLDER;
            isFocused && resetSelection();
         }
    });

    function resetSelection(isEmpty) {
        if (inComposition)
            return;
        if (inputHandler) {
            selectionStart = 0;
            selectionEnd = isEmpty ? 0 : text.value.length - 1;
        } else {
            var selectionStart = isEmpty ? 2 : 1;
            var selectionEnd = 2;
        }
        try {
            text.setSelectionRange(selectionStart, selectionEnd);
        } catch(e){}
    }

    function resetValue() {
        if (inComposition)
            return;
        text.value = PLACEHOLDER;
        if (useragent.isWebKit)
            syncValue.schedule();
    }

    useragent.isWebKit || host.addEventListener('changeSelection', function() {
        if (host.selection.isEmpty() != isSelectionEmpty) {
            isSelectionEmpty = !isSelectionEmpty;
            syncSelection.schedule();
        }
    });

    resetValue();
    if (isFocused)
        host.onFocus();


    var isAllSelected = function(text) {
        return text.selectionStart === 0 && text.selectionEnd === text.value.length;
    };
    if (!text.setSelectionRange && text.createTextRange) {
        text.setSelectionRange = function(selectionStart, selectionEnd) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveStart('character', selectionStart);
            range.moveEnd('character', selectionEnd);
            range.select();
        };
        isAllSelected = function(text) {
            try {
                var range = text.ownerDocument.selection.createRange();
            }catch(e) {}
            if (!range || range.parentElement() != text) return false;
                return range.text == text.value;
        }
    }
    if (useragent.isOldIE) {
        var inPropertyChange = false;
        var onPropertyChange = function(e){
            if (inPropertyChange)
                return;
            var data = text.value;
            if (inComposition || !data || data == PLACEHOLDER)
                return;
            if (e && data == PLACEHOLDER[0])
                return syncProperty.schedule();

            sendText(data);
            inPropertyChange = true;
            resetValue();
            inPropertyChange = false;
        };
        var syncProperty = lang.delayedCall(onPropertyChange);
        event.addListener(text, "propertychange", onPropertyChange);

        var keytable = { 13:1, 27:1 };
        event.addListener(text, "keyup", function (e) {
            if (inComposition && (!text.value || keytable[e.keyCode]))
                setTimeout(onCompositionEnd, 0);
            if ((text.value.charCodeAt(0)||0) < 129) {
                return;
            }
            inComposition ? onCompositionUpdate() : onCompositionStart();
        });
    }

    var onSelect = function(e) {
        if (cut) {
            cut = false;
        } else if (copied) {
            copied = false;
        } else if (isAllSelected(text)) {
            host.selectAll();
            resetSelection();
        } else if (inputHandler) {
            resetSelection(host.selection.isEmpty());
        }
    };

    var inputHandler = null;
    this.setInputHandler = function(cb) {inputHandler = cb};
    this.getInputHandler = function() {return inputHandler};
    var afterContextMenu = false;
    
    var sendText = function(data) {
        if (inputHandler) {
            data = inputHandler(data);
            inputHandler = null;
        }
        if (pasted) {
            resetSelection();
            if (data)
                host.onPaste(data);
            pasted = false;
        } else if (data == PLACEHOLDER[0]) {
            if (afterContextMenu)
                host.execCommand("del", {source: "ace"});
        } else {
            if (data.substring(0, 2) == PLACEHOLDER)
                data = data.substr(2);
            else if (data[0] == PLACEHOLDER[0])
                data = data.substr(1);
            else if (data[data.length - 1] == PLACEHOLDER[0])
                data = data.slice(0, -1);
            if (data[data.length - 1] == PLACEHOLDER[0])
                data = data.slice(0, -1);
            
            if (data)
                host.onTextInput(data);
        }
        if (afterContextMenu)
            afterContextMenu = false;
    };
    var onInput = function(e) {
        if (inComposition)
            return;
        var data = text.value;
        sendText(data);
        resetValue();
    };

    var onCut = function(e) {
        var data = host.getCopyText();
        if (!data) {
            event.preventDefault(e);
            return;
        }

        var clipboardData = e.clipboardData || window.clipboardData;

        if (clipboardData && !BROKEN_SETDATA) {
            var supported = clipboardData.setData("Text", data);
            if (supported) {
                host.onCut();
                event.preventDefault(e);
            }
        }

        if (!supported) {
            cut = true;
            text.value = data;
            text.select();
            setTimeout(function(){
                cut = false;
                resetValue();
                resetSelection();
                host.onCut();
            });
        }
    };

    var onCopy = function(e) {
        var data = host.getCopyText();
        if (!data) {
            event.preventDefault(e);
            return;
        }

        var clipboardData = e.clipboardData || window.clipboardData;
        if (clipboardData && !BROKEN_SETDATA) {
            var supported = clipboardData.setData("Text", data);
            if (supported) {
                host.onCopy();
                event.preventDefault(e);
            }
        }
        if (!supported) {
            copied = true;
            text.value = data;
            text.select();
            setTimeout(function(){
                copied = false;
                resetValue();
                resetSelection();
                host.onCopy();
            });
        }
    };

    var onPaste = function(e) {
        var clipboardData = e.clipboardData || window.clipboardData;

        if (clipboardData) {
            var data = clipboardData.getData("Text");
            if (data)
                host.onPaste(data);
            if (useragent.isIE)
                setTimeout(resetSelection);
            event.preventDefault(e);
        }
        else {
            text.value = "";
            pasted = true;
        }
    };

    event.addCommandKeyListener(text, host.onCommandKey.bind(host));

    event.addListener(text, "select", onSelect);

    event.addListener(text, "input", onInput);

    event.addListener(text, "cut", onCut);
    event.addListener(text, "copy", onCopy);
    event.addListener(text, "paste", onPaste);
    if (!('oncut' in text) || !('oncopy' in text) || !('onpaste' in text)){
        event.addListener(parentNode, "keydown", function(e) {
            if ((useragent.isMac && !e.metaKey) || !e.ctrlKey)
            return;

            switch (e.keyCode) {
                case 67:
                    onCopy(e);
                    break;
                case 86:
                    onPaste(e);
                    break;
                case 88:
                    onCut(e);
                    break;
            }
        });
    }
    var onCompositionStart = function(e) {
        inComposition = {};
        host.onCompositionStart();
        setTimeout(onCompositionUpdate, 0);
        host.on("mousedown", onCompositionEnd);
        if (!host.selection.isEmpty()) {
            host.insert("");
            host.session.markUndoGroup();
            host.selection.clearSelection();
        }
        host.session.markUndoGroup();
    };

    var onCompositionUpdate = function() {
        if (!inComposition) return;
        host.onCompositionUpdate(text.value);
        if (inComposition.lastValue)
            host.undo();
        inComposition.lastValue = text.value.replace(/\x01/g, "")
        if (inComposition.lastValue) {
            var r = host.selection.getRange();
            host.insert(inComposition.lastValue);
            host.session.markUndoGroup();
            inComposition.range = host.selection.getRange();
            host.selection.setRange(r);
            host.selection.clearSelection();
        }
    };

    var onCompositionEnd = function(e) {
        var c = inComposition;
        inComposition = false;
        var timer = setTimeout(function() {
            var str = text.value.replace(/\x01/g, "");
            if (!inComposition && str == c.lastValue)
                resetValue();
        });
        inputHandler = function compositionInputHandler(str) {
            clearTimeout(timer);
            str = str.replace(/\x01/g, "");
            if (str == c.lastValue)
                return "";
            if (!str) {
                if (c.lastValue)
                    host.undo();
            }
            return str;
        }        
        host.onCompositionEnd();
        host.removeListener("mousedown", onCompositionEnd);
        if (e.type == "compositionend") {
            host.selection.setRange(c.range);
        }
    };
    
    

    var syncComposition = lang.delayedCall(onCompositionUpdate, 50);

    event.addListener(text, "compositionstart", onCompositionStart);
    event.addListener(text, useragent.isGecko ? "text" : "keyup", function(){syncComposition.schedule()});
    event.addListener(text, "compositionend", onCompositionEnd);

    this.getElement = function() {
        return text;
    };

    this.setReadOnly = function(readOnly) {
       text.readOnly = readOnly;
    };

    this.onContextMenu = function(e) {
        afterContextMenu = true;
        if (!tempStyle)
            tempStyle = text.style.cssText;

        text.style.cssText = "z-index:100000;" + (useragent.isIE ? "opacity:0.1;" : "");

        resetSelection(host.selection.isEmpty());
        host._emit("nativecontextmenu", {target: host});
        var rect = host.container.getBoundingClientRect();
        var style = dom.computedStyle(host.container);
        var top = rect.top + (parseInt(style.borderTopWidth) || 0);
        var left = rect.left + (parseInt(rect.borderLeftWidth) || 0);
        var maxTop = rect.bottom - top - text.clientHeight;
        var move = function(e) {
            text.style.left = e.clientX - left - 2 + "px";
            text.style.top = Math.min(e.clientY - top - 2, maxTop) + "px";
        }; 
        move(e);

        if (e.type != "mousedown")
            return;

        if (host.renderer.$keepTextAreaAtCursor)
            host.renderer.$keepTextAreaAtCursor = null;
        if (useragent.isWin)
            event.capture(host.container, move, onContextMenuClose);
    };

    this.onContextMenuClose = onContextMenuClose;
    function onContextMenuClose() {
        setTimeout(function () {
            if (tempStyle) {
                text.style.cssText = tempStyle;
                tempStyle = '';
            }
            if (host.renderer.$keepTextAreaAtCursor == null) {
                host.renderer.$keepTextAreaAtCursor = true;
                host.renderer.$moveTextAreaToCursor();
            }
        }, 0);
    }
    if (!useragent.isGecko) {
        event.addListener(text, "contextmenu", function(e) {
            host.textInput.onContextMenu(e);
            onContextMenuClose();
        });
    }
};

exports.TextInput = TextInput;
});

ace.define('ace/mouse/mouse_handler', ["require", 'exports', 'module' , 'ace/lib/event', 'ace/lib/useragent', 'ace/mouse/default_handlers', 'ace/mouse/default_gutter_handler', 'ace/mouse/mouse_event', 'ace/mouse/dragdrop', 'ace/config'], function(acequire, exports, module) {


var event = acequire("../lib/event");
var useragent = acequire("../lib/useragent");
var DefaultHandlers = acequire("./default_handlers").DefaultHandlers;
var DefaultGutterHandler = acequire("./default_gutter_handler").GutterHandler;
var MouseEvent = acequire("./mouse_event").MouseEvent;
var DragdropHandler = acequire("./dragdrop").DragdropHandler;
var config = acequire("../config");

var MouseHandler = function(editor) {
    this.editor = editor;

    new DefaultHandlers(this);
    new DefaultGutterHandler(this);
    new DragdropHandler(this);

    event.addListener(editor.container, "mousedown", function(e) {
        editor.focus();
        return event.preventDefault(e);
    });

    var mouseTarget = editor.renderer.getMouseEventTarget();
    event.addListener(mouseTarget, "click", this.onMouseEvent.bind(this, "click"));
    event.addListener(mouseTarget, "mousemove", this.onMouseMove.bind(this, "mousemove"));
    event.addMultiMouseDownListener(mouseTarget, [300, 300, 250], this, "onMouseEvent");
    event.addMouseWheelListener(editor.container, this.onMouseWheel.bind(this, "mousewheel"));

    var gutterEl = editor.renderer.$gutter;
    event.addListener(gutterEl, "mousedown", this.onMouseEvent.bind(this, "guttermousedown"));
    event.addListener(gutterEl, "click", this.onMouseEvent.bind(this, "gutterclick"));
    event.addListener(gutterEl, "dblclick", this.onMouseEvent.bind(this, "gutterdblclick"));
    event.addListener(gutterEl, "mousemove", this.onMouseEvent.bind(this, "guttermousemove"));
};

(function() {
    this.onMouseEvent = function(name, e) {
        this.editor._emit(name, new MouseEvent(e, this.editor));
    };

    this.onMouseMove = function(name, e) {
        var listeners = this.editor._eventRegistry && this.editor._eventRegistry.mousemove;
        if (!listeners || !listeners.length)
            return;

        this.editor._emit(name, new MouseEvent(e, this.editor));
    };

    this.onMouseWheel = function(name, e) {
        var mouseEvent = new MouseEvent(e, this.editor);
        mouseEvent.speed = this.$scrollSpeed * 2;
        mouseEvent.wheelX = e.wheelX;
        mouseEvent.wheelY = e.wheelY;

        this.editor._emit(name, mouseEvent);
    };

    this.setState = function(state) {
        this.state = state;
    };

    this.captureMouse = function(ev, state) {
        if (state)
            this.setState(state);

        this.x = ev.x;
        this.y = ev.y;
        
        this.isMousePressed = true;
        var renderer = this.editor.renderer;
        if (renderer.$keepTextAreaAtCursor)
            renderer.$keepTextAreaAtCursor = null;

        var self = this;
        var onMouseMove = function(e) {
            self.x = e.clientX;
            self.y = e.clientY;
        };

        var onCaptureEnd = function(e) {
            clearInterval(timerId);
            onCaptureInterval();
            self[self.state + "End"] && self[self.state + "End"](e);
            self.$clickSelection = null;
            if (renderer.$keepTextAreaAtCursor == null) {
                renderer.$keepTextAreaAtCursor = true;
                renderer.$moveTextAreaToCursor();
            }
            self.isMousePressed = false;
            self.onMouseEvent("mouseup", e)
        };

        var onCaptureInterval = function() {
            self[self.state] && self[self.state]();
        };
        
        if (useragent.isOldIE && ev.domEvent.type == "dblclick") {
            return setTimeout(function() {onCaptureEnd(ev.domEvent);});
        }

        event.capture(this.editor.container, onMouseMove, onCaptureEnd);
        var timerId = setInterval(onCaptureInterval, 20);
    };
}).call(MouseHandler.prototype);

config.defineOptions(MouseHandler.prototype, "mouseHandler", {
    scrollSpeed: {initialValue: 2},
    dragDelay: {initialValue: 150},
    focusTimout: {initialValue: 0}
});


exports.MouseHandler = MouseHandler;
});

ace.define('ace/mouse/default_handlers', ["require", 'exports', 'module' , 'ace/lib/dom', 'ace/lib/useragent'], function(acequire, exports, module) {


var dom = acequire("../lib/dom");
var useragent = acequire("../lib/useragent");

var DRAG_OFFSET = 0; // pixels

function DefaultHandlers(mouseHandler) {
    mouseHandler.$clickSelection = null;

    var editor = mouseHandler.editor;
    editor.setDefaultHandler("mousedown", this.onMouseDown.bind(mouseHandler));
    editor.setDefaultHandler("dblclick", this.onDoubleClick.bind(mouseHandler));
    editor.setDefaultHandler("tripleclick", this.onTripleClick.bind(mouseHandler));
    editor.setDefaultHandler("quadclick", this.onQuadClick.bind(mouseHandler));
    editor.setDefaultHandler("mousewheel", this.onMouseWheel.bind(mouseHandler));

    var exports = ["select", "startSelect", "drag", "dragEnd", "dragWait",
        "dragWaitEnd", "startDrag", "focusWait"];

    exports.forEach(function(x) {
        mouseHandler[x] = this[x];
    }, this);

    mouseHandler.selectByLines = this.extendSelectionBy.bind(mouseHandler, "getLineRange");
    mouseHandler.selectByWords = this.extendSelectionBy.bind(mouseHandler, "getWordRange");
}

(function() {

    this.onMouseDown = function(ev) {
        var inSelection = ev.inSelection();
        var pos = ev.getDocumentPosition();
        this.mousedownEvent = ev;
        var editor = this.editor;

        var button = ev.getButton();
        if (button !== 0) {
            var selectionRange = editor.getSelectionRange();
            var selectionEmpty = selectionRange.isEmpty();

            if (selectionEmpty) {
                editor.moveCursorToPosition(pos);
                editor.selection.clearSelection();
            }
            editor.textInput.onContextMenu(ev.domEvent);
            return; // stopping event here breaks contextmenu on ff mac
        }
        if (inSelection && !editor.isFocused()) {
            editor.focus();
            if (this.$focusTimout && !this.$clickSelection && !editor.inMultiSelectMode) {
                this.setState("focusWait");
                this.captureMouse(ev);
                return ev.preventDefault();
            }
        }

        if (!inSelection || this.$clickSelection || ev.getShiftKey() || editor.inMultiSelectMode) {
            this.startSelect(pos);
        } else if (inSelection) {
            this.mousedownEvent.time = (new Date()).getTime();
            this.setState("dragWait");
        }

        this.captureMouse(ev);
        return ev.preventDefault();
    };

    this.startSelect = function(pos) {
        pos = pos || this.editor.renderer.screenToTextCoordinates(this.x, this.y);
        if (this.mousedownEvent.getShiftKey()) {
            this.editor.selection.selectToPosition(pos);
        }
        else if (!this.$clickSelection) {
            this.editor.moveCursorToPosition(pos);
            this.editor.selection.clearSelection();
        }
        this.setState("select");
    };

    this.select = function() {
        var anchor, editor = this.editor;
        var cursor = editor.renderer.screenToTextCoordinates(this.x, this.y);

        if (this.$clickSelection) {
            var cmp = this.$clickSelection.comparePoint(cursor);

            if (cmp == -1) {
                anchor = this.$clickSelection.end;
            } else if (cmp == 1) {
                anchor = this.$clickSelection.start;
            } else {
                var orientedRange = calcRangeOrientation(this.$clickSelection, cursor);
                cursor = orientedRange.cursor;
                anchor = orientedRange.anchor;
            }
            editor.selection.setSelectionAnchor(anchor.row, anchor.column);
        }
        editor.selection.selectToPosition(cursor);

        editor.renderer.scrollCursorIntoView();
    };

    this.extendSelectionBy = function(unitName) {
        var anchor, editor = this.editor;
        var cursor = editor.renderer.screenToTextCoordinates(this.x, this.y);
        var range = editor.selection[unitName](cursor.row, cursor.column);

        if (this.$clickSelection) {
            var cmpStart = this.$clickSelection.comparePoint(range.start);
            var cmpEnd = this.$clickSelection.comparePoint(range.end);

            if (cmpStart == -1 && cmpEnd <= 0) {
                anchor = this.$clickSelection.end;
                if (range.end.row != cursor.row || range.end.column != cursor.column)
                    cursor = range.start;
            } else if (cmpEnd == 1 && cmpStart >= 0) {
                anchor = this.$clickSelection.start;
                if (range.start.row != cursor.row || range.start.column != cursor.column)
                    cursor = range.end;
            } else if (cmpStart == -1 && cmpEnd == 1) {
                cursor = range.end;
                anchor = range.start;
            } else {
                var orientedRange = calcRangeOrientation(this.$clickSelection, cursor);
                cursor = orientedRange.cursor;
                anchor = orientedRange.anchor;
            }
            editor.selection.setSelectionAnchor(anchor.row, anchor.column);
        }
        editor.selection.selectToPosition(cursor);

        editor.renderer.scrollCursorIntoView();
    };

    this.startDrag = function() {
        var editor = this.editor;
        this.setState("drag");
        this.dragRange = editor.getSelectionRange();
        var style = editor.getSelectionStyle();
        this.dragSelectionMarker = editor.session.addMarker(this.dragRange, "ace_selection", style);
        editor.clearSelection();
        dom.addCssClass(editor.container, "ace_dragging");
        if (!this.$dragKeybinding) {
            this.$dragKeybinding = {
                handleKeyboard: function(data, hashId, keyString, keyCode) {
                    if (keyString == "esc")
                        return {command: this.command};
                },
                command: {
                    exec: function(editor) {
                        var self = editor.$mouseHandler;
                        self.dragCursor = null;
                        self.dragEnd();
                        self.startSelect();
                    }
                }
            }
        }

        editor.keyBinding.addKeyboardHandler(this.$dragKeybinding);
    };

    this.focusWait = function() {
        var distance = calcDistance(this.mousedownEvent.x, this.mousedownEvent.y, this.x, this.y);
        var time = (new Date()).getTime();

        if (distance > DRAG_OFFSET || time - this.mousedownEvent.time > this.$focusTimout)
            this.startSelect(this.mousedownEvent.getDocumentPosition());
    };

    this.dragWait = function(e) {
        var distance = calcDistance(this.mousedownEvent.x, this.mousedownEvent.y, this.x, this.y);
        var time = (new Date()).getTime();
        var editor = this.editor;

        if (distance > DRAG_OFFSET) {
            this.startSelect(this.mousedownEvent.getDocumentPosition());
        } else if (time - this.mousedownEvent.time > editor.$mouseHandler.$dragDelay) {
            this.startDrag();
        }
    };

    this.dragWaitEnd = function(e) {
        this.mousedownEvent.domEvent = e;
        this.startSelect();
    };

    this.drag = function() {
        var editor = this.editor;
        this.dragCursor = editor.renderer.screenToTextCoordinates(this.x, this.y);
        editor.moveCursorToPosition(this.dragCursor);
        editor.renderer.scrollCursorIntoView();
    };

    this.dragEnd = function(e) {
        var editor = this.editor;
        var dragCursor = this.dragCursor;
        var dragRange = this.dragRange;
        dom.removeCssClass(editor.container, "ace_dragging");
        editor.session.removeMarker(this.dragSelectionMarker);
        editor.keyBinding.removeKeyboardHandler(this.$dragKeybinding);

        if (!dragCursor)
            return;

        editor.clearSelection();
        if (e && (e.ctrlKey || e.altKey)) {
            var session = editor.session;
            var newRange = dragRange;
            newRange.end = session.insert(dragCursor, session.getTextRange(dragRange));
            newRange.start = dragCursor;
        } else if (dragRange.contains(dragCursor.row, dragCursor.column)) {
            return;
        } else {
            var newRange = editor.moveText(dragRange, dragCursor);
        }

        if (!newRange)
            return;

        editor.selection.setSelectionRange(newRange);
    };

    this.onDoubleClick = function(ev) {
        var pos = ev.getDocumentPosition();
        var editor = this.editor;
        var session = editor.session;

        var range = session.getBracketRange(pos);
        if (range) {
            if (range.isEmpty()) {
                range.start.column--;
                range.end.column++;
            }
            this.$clickSelection = range;
            this.setState("select");
            return;
        }

        this.$clickSelection = editor.selection.getWordRange(pos.row, pos.column);
        this.setState("selectByWords");
    };

    this.onTripleClick = function(ev) {
        var pos = ev.getDocumentPosition();
        var editor = this.editor;

        this.setState("selectByLines");
        this.$clickSelection = editor.selection.getLineRange(pos.row);
    };

    this.onQuadClick = function(ev) {
        var editor = this.editor;

        editor.selectAll();
        this.$clickSelection = editor.getSelectionRange();
        this.setState("null");
    };

    this.onMouseWheel = function(ev) {
        if (ev.getShiftKey() || ev.getAccelKey())
            return;
        var t = ev.domEvent.timeStamp;
        var dt = t - (this.$lastScrollTime||0);
        
        var editor = this.editor;
        var isScrolable = editor.renderer.isScrollableBy(ev.wheelX * ev.speed, ev.wheelY * ev.speed);
        if (isScrolable || dt < 200) {
            this.$lastScrollTime = t;
            editor.renderer.scrollBy(ev.wheelX * ev.speed, ev.wheelY * ev.speed);
            return ev.stop();
        }
    };

}).call(DefaultHandlers.prototype);

exports.DefaultHandlers = DefaultHandlers;

function calcDistance(ax, ay, bx, by) {
    return Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
}

function calcRangeOrientation(range, cursor) {
    if (range.start.row == range.end.row)
        var cmp = 2 * cursor.column - range.start.column - range.end.column;
    else
        var cmp = 2 * cursor.row - range.start.row - range.end.row;

    if (cmp < 0)
        return {cursor: range.start, anchor: range.end};
    else
        return {cursor: range.end, anchor: range.start};
}

});

ace.define('ace/mouse/default_gutter_handler', ["require", 'exports', 'module' , 'ace/lib/dom', 'ace/lib/event'], function(acequire, exports, module) {

var dom = acequire("../lib/dom");
var event = acequire("../lib/event");

function GutterHandler(mouseHandler) {
    var editor = mouseHandler.editor;
    var gutter = editor.renderer.$gutterLayer;

    mouseHandler.editor.setDefaultHandler("guttermousedown", function(e) {
        if (!editor.isFocused())
            return;
        var gutterRegion = gutter.getRegion(e);

        if (gutterRegion == "foldWidgets")
            return;

        var row = e.getDocumentPosition().row;
        var selection = editor.session.selection;

        if (e.getShiftKey())
            selection.selectTo(row, 0);
        else {
            if (e.domEvent.detail == 2) {
                editor.selectAll();
                return e.preventDefault();
            }
            mouseHandler.$clickSelection = editor.selection.getLineRange(row);
        }
        mouseHandler.captureMouse(e, "selectByLines");
        return e.preventDefault();
    });


    var tooltipTimeout, mouseEvent, tooltip, tooltipAnnotation;
    function createTooltip() {
        tooltip = dom.createElement("div");
        tooltip.className = "ace_gutter-tooltip";
        tooltip.style.display = "none";
        editor.container.appendChild(tooltip);
    }

    function showTooltip() {
        if (!tooltip) {
            createTooltip();
        }
        var row = mouseEvent.getDocumentPosition().row;
        var annotation = gutter.$annotations[row];
        if (!annotation)
            return hideTooltip();

        var maxRow = editor.session.getLength();
        if (row == maxRow) {
            var screenRow = editor.renderer.pixelToScreenCoordinates(0, mouseEvent.y).row;
            var pos = mouseEvent.$pos;
            if (screenRow > editor.session.documentToScreenRow(pos.row, pos.column))
                return hideTooltip();
        }

        if (tooltipAnnotation == annotation)
            return;
        tooltipAnnotation = annotation.text.join("<br/>");

        tooltip.style.display = "block";
        tooltip.innerHTML = tooltipAnnotation;
        editor.on("mousewheel", hideTooltip);

        moveTooltip(mouseEvent);
    }

    function hideTooltip() {
        if (tooltipTimeout)
            tooltipTimeout = clearTimeout(tooltipTimeout);
        if (tooltipAnnotation) {
            tooltip.style.display = "none";
            tooltipAnnotation = null;
            editor.removeEventListener("mousewheel", hideTooltip);
        }
    }

    function moveTooltip(e) {
        var rect = editor.renderer.$gutter.getBoundingClientRect();
        tooltip.style.left = e.x + 15 + "px";
        if (e.y + 3 * editor.renderer.lineHeight + 15 < rect.bottom) {
            tooltip.style.bottom =  "";
            tooltip.style.top =  e.y + 15 + "px";
        } else {
            tooltip.style.top =  "";
            tooltip.style.bottom = rect.bottom - e.y + 5 + "px";
        }
    }

    mouseHandler.editor.setDefaultHandler("guttermousemove", function(e) {
        var target = e.domEvent.target || e.domEvent.srcElement;
        if (dom.hasCssClass(target, "ace_fold-widget"))
            return hideTooltip();

        if (tooltipAnnotation)
            moveTooltip(e);

        mouseEvent = e;
        if (tooltipTimeout)
            return;
        tooltipTimeout = setTimeout(function() {
            tooltipTimeout = null;
            if (mouseEvent && !mouseHandler.isMousePressed)
                showTooltip();
            else
                hideTooltip();
        }, 50);
    });

    event.addListener(editor.renderer.$gutter, "mouseout", function(e) {
        mouseEvent = null;
        if (!tooltipAnnotation || tooltipTimeout)
            return;

        tooltipTimeout = setTimeout(function() {
            tooltipTimeout = null;
            hideTooltip();
        }, 50);
    });

}

exports.GutterHandler = GutterHandler;

});

ace.define('ace/mouse/mouse_event', ["require", 'exports', 'module' , 'ace/lib/event', 'ace/lib/useragent'], function(acequire, exports, module) {


var event = acequire("../lib/event");
var useragent = acequire("../lib/useragent");
var MouseEvent = exports.MouseEvent = function(domEvent, editor) {
    this.domEvent = domEvent;
    this.editor = editor;
    
    this.x = this.clientX = domEvent.clientX;
    this.y = this.clientY = domEvent.clientY;

    this.$pos = null;
    this.$inSelection = null;
    
    this.propagationStopped = false;
    this.defaultPrevented = false;
};

(function() {  
    
    this.stopPropagation = function() {
        event.stopPropagation(this.domEvent);
        this.propagationStopped = true;
    };
    
    this.preventDefault = function() {
        event.preventDefault(this.domEvent);
        this.defaultPrevented = true;
    };
    
    this.stop = function() {
        this.stopPropagation();
        this.preventDefault();
    };
    this.getDocumentPosition = function() {
        if (this.$pos)
            return this.$pos;
        
        this.$pos = this.editor.renderer.screenToTextCoordinates(this.clientX, this.clientY);
        return this.$pos;
    };
    this.inSelection = function() {
        if (this.$inSelection !== null)
            return this.$inSelection;
            
        var editor = this.editor;
        
        if (editor.getReadOnly()) {
            this.$inSelection = false;
        }
        else {
            var selectionRange = editor.getSelectionRange();
            if (selectionRange.isEmpty())
                this.$inSelection = false;
            else {
                var pos = this.getDocumentPosition();
                this.$inSelection = selectionRange.contains(pos.row, pos.column);
            }
        }
        return this.$inSelection;
    };
    this.getButton = function() {
        return event.getButton(this.domEvent);
    };
    this.getShiftKey = function() {
        return this.domEvent.shiftKey;
    };
    
    this.getAccelKey = useragent.isMac
        ? function() { return this.domEvent.metaKey; }
        : function() { return this.domEvent.ctrlKey; };
    
}).call(MouseEvent.prototype);

});

ace.define('ace/mouse/dragdrop', ["require", 'exports', 'module' , 'ace/lib/event'], function(acequire, exports, module) {


var event = acequire("../lib/event");

var DragdropHandler = function(mouseHandler) {
    var editor = mouseHandler.editor;
    var dragSelectionMarker, x, y;
    var timerId, range;
    var dragCursor, counter = 0;

    var mouseTarget = editor.container;
    event.addListener(mouseTarget, "dragenter", function(e) {
        if (editor.getReadOnly())
            return;
        var types = e.dataTransfer.types;
        if (types && Array.prototype.indexOf.call(types, "text/plain") === -1)
            return;
        if (!dragSelectionMarker)
            addDragMarker();
        counter++;
        return event.preventDefault(e);
    });

    event.addListener(mouseTarget, "dragover", function(e) {
        if (editor.getReadOnly())
            return;
        var types = e.dataTransfer.types;
        if (types && Array.prototype.indexOf.call(types, "text/plain") === -1)
            return;
        if (onMouseMoveTimer !== null)
            onMouseMoveTimer = null;
        x = e.clientX;
        y = e.clientY;
        return event.preventDefault(e);
    });

    var onDragInterval =  function() {
        dragCursor = editor.renderer.screenToTextCoordinates(x, y);
        editor.moveCursorToPosition(dragCursor);
        editor.renderer.scrollCursorIntoView();
    };

    event.addListener(mouseTarget, "dragleave", function(e) {
        counter--;
        if (counter <= 0 && dragSelectionMarker) {
            clearDragMarker();
            return event.preventDefault(e);
        }
    });

    event.addListener(mouseTarget, "drop", function(e) {
        if (!dragSelectionMarker)
            return;
        range.end = editor.session.insert(dragCursor, e.dataTransfer.getData('Text'));
        range.start = dragCursor;
        clearDragMarker();
        editor.focus();
        return event.preventDefault(e);
    });

    function addDragMarker() {
        range = editor.selection.toOrientedRange();
        dragSelectionMarker = editor.session.addMarker(range, "ace_selection", editor.getSelectionStyle());
        editor.clearSelection();
        clearInterval(timerId);
        timerId = setInterval(onDragInterval, 20);
        counter = 0;
        event.addListener(document, "mousemove", onMouseMove);
    }
    function clearDragMarker() {
        clearInterval(timerId);
        editor.session.removeMarker(dragSelectionMarker);
        dragSelectionMarker = null;
        editor.selection.fromOrientedRange(range);
        counter = 0;
        event.removeListener(document, "mousemove", onMouseMove);
    }
    var onMouseMoveTimer = null;
    function onMouseMove() {
        if (onMouseMoveTimer == null) {
            onMouseMoveTimer = setTimeout(function() {
                if (onMouseMoveTimer != null && dragSelectionMarker)
                    clearDragMarker();
            }, 20);
        }
    }
};

exports.DragdropHandler = DragdropHandler;
});

ace.define('ace/config', ["require", 'exports', 'module' , 'ace/lib/lang', 'ace/lib/oop', 'ace/lib/net', 'ace/lib/event_emitter'], function(acequire, exports, module) {
"no use strict";

var lang = acequire("./lib/lang");
var oop = acequire("./lib/oop");
var net = acequire("./lib/net");
var EventEmitter = acequire("./lib/event_emitter").EventEmitter;

var global = (function() {
    return this;
})();

var options = {
    packaged: false,
    workerPath: null,
    modePath: null,
    themePath: null,
    basePath: "",
    suffix: ".js",
    $moduleUrls: {}
};

exports.get = function(key) {
    if (!options.hasOwnProperty(key))
        throw new Error("Unknown config key: " + key);

    return options[key];
};

exports.set = function(key, value) {
    if (!options.hasOwnProperty(key))
        throw new Error("Unknown config key: " + key);

    options[key] = value;
};

exports.all = function() {
    return lang.copyObject(options);
};
oop.implement(exports, EventEmitter);

exports.moduleUrl = function(name, component) {
    if (options.$moduleUrls[name])
        return options.$moduleUrls[name];

    var parts = name.split("/");
    component = component || parts[parts.length - 2] || "";
    var base = parts[parts.length - 1].replace(component, "").replace(/(^[\-_])|([\-_]$)/, "");

    if (!base && parts.length > 1)
        base = parts[parts.length - 2];
    var path = options[component + "Path"];
    if (path == null)
        path = options.basePath;
    if (path && path.slice(-1) != "/")
        path += "/";
    return path + component + "-" + base + this.get("suffix");
};

exports.setModuleUrl = function(name, subst) {
    return options.$moduleUrls[name] = subst;
};

exports.$loading = {};
exports.loadModule = function(moduleName, onLoad) {
    var module, moduleType;
    if (Array.isArray(moduleName)) {
        moduleType = moduleName[0];
        moduleName = moduleName[1];
    }

    try {
        module = acequire(moduleName);
    } catch (e) {};
    if (module && !exports.$loading[moduleName])
        return onLoad && onLoad(module);

    if (!exports.$loading[moduleName])
        exports.$loading[moduleName] = [];

    exports.$loading[moduleName].push(onLoad);

    if (exports.$loading[moduleName].length > 1)
        return;

    var afterLoad = function() {
        acequire([moduleName], function(module) {
            exports._emit("load.module", {name: moduleName, module: module});
            var listeners = exports.$loading[moduleName];
            exports.$loading[moduleName] = null;
            listeners.forEach(function(onLoad) {
                onLoad && onLoad(module);
            });
        });
    };

    if (!exports.get("packaged"))
        return afterLoad();
    net.loadScript(exports.moduleUrl(moduleName, moduleType), afterLoad);
};
exports.init = function() {
    options.packaged = acequire.packaged || module.packaged || (global.define && define.packaged);

    if (!global.document)
        return "";

    var scriptOptions = {};
    var scriptUrl = "";

    var scripts = document.getElementsByTagName("script");
    for (var i=0; i<scripts.length; i++) {
        var script = scripts[i];

        var src = script.src || script.getAttribute("src");
        if (!src)
            continue;

        var attributes = script.attributes;
        for (var j=0, l=attributes.length; j < l; j++) {
            var attr = attributes[j];
            if (attr.name.indexOf("data-ace-") === 0) {
                scriptOptions[deHyphenate(attr.name.replace(/^data-ace-/, ""))] = attr.value;
            }
        }

        var m = src.match(/^(.*)\/ace(\-\w+)?\.js(\?|$)/);
        if (m)
            scriptUrl = m[1];
    }

    if (scriptUrl) {
        scriptOptions.base = scriptOptions.base || scriptUrl;
        scriptOptions.packaged = true;
    }

    scriptOptions.basePath = scriptOptions.base;
    scriptOptions.workerPath = scriptOptions.workerPath || scriptOptions.base;
    scriptOptions.modePath = scriptOptions.modePath || scriptOptions.base;
    scriptOptions.themePath = scriptOptions.themePath || scriptOptions.base;
    delete scriptOptions.base;

    for (var key in scriptOptions)
        if (typeof scriptOptions[key] !== "undefined")
            exports.set(key, scriptOptions[key]);
};

function deHyphenate(str) {
    return str.replace(/-(.)/g, function(m, m1) { return m1.toUpperCase(); });
}

var optionsProvider = {
    setOptions: function(optList) {
        Object.keys(optList).forEach(function(key) {
            this.setOption(key, optList[key]);
        }, this);
    },
    getOptions: function(a) {
        var b = {};
        Object.keys(a).forEach(function(key) {
            b[key] = this.getOption(key);
        }, this);
        return b;
    },
    setOption: function(name, value) {
        if (this["$" + name] === value)
            return;
        var opt = this.$options[name];
        if (!opt)
            return undefined;
        if (opt.forwardTo)
            return this[opt.forwardTo] && this[opt.forwardTo].setOption(name, value);

        if (!opt.handlesSet)
            this["$" + name] = value;
        if (opt && opt.set)
            opt.set.call(this, value);
    },
    getOption: function(name) {
        var opt = this.$options[name];
        if (!opt)
            return undefined;
        if (opt.forwardTo)
            return this[opt.forwardTo] && this[opt.forwardTo].getOption(name);
        return opt && opt.get ? opt.get.call(this) : this["$" + name];
    }
};

var defaultOptions = {};
exports.defineOptions = function(obj, path, options) {
    if (!obj.$options)
        defaultOptions[path] = obj.$options = {};

    Object.keys(options).forEach(function(key) {
        var opt = options[key];
        if (typeof opt == "string")
            opt = {forwardTo: opt};

        opt.name || (opt.name = key);
        obj.$options[opt.name] = opt;
        if ("initialValue" in opt)
            obj["$" + opt.name] = opt.initialValue;
    });
    oop.implement(obj, optionsProvider);

    return this;
};

exports.resetOptions = function(obj) {
    Object.keys(obj.$options).forEach(function(key) {
        var opt = obj.$options[key];
        if ("value" in opt)
            obj.setOption(key, opt.value);
    });
};

exports.setDefaultValue = function(path, name, value) {
    var opts = defaultOptions[path] || (defaultOptions[path] = {});
    if (opts[name]) {
        if (opts.forwardTo)
            exports.setDefaultValue(opts.forwardTo, name, value)
        else
            opts[name].value = value;
    }
};

exports.setDefaultValues = function(path, optionHash) {
    Object.keys(optionHash).forEach(function(key) {
        exports.setDefaultValue(path, key, optionHash[key]);
    });
};

});
ace.define('ace/lib/net', ["require", 'exports', 'module' , 'ace/lib/dom'], function(acequire, exports, module) {

var dom = acequire("./dom");

exports.get = function (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            callback(xhr.responseText);
        }
    };
    xhr.send(null);
};

exports.loadScript = function(path, callback) {
    var head = dom.getDocumentHead();
    var s = document.createElement('script');

    s.src = path;
    head.appendChild(s);

    s.onload = s.onreadystatechange = function(_, isAbort) {
        if (isAbort || !s.readyState || s.readyState == "loaded" || s.readyState == "complete") {
            s = s.onload = s.onreadystatechange = null;
            if (!isAbort)
                callback();
        }
    };
};

});

ace.define('ace/lib/event_emitter', ["require", 'exports', 'module' ], function(acequire, exports, module) {


var EventEmitter = {};
var stopPropagation = function() { this.propagationStopped = true; };
var preventDefault = function() { this.defaultPrevented = true; };

EventEmitter._emit =
EventEmitter._dispatchEvent = function(eventName, e) {
    this._eventRegistry || (this._eventRegistry = {});
    this._defaultHandlers || (this._defaultHandlers = {});

    var listeners = this._eventRegistry[eventName] || [];
    var defaultHandler = this._defaultHandlers[eventName];
    if (!listeners.length && !defaultHandler)
        return;

    if (typeof e != "object" || !e)
        e = {};

    if (!e.type)
        e.type = eventName;
    if (!e.stopPropagation)
        e.stopPropagation = stopPropagation;
    if (!e.preventDefault)
        e.preventDefault = preventDefault;

    for (var i=0; i<listeners.length; i++) {
        listeners[i](e, this);
        if (e.propagationStopped)
            break;
    }
    
    if (defaultHandler && !e.defaultPrevented)
        return defaultHandler(e, this);
};


EventEmitter._signal = function(eventName, e) {
    var listeners = (this._eventRegistry || {})[eventName];
    if (!listeners)
        return;

    for (var i=0; i<listeners.length; i++)
        listeners[i](e, this);
};

EventEmitter.once = function(eventName, callback) {
    var _self = this;
    callback && this.addEventListener(eventName, function newCallback() {
        _self.removeEventListener(eventName, newCallback);
        callback.apply(null, arguments);
    });
};


EventEmitter.setDefaultHandler = function(eventName, callback) {
    this._defaultHandlers = this._defaultHandlers || {};
    
    if (this._defaultHandlers[eventName])
        throw new Error("The default handler for '" + eventName + "' is already set");
        
    this._defaultHandlers[eventName] = callback;
};

EventEmitter.on =
EventEmitter.addEventListener = function(eventName, callback, capturing) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        listeners = this._eventRegistry[eventName] = [];

    if (listeners.indexOf(callback) == -1)
        listeners[capturing ? "unshift" : "push"](callback);
    return callback;
};

EventEmitter.off =
EventEmitter.removeListener =
EventEmitter.removeEventListener = function(eventName, callback) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        return;

    var index = listeners.indexOf(callback);
    if (index !== -1)
        listeners.splice(index, 1);
};

EventEmitter.removeAllListeners = function(eventName) {
    if (this._eventRegistry) this._eventRegistry[eventName] = [];
};

exports.EventEmitter = EventEmitter;

});

ace.define('ace/mouse/fold_handler', ["require", 'exports', 'module' ], function(acequire, exports, module) {


function FoldHandler(editor) {

    editor.on("click", function(e) {
        var position = e.getDocumentPosition();
        var session = editor.session;
        var fold = session.getFoldAt(position.row, position.column, 1);
        if (fold) {
            if (e.getAccelKey())
                session.removeFold(fold);
            else
                session.expandFold(fold);

            e.stop();
        }
    });

    editor.on("gutterclick", function(e) {
        var gutterRegion = editor.renderer.$gutterLayer.getRegion(e);

        if (gutterRegion == "foldWidgets") {
            var row = e.getDocumentPosition().row;
            var session = editor.session;
            if (session.foldWidgets && session.foldWidgets[row])
                editor.session.onFoldWidgetClick(row, e);
            if (!editor.isFocused())
                editor.focus();
            e.stop();
        }
    });

    editor.on("gutterdblclick", function(e) {
        var gutterRegion = editor.renderer.$gutterLayer.getRegion(e);

        if (gutterRegion == "foldWidgets") {
            var row = e.getDocumentPosition().row;
            var session = editor.session;
            var data = session.getParentFoldRangeData(row, true);
            var range = data.range || data.firstRange;

            if (range) {
                var row = range.start.row;
                var fold = session.getFoldAt(row, session.getLine(row).length, 1);

                if (fold) {
                    session.removeFold(fold);
                } else {
                    session.addFold("...", range);
                    editor.renderer.scrollCursorIntoView({row: range.start.row, column: 0});
                }
            }
            e.stop();
        }
    });
}

exports.FoldHandler = FoldHandler;

});

ace.define('ace/keyboard/keybinding', ["require", 'exports', 'module' , 'ace/lib/keys', 'ace/lib/event'], function(acequire, exports, module) {


var keyUtil  = acequire("../lib/keys");
var event = acequire("../lib/event");

var KeyBinding = function(editor) {
    this.$editor = editor;
    this.$data = { };
    this.$handlers = [];
    this.setDefaultHandler(editor.commands);
};

(function() {
    this.setDefaultHandler = function(kb) {
        this.removeKeyboardHandler(this.$defaultHandler);
        this.$defaultHandler = kb;
        this.addKeyboardHandler(kb, 0);
        this.$data = {editor: this.$editor};
    };

    this.setKeyboardHandler = function(kb) {
        var h = this.$handlers;
        if (h[h.length - 1] == kb)
            return;

        while (h[h.length - 1] && h[h.length - 1] != this.$defaultHandler)
            this.removeKeyboardHandler(h[h.length - 1]);

        this.addKeyboardHandler(kb, 1);
    };

    this.addKeyboardHandler = function(kb, pos) {
        if (!kb)
            return;
        var i = this.$handlers.indexOf(kb);
        if (i != -1)
            this.$handlers.splice(i, 1);

        if (pos == undefined)
            this.$handlers.push(kb);
        else
            this.$handlers.splice(pos, 0, kb);

        if (i == -1 && kb.attach)
            kb.attach(this.$editor);
    };

    this.removeKeyboardHandler = function(kb) {
        var i = this.$handlers.indexOf(kb);
        if (i == -1)
            return false;
        this.$handlers.splice(i, 1);
        kb.detach && kb.detach(this.$editor);
        return true;
    };

    this.getKeyboardHandler = function() {
        return this.$handlers[this.$handlers.length - 1];
    };

    this.$callKeyboardHandlers = function (hashId, keyString, keyCode, e) {
        var toExecute;
        var success = false;
        var commands = this.$editor.commands;

        for (var i = this.$handlers.length; i--;) {
            toExecute = this.$handlers[i].handleKeyboard(
                this.$data, hashId, keyString, keyCode, e
            );
            if (!toExecute || !toExecute.command)
                continue;
            if (toExecute.command == "null") {
                success = toExecute.passEvent != true;
            } else {
                success = commands.exec(toExecute.command, this.$editor, toExecute.args, e);                
            }
            if (success && e && hashId != -1)
                event.stopEvent(e);
            if (success)
                break;
        }
        return success;
    };

    this.onCommandKey = function(e, hashId, keyCode) {
        var keyString = keyUtil.keyCodeToString(keyCode);
        this.$callKeyboardHandlers(hashId, keyString, keyCode, e);
    };

    this.onTextInput = function(text) {
        var success = this.$callKeyboardHandlers(-1, text);
        if (!success)
            this.$editor.commands.exec("insertstring", this.$editor, text);
    };

}).call(KeyBinding.prototype);

exports.KeyBinding = KeyBinding;
});

ace.define('ace/edit_session', ["require", 'exports', 'module' , 'ace/lib/oop', 'ace/lib/lang', 'ace/config', 'ace/lib/event_emitter', 'ace/selection', 'ace/mode/text', 'ace/range', 'ace/document', 'ace/background_tokenizer', 'ace/search_highlight', 'ace/edit_session/folding', 'ace/edit_session/bracket_match'], function(acequire, exports, module) {


var oop = acequire("./lib/oop");
var lang = acequire("./lib/lang");
var config = acequire("./config");
var EventEmitter = acequire("./lib/event_emitter").EventEmitter;
var Selection = acequire("./selection").Selection;
var TextMode = acequire("./mode/text").Mode;
var Range = acequire("./range").Range;
var Document = acequire("./document").Document;
var BackgroundTokenizer = acequire("./background_tokenizer").BackgroundTokenizer;
var SearchHighlight = acequire("./search_highlight").SearchHighlight;

var EditSession = function(text, mode) {
    this.$breakpoints = [];
    this.$decorations = [];
    this.$frontMarkers = {};
    this.$backMarkers = {};
    this.$markerId = 1;
    this.$undoSelect = true;

    this.$foldData = [];
    this.$foldData.toString = function() {
        return this.join("\n");
    }
    this.on("changeFold", this.onChangeFold.bind(this));
    this.$onChange = this.onChange.bind(this);

    if (typeof text != "object" || !text.getLine)
        text = new Document(text);

    this.setDocument(text);

    this.selection = new Selection(this);
    this.setMode(mode);

    config.resetOptions(this);
    config._emit("session", this);
};


(function() {

    oop.implement(this, EventEmitter);
    this.setDocument = function(doc) {
        if (this.doc)
            this.doc.removeListener("change", this.$onChange);

        this.doc = doc;
        doc.on("change", this.$onChange);

        if (this.bgTokenizer)
            this.bgTokenizer.setDocument(this.getDocument());

        this.resetCaches();
    };
    this.getDocument = function() {
        return this.doc;
    };
    this.$resetRowCache = function(docRow) {
        if (!docRow) {
            this.$docRowCache = [];
            this.$screenRowCache = [];
            return;
        }
        var l = this.$docRowCache.length;
        var i = this.$getRowCacheIndex(this.$docRowCache, docRow) + 1;
        if (l > i) {
            this.$docRowCache.splice(i, l);
            this.$screenRowCache.splice(i, l);
        }
    };

    this.$getRowCacheIndex = function(cacheArray, val) {
        var low = 0;
        var hi = cacheArray.length - 1;

        while (low <= hi) {
            var mid = (low + hi) >> 1;
            var c = cacheArray[mid];

            if (val > c)
                low = mid + 1;
            else if (val < c)
                hi = mid - 1;
            else
                return mid;
        }

        return low -1;
    };

    this.resetCaches = function() {
        this.$modified = true;
        this.$wrapData = [];
        this.$rowLengthCache = [];
        this.$resetRowCache(0);
        if (this.bgTokenizer)
            this.bgTokenizer.start(0);
    };

    this.onChangeFold = function(e) {
        var fold = e.data;
        this.$resetRowCache(fold.start.row);
    };

    this.onChange = function(e) {
        var delta = e.data;
        this.$modified = true;

        this.$resetRowCache(delta.range.start.row);

        var removedFolds = this.$updateInternalDataOnChange(e);
        if (!this.$fromUndo && this.$undoManager && !delta.ignore) {
            this.$deltasDoc.push(delta);
            if (removedFolds && removedFolds.length != 0) {
                this.$deltasFold.push({
                    action: "removeFolds",
                    folds:  removedFolds
                });
            }

            this.$informUndoManager.schedule();
        }

        this.bgTokenizer.$updateOnChange(delta);
        this._emit("change", e);
    };
    this.setValue = function(text) {
        this.doc.setValue(text);
        this.selection.moveCursorTo(0, 0);
        this.selection.clearSelection();

        this.$resetRowCache(0);
        this.$deltas = [];
        this.$deltasDoc = [];
        this.$deltasFold = [];
        this.getUndoManager().reset();
    };
    this.getValue =
    this.toString = function() {
        return this.doc.getValue();
    };
    this.getSelection = function() {
        return this.selection;
    };
    this.getState = function(row) {
        return this.bgTokenizer.getState(row);
    };
    this.getTokens = function(row) {
        return this.bgTokenizer.getTokens(row);
    };
    this.getTokenAt = function(row, column) {
        var tokens = this.bgTokenizer.getTokens(row);
        var token, c = 0;
        if (column == null) {
            i = tokens.length - 1;
            c = this.getLine(row).length;
        } else {
            for (var i = 0; i < tokens.length; i++) {
                c += tokens[i].value.length;
                if (c >= column)
                    break;
            }
        }
        token = tokens[i];
        if (!token)
            return null;
        token.index = i;
        token.start = c - token.value.length;
        return token;
    };
    this.setUndoManager = function(undoManager) {
        this.$undoManager = undoManager;
        this.$deltas = [];
        this.$deltasDoc = [];
        this.$deltasFold = [];

        if (this.$informUndoManager)
            this.$informUndoManager.cancel();

        if (undoManager) {
            var self = this;

            this.$syncInformUndoManager = function() {
                self.$informUndoManager.cancel();

                if (self.$deltasFold.length) {
                    self.$deltas.push({
                        group: "fold",
                        deltas: self.$deltasFold
                    });
                    self.$deltasFold = [];
                }

                if (self.$deltasDoc.length) {
                    self.$deltas.push({
                        group: "doc",
                        deltas: self.$deltasDoc
                    });
                    self.$deltasDoc = [];
                }

                if (self.$deltas.length > 0) {
                    undoManager.execute({
                        action: "aceupdate",
                        args: [self.$deltas, self]
                    });
                }

                self.$deltas = [];
            }
            this.$informUndoManager = lang.delayedCall(this.$syncInformUndoManager);
        }
    };
    this.markUndoGroup = function() {
        if (this.$syncInformUndoManager)
            this.$syncInformUndoManager();
    };
    
    this.$defaultUndoManager = {
        undo: function() {},
        redo: function() {},
        reset: function() {}
    };
    this.getUndoManager = function() {
        return this.$undoManager || this.$defaultUndoManager;
    };
    this.getTabString = function() {
        if (this.getUseSoftTabs()) {
            return lang.stringRepeat(" ", this.getTabSize());
        } else {
            return "\t";
        }
    };
    this.setUseSoftTabs = function(val) {
        this.setOption("useSoftTabs", val);
    };
    this.getUseSoftTabs = function() {
         return this.$useSoftTabs;
    };
    this.setTabSize = function(tabSize) {
        this.setOption("tabSize", tabSize)
    };
    this.getTabSize = function() {
        return this.$tabSize;
    };
    this.isTabStop = function(position) {
        return this.$useSoftTabs && (position.column % this.$tabSize == 0);
    };

    this.$overwrite = false;
    this.setOverwrite = function(overwrite) {
        this.setOption("overwrite", overwrite)
    };
    this.getOverwrite = function() {
        return this.$overwrite;
    };
    this.toggleOverwrite = function() {
        this.setOverwrite(!this.$overwrite);
    };
    this.addGutterDecoration = function(row, className) {
        if (!this.$decorations[row])
            this.$decorations[row] = "";
        this.$decorations[row] += " " + className;
        this._emit("changeBreakpoint", {});
    };
    this.removeGutterDecoration = function(row, className) {
        this.$decorations[row] = (this.$decorations[row] || "").replace(" " + className, "");
        this._emit("changeBreakpoint", {});
    };
    this.getBreakpoints = function() {
        return this.$breakpoints;
    };
    this.setBreakpoints = function(rows) {
        this.$breakpoints = [];
        for (var i=0; i<rows.length; i++) {
            this.$breakpoints[rows[i]] = "ace_breakpoint";
        }
        this._emit("changeBreakpoint", {});
    };
    this.clearBreakpoints = function() {
        this.$breakpoints = [];
        this._emit("changeBreakpoint", {});
    };
    this.setBreakpoint = function(row, className) {
        if (className === undefined)
            className = "ace_breakpoint";
        if (className)
            this.$breakpoints[row] = className;
        else
            delete this.$breakpoints[row];
        this._emit("changeBreakpoint", {});
    };
    this.clearBreakpoint = function(row) {
        delete this.$breakpoints[row];
        this._emit("changeBreakpoint", {});
    };
    this.addMarker = function(range, clazz, type, inFront) {
        var id = this.$markerId++;

        var marker = {
            range : range,
            type : type || "line",
            renderer: typeof type == "function" ? type : null,
            clazz : clazz,
            inFront: !!inFront,
            id: id
        }

        if (inFront) {
            this.$frontMarkers[id] = marker;
            this._emit("changeFrontMarker")
        } else {
            this.$backMarkers[id] = marker;
            this._emit("changeBackMarker")
        }

        return id;
    };
    this.addDynamicMarker = function(marker, inFront) {
        if (!marker.update)
            return;
        var id = this.$markerId++;
        marker.id = id;
        marker.inFront = !!inFront;

        if (inFront) {
            this.$frontMarkers[id] = marker;
            this._emit("changeFrontMarker")
        } else {
            this.$backMarkers[id] = marker;
            this._emit("changeBackMarker")
        }

        return marker;
    };
    this.removeMarker = function(markerId) {
        var marker = this.$frontMarkers[markerId] || this.$backMarkers[markerId];
        if (!marker)
            return;

        var markers = marker.inFront ? this.$frontMarkers : this.$backMarkers;
        if (marker) {
            delete (markers[markerId]);
            this._emit(marker.inFront ? "changeFrontMarker" : "changeBackMarker");
        }
    };
    this.getMarkers = function(inFront) {
        return inFront ? this.$frontMarkers : this.$backMarkers;
    };

    this.highlight = function(re) {
        if (!this.$searchHighlight) {
            var highlight = new SearchHighlight(null, "ace_selected-word", "text");
            this.$searchHighlight = this.addDynamicMarker(highlight);
        }
        this.$searchHighlight.setRegexp(re);
    }
    this.highlightLines = function(startRow, endRow, clazz, inFront) {
        if (typeof endRow != "number") {
            clazz = endRow;
            endRow = startRow;
        }
        if (!clazz)
            clazz = "ace_step";

        var range = new Range(startRow, 0, endRow, Infinity);
        range.id = this.addMarker(range, clazz, "fullLine", inFront);
        return range;
    };
    this.setAnnotations = function(annotations) {
        this.$annotations = annotations;
        this._emit("changeAnnotation", {});
    };
    this.getAnnotations = function() {
        return this.$annotations || [];
    };
    this.clearAnnotations = function() {
        this.setAnnotations([]);
    };
    this.$detectNewLine = function(text) {
        var match = text.match(/^.*?(\r?\n)/m);
        if (match) {
            this.$autoNewLine = match[1];
        } else {
            this.$autoNewLine = "\n";
        }
    };
    this.getWordRange = function(row, column) {
        var line = this.getLine(row);

        var inToken = false;
        if (column > 0)
            inToken = !!line.charAt(column - 1).match(this.tokenRe);

        if (!inToken)
            inToken = !!line.charAt(column).match(this.tokenRe);

        if (inToken)
            var re = this.tokenRe;
        else if (/^\s+$/.test(line.slice(column-1, column+1)))
            var re = /\s/;
        else
            var re = this.nonTokenRe;

        var start = column;
        if (start > 0) {
            do {
                start--;
            }
            while (start >= 0 && line.charAt(start).match(re));
            start++;
        }

        var end = column;
        while (end < line.length && line.charAt(end).match(re)) {
            end++;
        }

        return new Range(row, start, row, end);
    };
    this.getAWordRange = function(row, column) {
        var wordRange = this.getWordRange(row, column);
        var line = this.getLine(wordRange.end.row);

        while (line.charAt(wordRange.end.column).match(/[ \t]/)) {
            wordRange.end.column += 1;
        }
        return wordRange;
    };
    this.setNewLineMode = function(newLineMode) {
        this.doc.setNewLineMode(newLineMode);
    };
    this.getNewLineMode = function() {
        return this.doc.getNewLineMode();
    };
    this.setUseWorker = function(useWorker) { this.setOption("useWorker", useWorker); };
    this.getUseWorker = function() { return this.$useWorker; };
    this.onReloadTokenizer = function(e) {
        var rows = e.data;
        this.bgTokenizer.start(rows.first);
        this._emit("tokenizerUpdate", e);
    };

    this.$modes = {};
    this.$mode = null;
    this.$modeId = null;
    this.setMode = function(mode) {
        if (mode && typeof mode === "object") {
            if (mode.getTokenizer)
                return this.$onChangeMode(mode);
            var options = mode;
            var path = options.path;
        } else {
            path = mode || "ace/mode/text";
        }
        if (!this.$modes["ace/mode/text"])
            this.$modes["ace/mode/text"] = new TextMode();

        if (this.$modes[path] && !options)
            return this.$onChangeMode(this.$modes[path]);
        this.$modeId = path;
        config.loadModule(["mode", path], function(m) {
            if (this.$modeId !== path)
                return;
            if (this.$modes[path] && !options)
                return this.$onChangeMode(this.$modes[path]);
            if (m && m.Mode) {
                m = new m.Mode(options);
                if (!options) {
                    this.$modes[path] = m;
                    m.$id = path;
                }
                this.$onChangeMode(m)
            }
        }.bind(this));
        if (!this.$mode)
            this.$onChangeMode(this.$modes["ace/mode/text"], true);
    };

    this.$onChangeMode = function(mode, $isPlaceholder) {
        if (this.$mode === mode) return;
        this.$mode = mode;

        this.$stopWorker();

        if (this.$useWorker)
            this.$startWorker();

        var tokenizer = mode.getTokenizer();

        if(tokenizer.addEventListener !== undefined) {
            var onReloadTokenizer = this.onReloadTokenizer.bind(this);
            tokenizer.addEventListener("update", onReloadTokenizer);
        }

        if (!this.bgTokenizer) {
            this.bgTokenizer = new BackgroundTokenizer(tokenizer);
            var _self = this;
            this.bgTokenizer.addEventListener("update", function(e) {
                _self._emit("tokenizerUpdate", e);
            });
        } else {
            this.bgTokenizer.setTokenizer(tokenizer);
        }

        this.bgTokenizer.setDocument(this.getDocument());

        this.tokenRe = mode.tokenRe;
        this.nonTokenRe = mode.nonTokenRe;


        if (!$isPlaceholder) {
            this.$modeId = mode.$id;
            this.$setFolding(mode.foldingRules);
            this._emit("changeMode");
            this.bgTokenizer.start(0);
        }
    };


    this.$stopWorker = function() {
        if (this.$worker)
            this.$worker.terminate();

        this.$worker = null;
    };

    this.$startWorker = function() {
        if (typeof Worker !== "undefined" && !acequire.noWorker) {
            try {
                this.$worker = this.$mode.createWorker(this);
            } catch (e) {
                console.log("Could not load worker");
                console.log(e);
                this.$worker = null;
            }
        }
        else
            this.$worker = null;
    };
    this.getMode = function() {
        return this.$mode;
    };

    this.$scrollTop = 0;
    this.setScrollTop = function(scrollTop) {
        scrollTop = Math.round(Math.max(0, scrollTop));
        if (this.$scrollTop === scrollTop || isNaN(scrollTop))
            return;

        this.$scrollTop = scrollTop;
        this._signal("changeScrollTop", scrollTop);
    };
    this.getScrollTop = function() {
        return this.$scrollTop;
    };

    this.$scrollLeft = 0;
    this.setScrollLeft = function(scrollLeft) {
        scrollLeft = Math.round(Math.max(0, scrollLeft));
        if (this.$scrollLeft === scrollLeft || isNaN(scrollLeft))
            return;

        this.$scrollLeft = scrollLeft;
        this._signal("changeScrollLeft", scrollLeft);
    };
    this.getScrollLeft = function() {
        return this.$scrollLeft;
    };
    this.getScreenWidth = function() {
        this.$computeWidth();
        return this.screenWidth;
    };

    this.$computeWidth = function(force) {
        if (this.$modified || force) {
            this.$modified = false;

            if (this.$useWrapMode)
                return this.screenWidth = this.$wrapLimit;

            var lines = this.doc.getAllLines();
            var cache = this.$rowLengthCache;
            var longestScreenLine = 0;
            var foldIndex = 0;
            var foldLine = this.$foldData[foldIndex];
            var foldStart = foldLine ? foldLine.start.row : Infinity;
            var len = lines.length;

            for (var i = 0; i < len; i++) {
                if (i > foldStart) {
                    i = foldLine.end.row + 1;
                    if (i >= len)
                        break;
                    foldLine = this.$foldData[foldIndex++];
                    foldStart = foldLine ? foldLine.start.row : Infinity;
                }

                if (cache[i] == null)
                    cache[i] = this.$getStringScreenWidth(lines[i])[0];

                if (cache[i] > longestScreenLine)
                    longestScreenLine = cache[i];
            }
            this.screenWidth = longestScreenLine;
        }
    };
    this.getLine = function(row) {
        return this.doc.getLine(row);
    };
    this.getLines = function(firstRow, lastRow) {
        return this.doc.getLines(firstRow, lastRow);
    };
    this.getLength = function() {
        return this.doc.getLength();
    };
    this.getTextRange = function(range) {
        return this.doc.getTextRange(range || this.selection.getRange());
    };
    this.insert = function(position, text) {
        return this.doc.insert(position, text);
    };
    this.remove = function(range) {
        return this.doc.remove(range);
    };
    this.undoChanges = function(deltas, dontSelect) {
        if (!deltas.length)
            return;

        this.$fromUndo = true;
        var lastUndoRange = null;
        for (var i = deltas.length - 1; i != -1; i--) {
            var delta = deltas[i];
            if (delta.group == "doc") {
                this.doc.revertDeltas(delta.deltas);
                lastUndoRange =
                    this.$getUndoSelection(delta.deltas, true, lastUndoRange);
            } else {
                delta.deltas.forEach(function(foldDelta) {
                    this.addFolds(foldDelta.folds);
                }, this);
            }
        }
        this.$fromUndo = false;
        lastUndoRange &&
            this.$undoSelect &&
            !dontSelect &&
            this.selection.setSelectionRange(lastUndoRange);
        return lastUndoRange;
    };
    this.redoChanges = function(deltas, dontSelect) {
        if (!deltas.length)
            return;

        this.$fromUndo = true;
        var lastUndoRange = null;
        for (var i = 0; i < deltas.length; i++) {
            var delta = deltas[i];
            if (delta.group == "doc") {
                this.doc.applyDeltas(delta.deltas);
                lastUndoRange =
                    this.$getUndoSelection(delta.deltas, false, lastUndoRange);
            }
        }
        this.$fromUndo = false;
        lastUndoRange &&
            this.$undoSelect &&
            !dontSelect &&
            this.selection.setSelectionRange(lastUndoRange);
        return lastUndoRange;
    };
    this.setUndoSelect = function(enable) {
        this.$undoSelect = enable;
    };

    this.$getUndoSelection = function(deltas, isUndo, lastUndoRange) {
        function isInsert(delta) {
            var insert =
                delta.action === "insertText" || delta.action === "insertLines";
            return isUndo ? !insert : insert;
        }

        var delta = deltas[0];
        var range, point;
        var lastDeltaIsInsert = false;
        if (isInsert(delta)) {
            range = delta.range.clone();
            lastDeltaIsInsert = true;
        } else {
            range = Range.fromPoints(delta.range.start, delta.range.start);
            lastDeltaIsInsert = false;
        }

        for (var i = 1; i < deltas.length; i++) {
            delta = deltas[i];
            if (isInsert(delta)) {
                point = delta.range.start;
                if (range.compare(point.row, point.column) == -1) {
                    range.setStart(delta.range.start);
                }
                point = delta.range.end;
                if (range.compare(point.row, point.column) == 1) {
                    range.setEnd(delta.range.end);
                }
                lastDeltaIsInsert = true;
            } else {
                point = delta.range.start;
                if (range.compare(point.row, point.column) == -1) {
                    range =
                        Range.fromPoints(delta.range.start, delta.range.start);
                }
                lastDeltaIsInsert = false;
            }
        }
        if (lastUndoRange != null) {
            var cmp = lastUndoRange.compareRange(range);
            if (cmp == 1) {
                range.setStart(lastUndoRange.start);
            } else if (cmp == -1) {
                range.setEnd(lastUndoRange.end);
            }
        }

        return range;
    };
    this.replace = function(range, text) {
        return this.doc.replace(range, text);
    };
    this.moveText = function(fromRange, toPosition, copy) {
        var text = this.getTextRange(fromRange);
        var folds = this.getFoldsInRange(fromRange);

        var toRange = Range.fromPoints(toPosition, toPosition);
        if (!copy) {
            this.remove(fromRange);
            var rowDiff = fromRange.start.row - fromRange.end.row;
            var collDiff = rowDiff ? -fromRange.end.column : fromRange.start.column - fromRange.end.column;
            if (collDiff) {
                if (toRange.start.row == fromRange.end.row && toRange.start.column > fromRange.end.column)
                    toRange.start.column += collDiff;
                if (toRange.end.row == fromRange.end.row && toRange.end.column > fromRange.end.column)
                    toRange.end.column += collDiff;
            }
            if (rowDiff && toRange.start.row >= fromRange.end.row) {
                toRange.start.row += rowDiff;
                toRange.end.row += rowDiff;
            }
        }

        this.insert(toRange.start, text);
        if (folds.length) {
            var oldStart = fromRange.start;
            var newStart = toRange.start;
            var rowDiff = newStart.row - oldStart.row;
            var collDiff = newStart.column - oldStart.column;
            this.addFolds(folds.map(function(x) {
                x = x.clone();
                if (x.start.row == oldStart.row)
                    x.start.column += collDiff;
                if (x.end.row == oldStart.row)
                    x.end.column += collDiff;
                x.start.row += rowDiff;
                x.end.row += rowDiff;
                return x;
            }));
        }

        return toRange;
    };
    this.indentRows = function(startRow, endRow, indentString) {
        indentString = indentString.replace(/\t/g, this.getTabString());
        for (var row=startRow; row<=endRow; row++)
            this.insert({row: row, column:0}, indentString);
    };
    this.outdentRows = function (range) {
        var rowRange = range.collapseRows();
        var deleteRange = new Range(0, 0, 0, 0);
        var size = this.getTabSize();

        for (var i = rowRange.start.row; i <= rowRange.end.row; ++i) {
            var line = this.getLine(i);

            deleteRange.start.row = i;
            deleteRange.end.row = i;
            for (var j = 0; j < size; ++j)
                if (line.charAt(j) != ' ')
                    break;
            if (j < size && line.charAt(j) == '\t') {
                deleteRange.start.column = j;
                deleteRange.end.column = j + 1;
            } else {
                deleteRange.start.column = 0;
                deleteRange.end.column = j;
            }
            this.remove(deleteRange);
        }
    };

    this.$moveLines = function(firstRow, lastRow, dir) {
        firstRow = this.getRowFoldStart(firstRow);
        lastRow = this.getRowFoldEnd(lastRow);
        if (dir < 0) {
            var row = this.getRowFoldStart(firstRow + dir);
            if (row < 0) return 0;
            var diff = row-firstRow;
        } else if (dir > 0) {
            var row = this.getRowFoldEnd(lastRow + dir);
            if (row > this.doc.getLength()-1) return 0;
            var diff = row-lastRow;
        } else {
            firstRow = this.$clipRowToDocument(firstRow);
            lastRow = this.$clipRowToDocument(lastRow);
            var diff = lastRow - firstRow + 1;
        }

        var range = new Range(firstRow, 0, lastRow, Number.MAX_VALUE);
        var folds = this.getFoldsInRange(range).map(function(x){
            x = x.clone();
            x.start.row += diff;
            x.end.row += diff;
            return x;
        });

        var lines = dir == 0
            ? this.doc.getLines(firstRow, lastRow)
            : this.doc.removeLines(firstRow, lastRow);
        this.doc.insertLines(firstRow+diff, lines);
        folds.length && this.addFolds(folds);
        return diff;
    };
    this.moveLinesUp = function(firstRow, lastRow) {
        return this.$moveLines(firstRow, lastRow, -1);
    };
    this.moveLinesDown = function(firstRow, lastRow) {
        return this.$moveLines(firstRow, lastRow, 1);
    };
    this.duplicateLines = function(firstRow, lastRow) {
        return this.$moveLines(firstRow, lastRow, 0);
    };


    this.$clipRowToDocument = function(row) {
        return Math.max(0, Math.min(row, this.doc.getLength()-1));
    };

    this.$clipColumnToRow = function(row, column) {
        if (column < 0)
            return 0;
        return Math.min(this.doc.getLine(row).length, column);
    };


    this.$clipPositionToDocument = function(row, column) {
        column = Math.max(0, column);

        if (row < 0) {
            row = 0;
            column = 0;
        } else {
            var len = this.doc.getLength();
            if (row >= len) {
                row = len - 1;
                column = this.doc.getLine(len-1).length;
            } else {
                column = Math.min(this.doc.getLine(row).length, column);
            }
        }

        return {
            row: row,
            column: column
        };
    };

    this.$clipRangeToDocument = function(range) {
        if (range.start.row < 0) {
            range.start.row = 0;
            range.start.column = 0;
        } else {
            range.start.column = this.$clipColumnToRow(
                range.start.row,
                range.start.column
            );
        }

        var len = this.doc.getLength() - 1;
        if (range.end.row > len) {
            range.end.row = len;
            range.end.column = this.doc.getLine(len).length;
        } else {
            range.end.column = this.$clipColumnToRow(
                range.end.row,
                range.end.column
            );
        }
        return range;
    };
    this.$wrapLimit = 80;
    this.$useWrapMode = false;
    this.$wrapLimitRange = {
        min : null,
        max : null
    };
    this.setUseWrapMode = function(useWrapMode) {
        if (useWrapMode != this.$useWrapMode) {
            this.$useWrapMode = useWrapMode;
            this.$modified = true;
            this.$resetRowCache(0);
            if (useWrapMode) {
                var len = this.getLength();
                this.$wrapData = [];
                for (var i = 0; i < len; i++) {
                    this.$wrapData.push([]);
                }
                this.$updateWrapData(0, len - 1);
            }

            this._emit("changeWrapMode");
        }
    };
    this.getUseWrapMode = function() {
        return this.$useWrapMode;
    };
    this.setWrapLimitRange = function(min, max) {
        if (this.$wrapLimitRange.min !== min || this.$wrapLimitRange.max !== max) {
            this.$wrapLimitRange.min = min;
            this.$wrapLimitRange.max = max;
            this.$modified = true;
            this._emit("changeWrapMode");
        }
    };
    this.adjustWrapLimit = function(desiredLimit, $printMargin) {
        var limits = this.$wrapLimitRange
        if (limits.max < 0)
            limits = {min: $printMargin, max: $printMargin};
        var wrapLimit = this.$constrainWrapLimit(desiredLimit, limits.min, limits.max);
        if (wrapLimit != this.$wrapLimit && wrapLimit > 1) {
            this.$wrapLimit = wrapLimit;
            this.$modified = true;
            if (this.$useWrapMode) {
                this.$updateWrapData(0, this.getLength() - 1);
                this.$resetRowCache(0);
                this._emit("changeWrapLimit");
            }
            return true;
        }
        return false;
    };

    this.$constrainWrapLimit = function(wrapLimit, min, max) {
        if (min)
            wrapLimit = Math.max(min, wrapLimit);

        if (max)
            wrapLimit = Math.min(max, wrapLimit);

        return  wrapLimit;
    };
    this.getWrapLimit = function() {
        return this.$wrapLimit;
    };
    this.getWrapLimitRange = function() {
        return {
            min : this.$wrapLimitRange.min,
            max : this.$wrapLimitRange.max
        };
    };

    this.$updateInternalDataOnChange = function(e) {
        var useWrapMode = this.$useWrapMode;
        var len;
        var action = e.data.action;
        var firstRow = e.data.range.start.row;
        var lastRow = e.data.range.end.row;
        var start = e.data.range.start;
        var end = e.data.range.end;
        var removedFolds = null;

        if (action.indexOf("Lines") != -1) {
            if (action == "insertLines") {
                lastRow = firstRow + (e.data.lines.length);
            } else {
                lastRow = firstRow;
            }
            len = e.data.lines ? e.data.lines.length : lastRow - firstRow;
        } else {
            len = lastRow - firstRow;
        }

        this.$updating = true;
        if (len != 0) {
            if (action.indexOf("remove") != -1) {
                this[useWrapMode ? "$wrapData" : "$rowLengthCache"].splice(firstRow, len);

                var foldLines = this.$foldData;
                removedFolds = this.getFoldsInRange(e.data.range);
                this.removeFolds(removedFolds);

                var foldLine = this.getFoldLine(end.row);
                var idx = 0;
                if (foldLine) {
                    foldLine.addRemoveChars(end.row, end.column, start.column - end.column);
                    foldLine.shiftRow(-len);

                    var foldLineBefore = this.getFoldLine(firstRow);
                    if (foldLineBefore && foldLineBefore !== foldLine) {
                        foldLineBefore.merge(foldLine);
                        foldLine = foldLineBefore;
                    }
                    idx = foldLines.indexOf(foldLine) + 1;
                }

                for (idx; idx < foldLines.length; idx++) {
                    var foldLine = foldLines[idx];
                    if (foldLine.start.row >= end.row) {
                        foldLine.shiftRow(-len);
                    }
                }

                lastRow = firstRow;
            } else {
                var args;
                if (useWrapMode) {
                    args = [firstRow, 0];
                    for (var i = 0; i < len; i++) args.push([]);
                    this.$wrapData.splice.apply(this.$wrapData, args);
                } else {
                    args = Array(len);
                    args.unshift(firstRow, 0);
                    this.$rowLengthCache.splice.apply(this.$rowLengthCache, args);
                }
                var foldLines = this.$foldData;
                var foldLine = this.getFoldLine(firstRow);
                var idx = 0;
                if (foldLine) {
                    var cmp = foldLine.range.compareInside(start.row, start.column)
                    if (cmp == 0) {
                        foldLine = foldLine.split(start.row, start.column);
                        foldLine.shiftRow(len);
                        foldLine.addRemoveChars(
                            lastRow, 0, end.column - start.column);
                    } else
                    if (cmp == -1) {
                        foldLine.addRemoveChars(firstRow, 0, end.column - start.column);
                        foldLine.shiftRow(len);
                    }
                    idx = foldLines.indexOf(foldLine) + 1;
                }

                for (idx; idx < foldLines.length; idx++) {
                    var foldLine = foldLines[idx];
                    if (foldLine.start.row >= firstRow) {
                        foldLine.shiftRow(len);
                    }
                }
            }
        } else {
            len = Math.abs(e.data.range.start.column - e.data.range.end.column);
            if (action.indexOf("remove") != -1) {
                removedFolds = this.getFoldsInRange(e.data.range);
                this.removeFolds(removedFolds);

                len = -len;
            }
            var foldLine = this.getFoldLine(firstRow);
            if (foldLine) {
                foldLine.addRemoveChars(firstRow, start.column, len);
            }
        }

        if (useWrapMode && this.$wrapData.length != this.doc.getLength()) {
            console.error("doc.getLength() and $wrapData.length have to be the same!");
        }
        this.$updating = false;

        if (useWrapMode)
            this.$updateWrapData(firstRow, lastRow);
        else
            this.$updateRowLengthCache(firstRow, lastRow);

        return removedFolds;
    };

    this.$updateRowLengthCache = function(firstRow, lastRow, b) {
        this.$rowLengthCache[firstRow] = null;
        this.$rowLengthCache[lastRow] = null;
    };

    this.$updateWrapData = function(firstRow, lastRow) {
        var lines = this.doc.getAllLines();
        var tabSize = this.getTabSize();
        var wrapData = this.$wrapData;
        var wrapLimit = this.$wrapLimit;
        var tokens;
        var foldLine;

        var row = firstRow;
        lastRow = Math.min(lastRow, lines.length - 1);
        while (row <= lastRow) {
            foldLine = this.getFoldLine(row, foldLine);
            if (!foldLine) {
                tokens = this.$getDisplayTokens(lang.stringTrimRight(lines[row]));
                wrapData[row] = this.$computeWrapSplits(tokens, wrapLimit, tabSize);
                row ++;
            } else {
                tokens = [];
                foldLine.walk(function(placeholder, row, column, lastColumn) {
                        var walkTokens;
                        if (placeholder != null) {
                            walkTokens = this.$getDisplayTokens(
                                            placeholder, tokens.length);
                            walkTokens[0] = PLACEHOLDER_START;
                            for (var i = 1; i < walkTokens.length; i++) {
                                walkTokens[i] = PLACEHOLDER_BODY;
                            }
                        } else {
                            walkTokens = this.$getDisplayTokens(
                                lines[row].substring(lastColumn, column),
                                tokens.length);
                        }
                        tokens = tokens.concat(walkTokens);
                    }.bind(this),
                    foldLine.end.row,
                    lines[foldLine.end.row].length + 1
                );
                while (tokens.length != 0 && tokens[tokens.length - 1] >= SPACE)
                    tokens.pop();

                wrapData[foldLine.start.row]
                    = this.$computeWrapSplits(tokens, wrapLimit, tabSize);
                row = foldLine.end.row + 1;
            }
        }
    };
    var CHAR = 1,
        CHAR_EXT = 2,
        PLACEHOLDER_START = 3,
        PLACEHOLDER_BODY =  4,
        PUNCTUATION = 9,
        SPACE = 10,
        TAB = 11,
        TAB_SPACE = 12;


    this.$computeWrapSplits = function(tokens, wrapLimit) {
        if (tokens.length == 0) {
            return [];
        }

        var splits = [];
        var displayLength = tokens.length;
        var lastSplit = 0, lastDocSplit = 0;

        function addSplit(screenPos) {
            var displayed = tokens.slice(lastSplit, screenPos);
            var len = displayed.length;
            displayed.join("").
                replace(/12/g, function() {
                    len -= 1;
                }).
                replace(/2/g, function() {
                    len -= 1;
                });

            lastDocSplit += len;
            splits.push(lastDocSplit);
            lastSplit = screenPos;
        }

        while (displayLength - lastSplit > wrapLimit) {
            var split = lastSplit + wrapLimit;
            if (tokens[split] >= SPACE) {
                while (tokens[split] >= SPACE) {
                    split ++;
                }
                addSplit(split);
                continue;
            }
            if (tokens[split] == PLACEHOLDER_START
                || tokens[split] == PLACEHOLDER_BODY)
            {
                for (split; split != lastSplit - 1; split--) {
                    if (tokens[split] == PLACEHOLDER_START) {
                        break;
                    }
                }
                if (split > lastSplit) {
                    addSplit(split);
                    continue;
                }
                split = lastSplit + wrapLimit;
                for (split; split < tokens.length; split++) {
                    if (tokens[split] != PLACEHOLDER_BODY)
                    {
                        break;
                    }
                }
                if (split == tokens.length) {
                    break;  // Breaks the while-loop.
                }
                addSplit(split);
                continue;
            }
            var minSplit = Math.max(split - 10, lastSplit - 1);
            while (split > minSplit && tokens[split] < PLACEHOLDER_START) {
                split --;
            }
            while (split > minSplit && tokens[split] == PUNCTUATION) {
                split --;
            }
            if (split > minSplit) {
                addSplit(++split);
                continue;
            }
            split = lastSplit + wrapLimit;
            addSplit(split);
        }
        return splits;
    };
    this.$getDisplayTokens = function(str, offset) {
        var arr = [];
        var tabSize;
        offset = offset || 0;

        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            if (c == 9) {
                tabSize = this.getScreenTabSize(arr.length + offset);
                arr.push(TAB);
                for (var n = 1; n < tabSize; n++) {
                    arr.push(TAB_SPACE);
                }
            }
            else if (c == 32) {
                arr.push(SPACE);
            } else if((c > 39 && c < 48) || (c > 57 && c < 64)) {
                arr.push(PUNCTUATION);
            }
            else if (c >= 0x1100 && isFullWidth(c)) {
                arr.push(CHAR, CHAR_EXT);
            } else {
                arr.push(CHAR);
            }
        }
        return arr;
    };
    this.$getStringScreenWidth = function(str, maxScreenColumn, screenColumn) {
        if (maxScreenColumn == 0)
            return [0, 0];
        if (maxScreenColumn == null)
            maxScreenColumn = Infinity;
        screenColumn = screenColumn || 0;

        var c, column;
        for (column = 0; column < str.length; column++) {
            c = str.charCodeAt(column);
            if (c == 9) {
                screenColumn += this.getScreenTabSize(screenColumn);
            }
            else if (c >= 0x1100 && isFullWidth(c)) {
                screenColumn += 2;
            } else {
                screenColumn += 1;
            }
            if (screenColumn > maxScreenColumn) {
                break;
            }
        }

        return [screenColumn, column];
    };
    this.getRowLength = function(row) {
        if (!this.$useWrapMode || !this.$wrapData[row]) {
            return 1;
        } else {
            return this.$wrapData[row].length + 1;
        }
    };
    this.getScreenLastRowColumn = function(screenRow) {
        var pos = this.screenToDocumentPosition(screenRow, Number.MAX_VALUE);
        return this.documentToScreenColumn(pos.row, pos.column);
    };
    this.getDocumentLastRowColumn = function(docRow, docColumn) {
        var screenRow = this.documentToScreenRow(docRow, docColumn);
        return this.getScreenLastRowColumn(screenRow);
    };
    this.getDocumentLastRowColumnPosition = function(docRow, docColumn) {
        var screenRow = this.documentToScreenRow(docRow, docColumn);
        return this.screenToDocumentPosition(screenRow, Number.MAX_VALUE / 10);
    };
    this.getRowSplitData = function(row) {
        if (!this.$useWrapMode) {
            return undefined;
        } else {
            return this.$wrapData[row];
        }
    };
    this.getScreenTabSize = function(screenColumn) {
        return this.$tabSize - screenColumn % this.$tabSize;
    };


    this.screenToDocumentRow = function(screenRow, screenColumn) {
        return this.screenToDocumentPosition(screenRow, screenColumn).row;
    };


    this.screenToDocumentColumn = function(screenRow, screenColumn) {
        return this.screenToDocumentPosition(screenRow, screenColumn).column;
    };
    this.screenToDocumentPosition = function(screenRow, screenColumn) {
        if (screenRow < 0)
            return {row: 0, column: 0};

        var line;
        var docRow = 0;
        var docColumn = 0;
        var column;
        var row = 0;
        var rowLength = 0;

        var rowCache = this.$screenRowCache;
        var i = this.$getRowCacheIndex(rowCache, screenRow);
        var l = rowCache.length;
        if (l && i >= 0) {
            var row = rowCache[i];
            var docRow = this.$docRowCache[i];
            var doCache = screenRow > rowCache[l - 1];
        } else {
            var doCache = !l;
        }

        var maxRow = this.getLength() - 1;
        var foldLine = this.getNextFoldLine(docRow);
        var foldStart = foldLine ? foldLine.start.row : Infinity;

        while (row <= screenRow) {
            rowLength = this.getRowLength(docRow);
            if (row + rowLength - 1 >= screenRow || docRow >= maxRow) {
                break;
            } else {
                row += rowLength;
                docRow++;
                if (docRow > foldStart) {
                    docRow = foldLine.end.row+1;
                    foldLine = this.getNextFoldLine(docRow, foldLine);
                    foldStart = foldLine ? foldLine.start.row : Infinity;
                }
            }

            if (doCache) {
                this.$docRowCache.push(docRow);
                this.$screenRowCache.push(row);
            }
        }

        if (foldLine && foldLine.start.row <= docRow) {
            line = this.getFoldDisplayLine(foldLine);
            docRow = foldLine.start.row;
        } else if (row + rowLength <= screenRow || docRow > maxRow) {
            return {
                row: maxRow,
                column: this.getLine(maxRow).length
            }
        } else {
            line = this.getLine(docRow);
            foldLine = null;
        }

        if (this.$useWrapMode) {
            var splits = this.$wrapData[docRow];
            if (splits) {
                column = splits[screenRow - row];
                if(screenRow > row && splits.length) {
                    docColumn = splits[screenRow - row - 1] || splits[splits.length - 1];
                    line = line.substring(docColumn);
                }
            }
        }

        docColumn += this.$getStringScreenWidth(line, screenColumn)[1];
        if (this.$useWrapMode && docColumn >= column)
            docColumn = column - 1;

        if (foldLine)
            return foldLine.idxToPosition(docColumn);

        return {row: docRow, column: docColumn};
    };
    this.documentToScreenPosition = function(docRow, docColumn) {
        if (typeof docColumn === "undefined")
            var pos = this.$clipPositionToDocument(docRow.row, docRow.column);
        else
            pos = this.$clipPositionToDocument(docRow, docColumn);

        docRow = pos.row;
        docColumn = pos.column;

        var screenRow = 0;
        var foldStartRow = null;
        var fold = null;
        fold = this.getFoldAt(docRow, docColumn, 1);
        if (fold) {
            docRow = fold.start.row;
            docColumn = fold.start.column;
        }

        var rowEnd, row = 0;


        var rowCache = this.$docRowCache;
        var i = this.$getRowCacheIndex(rowCache, docRow);
        var l = rowCache.length;
        if (l && i >= 0) {
            var row = rowCache[i];
            var screenRow = this.$screenRowCache[i];
            var doCache = docRow > rowCache[l - 1];
        } else {
            var doCache = !l;
        }

        var foldLine = this.getNextFoldLine(row);
        var foldStart = foldLine ?foldLine.start.row :Infinity;

        while (row < docRow) {
            if (row >= foldStart) {
                rowEnd = foldLine.end.row + 1;
                if (rowEnd > docRow)
                    break;
                foldLine = this.getNextFoldLine(rowEnd, foldLine);
                foldStart = foldLine ?foldLine.start.row :Infinity;
            }
            else {
                rowEnd = row + 1;
            }

            screenRow += this.getRowLength(row);
            row = rowEnd;

            if (doCache) {
                this.$docRowCache.push(row);
                this.$screenRowCache.push(screenRow);
            }
        }
        var textLine = "";
        if (foldLine && row >= foldStart) {
            textLine = this.getFoldDisplayLine(foldLine, docRow, docColumn);
            foldStartRow = foldLine.start.row;
        } else {
            textLine = this.getLine(docRow).substring(0, docColumn);
            foldStartRow = docRow;
        }
        if (this.$useWrapMode) {
            var wrapRow = this.$wrapData[foldStartRow];
            var screenRowOffset = 0;
            while (textLine.length >= wrapRow[screenRowOffset]) {
                screenRow ++;
                screenRowOffset++;
            }
            textLine = textLine.substring(
                wrapRow[screenRowOffset - 1] || 0, textLine.length
            );
        }

        return {
            row: screenRow,
            column: this.$getStringScreenWidth(textLine)[0]
        };
    };
    this.documentToScreenColumn = function(row, docColumn) {
        return this.documentToScreenPosition(row, docColumn).column;
    };
    this.documentToScreenRow = function(docRow, docColumn) {
        return this.documentToScreenPosition(docRow, docColumn).row;
    };
    this.getScreenLength = function() {
        var screenRows = 0;
        var fold = null;
        if (!this.$useWrapMode) {
            screenRows = this.getLength();
            var foldData = this.$foldData;
            for (var i = 0; i < foldData.length; i++) {
                fold = foldData[i];
                screenRows -= fold.end.row - fold.start.row;
            }
        } else {
            var lastRow = this.$wrapData.length;
            var row = 0, i = 0;
            var fold = this.$foldData[i++];
            var foldStart = fold ? fold.start.row :Infinity;

            while (row < lastRow) {
                screenRows += this.$wrapData[row].length + 1;
                row ++;
                if (row > foldStart) {
                    row = fold.end.row+1;
                    fold = this.$foldData[i++];
                    foldStart = fold ?fold.start.row :Infinity;
                }
            }
        }

        return screenRows;
    };
    function isFullWidth(c) {
        if (c < 0x1100)
            return false;
        return c >= 0x1100 && c <= 0x115F ||
               c >= 0x11A3 && c <= 0x11A7 ||
               c >= 0x11FA && c <= 0x11FF ||
               c >= 0x2329 && c <= 0x232A ||
               c >= 0x2E80 && c <= 0x2E99 ||
               c >= 0x2E9B && c <= 0x2EF3 ||
               c >= 0x2F00 && c <= 0x2FD5 ||
               c >= 0x2FF0 && c <= 0x2FFB ||
               c >= 0x3000 && c <= 0x303E ||
               c >= 0x3041 && c <= 0x3096 ||
               c >= 0x3099 && c <= 0x30FF ||
               c >= 0x3105 && c <= 0x312D ||
               c >= 0x3131 && c <= 0x318E ||
               c >= 0x3190 && c <= 0x31BA ||
               c >= 0x31C0 && c <= 0x31E3 ||
               c >= 0x31F0 && c <= 0x321E ||
               c >= 0x3220 && c <= 0x3247 ||
               c >= 0x3250 && c <= 0x32FE ||
               c >= 0x3300 && c <= 0x4DBF ||
               c >= 0x4E00 && c <= 0xA48C ||
               c >= 0xA490 && c <= 0xA4C6 ||
               c >= 0xA960 && c <= 0xA97C ||
               c >= 0xAC00 && c <= 0xD7A3 ||
               c >= 0xD7B0 && c <= 0xD7C6 ||
               c >= 0xD7CB && c <= 0xD7FB ||
               c >= 0xF900 && c <= 0xFAFF ||
               c >= 0xFE10 && c <= 0xFE19 ||
               c >= 0xFE30 && c <= 0xFE52 ||
               c >= 0xFE54 && c <= 0xFE66 ||
               c >= 0xFE68 && c <= 0xFE6B ||
               c >= 0xFF01 && c <= 0xFF60 ||
               c >= 0xFFE0 && c <= 0xFFE6;
    };

}).call(EditSession.prototype);

acequire("./edit_session/folding").Folding.call(EditSession.prototype);
acequire("./edit_session/bracket_match").BracketMatch.call(EditSession.prototype);


config.defineOptions(EditSession.prototype, "session", {
    wrap: {
        set: function(value) {
            if (!value || value == "off")
                value = false;
            else if (value == "free")
                value = true;
            else if (value == "printMargin")
                value = -1;
            else if (typeof value == "string")
                value = parseInt(value, 10) || false;

            if (this.$wrap == value)
                return;
            if (!value) {
                this.setUseWrapMode(false);
            } else {
                var col = typeof value == "number" ? value : null;
                this.setWrapLimitRange(col, col);
                this.setUseWrapMode(true);
            }
            this.$wrap = value;
        },
        get: function() {
            return this.getUseWrapMode() ? this.getWrapLimitRange().min || "free" : "off";
        },
        handlesSet: true
    },
    firstLineNumber: {
        set: function() {this._emit("changeBreakpoint");},
        initialValue: 1
    },
    useWorker: {
        set: function(useWorker) {
            this.$useWorker = useWorker;

            this.$stopWorker();
            if (useWorker)
                this.$startWorker();
        },
        initialValue: true
    },
    useSoftTabs: {initialValue: true},
    tabSize: {
        set: function(tabSize) {
            if (isNaN(tabSize) || this.$tabSize === tabSize) return;

            this.$modified = true;
            this.$rowLengthCache = [];
            this.$tabSize = tabSize;
            this._emit("changeTabSize");
        },
        initialValue: 4,
        handlesSet: true
    },
    overwrite: {
        set: function(val) {this._emit("changeOverwrite");},
        initialValue: false
    },
    newLineMode: {
        set: function(val) {this.doc.setNewLineMode(val)},
        get: function() {return this.doc.getNewLineMode()},
        handlesSet: true
    }
});

exports.EditSession = EditSession;
});

ace.define('ace/selection', ["require", 'exports', 'module' , 'ace/lib/oop', 'ace/lib/lang', 'ace/lib/event_emitter', 'ace/range'], function(acequire, exports, module) {


var oop = acequire("./lib/oop");
var lang = acequire("./lib/lang");
var EventEmitter = acequire("./lib/event_emitter").EventEmitter;
var Range = acequire("./range").Range;
var Selection = function(session) {
    this.session = session;
    this.doc = session.getDocument();

    this.clearSelection();
    this.lead = this.selectionLead = this.doc.createAnchor(0, 0);
    this.anchor = this.selectionAnchor = this.doc.createAnchor(0, 0);

    var self = this;
    this.lead.on("change", function(e) {
        self._emit("changeCursor");
        if (!self.$isEmpty)
            self._emit("changeSelection");
        if (!self.$keepDesiredColumnOnChange && e.old.column != e.value.column)
            self.$desiredColumn = null;
    });

    this.selectionAnchor.on("change", function() {
        if (!self.$isEmpty)
            self._emit("changeSelection");
    });
};

(function() {

    oop.implement(this, EventEmitter);
    this.isEmpty = function() {
        return (this.$isEmpty || (
            this.anchor.row == this.lead.row &&
            this.anchor.column == this.lead.column
        ));
    };
    this.isMultiLine = function() {
        if (this.isEmpty()) {
            return false;
        }

        return this.getRange().isMultiLine();
    };
    this.getCursor = function() {
        return this.lead.getPosition();
    };
    this.setSelectionAnchor = function(row, column) {
        this.anchor.setPosition(row, column);

        if (this.$isEmpty) {
            this.$isEmpty = false;
            this._emit("changeSelection");
        }
    };
    this.getSelectionAnchor = function() {
        if (this.$isEmpty)
            return this.getSelectionLead()
        else
            return this.anchor.getPosition();
    };
    this.getSelectionLead = function() {
        return this.lead.getPosition();
    };
    this.shiftSelection = function(columns) {
        if (this.$isEmpty) {
            this.moveCursorTo(this.lead.row, this.lead.column + columns);
            return;
        };

        var anchor = this.getSelectionAnchor();
        var lead = this.getSelectionLead();

        var isBackwards = this.isBackwards();

        if (!isBackwards || anchor.column !== 0)
            this.setSelectionAnchor(anchor.row, anchor.column + columns);

        if (isBackwards || lead.column !== 0) {
            this.$moveSelection(function() {
                this.moveCursorTo(lead.row, lead.column + columns);
            });
        }
    };
    this.isBackwards = function() {
        var anchor = this.anchor;
        var lead = this.lead;
        return (anchor.row > lead.row || (anchor.row == lead.row && anchor.column > lead.column));
    };
    this.getRange = function() {
        var anchor = this.anchor;
        var lead = this.lead;

        if (this.isEmpty())
            return Range.fromPoints(lead, lead);

        if (this.isBackwards()) {
            return Range.fromPoints(lead, anchor);
        }
        else {
            return Range.fromPoints(anchor, lead);
        }
    };
    this.clearSelection = function() {
        if (!this.$isEmpty) {
            this.$isEmpty = true;
            this._emit("changeSelection");
        }
    };
    this.selectAll = function() {
        var lastRow = this.doc.getLength() - 1;
        this.setSelectionAnchor(0, 0);
        this.moveCursorTo(lastRow, this.doc.getLine(lastRow).length);
    };
    this.setRange =
    this.setSelectionRange = function(range, reverse) {
        if (reverse) {
            this.setSelectionAnchor(range.end.row, range.end.column);
            this.selectTo(range.start.row, range.start.column);
        } else {
            this.setSelectionAnchor(range.start.row, range.start.column);
            this.selectTo(range.end.row, range.end.column);
        }
        this.$desiredColumn = null;
    };

    this.$moveSelection = function(mover) {
        var lead = this.lead;
        if (this.$isEmpty)
            this.setSelectionAnchor(lead.row, lead.column);

        mover.call(this);
    };
    this.selectTo = function(row, column) {
        this.$moveSelection(function() {
            this.moveCursorTo(row, column);
        });
    };
    this.selectToPosition = function(pos) {
        this.$moveSelection(function() {
            this.moveCursorToPosition(pos);
        });
    };
    this.selectUp = function() {
        this.$moveSelection(this.moveCursorUp);
    };
    this.selectDown = function() {
        this.$moveSelection(this.moveCursorDown);
    };
    this.selectRight = function() {
        this.$moveSelection(this.moveCursorRight);
    };
    this.selectLeft = function() {
        this.$moveSelection(this.moveCursorLeft);
    };
    this.selectLineStart = function() {
        this.$moveSelection(this.moveCursorLineStart);
    };
    this.selectLineEnd = function() {
        this.$moveSelection(this.moveCursorLineEnd);
    };
    this.selectFileEnd = function() {
        this.$moveSelection(this.moveCursorFileEnd);
    };
    this.selectFileStart = function() {
        this.$moveSelection(this.moveCursorFileStart);
    };
    this.selectWordRight = function() {
        this.$moveSelection(this.moveCursorWordRight);
    };
    this.selectWordLeft = function() {
        this.$moveSelection(this.moveCursorWordLeft);
    };
    this.getWordRange = function(row, column) {
        if (typeof column == "undefined") {
            var cursor = row || this.lead;
            row = cursor.row;
            column = cursor.column;
        }
        return this.session.getWordRange(row, column);
    };
    this.selectWord = function() {
        this.setSelectionRange(this.getWordRange());
    };
    this.selectAWord = function() {
        var cursor = this.getCursor();
        var range = this.session.getAWordRange(cursor.row, cursor.column);
        this.setSelectionRange(range);
    };

    this.getLineRange = function(row, excludeLastChar) {
        var rowStart = typeof row == "number" ? row : this.lead.row;
        var rowEnd;

        var foldLine = this.session.getFoldLine(rowStart);
        if (foldLine) {
            rowStart = foldLine.start.row;
            rowEnd = foldLine.end.row;
        } else {
            rowEnd = rowStart;
        }
        if (excludeLastChar)
            return new Range(rowStart, 0, rowEnd, this.session.getLine(rowEnd).length);
        else
            return new Range(rowStart, 0, rowEnd + 1, 0);
    };
    this.selectLine = function() {
        this.setSelectionRange(this.getLineRange());
    };
    this.moveCursorUp = function() {
        this.moveCursorBy(-1, 0);
    };
    this.moveCursorDown = function() {
        this.moveCursorBy(1, 0);
    };
    this.moveCursorLeft = function() {
        var cursor = this.lead.getPosition(),
            fold;

        if (fold = this.session.getFoldAt(cursor.row, cursor.column, -1)) {
            this.moveCursorTo(fold.start.row, fold.start.column);
        } else if (cursor.column == 0) {
            if (cursor.row > 0) {
                this.moveCursorTo(cursor.row - 1, this.doc.getLine(cursor.row - 1).length);
            }
        }
        else {
            var tabSize = this.session.getTabSize();
            if (this.session.isTabStop(cursor) && this.doc.getLine(cursor.row).slice(cursor.column-tabSize, cursor.column).split(" ").length-1 == tabSize)
                this.moveCursorBy(0, -tabSize);
            else
                this.moveCursorBy(0, -1);
        }
    };
    this.moveCursorRight = function() {
        var cursor = this.lead.getPosition(),
            fold;
        if (fold = this.session.getFoldAt(cursor.row, cursor.column, 1)) {
            this.moveCursorTo(fold.end.row, fold.end.column);
        }
        else if (this.lead.column == this.doc.getLine(this.lead.row).length) {
            if (this.lead.row < this.doc.getLength() - 1) {
                this.moveCursorTo(this.lead.row + 1, 0);
            }
        }
        else {
            var tabSize = this.session.getTabSize();
            var cursor = this.lead;
            if (this.session.isTabStop(cursor) && this.doc.getLine(cursor.row).slice(cursor.column, cursor.column+tabSize).split(" ").length-1 == tabSize)
                this.moveCursorBy(0, tabSize);
            else
                this.moveCursorBy(0, 1);
        }
    };
    this.moveCursorLineStart = function() {
        var row = this.lead.row;
        var column = this.lead.column;
        var screenRow = this.session.documentToScreenRow(row, column);
        var firstColumnPosition = this.session.screenToDocumentPosition(screenRow, 0);
        var beforeCursor = this.session.getDisplayLine(
            row, null, firstColumnPosition.row,
            firstColumnPosition.column
        );

        var leadingSpace = beforeCursor.match(/^\s*/);
        if (leadingSpace[0].length != column && !this.session.$useEmacsStyleLineStart)
            firstColumnPosition.column += leadingSpace[0].length;
        this.moveCursorToPosition(firstColumnPosition);
    };
    this.moveCursorLineEnd = function() {
        var lead = this.lead;
        var lineEnd = this.session.getDocumentLastRowColumnPosition(lead.row, lead.column);
        if (this.lead.column == lineEnd.column) {
            var line = this.session.getLine(lineEnd.row);
            if (lineEnd.column == line.length) {
                var textEnd = line.search(/\s+$/);
                if (textEnd > 0)
                    lineEnd.column = textEnd;
            }
        }

        this.moveCursorTo(lineEnd.row, lineEnd.column);
    };
    this.moveCursorFileEnd = function() {
        var row = this.doc.getLength() - 1;
        var column = this.doc.getLine(row).length;
        this.moveCursorTo(row, column);
    };
    this.moveCursorFileStart = function() {
        this.moveCursorTo(0, 0);
    };
    this.moveCursorLongWordRight = function() {
        var row = this.lead.row;
        var column = this.lead.column;
        var line = this.doc.getLine(row);
        var rightOfCursor = line.substring(column);

        var match;
        this.session.nonTokenRe.lastIndex = 0;
        this.session.tokenRe.lastIndex = 0;
        var fold = this.session.getFoldAt(row, column, 1);
        if (fold) {
            this.moveCursorTo(fold.end.row, fold.end.column);
            return;
        }
        if (match = this.session.nonTokenRe.exec(rightOfCursor)) {
            column += this.session.nonTokenRe.lastIndex;
            this.session.nonTokenRe.lastIndex = 0;
            rightOfCursor = line.substring(column);
        }
        if (column >= line.length) {
            this.moveCursorTo(row, line.length);
            this.moveCursorRight();
            if (row < this.doc.getLength() - 1)
                this.moveCursorWordRight();
            return;
        }
        if (match = this.session.tokenRe.exec(rightOfCursor)) {
            column += this.session.tokenRe.lastIndex;
            this.session.tokenRe.lastIndex = 0;
        }

        this.moveCursorTo(row, column);
    };
    this.moveCursorLongWordLeft = function() {
        var row = this.lead.row;
        var column = this.lead.column;
        var fold;
        if (fold = this.session.getFoldAt(row, column, -1)) {
            this.moveCursorTo(fold.start.row, fold.start.column);
            return;
        }

        var str = this.session.getFoldStringAt(row, column, -1);
        if (str == null) {
            str = this.doc.getLine(row).substring(0, column)
        }

        var leftOfCursor = lang.stringReverse(str);
        var match;
        this.session.nonTokenRe.lastIndex = 0;
        this.session.tokenRe.lastIndex = 0;
        if (match = this.session.nonTokenRe.exec(leftOfCursor)) {
            column -= this.session.nonTokenRe.lastIndex;
            leftOfCursor = leftOfCursor.slice(this.session.nonTokenRe.lastIndex);
            this.session.nonTokenRe.lastIndex = 0;
        }
        if (column <= 0) {
            this.moveCursorTo(row, 0);
            this.moveCursorLeft();
            if (row > 0)
                this.moveCursorWordLeft();
            return;
        }
        if (match = this.session.tokenRe.exec(leftOfCursor)) {
            column -= this.session.tokenRe.lastIndex;
            this.session.tokenRe.lastIndex = 0;
        }

        this.moveCursorTo(row, column);
    };

    this.$shortWordEndIndex = function(rightOfCursor) {
        var match, index = 0, ch;
        var whitespaceRe = /\s/;
        var tokenRe = this.session.tokenRe;

        tokenRe.lastIndex = 0;
        if (match = this.session.tokenRe.exec(rightOfCursor)) {
            index = this.session.tokenRe.lastIndex;
        } else {
            while ((ch = rightOfCursor[index]) && whitespaceRe.test(ch))
                index ++;

            if (index <= 1) {
                tokenRe.lastIndex = 0;
                 while ((ch = rightOfCursor[index]) && !tokenRe.test(ch)) {
                    tokenRe.lastIndex = 0;
                    index ++;
                    if (whitespaceRe.test(ch)) {
                        if (index > 2) {
                            index--
                            break;
                        } else {
                            while ((ch = rightOfCursor[index]) && whitespaceRe.test(ch))
                                index ++;
                            if (index > 2)
                                break
                        }
                    }
                }
            }
        }
        tokenRe.lastIndex = 0;

        return index;
    };

    this.moveCursorShortWordRight = function() {
        var row = this.lead.row;
        var column = this.lead.column;
        var line = this.doc.getLine(row);
        var rightOfCursor = line.substring(column);

        var fold = this.session.getFoldAt(row, column, 1);
        if (fold)
            return this.moveCursorTo(fold.end.row, fold.end.column);

        if (column == line.length) {
            var l = this.doc.getLength();
            do {    
                row++;
                rightOfCursor = this.doc.getLine(row)
            } while (row < l && /^\s*$/.test(rightOfCursor))
            
            if (!/^\s+/.test(rightOfCursor))
                rightOfCursor = ""
            column = 0;
        }

        var index = this.$shortWordEndIndex(rightOfCursor);

        this.moveCursorTo(row, column + index);
    };

    this.moveCursorShortWordLeft = function() {
        var row = this.lead.row;
        var column = this.lead.column;

        var fold;
        if (fold = this.session.getFoldAt(row, column, -1))
            return this.moveCursorTo(fold.start.row, fold.start.column);

        var line = this.session.getLine(row).substring(0, column);
        if (column == 0) {
            do {    
                row--;
                line = this.doc.getLine(row);
            } while (row > 0 && /^\s*$/.test(line))
            
            column = line.length;
            if (!/\s+$/.test(line))
                line = ""
        }

        var leftOfCursor = lang.stringReverse(line);
        var index = this.$shortWordEndIndex(leftOfCursor);

        return this.moveCursorTo(row, column - index);
    };

    this.moveCursorWordRight = function() {
        if (this.session.$selectLongWords)
            this.moveCursorLongWordRight();
        else
            this.moveCursorShortWordRight();
    };

    this.moveCursorWordLeft = function() {
        if (this.session.$selectLongWords)
            this.moveCursorLongWordLeft();
        else
            this.moveCursorShortWordLeft();
    };
    this.moveCursorBy = function(rows, chars) {
        var screenPos = this.session.documentToScreenPosition(
            this.lead.row,
            this.lead.column
        );

        if (chars === 0) {
            if (this.$desiredColumn)
                screenPos.column = this.$desiredColumn;
            else
                this.$desiredColumn = screenPos.column;
        }

        var docPos = this.session.screenToDocumentPosition(screenPos.row + rows, screenPos.column);
        this.moveCursorTo(docPos.row, docPos.column + chars, chars === 0);
    };
    this.moveCursorToPosition = function(position) {
        this.moveCursorTo(position.row, position.column);
    };
    this.moveCursorTo = function(row, column, keepDesiredColumn) {
        var fold = this.session.getFoldAt(row, column, 1);
        if (fold) {
            row = fold.start.row;
            column = fold.start.column;
        }

        this.$keepDesiredColumnOnChange = true;
        this.lead.setPosition(row, column);
        this.$keepDesiredColumnOnChange = false;

        if (!keepDesiredColumn)
            this.$desiredColumn = null;
    };
    this.moveCursorToScreen = function(row, column, keepDesiredColumn) {
        var pos = this.session.screenToDocumentPosition(row, column);
        this.moveCursorTo(pos.row, pos.column, keepDesiredColumn);
    };
    this.detach = function() {
        this.lead.detach();
        this.anchor.detach();
        this.session = this.doc = null;
    }

    this.fromOrientedRange = function(range) {
        this.setSelectionRange(range, range.cursor == range.start);
        this.$desiredColumn = range.desiredColumn || this.$desiredColumn;
    }

    this.toOrientedRange = function(range) {
        var r = this.getRange();
        if (range) {
            range.start.column = r.start.column;
            range.start.row = r.start.row;
            range.end.column = r.end.column;
            range.end.row = r.end.row;
        } else {
            range = r;
        }

        range.cursor = this.isBackwards() ? range.start : range.end;
        range.desiredColumn = this.$desiredColumn;
        return range;
    }

}).call(Selection.prototype);

exports.Selection = Selection;
});

ace.define('ace/range', ["require", 'exports', 'module' ], function(acequire, exports, module) {

var comparePoints = function(p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
};
var Range = function(startRow, startColumn, endRow, endColumn) {
    this.start = {
        row: startRow,
        column: startColumn
    };

    this.end = {
        row: endRow,
        column: endColumn
    };
};

(function() {
    this.isEqual = function(range) {
        return this.start.row === range.start.row &&
            this.end.row === range.end.row &&
            this.start.column === range.start.column &&
            this.end.column === range.end.column;
    };
    this.toString = function() {
        return ("Range: [" + this.start.row + "/" + this.start.column +
            "] -> [" + this.end.row + "/" + this.end.column + "]");
    };

    this.contains = function(row, column) {
        return this.compare(row, column) == 0;
    };
    this.compareRange = function(range) {
        var cmp,
            end = range.end,
            start = range.start;

        cmp = this.compare(end.row, end.column);
        if (cmp == 1) {
            cmp = this.compare(start.row, start.column);
            if (cmp == 1) {
                return 2;
            } else if (cmp == 0) {
                return 1;
            } else {
                return 0;
            }
        } else if (cmp == -1) {
            return -2;
        } else {
            cmp = this.compare(start.row, start.column);
            if (cmp == -1) {
                return -1;
            } else if (cmp == 1) {
                return 42;
            } else {
                return 0;
            }
        }
    };
    this.comparePoint = function(p) {
        return this.compare(p.row, p.column);
    };
    this.containsRange = function(range) {
        return this.comparePoint(range.start) == 0 && this.comparePoint(range.end) == 0;
    };
    this.intersects = function(range) {
        var cmp = this.compareRange(range);
        return (cmp == -1 || cmp == 0 || cmp == 1);
    };
    this.isEnd = function(row, column) {
        return this.end.row == row && this.end.column == column;
    };
    this.isStart = function(row, column) {
        return this.start.row == row && this.start.column == column;
    };
    this.setStart = function(row, column) {
        if (typeof row == "object") {
            this.start.column = row.column;
            this.start.row = row.row;
        } else {
            this.start.row = row;
            this.start.column = column;
        }
    };
    this.setEnd = function(row, column) {
        if (typeof row == "object") {
            this.end.column = row.column;
            this.end.row = row.row;
        } else {
            this.end.row = row;
            this.end.column = column;
        }
    };
    this.inside = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isEnd(row, column) || this.isStart(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.insideStart = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isEnd(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.insideEnd = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isStart(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.compare = function(row, column) {
        if (!this.isMultiLine()) {
            if (row === this.start.row) {
                return column < this.start.column ? -1 : (column > this.end.column ? 1 : 0);
            };
        }

        if (row < this.start.row)
            return -1;

        if (row > this.end.row)
            return 1;

        if (this.start.row === row)
            return column >= this.start.column ? 0 : -1;

        if (this.end.row === row)
            return column <= this.end.column ? 0 : 1;

        return 0;
    };
    this.compareStart = function(row, column) {
        if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    };
    this.compareEnd = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else {
            return this.compare(row, column);
        }
    };
    this.compareInside = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    };
    this.clipRows = function(firstRow, lastRow) {
        if (this.end.row > lastRow)
            var end = {row: lastRow + 1, column: 0};
        else if (this.end.row < firstRow)
            var end = {row: firstRow, column: 0};

        if (this.start.row > lastRow)
            var start = {row: lastRow + 1, column: 0};
        else if (this.start.row < firstRow)
            var start = {row: firstRow, column: 0};

        return Range.fromPoints(start || this.start, end || this.end);
    };
    this.extend = function(row, column) {
        var cmp = this.compare(row, column);

        if (cmp == 0)
            return this;
        else if (cmp == -1)
            var start = {row: row, column: column};
        else
            var end = {row: row, column: column};

        return Range.fromPoints(start || this.start, end || this.end);
    };

    this.isEmpty = function() {
        return (this.start.row === this.end.row && this.start.column === this.end.column);
    };
    this.isMultiLine = function() {
        return (this.start.row !== this.end.row);
    };
    this.clone = function() {
        return Range.fromPoints(this.start, this.end);
    };
    this.collapseRows = function() {
        if (this.end.column == 0)
            return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row-1), 0)
        else
            return new Range(this.start.row, 0, this.end.row, 0)
    };
    this.toScreenRange = function(session) {
        var screenPosStart = session.documentToScreenPosition(this.start);
        var screenPosEnd = session.documentToScreenPosition(this.end);

        return new Range(
            screenPosStart.row, screenPosStart.column,
            screenPosEnd.row, screenPosEnd.column
        );
    };
    this.moveBy = function(row, column) {
        this.start.row += row;
        this.start.column += column;
        this.end.row += row;
        this.end.column += column;
    };

}).call(Range.prototype);
Range.fromPoints = function(start, end) {
    return new Range(start.row, start.column, end.row, end.column);
};
Range.comparePoints = comparePoints;

Range.comparePoints = function(p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
};


exports.Range = Range;
});

ace.define('ace/mode/text', ["require", 'exports', 'module' , 'ace/tokenizer', 'ace/mode/text_highlight_rules', 'ace/mode/behaviour', 'ace/unicode', 'ace/lib/lang'], function(acequire, exports, module) {


var Tokenizer = acequire("../tokenizer").Tokenizer;
var TextHighlightRules = acequire("./text_highlight_rules").TextHighlightRules;
var Behaviour = acequire("./behaviour").Behaviour;
var unicode = acequire("../unicode");
var lang = acequire("../lib/lang");

var Mode = function() {
    this.$tokenizer = new Tokenizer(new TextHighlightRules().getRules());
    this.$behaviour = new Behaviour();
};

(function() {

    this.tokenRe = new RegExp("^["
        + unicode.packages.L
        + unicode.packages.Mn + unicode.packages.Mc
        + unicode.packages.Nd
        + unicode.packages.Pc + "\\$_]+", "g"
    );
    
    this.nonTokenRe = new RegExp("^(?:[^"
        + unicode.packages.L
        + unicode.packages.Mn + unicode.packages.Mc
        + unicode.packages.Nd
        + unicode.packages.Pc + "\\$_]|\s])+", "g"
    );

    this.getTokenizer = function() {
        return this.$tokenizer;
    };

    this.toggleCommentLines = function(state, session, startRow, endRow) {
        var doc = session.doc;
        var regexpStart, lineCommentStart;
        if (!this.lineCommentStart) {
            return false
        } else if (Array.isArray(this.lineCommentStart)) {
            regexpStart = this.lineCommentStart.map(lang.escapeRegExp).join("|");
            lineCommentStart = this.lineCommentStart[0];
        } else {
            regexpStart = lang.escapeRegExp(this.lineCommentStart);
            lineCommentStart = this.lineCommentStart;
        }
        regexpStart = new RegExp("^\\s*(?:" + regexpStart + ") ?");

        var removeComment = true;
        var minSpace = Infinity;
        var indentations = [];

        for (var i = startRow; i <= endRow; i++) {
            var line = doc.getLine(i);
            var indent = line.search(/\S|$/);
            indentations[i] = indent;
            if (indent < minSpace)
                minSpace = indent;
            if (removeComment && !regexpStart.test(line))
                removeComment = false;
        }

        if (removeComment) {
            for (var i = startRow; i <= endRow; i++) {
                var line = doc.getLine(i);
                var m = line.match(regexpStart);
                doc.removeInLine(i, indentations[i], m[0].length);
            }
        } else {
            lineCommentStart += " ";
            for (var i = startRow; i <= endRow; i++) {
                doc.insertInLine({row: i, column: minSpace}, lineCommentStart);
            }
        }
    };

    this.getNextLineIndent = function(state, line, tab) {
        return this.$getIndent(line);
    };

    this.checkOutdent = function(state, line, input) {
        return false;
    };

    this.autoOutdent = function(state, doc, row) {
    };

    this.$getIndent = function(line) {
        return line.match(/^\s*/)[0];
    };
    
    this.createWorker = function(session) {
        return null;
    };

    this.createModeDelegates = function (mapping) {
        if (!this.$embeds) {
            return;
        }
        this.$modes = {};
        for (var i = 0; i < this.$embeds.length; i++) {
            if (mapping[this.$embeds[i]]) {
                this.$modes[this.$embeds[i]] = new mapping[this.$embeds[i]]();
            }
        }
        
        var delegations = ['toggleCommentLines', 'getNextLineIndent', 'checkOutdent', 'autoOutdent', 'transformAction'];

        for (var i = 0; i < delegations.length; i++) {
            (function(scope) {
              var functionName = delegations[i];
              var defaultHandler = scope[functionName];
              scope[delegations[i]] = function() {
                  return this.$delegator(functionName, arguments, defaultHandler);
              }
            } (this));
        }
    }
    
    this.$delegator = function(method, args, defaultHandler) {
        var state = args[0];
        
        for (var i = 0; i < this.$embeds.length; i++) {
            if (!this.$modes[this.$embeds[i]]) continue;
            
            var split = state.split(this.$embeds[i]);
            if (!split[0] && split[1]) {
                args[0] = split[1];
                var mode = this.$modes[this.$embeds[i]];
                return mode[method].apply(mode, args);
            }
        }
        var ret = defaultHandler.apply(this, args);
        return defaultHandler ? ret : undefined;
    };
    
    this.transformAction = function(state, action, editor, session, param) {
        if (this.$behaviour) {
            var behaviours = this.$behaviour.getBehaviours();
            for (var key in behaviours) {
                if (behaviours[key][action]) {
                    var ret = behaviours[key][action].apply(this, arguments);
                    if (ret) {
                        return ret;
                    }
                }
            }
        }
    }
    
}).call(Mode.prototype);

exports.Mode = Mode;
});

ace.define('ace/tokenizer', ["require", 'exports', 'module' ], function(acequire, exports, module) {
var MAX_TOKEN_COUNT = 1000;
var Tokenizer = function(rules) {
    this.states = rules;

    this.regExps = {};
    this.matchMappings = {};
    for (var key in this.states) {
        var state = this.states[key];
        var ruleRegExps = [];
        var matchTotal = 0;
        var mapping = this.matchMappings[key] = {defaultToken: "text"};
        var flag = "g";

        for (var i = 0; i < state.length; i++) {
            var rule = state[i];
            if (rule.defaultToken)
                mapping.defaultToken = rule.defaultToken;
            if (rule.caseInsensitive)
                flag = "gi";
            if (rule.regex == null)
                continue;

            if (rule.regex instanceof RegExp)
                rule.regex = rule.regex.toString().slice(1, -1);
            var adjustedregex = rule.regex;
            var matchcount = new RegExp("(?:(" + adjustedregex + ")|(.))").exec("a").length - 2;
            if (Array.isArray(rule.token)) {
                if (rule.token.length == 1 || matchcount == 1) {
                    rule.token = rule.token[0];
                } else if (matchcount - 1 != rule.token.length) {
                    throw new Error("number of classes and regexp groups in '" + 
                        rule.token + "'\n'" + rule.regex +  "' doesn't match\n"
                        + (matchcount - 1) + "!=" + rule.token.length);
                } else {
                    rule.tokenArray = rule.token;
                    rule.onMatch = this.$arrayTokens;
                }
            } else if (typeof rule.token == "function" && !rule.onMatch) {
                if (matchcount > 1)
                    rule.onMatch = this.$applyToken;
                else
                    rule.onMatch = rule.token;
            }

            if (matchcount > 1) {
                if (/\\\d/.test(rule.regex)) {
                    adjustedregex = rule.regex.replace(/\\([0-9]+)/g, function (match, digit) {
                        return "\\" + (parseInt(digit, 10) + matchTotal + 1);
                    });
                } else {
                    matchcount = 1;
                    adjustedregex = this.removeCapturingGroups(rule.regex);
                }
                if (!rule.splitRegex && typeof rule.token != "string")
                    rule.splitRegex = this.createSplitterRegexp(rule.regex, flag);
            }

            mapping[matchTotal] = i;
            matchTotal += matchcount;

            ruleRegExps.push(adjustedregex);
            if (!rule.onMatch)
                rule.onMatch = null;
            rule.__proto__ = null;
        }

        this.regExps[key] = new RegExp("(" + ruleRegExps.join(")|(") + ")|($)", flag);
    }
};

(function() {
    this.$applyToken = function(str) {
        var values = this.splitRegex.exec(str).slice(1);
        var types = this.token.apply(this, values);
        if (typeof types === "string")
            return [{type: types, value: str}];

        var tokens = [];
        for (var i = 0, l = types.length; i < l; i++) {
            if (values[i])
                tokens[tokens.length] = {
                    type: types[i],
                    value: values[i]
                };
        }
        return tokens;
    },

    this.$arrayTokens = function(str) {
        if (!str)
            return [];
        var values = this.splitRegex.exec(str);
        var tokens = [];
        var types = this.tokenArray;
        for (var i = 0, l = types.length; i < l; i++) {
            if (values[i + 1])
                tokens[tokens.length] = {
                    type: types[i],
                    value: values[i + 1]
                };
        }
        return tokens;
    };

    this.removeCapturingGroups = function(src) {
        var r = src.replace(
            /\[(?:\\.|[^\]])*?\]|\\.|\(\?[:=!]|(\()/g,
            function(x, y) {return y ? "(?:" : x;}
        );
        return r;
    };

    this.createSplitterRegexp = function(src, flag) {
        if (src.indexOf("(?=") != -1) {
            var stack = 0;
            var inChClass = false;
            var lastCapture = {};
            src.replace(/(\\.)|(\((?:\?[=!])?)|(\))|([\[\]])/g, function(
                m, esc, parenOpen, parenClose, square, index
            ) {
                if (inChClass) {
                    inChClass = square != "]";
                } else if (square) {
                    inChClass = true;
                } else if (parenClose) {
                    if (stack == lastCapture.stack) {
                        lastCapture.end = index+1;
                        lastCapture.stack = -1;
                    }
                    stack--;
                } else if (parenOpen) {
                    stack++;
                    if (parenOpen.length != 1) {
                        lastCapture.stack = stack
                        lastCapture.start = index;
                    }
                }
                return m;
            });

            if (lastCapture.end != null && /^\)*$/.test(src.substr(lastCapture.end)))
                src = src.substring(0, lastCapture.start) + src.substr(lastCapture.end);
        }
        return new RegExp(src, (flag||"").replace("g", ""));
    };
    this.getLineTokens = function(line, startState) {
        if (startState && typeof startState != "string") {
            var stack = startState.slice(0);
            startState = stack[0];
        } else
            var stack = [];

        var currentState = startState || "start";
        var state = this.states[currentState];
        var mapping = this.matchMappings[currentState];
        var re = this.regExps[currentState];
        re.lastIndex = 0;

        var match, tokens = [];
        var lastIndex = 0;

        var token = {type: null, value: ""};

        while (match = re.exec(line)) {
            var type = mapping.defaultToken;
            var rule = null;
            var value = match[0];
            var index = re.lastIndex;

            if (index - value.length > lastIndex) {
                var skipped = line.substring(lastIndex, index - value.length);
                if (token.type == type) {
                    token.value += skipped;
                } else {
                    if (token.type)
                        tokens.push(token);
                    token = {type: type, value: skipped};
                }
            }

            for (var i = 0; i < match.length-2; i++) {
                if (match[i + 1] === undefined)
                    continue;

                rule = state[mapping[i]];

                if (rule.onMatch)
                    type = rule.onMatch(value, currentState, stack);
                else
                    type = rule.token;

                if (rule.next) {
                    if (typeof rule.next == "string")
                        currentState = rule.next;
                    else
                        currentState = rule.next(currentState, stack);

                    state = this.states[currentState];
                    if (!state) {
                        window.console && console.error && console.error(currentState, "doesn't exist");
                        currentState = "start";
                        state = this.states[currentState];
                    }
                    mapping = this.matchMappings[currentState];
                    lastIndex = index;
                    re = this.regExps[currentState];
                    re.lastIndex = index;
                }
                break;
            }

            if (value) {
                if (typeof type == "string") {
                    if ((!rule || rule.merge !== false) && token.type === type) {
                        token.value += value;
                    } else {
                        if (token.type)
                            tokens.push(token);
                        token = {type: type, value: value};
                    }
                } else if (type) {
                    if (token.type)
                        tokens.push(token);
                    token = {type: null, value: ""};
                    for (var i = 0; i < type.length; i++)
                        tokens.push(type[i]);
                }
            }

            if (lastIndex == line.length)
                break;

            lastIndex = index;

            if (tokens.length > MAX_TOKEN_COUNT) {
                token.value += line.substr(lastIndex);
                currentState = "start"
                break;
            }
        }

        if (token.type)
            tokens.push(token);

        return {
            tokens : tokens,
            state : stack.length ? stack : currentState
        };
    };

}).call(Tokenizer.prototype);

exports.Tokenizer = Tokenizer;
});

ace.define('ace/mode/text_highlight_rules', ["require", 'exports', 'module' , 'ace/lib/lang'], function(acequire, exports, module) {


var lang = acequire("../lib/lang");

var TextHighlightRules = function() {

    this.$rules = {
        "start" : [{
            token : "empty_line",
            regex : '^$'
        }, {
            defaultToken : "text"
        }]
    };
};

(function() {

    this.addRules = function(rules, prefix) {
        for (var key in rules) {
            var state = rules[key];
            for (var i = 0; i < state.length; i++) {
                var rule = state[i];
                if (rule.next) {
                    rule.next = prefix + rule.next;
                }
            }
            this.$rules[prefix + key] = state;
        }
    };

    this.getRules = function() {
        return this.$rules;
    };

    this.embedRules = function (HighlightRules, prefix, escapeRules, states, append) {
        var embedRules = new HighlightRules().getRules();
        if (states) {
            for (var i = 0; i < states.length; i++)
                states[i] = prefix + states[i];
        } else {
            states = [];
            for (var key in embedRules)
                states.push(prefix + key);
        }

        this.addRules(embedRules, prefix);

        if (escapeRules) {
            var addRules = Array.prototype[append ? "push" : "unshift"];
            for (var i = 0; i < states.length; i++)
                addRules.apply(this.$rules[states[i]], lang.deepCopy(escapeRules));
        }

        if (!this.$embeds)
            this.$embeds = [];
        this.$embeds.push(prefix);
    }

    this.getEmbeds = function() {
        return this.$embeds;
    };

    var pushState = function(currentState, stack) {
        if (currentState != "start")
            stack.unshift(this.nextState, currentState);
        return this.nextState;
    };
    var popState = function(currentState, stack) {
        if (stack[0] !== currentState)
            return "start";
        stack.shift();
        return stack.shift();
    };

    this.normalizeRules = function() {
        var id = 0;
        var rules = this.$rules;
        function processState(key) {
            var state = rules[key];
            state.processed = true;
            for (var i = 0; i < state.length; i++) {
                var rule = state[i];
                if (!rule.regex && rule.start) {
                    rule.regex = rule.start;
                    if (!rule.next)
                        rule.next = [];
                    rule.next.push({
                        defaultToken: rule.token
                    }, {
                        token: rule.token + ".end",
                        regex: rule.end || rule.start,
                        next: "pop"
                    });
                    rule.token = rule.token + ".start";
                    rule.push = true;
                }
                var next = rule.next || rule.push;
                if (next && Array.isArray(next)) {
                    var stateName = rule.stateName || (rule.token + id++);
                    rules[stateName] = next;
                    rule.next = stateName;
                    processState(stateName);
                } else if (next == "pop") {
                    rule.next = popState;
                }

                if (rule.push) {
                    rule.nextState = rule.next || rule.push;
                    rule.next = pushState;
                    delete rule.push;
                }

                if (rule.rules) {
                    for (var r in rule.rules) {
                        if (rules[r]) {
                            if (rules[r].push)
                                rules[r].push.apply(rules[r], rule.rules[r]);
                        } else {
                            rules[r] = rule.rules[r];
                        }
                    }
                }
                if (rule.include || typeof rule == "string") {
                    var includeName = rule.include || rule;
                    var toInsert = rules[includeName];
                } else if (Array.isArray(rule))
                    toInsert = rule;

                if (toInsert) {
                    var args = [i, 1].concat(toInsert);
                    if (rule.noEscape)
                        args = args.filter(function(x) {return !x.next;});
                    state.splice.apply(state, args);
                    i--;
                    toInsert = null
                }
            }
        };
        Object.keys(rules).forEach(processState);
    };

    this.createKeywordMapper = function(map, defaultToken, ignoreCase, splitChar) {
        var keywords = Object.create(null);
        Object.keys(map).forEach(function(className) {
            var a = map[className];
            if (ignoreCase)
                a = a.toLowerCase();
            var list = a.split(splitChar || "|");
            for (var i = list.length; i--; )
                keywords[list[i]] = className;
        });
        map = null;
        return ignoreCase
            ? function(value) {return keywords[value.toLowerCase()] || defaultToken }
            : function(value) {return keywords[value] || defaultToken };
    }

    this.getKeywords = function() {
        return this.$keywords;
    };

}).call(TextHighlightRules.prototype);

exports.TextHighlightRules = TextHighlightRules;
});

ace.define('ace/mode/behaviour', ["require", 'exports', 'module' ], function(acequire, exports, module) {


var Behaviour = function() {
   this.$behaviours = {};
};

(function () {

    this.add = function (name, action, callback) {
        switch (undefined) {
          case this.$behaviours:
              this.$behaviours = {};
          case this.$behaviours[name]:
              this.$behaviours[name] = {};
        }
        this.$behaviours[name][action] = callback;
    }
    
    this.addBehaviours = function (behaviours) {
        for (var key in behaviours) {
            for (var action in behaviours[key]) {
                this.add(key, action, behaviours[key][action]);
            }
        }
    }
    
    this.remove = function (name) {
        if (this.$behaviours && this.$behaviours[name]) {
            delete this.$behaviours[name];
        }
    }
    
    this.inherit = function (mode, filter) {
        if (typeof mode === "function") {
            var behaviours = new mode().getBehaviours(filter);
        } else {
            var behaviours = mode.getBehaviours(filter);
        }
        this.addBehaviours(behaviours);
    }
    
    this.getBehaviours = function (filter) {
        if (!filter) {
            return this.$behaviours;
        } else {
            var ret = {}
            for (var i = 0; i < filter.length; i++) {
                if (this.$behaviours[filter[i]]) {
                    ret[filter[i]] = this.$behaviours[filter[i]];
                }
            }
            return ret;
        }
    }

}).call(Behaviour.prototype);

exports.Behaviour = Behaviour;
});
ace.define('ace/unicode', ["require", 'exports', 'module' ], function(acequire, exports, module) {
exports.packages = {};

addUnicodePackage({
    L:  "0041-005A0061-007A00AA00B500BA00C0-00D600D8-00F600F8-02C102C6-02D102E0-02E402EC02EE0370-037403760377037A-037D03860388-038A038C038E-03A103A3-03F503F7-0481048A-05250531-055605590561-058705D0-05EA05F0-05F20621-064A066E066F0671-06D306D506E506E606EE06EF06FA-06FC06FF07100712-072F074D-07A507B107CA-07EA07F407F507FA0800-0815081A082408280904-0939093D09500958-0961097109720979-097F0985-098C098F09900993-09A809AA-09B009B209B6-09B909BD09CE09DC09DD09DF-09E109F009F10A05-0A0A0A0F0A100A13-0A280A2A-0A300A320A330A350A360A380A390A59-0A5C0A5E0A72-0A740A85-0A8D0A8F-0A910A93-0AA80AAA-0AB00AB20AB30AB5-0AB90ABD0AD00AE00AE10B05-0B0C0B0F0B100B13-0B280B2A-0B300B320B330B35-0B390B3D0B5C0B5D0B5F-0B610B710B830B85-0B8A0B8E-0B900B92-0B950B990B9A0B9C0B9E0B9F0BA30BA40BA8-0BAA0BAE-0BB90BD00C05-0C0C0C0E-0C100C12-0C280C2A-0C330C35-0C390C3D0C580C590C600C610C85-0C8C0C8E-0C900C92-0CA80CAA-0CB30CB5-0CB90CBD0CDE0CE00CE10D05-0D0C0D0E-0D100D12-0D280D2A-0D390D3D0D600D610D7A-0D7F0D85-0D960D9A-0DB10DB3-0DBB0DBD0DC0-0DC60E01-0E300E320E330E40-0E460E810E820E840E870E880E8A0E8D0E94-0E970E99-0E9F0EA1-0EA30EA50EA70EAA0EAB0EAD-0EB00EB20EB30EBD0EC0-0EC40EC60EDC0EDD0F000F40-0F470F49-0F6C0F88-0F8B1000-102A103F1050-1055105A-105D106110651066106E-10701075-1081108E10A0-10C510D0-10FA10FC1100-1248124A-124D1250-12561258125A-125D1260-1288128A-128D1290-12B012B2-12B512B8-12BE12C012C2-12C512C8-12D612D8-13101312-13151318-135A1380-138F13A0-13F41401-166C166F-167F1681-169A16A0-16EA1700-170C170E-17111720-17311740-17511760-176C176E-17701780-17B317D717DC1820-18771880-18A818AA18B0-18F51900-191C1950-196D1970-19741980-19AB19C1-19C71A00-1A161A20-1A541AA71B05-1B331B45-1B4B1B83-1BA01BAE1BAF1C00-1C231C4D-1C4F1C5A-1C7D1CE9-1CEC1CEE-1CF11D00-1DBF1E00-1F151F18-1F1D1F20-1F451F48-1F4D1F50-1F571F591F5B1F5D1F5F-1F7D1F80-1FB41FB6-1FBC1FBE1FC2-1FC41FC6-1FCC1FD0-1FD31FD6-1FDB1FE0-1FEC1FF2-1FF41FF6-1FFC2071207F2090-209421022107210A-211321152119-211D212421262128212A-212D212F-2139213C-213F2145-2149214E218321842C00-2C2E2C30-2C5E2C60-2CE42CEB-2CEE2D00-2D252D30-2D652D6F2D80-2D962DA0-2DA62DA8-2DAE2DB0-2DB62DB8-2DBE2DC0-2DC62DC8-2DCE2DD0-2DD62DD8-2DDE2E2F300530063031-3035303B303C3041-3096309D-309F30A1-30FA30FC-30FF3105-312D3131-318E31A0-31B731F0-31FF3400-4DB54E00-9FCBA000-A48CA4D0-A4FDA500-A60CA610-A61FA62AA62BA640-A65FA662-A66EA67F-A697A6A0-A6E5A717-A71FA722-A788A78BA78CA7FB-A801A803-A805A807-A80AA80C-A822A840-A873A882-A8B3A8F2-A8F7A8FBA90A-A925A930-A946A960-A97CA984-A9B2A9CFAA00-AA28AA40-AA42AA44-AA4BAA60-AA76AA7AAA80-AAAFAAB1AAB5AAB6AAB9-AABDAAC0AAC2AADB-AADDABC0-ABE2AC00-D7A3D7B0-D7C6D7CB-D7FBF900-FA2DFA30-FA6DFA70-FAD9FB00-FB06FB13-FB17FB1DFB1F-FB28FB2A-FB36FB38-FB3CFB3EFB40FB41FB43FB44FB46-FBB1FBD3-FD3DFD50-FD8FFD92-FDC7FDF0-FDFBFE70-FE74FE76-FEFCFF21-FF3AFF41-FF5AFF66-FFBEFFC2-FFC7FFCA-FFCFFFD2-FFD7FFDA-FFDC",
    Ll: "0061-007A00AA00B500BA00DF-00F600F8-00FF01010103010501070109010B010D010F01110113011501170119011B011D011F01210123012501270129012B012D012F01310133013501370138013A013C013E014001420144014601480149014B014D014F01510153015501570159015B015D015F01610163016501670169016B016D016F0171017301750177017A017C017E-0180018301850188018C018D019201950199-019B019E01A101A301A501A801AA01AB01AD01B001B401B601B901BA01BD-01BF01C601C901CC01CE01D001D201D401D601D801DA01DC01DD01DF01E101E301E501E701E901EB01ED01EF01F001F301F501F901FB01FD01FF02010203020502070209020B020D020F02110213021502170219021B021D021F02210223022502270229022B022D022F02310233-0239023C023F0240024202470249024B024D024F-02930295-02AF037103730377037B-037D039003AC-03CE03D003D103D5-03D703D903DB03DD03DF03E103E303E503E703E903EB03ED03EF-03F303F503F803FB03FC0430-045F04610463046504670469046B046D046F04710473047504770479047B047D047F0481048B048D048F04910493049504970499049B049D049F04A104A304A504A704A904AB04AD04AF04B104B304B504B704B904BB04BD04BF04C204C404C604C804CA04CC04CE04CF04D104D304D504D704D904DB04DD04DF04E104E304E504E704E904EB04ED04EF04F104F304F504F704F904FB04FD04FF05010503050505070509050B050D050F05110513051505170519051B051D051F0521052305250561-05871D00-1D2B1D62-1D771D79-1D9A1E011E031E051E071E091E0B1E0D1E0F1E111E131E151E171E191E1B1E1D1E1F1E211E231E251E271E291E2B1E2D1E2F1E311E331E351E371E391E3B1E3D1E3F1E411E431E451E471E491E4B1E4D1E4F1E511E531E551E571E591E5B1E5D1E5F1E611E631E651E671E691E6B1E6D1E6F1E711E731E751E771E791E7B1E7D1E7F1E811E831E851E871E891E8B1E8D1E8F1E911E931E95-1E9D1E9F1EA11EA31EA51EA71EA91EAB1EAD1EAF1EB11EB31EB51EB71EB91EBB1EBD1EBF1EC11EC31EC51EC71EC91ECB1ECD1ECF1ED11ED31ED51ED71ED91EDB1EDD1EDF1EE11EE31EE51EE71EE91EEB1EED1EEF1EF11EF31EF51EF71EF91EFB1EFD1EFF-1F071F10-1F151F20-1F271F30-1F371F40-1F451F50-1F571F60-1F671F70-1F7D1F80-1F871F90-1F971FA0-1FA71FB0-1FB41FB61FB71FBE1FC2-1FC41FC61FC71FD0-1FD31FD61FD71FE0-1FE71FF2-1FF41FF61FF7210A210E210F2113212F21342139213C213D2146-2149214E21842C30-2C5E2C612C652C662C682C6A2C6C2C712C732C742C76-2C7C2C812C832C852C872C892C8B2C8D2C8F2C912C932C952C972C992C9B2C9D2C9F2CA12CA32CA52CA72CA92CAB2CAD2CAF2CB12CB32CB52CB72CB92CBB2CBD2CBF2CC12CC32CC52CC72CC92CCB2CCD2CCF2CD12CD32CD52CD72CD92CDB2CDD2CDF2CE12CE32CE42CEC2CEE2D00-2D25A641A643A645A647A649A64BA64DA64FA651A653A655A657A659A65BA65DA65FA663A665A667A669A66BA66DA681A683A685A687A689A68BA68DA68FA691A693A695A697A723A725A727A729A72BA72DA72F-A731A733A735A737A739A73BA73DA73FA741A743A745A747A749A74BA74DA74FA751A753A755A757A759A75BA75DA75FA761A763A765A767A769A76BA76DA76FA771-A778A77AA77CA77FA781A783A785A787A78CFB00-FB06FB13-FB17FF41-FF5A",
    Lu: "0041-005A00C0-00D600D8-00DE01000102010401060108010A010C010E01100112011401160118011A011C011E01200122012401260128012A012C012E01300132013401360139013B013D013F0141014301450147014A014C014E01500152015401560158015A015C015E01600162016401660168016A016C016E017001720174017601780179017B017D018101820184018601870189-018B018E-0191019301940196-0198019C019D019F01A001A201A401A601A701A901AC01AE01AF01B1-01B301B501B701B801BC01C401C701CA01CD01CF01D101D301D501D701D901DB01DE01E001E201E401E601E801EA01EC01EE01F101F401F6-01F801FA01FC01FE02000202020402060208020A020C020E02100212021402160218021A021C021E02200222022402260228022A022C022E02300232023A023B023D023E02410243-02460248024A024C024E03700372037603860388-038A038C038E038F0391-03A103A3-03AB03CF03D2-03D403D803DA03DC03DE03E003E203E403E603E803EA03EC03EE03F403F703F903FA03FD-042F04600462046404660468046A046C046E04700472047404760478047A047C047E0480048A048C048E04900492049404960498049A049C049E04A004A204A404A604A804AA04AC04AE04B004B204B404B604B804BA04BC04BE04C004C104C304C504C704C904CB04CD04D004D204D404D604D804DA04DC04DE04E004E204E404E604E804EA04EC04EE04F004F204F404F604F804FA04FC04FE05000502050405060508050A050C050E05100512051405160518051A051C051E0520052205240531-055610A0-10C51E001E021E041E061E081E0A1E0C1E0E1E101E121E141E161E181E1A1E1C1E1E1E201E221E241E261E281E2A1E2C1E2E1E301E321E341E361E381E3A1E3C1E3E1E401E421E441E461E481E4A1E4C1E4E1E501E521E541E561E581E5A1E5C1E5E1E601E621E641E661E681E6A1E6C1E6E1E701E721E741E761E781E7A1E7C1E7E1E801E821E841E861E881E8A1E8C1E8E1E901E921E941E9E1EA01EA21EA41EA61EA81EAA1EAC1EAE1EB01EB21EB41EB61EB81EBA1EBC1EBE1EC01EC21EC41EC61EC81ECA1ECC1ECE1ED01ED21ED41ED61ED81EDA1EDC1EDE1EE01EE21EE41EE61EE81EEA1EEC1EEE1EF01EF21EF41EF61EF81EFA1EFC1EFE1F08-1F0F1F18-1F1D1F28-1F2F1F38-1F3F1F48-1F4D1F591F5B1F5D1F5F1F68-1F6F1FB8-1FBB1FC8-1FCB1FD8-1FDB1FE8-1FEC1FF8-1FFB21022107210B-210D2110-211221152119-211D212421262128212A-212D2130-2133213E213F214521832C00-2C2E2C602C62-2C642C672C692C6B2C6D-2C702C722C752C7E-2C802C822C842C862C882C8A2C8C2C8E2C902C922C942C962C982C9A2C9C2C9E2CA02CA22CA42CA62CA82CAA2CAC2CAE2CB02CB22CB42CB62CB82CBA2CBC2CBE2CC02CC22CC42CC62CC82CCA2CCC2CCE2CD02CD22CD42CD62CD82CDA2CDC2CDE2CE02CE22CEB2CEDA640A642A644A646A648A64AA64CA64EA650A652A654A656A658A65AA65CA65EA662A664A666A668A66AA66CA680A682A684A686A688A68AA68CA68EA690A692A694A696A722A724A726A728A72AA72CA72EA732A734A736A738A73AA73CA73EA740A742A744A746A748A74AA74CA74EA750A752A754A756A758A75AA75CA75EA760A762A764A766A768A76AA76CA76EA779A77BA77DA77EA780A782A784A786A78BFF21-FF3A",
    Lt: "01C501C801CB01F21F88-1F8F1F98-1F9F1FA8-1FAF1FBC1FCC1FFC",
    Lm: "02B0-02C102C6-02D102E0-02E402EC02EE0374037A0559064006E506E607F407F507FA081A0824082809710E460EC610FC17D718431AA71C78-1C7D1D2C-1D611D781D9B-1DBF2071207F2090-20942C7D2D6F2E2F30053031-3035303B309D309E30FC-30FEA015A4F8-A4FDA60CA67FA717-A71FA770A788A9CFAA70AADDFF70FF9EFF9F",
    Lo: "01BB01C0-01C3029405D0-05EA05F0-05F20621-063F0641-064A066E066F0671-06D306D506EE06EF06FA-06FC06FF07100712-072F074D-07A507B107CA-07EA0800-08150904-0939093D09500958-096109720979-097F0985-098C098F09900993-09A809AA-09B009B209B6-09B909BD09CE09DC09DD09DF-09E109F009F10A05-0A0A0A0F0A100A13-0A280A2A-0A300A320A330A350A360A380A390A59-0A5C0A5E0A72-0A740A85-0A8D0A8F-0A910A93-0AA80AAA-0AB00AB20AB30AB5-0AB90ABD0AD00AE00AE10B05-0B0C0B0F0B100B13-0B280B2A-0B300B320B330B35-0B390B3D0B5C0B5D0B5F-0B610B710B830B85-0B8A0B8E-0B900B92-0B950B990B9A0B9C0B9E0B9F0BA30BA40BA8-0BAA0BAE-0BB90BD00C05-0C0C0C0E-0C100C12-0C280C2A-0C330C35-0C390C3D0C580C590C600C610C85-0C8C0C8E-0C900C92-0CA80CAA-0CB30CB5-0CB90CBD0CDE0CE00CE10D05-0D0C0D0E-0D100D12-0D280D2A-0D390D3D0D600D610D7A-0D7F0D85-0D960D9A-0DB10DB3-0DBB0DBD0DC0-0DC60E01-0E300E320E330E40-0E450E810E820E840E870E880E8A0E8D0E94-0E970E99-0E9F0EA1-0EA30EA50EA70EAA0EAB0EAD-0EB00EB20EB30EBD0EC0-0EC40EDC0EDD0F000F40-0F470F49-0F6C0F88-0F8B1000-102A103F1050-1055105A-105D106110651066106E-10701075-1081108E10D0-10FA1100-1248124A-124D1250-12561258125A-125D1260-1288128A-128D1290-12B012B2-12B512B8-12BE12C012C2-12C512C8-12D612D8-13101312-13151318-135A1380-138F13A0-13F41401-166C166F-167F1681-169A16A0-16EA1700-170C170E-17111720-17311740-17511760-176C176E-17701780-17B317DC1820-18421844-18771880-18A818AA18B0-18F51900-191C1950-196D1970-19741980-19AB19C1-19C71A00-1A161A20-1A541B05-1B331B45-1B4B1B83-1BA01BAE1BAF1C00-1C231C4D-1C4F1C5A-1C771CE9-1CEC1CEE-1CF12135-21382D30-2D652D80-2D962DA0-2DA62DA8-2DAE2DB0-2DB62DB8-2DBE2DC0-2DC62DC8-2DCE2DD0-2DD62DD8-2DDE3006303C3041-3096309F30A1-30FA30FF3105-312D3131-318E31A0-31B731F0-31FF3400-4DB54E00-9FCBA000-A014A016-A48CA4D0-A4F7A500-A60BA610-A61FA62AA62BA66EA6A0-A6E5A7FB-A801A803-A805A807-A80AA80C-A822A840-A873A882-A8B3A8F2-A8F7A8FBA90A-A925A930-A946A960-A97CA984-A9B2AA00-AA28AA40-AA42AA44-AA4BAA60-AA6FAA71-AA76AA7AAA80-AAAFAAB1AAB5AAB6AAB9-AABDAAC0AAC2AADBAADCABC0-ABE2AC00-D7A3D7B0-D7C6D7CB-D7FBF900-FA2DFA30-FA6DFA70-FAD9FB1DFB1F-FB28FB2A-FB36FB38-FB3CFB3EFB40FB41FB43FB44FB46-FBB1FBD3-FD3DFD50-FD8FFD92-FDC7FDF0-FDFBFE70-FE74FE76-FEFCFF66-FF6FFF71-FF9DFFA0-FFBEFFC2-FFC7FFCA-FFCFFFD2-FFD7FFDA-FFDC",
    M:  "0300-036F0483-04890591-05BD05BF05C105C205C405C505C70610-061A064B-065E067006D6-06DC06DE-06E406E706E806EA-06ED07110730-074A07A6-07B007EB-07F30816-0819081B-08230825-08270829-082D0900-0903093C093E-094E0951-0955096209630981-098309BC09BE-09C409C709C809CB-09CD09D709E209E30A01-0A030A3C0A3E-0A420A470A480A4B-0A4D0A510A700A710A750A81-0A830ABC0ABE-0AC50AC7-0AC90ACB-0ACD0AE20AE30B01-0B030B3C0B3E-0B440B470B480B4B-0B4D0B560B570B620B630B820BBE-0BC20BC6-0BC80BCA-0BCD0BD70C01-0C030C3E-0C440C46-0C480C4A-0C4D0C550C560C620C630C820C830CBC0CBE-0CC40CC6-0CC80CCA-0CCD0CD50CD60CE20CE30D020D030D3E-0D440D46-0D480D4A-0D4D0D570D620D630D820D830DCA0DCF-0DD40DD60DD8-0DDF0DF20DF30E310E34-0E3A0E47-0E4E0EB10EB4-0EB90EBB0EBC0EC8-0ECD0F180F190F350F370F390F3E0F3F0F71-0F840F860F870F90-0F970F99-0FBC0FC6102B-103E1056-1059105E-10601062-10641067-106D1071-10741082-108D108F109A-109D135F1712-17141732-1734175217531772177317B6-17D317DD180B-180D18A91920-192B1930-193B19B0-19C019C819C91A17-1A1B1A55-1A5E1A60-1A7C1A7F1B00-1B041B34-1B441B6B-1B731B80-1B821BA1-1BAA1C24-1C371CD0-1CD21CD4-1CE81CED1CF21DC0-1DE61DFD-1DFF20D0-20F02CEF-2CF12DE0-2DFF302A-302F3099309AA66F-A672A67CA67DA6F0A6F1A802A806A80BA823-A827A880A881A8B4-A8C4A8E0-A8F1A926-A92DA947-A953A980-A983A9B3-A9C0AA29-AA36AA43AA4CAA4DAA7BAAB0AAB2-AAB4AAB7AAB8AABEAABFAAC1ABE3-ABEAABECABEDFB1EFE00-FE0FFE20-FE26",
    Mn: "0300-036F0483-04870591-05BD05BF05C105C205C405C505C70610-061A064B-065E067006D6-06DC06DF-06E406E706E806EA-06ED07110730-074A07A6-07B007EB-07F30816-0819081B-08230825-08270829-082D0900-0902093C0941-0948094D0951-095509620963098109BC09C1-09C409CD09E209E30A010A020A3C0A410A420A470A480A4B-0A4D0A510A700A710A750A810A820ABC0AC1-0AC50AC70AC80ACD0AE20AE30B010B3C0B3F0B41-0B440B4D0B560B620B630B820BC00BCD0C3E-0C400C46-0C480C4A-0C4D0C550C560C620C630CBC0CBF0CC60CCC0CCD0CE20CE30D41-0D440D4D0D620D630DCA0DD2-0DD40DD60E310E34-0E3A0E47-0E4E0EB10EB4-0EB90EBB0EBC0EC8-0ECD0F180F190F350F370F390F71-0F7E0F80-0F840F860F870F90-0F970F99-0FBC0FC6102D-10301032-10371039103A103D103E10581059105E-10601071-1074108210851086108D109D135F1712-17141732-1734175217531772177317B7-17BD17C617C9-17D317DD180B-180D18A91920-19221927192819321939-193B1A171A181A561A58-1A5E1A601A621A65-1A6C1A73-1A7C1A7F1B00-1B031B341B36-1B3A1B3C1B421B6B-1B731B801B811BA2-1BA51BA81BA91C2C-1C331C361C371CD0-1CD21CD4-1CE01CE2-1CE81CED1DC0-1DE61DFD-1DFF20D0-20DC20E120E5-20F02CEF-2CF12DE0-2DFF302A-302F3099309AA66FA67CA67DA6F0A6F1A802A806A80BA825A826A8C4A8E0-A8F1A926-A92DA947-A951A980-A982A9B3A9B6-A9B9A9BCAA29-AA2EAA31AA32AA35AA36AA43AA4CAAB0AAB2-AAB4AAB7AAB8AABEAABFAAC1ABE5ABE8ABEDFB1EFE00-FE0FFE20-FE26",
    Mc: "0903093E-09400949-094C094E0982098309BE-09C009C709C809CB09CC09D70A030A3E-0A400A830ABE-0AC00AC90ACB0ACC0B020B030B3E0B400B470B480B4B0B4C0B570BBE0BBF0BC10BC20BC6-0BC80BCA-0BCC0BD70C01-0C030C41-0C440C820C830CBE0CC0-0CC40CC70CC80CCA0CCB0CD50CD60D020D030D3E-0D400D46-0D480D4A-0D4C0D570D820D830DCF-0DD10DD8-0DDF0DF20DF30F3E0F3F0F7F102B102C10311038103B103C105610571062-10641067-106D108310841087-108C108F109A-109C17B617BE-17C517C717C81923-19261929-192B193019311933-193819B0-19C019C819C91A19-1A1B1A551A571A611A631A641A6D-1A721B041B351B3B1B3D-1B411B431B441B821BA11BA61BA71BAA1C24-1C2B1C341C351CE11CF2A823A824A827A880A881A8B4-A8C3A952A953A983A9B4A9B5A9BAA9BBA9BD-A9C0AA2FAA30AA33AA34AA4DAA7BABE3ABE4ABE6ABE7ABE9ABEAABEC",
    Me: "0488048906DE20DD-20E020E2-20E4A670-A672",
    N:  "0030-003900B200B300B900BC-00BE0660-066906F0-06F907C0-07C90966-096F09E6-09EF09F4-09F90A66-0A6F0AE6-0AEF0B66-0B6F0BE6-0BF20C66-0C6F0C78-0C7E0CE6-0CEF0D66-0D750E50-0E590ED0-0ED90F20-0F331040-10491090-10991369-137C16EE-16F017E0-17E917F0-17F91810-18191946-194F19D0-19DA1A80-1A891A90-1A991B50-1B591BB0-1BB91C40-1C491C50-1C5920702074-20792080-20892150-21822185-21892460-249B24EA-24FF2776-27932CFD30073021-30293038-303A3192-31953220-32293251-325F3280-328932B1-32BFA620-A629A6E6-A6EFA830-A835A8D0-A8D9A900-A909A9D0-A9D9AA50-AA59ABF0-ABF9FF10-FF19",
    Nd: "0030-00390660-066906F0-06F907C0-07C90966-096F09E6-09EF0A66-0A6F0AE6-0AEF0B66-0B6F0BE6-0BEF0C66-0C6F0CE6-0CEF0D66-0D6F0E50-0E590ED0-0ED90F20-0F291040-10491090-109917E0-17E91810-18191946-194F19D0-19DA1A80-1A891A90-1A991B50-1B591BB0-1BB91C40-1C491C50-1C59A620-A629A8D0-A8D9A900-A909A9D0-A9D9AA50-AA59ABF0-ABF9FF10-FF19",
    Nl: "16EE-16F02160-21822185-218830073021-30293038-303AA6E6-A6EF",
    No: "00B200B300B900BC-00BE09F4-09F90BF0-0BF20C78-0C7E0D70-0D750F2A-0F331369-137C17F0-17F920702074-20792080-20892150-215F21892460-249B24EA-24FF2776-27932CFD3192-31953220-32293251-325F3280-328932B1-32BFA830-A835",
    P:  "0021-00230025-002A002C-002F003A003B003F0040005B-005D005F007B007D00A100AB00B700BB00BF037E0387055A-055F0589058A05BE05C005C305C605F305F40609060A060C060D061B061E061F066A-066D06D40700-070D07F7-07F90830-083E0964096509700DF40E4F0E5A0E5B0F04-0F120F3A-0F3D0F850FD0-0FD4104A-104F10FB1361-13681400166D166E169B169C16EB-16ED1735173617D4-17D617D8-17DA1800-180A1944194519DE19DF1A1E1A1F1AA0-1AA61AA8-1AAD1B5A-1B601C3B-1C3F1C7E1C7F1CD32010-20272030-20432045-20512053-205E207D207E208D208E2329232A2768-277527C527C627E6-27EF2983-299829D8-29DB29FC29FD2CF9-2CFC2CFE2CFF2E00-2E2E2E302E313001-30033008-30113014-301F3030303D30A030FBA4FEA4FFA60D-A60FA673A67EA6F2-A6F7A874-A877A8CEA8CFA8F8-A8FAA92EA92FA95FA9C1-A9CDA9DEA9DFAA5C-AA5FAADEAADFABEBFD3EFD3FFE10-FE19FE30-FE52FE54-FE61FE63FE68FE6AFE6BFF01-FF03FF05-FF0AFF0C-FF0FFF1AFF1BFF1FFF20FF3B-FF3DFF3FFF5BFF5DFF5F-FF65",
    Pd: "002D058A05BE140018062010-20152E172E1A301C303030A0FE31FE32FE58FE63FF0D",
    Ps: "0028005B007B0F3A0F3C169B201A201E2045207D208D23292768276A276C276E27702772277427C527E627E827EA27EC27EE2983298529872989298B298D298F299129932995299729D829DA29FC2E222E242E262E283008300A300C300E3010301430163018301A301DFD3EFE17FE35FE37FE39FE3BFE3DFE3FFE41FE43FE47FE59FE5BFE5DFF08FF3BFF5BFF5FFF62",
    Pe: "0029005D007D0F3B0F3D169C2046207E208E232A2769276B276D276F27712773277527C627E727E927EB27ED27EF298429862988298A298C298E2990299229942996299829D929DB29FD2E232E252E272E293009300B300D300F3011301530173019301B301E301FFD3FFE18FE36FE38FE3AFE3CFE3EFE40FE42FE44FE48FE5AFE5CFE5EFF09FF3DFF5DFF60FF63",
    Pi: "00AB2018201B201C201F20392E022E042E092E0C2E1C2E20",
    Pf: "00BB2019201D203A2E032E052E0A2E0D2E1D2E21",
    Pc: "005F203F20402054FE33FE34FE4D-FE4FFF3F",
    Po: "0021-00230025-0027002A002C002E002F003A003B003F0040005C00A100B700BF037E0387055A-055F058905C005C305C605F305F40609060A060C060D061B061E061F066A-066D06D40700-070D07F7-07F90830-083E0964096509700DF40E4F0E5A0E5B0F04-0F120F850FD0-0FD4104A-104F10FB1361-1368166D166E16EB-16ED1735173617D4-17D617D8-17DA1800-18051807-180A1944194519DE19DF1A1E1A1F1AA0-1AA61AA8-1AAD1B5A-1B601C3B-1C3F1C7E1C7F1CD3201620172020-20272030-2038203B-203E2041-20432047-205120532055-205E2CF9-2CFC2CFE2CFF2E002E012E06-2E082E0B2E0E-2E162E182E192E1B2E1E2E1F2E2A-2E2E2E302E313001-3003303D30FBA4FEA4FFA60D-A60FA673A67EA6F2-A6F7A874-A877A8CEA8CFA8F8-A8FAA92EA92FA95FA9C1-A9CDA9DEA9DFAA5C-AA5FAADEAADFABEBFE10-FE16FE19FE30FE45FE46FE49-FE4CFE50-FE52FE54-FE57FE5F-FE61FE68FE6AFE6BFF01-FF03FF05-FF07FF0AFF0CFF0EFF0FFF1AFF1BFF1FFF20FF3CFF61FF64FF65",
    S:  "0024002B003C-003E005E0060007C007E00A2-00A900AC00AE-00B100B400B600B800D700F702C2-02C502D2-02DF02E5-02EB02ED02EF-02FF03750384038503F604820606-0608060B060E060F06E906FD06FE07F609F209F309FA09FB0AF10B700BF3-0BFA0C7F0CF10CF20D790E3F0F01-0F030F13-0F170F1A-0F1F0F340F360F380FBE-0FC50FC7-0FCC0FCE0FCF0FD5-0FD8109E109F13601390-139917DB194019E0-19FF1B61-1B6A1B74-1B7C1FBD1FBF-1FC11FCD-1FCF1FDD-1FDF1FED-1FEF1FFD1FFE20442052207A-207C208A-208C20A0-20B8210021012103-21062108210921142116-2118211E-2123212521272129212E213A213B2140-2144214A-214D214F2190-2328232B-23E82400-24262440-244A249C-24E92500-26CD26CF-26E126E326E8-26FF2701-27042706-2709270C-27272729-274B274D274F-27522756-275E2761-276727942798-27AF27B1-27BE27C0-27C427C7-27CA27CC27D0-27E527F0-29822999-29D729DC-29FB29FE-2B4C2B50-2B592CE5-2CEA2E80-2E992E9B-2EF32F00-2FD52FF0-2FFB300430123013302030363037303E303F309B309C319031913196-319F31C0-31E33200-321E322A-32503260-327F328A-32B032C0-32FE3300-33FF4DC0-4DFFA490-A4C6A700-A716A720A721A789A78AA828-A82BA836-A839AA77-AA79FB29FDFCFDFDFE62FE64-FE66FE69FF04FF0BFF1C-FF1EFF3EFF40FF5CFF5EFFE0-FFE6FFE8-FFEEFFFCFFFD",
    Sm: "002B003C-003E007C007E00AC00B100D700F703F60606-060820442052207A-207C208A-208C2140-2144214B2190-2194219A219B21A021A321A621AE21CE21CF21D221D421F4-22FF2308-230B23202321237C239B-23B323DC-23E125B725C125F8-25FF266F27C0-27C427C7-27CA27CC27D0-27E527F0-27FF2900-29822999-29D729DC-29FB29FE-2AFF2B30-2B442B47-2B4CFB29FE62FE64-FE66FF0BFF1C-FF1EFF5CFF5EFFE2FFE9-FFEC",
    Sc: "002400A2-00A5060B09F209F309FB0AF10BF90E3F17DB20A0-20B8A838FDFCFE69FF04FFE0FFE1FFE5FFE6",
    Sk: "005E006000A800AF00B400B802C2-02C502D2-02DF02E5-02EB02ED02EF-02FF0375038403851FBD1FBF-1FC11FCD-1FCF1FDD-1FDF1FED-1FEF1FFD1FFE309B309CA700-A716A720A721A789A78AFF3EFF40FFE3",
    So: "00A600A700A900AE00B000B60482060E060F06E906FD06FE07F609FA0B700BF3-0BF80BFA0C7F0CF10CF20D790F01-0F030F13-0F170F1A-0F1F0F340F360F380FBE-0FC50FC7-0FCC0FCE0FCF0FD5-0FD8109E109F13601390-1399194019E0-19FF1B61-1B6A1B74-1B7C210021012103-21062108210921142116-2118211E-2123212521272129212E213A213B214A214C214D214F2195-2199219C-219F21A121A221A421A521A7-21AD21AF-21CD21D021D121D321D5-21F32300-2307230C-231F2322-2328232B-237B237D-239A23B4-23DB23E2-23E82400-24262440-244A249C-24E92500-25B625B8-25C025C2-25F72600-266E2670-26CD26CF-26E126E326E8-26FF2701-27042706-2709270C-27272729-274B274D274F-27522756-275E2761-276727942798-27AF27B1-27BE2800-28FF2B00-2B2F2B452B462B50-2B592CE5-2CEA2E80-2E992E9B-2EF32F00-2FD52FF0-2FFB300430123013302030363037303E303F319031913196-319F31C0-31E33200-321E322A-32503260-327F328A-32B032C0-32FE3300-33FF4DC0-4DFFA490-A4C6A828-A82BA836A837A839AA77-AA79FDFDFFE4FFE8FFEDFFEEFFFCFFFD",
    Z:  "002000A01680180E2000-200A20282029202F205F3000",
    Zs: "002000A01680180E2000-200A202F205F3000",
    Zl: "2028",
    Zp: "2029",
    C:  "0000-001F007F-009F00AD03780379037F-0383038B038D03A20526-05300557055805600588058B-059005C8-05CF05EB-05EF05F5-0605061C061D0620065F06DD070E070F074B074C07B2-07BF07FB-07FF082E082F083F-08FF093A093B094F095609570973-097809800984098D098E0991099209A909B109B3-09B509BA09BB09C509C609C909CA09CF-09D609D8-09DB09DE09E409E509FC-0A000A040A0B-0A0E0A110A120A290A310A340A370A3A0A3B0A3D0A43-0A460A490A4A0A4E-0A500A52-0A580A5D0A5F-0A650A76-0A800A840A8E0A920AA90AB10AB40ABA0ABB0AC60ACA0ACE0ACF0AD1-0ADF0AE40AE50AF00AF2-0B000B040B0D0B0E0B110B120B290B310B340B3A0B3B0B450B460B490B4A0B4E-0B550B58-0B5B0B5E0B640B650B72-0B810B840B8B-0B8D0B910B96-0B980B9B0B9D0BA0-0BA20BA5-0BA70BAB-0BAD0BBA-0BBD0BC3-0BC50BC90BCE0BCF0BD1-0BD60BD8-0BE50BFB-0C000C040C0D0C110C290C340C3A-0C3C0C450C490C4E-0C540C570C5A-0C5F0C640C650C70-0C770C800C810C840C8D0C910CA90CB40CBA0CBB0CC50CC90CCE-0CD40CD7-0CDD0CDF0CE40CE50CF00CF3-0D010D040D0D0D110D290D3A-0D3C0D450D490D4E-0D560D58-0D5F0D640D650D76-0D780D800D810D840D97-0D990DB20DBC0DBE0DBF0DC7-0DC90DCB-0DCE0DD50DD70DE0-0DF10DF5-0E000E3B-0E3E0E5C-0E800E830E850E860E890E8B0E8C0E8E-0E930E980EA00EA40EA60EA80EA90EAC0EBA0EBE0EBF0EC50EC70ECE0ECF0EDA0EDB0EDE-0EFF0F480F6D-0F700F8C-0F8F0F980FBD0FCD0FD9-0FFF10C6-10CF10FD-10FF1249124E124F12571259125E125F1289128E128F12B112B612B712BF12C112C612C712D7131113161317135B-135E137D-137F139A-139F13F5-13FF169D-169F16F1-16FF170D1715-171F1737-173F1754-175F176D17711774-177F17B417B517DE17DF17EA-17EF17FA-17FF180F181A-181F1878-187F18AB-18AF18F6-18FF191D-191F192C-192F193C-193F1941-1943196E196F1975-197F19AC-19AF19CA-19CF19DB-19DD1A1C1A1D1A5F1A7D1A7E1A8A-1A8F1A9A-1A9F1AAE-1AFF1B4C-1B4F1B7D-1B7F1BAB-1BAD1BBA-1BFF1C38-1C3A1C4A-1C4C1C80-1CCF1CF3-1CFF1DE7-1DFC1F161F171F1E1F1F1F461F471F4E1F4F1F581F5A1F5C1F5E1F7E1F7F1FB51FC51FD41FD51FDC1FF01FF11FF51FFF200B-200F202A-202E2060-206F20722073208F2095-209F20B9-20CF20F1-20FF218A-218F23E9-23FF2427-243F244B-245F26CE26E226E4-26E727002705270A270B2728274C274E2753-2755275F27602795-279727B027BF27CB27CD-27CF2B4D-2B4F2B5A-2BFF2C2F2C5F2CF2-2CF82D26-2D2F2D66-2D6E2D70-2D7F2D97-2D9F2DA72DAF2DB72DBF2DC72DCF2DD72DDF2E32-2E7F2E9A2EF4-2EFF2FD6-2FEF2FFC-2FFF3040309730983100-3104312E-3130318F31B8-31BF31E4-31EF321F32FF4DB6-4DBF9FCC-9FFFA48D-A48FA4C7-A4CFA62C-A63FA660A661A674-A67BA698-A69FA6F8-A6FFA78D-A7FAA82C-A82FA83A-A83FA878-A87FA8C5-A8CDA8DA-A8DFA8FC-A8FFA954-A95EA97D-A97FA9CEA9DA-A9DDA9E0-A9FFAA37-AA3FAA4EAA4FAA5AAA5BAA7C-AA7FAAC3-AADAAAE0-ABBFABEEABEFABFA-ABFFD7A4-D7AFD7C7-D7CAD7FC-F8FFFA2EFA2FFA6EFA6FFADA-FAFFFB07-FB12FB18-FB1CFB37FB3DFB3FFB42FB45FBB2-FBD2FD40-FD4FFD90FD91FDC8-FDEFFDFEFDFFFE1A-FE1FFE27-FE2FFE53FE67FE6C-FE6FFE75FEFD-FF00FFBF-FFC1FFC8FFC9FFD0FFD1FFD8FFD9FFDD-FFDFFFE7FFEF-FFFBFFFEFFFF",
    Cc: "0000-001F007F-009F",
    Cf: "00AD0600-060306DD070F17B417B5200B-200F202A-202E2060-2064206A-206FFEFFFFF9-FFFB",
    Co: "E000-F8FF",
    Cs: "D800-DFFF",
    Cn: "03780379037F-0383038B038D03A20526-05300557055805600588058B-059005C8-05CF05EB-05EF05F5-05FF06040605061C061D0620065F070E074B074C07B2-07BF07FB-07FF082E082F083F-08FF093A093B094F095609570973-097809800984098D098E0991099209A909B109B3-09B509BA09BB09C509C609C909CA09CF-09D609D8-09DB09DE09E409E509FC-0A000A040A0B-0A0E0A110A120A290A310A340A370A3A0A3B0A3D0A43-0A460A490A4A0A4E-0A500A52-0A580A5D0A5F-0A650A76-0A800A840A8E0A920AA90AB10AB40ABA0ABB0AC60ACA0ACE0ACF0AD1-0ADF0AE40AE50AF00AF2-0B000B040B0D0B0E0B110B120B290B310B340B3A0B3B0B450B460B490B4A0B4E-0B550B58-0B5B0B5E0B640B650B72-0B810B840B8B-0B8D0B910B96-0B980B9B0B9D0BA0-0BA20BA5-0BA70BAB-0BAD0BBA-0BBD0BC3-0BC50BC90BCE0BCF0BD1-0BD60BD8-0BE50BFB-0C000C040C0D0C110C290C340C3A-0C3C0C450C490C4E-0C540C570C5A-0C5F0C640C650C70-0C770C800C810C840C8D0C910CA90CB40CBA0CBB0CC50CC90CCE-0CD40CD7-0CDD0CDF0CE40CE50CF00CF3-0D010D040D0D0D110D290D3A-0D3C0D450D490D4E-0D560D58-0D5F0D640D650D76-0D780D800D810D840D97-0D990DB20DBC0DBE0DBF0DC7-0DC90DCB-0DCE0DD50DD70DE0-0DF10DF5-0E000E3B-0E3E0E5C-0E800E830E850E860E890E8B0E8C0E8E-0E930E980EA00EA40EA60EA80EA90EAC0EBA0EBE0EBF0EC50EC70ECE0ECF0EDA0EDB0EDE-0EFF0F480F6D-0F700F8C-0F8F0F980FBD0FCD0FD9-0FFF10C6-10CF10FD-10FF1249124E124F12571259125E125F1289128E128F12B112B612B712BF12C112C612C712D7131113161317135B-135E137D-137F139A-139F13F5-13FF169D-169F16F1-16FF170D1715-171F1737-173F1754-175F176D17711774-177F17DE17DF17EA-17EF17FA-17FF180F181A-181F1878-187F18AB-18AF18F6-18FF191D-191F192C-192F193C-193F1941-1943196E196F1975-197F19AC-19AF19CA-19CF19DB-19DD1A1C1A1D1A5F1A7D1A7E1A8A-1A8F1A9A-1A9F1AAE-1AFF1B4C-1B4F1B7D-1B7F1BAB-1BAD1BBA-1BFF1C38-1C3A1C4A-1C4C1C80-1CCF1CF3-1CFF1DE7-1DFC1F161F171F1E1F1F1F461F471F4E1F4F1F581F5A1F5C1F5E1F7E1F7F1FB51FC51FD41FD51FDC1FF01FF11FF51FFF2065-206920722073208F2095-209F20B9-20CF20F1-20FF218A-218F23E9-23FF2427-243F244B-245F26CE26E226E4-26E727002705270A270B2728274C274E2753-2755275F27602795-279727B027BF27CB27CD-27CF2B4D-2B4F2B5A-2BFF2C2F2C5F2CF2-2CF82D26-2D2F2D66-2D6E2D70-2D7F2D97-2D9F2DA72DAF2DB72DBF2DC72DCF2DD72DDF2E32-2E7F2E9A2EF4-2EFF2FD6-2FEF2FFC-2FFF3040309730983100-3104312E-3130318F31B8-31BF31E4-31EF321F32FF4DB6-4DBF9FCC-9FFFA48D-A48FA4C7-A4CFA62C-A63FA660A661A674-A67BA698-A69FA6F8-A6FFA78D-A7FAA82C-A82FA83A-A83FA878-A87FA8C5-A8CDA8DA-A8DFA8FC-A8FFA954-A95EA97D-A97FA9CEA9DA-A9DDA9E0-A9FFAA37-AA3FAA4EAA4FAA5AAA5BAA7C-AA7FAAC3-AADAAAE0-ABBFABEEABEFABFA-ABFFD7A4-D7AFD7C7-D7CAD7FC-D7FFFA2EFA2FFA6EFA6FFADA-FAFFFB07-FB12FB18-FB1CFB37FB3DFB3FFB42FB45FBB2-FBD2FD40-FD4FFD90FD91FDC8-FDEFFDFEFDFFFE1A-FE1FFE27-FE2FFE53FE67FE6C-FE6FFE75FEFDFEFEFF00FFBF-FFC1FFC8FFC9FFD0FFD1FFD8FFD9FFDD-FFDFFFE7FFEF-FFF8FFFEFFFF"
});

function addUnicodePackage (pack) {
    var codePoint = /\w{4}/g;
    for (var name in pack)
        exports.packages[name] = pack[name].replace(codePoint, "\\u$&");
};

});

ace.define('ace/document', ["require", 'exports', 'module' , 'ace/lib/oop', 'ace/lib/event_emitter', 'ace/range', 'ace/anchor'], function(acequire, exports, module) {


var oop = acequire("./lib/oop");
var EventEmitter = acequire("./lib/event_emitter").EventEmitter;
var Range = acequire("./range").Range;
var Anchor = acequire("./anchor").Anchor;

var Document = function(text) {
    this.$lines = [];
    if (text.length == 0) {
        this.$lines = [""];
    } else if (Array.isArray(text)) {
        this.insertLines(0, text);
    } else {
        this.insert({row: 0, column:0}, text);
    }
};

(function() {

    oop.implement(this, EventEmitter);
    this.setValue = function(text) {
        var len = this.getLength();
        this.remove(new Range(0, 0, len, this.getLine(len-1).length));
        this.insert({row: 0, column:0}, text);
    };
    this.getValue = function() {
        return this.getAllLines().join(this.getNewLineCharacter());
    };
    this.createAnchor = function(row, column) {
        return new Anchor(this, row, column);
    };
    if ("aaa".split(/a/).length == 0)
        this.$split = function(text) {
            return text.replace(/\r\n|\r/g, "\n").split("\n");
        }
    else
        this.$split = function(text) {
            return text.split(/\r\n|\r|\n/);
        };


 
    this.$detectNewLine = function(text) {
        var match = text.match(/^.*?(\r\n|\r|\n)/m);
        if (match) {
            this.$autoNewLine = match[1];
        } else {
            this.$autoNewLine = "\n";
        }
    };
    this.getNewLineCharacter = function() {
        switch (this.$newLineMode) {
          case "windows":
            return "\r\n";

          case "unix":
            return "\n";

          default:
            return this.$autoNewLine;
        }
    };

    this.$autoNewLine = "\n";
    this.$newLineMode = "auto";
    this.setNewLineMode = function(newLineMode) {
        if (this.$newLineMode === newLineMode)
            return;

        this.$newLineMode = newLineMode;
    };
    this.getNewLineMode = function() {
        return this.$newLineMode;
    };
    this.isNewLine = function(text) {
        return (text == "\r\n" || text == "\r" || text == "\n");
    };
    this.getLine = function(row) {
        return this.$lines[row] || "";
    };
    this.getLines = function(firstRow, lastRow) {
        return this.$lines.slice(firstRow, lastRow + 1);
    };
    this.getAllLines = function() {
        return this.getLines(0, this.getLength());
    };
    this.getLength = function() {
        return this.$lines.length;
    };
    this.getTextRange = function(range) {
        if (range.start.row == range.end.row) {
            return this.$lines[range.start.row].substring(range.start.column,
                                                         range.end.column);
        }
        else {
            var lines = this.getLines(range.start.row+1, range.end.row-1);
            lines.unshift((this.$lines[range.start.row] || "").substring(range.start.column));
            lines.push((this.$lines[range.end.row] || "").substring(0, range.end.column));
            return lines.join(this.getNewLineCharacter());
        }
    };

    this.$clipPosition = function(position) {
        var length = this.getLength();
        if (position.row >= length) {
            position.row = Math.max(0, length - 1);
            position.column = this.getLine(length-1).length;
        } else if (position.row < 0)
            position.row = 0;
        return position;
    };
    this.insert = function(position, text) {
        if (!text || text.length === 0)
            return position;

        position = this.$clipPosition(position);
        if (this.getLength() <= 1)
            this.$detectNewLine(text);

        var lines = this.$split(text);
        var firstLine = lines.splice(0, 1)[0];
        var lastLine = lines.length == 0 ? null : lines.splice(lines.length - 1, 1)[0];

        position = this.insertInLine(position, firstLine);
        if (lastLine !== null) {
            position = this.insertNewLine(position); // terminate first line
            position = this.insertLines(position.row, lines);
            position = this.insertInLine(position, lastLine || "");
        }
        return position;
    };
    this.insertLines = function(row, lines) {
        if (lines.length == 0)
            return {row: row, column: 0};
        if (lines.length > 0xFFFF) {
            var end = this.insertLines(row, lines.slice(0xFFFF));
            lines = lines.slice(0, 0xFFFF);
        }

        var args = [row, 0];
        args.push.apply(args, lines);
        this.$lines.splice.apply(this.$lines, args);

        var range = new Range(row, 0, row + lines.length, 0);
        var delta = {
            action: "insertLines",
            range: range,
            lines: lines
        };
        this._emit("change", { data: delta });
        return end || range.end;
    };
    this.insertNewLine = function(position) {
        position = this.$clipPosition(position);
        var line = this.$lines[position.row] || "";

        this.$lines[position.row] = line.substring(0, position.column);
        this.$lines.splice(position.row + 1, 0, line.substring(position.column, line.length));

        var end = {
            row : position.row + 1,
            column : 0
        };

        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: this.getNewLineCharacter()
        };
        this._emit("change", { data: delta });

        return end;
    };
    this.insertInLine = function(position, text) {
        if (text.length == 0)
            return position;

        var line = this.$lines[position.row] || "";

        this.$lines[position.row] = line.substring(0, position.column) + text
                + line.substring(position.column);

        var end = {
            row : position.row,
            column : position.column + text.length
        };

        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: text
        };
        this._emit("change", { data: delta });

        return end;
    };
    this.remove = function(range) {
        range.start = this.$clipPosition(range.start);
        range.end = this.$clipPosition(range.end);

        if (range.isEmpty())
            return range.start;

        var firstRow = range.start.row;
        var lastRow = range.end.row;

        if (range.isMultiLine()) {
            var firstFullRow = range.start.column == 0 ? firstRow : firstRow + 1;
            var lastFullRow = lastRow - 1;

            if (range.end.column > 0)
                this.removeInLine(lastRow, 0, range.end.column);

            if (lastFullRow >= firstFullRow)
                this.removeLines(firstFullRow, lastFullRow);

            if (firstFullRow != firstRow) {
                this.removeInLine(firstRow, range.start.column, this.getLine(firstRow).length);
                this.removeNewLine(range.start.row);
            }
        }
        else {
            this.removeInLine(firstRow, range.start.column, range.end.column);
        }
        return range.start;
    };
    this.removeInLine = function(row, startColumn, endColumn) {
        if (startColumn == endColumn)
            return;

        var range = new Range(row, startColumn, row, endColumn);
        var line = this.getLine(row);
        var removed = line.substring(startColumn, endColumn);
        var newLine = line.substring(0, startColumn) + line.substring(endColumn, line.length);
        this.$lines.splice(row, 1, newLine);

        var delta = {
            action: "removeText",
            range: range,
            text: removed
        };
        this._emit("change", { data: delta });
        return range.start;
    };
    this.removeLines = function(firstRow, lastRow) {
        var range = new Range(firstRow, 0, lastRow + 1, 0);
        var removed = this.$lines.splice(firstRow, lastRow - firstRow + 1);

        var delta = {
            action: "removeLines",
            range: range,
            nl: this.getNewLineCharacter(),
            lines: removed
        };
        this._emit("change", { data: delta });
        return removed;
    };
    this.removeNewLine = function(row) {
        var firstLine = this.getLine(row);
        var secondLine = this.getLine(row+1);

        var range = new Range(row, firstLine.length, row+1, 0);
        var line = firstLine + secondLine;

        this.$lines.splice(row, 2, line);

        var delta = {
            action: "removeText",
            range: range,
            text: this.getNewLineCharacter()
        };
        this._emit("change", { data: delta });
    };
    this.replace = function(range, text) {
        if (text.length == 0 && range.isEmpty())
            return range.start;
        if (text == this.getTextRange(range))
            return range.end;

        this.remove(range);
        if (text) {
            var end = this.insert(range.start, text);
        }
        else {
            end = range.start;
        }

        return end;
    };
    this.applyDeltas = function(deltas) {
        for (var i=0; i<deltas.length; i++) {
            var delta = deltas[i];
            var range = Range.fromPoints(delta.range.start, delta.range.end);

            if (delta.action == "insertLines")
                this.insertLines(range.start.row, delta.lines);
            else if (delta.action == "insertText")
                this.insert(range.start, delta.text);
            else if (delta.action == "removeLines")
                this.removeLines(range.start.row, range.end.row - 1);
            else if (delta.action == "removeText")
                this.remove(range);
        }
    };
    this.revertDeltas = function(deltas) {
        for (var i=deltas.length-1; i>=0; i--) {
            var delta = deltas[i];

            var range = Range.fromPoints(delta.range.start, delta.range.end);

            if (delta.action == "insertLines")
                this.removeLines(range.start.row, range.end.row - 1);
            else if (delta.action == "insertText")
                this.remove(range);
            else if (delta.action == "removeLines")
                this.insertLines(range.start.row, delta.lines);
            else if (delta.action == "removeText")
                this.insert(range.start, delta.text);
        }
    };
    this.indexToPosition = function(index, startRow) {
        var lines = this.$lines || this.getAllLines();
        var newlineLength = this.getNewLineCharacter().length;
        for (var i = startRow || 0, l = lines.length; i < l; i++) {
            index -= lines[i].length + newlineLength;
            if (index < 0)
                return {row: i, column: index + lines[i].length + newlineLength};
        }
        return {row: l-1, column: lines[l-1].length};
    };
    this.positionToIndex = function(pos, startRow) {
        var lines = this.$lines || this.getAllLines();
        var newlineLength = this.getNewLineCharacter().length;
        var index = 0;
        var row = Math.min(pos.row, lines.length);
        for (var i = startRow || 0; i < row; ++i)
            index += lines[i].length;

        return index + newlineLength * i + pos.column;
    };

}).call(Document.prototype);

exports.Document = Document;
});

ace.define('ace/anchor', ["require", 'exports', 'module' , 'ace/lib/oop', 'ace/lib/event_emitter'], function(acequire, exports, module) {


var oop = acequire("./lib/oop");
var EventEmitter = acequire("./lib/event_emitter").EventEmitter;

var Anchor = exports.Anchor = function(doc, row, column) {
    this.document = doc;

    if (typeof column == "undefined")
        this.setPosition(row.row, row.column);
    else
        this.setPosition(row, column);

    this.$onChange = this.onChange.bind(this);
    doc.on("change", this.$onChange);
};

(function() {

    oop.implement(this, EventEmitter);

    this.getPosition = function() {
        return this.$clipPositionToDocument(this.row, this.column);
    };

    this.getDocument = function() {
        return this.document;
    };

    this.onChange = function(e) {
        var delta = e.data;
        var range = delta.range;

        if (range.start.row == range.end.row && range.start.row != this.row)
            return;

        if (range.start.row > this.row)
            return;

        if (range.start.row == this.row && range.start.column > this.column)
            return;

        var row = this.row;
        var column = this.column;
        var start = range.start;
        var end = range.end;

        if (delta.action === "insertText") {
            if (start.row === row && start.column <= column) {
                if (start.row === end.row) {
                    column += end.column - start.column;
                } else {
                    column -= start.column;
                    row += end.row - start.row;
                }
            } else if (start.row !== end.row && start.row < row) {
                row += end.row - start.row;
            }
        } else if (delta.action === "insertLines") {
            if (start.row <= row) {
                row += end.row - start.row;
            }
        } else if (delta.action === "removeText") {
            if (start.row === row && start.column < column) {
                if (end.column >= column)
                    column = start.column;
                else
                    column = Math.max(0, column - (end.column - start.column));

            } else if (start.row !== end.row && start.row < row) {
                if (end.row === row)
                    column = Math.max(0, column - end.column) + start.column;
                row -= (end.row - start.row);
            } else if (end.row === row) {
                row -= end.row - start.row;
                column = Math.max(0, column - end.column) + start.column;
            }
        } else if (delta.action == "removeLines") {
            if (start.row <= row) {
                if (end.row <= row)
                    row -= end.row - start.row;
                else {
                    row = start.row;
                    column = 0;
                }
            }
        }

        this.setPosition(row, column, true);
    };

    this.setPosition = function(row, column, noClip) {
        var pos;
        if (noClip) {
            pos = {
                row: row,
                column: column
            };
        } else {
            pos = this.$clipPositionToDocument(row, column);
        }

        if (this.row == pos.row && this.column == pos.column)
            return;

        var old = {
            row: this.row,
            column: this.column
        };

        this.row = pos.row;
        this.column = pos.column;
        this._emit("change", {
            old: old,
            value: pos
        });
    };

    this.detach = function() {
        this.document.removeEventListener("change", this.$onChange);
    };
    this.$clipPositionToDocument = function(row, column) {
        var pos = {};

        if (row >= this.document.getLength()) {
            pos.row = Math.max(0, this.document.getLength() - 1);
            pos.column = this.document.getLine(pos.row).length;
        }
        else if (row < 0) {
            pos.row = 0;
            pos.column = 0;
        }
        else {
            pos.row = row;
            pos.column = Math.min(this.document.getLine(pos.row).length, Math.max(0, column));
        }

        if (column < 0)
            pos.column = 0;

        return pos;
    };

}).call(Anchor.prototype);

});

ace.define('ace/background_tokenizer', ["require", 'exports', 'module' , 'ace/lib/oop', 'ace/lib/event_emitter'], function(acequire, exports, module) {


var oop = acequire("./lib/oop");
var EventEmitter = acequire("./lib/event_emitter").EventEmitter;

var BackgroundTokenizer = function(tokenizer, editor) {
    this.running = false;
    this.lines = [];
    this.states = [];
    this.currentLine = 0;
    this.tokenizer = tokenizer;

    var self = this;

    this.$worker = function() {
        if (!self.running) { return; }

        var workerStart = new Date();
        var startLine = self.currentLine;
        var doc = self.doc;

        var processedLines = 0;

        var len = doc.getLength();
        while (self.currentLine < len) {
            self.$tokenizeRow(self.currentLine);
            while (self.lines[self.currentLine])
                self.currentLine++;
            processedLines ++;
            if ((processedLines % 5 == 0) && (new Date() - workerStart) > 20) {
                self.fireUpdateEvent(startLine, self.currentLine-1);
                self.running = setTimeout(self.$worker, 20);
                return;
            }
        }

        self.running = false;

        self.fireUpdateEvent(startLine, len - 1);
    };
};

(function(){

    oop.implement(this, EventEmitter);
    this.setTokenizer = function(tokenizer) {
        this.tokenizer = tokenizer;
        this.lines = [];
        this.states = [];

        this.start(0);
    };
    this.setDocument = function(doc) {
        this.doc = doc;
        this.lines = [];
        this.states = [];

        this.stop();
    };
    this.fireUpdateEvent = function(firstRow, lastRow) {
        var data = {
            first: firstRow,
            last: lastRow
        };
        this._emit("update", {data: data});
    };
    this.start = function(startRow) {
        this.currentLine = Math.min(startRow || 0, this.currentLine, this.doc.getLength());
        this.lines.splice(this.currentLine, this.lines.length);
        this.states.splice(this.currentLine, this.states.length);

        this.stop();
        this.running = setTimeout(this.$worker, 700);
    };

    this.$updateOnChange = function(delta) {
        var range = delta.range;
        var startRow = range.start.row;
        var len = range.end.row - startRow;

        if (len === 0) {
            this.lines[startRow] = null;
        } else if (delta.action == "removeText" || delta.action == "removeLines") {
            this.lines.splice(startRow, len + 1, null);
            this.states.splice(startRow, len + 1, null);
        } else {
            var args = Array(len + 1);
            args.unshift(startRow, 1);
            this.lines.splice.apply(this.lines, args);
            this.states.splice.apply(this.states, args);
        }

        this.currentLine = Math.min(startRow, this.currentLine, this.doc.getLength());

        this.stop();
        this.running = setTimeout(this.$worker, 700);
    };
    this.stop = function() {
        if (this.running)
            clearTimeout(this.running);
        this.running = false;
    };
    this.getTokens = function(row) {
        return this.lines[row] || this.$tokenizeRow(row);
    };
    this.getState = function(row) {
        if (this.currentLine == row)
            this.$tokenizeRow(row);
        return this.states[row] || "start";
    };

    this.$tokenizeRow = function(row) {
        var line = this.doc.getLine(row);
        var state = this.states[row - 1];

        var data = this.tokenizer.getLineTokens(line, state, row);

        if (this.states[row] + "" !== data.state + "") {
            this.states[row] = data.state;
            this.lines[row + 1] = null;
            if (this.currentLine > row + 1)
                this.currentLine = row + 1;
        } else if (this.currentLine == row) {
            this.currentLine = row + 1;
        }

        return this.lines[row] = data.tokens;
    };

}).call(BackgroundTokenizer.prototype);

exports.BackgroundTokenizer = BackgroundTokenizer;
});

ace.define('ace/search_highlight', ["require", 'exports', 'module' , 'ace/lib/lang', 'ace/lib/oop', 'ace/range'], function(acequire, exports, module) {


var lang = acequire("./lib/lang");
var oop = acequire("./lib/oop");
var Range = acequire("./range").Range;

var SearchHighlight = function(regExp, clazz, type) {
    this.setRegexp(regExp);
    this.clazz = clazz;
    this.type = type || "text";
};

(function() {
    this.MAX_RANGES = 500;
    
    this.setRegexp = function(regExp) {
        if (this.regExp+"" == regExp+"")
            return;
        this.regExp = regExp;
        this.cache = [];
    };

    this.update = function(html, markerLayer, session, config) {
        if (!this.regExp)
            return;
        var start = config.firstRow, end = config.lastRow;

        for (var i = start; i <= end; i++) {
            var ranges = this.cache[i];
            if (ranges == null) {
                ranges = lang.getMatchOffsets(session.getLine(i), this.regExp);
                if (ranges.length > this.MAX_RANGES)
                    ranges = ranges.slice(0, this.MAX_RANGES);
                ranges = ranges.map(function(match) {
                    return new Range(i, match.offset, i, match.offset + match.length);
                });
                this.cache[i] = ranges.length ? ranges : "";
            }

            for (var j = ranges.length; j --; ) {
                markerLayer.drawSingleLineMarker(
                    html, ranges[j].toScreenRange(session), this.clazz, config,
                    null, this.type
                );
            }
        }
    };

}).call(SearchHighlight.prototype);

exports.SearchHighlight = SearchHighlight;
});

ace.define('ace/edit_session/folding', ["require", 'exports', 'module' , 'ace/range', 'ace/edit_session/fold_line', 'ace/edit_session/fold', 'ace/token_iterator'], function(acequire, exports, module) {


var Range = acequire("../range").Range;
var FoldLine = acequire("./fold_line").FoldLine;
var Fold = acequire("./fold").Fold;
var TokenIterator = acequire("../token_iterator").TokenIterator;

function Folding() {
    this.getFoldAt = function(row, column, side) {
        var foldLine = this.getFoldLine(row);
        if (!foldLine)
            return null;

        var folds = foldLine.folds;
        for (var i = 0; i < folds.length; i++) {
            var fold = folds[i];
            if (fold.range.contains(row, column)) {
                if (side == 1 && fold.range.isEnd(row, column)) {
                    continue;
                } else if (side == -1 && fold.range.isStart(row, column)) {
                    continue;
                }
                return fold;
            }
        }
    };
    this.getFoldsInRange = function(range) {
        var start = range.start;
        var end = range.end;
        var foldLines = this.$foldData;
        var foundFolds = [];

        start.column += 1;
        end.column -= 1;

        for (var i = 0; i < foldLines.length; i++) {
            var cmp = foldLines[i].range.compareRange(range);
            if (cmp == 2) {
                continue;
            }
            else if (cmp == -2) {
                break;
            }

            var folds = foldLines[i].folds;
            for (var j = 0; j < folds.length; j++) {
                var fold = folds[j];
                cmp = fold.range.compareRange(range);
                if (cmp == -2) {
                    break;
                } else if (cmp == 2) {
                    continue;
                } else
                if (cmp == 42) {
                    break;
                }
                foundFolds.push(fold);
            }
        }
        start.column -= 1;
        end.column += 1;

        return foundFolds;
    };
    this.getAllFolds = function() {
        var folds = [];
        var foldLines = this.$foldData;
        
        function addFold(fold) {
            folds.push(fold);
        }
        
        for (var i = 0; i < foldLines.length; i++)
            for (var j = 0; j < foldLines[i].folds.length; j++)
                addFold(foldLines[i].folds[j]);

        return folds;
    };
    this.getFoldStringAt = function(row, column, trim, foldLine) {
        foldLine = foldLine || this.getFoldLine(row);
        if (!foldLine)
            return null;

        var lastFold = {
            end: { column: 0 }
        };
        var str, fold;
        for (var i = 0; i < foldLine.folds.length; i++) {
            fold = foldLine.folds[i];
            var cmp = fold.range.compareEnd(row, column);
            if (cmp == -1) {
                str = this
                    .getLine(fold.start.row)
                    .substring(lastFold.end.column, fold.start.column);
                break;
            }
            else if (cmp === 0) {
                return null;
            }
            lastFold = fold;
        }
        if (!str)
            str = this.getLine(fold.start.row).substring(lastFold.end.column);

        if (trim == -1)
            return str.substring(0, column - lastFold.end.column);
        else if (trim == 1)
            return str.substring(column - lastFold.end.column);
        else
            return str;
    };

    this.getFoldLine = function(docRow, startFoldLine) {
        var foldData = this.$foldData;
        var i = 0;
        if (startFoldLine)
            i = foldData.indexOf(startFoldLine);
        if (i == -1)
            i = 0;
        for (i; i < foldData.length; i++) {
            var foldLine = foldData[i];
            if (foldLine.start.row <= docRow && foldLine.end.row >= docRow) {
                return foldLine;
            } else if (foldLine.end.row > docRow) {
                return null;
            }
        }
        return null;
    };
    this.getNextFoldLine = function(docRow, startFoldLine) {
        var foldData = this.$foldData;
        var i = 0;
        if (startFoldLine)
            i = foldData.indexOf(startFoldLine);
        if (i == -1)
            i = 0;
        for (i; i < foldData.length; i++) {
            var foldLine = foldData[i];
            if (foldLine.end.row >= docRow) {
                return foldLine;
            }
        }
        return null;
    };

    this.getFoldedRowCount = function(first, last) {
        var foldData = this.$foldData, rowCount = last-first+1;
        for (var i = 0; i < foldData.length; i++) {
            var foldLine = foldData[i],
                end = foldLine.end.row,
                start = foldLine.start.row;
            if (end >= last) {
                if(start < last) {
                    if(start >= first)
                        rowCount -= last-start;
                    else
                        rowCount = 0;//in one fold
                }
                break;
            } else if(end >= first){
                if (start >= first) //fold inside range
                    rowCount -=  end-start;
                else
                    rowCount -=  end-first+1;
            }
        }
        return rowCount;
    };

    this.$addFoldLine = function(foldLine) {
        this.$foldData.push(foldLine);
        this.$foldData.sort(function(a, b) {
            return a.start.row - b.start.row;
        });
        return foldLine;
    };
    this.addFold = function(placeholder, range) {
        var foldData = this.$foldData;
        var added = false;
        var fold;
        
        if (placeholder instanceof Fold)
            fold = placeholder;
        else {
            fold = new Fold(range, placeholder);
            fold.collapseChildren = range.collapseChildren;
        }
        this.$clipRangeToDocument(fold.range);

        var startRow = fold.start.row;
        var startColumn = fold.start.column;
        var endRow = fold.end.row;
        var endColumn = fold.end.column;
        if (startRow == endRow && endColumn - startColumn < 2)
            throw "The range has to be at least 2 characters width";

        var startFold = this.getFoldAt(startRow, startColumn, 1);
        var endFold = this.getFoldAt(endRow, endColumn, -1);
        if (startFold && endFold == startFold)
            return startFold.addSubFold(fold);

        if (
            (startFold && !startFold.range.isStart(startRow, startColumn))
            || (endFold && !endFold.range.isEnd(endRow, endColumn))
        ) {
            throw "A fold can't intersect already existing fold" + fold.range + startFold.range;
        }
        var folds = this.getFoldsInRange(fold.range);
        if (folds.length > 0) {
            this.removeFolds(folds);
            folds.forEach(function(subFold) {
                fold.addSubFold(subFold);
            });
        }

        for (var i = 0; i < foldData.length; i++) {
            var foldLine = foldData[i];
            if (endRow == foldLine.start.row) {
                foldLine.addFold(fold);
                added = true;
                break;
            } else if (startRow == foldLine.end.row) {
                foldLine.addFold(fold);
                added = true;
                if (!fold.sameRow) {
                    var foldLineNext = foldData[i + 1];
                    if (foldLineNext && foldLineNext.start.row == endRow) {
                        foldLine.merge(foldLineNext);
                        break;
                    }
                }
                break;
            } else if (endRow <= foldLine.start.row) {
                break;
            }
        }

        if (!added)
            foldLine = this.$addFoldLine(new FoldLine(this.$foldData, fold));

        if (this.$useWrapMode)
            this.$updateWrapData(foldLine.start.row, foldLine.start.row);
        else
            this.$updateRowLengthCache(foldLine.start.row, foldLine.start.row);
        this.$modified = true;
        this._emit("changeFold", { data: fold });

        return fold;
    };

    this.addFolds = function(folds) {
        folds.forEach(function(fold) {
            this.addFold(fold);
        }, this);
    };

    this.removeFold = function(fold) {
        var foldLine = fold.foldLine;
        var startRow = foldLine.start.row;
        var endRow = foldLine.end.row;

        var foldLines = this.$foldData;
        var folds = foldLine.folds;
        if (folds.length == 1) {
            foldLines.splice(foldLines.indexOf(foldLine), 1);
        } else
        if (foldLine.range.isEnd(fold.end.row, fold.end.column)) {
            folds.pop();
            foldLine.end.row = folds[folds.length - 1].end.row;
            foldLine.end.column = folds[folds.length - 1].end.column;
        } else
        if (foldLine.range.isStart(fold.start.row, fold.start.column)) {
            folds.shift();
            foldLine.start.row = folds[0].start.row;
            foldLine.start.column = folds[0].start.column;
        } else
        if (fold.sameRow) {
            folds.splice(folds.indexOf(fold), 1);
        } else
        {
            var newFoldLine = foldLine.split(fold.start.row, fold.start.column);
            folds = newFoldLine.folds;
            folds.shift();
            newFoldLine.start.row = folds[0].start.row;
            newFoldLine.start.column = folds[0].start.column;
        }

        if (!this.$updating) {
            if (this.$useWrapMode)
                this.$updateWrapData(startRow, endRow);
            else
                this.$updateRowLengthCache(startRow, endRow);
        }
        this.$modified = true;
        this._emit("changeFold", { data: fold });
    };

    this.removeFolds = function(folds) {
        var cloneFolds = [];
        for (var i = 0; i < folds.length; i++) {
            cloneFolds.push(folds[i]);
        }

        cloneFolds.forEach(function(fold) {
            this.removeFold(fold);
        }, this);
        this.$modified = true;
    };

    this.expandFold = function(fold) {
        this.removeFold(fold);        
        fold.subFolds.forEach(function(subFold) {
            fold.restoreRange(subFold);
            this.addFold(subFold);
        }, this);
        if (fold.collapseChildren > 0) {
            this.foldAll(fold.start.row+1, fold.end.row, fold.collapseChildren-1);
        }
        fold.subFolds = [];
    };

    this.expandFolds = function(folds) {
        folds.forEach(function(fold) {
            this.expandFold(fold);
        }, this);
    };

    this.unfold = function(location, expandInner) {
        var range, folds;
        if (location == null) {
            range = new Range(0, 0, this.getLength(), 0);
            expandInner = true;
        } else if (typeof location == "number")
            range = new Range(location, 0, location, this.getLine(location).length);
        else if ("row" in location)
            range = Range.fromPoints(location, location);
        else
            range = location;

        folds = this.getFoldsInRange(range);
        if (expandInner) {
            this.removeFolds(folds);
        } else {
            while (folds.length) {
                this.expandFolds(folds);
                folds = this.getFoldsInRange(range);
            }
        }
    };
    this.isRowFolded = function(docRow, startFoldRow) {
        return !!this.getFoldLine(docRow, startFoldRow);
    };

    this.getRowFoldEnd = function(docRow, startFoldRow) {
        var foldLine = this.getFoldLine(docRow, startFoldRow);
        return foldLine ? foldLine.end.row : docRow;
    };

    this.getRowFoldStart = function(docRow, startFoldRow) {
        var foldLine = this.getFoldLine(docRow, startFoldRow);
        return foldLine ? foldLine.start.row : docRow;
    };

    this.getFoldDisplayLine = function(foldLine, endRow, endColumn, startRow, startColumn) {
        if (startRow == null) {
            startRow = foldLine.start.row;
            startColumn = 0;
        }

        if (endRow == null) {
            endRow = foldLine.end.row;
            endColumn = this.getLine(endRow).length;
        }
        var doc = this.doc;
        var textLine = "";

        foldLine.walk(function(placeholder, row, column, lastColumn) {
            if (row < startRow)
                return;
            if (row == startRow) {
                if (column < startColumn)
                    return;
                lastColumn = Math.max(startColumn, lastColumn);
            }

            if (placeholder != null) {
                textLine += placeholder;
            } else {
                textLine += doc.getLine(row).substring(lastColumn, column);
            }
        }, endRow, endColumn);
        return textLine;
    };

    this.getDisplayLine = function(row, endColumn, startRow, startColumn) {
        var foldLine = this.getFoldLine(row);

        if (!foldLine) {
            var line;
            line = this.doc.getLine(row);
            return line.substring(startColumn || 0, endColumn || line.length);
        } else {
            return this.getFoldDisplayLine(
                foldLine, row, endColumn, startRow, startColumn);
        }
    };

    this.$cloneFoldData = function() {
        var fd = [];
        fd = this.$foldData.map(function(foldLine) {
            var folds = foldLine.folds.map(function(fold) {
                return fold.clone();
            });
            return new FoldLine(fd, folds);
        });

        return fd;
    };

    this.toggleFold = function(tryToUnfold) {
        var selection = this.selection;
        var range = selection.getRange();
        var fold;
        var bracketPos;

        if (range.isEmpty()) {
            var cursor = range.start;
            fold = this.getFoldAt(cursor.row, cursor.column);

            if (fold) {
                this.expandFold(fold);
                return;
            } else if (bracketPos = this.findMatchingBracket(cursor)) {
                if (range.comparePoint(bracketPos) == 1) {
                    range.end = bracketPos;
                } else {
                    range.start = bracketPos;
                    range.start.column++;
                    range.end.column--;
                }
            } else if (bracketPos = this.findMatchingBracket({row: cursor.row, column: cursor.column + 1})) {
                if (range.comparePoint(bracketPos) == 1)
                    range.end = bracketPos;
                else
                    range.start = bracketPos;

                range.start.column++;
            } else {
                range = this.getCommentFoldRange(cursor.row, cursor.column) || range;
            }
        } else {
            var folds = this.getFoldsInRange(range);
            if (tryToUnfold && folds.length) {
                this.expandFolds(folds);
                return;
            } else if (folds.length == 1 ) {
                fold = folds[0];
            }
        }

        if (!fold)
            fold = this.getFoldAt(range.start.row, range.start.column);

        if (fold && fold.range.toString() == range.toString()) {
            this.expandFold(fold);
            return;
        }

        var placeholder = "...";
        if (!range.isMultiLine()) {
            placeholder = this.getTextRange(range);
            if(placeholder.length < 4)
                return;
            placeholder = placeholder.trim().substring(0, 2) + "..";
        }

        this.addFold(placeholder, range);
    };

    this.getCommentFoldRange = function(row, column, dir) {
        var iterator = new TokenIterator(this, row, column);
        var token = iterator.getCurrentToken();
        if (token && /^comment|string/.test(token.type)) {
            var range = new Range();
            var re = new RegExp(token.type.replace(/\..*/, "\\."));
            if (dir != 1) {
                do {
                    token = iterator.stepBackward();
                } while(token && re.test(token.type));
                iterator.stepForward();
            }
            
            range.start.row = iterator.getCurrentTokenRow();
            range.start.column = iterator.getCurrentTokenColumn() + 2;

            iterator = new TokenIterator(this, row, column);
            
            if (dir != -1) {
                do {
                    token = iterator.stepForward();
                } while(token && re.test(token.type));
                token = iterator.stepBackward();
            } else
                token = iterator.getCurrentToken();

            range.end.row = iterator.getCurrentTokenRow();
            range.end.column = iterator.getCurrentTokenColumn() + token.value.length - 2;
            return range;
        }
    };

    this.foldAll = function(startRow, endRow, depth) {
        if (depth == undefined)
            depth = 100000; // JSON.stringify doesn't hanle Infinity
        var foldWidgets = this.foldWidgets;
        endRow = endRow || this.getLength();
        for (var row = startRow || 0; row < endRow; row++) {
            if (foldWidgets[row] == null)
                foldWidgets[row] = this.getFoldWidget(row);
            if (foldWidgets[row] != "start")
                continue;

            var range = this.getFoldWidgetRange(row);
            if (range && range.end.row <= endRow) try {
                var fold = this.addFold("...", range);
                fold.collapseChildren = depth;
            } catch(e) {}
            row = range.end.row;
        }
    };
    this.$foldStyles = {
        "manual": 1,
        "markbegin": 1,
        "markbeginend": 1
    };
    this.$foldStyle = "markbegin";
    this.setFoldStyle = function(style) {
        if (!this.$foldStyles[style])
            throw new Error("invalid fold style: " + style + "[" + Object.keys(this.$foldStyles).join(", ") + "]");
        
        if (this.$foldStyle == style)
            return;

        this.$foldStyle = style;
        
        if (style == "manual")
            this.unfold();
        var mode = this.$foldMode;
        this.$setFolding(null);
        this.$setFolding(mode);
    };

    this.$setFolding = function(foldMode) {
        if (this.$foldMode == foldMode)
            return;
            
        this.$foldMode = foldMode;
        
        this.removeListener('change', this.$updateFoldWidgets);
        this._emit("changeAnnotation");
        
        if (!foldMode || this.$foldStyle == "manual") {
            this.foldWidgets = null;
            return;
        }
        
        this.foldWidgets = [];
        this.getFoldWidget = foldMode.getFoldWidget.bind(foldMode, this, this.$foldStyle);
        this.getFoldWidgetRange = foldMode.getFoldWidgetRange.bind(foldMode, this, this.$foldStyle);
        
        this.$updateFoldWidgets = this.updateFoldWidgets.bind(this);
        this.on('change', this.$updateFoldWidgets);
        
    };

    this.getParentFoldRangeData = function (row, ignoreCurrent) {
        var fw = this.foldWidgets;
        if (!fw || (ignoreCurrent && fw[row]))
            return {};

        var i = row - 1, firstRange;
        while (i >= 0) {
            var c = fw[i];
            if (c == null)
                c = fw[i] = this.getFoldWidget(i);

            if (c == "start") {
                var range = this.getFoldWidgetRange(i);
                if (!firstRange)
                    firstRange = range;
                if (range && range.end.row >= row)
                    break;
            }
            i--;
        }

        return {
            range: i !== -1 && range,
            firstRange: firstRange
        };
    }

    this.onFoldWidgetClick = function(row, e) {
        var type = this.getFoldWidget(row);
        var line = this.getLine(row);
        e = e.domEvent;
        var children = e.shiftKey;
        var all = e.ctrlKey || e.metaKey;
        var siblings = e.altKey;

        var dir = type === "end" ? -1 : 1;
        var fold = this.getFoldAt(row, dir === -1 ? 0 : line.length, dir);

        if (fold) {
            if (children || all)
                this.removeFold(fold);
            else
                this.expandFold(fold);
            return;
        }

        var range = this.getFoldWidgetRange(row);
        if (range && !range.isMultiLine()) {
            fold = this.getFoldAt(range.start.row, range.start.column, 1);
            if (fold && range.isEqual(fold.range)) {
                this.removeFold(fold);
                return;
            }
        }
        
        if (siblings) {
            var data = this.getParentFoldRangeData(row);
            if (data.range) {
                var startRow = data.range.start.row + 1;
                var endRow = data.range.end.row;
            }
            this.foldAll(startRow, endRow, all ? 10000 : 0);
        } else if (children) {
            var endRow = range ? range.end.row : this.getLength();
            this.foldAll(row + 1, range.end.row, all ? 10000 : 0);
        } else if (range) {
            if (all) 
                range.collapseChildren = 10000;
            this.addFold("...", range);
        }
        
        if (!range)
            (e.target || e.srcElement).className += " ace_invalid"
    };

    this.updateFoldWidgets = function(e) {
        var delta = e.data;
        var range = delta.range;
        var firstRow = range.start.row;
        var len = range.end.row - firstRow;

        if (len === 0) {
            this.foldWidgets[firstRow] = null;
        } else if (delta.action == "removeText" || delta.action == "removeLines") {
            this.foldWidgets.splice(firstRow, len + 1, null);
        } else {
            var args = Array(len + 1);
            args.unshift(firstRow, 1);
            this.foldWidgets.splice.apply(this.foldWidgets, args);
        }
    };

}

exports.Folding = Folding;

});

ace.define('ace/edit_session/fold_line', ["require", 'exports', 'module' , 'ace/range'], function(acequire, exports, module) {


var Range = acequire("../range").Range;
function FoldLine(foldData, folds) {
    this.foldData = foldData;
    if (Array.isArray(folds)) {
        this.folds = folds;
    } else {
        folds = this.folds = [ folds ];
    }

    var last = folds[folds.length - 1]
    this.range = new Range(folds[0].start.row, folds[0].start.column,
                           last.end.row, last.end.column);
    this.start = this.range.start;
    this.end   = this.range.end;

    this.folds.forEach(function(fold) {
        fold.setFoldLine(this);
    }, this);
}

(function() {
    this.shiftRow = function(shift) {
        this.start.row += shift;
        this.end.row += shift;
        this.folds.forEach(function(fold) {
            fold.start.row += shift;
            fold.end.row += shift;
        });
    }

    this.addFold = function(fold) {
        if (fold.sameRow) {
            if (fold.start.row < this.startRow || fold.endRow > this.endRow) {
                throw "Can't add a fold to this FoldLine as it has no connection";
            }
            this.folds.push(fold);
            this.folds.sort(function(a, b) {
                return -a.range.compareEnd(b.start.row, b.start.column);
            });
            if (this.range.compareEnd(fold.start.row, fold.start.column) > 0) {
                this.end.row = fold.end.row;
                this.end.column =  fold.end.column;
            } else if (this.range.compareStart(fold.end.row, fold.end.column) < 0) {
                this.start.row = fold.start.row;
                this.start.column = fold.start.column;
            }
        } else if (fold.start.row == this.end.row) {
            this.folds.push(fold);
            this.end.row = fold.end.row;
            this.end.column = fold.end.column;
        } else if (fold.end.row == this.start.row) {
            this.folds.unshift(fold);
            this.start.row = fold.start.row;
            this.start.column = fold.start.column;
        } else {
            throw "Trying to add fold to FoldRow that doesn't have a matching row";
        }
        fold.foldLine = this;
    }

    this.containsRow = function(row) {
        return row >= this.start.row && row <= this.end.row;
    }

    this.walk = function(callback, endRow, endColumn) {
        var lastEnd = 0,
            folds = this.folds,
            fold,
            comp, stop, isNewRow = true;

        if (endRow == null) {
            endRow = this.end.row;
            endColumn = this.end.column;
        }

        for (var i = 0; i < folds.length; i++) {
            fold = folds[i];

            comp = fold.range.compareStart(endRow, endColumn);
            if (comp == -1) {
                callback(null, endRow, endColumn, lastEnd, isNewRow);
                return;
            }

            stop = callback(null, fold.start.row, fold.start.column, lastEnd, isNewRow);
            stop = !stop && callback(fold.placeholder, fold.start.row, fold.start.column, lastEnd);
            if (stop || comp == 0) {
                return;
            }
            isNewRow = !fold.sameRow;
            lastEnd = fold.end.column;
        }
        callback(null, endRow, endColumn, lastEnd, isNewRow);
    }

    this.getNextFoldTo = function(row, column) {
        var fold, cmp;
        for (var i = 0; i < this.folds.length; i++) {
            fold = this.folds[i];
            cmp = fold.range.compareEnd(row, column);
            if (cmp == -1) {
                return {
                    fold: fold,
                    kind: "after"
                };
            } else if (cmp == 0) {
                return {
                    fold: fold,
                    kind: "inside"
                }
            }
        }
        return null;
    }

    this.addRemoveChars = function(row, column, len) {
        var ret = this.getNextFoldTo(row, column),
            fold, folds;
        if (ret) {
            fold = ret.fold;
            if (ret.kind == "inside"
                && fold.start.column != column
                && fold.start.row != row)
            {
                window.console && window.console.log(row, column, fold);
            } else if (fold.start.row == row) {
                folds = this.folds;
                var i = folds.indexOf(fold);
                if (i == 0) {
                    this.start.column += len;
                }
                for (i; i < folds.length; i++) {
                    fold = folds[i];
                    fold.start.column += len;
                    if (!fold.sameRow) {
                        return;
                    }
                    fold.end.column += len;
                }
                this.end.column += len;
            }
        }
    }

    this.split = function(row, column) {
        var fold = this.getNextFoldTo(row, column).fold;
        var folds = this.folds;
        var foldData = this.foldData;

        if (!fold)
            return null;

        var i = folds.indexOf(fold);
        var foldBefore = folds[i - 1];
        this.end.row = foldBefore.end.row;
        this.end.column = foldBefore.end.column;
        folds = folds.splice(i, folds.length - i);

        var newFoldLine = new FoldLine(foldData, folds);
        foldData.splice(foldData.indexOf(this) + 1, 0, newFoldLine);
        return newFoldLine;
    }

    this.merge = function(foldLineNext) {
        var folds = foldLineNext.folds;
        for (var i = 0; i < folds.length; i++) {
            this.addFold(folds[i]);
        }
        var foldData = this.foldData;
        foldData.splice(foldData.indexOf(foldLineNext), 1);
    }

    this.toString = function() {
        var ret = [this.range.toString() + ": [" ];

        this.folds.forEach(function(fold) {
            ret.push("  " + fold.toString());
        });
        ret.push("]")
        return ret.join("\n");
    }

    this.idxToPosition = function(idx) {
        var lastFoldEndColumn = 0;
        var fold;

        for (var i = 0; i < this.folds.length; i++) {
            var fold = this.folds[i];

            idx -= fold.start.column - lastFoldEndColumn;
            if (idx < 0) {
                return {
                    row: fold.start.row,
                    column: fold.start.column + idx
                };
            }

            idx -= fold.placeholder.length;
            if (idx < 0) {
                return fold.start;
            }

            lastFoldEndColumn = fold.end.column;
        }

        return {
            row: this.end.row,
            column: this.end.column + idx
        };
    }
}).call(FoldLine.prototype);

exports.FoldLine = FoldLine;
});

ace.define('ace/edit_session/fold', ["require", 'exports', 'module' , 'ace/range', 'ace/range_list', 'ace/lib/oop'], function(acequire, exports, module) {


var Range = acequire("../range").Range;
var RangeList = acequire("../range_list").RangeList;
var oop = acequire("../lib/oop")
var Fold = exports.Fold = function(range, placeholder) {
    this.foldLine = null;
    this.placeholder = placeholder;
    this.range = range;
    this.start = range.start;
    this.end = range.end;

    this.sameRow = range.start.row == range.end.row;
    this.subFolds = this.ranges = [];
};

oop.inherits(Fold, RangeList);

(function() {

    this.toString = function() {
        return '"' + this.placeholder + '" ' + this.range.toString();
    };

    this.setFoldLine = function(foldLine) {
        this.foldLine = foldLine;
        this.subFolds.forEach(function(fold) {
            fold.setFoldLine(foldLine);
        });
    };

    this.clone = function() {
        var range = this.range.clone();
        var fold = new Fold(range, this.placeholder);
        this.subFolds.forEach(function(subFold) {
            fold.subFolds.push(subFold.clone());
        });
        fold.collapseChildren = this.collapseChildren;
        return fold;
    };

    this.addSubFold = function(fold) {
        if (this.range.isEqual(fold))
            return;

        if (!this.range.containsRange(fold))
            throw "A fold can't intersect already existing fold" + fold.range + this.range;
        consumeRange(fold, this.start);

        var row = fold.start.row, column = fold.start.column;
        for (var i = 0, cmp = -1; i < this.subFolds.length; i++) {
            cmp = this.subFolds[i].range.compare(row, column);
            if (cmp != 1)
                break;
        }
        var afterStart = this.subFolds[i];

        if (cmp == 0)
            return afterStart.addSubFold(fold);
        var row = fold.range.end.row, column = fold.range.end.column;
        for (var j = i, cmp = -1; j < this.subFolds.length; j++) {
            cmp = this.subFolds[j].range.compare(row, column);
            if (cmp != 1)
                break;
        }
        var afterEnd = this.subFolds[j];

        if (cmp == 0)
            throw "A fold can't intersect already existing fold" + fold.range + this.range;

        var consumedFolds = this.subFolds.splice(i, j - i, fold);
        fold.setFoldLine(this.foldLine);

        return fold;
    };
    
    this.restoreRange = function(range) {
        return restoreRange(range, this.start);
    };

}).call(Fold.prototype);

function consumePoint(point, anchor) {
    point.row -= anchor.row;
    if (point.row == 0)
        point.column -= anchor.column;
}
function consumeRange(range, anchor) {
    consumePoint(range.start, anchor);
    consumePoint(range.end, anchor);
}
function restorePoint(point, anchor) {
    if (point.row == 0)
        point.column += anchor.column;
    point.row += anchor.row;
}
function restoreRange(range, anchor) {
    restorePoint(range.start, anchor);
    restorePoint(range.end, anchor);
}

});

ace.define('ace/range_list', ["require", 'exports', 'module' , 'ace/range'], function(acequire, exports, module) {

var Range = acequire("./range").Range;
var comparePoints = Range.comparePoints;

var RangeList = function() {
    this.ranges = [];
};

(function() {
    this.comparePoints = comparePoints;

    this.pointIndex = function(pos, excludeEdges, startIndex) {
        var list = this.ranges;

        for (var i = startIndex || 0; i < list.length; i++) {
            var range = list[i];
            var cmpEnd = comparePoints(pos, range.end);
            if (cmpEnd > 0)
                continue;
            var cmpStart = comparePoints(pos, range.start);
            if (cmpEnd === 0)
                return excludeEdges && cmpStart !== 0 ? -i-2 : i;
            if (cmpStart > 0 || (cmpStart === 0 && !excludeEdges))
                return i;

            return -i-1;
        }
        return -i - 1;
    };

    this.add = function(range) {
        var excludeEdges = !range.isEmpty();
        var startIndex = this.pointIndex(range.start, excludeEdges);
        if (startIndex < 0)
            startIndex = -startIndex - 1;

        var endIndex = this.pointIndex(range.end, excludeEdges, startIndex);

        if (endIndex < 0)
            endIndex = -endIndex - 1;
        else
            endIndex++;
        return this.ranges.splice(startIndex, endIndex - startIndex, range);
    };

    this.addList = function(list) {
        var removed = [];
        for (var i = list.length; i--; ) {
            removed.push.call(removed, this.add(list[i]));
        }
        return removed;
    };

    this.substractPoint = function(pos) {
        var i = this.pointIndex(pos);

        if (i >= 0)
            return this.ranges.splice(i, 1);
    };
    this.merge = function() {
        var removed = [];
        var list = this.ranges;
        
        list = list.sort(function(a, b) {
            return comparePoints(a.start, b.start);
        });
        
        var next = list[0], range;
        for (var i = 1; i < list.length; i++) {
            range = next;
            next = list[i];
            var cmp = comparePoints(range.end, next.start);
            if (cmp < 0)
                continue;

            if (cmp == 0 && !range.isEmpty() && !next.isEmpty())
                continue;

            if (comparePoints(range.end, next.end) < 0) {
                range.end.row = next.end.row;
                range.end.column = next.end.column;
            }

            list.splice(i, 1);
            removed.push(next);
            next = range;
            i--;
        }
        
        this.ranges = list;

        return removed;
    };

    this.contains = function(row, column) {
        return this.pointIndex({row: row, column: column}) >= 0;
    };

    this.containsPoint = function(pos) {
        return this.pointIndex(pos) >= 0;
    };

    this.rangeAtPoint = function(pos) {
        var i = this.pointIndex(pos);
        if (i >= 0)
            return this.ranges[i];
    };


    this.clipRows = function(startRow, endRow) {
        var list = this.ranges;
        if (list[0].start.row > endRow || list[list.length - 1].start.row < startRow)
            return [];

        var startIndex = this.pointIndex({row: startRow, column: 0});
        if (startIndex < 0)
            startIndex = -startIndex - 1;
        var endIndex = this.pointIndex({row: endRow, column: 0}, startIndex);
        if (endIndex < 0)
            endIndex = -endIndex - 1;

        var clipped = [];
        for (var i = startIndex; i < endIndex; i++) {
            clipped.push(list[i]);
        }
        return clipped;
    };

    this.removeAll = function() {
        return this.ranges.splice(0, this.ranges.length);
    };

    this.attach = function(session) {
        if (this.session)
            this.detach();

        this.session = session;
        this.onChange = this.$onChange.bind(this);

        this.session.on('change', this.onChange);
    };

    this.detach = function() {
        if (!this.session)
            return;
        this.session.removeListener('change', this.onChange);
        this.session = null;
    };

    this.$onChange = function(e) {
        var changeRange = e.data.range;
        if (e.data.action[0] == "i"){
            var start = changeRange.start;
            var end = changeRange.end;
        } else {
            var end = changeRange.start;
            var start = changeRange.end;
        }
        var startRow = start.row;
        var endRow = end.row;
        var lineDif = endRow - startRow;

        var colDiff = -start.column + end.column;
        var ranges = this.ranges;

        for (var i = 0, n = ranges.length; i < n; i++) {
            var r = ranges[i];
            if (r.end.row < startRow)
                continue;
            if (r.start.row > startRow)
                break;

            if (r.start.row == startRow && r.start.column >= start.column ) {
                
                r.start.column += colDiff;
                r.start.row += lineDif;
            }
            if (r.end.row == startRow && r.end.column >= start.column) {
                if (r.end.column == start.column && colDiff > 0 && i < n - 1) {                
                    if (r.end.column > r.start.column && r.end.column == ranges[i+1].start.column)
                        r.end.column -= colDiff;
                }
                r.end.column += colDiff;
                r.end.row += lineDif;
            }
        }

        if (lineDif != 0 && i < n) {
            for (; i < n; i++) {
                var r = ranges[i];
                r.start.row += lineDif;
                r.end.row += lineDif;
            }
        }
    };

}).call(RangeList.prototype);

exports.RangeList = RangeList;
});

ace.define('ace/token_iterator', ["require", 'exports', 'module' ], function(acequire, exports, module) {
var TokenIterator = function(session, initialRow, initialColumn) {
    this.$session = session;
    this.$row = initialRow;
    this.$rowTokens = session.getTokens(initialRow);

    var token = session.getTokenAt(initialRow, initialColumn);
    this.$tokenIndex = token ? token.index : -1;
};

(function() { 
    this.stepBackward = function() {
        this.$tokenIndex -= 1;
        
        while (this.$tokenIndex < 0) {
            this.$row -= 1;
            if (this.$row < 0) {
                this.$row = 0;
                return null;
            }
                
            this.$rowTokens = this.$session.getTokens(this.$row);
            this.$tokenIndex = this.$rowTokens.length - 1;
        }
            
        return this.$rowTokens[this.$tokenIndex];
    };   
    this.stepForward = function() {
        this.$tokenIndex += 1;
        var rowCount;
        while (this.$tokenIndex >= this.$rowTokens.length) {
            this.$row += 1;
            if (!rowCount)
                rowCount = this.$session.getLength();
            if (this.$row >= rowCount) {
                this.$row = rowCount - 1;
                return null;
            }

            this.$rowTokens = this.$session.getTokens(this.$row);
            this.$tokenIndex = 0;
        }
            
        return this.$rowTokens[this.$tokenIndex];
    };      
    this.getCurrentToken = function () {
        return this.$rowTokens[this.$tokenIndex];
    };      
    this.getCurrentTokenRow = function () {
        return this.$row;
    };     
    this.getCurrentTokenColumn = function() {
        var rowTokens = this.$rowTokens;
        var tokenIndex = this.$tokenIndex;
        var column = rowTokens[tokenIndex].start;
        if (column !== undefined)
            return column;
            
        column = 0;
        while (tokenIndex > 0) {
            tokenIndex -= 1;
            column += rowTokens[tokenIndex].value.length;
        }
        
        return column;  
    };
            
}).call(TokenIterator.prototype);

exports.TokenIterator = TokenIterator;
});

ace.define('ace/edit_session/bracket_match', ["require", 'exports', 'module' , 'ace/token_iterator', 'ace/range'], function(acequire, exports, module) {


var TokenIterator = acequire("../token_iterator").TokenIterator;
var Range = acequire("../range").Range;


function BracketMatch() {

    this.findMatchingBracket = function(position, chr) {
        if (position.column == 0) return null;

        var charBeforeCursor = chr || this.getLine(position.row).charAt(position.column-1);
        if (charBeforeCursor == "") return null;

        var match = charBeforeCursor.match(/([\(\[\{])|([\)\]\}])/);
        if (!match)
            return null;

        if (match[1])
            return this.$findClosingBracket(match[1], position);
        else
            return this.$findOpeningBracket(match[2], position);
    };
    
    this.getBracketRange = function(pos) {
        var line = this.getLine(pos.row);
        var before = true, range;

        var chr = line.charAt(pos.column-1);
        var match = chr && chr.match(/([\(\[\{])|([\)\]\}])/);
        if (!match) {
            chr = line.charAt(pos.column);
            pos = {row: pos.row, column: pos.column + 1};
            match = chr && chr.match(/([\(\[\{])|([\)\]\}])/);
            before = false;
        }
        if (!match)
            return null;

        if (match[1]) {
            var bracketPos = this.$findClosingBracket(match[1], pos);
            if (!bracketPos)
                return null;
            range = Range.fromPoints(pos, bracketPos);
            if (!before) {
                range.end.column++;
                range.start.column--;
            }
            range.cursor = range.end;
        } else {
            var bracketPos = this.$findOpeningBracket(match[2], pos);
            if (!bracketPos)
                return null;
            range = Range.fromPoints(bracketPos, pos);
            if (!before) {
                range.start.column++;
                range.end.column--;
            }
            range.cursor = range.start;
        }
        
        return range;
    };

    this.$brackets = {
        ")": "(",
        "(": ")",
        "]": "[",
        "[": "]",
        "{": "}",
        "}": "{"
    };

    this.$findOpeningBracket = function(bracket, position, typeRe) {
        var openBracket = this.$brackets[bracket];
        var depth = 1;

        var iterator = new TokenIterator(this, position.row, position.column);
        var token = iterator.getCurrentToken();
        if (!token)
            token = iterator.stepForward();
        if (!token)
            return;
        
         if (!typeRe){
            typeRe = new RegExp(
                "(\\.?" +
                token.type.replace(".", "\\.").replace("rparen", ".paren")
                + ")+"
            );
        }
        var valueIndex = position.column - iterator.getCurrentTokenColumn() - 2;
        var value = token.value;
        
        while (true) {
        
            while (valueIndex >= 0) {
                var chr = value.charAt(valueIndex);
                if (chr == openBracket) {
                    depth -= 1;
                    if (depth == 0) {
                        return {row: iterator.getCurrentTokenRow(),
                            column: valueIndex + iterator.getCurrentTokenColumn()};
                    }
                }
                else if (chr == bracket) {
                    depth += 1;
                }
                valueIndex -= 1;
            }
            do {
                token = iterator.stepBackward();
            } while (token && !typeRe.test(token.type));

            if (token == null)
                break;
                
            value = token.value;
            valueIndex = value.length - 1;
        }
        
        return null;
    };

    this.$findClosingBracket = function(bracket, position, typeRe) {
        var closingBracket = this.$brackets[bracket];
        var depth = 1;

        var iterator = new TokenIterator(this, position.row, position.column);
        var token = iterator.getCurrentToken();
        if (!token)
            token = iterator.stepForward();
        if (!token)
            return;

        if (!typeRe){
            typeRe = new RegExp(
                "(\\.?" +
                token.type.replace(".", "\\.").replace("lparen", ".paren")
                + ")+"
            );
        }
        var valueIndex = position.column - iterator.getCurrentTokenColumn();

        while (true) {

            var value = token.value;
            var valueLength = value.length;
            while (valueIndex < valueLength) {
                var chr = value.charAt(valueIndex);
                if (chr == closingBracket) {
                    depth -= 1;
                    if (depth == 0) {
                        return {row: iterator.getCurrentTokenRow(),
                            column: valueIndex + iterator.getCurrentTokenColumn()};
                    }
                }
                else if (chr == bracket) {
                    depth += 1;
                }
                valueIndex += 1;
            }
            do {
                token = iterator.stepForward();
            } while (token && !typeRe.test(token.type));

            if (token == null)
                break;

            valueIndex = 0;
        }
        
        return null;
    };
}
exports.BracketMatch = BracketMatch;

});

ace.define('ace/search', ["require", 'exports', 'module' , 'ace/lib/lang', 'ace/lib/oop', 'ace/range'], function(acequire, exports, module) {


var lang = acequire("./lib/lang");
var oop = acequire("./lib/oop");
var Range = acequire("./range").Range;

var Search = function() {
    this.$options = {};
};

(function() {
    this.set = function(options) {
        oop.mixin(this.$options, options);
        return this;
    };
    this.getOptions = function() {
        return lang.copyObject(this.$options);
    };
    this.setOptions = function(options) {
        this.$options = options;
    };
    this.find = function(session) {
        var iterator = this.$matchIterator(session, this.$options);

        if (!iterator)
            return false;

        var firstRange = null;
        iterator.forEach(function(range, row, offset) {
            if (!range.start) {
                var column = range.offset + (offset || 0);
                firstRange = new Range(row, column, row, column+range.length);
            } else
                firstRange = range;
            return true;
        });

        return firstRange;
    };
    this.findAll = function(session) {
        var options = this.$options;
        if (!options.needle)
            return [];
        this.$assembleRegExp(options);

        var range = options.range;
        var lines = range
            ? session.getLines(range.start.row, range.end.row)
            : session.doc.getAllLines();

        var ranges = [];
        var re = options.re;
        if (options.$isMultiLine) {
            var len = re.length;
            var maxRow = lines.length - len;
            for (var row = re.offset || 0; row <= maxRow; row++) {
                for (var j = 0; j < len; j++)
                    if (lines[row + j].search(re[j]) == -1)
                        break;
                
                var startLine = lines[row];
                var line = lines[row + len - 1];
                var startIndex = startLine.match(re[0])[0].length;
                var endIndex = line.match(re[len - 1])[0].length;

                ranges.push(new Range(
                    row, startLine.length - startIndex,
                    row + len - 1, endIndex
                ));
            }
        } else {
            for (var i = 0; i < lines.length; i++) {
                var matches = lang.getMatchOffsets(lines[i], re);
                for (var j = 0; j < matches.length; j++) {
                    var match = matches[j];
                    ranges.push(new Range(i, match.offset, i, match.offset + match.length));
                }
            }
        }

        if (range) {
            var startColumn = range.start.column;
            var endColumn = range.start.column;
            var i = 0, j = ranges.length - 1;
            while (i < j && ranges[i].start.column < startColumn && ranges[i].start.row == range.start.row)
                i++;

            while (i < j && ranges[j].end.column > endColumn && ranges[j].end.row == range.end.row)
                j--;
            return ranges.slice(i, j + 1);
        }

        return ranges;
    };
    this.replace = function(input, replacement) {
        var options = this.$options;

        var re = this.$assembleRegExp(options);
        if (options.$isMultiLine)
            return replacement;

        if (!re)
            return;

        var match = re.exec(input);
        if (!match || match[0].length != input.length)
            return null;
        
        replacement = input.replace(re, replacement);
        if (options.preserveCase) {
            replacement = replacement.split("");
            for (var i = Math.min(input.length, input.length); i--; ) {
                var ch = input[i];
                if (ch && ch.toLowerCase() != ch)
                    replacement[i] = replacement[i].toUpperCase();
                else
                    replacement[i] = replacement[i].toLowerCase();
            }
            replacement = replacement.join("");
        }
        
        return replacement;
    };

    this.$matchIterator = function(session, options) {
        var re = this.$assembleRegExp(options);
        if (!re)
            return false;

        var self = this, callback, backwards = options.backwards;

        if (options.$isMultiLine) {
            var len = re.length;
            var matchIterator = function(line, row, offset) {
                var startIndex = line.search(re[0]);
                if (startIndex == -1)
                    return;
                for (var i = 1; i < len; i++) {
                    line = session.getLine(row + i);
                    if (line.search(re[i]) == -1)
                        return;
                }

                var endIndex = line.match(re[len - 1])[0].length;

                var range = new Range(row, startIndex, row + len - 1, endIndex);
                if (re.offset == 1) {
                    range.start.row--;
                    range.start.column = Number.MAX_VALUE;
                } else if (offset)
                    range.start.column += offset;

                if (callback(range))
                    return true;
            };
        } else if (backwards) {
            var matchIterator = function(line, row, startIndex) {
                var matches = lang.getMatchOffsets(line, re);
                for (var i = matches.length-1; i >= 0; i--)
                    if (callback(matches[i], row, startIndex))
                        return true;
            };
        } else {
            var matchIterator = function(line, row, startIndex) {
                var matches = lang.getMatchOffsets(line, re);
                for (var i = 0; i < matches.length; i++)
                    if (callback(matches[i], row, startIndex))
                        return true;
            };
        }

        return {
            forEach: function(_callback) {
                callback = _callback;
                self.$lineIterator(session, options).forEach(matchIterator);
            }
        };
    };

    this.$assembleRegExp = function(options) {
        if (options.needle instanceof RegExp)
            return options.re = options.needle;

        var needle = options.needle;

        if (!options.needle)
            return options.re = false;

        if (!options.regExp)
            needle = lang.escapeRegExp(needle);

        if (options.wholeWord)
            needle = "\\b" + needle + "\\b";

        var modifier = options.caseSensitive ? "g" : "gi";

        options.$isMultiLine = /[\n\r]/.test(needle);
        if (options.$isMultiLine)
            return options.re = this.$assembleMultilineRegExp(needle, modifier);

        try {
            var re = new RegExp(needle, modifier);
        } catch(e) {
            re = false;
        }
        return options.re = re;
    };

    this.$assembleMultilineRegExp = function(needle, modifier) {
        var parts = needle.replace(/\r\n|\r|\n/g, "$\n^").split("\n");
        var re = [];
        for (var i = 0; i < parts.length; i++) try {
            re.push(new RegExp(parts[i], modifier));
        } catch(e) {
            return false;
        }
        if (parts[0] == "") {
            re.shift();
            re.offset = 1;
        } else {
            re.offset = 0;
        }
        return re;
    };

    this.$lineIterator = function(session, options) {
        var backwards = options.backwards == true;
        var skipCurrent = options.skipCurrent != false;

        var range = options.range;
        var start = options.start;
        if (!start)
            start = range ? range[backwards ? "end" : "start"] : session.selection.getRange();
         
        if (start.start)
            start = start[skipCurrent != backwards ? "end" : "start"];

        var firstRow = range ? range.start.row : 0;
        var lastRow = range ? range.end.row : session.getLength() - 1;

        var forEach = backwards ? function(callback) {
                var row = start.row;

                var line = session.getLine(row).substring(0, start.column);
                if (callback(line, row))
                    return;

                for (row--; row >= firstRow; row--)
                    if (callback(session.getLine(row), row))
                        return;

                if (options.wrap == false)
                    return;

                for (row = lastRow, firstRow = start.row; row >= firstRow; row--)
                    if (callback(session.getLine(row), row))
                        return;
            } : function(callback) {
                var row = start.row;

                var line = session.getLine(row).substr(start.column);
                if (callback(line, row, start.column))
                    return;

                for (row = row+1; row <= lastRow; row++)
                    if (callback(session.getLine(row), row))
                        return;

                if (options.wrap == false)
                    return;

                for (row = firstRow, lastRow = start.row; row <= lastRow; row++)
                    if (callback(session.getLine(row), row))
                        return;
            };
        
        return {forEach: forEach};
    };

}).call(Search.prototype);

exports.Search = Search;
});
ace.define('ace/commands/command_manager', ["require", 'exports', 'module' , 'ace/lib/oop', 'ace/keyboard/hash_handler', 'ace/lib/event_emitter'], function(acequire, exports, module) {


var oop = acequire("../lib/oop");
var HashHandler = acequire("../keyboard/hash_handler").HashHandler;
var EventEmitter = acequire("../lib/event_emitter").EventEmitter;

var CommandManager = function(platform, commands) {
    this.platform = platform;
    this.commands = this.byName = {};
    this.commmandKeyBinding = {};

    this.addCommands(commands);

    this.setDefaultHandler("exec", function(e) {
        return e.command.exec(e.editor, e.args || {});
    });
};

oop.inherits(CommandManager, HashHandler);

(function() {

    oop.implement(this, EventEmitter);

    this.exec = function(command, editor, args) {
        if (typeof command === 'string')
            command = this.commands[command];

        if (!command)
            return false;

        if (editor && editor.$readOnly && !command.readOnly)
            return false;

        var e = {editor: editor, command: command, args: args};
        var retvalue = this._emit("exec", e);
        this._signal("afterExec", e);

        return retvalue === false ? false : true;
    };

    this.toggleRecording = function(editor) {
        if (this.$inReplay)
            return;

        editor && editor._emit("changeStatus");
        if (this.recording) {
            this.macro.pop();
            this.removeEventListener("exec", this.$addCommandToMacro);

            if (!this.macro.length)
                this.macro = this.oldMacro;

            return this.recording = false;
        }
        if (!this.$addCommandToMacro) {
            this.$addCommandToMacro = function(e) {
                this.macro.push([e.command, e.args]);
            }.bind(this);
        }

        this.oldMacro = this.macro;
        this.macro = [];
        this.on("exec", this.$addCommandToMacro);
        return this.recording = true;
    };

    this.replay = function(editor) {
        if (this.$inReplay || !this.macro)
            return;

        if (this.recording)
            return this.toggleRecording(editor);

        try {
            this.$inReplay = true;
            this.macro.forEach(function(x) {
                if (typeof x == "string")
                    this.exec(x, editor);
                else
                    this.exec(x[0], editor, x[1]);
            }, this);
        } finally {
            this.$inReplay = false;
        }
    };

    this.trimMacro = function(m) {
        return m.map(function(x){
            if (typeof x[0] != "string")
                x[0] = x[0].name;
            if (!x[1])
                x = x[0];
            return x;
        });
    };

}).call(CommandManager.prototype);

exports.CommandManager = CommandManager;

});

ace.define('ace/keyboard/hash_handler', ["require", 'exports', 'module' , 'ace/lib/keys', 'ace/lib/useragent'], function(acequire, exports, module) {


var keyUtil = acequire("../lib/keys");
var useragent = acequire("../lib/useragent");

function HashHandler(config, platform) {
    this.platform = platform || (useragent.isMac ? "mac" : "win");
    this.commands = {};
    this.commmandKeyBinding = {};

    this.addCommands(config);
};

(function() {

    this.addCommand = function(command) {
        if (this.commands[command.name])
            this.removeCommand(command);

        this.commands[command.name] = command;

        if (command.bindKey)
            this._buildKeyHash(command);
    };

    this.removeCommand = function(command) {
        var name = (typeof command === 'string' ? command : command.name);
        command = this.commands[name];
        delete this.commands[name];
        var ckb = this.commmandKeyBinding;
        for (var hashId in ckb) {
            for (var key in ckb[hashId]) {
                if (ckb[hashId][key] == command)
                    delete ckb[hashId][key];
            }
        }
    };

    this.bindKey = function(key, command) {
        if(!key)
            return;
        if (typeof command == "function") {
            this.addCommand({exec: command, bindKey: key, name: command.name || key});
            return;
        }

        var ckb = this.commmandKeyBinding;
        key.split("|").forEach(function(keyPart) {
            var binding = this.parseKeys(keyPart, command);
            var hashId = binding.hashId;
            (ckb[hashId] || (ckb[hashId] = {}))[binding.key] = command;
        }, this);
    };

    this.addCommands = function(commands) {
        commands && Object.keys(commands).forEach(function(name) {
            var command = commands[name];
            if (typeof command === "string")
                return this.bindKey(command, name);

            if (typeof command === "function")
                command = { exec: command };

            if (!command.name)
                command.name = name;

            this.addCommand(command);
        }, this);
    };

    this.removeCommands = function(commands) {
        Object.keys(commands).forEach(function(name) {
            this.removeCommand(commands[name]);
        }, this);
    };

    this.bindKeys = function(keyList) {
        Object.keys(keyList).forEach(function(key) {
            this.bindKey(key, keyList[key]);
        }, this);
    };

    this._buildKeyHash = function(command) {
        var binding = command.bindKey;
        if (!binding)
            return;

        var key = typeof binding == "string" ? binding: binding[this.platform];
        this.bindKey(key, command);
    };
    this.parseKeys = function(keys) {
        if (keys.indexOf(" ") != -1)
            keys = keys.split(/\s+/).pop();

        var parts = keys.toLowerCase().split(/[\-\+]([\-\+])?/).filter(function(x){return x});
        var key = parts.pop();

        var keyCode = keyUtil[key];
        if (keyUtil.FUNCTION_KEYS[keyCode])
            key = keyUtil.FUNCTION_KEYS[keyCode].toLowerCase();
        else if (!parts.length)
            return {key: key, hashId: -1};
        else if (parts.length == 1 && parts[0] == "shift")
            return {key: key.toUpperCase(), hashId: -1};

        var hashId = 0;
        for (var i = parts.length; i--;) {
            var modifier = keyUtil.KEY_MODS[parts[i]];
            if (modifier == null) {
                if (typeof console != "undefined")
                console.error("invalid modifier " + parts[i] + " in " + keys);
                return false;
            }
            hashId |= modifier;
        }
        return {key: key, hashId: hashId};
    };

    this.findKeyCommand = function findKeyCommand(hashId, keyString) {
        var ckbr = this.commmandKeyBinding;
        return ckbr[hashId] && ckbr[hashId][keyString];
    };

    this.handleKeyboard = function(data, hashId, keyString, keyCode) {
        return {
            command: this.findKeyCommand(hashId, keyString)
        };
    };

}).call(HashHandler.prototype)

exports.HashHandler = HashHandler;
});

ace.define('ace/commands/default_commands', ["require", 'exports', 'module' , 'ace/lib/lang', 'ace/config'], function(acequire, exports, module) {


var lang = acequire("../lib/lang");
var config = acequire("../config");

function bindKey(win, mac) {
    return {
        win: win,
        mac: mac
    };
}

exports.commands = [{
    name: "selectall",
    bindKey: bindKey("Ctrl-A", "Command-A"),
    exec: function(editor) { editor.selectAll(); },
    readOnly: true
}, {
    name: "centerselection",
    bindKey: bindKey(null, "Ctrl-L"),
    exec: function(editor) { editor.centerSelection(); },
    readOnly: true
}, {
    name: "gotoline",
    bindKey: bindKey("Ctrl-L", "Command-L"),
    exec: function(editor) {
        var line = parseInt(prompt("Enter line number:"), 10);
        if (!isNaN(line)) {
            editor.gotoLine(line);
        }
    },
    readOnly: true
}, {
    name: "fold",
    bindKey: bindKey("Alt-L|Ctrl-F1", "Command-Alt-L|Command-F1"),
    exec: function(editor) { editor.session.toggleFold(false); },
    readOnly: true
}, {
    name: "unfold",
    bindKey: bindKey("Alt-Shift-L|Ctrl-Shift-F1", "Command-Alt-Shift-L|Command-Shift-F1"),
    exec: function(editor) { editor.session.toggleFold(true); },
    readOnly: true
}, {
    name: "foldall",
    bindKey: bindKey("Alt-0", "Command-Option-0"),
    exec: function(editor) { editor.session.foldAll(); },
    readOnly: true
}, {
    name: "unfoldall",
    bindKey: bindKey("Alt-Shift-0", "Command-Option-Shift-0"),
    exec: function(editor) { editor.session.unfold(); },
    readOnly: true
}, {
    name: "findnext",
    bindKey: bindKey("Ctrl-K", "Command-G"),
    exec: function(editor) { editor.findNext(); },
    readOnly: true
}, {
    name: "findprevious",
    bindKey: bindKey("Ctrl-Shift-K", "Command-Shift-G"),
    exec: function(editor) { editor.findPrevious(); },
    readOnly: true
}, {
    name: "find",
    bindKey: bindKey("Ctrl-F", "Command-F"),
    exec: function(editor) {
        config.loadModule("ace/ext/searchbox", function(e) {e.Search(editor)});
    },
    readOnly: true
}, {
    name: "overwrite",
    bindKey: "Insert",
    exec: function(editor) { editor.toggleOverwrite(); },
    readOnly: true
}, {
    name: "selecttostart",
    bindKey: bindKey("Ctrl-Shift-Home", "Command-Shift-Up"),
    exec: function(editor) { editor.getSelection().selectFileStart(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "gotostart",
    bindKey: bindKey("Ctrl-Home", "Command-Home|Command-Up"),
    exec: function(editor) { editor.navigateFileStart(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selectup",
    bindKey: bindKey("Shift-Up", "Shift-Up"),
    exec: function(editor) { editor.getSelection().selectUp(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "golineup",
    bindKey: bindKey("Up", "Up|Ctrl-P"),
    exec: function(editor, args) { editor.navigateUp(args.times); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selecttoend",
    bindKey: bindKey("Ctrl-Shift-End", "Command-Shift-Down"),
    exec: function(editor) { editor.getSelection().selectFileEnd(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "gotoend",
    bindKey: bindKey("Ctrl-End", "Command-End|Command-Down"),
    exec: function(editor) { editor.navigateFileEnd(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selectdown",
    bindKey: bindKey("Shift-Down", "Shift-Down"),
    exec: function(editor) { editor.getSelection().selectDown(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "golinedown",
    bindKey: bindKey("Down", "Down|Ctrl-N"),
    exec: function(editor, args) { editor.navigateDown(args.times); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selectwordleft",
    bindKey: bindKey("Ctrl-Shift-Left", "Option-Shift-Left"),
    exec: function(editor) { editor.getSelection().selectWordLeft(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "gotowordleft",
    bindKey: bindKey("Ctrl-Left", "Option-Left"),
    exec: function(editor) { editor.navigateWordLeft(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selecttolinestart",
    bindKey: bindKey("Alt-Shift-Left", "Command-Shift-Left"),
    exec: function(editor) { editor.getSelection().selectLineStart(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "gotolinestart",
    bindKey: bindKey("Alt-Left|Home", "Command-Left|Home|Ctrl-A"),
    exec: function(editor) { editor.navigateLineStart(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selectleft",
    bindKey: bindKey("Shift-Left", "Shift-Left"),
    exec: function(editor) { editor.getSelection().selectLeft(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "gotoleft",
    bindKey: bindKey("Left", "Left|Ctrl-B"),
    exec: function(editor, args) { editor.navigateLeft(args.times); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selectwordright",
    bindKey: bindKey("Ctrl-Shift-Right", "Option-Shift-Right"),
    exec: function(editor) { editor.getSelection().selectWordRight(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "gotowordright",
    bindKey: bindKey("Ctrl-Right", "Option-Right"),
    exec: function(editor) { editor.navigateWordRight(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selecttolineend",
    bindKey: bindKey("Alt-Shift-Right", "Command-Shift-Right"),
    exec: function(editor) { editor.getSelection().selectLineEnd(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "gotolineend",
    bindKey: bindKey("Alt-Right|End", "Command-Right|End|Ctrl-E"),
    exec: function(editor) { editor.navigateLineEnd(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selectright",
    bindKey: bindKey("Shift-Right", "Shift-Right"),
    exec: function(editor) { editor.getSelection().selectRight(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "gotoright",
    bindKey: bindKey("Right", "Right|Ctrl-F"),
    exec: function(editor, args) { editor.navigateRight(args.times); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selectpagedown",
    bindKey: "Shift-PageDown",
    exec: function(editor) { editor.selectPageDown(); },
    readOnly: true
}, {
    name: "pagedown",
    bindKey: bindKey(null, "Option-PageDown"),
    exec: function(editor) { editor.scrollPageDown(); },
    readOnly: true
}, {
    name: "gotopagedown",
    bindKey: bindKey("PageDown", "PageDown|Ctrl-V"),
    exec: function(editor) { editor.gotoPageDown(); },
    readOnly: true
}, {
    name: "selectpageup",
    bindKey: "Shift-PageUp",
    exec: function(editor) { editor.selectPageUp(); },
    readOnly: true
}, {
    name: "pageup",
    bindKey: bindKey(null, "Option-PageUp"),
    exec: function(editor) { editor.scrollPageUp(); },
    readOnly: true
}, {
    name: "gotopageup",
    bindKey: "PageUp",
    exec: function(editor) { editor.gotoPageUp(); },
    readOnly: true
}, {
    name: "scrollup",
    bindKey: bindKey("Ctrl-Up", null),
    exec: function(e) { e.renderer.scrollBy(0, -2 * e.renderer.layerConfig.lineHeight); },
    readOnly: true
}, {
    name: "scrolldown",
    bindKey: bindKey("Ctrl-Down", null),
    exec: function(e) { e.renderer.scrollBy(0, 2 * e.renderer.layerConfig.lineHeight); },
    readOnly: true
}, {
    name: "selectlinestart",
    bindKey: "Shift-Home",
    exec: function(editor) { editor.getSelection().selectLineStart(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selectlineend",
    bindKey: "Shift-End",
    exec: function(editor) { editor.getSelection().selectLineEnd(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "togglerecording",
    bindKey: bindKey("Ctrl-Alt-E", "Command-Option-E"),
    exec: function(editor) { editor.commands.toggleRecording(editor); },
    readOnly: true
}, {
    name: "replaymacro",
    bindKey: bindKey("Ctrl-Shift-E", "Command-Shift-E"),
    exec: function(editor) { editor.commands.replay(editor); },
    readOnly: true
}, {
    name: "jumptomatching",
    bindKey: bindKey("Ctrl-P", "Ctrl-Shift-P"),
    exec: function(editor) { editor.jumpToMatching(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selecttomatching",
    bindKey: bindKey("Ctrl-Shift-P", null),
    exec: function(editor) { editor.jumpToMatching(true); },
    multiSelectAction: "forEach",
    readOnly: true
}, 
{
    name: "cut",
    exec: function(editor) {
        var range = editor.getSelectionRange();
        editor._emit("cut", range);

        if (!editor.selection.isEmpty()) {
            editor.session.remove(range);
            editor.clearSelection();
        }
    },
    multiSelectAction: "forEach"
}, {
    name: "removeline",
    bindKey: bindKey("Ctrl-D", "Command-D"),
    exec: function(editor) { editor.removeLines(); },
    multiSelectAction: "forEachLine"
}, {
    name: "duplicateSelection",
    bindKey: bindKey("Ctrl-Shift-D", "Command-Shift-D"),
    exec: function(editor) { editor.duplicateSelection(); },
    multiSelectAction: "forEach"
}, {
    name: "sortlines",
    bindKey: bindKey("Ctrl-Alt-S", "Command-Alt-S"),
    exec: function(editor) { editor.sortLines(); },
    multiSelectAction: "forEachLine"
}, {
    name: "togglecomment",
    bindKey: bindKey("Ctrl-/", "Command-/"),
    exec: function(editor) { editor.toggleCommentLines(); },
    multiSelectAction: "forEachLine"
}, {
    name: "modifyNumberUp",
    bindKey: bindKey("Ctrl-Shift-Up", "Alt-Shift-Up"),
    exec: function(editor) { editor.modifyNumber(1); },
    multiSelectAction: "forEach"
}, {
    name: "modifyNumberDown",
    bindKey: bindKey("Ctrl-Shift-Down", "Alt-Shift-Down"),
    exec: function(editor) { editor.modifyNumber(-1); },
    multiSelectAction: "forEach"
}, {
    name: "replace",
    bindKey: bindKey("Ctrl-H", "Command-Option-F"),
    exec: function(editor) {
        config.loadModule("ace/ext/searchbox", function(e) {e.Search(editor, true)});
    }
}, {
    name: "undo",
    bindKey: bindKey("Ctrl-Z", "Command-Z"),
    exec: function(editor) { editor.undo(); }
}, {
    name: "redo",
    bindKey: bindKey("Ctrl-Shift-Z|Ctrl-Y", "Command-Shift-Z|Command-Y"),
    exec: function(editor) { editor.redo(); }
}, {
    name: "copylinesup",
    bindKey: bindKey("Alt-Shift-Up", "Command-Option-Up"),
    exec: function(editor) { editor.copyLinesUp(); }
}, {
    name: "movelinesup",
    bindKey: bindKey("Alt-Up", "Option-Up"),
    exec: function(editor) { editor.moveLinesUp(); }
}, {
    name: "copylinesdown",
    bindKey: bindKey("Alt-Shift-Down", "Command-Option-Down"),
    exec: function(editor) { editor.copyLinesDown(); }
}, {
    name: "movelinesdown",
    bindKey: bindKey("Alt-Down", "Option-Down"),
    exec: function(editor) { editor.moveLinesDown(); }
}, {
    name: "del",
    bindKey: bindKey("Delete", "Delete|Ctrl-D"),
    exec: function(editor) { editor.remove("right"); },
    multiSelectAction: "forEach"
}, {
    name: "backspace",
    bindKey: bindKey(
        "Command-Backspace|Option-Backspace|Shift-Backspace|Backspace",
        "Ctrl-Backspace|Command-Backspace|Shift-Backspace|Backspace|Ctrl-H"
    ),
    exec: function(editor) { editor.remove("left"); },
    multiSelectAction: "forEach"
}, {
    name: "removetolinestart",
    bindKey: bindKey("Alt-Backspace", "Command-Backspace"),
    exec: function(editor) { editor.removeToLineStart(); },
    multiSelectAction: "forEach"
}, {
    name: "removetolineend",
    bindKey: bindKey("Alt-Delete", "Ctrl-K"),
    exec: function(editor) { editor.removeToLineEnd(); },
    multiSelectAction: "forEach"
}, {
    name: "removewordleft",
    bindKey: bindKey("Ctrl-Backspace", "Alt-Backspace|Ctrl-Alt-Backspace"),
    exec: function(editor) { editor.removeWordLeft(); },
    multiSelectAction: "forEach"
}, {
    name: "removewordright",
    bindKey: bindKey("Ctrl-Delete", "Alt-Delete"),
    exec: function(editor) { editor.removeWordRight(); },
    multiSelectAction: "forEach"
}, {
    name: "outdent",
    bindKey: bindKey("Shift-Tab", "Shift-Tab"),
    exec: function(editor) { editor.blockOutdent(); },
    multiSelectAction: "forEach"
}, {
    name: "indent",
    bindKey: bindKey("Tab", "Tab"),
    exec: function(editor) { editor.indent(); },
    multiSelectAction: "forEach"
},{
    name: "blockoutdent",
    bindKey: bindKey("Ctrl-[", "Ctrl-["),
    exec: function(editor) { editor.blockOutdent(); },
    multiSelectAction: "forEachLine"
},{
    name: "blockindent",
    bindKey: bindKey("Ctrl-]", "Ctrl-]"),
    exec: function(editor) { editor.blockIndent(); },
    multiSelectAction: "forEachLine"
}, {
    name: "insertstring",
    exec: function(editor, str) { editor.insert(str); },
    multiSelectAction: "forEach"
}, {
    name: "inserttext",
    exec: function(editor, args) {
        editor.insert(lang.stringRepeat(args.text  || "", args.times || 1));
    },
    multiSelectAction: "forEach"
}, {
    name: "splitline",
    bindKey: bindKey(null, "Ctrl-O"),
    exec: function(editor) { editor.splitLine(); },
    multiSelectAction: "forEach"
}, {
    name: "transposeletters",
    bindKey: bindKey("Ctrl-T", "Ctrl-T"),
    exec: function(editor) { editor.transposeLetters(); },
    multiSelectAction: function(editor) {editor.transposeSelections(1); }
}, {
    name: "touppercase",
    bindKey: bindKey("Ctrl-U", "Ctrl-U"),
    exec: function(editor) { editor.toUpperCase(); },
    multiSelectAction: "forEach"
}, {
    name: "tolowercase",
    bindKey: bindKey("Ctrl-Shift-U", "Ctrl-Shift-U"),
    exec: function(editor) { editor.toLowerCase(); },
    multiSelectAction: "forEach"
}];

});

ace.define('ace/undomanager', ["require", 'exports', 'module' ], function(acequire, exports, module) {
var UndoManager = function() {
    this.reset();
};

(function() {
    this.execute = function(options) {
        var deltas = options.args[0];
        this.$doc  = options.args[1];
        this.$undoStack.push(deltas);
        this.$redoStack = [];
    };
    this.undo = function(dontSelect) {
        var deltas = this.$undoStack.pop();
        var undoSelectionRange = null;
        if (deltas) {
            undoSelectionRange =
                this.$doc.undoChanges(deltas, dontSelect);
            this.$redoStack.push(deltas);
        }
        return undoSelectionRange;
    };
    this.redo = function(dontSelect) {
        var deltas = this.$redoStack.pop();
        var redoSelectionRange = null;
        if (deltas) {
            redoSelectionRange =
                this.$doc.redoChanges(deltas, dontSelect);
            this.$undoStack.push(deltas);
        }
        return redoSelectionRange;
    };
    this.reset = function() {
        this.$undoStack = [];
        this.$redoStack = [];
    };
    this.hasUndo = function() {
        return this.$undoStack.length > 0;
    };
    this.hasRedo = function() {
        return this.$redoStack.length > 0;
    };

}).call(UndoManager.prototype);

exports.UndoManager = UndoManager;
});

ace.define('ace/virtual_renderer', ["require", 'exports', 'module' , 'ace/lib/oop', 'ace/lib/dom', 'ace/lib/event', 'ace/lib/useragent', 'ace/config', 'ace/layer/gutter', 'ace/layer/marker', 'ace/layer/text', 'ace/layer/cursor', 'ace/scrollbar', 'ace/renderloop', 'ace/lib/event_emitter'], function(acequire, exports, module) {


var oop = acequire("./lib/oop");
var dom = acequire("./lib/dom");
var event = acequire("./lib/event");
var useragent = acequire("./lib/useragent");
var config = acequire("./config");
var GutterLayer = acequire("./layer/gutter").Gutter;
var MarkerLayer = acequire("./layer/marker").Marker;
var TextLayer = acequire("./layer/text").Text;
var CursorLayer = acequire("./layer/cursor").Cursor;
var ScrollBar = acequire("./scrollbar").ScrollBar;
var RenderLoop = acequire("./renderloop").RenderLoop;
var EventEmitter = acequire("./lib/event_emitter").EventEmitter;
var editorCss = ".ace_editor {\
position: relative;\
overflow: hidden;\
font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;\
font-size: 12px;\
line-height: normal;\
}\
.ace_scroller {\
position: absolute;\
overflow: hidden;\
top: 0;\
bottom: 0;\
}\
.ace_content {\
position: absolute;\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
cursor: text;\
}\
.ace_gutter {\
position: absolute;\
overflow : hidden;\
width: auto;\
top: 0;\
bottom: 0;\
left: 0;\
cursor: default;\
z-index: 4;\
}\
.ace_gutter-active-line {\
position: absolute;\
left: 0;\
right: 0;\
}\
.ace_scroller.ace_scroll-left {\
box-shadow: 17px 0 16px -16px rgba(0, 0, 0, 0.4) inset;\
}\
.ace_gutter-cell {\
padding-left: 19px;\
padding-right: 6px;\
background-repeat: no-repeat;\
}\
.ace_gutter-cell.ace_error {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QUM2OEZDQTQ4RTU0MTFFMUEzM0VFRTM2RUY1M0RBMjYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QUM2OEZDQTU4RTU0MTFFMUEzM0VFRTM2RUY1M0RBMjYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpBQzY4RkNBMjhFNTQxMUUxQTMzRUVFMzZFRjUzREEyNiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpBQzY4RkNBMzhFNTQxMUUxQTMzRUVFMzZFRjUzREEyNiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PkgXxbAAAAJbSURBVHjapFNNaBNBFH4zs5vdZLP5sQmNpT82QY209heh1ioWisaDRcSKF0WKJ0GQnrzrxasHsR6EnlrwD0TagxJabaVEpFYxLWlLSS822tr87m66ccfd2GKyVhA6MMybgfe97/vmPUQphd0sZjto9XIn9OOsvlu2nkqRzVU+6vvlzPf8W6bk8dxQ0NPbxAALgCgg2JkaQuhzQau/El0zbmUA7U0Es8v2CiYmKQJHGO1QICCLoqilMhkmurDAyapKgqItezi/USRdJqEYY4D5jCy03ht2yMkkvL91jTTX10qzyyu2hruPRN7jgbH+EOsXcMLgYiThEgAMhABW85oqy1DXdRIdvP1AHJ2acQXvDIrVHcdQNrEKNYSVMSZGMjEzIIAwDXIo+6G/FxcGnzkC3T2oMhLjre49sBB+RRcHLqdafK6sYdE/GGBwU1VpFNj0aN8pJbe+BkZyevUrvLl6Xmm0W9IuTc0DxrDNAJd5oEvI/KRsNC3bQyNjPO9yQ1YHcfj2QvfQc/5TUhJTBc2iM0U7AWDQtc1nJHvD/cfO2s7jaGkiTEfa/Ep8coLu7zmNmh8+dc5lZDuUeFAGUNA/OY6JVaypQ0vjr7XYjUvJM37vt+j1vuTK5DgVfVUoTjVe+y3/LxMxY2GgU+CSLy4cpfsYorRXuXIOi0Vt40h67uZFTdIo6nLaZcwUJWAzwNS0tBnqqKzQDnjdG/iPyZxo46HaKUpbvYkj8qYRTZsBhge+JHhZyh0x9b95JqjVJkT084kZIPwu/mPWqPgfQ5jXh2+92Ay7HedfAgwA6KDWafb4w3cAAAAASUVORK5CYII=\");\
background-repeat: no-repeat;\
background-position: 2px center;\
}\
.ace_gutter-cell.ace_warning {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QUM2OEZDQTg4RTU0MTFFMUEzM0VFRTM2RUY1M0RBMjYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QUM2OEZDQTk4RTU0MTFFMUEzM0VFRTM2RUY1M0RBMjYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpBQzY4RkNBNjhFNTQxMUUxQTMzRUVFMzZFRjUzREEyNiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpBQzY4RkNBNzhFNTQxMUUxQTMzRUVFMzZFRjUzREEyNiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pgd7PfIAAAGmSURBVHjaYvr//z8DJZiJgUIANoCRkREb9gLiSVAaQx4OQM7AAkwd7XU2/v++/rOttdYGEB9dASEvOMydGKfH8Gv/p4XTkvRBfLxeQAP+1cUhXopyvzhP7P/IoSj7g7Mw09cNKO6J1QQ0L4gICPIv/veg/8W+JdFvQNLHVsW9/nmn9zk7B+cCkDwhL7gt6knSZnx9/LuCEOcvkIAMP+cvto9nfqyZmmUAksfnBUtbM60gX/3/kgyv3/xSFOL5DZT+L8vP+Yfh5cvfPvp/xUHyQHXGyAYwgpwBjZYFT3Y1OEl/OfCH4ffv3wzc4iwMvNIsDJ+f/mH4+vIPAxsb631WW0Yln6ZpQLXdMK/DXGDflh+sIv37EivD5x//Gb7+YWT4y86sl7BCCkSD+Z++/1dkvsFRl+HnD1Rvje4F8whjMXmGj58YGf5zsDMwcnAwfPvKcml62DsQDeaDxN+/Y0qwlpEHqrdB94IRNIDUgfgfKJChGK4OikEW3gTiXUB950ASLFAF54AC94A0G9QAfOnmF9DCDzABFqS08IHYDIScdijOjQABBgC+/9awBH96jwAAAABJRU5ErkJggg==\");\
background-position: 2px center;\
}\
.ace_gutter-cell.ace_info {\
background-image: url(\"data:image/gif;base64,R0lGODlhEAAQAMQAAAAAAEFBQVJSUl5eXmRkZGtra39/f4WFhYmJiZGRkaampry8vMPDw8zMzNXV1dzc3OTk5Orq6vDw8P///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABQALAAAAAAQABAAAAUuICWOZGmeaBml5XGwFCQSBGyXRSAwtqQIiRuiwIM5BoYVbEFIyGCQoeJGrVptIQA7\");\
background-position: 2px center;\
}\
.ace_dark .ace_gutter-cell.ace_info {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpGRTk5MTVGREIxNDkxMUUxOTc5Q0FFREQyMTNGMjBFQyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpGRTk5MTVGRUIxNDkxMUUxOTc5Q0FFREQyMTNGMjBFQyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkZFOTkxNUZCQjE0OTExRTE5NzlDQUVERDIxM0YyMEVDIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkZFOTkxNUZDQjE0OTExRTE5NzlDQUVERDIxM0YyMEVDIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+SIDkjAAAAJ1JREFUeNpi/P//PwMlgImBQkB7A6qrq/+DMC55FkIGKCoq4pVnpFkgTp069f/+/fv/r1u37r+tre1/kg0A+ptn9uzZYLaRkRHpLvjw4cNXWVlZhufPnzOcO3eOdAO0tbVPAjHDmzdvGA4fPsxIsgGSkpJmv379Ynj37h2DjIyMCMkG3LhxQ/T27dsMampqDHZ2dq/pH41DxwCAAAMAFdc68dUsFZgAAAAASUVORK5CYII=\");\
}\
.ace_scrollbar {\
position: absolute;\
overflow-x: hidden;\
overflow-y: scroll;\
right: 0;\
top: 0;\
bottom: 0;\
}\
.ace_scrollbar-inner {\
position: absolute;\
width: 1px;\
left: 0;\
}\
.ace_print-margin {\
position: absolute;\
height: 100%;\
}\
.ace_text-input {\
position: absolute;\
z-index: 0;\
width: 0.5em;\
height: 1em;\
opacity: 0;\
background: transparent;\
-moz-appearance: none;\
appearance: none;\
border: none;\
resize: none;\
outline: none;\
overflow: hidden;\
font: inherit;\
padding: 0 1px;\
margin: 0 -1px;\
}\
.ace_text-input.ace_composition {\
background: #f8f8f8;\
color: #111;\
z-index: 1000;\
opacity: 1;\
}\
.ace_layer {\
z-index: 1;\
position: absolute;\
overflow: hidden;\
white-space: nowrap;\
height: 100%;\
width: 100%;\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
/* setting pointer-events: auto; on node under the mouse, which changes\
during scroll, will break mouse wheel scrolling in Safari */\
pointer-events: none;\
}\
.ace_gutter-layer {\
position: relative;\
width: auto;\
text-align: right;\
pointer-events: auto;\
}\
.ace_text-layer {\
color: black;\
font: inherit !important;\
}\
.ace_cjk {\
display: inline-block;\
text-align: center;\
}\
.ace_cursor-layer {\
z-index: 4;\
}\
.ace_cursor {\
z-index: 4;\
position: absolute;\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
}\
.ace_hidden-cursors .ace_cursor {\
opacity: 0.2;\
}\
.ace_smooth-blinking .ace_cursor {\
-moz-transition: opacity 0.18s;\
-webkit-transition: opacity 0.18s;\
-o-transition: opacity 0.18s;\
-ms-transition: opacity 0.18s;\
transition: opacity 0.18s;\
}\
.ace_cursor[style*=\"opacity: 0\"]{\
-ms-filter: \"progid:DXImageTransform.Microsoft.Alpha(Opacity=0)\";\
}\
.ace_editor.ace_multiselect .ace_cursor {\
border-left-width: 1px;\
}\
.ace_line {\
white-space: nowrap;\
}\
.ace_marker-layer .ace_step {\
position: absolute;\
z-index: 3;\
}\
.ace_marker-layer .ace_selection {\
position: absolute;\
z-index: 5;\
}\
.ace_marker-layer .ace_bracket {\
position: absolute;\
z-index: 6;\
}\
.ace_marker-layer .ace_active-line {\
position: absolute;\
z-index: 2;\
}\
.ace_marker-layer .ace_selected-word {\
position: absolute;\
z-index: 4;\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
}\
.ace_line .ace_fold {\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
display: inline-block;\
height: 11px;\
margin-top: -2px;\
vertical-align: middle;\
background-image:\
url(\"data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%11%00%00%00%09%08%06%00%00%00%D4%E8%C7%0C%00%00%03%1EiCCPICC%20Profile%00%00x%01%85T%DFk%D3P%14%FE%DAe%9D%B0%E1%8B%3Ag%11%09%3Eh%91ndStC%9C%B6kW%BA%CDZ%EA6%B7!H%9B%A6m%5C%9A%C6%24%ED~%B0%07%D9%8Bo%3A%C5w%F1%07%3E%F9%07%0C%D9%83o%7B%92%0D%C6%14a%F8%AC%88%22L%F6%22%B3%9E%9B4M'S%03%B9%F7%BB%DF%F9%EE9'%E7%E4%5E%A0%F9qZ%D3%14%2F%0F%14USO%C5%C2%FC%C4%E4%14%DF%F2%01%5E%1CC%2B%FChM%8B%86%16J%26G%40%0F%D3%B2y%EF%B3%F3%0E%1E%C6lt%EEo%DF%AB%FEc%D5%9A%95%0C%11%F0%1C%20%BE%945%C4%22%E1Y%A0i%5C%D4t%13%E0%D6%89%EF%9D15%C2%CDLsX%A7%04%09%1Fg8oc%81%E1%8C%8D%23%96f45%40%9A%09%C2%07%C5B%3AK%B8%408%98i%E0%F3%0D%D8%CE%81%14%E4'%26%A9%92.%8B%3C%ABER%2F%E5dE%B2%0C%F6%F0%1Fs%83%F2_%B0%A8%94%E9%9B%AD%E7%10%8Dm%9A%19N%D1%7C%8A%DE%1F9%7Dp%8C%E6%00%D5%C1%3F_%18%BDA%B8%9DpX6%E3%A35~B%CD%24%AE%11%26%BD%E7%EEti%98%EDe%9A%97Y)%12%25%1C%24%BCbT%AE3li%E6%0B%03%89%9A%E6%D3%ED%F4P%92%B0%9F4%BF43Y%F3%E3%EDP%95%04%EB1%C5%F5%F6KF%F4%BA%BD%D7%DB%91%93%07%E35%3E%A7)%D6%7F%40%FE%BD%F7%F5r%8A%E5y%92%F0%EB%B4%1E%8D%D5%F4%5B%92%3AV%DB%DB%E4%CD%A6%23%C3%C4wQ%3F%03HB%82%8E%1Cd(%E0%91B%0Ca%9Ac%C4%AA%F8L%16%19%22J%A4%D2itTy%B28%D6%3B(%93%96%ED%1CGx%C9_%0E%B8%5E%16%F5%5B%B2%B8%F6%E0%FB%9E%DD%25%D7%8E%BC%15%85%C5%B7%A3%D8Q%ED%B5%81%E9%BA%B2%13%9A%1B%7Fua%A5%A3n%E17%B9%E5%9B%1Bm%AB%0B%08Q%FE%8A%E5%B1H%5Ee%CAO%82Q%D7u6%E6%90S%97%FCu%0B%CF2%94%EE%25v%12X%0C%BA%AC%F0%5E%F8*l%0AO%85%17%C2%97%BF%D4%C8%CE%DE%AD%11%CB%80q%2C%3E%AB%9ES%CD%C6%EC%25%D2L%D2%EBd%B8%BF%8A%F5B%C6%18%F9%901CZ%9D%BE%24M%9C%8A9%F2%DAP%0B'%06w%82%EB%E6%E2%5C%2F%D7%07%9E%BB%CC%5D%E1%FA%B9%08%AD.r%23%8E%C2%17%F5E%7C!%F0%BE3%BE%3E_%B7o%88a%A7%DB%BE%D3d%EB%A31Z%EB%BB%D3%91%BA%A2%B1z%94%8F%DB'%F6%3D%8E%AA%13%19%B2%B1%BE%B1~V%08%2B%B4%A2cjJ%B3tO%00%03%25mN%97%F3%05%93%EF%11%84%0B%7C%88%AE-%89%8F%ABbW%90O%2B%0Ao%99%0C%5E%97%0CI%AFH%D9.%B0%3B%8F%ED%03%B6S%D6%5D%E6i_s9%F3*p%E9%1B%FD%C3%EB.7U%06%5E%19%C0%D1s.%17%A03u%E4%09%B0%7C%5E%2C%EB%15%DB%1F%3C%9E%B7%80%91%3B%DBc%AD%3Dma%BA%8B%3EV%AB%DBt.%5B%1E%01%BB%0F%AB%D5%9F%CF%AA%D5%DD%E7%E4%7F%0Bx%A3%FC%06%A9%23%0A%D6%C2%A1_2%00%00%00%09pHYs%00%00%0B%13%00%00%0B%13%01%00%9A%9C%18%00%00%00%B5IDAT(%15%A5%91%3D%0E%02!%10%85ac%E1%05%D6%CE%D6%C6%CE%D2%E8%ED%CD%DE%C0%C6%D6N.%E0V%F8%3D%9Ca%891XH%C2%BE%D9y%3F%90!%E6%9C%C3%BFk%E5%011%C6-%F5%C8N%04%DF%BD%FF%89%DFt%83DN%60%3E%F3%AB%A0%DE%1A%5Dg%BE%10Q%97%1B%40%9C%A8o%10%8F%5E%828%B4%1B%60%87%F6%02%26%85%1Ch%1E%C1%2B%5Bk%FF%86%EE%B7j%09%9A%DA%9B%ACe%A3%F9%EC%DA!9%B4%D5%A6%81%86%86%98%CC%3C%5B%40%FA%81%B3%E9%CB%23%94%C16Azo%05%D4%E1%C1%95a%3B%8A'%A0%E8%CC%17%22%85%1D%BA%00%A2%FA%DC%0A%94%D1%D1%8D%8B%3A%84%17B%C7%60%1A%25Z%FC%8D%00%00%00%00IEND%AEB%60%82\"),\
url(\"data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%05%00%00%007%08%06%00%00%00%C4%DD%80C%00%00%03%1EiCCPICC%20Profile%00%00x%01%85T%DFk%D3P%14%FE%DAe%9D%B0%E1%8B%3Ag%11%09%3Eh%91ndStC%9C%B6kW%BA%CDZ%EA6%B7!H%9B%A6m%5C%9A%C6%24%ED~%B0%07%D9%8Bo%3A%C5w%F1%07%3E%F9%07%0C%D9%83o%7B%92%0D%C6%14a%F8%AC%88%22L%F6%22%B3%9E%9B4M'S%03%B9%F7%BB%DF%F9%EE9'%E7%E4%5E%A0%F9qZ%D3%14%2F%0F%14USO%C5%C2%FC%C4%E4%14%DF%F2%01%5E%1CC%2B%FChM%8B%86%16J%26G%40%0F%D3%B2y%EF%B3%F3%0E%1E%C6lt%EEo%DF%AB%FEc%D5%9A%95%0C%11%F0%1C%20%BE%945%C4%22%E1Y%A0i%5C%D4t%13%E0%D6%89%EF%9D15%C2%CDLsX%A7%04%09%1Fg8oc%81%E1%8C%8D%23%96f45%40%9A%09%C2%07%C5B%3AK%B8%408%98i%E0%F3%0D%D8%CE%81%14%E4'%26%A9%92.%8B%3C%ABER%2F%E5dE%B2%0C%F6%F0%1Fs%83%F2_%B0%A8%94%E9%9B%AD%E7%10%8Dm%9A%19N%D1%7C%8A%DE%1F9%7Dp%8C%E6%00%D5%C1%3F_%18%BDA%B8%9DpX6%E3%A35~B%CD%24%AE%11%26%BD%E7%EEti%98%EDe%9A%97Y)%12%25%1C%24%BCbT%AE3li%E6%0B%03%89%9A%E6%D3%ED%F4P%92%B0%9F4%BF43Y%F3%E3%EDP%95%04%EB1%C5%F5%F6KF%F4%BA%BD%D7%DB%91%93%07%E35%3E%A7)%D6%7F%40%FE%BD%F7%F5r%8A%E5y%92%F0%EB%B4%1E%8D%D5%F4%5B%92%3AV%DB%DB%E4%CD%A6%23%C3%C4wQ%3F%03HB%82%8E%1Cd(%E0%91B%0Ca%9Ac%C4%AA%F8L%16%19%22J%A4%D2itTy%B28%D6%3B(%93%96%ED%1CGx%C9_%0E%B8%5E%16%F5%5B%B2%B8%F6%E0%FB%9E%DD%25%D7%8E%BC%15%85%C5%B7%A3%D8Q%ED%B5%81%E9%BA%B2%13%9A%1B%7Fua%A5%A3n%E17%B9%E5%9B%1Bm%AB%0B%08Q%FE%8A%E5%B1H%5Ee%CAO%82Q%D7u6%E6%90S%97%FCu%0B%CF2%94%EE%25v%12X%0C%BA%AC%F0%5E%F8*l%0AO%85%17%C2%97%BF%D4%C8%CE%DE%AD%11%CB%80q%2C%3E%AB%9ES%CD%C6%EC%25%D2L%D2%EBd%B8%BF%8A%F5B%C6%18%F9%901CZ%9D%BE%24M%9C%8A9%F2%DAP%0B'%06w%82%EB%E6%E2%5C%2F%D7%07%9E%BB%CC%5D%E1%FA%B9%08%AD.r%23%8E%C2%17%F5E%7C!%F0%BE3%BE%3E_%B7o%88a%A7%DB%BE%D3d%EB%A31Z%EB%BB%D3%91%BA%A2%B1z%94%8F%DB'%F6%3D%8E%AA%13%19%B2%B1%BE%B1~V%08%2B%B4%A2cjJ%B3tO%00%03%25mN%97%F3%05%93%EF%11%84%0B%7C%88%AE-%89%8F%ABbW%90O%2B%0Ao%99%0C%5E%97%0CI%AFH%D9.%B0%3B%8F%ED%03%B6S%D6%5D%E6i_s9%F3*p%E9%1B%FD%C3%EB.7U%06%5E%19%C0%D1s.%17%A03u%E4%09%B0%7C%5E%2C%EB%15%DB%1F%3C%9E%B7%80%91%3B%DBc%AD%3Dma%BA%8B%3EV%AB%DBt.%5B%1E%01%BB%0F%AB%D5%9F%CF%AA%D5%DD%E7%E4%7F%0Bx%A3%FC%06%A9%23%0A%D6%C2%A1_2%00%00%00%09pHYs%00%00%0B%13%00%00%0B%13%01%00%9A%9C%18%00%00%00%3AIDAT8%11c%FC%FF%FF%7F%18%03%1A%60%01%F2%3F%A0%891%80%04%FF%11-%F8%17%9BJ%E2%05%B1ZD%81v%26t%E7%80%F8%A3%82h%A12%1A%20%A3%01%02%0F%01%BA%25%06%00%19%C0%0D%AEF%D5%3ES%00%00%00%00IEND%AEB%60%82\");\
background-repeat: no-repeat, repeat-x;\
background-position: center center, top left;\
color: transparent;\
border: 1px solid black;\
-moz-border-radius: 2px;\
-webkit-border-radius: 2px;\
border-radius: 2px;\
cursor: pointer;\
pointer-events: auto;\
}\
.ace_dark .ace_fold {\
}\
.ace_fold:hover{\
background-image:\
url(\"data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%11%00%00%00%09%08%06%00%00%00%D4%E8%C7%0C%00%00%03%1EiCCPICC%20Profile%00%00x%01%85T%DFk%D3P%14%FE%DAe%9D%B0%E1%8B%3Ag%11%09%3Eh%91ndStC%9C%B6kW%BA%CDZ%EA6%B7!H%9B%A6m%5C%9A%C6%24%ED~%B0%07%D9%8Bo%3A%C5w%F1%07%3E%F9%07%0C%D9%83o%7B%92%0D%C6%14a%F8%AC%88%22L%F6%22%B3%9E%9B4M'S%03%B9%F7%BB%DF%F9%EE9'%E7%E4%5E%A0%F9qZ%D3%14%2F%0F%14USO%C5%C2%FC%C4%E4%14%DF%F2%01%5E%1CC%2B%FChM%8B%86%16J%26G%40%0F%D3%B2y%EF%B3%F3%0E%1E%C6lt%EEo%DF%AB%FEc%D5%9A%95%0C%11%F0%1C%20%BE%945%C4%22%E1Y%A0i%5C%D4t%13%E0%D6%89%EF%9D15%C2%CDLsX%A7%04%09%1Fg8oc%81%E1%8C%8D%23%96f45%40%9A%09%C2%07%C5B%3AK%B8%408%98i%E0%F3%0D%D8%CE%81%14%E4'%26%A9%92.%8B%3C%ABER%2F%E5dE%B2%0C%F6%F0%1Fs%83%F2_%B0%A8%94%E9%9B%AD%E7%10%8Dm%9A%19N%D1%7C%8A%DE%1F9%7Dp%8C%E6%00%D5%C1%3F_%18%BDA%B8%9DpX6%E3%A35~B%CD%24%AE%11%26%BD%E7%EEti%98%EDe%9A%97Y)%12%25%1C%24%BCbT%AE3li%E6%0B%03%89%9A%E6%D3%ED%F4P%92%B0%9F4%BF43Y%F3%E3%EDP%95%04%EB1%C5%F5%F6KF%F4%BA%BD%D7%DB%91%93%07%E35%3E%A7)%D6%7F%40%FE%BD%F7%F5r%8A%E5y%92%F0%EB%B4%1E%8D%D5%F4%5B%92%3AV%DB%DB%E4%CD%A6%23%C3%C4wQ%3F%03HB%82%8E%1Cd(%E0%91B%0Ca%9Ac%C4%AA%F8L%16%19%22J%A4%D2itTy%B28%D6%3B(%93%96%ED%1CGx%C9_%0E%B8%5E%16%F5%5B%B2%B8%F6%E0%FB%9E%DD%25%D7%8E%BC%15%85%C5%B7%A3%D8Q%ED%B5%81%E9%BA%B2%13%9A%1B%7Fua%A5%A3n%E17%B9%E5%9B%1Bm%AB%0B%08Q%FE%8A%E5%B1H%5Ee%CAO%82Q%D7u6%E6%90S%97%FCu%0B%CF2%94%EE%25v%12X%0C%BA%AC%F0%5E%F8*l%0AO%85%17%C2%97%BF%D4%C8%CE%DE%AD%11%CB%80q%2C%3E%AB%9ES%CD%C6%EC%25%D2L%D2%EBd%B8%BF%8A%F5B%C6%18%F9%901CZ%9D%BE%24M%9C%8A9%F2%DAP%0B'%06w%82%EB%E6%E2%5C%2F%D7%07%9E%BB%CC%5D%E1%FA%B9%08%AD.r%23%8E%C2%17%F5E%7C!%F0%BE3%BE%3E_%B7o%88a%A7%DB%BE%D3d%EB%A31Z%EB%BB%D3%91%BA%A2%B1z%94%8F%DB'%F6%3D%8E%AA%13%19%B2%B1%BE%B1~V%08%2B%B4%A2cjJ%B3tO%00%03%25mN%97%F3%05%93%EF%11%84%0B%7C%88%AE-%89%8F%ABbW%90O%2B%0Ao%99%0C%5E%97%0CI%AFH%D9.%B0%3B%8F%ED%03%B6S%D6%5D%E6i_s9%F3*p%E9%1B%FD%C3%EB.7U%06%5E%19%C0%D1s.%17%A03u%E4%09%B0%7C%5E%2C%EB%15%DB%1F%3C%9E%B7%80%91%3B%DBc%AD%3Dma%BA%8B%3EV%AB%DBt.%5B%1E%01%BB%0F%AB%D5%9F%CF%AA%D5%DD%E7%E4%7F%0Bx%A3%FC%06%A9%23%0A%D6%C2%A1_2%00%00%00%09pHYs%00%00%0B%13%00%00%0B%13%01%00%9A%9C%18%00%00%00%B5IDAT(%15%A5%91%3D%0E%02!%10%85ac%E1%05%D6%CE%D6%C6%CE%D2%E8%ED%CD%DE%C0%C6%D6N.%E0V%F8%3D%9Ca%891XH%C2%BE%D9y%3F%90!%E6%9C%C3%BFk%E5%011%C6-%F5%C8N%04%DF%BD%FF%89%DFt%83DN%60%3E%F3%AB%A0%DE%1A%5Dg%BE%10Q%97%1B%40%9C%A8o%10%8F%5E%828%B4%1B%60%87%F6%02%26%85%1Ch%1E%C1%2B%5Bk%FF%86%EE%B7j%09%9A%DA%9B%ACe%A3%F9%EC%DA!9%B4%D5%A6%81%86%86%98%CC%3C%5B%40%FA%81%B3%E9%CB%23%94%C16Azo%05%D4%E1%C1%95a%3B%8A'%A0%E8%CC%17%22%85%1D%BA%00%A2%FA%DC%0A%94%D1%D1%8D%8B%3A%84%17B%C7%60%1A%25Z%FC%8D%00%00%00%00IEND%AEB%60%82\"),\
url(\"data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%05%00%00%007%08%06%00%00%00%C4%DD%80C%00%00%03%1EiCCPICC%20Profile%00%00x%01%85T%DFk%D3P%14%FE%DAe%9D%B0%E1%8B%3Ag%11%09%3Eh%91ndStC%9C%B6kW%BA%CDZ%EA6%B7!H%9B%A6m%5C%9A%C6%24%ED~%B0%07%D9%8Bo%3A%C5w%F1%07%3E%F9%07%0C%D9%83o%7B%92%0D%C6%14a%F8%AC%88%22L%F6%22%B3%9E%9B4M'S%03%B9%F7%BB%DF%F9%EE9'%E7%E4%5E%A0%F9qZ%D3%14%2F%0F%14USO%C5%C2%FC%C4%E4%14%DF%F2%01%5E%1CC%2B%FChM%8B%86%16J%26G%40%0F%D3%B2y%EF%B3%F3%0E%1E%C6lt%EEo%DF%AB%FEc%D5%9A%95%0C%11%F0%1C%20%BE%945%C4%22%E1Y%A0i%5C%D4t%13%E0%D6%89%EF%9D15%C2%CDLsX%A7%04%09%1Fg8oc%81%E1%8C%8D%23%96f45%40%9A%09%C2%07%C5B%3AK%B8%408%98i%E0%F3%0D%D8%CE%81%14%E4'%26%A9%92.%8B%3C%ABER%2F%E5dE%B2%0C%F6%F0%1Fs%83%F2_%B0%A8%94%E9%9B%AD%E7%10%8Dm%9A%19N%D1%7C%8A%DE%1F9%7Dp%8C%E6%00%D5%C1%3F_%18%BDA%B8%9DpX6%E3%A35~B%CD%24%AE%11%26%BD%E7%EEti%98%EDe%9A%97Y)%12%25%1C%24%BCbT%AE3li%E6%0B%03%89%9A%E6%D3%ED%F4P%92%B0%9F4%BF43Y%F3%E3%EDP%95%04%EB1%C5%F5%F6KF%F4%BA%BD%D7%DB%91%93%07%E35%3E%A7)%D6%7F%40%FE%BD%F7%F5r%8A%E5y%92%F0%EB%B4%1E%8D%D5%F4%5B%92%3AV%DB%DB%E4%CD%A6%23%C3%C4wQ%3F%03HB%82%8E%1Cd(%E0%91B%0Ca%9Ac%C4%AA%F8L%16%19%22J%A4%D2itTy%B28%D6%3B(%93%96%ED%1CGx%C9_%0E%B8%5E%16%F5%5B%B2%B8%F6%E0%FB%9E%DD%25%D7%8E%BC%15%85%C5%B7%A3%D8Q%ED%B5%81%E9%BA%B2%13%9A%1B%7Fua%A5%A3n%E17%B9%E5%9B%1Bm%AB%0B%08Q%FE%8A%E5%B1H%5Ee%CAO%82Q%D7u6%E6%90S%97%FCu%0B%CF2%94%EE%25v%12X%0C%BA%AC%F0%5E%F8*l%0AO%85%17%C2%97%BF%D4%C8%CE%DE%AD%11%CB%80q%2C%3E%AB%9ES%CD%C6%EC%25%D2L%D2%EBd%B8%BF%8A%F5B%C6%18%F9%901CZ%9D%BE%24M%9C%8A9%F2%DAP%0B'%06w%82%EB%E6%E2%5C%2F%D7%07%9E%BB%CC%5D%E1%FA%B9%08%AD.r%23%8E%C2%17%F5E%7C!%F0%BE3%BE%3E_%B7o%88a%A7%DB%BE%D3d%EB%A31Z%EB%BB%D3%91%BA%A2%B1z%94%8F%DB'%F6%3D%8E%AA%13%19%B2%B1%BE%B1~V%08%2B%B4%A2cjJ%B3tO%00%03%25mN%97%F3%05%93%EF%11%84%0B%7C%88%AE-%89%8F%ABbW%90O%2B%0Ao%99%0C%5E%97%0CI%AFH%D9.%B0%3B%8F%ED%03%B6S%D6%5D%E6i_s9%F3*p%E9%1B%FD%C3%EB.7U%06%5E%19%C0%D1s.%17%A03u%E4%09%B0%7C%5E%2C%EB%15%DB%1F%3C%9E%B7%80%91%3B%DBc%AD%3Dma%BA%8B%3EV%AB%DBt.%5B%1E%01%BB%0F%AB%D5%9F%CF%AA%D5%DD%E7%E4%7F%0Bx%A3%FC%06%A9%23%0A%D6%C2%A1_2%00%00%00%09pHYs%00%00%0B%13%00%00%0B%13%01%00%9A%9C%18%00%00%003IDAT8%11c%FC%FF%FF%7F%3E%03%1A%60%01%F2%3F%A3%891%80%04%FFQ%26%F8w%C0%B43%A1%DB%0C%E2%8F%0A%A2%85%CAh%80%8C%06%08%3C%04%E8%96%18%00%A3S%0D%CD%CF%D8%C1%9D%00%00%00%00IEND%AEB%60%82\");\
background-repeat: no-repeat, repeat-x;\
background-position: center center, top left;\
}\
.ace_editor.ace_dragging .ace_content {\
cursor: move;\
}\
.ace_gutter-tooltip {\
background-color: #FFF;\
background-image: -webkit-linear-gradient(top, transparent, rgba(0, 0, 0, 0.1));\
background-image: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.1));\
border: 1px solid gray;\
border-radius: 1px;\
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);\
color: black;\
display: inline-block;\
max-width: 500px;\
padding: 4px;\
position: fixed;\
z-index: 300;\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
cursor: default;\
white-space: pre-line;\
word-wrap: break-word;\
line-height: normal;\
font-style: normal;\
font-weight: normal;\
letter-spacing: normal;\
}\
.ace_folding-enabled > .ace_gutter-cell {\
padding-right: 13px;\
}\
.ace_fold-widget {\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
margin: 0 -12px 0 1px;\
display: inline-block;\
width: 11px;\
vertical-align: top;\
background-image: url(\"data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%05%00%00%00%05%08%06%00%00%00%8Do%26%E5%00%00%004IDATx%DAe%8A%B1%0D%000%0C%C2%F2%2CK%96%BC%D0%8F9%81%88H%E9%D0%0E%96%C0%10%92%3E%02%80%5E%82%E4%A9*-%EEsw%C8%CC%11%EE%96w%D8%DC%E9*Eh%0C%151(%00%00%00%00IEND%AEB%60%82\");\
background-repeat: no-repeat;\
background-position: center;\
border-radius: 3px;\
border: 1px solid transparent;\
}\
.ace_fold-widget.ace_end {\
background-image: url(\"data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%05%00%00%00%05%08%06%00%00%00%8Do%26%E5%00%00%004IDATx%DAm%C7%C1%09%000%08C%D1%8C%ECE%C8E(%8E%EC%02)%1EZJ%F1%C1'%04%07I%E1%E5%EE%CAL%F5%A2%99%99%22%E2%D6%1FU%B5%FE0%D9x%A7%26Wz5%0E%D5%00%00%00%00IEND%AEB%60%82\");\
}\
.ace_fold-widget.ace_closed {\
background-image: url(\"data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%03%00%00%00%06%08%06%00%00%00%06%E5%24%0C%00%00%009IDATx%DA5%CA%C1%09%000%08%03%C0%AC*(%3E%04%C1%0D%BA%B1%23%A4Uh%E0%20%81%C0%CC%F8%82%81%AA%A2%AArGfr%88%08%11%11%1C%DD%7D%E0%EE%5B%F6%F6%CB%B8%05Q%2F%E9tai%D9%00%00%00%00IEND%AEB%60%82\");\
}\
.ace_fold-widget:hover {\
border: 1px solid rgba(0, 0, 0, 0.3);\
background-color: rgba(255, 255, 255, 0.2);\
-moz-box-shadow: 0 1px 1px rgba(255, 255, 255, 0.7);\
-webkit-box-shadow: 0 1px 1px rgba(255, 255, 255, 0.7);\
box-shadow: 0 1px 1px rgba(255, 255, 255, 0.7);\
}\
.ace_fold-widget:active {\
border: 1px solid rgba(0, 0, 0, 0.4);\
background-color: rgba(0, 0, 0, 0.05);\
-moz-box-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);\
-webkit-box-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);\
box-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);\
}\
/**\
* Dark version for fold widgets\
*/\
.ace_dark .ace_fold-widget {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHklEQVQIW2P4//8/AzoGEQ7oGCaLLAhWiSwB146BAQCSTPYocqT0AAAAAElFTkSuQmCC\");\
}\
.ace_dark .ace_fold-widget.ace_end {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAH0lEQVQIW2P4//8/AxQ7wNjIAjDMgC4AxjCVKBirIAAF0kz2rlhxpAAAAABJRU5ErkJggg==\");\
}\
.ace_dark .ace_fold-widget.ace_closed {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAFCAYAAACAcVaiAAAAHElEQVQIW2P4//+/AxAzgDADlOOAznHAKgPWAwARji8UIDTfQQAAAABJRU5ErkJggg==\");\
}\
.ace_dark .ace_fold-widget:hover {\
box-shadow: 0 1px 1px rgba(255, 255, 255, 0.2);\
background-color: rgba(255, 255, 255, 0.1);\
}\
.ace_dark .ace_fold-widget:active {\
-moz-box-shadow: 0 1px 1px rgba(255, 255, 255, 0.2);\
-webkit-box-shadow: 0 1px 1px rgba(255, 255, 255, 0.2);\
box-shadow: 0 1px 1px rgba(255, 255, 255, 0.2);\
}\
.ace_fold-widget.ace_invalid {\
background-color: #FFB4B4;\
border-color: #DE5555;\
}\
.ace_fade-fold-widgets .ace_fold-widget {\
-moz-transition: opacity 0.4s ease 0.05s;\
-webkit-transition: opacity 0.4s ease 0.05s;\
-o-transition: opacity 0.4s ease 0.05s;\
-ms-transition: opacity 0.4s ease 0.05s;\
transition: opacity 0.4s ease 0.05s;\
opacity: 0;\
}\
.ace_fade-fold-widgets:hover .ace_fold-widget {\
-moz-transition: opacity 0.05s ease 0.05s;\
-webkit-transition: opacity 0.05s ease 0.05s;\
-o-transition: opacity 0.05s ease 0.05s;\
-ms-transition: opacity 0.05s ease 0.05s;\
transition: opacity 0.05s ease 0.05s;\
opacity:1;\
}\
.ace_underline {\
text-decoration: underline;\
}\
.ace_bold {\
font-weight: bold;\
}\
.ace_nobold .ace_bold {\
font-weight: normal;\
}\
.ace_italic {\
font-style: italic;\
}\
";

dom.importCssString(editorCss, "ace_editor");

var VirtualRenderer = function(container, theme) {
    var _self = this;

    this.container = container || dom.createElement("div");
    this.$keepTextAreaAtCursor = !useragent.isIE;

    dom.addCssClass(this.container, "ace_editor");

    this.setTheme(theme);

    this.$gutter = dom.createElement("div");
    this.$gutter.className = "ace_gutter";
    this.container.appendChild(this.$gutter);

    this.scroller = dom.createElement("div");
    this.scroller.className = "ace_scroller";
    this.container.appendChild(this.scroller);

    this.content = dom.createElement("div");
    this.content.className = "ace_content";
    this.scroller.appendChild(this.content);

    this.$gutterLayer = new GutterLayer(this.$gutter);
    this.$gutterLayer.on("changeGutterWidth", this.onGutterResize.bind(this));

    this.$markerBack = new MarkerLayer(this.content);

    var textLayer = this.$textLayer = new TextLayer(this.content);
    this.canvas = textLayer.element;

    this.$markerFront = new MarkerLayer(this.content);

    this.$cursorLayer = new CursorLayer(this.content);
    this.$horizScroll = false;

    this.scrollBar = new ScrollBar(this.container);
    this.scrollBar.addEventListener("scroll", function(e) {
        if (!_self.$inScrollAnimation)
            _self.session.setScrollTop(e.data);
    });

    this.scrollTop = 0;
    this.scrollLeft = 0;

    event.addListener(this.scroller, "scroll", function() {
        var scrollLeft = _self.scroller.scrollLeft;
        _self.scrollLeft = scrollLeft;
        _self.session.setScrollLeft(scrollLeft);
    });

    this.cursorPos = {
        row : 0,
        column : 0
    };

    this.$textLayer.addEventListener("changeCharacterSize", function() {
        _self.updateCharacterSize();
        _self.onResize(true);
    });

    this.$size = {
        width: 0,
        height: 0,
        scrollerHeight: 0,
        scrollerWidth: 0
    };

    this.layerConfig = {
        width : 1,
        padding : 0,
        firstRow : 0,
        firstRowScreen: 0,
        lastRow : 0,
        lineHeight : 1,
        characterWidth : 1,
        minHeight : 1,
        maxHeight : 1,
        offset : 0,
        height : 1
    };

    this.$loop = new RenderLoop(
        this.$renderChanges.bind(this),
        this.container.ownerDocument.defaultView
    );
    this.$loop.schedule(this.CHANGE_FULL);

    this.updateCharacterSize();
    this.setPadding(4);
    config.resetOptions(this);
    config._emit("renderer", this);
};

(function() {

    this.CHANGE_CURSOR = 1;
    this.CHANGE_MARKER = 2;
    this.CHANGE_GUTTER = 4;
    this.CHANGE_SCROLL = 8;
    this.CHANGE_LINES = 16;
    this.CHANGE_TEXT = 32;
    this.CHANGE_SIZE = 64;
    this.CHANGE_MARKER_BACK = 128;
    this.CHANGE_MARKER_FRONT = 256;
    this.CHANGE_FULL = 512;
    this.CHANGE_H_SCROLL = 1024;

    oop.implement(this, EventEmitter);

    this.updateCharacterSize = function() {
        if (this.$textLayer.allowBoldFonts != this.$allowBoldFonts) {
            this.$allowBoldFonts = this.$textLayer.allowBoldFonts;
            this.setStyle("ace_nobold", !this.$allowBoldFonts);
        }

        this.characterWidth = this.$textLayer.getCharacterWidth();
        this.lineHeight = this.$textLayer.getLineHeight();
        this.$updatePrintMargin();
    };
    this.setSession = function(session) {
        this.session = session;

        this.scroller.className = "ace_scroller";

        this.$cursorLayer.setSession(session);
        this.$markerBack.setSession(session);
        this.$markerFront.setSession(session);
        this.$gutterLayer.setSession(session);
        this.$textLayer.setSession(session);
        this.$loop.schedule(this.CHANGE_FULL);

    };
    this.updateLines = function(firstRow, lastRow) {
        if (lastRow === undefined)
            lastRow = Infinity;

        if (!this.$changedLines) {
            this.$changedLines = {
                firstRow: firstRow,
                lastRow: lastRow
            };
        }
        else {
            if (this.$changedLines.firstRow > firstRow)
                this.$changedLines.firstRow = firstRow;

            if (this.$changedLines.lastRow < lastRow)
                this.$changedLines.lastRow = lastRow;
        }

        if (this.$changedLines.firstRow > this.layerConfig.lastRow ||
            this.$changedLines.lastRow < this.layerConfig.firstRow)
            return;
        this.$loop.schedule(this.CHANGE_LINES);
    };

    this.onChangeTabSize = function() {
        this.$loop.schedule(this.CHANGE_TEXT | this.CHANGE_MARKER);
        this.$textLayer.onChangeTabSize();
    };
    this.updateText = function() {
        this.$loop.schedule(this.CHANGE_TEXT);
    };
    this.updateFull = function(force) {
        if (force)
            this.$renderChanges(this.CHANGE_FULL, true);
        else
            this.$loop.schedule(this.CHANGE_FULL);
    };
    this.updateFontSize = function() {
        this.$textLayer.checkForSizeChanges();
    };
    this.onResize = function(force, gutterWidth, width, height) {
        var changes = 0;
        var size = this.$size;

        if (this.resizing > 2)
            return;
        else if (this.resizing > 1)
            this.resizing++;
        else
            this.resizing = force ? 1 : 0;
        if (!height)
            height = dom.getInnerHeight(this.container);

        if (height && (force || size.height != height)) {
            size.height = height;
            changes = this.CHANGE_SIZE;

            size.scrollerHeight = this.scroller.clientHeight;
            if (!size.scrollerHeight) {
                size.scrollerHeight = size.height;
                if (this.$horizScroll)
                    size.scrollerHeight -= this.scrollBar.getWidth();
            }
            this.scrollBar.setHeight(size.scrollerHeight);

            if (this.session) {
                this.session.setScrollTop(this.getScrollTop());
                changes = changes | this.CHANGE_FULL;
            }
        }

        if (!width)
            width = dom.getInnerWidth(this.container);

        if (width && (force || this.resizing > 1 || size.width != width)) {
            changes = this.CHANGE_SIZE;
            size.width = width;

            var gutterWidth = this.$showGutter ? this.$gutter.offsetWidth : 0;
            this.scroller.style.left = gutterWidth + "px";
            size.scrollerWidth = Math.max(0, width - gutterWidth - this.scrollBar.getWidth());
            this.scroller.style.right = this.scrollBar.getWidth() + "px";

            if (this.session.getUseWrapMode() && this.adjustWrapLimit() || force)
                changes = changes | this.CHANGE_FULL;
        }

        if (!this.$size.scrollerHeight)
            return;

        if (force)
            this.$renderChanges(changes, true);
        else
            this.$loop.schedule(changes);

        if (force)
            this.$gutterLayer.$padding = null;

        if (force)
            delete this.resizing;
    };

    this.onGutterResize = function() {
        var width = this.$size.width;
        var gutterWidth = this.$showGutter ? this.$gutter.offsetWidth : 0;
        this.scroller.style.left = gutterWidth + "px";
        this.$size.scrollerWidth = Math.max(0, width - gutterWidth - this.scrollBar.getWidth());

        if (this.session.getUseWrapMode() && this.adjustWrapLimit())
            this.$loop.schedule(this.CHANGE_FULL);
    };
    this.adjustWrapLimit = function() {
        var availableWidth = this.$size.scrollerWidth - this.$padding * 2;
        var limit = Math.floor(availableWidth / this.characterWidth);
        return this.session.adjustWrapLimit(limit, this.$showPrintMargin && this.$printMarginColumn);
    };
    this.setAnimatedScroll = function(shouldAnimate){
        this.setOption("animatedScroll", shouldAnimate);
    };
    this.getAnimatedScroll = function() {
        return this.$animatedScroll;
    };
    this.setShowInvisibles = function(showInvisibles) {
        this.setOption("showInvisibles", showInvisibles);
    };
    this.getShowInvisibles = function() {
        return this.getOption("showInvisibles");
    };
    this.getDisplayIndentGuides = function() {
        return this.getOption("displayIndentGuides");
    };

    this.setDisplayIndentGuides = function(display) {
        this.setOption("displayIndentGuides", display);
    };
    this.setShowPrintMargin = function(showPrintMargin) {
        this.setOption("showPrintMargin", showPrintMargin);
    };
    this.getShowPrintMargin = function() {
        return this.getOption("showPrintMargin");
    };
    this.setPrintMarginColumn = function(showPrintMargin) {
        this.setOption("printMarginColumn", showPrintMargin);
    };
    this.getPrintMarginColumn = function() {
        return this.getOption("printMarginColumn");
    };
    this.getShowGutter = function(){
        return this.getOption("showGutter");
    };
    this.setShowGutter = function(show){
        return this.setOption("showGutter", show);
    };

    this.getFadeFoldWidgets = function(){
        return this.getOption("fadeFoldWidgets")
    };

    this.setFadeFoldWidgets = function(show) {
        this.setOption("fadeFoldWidgets", show);
    };

    this.setHighlightGutterLine = function(shouldHighlight) {
        this.setOption("highlightGutterLine", shouldHighlight);
    };

    this.getHighlightGutterLine = function() {
        return this.getOption("highlightGutterLine");
    };

    this.$updateGutterLineHighlight = function() {
        var pos = this.$cursorLayer.$pixelPos;
        var height = this.layerConfig.lineHeight;
        if (this.session.getUseWrapMode()) {
            var cursor = this.session.selection.getCursor();
            cursor.column = 0;
            pos = this.$cursorLayer.getPixelPosition(cursor, true);
            height *= this.session.getRowLength(cursor.row);
        }
        this.$gutterLineHighlight.style.top = pos.top - this.layerConfig.offset + "px";
        this.$gutterLineHighlight.style.height = height + "px";
    };

    this.$updatePrintMargin = function() {
        if (!this.$showPrintMargin && !this.$printMarginEl)
            return;

        if (!this.$printMarginEl) {
            var containerEl = dom.createElement("div");
            containerEl.className = "ace_layer ace_print-margin-layer";
            this.$printMarginEl = dom.createElement("div");
            this.$printMarginEl.className = "ace_print-margin";
            containerEl.appendChild(this.$printMarginEl);
            this.content.insertBefore(containerEl, this.content.firstChild);
        }

        var style = this.$printMarginEl.style;
        style.left = ((this.characterWidth * this.$printMarginColumn) + this.$padding) + "px";
        style.visibility = this.$showPrintMargin ? "visible" : "hidden";
        
        if (this.session && this.session.$wrap == -1)
            this.adjustWrapLimit();
    };
    this.getContainerElement = function() {
        return this.container;
    };
    this.getMouseEventTarget = function() {
        return this.content;
    };
    this.getTextAreaContainer = function() {
        return this.container;
    };
    this.$moveTextAreaToCursor = function() {
        if (!this.$keepTextAreaAtCursor)
            return;
        var config = this.layerConfig;
        var posTop = this.$cursorLayer.$pixelPos.top;
        var posLeft = this.$cursorLayer.$pixelPos.left;
        posTop -= config.offset;

        var h = this.lineHeight;
        if (posTop < 0 || posTop > config.height - h)
            return;

        var w = this.characterWidth;
        if (this.$composition) {
            var val = this.textarea.value.replace(/^\x01+/, "");
            w *= this.session.$getStringScreenWidth(val)[0];
            h += 2;
            posTop -= 1;
        }
        posLeft -= this.scrollLeft;
        if (posLeft > this.$size.scrollerWidth - w)
            posLeft = this.$size.scrollerWidth - w;

        posLeft -= this.scrollBar.width;

        this.textarea.style.height = h + "px";
        this.textarea.style.width = w + "px";
        this.textarea.style.right = Math.max(0, this.$size.scrollerWidth - posLeft - w) + "px";
        this.textarea.style.bottom = Math.max(0, this.$size.height - posTop - h) + "px";
    };
    this.getFirstVisibleRow = function() {
        return this.layerConfig.firstRow;
    };
    this.getFirstFullyVisibleRow = function() {
        return this.layerConfig.firstRow + (this.layerConfig.offset === 0 ? 0 : 1);
    };
    this.getLastFullyVisibleRow = function() {
        var flint = Math.floor((this.layerConfig.height + this.layerConfig.offset) / this.layerConfig.lineHeight);
        return this.layerConfig.firstRow - 1 + flint;
    };
    this.getLastVisibleRow = function() {
        return this.layerConfig.lastRow;
    };

    this.$padding = null;
    this.setPadding = function(padding) {
        this.$padding = padding;
        this.$textLayer.setPadding(padding);
        this.$cursorLayer.setPadding(padding);
        this.$markerFront.setPadding(padding);
        this.$markerBack.setPadding(padding);
        this.$loop.schedule(this.CHANGE_FULL);
        this.$updatePrintMargin();
    };
    this.getHScrollBarAlwaysVisible = function() {
        return this.$hScrollBarAlwaysVisible;
    };
    this.setHScrollBarAlwaysVisible = function(alwaysVisible) {
        this.setOption("hScrollBarAlwaysVisible", alwaysVisible);
    };

    this.$updateScrollBar = function() {
        this.scrollBar.setInnerHeight(this.layerConfig.maxHeight);
        this.scrollBar.setScrollTop(this.scrollTop);
    };

    this.$renderChanges = function(changes, force) {
        if (!force && (!changes || !this.session || !this.container.offsetWidth))
            return;

        this._signal("beforeRender");
        if (changes & this.CHANGE_FULL ||
            changes & this.CHANGE_SIZE ||
            changes & this.CHANGE_TEXT ||
            changes & this.CHANGE_LINES ||
            changes & this.CHANGE_SCROLL
        )
            this.$computeLayerConfig();
        if (changes & this.CHANGE_H_SCROLL) {
            this.scroller.scrollLeft = this.scrollLeft;
            var scrollLeft = this.scroller.scrollLeft;
            this.scrollLeft = scrollLeft;
            this.session.setScrollLeft(scrollLeft);

            this.scroller.className = this.scrollLeft == 0 ? "ace_scroller" : "ace_scroller ace_scroll-left";
        }
        if (changes & this.CHANGE_FULL) {
            this.$textLayer.checkForSizeChanges();
            this.$updateScrollBar();
            this.$textLayer.update(this.layerConfig);
            if (this.$showGutter)
                this.$gutterLayer.update(this.layerConfig);
            this.$markerBack.update(this.layerConfig);
            this.$markerFront.update(this.layerConfig);
            this.$cursorLayer.update(this.layerConfig);
            this.$moveTextAreaToCursor();
            this.$highlightGutterLine && this.$updateGutterLineHighlight();
            this._signal("afterRender");
            return;
        }
        if (changes & this.CHANGE_SCROLL) {
            if (changes & this.CHANGE_TEXT || changes & this.CHANGE_LINES)
                this.$textLayer.update(this.layerConfig);
            else
                this.$textLayer.scrollLines(this.layerConfig);

            if (this.$showGutter)
                this.$gutterLayer.update(this.layerConfig);
            this.$markerBack.update(this.layerConfig);
            this.$markerFront.update(this.layerConfig);
            this.$cursorLayer.update(this.layerConfig);
            this.$highlightGutterLine && this.$updateGutterLineHighlight();
            this.$moveTextAreaToCursor();
            this.$updateScrollBar();
            this._signal("afterRender");
            return;
        }

        if (changes & this.CHANGE_TEXT) {
            this.$textLayer.update(this.layerConfig);
            if (this.$showGutter)
                this.$gutterLayer.update(this.layerConfig);
        }
        else if (changes & this.CHANGE_LINES) {
            if (this.$updateLines() || (changes & this.CHANGE_GUTTER) && this.$showGutter)
                this.$gutterLayer.update(this.layerConfig);
        }
        else if (changes & this.CHANGE_TEXT || changes & this.CHANGE_GUTTER) {
            if (this.$showGutter)
                this.$gutterLayer.update(this.layerConfig);
        }

        if (changes & this.CHANGE_CURSOR) {
            this.$cursorLayer.update(this.layerConfig);
            this.$moveTextAreaToCursor();
            this.$highlightGutterLine && this.$updateGutterLineHighlight();
        }

        if (changes & (this.CHANGE_MARKER | this.CHANGE_MARKER_FRONT)) {
            this.$markerFront.update(this.layerConfig);
        }

        if (changes & (this.CHANGE_MARKER | this.CHANGE_MARKER_BACK)) {
            this.$markerBack.update(this.layerConfig);
        }

        if (changes & this.CHANGE_SIZE)
            this.$updateScrollBar();

        this._signal("afterRender");
    };

    this.$computeLayerConfig = function() {
        if (!this.$size.scrollerHeight)
            return this.onResize(true);

        var session = this.session;

        var offset = this.scrollTop % this.lineHeight;
        var minHeight = this.$size.scrollerHeight + this.lineHeight;

        var longestLine = this.$getLongestLine();

        var horizScroll = this.$hScrollBarAlwaysVisible || this.$size.scrollerWidth - longestLine < 0;
        var horizScrollChanged = this.$horizScroll !== horizScroll;
        this.$horizScroll = horizScroll;
        if (horizScrollChanged) {
            this.scroller.style.overflowX = horizScroll ? "scroll" : "hidden";
            if (!horizScroll)
                this.session.setScrollLeft(0);
        }
        var maxHeight = this.session.getScreenLength() * this.lineHeight;
        this.session.setScrollTop(Math.max(0, Math.min(this.scrollTop, maxHeight - this.$size.scrollerHeight)));

        var lineCount = Math.ceil(minHeight / this.lineHeight) - 1;
        var firstRow = Math.max(0, Math.round((this.scrollTop - offset) / this.lineHeight));
        var lastRow = firstRow + lineCount;
        var firstRowScreen, firstRowHeight;
        var lineHeight = this.lineHeight;
        firstRow = session.screenToDocumentRow(firstRow, 0);
        var foldLine = session.getFoldLine(firstRow);
        if (foldLine) {
            firstRow = foldLine.start.row;
        }

        firstRowScreen = session.documentToScreenRow(firstRow, 0);
        firstRowHeight = session.getRowLength(firstRow) * lineHeight;

        lastRow = Math.min(session.screenToDocumentRow(lastRow, 0), session.getLength() - 1);
        minHeight = this.$size.scrollerHeight + session.getRowLength(lastRow) * lineHeight +
                                                firstRowHeight;

        offset = this.scrollTop - firstRowScreen * lineHeight;

        this.layerConfig = {
            width : longestLine,
            padding : this.$padding,
            firstRow : firstRow,
            firstRowScreen: firstRowScreen,
            lastRow : lastRow,
            lineHeight : lineHeight,
            characterWidth : this.characterWidth,
            minHeight : minHeight,
            maxHeight : maxHeight,
            offset : offset,
            height : this.$size.scrollerHeight
        };

        this.$gutterLayer.element.style.marginTop = (-offset) + "px";
        this.content.style.marginTop = (-offset) + "px";
        this.content.style.width = longestLine + 2 * this.$padding + "px";
        this.content.style.height = minHeight + "px";
        if (horizScrollChanged)
            this.onResize(true);
    };

    this.$updateLines = function() {
        var firstRow = this.$changedLines.firstRow;
        var lastRow = this.$changedLines.lastRow;
        this.$changedLines = null;

        var layerConfig = this.layerConfig;

        if (firstRow > layerConfig.lastRow + 1) { return; }
        if (lastRow < layerConfig.firstRow) { return; }
        if (lastRow === Infinity) {
            if (this.$showGutter)
                this.$gutterLayer.update(layerConfig);
            this.$textLayer.update(layerConfig);
            return;
        }
        this.$textLayer.updateLines(layerConfig, firstRow, lastRow);
        return true;
    };

    this.$getLongestLine = function() {
        var charCount = this.session.getScreenWidth();
        if (this.$textLayer.showInvisibles)
            charCount += 1;

        return Math.max(this.$size.scrollerWidth - 2 * this.$padding, Math.round(charCount * this.characterWidth));
    };
    this.updateFrontMarkers = function() {
        this.$markerFront.setMarkers(this.session.getMarkers(true));
        this.$loop.schedule(this.CHANGE_MARKER_FRONT);
    };
    this.updateBackMarkers = function() {
        this.$markerBack.setMarkers(this.session.getMarkers());
        this.$loop.schedule(this.CHANGE_MARKER_BACK);
    };
    this.addGutterDecoration = function(row, className){
        this.$gutterLayer.addGutterDecoration(row, className);
    };
    this.removeGutterDecoration = function(row, className){
        this.$gutterLayer.removeGutterDecoration(row, className);
    };
    this.updateBreakpoints = function(rows) {
        this.$loop.schedule(this.CHANGE_GUTTER);
    };
    this.setAnnotations = function(annotations) {
        this.$gutterLayer.setAnnotations(annotations);
        this.$loop.schedule(this.CHANGE_GUTTER);
    };
    this.updateCursor = function() {
        this.$loop.schedule(this.CHANGE_CURSOR);
    };
    this.hideCursor = function() {
        this.$cursorLayer.hideCursor();
    };
    this.showCursor = function() {
        this.$cursorLayer.showCursor();
    };

    this.scrollSelectionIntoView = function(anchor, lead, offset) {
        this.scrollCursorIntoView(anchor, offset);
        this.scrollCursorIntoView(lead, offset);
    };
    this.scrollCursorIntoView = function(cursor, offset) {
        if (this.$size.scrollerHeight === 0)
            return;

        var pos = this.$cursorLayer.getPixelPosition(cursor);

        var left = pos.left;
        var top = pos.top;

        if (this.scrollTop > top) {
            if (offset)
                top -= offset * this.$size.scrollerHeight;
            this.session.setScrollTop(top);
        } else if (this.scrollTop + this.$size.scrollerHeight < top + this.lineHeight) {
            if (offset)
                top += offset * this.$size.scrollerHeight;
            this.session.setScrollTop(top + this.lineHeight - this.$size.scrollerHeight);
        }

        var scrollLeft = this.scrollLeft;

        if (scrollLeft > left) {
            if (left < this.$padding + 2 * this.layerConfig.characterWidth)
                left = 0;
            this.session.setScrollLeft(left);
        } else if (scrollLeft + this.$size.scrollerWidth < left + this.characterWidth) {
            this.session.setScrollLeft(Math.round(left + this.characterWidth - this.$size.scrollerWidth));
        }
    };
    this.getScrollTop = function() {
        return this.session.getScrollTop();
    };
    this.getScrollLeft = function() {
        return this.session.getScrollLeft();
    };
    this.getScrollTopRow = function() {
        return this.scrollTop / this.lineHeight;
    };
    this.getScrollBottomRow = function() {
        return Math.max(0, Math.floor((this.scrollTop + this.$size.scrollerHeight) / this.lineHeight) - 1);
    };
    this.scrollToRow = function(row) {
        this.session.setScrollTop(row * this.lineHeight);
    };

    this.alignCursor = function(cursor, alignment) {
        if (typeof cursor == "number")
            cursor = {row: cursor, column: 0};

        var pos = this.$cursorLayer.getPixelPosition(cursor);
        var h = this.$size.scrollerHeight - this.lineHeight;
        var offset = pos.top - h * (alignment || 0);

        this.session.setScrollTop(offset);
        return offset;
    };

    this.STEPS = 8;
    this.$calcSteps = function(fromValue, toValue){
        var i = 0;
        var l = this.STEPS;
        var steps = [];

        var func  = function(t, x_min, dx) {
            return dx * (Math.pow(t - 1, 3) + 1) + x_min;
        };

        for (i = 0; i < l; ++i)
            steps.push(func(i / this.STEPS, fromValue, toValue - fromValue));

        return steps;
    };
    this.scrollToLine = function(line, center, animate, callback) {
        var pos = this.$cursorLayer.getPixelPosition({row: line, column: 0});
        var offset = pos.top;
        if (center)
            offset -= this.$size.scrollerHeight / 2;

        var initialScroll = this.scrollTop;
        this.session.setScrollTop(offset);
        if (animate !== false)
            this.animateScrolling(initialScroll, callback);
    };

    this.animateScrolling = function(fromValue, callback) {
        var toValue = this.scrollTop;
        if (this.$animatedScroll && Math.abs(fromValue - toValue) < 100000) {
            var _self = this;
            var steps = _self.$calcSteps(fromValue, toValue);
            this.$inScrollAnimation = true;

            clearInterval(this.$timer);

            _self.session.setScrollTop(steps.shift());
            this.$timer = setInterval(function() {
                if (steps.length) {
                    _self.session.setScrollTop(steps.shift());
                    _self.session.$scrollTop = toValue;
                } else if (toValue != null) {
                    _self.session.$scrollTop = -1;
                    _self.session.setScrollTop(toValue);
                    toValue = null;
                } else {
                    _self.$timer = clearInterval(_self.$timer);
                    _self.$inScrollAnimation = false;
                    callback && callback();
                }
            }, 10);
        }
    };
    this.scrollToY = function(scrollTop) {
        if (this.scrollTop !== scrollTop) {
            this.$loop.schedule(this.CHANGE_SCROLL);
            this.scrollTop = scrollTop;
        }
    };
    this.scrollToX = function(scrollLeft) {
        if (scrollLeft < 0)
            scrollLeft = 0;

        if (this.scrollLeft !== scrollLeft)
            this.scrollLeft = scrollLeft;
        this.$loop.schedule(this.CHANGE_H_SCROLL);
    };
    this.scrollBy = function(deltaX, deltaY) {
        deltaY && this.session.setScrollTop(this.session.getScrollTop() + deltaY);
        deltaX && this.session.setScrollLeft(this.session.getScrollLeft() + deltaX);
    };
    this.isScrollableBy = function(deltaX, deltaY) {
        if (deltaY < 0 && this.session.getScrollTop() >= 1)
           return true;
        if (deltaY > 0 && this.session.getScrollTop() + this.$size.scrollerHeight - this.layerConfig.maxHeight < -1)
           return true;
    };

    this.pixelToScreenCoordinates = function(x, y) {
        var canvasPos = this.scroller.getBoundingClientRect();

        var offset = (x + this.scrollLeft - canvasPos.left - this.$padding) / this.characterWidth;
        var row = Math.floor((y + this.scrollTop - canvasPos.top) / this.lineHeight);
        var col = Math.round(offset);

        return {row: row, column: col, side: offset - col > 0 ? 1 : -1};
    };

    this.screenToTextCoordinates = function(x, y) {
        var canvasPos = this.scroller.getBoundingClientRect();

        var col = Math.round(
            (x + this.scrollLeft - canvasPos.left - this.$padding) / this.characterWidth
        );
        var row = Math.floor(
            (y + this.scrollTop - canvasPos.top) / this.lineHeight
        );

        return this.session.screenToDocumentPosition(row, Math.max(col, 0));
    };
    this.textToScreenCoordinates = function(row, column) {
        var canvasPos = this.scroller.getBoundingClientRect();
        var pos = this.session.documentToScreenPosition(row, column);

        var x = this.$padding + Math.round(pos.column * this.characterWidth);
        var y = pos.row * this.lineHeight;

        return {
            pageX: canvasPos.left + x - this.scrollLeft,
            pageY: canvasPos.top + y - this.scrollTop
        };
    };
    this.visualizeFocus = function() {
        dom.addCssClass(this.container, "ace_focus");
    };
    this.visualizeBlur = function() {
        dom.removeCssClass(this.container, "ace_focus");
    };
    this.showComposition = function(position) {
        if (!this.$composition)
            this.$composition = {
                keepTextAreaAtCursor: this.$keepTextAreaAtCursor,
                cssText: this.textarea.style.cssText
            };

        this.$keepTextAreaAtCursor = true;
        dom.addCssClass(this.textarea, "ace_composition");
        this.textarea.style.cssText = "";
        this.$moveTextAreaToCursor();
    };
    this.setCompositionText = function(text) {
        this.$moveTextAreaToCursor();
    };
    this.hideComposition = function() {
        if (!this.$composition)
            return;

        dom.removeCssClass(this.textarea, "ace_composition");
        this.$keepTextAreaAtCursor = this.$composition.keepTextAreaAtCursor;
        this.textarea.style.cssText = this.$composition.cssText;
        this.$composition = null;
    };
    this.setTheme = function(theme) {
        var _self = this;
        this.$themeValue = theme;
        _self._dispatchEvent('themeChange',{theme:theme});

        if (!theme || typeof theme == "string") {
            var moduleName = theme || "ace/theme/textmate";
            config.loadModule(["theme", moduleName], afterLoad);
        } else {
            afterLoad(theme);
        }

        function afterLoad(theme) {
            if (!theme.cssClass)
                return;
            dom.importCssString(
                theme.cssText,
                theme.cssClass,
                _self.container.ownerDocument
            );

            if (_self.theme)
                dom.removeCssClass(_self.container, _self.theme.cssClass);
            _self.$theme = theme.cssClass;

            _self.theme = theme;
            dom.addCssClass(_self.container, theme.cssClass);
            dom.setCssClass(_self.container, "ace_dark", theme.isDark);

            var padding = theme.padding || 4;
            if (_self.$padding && padding != _self.$padding)
                _self.setPadding(padding);
            if (_self.$size) {
                _self.$size.width = 0;
                _self.onResize();
            }

            _self._dispatchEvent('themeLoaded',{theme:theme});
        }
    };
    this.getTheme = function() {
        return this.$themeValue;
    };
    this.setStyle = function setStyle(style, include) {
        dom.setCssClass(this.container, style, include != false);
    };
    this.unsetStyle = function unsetStyle(style) {
        dom.removeCssClass(this.container, style);
    };
    this.destroy = function() {
        this.$textLayer.destroy();
        this.$cursorLayer.destroy();
    };

}).call(VirtualRenderer.prototype);


config.defineOptions(VirtualRenderer.prototype, "renderer", {
    animatedScroll: {initialValue: false},
    showInvisibles: {
        set: function(value) {
            if (this.$textLayer.setShowInvisibles(value))
                this.$loop.schedule(this.CHANGE_TEXT);
        },
        initialValue: false
    },
    showPrintMargin: {
        set: function() { this.$updatePrintMargin(); },
        initialValue: true
    },
    printMarginColumn: {
        set: function() { this.$updatePrintMargin(); },
        initialValue: 80
    },
    printMargin: {
        set: function(val) {
            if (typeof val == "number")
                this.$printMarginColumn = val;
            this.$showPrintMargin = !!val;
            this.$updatePrintMargin();
        },
        get: function() {
            return this.$showPrintMargin && this.$printMarginColumn; 
        }
    },
    showGutter: {
        set: function(show){
            this.$gutter.style.display = show ? "block" : "none";
            this.onGutterResize();
        },
        initialValue: true
    },
    fadeFoldWidgets: {
        set: function(show) {
            dom.setCssClass(this.$gutter, "ace_fade-fold-widgets", show);
        },
        initialValue: false
    },
    showFoldWidgets: {
        set: function(show) {this.$gutterLayer.setShowFoldWidgets(show)},
        initialValue: true
    },
    displayIndentGuides: {
        set: function(show) {
            if (this.$textLayer.setDisplayIndentGuides(show))
                this.$loop.schedule(this.CHANGE_TEXT);
        },
        initialValue: true
    },
    highlightGutterLine: {
        set: function(shouldHighlight) {
            if (!this.$gutterLineHighlight) {
                this.$gutterLineHighlight = dom.createElement("div");
                this.$gutterLineHighlight.className = "ace_gutter-active-line";
                this.$gutter.appendChild(this.$gutterLineHighlight);
                return;
            }

            this.$gutterLineHighlight.style.display = shouldHighlight ? "" : "none";
            if (this.$cursorLayer.$pixelPos)
                this.$updateGutterLineHighlight();
        },
        initialValue: false,
        value: true
    },
    hScrollBarAlwaysVisible: {
        set: function(alwaysVisible) {
            this.$hScrollBarAlwaysVisible = alwaysVisible;
            if (!this.$hScrollBarAlwaysVisible || !this.$horizScroll)
                this.$loop.schedule(this.CHANGE_SCROLL);
        },
        initialValue: false
    },
    fontSize:  {
        set: function(size) {
            if (typeof size == "number")
                size = size + "px";
            this.container.style.fontSize = size;
            this.updateFontSize();
        },
        initialValue: 12
    },
    fontFamily: {
        set: function(name) {
            this.container.style.fontFamily = name;
            this.updateFontSize();
        }
    }
});

exports.VirtualRenderer = VirtualRenderer;
});

ace.define('ace/layer/gutter', ["require", 'exports', 'module' , 'ace/lib/dom', 'ace/lib/oop', 'ace/lib/lang', 'ace/lib/event_emitter'], function(acequire, exports, module) {


var dom = acequire("../lib/dom");
var oop = acequire("../lib/oop");
var lang = acequire("../lib/lang");
var EventEmitter = acequire("../lib/event_emitter").EventEmitter;

var Gutter = function(parentEl) {
    this.element = dom.createElement("div");
    this.element.className = "ace_layer ace_gutter-layer";
    parentEl.appendChild(this.element);
    this.setShowFoldWidgets(this.$showFoldWidgets);
    
    this.gutterWidth = 0;

    this.$annotations = [];
    this.$updateAnnotations = this.$updateAnnotations.bind(this);
};

(function() {

    oop.implement(this, EventEmitter);

    this.setSession = function(session) {
        if (this.session)
            this.session.removeEventListener("change", this.$updateAnnotations);
        this.session = session;
        session.on("change", this.$updateAnnotations);
    };

    this.addGutterDecoration = function(row, className){
        if (window.console)
            console.warn && console.warn("deprecated use session.addGutterDecoration");
        this.session.addGutterDecoration(row, className);
    };

    this.removeGutterDecoration = function(row, className){
        if (window.console)
            console.warn && console.warn("deprecated use session.removeGutterDecoration");
        this.session.removeGutterDecoration(row, className);
    };

    this.setAnnotations = function(annotations) {
        this.$annotations = []
        var rowInfo, row;
        for (var i = 0; i < annotations.length; i++) {
            var annotation = annotations[i];
            var row = annotation.row;
            var rowInfo = this.$annotations[row];
            if (!rowInfo)
                rowInfo = this.$annotations[row] = {text: []};
           
            var annoText = annotation.text;
            annoText = annoText ? lang.escapeHTML(annoText) : annotation.html || "";

            if (rowInfo.text.indexOf(annoText) === -1)
                rowInfo.text.push(annoText);

            var type = annotation.type;
            if (type == "error")
                rowInfo.className = " ace_error";
            else if (type == "warning" && rowInfo.className != " ace_error")
                rowInfo.className = " ace_warning";
            else if (type == "info" && (!rowInfo.className))
                rowInfo.className = " ace_info";
        }
    };

    this.$updateAnnotations = function (e) {
        if (!this.$annotations.length)
            return;
        var delta = e.data;
        var range = delta.range;
        var firstRow = range.start.row;
        var len = range.end.row - firstRow;
        if (len === 0) {
        } else if (delta.action == "removeText" || delta.action == "removeLines") {
            this.$annotations.splice(firstRow, len + 1, null);
        } else {
            var args = Array(len + 1);
            args.unshift(firstRow, 1);
            this.$annotations.splice.apply(this.$annotations, args);
        }
    };

    this.update = function(config) {
        var emptyAnno = {className: ""};
        var html = [];
        var i = config.firstRow;
        var lastRow = config.lastRow;
        var fold = this.session.getNextFoldLine(i);
        var foldStart = fold ? fold.start.row : Infinity;
        var foldWidgets = this.$showFoldWidgets && this.session.foldWidgets;
        var breakpoints = this.session.$breakpoints;
        var decorations = this.session.$decorations;
        var firstLineNumber = this.session.$firstLineNumber;
        var lastLineNumber = 0;

        while (true) {
            if(i > foldStart) {
                i = fold.end.row + 1;
                fold = this.session.getNextFoldLine(i, fold);
                foldStart = fold ?fold.start.row :Infinity;
            }
            if(i > lastRow)
                break;

            var annotation = this.$annotations[i] || emptyAnno;
            html.push(
                "<div class='ace_gutter-cell ",
                breakpoints[i] || "", decorations[i] || "", annotation.className,
                "' style='height:", this.session.getRowLength(i) * config.lineHeight, "px;'>", 
                lastLineNumber = i + firstLineNumber
            );

            if (foldWidgets) {
                var c = foldWidgets[i];
                if (c == null)
                    c = foldWidgets[i] = this.session.getFoldWidget(i);
                if (c)
                    html.push(
                        "<span class='ace_fold-widget ace_", c,
                        c == "start" && i == foldStart && i < fold.end.row ? " ace_closed" : " ace_open",
                        "' style='height:", config.lineHeight, "px",
                        "'></span>"
                    );
            }

            html.push("</div>");

            i++;
        }

        this.element = dom.setInnerHtml(this.element, html.join(""));
        this.element.style.height = config.minHeight + "px";
        
        if (this.session.$useWrapMode)
            lastLineNumber = this.session.getLength();
        
        var gutterWidth = ("" + lastLineNumber).length * config.characterWidth;
        var padding = this.$padding || this.$computePadding();
        gutterWidth += padding.left + padding.right;
        if (gutterWidth !== this.gutterWidth) {
            this.gutterWidth = gutterWidth;
            this.element.style.width = Math.ceil(this.gutterWidth) + "px";
            this._emit("changeGutterWidth", gutterWidth);
        }
    };

    this.$showFoldWidgets = true;
    this.setShowFoldWidgets = function(show) {
        if (show)
            dom.addCssClass(this.element, "ace_folding-enabled");
        else
            dom.removeCssClass(this.element, "ace_folding-enabled");

        this.$showFoldWidgets = show;
        this.$padding = null;
    };
    
    this.getShowFoldWidgets = function() {
        return this.$showFoldWidgets;
    };

    this.$computePadding = function() {
        if (!this.element.firstChild)
            return {left: 0, right: 0};
        var style = dom.computedStyle(this.element.firstChild);
        this.$padding = {}
        this.$padding.left = parseInt(style.paddingLeft) + 1;
        this.$padding.right = parseInt(style.paddingRight);  
        return this.$padding;
    };

    this.getRegion = function(point) {
        var padding = this.$padding || this.$computePadding();
        var rect = this.element.getBoundingClientRect();
        if (point.x < padding.left + rect.left)
            return "markers";
        if (this.$showFoldWidgets && point.x > rect.right - padding.right)
            return "foldWidgets";
    };

}).call(Gutter.prototype);

exports.Gutter = Gutter;

});

ace.define('ace/layer/marker', ["require", 'exports', 'module' , 'ace/range', 'ace/lib/dom'], function(acequire, exports, module) {


var Range = acequire("../range").Range;
var dom = acequire("../lib/dom");

var Marker = function(parentEl) {
    this.element = dom.createElement("div");
    this.element.className = "ace_layer ace_marker-layer";
    parentEl.appendChild(this.element);
};

(function() {

    this.$padding = 0;

    this.setPadding = function(padding) {
        this.$padding = padding;
    };
    this.setSession = function(session) {
        this.session = session;
    };
    
    this.setMarkers = function(markers) {
        this.markers = markers;
    };

    this.update = function(config) {
        var config = config || this.config;
        if (!config)
            return;

        this.config = config;


        var html = [];
        for (var key in this.markers) {
            var marker = this.markers[key];

            if (!marker.range) {
                marker.update(html, this, this.session, config);
                continue;
            }

            var range = marker.range.clipRows(config.firstRow, config.lastRow);
            if (range.isEmpty()) continue;

            range = range.toScreenRange(this.session);
            if (marker.renderer) {
                var top = this.$getTop(range.start.row, config);
                var left = this.$padding + range.start.column * config.characterWidth;
                marker.renderer(html, range, left, top, config);
            } else if (marker.type == "fullLine") {
                this.drawFullLineMarker(html, range, marker.clazz, config);
            } else if (marker.type == "screenLine") {
                this.drawScreenLineMarker(html, range, marker.clazz, config);
            } else if (range.isMultiLine()) {
                if (marker.type == "text")
                    this.drawTextMarker(html, range, marker.clazz, config);
                else
                    this.drawMultiLineMarker(html, range, marker.clazz, config);
            } else {
                this.drawSingleLineMarker(html, range, marker.clazz + " ace_start", config);
            }
        }
        this.element = dom.setInnerHtml(this.element, html.join(""));
    };

    this.$getTop = function(row, layerConfig) {
        return (row - layerConfig.firstRowScreen) * layerConfig.lineHeight;
    };
    this.drawTextMarker = function(stringBuilder, range, clazz, layerConfig) {
        var row = range.start.row;

        var lineRange = new Range(
            row, range.start.column,
            row, this.session.getScreenLastRowColumn(row)
        );
        this.drawSingleLineMarker(stringBuilder, lineRange, clazz + " ace_start", layerConfig, 1, "text");
        row = range.end.row;
        lineRange = new Range(row, 0, row, range.end.column);
        this.drawSingleLineMarker(stringBuilder, lineRange, clazz, layerConfig, 0, "text");

        for (row = range.start.row + 1; row < range.end.row; row++) {
            lineRange.start.row = row;
            lineRange.end.row = row;
            lineRange.end.column = this.session.getScreenLastRowColumn(row);
            this.drawSingleLineMarker(stringBuilder, lineRange, clazz, layerConfig, 1, "text");
        }
    };
    this.drawMultiLineMarker = function(stringBuilder, range, clazz, config, type) {
        var padding = this.$padding;
        var height = config.lineHeight;
        var top = this.$getTop(range.start.row, config);
        var left = padding + range.start.column * config.characterWidth;

        stringBuilder.push(
            "<div class='", clazz, " ace_start' style='",
            "height:", height, "px;",
            "right:0;",
            "top:", top, "px;",
            "left:", left, "px;'></div>"
        );
        top = this.$getTop(range.end.row, config);
        var width = range.end.column * config.characterWidth;

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "width:", width, "px;",
            "top:", top, "px;",
            "left:", padding, "px;'></div>"
        );
        height = (range.end.row - range.start.row - 1) * config.lineHeight;
        if (height < 0)
            return;
        top = this.$getTop(range.start.row + 1, config);

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "right:0;",
            "top:", top, "px;",
            "left:", padding, "px;'></div>"
        );
    };
    this.drawSingleLineMarker = function(stringBuilder, range, clazz, config, extraLength) {
        var height = config.lineHeight;
        var width = (range.end.column + (extraLength || 0) - range.start.column) * config.characterWidth;

        var top = this.$getTop(range.start.row, config);
        var left = this.$padding + range.start.column * config.characterWidth;

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "width:", width, "px;",
            "top:", top, "px;",
            "left:", left,"px;'></div>"
        );
    };

    this.drawFullLineMarker = function(stringBuilder, range, clazz, config) {
        var top = this.$getTop(range.start.row, config);
        var height = config.lineHeight;
        if (range.start.row != range.end.row)
            height += this.$getTop(range.end.row, config) - top;

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "top:", top, "px;",
            "left:0;right:0;'></div>"
        );
    };
    
    this.drawScreenLineMarker = function(stringBuilder, range, clazz, config) {
        var top = this.$getTop(range.start.row, config);
        var height = config.lineHeight;

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "top:", top, "px;",
            "left:0;right:0;'></div>"
        );
    };

}).call(Marker.prototype);

exports.Marker = Marker;

});

ace.define('ace/layer/text', ["require", 'exports', 'module' , 'ace/lib/oop', 'ace/lib/dom', 'ace/lib/lang', 'ace/lib/useragent', 'ace/lib/event_emitter'], function(acequire, exports, module) {


var oop = acequire("../lib/oop");
var dom = acequire("../lib/dom");
var lang = acequire("../lib/lang");
var useragent = acequire("../lib/useragent");
var EventEmitter = acequire("../lib/event_emitter").EventEmitter;

var Text = function(parentEl) {
    this.element = dom.createElement("div");
    this.element.className = "ace_layer ace_text-layer";
    parentEl.appendChild(this.element);

    this.$characterSize = {width: 0, height: 0};
    this.checkForSizeChanges();
    this.$pollSizeChanges();
};

(function() {

    oop.implement(this, EventEmitter);

    this.EOF_CHAR = "\xB6"; //"&para;";
    this.EOL_CHAR = "\xAC"; //"&not;";
    this.TAB_CHAR = "\u2192"; //"&rarr;" "\u21E5";
    this.SPACE_CHAR = "\xB7"; //"&middot;";
    this.$padding = 0;

    this.setPadding = function(padding) {
        this.$padding = padding;
        this.element.style.padding = "0 " + padding + "px";
    };

    this.getLineHeight = function() {
        return this.$characterSize.height || 1;
    };

    this.getCharacterWidth = function() {
        return this.$characterSize.width || 1;
    };

    this.checkForSizeChanges = function() {
        var size = this.$measureSizes();
        if (size && (this.$characterSize.width !== size.width || this.$characterSize.height !== size.height)) {
            this.$measureNode.style.fontWeight = "bold";
            var boldSize = this.$measureSizes();
            this.$measureNode.style.fontWeight = "";
            this.$characterSize = size;
            this.allowBoldFonts = boldSize && boldSize.width === size.width && boldSize.height === size.height;
            this._emit("changeCharacterSize", {data: size});
        }
    };

    this.$pollSizeChanges = function() {
        var self = this;
        this.$pollSizeChangesTimer = setInterval(function() {
            self.checkForSizeChanges();
        }, 500);
    };

    this.$fontStyles = {
        fontFamily : 1,
        fontSize : 1,
        fontWeight : 1,
        fontStyle : 1,
        lineHeight : 1
    };

    this.$measureSizes = useragent.isIE || useragent.isOldGecko ? function() {
        var n = 1000;
        if (!this.$measureNode) {
            var measureNode = this.$measureNode = dom.createElement("div");
            var style = measureNode.style;

            style.width = style.height = "auto";
            style.left = style.top = (-n * 40)  + "px";

            style.visibility = "hidden";
            style.position = "fixed";
            style.overflow = "visible";
            style.whiteSpace = "nowrap";
            measureNode.innerHTML = lang.stringRepeat("Xy", n);

            if (this.element.ownerDocument.body) {
                this.element.ownerDocument.body.appendChild(measureNode);
            } else {
                var container = this.element.parentNode;
                while (!dom.hasCssClass(container, "ace_editor"))
                    container = container.parentNode;
                container.appendChild(measureNode);
            }
        }
        if (!this.element.offsetWidth)
            return null;

        var style = this.$measureNode.style;
        var computedStyle = dom.computedStyle(this.element);
        for (var prop in this.$fontStyles)
            style[prop] = computedStyle[prop];

        var size = {
            height: this.$measureNode.offsetHeight,
            width: this.$measureNode.offsetWidth / (n * 2)
        };
        if (size.width == 0 || size.height == 0)
            return null;

        return size;
    }
    : function() {
        if (!this.$measureNode) {
            var measureNode = this.$measureNode = dom.createElement("div");
            var style = measureNode.style;

            style.width = style.height = "auto";
            style.left = style.top = -100 + "px";

            style.visibility = "hidden";
            style.position = "fixed";
            style.overflow = "visible";
            style.whiteSpace = "nowrap";

            measureNode.innerHTML = "X";

            var container = this.element.parentNode;
            while (container && !dom.hasCssClass(container, "ace_editor"))
                container = container.parentNode;

            if (!container)
                return this.$measureNode = null;

            container.appendChild(measureNode);
        }

        var rect = this.$measureNode.getBoundingClientRect();

        var size = {
            height: rect.height,
            width: rect.width
        };
        if (size.width == 0 || size.height == 0)
            return null;

        return size;
    };

    this.setSession = function(session) {
        this.session = session;
        this.$computeTabString();
    };

    this.showInvisibles = false;
    this.setShowInvisibles = function(showInvisibles) {
        if (this.showInvisibles == showInvisibles)
            return false;

        this.showInvisibles = showInvisibles;
        this.$computeTabString();
        return true;
    };

    this.displayIndentGuides = true;
    this.setDisplayIndentGuides = function(display) {
        if (this.displayIndentGuides == display)
            return false;

        this.displayIndentGuides = display;
        this.$computeTabString();
        return true;
    };

    this.$tabStrings = [];
    this.onChangeTabSize =
    this.$computeTabString = function() {
        var tabSize = this.session.getTabSize();
        this.tabSize = tabSize;
        var tabStr = this.$tabStrings = [0];
        for (var i = 1; i < tabSize + 1; i++) {
            if (this.showInvisibles) {
                tabStr.push("<span class='ace_invisible'>"
                    + this.TAB_CHAR
                    + lang.stringRepeat("\xa0", i - 1)
                    + "</span>");
            } else {
                tabStr.push(lang.stringRepeat("\xa0", i));
            }
        }
        if (this.displayIndentGuides) {
            this.$indentGuideRe =  /\s\S| \t|\t |\s$/;
            var className = "ace_indent-guide";
            if (this.showInvisibles) {
                className += " ace_invisible";
                var spaceContent = lang.stringRepeat(this.SPACE_CHAR, this.tabSize);
                var tabContent = this.TAB_CHAR + lang.stringRepeat("\xa0", this.tabSize - 1);
            } else{
                var spaceContent = lang.stringRepeat("\xa0", this.tabSize);
                var tabContent = spaceContent;
            }

            this.$tabStrings[" "] = "<span class='" + className + "'>" + spaceContent + "</span>";
            this.$tabStrings["\t"] = "<span class='" + className + "'>" + tabContent + "</span>";
        }
    };

    this.updateLines = function(config, firstRow, lastRow) {
        if (this.config.lastRow != config.lastRow ||
            this.config.firstRow != config.firstRow) {
            this.scrollLines(config);
        }
        this.config = config;

        var first = Math.max(firstRow, config.firstRow);
        var last = Math.min(lastRow, config.lastRow);

        var lineElements = this.element.childNodes;
        var lineElementsIdx = 0;

        for (var row = config.firstRow; row < first; row++) {
            var foldLine = this.session.getFoldLine(row);
            if (foldLine) {
                if (foldLine.containsRow(first)) {
                    first = foldLine.start.row;
                    break;
                } else {
                    row = foldLine.end.row;
                }
            }
            lineElementsIdx ++;
        }

        var row = first;
        var foldLine = this.session.getNextFoldLine(row);
        var foldStart = foldLine ? foldLine.start.row : Infinity;

        while (true) {
            if (row > foldStart) {
                row = foldLine.end.row+1;
                foldLine = this.session.getNextFoldLine(row, foldLine);
                foldStart = foldLine ? foldLine.start.row :Infinity;
            }
            if (row > last)
                break;

            var lineElement = lineElements[lineElementsIdx++];
            if (lineElement) {
                var html = [];
                this.$renderLine(
                    html, row, !this.$useLineGroups(), row == foldStart ? foldLine : false
                );
                dom.setInnerHtml(lineElement, html.join(""));
            }
            row++;
        }
    };

    this.scrollLines = function(config) {
        var oldConfig = this.config;
        this.config = config;

        if (!oldConfig || oldConfig.lastRow < config.firstRow)
            return this.update(config);

        if (config.lastRow < oldConfig.firstRow)
            return this.update(config);

        var el = this.element;
        if (oldConfig.firstRow < config.firstRow)
            for (var row=this.session.getFoldedRowCount(oldConfig.firstRow, config.firstRow - 1); row>0; row--)
                el.removeChild(el.firstChild);

        if (oldConfig.lastRow > config.lastRow)
            for (var row=this.session.getFoldedRowCount(config.lastRow + 1, oldConfig.lastRow); row>0; row--)
                el.removeChild(el.lastChild);

        if (config.firstRow < oldConfig.firstRow) {
            var fragment = this.$renderLinesFragment(config, config.firstRow, oldConfig.firstRow - 1);
            if (el.firstChild)
                el.insertBefore(fragment, el.firstChild);
            else
                el.appendChild(fragment);
        }

        if (config.lastRow > oldConfig.lastRow) {
            var fragment = this.$renderLinesFragment(config, oldConfig.lastRow + 1, config.lastRow);
            el.appendChild(fragment);
        }
    };

    this.$renderLinesFragment = function(config, firstRow, lastRow) {
        var fragment = this.element.ownerDocument.createDocumentFragment();
        var row = firstRow;
        var foldLine = this.session.getNextFoldLine(row);
        var foldStart = foldLine ? foldLine.start.row : Infinity;

        while (true) {
            if (row > foldStart) {
                row = foldLine.end.row+1;
                foldLine = this.session.getNextFoldLine(row, foldLine);
                foldStart = foldLine ? foldLine.start.row : Infinity;
            }
            if (row > lastRow)
                break;

            var container = dom.createElement("div");

            var html = [];
            this.$renderLine(html, row, false, row == foldStart ? foldLine : false);
            container.innerHTML = html.join("");
            if (this.$useLineGroups()) {
                container.className = 'ace_line_group';
                fragment.appendChild(container);
            } else {
                var lines = container.childNodes
                while(lines.length)
                    fragment.appendChild(lines[0]);
            }

            row++;
        }
        return fragment;
    };

    this.update = function(config) {
        this.config = config;

        var html = [];
        var firstRow = config.firstRow, lastRow = config.lastRow;

        var row = firstRow;
        var foldLine = this.session.getNextFoldLine(row);
        var foldStart = foldLine ? foldLine.start.row : Infinity;

        while (true) {
            if (row > foldStart) {
                row = foldLine.end.row+1;
                foldLine = this.session.getNextFoldLine(row, foldLine);
                foldStart = foldLine ? foldLine.start.row :Infinity;
            }
            if (row > lastRow)
                break;

            if (this.$useLineGroups())
                html.push("<div class='ace_line_group'>")

            this.$renderLine(html, row, false, row == foldStart ? foldLine : false);

            if (this.$useLineGroups())
                html.push("</div>"); // end the line group

            row++;
        }
        this.element = dom.setInnerHtml(this.element, html.join(""));
    };

    this.$textToken = {
        "text": true,
        "rparen": true,
        "lparen": true
    };

    this.$renderToken = function(stringBuilder, screenColumn, token, value) {
        var self = this;
        var replaceReg = /\t|&|<|( +)|([\x00-\x1f\x80-\xa0\u1680\u180E\u2000-\u200f\u2028\u2029\u202F\u205F\u3000\uFEFF])|[\u1100-\u115F\u11A3-\u11A7\u11FA-\u11FF\u2329-\u232A\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3000-\u303E\u3041-\u3096\u3099-\u30FF\u3105-\u312D\u3131-\u318E\u3190-\u31BA\u31C0-\u31E3\u31F0-\u321E\u3220-\u3247\u3250-\u32FE\u3300-\u4DBF\u4E00-\uA48C\uA490-\uA4C6\uA960-\uA97C\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFF01-\uFF60\uFFE0-\uFFE6]/g;
        var replaceFunc = function(c, a, b, tabIdx, idx4) {
            if (a) {
                return self.showInvisibles ?
                    "<span class='ace_invisible'>" + lang.stringRepeat(self.SPACE_CHAR, c.length) + "</span>" :
                    lang.stringRepeat("\xa0", c.length);
            } else if (c == "&") {
                return "&#38;";
            } else if (c == "<") {
                return "&#60;";
            } else if (c == "\t") {
                var tabSize = self.session.getScreenTabSize(screenColumn + tabIdx);
                screenColumn += tabSize - 1;
                return self.$tabStrings[tabSize];
            } else if (c == "\u3000") {
                var classToUse = self.showInvisibles ? "ace_cjk ace_invisible" : "ace_cjk";
                var space = self.showInvisibles ? self.SPACE_CHAR : "";
                screenColumn += 1;
                return "<span class='" + classToUse + "' style='width:" +
                    (self.config.characterWidth * 2) +
                    "px'>" + space + "</span>";
            } else if (b) {
                return "<span class='ace_invisible ace_invalid'>" + self.SPACE_CHAR + "</span>";
            } else {
                screenColumn += 1;
                return "<span class='ace_cjk' style='width:" +
                    (self.config.characterWidth * 2) +
                    "px'>" + c + "</span>";
            }
        };

        var output = value.replace(replaceReg, replaceFunc);

        if (!this.$textToken[token.type]) {
            var classes = "ace_" + token.type.replace(/\./g, " ace_");
            var style = "";
            if (token.type == "fold")
                style = " style='width:" + (token.value.length * this.config.characterWidth) + "px;' ";
            stringBuilder.push("<span class='", classes, "'", style, ">", output, "</span>");
        }
        else {
            stringBuilder.push(output);
        }
        return screenColumn + value.length;
    };

    this.renderIndentGuide = function(stringBuilder, value) {
        var cols = value.search(this.$indentGuideRe);
        if (cols <= 0)
            return value;
        if (value[0] == " ") {
            cols -= cols % this.tabSize;
            stringBuilder.push(lang.stringRepeat(this.$tabStrings[" "], cols/this.tabSize));
            return value.substr(cols);
        } else if (value[0] == "\t") {
            stringBuilder.push(lang.stringRepeat(this.$tabStrings["\t"], cols));
            return value.substr(cols);
        }
        return value;
    };

    this.$renderWrappedLine = function(stringBuilder, tokens, splits, onlyContents) {
        var chars = 0;
        var split = 0;
        var splitChars = splits[0];
        var screenColumn = 0;

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            var value = token.value;
            if (i == 0 && this.displayIndentGuides) {
                chars = value.length;
                value = this.renderIndentGuide(stringBuilder, value);
                if (!value)
                    continue;
                chars -= value.length;
            }

            if (chars + value.length < splitChars) {
                screenColumn = this.$renderToken(stringBuilder, screenColumn, token, value);
                chars += value.length;
            } else {
                while (chars + value.length >= splitChars) {
                    screenColumn = this.$renderToken(
                        stringBuilder, screenColumn,
                        token, value.substring(0, splitChars - chars)
                    );
                    value = value.substring(splitChars - chars);
                    chars = splitChars;

                    if (!onlyContents) {
                        stringBuilder.push("</div>",
                            "<div class='ace_line' style='height:",
                            this.config.lineHeight, "px'>"
                        );
                    }

                    split ++;
                    screenColumn = 0;
                    splitChars = splits[split] || Number.MAX_VALUE;
                }
                if (value.length != 0) {
                    chars += value.length;
                    screenColumn = this.$renderToken(
                        stringBuilder, screenColumn, token, value
                    );
                }
            }
        }
    };

    this.$renderSimpleLine = function(stringBuilder, tokens) {
        var screenColumn = 0;
        var token = tokens[0];
        var value = token.value;
        if (this.displayIndentGuides)
            value = this.renderIndentGuide(stringBuilder, value);
        if (value)
            screenColumn = this.$renderToken(stringBuilder, screenColumn, token, value);
        for (var i = 1; i < tokens.length; i++) {
            token = tokens[i];
            value = token.value;
            screenColumn = this.$renderToken(stringBuilder, screenColumn, token, value);
        }
    };
    this.$renderLine = function(stringBuilder, row, onlyContents, foldLine) {
        if (!foldLine && foldLine != false)
            foldLine = this.session.getFoldLine(row);

        if (foldLine)
            var tokens = this.$getFoldLineTokens(row, foldLine);
        else
            var tokens = this.session.getTokens(row);


        if (!onlyContents) {
            stringBuilder.push(
                "<div class='ace_line' style='height:", this.config.lineHeight, "px'>"
            );
        }

        if (tokens.length) {
            var splits = this.session.getRowSplitData(row);
            if (splits && splits.length)
                this.$renderWrappedLine(stringBuilder, tokens, splits, onlyContents);
            else
                this.$renderSimpleLine(stringBuilder, tokens);
        }

        if (this.showInvisibles) {
            if (foldLine)
                row = foldLine.end.row

            stringBuilder.push(
                "<span class='ace_invisible'>",
                row == this.session.getLength() - 1 ? this.EOF_CHAR : this.EOL_CHAR,
                "</span>"
            );
        }
        if (!onlyContents)
            stringBuilder.push("</div>");
    };

    this.$getFoldLineTokens = function(row, foldLine) {
        var session = this.session;
        var renderTokens = [];

        function addTokens(tokens, from, to) {
            var idx = 0, col = 0;
            while ((col + tokens[idx].value.length) < from) {
                col += tokens[idx].value.length;
                idx++;

                if (idx == tokens.length)
                    return;
            }
            if (col != from) {
                var value = tokens[idx].value.substring(from - col);
                if (value.length > (to - from))
                    value = value.substring(0, to - from);

                renderTokens.push({
                    type: tokens[idx].type,
                    value: value
                });

                col = from + value.length;
                idx += 1;
            }

            while (col < to && idx < tokens.length) {
                var value = tokens[idx].value;
                if (value.length + col > to) {
                    renderTokens.push({
                        type: tokens[idx].type,
                        value: value.substring(0, to - col)
                    });
                } else
                    renderTokens.push(tokens[idx]);
                col += value.length;
                idx += 1;
            }
        }

        var tokens = session.getTokens(row);
        foldLine.walk(function(placeholder, row, column, lastColumn, isNewRow) {
            if (placeholder != null) {
                renderTokens.push({
                    type: "fold",
                    value: placeholder
                });
            } else {
                if (isNewRow)
                    tokens = session.getTokens(row);

                if (tokens.length)
                    addTokens(tokens, lastColumn, column);
            }
        }, foldLine.end.row, this.session.getLine(foldLine.end.row).length);

        return renderTokens;
    };

    this.$useLineGroups = function() {
        return this.session.getUseWrapMode();
    };

    this.destroy = function() {
        clearInterval(this.$pollSizeChangesTimer);
        if (this.$measureNode)
            this.$measureNode.parentNode.removeChild(this.$measureNode);
        delete this.$measureNode;
    };

}).call(Text.prototype);

exports.Text = Text;

});

ace.define('ace/layer/cursor', ["require", 'exports', 'module' , 'ace/lib/dom'], function(acequire, exports, module) {


var dom = acequire("../lib/dom");

var Cursor = function(parentEl) {
    this.element = dom.createElement("div");
    this.element.className = "ace_layer ace_cursor-layer";
    parentEl.appendChild(this.element);

    this.isVisible = false;
    this.isBlinking = true;
    this.blinkInterval = 1000;
    this.smoothBlinking = false;

    this.cursors = [];
    this.cursor = this.addCursor();
    dom.addCssClass(this.element, "ace_hidden-cursors");
};

(function() {

    this.$padding = 0;
    this.setPadding = function(padding) {
        this.$padding = padding;
    };

    this.setSession = function(session) {
        this.session = session;
    };

    this.setBlinking = function(blinking) {
        if (blinking != this.isBlinking){
            this.isBlinking = blinking;
            this.restartTimer();
        }
    };

    this.setBlinkInterval = function(blinkInterval) {
        if (blinkInterval != this.blinkInterval){
            this.blinkInterval = blinkInterval;
            this.restartTimer();
        }
    };

    this.setSmoothBlinking = function(smoothBlinking) {
        if (smoothBlinking != this.smoothBlinking) {
            this.smoothBlinking = smoothBlinking;
            if (smoothBlinking)
                dom.addCssClass(this.element, "ace_smooth-blinking");
            else
                dom.removeCssClass(this.element, "ace_smooth-blinking");
            this.restartTimer();
        }
    };

    this.addCursor = function() {
        var el = dom.createElement("div");
        el.className = "ace_cursor";
        this.element.appendChild(el);
        this.cursors.push(el);
        return el;
    };

    this.removeCursor = function() {
        if (this.cursors.length > 1) {
            var el = this.cursors.pop();
            el.parentNode.removeChild(el);
            return el;
        }
    };

    this.hideCursor = function() {
        this.isVisible = false;
        dom.addCssClass(this.element, "ace_hidden-cursors");
        this.restartTimer();
    };

    this.showCursor = function() {
        this.isVisible = true;
        dom.removeCssClass(this.element, "ace_hidden-cursors");
        this.restartTimer();
    };

    this.restartTimer = function() {
        clearInterval(this.intervalId);
        clearTimeout(this.timeoutId);
        if (this.smoothBlinking)
            dom.removeCssClass(this.element, "ace_smooth-blinking");
        for (var i = this.cursors.length; i--; )
            this.cursors[i].style.opacity = "";

        if (!this.isBlinking || !this.blinkInterval || !this.isVisible)
            return;

        if (this.smoothBlinking)
            setTimeout(function(){
                dom.addCssClass(this.element, "ace_smooth-blinking");
            }.bind(this));

        var blink = function(){
            this.timeoutId = setTimeout(function() {
                for (var i = this.cursors.length; i--; ) {
                    this.cursors[i].style.opacity = 0;
                }
            }.bind(this), 0.6 * this.blinkInterval);
        }.bind(this);

        this.intervalId = setInterval(function() {
            for (var i = this.cursors.length; i--; ) {
                this.cursors[i].style.opacity = "";
            }
            blink();
        }.bind(this), this.blinkInterval);

        blink();
    };

    this.getPixelPosition = function(position, onScreen) {
        if (!this.config || !this.session)
            return {left : 0, top : 0};

        if (!position)
            position = this.session.selection.getCursor();
        var pos = this.session.documentToScreenPosition(position);
        var cursorLeft = this.$padding + pos.column * this.config.characterWidth;
        var cursorTop = (pos.row - (onScreen ? this.config.firstRowScreen : 0)) *
            this.config.lineHeight;

        return {left : cursorLeft, top : cursorTop};
    };

    this.update = function(config) {
        this.config = config;

        var selections = this.session.$selectionMarkers;
        var i = 0, cursorIndex = 0;

        if (selections === undefined || selections.length === 0){
            selections = [{cursor: null}];
        }

        for (var i = 0, n = selections.length; i < n; i++) {
            var pixelPos = this.getPixelPosition(selections[i].cursor, true);
            if ((pixelPos.top > config.height + config.offset ||
                 pixelPos.top < -config.offset) && i > 1) {
                continue;
            }

            var style = (this.cursors[cursorIndex++] || this.addCursor()).style;

            style.left = pixelPos.left + "px";
            style.top = pixelPos.top + "px";
            style.width = config.characterWidth + "px";
            style.height = config.lineHeight + "px";
        }
        while (this.cursors.length > cursorIndex)
            this.removeCursor();

        var overwrite = this.session.getOverwrite();
        this.$setOverwrite(overwrite);
        this.$pixelPos = pixelPos;
        this.restartTimer();
    };

    this.$setOverwrite = function(overwrite) {
        if (overwrite != this.overwrite) {
            this.overwrite = overwrite;
            if (overwrite)
                dom.addCssClass(this.element, "ace_overwrite-cursors");
            else
                dom.removeCssClass(this.element, "ace_overwrite-cursors");
        }
    };

    this.destroy = function() {
        clearInterval(this.intervalId);
        clearTimeout(this.timeoutId);
    };

}).call(Cursor.prototype);

exports.Cursor = Cursor;

});

ace.define('ace/scrollbar', ["require", 'exports', 'module' , 'ace/lib/oop', 'ace/lib/dom', 'ace/lib/event', 'ace/lib/event_emitter'], function(acequire, exports, module) {


var oop = acequire("./lib/oop");
var dom = acequire("./lib/dom");
var event = acequire("./lib/event");
var EventEmitter = acequire("./lib/event_emitter").EventEmitter;
var ScrollBar = function(parent) {
    this.element = dom.createElement("div");
    this.element.className = "ace_scrollbar";

    this.inner = dom.createElement("div");
    this.inner.className = "ace_scrollbar-inner";
    this.element.appendChild(this.inner);

    parent.appendChild(this.element);
    this.width = dom.scrollbarWidth(parent.ownerDocument);
    this.element.style.width = (this.width || 15) + 5 + "px";

    event.addListener(this.element, "scroll", this.onScroll.bind(this));
};

(function() {
    oop.implement(this, EventEmitter);
    this.onScroll = function() {
        if (!this.skipEvent) {
            this.scrollTop = this.element.scrollTop;
            this._emit("scroll", {data: this.scrollTop});
        }
        this.skipEvent = false;
    };
    this.getWidth = function() {
        return this.width;
    };
    this.setHeight = function(height) {
        this.element.style.height = height + "px";
    };
    this.setInnerHeight = function(height) {
        this.inner.style.height = height + "px";
    };
    this.setScrollTop = function(scrollTop) {
        if (this.scrollTop != scrollTop) {
            this.skipEvent = true;
            this.scrollTop = this.element.scrollTop = scrollTop;
        }
    };

}).call(ScrollBar.prototype);

exports.ScrollBar = ScrollBar;
});

ace.define('ace/renderloop', ["require", 'exports', 'module' , 'ace/lib/event'], function(acequire, exports, module) {


var event = acequire("./lib/event");


var RenderLoop = function(onRender, win) {
    this.onRender = onRender;
    this.pending = false;
    this.changes = 0;
    this.window = win || window;
};

(function() {


    this.schedule = function(change) {
        this.changes = this.changes | change;
        if (!this.pending) {
            this.pending = true;
            var _self = this;
            event.nextFrame(function() {
                _self.pending = false;
                var changes;
                while (changes = _self.changes) {
                    _self.changes = 0;
                    _self.onRender(changes);
                }
            }, this.window);
        }
    };

}).call(RenderLoop.prototype);

exports.RenderLoop = RenderLoop;
});

ace.define('ace/multi_select', ["require", 'exports', 'module' , 'ace/range_list', 'ace/range', 'ace/selection', 'ace/mouse/multi_select_handler', 'ace/lib/event', 'ace/lib/lang', 'ace/commands/multi_select_commands', 'ace/search', 'ace/edit_session', 'ace/editor'], function(acequire, exports, module) {

var RangeList = acequire("./range_list").RangeList;
var Range = acequire("./range").Range;
var Selection = acequire("./selection").Selection;
var onMouseDown = acequire("./mouse/multi_select_handler").onMouseDown;
var event = acequire("./lib/event");
var lang = acequire("./lib/lang");
var commands = acequire("./commands/multi_select_commands");
exports.commands = commands.defaultCommands.concat(commands.multiSelectCommands);
var Search = acequire("./search").Search;
var search = new Search();

function find(session, needle, dir) {
    search.$options.wrap = true;
    search.$options.needle = needle;
    search.$options.backwards = dir == -1;
    return search.find(session);
}
var EditSession = acequire("./edit_session").EditSession;
(function() {
    this.getSelectionMarkers = function() {
        return this.$selectionMarkers;
    };
}).call(EditSession.prototype);
(function() {
    this.ranges = null;
    this.rangeList = null;
    this.addRange = function(range, $blockChangeEvents) {
        if (!range)
            return;

        if (!this.inMultiSelectMode && this.rangeCount == 0) {
            var oldRange = this.toOrientedRange();
            this.rangeList.add(oldRange);
            this.rangeList.add(range);
            if (this.rangeList.ranges.length != 2) {
                this.rangeList.removeAll();
                return $blockChangeEvents || this.fromOrientedRange(range);
            }
            this.rangeList.removeAll();
            this.rangeList.add(oldRange);
            this.$onAddRange(oldRange);
        }

        if (!range.cursor)
            range.cursor = range.end;

        var removed = this.rangeList.add(range);

        this.$onAddRange(range);

        if (removed.length)
            this.$onRemoveRange(removed);

        if (this.rangeCount > 1 && !this.inMultiSelectMode) {
            this._emit("multiSelect");
            this.inMultiSelectMode = true;
            this.session.$undoSelect = false;
            this.rangeList.attach(this.session);
        }

        return $blockChangeEvents || this.fromOrientedRange(range);
    };

    this.toSingleRange = function(range) {
        range = range || this.ranges[0];
        var removed = this.rangeList.removeAll();
        if (removed.length)
            this.$onRemoveRange(removed);

        range && this.fromOrientedRange(range);
    };
    this.substractPoint = function(pos) {
        var removed = this.rangeList.substractPoint(pos);
        if (removed) {
            this.$onRemoveRange(removed);
            return removed[0];
        }
    };
    this.mergeOverlappingRanges = function() {
        var removed = this.rangeList.merge();
        if (removed.length)
            this.$onRemoveRange(removed);
        else if(this.ranges[0])
            this.fromOrientedRange(this.ranges[0]);
    };

    this.$onAddRange = function(range) {
        this.rangeCount = this.rangeList.ranges.length;
        this.ranges.unshift(range);
        this._emit("addRange", {range: range});
    };

    this.$onRemoveRange = function(removed) {
        this.rangeCount = this.rangeList.ranges.length;
        if (this.rangeCount == 1 && this.inMultiSelectMode) {
            var lastRange = this.rangeList.ranges.pop();
            removed.push(lastRange);
            this.rangeCount = 0;
        }

        for (var i = removed.length; i--; ) {
            var index = this.ranges.indexOf(removed[i]);
            this.ranges.splice(index, 1);
        }

        this._emit("removeRange", {ranges: removed});

        if (this.rangeCount == 0 && this.inMultiSelectMode) {
            this.inMultiSelectMode = false;
            this._emit("singleSelect");
            this.session.$undoSelect = true;
            this.rangeList.detach(this.session);
        }

        lastRange = lastRange || this.ranges[0];
        if (lastRange && !lastRange.isEqual(this.getRange()))
            this.fromOrientedRange(lastRange);
    };
    this.$initRangeList = function() {
        if (this.rangeList)
            return;

        this.rangeList = new RangeList();
        this.ranges = [];
        this.rangeCount = 0;
    };
    this.getAllRanges = function() {
        return this.rangeList.ranges.concat();
    };

    this.splitIntoLines = function () {
        if (this.rangeCount > 1) {
            var ranges = this.rangeList.ranges;
            var lastRange = ranges[ranges.length - 1];
            var range = Range.fromPoints(ranges[0].start, lastRange.end);

            this.toSingleRange();
            this.setSelectionRange(range, lastRange.cursor == lastRange.start);
        } else {
            var range = this.getRange();
            var isBackwards = this.isBackwards();
            var startRow = range.start.row;
            var endRow = range.end.row;
            if (startRow == endRow) {
                if (isBackwards)
                    var start = range.end, end = range.start;
                else
                    var start = range.start, end = range.end;
                
                this.addRange(Range.fromPoints(end, end));
                this.addRange(Range.fromPoints(start, start));
                return;
            }

            var rectSel = [];
            var r = this.getLineRange(startRow, true);
            r.start.column = range.start.column;
            rectSel.push(r);

            for (var i = startRow + 1; i < endRow; i++)
                rectSel.push(this.getLineRange(i, true));

            r = this.getLineRange(endRow, true);
            r.end.column = range.end.column;
            rectSel.push(r);

            rectSel.forEach(this.addRange, this);
        }
    };
    this.toggleBlockSelection = function () {
        if (this.rangeCount > 1) {
            var ranges = this.rangeList.ranges;
            var lastRange = ranges[ranges.length - 1];
            var range = Range.fromPoints(ranges[0].start, lastRange.end);

            this.toSingleRange();
            this.setSelectionRange(range, lastRange.cursor == lastRange.start);
        } else {
            var cursor = this.session.documentToScreenPosition(this.selectionLead);
            var anchor = this.session.documentToScreenPosition(this.selectionAnchor);

            var rectSel = this.rectangularRangeBlock(cursor, anchor);
            rectSel.forEach(this.addRange, this);
        }
    };
    this.rectangularRangeBlock = function(screenCursor, screenAnchor, includeEmptyLines) {
        var rectSel = [];

        var xBackwards = screenCursor.column < screenAnchor.column;
        if (xBackwards) {
            var startColumn = screenCursor.column;
            var endColumn = screenAnchor.column;
        } else {
            var startColumn = screenAnchor.column;
            var endColumn = screenCursor.column;
        }

        var yBackwards = screenCursor.row < screenAnchor.row;
        if (yBackwards) {
            var startRow = screenCursor.row;
            var endRow = screenAnchor.row;
        } else {
            var startRow = screenAnchor.row;
            var endRow = screenCursor.row;
        }

        if (startColumn < 0)
            startColumn = 0;
        if (startRow < 0)
            startRow = 0;

        if (startRow == endRow)
            includeEmptyLines = true;

        for (var row = startRow; row <= endRow; row++) {
            var range = Range.fromPoints(
                this.session.screenToDocumentPosition(row, startColumn),
                this.session.screenToDocumentPosition(row, endColumn)
            );
            if (range.isEmpty()) {
                if (docEnd && isSamePoint(range.end, docEnd))
                    break;
                var docEnd = range.end;
            }
            range.cursor = xBackwards ? range.start : range.end;
            rectSel.push(range);
        }

        if (yBackwards)
            rectSel.reverse();

        if (!includeEmptyLines) {
            var end = rectSel.length - 1;
            while (rectSel[end].isEmpty() && end > 0)
                end--;
            if (end > 0) {
                var start = 0;
                while (rectSel[start].isEmpty())
                    start++;
            }
            for (var i = end; i >= start; i--) {
                if (rectSel[i].isEmpty())
                    rectSel.splice(i, 1);
            }
        }

        return rectSel;
    };
}).call(Selection.prototype);
var Editor = acequire("./editor").Editor;
(function() {
    this.updateSelectionMarkers = function() {
        this.renderer.updateCursor();
        this.renderer.updateBackMarkers();
    };
    this.addSelectionMarker = function(orientedRange) {
        if (!orientedRange.cursor)
            orientedRange.cursor = orientedRange.end;

        var style = this.getSelectionStyle();
        orientedRange.marker = this.session.addMarker(orientedRange, "ace_selection", style);

        this.session.$selectionMarkers.push(orientedRange);
        this.session.selectionMarkerCount = this.session.$selectionMarkers.length;
        return orientedRange;
    };
    this.removeSelectionMarker = function(range) {
        if (!range.marker)
            return;
        this.session.removeMarker(range.marker);
        var index = this.session.$selectionMarkers.indexOf(range);
        if (index != -1)
            this.session.$selectionMarkers.splice(index, 1);
        this.session.selectionMarkerCount = this.session.$selectionMarkers.length;
    };

    this.removeSelectionMarkers = function(ranges) {
        var markerList = this.session.$selectionMarkers;
        for (var i = ranges.length; i--; ) {
            var range = ranges[i];
            if (!range.marker)
                continue;
            this.session.removeMarker(range.marker);
            var index = markerList.indexOf(range);
            if (index != -1)
                markerList.splice(index, 1);
        }
        this.session.selectionMarkerCount = markerList.length;
    };

    this.$onAddRange = function(e) {
        this.addSelectionMarker(e.range);
        this.renderer.updateCursor();
        this.renderer.updateBackMarkers();
    };

    this.$onRemoveRange = function(e) {
        this.removeSelectionMarkers(e.ranges);
        this.renderer.updateCursor();
        this.renderer.updateBackMarkers();
    };

    this.$onMultiSelect = function(e) {
        if (this.inMultiSelectMode)
            return;
        this.inMultiSelectMode = true;

        this.setStyle("ace_multiselect");
        this.keyBinding.addKeyboardHandler(commands.keyboardHandler);
        this.commands.on("exec", this.$onMultiSelectExec);

        this.renderer.updateCursor();
        this.renderer.updateBackMarkers();
    };

    this.$onSingleSelect = function(e) {
        if (this.session.multiSelect.inVirtualMode)
            return;
        this.inMultiSelectMode = false;

        this.unsetStyle("ace_multiselect");
        this.keyBinding.removeKeyboardHandler(commands.keyboardHandler);

        this.commands.removeEventListener("exec", this.$onMultiSelectExec);
        this.renderer.updateCursor();
        this.renderer.updateBackMarkers();
    };

    this.$onMultiSelectExec = function(e) {
        var command = e.command;
        var editor = e.editor;
        if (!editor.multiSelect)
            return;
        if (!command.multiSelectAction) {
            command.exec(editor, e.args || {});
            editor.multiSelect.addRange(editor.multiSelect.toOrientedRange());
            editor.multiSelect.mergeOverlappingRanges();
        } else if (command.multiSelectAction == "forEach") {
            editor.forEachSelection(command, e.args);
        } else if (command.multiSelectAction == "forEachLine") {
            editor.forEachSelection(command, e.args, true);
        } else if (command.multiSelectAction == "single") {
            editor.exitMultiSelectMode();
            command.exec(editor, e.args || {});
        } else {
            command.multiSelectAction(editor, e.args || {});
        }
        e.preventDefault();
    }; 
    this.forEachSelection = function(cmd, args, $byLines) {
        if (this.inVirtualSelectionMode)
            return;

        var session = this.session;
        var selection = this.selection;
        var rangeList = selection.rangeList;

        var reg = selection._eventRegistry;
        selection._eventRegistry = {};

        var tmpSel = new Selection(session);
        this.inVirtualSelectionMode = true;
        for (var i = rangeList.ranges.length; i--;) {
            if ($byLines) {
                while (i > 0 && rangeList.ranges[i].start.row == rangeList.ranges[i - 1].end.row)
                    i--;
            }
            tmpSel.fromOrientedRange(rangeList.ranges[i]);
            this.selection = session.selection = tmpSel;
            cmd.exec(this, args || {});
            tmpSel.toOrientedRange(rangeList.ranges[i]);
        }
        tmpSel.detach();

        this.selection = session.selection = selection;
        this.inVirtualSelectionMode = false;
        selection._eventRegistry = reg;
        selection.mergeOverlappingRanges();

        this.onCursorChange();
        this.onSelectionChange();
    };
    this.exitMultiSelectMode = function() {
        if (this.inVirtualSelectionMode)
            return;
        this.multiSelect.toSingleRange();
    };

    this.getCopyText = function() {
        var text = "";
        if (this.inMultiSelectMode) {
            var ranges = this.multiSelect.rangeList.ranges;
            text = [];
            for (var i = 0; i < ranges.length; i++) {
                text.push(this.session.getTextRange(ranges[i]));
            }
            text = text.join(this.session.getDocument().getNewLineCharacter());
        } else if (!this.selection.isEmpty()) {
            text = this.session.getTextRange(this.getSelectionRange());
        }

        return text;
    };
    this.onPaste = function(text) {
        if (this.$readOnly)
            return;

        this._signal("paste", text);
        if (!this.inMultiSelectMode || this.inVirtualSelectionMode)
            return this.insert(text);

        var lines = text.split(/\r\n|\r|\n/);
        var ranges = this.selection.rangeList.ranges;

        if (lines.length > ranges.length || (lines.length <= 2 || !lines[1]))
            return this.commands.exec("insertstring", this, text);

        for (var i = ranges.length; i--; ) {
            var range = ranges[i];
            if (!range.isEmpty())
                this.session.remove(range);

            this.session.insert(range.start, lines[i]);
        }
    };
    this.findAll = function(needle, options, additive) {
        options = options || {};
        options.needle = needle || options.needle;
        this.$search.set(options);

        var ranges = this.$search.findAll(this.session);
        if (!ranges.length)
            return 0;

        this.$blockScrolling += 1;
        var selection = this.multiSelect;

        if (!additive)
            selection.toSingleRange(ranges[0]);

        for (var i = ranges.length; i--; )
            selection.addRange(ranges[i], true);

        this.$blockScrolling -= 1;

        return ranges.length;
    };
    this.selectMoreLines = function(dir, skip) {
        var range = this.selection.toOrientedRange();
        var isBackwards = range.cursor == range.end;

        var screenLead = this.session.documentToScreenPosition(range.cursor);
        if (this.selection.$desiredColumn)
            screenLead.column = this.selection.$desiredColumn;

        var lead = this.session.screenToDocumentPosition(screenLead.row + dir, screenLead.column);

        if (!range.isEmpty()) {
            var screenAnchor = this.session.documentToScreenPosition(isBackwards ? range.end : range.start);
            var anchor = this.session.screenToDocumentPosition(screenAnchor.row + dir, screenAnchor.column);
        } else {
            var anchor = lead;
        }

        if (isBackwards) {
            var newRange = Range.fromPoints(lead, anchor);
            newRange.cursor = newRange.start;
        } else {
            var newRange = Range.fromPoints(anchor, lead);
            newRange.cursor = newRange.end;
        }

        newRange.desiredColumn = screenLead.column;
        if (!this.selection.inMultiSelectMode) {
            this.selection.addRange(range);
        } else {
            if (skip)
                var toRemove = range.cursor;
        }

        this.selection.addRange(newRange);
        if (toRemove)
            this.selection.substractPoint(toRemove);
    };
    this.transposeSelections = function(dir) {
        var session = this.session;
        var sel = session.multiSelect;
        var all = sel.ranges;

        for (var i = all.length; i--; ) {
            var range = all[i];
            if (range.isEmpty()) {
                var tmp = session.getWordRange(range.start.row, range.start.column);
                range.start.row = tmp.start.row;
                range.start.column = tmp.start.column;
                range.end.row = tmp.end.row;
                range.end.column = tmp.end.column;
            }
        }
        sel.mergeOverlappingRanges();

        var words = [];
        for (var i = all.length; i--; ) {
            var range = all[i];
            words.unshift(session.getTextRange(range));
        }

        if (dir < 0)
            words.unshift(words.pop());
        else
            words.push(words.shift());

        for (var i = all.length; i--; ) {
            var range = all[i];
            var tmp = range.clone();
            session.replace(range, words[i]);
            range.start.row = tmp.start.row;
            range.start.column = tmp.start.column;
        }
    };
    this.selectMore = function(dir, skip) {
        var session = this.session;
        var sel = session.multiSelect;

        var range = sel.toOrientedRange();
        if (range.isEmpty()) {
            var range = session.getWordRange(range.start.row, range.start.column);
            range.cursor = range.end;
            this.multiSelect.addRange(range);
        }
        var needle = session.getTextRange(range);

        var newRange = find(session, needle, dir);
        if (newRange) {
            newRange.cursor = dir == -1 ? newRange.start : newRange.end;
            this.multiSelect.addRange(newRange);
        }
        if (skip)
            this.multiSelect.substractPoint(range.cursor);
    };
    this.alignCursors = function() {
        var session = this.session;
        var sel = session.multiSelect;
        var ranges = sel.ranges;

        if (!ranges.length) {
            var range = this.selection.getRange();
            var fr = range.start.row, lr = range.end.row;
            var lines = this.session.doc.removeLines(fr, lr);
            lines = this.$reAlignText(lines);
            this.session.doc.insertLines(fr, lines);
            range.start.column = 0;
            range.end.column = lines[lines.length - 1].length;
            this.selection.setRange(range);
        } else {
            var row = -1;
            var sameRowRanges = ranges.filter(function(r) {
                if (r.cursor.row == row)
                    return true;
                row = r.cursor.row;
            });
            sel.$onRemoveRange(sameRowRanges);

            var maxCol = 0;
            var minSpace = Infinity;
            var spaceOffsets = ranges.map(function(r) {
                var p = r.cursor;
                var line = session.getLine(p.row);
                var spaceOffset = line.substr(p.column).search(/\S/g);
                if (spaceOffset == -1)
                    spaceOffset = 0;

                if (p.column > maxCol)
                    maxCol = p.column;
                if (spaceOffset < minSpace)
                    minSpace = spaceOffset;
                return spaceOffset;
            });
            ranges.forEach(function(r, i) {
                var p = r.cursor;
                var l = maxCol - p.column;
                var d = spaceOffsets[i] - minSpace;
                if (l > d)
                    session.insert(p, lang.stringRepeat(" ", l - d));
                else
                    session.remove(new Range(p.row, p.column, p.row, p.column - l + d));

                r.start.column = r.end.column = maxCol;
                r.start.row = r.end.row = p.row;
                r.cursor = r.end;
            });
            sel.fromOrientedRange(ranges[0]);
            this.renderer.updateCursor();
            this.renderer.updateBackMarkers();
        }
    };

    this.$reAlignText = function(lines) {
        var isLeftAligned = true, isRightAligned = true;
        var startW, textW, endW;

        return lines.map(function(line) {
            var m = line.match(/(\s*)(.*?)(\s*)([=:].*)/);
            if (!m)
                return [line];

            if (startW == null) {
                startW = m[1].length;
                textW = m[2].length;
                endW = m[3].length;
                return m;
            }

            if (startW + textW + endW != m[1].length + m[2].length + m[3].length)
                isRightAligned = false;
            if (startW != m[1].length)
                isLeftAligned = false;

            if (startW > m[1].length)
                startW = m[1].length;
            if (textW < m[2].length)
                textW = m[2].length;
            if (endW > m[3].length)
                endW = m[3].length;

            return m;
        }).map(isLeftAligned ? isRightAligned ? alignRight : alignLeft : unAlign);

        function spaces(n) {
            return lang.stringRepeat(" ", n);
        }

        function alignLeft(m) {
            return !m[2] ? m[0] : spaces(startW) + m[2]
                + spaces(textW - m[2].length + endW)
                + m[4].replace(/^([=:])\s+/, "$1 ")
        }
        function alignRight(m) {
            return !m[2] ? m[0] : spaces(startW + textW - m[2].length) + m[2]
                + spaces(endW, " ")
                + m[4].replace(/^([=:])\s+/, "$1 ")
        }
        function unAlign(m) {
            return !m[2] ? m[0] : spaces(startW) + m[2]
                + spaces(endW)
                + m[4].replace(/^([=:])\s+/, "$1 ")
        }
    }
}).call(Editor.prototype);


function isSamePoint(p1, p2) {
    return p1.row == p2.row && p1.column == p2.column;
}
exports.onSessionChange = function(e) {
    var session = e.session;
    if (!session.multiSelect) {
        session.$selectionMarkers = [];
        session.selection.$initRangeList();
        session.multiSelect = session.selection;
    }
    this.multiSelect = session.multiSelect;

    var oldSession = e.oldSession;
    if (oldSession) {
        oldSession.multiSelect.removeEventListener("addRange", this.$onAddRange);
        oldSession.multiSelect.removeEventListener("removeRange", this.$onRemoveRange);
        oldSession.multiSelect.removeEventListener("multiSelect", this.$onMultiSelect);
        oldSession.multiSelect.removeEventListener("singleSelect", this.$onSingleSelect);
    }

    session.multiSelect.on("addRange", this.$onAddRange);
    session.multiSelect.on("removeRange", this.$onRemoveRange);
    session.multiSelect.on("multiSelect", this.$onMultiSelect);
    session.multiSelect.on("singleSelect", this.$onSingleSelect);

    if (this.inMultiSelectMode != session.selection.inMultiSelectMode) {
        if (session.selection.inMultiSelectMode)
            this.$onMultiSelect();
        else
            this.$onSingleSelect();
    }
};
function MultiSelect(editor) {
    editor.$onAddRange = editor.$onAddRange.bind(editor);
    editor.$onRemoveRange = editor.$onRemoveRange.bind(editor);
    editor.$onMultiSelect = editor.$onMultiSelect.bind(editor);
    editor.$onSingleSelect = editor.$onSingleSelect.bind(editor);

    exports.onSessionChange.call(editor, editor);
    editor.on("changeSession", exports.onSessionChange.bind(editor));

    editor.on("mousedown", onMouseDown);
    editor.commands.addCommands(commands.defaultCommands);

    addAltCursorListeners(editor);
}

function addAltCursorListeners(editor){
    var el = editor.textInput.getElement();
    var altCursor = false;
    var contentEl = editor.renderer.content;
    event.addListener(el, "keydown", function(e) {
        if (e.keyCode == 18 && !(e.ctrlKey || e.shiftKey || e.metaKey)) {
            if (!altCursor) {
                contentEl.style.cursor = "crosshair";
                altCursor = true;
            }
        } else if (altCursor) {
            contentEl.style.cursor = "";
        }
    });

    event.addListener(el, "keyup", reset);
    event.addListener(el, "blur", reset);
    function reset() {
        if (altCursor) {
            contentEl.style.cursor = "";
            altCursor = false;
        }
    }
}

exports.MultiSelect = MultiSelect;

});

ace.define('ace/mouse/multi_select_handler', ["require", 'exports', 'module' , 'ace/lib/event'], function(acequire, exports, module) {

var event = acequire("../lib/event");
function isSamePoint(p1, p2) {
    return p1.row == p2.row && p1.column == p2.column;
}

function onMouseDown(e) {
    var ev = e.domEvent;
    var alt = ev.altKey;
    var shift = ev.shiftKey;
    var ctrl = e.getAccelKey();
    var button = e.getButton();

    if (e.editor.inMultiSelectMode && button == 2) {
        e.editor.textInput.onContextMenu(e.domEvent);
        return;
    }
    
    if (!ctrl && !alt) {
        if (button == 0 && e.editor.inMultiSelectMode)
            e.editor.exitMultiSelectMode();
        return;
    }

    var editor = e.editor;
    var selection = editor.selection;
    var isMultiSelect = editor.inMultiSelectMode;
    var pos = e.getDocumentPosition();
    var cursor = selection.getCursor();
    var inSelection = e.inSelection() || (selection.isEmpty() && isSamePoint(pos, cursor));


    var mouseX = e.x, mouseY = e.y;
    var onMouseSelection = function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    };

    var blockSelect = function() {
        var newCursor = editor.renderer.pixelToScreenCoordinates(mouseX, mouseY);
        var cursor = session.screenToDocumentPosition(newCursor.row, newCursor.column);

        if (isSamePoint(screenCursor, newCursor)
            && isSamePoint(cursor, selection.selectionLead))
            return;
        screenCursor = newCursor;

        editor.selection.moveCursorToPosition(cursor);
        editor.selection.clearSelection();
        editor.renderer.scrollCursorIntoView();

        editor.removeSelectionMarkers(rectSel);
        rectSel = selection.rectangularRangeBlock(screenCursor, screenAnchor);
        rectSel.forEach(editor.addSelectionMarker, editor);
        editor.updateSelectionMarkers();
    };
    
    var session = editor.session;
    var screenAnchor = editor.renderer.pixelToScreenCoordinates(mouseX, mouseY);
    var screenCursor = screenAnchor;

    

    if (ctrl && !shift && !alt && button == 0) {
        if (!isMultiSelect && inSelection)
            return; // dragging

        if (!isMultiSelect) {
            var range = selection.toOrientedRange();
            editor.addSelectionMarker(range);
        }

        var oldRange = selection.rangeList.rangeAtPoint(pos);

        editor.once("mouseup", function() {
            var tmpSel = selection.toOrientedRange();

            if (oldRange && tmpSel.isEmpty() && isSamePoint(oldRange.cursor, tmpSel.cursor))
                selection.substractPoint(tmpSel.cursor);
            else {
                if (range) {
                    editor.removeSelectionMarker(range);
                    selection.addRange(range);
                }
                selection.addRange(tmpSel);
            }
        });

    } else if (alt && button == 0) {
        e.stop();

        if (isMultiSelect && !ctrl)
            selection.toSingleRange();
        else if (!isMultiSelect && ctrl)
            selection.addRange();

        var rectSel = [];
        if (shift) {
            screenAnchor = session.documentToScreenPosition(selection.lead);
            blockSelect();
        } else {
            selection.moveCursorToPosition(pos);
            selection.clearSelection();
        }


        var onMouseSelectionEnd = function(e) {
            clearInterval(timerId);
            editor.removeSelectionMarkers(rectSel);
            for (var i = 0; i < rectSel.length; i++)
                selection.addRange(rectSel[i]);
        };

        var onSelectionInterval = blockSelect;

        event.capture(editor.container, onMouseSelection, onMouseSelectionEnd);
        var timerId = setInterval(function() {onSelectionInterval();}, 20);

        return e.preventDefault();
    }
}


exports.onMouseDown = onMouseDown;

});

ace.define('ace/commands/multi_select_commands', ["require", 'exports', 'module' , 'ace/keyboard/hash_handler'], function(acequire, exports, module) {
exports.defaultCommands = [{
    name: "addCursorAbove",
    exec: function(editor) { editor.selectMoreLines(-1); },
    bindKey: {win: "Ctrl-Alt-Up", mac: "Ctrl-Alt-Up"},
    readonly: true
}, {
    name: "addCursorBelow",
    exec: function(editor) { editor.selectMoreLines(1); },
    bindKey: {win: "Ctrl-Alt-Down", mac: "Ctrl-Alt-Down"},
    readonly: true
}, {
    name: "addCursorAboveSkipCurrent",
    exec: function(editor) { editor.selectMoreLines(-1, true); },
    bindKey: {win: "Ctrl-Alt-Shift-Up", mac: "Ctrl-Alt-Shift-Up"},
    readonly: true
}, {
    name: "addCursorBelowSkipCurrent",
    exec: function(editor) { editor.selectMoreLines(1, true); },
    bindKey: {win: "Ctrl-Alt-Shift-Down", mac: "Ctrl-Alt-Shift-Down"},
    readonly: true
}, {
    name: "selectMoreBefore",
    exec: function(editor) { editor.selectMore(-1); },
    bindKey: {win: "Ctrl-Alt-Left", mac: "Ctrl-Alt-Left"},
    readonly: true
}, {
    name: "selectMoreAfter",
    exec: function(editor) { editor.selectMore(1); },
    bindKey: {win: "Ctrl-Alt-Right", mac: "Ctrl-Alt-Right"},
    readonly: true
}, {
    name: "selectNextBefore",
    exec: function(editor) { editor.selectMore(-1, true); },
    bindKey: {win: "Ctrl-Alt-Shift-Left", mac: "Ctrl-Alt-Shift-Left"},
    readonly: true
}, {
    name: "selectNextAfter",
    exec: function(editor) { editor.selectMore(1, true); },
    bindKey: {win: "Ctrl-Alt-Shift-Right", mac: "Ctrl-Alt-Shift-Right"},
    readonly: true
}, {
    name: "splitIntoLines",
    exec: function(editor) { editor.multiSelect.splitIntoLines(); },
    bindKey: {win: "Ctrl-Alt-L", mac: "Ctrl-Alt-L"},
    readonly: true
}, {
    name: "alignCursors",
    exec: function(editor) { editor.alignCursors(); },
    bindKey: {win: "Ctrl-Alt-A", mac: "Ctrl-Alt-A"}
}];
exports.multiSelectCommands = [{
    name: "singleSelection",
    bindKey: "esc",
    exec: function(editor) { editor.exitMultiSelectMode(); },
    readonly: true,
    isAvailable: function(editor) {return editor && editor.inMultiSelectMode}
}];

var HashHandler = acequire("../keyboard/hash_handler").HashHandler;
exports.keyboardHandler = new HashHandler(exports.multiSelectCommands);

});

ace.define('ace/worker/worker_client', ["require", 'exports', 'module' , 'ace/lib/oop', 'ace/lib/event_emitter', 'ace/config'], function(acequire, exports, module) {


var oop = acequire("../lib/oop");
var EventEmitter = acequire("../lib/event_emitter").EventEmitter;
var config = acequire("../config");

var WorkerClient = function(topLevelNamespaces, mod, classname) {
    this.changeListener = this.changeListener.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onError = this.onError.bind(this);

    var workerUrl;
    if (config.get("packaged")) {
        workerUrl = config.moduleUrl(mod, "worker");
    } else {
        var normalizePath = this.$normalizePath;
        if (acequire.nameToUrl && !acequire.toUrl)
            acequire.toUrl = acequire.nameToUrl;
        workerUrl = normalizePath(acequire.toUrl("ace/worker/worker.js", null, "_"));

        var tlns = {};
        topLevelNamespaces.forEach(function(ns) {
            tlns[ns] = normalizePath(acequire.toUrl(ns, null, "_").replace(/(\.js)?(\?.*)?$/, ""));
        });
    }

    var workerSrc = "\"no use strict\";\n;(function(window) {\nif (typeof window.window != \"undefined\" && window.document) {\n    return;\n}\n\nwindow.console = {\n    log: function() {\n        var msgs = Array.prototype.slice.call(arguments, 0);\n        postMessage({type: \"log\", data: msgs});\n    },\n    error: function() {\n        var msgs = Array.prototype.slice.call(arguments, 0);\n        postMessage({type: \"log\", data: msgs});\n    }\n};\nwindow.window = window;\nwindow.ace = window;\n\nwindow.normalizeModule = function(parentId, moduleName) {\n    // normalize plugin acequires\n    if (moduleName.indexOf(\"!\") !== -1) {\n        var chunks = moduleName.split(\"!\");\n        return normalizeModule(parentId, chunks[0]) + \"!\" + normalizeModule(parentId, chunks[1]);\n    }\n    // normalize relative acequires\n    if (moduleName.charAt(0) == \".\") {\n        var base = parentId.split(\"/\").slice(0, -1).join(\"/\");\n        moduleName = base + \"/\" + moduleName;\n        \n        while(moduleName.indexOf(\".\") !== -1 && previous != moduleName) {\n            var previous = moduleName;\n            moduleName = moduleName.replace(/\\/\\.\\//, \"/\").replace(/[^\\/]+\\/\\.\\.\\//, \"\");\n        }\n    }\n    \n    return moduleName;\n};\n\nwindow.acequire = function(parentId, id) {\n    if (!id.charAt)\n        throw new Error(\"worker.js acequire() accepts only (parentId, id) as arguments\");\n\n    id = normalizeModule(parentId, id);\n\n    var module = acequire.modules[id];\n    if (module) {\n        if (!module.initialized) {\n            module.initialized = true;\n            module.exports = module.factory().exports;\n        }\n        return module.exports;\n    }\n    \n    var chunks = id.split(\"/\");\n    chunks[0] = acequire.tlns[chunks[0]] || chunks[0];\n    var path = chunks.join(\"/\") + \".js\";\n    \n    acequire.id = id;\n    importScripts(path);\n    return acequire(parentId, id);    \n};\n\nacequire.modules = {};\nacequire.tlns = {};\n\nwindow.define = function(id, deps, factory) {\n    if (arguments.length == 2) {\n        factory = deps;\n        if (typeof id != \"string\") {\n            deps = id;\n            id = acequire.id;\n        }\n    } else if (arguments.length == 1) {\n        factory = id;\n        id = acequire.id;\n    }\n\n    if (id.indexOf(\"text!\") === 0) \n        return;\n    \n    var req = function(deps, factory) {\n        return acequire(id, deps, factory);\n    };\n\n    acequire.modules[id] = {\n        factory: function() {\n            var module = {\n                exports: {}\n            };\n            var returnExports = factory(req, module.exports, module);\n            if (returnExports)\n                module.exports = returnExports;\n            return module;\n        }\n    };\n};\n\nwindow.initBaseUrls  = function initBaseUrls(topLevelNamespaces) {\n    acequire.tlns = topLevelNamespaces;\n}\n\nwindow.initSender = function initSender() {\n\n    var EventEmitter = acequire(null, \"ace/lib/event_emitter\").EventEmitter;\n    var oop = acequire(null, \"ace/lib/oop\");\n    \n    var Sender = function() {};\n    \n    (function() {\n        \n        oop.implement(this, EventEmitter);\n                \n        this.callback = function(data, callbackId) {\n            postMessage({\n                type: \"call\",\n                id: callbackId,\n                data: data\n            });\n        };\n    \n        this.emit = function(name, data) {\n            postMessage({\n                type: \"event\",\n                name: name,\n                data: data\n            });\n        };\n        \n    }).call(Sender.prototype);\n    \n    return new Sender();\n}\n\nwindow.main = null;\nwindow.sender = null;\n\nwindow.onmessage = function(e) {\n    var msg = e.data;\n    if (msg.command) {\n        if (main[msg.command])\n            main[msg.command].apply(main, msg.args);\n        else\n            throw new Error(\"Unknown command:\" + msg.command);\n    }\n    else if (msg.init) {        \n        initBaseUrls(msg.tlns);\n        acequire(null, \"ace/lib/fixoldbrowsers\");\n        sender = initSender();\n        var clazz = acequire(null, msg.module)[msg.classname];\n        main = new clazz(sender);\n    } \n    else if (msg.event && sender) {\n        sender._emit(msg.event, msg.data);\n    }\n};\n})(this);// vim:set ts=4 sts=4 sw=4 st:\n\nace.define('ace/lib/fixoldbrowsers', [\"require\", 'exports', 'module' , 'ace/lib/regexp', 'ace/lib/es5-shim'], function(acequire, exports, module) {\n\n\nacequire(\"./regexp\");\nacequire(\"./es5-shim\");\n\n});\n \nace.define('ace/lib/regexp', [\"require\", 'exports', 'module' ], function(acequire, exports, module) {\n\n    var real = {\n            exec: RegExp.prototype.exec,\n            test: RegExp.prototype.test,\n            match: String.prototype.match,\n            replace: String.prototype.replace,\n            split: String.prototype.split\n        },\n        compliantExecNpcg = real.exec.call(/()??/, \"\")[1] === undefined, // check `exec` handling of nonparticipating capturing groups\n        compliantLastIndexIncrement = function () {\n            var x = /^/g;\n            real.test.call(x, \"\");\n            return !x.lastIndex;\n        }();\n\n    if (compliantLastIndexIncrement && compliantExecNpcg)\n        return;\n    RegExp.prototype.exec = function (str) {\n        var match = real.exec.apply(this, arguments),\n            name, r2;\n        if ( typeof(str) == 'string' && match) {\n            if (!compliantExecNpcg && match.length > 1 && indexOf(match, \"\") > -1) {\n                r2 = RegExp(this.source, real.replace.call(getNativeFlags(this), \"g\", \"\"));\n                real.replace.call(str.slice(match.index), r2, function () {\n                    for (var i = 1; i < arguments.length - 2; i++) {\n                        if (arguments[i] === undefined)\n                            match[i] = undefined;\n                    }\n                });\n            }\n            if (this._xregexp && this._xregexp.captureNames) {\n                for (var i = 1; i < match.length; i++) {\n                    name = this._xregexp.captureNames[i - 1];\n                    if (name)\n                       match[name] = match[i];\n                }\n            }\n            if (!compliantLastIndexIncrement && this.global && !match[0].length && (this.lastIndex > match.index))\n                this.lastIndex--;\n        }\n        return match;\n    };\n    if (!compliantLastIndexIncrement) {\n        RegExp.prototype.test = function (str) {\n            var match = real.exec.call(this, str);\n            if (match && this.global && !match[0].length && (this.lastIndex > match.index))\n                this.lastIndex--;\n            return !!match;\n        };\n    }\n\n    function getNativeFlags (regex) {\n        return (regex.global     ? \"g\" : \"\") +\n               (regex.ignoreCase ? \"i\" : \"\") +\n               (regex.multiline  ? \"m\" : \"\") +\n               (regex.extended   ? \"x\" : \"\") + // Proposed for ES4; included in AS3\n               (regex.sticky     ? \"y\" : \"\");\n    }\n\n    function indexOf (array, item, from) {\n        if (Array.prototype.indexOf) // Use the native array method if available\n            return array.indexOf(item, from);\n        for (var i = from || 0; i < array.length; i++) {\n            if (array[i] === item)\n                return i;\n        }\n        return -1;\n    }\n\n});\n\nace.define('ace/lib/es5-shim', [\"require\", 'exports', 'module' ], function(acequire, exports, module) {\n\nfunction Empty() {}\n\nif (!Function.prototype.bind) {\n    Function.prototype.bind = function bind(that) { // .length is 1\n        var target = this;\n        if (typeof target != \"function\") {\n            throw new TypeError(\"Function.prototype.bind called on incompatible \" + target);\n        }\n        var args = slice.call(arguments, 1); // for normal call\n        var bound = function () {\n\n            if (this instanceof bound) {\n\n                var result = target.apply(\n                    this,\n                    args.concat(slice.call(arguments))\n                );\n                if (Object(result) === result) {\n                    return result;\n                }\n                return this;\n\n            } else {\n                return target.apply(\n                    that,\n                    args.concat(slice.call(arguments))\n                );\n\n            }\n\n        };\n        if(target.prototype) {\n            Empty.prototype = target.prototype;\n            bound.prototype = new Empty();\n            Empty.prototype = null;\n        }\n        return bound;\n    };\n}\nvar call = Function.prototype.call;\nvar prototypeOfArray = Array.prototype;\nvar prototypeOfObject = Object.prototype;\nvar slice = prototypeOfArray.slice;\nvar _toString = call.bind(prototypeOfObject.toString);\nvar owns = call.bind(prototypeOfObject.hasOwnProperty);\nvar defineGetter;\nvar defineSetter;\nvar lookupGetter;\nvar lookupSetter;\nvar supportsAccessors;\nif ((supportsAccessors = owns(prototypeOfObject, \"__defineGetter__\"))) {\n    defineGetter = call.bind(prototypeOfObject.__defineGetter__);\n    defineSetter = call.bind(prototypeOfObject.__defineSetter__);\n    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);\n    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);\n}\nif ([1,2].splice(0).length != 2) {\n    if(function() { // test IE < 9 to splice bug - see issue #138\n        function makeArray(l) {\n            var a = new Array(l+2);\n            a[0] = a[1] = 0;\n            return a;\n        }\n        var array = [], lengthBefore;\n        \n        array.splice.apply(array, makeArray(20));\n        array.splice.apply(array, makeArray(26));\n\n        lengthBefore = array.length; //46\n        array.splice(5, 0, \"XXX\"); // add one element\n\n        lengthBefore + 1 == array.length\n\n        if (lengthBefore + 1 == array.length) {\n            return true;// has right splice implementation without bugs\n        }\n    }()) {//IE 6/7\n        var array_splice = Array.prototype.splice;\n        Array.prototype.splice = function(start, deleteCount) {\n            if (!arguments.length) {\n                return [];\n            } else {\n                return array_splice.apply(this, [\n                    start === void 0 ? 0 : start,\n                    deleteCount === void 0 ? (this.length - start) : deleteCount\n                ].concat(slice.call(arguments, 2)))\n            }\n        };\n    } else {//IE8\n        Array.prototype.splice = function(pos, removeCount){\n            var length = this.length;\n            if (pos > 0) {\n                if (pos > length)\n                    pos = length;\n            } else if (pos == void 0) {\n                pos = 0;\n            } else if (pos < 0) {\n                pos = Math.max(length + pos, 0);\n            }\n\n            if (!(pos+removeCount < length))\n                removeCount = length - pos;\n\n            var removed = this.slice(pos, pos+removeCount);\n            var insert = slice.call(arguments, 2);\n            var add = insert.length;            \n            if (pos === length) {\n                if (add) {\n                    this.push.apply(this, insert);\n                }\n            } else {\n                var remove = Math.min(removeCount, length - pos);\n                var tailOldPos = pos + remove;\n                var tailNewPos = tailOldPos + add - remove;\n                var tailCount = length - tailOldPos;\n                var lengthAfterRemove = length - remove;\n\n                if (tailNewPos < tailOldPos) { // case A\n                    for (var i = 0; i < tailCount; ++i) {\n                        this[tailNewPos+i] = this[tailOldPos+i];\n                    }\n                } else if (tailNewPos > tailOldPos) { // case B\n                    for (i = tailCount; i--; ) {\n                        this[tailNewPos+i] = this[tailOldPos+i];\n                    }\n                } // else, add == remove (nothing to do)\n\n                if (add && pos === lengthAfterRemove) {\n                    this.length = lengthAfterRemove; // truncate array\n                    this.push.apply(this, insert);\n                } else {\n                    this.length = lengthAfterRemove + add; // reserves space\n                    for (i = 0; i < add; ++i) {\n                        this[pos+i] = insert[i];\n                    }\n                }\n            }\n            return removed;\n        };\n    }\n}\nif (!Array.isArray) {\n    Array.isArray = function isArray(obj) {\n        return _toString(obj) == \"[object Array]\";\n    };\n}\nvar boxedString = Object(\"a\"),\n    splitString = boxedString[0] != \"a\" || !(0 in boxedString);\n\nif (!Array.prototype.forEach) {\n    Array.prototype.forEach = function forEach(fun /*, thisp*/) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            thisp = arguments[1],\n            i = -1,\n            length = self.length >>> 0;\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        while (++i < length) {\n            if (i in self) {\n                fun.call(thisp, self[i], i, object);\n            }\n        }\n    };\n}\nif (!Array.prototype.map) {\n    Array.prototype.map = function map(fun /*, thisp*/) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0,\n            result = Array(length),\n            thisp = arguments[1];\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self)\n                result[i] = fun.call(thisp, self[i], i, object);\n        }\n        return result;\n    };\n}\nif (!Array.prototype.filter) {\n    Array.prototype.filter = function filter(fun /*, thisp */) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                    object,\n            length = self.length >>> 0,\n            result = [],\n            value,\n            thisp = arguments[1];\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self) {\n                value = self[i];\n                if (fun.call(thisp, value, i, object)) {\n                    result.push(value);\n                }\n            }\n        }\n        return result;\n    };\n}\nif (!Array.prototype.every) {\n    Array.prototype.every = function every(fun /*, thisp */) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0,\n            thisp = arguments[1];\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self && !fun.call(thisp, self[i], i, object)) {\n                return false;\n            }\n        }\n        return true;\n    };\n}\nif (!Array.prototype.some) {\n    Array.prototype.some = function some(fun /*, thisp */) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0,\n            thisp = arguments[1];\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self && fun.call(thisp, self[i], i, object)) {\n                return true;\n            }\n        }\n        return false;\n    };\n}\nif (!Array.prototype.reduce) {\n    Array.prototype.reduce = function reduce(fun /*, initial*/) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0;\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n        if (!length && arguments.length == 1) {\n            throw new TypeError(\"reduce of empty array with no initial value\");\n        }\n\n        var i = 0;\n        var result;\n        if (arguments.length >= 2) {\n            result = arguments[1];\n        } else {\n            do {\n                if (i in self) {\n                    result = self[i++];\n                    break;\n                }\n                if (++i >= length) {\n                    throw new TypeError(\"reduce of empty array with no initial value\");\n                }\n            } while (true);\n        }\n\n        for (; i < length; i++) {\n            if (i in self) {\n                result = fun.call(void 0, result, self[i], i, object);\n            }\n        }\n\n        return result;\n    };\n}\nif (!Array.prototype.reduceRight) {\n    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0;\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n        if (!length && arguments.length == 1) {\n            throw new TypeError(\"reduceRight of empty array with no initial value\");\n        }\n\n        var result, i = length - 1;\n        if (arguments.length >= 2) {\n            result = arguments[1];\n        } else {\n            do {\n                if (i in self) {\n                    result = self[i--];\n                    break;\n                }\n                if (--i < 0) {\n                    throw new TypeError(\"reduceRight of empty array with no initial value\");\n                }\n            } while (true);\n        }\n\n        do {\n            if (i in this) {\n                result = fun.call(void 0, result, self[i], i, object);\n            }\n        } while (i--);\n\n        return result;\n    };\n}\nif (!Array.prototype.indexOf || ([0, 1].indexOf(1, 2) != -1)) {\n    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {\n        var self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                toObject(this),\n            length = self.length >>> 0;\n\n        if (!length) {\n            return -1;\n        }\n\n        var i = 0;\n        if (arguments.length > 1) {\n            i = toInteger(arguments[1]);\n        }\n        i = i >= 0 ? i : Math.max(0, length + i);\n        for (; i < length; i++) {\n            if (i in self && self[i] === sought) {\n                return i;\n            }\n        }\n        return -1;\n    };\n}\nif (!Array.prototype.lastIndexOf || ([0, 1].lastIndexOf(0, -3) != -1)) {\n    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {\n        var self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                toObject(this),\n            length = self.length >>> 0;\n\n        if (!length) {\n            return -1;\n        }\n        var i = length - 1;\n        if (arguments.length > 1) {\n            i = Math.min(i, toInteger(arguments[1]));\n        }\n        i = i >= 0 ? i : length - Math.abs(i);\n        for (; i >= 0; i--) {\n            if (i in self && sought === self[i]) {\n                return i;\n            }\n        }\n        return -1;\n    };\n}\nif (!Object.getPrototypeOf) {\n    Object.getPrototypeOf = function getPrototypeOf(object) {\n        return object.__proto__ || (\n            object.constructor ?\n            object.constructor.prototype :\n            prototypeOfObject\n        );\n    };\n}\nif (!Object.getOwnPropertyDescriptor) {\n    var ERR_NON_OBJECT = \"Object.getOwnPropertyDescriptor called on a \" +\n                         \"non-object: \";\n    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {\n        if ((typeof object != \"object\" && typeof object != \"function\") || object === null)\n            throw new TypeError(ERR_NON_OBJECT + object);\n        if (!owns(object, property))\n            return;\n\n        var descriptor, getter, setter;\n        descriptor =  { enumerable: true, configurable: true };\n        if (supportsAccessors) {\n            var prototype = object.__proto__;\n            object.__proto__ = prototypeOfObject;\n\n            var getter = lookupGetter(object, property);\n            var setter = lookupSetter(object, property);\n            object.__proto__ = prototype;\n\n            if (getter || setter) {\n                if (getter) descriptor.get = getter;\n                if (setter) descriptor.set = setter;\n                return descriptor;\n            }\n        }\n        descriptor.value = object[property];\n        return descriptor;\n    };\n}\nif (!Object.getOwnPropertyNames) {\n    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {\n        return Object.keys(object);\n    };\n}\nif (!Object.create) {\n    var createEmpty;\n    if (Object.prototype.__proto__ === null) {\n        createEmpty = function () {\n            return { \"__proto__\": null };\n        };\n    } else {\n        createEmpty = function () {\n            var empty = {};\n            for (var i in empty)\n                empty[i] = null;\n            empty.constructor =\n            empty.hasOwnProperty =\n            empty.propertyIsEnumerable =\n            empty.isPrototypeOf =\n            empty.toLocaleString =\n            empty.toString =\n            empty.valueOf =\n            empty.__proto__ = null;\n            return empty;\n        }\n    }\n\n    Object.create = function create(prototype, properties) {\n        var object;\n        if (prototype === null) {\n            object = createEmpty();\n        } else {\n            if (typeof prototype != \"object\")\n                throw new TypeError(\"typeof prototype[\"+(typeof prototype)+\"] != 'object'\");\n            var Type = function () {};\n            Type.prototype = prototype;\n            object = new Type();\n            object.__proto__ = prototype;\n        }\n        if (properties !== void 0)\n            Object.defineProperties(object, properties);\n        return object;\n    };\n}\n\nfunction doesDefinePropertyWork(object) {\n    try {\n        Object.defineProperty(object, \"sentinel\", {});\n        return \"sentinel\" in object;\n    } catch (exception) {\n    }\n}\nif (Object.defineProperty) {\n    var definePropertyWorksOnObject = doesDefinePropertyWork({});\n    var definePropertyWorksOnDom = typeof document == \"undefined\" ||\n        doesDefinePropertyWork(document.createElement(\"div\"));\n    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {\n        var definePropertyFallback = Object.defineProperty;\n    }\n}\n\nif (!Object.defineProperty || definePropertyFallback) {\n    var ERR_NON_OBJECT_DESCRIPTOR = \"Property description must be an object: \";\n    var ERR_NON_OBJECT_TARGET = \"Object.defineProperty called on non-object: \"\n    var ERR_ACCESSORS_NOT_SUPPORTED = \"getters & setters can not be defined \" +\n                                      \"on this javascript engine\";\n\n    Object.defineProperty = function defineProperty(object, property, descriptor) {\n        if ((typeof object != \"object\" && typeof object != \"function\") || object === null)\n            throw new TypeError(ERR_NON_OBJECT_TARGET + object);\n        if ((typeof descriptor != \"object\" && typeof descriptor != \"function\") || descriptor === null)\n            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);\n        if (definePropertyFallback) {\n            try {\n                return definePropertyFallback.call(Object, object, property, descriptor);\n            } catch (exception) {\n            }\n        }\n        if (owns(descriptor, \"value\")) {\n\n            if (supportsAccessors && (lookupGetter(object, property) ||\n                                      lookupSetter(object, property)))\n            {\n                var prototype = object.__proto__;\n                object.__proto__ = prototypeOfObject;\n                delete object[property];\n                object[property] = descriptor.value;\n                object.__proto__ = prototype;\n            } else {\n                object[property] = descriptor.value;\n            }\n        } else {\n            if (!supportsAccessors)\n                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);\n            if (owns(descriptor, \"get\"))\n                defineGetter(object, property, descriptor.get);\n            if (owns(descriptor, \"set\"))\n                defineSetter(object, property, descriptor.set);\n        }\n\n        return object;\n    };\n}\nif (!Object.defineProperties) {\n    Object.defineProperties = function defineProperties(object, properties) {\n        for (var property in properties) {\n            if (owns(properties, property))\n                Object.defineProperty(object, property, properties[property]);\n        }\n        return object;\n    };\n}\nif (!Object.seal) {\n    Object.seal = function seal(object) {\n        return object;\n    };\n}\nif (!Object.freeze) {\n    Object.freeze = function freeze(object) {\n        return object;\n    };\n}\ntry {\n    Object.freeze(function () {});\n} catch (exception) {\n    Object.freeze = (function freeze(freezeObject) {\n        return function freeze(object) {\n            if (typeof object == \"function\") {\n                return object;\n            } else {\n                return freezeObject(object);\n            }\n        };\n    })(Object.freeze);\n}\nif (!Object.preventExtensions) {\n    Object.preventExtensions = function preventExtensions(object) {\n        return object;\n    };\n}\nif (!Object.isSealed) {\n    Object.isSealed = function isSealed(object) {\n        return false;\n    };\n}\nif (!Object.isFrozen) {\n    Object.isFrozen = function isFrozen(object) {\n        return false;\n    };\n}\nif (!Object.isExtensible) {\n    Object.isExtensible = function isExtensible(object) {\n        if (Object(object) === object) {\n            throw new TypeError(); // TODO message\n        }\n        var name = '';\n        while (owns(object, name)) {\n            name += '?';\n        }\n        object[name] = true;\n        var returnValue = owns(object, name);\n        delete object[name];\n        return returnValue;\n    };\n}\nif (!Object.keys) {\n    var hasDontEnumBug = true,\n        dontEnums = [\n            \"toString\",\n            \"toLocaleString\",\n            \"valueOf\",\n            \"hasOwnProperty\",\n            \"isPrototypeOf\",\n            \"propertyIsEnumerable\",\n            \"constructor\"\n        ],\n        dontEnumsLength = dontEnums.length;\n\n    for (var key in {\"toString\": null}) {\n        hasDontEnumBug = false;\n    }\n\n    Object.keys = function keys(object) {\n\n        if (\n            (typeof object != \"object\" && typeof object != \"function\") ||\n            object === null\n        ) {\n            throw new TypeError(\"Object.keys called on a non-object\");\n        }\n\n        var keys = [];\n        for (var name in object) {\n            if (owns(object, name)) {\n                keys.push(name);\n            }\n        }\n\n        if (hasDontEnumBug) {\n            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {\n                var dontEnum = dontEnums[i];\n                if (owns(object, dontEnum)) {\n                    keys.push(dontEnum);\n                }\n            }\n        }\n        return keys;\n    };\n\n}\nif (!Date.now) {\n    Date.now = function now() {\n        return new Date().getTime();\n    };\n}\nvar ws = \"\\x09\\x0A\\x0B\\x0C\\x0D\\x20\\xA0\\u1680\\u180E\\u2000\\u2001\\u2002\\u2003\" +\n    \"\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u202F\\u205F\\u3000\\u2028\" +\n    \"\\u2029\\uFEFF\";\nif (!String.prototype.trim || ws.trim()) {\n    ws = \"[\" + ws + \"]\";\n    var trimBeginRegexp = new RegExp(\"^\" + ws + ws + \"*\"),\n        trimEndRegexp = new RegExp(ws + ws + \"*$\");\n    String.prototype.trim = function trim() {\n        return String(this).replace(trimBeginRegexp, \"\").replace(trimEndRegexp, \"\");\n    };\n}\n\nfunction toInteger(n) {\n    n = +n;\n    if (n !== n) { // isNaN\n        n = 0;\n    } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {\n        n = (n > 0 || -1) * Math.floor(Math.abs(n));\n    }\n    return n;\n}\n\nfunction isPrimitive(input) {\n    var type = typeof input;\n    return (\n        input === null ||\n        type === \"undefined\" ||\n        type === \"boolean\" ||\n        type === \"number\" ||\n        type === \"string\"\n    );\n}\n\nfunction toPrimitive(input) {\n    var val, valueOf, toString;\n    if (isPrimitive(input)) {\n        return input;\n    }\n    valueOf = input.valueOf;\n    if (typeof valueOf === \"function\") {\n        val = valueOf.call(input);\n        if (isPrimitive(val)) {\n            return val;\n        }\n    }\n    toString = input.toString;\n    if (typeof toString === \"function\") {\n        val = toString.call(input);\n        if (isPrimitive(val)) {\n            return val;\n        }\n    }\n    throw new TypeError();\n}\nvar toObject = function (o) {\n    if (o == null) { // this matches both null and undefined\n        throw new TypeError(\"can't convert \"+o+\" to object\");\n    }\n    return Object(o);\n};\n\n});\n\nace.define('ace/lib/event_emitter', [\"require\", 'exports', 'module' ], function(acequire, exports, module) {\n\n\nvar EventEmitter = {};\nvar stopPropagation = function() { this.propagationStopped = true; };\nvar preventDefault = function() { this.defaultPrevented = true; };\n\nEventEmitter._emit =\nEventEmitter._dispatchEvent = function(eventName, e) {\n    this._eventRegistry || (this._eventRegistry = {});\n    this._defaultHandlers || (this._defaultHandlers = {});\n\n    var listeners = this._eventRegistry[eventName] || [];\n    var defaultHandler = this._defaultHandlers[eventName];\n    if (!listeners.length && !defaultHandler)\n        return;\n\n    if (typeof e != \"object\" || !e)\n        e = {};\n\n    if (!e.type)\n        e.type = eventName;\n    if (!e.stopPropagation)\n        e.stopPropagation = stopPropagation;\n    if (!e.preventDefault)\n        e.preventDefault = preventDefault;\n\n    for (var i=0; i<listeners.length; i++) {\n        listeners[i](e, this);\n        if (e.propagationStopped)\n            break;\n    }\n    \n    if (defaultHandler && !e.defaultPrevented)\n        return defaultHandler(e, this);\n};\n\n\nEventEmitter._signal = function(eventName, e) {\n    var listeners = (this._eventRegistry || {})[eventName];\n    if (!listeners)\n        return;\n\n    for (var i=0; i<listeners.length; i++)\n        listeners[i](e, this);\n};\n\nEventEmitter.once = function(eventName, callback) {\n    var _self = this;\n    callback && this.addEventListener(eventName, function newCallback() {\n        _self.removeEventListener(eventName, newCallback);\n        callback.apply(null, arguments);\n    });\n};\n\n\nEventEmitter.setDefaultHandler = function(eventName, callback) {\n    this._defaultHandlers = this._defaultHandlers || {};\n    \n    if (this._defaultHandlers[eventName])\n        throw new Error(\"The default handler for '\" + eventName + \"' is already set\");\n        \n    this._defaultHandlers[eventName] = callback;\n};\n\nEventEmitter.on =\nEventEmitter.addEventListener = function(eventName, callback, capturing) {\n    this._eventRegistry = this._eventRegistry || {};\n\n    var listeners = this._eventRegistry[eventName];\n    if (!listeners)\n        listeners = this._eventRegistry[eventName] = [];\n\n    if (listeners.indexOf(callback) == -1)\n        listeners[capturing ? \"unshift\" : \"push\"](callback);\n    return callback;\n};\n\nEventEmitter.off =\nEventEmitter.removeListener =\nEventEmitter.removeEventListener = function(eventName, callback) {\n    this._eventRegistry = this._eventRegistry || {};\n\n    var listeners = this._eventRegistry[eventName];\n    if (!listeners)\n        return;\n\n    var index = listeners.indexOf(callback);\n    if (index !== -1)\n        listeners.splice(index, 1);\n};\n\nEventEmitter.removeAllListeners = function(eventName) {\n    if (this._eventRegistry) this._eventRegistry[eventName] = [];\n};\n\nexports.EventEmitter = EventEmitter;\n\n});\n\nace.define('ace/lib/oop', [\"require\", 'exports', 'module' ], function(acequire, exports, module) {\n\n\nexports.inherits = (function() {\n    var tempCtor = function() {};\n    return function(ctor, superCtor) {\n        tempCtor.prototype = superCtor.prototype;\n        ctor.super_ = superCtor.prototype;\n        ctor.prototype = new tempCtor();\n        ctor.prototype.constructor = ctor;\n    };\n}());\n\nexports.mixin = function(obj, mixin) {\n    for (var key in mixin) {\n        obj[key] = mixin[key];\n    }\n    return obj;\n};\n\nexports.implement = function(proto, mixin) {\n    exports.mixin(proto, mixin);\n};\n\n});\n\nace.define('ace/mode/css_worker', [\"require\", 'exports', 'module' , 'ace/lib/oop', 'ace/lib/lang', 'ace/worker/mirror', 'ace/mode/css/csslint'], function(acequire, exports, module) {\n\n\nvar oop = acequire(\"../lib/oop\");\nvar lang = acequire(\"../lib/lang\");\nvar Mirror = acequire(\"../worker/mirror\").Mirror;\nvar CSSLint = acequire(\"./css/csslint\").CSSLint;\n\nvar Worker = exports.Worker = function(sender) {\n    Mirror.call(this, sender);\n    this.setTimeout(400);\n    this.ruleset = null;\n    this.setDisabledRules(\"ids\");\n    this.setInfoRules(\"adjoining-classes|qualified-headings|zero-units|gradients|import|outline-none\");\n};\n\noop.inherits(Worker, Mirror);\n\n(function() {\n    this.setInfoRules = function(ruleNames) {\n        if (typeof ruleNames == \"string\")\n            ruleNames = ruleNames.split(\"|\");\n        this.infoRules = lang.arrayToMap(ruleNames);\n        this.doc.getValue() && this.deferredUpdate.schedule(100);\n    };\n\n    this.setDisabledRules = function(ruleNames) {\n        if (!ruleNames) {\n            this.ruleset = null;\n        } else {\n            if (typeof ruleNames == \"string\")\n                ruleNames = ruleNames.split(\"|\");\n            var all = {};\n\n            CSSLint.getRules().forEach(function(x){\n                all[x.id] = true;\n            });\n            ruleNames.forEach(function(x) {\n                delete all[x];\n            });\n            \n            this.ruleset = all;\n        }\n        this.doc.getValue() && this.deferredUpdate.schedule(100);\n    };\n\n    this.onUpdate = function() {\n        var value = this.doc.getValue();\n        var infoRules = this.infoRules;\n\n        var result = CSSLint.verify(value, this.ruleset);\n        this.sender.emit(\"csslint\", result.messages.map(function(msg) {\n            return {\n                row: msg.line - 1,\n                column: msg.col - 1,\n                text: msg.message,\n                type: infoRules[msg.rule.id] ? \"info\" : msg.type\n            }\n        }));\n    };\n\n}).call(Worker.prototype);\n\n});\n\nace.define('ace/lib/lang', [\"require\", 'exports', 'module' ], function(acequire, exports, module) {\n\n\nexports.stringReverse = function(string) {\n    return string.split(\"\").reverse().join(\"\");\n};\n\nexports.stringRepeat = function (string, count) {\n    var result = '';\n    while (count > 0) {\n        if (count & 1)\n            result += string;\n\n        if (count >>= 1)\n            string += string;\n    }\n    return result;\n};\n\nvar trimBeginRegexp = /^\\s\\s*/;\nvar trimEndRegexp = /\\s\\s*$/;\n\nexports.stringTrimLeft = function (string) {\n    return string.replace(trimBeginRegexp, '');\n};\n\nexports.stringTrimRight = function (string) {\n    return string.replace(trimEndRegexp, '');\n};\n\nexports.copyObject = function(obj) {\n    var copy = {};\n    for (var key in obj) {\n        copy[key] = obj[key];\n    }\n    return copy;\n};\n\nexports.copyArray = function(array){\n    var copy = [];\n    for (var i=0, l=array.length; i<l; i++) {\n        if (array[i] && typeof array[i] == \"object\")\n            copy[i] = this.copyObject( array[i] );\n        else \n            copy[i] = array[i];\n    }\n    return copy;\n};\n\nexports.deepCopy = function (obj) {\n    if (typeof obj != \"object\") {\n        return obj;\n    }\n    \n    var copy = obj.constructor();\n    for (var key in obj) {\n        if (typeof obj[key] == \"object\") {\n            copy[key] = this.deepCopy(obj[key]);\n        } else {\n            copy[key] = obj[key];\n        }\n    }\n    return copy;\n};\n\nexports.arrayToMap = function(arr) {\n    var map = {};\n    for (var i=0; i<arr.length; i++) {\n        map[arr[i]] = 1;\n    }\n    return map;\n\n};\n\nexports.createMap = function(props) {\n    var map = Object.create(null);\n    for (var i in props) {\n        map[i] = props[i];\n    }\n    return map;\n};\nexports.arrayRemove = function(array, value) {\n  for (var i = 0; i <= array.length; i++) {\n    if (value === array[i]) {\n      array.splice(i, 1);\n    }\n  }\n};\n\nexports.escapeRegExp = function(str) {\n    return str.replace(/([.*+?^${}()|[\\]\\/\\\\])/g, '\\\\$1');\n};\n\nexports.escapeHTML = function(str) {\n    return str.replace(/&/g, \"&#38;\").replace(/\"/g, \"&#34;\").replace(/'/g, \"&#39;\").replace(/</g, \"&#60;\");\n};\n\nexports.getMatchOffsets = function(string, regExp) {\n    var matches = [];\n\n    string.replace(regExp, function(str) {\n        matches.push({\n            offset: arguments[arguments.length-2],\n            length: str.length\n        });\n    });\n\n    return matches;\n};\nexports.deferredCall = function(fcn) {\n\n    var timer = null;\n    var callback = function() {\n        timer = null;\n        fcn();\n    };\n\n    var deferred = function(timeout) {\n        deferred.cancel();\n        timer = setTimeout(callback, timeout || 0);\n        return deferred;\n    };\n\n    deferred.schedule = deferred;\n\n    deferred.call = function() {\n        this.cancel();\n        fcn();\n        return deferred;\n    };\n\n    deferred.cancel = function() {\n        clearTimeout(timer);\n        timer = null;\n        return deferred;\n    };\n\n    return deferred;\n};\n\n\nexports.delayedCall = function(fcn, defaultTimeout) {\n    var timer = null;\n    var callback = function() {\n        timer = null;\n        fcn();\n    };\n\n    var _self = function(timeout) {\n        timer && clearTimeout(timer);\n        timer = setTimeout(callback, timeout || defaultTimeout);\n    };\n\n    _self.delay = _self;\n    _self.schedule = function(timeout) {\n        if (timer == null)\n            timer = setTimeout(callback, timeout || 0);\n    };\n\n    _self.call = function() {\n        this.cancel();\n        fcn();\n    };\n\n    _self.cancel = function() {\n        timer && clearTimeout(timer);\n        timer = null;\n    };\n\n    _self.isPending = function() {\n        return timer;\n    };\n\n    return _self;\n};\n});\nace.define('ace/worker/mirror', [\"require\", 'exports', 'module' , 'ace/document', 'ace/lib/lang'], function(acequire, exports, module) {\n\n\nvar Document = acequire(\"../document\").Document;\nvar lang = acequire(\"../lib/lang\");\n    \nvar Mirror = exports.Mirror = function(sender) {\n    this.sender = sender;\n    var doc = this.doc = new Document(\"\");\n    \n    var deferredUpdate = this.deferredUpdate = lang.delayedCall(this.onUpdate.bind(this));\n    \n    var _self = this;\n    sender.on(\"change\", function(e) {\n        doc.applyDeltas([e.data]);        \n        deferredUpdate.schedule(_self.$timeout);\n    });\n};\n\n(function() {\n    \n    this.$timeout = 500;\n    \n    this.setTimeout = function(timeout) {\n        this.$timeout = timeout;\n    };\n    \n    this.setValue = function(value) {\n        this.doc.setValue(value);\n        this.deferredUpdate.schedule(this.$timeout);\n    };\n    \n    this.getValue = function(callbackId) {\n        this.sender.callback(this.doc.getValue(), callbackId);\n    };\n    \n    this.onUpdate = function() {\n    };\n    \n}).call(Mirror.prototype);\n\n});\n\nace.define('ace/document', [\"require\", 'exports', 'module' , 'ace/lib/oop', 'ace/lib/event_emitter', 'ace/range', 'ace/anchor'], function(acequire, exports, module) {\n\n\nvar oop = acequire(\"./lib/oop\");\nvar EventEmitter = acequire(\"./lib/event_emitter\").EventEmitter;\nvar Range = acequire(\"./range\").Range;\nvar Anchor = acequire(\"./anchor\").Anchor;\n\nvar Document = function(text) {\n    this.$lines = [];\n    if (text.length == 0) {\n        this.$lines = [\"\"];\n    } else if (Array.isArray(text)) {\n        this.insertLines(0, text);\n    } else {\n        this.insert({row: 0, column:0}, text);\n    }\n};\n\n(function() {\n\n    oop.implement(this, EventEmitter);\n    this.setValue = function(text) {\n        var len = this.getLength();\n        this.remove(new Range(0, 0, len, this.getLine(len-1).length));\n        this.insert({row: 0, column:0}, text);\n    };\n    this.getValue = function() {\n        return this.getAllLines().join(this.getNewLineCharacter());\n    };\n    this.createAnchor = function(row, column) {\n        return new Anchor(this, row, column);\n    };\n    if (\"aaa\".split(/a/).length == 0)\n        this.$split = function(text) {\n            return text.replace(/\\r\\n|\\r/g, \"\\n\").split(\"\\n\");\n        }\n    else\n        this.$split = function(text) {\n            return text.split(/\\r\\n|\\r|\\n/);\n        };\n\n\n \n    this.$detectNewLine = function(text) {\n        var match = text.match(/^.*?(\\r\\n|\\r|\\n)/m);\n        if (match) {\n            this.$autoNewLine = match[1];\n        } else {\n            this.$autoNewLine = \"\\n\";\n        }\n    };\n    this.getNewLineCharacter = function() {\n        switch (this.$newLineMode) {\n          case \"windows\":\n            return \"\\r\\n\";\n\n          case \"unix\":\n            return \"\\n\";\n\n          default:\n            return this.$autoNewLine;\n        }\n    };\n\n    this.$autoNewLine = \"\\n\";\n    this.$newLineMode = \"auto\";\n    this.setNewLineMode = function(newLineMode) {\n        if (this.$newLineMode === newLineMode)\n            return;\n\n        this.$newLineMode = newLineMode;\n    };\n    this.getNewLineMode = function() {\n        return this.$newLineMode;\n    };\n    this.isNewLine = function(text) {\n        return (text == \"\\r\\n\" || text == \"\\r\" || text == \"\\n\");\n    };\n    this.getLine = function(row) {\n        return this.$lines[row] || \"\";\n    };\n    this.getLines = function(firstRow, lastRow) {\n        return this.$lines.slice(firstRow, lastRow + 1);\n    };\n    this.getAllLines = function() {\n        return this.getLines(0, this.getLength());\n    };\n    this.getLength = function() {\n        return this.$lines.length;\n    };\n    this.getTextRange = function(range) {\n        if (range.start.row == range.end.row) {\n            return this.$lines[range.start.row].substring(range.start.column,\n                                                         range.end.column);\n        }\n        else {\n            var lines = this.getLines(range.start.row+1, range.end.row-1);\n            lines.unshift((this.$lines[range.start.row] || \"\").substring(range.start.column));\n            lines.push((this.$lines[range.end.row] || \"\").substring(0, range.end.column));\n            return lines.join(this.getNewLineCharacter());\n        }\n    };\n\n    this.$clipPosition = function(position) {\n        var length = this.getLength();\n        if (position.row >= length) {\n            position.row = Math.max(0, length - 1);\n            position.column = this.getLine(length-1).length;\n        } else if (position.row < 0)\n            position.row = 0;\n        return position;\n    };\n    this.insert = function(position, text) {\n        if (!text || text.length === 0)\n            return position;\n\n        position = this.$clipPosition(position);\n        if (this.getLength() <= 1)\n            this.$detectNewLine(text);\n\n        var lines = this.$split(text);\n        var firstLine = lines.splice(0, 1)[0];\n        var lastLine = lines.length == 0 ? null : lines.splice(lines.length - 1, 1)[0];\n\n        position = this.insertInLine(position, firstLine);\n        if (lastLine !== null) {\n            position = this.insertNewLine(position); // terminate first line\n            position = this.insertLines(position.row, lines);\n            position = this.insertInLine(position, lastLine || \"\");\n        }\n        return position;\n    };\n    this.insertLines = function(row, lines) {\n        if (lines.length == 0)\n            return {row: row, column: 0};\n        if (lines.length > 0xFFFF) {\n            var end = this.insertLines(row, lines.slice(0xFFFF));\n            lines = lines.slice(0, 0xFFFF);\n        }\n\n        var args = [row, 0];\n        args.push.apply(args, lines);\n        this.$lines.splice.apply(this.$lines, args);\n\n        var range = new Range(row, 0, row + lines.length, 0);\n        var delta = {\n            action: \"insertLines\",\n            range: range,\n            lines: lines\n        };\n        this._emit(\"change\", { data: delta });\n        return end || range.end;\n    };\n    this.insertNewLine = function(position) {\n        position = this.$clipPosition(position);\n        var line = this.$lines[position.row] || \"\";\n\n        this.$lines[position.row] = line.substring(0, position.column);\n        this.$lines.splice(position.row + 1, 0, line.substring(position.column, line.length));\n\n        var end = {\n            row : position.row + 1,\n            column : 0\n        };\n\n        var delta = {\n            action: \"insertText\",\n            range: Range.fromPoints(position, end),\n            text: this.getNewLineCharacter()\n        };\n        this._emit(\"change\", { data: delta });\n\n        return end;\n    };\n    this.insertInLine = function(position, text) {\n        if (text.length == 0)\n            return position;\n\n        var line = this.$lines[position.row] || \"\";\n\n        this.$lines[position.row] = line.substring(0, position.column) + text\n                + line.substring(position.column);\n\n        var end = {\n            row : position.row,\n            column : position.column + text.length\n        };\n\n        var delta = {\n            action: \"insertText\",\n            range: Range.fromPoints(position, end),\n            text: text\n        };\n        this._emit(\"change\", { data: delta });\n\n        return end;\n    };\n    this.remove = function(range) {\n        range.start = this.$clipPosition(range.start);\n        range.end = this.$clipPosition(range.end);\n\n        if (range.isEmpty())\n            return range.start;\n\n        var firstRow = range.start.row;\n        var lastRow = range.end.row;\n\n        if (range.isMultiLine()) {\n            var firstFullRow = range.start.column == 0 ? firstRow : firstRow + 1;\n            var lastFullRow = lastRow - 1;\n\n            if (range.end.column > 0)\n                this.removeInLine(lastRow, 0, range.end.column);\n\n            if (lastFullRow >= firstFullRow)\n                this.removeLines(firstFullRow, lastFullRow);\n\n            if (firstFullRow != firstRow) {\n                this.removeInLine(firstRow, range.start.column, this.getLine(firstRow).length);\n                this.removeNewLine(range.start.row);\n            }\n        }\n        else {\n            this.removeInLine(firstRow, range.start.column, range.end.column);\n        }\n        return range.start;\n    };\n    this.removeInLine = function(row, startColumn, endColumn) {\n        if (startColumn == endColumn)\n            return;\n\n        var range = new Range(row, startColumn, row, endColumn);\n        var line = this.getLine(row);\n        var removed = line.substring(startColumn, endColumn);\n        var newLine = line.substring(0, startColumn) + line.substring(endColumn, line.length);\n        this.$lines.splice(row, 1, newLine);\n\n        var delta = {\n            action: \"removeText\",\n            range: range,\n            text: removed\n        };\n        this._emit(\"change\", { data: delta });\n        return range.start;\n    };\n    this.removeLines = function(firstRow, lastRow) {\n        var range = new Range(firstRow, 0, lastRow + 1, 0);\n        var removed = this.$lines.splice(firstRow, lastRow - firstRow + 1);\n\n        var delta = {\n            action: \"removeLines\",\n            range: range,\n            nl: this.getNewLineCharacter(),\n            lines: removed\n        };\n        this._emit(\"change\", { data: delta });\n        return removed;\n    };\n    this.removeNewLine = function(row) {\n        var firstLine = this.getLine(row);\n        var secondLine = this.getLine(row+1);\n\n        var range = new Range(row, firstLine.length, row+1, 0);\n        var line = firstLine + secondLine;\n\n        this.$lines.splice(row, 2, line);\n\n        var delta = {\n            action: \"removeText\",\n            range: range,\n            text: this.getNewLineCharacter()\n        };\n        this._emit(\"change\", { data: delta });\n    };\n    this.replace = function(range, text) {\n        if (text.length == 0 && range.isEmpty())\n            return range.start;\n        if (text == this.getTextRange(range))\n            return range.end;\n\n        this.remove(range);\n        if (text) {\n            var end = this.insert(range.start, text);\n        }\n        else {\n            end = range.start;\n        }\n\n        return end;\n    };\n    this.applyDeltas = function(deltas) {\n        for (var i=0; i<deltas.length; i++) {\n            var delta = deltas[i];\n            var range = Range.fromPoints(delta.range.start, delta.range.end);\n\n            if (delta.action == \"insertLines\")\n                this.insertLines(range.start.row, delta.lines);\n            else if (delta.action == \"insertText\")\n                this.insert(range.start, delta.text);\n            else if (delta.action == \"removeLines\")\n                this.removeLines(range.start.row, range.end.row - 1);\n            else if (delta.action == \"removeText\")\n                this.remove(range);\n        }\n    };\n    this.revertDeltas = function(deltas) {\n        for (var i=deltas.length-1; i>=0; i--) {\n            var delta = deltas[i];\n\n            var range = Range.fromPoints(delta.range.start, delta.range.end);\n\n            if (delta.action == \"insertLines\")\n                this.removeLines(range.start.row, range.end.row - 1);\n            else if (delta.action == \"insertText\")\n                this.remove(range);\n            else if (delta.action == \"removeLines\")\n                this.insertLines(range.start.row, delta.lines);\n            else if (delta.action == \"removeText\")\n                this.insert(range.start, delta.text);\n        }\n    };\n    this.indexToPosition = function(index, startRow) {\n        var lines = this.$lines || this.getAllLines();\n        var newlineLength = this.getNewLineCharacter().length;\n        for (var i = startRow || 0, l = lines.length; i < l; i++) {\n            index -= lines[i].length + newlineLength;\n            if (index < 0)\n                return {row: i, column: index + lines[i].length + newlineLength};\n        }\n        return {row: l-1, column: lines[l-1].length};\n    };\n    this.positionToIndex = function(pos, startRow) {\n        var lines = this.$lines || this.getAllLines();\n        var newlineLength = this.getNewLineCharacter().length;\n        var index = 0;\n        var row = Math.min(pos.row, lines.length);\n        for (var i = startRow || 0; i < row; ++i)\n            index += lines[i].length;\n\n        return index + newlineLength * i + pos.column;\n    };\n\n}).call(Document.prototype);\n\nexports.Document = Document;\n});\n\nace.define('ace/range', [\"require\", 'exports', 'module' ], function(acequire, exports, module) {\n\nvar comparePoints = function(p1, p2) {\n    return p1.row - p2.row || p1.column - p2.column;\n};\nvar Range = function(startRow, startColumn, endRow, endColumn) {\n    this.start = {\n        row: startRow,\n        column: startColumn\n    };\n\n    this.end = {\n        row: endRow,\n        column: endColumn\n    };\n};\n\n(function() {\n    this.isEqual = function(range) {\n        return this.start.row === range.start.row &&\n            this.end.row === range.end.row &&\n            this.start.column === range.start.column &&\n            this.end.column === range.end.column;\n    };\n    this.toString = function() {\n        return (\"Range: [\" + this.start.row + \"/\" + this.start.column +\n            \"] -> [\" + this.end.row + \"/\" + this.end.column + \"]\");\n    };\n\n    this.contains = function(row, column) {\n        return this.compare(row, column) == 0;\n    };\n    this.compareRange = function(range) {\n        var cmp,\n            end = range.end,\n            start = range.start;\n\n        cmp = this.compare(end.row, end.column);\n        if (cmp == 1) {\n            cmp = this.compare(start.row, start.column);\n            if (cmp == 1) {\n                return 2;\n            } else if (cmp == 0) {\n                return 1;\n            } else {\n                return 0;\n            }\n        } else if (cmp == -1) {\n            return -2;\n        } else {\n            cmp = this.compare(start.row, start.column);\n            if (cmp == -1) {\n                return -1;\n            } else if (cmp == 1) {\n                return 42;\n            } else {\n                return 0;\n            }\n        }\n    };\n    this.comparePoint = function(p) {\n        return this.compare(p.row, p.column);\n    };\n    this.containsRange = function(range) {\n        return this.comparePoint(range.start) == 0 && this.comparePoint(range.end) == 0;\n    };\n    this.intersects = function(range) {\n        var cmp = this.compareRange(range);\n        return (cmp == -1 || cmp == 0 || cmp == 1);\n    };\n    this.isEnd = function(row, column) {\n        return this.end.row == row && this.end.column == column;\n    };\n    this.isStart = function(row, column) {\n        return this.start.row == row && this.start.column == column;\n    };\n    this.setStart = function(row, column) {\n        if (typeof row == \"object\") {\n            this.start.column = row.column;\n            this.start.row = row.row;\n        } else {\n            this.start.row = row;\n            this.start.column = column;\n        }\n    };\n    this.setEnd = function(row, column) {\n        if (typeof row == \"object\") {\n            this.end.column = row.column;\n            this.end.row = row.row;\n        } else {\n            this.end.row = row;\n            this.end.column = column;\n        }\n    };\n    this.inside = function(row, column) {\n        if (this.compare(row, column) == 0) {\n            if (this.isEnd(row, column) || this.isStart(row, column)) {\n                return false;\n            } else {\n                return true;\n            }\n        }\n        return false;\n    };\n    this.insideStart = function(row, column) {\n        if (this.compare(row, column) == 0) {\n            if (this.isEnd(row, column)) {\n                return false;\n            } else {\n                return true;\n            }\n        }\n        return false;\n    };\n    this.insideEnd = function(row, column) {\n        if (this.compare(row, column) == 0) {\n            if (this.isStart(row, column)) {\n                return false;\n            } else {\n                return true;\n            }\n        }\n        return false;\n    };\n    this.compare = function(row, column) {\n        if (!this.isMultiLine()) {\n            if (row === this.start.row) {\n                return column < this.start.column ? -1 : (column > this.end.column ? 1 : 0);\n            };\n        }\n\n        if (row < this.start.row)\n            return -1;\n\n        if (row > this.end.row)\n            return 1;\n\n        if (this.start.row === row)\n            return column >= this.start.column ? 0 : -1;\n\n        if (this.end.row === row)\n            return column <= this.end.column ? 0 : 1;\n\n        return 0;\n    };\n    this.compareStart = function(row, column) {\n        if (this.start.row == row && this.start.column == column) {\n            return -1;\n        } else {\n            return this.compare(row, column);\n        }\n    };\n    this.compareEnd = function(row, column) {\n        if (this.end.row == row && this.end.column == column) {\n            return 1;\n        } else {\n            return this.compare(row, column);\n        }\n    };\n    this.compareInside = function(row, column) {\n        if (this.end.row == row && this.end.column == column) {\n            return 1;\n        } else if (this.start.row == row && this.start.column == column) {\n            return -1;\n        } else {\n            return this.compare(row, column);\n        }\n    };\n    this.clipRows = function(firstRow, lastRow) {\n        if (this.end.row > lastRow)\n            var end = {row: lastRow + 1, column: 0};\n        else if (this.end.row < firstRow)\n            var end = {row: firstRow, column: 0};\n\n        if (this.start.row > lastRow)\n            var start = {row: lastRow + 1, column: 0};\n        else if (this.start.row < firstRow)\n            var start = {row: firstRow, column: 0};\n\n        return Range.fromPoints(start || this.start, end || this.end);\n    };\n    this.extend = function(row, column) {\n        var cmp = this.compare(row, column);\n\n        if (cmp == 0)\n            return this;\n        else if (cmp == -1)\n            var start = {row: row, column: column};\n        else\n            var end = {row: row, column: column};\n\n        return Range.fromPoints(start || this.start, end || this.end);\n    };\n\n    this.isEmpty = function() {\n        return (this.start.row === this.end.row && this.start.column === this.end.column);\n    };\n    this.isMultiLine = function() {\n        return (this.start.row !== this.end.row);\n    };\n    this.clone = function() {\n        return Range.fromPoints(this.start, this.end);\n    };\n    this.collapseRows = function() {\n        if (this.end.column == 0)\n            return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row-1), 0)\n        else\n            return new Range(this.start.row, 0, this.end.row, 0)\n    };\n    this.toScreenRange = function(session) {\n        var screenPosStart = session.documentToScreenPosition(this.start);\n        var screenPosEnd = session.documentToScreenPosition(this.end);\n\n        return new Range(\n            screenPosStart.row, screenPosStart.column,\n            screenPosEnd.row, screenPosEnd.column\n        );\n    };\n    this.moveBy = function(row, column) {\n        this.start.row += row;\n        this.start.column += column;\n        this.end.row += row;\n        this.end.column += column;\n    };\n\n}).call(Range.prototype);\nRange.fromPoints = function(start, end) {\n    return new Range(start.row, start.column, end.row, end.column);\n};\nRange.comparePoints = comparePoints;\n\nRange.comparePoints = function(p1, p2) {\n    return p1.row - p2.row || p1.column - p2.column;\n};\n\n\nexports.Range = Range;\n});\n\nace.define('ace/anchor', [\"require\", 'exports', 'module' , 'ace/lib/oop', 'ace/lib/event_emitter'], function(acequire, exports, module) {\n\n\nvar oop = acequire(\"./lib/oop\");\nvar EventEmitter = acequire(\"./lib/event_emitter\").EventEmitter;\n\nvar Anchor = exports.Anchor = function(doc, row, column) {\n    this.document = doc;\n\n    if (typeof column == \"undefined\")\n        this.setPosition(row.row, row.column);\n    else\n        this.setPosition(row, column);\n\n    this.$onChange = this.onChange.bind(this);\n    doc.on(\"change\", this.$onChange);\n};\n\n(function() {\n\n    oop.implement(this, EventEmitter);\n\n    this.getPosition = function() {\n        return this.$clipPositionToDocument(this.row, this.column);\n    };\n\n    this.getDocument = function() {\n        return this.document;\n    };\n\n    this.onChange = function(e) {\n        var delta = e.data;\n        var range = delta.range;\n\n        if (range.start.row == range.end.row && range.start.row != this.row)\n            return;\n\n        if (range.start.row > this.row)\n            return;\n\n        if (range.start.row == this.row && range.start.column > this.column)\n            return;\n\n        var row = this.row;\n        var column = this.column;\n        var start = range.start;\n        var end = range.end;\n\n        if (delta.action === \"insertText\") {\n            if (start.row === row && start.column <= column) {\n                if (start.row === end.row) {\n                    column += end.column - start.column;\n                } else {\n                    column -= start.column;\n                    row += end.row - start.row;\n                }\n            } else if (start.row !== end.row && start.row < row) {\n                row += end.row - start.row;\n            }\n        } else if (delta.action === \"insertLines\") {\n            if (start.row <= row) {\n                row += end.row - start.row;\n            }\n        } else if (delta.action === \"removeText\") {\n            if (start.row === row && start.column < column) {\n                if (end.column >= column)\n                    column = start.column;\n                else\n                    column = Math.max(0, column - (end.column - start.column));\n\n            } else if (start.row !== end.row && start.row < row) {\n                if (end.row === row)\n                    column = Math.max(0, column - end.column) + start.column;\n                row -= (end.row - start.row);\n            } else if (end.row === row) {\n                row -= end.row - start.row;\n                column = Math.max(0, column - end.column) + start.column;\n            }\n        } else if (delta.action == \"removeLines\") {\n            if (start.row <= row) {\n                if (end.row <= row)\n                    row -= end.row - start.row;\n                else {\n                    row = start.row;\n                    column = 0;\n                }\n            }\n        }\n\n        this.setPosition(row, column, true);\n    };\n\n    this.setPosition = function(row, column, noClip) {\n        var pos;\n        if (noClip) {\n            pos = {\n                row: row,\n                column: column\n            };\n        } else {\n            pos = this.$clipPositionToDocument(row, column);\n        }\n\n        if (this.row == pos.row && this.column == pos.column)\n            return;\n\n        var old = {\n            row: this.row,\n            column: this.column\n        };\n\n        this.row = pos.row;\n        this.column = pos.column;\n        this._emit(\"change\", {\n            old: old,\n            value: pos\n        });\n    };\n\n    this.detach = function() {\n        this.document.removeEventListener(\"change\", this.$onChange);\n    };\n    this.$clipPositionToDocument = function(row, column) {\n        var pos = {};\n\n        if (row >= this.document.getLength()) {\n            pos.row = Math.max(0, this.document.getLength() - 1);\n            pos.column = this.document.getLine(pos.row).length;\n        }\n        else if (row < 0) {\n            pos.row = 0;\n            pos.column = 0;\n        }\n        else {\n            pos.row = row;\n            pos.column = Math.min(this.document.getLine(pos.row).length, Math.max(0, column));\n        }\n\n        if (column < 0)\n            pos.column = 0;\n\n        return pos;\n    };\n\n}).call(Anchor.prototype);\n\n});\nace.define('ace/mode/css/csslint', [\"require\", 'exports', 'module' ], function(acequire, exports, module) {\nvar parserlib = {};\n(function(){\nfunction EventTarget(){\n    this._listeners = {};    \n}\n\nEventTarget.prototype = {\n    constructor: EventTarget,\n    addListener: function(type, listener){\n        if (!this._listeners[type]){\n            this._listeners[type] = [];\n        }\n\n        this._listeners[type].push(listener);\n    },    \n    fire: function(event){\n        if (typeof event == \"string\"){\n            event = { type: event };\n        }\n        if (typeof event.target != \"undefined\"){\n            event.target = this;\n        }\n        \n        if (typeof event.type == \"undefined\"){\n            throw new Error(\"Event object missing 'type' property.\");\n        }\n        \n        if (this._listeners[event.type]){\n            var listeners = this._listeners[event.type].concat();\n            for (var i=0, len=listeners.length; i < len; i++){\n                listeners[i].call(this, event);\n            }\n        }            \n    },\n    removeListener: function(type, listener){\n        if (this._listeners[type]){\n            var listeners = this._listeners[type];\n            for (var i=0, len=listeners.length; i < len; i++){\n                if (listeners[i] === listener){\n                    listeners.splice(i, 1);\n                    break;\n                }\n            }\n            \n            \n        }            \n    }\n};\nfunction StringReader(text){\n    this._input = text.replace(/\\n\\r?/g, \"\\n\");\n    this._line = 1;\n    this._col = 1;\n    this._cursor = 0;\n}\n\nStringReader.prototype = {\n    constructor: StringReader,\n    getCol: function(){\n        return this._col;\n    },\n    getLine: function(){\n        return this._line ;\n    },\n    eof: function(){\n        return (this._cursor == this._input.length);\n    },\n    peek: function(count){\n        var c = null;\n        count = (typeof count == \"undefined\" ? 1 : count);\n        if (this._cursor < this._input.length){\n            c = this._input.charAt(this._cursor + count - 1);\n        }\n\n        return c;\n    },\n    read: function(){\n        var c = null;\n        if (this._cursor < this._input.length){\n            if (this._input.charAt(this._cursor) == \"\\n\"){\n                this._line++;\n                this._col=1;\n            } else {\n                this._col++;\n            }\n            c = this._input.charAt(this._cursor++);\n        }\n\n        return c;\n    },\n    mark: function(){\n        this._bookmark = {\n            cursor: this._cursor,\n            line:   this._line,\n            col:    this._col\n        };\n    },\n\n    reset: function(){\n        if (this._bookmark){\n            this._cursor = this._bookmark.cursor;\n            this._line = this._bookmark.line;\n            this._col = this._bookmark.col;\n            delete this._bookmark;\n        }\n    },\n    readTo: function(pattern){\n\n        var buffer = \"\",\n            c;\n        while (buffer.length < pattern.length || buffer.lastIndexOf(pattern) != buffer.length - pattern.length){\n            c = this.read();\n            if (c){\n                buffer += c;\n            } else {\n                throw new Error(\"Expected \\\"\" + pattern + \"\\\" at line \" + this._line  + \", col \" + this._col + \".\");\n            }\n        }\n\n        return buffer;\n\n    },\n    readWhile: function(filter){\n\n        var buffer = \"\",\n            c = this.read();\n\n        while(c !== null && filter(c)){\n            buffer += c;\n            c = this.read();\n        }\n\n        return buffer;\n\n    },\n    readMatch: function(matcher){\n\n        var source = this._input.substring(this._cursor),\n            value = null;\n        if (typeof matcher == \"string\"){\n            if (source.indexOf(matcher) === 0){\n                value = this.readCount(matcher.length);\n            }\n        } else if (matcher instanceof RegExp){\n            if (matcher.test(source)){\n                value = this.readCount(RegExp.lastMatch.length);\n            }\n        }\n\n        return value;\n    },\n    readCount: function(count){\n        var buffer = \"\";\n\n        while(count--){\n            buffer += this.read();\n        }\n\n        return buffer;\n    }\n\n};\nfunction SyntaxError(message, line, col){\n    this.col = col;\n    this.line = line;\n    this.message = message;\n\n}\nSyntaxError.prototype = new Error();\nfunction SyntaxUnit(text, line, col, type){\n    this.col = col;\n    this.line = line;\n    this.text = text;\n    this.type = type;\n}\nSyntaxUnit.fromToken = function(token){\n    return new SyntaxUnit(token.value, token.startLine, token.startCol);\n};\n\nSyntaxUnit.prototype = {\n    constructor: SyntaxUnit,\n    valueOf: function(){\n        return this.toString();\n    },\n    toString: function(){\n        return this.text;\n    }\n\n};\nfunction TokenStreamBase(input, tokenData){\n    this._reader = input ? new StringReader(input.toString()) : null;\n    this._token = null;\n    this._tokenData = tokenData;\n    this._lt = [];\n    this._ltIndex = 0;\n    \n    this._ltIndexCache = [];\n}\nTokenStreamBase.createTokenData = function(tokens){\n\n    var nameMap     = [],\n        typeMap     = {},\n        tokenData     = tokens.concat([]),\n        i            = 0,\n        len            = tokenData.length+1;\n    \n    tokenData.UNKNOWN = -1;\n    tokenData.unshift({name:\"EOF\"});\n\n    for (; i < len; i++){\n        nameMap.push(tokenData[i].name);\n        tokenData[tokenData[i].name] = i;\n        if (tokenData[i].text){\n            typeMap[tokenData[i].text] = i;\n        }\n    }\n    \n    tokenData.name = function(tt){\n        return nameMap[tt];\n    };\n    \n    tokenData.type = function(c){\n        return typeMap[c];\n    };\n    \n    return tokenData;\n};\n\nTokenStreamBase.prototype = {\n    constructor: TokenStreamBase,    \n    match: function(tokenTypes, channel){\n        if (!(tokenTypes instanceof Array)){\n            tokenTypes = [tokenTypes];\n        }\n                \n        var tt  = this.get(channel),\n            i   = 0,\n            len = tokenTypes.length;\n            \n        while(i < len){\n            if (tt == tokenTypes[i++]){\n                return true;\n            }\n        }\n        this.unget();\n        return false;\n    },        \n    mustMatch: function(tokenTypes, channel){\n\n        var token;\n        if (!(tokenTypes instanceof Array)){\n            tokenTypes = [tokenTypes];\n        }\n\n        if (!this.match.apply(this, arguments)){    \n            token = this.LT(1);\n            throw new SyntaxError(\"Expected \" + this._tokenData[tokenTypes[0]].name + \n                \" at line \" + token.startLine + \", col \" + token.startCol + \".\", token.startLine, token.startCol);\n        }\n    },\n    advance: function(tokenTypes, channel){\n        \n        while(this.LA(0) !== 0 && !this.match(tokenTypes, channel)){\n            this.get();\n        }\n\n        return this.LA(0);    \n    },      \n    get: function(channel){\n    \n        var tokenInfo   = this._tokenData,\n            reader      = this._reader,\n            value,\n            i           =0,\n            len         = tokenInfo.length,\n            found       = false,\n            token,\n            info;\n        if (this._lt.length && this._ltIndex >= 0 && this._ltIndex < this._lt.length){  \n                           \n            i++;\n            this._token = this._lt[this._ltIndex++];\n            info = tokenInfo[this._token.type];\n            while((info.channel !== undefined && channel !== info.channel) &&\n                    this._ltIndex < this._lt.length){\n                this._token = this._lt[this._ltIndex++];\n                info = tokenInfo[this._token.type];\n                i++;\n            }\n            if ((info.channel === undefined || channel === info.channel) &&\n                    this._ltIndex <= this._lt.length){\n                this._ltIndexCache.push(i);\n                return this._token.type;\n            }\n        }\n        token = this._getToken();\n        if (token.type > -1 && !tokenInfo[token.type].hide){\n            token.channel = tokenInfo[token.type].channel;\n            this._token = token;\n            this._lt.push(token);\n            this._ltIndexCache.push(this._lt.length - this._ltIndex + i);  \n            if (this._lt.length > 5){\n                this._lt.shift();                \n            }\n            if (this._ltIndexCache.length > 5){\n                this._ltIndexCache.shift();\n            }\n            this._ltIndex = this._lt.length;\n        }\n        info = tokenInfo[token.type];\n        if (info && \n                (info.hide || \n                (info.channel !== undefined && channel !== info.channel))){\n            return this.get(channel);\n        } else {\n            return token.type;\n        }\n    },\n    LA: function(index){\n        var total = index,\n            tt;\n        if (index > 0){\n            if (index > 5){\n                throw new Error(\"Too much lookahead.\");\n            }\n            while(total){\n                tt = this.get();   \n                total--;                            \n            }\n            while(total < index){\n                this.unget();\n                total++;\n            }\n        } else if (index < 0){\n        \n            if(this._lt[this._ltIndex+index]){\n                tt = this._lt[this._ltIndex+index].type;\n            } else {\n                throw new Error(\"Too much lookbehind.\");\n            }\n        \n        } else {\n            tt = this._token.type;\n        }\n        \n        return tt;\n    \n    },    \n    LT: function(index){\n        this.LA(index);\n        return this._lt[this._ltIndex+index-1];    \n    },\n    peek: function(){\n        return this.LA(1);\n    },\n    token: function(){\n        return this._token;\n    },\n    tokenName: function(tokenType){\n        if (tokenType < 0 || tokenType > this._tokenData.length){\n            return \"UNKNOWN_TOKEN\";\n        } else {\n            return this._tokenData[tokenType].name;\n        }\n    },    \n    tokenType: function(tokenName){\n        return this._tokenData[tokenName] || -1;\n    },      \n    unget: function(){\n        if (this._ltIndexCache.length){\n            this._ltIndex -= this._ltIndexCache.pop();//--;\n            this._token = this._lt[this._ltIndex - 1];\n        } else {\n            throw new Error(\"Too much lookahead.\");\n        }\n    }\n\n};\n\n\n\n\nparserlib.util = {\nStringReader: StringReader,\nSyntaxError : SyntaxError,\nSyntaxUnit  : SyntaxUnit,\nEventTarget : EventTarget,\nTokenStreamBase : TokenStreamBase\n};\n})();\n(function(){\nvar EventTarget = parserlib.util.EventTarget,\nTokenStreamBase = parserlib.util.TokenStreamBase,\nStringReader = parserlib.util.StringReader,\nSyntaxError = parserlib.util.SyntaxError,\nSyntaxUnit  = parserlib.util.SyntaxUnit;\n\n\nvar Colors = {\n    aliceblue       :\"#f0f8ff\",\n    antiquewhite    :\"#faebd7\",\n    aqua            :\"#00ffff\",\n    aquamarine      :\"#7fffd4\",\n    azure           :\"#f0ffff\",\n    beige           :\"#f5f5dc\",\n    bisque          :\"#ffe4c4\",\n    black           :\"#000000\",\n    blanchedalmond  :\"#ffebcd\",\n    blue            :\"#0000ff\",\n    blueviolet      :\"#8a2be2\",\n    brown           :\"#a52a2a\",\n    burlywood       :\"#deb887\",\n    cadetblue       :\"#5f9ea0\",\n    chartreuse      :\"#7fff00\",\n    chocolate       :\"#d2691e\",\n    coral           :\"#ff7f50\",\n    cornflowerblue  :\"#6495ed\",\n    cornsilk        :\"#fff8dc\",\n    crimson         :\"#dc143c\",\n    cyan            :\"#00ffff\",\n    darkblue        :\"#00008b\",\n    darkcyan        :\"#008b8b\",\n    darkgoldenrod   :\"#b8860b\",\n    darkgray        :\"#a9a9a9\",\n    darkgreen       :\"#006400\",\n    darkkhaki       :\"#bdb76b\",\n    darkmagenta     :\"#8b008b\",\n    darkolivegreen  :\"#556b2f\",\n    darkorange      :\"#ff8c00\",\n    darkorchid      :\"#9932cc\",\n    darkred         :\"#8b0000\",\n    darksalmon      :\"#e9967a\",\n    darkseagreen    :\"#8fbc8f\",\n    darkslateblue   :\"#483d8b\",\n    darkslategray   :\"#2f4f4f\",\n    darkturquoise   :\"#00ced1\",\n    darkviolet      :\"#9400d3\",\n    deeppink        :\"#ff1493\",\n    deepskyblue     :\"#00bfff\",\n    dimgray         :\"#696969\",\n    dodgerblue      :\"#1e90ff\",\n    firebrick       :\"#b22222\",\n    floralwhite     :\"#fffaf0\",\n    forestgreen     :\"#228b22\",\n    fuchsia         :\"#ff00ff\",\n    gainsboro       :\"#dcdcdc\",\n    ghostwhite      :\"#f8f8ff\",\n    gold            :\"#ffd700\",\n    goldenrod       :\"#daa520\",\n    gray            :\"#808080\",\n    green           :\"#008000\",\n    greenyellow     :\"#adff2f\",\n    honeydew        :\"#f0fff0\",\n    hotpink         :\"#ff69b4\",\n    indianred       :\"#cd5c5c\",\n    indigo          :\"#4b0082\",\n    ivory           :\"#fffff0\",\n    khaki           :\"#f0e68c\",\n    lavender        :\"#e6e6fa\",\n    lavenderblush   :\"#fff0f5\",\n    lawngreen       :\"#7cfc00\",\n    lemonchiffon    :\"#fffacd\",\n    lightblue       :\"#add8e6\",\n    lightcoral      :\"#f08080\",\n    lightcyan       :\"#e0ffff\",\n    lightgoldenrodyellow  :\"#fafad2\",\n    lightgray       :\"#d3d3d3\",\n    lightgreen      :\"#90ee90\",\n    lightpink       :\"#ffb6c1\",\n    lightsalmon     :\"#ffa07a\",\n    lightseagreen   :\"#20b2aa\",\n    lightskyblue    :\"#87cefa\",\n    lightslategray  :\"#778899\",\n    lightsteelblue  :\"#b0c4de\",\n    lightyellow     :\"#ffffe0\",\n    lime            :\"#00ff00\",\n    limegreen       :\"#32cd32\",\n    linen           :\"#faf0e6\",\n    magenta         :\"#ff00ff\",\n    maroon          :\"#800000\",\n    mediumaquamarine:\"#66cdaa\",\n    mediumblue      :\"#0000cd\",\n    mediumorchid    :\"#ba55d3\",\n    mediumpurple    :\"#9370d8\",\n    mediumseagreen  :\"#3cb371\",\n    mediumslateblue :\"#7b68ee\",\n    mediumspringgreen   :\"#00fa9a\",\n    mediumturquoise :\"#48d1cc\",\n    mediumvioletred :\"#c71585\",\n    midnightblue    :\"#191970\",\n    mintcream       :\"#f5fffa\",\n    mistyrose       :\"#ffe4e1\",\n    moccasin        :\"#ffe4b5\",\n    navajowhite     :\"#ffdead\",\n    navy            :\"#000080\",\n    oldlace         :\"#fdf5e6\",\n    olive           :\"#808000\",\n    olivedrab       :\"#6b8e23\",\n    orange          :\"#ffa500\",\n    orangered       :\"#ff4500\",\n    orchid          :\"#da70d6\",\n    palegoldenrod   :\"#eee8aa\",\n    palegreen       :\"#98fb98\",\n    paleturquoise   :\"#afeeee\",\n    palevioletred   :\"#d87093\",\n    papayawhip      :\"#ffefd5\",\n    peachpuff       :\"#ffdab9\",\n    peru            :\"#cd853f\",\n    pink            :\"#ffc0cb\",\n    plum            :\"#dda0dd\",\n    powderblue      :\"#b0e0e6\",\n    purple          :\"#800080\",\n    red             :\"#ff0000\",\n    rosybrown       :\"#bc8f8f\",\n    royalblue       :\"#4169e1\",\n    saddlebrown     :\"#8b4513\",\n    salmon          :\"#fa8072\",\n    sandybrown      :\"#f4a460\",\n    seagreen        :\"#2e8b57\",\n    seashell        :\"#fff5ee\",\n    sienna          :\"#a0522d\",\n    silver          :\"#c0c0c0\",\n    skyblue         :\"#87ceeb\",\n    slateblue       :\"#6a5acd\",\n    slategray       :\"#708090\",\n    snow            :\"#fffafa\",\n    springgreen     :\"#00ff7f\",\n    steelblue       :\"#4682b4\",\n    tan             :\"#d2b48c\",\n    teal            :\"#008080\",\n    thistle         :\"#d8bfd8\",\n    tomato          :\"#ff6347\",\n    turquoise       :\"#40e0d0\",\n    violet          :\"#ee82ee\",\n    wheat           :\"#f5deb3\",\n    white           :\"#ffffff\",\n    whitesmoke      :\"#f5f5f5\",\n    yellow          :\"#ffff00\",\n    yellowgreen     :\"#9acd32\",\n    activeBorder        :\"Active window border.\",\n    activecaption       :\"Active window caption.\",\n    appworkspace        :\"Background color of multiple document interface.\",\n    background          :\"Desktop background.\",\n    buttonface          :\"The face background color for 3-D elements that appear 3-D due to one layer of surrounding border.\",\n    buttonhighlight     :\"The color of the border facing the light source for 3-D elements that appear 3-D due to one layer of surrounding border.\",\n    buttonshadow        :\"The color of the border away from the light source for 3-D elements that appear 3-D due to one layer of surrounding border.\",\n    buttontext          :\"Text on push buttons.\",\n    captiontext         :\"Text in caption, size box, and scrollbar arrow box.\",\n    graytext            :\"Grayed (disabled) text. This color is set to #000 if the current display driver does not support a solid gray color.\",\n    highlight           :\"Item(s) selected in a control.\",\n    highlighttext       :\"Text of item(s) selected in a control.\",\n    inactiveborder      :\"Inactive window border.\",\n    inactivecaption     :\"Inactive window caption.\",\n    inactivecaptiontext :\"Color of text in an inactive caption.\",\n    infobackground      :\"Background color for tooltip controls.\",\n    infotext            :\"Text color for tooltip controls.\",\n    menu                :\"Menu background.\",\n    menutext            :\"Text in menus.\",\n    scrollbar           :\"Scroll bar gray area.\",\n    threeddarkshadow    :\"The color of the darker (generally outer) of the two borders away from the light source for 3-D elements that appear 3-D due to two concentric layers of surrounding border.\",\n    threedface          :\"The face background color for 3-D elements that appear 3-D due to two concentric layers of surrounding border.\",\n    threedhighlight     :\"The color of the lighter (generally outer) of the two borders facing the light source for 3-D elements that appear 3-D due to two concentric layers of surrounding border.\",\n    threedlightshadow   :\"The color of the darker (generally inner) of the two borders facing the light source for 3-D elements that appear 3-D due to two concentric layers of surrounding border.\",\n    threedshadow        :\"The color of the lighter (generally inner) of the two borders away from the light source for 3-D elements that appear 3-D due to two concentric layers of surrounding border.\",\n    window              :\"Window background.\",\n    windowframe         :\"Window frame.\",\n    windowtext          :\"Text in windows.\"\n};\nfunction Combinator(text, line, col){\n    \n    SyntaxUnit.call(this, text, line, col, Parser.COMBINATOR_TYPE);\n    this.type = \"unknown\";\n    if (/^\\s+$/.test(text)){\n        this.type = \"descendant\";\n    } else if (text == \">\"){\n        this.type = \"child\";\n    } else if (text == \"+\"){\n        this.type = \"adjacent-sibling\";\n    } else if (text == \"~\"){\n        this.type = \"sibling\";\n    }\n\n}\n\nCombinator.prototype = new SyntaxUnit();\nCombinator.prototype.constructor = Combinator;\nfunction MediaFeature(name, value){\n    \n    SyntaxUnit.call(this, \"(\" + name + (value !== null ? \":\" + value : \"\") + \")\", name.startLine, name.startCol, Parser.MEDIA_FEATURE_TYPE);\n    this.name = name;\n    this.value = value;\n}\n\nMediaFeature.prototype = new SyntaxUnit();\nMediaFeature.prototype.constructor = MediaFeature;\nfunction MediaQuery(modifier, mediaType, features, line, col){\n    \n    SyntaxUnit.call(this, (modifier ? modifier + \" \": \"\") + (mediaType ? mediaType : \"\") + (mediaType && features.length > 0 ? \" and \" : \"\") + features.join(\" and \"), line, col, Parser.MEDIA_QUERY_TYPE);\n    this.modifier = modifier;\n    this.mediaType = mediaType;\n    this.features = features;\n\n}\n\nMediaQuery.prototype = new SyntaxUnit();\nMediaQuery.prototype.constructor = MediaQuery;\nfunction Parser(options){\n    EventTarget.call(this);\n\n\n    this.options = options || {};\n\n    this._tokenStream = null;\n}\nParser.DEFAULT_TYPE = 0;\nParser.COMBINATOR_TYPE = 1;\nParser.MEDIA_FEATURE_TYPE = 2;\nParser.MEDIA_QUERY_TYPE = 3;\nParser.PROPERTY_NAME_TYPE = 4;\nParser.PROPERTY_VALUE_TYPE = 5;\nParser.PROPERTY_VALUE_PART_TYPE = 6;\nParser.SELECTOR_TYPE = 7;\nParser.SELECTOR_PART_TYPE = 8;\nParser.SELECTOR_SUB_PART_TYPE = 9;\n\nParser.prototype = function(){\n\n    var proto = new EventTarget(),  //new prototype\n        prop,\n        additions =  {\n            constructor: Parser,\n            DEFAULT_TYPE : 0,\n            COMBINATOR_TYPE : 1,\n            MEDIA_FEATURE_TYPE : 2,\n            MEDIA_QUERY_TYPE : 3,\n            PROPERTY_NAME_TYPE : 4,\n            PROPERTY_VALUE_TYPE : 5,\n            PROPERTY_VALUE_PART_TYPE : 6,\n            SELECTOR_TYPE : 7,\n            SELECTOR_PART_TYPE : 8,\n            SELECTOR_SUB_PART_TYPE : 9,            \n        \n            _stylesheet: function(){ \n               \n                var tokenStream = this._tokenStream,\n                    charset     = null,\n                    count,\n                    token,\n                    tt;\n                    \n                this.fire(\"startstylesheet\");\n                this._charset();\n                \n                this._skipCruft();\n                while (tokenStream.peek() == Tokens.IMPORT_SYM){\n                    this._import();\n                    this._skipCruft();\n                }\n                while (tokenStream.peek() == Tokens.NAMESPACE_SYM){\n                    this._namespace();\n                    this._skipCruft();\n                }\n                tt = tokenStream.peek();\n                while(tt > Tokens.EOF){\n                \n                    try {\n                \n                        switch(tt){\n                            case Tokens.MEDIA_SYM:\n                                this._media();\n                                this._skipCruft();\n                                break;\n                            case Tokens.PAGE_SYM:\n                                this._page(); \n                                this._skipCruft();\n                                break;                   \n                            case Tokens.FONT_FACE_SYM:\n                                this._font_face(); \n                                this._skipCruft();\n                                break;  \n                            case Tokens.KEYFRAMES_SYM:\n                                this._keyframes(); \n                                this._skipCruft();\n                                break;                                \n                            case Tokens.UNKNOWN_SYM:  //unknown @ rule\n                                tokenStream.get();\n                                if (!this.options.strict){\n                                    this.fire({\n                                        type:       \"error\",\n                                        error:      null,\n                                        message:    \"Unknown @ rule: \" + tokenStream.LT(0).value + \".\",\n                                        line:       tokenStream.LT(0).startLine,\n                                        col:        tokenStream.LT(0).startCol\n                                    });                          \n                                    count=0;\n                                    while (tokenStream.advance([Tokens.LBRACE, Tokens.RBRACE]) == Tokens.LBRACE){\n                                        count++;    //keep track of nesting depth\n                                    }\n                                    \n                                    while(count){\n                                        tokenStream.advance([Tokens.RBRACE]);\n                                        count--;\n                                    }\n                                    \n                                } else {\n                                    throw new SyntaxError(\"Unknown @ rule.\", tokenStream.LT(0).startLine, tokenStream.LT(0).startCol);\n                                }                                \n                                break;\n                            case Tokens.S:\n                                this._readWhitespace();\n                                break;\n                            default:                            \n                                if(!this._ruleset()){\n                                    switch(tt){\n                                        case Tokens.CHARSET_SYM:\n                                            token = tokenStream.LT(1);\n                                            this._charset(false);\n                                            throw new SyntaxError(\"@charset not allowed here.\", token.startLine, token.startCol);\n                                        case Tokens.IMPORT_SYM:\n                                            token = tokenStream.LT(1);\n                                            this._import(false);\n                                            throw new SyntaxError(\"@import not allowed here.\", token.startLine, token.startCol);\n                                        case Tokens.NAMESPACE_SYM:\n                                            token = tokenStream.LT(1);\n                                            this._namespace(false);\n                                            throw new SyntaxError(\"@namespace not allowed here.\", token.startLine, token.startCol);\n                                        default:\n                                            tokenStream.get();  //get the last token\n                                            this._unexpectedToken(tokenStream.token());\n                                    }\n                                \n                                }\n                        }\n                    } catch(ex) {\n                        if (ex instanceof SyntaxError && !this.options.strict){\n                            this.fire({\n                                type:       \"error\",\n                                error:      ex,\n                                message:    ex.message,\n                                line:       ex.line,\n                                col:        ex.col\n                            });                     \n                        } else {\n                            throw ex;\n                        }\n                    }\n                    \n                    tt = tokenStream.peek();\n                }\n                \n                if (tt != Tokens.EOF){\n                    this._unexpectedToken(tokenStream.token());\n                }\n            \n                this.fire(\"endstylesheet\");\n            },\n            \n            _charset: function(emit){\n                var tokenStream = this._tokenStream,\n                    charset,\n                    token,\n                    line,\n                    col;\n                    \n                if (tokenStream.match(Tokens.CHARSET_SYM)){\n                    line = tokenStream.token().startLine;\n                    col = tokenStream.token().startCol;\n                \n                    this._readWhitespace();\n                    tokenStream.mustMatch(Tokens.STRING);\n                    \n                    token = tokenStream.token();\n                    charset = token.value;\n                    \n                    this._readWhitespace();\n                    tokenStream.mustMatch(Tokens.SEMICOLON);\n                    \n                    if (emit !== false){\n                        this.fire({ \n                            type:   \"charset\",\n                            charset:charset,\n                            line:   line,\n                            col:    col\n                        });\n                    }\n                }            \n            },\n            \n            _import: function(emit){    \n            \n                var tokenStream = this._tokenStream,\n                    tt,\n                    uri,\n                    importToken,\n                    mediaList   = [];\n                tokenStream.mustMatch(Tokens.IMPORT_SYM);\n                importToken = tokenStream.token();\n                this._readWhitespace();\n                \n                tokenStream.mustMatch([Tokens.STRING, Tokens.URI]);\n                uri = tokenStream.token().value.replace(/(?:url\\()?[\"']([^\"']+)[\"']\\)?/, \"$1\");                \n\n                this._readWhitespace();\n                \n                mediaList = this._media_query_list();\n                tokenStream.mustMatch(Tokens.SEMICOLON);\n                this._readWhitespace();\n                \n                if (emit !== false){\n                    this.fire({\n                        type:   \"import\",\n                        uri:    uri,\n                        media:  mediaList,\n                        line:   importToken.startLine,\n                        col:    importToken.startCol\n                    });\n                }\n        \n            },\n            \n            _namespace: function(emit){    \n            \n                var tokenStream = this._tokenStream,\n                    line,\n                    col,\n                    prefix,\n                    uri;\n                tokenStream.mustMatch(Tokens.NAMESPACE_SYM);\n                line = tokenStream.token().startLine;\n                col = tokenStream.token().startCol;\n                this._readWhitespace();\n                if (tokenStream.match(Tokens.IDENT)){\n                    prefix = tokenStream.token().value;\n                    this._readWhitespace();\n                }\n                \n                tokenStream.mustMatch([Tokens.STRING, Tokens.URI]);\n                uri = tokenStream.token().value.replace(/(?:url\\()?[\"']([^\"']+)[\"']\\)?/, \"$1\");                \n\n                this._readWhitespace();\n                tokenStream.mustMatch(Tokens.SEMICOLON);\n                this._readWhitespace();\n                \n                if (emit !== false){\n                    this.fire({\n                        type:   \"namespace\",\n                        prefix: prefix,\n                        uri:    uri,\n                        line:   line,\n                        col:    col\n                    });\n                }\n        \n            },            \n                       \n            _media: function(){\n                var tokenStream     = this._tokenStream,\n                    line,\n                    col,\n                    mediaList;//       = [];\n                tokenStream.mustMatch(Tokens.MEDIA_SYM);\n                line = tokenStream.token().startLine;\n                col = tokenStream.token().startCol;\n                \n                this._readWhitespace();               \n\n                mediaList = this._media_query_list();\n\n                tokenStream.mustMatch(Tokens.LBRACE);\n                this._readWhitespace();\n                \n                this.fire({\n                    type:   \"startmedia\",\n                    media:  mediaList,\n                    line:   line,\n                    col:    col\n                });\n                \n                while(true) {\n                    if (tokenStream.peek() == Tokens.PAGE_SYM){\n                        this._page();\n                    } else if (!this._ruleset()){\n                        break;\n                    }                \n                }\n                \n                tokenStream.mustMatch(Tokens.RBRACE);\n                this._readWhitespace();\n        \n                this.fire({\n                    type:   \"endmedia\",\n                    media:  mediaList,\n                    line:   line,\n                    col:    col\n                });\n            },                           \n            _media_query_list: function(){\n                var tokenStream = this._tokenStream,\n                    mediaList   = [];\n                \n                \n                this._readWhitespace();\n                \n                if (tokenStream.peek() == Tokens.IDENT || tokenStream.peek() == Tokens.LPAREN){\n                    mediaList.push(this._media_query());\n                }\n                \n                while(tokenStream.match(Tokens.COMMA)){\n                    this._readWhitespace();\n                    mediaList.push(this._media_query());\n                }\n                \n                return mediaList;\n            },\n            _media_query: function(){\n                var tokenStream = this._tokenStream,\n                    type        = null,\n                    ident       = null,\n                    token       = null,\n                    expressions = [];\n                    \n                if (tokenStream.match(Tokens.IDENT)){\n                    ident = tokenStream.token().value.toLowerCase();\n                    if (ident != \"only\" && ident != \"not\"){\n                        tokenStream.unget();\n                        ident = null;\n                    } else {\n                        token = tokenStream.token();\n                    }\n                }\n                                \n                this._readWhitespace();\n                \n                if (tokenStream.peek() == Tokens.IDENT){\n                    type = this._media_type();\n                    if (token === null){\n                        token = tokenStream.token();\n                    }\n                } else if (tokenStream.peek() == Tokens.LPAREN){\n                    if (token === null){\n                        token = tokenStream.LT(1);\n                    }\n                    expressions.push(this._media_expression());\n                }                               \n                \n                if (type === null && expressions.length === 0){\n                    return null;\n                } else {                \n                    this._readWhitespace();\n                    while (tokenStream.match(Tokens.IDENT)){\n                        if (tokenStream.token().value.toLowerCase() != \"and\"){\n                            this._unexpectedToken(tokenStream.token());\n                        }\n                        \n                        this._readWhitespace();\n                        expressions.push(this._media_expression());\n                    }\n                }\n\n                return new MediaQuery(ident, type, expressions, token.startLine, token.startCol);\n            },\n            _media_type: function(){\n                return this._media_feature();           \n            },\n            _media_expression: function(){\n                var tokenStream = this._tokenStream,\n                    feature     = null,\n                    token,\n                    expression  = null;\n                \n                tokenStream.mustMatch(Tokens.LPAREN);\n                \n                feature = this._media_feature();\n                this._readWhitespace();\n                \n                if (tokenStream.match(Tokens.COLON)){\n                    this._readWhitespace();\n                    token = tokenStream.LT(1);\n                    expression = this._expression();\n                }\n                \n                tokenStream.mustMatch(Tokens.RPAREN);\n                this._readWhitespace();\n\n                return new MediaFeature(feature, (expression ? new SyntaxUnit(expression, token.startLine, token.startCol) : null));            \n            },\n            _media_feature: function(){\n                var tokenStream = this._tokenStream;\n                    \n                tokenStream.mustMatch(Tokens.IDENT);\n                \n                return SyntaxUnit.fromToken(tokenStream.token());            \n            },\n            _page: function(){            \n                var tokenStream = this._tokenStream,\n                    line,\n                    col,\n                    identifier  = null,\n                    pseudoPage  = null;\n                tokenStream.mustMatch(Tokens.PAGE_SYM);\n                line = tokenStream.token().startLine;\n                col = tokenStream.token().startCol;\n                \n                this._readWhitespace();\n                \n                if (tokenStream.match(Tokens.IDENT)){\n                    identifier = tokenStream.token().value;\n                    if (identifier.toLowerCase() === \"auto\"){\n                        this._unexpectedToken(tokenStream.token());\n                    }\n                }                \n                if (tokenStream.peek() == Tokens.COLON){\n                    pseudoPage = this._pseudo_page();\n                }\n            \n                this._readWhitespace();\n                \n                this.fire({\n                    type:   \"startpage\",\n                    id:     identifier,\n                    pseudo: pseudoPage,\n                    line:   line,\n                    col:    col\n                });                   \n\n                this._readDeclarations(true, true);                \n                \n                this.fire({\n                    type:   \"endpage\",\n                    id:     identifier,\n                    pseudo: pseudoPage,\n                    line:   line,\n                    col:    col\n                });             \n            \n            },\n            _margin: function(){\n                var tokenStream = this._tokenStream,\n                    line,\n                    col,\n                    marginSym   = this._margin_sym();\n\n                if (marginSym){\n                    line = tokenStream.token().startLine;\n                    col = tokenStream.token().startCol;\n                \n                    this.fire({\n                        type: \"startpagemargin\",\n                        margin: marginSym,\n                        line:   line,\n                        col:    col\n                    });    \n                    \n                    this._readDeclarations(true);\n\n                    this.fire({\n                        type: \"endpagemargin\",\n                        margin: marginSym,\n                        line:   line,\n                        col:    col\n                    });    \n                    return true;\n                } else {\n                    return false;\n                }\n            },\n            _margin_sym: function(){\n            \n                var tokenStream = this._tokenStream;\n            \n                if(tokenStream.match([Tokens.TOPLEFTCORNER_SYM, Tokens.TOPLEFT_SYM,\n                        Tokens.TOPCENTER_SYM, Tokens.TOPRIGHT_SYM, Tokens.TOPRIGHTCORNER_SYM,\n                        Tokens.BOTTOMLEFTCORNER_SYM, Tokens.BOTTOMLEFT_SYM, \n                        Tokens.BOTTOMCENTER_SYM, Tokens.BOTTOMRIGHT_SYM,\n                        Tokens.BOTTOMRIGHTCORNER_SYM, Tokens.LEFTTOP_SYM, \n                        Tokens.LEFTMIDDLE_SYM, Tokens.LEFTBOTTOM_SYM, Tokens.RIGHTTOP_SYM,\n                        Tokens.RIGHTMIDDLE_SYM, Tokens.RIGHTBOTTOM_SYM]))\n                {\n                    return SyntaxUnit.fromToken(tokenStream.token());                \n                } else {\n                    return null;\n                }\n            \n            },\n            \n            _pseudo_page: function(){\n        \n                var tokenStream = this._tokenStream;\n                \n                tokenStream.mustMatch(Tokens.COLON);\n                tokenStream.mustMatch(Tokens.IDENT);\n                \n                return tokenStream.token().value;\n            },\n            \n            _font_face: function(){     \n                var tokenStream = this._tokenStream,\n                    line,\n                    col;\n                tokenStream.mustMatch(Tokens.FONT_FACE_SYM);\n                line = tokenStream.token().startLine;\n                col = tokenStream.token().startCol;\n                \n                this._readWhitespace();\n\n                this.fire({\n                    type:   \"startfontface\",\n                    line:   line,\n                    col:    col\n                });                    \n                \n                this._readDeclarations(true);\n                \n                this.fire({\n                    type:   \"endfontface\",\n                    line:   line,\n                    col:    col\n                });              \n            },\n\n            _operator: function(inFunction){    \n                 \n                var tokenStream = this._tokenStream,\n                    token       = null;\n                \n                if (tokenStream.match([Tokens.SLASH, Tokens.COMMA]) ||\n                    (inFunction && tokenStream.match([Tokens.PLUS, Tokens.STAR, Tokens.MINUS]))){\n                    token =  tokenStream.token();\n                    this._readWhitespace();\n                } \n                return token ? PropertyValuePart.fromToken(token) : null;\n                \n            },\n            \n            _combinator: function(){    \n                 \n                var tokenStream = this._tokenStream,\n                    value       = null,\n                    token;\n                \n                if(tokenStream.match([Tokens.PLUS, Tokens.GREATER, Tokens.TILDE])){                \n                    token = tokenStream.token();\n                    value = new Combinator(token.value, token.startLine, token.startCol);\n                    this._readWhitespace();\n                }\n                \n                return value;\n            },\n            \n            _unary_operator: function(){\n                 \n                var tokenStream = this._tokenStream;\n                \n                if (tokenStream.match([Tokens.MINUS, Tokens.PLUS])){\n                    return tokenStream.token().value;\n                } else {\n                    return null;\n                }         \n            },\n            \n            _property: function(){\n                 \n                var tokenStream = this._tokenStream,\n                    value       = null,\n                    hack        = null,\n                    tokenValue,\n                    token,\n                    line,\n                    col;\n                if (tokenStream.peek() == Tokens.STAR && this.options.starHack){\n                    tokenStream.get();\n                    token = tokenStream.token();\n                    hack = token.value;\n                    line = token.startLine;\n                    col = token.startCol;\n                }\n                \n                if(tokenStream.match(Tokens.IDENT)){\n                    token = tokenStream.token();\n                    tokenValue = token.value;\n                    if (tokenValue.charAt(0) == \"_\" && this.options.underscoreHack){\n                        hack = \"_\";\n                        tokenValue = tokenValue.substring(1);\n                    }\n                    \n                    value = new PropertyName(tokenValue, hack, (line||token.startLine), (col||token.startCol));\n                    this._readWhitespace();\n                }\n                \n                return value;\n            },\n            _ruleset: function(){    \n                 \n                var tokenStream = this._tokenStream,\n                    tt,\n                    selectors;\n                try {\n                    selectors = this._selectors_group();\n                } catch (ex){\n                    if (ex instanceof SyntaxError && !this.options.strict){\n                        this.fire({\n                            type:       \"error\",\n                            error:      ex,\n                            message:    ex.message,\n                            line:       ex.line,\n                            col:        ex.col\n                        });                          \n                        tt = tokenStream.advance([Tokens.RBRACE]);\n                        if (tt == Tokens.RBRACE){\n                        } else {\n                            throw ex;\n                        }                        \n                        \n                    } else {\n                        throw ex;\n                    }                \n                    return true;\n                }\n                if (selectors){ \n                                    \n                    this.fire({\n                        type:       \"startrule\",\n                        selectors:  selectors,\n                        line:       selectors[0].line,\n                        col:        selectors[0].col\n                    });                \n                    \n                    this._readDeclarations(true);                \n                    \n                    this.fire({\n                        type:       \"endrule\",\n                        selectors:  selectors,\n                        line:       selectors[0].line,\n                        col:        selectors[0].col\n                    });  \n                    \n                }\n                \n                return selectors;\n                \n            },\n            _selectors_group: function(){           \n                var tokenStream = this._tokenStream,\n                    selectors   = [],\n                    selector;\n                    \n                selector = this._selector();\n                if (selector !== null){\n                \n                    selectors.push(selector);\n                    while(tokenStream.match(Tokens.COMMA)){\n                        this._readWhitespace();\n                        selector = this._selector();\n                        if (selector !== null){\n                            selectors.push(selector);\n                        } else {\n                            this._unexpectedToken(tokenStream.LT(1));\n                        }\n                    }\n                }\n\n                return selectors.length ? selectors : null;\n            },\n            _selector: function(){\n                 \n                var tokenStream = this._tokenStream,\n                    selector    = [],\n                    nextSelector = null,\n                    combinator  = null,\n                    ws          = null;\n                nextSelector = this._simple_selector_sequence();\n                if (nextSelector === null){\n                    return null;\n                }\n                \n                selector.push(nextSelector);\n                \n                do {\n                    combinator = this._combinator();\n                    \n                    if (combinator !== null){\n                        selector.push(combinator);\n                        nextSelector = this._simple_selector_sequence();\n                        if (nextSelector === null){\n                            this._unexpectedToken(tokenStream.LT(1));\n                        } else {\n                            selector.push(nextSelector);\n                        }\n                    } else {\n                        if (this._readWhitespace()){           \n                            ws = new Combinator(tokenStream.token().value, tokenStream.token().startLine, tokenStream.token().startCol);\n                            combinator = this._combinator();\n                            nextSelector = this._simple_selector_sequence();\n                            if (nextSelector === null){                        \n                                if (combinator !== null){\n                                    this._unexpectedToken(tokenStream.LT(1));\n                                }\n                            } else {\n                                \n                                if (combinator !== null){\n                                    selector.push(combinator);\n                                } else {\n                                    selector.push(ws);\n                                }\n                                \n                                selector.push(nextSelector);\n                            }     \n                        } else {\n                            break;\n                        }               \n                    \n                    }\n                } while(true);\n                \n                return new Selector(selector, selector[0].line, selector[0].col);\n            },\n            _simple_selector_sequence: function(){\n                 \n                var tokenStream = this._tokenStream,\n                    elementName = null,\n                    modifiers   = [],\n                    selectorText= \"\",\n                    components  = [\n                        function(){\n                            return tokenStream.match(Tokens.HASH) ?\n                                    new SelectorSubPart(tokenStream.token().value, \"id\", tokenStream.token().startLine, tokenStream.token().startCol) :\n                                    null;\n                        },\n                        this._class,\n                        this._attrib,\n                        this._pseudo,\n                        this._negation\n                    ],\n                    i           = 0,\n                    len         = components.length,\n                    component   = null,\n                    found       = false,\n                    line,\n                    col;\n                line = tokenStream.LT(1).startLine;\n                col = tokenStream.LT(1).startCol;\n                                        \n                elementName = this._type_selector();\n                if (!elementName){\n                    elementName = this._universal();\n                }\n                \n                if (elementName !== null){\n                    selectorText += elementName;\n                }                \n                \n                while(true){\n                    if (tokenStream.peek() === Tokens.S){\n                        break;\n                    }\n                    while(i < len && component === null){\n                        component = components[i++].call(this);\n                    }\n        \n                    if (component === null){\n                        if (selectorText === \"\"){\n                            return null;\n                        } else {\n                            break;\n                        }\n                    } else {\n                        i = 0;\n                        modifiers.push(component);\n                        selectorText += component.toString(); \n                        component = null;\n                    }\n                }\n\n                 \n                return selectorText !== \"\" ?\n                        new SelectorPart(elementName, modifiers, selectorText, line, col) :\n                        null;\n            },            \n            _type_selector: function(){\n                 \n                var tokenStream = this._tokenStream,\n                    ns          = this._namespace_prefix(),\n                    elementName = this._element_name();\n                    \n                if (!elementName){                    \n                    if (ns){\n                        tokenStream.unget();\n                        if (ns.length > 1){\n                            tokenStream.unget();\n                        }\n                    }\n                \n                    return null;\n                } else {     \n                    if (ns){\n                        elementName.text = ns + elementName.text;\n                        elementName.col -= ns.length;\n                    }\n                    return elementName;\n                }\n            },\n            _class: function(){    \n                 \n                var tokenStream = this._tokenStream,\n                    token;\n                \n                if (tokenStream.match(Tokens.DOT)){\n                    tokenStream.mustMatch(Tokens.IDENT);    \n                    token = tokenStream.token();\n                    return new SelectorSubPart(\".\" + token.value, \"class\", token.startLine, token.startCol - 1);        \n                } else {\n                    return null;\n                }\n        \n            },\n            _element_name: function(){    \n                \n                var tokenStream = this._tokenStream,\n                    token;\n                \n                if (tokenStream.match(Tokens.IDENT)){\n                    token = tokenStream.token();\n                    return new SelectorSubPart(token.value, \"elementName\", token.startLine, token.startCol);        \n                \n                } else {\n                    return null;\n                }\n            },\n            _namespace_prefix: function(){\n                var tokenStream = this._tokenStream,\n                    value       = \"\";\n                if (tokenStream.LA(1) === Tokens.PIPE || tokenStream.LA(2) === Tokens.PIPE){\n                        \n                    if(tokenStream.match([Tokens.IDENT, Tokens.STAR])){\n                        value += tokenStream.token().value;\n                    }\n                    \n                    tokenStream.mustMatch(Tokens.PIPE);\n                    value += \"|\";\n                    \n                }\n                \n                return value.length ? value : null;                \n            },\n            _universal: function(){\n                var tokenStream = this._tokenStream,\n                    value       = \"\",\n                    ns;\n                    \n                ns = this._namespace_prefix();\n                if(ns){\n                    value += ns;\n                }\n                \n                if(tokenStream.match(Tokens.STAR)){\n                    value += \"*\";\n                }\n                \n                return value.length ? value : null;\n                \n           },\n            _attrib: function(){\n                 \n                var tokenStream = this._tokenStream,\n                    value       = null,\n                    ns,\n                    token;\n                \n                if (tokenStream.match(Tokens.LBRACKET)){\n                    token = tokenStream.token();\n                    value = token.value;\n                    value += this._readWhitespace();\n                    \n                    ns = this._namespace_prefix();\n                    \n                    if (ns){\n                        value += ns;\n                    }\n                                        \n                    tokenStream.mustMatch(Tokens.IDENT);\n                    value += tokenStream.token().value;                    \n                    value += this._readWhitespace();\n                    \n                    if(tokenStream.match([Tokens.PREFIXMATCH, Tokens.SUFFIXMATCH, Tokens.SUBSTRINGMATCH,\n                            Tokens.EQUALS, Tokens.INCLUDES, Tokens.DASHMATCH])){\n                    \n                        value += tokenStream.token().value;                    \n                        value += this._readWhitespace();\n                        \n                        tokenStream.mustMatch([Tokens.IDENT, Tokens.STRING]);\n                        value += tokenStream.token().value;                    \n                        value += this._readWhitespace();\n                    }\n                    \n                    tokenStream.mustMatch(Tokens.RBRACKET);\n                                        \n                    return new SelectorSubPart(value + \"]\", \"attribute\", token.startLine, token.startCol);\n                } else {\n                    return null;\n                }\n            },\n            _pseudo: function(){   \n            \n                var tokenStream = this._tokenStream,\n                    pseudo      = null,\n                    colons      = \":\",\n                    line,\n                    col;\n                \n                if (tokenStream.match(Tokens.COLON)){\n                \n                    if (tokenStream.match(Tokens.COLON)){\n                        colons += \":\";\n                    }\n                \n                    if (tokenStream.match(Tokens.IDENT)){\n                        pseudo = tokenStream.token().value;\n                        line = tokenStream.token().startLine;\n                        col = tokenStream.token().startCol - colons.length;\n                    } else if (tokenStream.peek() == Tokens.FUNCTION){\n                        line = tokenStream.LT(1).startLine;\n                        col = tokenStream.LT(1).startCol - colons.length;\n                        pseudo = this._functional_pseudo();\n                    }\n                    \n                    if (pseudo){\n                        pseudo = new SelectorSubPart(colons + pseudo, \"pseudo\", line, col);\n                    }\n                }\n        \n                return pseudo;\n            },\n            _functional_pseudo: function(){            \n                \n                var tokenStream = this._tokenStream,\n                    value = null;\n                \n                if(tokenStream.match(Tokens.FUNCTION)){\n                    value = tokenStream.token().value;\n                    value += this._readWhitespace();\n                    value += this._expression();\n                    tokenStream.mustMatch(Tokens.RPAREN);\n                    value += \")\";\n                }\n                \n                return value;\n            },\n            _expression: function(){\n                 \n                var tokenStream = this._tokenStream,\n                    value       = \"\";\n                    \n                while(tokenStream.match([Tokens.PLUS, Tokens.MINUS, Tokens.DIMENSION,\n                        Tokens.NUMBER, Tokens.STRING, Tokens.IDENT, Tokens.LENGTH,\n                        Tokens.FREQ, Tokens.ANGLE, Tokens.TIME,\n                        Tokens.RESOLUTION, Tokens.SLASH])){\n                    \n                    value += tokenStream.token().value;\n                    value += this._readWhitespace();                        \n                }\n                \n                return value.length ? value : null;\n                \n            },\n            _negation: function(){\n\n                var tokenStream = this._tokenStream,\n                    line,\n                    col,\n                    value       = \"\",\n                    arg,\n                    subpart     = null;\n                    \n                if (tokenStream.match(Tokens.NOT)){\n                    value = tokenStream.token().value;\n                    line = tokenStream.token().startLine;\n                    col = tokenStream.token().startCol;\n                    value += this._readWhitespace();\n                    arg = this._negation_arg();\n                    value += arg;\n                    value += this._readWhitespace();\n                    tokenStream.match(Tokens.RPAREN);\n                    value += tokenStream.token().value;\n                    \n                    subpart = new SelectorSubPart(value, \"not\", line, col);\n                    subpart.args.push(arg);\n                }\n                \n                return subpart;\n            },\n            _negation_arg: function(){                       \n                 \n                var tokenStream = this._tokenStream,\n                    args        = [\n                        this._type_selector,\n                        this._universal,\n                        function(){\n                            return tokenStream.match(Tokens.HASH) ?\n                                    new SelectorSubPart(tokenStream.token().value, \"id\", tokenStream.token().startLine, tokenStream.token().startCol) :\n                                    null;                        \n                        },\n                        this._class,\n                        this._attrib,\n                        this._pseudo                    \n                    ],\n                    arg         = null,\n                    i           = 0,\n                    len         = args.length,\n                    elementName,\n                    line,\n                    col,\n                    part;\n                    \n                line = tokenStream.LT(1).startLine;\n                col = tokenStream.LT(1).startCol;\n                \n                while(i < len && arg === null){\n                    \n                    arg = args[i].call(this);\n                    i++;\n                }\n                if (arg === null){\n                    this._unexpectedToken(tokenStream.LT(1));\n                }\n                if (arg.type == \"elementName\"){\n                    part = new SelectorPart(arg, [], arg.toString(), line, col);\n                } else {\n                    part = new SelectorPart(null, [arg], arg.toString(), line, col);\n                }\n                \n                return part;                \n            },\n            \n            _declaration: function(){    \n            \n                var tokenStream = this._tokenStream,\n                    property    = null,\n                    expr        = null,\n                    prio        = null,\n                    error       = null,\n                    invalid     = null,\n                    propertyName= \"\";\n                \n                property = this._property();\n                if (property !== null){\n\n                    tokenStream.mustMatch(Tokens.COLON);\n                    this._readWhitespace();\n                    \n                    expr = this._expr();\n                    if (!expr || expr.length === 0){\n                        this._unexpectedToken(tokenStream.LT(1));\n                    }\n                    \n                    prio = this._prio();\n                    propertyName = property.toString();\n                    if (this.options.starHack && property.hack == \"*\" ||\n                            this.options.underscoreHack && property.hack == \"_\") {\n                         \n                        propertyName = property.text;\n                    }\n                    \n                    try {\n                        this._validateProperty(propertyName, expr);\n                    } catch (ex) {\n                        invalid = ex;\n                    }\n                    \n                    this.fire({\n                        type:       \"property\",\n                        property:   property,\n                        value:      expr,\n                        important:  prio,\n                        line:       property.line,\n                        col:        property.col,\n                        invalid:    invalid\n                    });                      \n                    \n                    return true;\n                } else {\n                    return false;\n                }\n            },\n            \n            _prio: function(){\n                 \n                var tokenStream = this._tokenStream,\n                    result      = tokenStream.match(Tokens.IMPORTANT_SYM);\n                    \n                this._readWhitespace();\n                return result;\n            },\n            \n            _expr: function(inFunction){\n        \n                var tokenStream = this._tokenStream,\n                    values      = [],\n                    value       = null,\n                    operator    = null;\n                    \n                value = this._term();\n                if (value !== null){\n                \n                    values.push(value);\n                    \n                    do {\n                        operator = this._operator(inFunction);\n                        if (operator){\n                            values.push(operator);\n                        } /*else {\n\t\t\t\t\t\t\tvalues.push(new PropertyValue(valueParts, valueParts[0].line, valueParts[0].col));\n\t\t\t\t\t\t\tvalueParts = [];\n\t\t\t\t\t\t}*/\n                        \n                        value = this._term();\n                        \n                        if (value === null){\n                            break;\n                        } else {\n                            values.push(value);\n                        }\n                    } while(true);\n                }\n        \n                return values.length > 0 ? new PropertyValue(values, values[0].line, values[0].col) : null;\n            },\n            \n            _term: function(){                           \n        \n                var tokenStream = this._tokenStream,\n                    unary       = null,\n                    value       = null,\n                    token,\n                    line,\n                    col;\n                unary = this._unary_operator();\n                if (unary !== null){\n                    line = tokenStream.token().startLine;\n                    col = tokenStream.token().startCol;\n                }                \n                if (tokenStream.peek() == Tokens.IE_FUNCTION && this.options.ieFilters){\n                \n                    value = this._ie_function();\n                    if (unary === null){\n                        line = tokenStream.token().startLine;\n                        col = tokenStream.token().startCol;\n                    }\n                } else if (tokenStream.match([Tokens.NUMBER, Tokens.PERCENTAGE, Tokens.LENGTH,\n                        Tokens.ANGLE, Tokens.TIME,\n                        Tokens.FREQ, Tokens.STRING, Tokens.IDENT, Tokens.URI, Tokens.UNICODE_RANGE])){\n                 \n                    value = tokenStream.token().value;\n                    if (unary === null){\n                        line = tokenStream.token().startLine;\n                        col = tokenStream.token().startCol;\n                    }\n                    this._readWhitespace();\n                } else {\n                    token = this._hexcolor();\n                    if (token === null){\n                        if (unary === null){\n                            line = tokenStream.LT(1).startLine;\n                            col = tokenStream.LT(1).startCol;\n                        }                    \n                        if (value === null){\n                            if (tokenStream.LA(3) == Tokens.EQUALS && this.options.ieFilters){\n                                value = this._ie_function();\n                            } else {\n                                value = this._function();\n                            }\n                        }\n                    \n                    } else {\n                        value = token.value;\n                        if (unary === null){\n                            line = token.startLine;\n                            col = token.startCol;\n                        }                    \n                    }\n                \n                }                \n                \n                return value !== null ?\n                        new PropertyValuePart(unary !== null ? unary + value : value, line, col) :\n                        null;\n        \n            },\n            \n            _function: function(){\n                 \n                var tokenStream = this._tokenStream,\n                    functionText = null,\n                    expr        = null,\n                    lt;\n                    \n                if (tokenStream.match(Tokens.FUNCTION)){\n                    functionText = tokenStream.token().value;\n                    this._readWhitespace();\n                    expr = this._expr(true);\n                    functionText += expr;\n                    if (this.options.ieFilters && tokenStream.peek() == Tokens.EQUALS){\n                        do {\n                        \n                            if (this._readWhitespace()){\n                                functionText += tokenStream.token().value;\n                            }\n                            if (tokenStream.LA(0) == Tokens.COMMA){\n                                functionText += tokenStream.token().value;\n                            }\n                        \n                            tokenStream.match(Tokens.IDENT);\n                            functionText += tokenStream.token().value;\n                            \n                            tokenStream.match(Tokens.EQUALS);\n                            functionText += tokenStream.token().value;\n                            lt = tokenStream.peek();\n                            while(lt != Tokens.COMMA && lt != Tokens.S && lt != Tokens.RPAREN){\n                                tokenStream.get();\n                                functionText += tokenStream.token().value;\n                                lt = tokenStream.peek();\n                            }\n                        } while(tokenStream.match([Tokens.COMMA, Tokens.S]));\n                    }\n                    \n                    tokenStream.match(Tokens.RPAREN);    \n                    functionText += \")\";\n                    this._readWhitespace();\n                }                \n                \n                return functionText;\n            }, \n            \n            _ie_function: function(){\n                 \n                var tokenStream = this._tokenStream,\n                    functionText = null,\n                    expr        = null,\n                    lt;\n                if (tokenStream.match([Tokens.IE_FUNCTION, Tokens.FUNCTION])){\n                    functionText = tokenStream.token().value;\n                    \n                    do {\n                    \n                        if (this._readWhitespace()){\n                            functionText += tokenStream.token().value;\n                        }\n                        if (tokenStream.LA(0) == Tokens.COMMA){\n                            functionText += tokenStream.token().value;\n                        }\n                    \n                        tokenStream.match(Tokens.IDENT);\n                        functionText += tokenStream.token().value;\n                        \n                        tokenStream.match(Tokens.EQUALS);\n                        functionText += tokenStream.token().value;\n                        lt = tokenStream.peek();\n                        while(lt != Tokens.COMMA && lt != Tokens.S && lt != Tokens.RPAREN){\n                            tokenStream.get();\n                            functionText += tokenStream.token().value;\n                            lt = tokenStream.peek();\n                        }\n                    } while(tokenStream.match([Tokens.COMMA, Tokens.S]));                    \n                    \n                    tokenStream.match(Tokens.RPAREN);    \n                    functionText += \")\";\n                    this._readWhitespace();\n                }                \n                \n                return functionText;\n            }, \n            \n            _hexcolor: function(){\n                 \n                var tokenStream = this._tokenStream,\n                    token = null,\n                    color;\n                    \n                if(tokenStream.match(Tokens.HASH)){\n                    \n                    token = tokenStream.token();\n                    color = token.value;\n                    if (!/#[a-f0-9]{3,6}/i.test(color)){\n                        throw new SyntaxError(\"Expected a hex color but found '\" + color + \"' at line \" + token.startLine + \", col \" + token.startCol + \".\", token.startLine, token.startCol);\n                    }\n                    this._readWhitespace();\n                }\n                \n                return token;\n            },\n            \n            _keyframes: function(){\n                var tokenStream = this._tokenStream,\n                    token,\n                    tt,\n                    name,\n                    prefix = \"\";            \n                    \n                tokenStream.mustMatch(Tokens.KEYFRAMES_SYM);\n                token = tokenStream.token();\n                if (/^@\\-([^\\-]+)\\-/.test(token.value)) {\n                    prefix = RegExp.$1;\n                }\n                \n                this._readWhitespace();\n                name = this._keyframe_name();\n                \n                this._readWhitespace();\n                tokenStream.mustMatch(Tokens.LBRACE);\n                    \n                this.fire({\n                    type:   \"startkeyframes\",\n                    name:   name,\n                    prefix: prefix,\n                    line:   token.startLine,\n                    col:    token.startCol\n                });                \n                \n                this._readWhitespace();\n                tt = tokenStream.peek();\n                while(tt == Tokens.IDENT || tt == Tokens.PERCENTAGE) {\n                    this._keyframe_rule();\n                    this._readWhitespace();\n                    tt = tokenStream.peek();\n                }           \n                \n                this.fire({\n                    type:   \"endkeyframes\",\n                    name:   name,\n                    prefix: prefix,\n                    line:   token.startLine,\n                    col:    token.startCol\n                });                      \n                    \n                this._readWhitespace();\n                tokenStream.mustMatch(Tokens.RBRACE);                    \n                \n            },\n            \n            _keyframe_name: function(){\n                var tokenStream = this._tokenStream,\n                    token;\n\n                tokenStream.mustMatch([Tokens.IDENT, Tokens.STRING]);\n                return SyntaxUnit.fromToken(tokenStream.token());            \n            },\n            \n            _keyframe_rule: function(){\n                var tokenStream = this._tokenStream,\n                    token,\n                    keyList = this._key_list();\n                                    \n                this.fire({\n                    type:   \"startkeyframerule\",\n                    keys:   keyList,\n                    line:   keyList[0].line,\n                    col:    keyList[0].col\n                });                \n                \n                this._readDeclarations(true);                \n                \n                this.fire({\n                    type:   \"endkeyframerule\",\n                    keys:   keyList,\n                    line:   keyList[0].line,\n                    col:    keyList[0].col\n                });  \n                \n            },\n            \n            _key_list: function(){\n                var tokenStream = this._tokenStream,\n                    token,\n                    key,\n                    keyList = [];\n                keyList.push(this._key());\n                    \n                this._readWhitespace();\n                    \n                while(tokenStream.match(Tokens.COMMA)){\n                    this._readWhitespace();\n                    keyList.push(this._key());\n                    this._readWhitespace();\n                }\n\n                return keyList;\n            },\n                        \n            _key: function(){\n                 \n                var tokenStream = this._tokenStream,\n                    token;\n                    \n                if (tokenStream.match(Tokens.PERCENTAGE)){\n                    return SyntaxUnit.fromToken(tokenStream.token());\n                } else if (tokenStream.match(Tokens.IDENT)){\n                    token = tokenStream.token();                    \n                    \n                    if (/from|to/i.test(token.value)){\n                        return SyntaxUnit.fromToken(token);\n                    }\n                    \n                    tokenStream.unget();\n                }\n                this._unexpectedToken(tokenStream.LT(1));\n            },\n            _skipCruft: function(){\n                while(this._tokenStream.match([Tokens.S, Tokens.CDO, Tokens.CDC])){\n                }\n            },\n            _readDeclarations: function(checkStart, readMargins){\n                var tokenStream = this._tokenStream,\n                    tt;\n                       \n\n                this._readWhitespace();\n                \n                if (checkStart){\n                    tokenStream.mustMatch(Tokens.LBRACE);            \n                }\n                \n                this._readWhitespace();\n\n                try {\n                    \n                    while(true){\n                    \n                        if (tokenStream.match(Tokens.SEMICOLON) || (readMargins && this._margin())){\n                        } else if (this._declaration()){\n                            if (!tokenStream.match(Tokens.SEMICOLON)){\n                                break;\n                            }\n                        } else {\n                            break;\n                        }\n                        this._readWhitespace();\n                    }\n                    \n                    tokenStream.mustMatch(Tokens.RBRACE);\n                    this._readWhitespace();\n                    \n                } catch (ex) {\n                    if (ex instanceof SyntaxError && !this.options.strict){\n                        this.fire({\n                            type:       \"error\",\n                            error:      ex,\n                            message:    ex.message,\n                            line:       ex.line,\n                            col:        ex.col\n                        });                          \n                        tt = tokenStream.advance([Tokens.SEMICOLON, Tokens.RBRACE]);\n                        if (tt == Tokens.SEMICOLON){\n                            this._readDeclarations(false, readMargins);                            \n                        } else if (tt != Tokens.RBRACE){\n                            throw ex;\n                        }                        \n                        \n                    } else {\n                        throw ex;\n                    }\n                }    \n            \n            },      \n            _readWhitespace: function(){\n            \n                var tokenStream = this._tokenStream,\n                    ws = \"\";\n                    \n                while(tokenStream.match(Tokens.S)){\n                    ws += tokenStream.token().value;\n                }\n                \n                return ws;\n            },\n            _unexpectedToken: function(token){\n                throw new SyntaxError(\"Unexpected token '\" + token.value + \"' at line \" + token.startLine + \", col \" + token.startCol + \".\", token.startLine, token.startCol);\n            },\n            _verifyEnd: function(){\n                if (this._tokenStream.LA(1) != Tokens.EOF){\n                    this._unexpectedToken(this._tokenStream.LT(1));\n                }            \n            },\n            _validateProperty: function(property, value){\n                Validation.validate(property, value);\n            },\n            \n            parse: function(input){    \n                this._tokenStream = new TokenStream(input, Tokens);\n                this._stylesheet();\n            },\n            \n            parseStyleSheet: function(input){\n                return this.parse(input);\n            },\n            \n            parseMediaQuery: function(input){\n                this._tokenStream = new TokenStream(input, Tokens);\n                var result = this._media_query();\n                this._verifyEnd();\n                return result;            \n            },             \n            parsePropertyValue: function(input){\n            \n                this._tokenStream = new TokenStream(input, Tokens);\n                this._readWhitespace();\n                \n                var result = this._expr();\n                this._readWhitespace();\n                this._verifyEnd();\n                return result;\n            },\n            parseRule: function(input){\n                this._tokenStream = new TokenStream(input, Tokens);\n                this._readWhitespace();\n                \n                var result = this._ruleset();\n                this._readWhitespace();\n                this._verifyEnd();\n                return result;            \n            },\n            parseSelector: function(input){\n            \n                this._tokenStream = new TokenStream(input, Tokens);\n                this._readWhitespace();\n                \n                var result = this._selector();\n                this._readWhitespace();\n                this._verifyEnd();\n                return result;\n            },\n            parseStyleAttribute: function(input){\n                input += \"}\"; // for error recovery in _readDeclarations()\n                this._tokenStream = new TokenStream(input, Tokens);\n                this._readDeclarations();\n            }\n        };\n    for (prop in additions){\n        if (additions.hasOwnProperty(prop)){\n            proto[prop] = additions[prop];\n        }\n    }   \n    \n    return proto;\n}();\nvar Properties = {\n    \"alignment-adjust\"              : \"auto | baseline | before-edge | text-before-edge | middle | central | after-edge | text-after-edge | ideographic | alphabetic | hanging | mathematical | <percentage> | <length>\",\n    \"alignment-baseline\"            : \"baseline | use-script | before-edge | text-before-edge | after-edge | text-after-edge | central | middle | ideographic | alphabetic | hanging | mathematical\",\n    \"animation\"                     : 1,\n    \"animation-delay\"               : { multi: \"<time>\", comma: true },\n    \"animation-direction\"           : { multi: \"normal | alternate\", comma: true },\n    \"animation-duration\"            : { multi: \"<time>\", comma: true },\n    \"animation-iteration-count\"     : { multi: \"<number> | infinite\", comma: true },\n    \"animation-name\"                : { multi: \"none | <ident>\", comma: true },\n    \"animation-play-state\"          : { multi: \"running | paused\", comma: true },\n    \"animation-timing-function\"     : 1,\n    \"-moz-animation-delay\"               : { multi: \"<time>\", comma: true },\n    \"-moz-animation-direction\"           : { multi: \"normal | alternate\", comma: true },\n    \"-moz-animation-duration\"            : { multi: \"<time>\", comma: true },\n    \"-moz-animation-iteration-count\"     : { multi: \"<number> | infinite\", comma: true },\n    \"-moz-animation-name\"                : { multi: \"none | <ident>\", comma: true },\n    \"-moz-animation-play-state\"          : { multi: \"running | paused\", comma: true },\n    \n    \"-ms-animation-delay\"               : { multi: \"<time>\", comma: true },\n    \"-ms-animation-direction\"           : { multi: \"normal | alternate\", comma: true },\n    \"-ms-animation-duration\"            : { multi: \"<time>\", comma: true },\n    \"-ms-animation-iteration-count\"     : { multi: \"<number> | infinite\", comma: true },\n    \"-ms-animation-name\"                : { multi: \"none | <ident>\", comma: true },\n    \"-ms-animation-play-state\"          : { multi: \"running | paused\", comma: true },\n    \n    \"-webkit-animation-delay\"               : { multi: \"<time>\", comma: true },\n    \"-webkit-animation-direction\"           : { multi: \"normal | alternate\", comma: true },\n    \"-webkit-animation-duration\"            : { multi: \"<time>\", comma: true },\n    \"-webkit-animation-iteration-count\"     : { multi: \"<number> | infinite\", comma: true },\n    \"-webkit-animation-name\"                : { multi: \"none | <ident>\", comma: true },\n    \"-webkit-animation-play-state\"          : { multi: \"running | paused\", comma: true },\n    \n    \"-o-animation-delay\"               : { multi: \"<time>\", comma: true },\n    \"-o-animation-direction\"           : { multi: \"normal | alternate\", comma: true },\n    \"-o-animation-duration\"            : { multi: \"<time>\", comma: true },\n    \"-o-animation-iteration-count\"     : { multi: \"<number> | infinite\", comma: true },\n    \"-o-animation-name\"                : { multi: \"none | <ident>\", comma: true },\n    \"-o-animation-play-state\"          : { multi: \"running | paused\", comma: true },        \n    \n    \"appearance\"                    : \"icon | window | desktop | workspace | document | tooltip | dialog | button | push-button | hyperlink | radio-button | checkbox | menu-item | tab | menu | menubar | pull-down-menu | pop-up-menu | list-menu | radio-group | checkbox-group | outline-tree | range | field | combo-box | signature | password | normal | none | inherit\",\n    \"azimuth\"                       : function (expression) {\n        var simple      = \"<angle> | leftwards | rightwards | inherit\",\n            direction   = \"left-side | far-left | left | center-left | center | center-right | right | far-right | right-side\",\n            behind      = false,\n            valid       = false,\n            part;\n        \n        if (!ValidationTypes.isAny(expression, simple)) {\n            if (ValidationTypes.isAny(expression, \"behind\")) {\n                behind = true;\n                valid = true;\n            }\n            \n            if (ValidationTypes.isAny(expression, direction)) {\n                valid = true;\n                if (!behind) {\n                    ValidationTypes.isAny(expression, \"behind\");\n                }\n            }\n        }\n        \n        if (expression.hasNext()) {\n            part = expression.next();\n            if (valid) {\n                throw new ValidationError(\"Expected end of value but found '\" + part + \"'.\", part.line, part.col);\n            } else {\n                throw new ValidationError(\"Expected (<'azimuth'>) but found '\" + part + \"'.\", part.line, part.col);\n            }\n        }        \n    },\n    \"backface-visibility\"           : \"visible | hidden\",\n    \"background\"                    : 1,\n    \"background-attachment\"         : { multi: \"<attachment>\", comma: true },\n    \"background-clip\"               : { multi: \"<box>\", comma: true },\n    \"background-color\"              : \"<color> | inherit\",\n    \"background-image\"              : { multi: \"<bg-image>\", comma: true },\n    \"background-origin\"             : { multi: \"<box>\", comma: true },\n    \"background-position\"           : { multi: \"<bg-position>\", comma: true },\n    \"background-repeat\"             : { multi: \"<repeat-style>\" },\n    \"background-size\"               : { multi: \"<bg-size>\", comma: true },\n    \"baseline-shift\"                : \"baseline | sub | super | <percentage> | <length>\",\n    \"behavior\"                      : 1,\n    \"binding\"                       : 1,\n    \"bleed\"                         : \"<length>\",\n    \"bookmark-label\"                : \"<content> | <attr> | <string>\",\n    \"bookmark-level\"                : \"none | <integer>\",\n    \"bookmark-state\"                : \"open | closed\",\n    \"bookmark-target\"               : \"none | <uri> | <attr>\",\n    \"border\"                        : \"<border-width> || <border-style> || <color>\",\n    \"border-bottom\"                 : \"<border-width> || <border-style> || <color>\",\n    \"border-bottom-color\"           : \"<color>\",\n    \"border-bottom-left-radius\"     :  \"<x-one-radius>\",\n    \"border-bottom-right-radius\"    :  \"<x-one-radius>\",\n    \"border-bottom-style\"           : \"<border-style>\",\n    \"border-bottom-width\"           : \"<border-width>\",\n    \"border-collapse\"               : \"collapse | separate | inherit\",\n    \"border-color\"                  : { multi: \"<color> | inherit\", max: 4 },\n    \"border-image\"                  : 1,\n    \"border-image-outset\"           : { multi: \"<length> | <number>\", max: 4 },\n    \"border-image-repeat\"           : { multi: \"stretch | repeat | round\", max: 2 },\n    \"border-image-slice\"            : function(expression) {\n        \n        var valid   = false,\n            numeric = \"<number> | <percentage>\",\n            fill    = false,\n            count   = 0,\n            max     = 4,\n            part;\n        \n        if (ValidationTypes.isAny(expression, \"fill\")) {\n            fill = true;\n            valid = true;\n        }\n        \n        while (expression.hasNext() && count < max) {\n            valid = ValidationTypes.isAny(expression, numeric);\n            if (!valid) {\n                break;\n            }\n            count++;\n        }\n        \n        \n        if (!fill) {\n            ValidationTypes.isAny(expression, \"fill\");\n        } else {\n            valid = true;\n        }\n        \n        if (expression.hasNext()) {\n            part = expression.next();\n            if (valid) {\n                throw new ValidationError(\"Expected end of value but found '\" + part + \"'.\", part.line, part.col);\n            } else {\n                throw new ValidationError(\"Expected ([<number> | <percentage>]{1,4} && fill?) but found '\" + part + \"'.\", part.line, part.col);\n            }\n        }         \n    },\n    \"border-image-source\"           : \"<image> | none\",\n    \"border-image-width\"            : { multi: \"<length> | <percentage> | <number> | auto\", max: 4 },\n    \"border-left\"                   : \"<border-width> || <border-style> || <color>\",\n    \"border-left-color\"             : \"<color> | inherit\",\n    \"border-left-style\"             : \"<border-style>\",\n    \"border-left-width\"             : \"<border-width>\",\n    \"border-radius\"                 : function(expression) {\n        \n        var valid   = false,\n            numeric = \"<length> | <percentage>\",\n            slash   = false,\n            fill    = false,\n            count   = 0,\n            max     = 8,\n            part;\n\n        while (expression.hasNext() && count < max) {\n            valid = ValidationTypes.isAny(expression, numeric);\n            if (!valid) {\n            \n                if (expression.peek() == \"/\" && count > 0 && !slash) {\n                    slash = true;\n                    max = count + 5;\n                    expression.next();\n                } else {\n                    break;\n                }\n            }\n            count++;\n        }\n        \n        if (expression.hasNext()) {\n            part = expression.next();\n            if (valid) {\n                throw new ValidationError(\"Expected end of value but found '\" + part + \"'.\", part.line, part.col);\n            } else {\n                throw new ValidationError(\"Expected (<'border-radius'>) but found '\" + part + \"'.\", part.line, part.col);\n            }\n        }         \n    },\n    \"border-right\"                  : \"<border-width> || <border-style> || <color>\",\n    \"border-right-color\"            : \"<color> | inherit\",\n    \"border-right-style\"            : \"<border-style>\",\n    \"border-right-width\"            : \"<border-width>\",\n    \"border-spacing\"                : { multi: \"<length> | inherit\", max: 2 },\n    \"border-style\"                  : { multi: \"<border-style>\", max: 4 },\n    \"border-top\"                    : \"<border-width> || <border-style> || <color>\",\n    \"border-top-color\"              : \"<color> | inherit\",\n    \"border-top-left-radius\"        : \"<x-one-radius>\",\n    \"border-top-right-radius\"       : \"<x-one-radius>\",\n    \"border-top-style\"              : \"<border-style>\",\n    \"border-top-width\"              : \"<border-width>\",\n    \"border-width\"                  : { multi: \"<border-width>\", max: 4 },\n    \"bottom\"                        : \"<margin-width> | inherit\", \n    \"box-align\"                     : \"start | end | center | baseline | stretch\",        //http://www.w3.org/TR/2009/WD-css3-flexbox-20090723/\n    \"box-decoration-break\"          : \"slice |clone\",\n    \"box-direction\"                 : \"normal | reverse | inherit\",\n    \"box-flex\"                      : \"<number>\",\n    \"box-flex-group\"                : \"<integer>\",\n    \"box-lines\"                     : \"single | multiple\",\n    \"box-ordinal-group\"             : \"<integer>\",\n    \"box-orient\"                    : \"horizontal | vertical | inline-axis | block-axis | inherit\",\n    \"box-pack\"                      : \"start | end | center | justify\",\n    \"box-shadow\"                    : function (expression) {\n        var result      = false,\n            part;\n\n        if (!ValidationTypes.isAny(expression, \"none\")) {\n            Validation.multiProperty(\"<shadow>\", expression, true, Infinity);                       \n        } else {\n            if (expression.hasNext()) {\n                part = expression.next();\n                throw new ValidationError(\"Expected end of value but found '\" + part + \"'.\", part.line, part.col);\n            }   \n        }\n    },\n    \"box-sizing\"                    : \"content-box | border-box | inherit\",\n    \"break-after\"                   : \"auto | always | avoid | left | right | page | column | avoid-page | avoid-column\",\n    \"break-before\"                  : \"auto | always | avoid | left | right | page | column | avoid-page | avoid-column\",\n    \"break-inside\"                  : \"auto | avoid | avoid-page | avoid-column\",\n    \"caption-side\"                  : \"top | bottom | inherit\",\n    \"clear\"                         : \"none | right | left | both | inherit\",\n    \"clip\"                          : 1,\n    \"color\"                         : \"<color> | inherit\",\n    \"color-profile\"                 : 1,\n    \"column-count\"                  : \"<integer> | auto\",                      //http://www.w3.org/TR/css3-multicol/\n    \"column-fill\"                   : \"auto | balance\",\n    \"column-gap\"                    : \"<length> | normal\",\n    \"column-rule\"                   : \"<border-width> || <border-style> || <color>\",\n    \"column-rule-color\"             : \"<color>\",\n    \"column-rule-style\"             : \"<border-style>\",\n    \"column-rule-width\"             : \"<border-width>\",\n    \"column-span\"                   : \"none | all\",\n    \"column-width\"                  : \"<length> | auto\",\n    \"columns\"                       : 1,\n    \"content\"                       : 1,\n    \"counter-increment\"             : 1,\n    \"counter-reset\"                 : 1,\n    \"crop\"                          : \"<shape> | auto\",\n    \"cue\"                           : \"cue-after | cue-before | inherit\",\n    \"cue-after\"                     : 1,\n    \"cue-before\"                    : 1,\n    \"cursor\"                        : 1,\n    \"direction\"                     : \"ltr | rtl | inherit\",\n    \"display\"                       : \"inline | block | list-item | inline-block | table | inline-table | table-row-group | table-header-group | table-footer-group | table-row | table-column-group | table-column | table-cell | table-caption | box | inline-box | grid | inline-grid | none | inherit | -moz-box | -moz-inline-block | -moz-inline-box | -moz-inline-grid | -moz-inline-stack | -moz-inline-table | -moz-grid | -moz-grid-group | -moz-grid-line | -moz-groupbox | -moz-deck | -moz-popup | -moz-stack | -moz-marker\",\n    \"dominant-baseline\"             : 1,\n    \"drop-initial-after-adjust\"     : \"central | middle | after-edge | text-after-edge | ideographic | alphabetic | mathematical | <percentage> | <length>\",\n    \"drop-initial-after-align\"      : \"baseline | use-script | before-edge | text-before-edge | after-edge | text-after-edge | central | middle | ideographic | alphabetic | hanging | mathematical\",\n    \"drop-initial-before-adjust\"    : \"before-edge | text-before-edge | central | middle | hanging | mathematical | <percentage> | <length>\",\n    \"drop-initial-before-align\"     : \"caps-height | baseline | use-script | before-edge | text-before-edge | after-edge | text-after-edge | central | middle | ideographic | alphabetic | hanging | mathematical\",\n    \"drop-initial-size\"             : \"auto | line | <length> | <percentage>\",\n    \"drop-initial-value\"            : \"initial | <integer>\",\n    \"elevation\"                     : \"<angle> | below | level | above | higher | lower | inherit\",\n    \"empty-cells\"                   : \"show | hide | inherit\",\n    \"filter\"                        : 1,\n    \"fit\"                           : \"fill | hidden | meet | slice\",\n    \"fit-position\"                  : 1,\n    \"float\"                         : \"left | right | none | inherit\",    \n    \"float-offset\"                  : 1,\n    \"font\"                          : 1,\n    \"font-family\"                   : 1,\n    \"font-size\"                     : \"<absolute-size> | <relative-size> | <length> | <percentage> | inherit\",\n    \"font-size-adjust\"              : \"<number> | none | inherit\",\n    \"font-stretch\"                  : \"normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded | inherit\",\n    \"font-style\"                    : \"normal | italic | oblique | inherit\",\n    \"font-variant\"                  : \"normal | small-caps | inherit\",\n    \"font-weight\"                   : \"normal | bold | bolder | lighter | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | inherit\",\n    \"grid-cell-stacking\"            : \"columns | rows | layer\",\n    \"grid-column\"                   : 1,\n    \"grid-columns\"                  : 1,\n    \"grid-column-align\"             : \"start | end | center | stretch\",\n    \"grid-column-sizing\"            : 1,\n    \"grid-column-span\"              : \"<integer>\",\n    \"grid-flow\"                     : \"none | rows | columns\",\n    \"grid-layer\"                    : \"<integer>\",\n    \"grid-row\"                      : 1,\n    \"grid-rows\"                     : 1,\n    \"grid-row-align\"                : \"start | end | center | stretch\",\n    \"grid-row-span\"                 : \"<integer>\",\n    \"grid-row-sizing\"               : 1,\n    \"hanging-punctuation\"           : 1,\n    \"height\"                        : \"<margin-width> | inherit\",\n    \"hyphenate-after\"               : \"<integer> | auto\",\n    \"hyphenate-before\"              : \"<integer> | auto\",\n    \"hyphenate-character\"           : \"<string> | auto\",\n    \"hyphenate-lines\"               : \"no-limit | <integer>\",\n    \"hyphenate-resource\"            : 1,\n    \"hyphens\"                       : \"none | manual | auto\",\n    \"icon\"                          : 1,\n    \"image-orientation\"             : \"angle | auto\",\n    \"image-rendering\"               : 1,\n    \"image-resolution\"              : 1,\n    \"inline-box-align\"              : \"initial | last | <integer>\",\n    \"left\"                          : \"<margin-width> | inherit\",\n    \"letter-spacing\"                : \"<length> | normal | inherit\",\n    \"line-height\"                   : \"<number> | <length> | <percentage> | normal | inherit\",\n    \"line-break\"                    : \"auto | loose | normal | strict\",\n    \"line-stacking\"                 : 1,\n    \"line-stacking-ruby\"            : \"exclude-ruby | include-ruby\",\n    \"line-stacking-shift\"           : \"consider-shifts | disregard-shifts\",\n    \"line-stacking-strategy\"        : \"inline-line-height | block-line-height | max-height | grid-height\",\n    \"list-style\"                    : 1,\n    \"list-style-image\"              : \"<uri> | none | inherit\",\n    \"list-style-position\"           : \"inside | outside | inherit\",\n    \"list-style-type\"               : \"disc | circle | square | decimal | decimal-leading-zero | lower-roman | upper-roman | lower-greek | lower-latin | upper-latin | armenian | georgian | lower-alpha | upper-alpha | none | inherit\",\n    \"margin\"                        : { multi: \"<margin-width> | inherit\", max: 4 },\n    \"margin-bottom\"                 : \"<margin-width> | inherit\",\n    \"margin-left\"                   : \"<margin-width> | inherit\",\n    \"margin-right\"                  : \"<margin-width> | inherit\",\n    \"margin-top\"                    : \"<margin-width> | inherit\",\n    \"mark\"                          : 1,\n    \"mark-after\"                    : 1,\n    \"mark-before\"                   : 1,\n    \"marks\"                         : 1,\n    \"marquee-direction\"             : 1,\n    \"marquee-play-count\"            : 1,\n    \"marquee-speed\"                 : 1,\n    \"marquee-style\"                 : 1,\n    \"max-height\"                    : \"<length> | <percentage> | none | inherit\",\n    \"max-width\"                     : \"<length> | <percentage> | none | inherit\",\n    \"min-height\"                    : \"<length> | <percentage> | inherit\",\n    \"min-width\"                     : \"<length> | <percentage> | inherit\",\n    \"move-to\"                       : 1,\n    \"nav-down\"                      : 1,\n    \"nav-index\"                     : 1,\n    \"nav-left\"                      : 1,\n    \"nav-right\"                     : 1,\n    \"nav-up\"                        : 1,\n    \"opacity\"                       : \"<number> | inherit\",\n    \"orphans\"                       : \"<integer> | inherit\",\n    \"outline\"                       : 1,\n    \"outline-color\"                 : \"<color> | invert | inherit\",\n    \"outline-offset\"                : 1,\n    \"outline-style\"                 : \"<border-style> | inherit\",\n    \"outline-width\"                 : \"<border-width> | inherit\",\n    \"overflow\"                      : \"visible | hidden | scroll | auto | inherit\",\n    \"overflow-style\"                : 1,\n    \"overflow-x\"                    : 1,\n    \"overflow-y\"                    : 1,\n    \"padding\"                       : { multi: \"<padding-width> | inherit\", max: 4 },\n    \"padding-bottom\"                : \"<padding-width> | inherit\",\n    \"padding-left\"                  : \"<padding-width> | inherit\",\n    \"padding-right\"                 : \"<padding-width> | inherit\",\n    \"padding-top\"                   : \"<padding-width> | inherit\",\n    \"page\"                          : 1,\n    \"page-break-after\"              : \"auto | always | avoid | left | right | inherit\",\n    \"page-break-before\"             : \"auto | always | avoid | left | right | inherit\",\n    \"page-break-inside\"             : \"auto | avoid | inherit\",\n    \"page-policy\"                   : 1,\n    \"pause\"                         : 1,\n    \"pause-after\"                   : 1,\n    \"pause-before\"                  : 1,\n    \"perspective\"                   : 1,\n    \"perspective-origin\"            : 1,\n    \"phonemes\"                      : 1,\n    \"pitch\"                         : 1,\n    \"pitch-range\"                   : 1,\n    \"play-during\"                   : 1,\n    \"pointer-events\"                : \"auto | none | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | inherit\",\n    \"position\"                      : \"static | relative | absolute | fixed | inherit\",\n    \"presentation-level\"            : 1,\n    \"punctuation-trim\"              : 1,\n    \"quotes\"                        : 1,\n    \"rendering-intent\"              : 1,\n    \"resize\"                        : 1,\n    \"rest\"                          : 1,\n    \"rest-after\"                    : 1,\n    \"rest-before\"                   : 1,\n    \"richness\"                      : 1,\n    \"right\"                         : \"<margin-width> | inherit\",\n    \"rotation\"                      : 1,\n    \"rotation-point\"                : 1,\n    \"ruby-align\"                    : 1,\n    \"ruby-overhang\"                 : 1,\n    \"ruby-position\"                 : 1,\n    \"ruby-span\"                     : 1,\n    \"size\"                          : 1,\n    \"speak\"                         : \"normal | none | spell-out | inherit\",\n    \"speak-header\"                  : \"once | always | inherit\",\n    \"speak-numeral\"                 : \"digits | continuous | inherit\",\n    \"speak-punctuation\"             : \"code | none | inherit\",\n    \"speech-rate\"                   : 1,\n    \"src\"                           : 1,\n    \"stress\"                        : 1,\n    \"string-set\"                    : 1,\n    \n    \"table-layout\"                  : \"auto | fixed | inherit\",\n    \"tab-size\"                      : \"<integer> | <length>\",\n    \"target\"                        : 1,\n    \"target-name\"                   : 1,\n    \"target-new\"                    : 1,\n    \"target-position\"               : 1,\n    \"text-align\"                    : \"left | right | center | justify | inherit\" ,\n    \"text-align-last\"               : 1,\n    \"text-decoration\"               : 1,\n    \"text-emphasis\"                 : 1,\n    \"text-height\"                   : 1,\n    \"text-indent\"                   : \"<length> | <percentage> | inherit\",\n    \"text-justify\"                  : \"auto | none | inter-word | inter-ideograph | inter-cluster | distribute | kashida\",\n    \"text-outline\"                  : 1,\n    \"text-overflow\"                 : 1,\n    \"text-rendering\"                : \"auto | optimizeSpeed | optimizeLegibility | geometricPrecision | inherit\",\n    \"text-shadow\"                   : 1,\n    \"text-transform\"                : \"capitalize | uppercase | lowercase | none | inherit\",\n    \"text-wrap\"                     : \"normal | none | avoid\",\n    \"top\"                           : \"<margin-width> | inherit\",\n    \"transform\"                     : 1,\n    \"transform-origin\"              : 1,\n    \"transform-style\"               : 1,\n    \"transition\"                    : 1,\n    \"transition-delay\"              : 1,\n    \"transition-duration\"           : 1,\n    \"transition-property\"           : 1,\n    \"transition-timing-function\"    : 1,\n    \"unicode-bidi\"                  : \"normal | embed | bidi-override | inherit\",\n    \"user-modify\"                   : \"read-only | read-write | write-only | inherit\",\n    \"user-select\"                   : \"none | text | toggle | element | elements | all | inherit\",\n    \"vertical-align\"                : \"auto | use-script | baseline | sub | super | top | text-top | central | middle | bottom | text-bottom | <percentage> | <length>\",\n    \"visibility\"                    : \"visible | hidden | collapse | inherit\",\n    \"voice-balance\"                 : 1,\n    \"voice-duration\"                : 1,\n    \"voice-family\"                  : 1,\n    \"voice-pitch\"                   : 1,\n    \"voice-pitch-range\"             : 1,\n    \"voice-rate\"                    : 1,\n    \"voice-stress\"                  : 1,\n    \"voice-volume\"                  : 1,\n    \"volume\"                        : 1,\n    \"white-space\"                   : \"normal | pre | nowrap | pre-wrap | pre-line | inherit | -pre-wrap | -o-pre-wrap | -moz-pre-wrap | -hp-pre-wrap\", //http://perishablepress.com/wrapping-content/\n    \"white-space-collapse\"          : 1,\n    \"widows\"                        : \"<integer> | inherit\",\n    \"width\"                         : \"<length> | <percentage> | auto | inherit\" ,\n    \"word-break\"                    : \"normal | keep-all | break-all\",\n    \"word-spacing\"                  : \"<length> | normal | inherit\",\n    \"word-wrap\"                     : 1,\n    \"z-index\"                       : \"<integer> | auto | inherit\",\n    \"zoom\"                          : \"<number> | <percentage> | normal\"\n};\nfunction PropertyName(text, hack, line, col){\n    \n    SyntaxUnit.call(this, text, line, col, Parser.PROPERTY_NAME_TYPE);\n    this.hack = hack;\n\n}\n\nPropertyName.prototype = new SyntaxUnit();\nPropertyName.prototype.constructor = PropertyName;\nPropertyName.prototype.toString = function(){\n    return (this.hack ? this.hack : \"\") + this.text;\n};\nfunction PropertyValue(parts, line, col){\n\n    SyntaxUnit.call(this, parts.join(\" \"), line, col, Parser.PROPERTY_VALUE_TYPE);\n    this.parts = parts;\n    \n}\n\nPropertyValue.prototype = new SyntaxUnit();\nPropertyValue.prototype.constructor = PropertyValue;\nfunction PropertyValueIterator(value){\n    this._i = 0;\n    this._parts = value.parts;\n    this._marks = [];\n    this.value = value;\n    \n}\nPropertyValueIterator.prototype.count = function(){\n    return this._parts.length;\n};\nPropertyValueIterator.prototype.isFirst = function(){\n    return this._i === 0;\n};\nPropertyValueIterator.prototype.hasNext = function(){\n    return (this._i < this._parts.length);\n};\nPropertyValueIterator.prototype.mark = function(){\n    this._marks.push(this._i);\n};\nPropertyValueIterator.prototype.peek = function(count){\n    return this.hasNext() ? this._parts[this._i + (count || 0)] : null;\n};\nPropertyValueIterator.prototype.next = function(){\n    return this.hasNext() ? this._parts[this._i++] : null;\n};\nPropertyValueIterator.prototype.previous = function(){\n    return this._i > 0 ? this._parts[--this._i] : null;\n};\nPropertyValueIterator.prototype.restore = function(){\n    if (this._marks.length){\n        this._i = this._marks.pop();\n    }\n};\nfunction PropertyValuePart(text, line, col){\n\n    SyntaxUnit.call(this, text, line, col, Parser.PROPERTY_VALUE_PART_TYPE);\n    this.type = \"unknown\";\n    \n    var temp;\n    if (/^([+\\-]?[\\d\\.]+)([a-z]+)$/i.test(text)){  //dimension\n        this.type = \"dimension\";\n        this.value = +RegExp.$1;\n        this.units = RegExp.$2;\n        switch(this.units.toLowerCase()){\n        \n            case \"em\":\n            case \"rem\":\n            case \"ex\":\n            case \"px\":\n            case \"cm\":\n            case \"mm\":\n            case \"in\":\n            case \"pt\":\n            case \"pc\":\n            case \"ch\":\n                this.type = \"length\";\n                break;\n                \n            case \"deg\":\n            case \"rad\":\n            case \"grad\":\n                this.type = \"angle\";\n                break;\n            \n            case \"ms\":\n            case \"s\":\n                this.type = \"time\";\n                break;\n            \n            case \"hz\":\n            case \"khz\":\n                this.type = \"frequency\";\n                break;\n            \n            case \"dpi\":\n            case \"dpcm\":\n                this.type = \"resolution\";\n                break;\n                \n        }\n        \n    } else if (/^([+\\-]?[\\d\\.]+)%$/i.test(text)){  //percentage\n        this.type = \"percentage\";\n        this.value = +RegExp.$1;\n    } else if (/^([+\\-]?[\\d\\.]+)%$/i.test(text)){  //percentage\n        this.type = \"percentage\";\n        this.value = +RegExp.$1;\n    } else if (/^([+\\-]?\\d+)$/i.test(text)){  //integer\n        this.type = \"integer\";\n        this.value = +RegExp.$1;\n    } else if (/^([+\\-]?[\\d\\.]+)$/i.test(text)){  //number\n        this.type = \"number\";\n        this.value = +RegExp.$1;\n    \n    } else if (/^#([a-f0-9]{3,6})/i.test(text)){  //hexcolor\n        this.type = \"color\";\n        temp = RegExp.$1;\n        if (temp.length == 3){\n            this.red    = parseInt(temp.charAt(0)+temp.charAt(0),16);\n            this.green  = parseInt(temp.charAt(1)+temp.charAt(1),16);\n            this.blue   = parseInt(temp.charAt(2)+temp.charAt(2),16);            \n        } else {\n            this.red    = parseInt(temp.substring(0,2),16);\n            this.green  = parseInt(temp.substring(2,4),16);\n            this.blue   = parseInt(temp.substring(4,6),16);            \n        }\n    } else if (/^rgb\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)/i.test(text)){ //rgb() color with absolute numbers\n        this.type   = \"color\";\n        this.red    = +RegExp.$1;\n        this.green  = +RegExp.$2;\n        this.blue   = +RegExp.$3;\n    } else if (/^rgb\\(\\s*(\\d+)%\\s*,\\s*(\\d+)%\\s*,\\s*(\\d+)%\\s*\\)/i.test(text)){ //rgb() color with percentages\n        this.type   = \"color\";\n        this.red    = +RegExp.$1 * 255 / 100;\n        this.green  = +RegExp.$2 * 255 / 100;\n        this.blue   = +RegExp.$3 * 255 / 100;\n    } else if (/^rgba\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*([\\d\\.]+)\\s*\\)/i.test(text)){ //rgba() color with absolute numbers\n        this.type   = \"color\";\n        this.red    = +RegExp.$1;\n        this.green  = +RegExp.$2;\n        this.blue   = +RegExp.$3;\n        this.alpha  = +RegExp.$4;\n    } else if (/^rgba\\(\\s*(\\d+)%\\s*,\\s*(\\d+)%\\s*,\\s*(\\d+)%\\s*,\\s*([\\d\\.]+)\\s*\\)/i.test(text)){ //rgba() color with percentages\n        this.type   = \"color\";\n        this.red    = +RegExp.$1 * 255 / 100;\n        this.green  = +RegExp.$2 * 255 / 100;\n        this.blue   = +RegExp.$3 * 255 / 100;\n        this.alpha  = +RegExp.$4;        \n    } else if (/^hsl\\(\\s*(\\d+)\\s*,\\s*(\\d+)%\\s*,\\s*(\\d+)%\\s*\\)/i.test(text)){ //hsl()\n        this.type   = \"color\";\n        this.hue    = +RegExp.$1;\n        this.saturation = +RegExp.$2 / 100;\n        this.lightness  = +RegExp.$3 / 100;        \n    } else if (/^hsla\\(\\s*(\\d+)\\s*,\\s*(\\d+)%\\s*,\\s*(\\d+)%\\s*,\\s*([\\d\\.]+)\\s*\\)/i.test(text)){ //hsla() color with percentages\n        this.type   = \"color\";\n        this.hue    = +RegExp.$1;\n        this.saturation = +RegExp.$2 / 100;\n        this.lightness  = +RegExp.$3 / 100;        \n        this.alpha  = +RegExp.$4;        \n    } else if (/^url\\([\"']?([^\\)\"']+)[\"']?\\)/i.test(text)){ //URI\n        this.type   = \"uri\";\n        this.uri    = RegExp.$1;\n    } else if (/^([^\\(]+)\\(/i.test(text)){\n        this.type   = \"function\";\n        this.name   = RegExp.$1;\n        this.value  = text;\n    } else if (/^[\"'][^\"']*[\"']/.test(text)){    //string\n        this.type   = \"string\";\n        this.value  = eval(text);\n    } else if (Colors[text.toLowerCase()]){  //named color\n        this.type   = \"color\";\n        temp        = Colors[text.toLowerCase()].substring(1);\n        this.red    = parseInt(temp.substring(0,2),16);\n        this.green  = parseInt(temp.substring(2,4),16);\n        this.blue   = parseInt(temp.substring(4,6),16);         \n    } else if (/^[\\,\\/]$/.test(text)){\n        this.type   = \"operator\";\n        this.value  = text;\n    } else if (/^[a-z\\-\\u0080-\\uFFFF][a-z0-9\\-\\u0080-\\uFFFF]*$/i.test(text)){\n        this.type   = \"identifier\";\n        this.value  = text;\n    }\n\n}\n\nPropertyValuePart.prototype = new SyntaxUnit();\nPropertyValuePart.prototype.constructor = PropertyValuePart;\nPropertyValuePart.fromToken = function(token){\n    return new PropertyValuePart(token.value, token.startLine, token.startCol);\n};\nvar Pseudos = {\n    \":first-letter\": 1,\n    \":first-line\":   1,\n    \":before\":       1,\n    \":after\":        1\n};\n\nPseudos.ELEMENT = 1;\nPseudos.CLASS = 2;\n\nPseudos.isElement = function(pseudo){\n    return pseudo.indexOf(\"::\") === 0 || Pseudos[pseudo.toLowerCase()] == Pseudos.ELEMENT;\n};\nfunction Selector(parts, line, col){\n    \n    SyntaxUnit.call(this, parts.join(\" \"), line, col, Parser.SELECTOR_TYPE);\n    this.parts = parts;\n    this.specificity = Specificity.calculate(this);\n\n}\n\nSelector.prototype = new SyntaxUnit();\nSelector.prototype.constructor = Selector;\nfunction SelectorPart(elementName, modifiers, text, line, col){\n    \n    SyntaxUnit.call(this, text, line, col, Parser.SELECTOR_PART_TYPE);\n    this.elementName = elementName;\n    this.modifiers = modifiers;\n\n}\n\nSelectorPart.prototype = new SyntaxUnit();\nSelectorPart.prototype.constructor = SelectorPart;\nfunction SelectorSubPart(text, type, line, col){\n    \n    SyntaxUnit.call(this, text, line, col, Parser.SELECTOR_SUB_PART_TYPE);\n    this.type = type;\n    this.args = [];\n\n}\n\nSelectorSubPart.prototype = new SyntaxUnit();\nSelectorSubPart.prototype.constructor = SelectorSubPart;\nfunction Specificity(a, b, c, d){\n    this.a = a;\n    this.b = b;\n    this.c = c;\n    this.d = d;\n}\n\nSpecificity.prototype = {\n    constructor: Specificity,\n    compare: function(other){\n        var comps = [\"a\", \"b\", \"c\", \"d\"],\n            i, len;\n            \n        for (i=0, len=comps.length; i < len; i++){\n            if (this[comps[i]] < other[comps[i]]){\n                return -1;\n            } else if (this[comps[i]] > other[comps[i]]){\n                return 1;\n            }\n        }\n        \n        return 0;\n    },\n    valueOf: function(){\n        return (this.a * 1000) + (this.b * 100) + (this.c * 10) + this.d;\n    },\n    toString: function(){\n        return this.a + \",\" + this.b + \",\" + this.c + \",\" + this.d;\n    }\n\n};\nSpecificity.calculate = function(selector){\n\n    var i, len,\n        part,\n        b=0, c=0, d=0;\n        \n    function updateValues(part){\n    \n        var i, j, len, num,\n            elementName = part.elementName ? part.elementName.text : \"\",\n            modifier;\n    \n        if (elementName && elementName.charAt(elementName.length-1) != \"*\") {\n            d++;\n        }    \n    \n        for (i=0, len=part.modifiers.length; i < len; i++){\n            modifier = part.modifiers[i];\n            switch(modifier.type){\n                case \"class\":\n                case \"attribute\":\n                    c++;\n                    break;\n                    \n                case \"id\":\n                    b++;\n                    break;\n                    \n                case \"pseudo\":\n                    if (Pseudos.isElement(modifier.text)){\n                        d++;\n                    } else {\n                        c++;\n                    }                    \n                    break;\n                    \n                case \"not\":\n                    for (j=0, num=modifier.args.length; j < num; j++){\n                        updateValues(modifier.args[j]);\n                    }\n            }    \n         }\n    }\n    \n    for (i=0, len=selector.parts.length; i < len; i++){\n        part = selector.parts[i];\n        \n        if (part instanceof SelectorPart){\n            updateValues(part);                \n        }\n    }\n    \n    return new Specificity(0, b, c, d);\n};\n\nvar h = /^[0-9a-fA-F]$/,\n    nonascii = /^[\\u0080-\\uFFFF]$/,\n    nl = /\\n|\\r\\n|\\r|\\f/;\n\n\nfunction isHexDigit(c){\n    return c !== null && h.test(c);\n}\n\nfunction isDigit(c){\n    return c !== null && /\\d/.test(c);\n}\n\nfunction isWhitespace(c){\n    return c !== null && /\\s/.test(c);\n}\n\nfunction isNewLine(c){\n    return c !== null && nl.test(c);\n}\n\nfunction isNameStart(c){\n    return c !== null && (/[a-z_\\u0080-\\uFFFF\\\\]/i.test(c));\n}\n\nfunction isNameChar(c){\n    return c !== null && (isNameStart(c) || /[0-9\\-\\\\]/.test(c));\n}\n\nfunction isIdentStart(c){\n    return c !== null && (isNameStart(c) || /\\-\\\\/.test(c));\n}\n\nfunction mix(receiver, supplier){\n\tfor (var prop in supplier){\n\t\tif (supplier.hasOwnProperty(prop)){\n\t\t\treceiver[prop] = supplier[prop];\n\t\t}\n\t}\n\treturn receiver;\n}\nfunction TokenStream(input){\n\tTokenStreamBase.call(this, input, Tokens);\n}\n\nTokenStream.prototype = mix(new TokenStreamBase(), {\n    _getToken: function(channel){\n\n        var c,\n            reader = this._reader,\n            token   = null,\n            startLine   = reader.getLine(),\n            startCol    = reader.getCol();\n\n        c = reader.read();\n\n\n        while(c){\n            switch(c){\n                case \"/\":\n\n                    if(reader.peek() == \"*\"){\n                        token = this.commentToken(c, startLine, startCol);\n                    } else {\n                        token = this.charToken(c, startLine, startCol);\n                    }\n                    break;\n                case \"|\":\n                case \"~\":\n                case \"^\":\n                case \"$\":\n                case \"*\":\n                    if(reader.peek() == \"=\"){\n                        token = this.comparisonToken(c, startLine, startCol);\n                    } else {\n                        token = this.charToken(c, startLine, startCol);\n                    }\n                    break;\n                case \"\\\"\":\n                case \"'\":\n                    token = this.stringToken(c, startLine, startCol);\n                    break;\n                case \"#\":\n                    if (isNameChar(reader.peek())){\n                        token = this.hashToken(c, startLine, startCol);\n                    } else {\n                        token = this.charToken(c, startLine, startCol);\n                    }\n                    break;\n                case \".\":\n                    if (isDigit(reader.peek())){\n                        token = this.numberToken(c, startLine, startCol);\n                    } else {\n                        token = this.charToken(c, startLine, startCol);\n                    }\n                    break;\n                case \"-\":\n                    if (reader.peek() == \"-\"){  //could be closing HTML-style comment\n                        token = this.htmlCommentEndToken(c, startLine, startCol);\n                    } else if (isNameStart(reader.peek())){\n                        token = this.identOrFunctionToken(c, startLine, startCol);\n                    } else {\n                        token = this.charToken(c, startLine, startCol);\n                    }\n                    break;\n                case \"!\":\n                    token = this.importantToken(c, startLine, startCol);\n                    break;\n                case \"@\":\n                    token = this.atRuleToken(c, startLine, startCol);\n                    break;\n                case \":\":\n                    token = this.notToken(c, startLine, startCol);\n                    break;\n                case \"<\":\n                    token = this.htmlCommentStartToken(c, startLine, startCol);\n                    break;\n                case \"U\":\n                case \"u\":\n                    if (reader.peek() == \"+\"){\n                        token = this.unicodeRangeToken(c, startLine, startCol);\n                        break;\n                    }\n                default:\n                    if (isDigit(c)){\n                        token = this.numberToken(c, startLine, startCol);\n                    } else\n                    if (isWhitespace(c)){\n                        token = this.whitespaceToken(c, startLine, startCol);\n                    } else\n                    if (isIdentStart(c)){\n                        token = this.identOrFunctionToken(c, startLine, startCol);\n                    } else\n                    {\n                        token = this.charToken(c, startLine, startCol);\n                    }\n\n\n\n\n\n\n            }\n            break;\n        }\n\n        if (!token && c === null){\n            token = this.createToken(Tokens.EOF,null,startLine,startCol);\n        }\n\n        return token;\n    },\n    createToken: function(tt, value, startLine, startCol, options){\n        var reader = this._reader;\n        options = options || {};\n\n        return {\n            value:      value,\n            type:       tt,\n            channel:    options.channel,\n            hide:       options.hide || false,\n            startLine:  startLine,\n            startCol:   startCol,\n            endLine:    reader.getLine(),\n            endCol:     reader.getCol()\n        };\n    },\n    atRuleToken: function(first, startLine, startCol){\n        var rule    = first,\n            reader  = this._reader,\n            tt      = Tokens.CHAR,\n            valid   = false,\n            ident,\n            c;\n        reader.mark();\n        ident = this.readName();\n        rule = first + ident;\n        tt = Tokens.type(rule.toLowerCase());\n        if (tt == Tokens.CHAR || tt == Tokens.UNKNOWN){\n            if (rule.length > 1){\n                tt = Tokens.UNKNOWN_SYM;                \n            } else {\n                tt = Tokens.CHAR;\n                rule = first;\n                reader.reset();\n            }\n        }\n\n        return this.createToken(tt, rule, startLine, startCol);\n    },\n    charToken: function(c, startLine, startCol){\n        var tt = Tokens.type(c);\n\n        if (tt == -1){\n            tt = Tokens.CHAR;\n        }\n\n        return this.createToken(tt, c, startLine, startCol);\n    },\n    commentToken: function(first, startLine, startCol){\n        var reader  = this._reader,\n            comment = this.readComment(first);\n\n        return this.createToken(Tokens.COMMENT, comment, startLine, startCol);\n    },\n    comparisonToken: function(c, startLine, startCol){\n        var reader  = this._reader,\n            comparison  = c + reader.read(),\n            tt      = Tokens.type(comparison) || Tokens.CHAR;\n\n        return this.createToken(tt, comparison, startLine, startCol);\n    },\n    hashToken: function(first, startLine, startCol){\n        var reader  = this._reader,\n            name    = this.readName(first);\n\n        return this.createToken(Tokens.HASH, name, startLine, startCol);\n    },\n    htmlCommentStartToken: function(first, startLine, startCol){\n        var reader      = this._reader,\n            text        = first;\n\n        reader.mark();\n        text += reader.readCount(3);\n\n        if (text == \"<!--\"){\n            return this.createToken(Tokens.CDO, text, startLine, startCol);\n        } else {\n            reader.reset();\n            return this.charToken(first, startLine, startCol);\n        }\n    },\n    htmlCommentEndToken: function(first, startLine, startCol){\n        var reader      = this._reader,\n            text        = first;\n\n        reader.mark();\n        text += reader.readCount(2);\n\n        if (text == \"-->\"){\n            return this.createToken(Tokens.CDC, text, startLine, startCol);\n        } else {\n            reader.reset();\n            return this.charToken(first, startLine, startCol);\n        }\n    },\n    identOrFunctionToken: function(first, startLine, startCol){\n        var reader  = this._reader,\n            ident   = this.readName(first),\n            tt      = Tokens.IDENT;\n        if (reader.peek() == \"(\"){\n            ident += reader.read();\n            if (ident.toLowerCase() == \"url(\"){\n                tt = Tokens.URI;\n                ident = this.readURI(ident);\n                if (ident.toLowerCase() == \"url(\"){\n                    tt = Tokens.FUNCTION;\n                }\n            } else {\n                tt = Tokens.FUNCTION;\n            }\n        } else if (reader.peek() == \":\"){  //might be an IE function\n            if (ident.toLowerCase() == \"progid\"){\n                ident += reader.readTo(\"(\");\n                tt = Tokens.IE_FUNCTION;\n            }\n        }\n\n        return this.createToken(tt, ident, startLine, startCol);\n    },\n    importantToken: function(first, startLine, startCol){\n        var reader      = this._reader,\n            important   = first,\n            tt          = Tokens.CHAR,\n            temp,\n            c;\n\n        reader.mark();\n        c = reader.read();\n\n        while(c){\n            if (c == \"/\"){\n                if (reader.peek() != \"*\"){\n                    break;\n                } else {\n                    temp = this.readComment(c);\n                    if (temp === \"\"){    //broken!\n                        break;\n                    }\n                }\n            } else if (isWhitespace(c)){\n                important += c + this.readWhitespace();\n            } else if (/i/i.test(c)){\n                temp = reader.readCount(8);\n                if (/mportant/i.test(temp)){\n                    important += c + temp;\n                    tt = Tokens.IMPORTANT_SYM;\n\n                }\n                break;  //we're done\n            } else {\n                break;\n            }\n\n            c = reader.read();\n        }\n\n        if (tt == Tokens.CHAR){\n            reader.reset();\n            return this.charToken(first, startLine, startCol);\n        } else {\n            return this.createToken(tt, important, startLine, startCol);\n        }\n\n\n    },\n    notToken: function(first, startLine, startCol){\n        var reader      = this._reader,\n            text        = first;\n\n        reader.mark();\n        text += reader.readCount(4);\n\n        if (text.toLowerCase() == \":not(\"){\n            return this.createToken(Tokens.NOT, text, startLine, startCol);\n        } else {\n            reader.reset();\n            return this.charToken(first, startLine, startCol);\n        }\n    },\n    numberToken: function(first, startLine, startCol){\n        var reader  = this._reader,\n            value   = this.readNumber(first),\n            ident,\n            tt      = Tokens.NUMBER,\n            c       = reader.peek();\n\n        if (isIdentStart(c)){\n            ident = this.readName(reader.read());\n            value += ident;\n\n            if (/^em$|^ex$|^px$|^gd$|^rem$|^vw$|^vh$|^vm$|^ch$|^cm$|^mm$|^in$|^pt$|^pc$/i.test(ident)){\n                tt = Tokens.LENGTH;\n            } else if (/^deg|^rad$|^grad$/i.test(ident)){\n                tt = Tokens.ANGLE;\n            } else if (/^ms$|^s$/i.test(ident)){\n                tt = Tokens.TIME;\n            } else if (/^hz$|^khz$/i.test(ident)){\n                tt = Tokens.FREQ;\n            } else if (/^dpi$|^dpcm$/i.test(ident)){\n                tt = Tokens.RESOLUTION;\n            } else {\n                tt = Tokens.DIMENSION;\n            }\n\n        } else if (c == \"%\"){\n            value += reader.read();\n            tt = Tokens.PERCENTAGE;\n        }\n\n        return this.createToken(tt, value, startLine, startCol);\n    },\n    stringToken: function(first, startLine, startCol){\n        var delim   = first,\n            string  = first,\n            reader  = this._reader,\n            prev    = first,\n            tt      = Tokens.STRING,\n            c       = reader.read();\n\n        while(c){\n            string += c;\n            if (c == delim && prev != \"\\\\\"){\n                break;\n            }\n            if (isNewLine(reader.peek()) && c != \"\\\\\"){\n                tt = Tokens.INVALID;\n                break;\n            }\n            prev = c;\n            c = reader.read();\n        }\n        if (c === null){\n            tt = Tokens.INVALID;\n        }\n\n        return this.createToken(tt, string, startLine, startCol);\n    },\n\n    unicodeRangeToken: function(first, startLine, startCol){\n        var reader  = this._reader,\n            value   = first,\n            temp,\n            tt      = Tokens.CHAR;\n        if (reader.peek() == \"+\"){\n            reader.mark();\n            value += reader.read();\n            value += this.readUnicodeRangePart(true);\n            if (value.length == 2){\n                reader.reset();\n            } else {\n\n                tt = Tokens.UNICODE_RANGE;\n                if (value.indexOf(\"?\") == -1){\n\n                    if (reader.peek() == \"-\"){\n                        reader.mark();\n                        temp = reader.read();\n                        temp += this.readUnicodeRangePart(false);\n                        if (temp.length == 1){\n                            reader.reset();\n                        } else {\n                            value += temp;\n                        }\n                    }\n\n                }\n            }\n        }\n\n        return this.createToken(tt, value, startLine, startCol);\n    },\n    whitespaceToken: function(first, startLine, startCol){\n        var reader  = this._reader,\n            value   = first + this.readWhitespace();\n        return this.createToken(Tokens.S, value, startLine, startCol);\n    },\n\n    readUnicodeRangePart: function(allowQuestionMark){\n        var reader  = this._reader,\n            part = \"\",\n            c       = reader.peek();\n        while(isHexDigit(c) && part.length < 6){\n            reader.read();\n            part += c;\n            c = reader.peek();\n        }\n        if (allowQuestionMark){\n            while(c == \"?\" && part.length < 6){\n                reader.read();\n                part += c;\n                c = reader.peek();\n            }\n        }\n\n        return part;\n    },\n\n    readWhitespace: function(){\n        var reader  = this._reader,\n            whitespace = \"\",\n            c       = reader.peek();\n\n        while(isWhitespace(c)){\n            reader.read();\n            whitespace += c;\n            c = reader.peek();\n        }\n\n        return whitespace;\n    },\n    readNumber: function(first){\n        var reader  = this._reader,\n            number  = first,\n            hasDot  = (first == \".\"),\n            c       = reader.peek();\n\n\n        while(c){\n            if (isDigit(c)){\n                number += reader.read();\n            } else if (c == \".\"){\n                if (hasDot){\n                    break;\n                } else {\n                    hasDot = true;\n                    number += reader.read();\n                }\n            } else {\n                break;\n            }\n\n            c = reader.peek();\n        }\n\n        return number;\n    },\n    readString: function(){\n        var reader  = this._reader,\n            delim   = reader.read(),\n            string  = delim,\n            prev    = delim,\n            c       = reader.peek();\n\n        while(c){\n            c = reader.read();\n            string += c;\n            if (c == delim && prev != \"\\\\\"){\n                break;\n            }\n            if (isNewLine(reader.peek()) && c != \"\\\\\"){\n                string = \"\";\n                break;\n            }\n            prev = c;\n            c = reader.peek();\n        }\n        if (c === null){\n            string = \"\";\n        }\n\n        return string;\n    },\n    readURI: function(first){\n        var reader  = this._reader,\n            uri     = first,\n            inner   = \"\",\n            c       = reader.peek();\n\n        reader.mark();\n        while(c && isWhitespace(c)){\n            reader.read();\n            c = reader.peek();\n        }\n        if (c == \"'\" || c == \"\\\"\"){\n            inner = this.readString();\n        } else {\n            inner = this.readURL();\n        }\n\n        c = reader.peek();\n        while(c && isWhitespace(c)){\n            reader.read();\n            c = reader.peek();\n        }\n        if (inner === \"\" || c != \")\"){\n            uri = first;\n            reader.reset();\n        } else {\n            uri += inner + reader.read();\n        }\n\n        return uri;\n    },\n    readURL: function(){\n        var reader  = this._reader,\n            url     = \"\",\n            c       = reader.peek();\n        while (/^[!#$%&\\\\*-~]$/.test(c)){\n            url += reader.read();\n            c = reader.peek();\n        }\n\n        return url;\n\n    },\n    readName: function(first){\n        var reader  = this._reader,\n            ident   = first || \"\",\n            c       = reader.peek();\n\n        while(true){\n            if (c == \"\\\\\"){\n                ident += this.readEscape(reader.read());\n                c = reader.peek();\n            } else if(c && isNameChar(c)){\n                ident += reader.read();\n                c = reader.peek();\n            } else {\n                break;\n            }\n        }\n\n        return ident;\n    },\n    \n    readEscape: function(first){\n        var reader  = this._reader,\n            cssEscape = first || \"\",\n            i       = 0,\n            c       = reader.peek();    \n    \n        if (isHexDigit(c)){\n            do {\n                cssEscape += reader.read();\n                c = reader.peek();\n            } while(c && isHexDigit(c) && ++i < 6);\n        }\n        \n        if (cssEscape.length == 3 && /\\s/.test(c) ||\n            cssEscape.length == 7 || cssEscape.length == 1){\n                reader.read();\n        } else {\n            c = \"\";\n        }\n        \n        return cssEscape + c;\n    },\n    \n    readComment: function(first){\n        var reader  = this._reader,\n            comment = first || \"\",\n            c       = reader.read();\n\n        if (c == \"*\"){\n            while(c){\n                comment += c;\n                if (comment.length > 2 && c == \"*\" && reader.peek() == \"/\"){\n                    comment += reader.read();\n                    break;\n                }\n\n                c = reader.read();\n            }\n\n            return comment;\n        } else {\n            return \"\";\n        }\n\n    }\n});\n\n\nvar Tokens  = [\n    { name: \"CDO\"},\n    { name: \"CDC\"},\n    { name: \"S\", whitespace: true/*, channel: \"ws\"*/},\n    { name: \"COMMENT\", comment: true, hide: true, channel: \"comment\" },\n    { name: \"INCLUDES\", text: \"~=\"},\n    { name: \"DASHMATCH\", text: \"|=\"},\n    { name: \"PREFIXMATCH\", text: \"^=\"},\n    { name: \"SUFFIXMATCH\", text: \"$=\"},\n    { name: \"SUBSTRINGMATCH\", text: \"*=\"},\n    { name: \"STRING\"},     \n    { name: \"IDENT\"},\n    { name: \"HASH\"},\n    { name: \"IMPORT_SYM\", text: \"@import\"},\n    { name: \"PAGE_SYM\", text: \"@page\"},\n    { name: \"MEDIA_SYM\", text: \"@media\"},\n    { name: \"FONT_FACE_SYM\", text: \"@font-face\"},\n    { name: \"CHARSET_SYM\", text: \"@charset\"},\n    { name: \"NAMESPACE_SYM\", text: \"@namespace\"},\n    { name: \"UNKNOWN_SYM\" },\n    { name: \"KEYFRAMES_SYM\", text: [ \"@keyframes\", \"@-webkit-keyframes\", \"@-moz-keyframes\", \"@-o-keyframes\" ] },\n    { name: \"IMPORTANT_SYM\"},\n    { name: \"LENGTH\"},\n    { name: \"ANGLE\"},\n    { name: \"TIME\"},\n    { name: \"FREQ\"},\n    { name: \"DIMENSION\"},\n    { name: \"PERCENTAGE\"},\n    { name: \"NUMBER\"},\n    { name: \"URI\"},\n    { name: \"FUNCTION\"},\n    { name: \"UNICODE_RANGE\"},    \n    { name: \"INVALID\"},\n    { name: \"PLUS\", text: \"+\" },\n    { name: \"GREATER\", text: \">\"},\n    { name: \"COMMA\", text: \",\"},\n    { name: \"TILDE\", text: \"~\"},\n    { name: \"NOT\"},        \n    { name: \"TOPLEFTCORNER_SYM\", text: \"@top-left-corner\"},\n    { name: \"TOPLEFT_SYM\", text: \"@top-left\"},\n    { name: \"TOPCENTER_SYM\", text: \"@top-center\"},\n    { name: \"TOPRIGHT_SYM\", text: \"@top-right\"},\n    { name: \"TOPRIGHTCORNER_SYM\", text: \"@top-right-corner\"},\n    { name: \"BOTTOMLEFTCORNER_SYM\", text: \"@bottom-left-corner\"},\n    { name: \"BOTTOMLEFT_SYM\", text: \"@bottom-left\"},\n    { name: \"BOTTOMCENTER_SYM\", text: \"@bottom-center\"},\n    { name: \"BOTTOMRIGHT_SYM\", text: \"@bottom-right\"},\n    { name: \"BOTTOMRIGHTCORNER_SYM\", text: \"@bottom-right-corner\"},\n    { name: \"LEFTTOP_SYM\", text: \"@left-top\"},\n    { name: \"LEFTMIDDLE_SYM\", text: \"@left-middle\"},\n    { name: \"LEFTBOTTOM_SYM\", text: \"@left-bottom\"},\n    { name: \"RIGHTTOP_SYM\", text: \"@right-top\"},\n    { name: \"RIGHTMIDDLE_SYM\", text: \"@right-middle\"},\n    { name: \"RIGHTBOTTOM_SYM\", text: \"@right-bottom\"},\n    { name: \"RESOLUTION\", state: \"media\"},\n    { name: \"IE_FUNCTION\" },\n    { name: \"CHAR\" },\n    {\n        name: \"PIPE\",\n        text: \"|\"\n    },\n    {\n        name: \"SLASH\",\n        text: \"/\"\n    },\n    {\n        name: \"MINUS\",\n        text: \"-\"\n    },\n    {\n        name: \"STAR\",\n        text: \"*\"\n    },\n\n    {\n        name: \"LBRACE\",\n        text: \"{\"\n    },   \n    {\n        name: \"RBRACE\",\n        text: \"}\"\n    },      \n    {\n        name: \"LBRACKET\",\n        text: \"[\"\n    },   \n    {\n        name: \"RBRACKET\",\n        text: \"]\"\n    },    \n    {\n        name: \"EQUALS\",\n        text: \"=\"\n    },\n    {\n        name: \"COLON\",\n        text: \":\"\n    },    \n    {\n        name: \"SEMICOLON\",\n        text: \";\"\n    },    \n \n    {\n        name: \"LPAREN\",\n        text: \"(\"\n    },   \n    {\n        name: \"RPAREN\",\n        text: \")\"\n    },     \n    {\n        name: \"DOT\",\n        text: \".\"\n    }\n];\n\n(function(){\n\n    var nameMap = [],\n        typeMap = {};\n    \n    Tokens.UNKNOWN = -1;\n    Tokens.unshift({name:\"EOF\"});\n    for (var i=0, len = Tokens.length; i < len; i++){\n        nameMap.push(Tokens[i].name);\n        Tokens[Tokens[i].name] = i;\n        if (Tokens[i].text){\n            if (Tokens[i].text instanceof Array){\n                for (var j=0; j < Tokens[i].text.length; j++){\n                    typeMap[Tokens[i].text[j]] = i;\n                }\n            } else {\n                typeMap[Tokens[i].text] = i;\n            }\n        }\n    }\n    \n    Tokens.name = function(tt){\n        return nameMap[tt];\n    };\n    \n    Tokens.type = function(c){\n        return typeMap[c] || -1;\n    };\n\n})();\nvar Validation = {\n\n    validate: function(property, value){\n        var name        = property.toString().toLowerCase(),\n            parts       = value.parts,\n            expression  = new PropertyValueIterator(value),\n            spec        = Properties[name],\n            part,\n            valid,            \n            j, count,\n            msg,\n            types,\n            last,\n            literals,\n            max, multi, group;\n            \n        if (!spec) {\n            if (name.indexOf(\"-\") !== 0){    //vendor prefixed are ok\n                throw new ValidationError(\"Unknown property '\" + property + \"'.\", property.line, property.col);\n            }\n        } else if (typeof spec != \"number\"){\n            if (typeof spec == \"string\"){\n                if (spec.indexOf(\"||\") > -1) {\n                    this.groupProperty(spec, expression);\n                } else {\n                    this.singleProperty(spec, expression, 1);\n                }\n\n            } else if (spec.multi) {\n                this.multiProperty(spec.multi, expression, spec.comma, spec.max || Infinity);\n            } else if (typeof spec == \"function\") {\n                spec(expression);\n            }\n\n        }\n\n    },\n    \n    singleProperty: function(types, expression, max, partial) {\n\n        var result      = false,\n            value       = expression.value,\n            count       = 0,\n            part;\n         \n        while (expression.hasNext() && count < max) {\n            result = ValidationTypes.isAny(expression, types);\n            if (!result) {\n                break;\n            }\n            count++;\n        }\n        \n        if (!result) {\n            if (expression.hasNext() && !expression.isFirst()) {\n                part = expression.peek();\n                throw new ValidationError(\"Expected end of value but found '\" + part + \"'.\", part.line, part.col);\n            } else {\n                 throw new ValidationError(\"Expected (\" + types + \") but found '\" + value + \"'.\", value.line, value.col);\n            }        \n        } else if (expression.hasNext()) {\n            part = expression.next();\n            throw new ValidationError(\"Expected end of value but found '\" + part + \"'.\", part.line, part.col);\n        }          \n                 \n    },    \n    \n    multiProperty: function (types, expression, comma, max) {\n\n        var result      = false,\n            value       = expression.value,\n            count       = 0,\n            sep         = false,\n            part;\n            \n        while(expression.hasNext() && !result && count < max) {\n            if (ValidationTypes.isAny(expression, types)) {\n                count++;\n                if (!expression.hasNext()) {\n                    result = true;\n\n                } else if (comma) {\n                    if (expression.peek() == \",\") {\n                        part = expression.next();\n                    } else {\n                        break;\n                    }\n                }\n            } else {\n                break;\n\n            }\n        }\n        \n        if (!result) {\n            if (expression.hasNext() && !expression.isFirst()) {\n                part = expression.peek();\n                throw new ValidationError(\"Expected end of value but found '\" + part + \"'.\", part.line, part.col);\n            } else {\n                part = expression.previous();\n                if (comma && part == \",\") {\n                    throw new ValidationError(\"Expected end of value but found '\" + part + \"'.\", part.line, part.col); \n                } else {\n                    throw new ValidationError(\"Expected (\" + types + \") but found '\" + value + \"'.\", value.line, value.col);\n                }\n            }\n        \n        } else if (expression.hasNext()) {\n            part = expression.next();\n            throw new ValidationError(\"Expected end of value but found '\" + part + \"'.\", part.line, part.col);\n        }  \n\n    },\n    \n    groupProperty: function (types, expression, comma) {\n\n        var result      = false,\n            value       = expression.value,\n            typeCount   = types.split(\"||\").length,\n            groups      = { count: 0 },\n            partial     = false,\n            name,\n            part;\n            \n        while(expression.hasNext() && !result) {\n            name = ValidationTypes.isAnyOfGroup(expression, types);\n            if (name) {\n                if (groups[name]) {\n                    break;\n                } else {\n                    groups[name] = 1;\n                    groups.count++;\n                    partial = true;\n                    \n                    if (groups.count == typeCount || !expression.hasNext()) {\n                        result = true;\n                    }\n                }\n            } else {\n                break;\n            }\n        }\n        \n        if (!result) {        \n            if (partial && expression.hasNext()) {\n                    part = expression.peek();\n                    throw new ValidationError(\"Expected end of value but found '\" + part + \"'.\", part.line, part.col);\n            } else {\n                throw new ValidationError(\"Expected (\" + types + \") but found '\" + value + \"'.\", value.line, value.col);\n            }\n        } else if (expression.hasNext()) {\n            part = expression.next();\n            throw new ValidationError(\"Expected end of value but found '\" + part + \"'.\", part.line, part.col);\n        }           \n    }\n\n    \n\n};\nfunction ValidationError(message, line, col){\n    this.col = col;\n    this.line = line;\n    this.message = message;\n\n}\nValidationError.prototype = new Error();\nvar ValidationTypes = {\n\n    isLiteral: function (part, literals) {\n        var text = part.text.toString().toLowerCase(),\n            args = literals.split(\" | \"),\n            i, len, found = false;\n        \n        for (i=0,len=args.length; i < len && !found; i++){\n            if (text == args[i].toLowerCase()){\n                found = true;\n            }\n        }\n        \n        return found;    \n    },\n    \n    isSimple: function(type) {\n        return !!this.simple[type];\n    },\n    \n    isComplex: function(type) {\n        return !!this.complex[type];\n    },\n    isAny: function (expression, types) {\n        var args = types.split(\" | \"),\n            i, len, found = false;\n        \n        for (i=0,len=args.length; i < len && !found && expression.hasNext(); i++){\n            found = this.isType(expression, args[i]);\n        }\n        \n        return found;    \n    },\n    isAnyOfGroup: function(expression, types) {\n        var args = types.split(\" || \"),\n            i, len, found = false;\n        \n        for (i=0,len=args.length; i < len && !found; i++){\n            found = this.isType(expression, args[i]);\n        }\n        \n        return found ? args[i-1] : false;\n    },\n    isType: function (expression, type) {\n        var part = expression.peek(),\n            result = false;\n            \n        if (type.charAt(0) != \"<\") {\n            result = this.isLiteral(part, type);\n            if (result) {\n                expression.next();\n            }\n        } else if (this.simple[type]) {\n            result = this.simple[type](part);\n            if (result) {\n                expression.next();\n            }\n        } else {\n            result = this.complex[type](expression);\n        }\n        \n        return result;\n    },\n    \n    \n    \n    simple: {\n\n        \"<absolute-size>\": function(part){\n            return ValidationTypes.isLiteral(part, \"xx-small | x-small | small | medium | large | x-large | xx-large\");\n        },\n        \n        \"<attachment>\": function(part){\n            return ValidationTypes.isLiteral(part, \"scroll | fixed | local\");\n        },\n        \n        \"<attr>\": function(part){\n            return part.type == \"function\" && part.name == \"attr\";\n        },\n                \n        \"<bg-image>\": function(part){\n            return this[\"<image>\"](part) || this[\"<gradient>\"](part) ||  part == \"none\";\n        },        \n        \n        \"<gradient>\": function(part) {\n            return part.type == \"function\" && /^(?:\\-(?:ms|moz|o|webkit)\\-)?(?:repeating\\-)?(?:radial\\-|linear\\-)?gradient/i.test(part);\n        },\n        \n        \"<box>\": function(part){\n            return ValidationTypes.isLiteral(part, \"padding-box | border-box | content-box\");\n        },\n        \n        \"<content>\": function(part){\n            return part.type == \"function\" && part.name == \"content\";\n        },        \n        \n        \"<relative-size>\": function(part){\n            return ValidationTypes.isLiteral(part, \"smaller | larger\");\n        },\n        \"<ident>\": function(part){\n            return part.type == \"identifier\";\n        },\n        \n        \"<length>\": function(part){\n            if (part.type == \"function\" && /^(?:\\-(?:ms|moz|o|webkit)\\-)?calc/i.test(part)){\n                return true;\n            }else{\n                return part.type == \"length\" || part.type == \"number\" || part.type == \"integer\" || part == \"0\";\n            }\n        },\n        \n        \"<color>\": function(part){\n            return part.type == \"color\" || part == \"transparent\";\n        },\n        \n        \"<number>\": function(part){\n            return part.type == \"number\" || this[\"<integer>\"](part);\n        },\n        \n        \"<integer>\": function(part){\n            return part.type == \"integer\";\n        },\n        \n        \"<line>\": function(part){\n            return part.type == \"integer\";\n        },\n        \n        \"<angle>\": function(part){\n            return part.type == \"angle\";\n        },        \n        \n        \"<uri>\": function(part){\n            return part.type == \"uri\";\n        },\n        \n        \"<image>\": function(part){\n            return this[\"<uri>\"](part);\n        },\n        \n        \"<percentage>\": function(part){\n            return part.type == \"percentage\" || part == \"0\";\n        },\n\n        \"<border-width>\": function(part){\n            return this[\"<length>\"](part) || ValidationTypes.isLiteral(part, \"thin | medium | thick\");\n        },\n        \n        \"<border-style>\": function(part){\n            return ValidationTypes.isLiteral(part, \"none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset\");\n        },\n        \n        \"<margin-width>\": function(part){\n            return this[\"<length>\"](part) || this[\"<percentage>\"](part) || ValidationTypes.isLiteral(part, \"auto\");\n        },\n        \n        \"<padding-width>\": function(part){\n            return this[\"<length>\"](part) || this[\"<percentage>\"](part);\n        },\n        \n        \"<shape>\": function(part){\n            return part.type == \"function\" && (part.name == \"rect\" || part.name == \"inset-rect\");\n        },\n        \n        \"<time>\": function(part) {\n            return part.type == \"time\";\n        }\n    },\n    \n    complex: {\n\n        \"<bg-position>\": function(expression){\n            var types   = this,\n                result  = false,\n                numeric = \"<percentage> | <length>\",\n                xDir    = \"left | right\",\n                yDir    = \"top | bottom\",\n                count = 0,\n                hasNext = function() {\n                    return expression.hasNext() && expression.peek() != \",\";\n                };\n\n            while (expression.peek(count) && expression.peek(count) != \",\") {\n                count++;\n            }\n\n            if (count < 3) {\n                if (ValidationTypes.isAny(expression, xDir + \" | center | \" + numeric)) {\n                        result = true;\n                        ValidationTypes.isAny(expression, yDir + \" | center | \" + numeric);\n                } else if (ValidationTypes.isAny(expression, yDir)) {\n                        result = true;\n                        ValidationTypes.isAny(expression, xDir + \" | center\");\n                }\n            } else {\n                if (ValidationTypes.isAny(expression, xDir)) {\n                    if (ValidationTypes.isAny(expression, yDir)) {\n                        result = true;\n                        ValidationTypes.isAny(expression, numeric);\n                    } else if (ValidationTypes.isAny(expression, numeric)) {\n                        if (ValidationTypes.isAny(expression, yDir)) {\n                            result = true;\n                            ValidationTypes.isAny(expression, numeric);\n                        } else if (ValidationTypes.isAny(expression, \"center\")) {\n                            result = true;\n                        }\n                    }\n                } else if (ValidationTypes.isAny(expression, yDir)) {\n                    if (ValidationTypes.isAny(expression, xDir)) {\n                        result = true;\n                        ValidationTypes.isAny(expression, numeric);\n                    } else if (ValidationTypes.isAny(expression, numeric)) {\n                        if (ValidationTypes.isAny(expression, xDir)) {\n                                result = true;\n                                ValidationTypes.isAny(expression, numeric);\n                        } else if (ValidationTypes.isAny(expression, \"center\")) {\n                            result = true;\n                        }\n                    }\n                } else if (ValidationTypes.isAny(expression, \"center\")) {\n                    if (ValidationTypes.isAny(expression, xDir + \" | \" + yDir)) {\n                        result = true;\n                        ValidationTypes.isAny(expression, numeric);\n                    }\n                }\n            }\n            \n            return result;\n        },\n\n        \"<bg-size>\": function(expression){\n            var types   = this,\n                result  = false,\n                numeric = \"<percentage> | <length> | auto\",\n                part,\n                i, len;      \n      \n            if (ValidationTypes.isAny(expression, \"cover | contain\")) {\n                result = true;\n            } else if (ValidationTypes.isAny(expression, numeric)) {\n                result = true;                \n                ValidationTypes.isAny(expression, numeric);\n            }\n            \n            return result;\n        },\n        \n        \"<repeat-style>\": function(expression){\n            var result  = false,\n                values  = \"repeat | space | round | no-repeat\",\n                part;\n            \n            if (expression.hasNext()){\n                part = expression.next();\n                \n                if (ValidationTypes.isLiteral(part, \"repeat-x | repeat-y\")) {\n                    result = true;                    \n                } else if (ValidationTypes.isLiteral(part, values)) {\n                    result = true;\n\n                    if (expression.hasNext() && ValidationTypes.isLiteral(expression.peek(), values)) {\n                        expression.next();\n                    }\n                }\n            }\n            \n            return result;\n            \n        },\n        \n        \"<shadow>\": function(expression) {\n            var result  = false,\n                count   = 0,\n                inset   = false,\n                color   = false,\n                part;\n                \n            if (expression.hasNext()) {            \n                \n                if (ValidationTypes.isAny(expression, \"inset\")){\n                    inset = true;\n                }\n                \n                if (ValidationTypes.isAny(expression, \"<color>\")) {\n                    color = true;\n                }                \n                \n                while (ValidationTypes.isAny(expression, \"<length>\") && count < 4) {\n                    count++;\n                }\n                \n                \n                if (expression.hasNext()) {\n                    if (!color) {\n                        ValidationTypes.isAny(expression, \"<color>\");\n                    }\n                    \n                    if (!inset) {\n                        ValidationTypes.isAny(expression, \"inset\");\n                    }\n\n                }\n                \n                result = (count >= 2 && count <= 4);\n            \n            }\n            \n            return result;\n        },\n        \n        \"<x-one-radius>\": function(expression) {\n            var result  = false,\n                count   = 0,\n                numeric = \"<length> | <percentage>\",\n                part;\n                \n            if (ValidationTypes.isAny(expression, numeric)){\n                result = true;\n                \n                ValidationTypes.isAny(expression, numeric);\n            }                \n            \n            return result;\n        }\n    }\n};\n\n\n\nparserlib.css = {\nColors              :Colors,\nCombinator          :Combinator,\nParser              :Parser,\nPropertyName        :PropertyName,\nPropertyValue       :PropertyValue,\nPropertyValuePart   :PropertyValuePart,\nMediaFeature        :MediaFeature,\nMediaQuery          :MediaQuery,\nSelector            :Selector,\nSelectorPart        :SelectorPart,\nSelectorSubPart     :SelectorSubPart,\nSpecificity         :Specificity,\nTokenStream         :TokenStream,\nTokens              :Tokens,\nValidationError     :ValidationError\n};\n})();\nvar CSSLint = (function(){\n\n    var rules           = [],\n        formatters      = [],\n        embeddedRuleset = /\\/\\*csslint([^\\*]*)\\*\\//,\n        api             = new parserlib.util.EventTarget();\n\n    api.version = \"0.9.10\";\n    api.addRule = function(rule){\n        rules.push(rule);\n        rules[rule.id] = rule;\n    };\n    api.clearRules = function(){\n        rules = [];\n    };\n    api.getRules = function(){\n        return [].concat(rules).sort(function(a,b){\n            return a.id > b.id ? 1 : 0;\n        });\n    };\n    api.getRuleset = function() {\n        var ruleset = {},\n            i = 0,\n            len = rules.length;\n\n        while (i < len){\n            ruleset[rules[i++].id] = 1;    //by default, everything is a warning\n        }\n\n        return ruleset;\n    };\n    function applyEmbeddedRuleset(text, ruleset){\n        var valueMap,\n            embedded = text && text.match(embeddedRuleset),\n            rules = embedded && embedded[1];\n\n        if (rules) {\n            valueMap = {\n                \"true\": 2,  // true is error\n                \"\": 1,      // blank is warning\n                \"false\": 0, // false is ignore\n\n                \"2\": 2,     // explicit error\n                \"1\": 1,     // explicit warning\n                \"0\": 0      // explicit ignore\n            };\n\n            rules.toLowerCase().split(\",\").forEach(function(rule){\n                var pair = rule.split(\":\"),\n                    property = pair[0] || \"\",\n                    value = pair[1] || \"\";\n\n                ruleset[property.trim()] = valueMap[value.trim()];\n            });\n        }\n\n        return ruleset;\n    }\n    api.addFormatter = function(formatter) {\n        formatters[formatter.id] = formatter;\n    };\n    api.getFormatter = function(formatId){\n        return formatters[formatId];\n    };\n    api.format = function(results, filename, formatId, options) {\n        var formatter = this.getFormatter(formatId),\n            result = null;\n\n        if (formatter){\n            result = formatter.startFormat();\n            result += formatter.formatResults(results, filename, options || {});\n            result += formatter.endFormat();\n        }\n\n        return result;\n    };\n    api.hasFormat = function(formatId){\n        return formatters.hasOwnProperty(formatId);\n    };\n    api.verify = function(text, ruleset){\n\n        var i       = 0,\n            len     = rules.length,\n            reporter,\n            lines,\n            report,\n            parser = new parserlib.css.Parser({ starHack: true, ieFilters: true,\n                                                underscoreHack: true, strict: false });\n        lines = text.replace(/\\n\\r?/g, \"$split$\").split('$split;
var blob = new Blob([workerSrc]);
var blobUrl = window.URL.createObjectURL(blob);

this.$worker = new Worker(blobUrl);
);\n\n        if (!ruleset){\n            ruleset = this.getRuleset();\n        }\n\n        if (embeddedRuleset.test(text)){\n            ruleset = applyEmbeddedRuleset(text, ruleset);\n        }\n\n        reporter = new Reporter(lines, ruleset);\n\n        ruleset.errors = 2;       //always report parsing errors as errors\n        for (i in ruleset){\n            if(ruleset.hasOwnProperty(i) && ruleset[i]){\n                if (rules[i]){\n                    rules[i].init(parser, reporter);\n                }\n            }\n        }\n        try {\n            parser.parse(text);\n        } catch (ex) {\n            reporter.error(\"Fatal error, cannot continue: \" + ex.message, ex.line, ex.col, {});\n        }\n\n        report = {\n            messages    : reporter.messages,\n            stats       : reporter.stats,\n            ruleset     : reporter.ruleset\n        };\n        report.messages.sort(function (a, b){\n            if (a.rollup && !b.rollup){\n                return 1;\n            } else if (!a.rollup && b.rollup){\n                return -1;\n            } else {\n                return a.line - b.line;\n            }\n        });\n\n        return report;\n    };\n\n    return api;\n\n})();\nfunction Reporter(lines, ruleset){\n    this.messages = [];\n    this.stats = [];\n    this.lines = lines;\n    this.ruleset = ruleset;\n}\n\nReporter.prototype = {\n    constructor: Reporter,\n    error: function(message, line, col, rule){\n        this.messages.push({\n            type    : \"error\",\n            line    : line,\n            col     : col,\n            message : message,\n            evidence: this.lines[line-1],\n            rule    : rule || {}\n        });\n    },\n    warn: function(message, line, col, rule){\n        this.report(message, line, col, rule);\n    },\n    report: function(message, line, col, rule){\n        this.messages.push({\n            type    : this.ruleset[rule.id] == 2 ? \"error\" : \"warning\",\n            line    : line,\n            col     : col,\n            message : message,\n            evidence: this.lines[line-1],\n            rule    : rule\n        });\n    },\n    info: function(message, line, col, rule){\n        this.messages.push({\n            type    : \"info\",\n            line    : line,\n            col     : col,\n            message : message,\n            evidence: this.lines[line-1],\n            rule    : rule\n        });\n    },\n    rollupError: function(message, rule){\n        this.messages.push({\n            type    : \"error\",\n            rollup  : true,\n            message : message,\n            rule    : rule\n        });\n    },\n    rollupWarn: function(message, rule){\n        this.messages.push({\n            type    : \"warning\",\n            rollup  : true,\n            message : message,\n            rule    : rule\n        });\n    },\n    stat: function(name, value){\n        this.stats[name] = value;\n    }\n};\nCSSLint._Reporter = Reporter;\nCSSLint.Util = {\n    mix: function(receiver, supplier){\n        var prop;\n\n        for (prop in supplier){\n            if (supplier.hasOwnProperty(prop)){\n                receiver[prop] = supplier[prop];\n            }\n        }\n\n        return prop;\n    },\n    indexOf: function(values, value){\n        if (values.indexOf){\n            return values.indexOf(value);\n        } else {\n            for (var i=0, len=values.length; i < len; i++){\n                if (values[i] === value){\n                    return i;\n                }\n            }\n            return -1;\n        }\n    },\n    forEach: function(values, func) {\n        if (values.forEach){\n            return values.forEach(func);\n        } else {\n            for (var i=0, len=values.length; i < len; i++){\n                func(values[i], i, values);\n            }\n        }\n    }\n};\nCSSLint.addRule({\n    id: \"adjoining-classes\",\n    name: \"Disallow adjoining classes\",\n    desc: \"Don't use adjoining classes.\",\n    browsers: \"IE6\",\n    init: function(parser, reporter){\n        var rule = this;\n        parser.addListener(\"startrule\", function(event){\n            var selectors = event.selectors,\n                selector,\n                part,\n                modifier,\n                classCount,\n                i, j, k;\n\n            for (i=0; i < selectors.length; i++){\n                selector = selectors[i];\n                for (j=0; j < selector.parts.length; j++){\n                    part = selector.parts[j];\n                    if (part.type == parser.SELECTOR_PART_TYPE){\n                        classCount = 0;\n                        for (k=0; k < part.modifiers.length; k++){\n                            modifier = part.modifiers[k];\n                            if (modifier.type == \"class\"){\n                                classCount++;\n                            }\n                            if (classCount > 1){\n                                reporter.report(\"Don't use adjoining classes.\", part.line, part.col, rule);\n                            }\n                        }\n                    }\n                }\n            }\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"box-model\",\n    name: \"Beware of broken box size\",\n    desc: \"Don't use width or height when using padding or border.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            widthProperties = {\n                border: 1,\n                \"border-left\": 1,\n                \"border-right\": 1,\n                padding: 1,\n                \"padding-left\": 1,\n                \"padding-right\": 1\n            },\n            heightProperties = {\n                border: 1,\n                \"border-bottom\": 1,\n                \"border-top\": 1,\n                padding: 1,\n                \"padding-bottom\": 1,\n                \"padding-top\": 1\n            },\n            properties,\n            boxSizing = false;\n\n        function startRule(){\n            properties = {};\n            boxSizing = false;\n        }\n\n        function endRule(){\n            var prop, value;\n            \n            if (!boxSizing) {\n                if (properties.height){\n                    for (prop in heightProperties){\n                        if (heightProperties.hasOwnProperty(prop) && properties[prop]){\n                            value = properties[prop].value;\n                            if (!(prop == \"padding\" && value.parts.length === 2 && value.parts[0].value === 0)){\n                                reporter.report(\"Using height with \" + prop + \" can sometimes make elements larger than you expect.\", properties[prop].line, properties[prop].col, rule);\n                            }\n                        }\n                    }\n                }\n\n                if (properties.width){\n                    for (prop in widthProperties){\n                        if (widthProperties.hasOwnProperty(prop) && properties[prop]){\n                            value = properties[prop].value;\n                            \n                            if (!(prop == \"padding\" && value.parts.length === 2 && value.parts[1].value === 0)){\n                                reporter.report(\"Using width with \" + prop + \" can sometimes make elements larger than you expect.\", properties[prop].line, properties[prop].col, rule);\n                            }\n                        }\n                    }\n                }   \n            }     \n        }\n\n        parser.addListener(\"startrule\", startRule);\n        parser.addListener(\"startfontface\", startRule);\n        parser.addListener(\"startpage\", startRule);\n        parser.addListener(\"startpagemargin\", startRule);\n        parser.addListener(\"startkeyframerule\", startRule); \n\n        parser.addListener(\"property\", function(event){\n            var name = event.property.text.toLowerCase();\n            \n            if (heightProperties[name] || widthProperties[name]){\n                if (!/^0\\S*$/.test(event.value) && !(name == \"border\" && event.value == \"none\")){\n                    properties[name] = { line: event.property.line, col: event.property.col, value: event.value };\n                }\n            } else {\n                if (/^(width|height)/i.test(name) && /^(length|percentage)/.test(event.value.parts[0].type)){\n                    properties[name] = 1;\n                } else if (name == \"box-sizing\") {\n                    boxSizing = true;\n                }\n            }\n            \n        });\n\n        parser.addListener(\"endrule\", endRule);\n        parser.addListener(\"endfontface\", endRule);\n        parser.addListener(\"endpage\", endRule);\n        parser.addListener(\"endpagemargin\", endRule);\n        parser.addListener(\"endkeyframerule\", endRule);         \n    }\n\n});\nCSSLint.addRule({\n    id: \"box-sizing\",\n    name: \"Disallow use of box-sizing\",\n    desc: \"The box-sizing properties isn't supported in IE6 and IE7.\",\n    browsers: \"IE6, IE7\",\n    tags: [\"Compatibility\"],\n    init: function(parser, reporter){\n        var rule = this;\n\n        parser.addListener(\"property\", function(event){\n            var name = event.property.text.toLowerCase();\n   \n            if (name == \"box-sizing\"){\n                reporter.report(\"The box-sizing property isn't supported in IE6 and IE7.\", event.line, event.col, rule);\n            }\n        });       \n    }\n\n});\nCSSLint.addRule({\n    id: \"bulletproof-font-face\",\n    name: \"Use the bulletproof @font-face syntax\",\n    desc: \"Use the bulletproof @font-face syntax to avoid 404's in old IE (http://www.fontspring.com/blog/the-new-bulletproof-font-face-syntax).\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            count = 0,\n            fontFaceRule = false,\n            firstSrc     = true,\n            ruleFailed    = false,\n            line, col;\n        parser.addListener(\"startfontface\", function(event){\n            fontFaceRule = true;\n        });\n\n        parser.addListener(\"property\", function(event){\n            if (!fontFaceRule) {\n                return;\n            }\n\n            var propertyName = event.property.toString().toLowerCase(),\n                value        = event.value.toString();\n            line = event.line;\n            col  = event.col;\n            if (propertyName === 'src') {\n                var regex = /^\\s?url\\(['\"].+\\.eot\\?.*['\"]\\)\\s*format\\(['\"]embedded-opentype['\"]\\).*$/i;\n                if (!value.match(regex) && firstSrc) {\n                    ruleFailed = true;\n                    firstSrc = false;\n                } else if (value.match(regex) && !firstSrc) {\n                    ruleFailed = false;\n                }\n            }\n\n\n        });\n        parser.addListener(\"endfontface\", function(event){\n            fontFaceRule = false;\n\n            if (ruleFailed) {\n                reporter.report(\"@font-face declaration doesn't follow the fontspring bulletproof syntax.\", line, col, rule);\n            }\n        });\n    }\n}); \nCSSLint.addRule({\n    id: \"compatible-vendor-prefixes\",\n    name: \"Require compatible vendor prefixes\",\n    desc: \"Include all compatible vendor prefixes to reach a wider range of users.\",\n    browsers: \"All\",\n    init: function (parser, reporter) {\n        var rule = this,\n            compatiblePrefixes,\n            properties,\n            prop,\n            variations,\n            prefixed,\n            i,\n            len,\n            inKeyFrame = false,\n            arrayPush = Array.prototype.push,\n            applyTo = [];\n        compatiblePrefixes = {\n            \"animation\"                  : \"webkit moz\",\n            \"animation-delay\"            : \"webkit moz\",\n            \"animation-direction\"        : \"webkit moz\",\n            \"animation-duration\"         : \"webkit moz\",\n            \"animation-fill-mode\"        : \"webkit moz\",\n            \"animation-iteration-count\"  : \"webkit moz\",\n            \"animation-name\"             : \"webkit moz\",\n            \"animation-play-state\"       : \"webkit moz\",\n            \"animation-timing-function\"  : \"webkit moz\",\n            \"appearance\"                 : \"webkit moz\",\n            \"border-end\"                 : \"webkit moz\",\n            \"border-end-color\"           : \"webkit moz\",\n            \"border-end-style\"           : \"webkit moz\",\n            \"border-end-width\"           : \"webkit moz\",\n            \"border-image\"               : \"webkit moz o\",\n            \"border-radius\"              : \"webkit\",\n            \"border-start\"               : \"webkit moz\",\n            \"border-start-color\"         : \"webkit moz\",\n            \"border-start-style\"         : \"webkit moz\",\n            \"border-start-width\"         : \"webkit moz\",\n            \"box-align\"                  : \"webkit moz ms\",\n            \"box-direction\"              : \"webkit moz ms\",\n            \"box-flex\"                   : \"webkit moz ms\",\n            \"box-lines\"                  : \"webkit ms\",\n            \"box-ordinal-group\"          : \"webkit moz ms\",\n            \"box-orient\"                 : \"webkit moz ms\",\n            \"box-pack\"                   : \"webkit moz ms\",\n            \"box-sizing\"                 : \"webkit moz\",\n            \"box-shadow\"                 : \"webkit moz\",\n            \"column-count\"               : \"webkit moz ms\",\n            \"column-gap\"                 : \"webkit moz ms\",\n            \"column-rule\"                : \"webkit moz ms\",\n            \"column-rule-color\"          : \"webkit moz ms\",\n            \"column-rule-style\"          : \"webkit moz ms\",\n            \"column-rule-width\"          : \"webkit moz ms\",\n            \"column-width\"               : \"webkit moz ms\",\n            \"hyphens\"                    : \"epub moz\",\n            \"line-break\"                 : \"webkit ms\",\n            \"margin-end\"                 : \"webkit moz\",\n            \"margin-start\"               : \"webkit moz\",\n            \"marquee-speed\"              : \"webkit wap\",\n            \"marquee-style\"              : \"webkit wap\",\n            \"padding-end\"                : \"webkit moz\",\n            \"padding-start\"              : \"webkit moz\",\n            \"tab-size\"                   : \"moz o\",\n            \"text-size-adjust\"           : \"webkit ms\",\n            \"transform\"                  : \"webkit moz ms o\",\n            \"transform-origin\"           : \"webkit moz ms o\",\n            \"transition\"                 : \"webkit moz o\",\n            \"transition-delay\"           : \"webkit moz o\",\n            \"transition-duration\"        : \"webkit moz o\",\n            \"transition-property\"        : \"webkit moz o\",\n            \"transition-timing-function\" : \"webkit moz o\",\n            \"user-modify\"                : \"webkit moz\",\n            \"user-select\"                : \"webkit moz ms\",\n            \"word-break\"                 : \"epub ms\",\n            \"writing-mode\"               : \"epub ms\"\n        };\n\n\n        for (prop in compatiblePrefixes) {\n            if (compatiblePrefixes.hasOwnProperty(prop)) {\n                variations = [];\n                prefixed = compatiblePrefixes[prop].split(' ');\n                for (i = 0, len = prefixed.length; i < len; i++) {\n                    variations.push('-' + prefixed[i] + '-' + prop);\n                }\n                compatiblePrefixes[prop] = variations;\n                arrayPush.apply(applyTo, variations);\n            }\n        }\n                \n        parser.addListener(\"startrule\", function () {\n            properties = [];\n        });\n\n        parser.addListener(\"startkeyframes\", function (event) {\n            inKeyFrame = event.prefix || true;\n        });\n\n        parser.addListener(\"endkeyframes\", function (event) {\n            inKeyFrame = false;\n        });\n\n        parser.addListener(\"property\", function (event) {\n            var name = event.property;\n            if (CSSLint.Util.indexOf(applyTo, name.text) > -1) {\n                if (!inKeyFrame || typeof inKeyFrame != \"string\" || \n                        name.text.indexOf(\"-\" + inKeyFrame + \"-\") !== 0) {\n                    properties.push(name);\n                }\n            }\n        });\n\n        parser.addListener(\"endrule\", function (event) {\n            if (!properties.length) {\n                return;\n            }\n\n            var propertyGroups = {},\n                i,\n                len,\n                name,\n                prop,\n                variations,\n                value,\n                full,\n                actual,\n                item,\n                propertiesSpecified;\n\n            for (i = 0, len = properties.length; i < len; i++) {\n                name = properties[i];\n\n                for (prop in compatiblePrefixes) {\n                    if (compatiblePrefixes.hasOwnProperty(prop)) {\n                        variations = compatiblePrefixes[prop];\n                        if (CSSLint.Util.indexOf(variations, name.text) > -1) {\n                            if (!propertyGroups[prop]) {\n                                propertyGroups[prop] = {\n                                    full : variations.slice(0),\n                                    actual : [],\n                                    actualNodes: []\n                                };\n                            }\n                            if (CSSLint.Util.indexOf(propertyGroups[prop].actual, name.text) === -1) {\n                                propertyGroups[prop].actual.push(name.text);\n                                propertyGroups[prop].actualNodes.push(name);\n                            }\n                        }\n                    }\n                }\n            }\n\n            for (prop in propertyGroups) {\n                if (propertyGroups.hasOwnProperty(prop)) {\n                    value = propertyGroups[prop];\n                    full = value.full;\n                    actual = value.actual;\n\n                    if (full.length > actual.length) {\n                        for (i = 0, len = full.length; i < len; i++) {\n                            item = full[i];\n                            if (CSSLint.Util.indexOf(actual, item) === -1) {\n                                propertiesSpecified = (actual.length === 1) ? actual[0] : (actual.length == 2) ? actual.join(\" and \") : actual.join(\", \");\n                                reporter.report(\"The property \" + item + \" is compatible with \" + propertiesSpecified + \" and should be included as well.\", value.actualNodes[0].line, value.actualNodes[0].col, rule); \n                            }\n                        }\n\n                    }\n                }\n            }\n        });\n    }\n});\nCSSLint.addRule({\n    id: \"display-property-grouping\",\n    name: \"Require properties appropriate for display\",\n    desc: \"Certain properties shouldn't be used with certain display property values.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n\n        var propertiesToCheck = {\n                display: 1,\n                \"float\": \"none\",\n                height: 1,\n                width: 1,\n                margin: 1,\n                \"margin-left\": 1,\n                \"margin-right\": 1,\n                \"margin-bottom\": 1,\n                \"margin-top\": 1,\n                padding: 1,\n                \"padding-left\": 1,\n                \"padding-right\": 1,\n                \"padding-bottom\": 1,\n                \"padding-top\": 1,\n                \"vertical-align\": 1\n            },\n            properties;\n\n        function reportProperty(name, display, msg){\n            if (properties[name]){\n                if (typeof propertiesToCheck[name] != \"string\" || properties[name].value.toLowerCase() != propertiesToCheck[name]){\n                    reporter.report(msg || name + \" can't be used with display: \" + display + \".\", properties[name].line, properties[name].col, rule);\n                }\n            }\n        }\n        \n        function startRule(){\n            properties = {};\n        }\n\n        function endRule(){\n\n            var display = properties.display ? properties.display.value : null;\n            if (display){\n                switch(display){\n\n                    case \"inline\":\n                        reportProperty(\"height\", display);\n                        reportProperty(\"width\", display);\n                        reportProperty(\"margin\", display);\n                        reportProperty(\"margin-top\", display);\n                        reportProperty(\"margin-bottom\", display);              \n                        reportProperty(\"float\", display, \"display:inline has no effect on floated elements (but may be used to fix the IE6 double-margin bug).\");\n                        break;\n\n                    case \"block\":\n                        reportProperty(\"vertical-align\", display);\n                        break;\n\n                    case \"inline-block\":\n                        reportProperty(\"float\", display);\n                        break;\n\n                    default:\n                        if (display.indexOf(\"table-\") === 0){\n                            reportProperty(\"margin\", display);\n                            reportProperty(\"margin-left\", display);\n                            reportProperty(\"margin-right\", display);\n                            reportProperty(\"margin-top\", display);\n                            reportProperty(\"margin-bottom\", display);\n                            reportProperty(\"float\", display);\n                        }\n                }\n            }\n          \n        }\n\n        parser.addListener(\"startrule\", startRule);\n        parser.addListener(\"startfontface\", startRule);\n        parser.addListener(\"startkeyframerule\", startRule);\n        parser.addListener(\"startpagemargin\", startRule);\n        parser.addListener(\"startpage\", startRule);\n\n        parser.addListener(\"property\", function(event){\n            var name = event.property.text.toLowerCase();\n\n            if (propertiesToCheck[name]){\n                properties[name] = { value: event.value.text, line: event.property.line, col: event.property.col };                    \n            }\n        });\n\n        parser.addListener(\"endrule\", endRule);\n        parser.addListener(\"endfontface\", endRule);\n        parser.addListener(\"endkeyframerule\", endRule);\n        parser.addListener(\"endpagemargin\", endRule);\n        parser.addListener(\"endpage\", endRule);\n\n    }\n\n});\nCSSLint.addRule({\n    id: \"duplicate-background-images\",\n    name: \"Disallow duplicate background images\",\n    desc: \"Every background-image should be unique. Use a common class for e.g. sprites.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            stack = {};\n\n        parser.addListener(\"property\", function(event){\n            var name = event.property.text,\n                value = event.value,\n                i, len;\n\n            if (name.match(/background/i)) {\n                for (i=0, len=value.parts.length; i < len; i++) {\n                    if (value.parts[i].type == 'uri') {\n                        if (typeof stack[value.parts[i].uri] === 'undefined') {\n                            stack[value.parts[i].uri] = event;\n                        }\n                        else {\n                            reporter.report(\"Background image '\" + value.parts[i].uri + \"' was used multiple times, first declared at line \" + stack[value.parts[i].uri].line + \", col \" + stack[value.parts[i].uri].col + \".\", event.line, event.col, rule);\n                        }\n                    }\n                }\n            }\n        });\n    }\n});\nCSSLint.addRule({\n    id: \"duplicate-properties\",\n    name: \"Disallow duplicate properties\",\n    desc: \"Duplicate properties must appear one after the other.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            properties,\n            lastProperty;            \n            \n        function startRule(event){\n            properties = {};        \n        }\n        \n        parser.addListener(\"startrule\", startRule);\n        parser.addListener(\"startfontface\", startRule);\n        parser.addListener(\"startpage\", startRule);\n        parser.addListener(\"startpagemargin\", startRule);\n        parser.addListener(\"startkeyframerule\", startRule);        \n        \n        parser.addListener(\"property\", function(event){\n            var property = event.property,\n                name = property.text.toLowerCase();\n            \n            if (properties[name] && (lastProperty != name || properties[name] == event.value.text)){\n                reporter.report(\"Duplicate property '\" + event.property + \"' found.\", event.line, event.col, rule);\n            }\n            \n            properties[name] = event.value.text;\n            lastProperty = name;\n                        \n        });\n            \n        \n    }\n\n});\nCSSLint.addRule({\n    id: \"empty-rules\",\n    name: \"Disallow empty rules\",\n    desc: \"Rules without any properties specified should be removed.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            count = 0;\n\n        parser.addListener(\"startrule\", function(){\n            count=0;\n        });\n\n        parser.addListener(\"property\", function(){\n            count++;\n        });\n\n        parser.addListener(\"endrule\", function(event){\n            var selectors = event.selectors;\n            if (count === 0){\n                reporter.report(\"Rule is empty.\", selectors[0].line, selectors[0].col, rule);\n            }\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"errors\",\n    name: \"Parsing Errors\",\n    desc: \"This rule looks for recoverable syntax errors.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n\n        parser.addListener(\"error\", function(event){\n            reporter.error(event.message, event.line, event.col, rule);\n        });\n\n    }\n\n});\nCSSLint.addRule({\n    id: \"fallback-colors\",\n    name: \"Require fallback colors\",\n    desc: \"For older browsers that don't support RGBA, HSL, or HSLA, provide a fallback color.\",\n    browsers: \"IE6,IE7,IE8\",\n    init: function(parser, reporter){\n        var rule = this,\n            lastProperty,\n            propertiesToCheck = {\n                color: 1,\n                background: 1,\n                \"border-color\": 1,\n                \"border-top-color\": 1,\n                \"border-right-color\": 1,\n                \"border-bottom-color\": 1,\n                \"border-left-color\": 1,\n                border: 1,\n                \"border-top\": 1,\n                \"border-right\": 1,\n                \"border-bottom\": 1,\n                \"border-left\": 1,\n                \"background-color\": 1\n            },\n            properties;\n        \n        function startRule(event){\n            properties = {};    \n            lastProperty = null;    \n        }\n        \n        parser.addListener(\"startrule\", startRule);\n        parser.addListener(\"startfontface\", startRule);\n        parser.addListener(\"startpage\", startRule);\n        parser.addListener(\"startpagemargin\", startRule);\n        parser.addListener(\"startkeyframerule\", startRule);        \n        \n        parser.addListener(\"property\", function(event){\n            var property = event.property,\n                name = property.text.toLowerCase(),\n                parts = event.value.parts,\n                i = 0, \n                colorType = \"\",\n                len = parts.length;                \n                        \n            if(propertiesToCheck[name]){\n                while(i < len){\n                    if (parts[i].type == \"color\"){\n                        if (\"alpha\" in parts[i] || \"hue\" in parts[i]){\n                            \n                            if (/([^\\)]+)\\(/.test(parts[i])){\n                                colorType = RegExp.$1.toUpperCase();\n                            }\n                            \n                            if (!lastProperty || (lastProperty.property.text.toLowerCase() != name || lastProperty.colorType != \"compat\")){\n                                reporter.report(\"Fallback \" + name + \" (hex or RGB) should precede \" + colorType + \" \" + name + \".\", event.line, event.col, rule);\n                            }\n                        } else {\n                            event.colorType = \"compat\";\n                        }\n                    }\n                    \n                    i++;\n                }\n            }\n\n            lastProperty = event;\n        });        \n         \n    }\n\n});\nCSSLint.addRule({\n    id: \"floats\",\n    name: \"Disallow too many floats\",\n    desc: \"This rule tests if the float property is used too many times\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n        var count = 0;\n        parser.addListener(\"property\", function(event){\n            if (event.property.text.toLowerCase() == \"float\" &&\n                    event.value.text.toLowerCase() != \"none\"){\n                count++;\n            }\n        });\n        parser.addListener(\"endstylesheet\", function(){\n            reporter.stat(\"floats\", count);\n            if (count >= 10){\n                reporter.rollupWarn(\"Too many floats (\" + count + \"), you're probably using them for layout. Consider using a grid system instead.\", rule);\n            }\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"font-faces\",\n    name: \"Don't use too many web fonts\",\n    desc: \"Too many different web fonts in the same stylesheet.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            count = 0;\n\n\n        parser.addListener(\"startfontface\", function(){\n            count++;\n        });\n\n        parser.addListener(\"endstylesheet\", function(){\n            if (count > 5){\n                reporter.rollupWarn(\"Too many @font-face declarations (\" + count + \").\", rule);\n            }\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"font-sizes\",\n    name: \"Disallow too many font sizes\",\n    desc: \"Checks the number of font-size declarations.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            count = 0;\n        parser.addListener(\"property\", function(event){\n            if (event.property == \"font-size\"){\n                count++;\n            }\n        });\n        parser.addListener(\"endstylesheet\", function(){\n            reporter.stat(\"font-sizes\", count);\n            if (count >= 10){\n                reporter.rollupWarn(\"Too many font-size declarations (\" + count + \"), abstraction needed.\", rule);\n            }\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"gradients\",\n    name: \"Require all gradient definitions\",\n    desc: \"When using a vendor-prefixed gradient, make sure to use them all.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            gradients;\n\n        parser.addListener(\"startrule\", function(){\n            gradients = {\n                moz: 0,\n                webkit: 0,\n                oldWebkit: 0,\n                o: 0\n            };\n        });\n\n        parser.addListener(\"property\", function(event){\n\n            if (/\\-(moz|o|webkit)(?:\\-(?:linear|radial))\\-gradient/i.test(event.value)){\n                gradients[RegExp.$1] = 1;\n            } else if (/\\-webkit\\-gradient/i.test(event.value)){\n                gradients.oldWebkit = 1;\n            }\n\n        });\n\n        parser.addListener(\"endrule\", function(event){\n            var missing = [];\n\n            if (!gradients.moz){\n                missing.push(\"Firefox 3.6+\");\n            }\n\n            if (!gradients.webkit){\n                missing.push(\"Webkit (Safari 5+, Chrome)\");\n            }\n            \n            if (!gradients.oldWebkit){\n                missing.push(\"Old Webkit (Safari 4+, Chrome)\");\n            }\n\n            if (!gradients.o){\n                missing.push(\"Opera 11.1+\");\n            }\n\n            if (missing.length && missing.length < 4){            \n                reporter.report(\"Missing vendor-prefixed CSS gradients for \" + missing.join(\", \") + \".\", event.selectors[0].line, event.selectors[0].col, rule); \n            }\n\n        });\n\n    }\n\n});\nCSSLint.addRule({\n    id: \"ids\",\n    name: \"Disallow IDs in selectors\",\n    desc: \"Selectors should not contain IDs.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n        parser.addListener(\"startrule\", function(event){\n            var selectors = event.selectors,\n                selector,\n                part,\n                modifier,\n                idCount,\n                i, j, k;\n\n            for (i=0; i < selectors.length; i++){\n                selector = selectors[i];\n                idCount = 0;\n\n                for (j=0; j < selector.parts.length; j++){\n                    part = selector.parts[j];\n                    if (part.type == parser.SELECTOR_PART_TYPE){\n                        for (k=0; k < part.modifiers.length; k++){\n                            modifier = part.modifiers[k];\n                            if (modifier.type == \"id\"){\n                                idCount++;\n                            }\n                        }\n                    }\n                }\n\n                if (idCount == 1){\n                    reporter.report(\"Don't use IDs in selectors.\", selector.line, selector.col, rule);\n                } else if (idCount > 1){\n                    reporter.report(idCount + \" IDs in the selector, really?\", selector.line, selector.col, rule);\n                }\n            }\n\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"import\",\n    name: \"Disallow @import\",\n    desc: \"Don't use @import, use <link> instead.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n        \n        parser.addListener(\"import\", function(event){        \n            reporter.report(\"@import prevents parallel downloads, use <link> instead.\", event.line, event.col, rule);\n        });\n\n    }\n\n});\nCSSLint.addRule({\n    id: \"important\",\n    name: \"Disallow !important\",\n    desc: \"Be careful when using !important declaration\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            count = 0;\n        parser.addListener(\"property\", function(event){\n            if (event.important === true){\n                count++;\n                reporter.report(\"Use of !important\", event.line, event.col, rule);\n            }\n        });\n        parser.addListener(\"endstylesheet\", function(){\n            reporter.stat(\"important\", count);\n            if (count >= 10){\n                reporter.rollupWarn(\"Too many !important declarations (\" + count + \"), try to use less than 10 to avoid specificity issues.\", rule);\n            }\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"known-properties\",\n    name: \"Require use of known properties\",\n    desc: \"Properties should be known (listed in CSS3 specification) or be a vendor-prefixed property.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n\n        parser.addListener(\"property\", function(event){\n            var name = event.property.text.toLowerCase();\n            if (event.invalid) {\n                reporter.report(event.invalid.message, event.line, event.col, rule);\n            }\n\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"outline-none\",\n    name: \"Disallow outline: none\",\n    desc: \"Use of outline: none or outline: 0 should be limited to :focus rules.\",\n    browsers: \"All\",\n    tags: [\"Accessibility\"],\n    init: function(parser, reporter){\n        var rule = this,\n            lastRule;\n\n        function startRule(event){\n            if (event.selectors){\n                lastRule = {\n                    line: event.line,\n                    col: event.col,\n                    selectors: event.selectors,\n                    propCount: 0,\n                    outline: false\n                };\n            } else {\n                lastRule = null;\n            }\n        }\n        \n        function endRule(event){\n            if (lastRule){\n                if (lastRule.outline){\n                    if (lastRule.selectors.toString().toLowerCase().indexOf(\":focus\") == -1){\n                        reporter.report(\"Outlines should only be modified using :focus.\", lastRule.line, lastRule.col, rule);\n                    } else if (lastRule.propCount == 1) {\n                        reporter.report(\"Outlines shouldn't be hidden unless other visual changes are made.\", lastRule.line, lastRule.col, rule);                        \n                    }\n                }\n            }\n        }\n\n        parser.addListener(\"startrule\", startRule);\n        parser.addListener(\"startfontface\", startRule);\n        parser.addListener(\"startpage\", startRule);\n        parser.addListener(\"startpagemargin\", startRule);\n        parser.addListener(\"startkeyframerule\", startRule); \n\n        parser.addListener(\"property\", function(event){\n            var name = event.property.text.toLowerCase(),\n                value = event.value;                \n                \n            if (lastRule){\n                lastRule.propCount++;\n                if (name == \"outline\" && (value == \"none\" || value == \"0\")){\n                    lastRule.outline = true;\n                }            \n            }\n            \n        });\n        \n        parser.addListener(\"endrule\", endRule);\n        parser.addListener(\"endfontface\", endRule);\n        parser.addListener(\"endpage\", endRule);\n        parser.addListener(\"endpagemargin\", endRule);\n        parser.addListener(\"endkeyframerule\", endRule); \n\n    }\n\n});\nCSSLint.addRule({\n    id: \"overqualified-elements\",\n    name: \"Disallow overqualified elements\",\n    desc: \"Don't use classes or IDs with elements (a.foo or a#foo).\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            classes = {};\n            \n        parser.addListener(\"startrule\", function(event){\n            var selectors = event.selectors,\n                selector,\n                part,\n                modifier,\n                i, j, k;\n\n            for (i=0; i < selectors.length; i++){\n                selector = selectors[i];\n\n                for (j=0; j < selector.parts.length; j++){\n                    part = selector.parts[j];\n                    if (part.type == parser.SELECTOR_PART_TYPE){\n                        for (k=0; k < part.modifiers.length; k++){\n                            modifier = part.modifiers[k];\n                            if (part.elementName && modifier.type == \"id\"){\n                                reporter.report(\"Element (\" + part + \") is overqualified, just use \" + modifier + \" without element name.\", part.line, part.col, rule);\n                            } else if (modifier.type == \"class\"){\n                                \n                                if (!classes[modifier]){\n                                    classes[modifier] = [];\n                                }\n                                classes[modifier].push({ modifier: modifier, part: part });\n                            }\n                        }\n                    }\n                }\n            }\n        });\n        \n        parser.addListener(\"endstylesheet\", function(){\n        \n            var prop;\n            for (prop in classes){\n                if (classes.hasOwnProperty(prop)){\n                    if (classes[prop].length == 1 && classes[prop][0].part.elementName){\n                        reporter.report(\"Element (\" + classes[prop][0].part + \") is overqualified, just use \" + classes[prop][0].modifier + \" without element name.\", classes[prop][0].part.line, classes[prop][0].part.col, rule);\n                    }\n                }\n            }        \n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"qualified-headings\",\n    name: \"Disallow qualified headings\",\n    desc: \"Headings should not be qualified (namespaced).\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n\n        parser.addListener(\"startrule\", function(event){\n            var selectors = event.selectors,\n                selector,\n                part,\n                i, j;\n\n            for (i=0; i < selectors.length; i++){\n                selector = selectors[i];\n\n                for (j=0; j < selector.parts.length; j++){\n                    part = selector.parts[j];\n                    if (part.type == parser.SELECTOR_PART_TYPE){\n                        if (part.elementName && /h[1-6]/.test(part.elementName.toString()) && j > 0){\n                            reporter.report(\"Heading (\" + part.elementName + \") should not be qualified.\", part.line, part.col, rule);\n                        }\n                    }\n                }\n            }\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"regex-selectors\",\n    name: \"Disallow selectors that look like regexs\",\n    desc: \"Selectors that look like regular expressions are slow and should be avoided.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n\n        parser.addListener(\"startrule\", function(event){\n            var selectors = event.selectors,\n                selector,\n                part,\n                modifier,\n                i, j, k;\n\n            for (i=0; i < selectors.length; i++){\n                selector = selectors[i];\n                for (j=0; j < selector.parts.length; j++){\n                    part = selector.parts[j];\n                    if (part.type == parser.SELECTOR_PART_TYPE){\n                        for (k=0; k < part.modifiers.length; k++){\n                            modifier = part.modifiers[k];\n                            if (modifier.type == \"attribute\"){\n                                if (/([\\~\\|\\^\\$\\*]=)/.test(modifier)){\n                                    reporter.report(\"Attribute selectors with \" + RegExp.$1 + \" are slow!\", modifier.line, modifier.col, rule);\n                                }\n                            }\n\n                        }\n                    }\n                }\n            }\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"rules-count\",\n    name: \"Rules Count\",\n    desc: \"Track how many rules there are.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            count = 0;\n        parser.addListener(\"startrule\", function(){\n            count++;\n        });\n\n        parser.addListener(\"endstylesheet\", function(){\n            reporter.stat(\"rule-count\", count);\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"selector-max-approaching\",\n    name: \"Warn when approaching the 4095 selector limit for IE\",\n    desc: \"Will warn when selector count is >= 3800 selectors.\",\n    browsers: \"IE\",\n    init: function(parser, reporter) {\n        var rule = this, count = 0;\n\n        parser.addListener('startrule', function(event) {\n            count += event.selectors.length;\n        });\n\n        parser.addListener(\"endstylesheet\", function() {\n            if (count >= 3800) {\n                reporter.report(\"You have \" + count + \" selectors. Internet Explorer supports a maximum of 4095 selectors per stylesheet. Consider refactoring.\",0,0,rule); \n            }\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"selector-max\",\n    name: \"Error when past the 4095 selector limit for IE\",\n    desc: \"Will error when selector count is > 4095.\",\n    browsers: \"IE\",\n    init: function(parser, reporter){\n        var rule = this, count = 0;\n\n        parser.addListener('startrule',function(event) {\n            count += event.selectors.length;\n        });\n\n        parser.addListener(\"endstylesheet\", function() {\n            if (count > 4095) {\n                reporter.report(\"You have \" + count + \" selectors. Internet Explorer supports a maximum of 4095 selectors per stylesheet. Consider refactoring.\",0,0,rule); \n            }\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"shorthand\",\n    name: \"Require shorthand properties\",\n    desc: \"Use shorthand properties where possible.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            prop, i, len,\n            propertiesToCheck = {},\n            properties,\n            mapping = {\n                \"margin\": [\n                    \"margin-top\",\n                    \"margin-bottom\",\n                    \"margin-left\",\n                    \"margin-right\"\n                ],\n                \"padding\": [\n                    \"padding-top\",\n                    \"padding-bottom\",\n                    \"padding-left\",\n                    \"padding-right\"\n                ]              \n            };\n        for (prop in mapping){\n            if (mapping.hasOwnProperty(prop)){\n                for (i=0, len=mapping[prop].length; i < len; i++){\n                    propertiesToCheck[mapping[prop][i]] = prop;\n                }\n            }\n        }\n            \n        function startRule(event){\n            properties = {};\n        }\n        function endRule(event){\n            \n            var prop, i, len, total;\n            for (prop in mapping){\n                if (mapping.hasOwnProperty(prop)){\n                    total=0;\n                    \n                    for (i=0, len=mapping[prop].length; i < len; i++){\n                        total += properties[mapping[prop][i]] ? 1 : 0;\n                    }\n                    \n                    if (total == mapping[prop].length){\n                        reporter.report(\"The properties \" + mapping[prop].join(\", \") + \" can be replaced by \" + prop + \".\", event.line, event.col, rule);\n                    }\n                }\n            }\n        }        \n        \n        parser.addListener(\"startrule\", startRule);\n        parser.addListener(\"startfontface\", startRule);\n        parser.addListener(\"property\", function(event){\n            var name = event.property.toString().toLowerCase(),\n                value = event.value.parts[0].value;\n\n            if (propertiesToCheck[name]){\n                properties[name] = 1;\n            }\n        });\n\n        parser.addListener(\"endrule\", endRule);\n        parser.addListener(\"endfontface\", endRule);     \n\n    }\n\n});\nCSSLint.addRule({\n    id: \"star-property-hack\",\n    name: \"Disallow properties with a star prefix\",\n    desc: \"Checks for the star property hack (targets IE6/7)\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n        parser.addListener(\"property\", function(event){\n            var property = event.property;\n\n            if (property.hack == \"*\") {\n                reporter.report(\"Property with star prefix found.\", event.property.line, event.property.col, rule);\n            }\n        });\n    }\n});\nCSSLint.addRule({\n    id: \"text-indent\",\n    name: \"Disallow negative text-indent\",\n    desc: \"Checks for text indent less than -99px\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            textIndent,\n            direction;\n\n\n        function startRule(event){\n            textIndent = false;\n            direction = \"inherit\";\n        }\n        function endRule(event){\n            if (textIndent && direction != \"ltr\"){\n                reporter.report(\"Negative text-indent doesn't work well with RTL. If you use text-indent for image replacement explicitly set direction for that item to ltr.\", textIndent.line, textIndent.col, rule);\n            }\n        }\n\n        parser.addListener(\"startrule\", startRule);\n        parser.addListener(\"startfontface\", startRule);\n        parser.addListener(\"property\", function(event){\n            var name = event.property.toString().toLowerCase(),\n                value = event.value;\n\n            if (name == \"text-indent\" && value.parts[0].value < -99){\n                textIndent = event.property;\n            } else if (name == \"direction\" && value == \"ltr\"){\n                direction = \"ltr\";\n            }\n        });\n\n        parser.addListener(\"endrule\", endRule);\n        parser.addListener(\"endfontface\", endRule);\n\n    }\n\n});\nCSSLint.addRule({\n    id: \"underscore-property-hack\",\n    name: \"Disallow properties with an underscore prefix\",\n    desc: \"Checks for the underscore property hack (targets IE6)\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n        parser.addListener(\"property\", function(event){\n            var property = event.property;\n\n            if (property.hack == \"_\") {\n                reporter.report(\"Property with underscore prefix found.\", event.property.line, event.property.col, rule);\n            }\n        });\n    }\n});\nCSSLint.addRule({\n    id: \"unique-headings\",\n    name: \"Headings should only be defined once\",\n    desc: \"Headings should be defined only once.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n\n        var headings =  {\n                h1: 0,\n                h2: 0,\n                h3: 0,\n                h4: 0,\n                h5: 0,\n                h6: 0\n            };\n\n        parser.addListener(\"startrule\", function(event){\n            var selectors = event.selectors,\n                selector,\n                part,\n                pseudo,\n                i, j;\n\n            for (i=0; i < selectors.length; i++){\n                selector = selectors[i];\n                part = selector.parts[selector.parts.length-1];\n\n                if (part.elementName && /(h[1-6])/i.test(part.elementName.toString())){\n                    \n                    for (j=0; j < part.modifiers.length; j++){\n                        if (part.modifiers[j].type == \"pseudo\"){\n                            pseudo = true;\n                            break;\n                        }\n                    }\n                \n                    if (!pseudo){\n                        headings[RegExp.$1]++;\n                        if (headings[RegExp.$1] > 1) {\n                            reporter.report(\"Heading (\" + part.elementName + \") has already been defined.\", part.line, part.col, rule);\n                        }\n                    }\n                }\n            }\n        });\n        \n        parser.addListener(\"endstylesheet\", function(event){\n            var prop,\n                messages = [];\n                \n            for (prop in headings){\n                if (headings.hasOwnProperty(prop)){\n                    if (headings[prop] > 1){\n                        messages.push(headings[prop] + \" \" + prop + \"s\");\n                    }\n                }\n            }\n            \n            if (messages.length){\n                reporter.rollupWarn(\"You have \" + messages.join(\", \") + \" defined in this stylesheet.\", rule);\n            }\n        });        \n    }\n\n});\nCSSLint.addRule({\n    id: \"universal-selector\",\n    name: \"Disallow universal selector\",\n    desc: \"The universal selector (*) is known to be slow.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n\n        parser.addListener(\"startrule\", function(event){\n            var selectors = event.selectors,\n                selector,\n                part,\n                modifier,\n                i, j, k;\n\n            for (i=0; i < selectors.length; i++){\n                selector = selectors[i];\n                \n                part = selector.parts[selector.parts.length-1];\n                if (part.elementName == \"*\"){\n                    reporter.report(rule.desc, part.line, part.col, rule);\n                }\n            }\n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"unqualified-attributes\",\n    name: \"Disallow unqualified attribute selectors\",\n    desc: \"Unqualified attribute selectors are known to be slow.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n\n        parser.addListener(\"startrule\", function(event){\n            \n            var selectors = event.selectors,\n                selector,\n                part,\n                modifier,\n                i, j, k;\n\n            for (i=0; i < selectors.length; i++){\n                selector = selectors[i];\n                \n                part = selector.parts[selector.parts.length-1];\n                if (part.type == parser.SELECTOR_PART_TYPE){\n                    for (k=0; k < part.modifiers.length; k++){\n                        modifier = part.modifiers[k];\n                        if (modifier.type == \"attribute\" && (!part.elementName || part.elementName == \"*\")){\n                            reporter.report(rule.desc, part.line, part.col, rule);                               \n                        }\n                    }\n                }\n                \n            }            \n        });\n    }\n\n});\nCSSLint.addRule({\n    id: \"vendor-prefix\",\n    name: \"Require standard property with vendor prefix\",\n    desc: \"When using a vendor-prefixed property, make sure to include the standard one.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this,\n            properties,\n            num,\n            propertiesToCheck = {\n                \"-webkit-border-radius\": \"border-radius\",\n                \"-webkit-border-top-left-radius\": \"border-top-left-radius\",\n                \"-webkit-border-top-right-radius\": \"border-top-right-radius\",\n                \"-webkit-border-bottom-left-radius\": \"border-bottom-left-radius\",\n                \"-webkit-border-bottom-right-radius\": \"border-bottom-right-radius\",\n                \n                \"-o-border-radius\": \"border-radius\",\n                \"-o-border-top-left-radius\": \"border-top-left-radius\",\n                \"-o-border-top-right-radius\": \"border-top-right-radius\",\n                \"-o-border-bottom-left-radius\": \"border-bottom-left-radius\",\n                \"-o-border-bottom-right-radius\": \"border-bottom-right-radius\",\n                \n                \"-moz-border-radius\": \"border-radius\",\n                \"-moz-border-radius-topleft\": \"border-top-left-radius\",\n                \"-moz-border-radius-topright\": \"border-top-right-radius\",\n                \"-moz-border-radius-bottomleft\": \"border-bottom-left-radius\",\n                \"-moz-border-radius-bottomright\": \"border-bottom-right-radius\",                \n                \n                \"-moz-column-count\": \"column-count\",\n                \"-webkit-column-count\": \"column-count\",\n                \n                \"-moz-column-gap\": \"column-gap\",\n                \"-webkit-column-gap\": \"column-gap\",\n                \n                \"-moz-column-rule\": \"column-rule\",\n                \"-webkit-column-rule\": \"column-rule\",\n                \n                \"-moz-column-rule-style\": \"column-rule-style\",\n                \"-webkit-column-rule-style\": \"column-rule-style\",\n                \n                \"-moz-column-rule-color\": \"column-rule-color\",\n                \"-webkit-column-rule-color\": \"column-rule-color\",\n                \n                \"-moz-column-rule-width\": \"column-rule-width\",\n                \"-webkit-column-rule-width\": \"column-rule-width\",\n                \n                \"-moz-column-width\": \"column-width\",\n                \"-webkit-column-width\": \"column-width\",\n                \n                \"-webkit-column-span\": \"column-span\",\n                \"-webkit-columns\": \"columns\",\n                \n                \"-moz-box-shadow\": \"box-shadow\",\n                \"-webkit-box-shadow\": \"box-shadow\",\n                \n                \"-moz-transform\" : \"transform\",\n                \"-webkit-transform\" : \"transform\",\n                \"-o-transform\" : \"transform\",\n                \"-ms-transform\" : \"transform\",\n                \n                \"-moz-transform-origin\" : \"transform-origin\",\n                \"-webkit-transform-origin\" : \"transform-origin\",\n                \"-o-transform-origin\" : \"transform-origin\",\n                \"-ms-transform-origin\" : \"transform-origin\",\n                \n                \"-moz-box-sizing\" : \"box-sizing\",\n                \"-webkit-box-sizing\" : \"box-sizing\",\n                \n                \"-moz-user-select\" : \"user-select\",\n                \"-khtml-user-select\" : \"user-select\",\n                \"-webkit-user-select\" : \"user-select\"                \n            };\n        function startRule(){\n            properties = {};\n            num=1;        \n        }\n        function endRule(event){\n            var prop,\n                i, len,\n                standard,\n                needed,\n                actual,\n                needsStandard = [];\n\n            for (prop in properties){\n                if (propertiesToCheck[prop]){\n                    needsStandard.push({ actual: prop, needed: propertiesToCheck[prop]});\n                }\n            }\n\n            for (i=0, len=needsStandard.length; i < len; i++){\n                needed = needsStandard[i].needed;\n                actual = needsStandard[i].actual;\n\n                if (!properties[needed]){               \n                    reporter.report(\"Missing standard property '\" + needed + \"' to go along with '\" + actual + \"'.\", properties[actual][0].name.line, properties[actual][0].name.col, rule);\n                } else {\n                    if (properties[needed][0].pos < properties[actual][0].pos){\n                        reporter.report(\"Standard property '\" + needed + \"' should come after vendor-prefixed property '\" + actual + \"'.\", properties[actual][0].name.line, properties[actual][0].name.col, rule);\n                    }\n                }\n            }\n\n        }        \n        \n        parser.addListener(\"startrule\", startRule);\n        parser.addListener(\"startfontface\", startRule);\n        parser.addListener(\"startpage\", startRule);\n        parser.addListener(\"startpagemargin\", startRule);\n        parser.addListener(\"startkeyframerule\", startRule);         \n\n        parser.addListener(\"property\", function(event){\n            var name = event.property.text.toLowerCase();\n\n            if (!properties[name]){\n                properties[name] = [];\n            }\n\n            properties[name].push({ name: event.property, value : event.value, pos:num++ });\n        });\n\n        parser.addListener(\"endrule\", endRule);\n        parser.addListener(\"endfontface\", endRule);\n        parser.addListener(\"endpage\", endRule);\n        parser.addListener(\"endpagemargin\", endRule);\n        parser.addListener(\"endkeyframerule\", endRule);         \n    }\n\n});\nCSSLint.addRule({\n    id: \"zero-units\",\n    name: \"Disallow units for 0 values\",\n    desc: \"You don't need to specify units when a value is 0.\",\n    browsers: \"All\",\n    init: function(parser, reporter){\n        var rule = this;\n        parser.addListener(\"property\", function(event){\n            var parts = event.value.parts,\n                i = 0, \n                len = parts.length;\n\n            while(i < len){\n                if ((parts[i].units || parts[i].type == \"percentage\") && parts[i].value === 0 && parts[i].type != \"time\"){\n                    reporter.report(\"Values of 0 shouldn't have units specified.\", parts[i].line, parts[i].col, rule);\n                }\n                i++;\n            }\n\n        });\n\n    }\n\n});\n(function() {\n    var xmlEscape = function(str) {\n        if (!str || str.constructor !== String) {\n            return \"\";\n        }\n        \n        return str.replace(/[\\\"&><]/g, function(match) {\n            switch (match) {\n                case \"\\\"\":\n                    return \"&quot;\";\n                case \"&\":\n                    return \"&amp;\";\n                case \"<\":\n                    return \"&lt;\";\n                case \">\":\n                    return \"&gt;\";            \n            }\n        });\n    };\n\n    CSSLint.addFormatter({\n        id: \"checkstyle-xml\",\n        name: \"Checkstyle XML format\",\n        startFormat: function(){\n            return \"<?xml version=\\\"1.0\\\" encoding=\\\"utf-8\\\"?><checkstyle>\";\n        },\n        endFormat: function(){\n            return \"</checkstyle>\";\n        },\n        readError: function(filename, message) {\n            return \"<file name=\\\"\" + xmlEscape(filename) + \"\\\"><error line=\\\"0\\\" column=\\\"0\\\" severty=\\\"error\\\" message=\\\"\" + xmlEscape(message) + \"\\\"></error></file>\";\n        },\n        formatResults: function(results, filename, options) {\n            var messages = results.messages,\n                output = [];\n            var generateSource = function(rule) {\n                if (!rule || !('name' in rule)) {\n                    return \"\";\n                }\n                return 'net.csslint.' + rule.name.replace(/\\s/g,'');\n            };\n\n\n\n            if (messages.length > 0) {\n                output.push(\"<file name=\\\"\"+filename+\"\\\">\");\n                CSSLint.Util.forEach(messages, function (message, i) {\n                    if (!message.rollup) {\n                      output.push(\"<error line=\\\"\" + message.line + \"\\\" column=\\\"\" + message.col + \"\\\" severity=\\\"\" + message.type + \"\\\"\" +\n                          \" message=\\\"\" + xmlEscape(message.message) + \"\\\" source=\\\"\" + generateSource(message.rule) +\"\\\"/>\");\n                    }\n                });\n                output.push(\"</file>\");\n            }\n\n            return output.join(\"\");\n        }\n    });\n\n}());\nCSSLint.addFormatter({\n    id: \"compact\",\n    name: \"Compact, 'porcelain' format\",\n    startFormat: function() {\n        return \"\";\n    },\n    endFormat: function() {\n        return \"\";\n    },\n    formatResults: function(results, filename, options) {\n        var messages = results.messages,\n            output = \"\";\n        options = options || {};\n        var capitalize = function(str) {\n            return str.charAt(0).toUpperCase() + str.slice(1);\n        };\n\n        if (messages.length === 0) {\n            return options.quiet ? \"\" : filename + \": Lint Free!\";\n        }\n\n        CSSLint.Util.forEach(messages, function(message, i) {\n            if (message.rollup) {\n                output += filename + \": \" + capitalize(message.type) + \" - \" + message.message + \"\\n\";\n            } else {\n                output += filename + \": \" + \"line \" + message.line + \n                    \", col \" + message.col + \", \" + capitalize(message.type) + \" - \" + message.message + \"\\n\";\n            }\n        });\n    \n        return output;\n    }\n});\nCSSLint.addFormatter({\n    id: \"csslint-xml\",\n    name: \"CSSLint XML format\",\n    startFormat: function(){\n        return \"<?xml version=\\\"1.0\\\" encoding=\\\"utf-8\\\"?><csslint>\";\n    },\n    endFormat: function(){\n        return \"</csslint>\";\n    },\n    formatResults: function(results, filename, options) {\n        var messages = results.messages,\n            output = [];\n        var escapeSpecialCharacters = function(str) {\n            if (!str || str.constructor !== String) {\n                return \"\";\n            }\n            return str.replace(/\\\"/g, \"'\").replace(/&/g, \"&amp;\").replace(/</g, \"&lt;\").replace(/>/g, \"&gt;\");\n        };\n\n        if (messages.length > 0) {\n            output.push(\"<file name=\\\"\"+filename+\"\\\">\");\n            CSSLint.Util.forEach(messages, function (message, i) {\n                if (message.rollup) {\n                    output.push(\"<issue severity=\\\"\" + message.type + \"\\\" reason=\\\"\" + escapeSpecialCharacters(message.message) + \"\\\" evidence=\\\"\" + escapeSpecialCharacters(message.evidence) + \"\\\"/>\");\n                } else {\n                    output.push(\"<issue line=\\\"\" + message.line + \"\\\" char=\\\"\" + message.col + \"\\\" severity=\\\"\" + message.type + \"\\\"\" +\n                        \" reason=\\\"\" + escapeSpecialCharacters(message.message) + \"\\\" evidence=\\\"\" + escapeSpecialCharacters(message.evidence) + \"\\\"/>\");\n                }\n            });\n            output.push(\"</file>\");\n        }\n\n        return output.join(\"\");\n    }\n});\nCSSLint.addFormatter({\n    id: \"junit-xml\",\n    name: \"JUNIT XML format\",\n    startFormat: function(){\n        return \"<?xml version=\\\"1.0\\\" encoding=\\\"utf-8\\\"?><testsuites>\";\n    },\n    endFormat: function() {\n        return \"</testsuites>\";\n    },\n    formatResults: function(results, filename, options) {\n\n        var messages = results.messages,\n            output = [],\n            tests = {\n                'error': 0,\n                'failure': 0\n            };\n        var generateSource = function(rule) {\n            if (!rule || !('name' in rule)) {\n                return \"\";\n            }\n            return 'net.csslint.' + rule.name.replace(/\\s/g,'');\n        };\n        var escapeSpecialCharacters = function(str) {\n\n            if (!str || str.constructor !== String) {\n                return \"\";\n            }\n\n            return str.replace(/\\\"/g, \"'\").replace(/</g, \"&lt;\").replace(/>/g, \"&gt;\");\n\n        };\n\n        if (messages.length > 0) {\n\n            messages.forEach(function (message, i) {\n                var type = message.type === 'warning' ? 'error' : message.type;\n                if (!message.rollup) {\n                    output.push(\"<testcase time=\\\"0\\\" name=\\\"\" + generateSource(message.rule) + \"\\\">\");\n                    output.push(\"<\" + type + \" message=\\\"\" + escapeSpecialCharacters(message.message) + \"\\\"><![CDATA[\" + message.line + ':' + message.col + ':' + escapeSpecialCharacters(message.evidence)  + \"]]></\" + type + \">\");\n                    output.push(\"</testcase>\");\n\n                    tests[type] += 1;\n\n                }\n\n            });\n\n            output.unshift(\"<testsuite time=\\\"0\\\" tests=\\\"\" + messages.length + \"\\\" skipped=\\\"0\\\" errors=\\\"\" + tests.error + \"\\\" failures=\\\"\" + tests.failure + \"\\\" package=\\\"net.csslint\\\" name=\\\"\" + filename + \"\\\">\");\n            output.push(\"</testsuite>\");\n\n        }\n\n        return output.join(\"\");\n\n    }\n});\nCSSLint.addFormatter({\n    id: \"lint-xml\",\n    name: \"Lint XML format\",\n    startFormat: function(){\n        return \"<?xml version=\\\"1.0\\\" encoding=\\\"utf-8\\\"?><lint>\";\n    },\n    endFormat: function(){\n        return \"</lint>\";\n    },\n    formatResults: function(results, filename, options) {\n        var messages = results.messages,\n            output = [];\n        var escapeSpecialCharacters = function(str) {\n            if (!str || str.constructor !== String) {\n                return \"\";\n            }\n            return str.replace(/\\\"/g, \"'\").replace(/&/g, \"&amp;\").replace(/</g, \"&lt;\").replace(/>/g, \"&gt;\");\n        };\n\n        if (messages.length > 0) {\n        \n            output.push(\"<file name=\\\"\"+filename+\"\\\">\");\n            CSSLint.Util.forEach(messages, function (message, i) {\n                if (message.rollup) {\n                    output.push(\"<issue severity=\\\"\" + message.type + \"\\\" reason=\\\"\" + escapeSpecialCharacters(message.message) + \"\\\" evidence=\\\"\" + escapeSpecialCharacters(message.evidence) + \"\\\"/>\");\n                } else {\n                    output.push(\"<issue line=\\\"\" + message.line + \"\\\" char=\\\"\" + message.col + \"\\\" severity=\\\"\" + message.type + \"\\\"\" +\n                        \" reason=\\\"\" + escapeSpecialCharacters(message.message) + \"\\\" evidence=\\\"\" + escapeSpecialCharacters(message.evidence) + \"\\\"/>\");\n                }\n            });\n            output.push(\"</file>\");\n        }\n\n        return output.join(\"\");\n    }\n});\nCSSLint.addFormatter({\n    id: \"text\",\n    name: \"Plain Text\",\n    startFormat: function() {\n        return \"\";\n    },\n    endFormat: function() {\n        return \"\";\n    },\n    formatResults: function(results, filename, options) {\n        var messages = results.messages,\n            output = \"\";\n        options = options || {};\n\n        if (messages.length === 0) {\n            return options.quiet ? \"\" : \"\\n\\ncsslint: No errors in \" + filename + \".\";\n        }\n\n        output = \"\\n\\ncsslint: There are \" + messages.length  +  \" problems in \" + filename + \".\";\n        var pos = filename.lastIndexOf(\"/\"),\n            shortFilename = filename;\n\n        if (pos === -1){\n            pos = filename.lastIndexOf(\"\\\\\");       \n        }\n        if (pos > -1){\n            shortFilename = filename.substring(pos+1);\n        }\n\n        CSSLint.Util.forEach(messages, function (message, i) {\n            output = output + \"\\n\\n\" + shortFilename;\n            if (message.rollup) {\n                output += \"\\n\" + (i+1) + \": \" + message.type;\n                output += \"\\n\" + message.message;\n            } else {\n                output += \"\\n\" + (i+1) + \": \" + message.type + \" at line \" + message.line + \", col \" + message.col;\n                output += \"\\n\" + message.message;\n                output += \"\\n\" + message.evidence;\n            }\n        });\n    \n        return output;\n    }\n});\n\nexports.CSSLint = CSSLint;\n\n});";
var blob = new Blob([workerSrc]);
var blobUrl = window.URL.createObjectURL(blob);

this.$worker = new Worker(blobUrl);

    this.$worker.postMessage({
        init : true,
        tlns: tlns,
        module: mod,
        classname: classname
    });

    this.callbackId = 1;
    this.callbacks = {};

    this.$worker.onerror = this.onError;
    this.$worker.onmessage = this.onMessage;
};

(function(){

    oop.implement(this, EventEmitter);

    this.onError = function(e) {
        window.console && console.log && console.log(e);
        throw e;
    };

    this.onMessage = function(e) {
        var msg = e.data;
        switch(msg.type) {
            case "log":
                window.console && console.log && console.log.apply(console, msg.data);
                break;

            case "event":
                this._emit(msg.name, {data: msg.data});
                break;

            case "call":
                var callback = this.callbacks[msg.id];
                if (callback) {
                    callback(msg.data);
                    delete this.callbacks[msg.id];
                }
                break;
        }
    };

    this.$normalizePath = function(path) {
        if (!location.host) // needed for file:// protocol
            return path;
        path = path.replace(/^[a-z]+:\/\/[^\/]+/, ""); // Remove domain name and rebuild it
        path = location.protocol + "//" + location.host
            + (path.charAt(0) == "/" ? "" : location.pathname.replace(/\/[^\/]*$/, ""))
            + "/" + path.replace(/^[\/]+/, "");
        return path;
    };

    this.terminate = function() {
        this._emit("terminate", {});
        this.$worker.terminate();
        this.$worker = null;
        this.$doc.removeEventListener("change", this.changeListener);
        this.$doc = null;
    };

    this.send = function(cmd, args) {
        this.$worker.postMessage({command: cmd, args: args});
    };

    this.call = function(cmd, args, callback) {
        if (callback) {
            var id = this.callbackId++;
            this.callbacks[id] = callback;
            args.push(id);
        }
        this.send(cmd, args);
    };

    this.emit = function(event, data) {
        try {
            this.$worker.postMessage({event: event, data: {data: data.data}});
        }
        catch(ex) {}
    };

    this.attachToDocument = function(doc) {
        if(this.$doc)
            this.terminate();

        this.$doc = doc;
        this.call("setValue", [doc.getValue()]);
        doc.on("change", this.changeListener);
    };

    this.changeListener = function(e) {
        e.range = {
            start: e.data.range.start,
            end: e.data.range.end
        };
        this.emit("change", e);
    };

}).call(WorkerClient.prototype);


var UIWorkerClient = function(topLevelNamespaces, mod, classname) {
    this.changeListener = this.changeListener.bind(this);
    this.callbackId = 1;
    this.callbacks = {};
    this.messageBuffer = [];

    var main = null;
    var sender = Object.create(EventEmitter);
    var _self = this;

    this.$worker = {}
    this.$worker.terminate = function() {};
    this.$worker.postMessage = function(e) {
        _self.messageBuffer.push(e);
        main && setTimeout(processNext);
    };

    var processNext = function() {
        var msg = _self.messageBuffer.shift();
        if (msg.command)
            main[msg.command].apply(main, msg.args);
        else if (msg.event)
            sender._emit(msg.event, msg.data);
    };

    sender.postMessage = function(msg) {
        _self.onMessage({data: msg});
    };
    sender.callback = function(data, callbackId) {
        this.postMessage({type: "call", id: callbackId, data: data});
    };
    sender.emit = function(name, data) {
        this.postMessage({type: "event", name: name, data: data});
    };

    config.loadModule(["worker", mod], function(Main) {
        main = new Main[classname](sender);
        while (_self.messageBuffer.length)
            processNext();
    });
};

UIWorkerClient.prototype = WorkerClient.prototype;

exports.UIWorkerClient = UIWorkerClient;
exports.WorkerClient = WorkerClient;

});
ace.define('ace/placeholder', ["require", 'exports', 'module' , 'ace/range', 'ace/lib/event_emitter', 'ace/lib/oop'], function(acequire, exports, module) {


var Range = acequire("./range").Range;
var EventEmitter = acequire("./lib/event_emitter").EventEmitter;
var oop = acequire("./lib/oop");

var PlaceHolder = function(session, length, pos, others, mainClass, othersClass) {
    var _self = this;
    this.length = length;
    this.session = session;
    this.doc = session.getDocument();
    this.mainClass = mainClass;
    this.othersClass = othersClass;
    this.$onUpdate = this.onUpdate.bind(this);
    this.doc.on("change", this.$onUpdate);
    this.$others = others;
    
    this.$onCursorChange = function() {
        setTimeout(function() {
            _self.onCursorChange();
        });
    };
    
    this.$pos = pos;
    var undoStack = session.getUndoManager().$undoStack || session.getUndoManager().$undostack || {length: -1};
    this.$undoStackDepth =  undoStack.length;
    this.setup();

    session.selection.on("changeCursor", this.$onCursorChange);
};

(function() {

    oop.implement(this, EventEmitter);
    this.setup = function() {
        var _self = this;
        var doc = this.doc;
        var session = this.session;
        var pos = this.$pos;

        this.pos = doc.createAnchor(pos.row, pos.column);
        this.markerId = session.addMarker(new Range(pos.row, pos.column, pos.row, pos.column + this.length), this.mainClass, null, false);
        this.pos.on("change", function(event) {
            session.removeMarker(_self.markerId);
            _self.markerId = session.addMarker(new Range(event.value.row, event.value.column, event.value.row, event.value.column+_self.length), _self.mainClass, null, false);
        });
        this.others = [];
        this.$others.forEach(function(other) {
            var anchor = doc.createAnchor(other.row, other.column);
            _self.others.push(anchor);
        });
        session.setUndoSelect(false);
    };
    this.showOtherMarkers = function() {
        if(this.othersActive) return;
        var session = this.session;
        var _self = this;
        this.othersActive = true;
        this.others.forEach(function(anchor) {
            anchor.markerId = session.addMarker(new Range(anchor.row, anchor.column, anchor.row, anchor.column+_self.length), _self.othersClass, null, false);
            anchor.on("change", function(event) {
                session.removeMarker(anchor.markerId);
                anchor.markerId = session.addMarker(new Range(event.value.row, event.value.column, event.value.row, event.value.column+_self.length), _self.othersClass, null, false);
            });
        });
    };
    this.hideOtherMarkers = function() {
        if(!this.othersActive) return;
        this.othersActive = false;
        for (var i = 0; i < this.others.length; i++) {
            this.session.removeMarker(this.others[i].markerId);
        }
    };
    this.onUpdate = function(event) {
        var delta = event.data;
        var range = delta.range;
        if(range.start.row !== range.end.row) return;
        if(range.start.row !== this.pos.row) return;
        if (this.$updating) return;
        this.$updating = true;
        var lengthDiff = delta.action === "insertText" ? range.end.column - range.start.column : range.start.column - range.end.column;
        
        if(range.start.column >= this.pos.column && range.start.column <= this.pos.column + this.length + 1) {
            var distanceFromStart = range.start.column - this.pos.column;
            this.length += lengthDiff;
            if(!this.session.$fromUndo) {
                if(delta.action === "insertText") {
                    for (var i = this.others.length - 1; i >= 0; i--) {
                        var otherPos = this.others[i];
                        var newPos = {row: otherPos.row, column: otherPos.column + distanceFromStart};
                        if(otherPos.row === range.start.row && range.start.column < otherPos.column)
                            newPos.column += lengthDiff;
                        this.doc.insert(newPos, delta.text);
                    }
                } else if(delta.action === "removeText") {
                    for (var i = this.others.length - 1; i >= 0; i--) {
                        var otherPos = this.others[i];
                        var newPos = {row: otherPos.row, column: otherPos.column + distanceFromStart};
                        if(otherPos.row === range.start.row && range.start.column < otherPos.column)
                            newPos.column += lengthDiff;
                        this.doc.remove(new Range(newPos.row, newPos.column, newPos.row, newPos.column - lengthDiff));
                    }
                }
                if(range.start.column === this.pos.column && delta.action === "insertText") {
                    setTimeout(function() {
                        this.pos.setPosition(this.pos.row, this.pos.column - lengthDiff);
                        for (var i = 0; i < this.others.length; i++) {
                            var other = this.others[i];
                            var newPos = {row: other.row, column: other.column - lengthDiff};
                            if(other.row === range.start.row && range.start.column < other.column)
                                newPos.column += lengthDiff;
                            other.setPosition(newPos.row, newPos.column);
                        }
                    }.bind(this), 0);
                }
                else if(range.start.column === this.pos.column && delta.action === "removeText") {
                    setTimeout(function() {
                        for (var i = 0; i < this.others.length; i++) {
                            var other = this.others[i];
                            if(other.row === range.start.row && range.start.column < other.column) {
                                other.setPosition(other.row, other.column - lengthDiff);
                            }
                        }
                    }.bind(this), 0);
                }
            }
            this.pos._emit("change", {value: this.pos});
            for (var i = 0; i < this.others.length; i++) {
                this.others[i]._emit("change", {value: this.others[i]});
            }
        }
        this.$updating = false;
    };

    this.onCursorChange = function(event) {
        if (this.$updating) return;
        var pos = this.session.selection.getCursor();
        if(pos.row === this.pos.row && pos.column >= this.pos.column && pos.column <= this.pos.column + this.length) {
            this.showOtherMarkers();
            this._emit("cursorEnter", event);
        } else {
            this.hideOtherMarkers();
            this._emit("cursorLeave", event);
        }
    };    
    this.detach = function() {
        this.session.removeMarker(this.markerId);
        this.hideOtherMarkers();
        this.doc.removeEventListener("change", this.$onUpdate);
        this.session.selection.removeEventListener("changeCursor", this.$onCursorChange);
        this.pos.detach();
        for (var i = 0; i < this.others.length; i++) {
            this.others[i].detach();
        }
        this.session.setUndoSelect(true);
    };
    this.cancel = function() {
        if(this.$undoStackDepth === -1)
            throw Error("Canceling placeholders only supported with undo manager attached to session.");
        var undoManager = this.session.getUndoManager();
        var undosRequired = (undoManager.$undoStack || undoManager.$undostack).length - this.$undoStackDepth;
        for (var i = 0; i < undosRequired; i++) {
            undoManager.undo(true);
        }
    };
}).call(PlaceHolder.prototype);


exports.PlaceHolder = PlaceHolder;
});

ace.define('ace/mode/folding/fold_mode', ["require", 'exports', 'module' , 'ace/range'], function(acequire, exports, module) {


var Range = acequire("../../range").Range;

var FoldMode = exports.FoldMode = function() {};

(function() {

    this.foldingStartMarker = null;
    this.foldingStopMarker = null;
    this.getFoldWidget = function(session, foldStyle, row) {
        var line = session.getLine(row);
        if (this.foldingStartMarker.test(line))
            return "start";
        if (foldStyle == "markbeginend"
                && this.foldingStopMarker
                && this.foldingStopMarker.test(line))
            return "end";
        return "";
    };

    this.getFoldWidgetRange = function(session, foldStyle, row) {
        return null;
    };

    this.indentationBlock = function(session, row, column) {
        var re = /\S/;
        var line = session.getLine(row);
        var startLevel = line.search(re);
        if (startLevel == -1)
            return;

        var startColumn = column || line.length;
        var maxRow = session.getLength();
        var startRow = row;
        var endRow = row;

        while (++row < maxRow) {
            var level = session.getLine(row).search(re);

            if (level == -1)
                continue;

            if (level <= startLevel)
                break;

            endRow = row;
        }

        if (endRow > startRow) {
            var endColumn = session.getLine(endRow).length;
            return new Range(startRow, startColumn, endRow, endColumn);
        }
    };

    this.openingBracketBlock = function(session, bracket, row, column, typeRe) {
        var start = {row: row, column: column + 1};
        var end = session.$findClosingBracket(bracket, start, typeRe);
        if (!end)
            return;

        var fw = session.foldWidgets[end.row];
        if (fw == null)
            fw = this.getFoldWidget(session, end.row);

        if (fw == "start" && end.row > start.row) {
            end.row --;
            end.column = session.getLine(end.row).length;
        }
        return Range.fromPoints(start, end);
    };

    this.closingBracketBlock = function(session, bracket, row, column, typeRe) {
        var end = {row: row, column: column};
        var start = session.$findOpeningBracket(bracket, end);

        if (!start)
            return;

        start.column++;
        end.column--;

        return  Range.fromPoints(start, end);
    };
}).call(FoldMode.prototype);

});

ace.define('ace/theme/textmate', ["require", 'exports', 'module' , 'ace/lib/dom'], function(acequire, exports, module) {


exports.isDark = false;
exports.cssClass = "ace-tm";
exports.cssText = ".ace-tm .ace_gutter {\
background: #f0f0f0;\
color: #333;\
}\
.ace-tm .ace_print-margin {\
width: 1px;\
background: #e8e8e8;\
}\
.ace-tm .ace_fold {\
background-color: #6B72E6;\
}\
.ace-tm .ace_scroller {\
background-color: #FFFFFF;\
}\
.ace-tm .ace_cursor {\
border-left: 2px solid black;\
}\
.ace-tm .ace_overwrite-cursors .ace_cursor {\
border-left: 0px;\
border-bottom: 1px solid black;\
}\
.ace-tm .ace_invisible {\
color: rgb(191, 191, 191);\
}\
.ace-tm .ace_storage,\
.ace-tm .ace_keyword {\
color: blue;\
}\
.ace-tm .ace_constant {\
color: rgb(197, 6, 11);\
}\
.ace-tm .ace_constant.ace_buildin {\
color: rgb(88, 72, 246);\
}\
.ace-tm .ace_constant.ace_language {\
color: rgb(88, 92, 246);\
}\
.ace-tm .ace_constant.ace_library {\
color: rgb(6, 150, 14);\
}\
.ace-tm .ace_invalid {\
background-color: rgba(255, 0, 0, 0.1);\
color: red;\
}\
.ace-tm .ace_support.ace_function {\
color: rgb(60, 76, 114);\
}\
.ace-tm .ace_support.ace_constant {\
color: rgb(6, 150, 14);\
}\
.ace-tm .ace_support.ace_type,\
.ace-tm .ace_support.ace_class {\
color: rgb(109, 121, 222);\
}\
.ace-tm .ace_keyword.ace_operator {\
color: rgb(104, 118, 135);\
}\
.ace-tm .ace_string {\
color: rgb(3, 106, 7);\
}\
.ace-tm .ace_comment {\
color: rgb(76, 136, 107);\
}\
.ace-tm .ace_comment.ace_doc {\
color: rgb(0, 102, 255);\
}\
.ace-tm .ace_comment.ace_doc.ace_tag {\
color: rgb(128, 159, 191);\
}\
.ace-tm .ace_constant.ace_numeric {\
color: rgb(0, 0, 205);\
}\
.ace-tm .ace_variable {\
color: rgb(49, 132, 149);\
}\
.ace-tm .ace_xml-pe {\
color: rgb(104, 104, 91);\
}\
.ace-tm .ace_entity.ace_name.ace_function {\
color: #0000A2;\
}\
.ace-tm .ace_markup.ace_heading {\
color: rgb(12, 7, 255);\
}\
.ace-tm .ace_markup.ace_list {\
color:rgb(185, 6, 144);\
}\
.ace-tm .ace_meta.ace_tag {\
color:rgb(0, 22, 142);\
}\
.ace-tm .ace_string.ace_regex {\
color: rgb(255, 0, 0)\
}\
.ace-tm .ace_marker-layer .ace_selection {\
background: rgb(181, 213, 255);\
}\
.ace-tm.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px white;\
border-radius: 2px;\
}\
.ace-tm .ace_marker-layer .ace_step {\
background: rgb(252, 255, 0);\
}\
.ace-tm .ace_marker-layer .ace_stack {\
background: rgb(164, 229, 101);\
}\
.ace-tm .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgb(192, 192, 192);\
}\
.ace-tm .ace_marker-layer .ace_active-line {\
background: rgba(0, 0, 0, 0.07);\
}\
.ace-tm .ace_gutter-active-line {\
background-color : #dcdcdc;\
}\
.ace-tm .ace_marker-layer .ace_selected-word {\
background: rgb(250, 250, 255);\
border: 1px solid rgb(200, 200, 250);\
}\
.ace-tm .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y;\
}\
";

var dom = acequire("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
;
            (function() {
                ace.acequire(["ace/ace"], function(a) {
                    a && a.config.init();
                    if (!window.ace)
                        window.ace = {};
                    for (var key in a) if (a.hasOwnProperty(key))
                        ace[key] = a[key];
                });
            })();
        
module.exports = window.ace.acequire("ace/ace");