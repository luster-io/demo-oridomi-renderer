(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/** @jsx React.DOM */

var Physics = require('impulse')
var OriDomi = require('oridomi')
var folded = new OriDomi(document.querySelector('.cover'), { vPanels: 5, speed: 0, ripple: 0, touchEnabled: false, perspective: 800 })
var lastPercent = 1
folded.accordion(0)

var phys = new Physics(function(x) {
  folded.accordion(Math.acos(x) * (180 / Math.PI))
})

phys.position(1, 0)

var startX
  , width = window.innerWidth
  , interaction
  , mousedown = false

window.addEventListener('contextmenu', function(evt) {
  evt.preventDefault()
})

window.addEventListener('touchstart', start)
window.addEventListener('mousedown', start)

window.addEventListener('touchmove', move)
window.addEventListener('mousemove', move)

window.addEventListener('touchend', end)
window.addEventListener('mouseup', end)

function pageX(evt) {
  return evt.touches && evt.touches[0].pageX || evt.pageX
}

function start(evt) {
  var percent = phys.position().x
  mousedown = true
  interaction = phys.interact()
  interaction.start()

  if(percent <= 0) percent = .1

  startX = pageX(evt) / percent
}

function move(evt) {
  if(!mousedown) return
  evt.preventDefault()
  var delta = pageX(evt)
    , percentMoved = delta / startX

  if(percentMoved > 1) percentMoved = 1
  interaction.position(percentMoved)
}

function end(evt) {
  if(!mousedown) return
  mousedown = false
  evt.preventDefault()
  interaction.end()
  var to = (phys.direction('left')) ? 0 : 1
  phys.accelerate({ bounce: true, acceleration: 3, minBounceDistance: 0, bouceAcceleration: 6, damping: .2 }).to(to).start()
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/fake_3ce56c0a.js","/")
},{"buffer":2,"impulse":13,"oMfpAn":5,"oridomi":33}],2:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    for (i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
      'list should be an Array.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function _asciiWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function _utf16leWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = _asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = _binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = _base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = _asciiSlice(self, start, end)
      break
    case 'binary':
      ret = _binarySlice(self, start, end)
      break
    case 'base64':
      ret = _base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++)
      target[i + target_start] = this[i + start]
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function _base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function _utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i+1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1)
        buf[i] = this[i]
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/index.js","/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer")
},{"base64-js":3,"buffer":2,"ieee754":4,"oMfpAn":5}],3:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js","/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib")
},{"buffer":2,"oMfpAn":5}],4:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js","/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/ieee754")
},{"buffer":2,"oMfpAn":5}],5:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/process/browser.js","/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/process")
},{"buffer":2,"oMfpAn":5}],6:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Body = require('./body')
var simulation = require('./simulation')
var Boundary = require('./boundary')
var Animation = require('./animation')
var Vector = require('./vector')
var height = require('./util').height

var Accelerate = module.exports = Animation({
  defaultOptions: {
    acceleration: 1000,
    bounce: false,
    minBounceDistance: 5,
    damping: 0.2,
    restitution: 0.2
  },

  onStart: function(velocity, from, to, opts, update, done) {
    var direction = to.sub(from).normalize()
    var acceleration = direction.mult(opts.acceleration)
    var bounceAcceleration = direction.mult(opts.bounceAcceleration || opts.acceleration)
    var boundary = Boundary({
      left: (to.x > from.x) ? -Infinity : to.x,
      right: (to.x > from.x) ? to.x : Infinity,
      top: (to.y > from.y) ? -Infinity : to.y,
      bottom: (to.y > from.y) ? to.y : Infinity
    })
    var bouncing

    if(to.sub(from).norm() < .001 && velocity.norm() < .001) {
      return update.done(to, velocity)
    }

    var restitution = opts.restitution || opts.damping // TODO remove damping

    var body = this._body = Body(velocity, from, {
      accelerate: function(s, t) {
        if(bouncing)
          return bounceAcceleration
        else
          return acceleration
      },
      update: function(position, velocity) {
        if(boundary.contains(position)) {
          update.state(position, velocity)
        } else {
          if(opts.bounce &&
             Math.abs(height(bounceAcceleration.norm(), velocity.norm() * restitution, 0)) > opts.minBounceDistance) {
              bouncing = true
              body.position = Vector(to)
              body.velocity.selfMult(-opts.damping)
              update.state(to, body.velocity)
          } else {
            update.done(to, velocity)
          }
        }
      }
    })
    simulation.addBody(this._body)
  },
  onEnd: function() {
    simulation.removeBody(this._body)
  }
})

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/accelerate.js","/../../node_modules/impulse/lib")
},{"./animation":7,"./body":9,"./boundary":10,"./simulation":16,"./util":18,"./vector":19,"buffer":2,"oMfpAn":5}],7:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var defaults = require('lodash.defaults')
  , Promise = window.Promise || require('promise')
  , Boundary = require('./boundary')
  , Vector = require('./vector')
  , Emitter = require('component-emitter')

var proto = {
  to: function(x, y) {
    if(x instanceof Boundary)
      this._to = x
    else
      this._to = Vector(x, y)
    return this
  },

  velocity: function(x, y) {
    this._velocity = Vector(x, y)
    return this
  },

  from: function(x, y) {
    this._from = Vector(x, y)
    return this
  },

  _updateState: function(position, velocity) {
    this._phys.position(position)
    this._phys.velocity(velocity)
  },

  cancel: function() {
    this._onEnd()
    this._running = false
    this._reject()
  },

  running: function() {
    return this._running || false
  },

  start: function() {
    var that = this
      , from = (this._from) ? this._from : this._phys.position()
      , to = (this._to) ? this._to : this._phys.position()
      , velocity = (this._velocity) ? this._velocity : this._phys.velocity()
      , opts = defaults({}, this._opts || {}, this._defaultOpts)

    var update = {
      state: function(position, velocity) {
        that._updateState(position, velocity)
      },
      done: function(position, velocity) {
        that._updateState(position, velocity)
        that._onEnd()
        that._running = false
        that._resolve({ position: position, velocity: velocity })
      },
      cancel: function(position, velocity) {
        that._updateState(position, velocity)
        that._onEnd()
        that._running = false
        that._reject()
      }
    }
    this._phys._startAnimation(this)

    this._running = true
    if(to instanceof Boundary)
      to = to.nearestIntersect(from, velocity)
    this._onStart(velocity, from, to, opts, update)

    return that._ended
  }
}

function Animation(callbacks) {
  var animation = function(phys, opts) {
    var that = this
    this._opts = opts
    this._phys = phys
    this._onStart = callbacks.onStart
    this._onEnd = callbacks.onEnd
    this._defaultOpts = callbacks.defaultOptions

    this._ended = new Promise(function(resolve, reject) {
      that._resolve = resolve
      that._reject = reject
    })

    this.start = this.start.bind(this)
  }

  Emitter(animation.prototype)
  animation.prototype = proto

  return animation
}





module.exports = Animation

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/animation.js","/../../node_modules/impulse/lib")
},{"./boundary":10,"./vector":19,"buffer":2,"component-emitter":20,"lodash.defaults":21,"oMfpAn":5,"promise":28}],8:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var defaults = require('lodash.defaults')
  , Vector = require('./vector')
  , simulation = require('./simulation')
  , Body = require('./body')

var defaultOptions = {
  tension: 100,
  damping: 10,
  seperation: 0,
  offset: { x: 0, y: 0 }
}

module.exports = AttachSpring
function AttachSpring(phys, attachment, opts) {
  this._phys = phys
  this._opts = defaults({}, opts || {}, defaultOptions)
  this._position = phys.position()
  this._velocity = phys.velocity()
  if(typeof attachment.position === 'function')
    this._attachment = attachment.position.bind(attachment)
  else
    this._attachment = attachment
}

AttachSpring.prototype.position = function(x, y) {
  if(arguments.length === 0) {
      return this._position
  }
  if(this._body)
    this._body.position = this._position = Vector(x, y)
  else
    this._position = Vector(x, y)
}

AttachSpring.prototype.velocity = function(x, y) {
  if(this._body)
    this._body.velocity = this._velocity = Vector(x, y)
  else
    this._velocity = Vector(x, y)
}

AttachSpring.prototype.cancel = function(x, y) {
  this._running = false
  simulation.removeBody(this._body)
}

AttachSpring.prototype.stop = function(x, y) {
  this._running = false
  simulation.removeBody(this._body)
}

AttachSpring.prototype.running = function(x, y) {
  return this._running
}

window.unit = 0
AttachSpring.prototype.start = function() {
  var attachment = this._attachment
    , opts = this._opts
    , phys = this._phys
    , velocity = this._velocity
    , position = this._position
    , that = this

  phys._startAnimation(this)

  this._running = true

  var body = this._body = Body(velocity, position, {
    accelerate: function(state, t) {
      var distVec = state.position.selfSub(attachment())
        , dist = distVec.norm()
        , distNorm = distVec.normalize()

      if(distNorm.x === 0 && distNorm.y === 0) {
        distNorm.x = distNorm.y = 1
        distNorm.normalize()
      }
      var accel = distNorm
        .selfMult(-opts.tension)
        .selfMult(dist - opts.seperation)
        .selfSub(state.velocity.selfMult(opts.damping))

      return accel
    },
    update: function(position, velocity) {
      that._position = body.position
      that._velocity = body.velocity
      if(opts.offset) {
        var pos = position.add(opts.offset)
        phys.position(pos)
      } else {
        phys.position(position)
      }
      phys.velocity(velocity)
    }
  })
  simulation.addBody(body)
  return this
}
}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/attach-spring.js","/../../node_modules/impulse/lib")
},{"./body":9,"./simulation":16,"./vector":19,"buffer":2,"lodash.defaults":21,"oMfpAn":5}],9:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Vector = require('./vector')

module.exports = Body

function Body(vel, from, fns) {
  if(!(this instanceof Body)) return new Body(vel, from, fns)

  this.previousPosition = this.position = Vector(from)
  this.velocity = Vector(vel)
  this._fns = fns
}

Body.prototype.update = function(alpha) {
  var pos = this.previousPosition.clone().lerp(this.position, alpha)
  this._fns.update(pos, this.velocity)
}

Body.prototype.accelerate = function(state, t) {
  return this._fns.accelerate(state, t)
}

Body.prototype.atRest = function() {
  return this.velocity.norm() < .01
}

Body.prototype.atPosition = function(pos) {
  //return whether the distance between this.position and pos is less than .1
  return this.position.sub(Vector(pos)).norm() < .01
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/body.js","/../../node_modules/impulse/lib")
},{"./vector":19,"buffer":2,"oMfpAn":5}],10:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Vector = require('./vector')
module.exports = Boundary

function pointBetween(p, p1, p2) {
  return p >= p1 && p <= p2
}

function yIntersect(y, point, direction) {
  var factor = (y - point.y) / direction.y
  return point.add(direction.clone().mult(factor))
}

function xIntersect(x, point, direction) {
  var factor = (x - point.x) / direction.x
  return point.add(direction.clone().mult(factor))
}

Boundary.prototype.applyDamping = function(position, damping) {
  var x = position.x
    , y = position.y

  if(x < this.left)
    x = this.left - (this.left - x) * damping

  if(y < this.top)
    y = this.top - (this.top - y) * damping

  if(x > this.right)
    x = this.right - (this.right - x) * damping

  if(y > this.bottom)
    y = this.bottom - (this.bottom - y) * damping

  return Vector(x, y)
}

function Boundary(boundary) {
  if(!(this instanceof Boundary))
    return new Boundary(boundary)

  this.left = (typeof boundary.left !== 'undefined') ? boundary.left : -Infinity
  this.right = (typeof boundary.right !== 'undefined') ? boundary.right : Infinity
  this.top = (typeof boundary.top !== 'undefined') ? boundary.top : -Infinity
  this.bottom = (typeof boundary.bottom !== 'undefined') ? boundary.bottom : Infinity
}

Boundary.prototype.contains = function(pt) {
  return pt.x >= this.left &&
         pt.x <= this.right &&
         pt.y >= this.top &&
         pt.y <= this.bottom
}

Boundary.prototype.nearestIntersect = function(point, velocity) {
  var direction = Vector(velocity).normalize()
    , point = Vector(point)
    , isect
    , distX
    , distY

  if(velocity.y < 0)
    isect = yIntersect(this.top, point, direction)
  if(velocity.y > 0)
    isect = yIntersect(this.bottom, point, direction)

  if(isect && pointBetween(isect.x, this.left, this.right))
    return isect

  if(velocity.x < 0)
    isect = xIntersect(this.left, point, direction)
  if(velocity.x > 0)
    isect = xIntersect(this.right, point, direction)

  if(isect && pointBetween(isect.y, this.top, this.bottom))
    return isect

  //if the velocity is zero, or it didn't intersect any lines (outside the box)
  //just send it it the nearest boundary
  distX = (Math.abs(point.x - this.left) < Math.abs(point.x - this.right)) ? this.left : this.right
  distY = (Math.abs(point.y - this.top) < Math.abs(point.y - this.bottom)) ? this.top : this.bottom

  return (distX < distY) ? Vector(distX, point.y) : Vector(point.x, distY)
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/boundary.js","/../../node_modules/impulse/lib")
},{"./vector":19,"buffer":2,"oMfpAn":5}],11:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Body = require('./body')
var simulation = require('./simulation')
var Boundary = require('./boundary')
var Animation = require('./animation')

var Decelerate = module.exports = Animation({
  defaultOptions: {
    deceleration: 400
  },
  onStart: function(velocity, from, to, opts, update, done) {
    var direction = to.sub(from).normalize()
      , deceleration = direction.mult(opts.deceleration).negate()
      , boundary = Boundary({
      left: Math.min(to.x, from.x),
      right: Math.max(to.x, from.x),
      top: Math.min(to.y, from.y),
      bottom: Math.max(to.y, from.y)
    })

    velocity = direction.mult(velocity.norm())

    this._body = Body(velocity, from, {
      accelerate: function(s, t) {
        return deceleration
      },
      update: function(position, velocity) {
        if(!direction.directionEqual(velocity)) {
          update.cancel(position, { x: 0, y: 0 })
        } else if(boundary.contains(position)) {
          update.state(position, velocity)
        } else {
          update.done(to, velocity)
        }
      }
    })
    simulation.addBody(this._body)
  },

  onEnd: function() {
    simulation.removeBody(this._body)
  }
})

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/decelerate.js","/../../node_modules/impulse/lib")
},{"./animation":7,"./body":9,"./boundary":10,"./simulation":16,"buffer":2,"oMfpAn":5}],12:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Emitter = require('component-emitter')
  , defaults = require('lodash.defaults')

var defaultOpts = {}

module.exports = Drag

function Drag(phys, opts, start) {
  var handles

  this._phys = phys
  if(typeof opts === 'function') {
    this._startFn = opts
    opts = {}
  } else {
    this._startFn = start
  }

  this._opts = defaults({}, defaultOpts, opts)

  //Warn of deprecated option
  if(this._opts.boundry){
    console.warn("Warning: Misspelled option 'boundry' is being deprecated. Please use 'boundary' instead.");
    this._opts.boundary = this._opts.boundry;
    delete this._opts.boundry;
  }

  handles = this._opts.handle


  if(handles && !handles.length) {
    handles = [handles]
  } else if(handles && handles.length) {
    handles = [].slice.call(handles)
  } else {
    handles = phys.els
  }
  handles.forEach(this._setupHandle, this)
}

Emitter(Drag.prototype)

Drag.prototype.moved = function() {
  return (this._interaction.distance() > 10)
}

Drag.prototype._setupHandle = function(el) {
  //start events
  el.addEventListener('touchstart', this._start.bind(this))
  el.addEventListener('mousedown', this._start.bind(this))

  //move events
  el.addEventListener('touchmove', this._move.bind(this))
  //apply the move event to the window, so it keeps moving,
  //event if the handle doesn't
  window.addEventListener('mousemove', this._move.bind(this))

  //end events
  el.addEventListener('touchend', this._end.bind(this))
  window.addEventListener('mouseup', this._end.bind(this))
}

Drag.prototype._start = function(evt) {
  this._startTime = Date.now()
  evt.preventDefault()
  this._mousedown = true
  this._interaction = this._phys.interact({
    boundary: this._opts.boundary,
    damping: this._opts.damping,
    direction: this._opts.direction
  })
  var promise = this._interaction.start(evt)
  this._startFn && this._startFn(promise)
  this.emit('start', evt)
}

Drag.prototype._move = function(evt) {
  if(!this._mousedown) return
  evt.preventDefault()

  this._interaction.update(evt)
  this.emit('move', evt)
}

Drag.prototype._end = function(evt) {
  if(!this._mousedown) return
  evt.preventDefault()

  this._mousedown = false

  this._interaction.end()
  this.emit('end', evt)
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/drag.js","/../../node_modules/impulse/lib")
},{"buffer":2,"component-emitter":20,"lodash.defaults":21,"oMfpAn":5}],13:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var simulation = require('./simulation')
var Vector = require('./vector')
var Renderer = require('./renderer')
var defaults = require('lodash.defaults')
var Spring = require('./spring')
var AttachSpring = require('./attach-spring')
var Decelerate = require('./decelerate')
var Accelerate = require('./accelerate')
var Drag = require('./drag')
var Interact = require('./interact')
var Boundary = require('./boundary')
var Promise = window.Promise || require('promise')

module.exports = Physics

function Physics(rendererOrEls) {
  if(!(this instanceof Physics)) {
    return new Physics(rendererOrEls)
  }
  if(typeof rendererOrEls === 'function') {
    this._render = rendererOrEls
    this.els = []
  } else {
    if(rendererOrEls.length)
      this.els = [].slice.call(rendererOrEls)
    else
      this.els = [rendererOrEls]

    this._renderer = new Renderer(this.els)
    this._render = this._renderer.update.bind(this._renderer)
  }

  this._position = Vector(0, 0)
  this._velocity = Vector(0, 0)
}

Physics.Boundary = Boundary
Physics.Boundry = Boundary
Physics.Vector = Vector
Physics.Promise = Promise

Physics.prototype.style = function() {
  this._renderer.style.apply(this._renderer, arguments)
  return this
}

Physics.prototype.visible = function() {
  this._renderer.visible.apply(this._renderer, arguments)
  return this
}

Physics.prototype.direction = function(d) {
  var velocity = this.velocity()
    , h, v, c

  if(velocity.x < 0)      h = 'left'
  else if(velocity.x > 0) h = 'right'

  if(velocity.y < 0)      v = 'up'
  else if(velocity.y > 0) v = 'down'

  var c = h + (v || '').toUpperCase()

  return d === h || d === v || d === c
}

Physics.prototype.atRest = function() {
  var velocity = this.velocity()
  return velocity.x === 0 && velocity.y === 0
}

Physics.prototype._startAnimation = function(animation) {
  if(this._currentAnimation && this._currentAnimation.running()) {
    this._currentAnimation.cancel()
  }
  this._currentAnimation = animation
}

Physics.prototype.velocity = function(x, y) {
  if(!arguments.length) return this._velocity
  this._velocity = Vector(x, y)
  return this
}

Physics.prototype.position = function(x, y) {
  if(!arguments.length) return this._position.clone()
  this._position = Vector(x, y)
  this._render(this._position.x, this._position.y)
  return this
}

Physics.prototype.interact = function(opts) {
  return new Interact(this, opts)
}

Physics.prototype.drag = function(opts, start) {
  return new Drag(this, opts, start)
}

Physics.prototype.spring = function(opts) {
  return new Spring(this, opts)
}

Physics.prototype.decelerate = function(opts) {
  return new Decelerate(this, opts)
}

Physics.prototype.accelerate = function(opts) {
  return new Accelerate(this, opts)
}

Physics.prototype.attachSpring = function(attachment, opts) {
  return new AttachSpring(this, attachment, opts)
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/index.js","/../../node_modules/impulse/lib")
},{"./accelerate":6,"./attach-spring":8,"./boundary":10,"./decelerate":11,"./drag":12,"./interact":14,"./renderer":15,"./simulation":16,"./spring":17,"./vector":19,"buffer":2,"lodash.defaults":21,"oMfpAn":5,"promise":28}],14:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var defaults = require('lodash.defaults')
var Velocity = require('touch-velocity')
var Vector = require('./vector')
var Promise = require('promise')
var util = require('./util')
var Boundary = require('./boundary')

module.exports = Interact

var defaultOpts = {
  boundary: Boundary({}),
  damping: 0,
  direction: 'both'
}

function Interact(phys, opts) {
  this._phys = phys
  this._running = false
  this._opts = defaults({}, opts, defaultOpts)

  //Warn of deprecated option
  if(this._opts.boundry){
    console.warn("Warning: Misspelled option 'boundry' is being deprecated. Please use 'boundary' instead.");
    this._opts.boundary = this._opts.boundry;
    delete this._opts.boundry;
  }
}

Interact.prototype.position = function(x, y) {
  var direction = this._opts.direction
    , boundary = this._opts.boundary
    , pos = Vector(x, y)

  if(direction !== 'both' && direction !== 'horizontal') pos.x = 0
  if(direction !== 'both' && direction !== 'vertical') pos.y = 0

  this._veloX.updatePosition(pos.x)
  this._veloY.updatePosition(pos.y)

  this._phys.velocity(this._veloX.getVelocity(), this._veloY.getVelocity())

  pos = boundary.applyDamping(pos, this._opts.damping)

  this._phys.position(pos)

  return this
}

Interact.prototype.update = function(evt) {
  //for jquery and hammer.js
  evt = evt.originalEvent || evt
  var position = util.eventVector(evt).sub(this._startPosition)

  this.position(position)
  return this
}

Interact.prototype.start = function(evt) {
  var that = this
    , evtPosition = evt && util.eventVector(evt)
    , position = this._phys.position()

  this._running = true
  this._phys._startAnimation(this)
  this._startPosition = evt && evtPosition.sub(position)
  this._initialPosition = this._phys.position()

  this._veloX = new Velocity()
  this._veloY = new Velocity()

  this.position(position)

  return this._ended = new Promise(function(res, rej) {
    that._resolve = res
    that._reject = rej
  })
}

Interact.prototype.distance = function() {
  return this._initialPosition.sub(this._phys.position()).norm()
}

Interact.prototype.cancel = function() {
  this._running = false
  this._reject(new Error('Canceled the interaction'))
}

Interact.prototype.running = function() {
  return this._running
}

Interact.prototype.end = function() {
  this._phys.velocity(this._veloX.getVelocity(), this._veloY.getVelocity())
  this._resolve({ velocity: this._phys.velocity(), position: this._phys.position() })
  return this._ended
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/interact.js","/../../node_modules/impulse/lib")
},{"./boundary":10,"./util":18,"./vector":19,"buffer":2,"lodash.defaults":21,"oMfpAn":5,"promise":28,"touch-velocity":32}],15:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var prefixes = ['Webkit', 'Moz', 'Ms', 'ms']
var calls = []
var transformProp
var raf = require('raf')

function loop() {
  raf(function() {
    loop()
    for(var i = calls.length - 1; i >= 0; i--) {
      calls[i]()
    }
  })
}
loop()

function prefixed(prop) {
  var prefixed
  for (var i = 0; i < prefixes.length; i++) {
    prefixed = prefixes[i] + prop[0].toUpperCase() + prop.slice(1)
    if(typeof document.body.style[prefixed] !== 'undefined')
      return prefixed
  }
  return prop
}

var transformsProperties = ['translate', 'translateX', 'translateY', 'translateZ',
                  'rotate', 'rotateX', 'rotateY', 'rotate3d', 'rotateZ',
                  'scale', 'scaleX', 'scaleY', 'scaleZ',
                  'skew', 'skewX', 'skewY', 'skewZ']

module.exports = Renderer

function Renderer(els) {
  if(typeof els.length === 'undefined')
    els = [els]
  this.els = els
  this.styles = {}
  this.invisibleEls = []
  calls.push(this.render.bind(this))
}

Renderer.prototype.render = function() {
  if(!this.currentPosition) return

  if(!transformProp)
    transformProp = prefixed('transform')
  var transformsToApply
    , els = this.els
    , position = this.currentPosition
    , styles = this.styles
    , value
    , props = Object.keys(styles)
    , elsLength = els.length
    , propsLength = props.length
    , i, j
    , transforms

  for(i = 0 ; i < elsLength ; i++) {
    transformsToApply = []
    if(this.visibleFn && !this.visibleFn(position, i)) {
      if(!this.invisibleEls[i]) {
        els[i].style.webkitTransform = 'translate3d(0, -99999px, 0)'
      }
      this.invisibleEls[i] = true
    } else {
      this.invisibleEls[i] = false
      for (j = 0; j < propsLength; j++) {
        prop = props[j]
        value = (typeof styles[prop] === 'function') ? styles[prop](position.x, position.y, i) : styles[prop]

        if(transformsProperties.indexOf(prop) !== -1) {
          transformsToApply.push(prop + '(' + value + ')')
        } else {
          els[i].style[prop] = value
        }
      }
      transforms = transformsToApply.join(' ')
      transforms += ' translateZ(0)'
      els[i].style[transformProp] = transforms
    }
  }
}

Renderer.prototype.style = function(property, value) {
  if(typeof property === 'object') {
    for(prop in property) {
      if(property.hasOwnProperty(prop)) {
        this.style(prop, property[prop])
      }
    }
  }
  this.styles[property] = value
  return this
}

Renderer.prototype.visible = function(isVisible) {
  this.visibleFn = isVisible
  return this
}
Renderer.prototype.update = function(x, y) {
  this.currentPosition = { x: x, y: y }
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/renderer.js","/../../node_modules/impulse/lib")
},{"buffer":2,"oMfpAn":5,"raf":30}],16:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Vector = require('./vector')
  , bodies = []
  , raf = require('raf')

function increment(a, b, c, d) {
  var vec = Vector(0, 0)
  vec.selfAdd(a)
  vec.selfAdd(b.add(c).selfMult(2))
  vec.selfAdd(d)
  vec.selfMult(1/6)
  return vec
}

var positionVec = Vector(0, 0)
var velocityVec = Vector(0, 0)

function evaluate(initial, t, dt, d) {
  var state = {}

  state.position = positionVec.setv(d.dx).selfMult(dt).selfAdd(initial.position)
  state.velocity = velocityVec.setv(d.dv).selfMult(dt).selfAdd(initial.velocity)

  var next = {
    dx: state.velocity.clone(),
    dv: initial.accelerate(state, t).clone()
  }
  return next
}

var der = { dx: Vector(0, 0), dv: Vector(0, 0) }
function integrate(state, t, dt) {
    var a = evaluate( state, t, 0, der )
    var b = evaluate( state, t, dt*0.5, a )
    var c = evaluate( state, t, dt*0.5, b )
    var d = evaluate( state, t, dt, c )

    var dxdt = increment(a.dx,b.dx,c.dx,d.dx)
      , dvdt = increment(a.dv,b.dv,c.dv,d.dv)

    state.position.selfAdd(dxdt.selfMult(dt));
    state.velocity.selfAdd(dvdt.selfMult(dt));
}

var currentTime = Date.now() / 1000
  , accumulator = 0
  , t = 0
  , dt = 0.015

function simulate() {
  raf(function() {
    simulate()
    var newTime = Date.now() / 1000
    var frameTime = newTime - currentTime
    currentTime = newTime

    if(frameTime > 0.05)
      frameTime = 0.05


    accumulator += frameTime

    var j = 0

    while(accumulator >= dt) {
      for(var i = 0 ; i < bodies.length ; i++) {
        bodies[i].previousPosition = bodies[i].position.clone()
        integrate(bodies[i], t, dt)
      }
      t += dt
      accumulator -= dt
    }

    for(var i = 0 ; i < bodies.length ; i++) {
      bodies[i].update(accumulator / dt)
    }
  }, 16)
}
simulate()

module.exports.addBody = function(body) {
  bodies.push(body)
  return body
}

module.exports.removeBody = function(body) {
  var index = bodies.indexOf(body)
  if(index >= 0)
    bodies.splice(index, 1)
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/simulation.js","/../../node_modules/impulse/lib")
},{"./vector":19,"buffer":2,"oMfpAn":5,"raf":30}],17:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Body = require('./body')
var simulation = require('./simulation')
var Boundary = require('./boundary')
var Animation = require('./animation')

var Spring = module.exports = Animation({
  defaultOptions: {
    tension: 100,
    damping: 10
  },
  onStart: function(velocity, from, to, opts, update) {
    var body = this._body = new Body(velocity, from, {
      accelerate: function(state, t) {
        return state.position.selfSub(to)
          .selfMult(-opts.tension)
          .selfSub(state.velocity.mult(opts.damping))
      },
      update: function(position, velocity) {
        if(body.atRest() && body.atPosition(to)) {
          update.done(to, { x: 0, y: 0 })
        } else {
          update.state(position, velocity)
        }
      }
    })
    simulation.addBody(this._body)
  },
  onEnd: function() {
    simulation.removeBody(this._body)
  }
})

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/spring.js","/../../node_modules/impulse/lib")
},{"./animation":7,"./body":9,"./boundary":10,"./simulation":16,"buffer":2,"oMfpAn":5}],18:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Vector = require('./vector')
function vertex(a, b) {
  return -b / (2 * a)
}

function height(a, b, c) {
  return parabola(a, b, c, vertex(a, b))
}

function parabola(a, b, c, x) {
  return a * x * x + b * x + c
}

function eventVector(evt) {
  return Vector({
    x: evt.touches && evt.touches[0].pageX || evt.pageX,
    y: evt.touches && evt.touches[0].pageY || evt.pageY
  })
}

module.exports.height = height
module.exports.eventVector = eventVector
}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/util.js","/../../node_modules/impulse/lib")
},{"./vector":19,"buffer":2,"oMfpAn":5}],19:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
module.exports = Vector

function Vector(x, y) {
  if(!(this instanceof Vector))
    return new Vector(x, y)

  if(typeof x.x !== 'undefined') {
    this.x = x.x
    this.y = x.y
  } else {
    this.x = x || 0
    this.y = y || 0
  }
}

Vector.prototype.equals = function(vec) {
  return vec.x === this.x && vec.y === this.y
}

Vector.prototype.directionEqual = function(vec) {
  return vec.x > 0 === this.x > 0 && this.y > 0 === vec.y > 0
}

Vector.prototype.dot = function (vec) {
  return this.x * vec.x + this.y * vec.y;
}

Vector.prototype.negate = function() {
  return Vector(this.x, this.y).mult(-1)
}

Vector.prototype.norm = function() {
  return Math.sqrt(this.normsq())
}

Vector.prototype.clone = function() {
  return Vector(this.x, this.y)
}

Vector.prototype.normsq = function() {
  return this.x * this.x + this.y * this.y
}

Vector.prototype.normalize = function() {
    var magnitude = this.norm()

    if(magnitude === 0) {
        return this
    }

    magnitude = 1 / magnitude

    this.x *= magnitude
    this.y *= magnitude

    return this
}

Vector.prototype.mult = function(x, y) {
  if(x instanceof Vector) {
    return new Vector(x.x * this.x, x.y * this.y)
  }
  if(typeof y === 'undefined') { //scalar
    return new Vector(x * this.x, x * this.y)
  }
  return new Vector(x * this.x, y * this.y)
}

Vector.prototype.selfMult = function(x, y) {
  if(x instanceof Vector) {
    this.x *= x.x
    this.y *= x.y
    return this
  }
  if(typeof y === 'undefined') { //scalar
    this.x *= x
    this.y *= x
    return this
  }
  this.x *= x
  this.y *= y
  return this
}

Vector.prototype.selfAdd = function(x, y) {
  if(typeof x.x !== 'undefined') {
    this.x += x.x
    this.y += x.y
    return this
  }
  if(typeof y === 'undefined') { //scalar
    this.x += x
    this.y += x
    return this
  }
  this.x += x
  this.y += y
  return this
}

Vector.prototype.selfSub = function(x, y) {
  if(typeof x.x !== 'undefined') {
    this.x -= x.x
    this.y -= x.y
    return this
  }
  if(typeof y === 'undefined') { //scalar
    this.x -= x
    this.y -= x
    return this
  }
  this.x -= x
  this.y -= y

  return this
}

Vector.prototype.sub = function(x, y) {

  if(typeof x.x !== 'undefined')
    return new Vector(this.x - x.x, this.y - x.y)

  if(typeof y === 'undefined')//scalar
    return new Vector(this.x - x, this.y - x)

  return new Vector(this.x - x, this.y - y)
}

Vector.prototype.add = function(x, y) {
  if(typeof x.x !== 'undefined') {
    return new Vector(this.x + x.x, this.y + x.y)
  }
  if(typeof y === 'undefined') { //scalar
    return new Vector(this.x + x, this.y + x)
  }
  return new Vector(this.x + x, this.y + y)
}

Vector.prototype.setv = function(vec) {
  this.x = vec.x
  this.y = vec.y
  return this
}

Vector.prototype.lerp = function(vector, alpha) {
  return this.mult(1-alpha).add(vector.mult(alpha))
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/vector.js","/../../node_modules/impulse/lib")
},{"buffer":2,"oMfpAn":5}],20:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/component-emitter/index.js","/../../node_modules/impulse/node_modules/component-emitter")
},{"buffer":2,"oMfpAn":5}],21:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var keys = require('lodash.keys'),
    objectTypes = require('lodash._objecttypes');

/**
 * Assigns own enumerable properties of source object(s) to the destination
 * object for all destination properties that resolve to `undefined`. Once a
 * property is set, additional defaults of the same property will be ignored.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Objects
 * @param {Object} object The destination object.
 * @param {...Object} [source] The source objects.
 * @param- {Object} [guard] Allows working with `_.reduce` without using its
 *  `key` and `object` arguments as sources.
 * @returns {Object} Returns the destination object.
 * @example
 *
 * var object = { 'name': 'barney' };
 * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
 * // => { 'name': 'barney', 'employer': 'slate' }
 */
var defaults = function(object, source, guard) {
  var index, iterable = object, result = iterable;
  if (!iterable) return result;
  var args = arguments,
      argsIndex = 0,
      argsLength = typeof guard == 'number' ? 2 : args.length;
  while (++argsIndex < argsLength) {
    iterable = args[argsIndex];
    if (iterable && objectTypes[typeof iterable]) {
    var ownIndex = -1,
        ownProps = objectTypes[typeof iterable] && keys(iterable),
        length = ownProps ? ownProps.length : 0;

    while (++ownIndex < length) {
      index = ownProps[ownIndex];
      if (typeof result[index] == 'undefined') result[index] = iterable[index];
    }
    }
  }
  return result
};

module.exports = defaults;

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/lodash.defaults/index.js","/../../node_modules/impulse/node_modules/lodash.defaults")
},{"buffer":2,"lodash._objecttypes":22,"lodash.keys":23,"oMfpAn":5}],22:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to determine if values are of the language type Object */
var objectTypes = {
  'boolean': false,
  'function': true,
  'object': true,
  'number': false,
  'string': false,
  'undefined': false
};

module.exports = objectTypes;

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/lodash.defaults/node_modules/lodash._objecttypes/index.js","/../../node_modules/impulse/node_modules/lodash.defaults/node_modules/lodash._objecttypes")
},{"buffer":2,"oMfpAn":5}],23:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = require('lodash._isnative'),
    isObject = require('lodash.isobject'),
    shimKeys = require('lodash._shimkeys');

/* Native method shortcuts for methods with the same name as other `lodash` methods */
var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;

/**
 * Creates an array composed of the own enumerable property names of an object.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns an array of property names.
 * @example
 *
 * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
 * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  if (!isObject(object)) {
    return [];
  }
  return nativeKeys(object);
};

module.exports = keys;

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/lodash.defaults/node_modules/lodash.keys/index.js","/../../node_modules/impulse/node_modules/lodash.defaults/node_modules/lodash.keys")
},{"buffer":2,"lodash._isnative":24,"lodash._shimkeys":25,"lodash.isobject":26,"oMfpAn":5}],24:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/** Used to detect if a method is native */
var reNative = RegExp('^' +
  String(toString)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/toString| for [^\]]+/g, '.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
 */
function isNative(value) {
  return typeof value == 'function' && reNative.test(value);
}

module.exports = isNative;

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/lodash.defaults/node_modules/lodash.keys/node_modules/lodash._isnative/index.js","/../../node_modules/impulse/node_modules/lodash.defaults/node_modules/lodash.keys/node_modules/lodash._isnative")
},{"buffer":2,"oMfpAn":5}],25:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var objectTypes = require('lodash._objecttypes');

/** Used for native method references */
var objectProto = Object.prototype;

/** Native method shortcuts */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which produces an array of the
 * given object's own enumerable property names.
 *
 * @private
 * @type Function
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns an array of property names.
 */
var shimKeys = function(object) {
  var index, iterable = object, result = [];
  if (!iterable) return result;
  if (!(objectTypes[typeof object])) return result;
    for (index in iterable) {
      if (hasOwnProperty.call(iterable, index)) {
        result.push(index);
      }
    }
  return result
};

module.exports = shimKeys;

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/lodash.defaults/node_modules/lodash.keys/node_modules/lodash._shimkeys/index.js","/../../node_modules/impulse/node_modules/lodash.defaults/node_modules/lodash.keys/node_modules/lodash._shimkeys")
},{"buffer":2,"lodash._objecttypes":22,"oMfpAn":5}],26:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var objectTypes = require('lodash._objecttypes');

/**
 * Checks if `value` is the language type of Object.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // check if the value is the ECMAScript language type of Object
  // http://es5.github.io/#x8
  // and avoid a V8 bug
  // http://code.google.com/p/v8/issues/detail?id=2291
  return !!(value && objectTypes[typeof value]);
}

module.exports = isObject;

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/lodash.defaults/node_modules/lodash.keys/node_modules/lodash.isobject/index.js","/../../node_modules/impulse/node_modules/lodash.defaults/node_modules/lodash.keys/node_modules/lodash.isobject")
},{"buffer":2,"lodash._objecttypes":22,"oMfpAn":5}],27:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';

var asap = require('asap')

module.exports = Promise
function Promise(fn) {
  if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new')
  if (typeof fn !== 'function') throw new TypeError('not a function')
  var state = null
  var value = null
  var deferreds = []
  var self = this

  this.then = function(onFulfilled, onRejected) {
    return new Promise(function(resolve, reject) {
      handle(new Handler(onFulfilled, onRejected, resolve, reject))
    })
  }

  function handle(deferred) {
    if (state === null) {
      deferreds.push(deferred)
      return
    }
    asap(function() {
      var cb = state ? deferred.onFulfilled : deferred.onRejected
      if (cb === null) {
        (state ? deferred.resolve : deferred.reject)(value)
        return
      }
      var ret
      try {
        ret = cb(value)
      }
      catch (e) {
        deferred.reject(e)
        return
      }
      deferred.resolve(ret)
    })
  }

  function resolve(newValue) {
    try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.')
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then
        if (typeof then === 'function') {
          doResolve(then.bind(newValue), resolve, reject)
          return
        }
      }
      state = true
      value = newValue
      finale()
    } catch (e) { reject(e) }
  }

  function reject(newValue) {
    state = false
    value = newValue
    finale()
  }

  function finale() {
    for (var i = 0, len = deferreds.length; i < len; i++)
      handle(deferreds[i])
    deferreds = null
  }

  doResolve(fn, resolve, reject)
}


function Handler(onFulfilled, onRejected, resolve, reject){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
  this.onRejected = typeof onRejected === 'function' ? onRejected : null
  this.resolve = resolve
  this.reject = reject
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, onFulfilled, onRejected) {
  var done = false;
  try {
    fn(function (value) {
      if (done) return
      done = true
      onFulfilled(value)
    }, function (reason) {
      if (done) return
      done = true
      onRejected(reason)
    })
  } catch (ex) {
    if (done) return
    done = true
    onRejected(ex)
  }
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/promise/core.js","/../../node_modules/impulse/node_modules/promise")
},{"asap":29,"buffer":2,"oMfpAn":5}],28:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';

//This file contains then/promise specific extensions to the core promise API

var Promise = require('./core.js')
var asap = require('asap')

module.exports = Promise

/* Static Functions */

function ValuePromise(value) {
  this.then = function (onFulfilled) {
    if (typeof onFulfilled !== 'function') return this
    return new Promise(function (resolve, reject) {
      asap(function () {
        try {
          resolve(onFulfilled(value))
        } catch (ex) {
          reject(ex);
        }
      })
    })
  }
}
ValuePromise.prototype = Object.create(Promise.prototype)

var TRUE = new ValuePromise(true)
var FALSE = new ValuePromise(false)
var NULL = new ValuePromise(null)
var UNDEFINED = new ValuePromise(undefined)
var ZERO = new ValuePromise(0)
var EMPTYSTRING = new ValuePromise('')

Promise.resolve = function (value) {
  if (value instanceof Promise) return value

  if (value === null) return NULL
  if (value === undefined) return UNDEFINED
  if (value === true) return TRUE
  if (value === false) return FALSE
  if (value === 0) return ZERO
  if (value === '') return EMPTYSTRING

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then
      if (typeof then === 'function') {
        return new Promise(then.bind(value))
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex)
      })
    }
  }

  return new ValuePromise(value)
}

Promise.from = Promise.cast = function (value) {
  var err = new Error('Promise.from and Promise.cast are deprecated, use Promise.resolve instead')
  err.name = 'Warning'
  console.warn(err.stack)
  return Promise.resolve(value)
}

Promise.denodeify = function (fn, argumentCount) {
  argumentCount = argumentCount || Infinity
  return function () {
    var self = this
    var args = Array.prototype.slice.call(arguments)
    return new Promise(function (resolve, reject) {
      while (args.length && args.length > argumentCount) {
        args.pop()
      }
      args.push(function (err, res) {
        if (err) reject(err)
        else resolve(res)
      })
      fn.apply(self, args)
    })
  }
}
Promise.nodeify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments)
    var callback = typeof args[args.length - 1] === 'function' ? args.pop() : null
    try {
      return fn.apply(this, arguments).nodeify(callback)
    } catch (ex) {
      if (callback === null || typeof callback == 'undefined') {
        return new Promise(function (resolve, reject) { reject(ex) })
      } else {
        asap(function () {
          callback(ex)
        })
      }
    }
  }
}

Promise.all = function () {
  var calledWithArray = arguments.length === 1 && Array.isArray(arguments[0])
  var args = Array.prototype.slice.call(calledWithArray ? arguments[0] : arguments)

  if (!calledWithArray) {
    var err = new Error('Promise.all should be called with a single array, calling it with multiple arguments is deprecated')
    err.name = 'Warning'
    console.warn(err.stack)
  }

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([])
    var remaining = args.length
    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then
          if (typeof then === 'function') {
            then.call(val, function (val) { res(i, val) }, reject)
            return
          }
        }
        args[i] = val
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex)
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i])
    }
  })
}

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) { 
    reject(value);
  });
}

Promise.race = function (values) {
  return new Promise(function (resolve, reject) { 
    values.forEach(function(value){
      Promise.resolve(value).then(resolve, reject);
    })
  });
}

/* Prototype Methods */

Promise.prototype.done = function (onFulfilled, onRejected) {
  var self = arguments.length ? this.then.apply(this, arguments) : this
  self.then(null, function (err) {
    asap(function () {
      throw err
    })
  })
}

Promise.prototype.nodeify = function (callback) {
  if (typeof callback != 'function') return this

  this.then(function (value) {
    asap(function () {
      callback(null, value)
    })
  }, function (err) {
    asap(function () {
      callback(err)
    })
  })
}

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/promise/index.js","/../../node_modules/impulse/node_modules/promise")
},{"./core.js":27,"asap":29,"buffer":2,"oMfpAn":5}],29:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){

// Use the fastest possible means to execute a task in a future turn
// of the event loop.

// linked list of tasks (single, with head node)
var head = {task: void 0, next: null};
var tail = head;
var flushing = false;
var requestFlush = void 0;
var isNodeJS = false;

function flush() {
    /* jshint loopfunc: true */

    while (head.next) {
        head = head.next;
        var task = head.task;
        head.task = void 0;
        var domain = head.domain;

        if (domain) {
            head.domain = void 0;
            domain.enter();
        }

        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function() {
                   throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    flushing = false;
}

if (typeof process !== "undefined" && process.nextTick) {
    // Node.js before 0.9. Note that some fake-Node environments, like the
    // Mocha test runner, introduce a `process` global without a `nextTick`.
    isNodeJS = true;

    requestFlush = function () {
        process.nextTick(flush);
    };

} else if (typeof setImmediate === "function") {
    // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
    if (typeof window !== "undefined") {
        requestFlush = setImmediate.bind(window, flush);
    } else {
        requestFlush = function () {
            setImmediate(flush);
        };
    }

} else if (typeof MessageChannel !== "undefined") {
    // modern browsers
    // http://www.nonblocking.io/2011/06/windownexttick.html
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    requestFlush = function () {
        channel.port2.postMessage(0);
    };

} else {
    // old browsers
    requestFlush = function () {
        setTimeout(flush, 0);
    };
}

function asap(task) {
    tail = tail.next = {
        task: task,
        domain: isNodeJS && process.domain,
        next: null
    };

    if (!flushing) {
        flushing = true;
        requestFlush();
    }
};

module.exports = asap;


}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/promise/node_modules/asap/asap.js","/../../node_modules/impulse/node_modules/promise/node_modules/asap")
},{"buffer":2,"oMfpAn":5}],30:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var now = require('performance-now')
  , global = typeof window === 'undefined' ? {} : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = global['request' + suffix]
  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]
  , native = true

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  native = false

  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  if(!native) {
    return raf.call(global, fn)
  }
  return raf.call(global, function() {
    try{
      fn.apply(this, arguments)
    } catch(e) {
      setTimeout(function() { throw e }, 0)
    }
  })
}
module.exports.cancel = function() {
  caf.apply(global, arguments)
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/raf/index.js","/../../node_modules/impulse/node_modules/raf")
},{"buffer":2,"oMfpAn":5,"performance-now":31}],31:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// Generated by CoffeeScript 1.6.3
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

/*
//@ sourceMappingURL=performance-now.map
*/

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/raf/node_modules/performance-now/lib/performance-now.js","/../../node_modules/impulse/node_modules/raf/node_modules/performance-now/lib")
},{"buffer":2,"oMfpAn":5}],32:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
module.exports = Velocity

function Velocity() {
  this.positionQueue = []
  this.timeQueue = []
}

Velocity.prototype.reset = function() {
  this.positionQueue.splice(0)
  this.timeQueue.splice(0)
}

Velocity.prototype.pruneQueue = function(ms) {
  //pull old values off of the queue
  while(this.timeQueue.length && this.timeQueue[0] < (Date.now() - ms)) {
    this.timeQueue.shift()
    this.positionQueue.shift()
  }
}

Velocity.prototype.updatePosition = function(position) {
  this.positionQueue.push(position)
  this.timeQueue.push(Date.now())
  this.pruneQueue(50)
}

Velocity.prototype.getVelocity = function() {
  this.pruneQueue(1000)
  var length = this.timeQueue.length
  if(length < 2) return 0

  var distance = this.positionQueue[length-1] - this.positionQueue[0]
    , time = (this.timeQueue[length-1] - this.timeQueue[0]) / 1000

  return distance / time
}

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/touch-velocity/index.js","/../../node_modules/impulse/node_modules/touch-velocity")
},{"buffer":2,"oMfpAn":5}],33:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// Generated by CoffeeScript 1.7.1
(function() {
  var $, OriDomi, addStyle, anchorList, anchorListH, anchorListV, baseName, capitalize, cloneEl, createEl, css, defaults, defer, elClasses, getGradient, hideEl, isSupported, k, libName, noOp, prefixList, prep, showEl, styleBuffer, supportWarning, testEl, testProp, v, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  libName = 'OriDomi';

  isSupported = true;

  supportWarning = function(prop) {
    if (typeof console !== "undefined" && console !== null) {
      console.warn("" + libName + ": Missing support for `" + prop + "`.");
    }
    return isSupported = false;
  };

  testProp = function(prop) {
    var full, prefix, _i, _len;
    for (_i = 0, _len = prefixList.length; _i < _len; _i++) {
      prefix = prefixList[_i];
      if ((full = prefix + capitalize(prop)) in testEl.style) {
        return full;
      }
    }
    if (prop in testEl.style) {
      return prop;
    }
    return false;
  };

  addStyle = function(selector, rules) {
    var prop, style, val;
    style = "." + selector + "{";
    for (prop in rules) {
      val = rules[prop];
      if (prop in css) {
        prop = css[prop];
        if (prop.match(/^(webkit|moz|ms)/i)) {
          prop = '-' + prop;
        }
      }
      style += "" + (prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()) + ":" + val + ";";
    }
    return styleBuffer += style + '}';
  };

  getGradient = function(anchor) {
    return "" + css.gradientProp + "(" + anchor + ", rgba(0, 0, 0, .5) 0%, rgba(255, 255, 255, .35) 100%)";
  };

  capitalize = function(s) {
    return s[0].toUpperCase() + s.slice(1);
  };

  createEl = function(className) {
    var el;
    el = document.createElement('div');
    el.className = elClasses[className];
    return el;
  };

  cloneEl = function(parent, deep, className) {
    var el;
    el = parent.cloneNode(deep);
    el.classList.add(elClasses[className]);
    return el;
  };

  hideEl = function(el) {
    return el.style[css.transform] = 'translate3d(-99999px, 0, 0)';
  };

  showEl = function(el) {
    return el.style[css.transform] = 'translate3d(0, 0, 0)';
  };

  prep = function(fn) {
    return function() {
      var a0, a1, a2, anchor, angle, opt;
      if (this._touchStarted) {
        return fn.apply(this, arguments);
      } else {
        a0 = arguments[0], a1 = arguments[1], a2 = arguments[2];
        opt = {};
        angle = anchor = null;
        switch (fn.length) {
          case 1:
            opt.callback = a0;
            if (!this.isFoldedUp) {
              return typeof opt.callback === "function" ? opt.callback() : void 0;
            }
            break;
          case 2:
            if (typeof a0 === 'function') {
              opt.callback = a0;
            } else {
              anchor = a0;
              opt.callback = a1;
            }
            break;
          case 3:
            angle = a0;
            if (arguments.length === 2) {
              if (typeof a1 === 'object') {
                opt = a1;
              } else if (typeof a1 === 'function') {
                opt.callback = a1;
              } else {
                anchor = a1;
              }
            } else if (arguments.length === 3) {
              anchor = a1;
              if (typeof a2 === 'object') {
                opt = a2;
              } else if (typeof a2 === 'function') {
                opt.callback = a2;
              }
            }
        }
        if (angle == null) {
          angle = this._lastOp.angle || 0;
        }
        anchor || (anchor = this._lastOp.anchor);
        this._queue.push([fn, this._normalizeAngle(angle), this._getLonghandAnchor(anchor), opt]);
        this._step();
        return this;
      }
    };
  };

  defer = function(fn) {
    return setTimeout(fn, 0);
  };

  noOp = function() {};

  $ = (typeof window !== "undefined" && window !== null ? (_ref = window.$) != null ? _ref.data : void 0 : void 0) ? window.$ : null;

  anchorList = ['left', 'right', 'top', 'bottom'];

  anchorListV = anchorList.slice(0, 2);

  anchorListH = anchorList.slice(2);

  testEl = document.createElement('div');

  styleBuffer = '';

  prefixList = ['Webkit', 'Moz', 'ms'];

  baseName = libName.toLowerCase();

  elClasses = {
    active: 'active',
    clone: 'clone',
    holder: 'holder',
    stage: 'stage',
    stageLeft: 'stage-left',
    stageRight: 'stage-right',
    stageTop: 'stage-top',
    stageBottom: 'stage-bottom',
    content: 'content',
    mask: 'mask',
    maskH: 'mask-h',
    maskV: 'mask-v',
    panel: 'panel',
    panelH: 'panel-h',
    panelV: 'panel-v',
    shader: 'shader',
    shaderLeft: 'shader-left',
    shaderRight: 'shader-right',
    shaderTop: 'shader-top',
    shaderBottom: 'shader-bottom'
  };

  for (k in elClasses) {
    v = elClasses[k];
    elClasses[k] = "" + baseName + "-" + v;
  }

  css = new function() {
    var key, _i, _len, _ref1;
    _ref1 = ['transform', 'transformOrigin', 'transformStyle', 'transitionProperty', 'transitionDuration', 'transitionDelay', 'transitionTimingFunction', 'perspective', 'perspectiveOrigin', 'backfaceVisibility', 'boxSizing', 'mask'];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      key = _ref1[_i];
      this[key] = key;
    }
    return this;
  };

  (function() {
    var anchor, key, p3d, prefix, styleEl, value, _i, _len, _ref1, _ref2;
    for (key in css) {
      value = css[key];
      css[key] = testProp(value);
      if (!css[key]) {
        return supportWarning(value);
      }
    }
    p3d = 'preserve-3d';
    testEl.style[css.transformStyle] = p3d;
    if (testEl.style[css.transformStyle] !== p3d) {
      return supportWarning(p3d);
    }
    css.gradientProp = (function() {
      var hyphenated, prefix, _i, _len;
      for (_i = 0, _len = prefixList.length; _i < _len; _i++) {
        prefix = prefixList[_i];
        hyphenated = "-" + (prefix.toLowerCase()) + "-linear-gradient";
        testEl.style.backgroundImage = "" + hyphenated + "(left, #000, #fff)";
        if (testEl.style.backgroundImage.indexOf('gradient') !== -1) {
          return hyphenated;
        }
      }
      return 'linear-gradient';
    })();
    _ref1 = (function() {
      var grabValue, plainGrab, prefix, _i, _len;
      for (_i = 0, _len = prefixList.length; _i < _len; _i++) {
        prefix = prefixList[_i];
        plainGrab = 'grab';
        testEl.style.cursor = (grabValue = "-" + (prefix.toLowerCase()) + "-" + plainGrab);
        if (testEl.style.cursor === grabValue) {
          return [grabValue, "-" + (prefix.toLowerCase()) + "-grabbing"];
        }
      }
      testEl.style.cursor = plainGrab;
      if (testEl.style.cursor === plainGrab) {
        return [plainGrab, 'grabbing'];
      } else {
        return ['move', 'move'];
      }
    })(), css.grab = _ref1[0], css.grabbing = _ref1[1];
    css.transformProp = (prefix = css.transform.match(/(\w+)Transform/i)) ? "-" + (prefix[1].toLowerCase()) + "-transform" : 'transform';
    css.transitionEnd = (function() {
      switch (css.transitionProperty.toLowerCase()) {
        case 'transitionproperty':
          return 'transitionEnd';
        case 'webkittransitionproperty':
          return 'webkitTransitionEnd';
        case 'moztransitionproperty':
          return 'transitionend';
        case 'mstransitionproperty':
          return 'msTransitionEnd';
      }
    })();
    addStyle(elClasses.active, {
      backgroundColor: 'transparent !important',
      backgroundImage: 'none !important',
      boxSizing: 'border-box !important',
      border: 'none !important',
      outline: 'none !important',
      padding: '0 !important',
      position: 'relative',
      transformStyle: p3d + ' !important',
      mask: 'none !important'
    });
    addStyle(elClasses.clone, {
      margin: '0 !important',
      boxSizing: 'border-box !important',
      overflow: 'hidden !important',
      display: 'block !important'
    });
    addStyle(elClasses.holder, {
      width: '100%',
      position: 'absolute',
      top: '0',
      bottom: '0',
      transformStyle: p3d
    });
    addStyle(elClasses.stage, {
      width: '100%',
      height: '100%',
      position: 'absolute',
      transform: 'translate3d(-9999px, 0, 0)',
      margin: '0',
      padding: '0',
      transformStyle: p3d
    });
    _ref2 = {
      Left: '0% 50%',
      Right: '100% 50%',
      Top: '50% 0%',
      Bottom: '50% 100%'
    };
    for (k in _ref2) {
      v = _ref2[k];
      addStyle(elClasses['stage' + k], {
        perspectiveOrigin: v
      });
    }
    addStyle(elClasses.shader, {
      width: '100%',
      height: '100%',
      position: 'absolute',
      opacity: '0',
      top: '0',
      left: '0',
      pointerEvents: 'none',
      transitionProperty: 'opacity'
    });
    for (_i = 0, _len = anchorList.length; _i < _len; _i++) {
      anchor = anchorList[_i];
      addStyle(elClasses['shader' + capitalize(anchor)], {
        background: getGradient(anchor)
      });
    }
    addStyle(elClasses.content, {
      margin: '0 !important',
      position: 'relative !important',
      float: 'none !important',
      boxSizing: 'border-box !important',
      overflow: 'hidden !important'
    });
    addStyle(elClasses.mask, {
      width: '100%',
      height: '100%',
      position: 'absolute',
      overflow: 'hidden',
      transform: 'translate3d(0, 0, 0)',
      outline: '1px solid transparent'
    });
    addStyle(elClasses.panel, {
      width: '100%',
      height: '100%',
      padding: '0',
      position: 'absolute',
      transitionProperty: css.transformProp,
      transformOrigin: 'left',
      transformStyle: p3d
    });
    addStyle(elClasses.panelH, {
      transformOrigin: 'top'
    });
    addStyle("" + elClasses.stageRight + " ." + elClasses.panel, {
      transformOrigin: 'right'
    });
    addStyle("" + elClasses.stageBottom + " ." + elClasses.panel, {
      transformOrigin: 'bottom'
    });
    styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    if (styleEl.styleSheet) {
      styleEl.styleSheet.cssText = styleBuffer;
    } else {
      styleEl.appendChild(document.createTextNode(styleBuffer));
    }
    return document.head.appendChild(styleEl);
  })();

  defaults = {
    vPanels: 3,
    hPanels: 3,
    perspective: 1000,
    shading: 'hard',
    speed: 700,
    maxAngle: 90,
    ripple: 0,
    oriDomiClass: libName.toLowerCase(),
    shadingIntensity: 1,
    easingMethod: '',
    gapNudge: 1,
    touchEnabled: true,
    touchSensitivity: .25,
    touchStartCallback: noOp,
    touchMoveCallback: noOp,
    touchEndCallback: noOp
  };

  OriDomi = (function() {
    function OriDomi(el, options) {
      var a, anchor, anchorSet, axis, classSuffix, content, contentHolder, count, i, index, mask, maskProto, metric, offsets, panel, panelConfig, panelKey, panelN, panelProto, percent, prev, proto, rightOrBottom, shaderProto, shaderProtos, side, stageProto, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _p, _q, _ref1, _ref2;
      this.el = el;
      if (options == null) {
        options = {};
      }
      this._onMouseOut = __bind(this._onMouseOut, this);
      this._onTouchLeave = __bind(this._onTouchLeave, this);
      this._onTouchEnd = __bind(this._onTouchEnd, this);
      this._onTouchMove = __bind(this._onTouchMove, this);
      this._onTouchStart = __bind(this._onTouchStart, this);
      this._stageReset = __bind(this._stageReset, this);
      this._conclude = __bind(this._conclude, this);
      this._onTransitionEnd = __bind(this._onTransitionEnd, this);
      this._step = __bind(this._step, this);
      if (!isSupported) {
        return;
      }
      if (!(this instanceof OriDomi)) {
        return new OriDomi(this.el, options);
      }
      if (typeof this.el === 'string') {
        this.el = document.querySelector(this.el);
      }
      if (!(this.el && this.el.nodeType === 1)) {
        if (typeof console !== "undefined" && console !== null) {
          console.warn("" + libName + ": First argument must be a DOM element");
        }
        return;
      }
      this._config = new function() {
        for (k in defaults) {
          v = defaults[k];
          if (k in options) {
            this[k] = options[k];
          } else {
            this[k] = v;
          }
        }
        return this;
      };
      this._config.ripple = Number(this._config.ripple);
      this._queue = [];
      this._panels = {};
      this._stages = {};
      this._lastOp = {
        anchor: anchorList[0]
      };
      this._shading = this._config.shading;
      if (this._shading === true) {
        this._shading = 'hard';
      }
      if (this._shading) {
        this._shaders = {};
        shaderProtos = {};
        shaderProto = createEl('shader');
        shaderProto.style[css.transitionDuration] = this._config.speed + 'ms';
        shaderProto.style[css.transitionTimingFunction] = this._config.easingMethod;
      }
      stageProto = createEl('stage');
      stageProto.style[css.perspective] = this._config.perspective + 'px';
      for (_i = 0, _len = anchorList.length; _i < _len; _i++) {
        anchor = anchorList[_i];
        this._panels[anchor] = [];
        this._stages[anchor] = cloneEl(stageProto, false, 'stage' + capitalize(anchor));
        if (this._shading) {
          this._shaders[anchor] = {};
          if (__indexOf.call(anchorListV, anchor) >= 0) {
            for (_j = 0, _len1 = anchorListV.length; _j < _len1; _j++) {
              side = anchorListV[_j];
              this._shaders[anchor][side] = [];
            }
          } else {
            for (_k = 0, _len2 = anchorListH.length; _k < _len2; _k++) {
              side = anchorListH[_k];
              this._shaders[anchor][side] = [];
            }
          }
          shaderProtos[anchor] = cloneEl(shaderProto, false, 'shader' + capitalize(anchor));
        }
      }
      contentHolder = cloneEl(this.el, true, 'content');
      maskProto = createEl('mask');
      maskProto.appendChild(contentHolder);
      panelProto = createEl('panel');
      panelProto.style[css.transitionDuration] = this._config.speed + 'ms';
      panelProto.style[css.transitionTimingFunction] = this._config.easingMethod;
      offsets = {
        left: [],
        top: []
      };
      _ref1 = ['x', 'y'];
      for (_l = 0, _len3 = _ref1.length; _l < _len3; _l++) {
        axis = _ref1[_l];
        if (axis === 'x') {
          anchorSet = anchorListV;
          metric = 'width';
          classSuffix = 'V';
        } else {
          anchorSet = anchorListH;
          metric = 'height';
          classSuffix = 'H';
        }
        panelConfig = this._config[panelKey = classSuffix.toLowerCase() + 'Panels'];
        if (typeof panelConfig === 'number') {
          count = Math.abs(parseInt(panelConfig, 10));
          percent = 100 / count;
          panelConfig = this._config[panelKey] = (function() {
            var _m, _results;
            _results = [];
            for (_m = 0; 0 <= count ? _m < count : _m > count; 0 <= count ? _m++ : _m--) {
              _results.push(percent);
            }
            return _results;
          })();
        } else {
          count = panelConfig.length;
          if (!((99 <= (_ref2 = panelConfig.reduce(function(p, c) {
            return p + c;
          })) && _ref2 <= 100.1))) {
            throw new Error("" + libName + ": Panel percentages do not sum to 100");
          }
        }
        mask = cloneEl(maskProto, true, 'mask' + classSuffix);
        if (this._shading) {
          for (_m = 0, _len4 = anchorSet.length; _m < _len4; _m++) {
            anchor = anchorSet[_m];
            mask.appendChild(shaderProtos[anchor]);
          }
        }
        proto = cloneEl(panelProto, false, 'panel' + classSuffix);
        proto.appendChild(mask);
        for (rightOrBottom = _n = 0, _len5 = anchorSet.length; _n < _len5; rightOrBottom = ++_n) {
          anchor = anchorSet[rightOrBottom];
          for (panelN = _o = 0; 0 <= count ? _o < count : _o > count; panelN = 0 <= count ? ++_o : --_o) {
            panel = proto.cloneNode(true);
            content = panel.children[0].children[0];
            content.style.width = content.style.height = '100%';
            if (rightOrBottom) {
              panel.style[css.origin] = anchor;
              index = panelConfig.length - panelN - 1;
              prev = index + 1;
            } else {
              index = panelN;
              prev = index - 1;
              if (panelN === 0) {
                offsets[anchor].push(0);
              } else {
                offsets[anchor].push((offsets[anchor][prev] - 100) * (panelConfig[prev] / panelConfig[index]));
              }
            }
            if (panelN === 0) {
              panel.style[anchor] = '0';
              panel.style[metric] = panelConfig[index] + '%';
            } else {
              panel.style[anchor] = '100%';
              panel.style[metric] = panelConfig[index] / panelConfig[prev] * 100 + '%';
            }
            if (this._shading) {
              for (i = _p = 0, _len6 = anchorSet.length; _p < _len6; i = ++_p) {
                a = anchorSet[i];
                this._shaders[anchor][a][panelN] = panel.children[0].children[i + 1];
              }
            }
            content.style[metric] = content.style['max' + capitalize(metric)] = (count / panelConfig[index] * 10000 / count) + '%';
            content.style[anchorSet[0]] = offsets[anchorSet[0]][index] + '%';
            this._transformPanel(panel, 0, anchor);
            this._panels[anchor][panelN] = panel;
            if (panelN !== 0) {
              this._panels[anchor][panelN - 1].appendChild(panel);
            }
          }
          this._stages[anchor].appendChild(this._panels[anchor][0]);
        }
      }
      this._stageHolder = createEl('holder');
      this._stageHolder.setAttribute('aria-hidden', 'true');
      for (_q = 0, _len7 = anchorList.length; _q < _len7; _q++) {
        anchor = anchorList[_q];
        this._stageHolder.appendChild(this._stages[anchor]);
      }
      if (window.getComputedStyle(this.el).position === 'absolute') {
        this.el.style.position = 'absolute';
      }
      this.el.classList.add(elClasses.active);
      showEl(this._stages.left);
      this._cloneEl = cloneEl(this.el, true, 'clone');
      this._cloneEl.classList.remove(elClasses.active);
      hideEl(this._cloneEl);
      this.el.innerHTML = '';
      this.el.appendChild(this._cloneEl);
      this.el.appendChild(this._stageHolder);
      this.el.parentNode.style[css.transformStyle] = 'preserve-3d';
      this.accordion(0);
      if (this._config.ripple) {
        this.setRipple(this._config.ripple);
      }
      if (this._config.touchEnabled) {
        this.enableTouch();
      }
    }

    OriDomi.prototype._step = function() {
      var anchor, angle, fn, next, options, _ref1;
      if (this._inTrans || !this._queue.length) {
        return;
      }
      this._inTrans = true;
      _ref1 = this._queue.shift(), fn = _ref1[0], angle = _ref1[1], anchor = _ref1[2], options = _ref1[3];
      if (this.isFrozen) {
        this.unfreeze();
      }
      next = (function(_this) {
        return function() {
          var args;
          _this._setCallback({
            angle: angle,
            anchor: anchor,
            options: options,
            fn: fn
          });
          args = [angle, anchor, options];
          if (fn.length < 3) {
            args.shift();
          }
          return fn.apply(_this, args);
        };
      })(this);
      if (this.isFoldedUp) {
        if (fn.length === 2) {
          return next();
        } else {
          return this._unfold(next);
        }
      } else if (anchor !== this._lastOp.anchor) {
        return this._stageReset(anchor, next);
      } else {
        return next();
      }
    };

    OriDomi.prototype._isIdenticalOperation = function(op) {
      var key, _i, _len, _ref1, _ref2;
      if (!this._lastOp.fn) {
        return true;
      }
      if (this._lastOp.reset) {
        return false;
      }
      _ref1 = ['angle', 'anchor', 'fn'];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        key = _ref1[_i];
        if (this._lastOp[key] !== op[key]) {
          return false;
        }
      }
      _ref2 = op.options;
      for (k in _ref2) {
        v = _ref2[k];
        if (v !== this._lastOp.options[k] && k !== 'callback') {
          return false;
        }
      }
      return true;
    };

    OriDomi.prototype._setCallback = function(operation) {
      if (!this._config.speed || this._isIdenticalOperation(operation)) {
        this._conclude(operation.options.callback);
      } else {
        this._panels[this._lastOp.anchor][0].addEventListener(css.transitionEnd, this._onTransitionEnd, false);
      }
      return (this._lastOp = operation).reset = false;
    };

    OriDomi.prototype._onTransitionEnd = function(e) {
      e.currentTarget.removeEventListener(css.transitionEnd, this._onTransitionEnd, false);
      return this._conclude(this._lastOp.options.callback, e);
    };

    OriDomi.prototype._conclude = function(cb, event) {
      return defer((function(_this) {
        return function() {
          _this._inTrans = false;
          _this._step();
          return typeof cb === "function" ? cb(event, _this) : void 0;
        };
      })(this));
    };

    OriDomi.prototype._transformPanel = function(el, angle, anchor, fracture) {
      var transPrefix, x, y, z;
      x = y = z = 0;
      switch (anchor) {
        case 'left':
          y = angle;
          transPrefix = 'X(-';
          break;
        case 'right':
          y = -angle;
          transPrefix = 'X(';
          break;
        case 'top':
          x = -angle;
          transPrefix = 'Y(-';
          break;
        case 'bottom':
          x = angle;
          transPrefix = 'Y(';
      }
      if (fracture) {
        x = y = z = angle;
      }
      return el.style[css.transform] = "rotateX(" + x + "deg) rotateY(" + y + "deg) rotateZ(" + z + "deg) translate" + transPrefix + this._config.gapNudge + "px)";
    };

    OriDomi.prototype._normalizeAngle = function(angle) {
      var max;
      angle = parseFloat(angle, 10);
      max = this._config.maxAngle;
      if (isNaN(angle)) {
        return 0;
      } else if (angle > max) {
        return max;
      } else if (angle < -max) {
        return -max;
      } else {
        return angle;
      }
    };

    OriDomi.prototype._setTrans = function(duration, delay, anchor) {
      if (anchor == null) {
        anchor = this._lastOp.anchor;
      }
      return this._iterate(anchor, (function(_this) {
        return function(panel, i, len) {
          return _this._setPanelTrans.apply(_this, [anchor].concat(__slice.call(arguments), [duration], [delay]));
        };
      })(this));
    };

    OriDomi.prototype._setPanelTrans = function(anchor, panel, i, len, duration, delay) {
      var delayMs, shader, side, _i, _len, _ref1;
      delayMs = (function() {
        switch (delay) {
          case 0:
            return 0;
          case 1:
            return this._config.speed / len * i;
          case 2:
            return this._config.speed / len * (len - i - 1);
        }
      }).call(this);
      panel.style[css.transitionDuration] = duration + 'ms';
      panel.style[css.transitionDelay] = delayMs + 'ms';
      if (this._shading) {
        _ref1 = (__indexOf.call(anchorListV, anchor) >= 0 ? anchorListV : anchorListH);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          side = _ref1[_i];
          shader = this._shaders[anchor][side][i];
          shader.style[css.transitionDuration] = duration + 'ms';
          shader.style[css.transitionDelay] = delayMs + 'ms';
        }
      }
      return delayMs;
    };

    OriDomi.prototype._setShader = function(n, anchor, angle) {
      var a, abs, b, opacity;
      abs = Math.abs(angle);
      opacity = abs / 90 * this._config.shadingIntensity;
      if (this._shading === 'hard') {
        opacity *= .15;
        if (this._lastOp.angle < 0) {
          angle = abs;
        } else {
          angle = -abs;
        }
      } else {
        opacity *= .4;
      }
      if (__indexOf.call(anchorListV, anchor) >= 0) {
        if (angle < 0) {
          a = opacity;
          b = 0;
        } else {
          a = 0;
          b = opacity;
        }
        this._shaders[anchor].left[n].style.opacity = a;
        return this._shaders[anchor].right[n].style.opacity = b;
      } else {
        if (angle < 0) {
          a = 0;
          b = opacity;
        } else {
          a = opacity;
          b = 0;
        }
        this._shaders[anchor].top[n].style.opacity = a;
        return this._shaders[anchor].bottom[n].style.opacity = b;
      }
    };

    OriDomi.prototype._showStage = function(anchor) {
      if (anchor !== this._lastOp.anchor) {
        hideEl(this._stages[this._lastOp.anchor]);
        this._lastOp.anchor = anchor;
        this._lastOp.reset = true;
        return this._stages[anchor].style[css.transform] = 'translate3d(' + (function() {
          switch (anchor) {
            case 'left':
              return '0, 0, 0)';
            case 'right':
              return "-" + this._config.vPanels.length + "px, 0, 0)";
            case 'top':
              return '0, 0, 0)';
            case 'bottom':
              return "0, -" + this._config.hPanels.length + "px, 0)";
          }
        }).call(this);
      }
    };

    OriDomi.prototype._stageReset = function(anchor, cb) {
      var fn;
      fn = (function(_this) {
        return function(e) {
          if (e) {
            e.currentTarget.removeEventListener(css.transitionEnd, fn, false);
          }
          _this._showStage(anchor);
          return defer(cb);
        };
      })(this);
      if (this._lastOp.angle === 0) {
        return fn();
      }
      this._panels[this._lastOp.anchor][0].addEventListener(css.transitionEnd, fn, false);
      return this._iterate(this._lastOp.anchor, (function(_this) {
        return function(panel, i) {
          _this._transformPanel(panel, 0, _this._lastOp.anchor);
          if (_this._shading) {
            return _this._setShader(i, _this._lastOp.anchor, 0);
          }
        };
      })(this));
    };

    OriDomi.prototype._getLonghandAnchor = function(shorthand) {
      switch (shorthand.toString()) {
        case 'left':
        case 'l':
        case '4':
          return 'left';
        case 'right':
        case 'r':
        case '2':
          return 'right';
        case 'top':
        case 't':
        case '1':
          return 'top';
        case 'bottom':
        case 'b':
        case '3':
          return 'bottom';
        default:
          return 'left';
      }
    };

    OriDomi.prototype._setCursor = function(bool) {
      if (bool == null) {
        bool = this._touchEnabled;
      }
      if (bool) {
        return this.el.style.cursor = css.grab;
      } else {
        return this.el.style.cursor = 'default';
      }
    };

    OriDomi.prototype._setTouch = function(toggle) {
      var eString, eventPair, eventPairs, listenFn, mouseLeaveSupport, _i, _j, _len, _len1;
      if (toggle) {
        if (this._touchEnabled) {
          return this;
        }
        listenFn = 'addEventListener';
      } else {
        if (!this._touchEnabled) {
          return this;
        }
        listenFn = 'removeEventListener';
      }
      this._touchEnabled = toggle;
      this._setCursor();
      eventPairs = [['TouchStart', 'MouseDown'], ['TouchEnd', 'MouseUp'], ['TouchMove', 'MouseMove'], ['TouchLeave', 'MouseLeave']];
      mouseLeaveSupport = 'onmouseleave' in window;
      for (_i = 0, _len = eventPairs.length; _i < _len; _i++) {
        eventPair = eventPairs[_i];
        for (_j = 0, _len1 = eventPair.length; _j < _len1; _j++) {
          eString = eventPair[_j];
          if (!(eString === 'TouchLeave' && !mouseLeaveSupport)) {
            this.el[listenFn](eString.toLowerCase(), this['_on' + eventPair[0]], false);
          } else {
            this.el[listenFn]('mouseout', this._onMouseOut, false);
            break;
          }
        }
      }
      return this;
    };

    OriDomi.prototype._onTouchStart = function(e) {
      var axis1, _ref1;
      if (!this._touchEnabled || this.isFoldedUp) {
        return;
      }
      e.preventDefault();
      this.emptyQueue();
      this._touchStarted = true;
      this.el.style.cursor = css.grabbing;
      this._setTrans(0, 0);
      this._touchAxis = (_ref1 = this._lastOp.anchor, __indexOf.call(anchorListV, _ref1) >= 0) ? 'x' : 'y';
      this["_" + this._touchAxis + "Last"] = this._lastOp.angle;
      axis1 = "_" + this._touchAxis + "1";
      if (e.type === 'mousedown') {
        this[axis1] = e["page" + (this._touchAxis.toUpperCase())];
      } else {
        this[axis1] = e.targetTouches[0]["page" + (this._touchAxis.toUpperCase())];
      }
      return this._config.touchStartCallback(this[axis1], e);
    };

    OriDomi.prototype._onTouchMove = function(e) {
      var current, delta, distance;
      if (!(this._touchEnabled && this._touchStarted)) {
        return;
      }
      e.preventDefault();
      if (e.type === 'mousemove') {
        current = e["page" + (this._touchAxis.toUpperCase())];
      } else {
        current = e.targetTouches[0]["page" + (this._touchAxis.toUpperCase())];
      }
      distance = (current - this["_" + this._touchAxis + "1"]) * this._config.touchSensitivity;
      if (this._lastOp.angle < 0) {
        if (this._lastOp.anchor === 'right' || this._lastOp.anchor === 'bottom') {
          delta = this["_" + this._touchAxis + "Last"] - distance;
        } else {
          delta = this["_" + this._touchAxis + "Last"] + distance;
        }
        if (delta > 0) {
          delta = 0;
        }
      } else {
        if (this._lastOp.anchor === 'right' || this._lastOp.anchor === 'bottom') {
          delta = this["_" + this._touchAxis + "Last"] + distance;
        } else {
          delta = this["_" + this._touchAxis + "Last"] - distance;
        }
        if (delta < 0) {
          delta = 0;
        }
      }
      this._lastOp.angle = delta = this._normalizeAngle(delta);
      this._lastOp.fn.call(this, delta, this._lastOp.anchor, this._lastOp.options);
      return this._config.touchMoveCallback(delta, e);
    };

    OriDomi.prototype._onTouchEnd = function(e) {
      if (!this._touchEnabled) {
        return;
      }
      this._touchStarted = this._inTrans = false;
      this.el.style.cursor = css.grab;
      this._setTrans(this._config.speed, this._config.ripple);
      return this._config.touchEndCallback(this["_" + this._touchAxis + "Last"], e);
    };

    OriDomi.prototype._onTouchLeave = function(e) {
      if (!(this._touchEnabled && this._touchStarted)) {
        return;
      }
      return this._onTouchEnd(e);
    };

    OriDomi.prototype._onMouseOut = function(e) {
      if (!(this._touchEnabled && this._touchStarted)) {
        return;
      }
      if (e.toElement && !this.el.contains(e.toElement)) {
        return this._onTouchEnd(e);
      }
    };

    OriDomi.prototype._unfold = function(callback) {
      var anchor;
      this._inTrans = true;
      anchor = this._lastOp.anchor;
      return this._iterate(anchor, (function(_this) {
        return function(panel, i, len) {
          var delay;
          delay = _this._setPanelTrans.apply(_this, [anchor].concat(__slice.call(arguments), [_this._config.speed], [1]));
          return (function(panel, i, delay) {
            return defer(function() {
              _this._transformPanel(panel, 0, _this._lastOp.anchor);
              return setTimeout(function() {
                showEl(panel.children[0]);
                if (i === len - 1) {
                  _this._inTrans = _this.isFoldedUp = false;
                  if (typeof callback === "function") {
                    callback();
                  }
                  _this._lastOp.fn = _this.accordion;
                  _this._lastOp.angle = 0;
                }
                return defer(function() {
                  return panel.style[css.transitionDuration] = _this._config.speed;
                });
              }, delay + _this._config.speed * .25);
            });
          })(panel, i, delay);
        };
      })(this));
    };

    OriDomi.prototype._iterate = function(anchor, fn) {
      var i, panel, panels, _i, _len, _ref1, _results;
      _ref1 = panels = this._panels[anchor];
      _results = [];
      for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
        panel = _ref1[i];
        _results.push(fn.call(this, panel, i, panels.length));
      }
      return _results;
    };

    OriDomi.prototype.enableTouch = function() {
      return this._setTouch(true);
    };

    OriDomi.prototype.disableTouch = function() {
      return this._setTouch(false);
    };

    OriDomi.prototype.setSpeed = function(speed) {
      var anchor, _i, _len;
      for (_i = 0, _len = anchorList.length; _i < _len; _i++) {
        anchor = anchorList[_i];
        this._setTrans((this._config.speed = speed), this._config.ripple, anchor);
      }
      return this;
    };

    OriDomi.prototype.freeze = function(callback) {
      if (this.isFrozen) {
        if (typeof callback === "function") {
          callback();
        }
      } else {
        this._stageReset(this._lastOp.anchor, (function(_this) {
          return function() {
            _this.isFrozen = true;
            hideEl(_this._stageHolder);
            showEl(_this._cloneEl);
            _this._setCursor(false);
            return typeof callback === "function" ? callback() : void 0;
          };
        })(this));
      }
      return this;
    };

    OriDomi.prototype.unfreeze = function() {
      if (this.isFrozen) {
        this.isFrozen = false;
        hideEl(this._cloneEl);
        showEl(this._stageHolder);
        this._setCursor();
        this._lastOp.angle = 0;
      }
      return this;
    };

    OriDomi.prototype.destroy = function(callback) {
      this.freeze((function(_this) {
        return function() {
          _this._setTouch(false);
          if ($) {
            $.data(_this.el, baseName, null);
          }
          _this.el.innerHTML = _this._cloneEl.innerHTML;
          _this.el.classList.remove(elClasses.active);
          return typeof callback === "function" ? callback() : void 0;
        };
      })(this));
      return null;
    };

    OriDomi.prototype.emptyQueue = function() {
      this._queue = [];
      defer((function(_this) {
        return function() {
          return _this._inTrans = false;
        };
      })(this));
      return this;
    };

    OriDomi.prototype.setRipple = function(dir) {
      if (dir == null) {
        dir = 1;
      }
      this._config.ripple = Number(dir);
      this.setSpeed(this._config.speed);
      return this;
    };

    OriDomi.prototype.constrainAngle = function(angle) {
      this._config.maxAngle = parseFloat(angle, 10) || defaults.maxAngle;
      return this;
    };

    OriDomi.prototype.wait = function(ms) {
      var fn;
      fn = (function(_this) {
        return function() {
          return setTimeout(_this._conclude, ms);
        };
      })(this);
      if (this._inTrans) {
        this._queue.push([fn, this._lastOp.angle, this._lastOp.anchor, this._lastOp.options]);
      } else {
        fn();
      }
      return this;
    };

    OriDomi.prototype.modifyContent = function(fn) {
      var anchor, i, panel, selectors, set, _i, _j, _len, _len1, _ref1;
      if (typeof fn !== 'function') {
        selectors = fn;
        set = function(el, content, style) {
          var key, value;
          if (content) {
            el.innerHTML = content;
          }
          if (style) {
            for (key in style) {
              value = style[key];
              el.style[key] = value;
            }
            return null;
          }
        };
        fn = function(el) {
          var content, match, selector, style, value, _i, _len, _ref1;
          for (selector in selectors) {
            value = selectors[selector];
            content = style = null;
            if (typeof value === 'string') {
              content = value;
            } else {
              content = value.content, style = value.style;
            }
            if (selector === '') {
              set(el, content, style);
              continue;
            }
            _ref1 = el.querySelectorAll(selector);
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              match = _ref1[_i];
              set(match, content, style);
            }
          }
          return null;
        };
      }
      for (_i = 0, _len = anchorList.length; _i < _len; _i++) {
        anchor = anchorList[_i];
        _ref1 = this._panels[anchor];
        for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
          panel = _ref1[i];
          fn(panel.children[0].children[0], i, anchor);
        }
      }
      return this;
    };

    OriDomi.prototype.accordion = prep(function(angle, anchor, options) {
      return this._iterate(anchor, (function(_this) {
        return function(panel, i) {
          var deg;
          if (i % 2 !== 0 && !options.twist) {
            deg = -angle;
          } else {
            deg = angle;
          }
          if (options.sticky) {
            if (i === 0) {
              deg = 0;
            } else if (i > 1 || options.stairs) {
              deg *= 2;
            }
          } else {
            if (i !== 0) {
              deg *= 2;
            }
          }
          if (options.stairs) {
            deg *= -1;
          }
          _this._transformPanel(panel, deg, anchor, options.fracture);
          if (_this._shading) {
            if (options.twist || options.fracture || (i === 0 && options.sticky)) {
              return _this._setShader(i, anchor, 0);
            } else if (Math.abs(deg) !== 180) {
              return _this._setShader(i, anchor, deg);
            }
          }
        };
      })(this));
    });

    OriDomi.prototype.curl = prep(function(angle, anchor, options) {
      angle /= __indexOf.call(anchorListV, anchor) >= 0 ? this._config.vPanels.length : this._config.hPanels.length;
      return this._iterate(anchor, (function(_this) {
        return function(panel, i) {
          _this._transformPanel(panel, angle, anchor);
          if (_this._shading) {
            return _this._setShader(i, anchor, 0);
          }
        };
      })(this));
    });

    OriDomi.prototype.ramp = prep(function(angle, anchor, options) {
      this._transformPanel(this._panels[anchor][1], angle, anchor);
      return this._iterate(anchor, (function(_this) {
        return function(panel, i) {
          if (i !== 1) {
            _this._transformPanel(panel, 0, anchor);
          }
          if (_this._shading) {
            return _this._setShader(i, anchor, 0);
          }
        };
      })(this));
    });

    OriDomi.prototype.foldUp = prep(function(anchor, callback) {
      if (this.isFoldedUp) {
        return typeof callback === "function" ? callback() : void 0;
      }
      return this._stageReset(anchor, (function(_this) {
        return function() {
          _this._inTrans = _this.isFoldedUp = true;
          return _this._iterate(anchor, function(panel, i, len) {
            var delay, duration;
            duration = _this._config.speed;
            if (i === 0) {
              duration /= 2;
            }
            delay = _this._setPanelTrans.apply(_this, [anchor].concat(__slice.call(arguments), [duration], [2]));
            return (function(panel, i, delay) {
              return defer(function() {
                _this._transformPanel(panel, (i === 0 ? 90 : 170), anchor);
                return setTimeout(function() {
                  if (i === 0) {
                    _this._inTrans = false;
                    return typeof callback === "function" ? callback() : void 0;
                  } else {
                    return hideEl(panel.children[0]);
                  }
                }, delay + _this._config.speed * .25);
              });
            })(panel, i, delay);
          });
        };
      })(this));
    });

    OriDomi.prototype.unfold = prep(function(callback) {
      return this._unfold.apply(this, arguments);
    });

    OriDomi.prototype.map = function(fn) {
      return prep((function(_this) {
        return function(angle, anchor, options) {
          return _this._iterate(anchor, function(panel, i, len) {
            return _this._transformPanel(panel, fn(angle, i, len), anchor, options.fracture);
          });
        };
      })(this)).bind(this);
    };

    OriDomi.prototype.reset = function(callback) {
      return this.accordion(0, {
        callback: callback
      });
    };

    OriDomi.prototype.reveal = function(angle, anchor, options) {
      if (options == null) {
        options = {};
      }
      options.sticky = true;
      return this.accordion(angle, anchor, options);
    };

    OriDomi.prototype.stairs = function(angle, anchor, options) {
      if (options == null) {
        options = {};
      }
      options.stairs = options.sticky = true;
      return this.accordion(angle, anchor, options);
    };

    OriDomi.prototype.fracture = function(angle, anchor, options) {
      if (options == null) {
        options = {};
      }
      options.fracture = true;
      return this.accordion(angle, anchor, options);
    };

    OriDomi.prototype.twist = function(angle, anchor, options) {
      if (options == null) {
        options = {};
      }
      options.fracture = options.twist = true;
      return this.accordion(angle / 10, anchor, options);
    };

    OriDomi.prototype.collapse = function(anchor, options) {
      if (options == null) {
        options = {};
      }
      options.sticky = false;
      return this.accordion(-this._config.maxAngle, anchor, options);
    };

    OriDomi.prototype.collapseAlt = function(anchor, options) {
      if (options == null) {
        options = {};
      }
      options.sticky = false;
      return this.accordion(this._config.maxAngle, anchor, options);
    };

    OriDomi.VERSION = '1.1.2';

    OriDomi.isSupported = isSupported;

    return OriDomi;

  })();

  if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
    module.exports = OriDomi;
  } else if (typeof define !== "undefined" && define !== null ? define.amd : void 0) {
    define(function() {
      return OriDomi;
    });
  } else {
    window.OriDomi = OriDomi;
  }

  if (!$) {
    return;
  }

  $.prototype.oriDomi = function(options) {
    var el, instance, method, methodName, _i, _j, _len, _len1;
    if (!isSupported) {
      return this;
    }
    if (options === true) {
      return $.data(this[0], baseName);
    }
    if (typeof options === 'string') {
      methodName = options;
      if (typeof (method = OriDomi.prototype[methodName]) !== 'function') {
        if (typeof console !== "undefined" && console !== null) {
          console.warn("" + libName + ": No such method `" + methodName + "`");
        }
        return this;
      }
      for (_i = 0, _len = this.length; _i < _len; _i++) {
        el = this[_i];
        if (!(instance = $.data(el, baseName))) {
          instance = $.data(el, baseName, new OriDomi(el, options));
        }
        method.apply(instance, Array.prototype.slice.call(arguments).slice(1));
      }
    } else {
      for (_j = 0, _len1 = this.length; _j < _len1; _j++) {
        el = this[_j];
        if (instance = $.data(el, baseName)) {
          continue;
        } else {
          $.data(el, baseName, new OriDomi(el, options));
        }
      }
    }
    return this;
  };

}).call(this);

//# sourceMappingURL=oridomi.map

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/oridomi/oridomi.js","/../../node_modules/oridomi")
},{"buffer":2,"oMfpAn":5}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL2FwcC9zY3JpcHRzL2Zha2VfM2NlNTZjMGEuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvYWNjZWxlcmF0ZS5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvYW5pbWF0aW9uLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9hdHRhY2gtc3ByaW5nLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9ib2R5LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9ib3VuZGFyeS5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvZGVjZWxlcmF0ZS5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvZHJhZy5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvaW5kZXguanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2ludGVyYWN0LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9yZW5kZXJlci5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvc2ltdWxhdGlvbi5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvc3ByaW5nLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi91dGlsLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi92ZWN0b3IuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2NvbXBvbmVudC1lbWl0dGVyL2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvaW5kZXguanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9vYmplY3R0eXBlcy9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9pc25hdGl2ZS9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9zaGlta2V5cy9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLmlzb2JqZWN0L2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9wcm9taXNlL2NvcmUuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2UvaW5kZXguanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2Uvbm9kZV9tb2R1bGVzL2FzYXAvYXNhcC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcmFmL2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9yYWYvbm9kZV9tb2R1bGVzL3BlcmZvcm1hbmNlLW5vdy9saWIvcGVyZm9ybWFuY2Utbm93LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy90b3VjaC12ZWxvY2l0eS9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvb3JpZG9taS9vcmlkb21pLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2bENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUGh5c2ljcyA9IHJlcXVpcmUoJ2ltcHVsc2UnKVxudmFyIE9yaURvbWkgPSByZXF1aXJlKCdvcmlkb21pJylcbnZhciBmb2xkZWQgPSBuZXcgT3JpRG9taShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY292ZXInKSwgeyB2UGFuZWxzOiA1LCBzcGVlZDogMCwgcmlwcGxlOiAwLCB0b3VjaEVuYWJsZWQ6IGZhbHNlLCBwZXJzcGVjdGl2ZTogODAwIH0pXG52YXIgbGFzdFBlcmNlbnQgPSAxXG5mb2xkZWQuYWNjb3JkaW9uKDApXG5cbnZhciBwaHlzID0gbmV3IFBoeXNpY3MoZnVuY3Rpb24oeCkge1xuICBmb2xkZWQuYWNjb3JkaW9uKE1hdGguYWNvcyh4KSAqICgxODAgLyBNYXRoLlBJKSlcbn0pXG5cbnBoeXMucG9zaXRpb24oMSwgMClcblxudmFyIHN0YXJ0WFxuICAsIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGhcbiAgLCBpbnRlcmFjdGlvblxuICAsIG1vdXNlZG93biA9IGZhbHNlXG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIGZ1bmN0aW9uKGV2dCkge1xuICBldnQucHJldmVudERlZmF1bHQoKVxufSlcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBzdGFydClcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBzdGFydClcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG1vdmUpXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW92ZSlcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgZW5kKVxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBlbmQpXG5cbmZ1bmN0aW9uIHBhZ2VYKGV2dCkge1xuICByZXR1cm4gZXZ0LnRvdWNoZXMgJiYgZXZ0LnRvdWNoZXNbMF0ucGFnZVggfHwgZXZ0LnBhZ2VYXG59XG5cbmZ1bmN0aW9uIHN0YXJ0KGV2dCkge1xuICB2YXIgcGVyY2VudCA9IHBoeXMucG9zaXRpb24oKS54XG4gIG1vdXNlZG93biA9IHRydWVcbiAgaW50ZXJhY3Rpb24gPSBwaHlzLmludGVyYWN0KClcbiAgaW50ZXJhY3Rpb24uc3RhcnQoKVxuXG4gIGlmKHBlcmNlbnQgPD0gMCkgcGVyY2VudCA9IC4xXG5cbiAgc3RhcnRYID0gcGFnZVgoZXZ0KSAvIHBlcmNlbnRcbn1cblxuZnVuY3Rpb24gbW92ZShldnQpIHtcbiAgaWYoIW1vdXNlZG93bikgcmV0dXJuXG4gIGV2dC5wcmV2ZW50RGVmYXVsdCgpXG4gIHZhciBkZWx0YSA9IHBhZ2VYKGV2dClcbiAgICAsIHBlcmNlbnRNb3ZlZCA9IGRlbHRhIC8gc3RhcnRYXG5cbiAgaWYocGVyY2VudE1vdmVkID4gMSkgcGVyY2VudE1vdmVkID0gMVxuICBpbnRlcmFjdGlvbi5wb3NpdGlvbihwZXJjZW50TW92ZWQpXG59XG5cbmZ1bmN0aW9uIGVuZChldnQpIHtcbiAgaWYoIW1vdXNlZG93bikgcmV0dXJuXG4gIG1vdXNlZG93biA9IGZhbHNlXG4gIGV2dC5wcmV2ZW50RGVmYXVsdCgpXG4gIGludGVyYWN0aW9uLmVuZCgpXG4gIHZhciB0byA9IChwaHlzLmRpcmVjdGlvbignbGVmdCcpKSA/IDAgOiAxXG4gIHBoeXMuYWNjZWxlcmF0ZSh7IGJvdW5jZTogdHJ1ZSwgYWNjZWxlcmF0aW9uOiAzLCBtaW5Cb3VuY2VEaXN0YW5jZTogMCwgYm91Y2VBY2NlbGVyYXRpb246IDYsIGRhbXBpbmc6IC4yIH0pLnRvKHRvKS5zdGFydCgpXG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZmFrZV8zY2U1NmMwYS5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTJcblxuLyoqXG4gKiBJZiBgQnVmZmVyLl91c2VUeXBlZEFycmF5c2A6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChjb21wYXRpYmxlIGRvd24gdG8gSUU2KVxuICovXG5CdWZmZXIuX3VzZVR5cGVkQXJyYXlzID0gKGZ1bmN0aW9uICgpIHtcbiAgLy8gRGV0ZWN0IGlmIGJyb3dzZXIgc3VwcG9ydHMgVHlwZWQgQXJyYXlzLiBTdXBwb3J0ZWQgYnJvd3NlcnMgYXJlIElFIDEwKywgRmlyZWZveCA0KyxcbiAgLy8gQ2hyb21lIDcrLCBTYWZhcmkgNS4xKywgT3BlcmEgMTEuNissIGlPUyA0LjIrLiBJZiB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGFkZGluZ1xuICAvLyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXMsIHRoZW4gdGhhdCdzIHRoZSBzYW1lIGFzIG5vIGBVaW50OEFycmF5YCBzdXBwb3J0XG4gIC8vIGJlY2F1c2Ugd2UgbmVlZCB0byBiZSBhYmxlIHRvIGFkZCBhbGwgdGhlIG5vZGUgQnVmZmVyIEFQSSBtZXRob2RzLiBUaGlzIGlzIGFuIGlzc3VlXG4gIC8vIGluIEZpcmVmb3ggNC0yOS4gTm93IGZpeGVkOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzhcbiAgdHJ5IHtcbiAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDApXG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KGJ1ZilcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIHJldHVybiA0MiA9PT0gYXJyLmZvbygpICYmXG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgLy8gQ2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufSkoKVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKVxuICAgIHJldHVybiBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pXG5cbiAgdmFyIHR5cGUgPSB0eXBlb2Ygc3ViamVjdFxuXG4gIC8vIFdvcmthcm91bmQ6IG5vZGUncyBiYXNlNjQgaW1wbGVtZW50YXRpb24gYWxsb3dzIGZvciBub24tcGFkZGVkIHN0cmluZ3NcbiAgLy8gd2hpbGUgYmFzZTY0LWpzIGRvZXMgbm90LlxuICBpZiAoZW5jb2RpbmcgPT09ICdiYXNlNjQnICYmIHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgc3ViamVjdCA9IHN0cmluZ3RyaW0oc3ViamVjdClcbiAgICB3aGlsZSAoc3ViamVjdC5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgICBzdWJqZWN0ID0gc3ViamVjdCArICc9J1xuICAgIH1cbiAgfVxuXG4gIC8vIEZpbmQgdGhlIGxlbmd0aFxuICB2YXIgbGVuZ3RoXG4gIGlmICh0eXBlID09PSAnbnVtYmVyJylcbiAgICBsZW5ndGggPSBjb2VyY2Uoc3ViamVjdClcbiAgZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpXG4gICAgbGVuZ3RoID0gQnVmZmVyLmJ5dGVMZW5ndGgoc3ViamVjdCwgZW5jb2RpbmcpXG4gIGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKVxuICAgIGxlbmd0aCA9IGNvZXJjZShzdWJqZWN0Lmxlbmd0aCkgLy8gYXNzdW1lIHRoYXQgb2JqZWN0IGlzIGFycmF5LWxpa2VcbiAgZWxzZVxuICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgbmVlZHMgdG8gYmUgYSBudW1iZXIsIGFycmF5IG9yIHN0cmluZy4nKVxuXG4gIHZhciBidWZcbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICAvLyBQcmVmZXJyZWQ6IFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgYnVmID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBUSElTIGluc3RhbmNlIG9mIEJ1ZmZlciAoY3JlYXRlZCBieSBgbmV3YClcbiAgICBidWYgPSB0aGlzXG4gICAgYnVmLmxlbmd0aCA9IGxlbmd0aFxuICAgIGJ1Zi5faXNCdWZmZXIgPSB0cnVlXG4gIH1cblxuICB2YXIgaVxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cyAmJiB0eXBlb2Ygc3ViamVjdC5ieXRlTGVuZ3RoID09PSAnbnVtYmVyJykge1xuICAgIC8vIFNwZWVkIG9wdGltaXphdGlvbiAtLSB1c2Ugc2V0IGlmIHdlJ3JlIGNvcHlpbmcgZnJvbSBhIHR5cGVkIGFycmF5XG4gICAgYnVmLl9zZXQoc3ViamVjdClcbiAgfSBlbHNlIGlmIChpc0FycmF5aXNoKHN1YmplY3QpKSB7XG4gICAgLy8gVHJlYXQgYXJyYXktaXNoIG9iamVjdHMgYXMgYSBieXRlIGFycmF5XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpKVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0LnJlYWRVSW50OChpKVxuICAgICAgZWxzZVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0W2ldXG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgYnVmLndyaXRlKHN1YmplY3QsIDAsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmICFCdWZmZXIuX3VzZVR5cGVkQXJyYXlzICYmICFub1plcm8pIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGJ1ZltpXSA9IDBcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbi8vIFNUQVRJQyBNRVRIT0RTXG4vLyA9PT09PT09PT09PT09PVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gKGIpIHtcbiAgcmV0dXJuICEhKGIgIT09IG51bGwgJiYgYiAhPT0gdW5kZWZpbmVkICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGZ1bmN0aW9uIChzdHIsIGVuY29kaW5nKSB7XG4gIHZhciByZXRcbiAgc3RyID0gc3RyICsgJydcbiAgc3dpdGNoIChlbmNvZGluZyB8fCAndXRmOCcpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aCAvIDJcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gdXRmOFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAncmF3JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggKiAyXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZW5jb2RpbmcnKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIChsaXN0LCB0b3RhbExlbmd0aCkge1xuICBhc3NlcnQoaXNBcnJheShsaXN0KSwgJ1VzYWdlOiBCdWZmZXIuY29uY2F0KGxpc3QsIFt0b3RhbExlbmd0aF0pXFxuJyArXG4gICAgICAnbGlzdCBzaG91bGQgYmUgYW4gQXJyYXkuJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9IGVsc2UgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGxpc3RbMF1cbiAgfVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdG90YWxMZW5ndGggIT09ICdudW1iZXInKSB7XG4gICAgdG90YWxMZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRvdGFsTGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIodG90YWxMZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuLy8gQlVGRkVSIElOU1RBTkNFIE1FVEhPRFNcbi8vID09PT09PT09PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIF9oZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGFzc2VydChzdHJMZW4gJSAyID09PSAwLCAnSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGJ5dGUgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgYXNzZXJ0KCFpc05hTihieXRlKSwgJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gYnl0ZVxuICB9XG4gIEJ1ZmZlci5fY2hhcnNXcml0dGVuID0gaSAqIDJcbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gX3V0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF9hc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IEJ1ZmZlci5fY2hhcnNXcml0dGVuID1cbiAgICBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF9iaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBfYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIF9iYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gX3V0ZjE2bGVXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gU3VwcG9ydCBib3RoIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZylcbiAgLy8gYW5kIHRoZSBsZWdhY3kgKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIGlmICghaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHsgIC8vIGxlZ2FjeVxuICAgIHZhciBzd2FwID0gZW5jb2RpbmdcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIG9mZnNldCA9IGxlbmd0aFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IF9oZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSBfdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IF9hc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBfYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IF9iYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gX3V0ZjE2bGVXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG4gIHN0YXJ0ID0gTnVtYmVyKHN0YXJ0KSB8fCAwXG4gIGVuZCA9IChlbmQgIT09IHVuZGVmaW5lZClcbiAgICA/IE51bWJlcihlbmQpXG4gICAgOiBlbmQgPSBzZWxmLmxlbmd0aFxuXG4gIC8vIEZhc3RwYXRoIGVtcHR5IHN0cmluZ3NcbiAgaWYgKGVuZCA9PT0gc3RhcnQpXG4gICAgcmV0dXJuICcnXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IF9oZXhTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSBfdXRmOFNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IF9hc2NpaVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBfYmluYXJ5U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IF9iYXNlNjRTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gX3V0ZjE2bGVTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uICh0YXJnZXQsIHRhcmdldF9zdGFydCwgc3RhcnQsIGVuZCkge1xuICB2YXIgc291cmNlID0gdGhpc1xuXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICghdGFyZ2V0X3N0YXJ0KSB0YXJnZXRfc3RhcnQgPSAwXG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgc291cmNlLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBhc3NlcnQoZW5kID49IHN0YXJ0LCAnc291cmNlRW5kIDwgc291cmNlU3RhcnQnKVxuICBhc3NlcnQodGFyZ2V0X3N0YXJ0ID49IDAgJiYgdGFyZ2V0X3N0YXJ0IDwgdGFyZ2V0Lmxlbmd0aCxcbiAgICAgICd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgYXNzZXJ0KHN0YXJ0ID49IDAgJiYgc3RhcnQgPCBzb3VyY2UubGVuZ3RoLCAnc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChlbmQgPj0gMCAmJiBlbmQgPD0gc291cmNlLmxlbmd0aCwgJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpXG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgPCBlbmQgLSBzdGFydClcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0ICsgc3RhcnRcblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAobGVuIDwgMTAwIHx8ICFCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0X3N0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0X3N0YXJ0KVxuICB9XG59XG5cbmZ1bmN0aW9uIF9iYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gX3V0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXMgPSAnJ1xuICB2YXIgdG1wID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgaWYgKGJ1ZltpXSA8PSAweDdGKSB7XG4gICAgICByZXMgKz0gZGVjb2RlVXRmOENoYXIodG1wKSArIFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICAgICAgdG1wID0gJydcbiAgICB9IGVsc2Uge1xuICAgICAgdG1wICs9ICclJyArIGJ1ZltpXS50b1N0cmluZygxNilcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzICsgZGVjb2RlVXRmOENoYXIodG1wKVxufVxuXG5mdW5jdGlvbiBfYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspXG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIF9iaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHJldHVybiBfYXNjaWlTbGljZShidWYsIHN0YXJ0LCBlbmQpXG59XG5cbmZ1bmN0aW9uIF9oZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIF91dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2krMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gY2xhbXAoc3RhcnQsIGxlbiwgMClcbiAgZW5kID0gY2xhbXAoZW5kLCBsZW4sIGxlbilcblxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIHJldHVybiBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIHZhciBuZXdCdWYgPSBuZXcgQnVmZmVyKHNsaWNlTGVuLCB1bmRlZmluZWQsIHRydWUpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZUxlbjsgaSsrKSB7XG4gICAgICBuZXdCdWZbaV0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gICAgcmV0dXJuIG5ld0J1ZlxuICB9XG59XG5cbi8vIGBnZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5mdW5jdGlvbiBfcmVhZFVJbnQxNiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWxcbiAgaWYgKGxpdHRsZUVuZGlhbikge1xuICAgIHZhbCA9IGJ1ZltvZmZzZXRdXG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdIDw8IDhcbiAgfSBlbHNlIHtcbiAgICB2YWwgPSBidWZbb2Zmc2V0XSA8PCA4XG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdXG4gIH1cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQxNih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQxNih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRVSW50MzIgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsXG4gIGlmIChsaXR0bGVFbmRpYW4pIHtcbiAgICBpZiAob2Zmc2V0ICsgMiA8IGxlbilcbiAgICAgIHZhbCA9IGJ1ZltvZmZzZXQgKyAyXSA8PCAxNlxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXSA8PCA4XG4gICAgdmFsIHw9IGJ1ZltvZmZzZXRdXG4gICAgaWYgKG9mZnNldCArIDMgPCBsZW4pXG4gICAgICB2YWwgPSB2YWwgKyAoYnVmW29mZnNldCArIDNdIDw8IDI0ID4+PiAwKVxuICB9IGVsc2Uge1xuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsID0gYnVmW29mZnNldCArIDFdIDw8IDE2XG4gICAgaWYgKG9mZnNldCArIDIgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDJdIDw8IDhcbiAgICBpZiAob2Zmc2V0ICsgMyA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgM11cbiAgICB2YWwgPSB2YWwgKyAoYnVmW29mZnNldF0gPDwgMjQgPj4+IDApXG4gIH1cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQzMih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQzMih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgdmFyIG5lZyA9IHRoaXNbb2Zmc2V0XSAmIDB4ODBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xXG4gIGVsc2VcbiAgICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbmZ1bmN0aW9uIF9yZWFkSW50MTYgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsID0gX3JlYWRVSW50MTYoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgdHJ1ZSlcbiAgdmFyIG5lZyA9IHZhbCAmIDB4ODAwMFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZmZmIC0gdmFsICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MTYodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDE2KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZEludDMyIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbCA9IF9yZWFkVUludDMyKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHRydWUpXG4gIHZhciBuZWcgPSB2YWwgJiAweDgwMDAwMDAwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmZmZmZmZmIC0gdmFsICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MzIodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDMyKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZEZsb2F0IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHJldHVybiBpZWVlNzU0LnJlYWQoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRGbG9hdCh0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRmxvYXQodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkRG91YmxlIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgKyA3IDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHJldHVybiBpZWVlNzU0LnJlYWQoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRG91YmxlKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRG91YmxlKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZilcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpIHJldHVyblxuXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG59XG5cbmZ1bmN0aW9uIF93cml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmYpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGxlbiAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPVxuICAgICAgICAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmZmZmZmKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihsZW4gLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID1cbiAgICAgICAgKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmLCAtMHg4MClcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgdGhpcy53cml0ZVVJbnQ4KHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgdGhpcy53cml0ZVVJbnQ4KDB4ZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2ZmZiwgLTB4ODAwMClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIF93cml0ZVVJbnQxNihidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG4gIGVsc2VcbiAgICBfd3JpdGVVSW50MTYoYnVmLCAweGZmZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICBfd3JpdGVVSW50MzIoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgX3dyaXRlVUludDMyKGJ1ZiwgMHhmZmZmZmZmZiArIHZhbHVlICsgMSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZJRUVFNzU0KHZhbHVlLCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgNyA8IGJ1Zi5sZW5ndGgsXG4gICAgICAgICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmSUVFRTc1NCh2YWx1ZSwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gZmlsbCh2YWx1ZSwgc3RhcnQ9MCwgZW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiAodmFsdWUsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAwXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCkgZW5kID0gdGhpcy5sZW5ndGhcblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHZhbHVlID0gdmFsdWUuY2hhckNvZGVBdCgwKVxuICB9XG5cbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgIWlzTmFOKHZhbHVlKSwgJ3ZhbHVlIGlzIG5vdCBhIG51bWJlcicpXG4gIGFzc2VydChlbmQgPj0gc3RhcnQsICdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBhc3NlcnQoc3RhcnQgPj0gMCAmJiBzdGFydCA8IHRoaXMubGVuZ3RoLCAnc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChlbmQgPj0gMCAmJiBlbmQgPD0gdGhpcy5sZW5ndGgsICdlbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICB0aGlzW2ldID0gdmFsdWVcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBvdXQgPSBbXVxuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIG91dFtpXSA9IHRvSGV4KHRoaXNbaV0pXG4gICAgaWYgKGkgPT09IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMpIHtcbiAgICAgIG91dFtpICsgMV0gPSAnLi4uJ1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBvdXQuam9pbignICcpICsgJz4nXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgQXJyYXlCdWZmZXJgIHdpdGggdGhlICpjb3BpZWQqIG1lbW9yeSBvZiB0aGUgYnVmZmVyIGluc3RhbmNlLlxuICogQWRkZWQgaW4gTm9kZSAwLjEyLiBPbmx5IGF2YWlsYWJsZSBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgQXJyYXlCdWZmZXIuXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUudG9BcnJheUJ1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKVxuICAgICAgICBidWZbaV0gPSB0aGlzW2ldXG4gICAgICByZXR1cm4gYnVmLmJ1ZmZlclxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIHN0cmluZ3RyaW0gKHN0cikge1xuICBpZiAoc3RyLnRyaW0pIHJldHVybiBzdHIudHJpbSgpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG59XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IGdldC9zZXQgbWV0aG9kcyBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9nZXQgPSBhcnIuZ2V0XG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWQsIHdpbGwgYmUgcmVtb3ZlZCBpbiBub2RlIDAuMTMrXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbi8vIHNsaWNlKHN0YXJ0LCBlbmQpXG5mdW5jdGlvbiBjbGFtcCAoaW5kZXgsIGxlbiwgZGVmYXVsdFZhbHVlKSB7XG4gIGlmICh0eXBlb2YgaW5kZXggIT09ICdudW1iZXInKSByZXR1cm4gZGVmYXVsdFZhbHVlXG4gIGluZGV4ID0gfn5pbmRleDsgIC8vIENvZXJjZSB0byBpbnRlZ2VyLlxuICBpZiAoaW5kZXggPj0gbGVuKSByZXR1cm4gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgaW5kZXggKz0gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgcmV0dXJuIDBcbn1cblxuZnVuY3Rpb24gY29lcmNlIChsZW5ndGgpIHtcbiAgLy8gQ29lcmNlIGxlbmd0aCB0byBhIG51bWJlciAocG9zc2libHkgTmFOKSwgcm91bmQgdXBcbiAgLy8gaW4gY2FzZSBpdCdzIGZyYWN0aW9uYWwgKGUuZy4gMTIzLjQ1NikgdGhlbiBkbyBhXG4gIC8vIGRvdWJsZSBuZWdhdGUgdG8gY29lcmNlIGEgTmFOIHRvIDAuIEVhc3ksIHJpZ2h0P1xuICBsZW5ndGggPSB+fk1hdGguY2VpbCgrbGVuZ3RoKVxuICByZXR1cm4gbGVuZ3RoIDwgMCA/IDAgOiBsZW5ndGhcbn1cblxuZnVuY3Rpb24gaXNBcnJheSAoc3ViamVjdCkge1xuICByZXR1cm4gKEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHN1YmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN1YmplY3QpID09PSAnW29iamVjdCBBcnJheV0nXG4gIH0pKHN1YmplY3QpXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXlpc2ggKHN1YmplY3QpIHtcbiAgcmV0dXJuIGlzQXJyYXkoc3ViamVjdCkgfHwgQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpIHx8XG4gICAgICBzdWJqZWN0ICYmIHR5cGVvZiBzdWJqZWN0ID09PSAnb2JqZWN0JyAmJlxuICAgICAgdHlwZW9mIHN1YmplY3QubGVuZ3RoID09PSAnbnVtYmVyJ1xufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGIgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGlmIChiIDw9IDB4N0YpXG4gICAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSlcbiAgICBlbHNlIHtcbiAgICAgIHZhciBzdGFydCA9IGlcbiAgICAgIGlmIChiID49IDB4RDgwMCAmJiBiIDw9IDB4REZGRikgaSsrXG4gICAgICB2YXIgaCA9IGVuY29kZVVSSUNvbXBvbmVudChzdHIuc2xpY2Uoc3RhcnQsIGkrMSkpLnN1YnN0cigxKS5zcGxpdCgnJScpXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGgubGVuZ3RoOyBqKyspXG4gICAgICAgIGJ5dGVBcnJheS5wdXNoKHBhcnNlSW50KGhbal0sIDE2KSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoc3RyKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIHBvc1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKVxuICAgICAgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiBkZWNvZGVVdGY4Q2hhciAoc3RyKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHIpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCkgLy8gVVRGIDggaW52YWxpZCBjaGFyXG4gIH1cbn1cblxuLypcbiAqIFdlIGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHZhbHVlIGlzIGEgdmFsaWQgaW50ZWdlci4gVGhpcyBtZWFucyB0aGF0IGl0XG4gKiBpcyBub24tbmVnYXRpdmUuIEl0IGhhcyBubyBmcmFjdGlvbmFsIGNvbXBvbmVudCBhbmQgdGhhdCBpdCBkb2VzIG5vdFxuICogZXhjZWVkIHRoZSBtYXhpbXVtIGFsbG93ZWQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHZlcmlmdWludCAodmFsdWUsIG1heCkge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPj0gMCwgJ3NwZWNpZmllZCBhIG5lZ2F0aXZlIHZhbHVlIGZvciB3cml0aW5nIGFuIHVuc2lnbmVkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGlzIGxhcmdlciB0aGFuIG1heGltdW0gdmFsdWUgZm9yIHR5cGUnKVxuICBhc3NlcnQoTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlLCAndmFsdWUgaGFzIGEgZnJhY3Rpb25hbCBjb21wb25lbnQnKVxufVxuXG5mdW5jdGlvbiB2ZXJpZnNpbnQgKHZhbHVlLCBtYXgsIG1pbikge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgbGFyZ2VyIHRoYW4gbWF4aW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlID49IG1pbiwgJ3ZhbHVlIHNtYWxsZXIgdGhhbiBtaW5pbXVtIGFsbG93ZWQgdmFsdWUnKVxuICBhc3NlcnQoTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlLCAndmFsdWUgaGFzIGEgZnJhY3Rpb25hbCBjb21wb25lbnQnKVxufVxuXG5mdW5jdGlvbiB2ZXJpZklFRUU3NTQgKHZhbHVlLCBtYXgsIG1pbikge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgbGFyZ2VyIHRoYW4gbWF4aW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlID49IG1pbiwgJ3ZhbHVlIHNtYWxsZXIgdGhhbiBtaW5pbXVtIGFsbG93ZWQgdmFsdWUnKVxufVxuXG5mdW5jdGlvbiBhc3NlcnQgKHRlc3QsIG1lc3NhZ2UpIHtcbiAgaWYgKCF0ZXN0KSB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSB8fCAnRmFpbGVkIGFzc2VydGlvbicpXG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBQTFVTICAgPSAnKycuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0ggID0gJy8nLmNoYXJDb2RlQXQoMClcblx0dmFyIE5VTUJFUiA9ICcwJy5jaGFyQ29kZUF0KDApXG5cdHZhciBMT1dFUiAgPSAnYScuY2hhckNvZGVBdCgwKVxuXHR2YXIgVVBQRVIgID0gJ0EnLmNoYXJDb2RlQXQoMClcblxuXHRmdW5jdGlvbiBkZWNvZGUgKGVsdCkge1xuXHRcdHZhciBjb2RlID0gZWx0LmNoYXJDb2RlQXQoMClcblx0XHRpZiAoY29kZSA9PT0gUExVUylcblx0XHRcdHJldHVybiA2MiAvLyAnKydcblx0XHRpZiAoY29kZSA9PT0gU0xBU0gpXG5cdFx0XHRyZXR1cm4gNjMgLy8gJy8nXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIpXG5cdFx0XHRyZXR1cm4gLTEgLy9ubyBtYXRjaFxuXHRcdGlmIChjb2RlIDwgTlVNQkVSICsgMTApXG5cdFx0XHRyZXR1cm4gY29kZSAtIE5VTUJFUiArIDI2ICsgMjZcblx0XHRpZiAoY29kZSA8IFVQUEVSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIFVQUEVSXG5cdFx0aWYgKGNvZGUgPCBMT1dFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBMT1dFUiArIDI2XG5cdH1cblxuXHRmdW5jdGlvbiBiNjRUb0J5dGVBcnJheSAoYjY0KSB7XG5cdFx0dmFyIGksIGosIGwsIHRtcCwgcGxhY2VIb2xkZXJzLCBhcnJcblxuXHRcdGlmIChiNjQubGVuZ3RoICUgNCA+IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG5cdFx0fVxuXG5cdFx0Ly8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcblx0XHQvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG5cdFx0Ly8gcmVwcmVzZW50IG9uZSBieXRlXG5cdFx0Ly8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG5cdFx0Ly8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuXHRcdHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cdFx0cGxhY2VIb2xkZXJzID0gJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDIpID8gMiA6ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAxKSA/IDEgOiAwXG5cblx0XHQvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcblx0XHRhcnIgPSBuZXcgQXJyKGI2NC5sZW5ndGggKiAzIC8gNCAtIHBsYWNlSG9sZGVycylcblxuXHRcdC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcblx0XHRsID0gcGxhY2VIb2xkZXJzID4gMCA/IGI2NC5sZW5ndGggLSA0IDogYjY0Lmxlbmd0aFxuXG5cdFx0dmFyIEwgPSAwXG5cblx0XHRmdW5jdGlvbiBwdXNoICh2KSB7XG5cdFx0XHRhcnJbTCsrXSA9IHZcblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBqID0gMDsgaSA8IGw7IGkgKz0gNCwgaiArPSAzKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDE4KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDEyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpIDw8IDYpIHwgZGVjb2RlKGI2NC5jaGFyQXQoaSArIDMpKVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwMDApID4+IDE2KVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwKSA+PiA4KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdGlmIChwbGFjZUhvbGRlcnMgPT09IDIpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA+PiA0KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDEwKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDQpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPj4gMilcblx0XHRcdHB1c2goKHRtcCA+PiA4KSAmIDB4RkYpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFyclxuXHR9XG5cblx0ZnVuY3Rpb24gdWludDhUb0Jhc2U2NCAodWludDgpIHtcblx0XHR2YXIgaSxcblx0XHRcdGV4dHJhQnl0ZXMgPSB1aW50OC5sZW5ndGggJSAzLCAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuXHRcdFx0b3V0cHV0ID0gXCJcIixcblx0XHRcdHRlbXAsIGxlbmd0aFxuXG5cdFx0ZnVuY3Rpb24gZW5jb2RlIChudW0pIHtcblx0XHRcdHJldHVybiBsb29rdXAuY2hhckF0KG51bSlcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuXHRcdFx0cmV0dXJuIGVuY29kZShudW0gPj4gMTggJiAweDNGKSArIGVuY29kZShudW0gPj4gMTIgJiAweDNGKSArIGVuY29kZShudW0gPj4gNiAmIDB4M0YpICsgZW5jb2RlKG51bSAmIDB4M0YpXG5cdFx0fVxuXG5cdFx0Ly8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuXHRcdGZvciAoaSA9IDAsIGxlbmd0aCA9IHVpbnQ4Lmxlbmd0aCAtIGV4dHJhQnl0ZXM7IGkgPCBsZW5ndGg7IGkgKz0gMykge1xuXHRcdFx0dGVtcCA9ICh1aW50OFtpXSA8PCAxNikgKyAodWludDhbaSArIDFdIDw8IDgpICsgKHVpbnQ4W2kgKyAyXSlcblx0XHRcdG91dHB1dCArPSB0cmlwbGV0VG9CYXNlNjQodGVtcClcblx0XHR9XG5cblx0XHQvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG5cdFx0c3dpdGNoIChleHRyYUJ5dGVzKSB7XG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdHRlbXAgPSB1aW50OFt1aW50OC5sZW5ndGggLSAxXVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPT0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIDI6XG5cdFx0XHRcdHRlbXAgPSAodWludDhbdWludDgubGVuZ3RoIC0gMl0gPDwgOCkgKyAodWludDhbdWludDgubGVuZ3RoIC0gMV0pXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAxMClcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA+PiA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgMikgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG91dHB1dFxuXHR9XG5cblx0ZXhwb3J0cy50b0J5dGVBcnJheSA9IGI2NFRvQnl0ZUFycmF5XG5cdGV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IHVpbnQ4VG9CYXNlNjRcbn0odHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gKHRoaXMuYmFzZTY0anMgPSB7fSkgOiBleHBvcnRzKSlcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWIvYjY0LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24oYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSxcbiAgICAgIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDEsXG4gICAgICBlTWF4ID0gKDEgPDwgZUxlbikgLSAxLFxuICAgICAgZUJpYXMgPSBlTWF4ID4+IDEsXG4gICAgICBuQml0cyA9IC03LFxuICAgICAgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwLFxuICAgICAgZCA9IGlzTEUgPyAtMSA6IDEsXG4gICAgICBzID0gYnVmZmVyW29mZnNldCArIGldO1xuXG4gIGkgKz0gZDtcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKTtcbiAgcyA+Pj0gKC1uQml0cyk7XG4gIG5CaXRzICs9IGVMZW47XG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpO1xuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpO1xuICBlID4+PSAoLW5CaXRzKTtcbiAgbkJpdHMgKz0gbUxlbjtcbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCk7XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzO1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSk7XG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICBlID0gZSAtIGVCaWFzO1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pO1xufTtcblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjLFxuICAgICAgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMSxcbiAgICAgIGVNYXggPSAoMSA8PCBlTGVuKSAtIDEsXG4gICAgICBlQmlhcyA9IGVNYXggPj4gMSxcbiAgICAgIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKSxcbiAgICAgIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKSxcbiAgICAgIGQgPSBpc0xFID8gMSA6IC0xLFxuICAgICAgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMDtcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKTtcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMDtcbiAgICBlID0gZU1heDtcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMik7XG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tO1xuICAgICAgYyAqPSAyO1xuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gYztcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpO1xuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrKztcbiAgICAgIGMgLz0gMjtcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwO1xuICAgICAgZSA9IGVNYXg7XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pO1xuICAgICAgZSA9IGUgKyBlQmlhcztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pO1xuICAgICAgZSA9IDA7XG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCk7XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbTtcbiAgZUxlbiArPSBtTGVuO1xuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpO1xuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyODtcbn07XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0XCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzc1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBCb2R5ID0gcmVxdWlyZSgnLi9ib2R5JylcbnZhciBzaW11bGF0aW9uID0gcmVxdWlyZSgnLi9zaW11bGF0aW9uJylcbnZhciBCb3VuZGFyeSA9IHJlcXVpcmUoJy4vYm91bmRhcnknKVxudmFyIEFuaW1hdGlvbiA9IHJlcXVpcmUoJy4vYW5pbWF0aW9uJylcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG52YXIgaGVpZ2h0ID0gcmVxdWlyZSgnLi91dGlsJykuaGVpZ2h0XG5cbnZhciBBY2NlbGVyYXRlID0gbW9kdWxlLmV4cG9ydHMgPSBBbmltYXRpb24oe1xuICBkZWZhdWx0T3B0aW9uczoge1xuICAgIGFjY2VsZXJhdGlvbjogMTAwMCxcbiAgICBib3VuY2U6IGZhbHNlLFxuICAgIG1pbkJvdW5jZURpc3RhbmNlOiA1LFxuICAgIGRhbXBpbmc6IDAuMixcbiAgICByZXN0aXR1dGlvbjogMC4yXG4gIH0sXG5cbiAgb25TdGFydDogZnVuY3Rpb24odmVsb2NpdHksIGZyb20sIHRvLCBvcHRzLCB1cGRhdGUsIGRvbmUpIHtcbiAgICB2YXIgZGlyZWN0aW9uID0gdG8uc3ViKGZyb20pLm5vcm1hbGl6ZSgpXG4gICAgdmFyIGFjY2VsZXJhdGlvbiA9IGRpcmVjdGlvbi5tdWx0KG9wdHMuYWNjZWxlcmF0aW9uKVxuICAgIHZhciBib3VuY2VBY2NlbGVyYXRpb24gPSBkaXJlY3Rpb24ubXVsdChvcHRzLmJvdW5jZUFjY2VsZXJhdGlvbiB8fCBvcHRzLmFjY2VsZXJhdGlvbilcbiAgICB2YXIgYm91bmRhcnkgPSBCb3VuZGFyeSh7XG4gICAgICBsZWZ0OiAodG8ueCA+IGZyb20ueCkgPyAtSW5maW5pdHkgOiB0by54LFxuICAgICAgcmlnaHQ6ICh0by54ID4gZnJvbS54KSA/IHRvLnggOiBJbmZpbml0eSxcbiAgICAgIHRvcDogKHRvLnkgPiBmcm9tLnkpID8gLUluZmluaXR5IDogdG8ueSxcbiAgICAgIGJvdHRvbTogKHRvLnkgPiBmcm9tLnkpID8gdG8ueSA6IEluZmluaXR5XG4gICAgfSlcbiAgICB2YXIgYm91bmNpbmdcblxuICAgIGlmKHRvLnN1Yihmcm9tKS5ub3JtKCkgPCAuMDAxICYmIHZlbG9jaXR5Lm5vcm0oKSA8IC4wMDEpIHtcbiAgICAgIHJldHVybiB1cGRhdGUuZG9uZSh0bywgdmVsb2NpdHkpXG4gICAgfVxuXG4gICAgdmFyIHJlc3RpdHV0aW9uID0gb3B0cy5yZXN0aXR1dGlvbiB8fCBvcHRzLmRhbXBpbmcgLy8gVE9ETyByZW1vdmUgZGFtcGluZ1xuXG4gICAgdmFyIGJvZHkgPSB0aGlzLl9ib2R5ID0gQm9keSh2ZWxvY2l0eSwgZnJvbSwge1xuICAgICAgYWNjZWxlcmF0ZTogZnVuY3Rpb24ocywgdCkge1xuICAgICAgICBpZihib3VuY2luZylcbiAgICAgICAgICByZXR1cm4gYm91bmNlQWNjZWxlcmF0aW9uXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gYWNjZWxlcmF0aW9uXG4gICAgICB9LFxuICAgICAgdXBkYXRlOiBmdW5jdGlvbihwb3NpdGlvbiwgdmVsb2NpdHkpIHtcbiAgICAgICAgaWYoYm91bmRhcnkuY29udGFpbnMocG9zaXRpb24pKSB7XG4gICAgICAgICAgdXBkYXRlLnN0YXRlKHBvc2l0aW9uLCB2ZWxvY2l0eSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZihvcHRzLmJvdW5jZSAmJlxuICAgICAgICAgICAgIE1hdGguYWJzKGhlaWdodChib3VuY2VBY2NlbGVyYXRpb24ubm9ybSgpLCB2ZWxvY2l0eS5ub3JtKCkgKiByZXN0aXR1dGlvbiwgMCkpID4gb3B0cy5taW5Cb3VuY2VEaXN0YW5jZSkge1xuICAgICAgICAgICAgICBib3VuY2luZyA9IHRydWVcbiAgICAgICAgICAgICAgYm9keS5wb3NpdGlvbiA9IFZlY3Rvcih0bylcbiAgICAgICAgICAgICAgYm9keS52ZWxvY2l0eS5zZWxmTXVsdCgtb3B0cy5kYW1waW5nKVxuICAgICAgICAgICAgICB1cGRhdGUuc3RhdGUodG8sIGJvZHkudmVsb2NpdHkpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVwZGF0ZS5kb25lKHRvLCB2ZWxvY2l0eSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICAgIHNpbXVsYXRpb24uYWRkQm9keSh0aGlzLl9ib2R5KVxuICB9LFxuICBvbkVuZDogZnVuY3Rpb24oKSB7XG4gICAgc2ltdWxhdGlvbi5yZW1vdmVCb2R5KHRoaXMuX2JvZHkpXG4gIH1cbn0pXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2FjY2VsZXJhdGUuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCdsb2Rhc2guZGVmYXVsdHMnKVxuICAsIFByb21pc2UgPSB3aW5kb3cuUHJvbWlzZSB8fCByZXF1aXJlKCdwcm9taXNlJylcbiAgLCBCb3VuZGFyeSA9IHJlcXVpcmUoJy4vYm91bmRhcnknKVxuICAsIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJylcbiAgLCBFbWl0dGVyID0gcmVxdWlyZSgnY29tcG9uZW50LWVtaXR0ZXInKVxuXG52YXIgcHJvdG8gPSB7XG4gIHRvOiBmdW5jdGlvbih4LCB5KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEJvdW5kYXJ5KVxuICAgICAgdGhpcy5fdG8gPSB4XG4gICAgZWxzZVxuICAgICAgdGhpcy5fdG8gPSBWZWN0b3IoeCwgeSlcbiAgICByZXR1cm4gdGhpc1xuICB9LFxuXG4gIHZlbG9jaXR5OiBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy5fdmVsb2NpdHkgPSBWZWN0b3IoeCwgeSlcbiAgICByZXR1cm4gdGhpc1xuICB9LFxuXG4gIGZyb206IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLl9mcm9tID0gVmVjdG9yKHgsIHkpXG4gICAgcmV0dXJuIHRoaXNcbiAgfSxcblxuICBfdXBkYXRlU3RhdGU6IGZ1bmN0aW9uKHBvc2l0aW9uLCB2ZWxvY2l0eSkge1xuICAgIHRoaXMuX3BoeXMucG9zaXRpb24ocG9zaXRpb24pXG4gICAgdGhpcy5fcGh5cy52ZWxvY2l0eSh2ZWxvY2l0eSlcbiAgfSxcblxuICBjYW5jZWw6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX29uRW5kKClcbiAgICB0aGlzLl9ydW5uaW5nID0gZmFsc2VcbiAgICB0aGlzLl9yZWplY3QoKVxuICB9LFxuXG4gIHJ1bm5pbmc6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9ydW5uaW5nIHx8IGZhbHNlXG4gIH0sXG5cbiAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgICAgLCBmcm9tID0gKHRoaXMuX2Zyb20pID8gdGhpcy5fZnJvbSA6IHRoaXMuX3BoeXMucG9zaXRpb24oKVxuICAgICAgLCB0byA9ICh0aGlzLl90bykgPyB0aGlzLl90byA6IHRoaXMuX3BoeXMucG9zaXRpb24oKVxuICAgICAgLCB2ZWxvY2l0eSA9ICh0aGlzLl92ZWxvY2l0eSkgPyB0aGlzLl92ZWxvY2l0eSA6IHRoaXMuX3BoeXMudmVsb2NpdHkoKVxuICAgICAgLCBvcHRzID0gZGVmYXVsdHMoe30sIHRoaXMuX29wdHMgfHwge30sIHRoaXMuX2RlZmF1bHRPcHRzKVxuXG4gICAgdmFyIHVwZGF0ZSA9IHtcbiAgICAgIHN0YXRlOiBmdW5jdGlvbihwb3NpdGlvbiwgdmVsb2NpdHkpIHtcbiAgICAgICAgdGhhdC5fdXBkYXRlU3RhdGUocG9zaXRpb24sIHZlbG9jaXR5KVxuICAgICAgfSxcbiAgICAgIGRvbmU6IGZ1bmN0aW9uKHBvc2l0aW9uLCB2ZWxvY2l0eSkge1xuICAgICAgICB0aGF0Ll91cGRhdGVTdGF0ZShwb3NpdGlvbiwgdmVsb2NpdHkpXG4gICAgICAgIHRoYXQuX29uRW5kKClcbiAgICAgICAgdGhhdC5fcnVubmluZyA9IGZhbHNlXG4gICAgICAgIHRoYXQuX3Jlc29sdmUoeyBwb3NpdGlvbjogcG9zaXRpb24sIHZlbG9jaXR5OiB2ZWxvY2l0eSB9KVxuICAgICAgfSxcbiAgICAgIGNhbmNlbDogZnVuY3Rpb24ocG9zaXRpb24sIHZlbG9jaXR5KSB7XG4gICAgICAgIHRoYXQuX3VwZGF0ZVN0YXRlKHBvc2l0aW9uLCB2ZWxvY2l0eSlcbiAgICAgICAgdGhhdC5fb25FbmQoKVxuICAgICAgICB0aGF0Ll9ydW5uaW5nID0gZmFsc2VcbiAgICAgICAgdGhhdC5fcmVqZWN0KClcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fcGh5cy5fc3RhcnRBbmltYXRpb24odGhpcylcblxuICAgIHRoaXMuX3J1bm5pbmcgPSB0cnVlXG4gICAgaWYodG8gaW5zdGFuY2VvZiBCb3VuZGFyeSlcbiAgICAgIHRvID0gdG8ubmVhcmVzdEludGVyc2VjdChmcm9tLCB2ZWxvY2l0eSlcbiAgICB0aGlzLl9vblN0YXJ0KHZlbG9jaXR5LCBmcm9tLCB0bywgb3B0cywgdXBkYXRlKVxuXG4gICAgcmV0dXJuIHRoYXQuX2VuZGVkXG4gIH1cbn1cblxuZnVuY3Rpb24gQW5pbWF0aW9uKGNhbGxiYWNrcykge1xuICB2YXIgYW5pbWF0aW9uID0gZnVuY3Rpb24ocGh5cywgb3B0cykge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHRoaXMuX29wdHMgPSBvcHRzXG4gICAgdGhpcy5fcGh5cyA9IHBoeXNcbiAgICB0aGlzLl9vblN0YXJ0ID0gY2FsbGJhY2tzLm9uU3RhcnRcbiAgICB0aGlzLl9vbkVuZCA9IGNhbGxiYWNrcy5vbkVuZFxuICAgIHRoaXMuX2RlZmF1bHRPcHRzID0gY2FsbGJhY2tzLmRlZmF1bHRPcHRpb25zXG5cbiAgICB0aGlzLl9lbmRlZCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdGhhdC5fcmVzb2x2ZSA9IHJlc29sdmVcbiAgICAgIHRoYXQuX3JlamVjdCA9IHJlamVjdFxuICAgIH0pXG5cbiAgICB0aGlzLnN0YXJ0ID0gdGhpcy5zdGFydC5iaW5kKHRoaXMpXG4gIH1cblxuICBFbWl0dGVyKGFuaW1hdGlvbi5wcm90b3R5cGUpXG4gIGFuaW1hdGlvbi5wcm90b3R5cGUgPSBwcm90b1xuXG4gIHJldHVybiBhbmltYXRpb25cbn1cblxuXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGlvblxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9hbmltYXRpb24uanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCdsb2Rhc2guZGVmYXVsdHMnKVxuICAsIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJylcbiAgLCBzaW11bGF0aW9uID0gcmVxdWlyZSgnLi9zaW11bGF0aW9uJylcbiAgLCBCb2R5ID0gcmVxdWlyZSgnLi9ib2R5JylcblxudmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICB0ZW5zaW9uOiAxMDAsXG4gIGRhbXBpbmc6IDEwLFxuICBzZXBlcmF0aW9uOiAwLFxuICBvZmZzZXQ6IHsgeDogMCwgeTogMCB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXR0YWNoU3ByaW5nXG5mdW5jdGlvbiBBdHRhY2hTcHJpbmcocGh5cywgYXR0YWNobWVudCwgb3B0cykge1xuICB0aGlzLl9waHlzID0gcGh5c1xuICB0aGlzLl9vcHRzID0gZGVmYXVsdHMoe30sIG9wdHMgfHwge30sIGRlZmF1bHRPcHRpb25zKVxuICB0aGlzLl9wb3NpdGlvbiA9IHBoeXMucG9zaXRpb24oKVxuICB0aGlzLl92ZWxvY2l0eSA9IHBoeXMudmVsb2NpdHkoKVxuICBpZih0eXBlb2YgYXR0YWNobWVudC5wb3NpdGlvbiA9PT0gJ2Z1bmN0aW9uJylcbiAgICB0aGlzLl9hdHRhY2htZW50ID0gYXR0YWNobWVudC5wb3NpdGlvbi5iaW5kKGF0dGFjaG1lbnQpXG4gIGVsc2VcbiAgICB0aGlzLl9hdHRhY2htZW50ID0gYXR0YWNobWVudFxufVxuXG5BdHRhY2hTcHJpbmcucHJvdG90eXBlLnBvc2l0aW9uID0gZnVuY3Rpb24oeCwgeSkge1xuICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcG9zaXRpb25cbiAgfVxuICBpZih0aGlzLl9ib2R5KVxuICAgIHRoaXMuX2JvZHkucG9zaXRpb24gPSB0aGlzLl9wb3NpdGlvbiA9IFZlY3Rvcih4LCB5KVxuICBlbHNlXG4gICAgdGhpcy5fcG9zaXRpb24gPSBWZWN0b3IoeCwgeSlcbn1cblxuQXR0YWNoU3ByaW5nLnByb3RvdHlwZS52ZWxvY2l0eSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgaWYodGhpcy5fYm9keSlcbiAgICB0aGlzLl9ib2R5LnZlbG9jaXR5ID0gdGhpcy5fdmVsb2NpdHkgPSBWZWN0b3IoeCwgeSlcbiAgZWxzZVxuICAgIHRoaXMuX3ZlbG9jaXR5ID0gVmVjdG9yKHgsIHkpXG59XG5cbkF0dGFjaFNwcmluZy5wcm90b3R5cGUuY2FuY2VsID0gZnVuY3Rpb24oeCwgeSkge1xuICB0aGlzLl9ydW5uaW5nID0gZmFsc2VcbiAgc2ltdWxhdGlvbi5yZW1vdmVCb2R5KHRoaXMuX2JvZHkpXG59XG5cbkF0dGFjaFNwcmluZy5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgdGhpcy5fcnVubmluZyA9IGZhbHNlXG4gIHNpbXVsYXRpb24ucmVtb3ZlQm9keSh0aGlzLl9ib2R5KVxufVxuXG5BdHRhY2hTcHJpbmcucHJvdG90eXBlLnJ1bm5pbmcgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHJldHVybiB0aGlzLl9ydW5uaW5nXG59XG5cbndpbmRvdy51bml0ID0gMFxuQXR0YWNoU3ByaW5nLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYXR0YWNobWVudCA9IHRoaXMuX2F0dGFjaG1lbnRcbiAgICAsIG9wdHMgPSB0aGlzLl9vcHRzXG4gICAgLCBwaHlzID0gdGhpcy5fcGh5c1xuICAgICwgdmVsb2NpdHkgPSB0aGlzLl92ZWxvY2l0eVxuICAgICwgcG9zaXRpb24gPSB0aGlzLl9wb3NpdGlvblxuICAgICwgdGhhdCA9IHRoaXNcblxuICBwaHlzLl9zdGFydEFuaW1hdGlvbih0aGlzKVxuXG4gIHRoaXMuX3J1bm5pbmcgPSB0cnVlXG5cbiAgdmFyIGJvZHkgPSB0aGlzLl9ib2R5ID0gQm9keSh2ZWxvY2l0eSwgcG9zaXRpb24sIHtcbiAgICBhY2NlbGVyYXRlOiBmdW5jdGlvbihzdGF0ZSwgdCkge1xuICAgICAgdmFyIGRpc3RWZWMgPSBzdGF0ZS5wb3NpdGlvbi5zZWxmU3ViKGF0dGFjaG1lbnQoKSlcbiAgICAgICAgLCBkaXN0ID0gZGlzdFZlYy5ub3JtKClcbiAgICAgICAgLCBkaXN0Tm9ybSA9IGRpc3RWZWMubm9ybWFsaXplKClcblxuICAgICAgaWYoZGlzdE5vcm0ueCA9PT0gMCAmJiBkaXN0Tm9ybS55ID09PSAwKSB7XG4gICAgICAgIGRpc3ROb3JtLnggPSBkaXN0Tm9ybS55ID0gMVxuICAgICAgICBkaXN0Tm9ybS5ub3JtYWxpemUoKVxuICAgICAgfVxuICAgICAgdmFyIGFjY2VsID0gZGlzdE5vcm1cbiAgICAgICAgLnNlbGZNdWx0KC1vcHRzLnRlbnNpb24pXG4gICAgICAgIC5zZWxmTXVsdChkaXN0IC0gb3B0cy5zZXBlcmF0aW9uKVxuICAgICAgICAuc2VsZlN1YihzdGF0ZS52ZWxvY2l0eS5zZWxmTXVsdChvcHRzLmRhbXBpbmcpKVxuXG4gICAgICByZXR1cm4gYWNjZWxcbiAgICB9LFxuICAgIHVwZGF0ZTogZnVuY3Rpb24ocG9zaXRpb24sIHZlbG9jaXR5KSB7XG4gICAgICB0aGF0Ll9wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cbiAgICAgIHRoYXQuX3ZlbG9jaXR5ID0gYm9keS52ZWxvY2l0eVxuICAgICAgaWYob3B0cy5vZmZzZXQpIHtcbiAgICAgICAgdmFyIHBvcyA9IHBvc2l0aW9uLmFkZChvcHRzLm9mZnNldClcbiAgICAgICAgcGh5cy5wb3NpdGlvbihwb3MpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwaHlzLnBvc2l0aW9uKHBvc2l0aW9uKVxuICAgICAgfVxuICAgICAgcGh5cy52ZWxvY2l0eSh2ZWxvY2l0eSlcbiAgICB9XG4gIH0pXG4gIHNpbXVsYXRpb24uYWRkQm9keShib2R5KVxuICByZXR1cm4gdGhpc1xufVxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvYXR0YWNoLXNwcmluZy5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG5cbm1vZHVsZS5leHBvcnRzID0gQm9keVxuXG5mdW5jdGlvbiBCb2R5KHZlbCwgZnJvbSwgZm5zKSB7XG4gIGlmKCEodGhpcyBpbnN0YW5jZW9mIEJvZHkpKSByZXR1cm4gbmV3IEJvZHkodmVsLCBmcm9tLCBmbnMpXG5cbiAgdGhpcy5wcmV2aW91c1Bvc2l0aW9uID0gdGhpcy5wb3NpdGlvbiA9IFZlY3Rvcihmcm9tKVxuICB0aGlzLnZlbG9jaXR5ID0gVmVjdG9yKHZlbClcbiAgdGhpcy5fZm5zID0gZm5zXG59XG5cbkJvZHkucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKGFscGhhKSB7XG4gIHZhciBwb3MgPSB0aGlzLnByZXZpb3VzUG9zaXRpb24uY2xvbmUoKS5sZXJwKHRoaXMucG9zaXRpb24sIGFscGhhKVxuICB0aGlzLl9mbnMudXBkYXRlKHBvcywgdGhpcy52ZWxvY2l0eSlcbn1cblxuQm9keS5wcm90b3R5cGUuYWNjZWxlcmF0ZSA9IGZ1bmN0aW9uKHN0YXRlLCB0KSB7XG4gIHJldHVybiB0aGlzLl9mbnMuYWNjZWxlcmF0ZShzdGF0ZSwgdClcbn1cblxuQm9keS5wcm90b3R5cGUuYXRSZXN0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnZlbG9jaXR5Lm5vcm0oKSA8IC4wMVxufVxuXG5Cb2R5LnByb3RvdHlwZS5hdFBvc2l0aW9uID0gZnVuY3Rpb24ocG9zKSB7XG4gIC8vcmV0dXJuIHdoZXRoZXIgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhpcy5wb3NpdGlvbiBhbmQgcG9zIGlzIGxlc3MgdGhhbiAuMVxuICByZXR1cm4gdGhpcy5wb3NpdGlvbi5zdWIoVmVjdG9yKHBvcykpLm5vcm0oKSA8IC4wMVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9ib2R5LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJylcbm1vZHVsZS5leHBvcnRzID0gQm91bmRhcnlcblxuZnVuY3Rpb24gcG9pbnRCZXR3ZWVuKHAsIHAxLCBwMikge1xuICByZXR1cm4gcCA+PSBwMSAmJiBwIDw9IHAyXG59XG5cbmZ1bmN0aW9uIHlJbnRlcnNlY3QoeSwgcG9pbnQsIGRpcmVjdGlvbikge1xuICB2YXIgZmFjdG9yID0gKHkgLSBwb2ludC55KSAvIGRpcmVjdGlvbi55XG4gIHJldHVybiBwb2ludC5hZGQoZGlyZWN0aW9uLmNsb25lKCkubXVsdChmYWN0b3IpKVxufVxuXG5mdW5jdGlvbiB4SW50ZXJzZWN0KHgsIHBvaW50LCBkaXJlY3Rpb24pIHtcbiAgdmFyIGZhY3RvciA9ICh4IC0gcG9pbnQueCkgLyBkaXJlY3Rpb24ueFxuICByZXR1cm4gcG9pbnQuYWRkKGRpcmVjdGlvbi5jbG9uZSgpLm11bHQoZmFjdG9yKSlcbn1cblxuQm91bmRhcnkucHJvdG90eXBlLmFwcGx5RGFtcGluZyA9IGZ1bmN0aW9uKHBvc2l0aW9uLCBkYW1waW5nKSB7XG4gIHZhciB4ID0gcG9zaXRpb24ueFxuICAgICwgeSA9IHBvc2l0aW9uLnlcblxuICBpZih4IDwgdGhpcy5sZWZ0KVxuICAgIHggPSB0aGlzLmxlZnQgLSAodGhpcy5sZWZ0IC0geCkgKiBkYW1waW5nXG5cbiAgaWYoeSA8IHRoaXMudG9wKVxuICAgIHkgPSB0aGlzLnRvcCAtICh0aGlzLnRvcCAtIHkpICogZGFtcGluZ1xuXG4gIGlmKHggPiB0aGlzLnJpZ2h0KVxuICAgIHggPSB0aGlzLnJpZ2h0IC0gKHRoaXMucmlnaHQgLSB4KSAqIGRhbXBpbmdcblxuICBpZih5ID4gdGhpcy5ib3R0b20pXG4gICAgeSA9IHRoaXMuYm90dG9tIC0gKHRoaXMuYm90dG9tIC0geSkgKiBkYW1waW5nXG5cbiAgcmV0dXJuIFZlY3Rvcih4LCB5KVxufVxuXG5mdW5jdGlvbiBCb3VuZGFyeShib3VuZGFyeSkge1xuICBpZighKHRoaXMgaW5zdGFuY2VvZiBCb3VuZGFyeSkpXG4gICAgcmV0dXJuIG5ldyBCb3VuZGFyeShib3VuZGFyeSlcblxuICB0aGlzLmxlZnQgPSAodHlwZW9mIGJvdW5kYXJ5LmxlZnQgIT09ICd1bmRlZmluZWQnKSA/IGJvdW5kYXJ5LmxlZnQgOiAtSW5maW5pdHlcbiAgdGhpcy5yaWdodCA9ICh0eXBlb2YgYm91bmRhcnkucmlnaHQgIT09ICd1bmRlZmluZWQnKSA/IGJvdW5kYXJ5LnJpZ2h0IDogSW5maW5pdHlcbiAgdGhpcy50b3AgPSAodHlwZW9mIGJvdW5kYXJ5LnRvcCAhPT0gJ3VuZGVmaW5lZCcpID8gYm91bmRhcnkudG9wIDogLUluZmluaXR5XG4gIHRoaXMuYm90dG9tID0gKHR5cGVvZiBib3VuZGFyeS5ib3R0b20gIT09ICd1bmRlZmluZWQnKSA/IGJvdW5kYXJ5LmJvdHRvbSA6IEluZmluaXR5XG59XG5cbkJvdW5kYXJ5LnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uKHB0KSB7XG4gIHJldHVybiBwdC54ID49IHRoaXMubGVmdCAmJlxuICAgICAgICAgcHQueCA8PSB0aGlzLnJpZ2h0ICYmXG4gICAgICAgICBwdC55ID49IHRoaXMudG9wICYmXG4gICAgICAgICBwdC55IDw9IHRoaXMuYm90dG9tXG59XG5cbkJvdW5kYXJ5LnByb3RvdHlwZS5uZWFyZXN0SW50ZXJzZWN0ID0gZnVuY3Rpb24ocG9pbnQsIHZlbG9jaXR5KSB7XG4gIHZhciBkaXJlY3Rpb24gPSBWZWN0b3IodmVsb2NpdHkpLm5vcm1hbGl6ZSgpXG4gICAgLCBwb2ludCA9IFZlY3Rvcihwb2ludClcbiAgICAsIGlzZWN0XG4gICAgLCBkaXN0WFxuICAgICwgZGlzdFlcblxuICBpZih2ZWxvY2l0eS55IDwgMClcbiAgICBpc2VjdCA9IHlJbnRlcnNlY3QodGhpcy50b3AsIHBvaW50LCBkaXJlY3Rpb24pXG4gIGlmKHZlbG9jaXR5LnkgPiAwKVxuICAgIGlzZWN0ID0geUludGVyc2VjdCh0aGlzLmJvdHRvbSwgcG9pbnQsIGRpcmVjdGlvbilcblxuICBpZihpc2VjdCAmJiBwb2ludEJldHdlZW4oaXNlY3QueCwgdGhpcy5sZWZ0LCB0aGlzLnJpZ2h0KSlcbiAgICByZXR1cm4gaXNlY3RcblxuICBpZih2ZWxvY2l0eS54IDwgMClcbiAgICBpc2VjdCA9IHhJbnRlcnNlY3QodGhpcy5sZWZ0LCBwb2ludCwgZGlyZWN0aW9uKVxuICBpZih2ZWxvY2l0eS54ID4gMClcbiAgICBpc2VjdCA9IHhJbnRlcnNlY3QodGhpcy5yaWdodCwgcG9pbnQsIGRpcmVjdGlvbilcblxuICBpZihpc2VjdCAmJiBwb2ludEJldHdlZW4oaXNlY3QueSwgdGhpcy50b3AsIHRoaXMuYm90dG9tKSlcbiAgICByZXR1cm4gaXNlY3RcblxuICAvL2lmIHRoZSB2ZWxvY2l0eSBpcyB6ZXJvLCBvciBpdCBkaWRuJ3QgaW50ZXJzZWN0IGFueSBsaW5lcyAob3V0c2lkZSB0aGUgYm94KVxuICAvL2p1c3Qgc2VuZCBpdCBpdCB0aGUgbmVhcmVzdCBib3VuZGFyeVxuICBkaXN0WCA9IChNYXRoLmFicyhwb2ludC54IC0gdGhpcy5sZWZ0KSA8IE1hdGguYWJzKHBvaW50LnggLSB0aGlzLnJpZ2h0KSkgPyB0aGlzLmxlZnQgOiB0aGlzLnJpZ2h0XG4gIGRpc3RZID0gKE1hdGguYWJzKHBvaW50LnkgLSB0aGlzLnRvcCkgPCBNYXRoLmFicyhwb2ludC55IC0gdGhpcy5ib3R0b20pKSA/IHRoaXMudG9wIDogdGhpcy5ib3R0b21cblxuICByZXR1cm4gKGRpc3RYIDwgZGlzdFkpID8gVmVjdG9yKGRpc3RYLCBwb2ludC55KSA6IFZlY3Rvcihwb2ludC54LCBkaXN0WSlcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvYm91bmRhcnkuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgQm9keSA9IHJlcXVpcmUoJy4vYm9keScpXG52YXIgc2ltdWxhdGlvbiA9IHJlcXVpcmUoJy4vc2ltdWxhdGlvbicpXG52YXIgQm91bmRhcnkgPSByZXF1aXJlKCcuL2JvdW5kYXJ5JylcbnZhciBBbmltYXRpb24gPSByZXF1aXJlKCcuL2FuaW1hdGlvbicpXG5cbnZhciBEZWNlbGVyYXRlID0gbW9kdWxlLmV4cG9ydHMgPSBBbmltYXRpb24oe1xuICBkZWZhdWx0T3B0aW9uczoge1xuICAgIGRlY2VsZXJhdGlvbjogNDAwXG4gIH0sXG4gIG9uU3RhcnQ6IGZ1bmN0aW9uKHZlbG9jaXR5LCBmcm9tLCB0bywgb3B0cywgdXBkYXRlLCBkb25lKSB7XG4gICAgdmFyIGRpcmVjdGlvbiA9IHRvLnN1Yihmcm9tKS5ub3JtYWxpemUoKVxuICAgICAgLCBkZWNlbGVyYXRpb24gPSBkaXJlY3Rpb24ubXVsdChvcHRzLmRlY2VsZXJhdGlvbikubmVnYXRlKClcbiAgICAgICwgYm91bmRhcnkgPSBCb3VuZGFyeSh7XG4gICAgICBsZWZ0OiBNYXRoLm1pbih0by54LCBmcm9tLngpLFxuICAgICAgcmlnaHQ6IE1hdGgubWF4KHRvLngsIGZyb20ueCksXG4gICAgICB0b3A6IE1hdGgubWluKHRvLnksIGZyb20ueSksXG4gICAgICBib3R0b206IE1hdGgubWF4KHRvLnksIGZyb20ueSlcbiAgICB9KVxuXG4gICAgdmVsb2NpdHkgPSBkaXJlY3Rpb24ubXVsdCh2ZWxvY2l0eS5ub3JtKCkpXG5cbiAgICB0aGlzLl9ib2R5ID0gQm9keSh2ZWxvY2l0eSwgZnJvbSwge1xuICAgICAgYWNjZWxlcmF0ZTogZnVuY3Rpb24ocywgdCkge1xuICAgICAgICByZXR1cm4gZGVjZWxlcmF0aW9uXG4gICAgICB9LFxuICAgICAgdXBkYXRlOiBmdW5jdGlvbihwb3NpdGlvbiwgdmVsb2NpdHkpIHtcbiAgICAgICAgaWYoIWRpcmVjdGlvbi5kaXJlY3Rpb25FcXVhbCh2ZWxvY2l0eSkpIHtcbiAgICAgICAgICB1cGRhdGUuY2FuY2VsKHBvc2l0aW9uLCB7IHg6IDAsIHk6IDAgfSlcbiAgICAgICAgfSBlbHNlIGlmKGJvdW5kYXJ5LmNvbnRhaW5zKHBvc2l0aW9uKSkge1xuICAgICAgICAgIHVwZGF0ZS5zdGF0ZShwb3NpdGlvbiwgdmVsb2NpdHkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlLmRvbmUodG8sIHZlbG9jaXR5KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgICBzaW11bGF0aW9uLmFkZEJvZHkodGhpcy5fYm9keSlcbiAgfSxcblxuICBvbkVuZDogZnVuY3Rpb24oKSB7XG4gICAgc2ltdWxhdGlvbi5yZW1vdmVCb2R5KHRoaXMuX2JvZHkpXG4gIH1cbn0pXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2RlY2VsZXJhdGUuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJ2NvbXBvbmVudC1lbWl0dGVyJylcbiAgLCBkZWZhdWx0cyA9IHJlcXVpcmUoJ2xvZGFzaC5kZWZhdWx0cycpXG5cbnZhciBkZWZhdWx0T3B0cyA9IHt9XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhZ1xuXG5mdW5jdGlvbiBEcmFnKHBoeXMsIG9wdHMsIHN0YXJ0KSB7XG4gIHZhciBoYW5kbGVzXG5cbiAgdGhpcy5fcGh5cyA9IHBoeXNcbiAgaWYodHlwZW9mIG9wdHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLl9zdGFydEZuID0gb3B0c1xuICAgIG9wdHMgPSB7fVxuICB9IGVsc2Uge1xuICAgIHRoaXMuX3N0YXJ0Rm4gPSBzdGFydFxuICB9XG5cbiAgdGhpcy5fb3B0cyA9IGRlZmF1bHRzKHt9LCBkZWZhdWx0T3B0cywgb3B0cylcblxuICAvL1dhcm4gb2YgZGVwcmVjYXRlZCBvcHRpb25cbiAgaWYodGhpcy5fb3B0cy5ib3VuZHJ5KXtcbiAgICBjb25zb2xlLndhcm4oXCJXYXJuaW5nOiBNaXNzcGVsbGVkIG9wdGlvbiAnYm91bmRyeScgaXMgYmVpbmcgZGVwcmVjYXRlZC4gUGxlYXNlIHVzZSAnYm91bmRhcnknIGluc3RlYWQuXCIpO1xuICAgIHRoaXMuX29wdHMuYm91bmRhcnkgPSB0aGlzLl9vcHRzLmJvdW5kcnk7XG4gICAgZGVsZXRlIHRoaXMuX29wdHMuYm91bmRyeTtcbiAgfVxuXG4gIGhhbmRsZXMgPSB0aGlzLl9vcHRzLmhhbmRsZVxuXG5cbiAgaWYoaGFuZGxlcyAmJiAhaGFuZGxlcy5sZW5ndGgpIHtcbiAgICBoYW5kbGVzID0gW2hhbmRsZXNdXG4gIH0gZWxzZSBpZihoYW5kbGVzICYmIGhhbmRsZXMubGVuZ3RoKSB7XG4gICAgaGFuZGxlcyA9IFtdLnNsaWNlLmNhbGwoaGFuZGxlcylcbiAgfSBlbHNlIHtcbiAgICBoYW5kbGVzID0gcGh5cy5lbHNcbiAgfVxuICBoYW5kbGVzLmZvckVhY2godGhpcy5fc2V0dXBIYW5kbGUsIHRoaXMpXG59XG5cbkVtaXR0ZXIoRHJhZy5wcm90b3R5cGUpXG5cbkRyYWcucHJvdG90eXBlLm1vdmVkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAodGhpcy5faW50ZXJhY3Rpb24uZGlzdGFuY2UoKSA+IDEwKVxufVxuXG5EcmFnLnByb3RvdHlwZS5fc2V0dXBIYW5kbGUgPSBmdW5jdGlvbihlbCkge1xuICAvL3N0YXJ0IGV2ZW50c1xuICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fc3RhcnQuYmluZCh0aGlzKSlcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fc3RhcnQuYmluZCh0aGlzKSlcblxuICAvL21vdmUgZXZlbnRzXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuX21vdmUuYmluZCh0aGlzKSlcbiAgLy9hcHBseSB0aGUgbW92ZSBldmVudCB0byB0aGUgd2luZG93LCBzbyBpdCBrZWVwcyBtb3ZpbmcsXG4gIC8vZXZlbnQgaWYgdGhlIGhhbmRsZSBkb2Vzbid0XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9tb3ZlLmJpbmQodGhpcykpXG5cbiAgLy9lbmQgZXZlbnRzXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5fZW5kLmJpbmQodGhpcykpXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5fZW5kLmJpbmQodGhpcykpXG59XG5cbkRyYWcucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uKGV2dCkge1xuICB0aGlzLl9zdGFydFRpbWUgPSBEYXRlLm5vdygpXG4gIGV2dC5wcmV2ZW50RGVmYXVsdCgpXG4gIHRoaXMuX21vdXNlZG93biA9IHRydWVcbiAgdGhpcy5faW50ZXJhY3Rpb24gPSB0aGlzLl9waHlzLmludGVyYWN0KHtcbiAgICBib3VuZGFyeTogdGhpcy5fb3B0cy5ib3VuZGFyeSxcbiAgICBkYW1waW5nOiB0aGlzLl9vcHRzLmRhbXBpbmcsXG4gICAgZGlyZWN0aW9uOiB0aGlzLl9vcHRzLmRpcmVjdGlvblxuICB9KVxuICB2YXIgcHJvbWlzZSA9IHRoaXMuX2ludGVyYWN0aW9uLnN0YXJ0KGV2dClcbiAgdGhpcy5fc3RhcnRGbiAmJiB0aGlzLl9zdGFydEZuKHByb21pc2UpXG4gIHRoaXMuZW1pdCgnc3RhcnQnLCBldnQpXG59XG5cbkRyYWcucHJvdG90eXBlLl9tb3ZlID0gZnVuY3Rpb24oZXZ0KSB7XG4gIGlmKCF0aGlzLl9tb3VzZWRvd24pIHJldHVyblxuICBldnQucHJldmVudERlZmF1bHQoKVxuXG4gIHRoaXMuX2ludGVyYWN0aW9uLnVwZGF0ZShldnQpXG4gIHRoaXMuZW1pdCgnbW92ZScsIGV2dClcbn1cblxuRHJhZy5wcm90b3R5cGUuX2VuZCA9IGZ1bmN0aW9uKGV2dCkge1xuICBpZighdGhpcy5fbW91c2Vkb3duKSByZXR1cm5cbiAgZXZ0LnByZXZlbnREZWZhdWx0KClcblxuICB0aGlzLl9tb3VzZWRvd24gPSBmYWxzZVxuXG4gIHRoaXMuX2ludGVyYWN0aW9uLmVuZCgpXG4gIHRoaXMuZW1pdCgnZW5kJywgZXZ0KVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9kcmFnLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIHNpbXVsYXRpb24gPSByZXF1aXJlKCcuL3NpbXVsYXRpb24nKVxudmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJylcbnZhciBSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKVxudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnbG9kYXNoLmRlZmF1bHRzJylcbnZhciBTcHJpbmcgPSByZXF1aXJlKCcuL3NwcmluZycpXG52YXIgQXR0YWNoU3ByaW5nID0gcmVxdWlyZSgnLi9hdHRhY2gtc3ByaW5nJylcbnZhciBEZWNlbGVyYXRlID0gcmVxdWlyZSgnLi9kZWNlbGVyYXRlJylcbnZhciBBY2NlbGVyYXRlID0gcmVxdWlyZSgnLi9hY2NlbGVyYXRlJylcbnZhciBEcmFnID0gcmVxdWlyZSgnLi9kcmFnJylcbnZhciBJbnRlcmFjdCA9IHJlcXVpcmUoJy4vaW50ZXJhY3QnKVxudmFyIEJvdW5kYXJ5ID0gcmVxdWlyZSgnLi9ib3VuZGFyeScpXG52YXIgUHJvbWlzZSA9IHdpbmRvdy5Qcm9taXNlIHx8IHJlcXVpcmUoJ3Byb21pc2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBoeXNpY3NcblxuZnVuY3Rpb24gUGh5c2ljcyhyZW5kZXJlck9yRWxzKSB7XG4gIGlmKCEodGhpcyBpbnN0YW5jZW9mIFBoeXNpY3MpKSB7XG4gICAgcmV0dXJuIG5ldyBQaHlzaWNzKHJlbmRlcmVyT3JFbHMpXG4gIH1cbiAgaWYodHlwZW9mIHJlbmRlcmVyT3JFbHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLl9yZW5kZXIgPSByZW5kZXJlck9yRWxzXG4gICAgdGhpcy5lbHMgPSBbXVxuICB9IGVsc2Uge1xuICAgIGlmKHJlbmRlcmVyT3JFbHMubGVuZ3RoKVxuICAgICAgdGhpcy5lbHMgPSBbXS5zbGljZS5jYWxsKHJlbmRlcmVyT3JFbHMpXG4gICAgZWxzZVxuICAgICAgdGhpcy5lbHMgPSBbcmVuZGVyZXJPckVsc11cblxuICAgIHRoaXMuX3JlbmRlcmVyID0gbmV3IFJlbmRlcmVyKHRoaXMuZWxzKVxuICAgIHRoaXMuX3JlbmRlciA9IHRoaXMuX3JlbmRlcmVyLnVwZGF0ZS5iaW5kKHRoaXMuX3JlbmRlcmVyKVxuICB9XG5cbiAgdGhpcy5fcG9zaXRpb24gPSBWZWN0b3IoMCwgMClcbiAgdGhpcy5fdmVsb2NpdHkgPSBWZWN0b3IoMCwgMClcbn1cblxuUGh5c2ljcy5Cb3VuZGFyeSA9IEJvdW5kYXJ5XG5QaHlzaWNzLkJvdW5kcnkgPSBCb3VuZGFyeVxuUGh5c2ljcy5WZWN0b3IgPSBWZWN0b3JcblBoeXNpY3MuUHJvbWlzZSA9IFByb21pc2VcblxuUGh5c2ljcy5wcm90b3R5cGUuc3R5bGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fcmVuZGVyZXIuc3R5bGUuYXBwbHkodGhpcy5fcmVuZGVyZXIsIGFyZ3VtZW50cylcbiAgcmV0dXJuIHRoaXNcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUudmlzaWJsZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9yZW5kZXJlci52aXNpYmxlLmFwcGx5KHRoaXMuX3JlbmRlcmVyLCBhcmd1bWVudHMpXG4gIHJldHVybiB0aGlzXG59XG5cblBoeXNpY3MucHJvdG90eXBlLmRpcmVjdGlvbiA9IGZ1bmN0aW9uKGQpIHtcbiAgdmFyIHZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eSgpXG4gICAgLCBoLCB2LCBjXG5cbiAgaWYodmVsb2NpdHkueCA8IDApICAgICAgaCA9ICdsZWZ0J1xuICBlbHNlIGlmKHZlbG9jaXR5LnggPiAwKSBoID0gJ3JpZ2h0J1xuXG4gIGlmKHZlbG9jaXR5LnkgPCAwKSAgICAgIHYgPSAndXAnXG4gIGVsc2UgaWYodmVsb2NpdHkueSA+IDApIHYgPSAnZG93bidcblxuICB2YXIgYyA9IGggKyAodiB8fCAnJykudG9VcHBlckNhc2UoKVxuXG4gIHJldHVybiBkID09PSBoIHx8IGQgPT09IHYgfHwgZCA9PT0gY1xufVxuXG5QaHlzaWNzLnByb3RvdHlwZS5hdFJlc3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eSgpXG4gIHJldHVybiB2ZWxvY2l0eS54ID09PSAwICYmIHZlbG9jaXR5LnkgPT09IDBcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuX3N0YXJ0QW5pbWF0aW9uID0gZnVuY3Rpb24oYW5pbWF0aW9uKSB7XG4gIGlmKHRoaXMuX2N1cnJlbnRBbmltYXRpb24gJiYgdGhpcy5fY3VycmVudEFuaW1hdGlvbi5ydW5uaW5nKCkpIHtcbiAgICB0aGlzLl9jdXJyZW50QW5pbWF0aW9uLmNhbmNlbCgpXG4gIH1cbiAgdGhpcy5fY3VycmVudEFuaW1hdGlvbiA9IGFuaW1hdGlvblxufVxuXG5QaHlzaWNzLnByb3RvdHlwZS52ZWxvY2l0eSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl92ZWxvY2l0eVxuICB0aGlzLl92ZWxvY2l0eSA9IFZlY3Rvcih4LCB5KVxuICByZXR1cm4gdGhpc1xufVxuXG5QaHlzaWNzLnByb3RvdHlwZS5wb3NpdGlvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9wb3NpdGlvbi5jbG9uZSgpXG4gIHRoaXMuX3Bvc2l0aW9uID0gVmVjdG9yKHgsIHkpXG4gIHRoaXMuX3JlbmRlcih0aGlzLl9wb3NpdGlvbi54LCB0aGlzLl9wb3NpdGlvbi55KVxuICByZXR1cm4gdGhpc1xufVxuXG5QaHlzaWNzLnByb3RvdHlwZS5pbnRlcmFjdCA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgcmV0dXJuIG5ldyBJbnRlcmFjdCh0aGlzLCBvcHRzKVxufVxuXG5QaHlzaWNzLnByb3RvdHlwZS5kcmFnID0gZnVuY3Rpb24ob3B0cywgc3RhcnQpIHtcbiAgcmV0dXJuIG5ldyBEcmFnKHRoaXMsIG9wdHMsIHN0YXJ0KVxufVxuXG5QaHlzaWNzLnByb3RvdHlwZS5zcHJpbmcgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHJldHVybiBuZXcgU3ByaW5nKHRoaXMsIG9wdHMpXG59XG5cblBoeXNpY3MucHJvdG90eXBlLmRlY2VsZXJhdGUgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHJldHVybiBuZXcgRGVjZWxlcmF0ZSh0aGlzLCBvcHRzKVxufVxuXG5QaHlzaWNzLnByb3RvdHlwZS5hY2NlbGVyYXRlID0gZnVuY3Rpb24ob3B0cykge1xuICByZXR1cm4gbmV3IEFjY2VsZXJhdGUodGhpcywgb3B0cylcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuYXR0YWNoU3ByaW5nID0gZnVuY3Rpb24oYXR0YWNobWVudCwgb3B0cykge1xuICByZXR1cm4gbmV3IEF0dGFjaFNwcmluZyh0aGlzLCBhdHRhY2htZW50LCBvcHRzKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ2xvZGFzaC5kZWZhdWx0cycpXG52YXIgVmVsb2NpdHkgPSByZXF1aXJlKCd0b3VjaC12ZWxvY2l0eScpXG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKVxudmFyIFByb21pc2UgPSByZXF1aXJlKCdwcm9taXNlJylcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciBCb3VuZGFyeSA9IHJlcXVpcmUoJy4vYm91bmRhcnknKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyYWN0XG5cbnZhciBkZWZhdWx0T3B0cyA9IHtcbiAgYm91bmRhcnk6IEJvdW5kYXJ5KHt9KSxcbiAgZGFtcGluZzogMCxcbiAgZGlyZWN0aW9uOiAnYm90aCdcbn1cblxuZnVuY3Rpb24gSW50ZXJhY3QocGh5cywgb3B0cykge1xuICB0aGlzLl9waHlzID0gcGh5c1xuICB0aGlzLl9ydW5uaW5nID0gZmFsc2VcbiAgdGhpcy5fb3B0cyA9IGRlZmF1bHRzKHt9LCBvcHRzLCBkZWZhdWx0T3B0cylcblxuICAvL1dhcm4gb2YgZGVwcmVjYXRlZCBvcHRpb25cbiAgaWYodGhpcy5fb3B0cy5ib3VuZHJ5KXtcbiAgICBjb25zb2xlLndhcm4oXCJXYXJuaW5nOiBNaXNzcGVsbGVkIG9wdGlvbiAnYm91bmRyeScgaXMgYmVpbmcgZGVwcmVjYXRlZC4gUGxlYXNlIHVzZSAnYm91bmRhcnknIGluc3RlYWQuXCIpO1xuICAgIHRoaXMuX29wdHMuYm91bmRhcnkgPSB0aGlzLl9vcHRzLmJvdW5kcnk7XG4gICAgZGVsZXRlIHRoaXMuX29wdHMuYm91bmRyeTtcbiAgfVxufVxuXG5JbnRlcmFjdC5wcm90b3R5cGUucG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gIHZhciBkaXJlY3Rpb24gPSB0aGlzLl9vcHRzLmRpcmVjdGlvblxuICAgICwgYm91bmRhcnkgPSB0aGlzLl9vcHRzLmJvdW5kYXJ5XG4gICAgLCBwb3MgPSBWZWN0b3IoeCwgeSlcblxuICBpZihkaXJlY3Rpb24gIT09ICdib3RoJyAmJiBkaXJlY3Rpb24gIT09ICdob3Jpem9udGFsJykgcG9zLnggPSAwXG4gIGlmKGRpcmVjdGlvbiAhPT0gJ2JvdGgnICYmIGRpcmVjdGlvbiAhPT0gJ3ZlcnRpY2FsJykgcG9zLnkgPSAwXG5cbiAgdGhpcy5fdmVsb1gudXBkYXRlUG9zaXRpb24ocG9zLngpXG4gIHRoaXMuX3ZlbG9ZLnVwZGF0ZVBvc2l0aW9uKHBvcy55KVxuXG4gIHRoaXMuX3BoeXMudmVsb2NpdHkodGhpcy5fdmVsb1guZ2V0VmVsb2NpdHkoKSwgdGhpcy5fdmVsb1kuZ2V0VmVsb2NpdHkoKSlcblxuICBwb3MgPSBib3VuZGFyeS5hcHBseURhbXBpbmcocG9zLCB0aGlzLl9vcHRzLmRhbXBpbmcpXG5cbiAgdGhpcy5fcGh5cy5wb3NpdGlvbihwb3MpXG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuSW50ZXJhY3QucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKGV2dCkge1xuICAvL2ZvciBqcXVlcnkgYW5kIGhhbW1lci5qc1xuICBldnQgPSBldnQub3JpZ2luYWxFdmVudCB8fCBldnRcbiAgdmFyIHBvc2l0aW9uID0gdXRpbC5ldmVudFZlY3RvcihldnQpLnN1Yih0aGlzLl9zdGFydFBvc2l0aW9uKVxuXG4gIHRoaXMucG9zaXRpb24ocG9zaXRpb24pXG4gIHJldHVybiB0aGlzXG59XG5cbkludGVyYWN0LnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKGV2dCkge1xuICB2YXIgdGhhdCA9IHRoaXNcbiAgICAsIGV2dFBvc2l0aW9uID0gZXZ0ICYmIHV0aWwuZXZlbnRWZWN0b3IoZXZ0KVxuICAgICwgcG9zaXRpb24gPSB0aGlzLl9waHlzLnBvc2l0aW9uKClcblxuICB0aGlzLl9ydW5uaW5nID0gdHJ1ZVxuICB0aGlzLl9waHlzLl9zdGFydEFuaW1hdGlvbih0aGlzKVxuICB0aGlzLl9zdGFydFBvc2l0aW9uID0gZXZ0ICYmIGV2dFBvc2l0aW9uLnN1Yihwb3NpdGlvbilcbiAgdGhpcy5faW5pdGlhbFBvc2l0aW9uID0gdGhpcy5fcGh5cy5wb3NpdGlvbigpXG5cbiAgdGhpcy5fdmVsb1ggPSBuZXcgVmVsb2NpdHkoKVxuICB0aGlzLl92ZWxvWSA9IG5ldyBWZWxvY2l0eSgpXG5cbiAgdGhpcy5wb3NpdGlvbihwb3NpdGlvbilcblxuICByZXR1cm4gdGhpcy5fZW5kZWQgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXMsIHJlaikge1xuICAgIHRoYXQuX3Jlc29sdmUgPSByZXNcbiAgICB0aGF0Ll9yZWplY3QgPSByZWpcbiAgfSlcbn1cblxuSW50ZXJhY3QucHJvdG90eXBlLmRpc3RhbmNlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9pbml0aWFsUG9zaXRpb24uc3ViKHRoaXMuX3BoeXMucG9zaXRpb24oKSkubm9ybSgpXG59XG5cbkludGVyYWN0LnByb3RvdHlwZS5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fcnVubmluZyA9IGZhbHNlXG4gIHRoaXMuX3JlamVjdChuZXcgRXJyb3IoJ0NhbmNlbGVkIHRoZSBpbnRlcmFjdGlvbicpKVxufVxuXG5JbnRlcmFjdC5wcm90b3R5cGUucnVubmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5fcnVubmluZ1xufVxuXG5JbnRlcmFjdC5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX3BoeXMudmVsb2NpdHkodGhpcy5fdmVsb1guZ2V0VmVsb2NpdHkoKSwgdGhpcy5fdmVsb1kuZ2V0VmVsb2NpdHkoKSlcbiAgdGhpcy5fcmVzb2x2ZSh7IHZlbG9jaXR5OiB0aGlzLl9waHlzLnZlbG9jaXR5KCksIHBvc2l0aW9uOiB0aGlzLl9waHlzLnBvc2l0aW9uKCkgfSlcbiAgcmV0dXJuIHRoaXMuX2VuZGVkXG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2ludGVyYWN0LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIHByZWZpeGVzID0gWydXZWJraXQnLCAnTW96JywgJ01zJywgJ21zJ11cbnZhciBjYWxscyA9IFtdXG52YXIgdHJhbnNmb3JtUHJvcFxudmFyIHJhZiA9IHJlcXVpcmUoJ3JhZicpXG5cbmZ1bmN0aW9uIGxvb3AoKSB7XG4gIHJhZihmdW5jdGlvbigpIHtcbiAgICBsb29wKClcbiAgICBmb3IodmFyIGkgPSBjYWxscy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY2FsbHNbaV0oKVxuICAgIH1cbiAgfSlcbn1cbmxvb3AoKVxuXG5mdW5jdGlvbiBwcmVmaXhlZChwcm9wKSB7XG4gIHZhciBwcmVmaXhlZFxuICBmb3IgKHZhciBpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgcHJlZml4ZWQgPSBwcmVmaXhlc1tpXSArIHByb3BbMF0udG9VcHBlckNhc2UoKSArIHByb3Auc2xpY2UoMSlcbiAgICBpZih0eXBlb2YgZG9jdW1lbnQuYm9keS5zdHlsZVtwcmVmaXhlZF0gIT09ICd1bmRlZmluZWQnKVxuICAgICAgcmV0dXJuIHByZWZpeGVkXG4gIH1cbiAgcmV0dXJuIHByb3Bcbn1cblxudmFyIHRyYW5zZm9ybXNQcm9wZXJ0aWVzID0gWyd0cmFuc2xhdGUnLCAndHJhbnNsYXRlWCcsICd0cmFuc2xhdGVZJywgJ3RyYW5zbGF0ZVonLFxuICAgICAgICAgICAgICAgICAgJ3JvdGF0ZScsICdyb3RhdGVYJywgJ3JvdGF0ZVknLCAncm90YXRlM2QnLCAncm90YXRlWicsXG4gICAgICAgICAgICAgICAgICAnc2NhbGUnLCAnc2NhbGVYJywgJ3NjYWxlWScsICdzY2FsZVonLFxuICAgICAgICAgICAgICAgICAgJ3NrZXcnLCAnc2tld1gnLCAnc2tld1knLCAnc2tld1onXVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyXG5cbmZ1bmN0aW9uIFJlbmRlcmVyKGVscykge1xuICBpZih0eXBlb2YgZWxzLmxlbmd0aCA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgZWxzID0gW2Vsc11cbiAgdGhpcy5lbHMgPSBlbHNcbiAgdGhpcy5zdHlsZXMgPSB7fVxuICB0aGlzLmludmlzaWJsZUVscyA9IFtdXG4gIGNhbGxzLnB1c2godGhpcy5yZW5kZXIuYmluZCh0aGlzKSlcbn1cblxuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICBpZighdGhpcy5jdXJyZW50UG9zaXRpb24pIHJldHVyblxuXG4gIGlmKCF0cmFuc2Zvcm1Qcm9wKVxuICAgIHRyYW5zZm9ybVByb3AgPSBwcmVmaXhlZCgndHJhbnNmb3JtJylcbiAgdmFyIHRyYW5zZm9ybXNUb0FwcGx5XG4gICAgLCBlbHMgPSB0aGlzLmVsc1xuICAgICwgcG9zaXRpb24gPSB0aGlzLmN1cnJlbnRQb3NpdGlvblxuICAgICwgc3R5bGVzID0gdGhpcy5zdHlsZXNcbiAgICAsIHZhbHVlXG4gICAgLCBwcm9wcyA9IE9iamVjdC5rZXlzKHN0eWxlcylcbiAgICAsIGVsc0xlbmd0aCA9IGVscy5sZW5ndGhcbiAgICAsIHByb3BzTGVuZ3RoID0gcHJvcHMubGVuZ3RoXG4gICAgLCBpLCBqXG4gICAgLCB0cmFuc2Zvcm1zXG5cbiAgZm9yKGkgPSAwIDsgaSA8IGVsc0xlbmd0aCA7IGkrKykge1xuICAgIHRyYW5zZm9ybXNUb0FwcGx5ID0gW11cbiAgICBpZih0aGlzLnZpc2libGVGbiAmJiAhdGhpcy52aXNpYmxlRm4ocG9zaXRpb24sIGkpKSB7XG4gICAgICBpZighdGhpcy5pbnZpc2libGVFbHNbaV0pIHtcbiAgICAgICAgZWxzW2ldLnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9ICd0cmFuc2xhdGUzZCgwLCAtOTk5OTlweCwgMCknXG4gICAgICB9XG4gICAgICB0aGlzLmludmlzaWJsZUVsc1tpXSA9IHRydWVcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pbnZpc2libGVFbHNbaV0gPSBmYWxzZVxuICAgICAgZm9yIChqID0gMDsgaiA8IHByb3BzTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgcHJvcCA9IHByb3BzW2pdXG4gICAgICAgIHZhbHVlID0gKHR5cGVvZiBzdHlsZXNbcHJvcF0gPT09ICdmdW5jdGlvbicpID8gc3R5bGVzW3Byb3BdKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIGkpIDogc3R5bGVzW3Byb3BdXG5cbiAgICAgICAgaWYodHJhbnNmb3Jtc1Byb3BlcnRpZXMuaW5kZXhPZihwcm9wKSAhPT0gLTEpIHtcbiAgICAgICAgICB0cmFuc2Zvcm1zVG9BcHBseS5wdXNoKHByb3AgKyAnKCcgKyB2YWx1ZSArICcpJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbHNbaV0uc3R5bGVbcHJvcF0gPSB2YWx1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0cmFuc2Zvcm1zID0gdHJhbnNmb3Jtc1RvQXBwbHkuam9pbignICcpXG4gICAgICB0cmFuc2Zvcm1zICs9ICcgdHJhbnNsYXRlWigwKSdcbiAgICAgIGVsc1tpXS5zdHlsZVt0cmFuc2Zvcm1Qcm9wXSA9IHRyYW5zZm9ybXNcbiAgICB9XG4gIH1cbn1cblxuUmVuZGVyZXIucHJvdG90eXBlLnN0eWxlID0gZnVuY3Rpb24ocHJvcGVydHksIHZhbHVlKSB7XG4gIGlmKHR5cGVvZiBwcm9wZXJ0eSA9PT0gJ29iamVjdCcpIHtcbiAgICBmb3IocHJvcCBpbiBwcm9wZXJ0eSkge1xuICAgICAgaWYocHJvcGVydHkuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgdGhpcy5zdHlsZShwcm9wLCBwcm9wZXJ0eVtwcm9wXSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdGhpcy5zdHlsZXNbcHJvcGVydHldID0gdmFsdWVcbiAgcmV0dXJuIHRoaXNcbn1cblxuUmVuZGVyZXIucHJvdG90eXBlLnZpc2libGUgPSBmdW5jdGlvbihpc1Zpc2libGUpIHtcbiAgdGhpcy52aXNpYmxlRm4gPSBpc1Zpc2libGVcbiAgcmV0dXJuIHRoaXNcbn1cblJlbmRlcmVyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHRoaXMuY3VycmVudFBvc2l0aW9uID0geyB4OiB4LCB5OiB5IH1cbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvcmVuZGVyZXIuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKVxuICAsIGJvZGllcyA9IFtdXG4gICwgcmFmID0gcmVxdWlyZSgncmFmJylcblxuZnVuY3Rpb24gaW5jcmVtZW50KGEsIGIsIGMsIGQpIHtcbiAgdmFyIHZlYyA9IFZlY3RvcigwLCAwKVxuICB2ZWMuc2VsZkFkZChhKVxuICB2ZWMuc2VsZkFkZChiLmFkZChjKS5zZWxmTXVsdCgyKSlcbiAgdmVjLnNlbGZBZGQoZClcbiAgdmVjLnNlbGZNdWx0KDEvNilcbiAgcmV0dXJuIHZlY1xufVxuXG52YXIgcG9zaXRpb25WZWMgPSBWZWN0b3IoMCwgMClcbnZhciB2ZWxvY2l0eVZlYyA9IFZlY3RvcigwLCAwKVxuXG5mdW5jdGlvbiBldmFsdWF0ZShpbml0aWFsLCB0LCBkdCwgZCkge1xuICB2YXIgc3RhdGUgPSB7fVxuXG4gIHN0YXRlLnBvc2l0aW9uID0gcG9zaXRpb25WZWMuc2V0dihkLmR4KS5zZWxmTXVsdChkdCkuc2VsZkFkZChpbml0aWFsLnBvc2l0aW9uKVxuICBzdGF0ZS52ZWxvY2l0eSA9IHZlbG9jaXR5VmVjLnNldHYoZC5kdikuc2VsZk11bHQoZHQpLnNlbGZBZGQoaW5pdGlhbC52ZWxvY2l0eSlcblxuICB2YXIgbmV4dCA9IHtcbiAgICBkeDogc3RhdGUudmVsb2NpdHkuY2xvbmUoKSxcbiAgICBkdjogaW5pdGlhbC5hY2NlbGVyYXRlKHN0YXRlLCB0KS5jbG9uZSgpXG4gIH1cbiAgcmV0dXJuIG5leHRcbn1cblxudmFyIGRlciA9IHsgZHg6IFZlY3RvcigwLCAwKSwgZHY6IFZlY3RvcigwLCAwKSB9XG5mdW5jdGlvbiBpbnRlZ3JhdGUoc3RhdGUsIHQsIGR0KSB7XG4gICAgdmFyIGEgPSBldmFsdWF0ZSggc3RhdGUsIHQsIDAsIGRlciApXG4gICAgdmFyIGIgPSBldmFsdWF0ZSggc3RhdGUsIHQsIGR0KjAuNSwgYSApXG4gICAgdmFyIGMgPSBldmFsdWF0ZSggc3RhdGUsIHQsIGR0KjAuNSwgYiApXG4gICAgdmFyIGQgPSBldmFsdWF0ZSggc3RhdGUsIHQsIGR0LCBjIClcblxuICAgIHZhciBkeGR0ID0gaW5jcmVtZW50KGEuZHgsYi5keCxjLmR4LGQuZHgpXG4gICAgICAsIGR2ZHQgPSBpbmNyZW1lbnQoYS5kdixiLmR2LGMuZHYsZC5kdilcblxuICAgIHN0YXRlLnBvc2l0aW9uLnNlbGZBZGQoZHhkdC5zZWxmTXVsdChkdCkpO1xuICAgIHN0YXRlLnZlbG9jaXR5LnNlbGZBZGQoZHZkdC5zZWxmTXVsdChkdCkpO1xufVxuXG52YXIgY3VycmVudFRpbWUgPSBEYXRlLm5vdygpIC8gMTAwMFxuICAsIGFjY3VtdWxhdG9yID0gMFxuICAsIHQgPSAwXG4gICwgZHQgPSAwLjAxNVxuXG5mdW5jdGlvbiBzaW11bGF0ZSgpIHtcbiAgcmFmKGZ1bmN0aW9uKCkge1xuICAgIHNpbXVsYXRlKClcbiAgICB2YXIgbmV3VGltZSA9IERhdGUubm93KCkgLyAxMDAwXG4gICAgdmFyIGZyYW1lVGltZSA9IG5ld1RpbWUgLSBjdXJyZW50VGltZVxuICAgIGN1cnJlbnRUaW1lID0gbmV3VGltZVxuXG4gICAgaWYoZnJhbWVUaW1lID4gMC4wNSlcbiAgICAgIGZyYW1lVGltZSA9IDAuMDVcblxuXG4gICAgYWNjdW11bGF0b3IgKz0gZnJhbWVUaW1lXG5cbiAgICB2YXIgaiA9IDBcblxuICAgIHdoaWxlKGFjY3VtdWxhdG9yID49IGR0KSB7XG4gICAgICBmb3IodmFyIGkgPSAwIDsgaSA8IGJvZGllcy5sZW5ndGggOyBpKyspIHtcbiAgICAgICAgYm9kaWVzW2ldLnByZXZpb3VzUG9zaXRpb24gPSBib2RpZXNbaV0ucG9zaXRpb24uY2xvbmUoKVxuICAgICAgICBpbnRlZ3JhdGUoYm9kaWVzW2ldLCB0LCBkdClcbiAgICAgIH1cbiAgICAgIHQgKz0gZHRcbiAgICAgIGFjY3VtdWxhdG9yIC09IGR0XG4gICAgfVxuXG4gICAgZm9yKHZhciBpID0gMCA7IGkgPCBib2RpZXMubGVuZ3RoIDsgaSsrKSB7XG4gICAgICBib2RpZXNbaV0udXBkYXRlKGFjY3VtdWxhdG9yIC8gZHQpXG4gICAgfVxuICB9LCAxNilcbn1cbnNpbXVsYXRlKClcblxubW9kdWxlLmV4cG9ydHMuYWRkQm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgYm9kaWVzLnB1c2goYm9keSlcbiAgcmV0dXJuIGJvZHlcbn1cblxubW9kdWxlLmV4cG9ydHMucmVtb3ZlQm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgdmFyIGluZGV4ID0gYm9kaWVzLmluZGV4T2YoYm9keSlcbiAgaWYoaW5kZXggPj0gMClcbiAgICBib2RpZXMuc3BsaWNlKGluZGV4LCAxKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9zaW11bGF0aW9uLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIEJvZHkgPSByZXF1aXJlKCcuL2JvZHknKVxudmFyIHNpbXVsYXRpb24gPSByZXF1aXJlKCcuL3NpbXVsYXRpb24nKVxudmFyIEJvdW5kYXJ5ID0gcmVxdWlyZSgnLi9ib3VuZGFyeScpXG52YXIgQW5pbWF0aW9uID0gcmVxdWlyZSgnLi9hbmltYXRpb24nKVxuXG52YXIgU3ByaW5nID0gbW9kdWxlLmV4cG9ydHMgPSBBbmltYXRpb24oe1xuICBkZWZhdWx0T3B0aW9uczoge1xuICAgIHRlbnNpb246IDEwMCxcbiAgICBkYW1waW5nOiAxMFxuICB9LFxuICBvblN0YXJ0OiBmdW5jdGlvbih2ZWxvY2l0eSwgZnJvbSwgdG8sIG9wdHMsIHVwZGF0ZSkge1xuICAgIHZhciBib2R5ID0gdGhpcy5fYm9keSA9IG5ldyBCb2R5KHZlbG9jaXR5LCBmcm9tLCB7XG4gICAgICBhY2NlbGVyYXRlOiBmdW5jdGlvbihzdGF0ZSwgdCkge1xuICAgICAgICByZXR1cm4gc3RhdGUucG9zaXRpb24uc2VsZlN1Yih0bylcbiAgICAgICAgICAuc2VsZk11bHQoLW9wdHMudGVuc2lvbilcbiAgICAgICAgICAuc2VsZlN1YihzdGF0ZS52ZWxvY2l0eS5tdWx0KG9wdHMuZGFtcGluZykpXG4gICAgICB9LFxuICAgICAgdXBkYXRlOiBmdW5jdGlvbihwb3NpdGlvbiwgdmVsb2NpdHkpIHtcbiAgICAgICAgaWYoYm9keS5hdFJlc3QoKSAmJiBib2R5LmF0UG9zaXRpb24odG8pKSB7XG4gICAgICAgICAgdXBkYXRlLmRvbmUodG8sIHsgeDogMCwgeTogMCB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZS5zdGF0ZShwb3NpdGlvbiwgdmVsb2NpdHkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICAgIHNpbXVsYXRpb24uYWRkQm9keSh0aGlzLl9ib2R5KVxuICB9LFxuICBvbkVuZDogZnVuY3Rpb24oKSB7XG4gICAgc2ltdWxhdGlvbi5yZW1vdmVCb2R5KHRoaXMuX2JvZHkpXG4gIH1cbn0pXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL3NwcmluZy5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG5mdW5jdGlvbiB2ZXJ0ZXgoYSwgYikge1xuICByZXR1cm4gLWIgLyAoMiAqIGEpXG59XG5cbmZ1bmN0aW9uIGhlaWdodChhLCBiLCBjKSB7XG4gIHJldHVybiBwYXJhYm9sYShhLCBiLCBjLCB2ZXJ0ZXgoYSwgYikpXG59XG5cbmZ1bmN0aW9uIHBhcmFib2xhKGEsIGIsIGMsIHgpIHtcbiAgcmV0dXJuIGEgKiB4ICogeCArIGIgKiB4ICsgY1xufVxuXG5mdW5jdGlvbiBldmVudFZlY3RvcihldnQpIHtcbiAgcmV0dXJuIFZlY3Rvcih7XG4gICAgeDogZXZ0LnRvdWNoZXMgJiYgZXZ0LnRvdWNoZXNbMF0ucGFnZVggfHwgZXZ0LnBhZ2VYLFxuICAgIHk6IGV2dC50b3VjaGVzICYmIGV2dC50b3VjaGVzWzBdLnBhZ2VZIHx8IGV2dC5wYWdlWVxuICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cy5oZWlnaHQgPSBoZWlnaHRcbm1vZHVsZS5leHBvcnRzLmV2ZW50VmVjdG9yID0gZXZlbnRWZWN0b3Jcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL3V0aWwuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvclxuXG5mdW5jdGlvbiBWZWN0b3IoeCwgeSkge1xuICBpZighKHRoaXMgaW5zdGFuY2VvZiBWZWN0b3IpKVxuICAgIHJldHVybiBuZXcgVmVjdG9yKHgsIHkpXG5cbiAgaWYodHlwZW9mIHgueCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aGlzLnggPSB4LnhcbiAgICB0aGlzLnkgPSB4LnlcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnggPSB4IHx8IDBcbiAgICB0aGlzLnkgPSB5IHx8IDBcbiAgfVxufVxuXG5WZWN0b3IucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uKHZlYykge1xuICByZXR1cm4gdmVjLnggPT09IHRoaXMueCAmJiB2ZWMueSA9PT0gdGhpcy55XG59XG5cblZlY3Rvci5wcm90b3R5cGUuZGlyZWN0aW9uRXF1YWwgPSBmdW5jdGlvbih2ZWMpIHtcbiAgcmV0dXJuIHZlYy54ID4gMCA9PT0gdGhpcy54ID4gMCAmJiB0aGlzLnkgPiAwID09PSB2ZWMueSA+IDBcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbiAodmVjKSB7XG4gIHJldHVybiB0aGlzLnggKiB2ZWMueCArIHRoaXMueSAqIHZlYy55O1xufVxuXG5WZWN0b3IucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gVmVjdG9yKHRoaXMueCwgdGhpcy55KS5tdWx0KC0xKVxufVxuXG5WZWN0b3IucHJvdG90eXBlLm5vcm0gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIE1hdGguc3FydCh0aGlzLm5vcm1zcSgpKVxufVxuXG5WZWN0b3IucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBWZWN0b3IodGhpcy54LCB0aGlzLnkpXG59XG5cblZlY3Rvci5wcm90b3R5cGUubm9ybXNxID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnlcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWFnbml0dWRlID0gdGhpcy5ub3JtKClcblxuICAgIGlmKG1hZ25pdHVkZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIG1hZ25pdHVkZSA9IDEgLyBtYWduaXR1ZGVcblxuICAgIHRoaXMueCAqPSBtYWduaXR1ZGVcbiAgICB0aGlzLnkgKj0gbWFnbml0dWRlXG5cbiAgICByZXR1cm4gdGhpc1xufVxuXG5WZWN0b3IucHJvdG90eXBlLm11bHQgPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKHggaW5zdGFuY2VvZiBWZWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LnggKiB0aGlzLngsIHgueSAqIHRoaXMueSlcbiAgfVxuICBpZih0eXBlb2YgeSA9PT0gJ3VuZGVmaW5lZCcpIHsgLy9zY2FsYXJcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4ICogdGhpcy54LCB4ICogdGhpcy55KVxuICB9XG4gIHJldHVybiBuZXcgVmVjdG9yKHggKiB0aGlzLngsIHkgKiB0aGlzLnkpXG59XG5cblZlY3Rvci5wcm90b3R5cGUuc2VsZk11bHQgPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKHggaW5zdGFuY2VvZiBWZWN0b3IpIHtcbiAgICB0aGlzLnggKj0geC54XG4gICAgdGhpcy55ICo9IHgueVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgaWYodHlwZW9mIHkgPT09ICd1bmRlZmluZWQnKSB7IC8vc2NhbGFyXG4gICAgdGhpcy54ICo9IHhcbiAgICB0aGlzLnkgKj0geFxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgdGhpcy54ICo9IHhcbiAgdGhpcy55ICo9IHlcbiAgcmV0dXJuIHRoaXNcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5zZWxmQWRkID0gZnVuY3Rpb24oeCwgeSkge1xuICBpZih0eXBlb2YgeC54ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHRoaXMueCArPSB4LnhcbiAgICB0aGlzLnkgKz0geC55XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBpZih0eXBlb2YgeSA9PT0gJ3VuZGVmaW5lZCcpIHsgLy9zY2FsYXJcbiAgICB0aGlzLnggKz0geFxuICAgIHRoaXMueSArPSB4XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICB0aGlzLnggKz0geFxuICB0aGlzLnkgKz0geVxuICByZXR1cm4gdGhpc1xufVxuXG5WZWN0b3IucHJvdG90eXBlLnNlbGZTdWIgPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKHR5cGVvZiB4LnggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhpcy54IC09IHgueFxuICAgIHRoaXMueSAtPSB4LnlcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIGlmKHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJykgeyAvL3NjYWxhclxuICAgIHRoaXMueCAtPSB4XG4gICAgdGhpcy55IC09IHhcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIHRoaXMueCAtPSB4XG4gIHRoaXMueSAtPSB5XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbih4LCB5KSB7XG5cbiAgaWYodHlwZW9mIHgueCAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54IC0geC54LCB0aGlzLnkgLSB4LnkpXG5cbiAgaWYodHlwZW9mIHkgPT09ICd1bmRlZmluZWQnKS8vc2NhbGFyXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54IC0geCwgdGhpcy55IC0geClcblxuICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggLSB4LCB0aGlzLnkgLSB5KVxufVxuXG5WZWN0b3IucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgaWYodHlwZW9mIHgueCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggKyB4LngsIHRoaXMueSArIHgueSlcbiAgfVxuICBpZih0eXBlb2YgeSA9PT0gJ3VuZGVmaW5lZCcpIHsgLy9zY2FsYXJcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggKyB4LCB0aGlzLnkgKyB4KVxuICB9XG4gIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCArIHgsIHRoaXMueSArIHkpXG59XG5cblZlY3Rvci5wcm90b3R5cGUuc2V0diA9IGZ1bmN0aW9uKHZlYykge1xuICB0aGlzLnggPSB2ZWMueFxuICB0aGlzLnkgPSB2ZWMueVxuICByZXR1cm4gdGhpc1xufVxuXG5WZWN0b3IucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbih2ZWN0b3IsIGFscGhhKSB7XG4gIHJldHVybiB0aGlzLm11bHQoMS1hbHBoYSkuYWRkKHZlY3Rvci5tdWx0KGFscGhhKSlcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvdmVjdG9yLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuXG4vKipcbiAqIEV4cG9zZSBgRW1pdHRlcmAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYEVtaXR0ZXJgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gRW1pdHRlcihvYmopIHtcbiAgaWYgKG9iaikgcmV0dXJuIG1peGluKG9iaik7XG59O1xuXG4vKipcbiAqIE1peGluIHRoZSBlbWl0dGVyIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbWl4aW4ob2JqKSB7XG4gIGZvciAodmFyIGtleSBpbiBFbWl0dGVyLnByb3RvdHlwZSkge1xuICAgIG9ialtrZXldID0gRW1pdHRlci5wcm90b3R5cGVba2V5XTtcbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIExpc3RlbiBvbiB0aGUgZ2l2ZW4gYGV2ZW50YCB3aXRoIGBmbmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub24gPVxuRW1pdHRlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgKHRoaXMuX2NhbGxiYWNrc1tldmVudF0gPSB0aGlzLl9jYWxsYmFja3NbZXZlbnRdIHx8IFtdKVxuICAgIC5wdXNoKGZuKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZHMgYW4gYGV2ZW50YCBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgaW52b2tlZCBhIHNpbmdsZVxuICogdGltZSB0aGVuIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG5cbiAgZnVuY3Rpb24gb24oKSB7XG4gICAgc2VsZi5vZmYoZXZlbnQsIG9uKTtcbiAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgb24uZm4gPSBmbjtcbiAgdGhpcy5vbihldmVudCwgb24pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBnaXZlbiBjYWxsYmFjayBmb3IgYGV2ZW50YCBvciBhbGxcbiAqIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9mZiA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcblxuICAvLyBhbGxcbiAgaWYgKDAgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHRoaXMuX2NhbGxiYWNrcyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gc3BlY2lmaWMgZXZlbnRcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrc1tldmVudF07XG4gIGlmICghY2FsbGJhY2tzKSByZXR1cm4gdGhpcztcblxuICAvLyByZW1vdmUgYWxsIGhhbmRsZXJzXG4gIGlmICgxID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBkZWxldGUgdGhpcy5fY2FsbGJhY2tzW2V2ZW50XTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHJlbW92ZSBzcGVjaWZpYyBoYW5kbGVyXG4gIHZhciBjYjtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBjYiA9IGNhbGxiYWNrc1tpXTtcbiAgICBpZiAoY2IgPT09IGZuIHx8IGNiLmZuID09PSBmbikge1xuICAgICAgY2FsbGJhY2tzLnNwbGljZShpLCAxKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRW1pdCBgZXZlbnRgIHdpdGggdGhlIGdpdmVuIGFyZ3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge01peGVkfSAuLi5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuICAgICwgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XTtcblxuICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgY2FsbGJhY2tzID0gY2FsbGJhY2tzLnNsaWNlKDApO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjYWxsYmFja3MubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmV0dXJuIGFycmF5IG9mIGNhbGxiYWNrcyBmb3IgYGV2ZW50YC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgcmV0dXJuIHRoaXMuX2NhbGxiYWNrc1tldmVudF0gfHwgW107XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHRoaXMgZW1pdHRlciBoYXMgYGV2ZW50YCBoYW5kbGVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmhhc0xpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgcmV0dXJuICEhIHRoaXMubGlzdGVuZXJzKGV2ZW50KS5sZW5ndGg7XG59O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9jb21wb25lbnQtZW1pdHRlci9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9jb21wb25lbnQtZW1pdHRlclwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIga2V5cyA9IHJlcXVpcmUoJ2xvZGFzaC5rZXlzJyksXG4gICAgb2JqZWN0VHlwZXMgPSByZXF1aXJlKCdsb2Rhc2guX29iamVjdHR5cGVzJyk7XG5cbi8qKlxuICogQXNzaWducyBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHNvdXJjZSBvYmplY3QocykgdG8gdGhlIGRlc3RpbmF0aW9uXG4gKiBvYmplY3QgZm9yIGFsbCBkZXN0aW5hdGlvbiBwcm9wZXJ0aWVzIHRoYXQgcmVzb2x2ZSB0byBgdW5kZWZpbmVkYC4gT25jZSBhXG4gKiBwcm9wZXJ0eSBpcyBzZXQsIGFkZGl0aW9uYWwgZGVmYXVsdHMgb2YgdGhlIHNhbWUgcHJvcGVydHkgd2lsbCBiZSBpZ25vcmVkLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAdHlwZSBGdW5jdGlvblxuICogQGNhdGVnb3J5IE9iamVjdHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqIEBwYXJhbSB7Li4uT2JqZWN0fSBbc291cmNlXSBUaGUgc291cmNlIG9iamVjdHMuXG4gKiBAcGFyYW0tIHtPYmplY3R9IFtndWFyZF0gQWxsb3dzIHdvcmtpbmcgd2l0aCBgXy5yZWR1Y2VgIHdpdGhvdXQgdXNpbmcgaXRzXG4gKiAgYGtleWAgYW5kIGBvYmplY3RgIGFyZ3VtZW50cyBhcyBzb3VyY2VzLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAnbmFtZSc6ICdiYXJuZXknIH07XG4gKiBfLmRlZmF1bHRzKG9iamVjdCwgeyAnbmFtZSc6ICdmcmVkJywgJ2VtcGxveWVyJzogJ3NsYXRlJyB9KTtcbiAqIC8vID0+IHsgJ25hbWUnOiAnYmFybmV5JywgJ2VtcGxveWVyJzogJ3NsYXRlJyB9XG4gKi9cbnZhciBkZWZhdWx0cyA9IGZ1bmN0aW9uKG9iamVjdCwgc291cmNlLCBndWFyZCkge1xuICB2YXIgaW5kZXgsIGl0ZXJhYmxlID0gb2JqZWN0LCByZXN1bHQgPSBpdGVyYWJsZTtcbiAgaWYgKCFpdGVyYWJsZSkgcmV0dXJuIHJlc3VsdDtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICBhcmdzSW5kZXggPSAwLFxuICAgICAgYXJnc0xlbmd0aCA9IHR5cGVvZiBndWFyZCA9PSAnbnVtYmVyJyA/IDIgOiBhcmdzLmxlbmd0aDtcbiAgd2hpbGUgKCsrYXJnc0luZGV4IDwgYXJnc0xlbmd0aCkge1xuICAgIGl0ZXJhYmxlID0gYXJnc1thcmdzSW5kZXhdO1xuICAgIGlmIChpdGVyYWJsZSAmJiBvYmplY3RUeXBlc1t0eXBlb2YgaXRlcmFibGVdKSB7XG4gICAgdmFyIG93bkluZGV4ID0gLTEsXG4gICAgICAgIG93blByb3BzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSAmJiBrZXlzKGl0ZXJhYmxlKSxcbiAgICAgICAgbGVuZ3RoID0gb3duUHJvcHMgPyBvd25Qcm9wcy5sZW5ndGggOiAwO1xuXG4gICAgd2hpbGUgKCsrb3duSW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIGluZGV4ID0gb3duUHJvcHNbb3duSW5kZXhdO1xuICAgICAgaWYgKHR5cGVvZiByZXN1bHRbaW5kZXhdID09ICd1bmRlZmluZWQnKSByZXN1bHRbaW5kZXhdID0gaXRlcmFibGVbaW5kZXhdO1xuICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0cztcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0c1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIHRvIGRldGVybWluZSBpZiB2YWx1ZXMgYXJlIG9mIHRoZSBsYW5ndWFnZSB0eXBlIE9iamVjdCAqL1xudmFyIG9iamVjdFR5cGVzID0ge1xuICAnYm9vbGVhbic6IGZhbHNlLFxuICAnZnVuY3Rpb24nOiB0cnVlLFxuICAnb2JqZWN0JzogdHJ1ZSxcbiAgJ251bWJlcic6IGZhbHNlLFxuICAnc3RyaW5nJzogZmFsc2UsXG4gICd1bmRlZmluZWQnOiBmYWxzZVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RUeXBlcztcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2guX29iamVjdHR5cGVzL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9vYmplY3R0eXBlc1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgaXNOYXRpdmUgPSByZXF1aXJlKCdsb2Rhc2guX2lzbmF0aXZlJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCdsb2Rhc2guaXNvYmplY3QnKSxcbiAgICBzaGltS2V5cyA9IHJlcXVpcmUoJ2xvZGFzaC5fc2hpbWtleXMnKTtcblxuLyogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgZm9yIG1ldGhvZHMgd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMgKi9cbnZhciBuYXRpdmVLZXlzID0gaXNOYXRpdmUobmF0aXZlS2V5cyA9IE9iamVjdC5rZXlzKSAmJiBuYXRpdmVLZXlzO1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgY29tcG9zZWQgb2YgdGhlIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzIG9mIGFuIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpbnNwZWN0LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGFuIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmtleXMoeyAnb25lJzogMSwgJ3R3byc6IDIsICd0aHJlZSc6IDMgfSk7XG4gKiAvLyA9PiBbJ29uZScsICd0d28nLCAndGhyZWUnXSAocHJvcGVydHkgb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQgYWNyb3NzIGVudmlyb25tZW50cylcbiAqL1xudmFyIGtleXMgPSAhbmF0aXZlS2V5cyA/IHNoaW1LZXlzIDogZnVuY3Rpb24ob2JqZWN0KSB7XG4gIGlmICghaXNPYmplY3Qob2JqZWN0KSkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICByZXR1cm4gbmF0aXZlS2V5cyhvYmplY3QpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBrZXlzO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBpbnRlcm5hbCBbW0NsYXNzXV0gb2YgdmFsdWVzICovXG52YXIgdG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGlmIGEgbWV0aG9kIGlzIG5hdGl2ZSAqL1xudmFyIHJlTmF0aXZlID0gUmVnRXhwKCdeJyArXG4gIFN0cmluZyh0b1N0cmluZylcbiAgICAucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csICdcXFxcJCYnKVxuICAgIC5yZXBsYWNlKC90b1N0cmluZ3wgZm9yIFteXFxdXSsvZywgJy4qPycpICsgJyQnXG4pO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbiwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc05hdGl2ZSh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicgJiYgcmVOYXRpdmUudGVzdCh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNOYXRpdmU7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXMvbm9kZV9tb2R1bGVzL2xvZGFzaC5faXNuYXRpdmUvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9pc25hdGl2ZVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgb2JqZWN0VHlwZXMgPSByZXF1aXJlKCdsb2Rhc2guX29iamVjdHR5cGVzJyk7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBOYXRpdmUgbWV0aG9kIHNob3J0Y3V0cyAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQSBmYWxsYmFjayBpbXBsZW1lbnRhdGlvbiBvZiBgT2JqZWN0LmtleXNgIHdoaWNoIHByb2R1Y2VzIGFuIGFycmF5IG9mIHRoZVxuICogZ2l2ZW4gb2JqZWN0J3Mgb3duIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEB0eXBlIEZ1bmN0aW9uXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhbiBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqL1xudmFyIHNoaW1LZXlzID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gIHZhciBpbmRleCwgaXRlcmFibGUgPSBvYmplY3QsIHJlc3VsdCA9IFtdO1xuICBpZiAoIWl0ZXJhYmxlKSByZXR1cm4gcmVzdWx0O1xuICBpZiAoIShvYmplY3RUeXBlc1t0eXBlb2Ygb2JqZWN0XSkpIHJldHVybiByZXN1bHQ7XG4gICAgZm9yIChpbmRleCBpbiBpdGVyYWJsZSkge1xuICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoaXRlcmFibGUsIGluZGV4KSkge1xuICAgICAgICByZXN1bHQucHVzaChpbmRleCk7XG4gICAgICB9XG4gICAgfVxuICByZXR1cm4gcmVzdWx0XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNoaW1LZXlzO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL25vZGVfbW9kdWxlcy9sb2Rhc2guX3NoaW1rZXlzL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXMvbm9kZV9tb2R1bGVzL2xvZGFzaC5fc2hpbWtleXNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIG9iamVjdFR5cGVzID0gcmVxdWlyZSgnbG9kYXNoLl9vYmplY3R0eXBlcycpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZSBsYW5ndWFnZSB0eXBlIG9mIE9iamVjdC5cbiAqIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KDEpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgLy8gY2hlY2sgaWYgdGhlIHZhbHVlIGlzIHRoZSBFQ01BU2NyaXB0IGxhbmd1YWdlIHR5cGUgb2YgT2JqZWN0XG4gIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4OFxuICAvLyBhbmQgYXZvaWQgYSBWOCBidWdcbiAgLy8gaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MjI5MVxuICByZXR1cm4gISEodmFsdWUgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIHZhbHVlXSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3Q7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXMvbm9kZV9tb2R1bGVzL2xvZGFzaC5pc29iamVjdC9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL25vZGVfbW9kdWxlcy9sb2Rhc2guaXNvYmplY3RcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBhc2FwID0gcmVxdWlyZSgnYXNhcCcpXG5cbm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZVxuZnVuY3Rpb24gUHJvbWlzZShmbikge1xuICBpZiAodHlwZW9mIHRoaXMgIT09ICdvYmplY3QnKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdQcm9taXNlcyBtdXN0IGJlIGNvbnN0cnVjdGVkIHZpYSBuZXcnKVxuICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdub3QgYSBmdW5jdGlvbicpXG4gIHZhciBzdGF0ZSA9IG51bGxcbiAgdmFyIHZhbHVlID0gbnVsbFxuICB2YXIgZGVmZXJyZWRzID0gW11cbiAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgdGhpcy50aGVuID0gZnVuY3Rpb24ob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBoYW5kbGUobmV3IEhhbmRsZXIob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIHJlc29sdmUsIHJlamVjdCkpXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZShkZWZlcnJlZCkge1xuICAgIGlmIChzdGF0ZSA9PT0gbnVsbCkge1xuICAgICAgZGVmZXJyZWRzLnB1c2goZGVmZXJyZWQpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgYXNhcChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjYiA9IHN0YXRlID8gZGVmZXJyZWQub25GdWxmaWxsZWQgOiBkZWZlcnJlZC5vblJlamVjdGVkXG4gICAgICBpZiAoY2IgPT09IG51bGwpIHtcbiAgICAgICAgKHN0YXRlID8gZGVmZXJyZWQucmVzb2x2ZSA6IGRlZmVycmVkLnJlamVjdCkodmFsdWUpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdmFyIHJldFxuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0ID0gY2IodmFsdWUpXG4gICAgICB9XG4gICAgICBjYXRjaCAoZSkge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKHJldClcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVzb2x2ZShuZXdWYWx1ZSkge1xuICAgIHRyeSB7IC8vUHJvbWlzZSBSZXNvbHV0aW9uIFByb2NlZHVyZTogaHR0cHM6Ly9naXRodWIuY29tL3Byb21pc2VzLWFwbHVzL3Byb21pc2VzLXNwZWMjdGhlLXByb21pc2UtcmVzb2x1dGlvbi1wcm9jZWR1cmVcbiAgICAgIGlmIChuZXdWYWx1ZSA9PT0gc2VsZikgdGhyb3cgbmV3IFR5cGVFcnJvcignQSBwcm9taXNlIGNhbm5vdCBiZSByZXNvbHZlZCB3aXRoIGl0c2VsZi4nKVxuICAgICAgaWYgKG5ld1ZhbHVlICYmICh0eXBlb2YgbmV3VmFsdWUgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBuZXdWYWx1ZSA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgdmFyIHRoZW4gPSBuZXdWYWx1ZS50aGVuXG4gICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGRvUmVzb2x2ZSh0aGVuLmJpbmQobmV3VmFsdWUpLCByZXNvbHZlLCByZWplY3QpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHN0YXRlID0gdHJ1ZVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgICAgZmluYWxlKClcbiAgICB9IGNhdGNoIChlKSB7IHJlamVjdChlKSB9XG4gIH1cblxuICBmdW5jdGlvbiByZWplY3QobmV3VmFsdWUpIHtcbiAgICBzdGF0ZSA9IGZhbHNlXG4gICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIGZpbmFsZSgpXG4gIH1cblxuICBmdW5jdGlvbiBmaW5hbGUoKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRlZmVycmVkcy5sZW5ndGg7IGkgPCBsZW47IGkrKylcbiAgICAgIGhhbmRsZShkZWZlcnJlZHNbaV0pXG4gICAgZGVmZXJyZWRzID0gbnVsbFxuICB9XG5cbiAgZG9SZXNvbHZlKGZuLCByZXNvbHZlLCByZWplY3QpXG59XG5cblxuZnVuY3Rpb24gSGFuZGxlcihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcmVzb2x2ZSwgcmVqZWN0KXtcbiAgdGhpcy5vbkZ1bGZpbGxlZCA9IHR5cGVvZiBvbkZ1bGZpbGxlZCA9PT0gJ2Z1bmN0aW9uJyA/IG9uRnVsZmlsbGVkIDogbnVsbFxuICB0aGlzLm9uUmVqZWN0ZWQgPSB0eXBlb2Ygb25SZWplY3RlZCA9PT0gJ2Z1bmN0aW9uJyA/IG9uUmVqZWN0ZWQgOiBudWxsXG4gIHRoaXMucmVzb2x2ZSA9IHJlc29sdmVcbiAgdGhpcy5yZWplY3QgPSByZWplY3Rcbn1cblxuLyoqXG4gKiBUYWtlIGEgcG90ZW50aWFsbHkgbWlzYmVoYXZpbmcgcmVzb2x2ZXIgZnVuY3Rpb24gYW5kIG1ha2Ugc3VyZVxuICogb25GdWxmaWxsZWQgYW5kIG9uUmVqZWN0ZWQgYXJlIG9ubHkgY2FsbGVkIG9uY2UuXG4gKlxuICogTWFrZXMgbm8gZ3VhcmFudGVlcyBhYm91dCBhc3luY2hyb255LlxuICovXG5mdW5jdGlvbiBkb1Jlc29sdmUoZm4sIG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gIHZhciBkb25lID0gZmFsc2U7XG4gIHRyeSB7XG4gICAgZm4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoZG9uZSkgcmV0dXJuXG4gICAgICBkb25lID0gdHJ1ZVxuICAgICAgb25GdWxmaWxsZWQodmFsdWUpXG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgaWYgKGRvbmUpIHJldHVyblxuICAgICAgZG9uZSA9IHRydWVcbiAgICAgIG9uUmVqZWN0ZWQocmVhc29uKVxuICAgIH0pXG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgaWYgKGRvbmUpIHJldHVyblxuICAgIGRvbmUgPSB0cnVlXG4gICAgb25SZWplY3RlZChleClcbiAgfVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9wcm9taXNlL2NvcmUuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcHJvbWlzZVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbid1c2Ugc3RyaWN0JztcblxuLy9UaGlzIGZpbGUgY29udGFpbnMgdGhlbi9wcm9taXNlIHNwZWNpZmljIGV4dGVuc2lvbnMgdG8gdGhlIGNvcmUgcHJvbWlzZSBBUElcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL2NvcmUuanMnKVxudmFyIGFzYXAgPSByZXF1aXJlKCdhc2FwJylcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlXG5cbi8qIFN0YXRpYyBGdW5jdGlvbnMgKi9cblxuZnVuY3Rpb24gVmFsdWVQcm9taXNlKHZhbHVlKSB7XG4gIHRoaXMudGhlbiA9IGZ1bmN0aW9uIChvbkZ1bGZpbGxlZCkge1xuICAgIGlmICh0eXBlb2Ygb25GdWxmaWxsZWQgIT09ICdmdW5jdGlvbicpIHJldHVybiB0aGlzXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJlc29sdmUob25GdWxmaWxsZWQodmFsdWUpKVxuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxufVxuVmFsdWVQcm9taXNlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUHJvbWlzZS5wcm90b3R5cGUpXG5cbnZhciBUUlVFID0gbmV3IFZhbHVlUHJvbWlzZSh0cnVlKVxudmFyIEZBTFNFID0gbmV3IFZhbHVlUHJvbWlzZShmYWxzZSlcbnZhciBOVUxMID0gbmV3IFZhbHVlUHJvbWlzZShudWxsKVxudmFyIFVOREVGSU5FRCA9IG5ldyBWYWx1ZVByb21pc2UodW5kZWZpbmVkKVxudmFyIFpFUk8gPSBuZXcgVmFsdWVQcm9taXNlKDApXG52YXIgRU1QVFlTVFJJTkcgPSBuZXcgVmFsdWVQcm9taXNlKCcnKVxuXG5Qcm9taXNlLnJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkgcmV0dXJuIHZhbHVlXG5cbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gTlVMTFxuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFVOREVGSU5FRFxuICBpZiAodmFsdWUgPT09IHRydWUpIHJldHVybiBUUlVFXG4gIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHJldHVybiBGQUxTRVxuICBpZiAodmFsdWUgPT09IDApIHJldHVybiBaRVJPXG4gIGlmICh2YWx1ZSA9PT0gJycpIHJldHVybiBFTVBUWVNUUklOR1xuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRyeSB7XG4gICAgICB2YXIgdGhlbiA9IHZhbHVlLnRoZW5cbiAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UodGhlbi5iaW5kKHZhbHVlKSlcbiAgICAgIH1cbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgcmVqZWN0KGV4KVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmV3IFZhbHVlUHJvbWlzZSh2YWx1ZSlcbn1cblxuUHJvbWlzZS5mcm9tID0gUHJvbWlzZS5jYXN0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1Byb21pc2UuZnJvbSBhbmQgUHJvbWlzZS5jYXN0IGFyZSBkZXByZWNhdGVkLCB1c2UgUHJvbWlzZS5yZXNvbHZlIGluc3RlYWQnKVxuICBlcnIubmFtZSA9ICdXYXJuaW5nJ1xuICBjb25zb2xlLndhcm4oZXJyLnN0YWNrKVxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZhbHVlKVxufVxuXG5Qcm9taXNlLmRlbm9kZWlmeSA9IGZ1bmN0aW9uIChmbiwgYXJndW1lbnRDb3VudCkge1xuICBhcmd1bWVudENvdW50ID0gYXJndW1lbnRDb3VudCB8fCBJbmZpbml0eVxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpc1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB3aGlsZSAoYXJncy5sZW5ndGggJiYgYXJncy5sZW5ndGggPiBhcmd1bWVudENvdW50KSB7XG4gICAgICAgIGFyZ3MucG9wKClcbiAgICAgIH1cbiAgICAgIGFyZ3MucHVzaChmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgICAgaWYgKGVycikgcmVqZWN0KGVycilcbiAgICAgICAgZWxzZSByZXNvbHZlKHJlcylcbiAgICAgIH0pXG4gICAgICBmbi5hcHBseShzZWxmLCBhcmdzKVxuICAgIH0pXG4gIH1cbn1cblByb21pc2Uubm9kZWlmeSA9IGZ1bmN0aW9uIChmbikge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICAgIHZhciBjYWxsYmFjayA9IHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09ICdmdW5jdGlvbicgPyBhcmdzLnBvcCgpIDogbnVsbFxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKS5ub2RlaWZ5KGNhbGxiYWNrKVxuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICBpZiAoY2FsbGJhY2sgPT09IG51bGwgfHwgdHlwZW9mIGNhbGxiYWNrID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IHJlamVjdChleCkgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNhbGxiYWNrKGV4KVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5Qcm9taXNlLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGNhbGxlZFdpdGhBcnJheSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgQXJyYXkuaXNBcnJheShhcmd1bWVudHNbMF0pXG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoY2FsbGVkV2l0aEFycmF5ID8gYXJndW1lbnRzWzBdIDogYXJndW1lbnRzKVxuXG4gIGlmICghY2FsbGVkV2l0aEFycmF5KSB7XG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcignUHJvbWlzZS5hbGwgc2hvdWxkIGJlIGNhbGxlZCB3aXRoIGEgc2luZ2xlIGFycmF5LCBjYWxsaW5nIGl0IHdpdGggbXVsdGlwbGUgYXJndW1lbnRzIGlzIGRlcHJlY2F0ZWQnKVxuICAgIGVyci5uYW1lID0gJ1dhcm5pbmcnXG4gICAgY29uc29sZS53YXJuKGVyci5zdGFjaylcbiAgfVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSByZXR1cm4gcmVzb2x2ZShbXSlcbiAgICB2YXIgcmVtYWluaW5nID0gYXJncy5sZW5ndGhcbiAgICBmdW5jdGlvbiByZXMoaSwgdmFsKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAodmFsICYmICh0eXBlb2YgdmFsID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgIHZhciB0aGVuID0gdmFsLnRoZW5cbiAgICAgICAgICBpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoZW4uY2FsbCh2YWwsIGZ1bmN0aW9uICh2YWwpIHsgcmVzKGksIHZhbCkgfSwgcmVqZWN0KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGFyZ3NbaV0gPSB2YWxcbiAgICAgICAgaWYgKC0tcmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgcmVzb2x2ZShhcmdzKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgcmVqZWN0KGV4KVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlcyhpLCBhcmdzW2ldKVxuICAgIH1cbiAgfSlcbn1cblxuUHJvbWlzZS5yZWplY3QgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgXG4gICAgcmVqZWN0KHZhbHVlKTtcbiAgfSk7XG59XG5cblByb21pc2UucmFjZSA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgXG4gICAgdmFsdWVzLmZvckVhY2goZnVuY3Rpb24odmFsdWUpe1xuICAgICAgUHJvbWlzZS5yZXNvbHZlKHZhbHVlKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgfSlcbiAgfSk7XG59XG5cbi8qIFByb3RvdHlwZSBNZXRob2RzICovXG5cblByb21pc2UucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbiAob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgdmFyIHNlbGYgPSBhcmd1bWVudHMubGVuZ3RoID8gdGhpcy50aGVuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgOiB0aGlzXG4gIHNlbGYudGhlbihudWxsLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICB0aHJvdyBlcnJcbiAgICB9KVxuICB9KVxufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5ub2RlaWZ5ID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHRoaXNcblxuICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICBjYWxsYmFjayhudWxsLCB2YWx1ZSlcbiAgICB9KVxuICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICBjYWxsYmFjayhlcnIpXG4gICAgfSlcbiAgfSlcbn1cblxuUHJvbWlzZS5wcm90b3R5cGVbJ2NhdGNoJ10gPSBmdW5jdGlvbiAob25SZWplY3RlZCkge1xuICByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0ZWQpO1xufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9wcm9taXNlL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2VcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG5cbi8vIFVzZSB0aGUgZmFzdGVzdCBwb3NzaWJsZSBtZWFucyB0byBleGVjdXRlIGEgdGFzayBpbiBhIGZ1dHVyZSB0dXJuXG4vLyBvZiB0aGUgZXZlbnQgbG9vcC5cblxuLy8gbGlua2VkIGxpc3Qgb2YgdGFza3MgKHNpbmdsZSwgd2l0aCBoZWFkIG5vZGUpXG52YXIgaGVhZCA9IHt0YXNrOiB2b2lkIDAsIG5leHQ6IG51bGx9O1xudmFyIHRhaWwgPSBoZWFkO1xudmFyIGZsdXNoaW5nID0gZmFsc2U7XG52YXIgcmVxdWVzdEZsdXNoID0gdm9pZCAwO1xudmFyIGlzTm9kZUpTID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIC8qIGpzaGludCBsb29wZnVuYzogdHJ1ZSAqL1xuXG4gICAgd2hpbGUgKGhlYWQubmV4dCkge1xuICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xuICAgICAgICB2YXIgdGFzayA9IGhlYWQudGFzaztcbiAgICAgICAgaGVhZC50YXNrID0gdm9pZCAwO1xuICAgICAgICB2YXIgZG9tYWluID0gaGVhZC5kb21haW47XG5cbiAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgaGVhZC5kb21haW4gPSB2b2lkIDA7XG4gICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0YXNrKCk7XG5cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGlzTm9kZUpTKSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gbm9kZSwgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgY29uc2lkZXJlZCBmYXRhbCBlcnJvcnMuXG4gICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBzeW5jaHJvbm91c2x5IHRvIGludGVycnVwdCBmbHVzaGluZyFcblxuICAgICAgICAgICAgICAgIC8vIEVuc3VyZSBjb250aW51YXRpb24gaWYgdGhlIHVuY2F1Z2h0IGV4Y2VwdGlvbiBpcyBzdXBwcmVzc2VkXG4gICAgICAgICAgICAgICAgLy8gbGlzdGVuaW5nIFwidW5jYXVnaHRFeGNlcHRpb25cIiBldmVudHMgKGFzIGRvbWFpbnMgZG9lcykuXG4gICAgICAgICAgICAgICAgLy8gQ29udGludWUgaW4gbmV4dCBldmVudCB0byBhdm9pZCB0aWNrIHJlY3Vyc2lvbi5cbiAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBicm93c2VycywgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgbm90IGZhdGFsLlxuICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgc2xvdy1kb3ducy5cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZmx1c2hpbmcgPSBmYWxzZTtcbn1cblxuaWYgKHR5cGVvZiBwcm9jZXNzICE9PSBcInVuZGVmaW5lZFwiICYmIHByb2Nlc3MubmV4dFRpY2spIHtcbiAgICAvLyBOb2RlLmpzIGJlZm9yZSAwLjkuIE5vdGUgdGhhdCBzb21lIGZha2UtTm9kZSBlbnZpcm9ubWVudHMsIGxpa2UgdGhlXG4gICAgLy8gTW9jaGEgdGVzdCBydW5uZXIsIGludHJvZHVjZSBhIGBwcm9jZXNzYCBnbG9iYWwgd2l0aG91dCBhIGBuZXh0VGlja2AuXG4gICAgaXNOb2RlSlMgPSB0cnVlO1xuXG4gICAgcmVxdWVzdEZsdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgICB9O1xuXG59IGVsc2UgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIC8vIEluIElFMTAsIE5vZGUuanMgMC45Kywgb3IgaHR0cHM6Ly9naXRodWIuY29tL05vYmxlSlMvc2V0SW1tZWRpYXRlXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmVxdWVzdEZsdXNoID0gc2V0SW1tZWRpYXRlLmJpbmQod2luZG93LCBmbHVzaCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVxdWVzdEZsdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZsdXNoKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbn0gZWxzZSBpZiAodHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgLy8gbW9kZXJuIGJyb3dzZXJzXG4gICAgLy8gaHR0cDovL3d3dy5ub25ibG9ja2luZy5pby8yMDExLzA2L3dpbmRvd25leHR0aWNrLmh0bWxcbiAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZmx1c2g7XG4gICAgcmVxdWVzdEZsdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgIH07XG5cbn0gZWxzZSB7XG4gICAgLy8gb2xkIGJyb3dzZXJzXG4gICAgcmVxdWVzdEZsdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhc2FwKHRhc2spIHtcbiAgICB0YWlsID0gdGFpbC5uZXh0ID0ge1xuICAgICAgICB0YXNrOiB0YXNrLFxuICAgICAgICBkb21haW46IGlzTm9kZUpTICYmIHByb2Nlc3MuZG9tYWluLFxuICAgICAgICBuZXh0OiBudWxsXG4gICAgfTtcblxuICAgIGlmICghZmx1c2hpbmcpIHtcbiAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0Rmx1c2goKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzYXA7XG5cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcHJvbWlzZS9ub2RlX21vZHVsZXMvYXNhcC9hc2FwLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2Uvbm9kZV9tb2R1bGVzL2FzYXBcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgbm93ID0gcmVxdWlyZSgncGVyZm9ybWFuY2Utbm93JylcbiAgLCBnbG9iYWwgPSB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyA/IHt9IDogd2luZG93XG4gICwgdmVuZG9ycyA9IFsnbW96JywgJ3dlYmtpdCddXG4gICwgc3VmZml4ID0gJ0FuaW1hdGlvbkZyYW1lJ1xuICAsIHJhZiA9IGdsb2JhbFsncmVxdWVzdCcgKyBzdWZmaXhdXG4gICwgY2FmID0gZ2xvYmFsWydjYW5jZWwnICsgc3VmZml4XSB8fCBnbG9iYWxbJ2NhbmNlbFJlcXVlc3QnICsgc3VmZml4XVxuICAsIG5hdGl2ZSA9IHRydWVcblxuZm9yKHZhciBpID0gMDsgaSA8IHZlbmRvcnMubGVuZ3RoICYmICFyYWY7IGkrKykge1xuICByYWYgPSBnbG9iYWxbdmVuZG9yc1tpXSArICdSZXF1ZXN0JyArIHN1ZmZpeF1cbiAgY2FmID0gZ2xvYmFsW3ZlbmRvcnNbaV0gKyAnQ2FuY2VsJyArIHN1ZmZpeF1cbiAgICAgIHx8IGdsb2JhbFt2ZW5kb3JzW2ldICsgJ0NhbmNlbFJlcXVlc3QnICsgc3VmZml4XVxufVxuXG4vLyBTb21lIHZlcnNpb25zIG9mIEZGIGhhdmUgckFGIGJ1dCBub3QgY0FGXG5pZighcmFmIHx8ICFjYWYpIHtcbiAgbmF0aXZlID0gZmFsc2VcblxuICB2YXIgbGFzdCA9IDBcbiAgICAsIGlkID0gMFxuICAgICwgcXVldWUgPSBbXVxuICAgICwgZnJhbWVEdXJhdGlvbiA9IDEwMDAgLyA2MFxuXG4gIHJhZiA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgaWYocXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgICB2YXIgX25vdyA9IG5vdygpXG4gICAgICAgICwgbmV4dCA9IE1hdGgubWF4KDAsIGZyYW1lRHVyYXRpb24gLSAoX25vdyAtIGxhc3QpKVxuICAgICAgbGFzdCA9IG5leHQgKyBfbm93XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY3AgPSBxdWV1ZS5zbGljZSgwKVxuICAgICAgICAvLyBDbGVhciBxdWV1ZSBoZXJlIHRvIHByZXZlbnRcbiAgICAgICAgLy8gY2FsbGJhY2tzIGZyb20gYXBwZW5kaW5nIGxpc3RlbmVyc1xuICAgICAgICAvLyB0byB0aGUgY3VycmVudCBmcmFtZSdzIHF1ZXVlXG4gICAgICAgIHF1ZXVlLmxlbmd0aCA9IDBcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGNwLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYoIWNwW2ldLmNhbmNlbGxlZCkge1xuICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICBjcFtpXS5jYWxsYmFjayhsYXN0KVxuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRocm93IGUgfSwgMClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIE1hdGgucm91bmQobmV4dCkpXG4gICAgfVxuICAgIHF1ZXVlLnB1c2goe1xuICAgICAgaGFuZGxlOiArK2lkLFxuICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrLFxuICAgICAgY2FuY2VsbGVkOiBmYWxzZVxuICAgIH0pXG4gICAgcmV0dXJuIGlkXG4gIH1cblxuICBjYWYgPSBmdW5jdGlvbihoYW5kbGUpIHtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKHF1ZXVlW2ldLmhhbmRsZSA9PT0gaGFuZGxlKSB7XG4gICAgICAgIHF1ZXVlW2ldLmNhbmNlbGxlZCA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihmbikge1xuICAvLyBXcmFwIGluIGEgbmV3IGZ1bmN0aW9uIHRvIHByZXZlbnRcbiAgLy8gYGNhbmNlbGAgcG90ZW50aWFsbHkgYmVpbmcgYXNzaWduZWRcbiAgLy8gdG8gdGhlIG5hdGl2ZSByQUYgZnVuY3Rpb25cbiAgaWYoIW5hdGl2ZSkge1xuICAgIHJldHVybiByYWYuY2FsbChnbG9iYWwsIGZuKVxuICB9XG4gIHJldHVybiByYWYuY2FsbChnbG9iYWwsIGZ1bmN0aW9uKCkge1xuICAgIHRyeXtcbiAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRocm93IGUgfSwgMClcbiAgICB9XG4gIH0pXG59XG5tb2R1bGUuZXhwb3J0cy5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgY2FmLmFwcGx5KGdsb2JhbCwgYXJndW1lbnRzKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9yYWYvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcmFmXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuM1xuKGZ1bmN0aW9uKCkge1xuICB2YXIgZ2V0TmFub1NlY29uZHMsIGhydGltZSwgbG9hZFRpbWU7XG5cbiAgaWYgKCh0eXBlb2YgcGVyZm9ybWFuY2UgIT09IFwidW5kZWZpbmVkXCIgJiYgcGVyZm9ybWFuY2UgIT09IG51bGwpICYmIHBlcmZvcm1hbmNlLm5vdykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgfTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgcHJvY2VzcyAhPT0gbnVsbCkgJiYgcHJvY2Vzcy5ocnRpbWUpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIChnZXROYW5vU2Vjb25kcygpIC0gbG9hZFRpbWUpIC8gMWU2O1xuICAgIH07XG4gICAgaHJ0aW1lID0gcHJvY2Vzcy5ocnRpbWU7XG4gICAgZ2V0TmFub1NlY29uZHMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBocjtcbiAgICAgIGhyID0gaHJ0aW1lKCk7XG4gICAgICByZXR1cm4gaHJbMF0gKiAxZTkgKyBoclsxXTtcbiAgICB9O1xuICAgIGxvYWRUaW1lID0gZ2V0TmFub1NlY29uZHMoKTtcbiAgfSBlbHNlIGlmIChEYXRlLm5vdykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gRGF0ZS5ub3coKSAtIGxvYWRUaW1lO1xuICAgIH07XG4gICAgbG9hZFRpbWUgPSBEYXRlLm5vdygpO1xuICB9IGVsc2Uge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBsb2FkVGltZTtcbiAgICB9O1xuICAgIGxvYWRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIH1cblxufSkuY2FsbCh0aGlzKTtcblxuLypcbi8vQCBzb3VyY2VNYXBwaW5nVVJMPXBlcmZvcm1hbmNlLW5vdy5tYXBcbiovXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3JhZi9ub2RlX21vZHVsZXMvcGVyZm9ybWFuY2Utbm93L2xpYi9wZXJmb3JtYW5jZS1ub3cuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcmFmL25vZGVfbW9kdWxlcy9wZXJmb3JtYW5jZS1ub3cvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xubW9kdWxlLmV4cG9ydHMgPSBWZWxvY2l0eVxuXG5mdW5jdGlvbiBWZWxvY2l0eSgpIHtcbiAgdGhpcy5wb3NpdGlvblF1ZXVlID0gW11cbiAgdGhpcy50aW1lUXVldWUgPSBbXVxufVxuXG5WZWxvY2l0eS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wb3NpdGlvblF1ZXVlLnNwbGljZSgwKVxuICB0aGlzLnRpbWVRdWV1ZS5zcGxpY2UoMClcbn1cblxuVmVsb2NpdHkucHJvdG90eXBlLnBydW5lUXVldWUgPSBmdW5jdGlvbihtcykge1xuICAvL3B1bGwgb2xkIHZhbHVlcyBvZmYgb2YgdGhlIHF1ZXVlXG4gIHdoaWxlKHRoaXMudGltZVF1ZXVlLmxlbmd0aCAmJiB0aGlzLnRpbWVRdWV1ZVswXSA8IChEYXRlLm5vdygpIC0gbXMpKSB7XG4gICAgdGhpcy50aW1lUXVldWUuc2hpZnQoKVxuICAgIHRoaXMucG9zaXRpb25RdWV1ZS5zaGlmdCgpXG4gIH1cbn1cblxuVmVsb2NpdHkucHJvdG90eXBlLnVwZGF0ZVBvc2l0aW9uID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcbiAgdGhpcy5wb3NpdGlvblF1ZXVlLnB1c2gocG9zaXRpb24pXG4gIHRoaXMudGltZVF1ZXVlLnB1c2goRGF0ZS5ub3coKSlcbiAgdGhpcy5wcnVuZVF1ZXVlKDUwKVxufVxuXG5WZWxvY2l0eS5wcm90b3R5cGUuZ2V0VmVsb2NpdHkgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcnVuZVF1ZXVlKDEwMDApXG4gIHZhciBsZW5ndGggPSB0aGlzLnRpbWVRdWV1ZS5sZW5ndGhcbiAgaWYobGVuZ3RoIDwgMikgcmV0dXJuIDBcblxuICB2YXIgZGlzdGFuY2UgPSB0aGlzLnBvc2l0aW9uUXVldWVbbGVuZ3RoLTFdIC0gdGhpcy5wb3NpdGlvblF1ZXVlWzBdXG4gICAgLCB0aW1lID0gKHRoaXMudGltZVF1ZXVlW2xlbmd0aC0xXSAtIHRoaXMudGltZVF1ZXVlWzBdKSAvIDEwMDBcblxuICByZXR1cm4gZGlzdGFuY2UgLyB0aW1lXG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3RvdWNoLXZlbG9jaXR5L2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3RvdWNoLXZlbG9jaXR5XCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjcuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgJCwgT3JpRG9taSwgYWRkU3R5bGUsIGFuY2hvckxpc3QsIGFuY2hvckxpc3RILCBhbmNob3JMaXN0ViwgYmFzZU5hbWUsIGNhcGl0YWxpemUsIGNsb25lRWwsIGNyZWF0ZUVsLCBjc3MsIGRlZmF1bHRzLCBkZWZlciwgZWxDbGFzc2VzLCBnZXRHcmFkaWVudCwgaGlkZUVsLCBpc1N1cHBvcnRlZCwgaywgbGliTmFtZSwgbm9PcCwgcHJlZml4TGlzdCwgcHJlcCwgc2hvd0VsLCBzdHlsZUJ1ZmZlciwgc3VwcG9ydFdhcm5pbmcsIHRlc3RFbCwgdGVzdFByb3AsIHYsIF9yZWYsXG4gICAgX19iaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfSxcbiAgICBfX2luZGV4T2YgPSBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHsgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykgeyBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHJldHVybiBpOyB9IHJldHVybiAtMTsgfSxcbiAgICBfX3NsaWNlID0gW10uc2xpY2U7XG5cbiAgbGliTmFtZSA9ICdPcmlEb21pJztcblxuICBpc1N1cHBvcnRlZCA9IHRydWU7XG5cbiAgc3VwcG9ydFdhcm5pbmcgPSBmdW5jdGlvbihwcm9wKSB7XG4gICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIlwiICsgbGliTmFtZSArIFwiOiBNaXNzaW5nIHN1cHBvcnQgZm9yIGBcIiArIHByb3AgKyBcImAuXCIpO1xuICAgIH1cbiAgICByZXR1cm4gaXNTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgfTtcblxuICB0ZXN0UHJvcCA9IGZ1bmN0aW9uKHByb3ApIHtcbiAgICB2YXIgZnVsbCwgcHJlZml4LCBfaSwgX2xlbjtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHByZWZpeExpc3QubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIHByZWZpeCA9IHByZWZpeExpc3RbX2ldO1xuICAgICAgaWYgKChmdWxsID0gcHJlZml4ICsgY2FwaXRhbGl6ZShwcm9wKSkgaW4gdGVzdEVsLnN0eWxlKSB7XG4gICAgICAgIHJldHVybiBmdWxsO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocHJvcCBpbiB0ZXN0RWwuc3R5bGUpIHtcbiAgICAgIHJldHVybiBwcm9wO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgYWRkU3R5bGUgPSBmdW5jdGlvbihzZWxlY3RvciwgcnVsZXMpIHtcbiAgICB2YXIgcHJvcCwgc3R5bGUsIHZhbDtcbiAgICBzdHlsZSA9IFwiLlwiICsgc2VsZWN0b3IgKyBcIntcIjtcbiAgICBmb3IgKHByb3AgaW4gcnVsZXMpIHtcbiAgICAgIHZhbCA9IHJ1bGVzW3Byb3BdO1xuICAgICAgaWYgKHByb3AgaW4gY3NzKSB7XG4gICAgICAgIHByb3AgPSBjc3NbcHJvcF07XG4gICAgICAgIGlmIChwcm9wLm1hdGNoKC9eKHdlYmtpdHxtb3p8bXMpL2kpKSB7XG4gICAgICAgICAgcHJvcCA9ICctJyArIHByb3A7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHN0eWxlICs9IFwiXCIgKyAocHJvcC5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpKSArIFwiOlwiICsgdmFsICsgXCI7XCI7XG4gICAgfVxuICAgIHJldHVybiBzdHlsZUJ1ZmZlciArPSBzdHlsZSArICd9JztcbiAgfTtcblxuICBnZXRHcmFkaWVudCA9IGZ1bmN0aW9uKGFuY2hvcikge1xuICAgIHJldHVybiBcIlwiICsgY3NzLmdyYWRpZW50UHJvcCArIFwiKFwiICsgYW5jaG9yICsgXCIsIHJnYmEoMCwgMCwgMCwgLjUpIDAlLCByZ2JhKDI1NSwgMjU1LCAyNTUsIC4zNSkgMTAwJSlcIjtcbiAgfTtcblxuICBjYXBpdGFsaXplID0gZnVuY3Rpb24ocykge1xuICAgIHJldHVybiBzWzBdLnRvVXBwZXJDYXNlKCkgKyBzLnNsaWNlKDEpO1xuICB9O1xuXG4gIGNyZWF0ZUVsID0gZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgdmFyIGVsO1xuICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWwuY2xhc3NOYW1lID0gZWxDbGFzc2VzW2NsYXNzTmFtZV07XG4gICAgcmV0dXJuIGVsO1xuICB9O1xuXG4gIGNsb25lRWwgPSBmdW5jdGlvbihwYXJlbnQsIGRlZXAsIGNsYXNzTmFtZSkge1xuICAgIHZhciBlbDtcbiAgICBlbCA9IHBhcmVudC5jbG9uZU5vZGUoZGVlcCk7XG4gICAgZWwuY2xhc3NMaXN0LmFkZChlbENsYXNzZXNbY2xhc3NOYW1lXSk7XG4gICAgcmV0dXJuIGVsO1xuICB9O1xuXG4gIGhpZGVFbCA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgcmV0dXJuIGVsLnN0eWxlW2Nzcy50cmFuc2Zvcm1dID0gJ3RyYW5zbGF0ZTNkKC05OTk5OXB4LCAwLCAwKSc7XG4gIH07XG5cbiAgc2hvd0VsID0gZnVuY3Rpb24oZWwpIHtcbiAgICByZXR1cm4gZWwuc3R5bGVbY3NzLnRyYW5zZm9ybV0gPSAndHJhbnNsYXRlM2QoMCwgMCwgMCknO1xuICB9O1xuXG4gIHByZXAgPSBmdW5jdGlvbihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhMCwgYTEsIGEyLCBhbmNob3IsIGFuZ2xlLCBvcHQ7XG4gICAgICBpZiAodGhpcy5fdG91Y2hTdGFydGVkKSB7XG4gICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYTAgPSBhcmd1bWVudHNbMF0sIGExID0gYXJndW1lbnRzWzFdLCBhMiA9IGFyZ3VtZW50c1syXTtcbiAgICAgICAgb3B0ID0ge307XG4gICAgICAgIGFuZ2xlID0gYW5jaG9yID0gbnVsbDtcbiAgICAgICAgc3dpdGNoIChmbi5sZW5ndGgpIHtcbiAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBvcHQuY2FsbGJhY2sgPSBhMDtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0ZvbGRlZFVwKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0eXBlb2Ygb3B0LmNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIgPyBvcHQuY2FsbGJhY2soKSA6IHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYTAgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgb3B0LmNhbGxiYWNrID0gYTA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhbmNob3IgPSBhMDtcbiAgICAgICAgICAgICAgb3B0LmNhbGxiYWNrID0gYTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICBhbmdsZSA9IGEwO1xuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhMSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBvcHQgPSBhMTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYTEgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBvcHQuY2FsbGJhY2sgPSBhMTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhbmNob3IgPSBhMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAgIGFuY2hvciA9IGExO1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGEyID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIG9wdCA9IGEyO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBhMiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIG9wdC5jYWxsYmFjayA9IGEyO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFuZ2xlID09IG51bGwpIHtcbiAgICAgICAgICBhbmdsZSA9IHRoaXMuX2xhc3RPcC5hbmdsZSB8fCAwO1xuICAgICAgICB9XG4gICAgICAgIGFuY2hvciB8fCAoYW5jaG9yID0gdGhpcy5fbGFzdE9wLmFuY2hvcik7XG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2goW2ZuLCB0aGlzLl9ub3JtYWxpemVBbmdsZShhbmdsZSksIHRoaXMuX2dldExvbmdoYW5kQW5jaG9yKGFuY2hvciksIG9wdF0pO1xuICAgICAgICB0aGlzLl9zdGVwKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgZGVmZXIgPSBmdW5jdGlvbihmbikge1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgfTtcblxuICBub09wID0gZnVuY3Rpb24oKSB7fTtcblxuICAkID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93ICE9PSBudWxsID8gKF9yZWYgPSB3aW5kb3cuJCkgIT0gbnVsbCA/IF9yZWYuZGF0YSA6IHZvaWQgMCA6IHZvaWQgMCkgPyB3aW5kb3cuJCA6IG51bGw7XG5cbiAgYW5jaG9yTGlzdCA9IFsnbGVmdCcsICdyaWdodCcsICd0b3AnLCAnYm90dG9tJ107XG5cbiAgYW5jaG9yTGlzdFYgPSBhbmNob3JMaXN0LnNsaWNlKDAsIDIpO1xuXG4gIGFuY2hvckxpc3RIID0gYW5jaG9yTGlzdC5zbGljZSgyKTtcblxuICB0ZXN0RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICBzdHlsZUJ1ZmZlciA9ICcnO1xuXG4gIHByZWZpeExpc3QgPSBbJ1dlYmtpdCcsICdNb3onLCAnbXMnXTtcblxuICBiYXNlTmFtZSA9IGxpYk5hbWUudG9Mb3dlckNhc2UoKTtcblxuICBlbENsYXNzZXMgPSB7XG4gICAgYWN0aXZlOiAnYWN0aXZlJyxcbiAgICBjbG9uZTogJ2Nsb25lJyxcbiAgICBob2xkZXI6ICdob2xkZXInLFxuICAgIHN0YWdlOiAnc3RhZ2UnLFxuICAgIHN0YWdlTGVmdDogJ3N0YWdlLWxlZnQnLFxuICAgIHN0YWdlUmlnaHQ6ICdzdGFnZS1yaWdodCcsXG4gICAgc3RhZ2VUb3A6ICdzdGFnZS10b3AnLFxuICAgIHN0YWdlQm90dG9tOiAnc3RhZ2UtYm90dG9tJyxcbiAgICBjb250ZW50OiAnY29udGVudCcsXG4gICAgbWFzazogJ21hc2snLFxuICAgIG1hc2tIOiAnbWFzay1oJyxcbiAgICBtYXNrVjogJ21hc2stdicsXG4gICAgcGFuZWw6ICdwYW5lbCcsXG4gICAgcGFuZWxIOiAncGFuZWwtaCcsXG4gICAgcGFuZWxWOiAncGFuZWwtdicsXG4gICAgc2hhZGVyOiAnc2hhZGVyJyxcbiAgICBzaGFkZXJMZWZ0OiAnc2hhZGVyLWxlZnQnLFxuICAgIHNoYWRlclJpZ2h0OiAnc2hhZGVyLXJpZ2h0JyxcbiAgICBzaGFkZXJUb3A6ICdzaGFkZXItdG9wJyxcbiAgICBzaGFkZXJCb3R0b206ICdzaGFkZXItYm90dG9tJ1xuICB9O1xuXG4gIGZvciAoayBpbiBlbENsYXNzZXMpIHtcbiAgICB2ID0gZWxDbGFzc2VzW2tdO1xuICAgIGVsQ2xhc3Nlc1trXSA9IFwiXCIgKyBiYXNlTmFtZSArIFwiLVwiICsgdjtcbiAgfVxuXG4gIGNzcyA9IG5ldyBmdW5jdGlvbigpIHtcbiAgICB2YXIga2V5LCBfaSwgX2xlbiwgX3JlZjE7XG4gICAgX3JlZjEgPSBbJ3RyYW5zZm9ybScsICd0cmFuc2Zvcm1PcmlnaW4nLCAndHJhbnNmb3JtU3R5bGUnLCAndHJhbnNpdGlvblByb3BlcnR5JywgJ3RyYW5zaXRpb25EdXJhdGlvbicsICd0cmFuc2l0aW9uRGVsYXknLCAndHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uJywgJ3BlcnNwZWN0aXZlJywgJ3BlcnNwZWN0aXZlT3JpZ2luJywgJ2JhY2tmYWNlVmlzaWJpbGl0eScsICdib3hTaXppbmcnLCAnbWFzayddO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGtleSA9IF9yZWYxW19pXTtcbiAgICAgIHRoaXNba2V5XSA9IGtleTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgKGZ1bmN0aW9uKCkge1xuICAgIHZhciBhbmNob3IsIGtleSwgcDNkLCBwcmVmaXgsIHN0eWxlRWwsIHZhbHVlLCBfaSwgX2xlbiwgX3JlZjEsIF9yZWYyO1xuICAgIGZvciAoa2V5IGluIGNzcykge1xuICAgICAgdmFsdWUgPSBjc3Nba2V5XTtcbiAgICAgIGNzc1trZXldID0gdGVzdFByb3AodmFsdWUpO1xuICAgICAgaWYgKCFjc3Nba2V5XSkge1xuICAgICAgICByZXR1cm4gc3VwcG9ydFdhcm5pbmcodmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBwM2QgPSAncHJlc2VydmUtM2QnO1xuICAgIHRlc3RFbC5zdHlsZVtjc3MudHJhbnNmb3JtU3R5bGVdID0gcDNkO1xuICAgIGlmICh0ZXN0RWwuc3R5bGVbY3NzLnRyYW5zZm9ybVN0eWxlXSAhPT0gcDNkKSB7XG4gICAgICByZXR1cm4gc3VwcG9ydFdhcm5pbmcocDNkKTtcbiAgICB9XG4gICAgY3NzLmdyYWRpZW50UHJvcCA9IChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBoeXBoZW5hdGVkLCBwcmVmaXgsIF9pLCBfbGVuO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBwcmVmaXhMaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHByZWZpeCA9IHByZWZpeExpc3RbX2ldO1xuICAgICAgICBoeXBoZW5hdGVkID0gXCItXCIgKyAocHJlZml4LnRvTG93ZXJDYXNlKCkpICsgXCItbGluZWFyLWdyYWRpZW50XCI7XG4gICAgICAgIHRlc3RFbC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBcIlwiICsgaHlwaGVuYXRlZCArIFwiKGxlZnQsICMwMDAsICNmZmYpXCI7XG4gICAgICAgIGlmICh0ZXN0RWwuc3R5bGUuYmFja2dyb3VuZEltYWdlLmluZGV4T2YoJ2dyYWRpZW50JykgIT09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIGh5cGhlbmF0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiAnbGluZWFyLWdyYWRpZW50JztcbiAgICB9KSgpO1xuICAgIF9yZWYxID0gKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGdyYWJWYWx1ZSwgcGxhaW5HcmFiLCBwcmVmaXgsIF9pLCBfbGVuO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBwcmVmaXhMaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHByZWZpeCA9IHByZWZpeExpc3RbX2ldO1xuICAgICAgICBwbGFpbkdyYWIgPSAnZ3JhYic7XG4gICAgICAgIHRlc3RFbC5zdHlsZS5jdXJzb3IgPSAoZ3JhYlZhbHVlID0gXCItXCIgKyAocHJlZml4LnRvTG93ZXJDYXNlKCkpICsgXCItXCIgKyBwbGFpbkdyYWIpO1xuICAgICAgICBpZiAodGVzdEVsLnN0eWxlLmN1cnNvciA9PT0gZ3JhYlZhbHVlKSB7XG4gICAgICAgICAgcmV0dXJuIFtncmFiVmFsdWUsIFwiLVwiICsgKHByZWZpeC50b0xvd2VyQ2FzZSgpKSArIFwiLWdyYWJiaW5nXCJdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0ZXN0RWwuc3R5bGUuY3Vyc29yID0gcGxhaW5HcmFiO1xuICAgICAgaWYgKHRlc3RFbC5zdHlsZS5jdXJzb3IgPT09IHBsYWluR3JhYikge1xuICAgICAgICByZXR1cm4gW3BsYWluR3JhYiwgJ2dyYWJiaW5nJ107XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gWydtb3ZlJywgJ21vdmUnXTtcbiAgICAgIH1cbiAgICB9KSgpLCBjc3MuZ3JhYiA9IF9yZWYxWzBdLCBjc3MuZ3JhYmJpbmcgPSBfcmVmMVsxXTtcbiAgICBjc3MudHJhbnNmb3JtUHJvcCA9IChwcmVmaXggPSBjc3MudHJhbnNmb3JtLm1hdGNoKC8oXFx3KylUcmFuc2Zvcm0vaSkpID8gXCItXCIgKyAocHJlZml4WzFdLnRvTG93ZXJDYXNlKCkpICsgXCItdHJhbnNmb3JtXCIgOiAndHJhbnNmb3JtJztcbiAgICBjc3MudHJhbnNpdGlvbkVuZCA9IChmdW5jdGlvbigpIHtcbiAgICAgIHN3aXRjaCAoY3NzLnRyYW5zaXRpb25Qcm9wZXJ0eS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgIGNhc2UgJ3RyYW5zaXRpb25wcm9wZXJ0eSc6XG4gICAgICAgICAgcmV0dXJuICd0cmFuc2l0aW9uRW5kJztcbiAgICAgICAgY2FzZSAnd2Via2l0dHJhbnNpdGlvbnByb3BlcnR5JzpcbiAgICAgICAgICByZXR1cm4gJ3dlYmtpdFRyYW5zaXRpb25FbmQnO1xuICAgICAgICBjYXNlICdtb3p0cmFuc2l0aW9ucHJvcGVydHknOlxuICAgICAgICAgIHJldHVybiAndHJhbnNpdGlvbmVuZCc7XG4gICAgICAgIGNhc2UgJ21zdHJhbnNpdGlvbnByb3BlcnR5JzpcbiAgICAgICAgICByZXR1cm4gJ21zVHJhbnNpdGlvbkVuZCc7XG4gICAgICB9XG4gICAgfSkoKTtcbiAgICBhZGRTdHlsZShlbENsYXNzZXMuYWN0aXZlLCB7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCAhaW1wb3J0YW50JyxcbiAgICAgIGJhY2tncm91bmRJbWFnZTogJ25vbmUgIWltcG9ydGFudCcsXG4gICAgICBib3hTaXppbmc6ICdib3JkZXItYm94ICFpbXBvcnRhbnQnLFxuICAgICAgYm9yZGVyOiAnbm9uZSAhaW1wb3J0YW50JyxcbiAgICAgIG91dGxpbmU6ICdub25lICFpbXBvcnRhbnQnLFxuICAgICAgcGFkZGluZzogJzAgIWltcG9ydGFudCcsXG4gICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgIHRyYW5zZm9ybVN0eWxlOiBwM2QgKyAnICFpbXBvcnRhbnQnLFxuICAgICAgbWFzazogJ25vbmUgIWltcG9ydGFudCdcbiAgICB9KTtcbiAgICBhZGRTdHlsZShlbENsYXNzZXMuY2xvbmUsIHtcbiAgICAgIG1hcmdpbjogJzAgIWltcG9ydGFudCcsXG4gICAgICBib3hTaXppbmc6ICdib3JkZXItYm94ICFpbXBvcnRhbnQnLFxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4gIWltcG9ydGFudCcsXG4gICAgICBkaXNwbGF5OiAnYmxvY2sgIWltcG9ydGFudCdcbiAgICB9KTtcbiAgICBhZGRTdHlsZShlbENsYXNzZXMuaG9sZGVyLCB7XG4gICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICB0b3A6ICcwJyxcbiAgICAgIGJvdHRvbTogJzAnLFxuICAgICAgdHJhbnNmb3JtU3R5bGU6IHAzZFxuICAgIH0pO1xuICAgIGFkZFN0eWxlKGVsQ2xhc3Nlcy5zdGFnZSwge1xuICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgIGhlaWdodDogJzEwMCUnLFxuICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUzZCgtOTk5OXB4LCAwLCAwKScsXG4gICAgICBtYXJnaW46ICcwJyxcbiAgICAgIHBhZGRpbmc6ICcwJyxcbiAgICAgIHRyYW5zZm9ybVN0eWxlOiBwM2RcbiAgICB9KTtcbiAgICBfcmVmMiA9IHtcbiAgICAgIExlZnQ6ICcwJSA1MCUnLFxuICAgICAgUmlnaHQ6ICcxMDAlIDUwJScsXG4gICAgICBUb3A6ICc1MCUgMCUnLFxuICAgICAgQm90dG9tOiAnNTAlIDEwMCUnXG4gICAgfTtcbiAgICBmb3IgKGsgaW4gX3JlZjIpIHtcbiAgICAgIHYgPSBfcmVmMltrXTtcbiAgICAgIGFkZFN0eWxlKGVsQ2xhc3Nlc1snc3RhZ2UnICsga10sIHtcbiAgICAgICAgcGVyc3BlY3RpdmVPcmlnaW46IHZcbiAgICAgIH0pO1xuICAgIH1cbiAgICBhZGRTdHlsZShlbENsYXNzZXMuc2hhZGVyLCB7XG4gICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgIG9wYWNpdHk6ICcwJyxcbiAgICAgIHRvcDogJzAnLFxuICAgICAgbGVmdDogJzAnLFxuICAgICAgcG9pbnRlckV2ZW50czogJ25vbmUnLFxuICAgICAgdHJhbnNpdGlvblByb3BlcnR5OiAnb3BhY2l0eSdcbiAgICB9KTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGFuY2hvckxpc3QubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGFuY2hvciA9IGFuY2hvckxpc3RbX2ldO1xuICAgICAgYWRkU3R5bGUoZWxDbGFzc2VzWydzaGFkZXInICsgY2FwaXRhbGl6ZShhbmNob3IpXSwge1xuICAgICAgICBiYWNrZ3JvdW5kOiBnZXRHcmFkaWVudChhbmNob3IpXG4gICAgICB9KTtcbiAgICB9XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLmNvbnRlbnQsIHtcbiAgICAgIG1hcmdpbjogJzAgIWltcG9ydGFudCcsXG4gICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlICFpbXBvcnRhbnQnLFxuICAgICAgZmxvYXQ6ICdub25lICFpbXBvcnRhbnQnLFxuICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCAhaW1wb3J0YW50JyxcbiAgICAgIG92ZXJmbG93OiAnaGlkZGVuICFpbXBvcnRhbnQnXG4gICAgfSk7XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLm1hc2ssIHtcbiAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMCwgMCwgMCknLFxuICAgICAgb3V0bGluZTogJzFweCBzb2xpZCB0cmFuc3BhcmVudCdcbiAgICB9KTtcbiAgICBhZGRTdHlsZShlbENsYXNzZXMucGFuZWwsIHtcbiAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgIHBhZGRpbmc6ICcwJyxcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgdHJhbnNpdGlvblByb3BlcnR5OiBjc3MudHJhbnNmb3JtUHJvcCxcbiAgICAgIHRyYW5zZm9ybU9yaWdpbjogJ2xlZnQnLFxuICAgICAgdHJhbnNmb3JtU3R5bGU6IHAzZFxuICAgIH0pO1xuICAgIGFkZFN0eWxlKGVsQ2xhc3Nlcy5wYW5lbEgsIHtcbiAgICAgIHRyYW5zZm9ybU9yaWdpbjogJ3RvcCdcbiAgICB9KTtcbiAgICBhZGRTdHlsZShcIlwiICsgZWxDbGFzc2VzLnN0YWdlUmlnaHQgKyBcIiAuXCIgKyBlbENsYXNzZXMucGFuZWwsIHtcbiAgICAgIHRyYW5zZm9ybU9yaWdpbjogJ3JpZ2h0J1xuICAgIH0pO1xuICAgIGFkZFN0eWxlKFwiXCIgKyBlbENsYXNzZXMuc3RhZ2VCb3R0b20gKyBcIiAuXCIgKyBlbENsYXNzZXMucGFuZWwsIHtcbiAgICAgIHRyYW5zZm9ybU9yaWdpbjogJ2JvdHRvbSdcbiAgICB9KTtcbiAgICBzdHlsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBzdHlsZUVsLnR5cGUgPSAndGV4dC9jc3MnO1xuICAgIGlmIChzdHlsZUVsLnN0eWxlU2hlZXQpIHtcbiAgICAgIHN0eWxlRWwuc3R5bGVTaGVldC5jc3NUZXh0ID0gc3R5bGVCdWZmZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlRWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoc3R5bGVCdWZmZXIpKTtcbiAgICB9XG4gICAgcmV0dXJuIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVFbCk7XG4gIH0pKCk7XG5cbiAgZGVmYXVsdHMgPSB7XG4gICAgdlBhbmVsczogMyxcbiAgICBoUGFuZWxzOiAzLFxuICAgIHBlcnNwZWN0aXZlOiAxMDAwLFxuICAgIHNoYWRpbmc6ICdoYXJkJyxcbiAgICBzcGVlZDogNzAwLFxuICAgIG1heEFuZ2xlOiA5MCxcbiAgICByaXBwbGU6IDAsXG4gICAgb3JpRG9taUNsYXNzOiBsaWJOYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgc2hhZGluZ0ludGVuc2l0eTogMSxcbiAgICBlYXNpbmdNZXRob2Q6ICcnLFxuICAgIGdhcE51ZGdlOiAxLFxuICAgIHRvdWNoRW5hYmxlZDogdHJ1ZSxcbiAgICB0b3VjaFNlbnNpdGl2aXR5OiAuMjUsXG4gICAgdG91Y2hTdGFydENhbGxiYWNrOiBub09wLFxuICAgIHRvdWNoTW92ZUNhbGxiYWNrOiBub09wLFxuICAgIHRvdWNoRW5kQ2FsbGJhY2s6IG5vT3BcbiAgfTtcblxuICBPcmlEb21pID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIE9yaURvbWkoZWwsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBhLCBhbmNob3IsIGFuY2hvclNldCwgYXhpcywgY2xhc3NTdWZmaXgsIGNvbnRlbnQsIGNvbnRlbnRIb2xkZXIsIGNvdW50LCBpLCBpbmRleCwgbWFzaywgbWFza1Byb3RvLCBtZXRyaWMsIG9mZnNldHMsIHBhbmVsLCBwYW5lbENvbmZpZywgcGFuZWxLZXksIHBhbmVsTiwgcGFuZWxQcm90bywgcGVyY2VudCwgcHJldiwgcHJvdG8sIHJpZ2h0T3JCb3R0b20sIHNoYWRlclByb3RvLCBzaGFkZXJQcm90b3MsIHNpZGUsIHN0YWdlUHJvdG8sIF9pLCBfaiwgX2ssIF9sLCBfbGVuLCBfbGVuMSwgX2xlbjIsIF9sZW4zLCBfbGVuNCwgX2xlbjUsIF9sZW42LCBfbGVuNywgX20sIF9uLCBfbywgX3AsIF9xLCBfcmVmMSwgX3JlZjI7XG4gICAgICB0aGlzLmVsID0gZWw7XG4gICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX29uTW91c2VPdXQgPSBfX2JpbmQodGhpcy5fb25Nb3VzZU91dCwgdGhpcyk7XG4gICAgICB0aGlzLl9vblRvdWNoTGVhdmUgPSBfX2JpbmQodGhpcy5fb25Ub3VjaExlYXZlLCB0aGlzKTtcbiAgICAgIHRoaXMuX29uVG91Y2hFbmQgPSBfX2JpbmQodGhpcy5fb25Ub3VjaEVuZCwgdGhpcyk7XG4gICAgICB0aGlzLl9vblRvdWNoTW92ZSA9IF9fYmluZCh0aGlzLl9vblRvdWNoTW92ZSwgdGhpcyk7XG4gICAgICB0aGlzLl9vblRvdWNoU3RhcnQgPSBfX2JpbmQodGhpcy5fb25Ub3VjaFN0YXJ0LCB0aGlzKTtcbiAgICAgIHRoaXMuX3N0YWdlUmVzZXQgPSBfX2JpbmQodGhpcy5fc3RhZ2VSZXNldCwgdGhpcyk7XG4gICAgICB0aGlzLl9jb25jbHVkZSA9IF9fYmluZCh0aGlzLl9jb25jbHVkZSwgdGhpcyk7XG4gICAgICB0aGlzLl9vblRyYW5zaXRpb25FbmQgPSBfX2JpbmQodGhpcy5fb25UcmFuc2l0aW9uRW5kLCB0aGlzKTtcbiAgICAgIHRoaXMuX3N0ZXAgPSBfX2JpbmQodGhpcy5fc3RlcCwgdGhpcyk7XG4gICAgICBpZiAoIWlzU3VwcG9ydGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBPcmlEb21pKSkge1xuICAgICAgICByZXR1cm4gbmV3IE9yaURvbWkodGhpcy5lbCwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHRoaXMuZWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMuZWwpO1xuICAgICAgfVxuICAgICAgaWYgKCEodGhpcy5lbCAmJiB0aGlzLmVsLm5vZGVUeXBlID09PSAxKSkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcIlwiICsgbGliTmFtZSArIFwiOiBGaXJzdCBhcmd1bWVudCBtdXN0IGJlIGEgRE9NIGVsZW1lbnRcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5fY29uZmlnID0gbmV3IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKGsgaW4gZGVmYXVsdHMpIHtcbiAgICAgICAgICB2ID0gZGVmYXVsdHNba107XG4gICAgICAgICAgaWYgKGsgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhpc1trXSA9IG9wdGlvbnNba107XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXNba10gPSB2O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH07XG4gICAgICB0aGlzLl9jb25maWcucmlwcGxlID0gTnVtYmVyKHRoaXMuX2NvbmZpZy5yaXBwbGUpO1xuICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgIHRoaXMuX3BhbmVscyA9IHt9O1xuICAgICAgdGhpcy5fc3RhZ2VzID0ge307XG4gICAgICB0aGlzLl9sYXN0T3AgPSB7XG4gICAgICAgIGFuY2hvcjogYW5jaG9yTGlzdFswXVxuICAgICAgfTtcbiAgICAgIHRoaXMuX3NoYWRpbmcgPSB0aGlzLl9jb25maWcuc2hhZGluZztcbiAgICAgIGlmICh0aGlzLl9zaGFkaW5nID09PSB0cnVlKSB7XG4gICAgICAgIHRoaXMuX3NoYWRpbmcgPSAnaGFyZCc7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fc2hhZGluZykge1xuICAgICAgICB0aGlzLl9zaGFkZXJzID0ge307XG4gICAgICAgIHNoYWRlclByb3RvcyA9IHt9O1xuICAgICAgICBzaGFkZXJQcm90byA9IGNyZWF0ZUVsKCdzaGFkZXInKTtcbiAgICAgICAgc2hhZGVyUHJvdG8uc3R5bGVbY3NzLnRyYW5zaXRpb25EdXJhdGlvbl0gPSB0aGlzLl9jb25maWcuc3BlZWQgKyAnbXMnO1xuICAgICAgICBzaGFkZXJQcm90by5zdHlsZVtjc3MudHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uXSA9IHRoaXMuX2NvbmZpZy5lYXNpbmdNZXRob2Q7XG4gICAgICB9XG4gICAgICBzdGFnZVByb3RvID0gY3JlYXRlRWwoJ3N0YWdlJyk7XG4gICAgICBzdGFnZVByb3RvLnN0eWxlW2Nzcy5wZXJzcGVjdGl2ZV0gPSB0aGlzLl9jb25maWcucGVyc3BlY3RpdmUgKyAncHgnO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBhbmNob3JMaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGFuY2hvciA9IGFuY2hvckxpc3RbX2ldO1xuICAgICAgICB0aGlzLl9wYW5lbHNbYW5jaG9yXSA9IFtdO1xuICAgICAgICB0aGlzLl9zdGFnZXNbYW5jaG9yXSA9IGNsb25lRWwoc3RhZ2VQcm90bywgZmFsc2UsICdzdGFnZScgKyBjYXBpdGFsaXplKGFuY2hvcikpO1xuICAgICAgICBpZiAodGhpcy5fc2hhZGluZykge1xuICAgICAgICAgIHRoaXMuX3NoYWRlcnNbYW5jaG9yXSA9IHt9O1xuICAgICAgICAgIGlmIChfX2luZGV4T2YuY2FsbChhbmNob3JMaXN0ViwgYW5jaG9yKSA+PSAwKSB7XG4gICAgICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBhbmNob3JMaXN0Vi5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgICAgICAgc2lkZSA9IGFuY2hvckxpc3RWW19qXTtcbiAgICAgICAgICAgICAgdGhpcy5fc2hhZGVyc1thbmNob3JdW3NpZGVdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoX2sgPSAwLCBfbGVuMiA9IGFuY2hvckxpc3RILmxlbmd0aDsgX2sgPCBfbGVuMjsgX2srKykge1xuICAgICAgICAgICAgICBzaWRlID0gYW5jaG9yTGlzdEhbX2tdO1xuICAgICAgICAgICAgICB0aGlzLl9zaGFkZXJzW2FuY2hvcl1bc2lkZV0gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgc2hhZGVyUHJvdG9zW2FuY2hvcl0gPSBjbG9uZUVsKHNoYWRlclByb3RvLCBmYWxzZSwgJ3NoYWRlcicgKyBjYXBpdGFsaXplKGFuY2hvcikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb250ZW50SG9sZGVyID0gY2xvbmVFbCh0aGlzLmVsLCB0cnVlLCAnY29udGVudCcpO1xuICAgICAgbWFza1Byb3RvID0gY3JlYXRlRWwoJ21hc2snKTtcbiAgICAgIG1hc2tQcm90by5hcHBlbmRDaGlsZChjb250ZW50SG9sZGVyKTtcbiAgICAgIHBhbmVsUHJvdG8gPSBjcmVhdGVFbCgncGFuZWwnKTtcbiAgICAgIHBhbmVsUHJvdG8uc3R5bGVbY3NzLnRyYW5zaXRpb25EdXJhdGlvbl0gPSB0aGlzLl9jb25maWcuc3BlZWQgKyAnbXMnO1xuICAgICAgcGFuZWxQcm90by5zdHlsZVtjc3MudHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uXSA9IHRoaXMuX2NvbmZpZy5lYXNpbmdNZXRob2Q7XG4gICAgICBvZmZzZXRzID0ge1xuICAgICAgICBsZWZ0OiBbXSxcbiAgICAgICAgdG9wOiBbXVxuICAgICAgfTtcbiAgICAgIF9yZWYxID0gWyd4JywgJ3knXTtcbiAgICAgIGZvciAoX2wgPSAwLCBfbGVuMyA9IF9yZWYxLmxlbmd0aDsgX2wgPCBfbGVuMzsgX2wrKykge1xuICAgICAgICBheGlzID0gX3JlZjFbX2xdO1xuICAgICAgICBpZiAoYXhpcyA9PT0gJ3gnKSB7XG4gICAgICAgICAgYW5jaG9yU2V0ID0gYW5jaG9yTGlzdFY7XG4gICAgICAgICAgbWV0cmljID0gJ3dpZHRoJztcbiAgICAgICAgICBjbGFzc1N1ZmZpeCA9ICdWJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhbmNob3JTZXQgPSBhbmNob3JMaXN0SDtcbiAgICAgICAgICBtZXRyaWMgPSAnaGVpZ2h0JztcbiAgICAgICAgICBjbGFzc1N1ZmZpeCA9ICdIJztcbiAgICAgICAgfVxuICAgICAgICBwYW5lbENvbmZpZyA9IHRoaXMuX2NvbmZpZ1twYW5lbEtleSA9IGNsYXNzU3VmZml4LnRvTG93ZXJDYXNlKCkgKyAnUGFuZWxzJ107XG4gICAgICAgIGlmICh0eXBlb2YgcGFuZWxDb25maWcgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgY291bnQgPSBNYXRoLmFicyhwYXJzZUludChwYW5lbENvbmZpZywgMTApKTtcbiAgICAgICAgICBwZXJjZW50ID0gMTAwIC8gY291bnQ7XG4gICAgICAgICAgcGFuZWxDb25maWcgPSB0aGlzLl9jb25maWdbcGFuZWxLZXldID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIF9tLCBfcmVzdWx0cztcbiAgICAgICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgICAgICBmb3IgKF9tID0gMDsgMCA8PSBjb3VudCA/IF9tIDwgY291bnQgOiBfbSA+IGNvdW50OyAwIDw9IGNvdW50ID8gX20rKyA6IF9tLS0pIHtcbiAgICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChwZXJjZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgICAgICB9KSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvdW50ID0gcGFuZWxDb25maWcubGVuZ3RoO1xuICAgICAgICAgIGlmICghKCg5OSA8PSAoX3JlZjIgPSBwYW5lbENvbmZpZy5yZWR1Y2UoZnVuY3Rpb24ocCwgYykge1xuICAgICAgICAgICAgcmV0dXJuIHAgKyBjO1xuICAgICAgICAgIH0pKSAmJiBfcmVmMiA8PSAxMDAuMSkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJcIiArIGxpYk5hbWUgKyBcIjogUGFuZWwgcGVyY2VudGFnZXMgZG8gbm90IHN1bSB0byAxMDBcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG1hc2sgPSBjbG9uZUVsKG1hc2tQcm90bywgdHJ1ZSwgJ21hc2snICsgY2xhc3NTdWZmaXgpO1xuICAgICAgICBpZiAodGhpcy5fc2hhZGluZykge1xuICAgICAgICAgIGZvciAoX20gPSAwLCBfbGVuNCA9IGFuY2hvclNldC5sZW5ndGg7IF9tIDwgX2xlbjQ7IF9tKyspIHtcbiAgICAgICAgICAgIGFuY2hvciA9IGFuY2hvclNldFtfbV07XG4gICAgICAgICAgICBtYXNrLmFwcGVuZENoaWxkKHNoYWRlclByb3Rvc1thbmNob3JdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcHJvdG8gPSBjbG9uZUVsKHBhbmVsUHJvdG8sIGZhbHNlLCAncGFuZWwnICsgY2xhc3NTdWZmaXgpO1xuICAgICAgICBwcm90by5hcHBlbmRDaGlsZChtYXNrKTtcbiAgICAgICAgZm9yIChyaWdodE9yQm90dG9tID0gX24gPSAwLCBfbGVuNSA9IGFuY2hvclNldC5sZW5ndGg7IF9uIDwgX2xlbjU7IHJpZ2h0T3JCb3R0b20gPSArK19uKSB7XG4gICAgICAgICAgYW5jaG9yID0gYW5jaG9yU2V0W3JpZ2h0T3JCb3R0b21dO1xuICAgICAgICAgIGZvciAocGFuZWxOID0gX28gPSAwOyAwIDw9IGNvdW50ID8gX28gPCBjb3VudCA6IF9vID4gY291bnQ7IHBhbmVsTiA9IDAgPD0gY291bnQgPyArK19vIDogLS1fbykge1xuICAgICAgICAgICAgcGFuZWwgPSBwcm90by5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBjb250ZW50ID0gcGFuZWwuY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF07XG4gICAgICAgICAgICBjb250ZW50LnN0eWxlLndpZHRoID0gY29udGVudC5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gICAgICAgICAgICBpZiAocmlnaHRPckJvdHRvbSkge1xuICAgICAgICAgICAgICBwYW5lbC5zdHlsZVtjc3Mub3JpZ2luXSA9IGFuY2hvcjtcbiAgICAgICAgICAgICAgaW5kZXggPSBwYW5lbENvbmZpZy5sZW5ndGggLSBwYW5lbE4gLSAxO1xuICAgICAgICAgICAgICBwcmV2ID0gaW5kZXggKyAxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaW5kZXggPSBwYW5lbE47XG4gICAgICAgICAgICAgIHByZXYgPSBpbmRleCAtIDE7XG4gICAgICAgICAgICAgIGlmIChwYW5lbE4gPT09IDApIHtcbiAgICAgICAgICAgICAgICBvZmZzZXRzW2FuY2hvcl0ucHVzaCgwKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvZmZzZXRzW2FuY2hvcl0ucHVzaCgob2Zmc2V0c1thbmNob3JdW3ByZXZdIC0gMTAwKSAqIChwYW5lbENvbmZpZ1twcmV2XSAvIHBhbmVsQ29uZmlnW2luZGV4XSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGFuZWxOID09PSAwKSB7XG4gICAgICAgICAgICAgIHBhbmVsLnN0eWxlW2FuY2hvcl0gPSAnMCc7XG4gICAgICAgICAgICAgIHBhbmVsLnN0eWxlW21ldHJpY10gPSBwYW5lbENvbmZpZ1tpbmRleF0gKyAnJSc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwYW5lbC5zdHlsZVthbmNob3JdID0gJzEwMCUnO1xuICAgICAgICAgICAgICBwYW5lbC5zdHlsZVttZXRyaWNdID0gcGFuZWxDb25maWdbaW5kZXhdIC8gcGFuZWxDb25maWdbcHJldl0gKiAxMDAgKyAnJSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fc2hhZGluZykge1xuICAgICAgICAgICAgICBmb3IgKGkgPSBfcCA9IDAsIF9sZW42ID0gYW5jaG9yU2V0Lmxlbmd0aDsgX3AgPCBfbGVuNjsgaSA9ICsrX3ApIHtcbiAgICAgICAgICAgICAgICBhID0gYW5jaG9yU2V0W2ldO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NoYWRlcnNbYW5jaG9yXVthXVtwYW5lbE5dID0gcGFuZWwuY2hpbGRyZW5bMF0uY2hpbGRyZW5baSArIDFdO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZW50LnN0eWxlW21ldHJpY10gPSBjb250ZW50LnN0eWxlWydtYXgnICsgY2FwaXRhbGl6ZShtZXRyaWMpXSA9IChjb3VudCAvIHBhbmVsQ29uZmlnW2luZGV4XSAqIDEwMDAwIC8gY291bnQpICsgJyUnO1xuICAgICAgICAgICAgY29udGVudC5zdHlsZVthbmNob3JTZXRbMF1dID0gb2Zmc2V0c1thbmNob3JTZXRbMF1dW2luZGV4XSArICclJztcbiAgICAgICAgICAgIHRoaXMuX3RyYW5zZm9ybVBhbmVsKHBhbmVsLCAwLCBhbmNob3IpO1xuICAgICAgICAgICAgdGhpcy5fcGFuZWxzW2FuY2hvcl1bcGFuZWxOXSA9IHBhbmVsO1xuICAgICAgICAgICAgaWYgKHBhbmVsTiAhPT0gMCkge1xuICAgICAgICAgICAgICB0aGlzLl9wYW5lbHNbYW5jaG9yXVtwYW5lbE4gLSAxXS5hcHBlbmRDaGlsZChwYW5lbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuX3N0YWdlc1thbmNob3JdLmFwcGVuZENoaWxkKHRoaXMuX3BhbmVsc1thbmNob3JdWzBdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fc3RhZ2VIb2xkZXIgPSBjcmVhdGVFbCgnaG9sZGVyJyk7XG4gICAgICB0aGlzLl9zdGFnZUhvbGRlci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICAgIGZvciAoX3EgPSAwLCBfbGVuNyA9IGFuY2hvckxpc3QubGVuZ3RoOyBfcSA8IF9sZW43OyBfcSsrKSB7XG4gICAgICAgIGFuY2hvciA9IGFuY2hvckxpc3RbX3FdO1xuICAgICAgICB0aGlzLl9zdGFnZUhvbGRlci5hcHBlbmRDaGlsZCh0aGlzLl9zdGFnZXNbYW5jaG9yXSk7XG4gICAgICB9XG4gICAgICBpZiAod2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy5lbCkucG9zaXRpb24gPT09ICdhYnNvbHV0ZScpIHtcbiAgICAgICAgdGhpcy5lbC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICB9XG4gICAgICB0aGlzLmVsLmNsYXNzTGlzdC5hZGQoZWxDbGFzc2VzLmFjdGl2ZSk7XG4gICAgICBzaG93RWwodGhpcy5fc3RhZ2VzLmxlZnQpO1xuICAgICAgdGhpcy5fY2xvbmVFbCA9IGNsb25lRWwodGhpcy5lbCwgdHJ1ZSwgJ2Nsb25lJyk7XG4gICAgICB0aGlzLl9jbG9uZUVsLmNsYXNzTGlzdC5yZW1vdmUoZWxDbGFzc2VzLmFjdGl2ZSk7XG4gICAgICBoaWRlRWwodGhpcy5fY2xvbmVFbCk7XG4gICAgICB0aGlzLmVsLmlubmVySFRNTCA9ICcnO1xuICAgICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLl9jbG9uZUVsKTtcbiAgICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy5fc3RhZ2VIb2xkZXIpO1xuICAgICAgdGhpcy5lbC5wYXJlbnROb2RlLnN0eWxlW2Nzcy50cmFuc2Zvcm1TdHlsZV0gPSAncHJlc2VydmUtM2QnO1xuICAgICAgdGhpcy5hY2NvcmRpb24oMCk7XG4gICAgICBpZiAodGhpcy5fY29uZmlnLnJpcHBsZSkge1xuICAgICAgICB0aGlzLnNldFJpcHBsZSh0aGlzLl9jb25maWcucmlwcGxlKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9jb25maWcudG91Y2hFbmFibGVkKSB7XG4gICAgICAgIHRoaXMuZW5hYmxlVG91Y2goKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fc3RlcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFuY2hvciwgYW5nbGUsIGZuLCBuZXh0LCBvcHRpb25zLCBfcmVmMTtcbiAgICAgIGlmICh0aGlzLl9pblRyYW5zIHx8ICF0aGlzLl9xdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5faW5UcmFucyA9IHRydWU7XG4gICAgICBfcmVmMSA9IHRoaXMuX3F1ZXVlLnNoaWZ0KCksIGZuID0gX3JlZjFbMF0sIGFuZ2xlID0gX3JlZjFbMV0sIGFuY2hvciA9IF9yZWYxWzJdLCBvcHRpb25zID0gX3JlZjFbM107XG4gICAgICBpZiAodGhpcy5pc0Zyb3plbikge1xuICAgICAgICB0aGlzLnVuZnJlZXplKCk7XG4gICAgICB9XG4gICAgICBuZXh0ID0gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYXJncztcbiAgICAgICAgICBfdGhpcy5fc2V0Q2FsbGJhY2soe1xuICAgICAgICAgICAgYW5nbGU6IGFuZ2xlLFxuICAgICAgICAgICAgYW5jaG9yOiBhbmNob3IsXG4gICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxuICAgICAgICAgICAgZm46IGZuXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYXJncyA9IFthbmdsZSwgYW5jaG9yLCBvcHRpb25zXTtcbiAgICAgICAgICBpZiAoZm4ubGVuZ3RoIDwgMykge1xuICAgICAgICAgICAgYXJncy5zaGlmdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZm4uYXBwbHkoX3RoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcyk7XG4gICAgICBpZiAodGhpcy5pc0ZvbGRlZFVwKSB7XG4gICAgICAgIGlmIChmbi5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLl91bmZvbGQobmV4dCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYW5jaG9yICE9PSB0aGlzLl9sYXN0T3AuYW5jaG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGFnZVJlc2V0KGFuY2hvciwgbmV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5faXNJZGVudGljYWxPcGVyYXRpb24gPSBmdW5jdGlvbihvcCkge1xuICAgICAgdmFyIGtleSwgX2ksIF9sZW4sIF9yZWYxLCBfcmVmMjtcbiAgICAgIGlmICghdGhpcy5fbGFzdE9wLmZuKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2xhc3RPcC5yZXNldCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBfcmVmMSA9IFsnYW5nbGUnLCAnYW5jaG9yJywgJ2ZuJ107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGtleSA9IF9yZWYxW19pXTtcbiAgICAgICAgaWYgKHRoaXMuX2xhc3RPcFtrZXldICE9PSBvcFtrZXldKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBfcmVmMiA9IG9wLm9wdGlvbnM7XG4gICAgICBmb3IgKGsgaW4gX3JlZjIpIHtcbiAgICAgICAgdiA9IF9yZWYyW2tdO1xuICAgICAgICBpZiAodiAhPT0gdGhpcy5fbGFzdE9wLm9wdGlvbnNba10gJiYgayAhPT0gJ2NhbGxiYWNrJykge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9zZXRDYWxsYmFjayA9IGZ1bmN0aW9uKG9wZXJhdGlvbikge1xuICAgICAgaWYgKCF0aGlzLl9jb25maWcuc3BlZWQgfHwgdGhpcy5faXNJZGVudGljYWxPcGVyYXRpb24ob3BlcmF0aW9uKSkge1xuICAgICAgICB0aGlzLl9jb25jbHVkZShvcGVyYXRpb24ub3B0aW9ucy5jYWxsYmFjayk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9wYW5lbHNbdGhpcy5fbGFzdE9wLmFuY2hvcl1bMF0uYWRkRXZlbnRMaXN0ZW5lcihjc3MudHJhbnNpdGlvbkVuZCwgdGhpcy5fb25UcmFuc2l0aW9uRW5kLCBmYWxzZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gKHRoaXMuX2xhc3RPcCA9IG9wZXJhdGlvbikucmVzZXQgPSBmYWxzZTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX29uVHJhbnNpdGlvbkVuZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUuY3VycmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKGNzcy50cmFuc2l0aW9uRW5kLCB0aGlzLl9vblRyYW5zaXRpb25FbmQsIGZhbHNlKTtcbiAgICAgIHJldHVybiB0aGlzLl9jb25jbHVkZSh0aGlzLl9sYXN0T3Aub3B0aW9ucy5jYWxsYmFjaywgZSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9jb25jbHVkZSA9IGZ1bmN0aW9uKGNiLCBldmVudCkge1xuICAgICAgcmV0dXJuIGRlZmVyKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMuX2luVHJhbnMgPSBmYWxzZTtcbiAgICAgICAgICBfdGhpcy5fc3RlcCgpO1xuICAgICAgICAgIHJldHVybiB0eXBlb2YgY2IgPT09IFwiZnVuY3Rpb25cIiA/IGNiKGV2ZW50LCBfdGhpcykgOiB2b2lkIDA7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl90cmFuc2Zvcm1QYW5lbCA9IGZ1bmN0aW9uKGVsLCBhbmdsZSwgYW5jaG9yLCBmcmFjdHVyZSkge1xuICAgICAgdmFyIHRyYW5zUHJlZml4LCB4LCB5LCB6O1xuICAgICAgeCA9IHkgPSB6ID0gMDtcbiAgICAgIHN3aXRjaCAoYW5jaG9yKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIHkgPSBhbmdsZTtcbiAgICAgICAgICB0cmFuc1ByZWZpeCA9ICdYKC0nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgeSA9IC1hbmdsZTtcbiAgICAgICAgICB0cmFuc1ByZWZpeCA9ICdYKCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgICAgeCA9IC1hbmdsZTtcbiAgICAgICAgICB0cmFuc1ByZWZpeCA9ICdZKC0nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdib3R0b20nOlxuICAgICAgICAgIHggPSBhbmdsZTtcbiAgICAgICAgICB0cmFuc1ByZWZpeCA9ICdZKCc7XG4gICAgICB9XG4gICAgICBpZiAoZnJhY3R1cmUpIHtcbiAgICAgICAgeCA9IHkgPSB6ID0gYW5nbGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZWwuc3R5bGVbY3NzLnRyYW5zZm9ybV0gPSBcInJvdGF0ZVgoXCIgKyB4ICsgXCJkZWcpIHJvdGF0ZVkoXCIgKyB5ICsgXCJkZWcpIHJvdGF0ZVooXCIgKyB6ICsgXCJkZWcpIHRyYW5zbGF0ZVwiICsgdHJhbnNQcmVmaXggKyB0aGlzLl9jb25maWcuZ2FwTnVkZ2UgKyBcInB4KVwiO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fbm9ybWFsaXplQW5nbGUgPSBmdW5jdGlvbihhbmdsZSkge1xuICAgICAgdmFyIG1heDtcbiAgICAgIGFuZ2xlID0gcGFyc2VGbG9hdChhbmdsZSwgMTApO1xuICAgICAgbWF4ID0gdGhpcy5fY29uZmlnLm1heEFuZ2xlO1xuICAgICAgaWYgKGlzTmFOKGFuZ2xlKSkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH0gZWxzZSBpZiAoYW5nbGUgPiBtYXgpIHtcbiAgICAgICAgcmV0dXJuIG1heDtcbiAgICAgIH0gZWxzZSBpZiAoYW5nbGUgPCAtbWF4KSB7XG4gICAgICAgIHJldHVybiAtbWF4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGFuZ2xlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fc2V0VHJhbnMgPSBmdW5jdGlvbihkdXJhdGlvbiwgZGVsYXksIGFuY2hvcikge1xuICAgICAgaWYgKGFuY2hvciA9PSBudWxsKSB7XG4gICAgICAgIGFuY2hvciA9IHRoaXMuX2xhc3RPcC5hbmNob3I7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5faXRlcmF0ZShhbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocGFuZWwsIGksIGxlbikge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5fc2V0UGFuZWxUcmFucy5hcHBseShfdGhpcywgW2FuY2hvcl0uY29uY2F0KF9fc2xpY2UuY2FsbChhcmd1bWVudHMpLCBbZHVyYXRpb25dLCBbZGVsYXldKSk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9zZXRQYW5lbFRyYW5zID0gZnVuY3Rpb24oYW5jaG9yLCBwYW5lbCwgaSwgbGVuLCBkdXJhdGlvbiwgZGVsYXkpIHtcbiAgICAgIHZhciBkZWxheU1zLCBzaGFkZXIsIHNpZGUsIF9pLCBfbGVuLCBfcmVmMTtcbiAgICAgIGRlbGF5TXMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHN3aXRjaCAoZGVsYXkpIHtcbiAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29uZmlnLnNwZWVkIC8gbGVuICogaTtcbiAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29uZmlnLnNwZWVkIC8gbGVuICogKGxlbiAtIGkgLSAxKTtcbiAgICAgICAgfVxuICAgICAgfSkuY2FsbCh0aGlzKTtcbiAgICAgIHBhbmVsLnN0eWxlW2Nzcy50cmFuc2l0aW9uRHVyYXRpb25dID0gZHVyYXRpb24gKyAnbXMnO1xuICAgICAgcGFuZWwuc3R5bGVbY3NzLnRyYW5zaXRpb25EZWxheV0gPSBkZWxheU1zICsgJ21zJztcbiAgICAgIGlmICh0aGlzLl9zaGFkaW5nKSB7XG4gICAgICAgIF9yZWYxID0gKF9faW5kZXhPZi5jYWxsKGFuY2hvckxpc3RWLCBhbmNob3IpID49IDAgPyBhbmNob3JMaXN0ViA6IGFuY2hvckxpc3RIKTtcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmMS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIHNpZGUgPSBfcmVmMVtfaV07XG4gICAgICAgICAgc2hhZGVyID0gdGhpcy5fc2hhZGVyc1thbmNob3JdW3NpZGVdW2ldO1xuICAgICAgICAgIHNoYWRlci5zdHlsZVtjc3MudHJhbnNpdGlvbkR1cmF0aW9uXSA9IGR1cmF0aW9uICsgJ21zJztcbiAgICAgICAgICBzaGFkZXIuc3R5bGVbY3NzLnRyYW5zaXRpb25EZWxheV0gPSBkZWxheU1zICsgJ21zJztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGRlbGF5TXM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9zZXRTaGFkZXIgPSBmdW5jdGlvbihuLCBhbmNob3IsIGFuZ2xlKSB7XG4gICAgICB2YXIgYSwgYWJzLCBiLCBvcGFjaXR5O1xuICAgICAgYWJzID0gTWF0aC5hYnMoYW5nbGUpO1xuICAgICAgb3BhY2l0eSA9IGFicyAvIDkwICogdGhpcy5fY29uZmlnLnNoYWRpbmdJbnRlbnNpdHk7XG4gICAgICBpZiAodGhpcy5fc2hhZGluZyA9PT0gJ2hhcmQnKSB7XG4gICAgICAgIG9wYWNpdHkgKj0gLjE1O1xuICAgICAgICBpZiAodGhpcy5fbGFzdE9wLmFuZ2xlIDwgMCkge1xuICAgICAgICAgIGFuZ2xlID0gYWJzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFuZ2xlID0gLWFicztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3BhY2l0eSAqPSAuNDtcbiAgICAgIH1cbiAgICAgIGlmIChfX2luZGV4T2YuY2FsbChhbmNob3JMaXN0ViwgYW5jaG9yKSA+PSAwKSB7XG4gICAgICAgIGlmIChhbmdsZSA8IDApIHtcbiAgICAgICAgICBhID0gb3BhY2l0eTtcbiAgICAgICAgICBiID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhID0gMDtcbiAgICAgICAgICBiID0gb3BhY2l0eTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zaGFkZXJzW2FuY2hvcl0ubGVmdFtuXS5zdHlsZS5vcGFjaXR5ID0gYTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NoYWRlcnNbYW5jaG9yXS5yaWdodFtuXS5zdHlsZS5vcGFjaXR5ID0gYjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChhbmdsZSA8IDApIHtcbiAgICAgICAgICBhID0gMDtcbiAgICAgICAgICBiID0gb3BhY2l0eTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhID0gb3BhY2l0eTtcbiAgICAgICAgICBiID0gMDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zaGFkZXJzW2FuY2hvcl0udG9wW25dLnN0eWxlLm9wYWNpdHkgPSBhO1xuICAgICAgICByZXR1cm4gdGhpcy5fc2hhZGVyc1thbmNob3JdLmJvdHRvbVtuXS5zdHlsZS5vcGFjaXR5ID0gYjtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX3Nob3dTdGFnZSA9IGZ1bmN0aW9uKGFuY2hvcikge1xuICAgICAgaWYgKGFuY2hvciAhPT0gdGhpcy5fbGFzdE9wLmFuY2hvcikge1xuICAgICAgICBoaWRlRWwodGhpcy5fc3RhZ2VzW3RoaXMuX2xhc3RPcC5hbmNob3JdKTtcbiAgICAgICAgdGhpcy5fbGFzdE9wLmFuY2hvciA9IGFuY2hvcjtcbiAgICAgICAgdGhpcy5fbGFzdE9wLnJlc2V0ID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YWdlc1thbmNob3JdLnN0eWxlW2Nzcy50cmFuc2Zvcm1dID0gJ3RyYW5zbGF0ZTNkKCcgKyAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc3dpdGNoIChhbmNob3IpIHtcbiAgICAgICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgICAgICByZXR1cm4gJzAsIDAsIDApJztcbiAgICAgICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICAgICAgcmV0dXJuIFwiLVwiICsgdGhpcy5fY29uZmlnLnZQYW5lbHMubGVuZ3RoICsgXCJweCwgMCwgMClcIjtcbiAgICAgICAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgICAgICAgIHJldHVybiAnMCwgMCwgMCknO1xuICAgICAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgICAgICAgcmV0dXJuIFwiMCwgLVwiICsgdGhpcy5fY29uZmlnLmhQYW5lbHMubGVuZ3RoICsgXCJweCwgMClcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLmNhbGwodGhpcyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9zdGFnZVJlc2V0ID0gZnVuY3Rpb24oYW5jaG9yLCBjYikge1xuICAgICAgdmFyIGZuO1xuICAgICAgZm4gPSAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoY3NzLnRyYW5zaXRpb25FbmQsIGZuLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIF90aGlzLl9zaG93U3RhZ2UoYW5jaG9yKTtcbiAgICAgICAgICByZXR1cm4gZGVmZXIoY2IpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcyk7XG4gICAgICBpZiAodGhpcy5fbGFzdE9wLmFuZ2xlID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmbigpO1xuICAgICAgfVxuICAgICAgdGhpcy5fcGFuZWxzW3RoaXMuX2xhc3RPcC5hbmNob3JdWzBdLmFkZEV2ZW50TGlzdGVuZXIoY3NzLnRyYW5zaXRpb25FbmQsIGZuLCBmYWxzZSk7XG4gICAgICByZXR1cm4gdGhpcy5faXRlcmF0ZSh0aGlzLl9sYXN0T3AuYW5jaG9yLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHBhbmVsLCBpKSB7XG4gICAgICAgICAgX3RoaXMuX3RyYW5zZm9ybVBhbmVsKHBhbmVsLCAwLCBfdGhpcy5fbGFzdE9wLmFuY2hvcik7XG4gICAgICAgICAgaWYgKF90aGlzLl9zaGFkaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuX3NldFNoYWRlcihpLCBfdGhpcy5fbGFzdE9wLmFuY2hvciwgMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fZ2V0TG9uZ2hhbmRBbmNob3IgPSBmdW5jdGlvbihzaG9ydGhhbmQpIHtcbiAgICAgIHN3aXRjaCAoc2hvcnRoYW5kLnRvU3RyaW5nKCkpIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgIGNhc2UgJ2wnOlxuICAgICAgICBjYXNlICc0JzpcbiAgICAgICAgICByZXR1cm4gJ2xlZnQnO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgIGNhc2UgJ3InOlxuICAgICAgICBjYXNlICcyJzpcbiAgICAgICAgICByZXR1cm4gJ3JpZ2h0JztcbiAgICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgY2FzZSAndCc6XG4gICAgICAgIGNhc2UgJzEnOlxuICAgICAgICAgIHJldHVybiAndG9wJztcbiAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgY2FzZSAnYic6XG4gICAgICAgIGNhc2UgJzMnOlxuICAgICAgICAgIHJldHVybiAnYm90dG9tJztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gJ2xlZnQnO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fc2V0Q3Vyc29yID0gZnVuY3Rpb24oYm9vbCkge1xuICAgICAgaWYgKGJvb2wgPT0gbnVsbCkge1xuICAgICAgICBib29sID0gdGhpcy5fdG91Y2hFbmFibGVkO1xuICAgICAgfVxuICAgICAgaWYgKGJvb2wpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWwuc3R5bGUuY3Vyc29yID0gY3NzLmdyYWI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5lbC5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XG4gICAgICB9XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9zZXRUb3VjaCA9IGZ1bmN0aW9uKHRvZ2dsZSkge1xuICAgICAgdmFyIGVTdHJpbmcsIGV2ZW50UGFpciwgZXZlbnRQYWlycywgbGlzdGVuRm4sIG1vdXNlTGVhdmVTdXBwb3J0LCBfaSwgX2osIF9sZW4sIF9sZW4xO1xuICAgICAgaWYgKHRvZ2dsZSkge1xuICAgICAgICBpZiAodGhpcy5fdG91Y2hFbmFibGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgbGlzdGVuRm4gPSAnYWRkRXZlbnRMaXN0ZW5lcic7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIXRoaXMuX3RvdWNoRW5hYmxlZCkge1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGxpc3RlbkZuID0gJ3JlbW92ZUV2ZW50TGlzdGVuZXInO1xuICAgICAgfVxuICAgICAgdGhpcy5fdG91Y2hFbmFibGVkID0gdG9nZ2xlO1xuICAgICAgdGhpcy5fc2V0Q3Vyc29yKCk7XG4gICAgICBldmVudFBhaXJzID0gW1snVG91Y2hTdGFydCcsICdNb3VzZURvd24nXSwgWydUb3VjaEVuZCcsICdNb3VzZVVwJ10sIFsnVG91Y2hNb3ZlJywgJ01vdXNlTW92ZSddLCBbJ1RvdWNoTGVhdmUnLCAnTW91c2VMZWF2ZSddXTtcbiAgICAgIG1vdXNlTGVhdmVTdXBwb3J0ID0gJ29ubW91c2VsZWF2ZScgaW4gd2luZG93O1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBldmVudFBhaXJzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGV2ZW50UGFpciA9IGV2ZW50UGFpcnNbX2ldO1xuICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBldmVudFBhaXIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgZVN0cmluZyA9IGV2ZW50UGFpcltfal07XG4gICAgICAgICAgaWYgKCEoZVN0cmluZyA9PT0gJ1RvdWNoTGVhdmUnICYmICFtb3VzZUxlYXZlU3VwcG9ydCkpIHtcbiAgICAgICAgICAgIHRoaXMuZWxbbGlzdGVuRm5dKGVTdHJpbmcudG9Mb3dlckNhc2UoKSwgdGhpc1snX29uJyArIGV2ZW50UGFpclswXV0sIGZhbHNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbFtsaXN0ZW5Gbl0oJ21vdXNlb3V0JywgdGhpcy5fb25Nb3VzZU91dCwgZmFsc2UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX29uVG91Y2hTdGFydCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBheGlzMSwgX3JlZjE7XG4gICAgICBpZiAoIXRoaXMuX3RvdWNoRW5hYmxlZCB8fCB0aGlzLmlzRm9sZGVkVXApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5lbXB0eVF1ZXVlKCk7XG4gICAgICB0aGlzLl90b3VjaFN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5lbC5zdHlsZS5jdXJzb3IgPSBjc3MuZ3JhYmJpbmc7XG4gICAgICB0aGlzLl9zZXRUcmFucygwLCAwKTtcbiAgICAgIHRoaXMuX3RvdWNoQXhpcyA9IChfcmVmMSA9IHRoaXMuX2xhc3RPcC5hbmNob3IsIF9faW5kZXhPZi5jYWxsKGFuY2hvckxpc3RWLCBfcmVmMSkgPj0gMCkgPyAneCcgOiAneSc7XG4gICAgICB0aGlzW1wiX1wiICsgdGhpcy5fdG91Y2hBeGlzICsgXCJMYXN0XCJdID0gdGhpcy5fbGFzdE9wLmFuZ2xlO1xuICAgICAgYXhpczEgPSBcIl9cIiArIHRoaXMuX3RvdWNoQXhpcyArIFwiMVwiO1xuICAgICAgaWYgKGUudHlwZSA9PT0gJ21vdXNlZG93bicpIHtcbiAgICAgICAgdGhpc1theGlzMV0gPSBlW1wicGFnZVwiICsgKHRoaXMuX3RvdWNoQXhpcy50b1VwcGVyQ2FzZSgpKV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzW2F4aXMxXSA9IGUudGFyZ2V0VG91Y2hlc1swXVtcInBhZ2VcIiArICh0aGlzLl90b3VjaEF4aXMudG9VcHBlckNhc2UoKSldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZy50b3VjaFN0YXJ0Q2FsbGJhY2sodGhpc1theGlzMV0sIGUpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fb25Ub3VjaE1vdmUgPSBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgY3VycmVudCwgZGVsdGEsIGRpc3RhbmNlO1xuICAgICAgaWYgKCEodGhpcy5fdG91Y2hFbmFibGVkICYmIHRoaXMuX3RvdWNoU3RhcnRlZCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgaWYgKGUudHlwZSA9PT0gJ21vdXNlbW92ZScpIHtcbiAgICAgICAgY3VycmVudCA9IGVbXCJwYWdlXCIgKyAodGhpcy5fdG91Y2hBeGlzLnRvVXBwZXJDYXNlKCkpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN1cnJlbnQgPSBlLnRhcmdldFRvdWNoZXNbMF1bXCJwYWdlXCIgKyAodGhpcy5fdG91Y2hBeGlzLnRvVXBwZXJDYXNlKCkpXTtcbiAgICAgIH1cbiAgICAgIGRpc3RhbmNlID0gKGN1cnJlbnQgLSB0aGlzW1wiX1wiICsgdGhpcy5fdG91Y2hBeGlzICsgXCIxXCJdKSAqIHRoaXMuX2NvbmZpZy50b3VjaFNlbnNpdGl2aXR5O1xuICAgICAgaWYgKHRoaXMuX2xhc3RPcC5hbmdsZSA8IDApIHtcbiAgICAgICAgaWYgKHRoaXMuX2xhc3RPcC5hbmNob3IgPT09ICdyaWdodCcgfHwgdGhpcy5fbGFzdE9wLmFuY2hvciA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICBkZWx0YSA9IHRoaXNbXCJfXCIgKyB0aGlzLl90b3VjaEF4aXMgKyBcIkxhc3RcIl0gLSBkaXN0YW5jZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWx0YSA9IHRoaXNbXCJfXCIgKyB0aGlzLl90b3VjaEF4aXMgKyBcIkxhc3RcIl0gKyBkaXN0YW5jZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVsdGEgPiAwKSB7XG4gICAgICAgICAgZGVsdGEgPSAwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5fbGFzdE9wLmFuY2hvciA9PT0gJ3JpZ2h0JyB8fCB0aGlzLl9sYXN0T3AuYW5jaG9yID09PSAnYm90dG9tJykge1xuICAgICAgICAgIGRlbHRhID0gdGhpc1tcIl9cIiArIHRoaXMuX3RvdWNoQXhpcyArIFwiTGFzdFwiXSArIGRpc3RhbmNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlbHRhID0gdGhpc1tcIl9cIiArIHRoaXMuX3RvdWNoQXhpcyArIFwiTGFzdFwiXSAtIGRpc3RhbmNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWx0YSA8IDApIHtcbiAgICAgICAgICBkZWx0YSA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX2xhc3RPcC5hbmdsZSA9IGRlbHRhID0gdGhpcy5fbm9ybWFsaXplQW5nbGUoZGVsdGEpO1xuICAgICAgdGhpcy5fbGFzdE9wLmZuLmNhbGwodGhpcywgZGVsdGEsIHRoaXMuX2xhc3RPcC5hbmNob3IsIHRoaXMuX2xhc3RPcC5vcHRpb25zKTtcbiAgICAgIHJldHVybiB0aGlzLl9jb25maWcudG91Y2hNb3ZlQ2FsbGJhY2soZGVsdGEsIGUpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fb25Ub3VjaEVuZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICghdGhpcy5fdG91Y2hFbmFibGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3RvdWNoU3RhcnRlZCA9IHRoaXMuX2luVHJhbnMgPSBmYWxzZTtcbiAgICAgIHRoaXMuZWwuc3R5bGUuY3Vyc29yID0gY3NzLmdyYWI7XG4gICAgICB0aGlzLl9zZXRUcmFucyh0aGlzLl9jb25maWcuc3BlZWQsIHRoaXMuX2NvbmZpZy5yaXBwbGUpO1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZy50b3VjaEVuZENhbGxiYWNrKHRoaXNbXCJfXCIgKyB0aGlzLl90b3VjaEF4aXMgKyBcIkxhc3RcIl0sIGUpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fb25Ub3VjaExlYXZlID0gZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKCEodGhpcy5fdG91Y2hFbmFibGVkICYmIHRoaXMuX3RvdWNoU3RhcnRlZCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX29uVG91Y2hFbmQoZSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9vbk1vdXNlT3V0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKCEodGhpcy5fdG91Y2hFbmFibGVkICYmIHRoaXMuX3RvdWNoU3RhcnRlZCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGUudG9FbGVtZW50ICYmICF0aGlzLmVsLmNvbnRhaW5zKGUudG9FbGVtZW50KSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fb25Ub3VjaEVuZChlKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX3VuZm9sZCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICB2YXIgYW5jaG9yO1xuICAgICAgdGhpcy5faW5UcmFucyA9IHRydWU7XG4gICAgICBhbmNob3IgPSB0aGlzLl9sYXN0T3AuYW5jaG9yO1xuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXJhdGUoYW5jaG9yLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHBhbmVsLCBpLCBsZW4pIHtcbiAgICAgICAgICB2YXIgZGVsYXk7XG4gICAgICAgICAgZGVsYXkgPSBfdGhpcy5fc2V0UGFuZWxUcmFucy5hcHBseShfdGhpcywgW2FuY2hvcl0uY29uY2F0KF9fc2xpY2UuY2FsbChhcmd1bWVudHMpLCBbX3RoaXMuX2NvbmZpZy5zcGVlZF0sIFsxXSkpO1xuICAgICAgICAgIHJldHVybiAoZnVuY3Rpb24ocGFuZWwsIGksIGRlbGF5KSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIF90aGlzLl90cmFuc2Zvcm1QYW5lbChwYW5lbCwgMCwgX3RoaXMuX2xhc3RPcC5hbmNob3IpO1xuICAgICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzaG93RWwocGFuZWwuY2hpbGRyZW5bMF0pO1xuICAgICAgICAgICAgICAgIGlmIChpID09PSBsZW4gLSAxKSB7XG4gICAgICAgICAgICAgICAgICBfdGhpcy5faW5UcmFucyA9IF90aGlzLmlzRm9sZGVkVXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgX3RoaXMuX2xhc3RPcC5mbiA9IF90aGlzLmFjY29yZGlvbjtcbiAgICAgICAgICAgICAgICAgIF90aGlzLl9sYXN0T3AuYW5nbGUgPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gcGFuZWwuc3R5bGVbY3NzLnRyYW5zaXRpb25EdXJhdGlvbl0gPSBfdGhpcy5fY29uZmlnLnNwZWVkO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9LCBkZWxheSArIF90aGlzLl9jb25maWcuc3BlZWQgKiAuMjUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSkocGFuZWwsIGksIGRlbGF5KTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX2l0ZXJhdGUgPSBmdW5jdGlvbihhbmNob3IsIGZuKSB7XG4gICAgICB2YXIgaSwgcGFuZWwsIHBhbmVscywgX2ksIF9sZW4sIF9yZWYxLCBfcmVzdWx0cztcbiAgICAgIF9yZWYxID0gcGFuZWxzID0gdGhpcy5fcGFuZWxzW2FuY2hvcl07XG4gICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChpID0gX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IGkgPSArK19pKSB7XG4gICAgICAgIHBhbmVsID0gX3JlZjFbaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2goZm4uY2FsbCh0aGlzLCBwYW5lbCwgaSwgcGFuZWxzLmxlbmd0aCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5lbmFibGVUb3VjaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3NldFRvdWNoKHRydWUpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5kaXNhYmxlVG91Y2ggPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zZXRUb3VjaChmYWxzZSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLnNldFNwZWVkID0gZnVuY3Rpb24oc3BlZWQpIHtcbiAgICAgIHZhciBhbmNob3IsIF9pLCBfbGVuO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBhbmNob3JMaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGFuY2hvciA9IGFuY2hvckxpc3RbX2ldO1xuICAgICAgICB0aGlzLl9zZXRUcmFucygodGhpcy5fY29uZmlnLnNwZWVkID0gc3BlZWQpLCB0aGlzLl9jb25maWcucmlwcGxlLCBhbmNob3IpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmZyZWV6ZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICBpZiAodGhpcy5pc0Zyb3plbikge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zdGFnZVJlc2V0KHRoaXMuX2xhc3RPcC5hbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF90aGlzLmlzRnJvemVuID0gdHJ1ZTtcbiAgICAgICAgICAgIGhpZGVFbChfdGhpcy5fc3RhZ2VIb2xkZXIpO1xuICAgICAgICAgICAgc2hvd0VsKF90aGlzLl9jbG9uZUVsKTtcbiAgICAgICAgICAgIF90aGlzLl9zZXRDdXJzb3IoZmFsc2UpO1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiID8gY2FsbGJhY2soKSA6IHZvaWQgMDtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUudW5mcmVlemUgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLmlzRnJvemVuKSB7XG4gICAgICAgIHRoaXMuaXNGcm96ZW4gPSBmYWxzZTtcbiAgICAgICAgaGlkZUVsKHRoaXMuX2Nsb25lRWwpO1xuICAgICAgICBzaG93RWwodGhpcy5fc3RhZ2VIb2xkZXIpO1xuICAgICAgICB0aGlzLl9zZXRDdXJzb3IoKTtcbiAgICAgICAgdGhpcy5fbGFzdE9wLmFuZ2xlID0gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHRoaXMuZnJlZXplKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMuX3NldFRvdWNoKGZhbHNlKTtcbiAgICAgICAgICBpZiAoJCkge1xuICAgICAgICAgICAgJC5kYXRhKF90aGlzLmVsLCBiYXNlTmFtZSwgbnVsbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIF90aGlzLmVsLmlubmVySFRNTCA9IF90aGlzLl9jbG9uZUVsLmlubmVySFRNTDtcbiAgICAgICAgICBfdGhpcy5lbC5jbGFzc0xpc3QucmVtb3ZlKGVsQ2xhc3Nlcy5hY3RpdmUpO1xuICAgICAgICAgIHJldHVybiB0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIiA/IGNhbGxiYWNrKCkgOiB2b2lkIDA7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuZW1wdHlRdWV1ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgIGRlZmVyKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLl9pblRyYW5zID0gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuc2V0UmlwcGxlID0gZnVuY3Rpb24oZGlyKSB7XG4gICAgICBpZiAoZGlyID09IG51bGwpIHtcbiAgICAgICAgZGlyID0gMTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2NvbmZpZy5yaXBwbGUgPSBOdW1iZXIoZGlyKTtcbiAgICAgIHRoaXMuc2V0U3BlZWQodGhpcy5fY29uZmlnLnNwZWVkKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5jb25zdHJhaW5BbmdsZSA9IGZ1bmN0aW9uKGFuZ2xlKSB7XG4gICAgICB0aGlzLl9jb25maWcubWF4QW5nbGUgPSBwYXJzZUZsb2F0KGFuZ2xlLCAxMCkgfHwgZGVmYXVsdHMubWF4QW5nbGU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUud2FpdCA9IGZ1bmN0aW9uKG1zKSB7XG4gICAgICB2YXIgZm47XG4gICAgICBmbiA9IChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoX3RoaXMuX2NvbmNsdWRlLCBtcyk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKTtcbiAgICAgIGlmICh0aGlzLl9pblRyYW5zKSB7XG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2goW2ZuLCB0aGlzLl9sYXN0T3AuYW5nbGUsIHRoaXMuX2xhc3RPcC5hbmNob3IsIHRoaXMuX2xhc3RPcC5vcHRpb25zXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmbigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLm1vZGlmeUNvbnRlbnQgPSBmdW5jdGlvbihmbikge1xuICAgICAgdmFyIGFuY2hvciwgaSwgcGFuZWwsIHNlbGVjdG9ycywgc2V0LCBfaSwgX2osIF9sZW4sIF9sZW4xLCBfcmVmMTtcbiAgICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgc2VsZWN0b3JzID0gZm47XG4gICAgICAgIHNldCA9IGZ1bmN0aW9uKGVsLCBjb250ZW50LCBzdHlsZSkge1xuICAgICAgICAgIHZhciBrZXksIHZhbHVlO1xuICAgICAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSBjb250ZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc3R5bGUpIHtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIHN0eWxlKSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gc3R5bGVba2V5XTtcbiAgICAgICAgICAgICAgZWwuc3R5bGVba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBmbiA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgdmFyIGNvbnRlbnQsIG1hdGNoLCBzZWxlY3Rvciwgc3R5bGUsIHZhbHVlLCBfaSwgX2xlbiwgX3JlZjE7XG4gICAgICAgICAgZm9yIChzZWxlY3RvciBpbiBzZWxlY3RvcnMpIHtcbiAgICAgICAgICAgIHZhbHVlID0gc2VsZWN0b3JzW3NlbGVjdG9yXTtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBzdHlsZSA9IG51bGw7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICBjb250ZW50ID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb250ZW50ID0gdmFsdWUuY29udGVudCwgc3R5bGUgPSB2YWx1ZS5zdHlsZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHtcbiAgICAgICAgICAgICAgc2V0KGVsLCBjb250ZW50LCBzdHlsZSk7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3JlZjEgPSBlbC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICAgICAgbWF0Y2ggPSBfcmVmMVtfaV07XG4gICAgICAgICAgICAgIHNldChtYXRjaCwgY29udGVudCwgc3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gYW5jaG9yTGlzdC5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBhbmNob3IgPSBhbmNob3JMaXN0W19pXTtcbiAgICAgICAgX3JlZjEgPSB0aGlzLl9wYW5lbHNbYW5jaG9yXTtcbiAgICAgICAgZm9yIChpID0gX2ogPSAwLCBfbGVuMSA9IF9yZWYxLmxlbmd0aDsgX2ogPCBfbGVuMTsgaSA9ICsrX2opIHtcbiAgICAgICAgICBwYW5lbCA9IF9yZWYxW2ldO1xuICAgICAgICAgIGZuKHBhbmVsLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLCBpLCBhbmNob3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuYWNjb3JkaW9uID0gcHJlcChmdW5jdGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXRlcmF0ZShhbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocGFuZWwsIGkpIHtcbiAgICAgICAgICB2YXIgZGVnO1xuICAgICAgICAgIGlmIChpICUgMiAhPT0gMCAmJiAhb3B0aW9ucy50d2lzdCkge1xuICAgICAgICAgICAgZGVnID0gLWFuZ2xlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWcgPSBhbmdsZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG9wdGlvbnMuc3RpY2t5KSB7XG4gICAgICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgICBkZWcgPSAwO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpID4gMSB8fCBvcHRpb25zLnN0YWlycykge1xuICAgICAgICAgICAgICBkZWcgKj0gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGkgIT09IDApIHtcbiAgICAgICAgICAgICAgZGVnICo9IDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvcHRpb25zLnN0YWlycykge1xuICAgICAgICAgICAgZGVnICo9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfdGhpcy5fdHJhbnNmb3JtUGFuZWwocGFuZWwsIGRlZywgYW5jaG9yLCBvcHRpb25zLmZyYWN0dXJlKTtcbiAgICAgICAgICBpZiAoX3RoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnR3aXN0IHx8IG9wdGlvbnMuZnJhY3R1cmUgfHwgKGkgPT09IDAgJiYgb3B0aW9ucy5zdGlja3kpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBfdGhpcy5fc2V0U2hhZGVyKGksIGFuY2hvciwgMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKE1hdGguYWJzKGRlZykgIT09IDE4MCkge1xuICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuX3NldFNoYWRlcihpLCBhbmNob3IsIGRlZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH0pO1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuY3VybCA9IHByZXAoZnVuY3Rpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucykge1xuICAgICAgYW5nbGUgLz0gX19pbmRleE9mLmNhbGwoYW5jaG9yTGlzdFYsIGFuY2hvcikgPj0gMCA/IHRoaXMuX2NvbmZpZy52UGFuZWxzLmxlbmd0aCA6IHRoaXMuX2NvbmZpZy5oUGFuZWxzLmxlbmd0aDtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyYXRlKGFuY2hvciwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihwYW5lbCwgaSkge1xuICAgICAgICAgIF90aGlzLl90cmFuc2Zvcm1QYW5lbChwYW5lbCwgYW5nbGUsIGFuY2hvcik7XG4gICAgICAgICAgaWYgKF90aGlzLl9zaGFkaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuX3NldFNoYWRlcihpLCBhbmNob3IsIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9KTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLnJhbXAgPSBwcmVwKGZ1bmN0aW9uKGFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuX3RyYW5zZm9ybVBhbmVsKHRoaXMuX3BhbmVsc1thbmNob3JdWzFdLCBhbmdsZSwgYW5jaG9yKTtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyYXRlKGFuY2hvciwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihwYW5lbCwgaSkge1xuICAgICAgICAgIGlmIChpICE9PSAxKSB7XG4gICAgICAgICAgICBfdGhpcy5fdHJhbnNmb3JtUGFuZWwocGFuZWwsIDAsIGFuY2hvcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChfdGhpcy5fc2hhZGluZykge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9zZXRTaGFkZXIoaSwgYW5jaG9yLCAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfSk7XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5mb2xkVXAgPSBwcmVwKGZ1bmN0aW9uKGFuY2hvciwgY2FsbGJhY2spIHtcbiAgICAgIGlmICh0aGlzLmlzRm9sZGVkVXApIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiID8gY2FsbGJhY2soKSA6IHZvaWQgMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9zdGFnZVJlc2V0KGFuY2hvciwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5faW5UcmFucyA9IF90aGlzLmlzRm9sZGVkVXAgPSB0cnVlO1xuICAgICAgICAgIHJldHVybiBfdGhpcy5faXRlcmF0ZShhbmNob3IsIGZ1bmN0aW9uKHBhbmVsLCBpLCBsZW4pIHtcbiAgICAgICAgICAgIHZhciBkZWxheSwgZHVyYXRpb247XG4gICAgICAgICAgICBkdXJhdGlvbiA9IF90aGlzLl9jb25maWcuc3BlZWQ7XG4gICAgICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgICBkdXJhdGlvbiAvPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsYXkgPSBfdGhpcy5fc2V0UGFuZWxUcmFucy5hcHBseShfdGhpcywgW2FuY2hvcl0uY29uY2F0KF9fc2xpY2UuY2FsbChhcmd1bWVudHMpLCBbZHVyYXRpb25dLCBbMl0pKTtcbiAgICAgICAgICAgIHJldHVybiAoZnVuY3Rpb24ocGFuZWwsIGksIGRlbGF5KSB7XG4gICAgICAgICAgICAgIHJldHVybiBkZWZlcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fdHJhbnNmb3JtUGFuZWwocGFuZWwsIChpID09PSAwID8gOTAgOiAxNzApLCBhbmNob3IpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2luVHJhbnMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiID8gY2FsbGJhY2soKSA6IHZvaWQgMDtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoaWRlRWwocGFuZWwuY2hpbGRyZW5bMF0pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIGRlbGF5ICsgX3RoaXMuX2NvbmZpZy5zcGVlZCAqIC4yNSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkocGFuZWwsIGksIGRlbGF5KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9KTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLnVuZm9sZCA9IHByZXAoZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHJldHVybiB0aGlzLl91bmZvbGQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9KTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICByZXR1cm4gcHJlcCgoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuX2l0ZXJhdGUoYW5jaG9yLCBmdW5jdGlvbihwYW5lbCwgaSwgbGVuKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuX3RyYW5zZm9ybVBhbmVsKHBhbmVsLCBmbihhbmdsZSwgaSwgbGVuKSwgYW5jaG9yLCBvcHRpb25zLmZyYWN0dXJlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKS5iaW5kKHRoaXMpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICByZXR1cm4gdGhpcy5hY2NvcmRpb24oMCwge1xuICAgICAgICBjYWxsYmFjazogY2FsbGJhY2tcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5yZXZlYWwgPSBmdW5jdGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMuc3RpY2t5ID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLmFjY29yZGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuc3RhaXJzID0gZnVuY3Rpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICBvcHRpb25zLnN0YWlycyA9IG9wdGlvbnMuc3RpY2t5ID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLmFjY29yZGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuZnJhY3R1cmUgPSBmdW5jdGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMuZnJhY3R1cmUgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMuYWNjb3JkaW9uKGFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS50d2lzdCA9IGZ1bmN0aW9uKGFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpIHtcbiAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgfVxuICAgICAgb3B0aW9ucy5mcmFjdHVyZSA9IG9wdGlvbnMudHdpc3QgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMuYWNjb3JkaW9uKGFuZ2xlIC8gMTAsIGFuY2hvciwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmNvbGxhcHNlID0gZnVuY3Rpb24oYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMuc3RpY2t5ID0gZmFsc2U7XG4gICAgICByZXR1cm4gdGhpcy5hY2NvcmRpb24oLXRoaXMuX2NvbmZpZy5tYXhBbmdsZSwgYW5jaG9yLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuY29sbGFwc2VBbHQgPSBmdW5jdGlvbihhbmNob3IsIG9wdGlvbnMpIHtcbiAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgfVxuICAgICAgb3B0aW9ucy5zdGlja3kgPSBmYWxzZTtcbiAgICAgIHJldHVybiB0aGlzLmFjY29yZGlvbih0aGlzLl9jb25maWcubWF4QW5nbGUsIGFuY2hvciwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIE9yaURvbWkuVkVSU0lPTiA9ICcxLjEuMic7XG5cbiAgICBPcmlEb21pLmlzU3VwcG9ydGVkID0gaXNTdXBwb3J0ZWQ7XG5cbiAgICByZXR1cm4gT3JpRG9taTtcblxuICB9KSgpO1xuXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZSAhPT0gbnVsbCA/IG1vZHVsZS5leHBvcnRzIDogdm9pZCAwKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBPcmlEb21pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgIT09IFwidW5kZWZpbmVkXCIgJiYgZGVmaW5lICE9PSBudWxsID8gZGVmaW5lLmFtZCA6IHZvaWQgMCkge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBPcmlEb21pO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHdpbmRvdy5PcmlEb21pID0gT3JpRG9taTtcbiAgfVxuXG4gIGlmICghJCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gICQucHJvdG90eXBlLm9yaURvbWkgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGVsLCBpbnN0YW5jZSwgbWV0aG9kLCBtZXRob2ROYW1lLCBfaSwgX2osIF9sZW4sIF9sZW4xO1xuICAgIGlmICghaXNTdXBwb3J0ZWQpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucyA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuICQuZGF0YSh0aGlzWzBdLCBiYXNlTmFtZSk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIG1ldGhvZE5hbWUgPSBvcHRpb25zO1xuICAgICAgaWYgKHR5cGVvZiAobWV0aG9kID0gT3JpRG9taS5wcm90b3R5cGVbbWV0aG9kTmFtZV0pICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjb25zb2xlICE9PSBudWxsKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiXCIgKyBsaWJOYW1lICsgXCI6IE5vIHN1Y2ggbWV0aG9kIGBcIiArIG1ldGhvZE5hbWUgKyBcImBcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHRoaXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgZWwgPSB0aGlzW19pXTtcbiAgICAgICAgaWYgKCEoaW5zdGFuY2UgPSAkLmRhdGEoZWwsIGJhc2VOYW1lKSkpIHtcbiAgICAgICAgICBpbnN0YW5jZSA9ICQuZGF0YShlbCwgYmFzZU5hbWUsIG5ldyBPcmlEb21pKGVsLCBvcHRpb25zKSk7XG4gICAgICAgIH1cbiAgICAgICAgbWV0aG9kLmFwcGx5KGluc3RhbmNlLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLnNsaWNlKDEpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gdGhpcy5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgZWwgPSB0aGlzW19qXTtcbiAgICAgICAgaWYgKGluc3RhbmNlID0gJC5kYXRhKGVsLCBiYXNlTmFtZSkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkLmRhdGEoZWwsIGJhc2VOYW1lLCBuZXcgT3JpRG9taShlbCwgb3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1vcmlkb21pLm1hcFxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9vcmlkb21pL29yaWRvbWkuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvb3JpZG9taVwiKSJdfQ==
