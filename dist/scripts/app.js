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

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/fake_80b9e811.js","/")
},{"buffer":2,"impulse":13,"oMfpAn":5,"oridomi":36}],2:[function(require,module,exports){
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
var Boundry = require('./boundry')
var Animation = require('./animation')
var Vector = require('./vector')
var height = require('./util').height

var Accelerate = module.exports = Animation({
  defaultOptions: {
    acceleration: 1000,
    bounce: false,
    minBounceDistance: 5,
    damping: 0.2
  },

  onStart: function(velocity, from, to, opts, update, done) {
    var direction = to.sub(from).normalize()
    var acceleration = direction.mult(opts.acceleration)
    var bounceAcceleration = direction.mult(opts.bounceAcceleration || opts.acceleration)
    var boundry = Boundry({
      left: (to.x > from.x) ? -Infinity : to.x,
      right: (to.x > from.x) ? to.x : Infinity,
      top: (to.y > from.y) ? -Infinity : to.y,
      bottom: (to.y > from.y) ? to.y : Infinity
    })
    var bouncing

    if(to.sub(from).norm() < .001) {
      return update.done(to, velocity)
    }

    var body = this._body = Body(velocity, from, {
      accelerate: function(s, t) {
        if(bouncing)
          return bounceAcceleration
        else
          return acceleration
      },
      update: function(position, velocity) {
        if(boundry.contains(position)) {
          update.state(position, velocity)
        } else {
          if(opts.bounce &&
             Math.abs(height(bounceAcceleration.norm(), velocity.norm() * opts.damping, 0)) > opts.minBounceDistance) {
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
},{"./animation":7,"./body":9,"./boundry":10,"./simulation":16,"./util":18,"./vector":19,"buffer":2,"oMfpAn":5}],7:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var defaults = require('lodash.defaults')
  , Promise = window.Promise || require('promise')
  , Boundry = require('./boundry')
  , Vector = require('./vector')
  , Emitter = require('component-emitter')

var proto = {
  to: function(x, y) {
    if(x instanceof Boundry)
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
    if(to instanceof Boundry)
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
},{"./boundry":10,"./vector":19,"buffer":2,"component-emitter":23,"lodash.defaults":24,"oMfpAn":5,"promise":31}],8:[function(require,module,exports){
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
},{"./body":9,"./simulation":16,"./vector":19,"buffer":2,"lodash.defaults":24,"oMfpAn":5}],9:[function(require,module,exports){
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
module.exports = Boundry

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

Boundry.prototype.applyDamping = function(position, damping) {
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

function Boundry(boundry) {
  if(!(this instanceof Boundry))
    return new Boundry(boundry)

  this.left = (typeof boundry.left !== 'undefined') ? boundry.left : -Infinity
  this.right = (typeof boundry.right !== 'undefined') ? boundry.right : Infinity
  this.top = (typeof boundry.top !== 'undefined') ? boundry.top : -Infinity
  this.bottom = (typeof boundry.bottom !== 'undefined') ? boundry.bottom : Infinity
}

Boundry.prototype.contains = function(pt) {
  return pt.x >= this.left &&
         pt.x <= this.right &&
         pt.y >= this.top &&
         pt.y <= this.bottom
}

Boundry.prototype.nearestIntersect = function(point, velocity) {
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
  //just send it it the nearest boundry
  distX = (Math.abs(point.x - this.left) < Math.abs(point.x - this.right)) ? this.left : this.right
  distY = (Math.abs(point.y - this.top) < Math.abs(point.y - this.bottom)) ? this.top : this.bottom

  return (distX < distY) ? Vector(distX, point.y) : Vector(point.x, distY)
}
}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/lib/boundry.js","/../../node_modules/impulse/lib")
},{"./vector":19,"buffer":2,"oMfpAn":5}],11:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Body = require('./body')
var simulation = require('./simulation')
var Boundry = require('./boundry')
var Animation = require('./animation')

var Decelerate = module.exports = Animation({
  defaultOptions: {
    deceleration: 400
  },
  onStart: function(velocity, from, to, opts, update, done) {
    var direction = to.sub(from).normalize()
      , deceleration = direction.mult(opts.deceleration).negate()
      , boundry = Boundry({
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
        } else if(boundry.contains(position)) {
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
},{"./animation":7,"./body":9,"./boundry":10,"./simulation":16,"buffer":2,"oMfpAn":5}],12:[function(require,module,exports){
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
  return this._moved
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
  evt.preventDefault()
  this._mousedown = true
  this._moved = false
  this._interaction = this._phys.interact({
    boundry: this._opts.boundry,
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
  this._moved = true

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
},{"buffer":2,"component-emitter":23,"lodash.defaults":24,"oMfpAn":5}],13:[function(require,module,exports){
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
var Boundry = require('./boundry')
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

Physics.Boundry = Boundry
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
},{"./accelerate":6,"./attach-spring":8,"./boundry":10,"./decelerate":11,"./drag":12,"./interact":14,"./renderer":15,"./simulation":16,"./spring":17,"./vector":19,"buffer":2,"lodash.defaults":24,"oMfpAn":5,"promise":31}],14:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var defaults = require('lodash.defaults')
var Velocity = require('touch-velocity')
var Vector = require('./vector')
var Promise = require('Promise')
var util = require('./util')
var Boundry = require('./boundry')

module.exports = Interact

var defaultOpts = {
  boundry: Boundry({}),
  damping: 0,
  direction: 'both'
}

function Interact(phys, opts) {
  this._phys = phys
  this._running = false
  this._opts = defaults({}, opts, defaultOpts)
}

Interact.prototype.position = function(x, y) {
  var direction = this._opts.direction
    , boundry = this._opts.boundry
    , pos = Vector(x, y)

  if(direction !== 'both' && direction !== 'horizontal') pos.x = 0
  if(direction !== 'both' && direction !== 'vertical') pos.y = 0

  this._veloX.updatePosition(pos.x)
  this._veloY.updatePosition(pos.y)

  this._phys.velocity(this._veloX.getVelocity(), this._veloY.getVelocity())

  pos = boundry.applyDamping(pos, this._opts.damping)


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

  this._veloX = new Velocity()
  this._veloY = new Velocity()

  this.position(position)

  return this._ended = new Promise(function(res, rej) {
    that._resolve = res
    that._reject = rej
  })
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
},{"./boundry":10,"./util":18,"./vector":19,"Promise":21,"buffer":2,"lodash.defaults":24,"oMfpAn":5,"touch-velocity":35}],15:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var prefixes = ['Webkit', 'Moz', 'Ms', 'ms']
var calls = []
var transformProp = prefixed('transform')
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
                  'rotate', 'rotateX', 'rotateY', 'rotateZ',
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
},{"buffer":2,"oMfpAn":5,"raf":33}],16:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Vector = require('./vector')
  , bodies = []

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
  requestAnimationFrame(function() {
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
},{"./vector":19,"buffer":2,"oMfpAn":5}],17:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Body = require('./body')
var simulation = require('./simulation')
var Boundry = require('./boundry')
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
},{"./animation":7,"./body":9,"./boundry":10,"./simulation":16,"buffer":2,"oMfpAn":5}],18:[function(require,module,exports){
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

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/Promise/core.js","/../../node_modules/impulse/node_modules/Promise")
},{"asap":22,"buffer":2,"oMfpAn":5}],21:[function(require,module,exports){
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

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/Promise/index.js","/../../node_modules/impulse/node_modules/Promise")
},{"./core.js":20,"asap":22,"buffer":2,"oMfpAn":5}],22:[function(require,module,exports){
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


}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../../node_modules/impulse/node_modules/Promise/node_modules/asap/asap.js","/../../node_modules/impulse/node_modules/Promise/node_modules/asap")
},{"buffer":2,"oMfpAn":5}],23:[function(require,module,exports){
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
},{"buffer":2,"oMfpAn":5}],24:[function(require,module,exports){
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
},{"buffer":2,"lodash._objecttypes":25,"lodash.keys":26,"oMfpAn":5}],25:[function(require,module,exports){
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
},{"buffer":2,"oMfpAn":5}],26:[function(require,module,exports){
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
},{"buffer":2,"lodash._isnative":27,"lodash._shimkeys":28,"lodash.isobject":29,"oMfpAn":5}],27:[function(require,module,exports){
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
},{"buffer":2,"oMfpAn":5}],28:[function(require,module,exports){
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
},{"buffer":2,"lodash._objecttypes":25,"oMfpAn":5}],29:[function(require,module,exports){
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
},{"buffer":2,"lodash._objecttypes":25,"oMfpAn":5}],30:[function(require,module,exports){
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
},{"asap":32,"buffer":2,"oMfpAn":5}],31:[function(require,module,exports){
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
},{"./core.js":30,"asap":32,"buffer":2,"oMfpAn":5}],32:[function(require,module,exports){
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
},{"buffer":2,"oMfpAn":5}],33:[function(require,module,exports){
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
},{"buffer":2,"oMfpAn":5,"performance-now":34}],34:[function(require,module,exports){
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
},{"buffer":2,"oMfpAn":5}],35:[function(require,module,exports){
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
},{"buffer":2,"oMfpAn":5}],36:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYmFkZ2VyL0Rlc2t0b3AvbHVzdGVyL2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvYXBwL3NjcmlwdHMvZmFrZV84MGI5ZTgxMS5qcyIsIi9Vc2Vycy9wYmFkZ2VyL0Rlc2t0b3AvbHVzdGVyL2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qcyIsIi9Vc2Vycy9wYmFkZ2VyL0Rlc2t0b3AvbHVzdGVyL2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL3BiYWRnZXIvRGVza3RvcC9sdXN0ZXIvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9hY2NlbGVyYXRlLmpzIiwiL1VzZXJzL3BiYWRnZXIvRGVza3RvcC9sdXN0ZXIvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9hbmltYXRpb24uanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2F0dGFjaC1zcHJpbmcuanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2JvZHkuanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2JvdW5kcnkuanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2RlY2VsZXJhdGUuanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2RyYWcuanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2luZGV4LmpzIiwiL1VzZXJzL3BiYWRnZXIvRGVza3RvcC9sdXN0ZXIvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9pbnRlcmFjdC5qcyIsIi9Vc2Vycy9wYmFkZ2VyL0Rlc2t0b3AvbHVzdGVyL2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvcmVuZGVyZXIuanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL3NpbXVsYXRpb24uanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL3NwcmluZy5qcyIsIi9Vc2Vycy9wYmFkZ2VyL0Rlc2t0b3AvbHVzdGVyL2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvdXRpbC5qcyIsIi9Vc2Vycy9wYmFkZ2VyL0Rlc2t0b3AvbHVzdGVyL2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvdmVjdG9yLmpzIiwiL1VzZXJzL3BiYWRnZXIvRGVza3RvcC9sdXN0ZXIvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9Qcm9taXNlL2NvcmUuanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL1Byb21pc2UvaW5kZXguanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL1Byb21pc2Uvbm9kZV9tb2R1bGVzL2FzYXAvYXNhcC5qcyIsIi9Vc2Vycy9wYmFkZ2VyL0Rlc2t0b3AvbHVzdGVyL2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvY29tcG9uZW50LWVtaXR0ZXIvaW5kZXguanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9pbmRleC5qcyIsIi9Vc2Vycy9wYmFkZ2VyL0Rlc2t0b3AvbHVzdGVyL2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2guX29iamVjdHR5cGVzL2luZGV4LmpzIiwiL1VzZXJzL3BiYWRnZXIvRGVza3RvcC9sdXN0ZXIvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL2luZGV4LmpzIiwiL1VzZXJzL3BiYWRnZXIvRGVza3RvcC9sdXN0ZXIvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL25vZGVfbW9kdWxlcy9sb2Rhc2guX2lzbmF0aXZlL2luZGV4LmpzIiwiL1VzZXJzL3BiYWRnZXIvRGVza3RvcC9sdXN0ZXIvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL25vZGVfbW9kdWxlcy9sb2Rhc2guX3NoaW1rZXlzL2luZGV4LmpzIiwiL1VzZXJzL3BiYWRnZXIvRGVza3RvcC9sdXN0ZXIvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL25vZGVfbW9kdWxlcy9sb2Rhc2guaXNvYmplY3QvaW5kZXguanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2UvY29yZS5qcyIsIi9Vc2Vycy9wYmFkZ2VyL0Rlc2t0b3AvbHVzdGVyL2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcHJvbWlzZS9pbmRleC5qcyIsIi9Vc2Vycy9wYmFkZ2VyL0Rlc2t0b3AvbHVzdGVyL2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcHJvbWlzZS9ub2RlX21vZHVsZXMvYXNhcC9hc2FwLmpzIiwiL1VzZXJzL3BiYWRnZXIvRGVza3RvcC9sdXN0ZXIvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9yYWYvaW5kZXguanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3JhZi9ub2RlX21vZHVsZXMvcGVyZm9ybWFuY2Utbm93L2xpYi9wZXJmb3JtYW5jZS1ub3cuanMiLCIvVXNlcnMvcGJhZGdlci9EZXNrdG9wL2x1c3Rlci9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3RvdWNoLXZlbG9jaXR5L2luZGV4LmpzIiwiL1VzZXJzL3BiYWRnZXIvRGVza3RvcC9sdXN0ZXIvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9vcmlkb21pL29yaWRvbWkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFBoeXNpY3MgPSByZXF1aXJlKCdpbXB1bHNlJylcbnZhciBPcmlEb21pID0gcmVxdWlyZSgnb3JpZG9taScpXG52YXIgZm9sZGVkID0gbmV3IE9yaURvbWkoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNvdmVyJyksIHsgdlBhbmVsczogNSwgc3BlZWQ6IDAsIHJpcHBsZTogMCwgdG91Y2hFbmFibGVkOiBmYWxzZSwgcGVyc3BlY3RpdmU6IDgwMCB9KVxudmFyIGxhc3RQZXJjZW50ID0gMVxuZm9sZGVkLmFjY29yZGlvbigwKVxuXG52YXIgcGh5cyA9IG5ldyBQaHlzaWNzKGZ1bmN0aW9uKHgpIHtcbiAgZm9sZGVkLmFjY29yZGlvbihNYXRoLmFjb3MoeCkgKiAoMTgwIC8gTWF0aC5QSSkpXG59KVxuXG5waHlzLnBvc2l0aW9uKDEsIDApXG5cbnZhciBzdGFydFhcbiAgLCB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoXG4gICwgaW50ZXJhY3Rpb25cbiAgLCBtb3VzZWRvd24gPSBmYWxzZVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCBmdW5jdGlvbihldnQpIHtcbiAgZXZ0LnByZXZlbnREZWZhdWx0KClcbn0pXG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgc3RhcnQpXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgc3RhcnQpXG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBtb3ZlKVxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG1vdmUpXG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGVuZClcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZW5kKVxuXG5mdW5jdGlvbiBwYWdlWChldnQpIHtcbiAgcmV0dXJuIGV2dC50b3VjaGVzICYmIGV2dC50b3VjaGVzWzBdLnBhZ2VYIHx8IGV2dC5wYWdlWFxufVxuXG5mdW5jdGlvbiBzdGFydChldnQpIHtcbiAgdmFyIHBlcmNlbnQgPSBwaHlzLnBvc2l0aW9uKCkueFxuICBtb3VzZWRvd24gPSB0cnVlXG4gIGludGVyYWN0aW9uID0gcGh5cy5pbnRlcmFjdCgpXG4gIGludGVyYWN0aW9uLnN0YXJ0KClcblxuICBpZihwZXJjZW50IDw9IDApIHBlcmNlbnQgPSAuMVxuXG4gIHN0YXJ0WCA9IHBhZ2VYKGV2dCkgLyBwZXJjZW50XG59XG5cbmZ1bmN0aW9uIG1vdmUoZXZ0KSB7XG4gIGlmKCFtb3VzZWRvd24pIHJldHVyblxuICBldnQucHJldmVudERlZmF1bHQoKVxuICB2YXIgZGVsdGEgPSBwYWdlWChldnQpXG4gICAgLCBwZXJjZW50TW92ZWQgPSBkZWx0YSAvIHN0YXJ0WFxuXG4gIGlmKHBlcmNlbnRNb3ZlZCA+IDEpIHBlcmNlbnRNb3ZlZCA9IDFcbiAgaW50ZXJhY3Rpb24ucG9zaXRpb24ocGVyY2VudE1vdmVkKVxufVxuXG5mdW5jdGlvbiBlbmQoZXZ0KSB7XG4gIGlmKCFtb3VzZWRvd24pIHJldHVyblxuICBtb3VzZWRvd24gPSBmYWxzZVxuICBldnQucHJldmVudERlZmF1bHQoKVxuICBpbnRlcmFjdGlvbi5lbmQoKVxuICB2YXIgdG8gPSAocGh5cy5kaXJlY3Rpb24oJ2xlZnQnKSkgPyAwIDogMVxuICBwaHlzLmFjY2VsZXJhdGUoeyBib3VuY2U6IHRydWUsIGFjY2VsZXJhdGlvbjogMywgbWluQm91bmNlRGlzdGFuY2U6IDAsIGJvdWNlQWNjZWxlcmF0aW9uOiA2LCBkYW1waW5nOiAuMiB9KS50byh0bykuc3RhcnQoKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2Zha2VfODBiOWU4MTEuanNcIixcIi9cIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5fdXNlVHlwZWRBcnJheXNgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAoY29tcGF0aWJsZSBkb3duIHRvIElFNilcbiAqL1xuQnVmZmVyLl91c2VUeXBlZEFycmF5cyA9IChmdW5jdGlvbiAoKSB7XG4gIC8vIERldGVjdCBpZiBicm93c2VyIHN1cHBvcnRzIFR5cGVkIEFycmF5cy4gU3VwcG9ydGVkIGJyb3dzZXJzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssXG4gIC8vIENocm9tZSA3KywgU2FmYXJpIDUuMSssIE9wZXJhIDExLjYrLCBpT1MgNC4yKy4gSWYgdGhlIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBhZGRpbmdcbiAgLy8gcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLCB0aGVuIHRoYXQncyB0aGUgc2FtZSBhcyBubyBgVWludDhBcnJheWAgc3VwcG9ydFxuICAvLyBiZWNhdXNlIHdlIG5lZWQgdG8gYmUgYWJsZSB0byBhZGQgYWxsIHRoZSBub2RlIEJ1ZmZlciBBUEkgbWV0aG9kcy4gVGhpcyBpcyBhbiBpc3N1ZVxuICAvLyBpbiBGaXJlZm94IDQtMjkuIE5vdyBmaXhlZDogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4XG4gIHRyeSB7XG4gICAgdmFyIGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcigwKVxuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheShidWYpXG4gICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICByZXR1cm4gNDIgPT09IGFyci5mb28oKSAmJlxuICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nIC8vIENocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn0pKClcblxuLyoqXG4gKiBDbGFzczogQnVmZmVyXG4gKiA9PT09PT09PT09PT09XG4gKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBhcmUgYXVnbWVudGVkXG4gKiB3aXRoIGZ1bmN0aW9uIHByb3BlcnRpZXMgZm9yIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBBUEkgZnVuY3Rpb25zLiBXZSB1c2VcbiAqIGBVaW50OEFycmF5YCBzbyB0aGF0IHNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0IHJldHVybnNcbiAqIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIEJ5IGF1Z21lbnRpbmcgdGhlIGluc3RhbmNlcywgd2UgY2FuIGF2b2lkIG1vZGlmeWluZyB0aGUgYFVpbnQ4QXJyYXlgXG4gKiBwcm90b3R5cGUuXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlciAoc3ViamVjdCwgZW5jb2RpbmcsIG5vWmVybykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSlcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKVxuXG4gIHZhciB0eXBlID0gdHlwZW9mIHN1YmplY3RcblxuICAvLyBXb3JrYXJvdW5kOiBub2RlJ3MgYmFzZTY0IGltcGxlbWVudGF0aW9uIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBzdHJpbmdzXG4gIC8vIHdoaWxlIGJhc2U2NC1qcyBkb2VzIG5vdC5cbiAgaWYgKGVuY29kaW5nID09PSAnYmFzZTY0JyAmJiB0eXBlID09PSAnc3RyaW5nJykge1xuICAgIHN1YmplY3QgPSBzdHJpbmd0cmltKHN1YmplY3QpXG4gICAgd2hpbGUgKHN1YmplY3QubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgICAgc3ViamVjdCA9IHN1YmplY3QgKyAnPSdcbiAgICB9XG4gIH1cblxuICAvLyBGaW5kIHRoZSBsZW5ndGhcbiAgdmFyIGxlbmd0aFxuICBpZiAodHlwZSA9PT0gJ251bWJlcicpXG4gICAgbGVuZ3RoID0gY29lcmNlKHN1YmplY3QpXG4gIGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKVxuICAgIGxlbmd0aCA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHN1YmplY3QsIGVuY29kaW5nKVxuICBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0JylcbiAgICBsZW5ndGggPSBjb2VyY2Uoc3ViamVjdC5sZW5ndGgpIC8vIGFzc3VtZSB0aGF0IG9iamVjdCBpcyBhcnJheS1saWtlXG4gIGVsc2VcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IG5lZWRzIHRvIGJlIGEgbnVtYmVyLCBhcnJheSBvciBzdHJpbmcuJylcblxuICB2YXIgYnVmXG4gIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgLy8gUHJlZmVycmVkOiBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIGJ1ZiA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShsZW5ndGgpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gVEhJUyBpbnN0YW5jZSBvZiBCdWZmZXIgKGNyZWF0ZWQgYnkgYG5ld2ApXG4gICAgYnVmID0gdGhpc1xuICAgIGJ1Zi5sZW5ndGggPSBsZW5ndGhcbiAgICBidWYuX2lzQnVmZmVyID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMgJiYgdHlwZW9mIHN1YmplY3QuYnl0ZUxlbmd0aCA9PT0gJ251bWJlcicpIHtcbiAgICAvLyBTcGVlZCBvcHRpbWl6YXRpb24gLS0gdXNlIHNldCBpZiB3ZSdyZSBjb3B5aW5nIGZyb20gYSB0eXBlZCBhcnJheVxuICAgIGJ1Zi5fc2V0KHN1YmplY3QpXG4gIH0gZWxzZSBpZiAoaXNBcnJheWlzaChzdWJqZWN0KSkge1xuICAgIC8vIFRyZWF0IGFycmF5LWlzaCBvYmplY3RzIGFzIGEgYnl0ZSBhcnJheVxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSlcbiAgICAgICAgYnVmW2ldID0gc3ViamVjdC5yZWFkVUludDgoaSlcbiAgICAgIGVsc2VcbiAgICAgICAgYnVmW2ldID0gc3ViamVjdFtpXVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgIGJ1Zi53cml0ZShzdWJqZWN0LCAwLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnbnVtYmVyJyAmJiAhQnVmZmVyLl91c2VUeXBlZEFycmF5cyAmJiAhbm9aZXJvKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBidWZbaV0gPSAwXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG4vLyBTVEFUSUMgTUVUSE9EU1xuLy8gPT09PT09PT09PT09PT1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIChiKSB7XG4gIHJldHVybiAhIShiICE9PSBudWxsICYmIGIgIT09IHVuZGVmaW5lZCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmJ5dGVMZW5ndGggPSBmdW5jdGlvbiAoc3RyLCBlbmNvZGluZykge1xuICB2YXIgcmV0XG4gIHN0ciA9IHN0ciArICcnXG4gIHN3aXRjaCAoZW5jb2RpbmcgfHwgJ3V0ZjgnKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggLyAyXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IHV0ZjhUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBiYXNlNjRUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoICogMlxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiAobGlzdCwgdG90YWxMZW5ndGgpIHtcbiAgYXNzZXJ0KGlzQXJyYXkobGlzdCksICdVc2FnZTogQnVmZmVyLmNvbmNhdChsaXN0LCBbdG90YWxMZW5ndGhdKVxcbicgK1xuICAgICAgJ2xpc3Qgc2hvdWxkIGJlIGFuIEFycmF5LicpXG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMClcbiAgfSBlbHNlIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBsaXN0WzBdXG4gIH1cblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHRvdGFsTGVuZ3RoICE9PSAnbnVtYmVyJykge1xuICAgIHRvdGFsTGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB0b3RhbExlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHRvdGFsTGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIGl0ZW0uY29weShidWYsIHBvcylcbiAgICBwb3MgKz0gaXRlbS5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbi8vIEJVRkZFUiBJTlNUQU5DRSBNRVRIT0RTXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBfaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBhc3NlcnQoc3RyTGVuICUgMiA9PT0gMCwgJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBieXRlID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGFzc2VydCghaXNOYU4oYnl0ZSksICdJbnZhbGlkIGhleCBzdHJpbmcnKVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IGJ5dGVcbiAgfVxuICBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9IGkgKiAyXG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIF91dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBfYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBfYmluYXJ5V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gX2FzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBfYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF91dGYxNmxlV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIFN1cHBvcnQgYm90aCAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpXG4gIC8vIGFuZCB0aGUgbGVnYWN5IChzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBpZiAoIWlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7ICAvLyBsZWdhY3lcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGhcbiAgICBsZW5ndGggPSBzd2FwXG4gIH1cblxuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBfaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gX3V0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBfYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gX2JpbmFyeVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBfYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IF91dGYxNmxlV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuXG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuICBzdGFydCA9IE51bWJlcihzdGFydCkgfHwgMFxuICBlbmQgPSAoZW5kICE9PSB1bmRlZmluZWQpXG4gICAgPyBOdW1iZXIoZW5kKVxuICAgIDogZW5kID0gc2VsZi5sZW5ndGhcblxuICAvLyBGYXN0cGF0aCBlbXB0eSBzdHJpbmdzXG4gIGlmIChlbmQgPT09IHN0YXJ0KVxuICAgIHJldHVybiAnJ1xuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBfaGV4U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gX3V0ZjhTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBfYXNjaWlTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gX2JpbmFyeVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBfYmFzZTY0U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IF91dGYxNmxlU2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAodGFyZ2V0LCB0YXJnZXRfc3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNvdXJjZSA9IHRoaXNcblxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoIXRhcmdldF9zdGFydCkgdGFyZ2V0X3N0YXJ0ID0gMFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHNvdXJjZS5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgYXNzZXJ0KGVuZCA+PSBzdGFydCwgJ3NvdXJjZUVuZCA8IHNvdXJjZVN0YXJ0JylcbiAgYXNzZXJ0KHRhcmdldF9zdGFydCA+PSAwICYmIHRhcmdldF9zdGFydCA8IHRhcmdldC5sZW5ndGgsXG4gICAgICAndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChzdGFydCA+PSAwICYmIHN0YXJ0IDwgc291cmNlLmxlbmd0aCwgJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoZW5kID49IDAgJiYgZW5kIDw9IHNvdXJjZS5sZW5ndGgsICdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKVxuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0IDwgZW5kIC0gc3RhcnQpXG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldF9zdGFydCArIHN0YXJ0XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG5cbiAgaWYgKGxlbiA8IDEwMCB8fCAhQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICB0YXJnZXRbaSArIHRhcmdldF9zdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuX3NldCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksIHRhcmdldF9zdGFydClcbiAgfVxufVxuXG5mdW5jdGlvbiBfYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIF91dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmVzID0gJydcbiAgdmFyIHRtcCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGlmIChidWZbaV0gPD0gMHg3Rikge1xuICAgICAgcmVzICs9IGRlY29kZVV0ZjhDaGFyKHRtcCkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgICAgIHRtcCA9ICcnXG4gICAgfSBlbHNlIHtcbiAgICAgIHRtcCArPSAnJScgKyBidWZbaV0udG9TdHJpbmcoMTYpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcyArIGRlY29kZVV0ZjhDaGFyKHRtcClcbn1cblxuZnVuY3Rpb24gX2FzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKVxuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBfYmluYXJ5U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICByZXR1cm4gX2FzY2lpU2xpY2UoYnVmLCBzdGFydCwgZW5kKVxufVxuXG5mdW5jdGlvbiBfaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiBfdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpKzFdICogMjU2KVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IGNsYW1wKHN0YXJ0LCBsZW4sIDApXG4gIGVuZCA9IGNsYW1wKGVuZCwgbGVuLCBsZW4pXG5cbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICByZXR1cm4gQnVmZmVyLl9hdWdtZW50KHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCkpXG4gIH0gZWxzZSB7XG4gICAgdmFyIHNsaWNlTGVuID0gZW5kIC0gc3RhcnRcbiAgICB2YXIgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkLCB0cnVlKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICAgIHJldHVybiBuZXdCdWZcbiAgfVxufVxuXG4vLyBgZ2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuZ2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy5yZWFkVUludDgob2Zmc2V0KVxufVxuXG4vLyBgc2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodiwgb2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuc2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy53cml0ZVVJbnQ4KHYsIG9mZnNldClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuZnVuY3Rpb24gX3JlYWRVSW50MTYgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsXG4gIGlmIChsaXR0bGVFbmRpYW4pIHtcbiAgICB2YWwgPSBidWZbb2Zmc2V0XVxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXSA8PCA4XG4gIH0gZWxzZSB7XG4gICAgdmFsID0gYnVmW29mZnNldF0gPDwgOFxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXVxuICB9XG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MTYodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MTYodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkVUludDMyIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbFxuICBpZiAobGl0dGxlRW5kaWFuKSB7XG4gICAgaWYgKG9mZnNldCArIDIgPCBsZW4pXG4gICAgICB2YWwgPSBidWZbb2Zmc2V0ICsgMl0gPDwgMTZcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMV0gPDwgOFxuICAgIHZhbCB8PSBidWZbb2Zmc2V0XVxuICAgIGlmIChvZmZzZXQgKyAzIDwgbGVuKVxuICAgICAgdmFsID0gdmFsICsgKGJ1ZltvZmZzZXQgKyAzXSA8PCAyNCA+Pj4gMClcbiAgfSBlbHNlIHtcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCA9IGJ1ZltvZmZzZXQgKyAxXSA8PCAxNlxuICAgIGlmIChvZmZzZXQgKyAyIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAyXSA8PCA4XG4gICAgaWYgKG9mZnNldCArIDMgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDNdXG4gICAgdmFsID0gdmFsICsgKGJ1ZltvZmZzZXRdIDw8IDI0ID4+PiAwKVxuICB9XG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MzIodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MzIodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCxcbiAgICAgICAgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIHZhciBuZWcgPSB0aGlzW29mZnNldF0gJiAweDgwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5mdW5jdGlvbiBfcmVhZEludDE2IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbCA9IF9yZWFkVUludDE2KGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHRydWUpXG4gIHZhciBuZWcgPSB2YWwgJiAweDgwMDBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmZmZiAtIHZhbCArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDE2KHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQxNih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRJbnQzMiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWwgPSBfcmVhZFVJbnQzMihidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCB0cnVlKVxuICB2YXIgbmVnID0gdmFsICYgMHg4MDAwMDAwMFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZmZmZmZmZiAtIHZhbCArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDMyKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQzMih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRGbG9hdCAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICByZXR1cm4gaWVlZTc1NC5yZWFkKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRmxvYXQodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEZsb2F0KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZERvdWJsZSAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICsgNyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICByZXR1cm4gaWVlZTc1NC5yZWFkKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZERvdWJsZSh0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZERvdWJsZSh0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAndHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnVpbnQodmFsdWUsIDB4ZmYpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm5cblxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxufVxuXG5mdW5jdGlvbiBfd3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZmZmKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihsZW4gLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID1cbiAgICAgICAgKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgICAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZmZmZmZmZilcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4obGVuIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9XG4gICAgICAgICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZiwgLTB4ODApXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIHRoaXMud3JpdGVVSW50OCh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydClcbiAgZWxzZVxuICAgIHRoaXMud3JpdGVVSW50OCgweGZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmZmYsIC0weDgwMDApXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICBfd3JpdGVVSW50MTYoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgX3dyaXRlVUludDE2KGJ1ZiwgMHhmZmZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgX3dyaXRlVUludDMyKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbiAgZWxzZVxuICAgIF93cml0ZVVJbnQzMihidWYsIDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmSUVFRTc1NCh2YWx1ZSwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDcgPCBidWYubGVuZ3RoLFxuICAgICAgICAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZklFRUU3NTQodmFsdWUsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLmNoYXJDb2RlQXQoMClcbiAgfVxuXG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmICFpc05hTih2YWx1ZSksICd2YWx1ZSBpcyBub3QgYSBudW1iZXInKVxuICBhc3NlcnQoZW5kID49IHN0YXJ0LCAnZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgYXNzZXJ0KHN0YXJ0ID49IDAgJiYgc3RhcnQgPCB0aGlzLmxlbmd0aCwgJ3N0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoZW5kID49IDAgJiYgZW5kIDw9IHRoaXMubGVuZ3RoLCAnZW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgdGhpc1tpXSA9IHZhbHVlXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgb3V0ID0gW11cbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBvdXRbaV0gPSB0b0hleCh0aGlzW2ldKVxuICAgIGlmIChpID09PSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTKSB7XG4gICAgICBvdXRbaSArIDFdID0gJy4uLidcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgb3V0LmpvaW4oJyAnKSArICc+J1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgICAgcmV0dXJuIChuZXcgQnVmZmVyKHRoaXMpKS5idWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMubGVuZ3RoKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1Zi5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSlcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdCdWZmZXIudG9BcnJheUJ1ZmZlciBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlcicpXG4gIH1cbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG52YXIgQlAgPSBCdWZmZXIucHJvdG90eXBlXG5cbi8qKlxuICogQXVnbWVudCBhIFVpbnQ4QXJyYXkgKmluc3RhbmNlKiAobm90IHRoZSBVaW50OEFycmF5IGNsYXNzISkgd2l0aCBCdWZmZXIgbWV0aG9kc1xuICovXG5CdWZmZXIuX2F1Z21lbnQgPSBmdW5jdGlvbiAoYXJyKSB7XG4gIGFyci5faXNCdWZmZXIgPSB0cnVlXG5cbiAgLy8gc2F2ZSByZWZlcmVuY2UgdG8gb3JpZ2luYWwgVWludDhBcnJheSBnZXQvc2V0IG1ldGhvZHMgYmVmb3JlIG92ZXJ3cml0aW5nXG4gIGFyci5fZ2V0ID0gYXJyLmdldFxuICBhcnIuX3NldCA9IGFyci5zZXRcblxuICAvLyBkZXByZWNhdGVkLCB3aWxsIGJlIHJlbW92ZWQgaW4gbm9kZSAwLjEzK1xuICBhcnIuZ2V0ID0gQlAuZ2V0XG4gIGFyci5zZXQgPSBCUC5zZXRcblxuICBhcnIud3JpdGUgPSBCUC53cml0ZVxuICBhcnIudG9TdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9Mb2NhbGVTdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9KU09OID0gQlAudG9KU09OXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnQ4ID0gQlAucmVhZFVJbnQ4XG4gIGFyci5yZWFkVUludDE2TEUgPSBCUC5yZWFkVUludDE2TEVcbiAgYXJyLnJlYWRVSW50MTZCRSA9IEJQLnJlYWRVSW50MTZCRVxuICBhcnIucmVhZFVJbnQzMkxFID0gQlAucmVhZFVJbnQzMkxFXG4gIGFyci5yZWFkVUludDMyQkUgPSBCUC5yZWFkVUludDMyQkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50OCA9IEJQLndyaXRlSW50OFxuICBhcnIud3JpdGVJbnQxNkxFID0gQlAud3JpdGVJbnQxNkxFXG4gIGFyci53cml0ZUludDE2QkUgPSBCUC53cml0ZUludDE2QkVcbiAgYXJyLndyaXRlSW50MzJMRSA9IEJQLndyaXRlSW50MzJMRVxuICBhcnIud3JpdGVJbnQzMkJFID0gQlAud3JpdGVJbnQzMkJFXG4gIGFyci53cml0ZUZsb2F0TEUgPSBCUC53cml0ZUZsb2F0TEVcbiAgYXJyLndyaXRlRmxvYXRCRSA9IEJQLndyaXRlRmxvYXRCRVxuICBhcnIud3JpdGVEb3VibGVMRSA9IEJQLndyaXRlRG91YmxlTEVcbiAgYXJyLndyaXRlRG91YmxlQkUgPSBCUC53cml0ZURvdWJsZUJFXG4gIGFyci5maWxsID0gQlAuZmlsbFxuICBhcnIuaW5zcGVjdCA9IEJQLmluc3BlY3RcbiAgYXJyLnRvQXJyYXlCdWZmZXIgPSBCUC50b0FycmF5QnVmZmVyXG5cbiAgcmV0dXJuIGFyclxufVxuXG4vLyBzbGljZShzdGFydCwgZW5kKVxuZnVuY3Rpb24gY2xhbXAgKGluZGV4LCBsZW4sIGRlZmF1bHRWYWx1ZSkge1xuICBpZiAodHlwZW9mIGluZGV4ICE9PSAnbnVtYmVyJykgcmV0dXJuIGRlZmF1bHRWYWx1ZVxuICBpbmRleCA9IH5+aW5kZXg7ICAvLyBDb2VyY2UgdG8gaW50ZWdlci5cbiAgaWYgKGluZGV4ID49IGxlbikgcmV0dXJuIGxlblxuICBpZiAoaW5kZXggPj0gMCkgcmV0dXJuIGluZGV4XG4gIGluZGV4ICs9IGxlblxuICBpZiAoaW5kZXggPj0gMCkgcmV0dXJuIGluZGV4XG4gIHJldHVybiAwXG59XG5cbmZ1bmN0aW9uIGNvZXJjZSAobGVuZ3RoKSB7XG4gIC8vIENvZXJjZSBsZW5ndGggdG8gYSBudW1iZXIgKHBvc3NpYmx5IE5hTiksIHJvdW5kIHVwXG4gIC8vIGluIGNhc2UgaXQncyBmcmFjdGlvbmFsIChlLmcuIDEyMy40NTYpIHRoZW4gZG8gYVxuICAvLyBkb3VibGUgbmVnYXRlIHRvIGNvZXJjZSBhIE5hTiB0byAwLiBFYXN5LCByaWdodD9cbiAgbGVuZ3RoID0gfn5NYXRoLmNlaWwoK2xlbmd0aClcbiAgcmV0dXJuIGxlbmd0aCA8IDAgPyAwIDogbGVuZ3RoXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXkgKHN1YmplY3QpIHtcbiAgcmV0dXJuIChBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChzdWJqZWN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzdWJqZWN0KSA9PT0gJ1tvYmplY3QgQXJyYXldJ1xuICB9KShzdWJqZWN0KVxufVxuXG5mdW5jdGlvbiBpc0FycmF5aXNoIChzdWJqZWN0KSB7XG4gIHJldHVybiBpc0FycmF5KHN1YmplY3QpIHx8IEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSB8fFxuICAgICAgc3ViamVjdCAmJiB0eXBlb2Ygc3ViamVjdCA9PT0gJ29iamVjdCcgJiZcbiAgICAgIHR5cGVvZiBzdWJqZWN0Lmxlbmd0aCA9PT0gJ251bWJlcidcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIHZhciBiID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBpZiAoYiA8PSAweDdGKVxuICAgICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkpXG4gICAgZWxzZSB7XG4gICAgICB2YXIgc3RhcnQgPSBpXG4gICAgICBpZiAoYiA+PSAweEQ4MDAgJiYgYiA8PSAweERGRkYpIGkrK1xuICAgICAgdmFyIGggPSBlbmNvZGVVUklDb21wb25lbnQoc3RyLnNsaWNlKHN0YXJ0LCBpKzEpKS5zdWJzdHIoMSkuc3BsaXQoJyUnKVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBoLmxlbmd0aDsgaisrKVxuICAgICAgICBieXRlQXJyYXkucHVzaChwYXJzZUludChoW2pdLCAxNikpXG4gICAgfVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KHN0cilcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBwb3NcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSlcbiAgICAgIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gZGVjb2RlVXRmOENoYXIgKHN0cikge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc3RyKVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSgweEZGRkQpIC8vIFVURiA4IGludmFsaWQgY2hhclxuICB9XG59XG5cbi8qXG4gKiBXZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSB2YWx1ZSBpcyBhIHZhbGlkIGludGVnZXIuIFRoaXMgbWVhbnMgdGhhdCBpdFxuICogaXMgbm9uLW5lZ2F0aXZlLiBJdCBoYXMgbm8gZnJhY3Rpb25hbCBjb21wb25lbnQgYW5kIHRoYXQgaXQgZG9lcyBub3RcbiAqIGV4Y2VlZCB0aGUgbWF4aW11bSBhbGxvd2VkIHZhbHVlLlxuICovXG5mdW5jdGlvbiB2ZXJpZnVpbnQgKHZhbHVlLCBtYXgpIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlID49IDAsICdzcGVjaWZpZWQgYSBuZWdhdGl2ZSB2YWx1ZSBmb3Igd3JpdGluZyBhbiB1bnNpZ25lZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA8PSBtYXgsICd2YWx1ZSBpcyBsYXJnZXIgdGhhbiBtYXhpbXVtIHZhbHVlIGZvciB0eXBlJylcbiAgYXNzZXJ0KE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSwgJ3ZhbHVlIGhhcyBhIGZyYWN0aW9uYWwgY29tcG9uZW50Jylcbn1cblxuZnVuY3Rpb24gdmVyaWZzaW50ICh2YWx1ZSwgbWF4LCBtaW4pIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGxhcmdlciB0aGFuIG1heGltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA+PSBtaW4sICd2YWx1ZSBzbWFsbGVyIHRoYW4gbWluaW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSwgJ3ZhbHVlIGhhcyBhIGZyYWN0aW9uYWwgY29tcG9uZW50Jylcbn1cblxuZnVuY3Rpb24gdmVyaWZJRUVFNzU0ICh2YWx1ZSwgbWF4LCBtaW4pIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGxhcmdlciB0aGFuIG1heGltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA+PSBtaW4sICd2YWx1ZSBzbWFsbGVyIHRoYW4gbWluaW11bSBhbGxvd2VkIHZhbHVlJylcbn1cblxuZnVuY3Rpb24gYXNzZXJ0ICh0ZXN0LCBtZXNzYWdlKSB7XG4gIGlmICghdGVzdCkgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UgfHwgJ0ZhaWxlZCBhc3NlcnRpb24nKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlclwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBsb29rdXAgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cbjsoZnVuY3Rpb24gKGV4cG9ydHMpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG4gIHZhciBBcnIgPSAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKVxuICAgID8gVWludDhBcnJheVxuICAgIDogQXJyYXlcblxuXHR2YXIgUExVUyAgID0gJysnLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIICA9ICcvJy5jaGFyQ29kZUF0KDApXG5cdHZhciBOVU1CRVIgPSAnMCcuY2hhckNvZGVBdCgwKVxuXHR2YXIgTE9XRVIgID0gJ2EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFVQUEVSICA9ICdBJy5jaGFyQ29kZUF0KDApXG5cblx0ZnVuY3Rpb24gZGVjb2RlIChlbHQpIHtcblx0XHR2YXIgY29kZSA9IGVsdC5jaGFyQ29kZUF0KDApXG5cdFx0aWYgKGNvZGUgPT09IFBMVVMpXG5cdFx0XHRyZXR1cm4gNjIgLy8gJysnXG5cdFx0aWYgKGNvZGUgPT09IFNMQVNIKVxuXHRcdFx0cmV0dXJuIDYzIC8vICcvJ1xuXHRcdGlmIChjb2RlIDwgTlVNQkVSKVxuXHRcdFx0cmV0dXJuIC0xIC8vbm8gbWF0Y2hcblx0XHRpZiAoY29kZSA8IE5VTUJFUiArIDEwKVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBOVU1CRVIgKyAyNiArIDI2XG5cdFx0aWYgKGNvZGUgPCBVUFBFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBVUFBFUlxuXHRcdGlmIChjb2RlIDwgTE9XRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gTE9XRVIgKyAyNlxuXHR9XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkgKGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG5cblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHR2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXHRcdHBsYWNlSG9sZGVycyA9ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAyKSA/IDIgOiAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMSkgPyAxIDogMFxuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gbmV3IEFycihiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGhcblxuXHRcdHZhciBMID0gMFxuXG5cdFx0ZnVuY3Rpb24gcHVzaCAodikge1xuXHRcdFx0YXJyW0wrK10gPSB2XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxOCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCAxMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA8PCA2KSB8IGRlY29kZShiNjQuY2hhckF0KGkgKyAzKSlcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNilcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpXG5cdFx0XHRwdXNoKCh0bXAgPj4gOCkgJiAweEZGKVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnJcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQgKHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGhcblxuXHRcdGZ1bmN0aW9uIGVuY29kZSAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwLmNoYXJBdChudW0pXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKVxuXHRcdH1cblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApXG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV1cblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz09J1xuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMTApXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPj4gNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9J1xuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXRcblx0fVxuXG5cdGV4cG9ydHMudG9CeXRlQXJyYXkgPSBiNjRUb0J5dGVBcnJheVxuXHRleHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0XG59KHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICh0aGlzLmJhc2U2NGpzID0ge30pIDogZXhwb3J0cykpXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbmV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sXG4gICAgICBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxLFxuICAgICAgZU1heCA9ICgxIDw8IGVMZW4pIC0gMSxcbiAgICAgIGVCaWFzID0gZU1heCA+PiAxLFxuICAgICAgbkJpdHMgPSAtNyxcbiAgICAgIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMCxcbiAgICAgIGQgPSBpc0xFID8gLTEgOiAxLFxuICAgICAgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXTtcblxuICBpICs9IGQ7XG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSk7XG4gIHMgPj49ICgtbkJpdHMpO1xuICBuQml0cyArPSBlTGVuO1xuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KTtcblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKTtcbiAgZSA+Pj0gKC1uQml0cyk7XG4gIG5CaXRzICs9IG1MZW47XG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpO1xuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhcztcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpO1xuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbik7XG4gICAgZSA9IGUgLSBlQmlhcztcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKTtcbn07XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbihidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgYyxcbiAgICAgIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDEsXG4gICAgICBlTWF4ID0gKDEgPDwgZUxlbikgLSAxLFxuICAgICAgZUJpYXMgPSBlTWF4ID4+IDEsXG4gICAgICBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMCksXG4gICAgICBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSksXG4gICAgICBkID0gaXNMRSA/IDEgOiAtMSxcbiAgICAgIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDA7XG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSk7XG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDA7XG4gICAgZSA9IGVNYXg7XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpO1xuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLTtcbiAgICAgIGMgKj0gMjtcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKTtcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKys7XG4gICAgICBjIC89IDI7XG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMDtcbiAgICAgIGUgPSBlTWF4O1xuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICAgIGUgPSBlICsgZUJpYXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICAgIGUgPSAwO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpO1xuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG07XG4gIGVMZW4gKz0gbUxlbjtcbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KTtcblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjg7XG59O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaWVlZTc1NFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3NcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgQm9keSA9IHJlcXVpcmUoJy4vYm9keScpXG52YXIgc2ltdWxhdGlvbiA9IHJlcXVpcmUoJy4vc2ltdWxhdGlvbicpXG52YXIgQm91bmRyeSA9IHJlcXVpcmUoJy4vYm91bmRyeScpXG52YXIgQW5pbWF0aW9uID0gcmVxdWlyZSgnLi9hbmltYXRpb24nKVxudmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJylcbnZhciBoZWlnaHQgPSByZXF1aXJlKCcuL3V0aWwnKS5oZWlnaHRcblxudmFyIEFjY2VsZXJhdGUgPSBtb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGlvbih7XG4gIGRlZmF1bHRPcHRpb25zOiB7XG4gICAgYWNjZWxlcmF0aW9uOiAxMDAwLFxuICAgIGJvdW5jZTogZmFsc2UsXG4gICAgbWluQm91bmNlRGlzdGFuY2U6IDUsXG4gICAgZGFtcGluZzogMC4yXG4gIH0sXG5cbiAgb25TdGFydDogZnVuY3Rpb24odmVsb2NpdHksIGZyb20sIHRvLCBvcHRzLCB1cGRhdGUsIGRvbmUpIHtcbiAgICB2YXIgZGlyZWN0aW9uID0gdG8uc3ViKGZyb20pLm5vcm1hbGl6ZSgpXG4gICAgdmFyIGFjY2VsZXJhdGlvbiA9IGRpcmVjdGlvbi5tdWx0KG9wdHMuYWNjZWxlcmF0aW9uKVxuICAgIHZhciBib3VuY2VBY2NlbGVyYXRpb24gPSBkaXJlY3Rpb24ubXVsdChvcHRzLmJvdW5jZUFjY2VsZXJhdGlvbiB8fCBvcHRzLmFjY2VsZXJhdGlvbilcbiAgICB2YXIgYm91bmRyeSA9IEJvdW5kcnkoe1xuICAgICAgbGVmdDogKHRvLnggPiBmcm9tLngpID8gLUluZmluaXR5IDogdG8ueCxcbiAgICAgIHJpZ2h0OiAodG8ueCA+IGZyb20ueCkgPyB0by54IDogSW5maW5pdHksXG4gICAgICB0b3A6ICh0by55ID4gZnJvbS55KSA/IC1JbmZpbml0eSA6IHRvLnksXG4gICAgICBib3R0b206ICh0by55ID4gZnJvbS55KSA/IHRvLnkgOiBJbmZpbml0eVxuICAgIH0pXG4gICAgdmFyIGJvdW5jaW5nXG5cbiAgICBpZih0by5zdWIoZnJvbSkubm9ybSgpIDwgLjAwMSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZS5kb25lKHRvLCB2ZWxvY2l0eSlcbiAgICB9XG5cbiAgICB2YXIgYm9keSA9IHRoaXMuX2JvZHkgPSBCb2R5KHZlbG9jaXR5LCBmcm9tLCB7XG4gICAgICBhY2NlbGVyYXRlOiBmdW5jdGlvbihzLCB0KSB7XG4gICAgICAgIGlmKGJvdW5jaW5nKVxuICAgICAgICAgIHJldHVybiBib3VuY2VBY2NlbGVyYXRpb25cbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBhY2NlbGVyYXRpb25cbiAgICAgIH0sXG4gICAgICB1cGRhdGU6IGZ1bmN0aW9uKHBvc2l0aW9uLCB2ZWxvY2l0eSkge1xuICAgICAgICBpZihib3VuZHJ5LmNvbnRhaW5zKHBvc2l0aW9uKSkge1xuICAgICAgICAgIHVwZGF0ZS5zdGF0ZShwb3NpdGlvbiwgdmVsb2NpdHkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYob3B0cy5ib3VuY2UgJiZcbiAgICAgICAgICAgICBNYXRoLmFicyhoZWlnaHQoYm91bmNlQWNjZWxlcmF0aW9uLm5vcm0oKSwgdmVsb2NpdHkubm9ybSgpICogb3B0cy5kYW1waW5nLCAwKSkgPiBvcHRzLm1pbkJvdW5jZURpc3RhbmNlKSB7XG4gICAgICAgICAgICAgIGJvdW5jaW5nID0gdHJ1ZVxuICAgICAgICAgICAgICBib2R5LnBvc2l0aW9uID0gVmVjdG9yKHRvKVxuICAgICAgICAgICAgICBib2R5LnZlbG9jaXR5LnNlbGZNdWx0KC1vcHRzLmRhbXBpbmcpXG4gICAgICAgICAgICAgIHVwZGF0ZS5zdGF0ZSh0bywgYm9keS52ZWxvY2l0eSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXBkYXRlLmRvbmUodG8sIHZlbG9jaXR5KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gICAgc2ltdWxhdGlvbi5hZGRCb2R5KHRoaXMuX2JvZHkpXG4gIH0sXG4gIG9uRW5kOiBmdW5jdGlvbigpIHtcbiAgICBzaW11bGF0aW9uLnJlbW92ZUJvZHkodGhpcy5fYm9keSlcbiAgfVxufSlcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvYWNjZWxlcmF0ZS5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ2xvZGFzaC5kZWZhdWx0cycpXG4gICwgUHJvbWlzZSA9IHdpbmRvdy5Qcm9taXNlIHx8IHJlcXVpcmUoJ3Byb21pc2UnKVxuICAsIEJvdW5kcnkgPSByZXF1aXJlKCcuL2JvdW5kcnknKVxuICAsIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJylcbiAgLCBFbWl0dGVyID0gcmVxdWlyZSgnY29tcG9uZW50LWVtaXR0ZXInKVxuXG52YXIgcHJvdG8gPSB7XG4gIHRvOiBmdW5jdGlvbih4LCB5KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEJvdW5kcnkpXG4gICAgICB0aGlzLl90byA9IHhcbiAgICBlbHNlXG4gICAgICB0aGlzLl90byA9IFZlY3Rvcih4LCB5KVxuICAgIHJldHVybiB0aGlzXG4gIH0sXG5cbiAgdmVsb2NpdHk6IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLl92ZWxvY2l0eSA9IFZlY3Rvcih4LCB5KVxuICAgIHJldHVybiB0aGlzXG4gIH0sXG5cbiAgZnJvbTogZnVuY3Rpb24oeCwgeSkge1xuICAgIHRoaXMuX2Zyb20gPSBWZWN0b3IoeCwgeSlcbiAgICByZXR1cm4gdGhpc1xuICB9LFxuXG4gIF91cGRhdGVTdGF0ZTogZnVuY3Rpb24ocG9zaXRpb24sIHZlbG9jaXR5KSB7XG4gICAgdGhpcy5fcGh5cy5wb3NpdGlvbihwb3NpdGlvbilcbiAgICB0aGlzLl9waHlzLnZlbG9jaXR5KHZlbG9jaXR5KVxuICB9LFxuXG4gIGNhbmNlbDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fb25FbmQoKVxuICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZVxuICAgIHRoaXMuX3JlamVjdCgpXG4gIH0sXG5cbiAgcnVubmluZzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3J1bm5pbmcgfHwgZmFsc2VcbiAgfSxcblxuICBzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgICAsIGZyb20gPSAodGhpcy5fZnJvbSkgPyB0aGlzLl9mcm9tIDogdGhpcy5fcGh5cy5wb3NpdGlvbigpXG4gICAgICAsIHRvID0gKHRoaXMuX3RvKSA/IHRoaXMuX3RvIDogdGhpcy5fcGh5cy5wb3NpdGlvbigpXG4gICAgICAsIHZlbG9jaXR5ID0gKHRoaXMuX3ZlbG9jaXR5KSA/IHRoaXMuX3ZlbG9jaXR5IDogdGhpcy5fcGh5cy52ZWxvY2l0eSgpXG4gICAgICAsIG9wdHMgPSBkZWZhdWx0cyh7fSwgdGhpcy5fb3B0cyB8fCB7fSwgdGhpcy5fZGVmYXVsdE9wdHMpXG5cbiAgICB2YXIgdXBkYXRlID0ge1xuICAgICAgc3RhdGU6IGZ1bmN0aW9uKHBvc2l0aW9uLCB2ZWxvY2l0eSkge1xuICAgICAgICB0aGF0Ll91cGRhdGVTdGF0ZShwb3NpdGlvbiwgdmVsb2NpdHkpXG4gICAgICB9LFxuICAgICAgZG9uZTogZnVuY3Rpb24ocG9zaXRpb24sIHZlbG9jaXR5KSB7XG4gICAgICAgIHRoYXQuX3VwZGF0ZVN0YXRlKHBvc2l0aW9uLCB2ZWxvY2l0eSlcbiAgICAgICAgdGhhdC5fb25FbmQoKVxuICAgICAgICB0aGF0Ll9ydW5uaW5nID0gZmFsc2VcbiAgICAgICAgdGhhdC5fcmVzb2x2ZSh7IHBvc2l0aW9uOiBwb3NpdGlvbiwgdmVsb2NpdHk6IHZlbG9jaXR5IH0pXG4gICAgICB9LFxuICAgICAgY2FuY2VsOiBmdW5jdGlvbihwb3NpdGlvbiwgdmVsb2NpdHkpIHtcbiAgICAgICAgdGhhdC5fdXBkYXRlU3RhdGUocG9zaXRpb24sIHZlbG9jaXR5KVxuICAgICAgICB0aGF0Ll9vbkVuZCgpXG4gICAgICAgIHRoYXQuX3J1bm5pbmcgPSBmYWxzZVxuICAgICAgICB0aGF0Ll9yZWplY3QoKVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9waHlzLl9zdGFydEFuaW1hdGlvbih0aGlzKVxuXG4gICAgdGhpcy5fcnVubmluZyA9IHRydWVcbiAgICBpZih0byBpbnN0YW5jZW9mIEJvdW5kcnkpXG4gICAgICB0byA9IHRvLm5lYXJlc3RJbnRlcnNlY3QoZnJvbSwgdmVsb2NpdHkpXG4gICAgdGhpcy5fb25TdGFydCh2ZWxvY2l0eSwgZnJvbSwgdG8sIG9wdHMsIHVwZGF0ZSlcblxuICAgIHJldHVybiB0aGF0Ll9lbmRlZFxuICB9XG59XG5cbmZ1bmN0aW9uIEFuaW1hdGlvbihjYWxsYmFja3MpIHtcbiAgdmFyIGFuaW1hdGlvbiA9IGZ1bmN0aW9uKHBoeXMsIG9wdHMpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB0aGlzLl9vcHRzID0gb3B0c1xuICAgIHRoaXMuX3BoeXMgPSBwaHlzXG4gICAgdGhpcy5fb25TdGFydCA9IGNhbGxiYWNrcy5vblN0YXJ0XG4gICAgdGhpcy5fb25FbmQgPSBjYWxsYmFja3Mub25FbmRcbiAgICB0aGlzLl9kZWZhdWx0T3B0cyA9IGNhbGxiYWNrcy5kZWZhdWx0T3B0aW9uc1xuXG4gICAgdGhpcy5fZW5kZWQgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHRoYXQuX3Jlc29sdmUgPSByZXNvbHZlXG4gICAgICB0aGF0Ll9yZWplY3QgPSByZWplY3RcbiAgICB9KVxuXG4gICAgdGhpcy5zdGFydCA9IHRoaXMuc3RhcnQuYmluZCh0aGlzKVxuICB9XG5cbiAgRW1pdHRlcihhbmltYXRpb24ucHJvdG90eXBlKVxuICBhbmltYXRpb24ucHJvdG90eXBlID0gcHJvdG9cblxuICByZXR1cm4gYW5pbWF0aW9uXG59XG5cblxuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBBbmltYXRpb25cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvYW5pbWF0aW9uLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnbG9kYXNoLmRlZmF1bHRzJylcbiAgLCBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG4gICwgc2ltdWxhdGlvbiA9IHJlcXVpcmUoJy4vc2ltdWxhdGlvbicpXG4gICwgQm9keSA9IHJlcXVpcmUoJy4vYm9keScpXG5cbnZhciBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgdGVuc2lvbjogMTAwLFxuICBkYW1waW5nOiAxMCxcbiAgc2VwZXJhdGlvbjogMCxcbiAgb2Zmc2V0OiB7IHg6IDAsIHk6IDAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEF0dGFjaFNwcmluZ1xuZnVuY3Rpb24gQXR0YWNoU3ByaW5nKHBoeXMsIGF0dGFjaG1lbnQsIG9wdHMpIHtcbiAgdGhpcy5fcGh5cyA9IHBoeXNcbiAgdGhpcy5fb3B0cyA9IGRlZmF1bHRzKHt9LCBvcHRzIHx8IHt9LCBkZWZhdWx0T3B0aW9ucylcbiAgdGhpcy5fcG9zaXRpb24gPSBwaHlzLnBvc2l0aW9uKClcbiAgdGhpcy5fdmVsb2NpdHkgPSBwaHlzLnZlbG9jaXR5KClcbiAgaWYodHlwZW9mIGF0dGFjaG1lbnQucG9zaXRpb24gPT09ICdmdW5jdGlvbicpXG4gICAgdGhpcy5fYXR0YWNobWVudCA9IGF0dGFjaG1lbnQucG9zaXRpb24uYmluZChhdHRhY2htZW50KVxuICBlbHNlXG4gICAgdGhpcy5fYXR0YWNobWVudCA9IGF0dGFjaG1lbnRcbn1cblxuQXR0YWNoU3ByaW5nLnByb3RvdHlwZS5wb3NpdGlvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3Bvc2l0aW9uXG4gIH1cbiAgaWYodGhpcy5fYm9keSlcbiAgICB0aGlzLl9ib2R5LnBvc2l0aW9uID0gdGhpcy5fcG9zaXRpb24gPSBWZWN0b3IoeCwgeSlcbiAgZWxzZVxuICAgIHRoaXMuX3Bvc2l0aW9uID0gVmVjdG9yKHgsIHkpXG59XG5cbkF0dGFjaFNwcmluZy5wcm90b3R5cGUudmVsb2NpdHkgPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKHRoaXMuX2JvZHkpXG4gICAgdGhpcy5fYm9keS52ZWxvY2l0eSA9IHRoaXMuX3ZlbG9jaXR5ID0gVmVjdG9yKHgsIHkpXG4gIGVsc2VcbiAgICB0aGlzLl92ZWxvY2l0eSA9IFZlY3Rvcih4LCB5KVxufVxuXG5BdHRhY2hTcHJpbmcucHJvdG90eXBlLmNhbmNlbCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgdGhpcy5fcnVubmluZyA9IGZhbHNlXG4gIHNpbXVsYXRpb24ucmVtb3ZlQm9keSh0aGlzLl9ib2R5KVxufVxuXG5BdHRhY2hTcHJpbmcucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHRoaXMuX3J1bm5pbmcgPSBmYWxzZVxuICBzaW11bGF0aW9uLnJlbW92ZUJvZHkodGhpcy5fYm9keSlcbn1cblxuQXR0YWNoU3ByaW5nLnByb3RvdHlwZS5ydW5uaW5nID0gZnVuY3Rpb24oeCwgeSkge1xuICByZXR1cm4gdGhpcy5fcnVubmluZ1xufVxuXG53aW5kb3cudW5pdCA9IDBcbkF0dGFjaFNwcmluZy5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGF0dGFjaG1lbnQgPSB0aGlzLl9hdHRhY2htZW50XG4gICAgLCBvcHRzID0gdGhpcy5fb3B0c1xuICAgICwgcGh5cyA9IHRoaXMuX3BoeXNcbiAgICAsIHZlbG9jaXR5ID0gdGhpcy5fdmVsb2NpdHlcbiAgICAsIHBvc2l0aW9uID0gdGhpcy5fcG9zaXRpb25cbiAgICAsIHRoYXQgPSB0aGlzXG5cbiAgcGh5cy5fc3RhcnRBbmltYXRpb24odGhpcylcblxuICB0aGlzLl9ydW5uaW5nID0gdHJ1ZVxuXG4gIHZhciBib2R5ID0gdGhpcy5fYm9keSA9IEJvZHkodmVsb2NpdHksIHBvc2l0aW9uLCB7XG4gICAgYWNjZWxlcmF0ZTogZnVuY3Rpb24oc3RhdGUsIHQpIHtcbiAgICAgIHZhciBkaXN0VmVjID0gc3RhdGUucG9zaXRpb24uc2VsZlN1YihhdHRhY2htZW50KCkpXG4gICAgICAgICwgZGlzdCA9IGRpc3RWZWMubm9ybSgpXG4gICAgICAgICwgZGlzdE5vcm0gPSBkaXN0VmVjLm5vcm1hbGl6ZSgpXG5cbiAgICAgIGlmKGRpc3ROb3JtLnggPT09IDAgJiYgZGlzdE5vcm0ueSA9PT0gMCkge1xuICAgICAgICBkaXN0Tm9ybS54ID0gZGlzdE5vcm0ueSA9IDFcbiAgICAgICAgZGlzdE5vcm0ubm9ybWFsaXplKClcbiAgICAgIH1cbiAgICAgIHZhciBhY2NlbCA9IGRpc3ROb3JtXG4gICAgICAgIC5zZWxmTXVsdCgtb3B0cy50ZW5zaW9uKVxuICAgICAgICAuc2VsZk11bHQoZGlzdCAtIG9wdHMuc2VwZXJhdGlvbilcbiAgICAgICAgLnNlbGZTdWIoc3RhdGUudmVsb2NpdHkuc2VsZk11bHQob3B0cy5kYW1waW5nKSlcblxuICAgICAgcmV0dXJuIGFjY2VsXG4gICAgfSxcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKHBvc2l0aW9uLCB2ZWxvY2l0eSkge1xuICAgICAgdGhhdC5fcG9zaXRpb24gPSBib2R5LnBvc2l0aW9uXG4gICAgICB0aGF0Ll92ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcbiAgICAgIGlmKG9wdHMub2Zmc2V0KSB7XG4gICAgICAgIHZhciBwb3MgPSBwb3NpdGlvbi5hZGQob3B0cy5vZmZzZXQpXG4gICAgICAgIHBoeXMucG9zaXRpb24ocG9zKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGh5cy5wb3NpdGlvbihwb3NpdGlvbilcbiAgICAgIH1cbiAgICAgIHBoeXMudmVsb2NpdHkodmVsb2NpdHkpXG4gICAgfVxuICB9KVxuICBzaW11bGF0aW9uLmFkZEJvZHkoYm9keSlcbiAgcmV0dXJuIHRoaXNcbn1cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2F0dGFjaC1zcHJpbmcuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJvZHlcblxuZnVuY3Rpb24gQm9keSh2ZWwsIGZyb20sIGZucykge1xuICBpZighKHRoaXMgaW5zdGFuY2VvZiBCb2R5KSkgcmV0dXJuIG5ldyBCb2R5KHZlbCwgZnJvbSwgZm5zKVxuXG4gIHRoaXMucHJldmlvdXNQb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gPSBWZWN0b3IoZnJvbSlcbiAgdGhpcy52ZWxvY2l0eSA9IFZlY3Rvcih2ZWwpXG4gIHRoaXMuX2ZucyA9IGZuc1xufVxuXG5Cb2R5LnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihhbHBoYSkge1xuICB2YXIgcG9zID0gdGhpcy5wcmV2aW91c1Bvc2l0aW9uLmNsb25lKCkubGVycCh0aGlzLnBvc2l0aW9uLCBhbHBoYSlcbiAgdGhpcy5fZm5zLnVwZGF0ZShwb3MsIHRoaXMudmVsb2NpdHkpXG59XG5cbkJvZHkucHJvdG90eXBlLmFjY2VsZXJhdGUgPSBmdW5jdGlvbihzdGF0ZSwgdCkge1xuICByZXR1cm4gdGhpcy5fZm5zLmFjY2VsZXJhdGUoc3RhdGUsIHQpXG59XG5cbkJvZHkucHJvdG90eXBlLmF0UmVzdCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy52ZWxvY2l0eS5ub3JtKCkgPCAuMDFcbn1cblxuQm9keS5wcm90b3R5cGUuYXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHBvcykge1xuICAvL3JldHVybiB3aGV0aGVyIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoaXMucG9zaXRpb24gYW5kIHBvcyBpcyBsZXNzIHRoYW4gLjFcbiAgcmV0dXJuIHRoaXMucG9zaXRpb24uc3ViKFZlY3Rvcihwb3MpKS5ub3JtKCkgPCAuMDFcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvYm9keS5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG5tb2R1bGUuZXhwb3J0cyA9IEJvdW5kcnlcblxuZnVuY3Rpb24gcG9pbnRCZXR3ZWVuKHAsIHAxLCBwMikge1xuICByZXR1cm4gcCA+PSBwMSAmJiBwIDw9IHAyXG59XG5cbmZ1bmN0aW9uIHlJbnRlcnNlY3QoeSwgcG9pbnQsIGRpcmVjdGlvbikge1xuICB2YXIgZmFjdG9yID0gKHkgLSBwb2ludC55KSAvIGRpcmVjdGlvbi55XG4gIHJldHVybiBwb2ludC5hZGQoZGlyZWN0aW9uLmNsb25lKCkubXVsdChmYWN0b3IpKVxufVxuXG5mdW5jdGlvbiB4SW50ZXJzZWN0KHgsIHBvaW50LCBkaXJlY3Rpb24pIHtcbiAgdmFyIGZhY3RvciA9ICh4IC0gcG9pbnQueCkgLyBkaXJlY3Rpb24ueFxuICByZXR1cm4gcG9pbnQuYWRkKGRpcmVjdGlvbi5jbG9uZSgpLm11bHQoZmFjdG9yKSlcbn1cblxuQm91bmRyeS5wcm90b3R5cGUuYXBwbHlEYW1waW5nID0gZnVuY3Rpb24ocG9zaXRpb24sIGRhbXBpbmcpIHtcbiAgdmFyIHggPSBwb3NpdGlvbi54XG4gICAgLCB5ID0gcG9zaXRpb24ueVxuXG4gIGlmKHggPCB0aGlzLmxlZnQpXG4gICAgeCA9IHRoaXMubGVmdCAtICh0aGlzLmxlZnQgLSB4KSAqIGRhbXBpbmdcblxuICBpZih5IDwgdGhpcy50b3ApXG4gICAgeSA9IHRoaXMudG9wIC0gKHRoaXMudG9wIC0geSkgKiBkYW1waW5nXG5cbiAgaWYoeCA+IHRoaXMucmlnaHQpXG4gICAgeCA9IHRoaXMucmlnaHQgLSAodGhpcy5yaWdodCAtIHgpICogZGFtcGluZ1xuXG4gIGlmKHkgPiB0aGlzLmJvdHRvbSlcbiAgICB5ID0gdGhpcy5ib3R0b20gLSAodGhpcy5ib3R0b20gLSB5KSAqIGRhbXBpbmdcblxuICByZXR1cm4gVmVjdG9yKHgsIHkpXG59XG5cbmZ1bmN0aW9uIEJvdW5kcnkoYm91bmRyeSkge1xuICBpZighKHRoaXMgaW5zdGFuY2VvZiBCb3VuZHJ5KSlcbiAgICByZXR1cm4gbmV3IEJvdW5kcnkoYm91bmRyeSlcblxuICB0aGlzLmxlZnQgPSAodHlwZW9mIGJvdW5kcnkubGVmdCAhPT0gJ3VuZGVmaW5lZCcpID8gYm91bmRyeS5sZWZ0IDogLUluZmluaXR5XG4gIHRoaXMucmlnaHQgPSAodHlwZW9mIGJvdW5kcnkucmlnaHQgIT09ICd1bmRlZmluZWQnKSA/IGJvdW5kcnkucmlnaHQgOiBJbmZpbml0eVxuICB0aGlzLnRvcCA9ICh0eXBlb2YgYm91bmRyeS50b3AgIT09ICd1bmRlZmluZWQnKSA/IGJvdW5kcnkudG9wIDogLUluZmluaXR5XG4gIHRoaXMuYm90dG9tID0gKHR5cGVvZiBib3VuZHJ5LmJvdHRvbSAhPT0gJ3VuZGVmaW5lZCcpID8gYm91bmRyeS5ib3R0b20gOiBJbmZpbml0eVxufVxuXG5Cb3VuZHJ5LnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uKHB0KSB7XG4gIHJldHVybiBwdC54ID49IHRoaXMubGVmdCAmJlxuICAgICAgICAgcHQueCA8PSB0aGlzLnJpZ2h0ICYmXG4gICAgICAgICBwdC55ID49IHRoaXMudG9wICYmXG4gICAgICAgICBwdC55IDw9IHRoaXMuYm90dG9tXG59XG5cbkJvdW5kcnkucHJvdG90eXBlLm5lYXJlc3RJbnRlcnNlY3QgPSBmdW5jdGlvbihwb2ludCwgdmVsb2NpdHkpIHtcbiAgdmFyIGRpcmVjdGlvbiA9IFZlY3Rvcih2ZWxvY2l0eSkubm9ybWFsaXplKClcbiAgICAsIHBvaW50ID0gVmVjdG9yKHBvaW50KVxuICAgICwgaXNlY3RcbiAgICAsIGRpc3RYXG4gICAgLCBkaXN0WVxuXG4gIGlmKHZlbG9jaXR5LnkgPCAwKVxuICAgIGlzZWN0ID0geUludGVyc2VjdCh0aGlzLnRvcCwgcG9pbnQsIGRpcmVjdGlvbilcbiAgaWYodmVsb2NpdHkueSA+IDApXG4gICAgaXNlY3QgPSB5SW50ZXJzZWN0KHRoaXMuYm90dG9tLCBwb2ludCwgZGlyZWN0aW9uKVxuXG4gIGlmKGlzZWN0ICYmIHBvaW50QmV0d2Vlbihpc2VjdC54LCB0aGlzLmxlZnQsIHRoaXMucmlnaHQpKVxuICAgIHJldHVybiBpc2VjdFxuXG4gIGlmKHZlbG9jaXR5LnggPCAwKVxuICAgIGlzZWN0ID0geEludGVyc2VjdCh0aGlzLmxlZnQsIHBvaW50LCBkaXJlY3Rpb24pXG4gIGlmKHZlbG9jaXR5LnggPiAwKVxuICAgIGlzZWN0ID0geEludGVyc2VjdCh0aGlzLnJpZ2h0LCBwb2ludCwgZGlyZWN0aW9uKVxuXG4gIGlmKGlzZWN0ICYmIHBvaW50QmV0d2Vlbihpc2VjdC55LCB0aGlzLnRvcCwgdGhpcy5ib3R0b20pKVxuICAgIHJldHVybiBpc2VjdFxuXG4gIC8vaWYgdGhlIHZlbG9jaXR5IGlzIHplcm8sIG9yIGl0IGRpZG4ndCBpbnRlcnNlY3QgYW55IGxpbmVzIChvdXRzaWRlIHRoZSBib3gpXG4gIC8vanVzdCBzZW5kIGl0IGl0IHRoZSBuZWFyZXN0IGJvdW5kcnlcbiAgZGlzdFggPSAoTWF0aC5hYnMocG9pbnQueCAtIHRoaXMubGVmdCkgPCBNYXRoLmFicyhwb2ludC54IC0gdGhpcy5yaWdodCkpID8gdGhpcy5sZWZ0IDogdGhpcy5yaWdodFxuICBkaXN0WSA9IChNYXRoLmFicyhwb2ludC55IC0gdGhpcy50b3ApIDwgTWF0aC5hYnMocG9pbnQueSAtIHRoaXMuYm90dG9tKSkgPyB0aGlzLnRvcCA6IHRoaXMuYm90dG9tXG5cbiAgcmV0dXJuIChkaXN0WCA8IGRpc3RZKSA/IFZlY3RvcihkaXN0WCwgcG9pbnQueSkgOiBWZWN0b3IocG9pbnQueCwgZGlzdFkpXG59XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9ib3VuZHJ5LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIEJvZHkgPSByZXF1aXJlKCcuL2JvZHknKVxudmFyIHNpbXVsYXRpb24gPSByZXF1aXJlKCcuL3NpbXVsYXRpb24nKVxudmFyIEJvdW5kcnkgPSByZXF1aXJlKCcuL2JvdW5kcnknKVxudmFyIEFuaW1hdGlvbiA9IHJlcXVpcmUoJy4vYW5pbWF0aW9uJylcblxudmFyIERlY2VsZXJhdGUgPSBtb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGlvbih7XG4gIGRlZmF1bHRPcHRpb25zOiB7XG4gICAgZGVjZWxlcmF0aW9uOiA0MDBcbiAgfSxcbiAgb25TdGFydDogZnVuY3Rpb24odmVsb2NpdHksIGZyb20sIHRvLCBvcHRzLCB1cGRhdGUsIGRvbmUpIHtcbiAgICB2YXIgZGlyZWN0aW9uID0gdG8uc3ViKGZyb20pLm5vcm1hbGl6ZSgpXG4gICAgICAsIGRlY2VsZXJhdGlvbiA9IGRpcmVjdGlvbi5tdWx0KG9wdHMuZGVjZWxlcmF0aW9uKS5uZWdhdGUoKVxuICAgICAgLCBib3VuZHJ5ID0gQm91bmRyeSh7XG4gICAgICBsZWZ0OiBNYXRoLm1pbih0by54LCBmcm9tLngpLFxuICAgICAgcmlnaHQ6IE1hdGgubWF4KHRvLngsIGZyb20ueCksXG4gICAgICB0b3A6IE1hdGgubWluKHRvLnksIGZyb20ueSksXG4gICAgICBib3R0b206IE1hdGgubWF4KHRvLnksIGZyb20ueSlcbiAgICB9KVxuXG4gICAgdmVsb2NpdHkgPSBkaXJlY3Rpb24ubXVsdCh2ZWxvY2l0eS5ub3JtKCkpXG5cbiAgICB0aGlzLl9ib2R5ID0gQm9keSh2ZWxvY2l0eSwgZnJvbSwge1xuICAgICAgYWNjZWxlcmF0ZTogZnVuY3Rpb24ocywgdCkge1xuICAgICAgICByZXR1cm4gZGVjZWxlcmF0aW9uXG4gICAgICB9LFxuICAgICAgdXBkYXRlOiBmdW5jdGlvbihwb3NpdGlvbiwgdmVsb2NpdHkpIHtcbiAgICAgICAgaWYoIWRpcmVjdGlvbi5kaXJlY3Rpb25FcXVhbCh2ZWxvY2l0eSkpIHtcbiAgICAgICAgICB1cGRhdGUuY2FuY2VsKHBvc2l0aW9uLCB7IHg6IDAsIHk6IDAgfSlcbiAgICAgICAgfSBlbHNlIGlmKGJvdW5kcnkuY29udGFpbnMocG9zaXRpb24pKSB7XG4gICAgICAgICAgdXBkYXRlLnN0YXRlKHBvc2l0aW9uLCB2ZWxvY2l0eSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGUuZG9uZSh0bywgdmVsb2NpdHkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICAgIHNpbXVsYXRpb24uYWRkQm9keSh0aGlzLl9ib2R5KVxuICB9LFxuXG4gIG9uRW5kOiBmdW5jdGlvbigpIHtcbiAgICBzaW11bGF0aW9uLnJlbW92ZUJvZHkodGhpcy5fYm9keSlcbiAgfVxufSlcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvZGVjZWxlcmF0ZS5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBFbWl0dGVyID0gcmVxdWlyZSgnY29tcG9uZW50LWVtaXR0ZXInKVxuICAsIGRlZmF1bHRzID0gcmVxdWlyZSgnbG9kYXNoLmRlZmF1bHRzJylcblxudmFyIGRlZmF1bHRPcHRzID0ge31cblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnXG5cbmZ1bmN0aW9uIERyYWcocGh5cywgb3B0cywgc3RhcnQpIHtcbiAgdmFyIGhhbmRsZXNcblxuICB0aGlzLl9waHlzID0gcGh5c1xuICBpZih0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMuX3N0YXJ0Rm4gPSBvcHRzXG4gICAgb3B0cyA9IHt9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fc3RhcnRGbiA9IHN0YXJ0XG4gIH1cblxuICB0aGlzLl9vcHRzID0gZGVmYXVsdHMoe30sIGRlZmF1bHRPcHRzLCBvcHRzKVxuICBoYW5kbGVzID0gdGhpcy5fb3B0cy5oYW5kbGVcblxuXG4gIGlmKGhhbmRsZXMgJiYgIWhhbmRsZXMubGVuZ3RoKSB7XG4gICAgaGFuZGxlcyA9IFtoYW5kbGVzXVxuICB9IGVsc2UgaWYoaGFuZGxlcyAmJiBoYW5kbGVzLmxlbmd0aCkge1xuICAgIGhhbmRsZXMgPSBbXS5zbGljZS5jYWxsKGhhbmRsZXMpXG4gIH0gZWxzZSB7XG4gICAgaGFuZGxlcyA9IHBoeXMuZWxzXG4gIH1cbiAgaGFuZGxlcy5mb3JFYWNoKHRoaXMuX3NldHVwSGFuZGxlLCB0aGlzKVxufVxuXG5FbWl0dGVyKERyYWcucHJvdG90eXBlKVxuXG5EcmFnLnByb3RvdHlwZS5tb3ZlZCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5fbW92ZWRcbn1cblxuRHJhZy5wcm90b3R5cGUuX3NldHVwSGFuZGxlID0gZnVuY3Rpb24oZWwpIHtcbiAgLy9zdGFydCBldmVudHNcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX3N0YXJ0LmJpbmQodGhpcykpXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX3N0YXJ0LmJpbmQodGhpcykpXG5cbiAgLy9tb3ZlIGV2ZW50c1xuICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLl9tb3ZlLmJpbmQodGhpcykpXG4gIC8vYXBwbHkgdGhlIG1vdmUgZXZlbnQgdG8gdGhlIHdpbmRvdywgc28gaXQga2VlcHMgbW92aW5nLFxuICAvL2V2ZW50IGlmIHRoZSBoYW5kbGUgZG9lc24ndFxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5fbW92ZS5iaW5kKHRoaXMpKVxuXG4gIC8vZW5kIGV2ZW50c1xuICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuX2VuZC5iaW5kKHRoaXMpKVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX2VuZC5iaW5kKHRoaXMpKVxufVxuXG5EcmFnLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbihldnQpIHtcbiAgZXZ0LnByZXZlbnREZWZhdWx0KClcbiAgdGhpcy5fbW91c2Vkb3duID0gdHJ1ZVxuICB0aGlzLl9tb3ZlZCA9IGZhbHNlXG4gIHRoaXMuX2ludGVyYWN0aW9uID0gdGhpcy5fcGh5cy5pbnRlcmFjdCh7XG4gICAgYm91bmRyeTogdGhpcy5fb3B0cy5ib3VuZHJ5LFxuICAgIGRhbXBpbmc6IHRoaXMuX29wdHMuZGFtcGluZyxcbiAgICBkaXJlY3Rpb246IHRoaXMuX29wdHMuZGlyZWN0aW9uXG4gIH0pXG4gIHZhciBwcm9taXNlID0gdGhpcy5faW50ZXJhY3Rpb24uc3RhcnQoZXZ0KVxuICB0aGlzLl9zdGFydEZuICYmIHRoaXMuX3N0YXJ0Rm4ocHJvbWlzZSlcbiAgdGhpcy5lbWl0KCdzdGFydCcsIGV2dClcbn1cblxuRHJhZy5wcm90b3R5cGUuX21vdmUgPSBmdW5jdGlvbihldnQpIHtcbiAgaWYoIXRoaXMuX21vdXNlZG93bikgcmV0dXJuXG4gIGV2dC5wcmV2ZW50RGVmYXVsdCgpXG4gIHRoaXMuX21vdmVkID0gdHJ1ZVxuXG4gIHRoaXMuX2ludGVyYWN0aW9uLnVwZGF0ZShldnQpXG4gIHRoaXMuZW1pdCgnbW92ZScsIGV2dClcbn1cblxuRHJhZy5wcm90b3R5cGUuX2VuZCA9IGZ1bmN0aW9uKGV2dCkge1xuICBpZighdGhpcy5fbW91c2Vkb3duKSByZXR1cm5cbiAgZXZ0LnByZXZlbnREZWZhdWx0KClcblxuICB0aGlzLl9tb3VzZWRvd24gPSBmYWxzZVxuXG4gIHRoaXMuX2ludGVyYWN0aW9uLmVuZCgpXG4gIHRoaXMuZW1pdCgnZW5kJywgZXZ0KVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9kcmFnLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIHNpbXVsYXRpb24gPSByZXF1aXJlKCcuL3NpbXVsYXRpb24nKVxudmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJylcbnZhciBSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKVxudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnbG9kYXNoLmRlZmF1bHRzJylcbnZhciBTcHJpbmcgPSByZXF1aXJlKCcuL3NwcmluZycpXG52YXIgQXR0YWNoU3ByaW5nID0gcmVxdWlyZSgnLi9hdHRhY2gtc3ByaW5nJylcbnZhciBEZWNlbGVyYXRlID0gcmVxdWlyZSgnLi9kZWNlbGVyYXRlJylcbnZhciBBY2NlbGVyYXRlID0gcmVxdWlyZSgnLi9hY2NlbGVyYXRlJylcbnZhciBEcmFnID0gcmVxdWlyZSgnLi9kcmFnJylcbnZhciBJbnRlcmFjdCA9IHJlcXVpcmUoJy4vaW50ZXJhY3QnKVxudmFyIEJvdW5kcnkgPSByZXF1aXJlKCcuL2JvdW5kcnknKVxudmFyIFByb21pc2UgPSB3aW5kb3cuUHJvbWlzZSB8fCByZXF1aXJlKCdwcm9taXNlJylcblxubW9kdWxlLmV4cG9ydHMgPSBQaHlzaWNzXG5cbmZ1bmN0aW9uIFBoeXNpY3MocmVuZGVyZXJPckVscykge1xuICBpZighKHRoaXMgaW5zdGFuY2VvZiBQaHlzaWNzKSkge1xuICAgIHJldHVybiBuZXcgUGh5c2ljcyhyZW5kZXJlck9yRWxzKVxuICB9XG4gIGlmKHR5cGVvZiByZW5kZXJlck9yRWxzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5fcmVuZGVyID0gcmVuZGVyZXJPckVsc1xuICAgIHRoaXMuZWxzID0gW11cbiAgfSBlbHNlIHtcbiAgICBpZihyZW5kZXJlck9yRWxzLmxlbmd0aClcbiAgICAgIHRoaXMuZWxzID0gW10uc2xpY2UuY2FsbChyZW5kZXJlck9yRWxzKVxuICAgIGVsc2VcbiAgICAgIHRoaXMuZWxzID0gW3JlbmRlcmVyT3JFbHNdXG5cbiAgICB0aGlzLl9yZW5kZXJlciA9IG5ldyBSZW5kZXJlcih0aGlzLmVscylcbiAgICB0aGlzLl9yZW5kZXIgPSB0aGlzLl9yZW5kZXJlci51cGRhdGUuYmluZCh0aGlzLl9yZW5kZXJlcilcbiAgfVxuXG4gIHRoaXMuX3Bvc2l0aW9uID0gVmVjdG9yKDAsIDApXG4gIHRoaXMuX3ZlbG9jaXR5ID0gVmVjdG9yKDAsIDApXG59XG5cblBoeXNpY3MuQm91bmRyeSA9IEJvdW5kcnlcblBoeXNpY3MuVmVjdG9yID0gVmVjdG9yXG5QaHlzaWNzLlByb21pc2UgPSBQcm9taXNlXG5cblBoeXNpY3MucHJvdG90eXBlLnN0eWxlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX3JlbmRlcmVyLnN0eWxlLmFwcGx5KHRoaXMuX3JlbmRlcmVyLCBhcmd1bWVudHMpXG4gIHJldHVybiB0aGlzXG59XG5cblBoeXNpY3MucHJvdG90eXBlLnZpc2libGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fcmVuZGVyZXIudmlzaWJsZS5hcHBseSh0aGlzLl9yZW5kZXJlciwgYXJndW1lbnRzKVxuICByZXR1cm4gdGhpc1xufVxuXG5QaHlzaWNzLnByb3RvdHlwZS5kaXJlY3Rpb24gPSBmdW5jdGlvbihkKSB7XG4gIHZhciB2ZWxvY2l0eSA9IHRoaXMudmVsb2NpdHkoKVxuICAgICwgaCwgdiwgY1xuXG4gIGlmKHZlbG9jaXR5LnggPCAwKSAgICAgIGggPSAnbGVmdCdcbiAgZWxzZSBpZih2ZWxvY2l0eS54ID4gMCkgaCA9ICdyaWdodCdcblxuICBpZih2ZWxvY2l0eS55IDwgMCkgICAgICB2ID0gJ3VwJ1xuICBlbHNlIGlmKHZlbG9jaXR5LnkgPiAwKSB2ID0gJ2Rvd24nXG5cbiAgdmFyIGMgPSBoICsgKHYgfHwgJycpLnRvVXBwZXJDYXNlKClcblxuICByZXR1cm4gZCA9PT0gaCB8fCBkID09PSB2IHx8IGQgPT09IGNcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuYXRSZXN0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2ZWxvY2l0eSA9IHRoaXMudmVsb2NpdHkoKVxuICByZXR1cm4gdmVsb2NpdHkueCA9PT0gMCAmJiB2ZWxvY2l0eS55ID09PSAwXG59XG5cblBoeXNpY3MucHJvdG90eXBlLl9zdGFydEFuaW1hdGlvbiA9IGZ1bmN0aW9uKGFuaW1hdGlvbikge1xuICBpZih0aGlzLl9jdXJyZW50QW5pbWF0aW9uICYmIHRoaXMuX2N1cnJlbnRBbmltYXRpb24ucnVubmluZygpKSB7XG4gICAgdGhpcy5fY3VycmVudEFuaW1hdGlvbi5jYW5jZWwoKVxuICB9XG4gIHRoaXMuX2N1cnJlbnRBbmltYXRpb24gPSBhbmltYXRpb25cbn1cblxuUGh5c2ljcy5wcm90b3R5cGUudmVsb2NpdHkgPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fdmVsb2NpdHlcbiAgdGhpcy5fdmVsb2NpdHkgPSBWZWN0b3IoeCwgeSlcbiAgcmV0dXJuIHRoaXNcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUucG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fcG9zaXRpb24uY2xvbmUoKVxuICB0aGlzLl9wb3NpdGlvbiA9IFZlY3Rvcih4LCB5KVxuICB0aGlzLl9yZW5kZXIodGhpcy5fcG9zaXRpb24ueCwgdGhpcy5fcG9zaXRpb24ueSlcbiAgcmV0dXJuIHRoaXNcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuaW50ZXJhY3QgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHJldHVybiBuZXcgSW50ZXJhY3QodGhpcywgb3B0cylcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuZHJhZyA9IGZ1bmN0aW9uKG9wdHMsIHN0YXJ0KSB7XG4gIHJldHVybiBuZXcgRHJhZyh0aGlzLCBvcHRzLCBzdGFydClcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuc3ByaW5nID0gZnVuY3Rpb24ob3B0cykge1xuICByZXR1cm4gbmV3IFNwcmluZyh0aGlzLCBvcHRzKVxufVxuXG5QaHlzaWNzLnByb3RvdHlwZS5kZWNlbGVyYXRlID0gZnVuY3Rpb24ob3B0cykge1xuICByZXR1cm4gbmV3IERlY2VsZXJhdGUodGhpcywgb3B0cylcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuYWNjZWxlcmF0ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgcmV0dXJuIG5ldyBBY2NlbGVyYXRlKHRoaXMsIG9wdHMpXG59XG5cblBoeXNpY3MucHJvdG90eXBlLmF0dGFjaFNwcmluZyA9IGZ1bmN0aW9uKGF0dGFjaG1lbnQsIG9wdHMpIHtcbiAgcmV0dXJuIG5ldyBBdHRhY2hTcHJpbmcodGhpcywgYXR0YWNobWVudCwgb3B0cylcbn1cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnbG9kYXNoLmRlZmF1bHRzJylcbnZhciBWZWxvY2l0eSA9IHJlcXVpcmUoJ3RvdWNoLXZlbG9jaXR5JylcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ1Byb21pc2UnKVxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIEJvdW5kcnkgPSByZXF1aXJlKCcuL2JvdW5kcnknKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyYWN0XG5cbnZhciBkZWZhdWx0T3B0cyA9IHtcbiAgYm91bmRyeTogQm91bmRyeSh7fSksXG4gIGRhbXBpbmc6IDAsXG4gIGRpcmVjdGlvbjogJ2JvdGgnXG59XG5cbmZ1bmN0aW9uIEludGVyYWN0KHBoeXMsIG9wdHMpIHtcbiAgdGhpcy5fcGh5cyA9IHBoeXNcbiAgdGhpcy5fcnVubmluZyA9IGZhbHNlXG4gIHRoaXMuX29wdHMgPSBkZWZhdWx0cyh7fSwgb3B0cywgZGVmYXVsdE9wdHMpXG59XG5cbkludGVyYWN0LnByb3RvdHlwZS5wb3NpdGlvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgdmFyIGRpcmVjdGlvbiA9IHRoaXMuX29wdHMuZGlyZWN0aW9uXG4gICAgLCBib3VuZHJ5ID0gdGhpcy5fb3B0cy5ib3VuZHJ5XG4gICAgLCBwb3MgPSBWZWN0b3IoeCwgeSlcblxuICBpZihkaXJlY3Rpb24gIT09ICdib3RoJyAmJiBkaXJlY3Rpb24gIT09ICdob3Jpem9udGFsJykgcG9zLnggPSAwXG4gIGlmKGRpcmVjdGlvbiAhPT0gJ2JvdGgnICYmIGRpcmVjdGlvbiAhPT0gJ3ZlcnRpY2FsJykgcG9zLnkgPSAwXG5cbiAgdGhpcy5fdmVsb1gudXBkYXRlUG9zaXRpb24ocG9zLngpXG4gIHRoaXMuX3ZlbG9ZLnVwZGF0ZVBvc2l0aW9uKHBvcy55KVxuXG4gIHRoaXMuX3BoeXMudmVsb2NpdHkodGhpcy5fdmVsb1guZ2V0VmVsb2NpdHkoKSwgdGhpcy5fdmVsb1kuZ2V0VmVsb2NpdHkoKSlcblxuICBwb3MgPSBib3VuZHJ5LmFwcGx5RGFtcGluZyhwb3MsIHRoaXMuX29wdHMuZGFtcGluZylcblxuXG4gIHRoaXMuX3BoeXMucG9zaXRpb24ocG9zKVxuXG4gIHJldHVybiB0aGlzXG59XG5cbkludGVyYWN0LnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihldnQpIHtcbiAgLy9mb3IganF1ZXJ5IGFuZCBoYW1tZXIuanNcbiAgZXZ0ID0gZXZ0Lm9yaWdpbmFsRXZlbnQgfHwgZXZ0XG4gIHZhciBwb3NpdGlvbiA9IHV0aWwuZXZlbnRWZWN0b3IoZXZ0KS5zdWIodGhpcy5fc3RhcnRQb3NpdGlvbilcblxuICB0aGlzLnBvc2l0aW9uKHBvc2l0aW9uKVxuICByZXR1cm4gdGhpc1xufVxuXG5JbnRlcmFjdC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbihldnQpIHtcbiAgdmFyIHRoYXQgPSB0aGlzXG4gICAgLCBldnRQb3NpdGlvbiA9IGV2dCAmJiB1dGlsLmV2ZW50VmVjdG9yKGV2dClcbiAgICAsIHBvc2l0aW9uID0gdGhpcy5fcGh5cy5wb3NpdGlvbigpXG5cbiAgdGhpcy5fcnVubmluZyA9IHRydWVcbiAgdGhpcy5fcGh5cy5fc3RhcnRBbmltYXRpb24odGhpcylcbiAgdGhpcy5fc3RhcnRQb3NpdGlvbiA9IGV2dCAmJiBldnRQb3NpdGlvbi5zdWIocG9zaXRpb24pXG5cbiAgdGhpcy5fdmVsb1ggPSBuZXcgVmVsb2NpdHkoKVxuICB0aGlzLl92ZWxvWSA9IG5ldyBWZWxvY2l0eSgpXG5cbiAgdGhpcy5wb3NpdGlvbihwb3NpdGlvbilcblxuICByZXR1cm4gdGhpcy5fZW5kZWQgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXMsIHJlaikge1xuICAgIHRoYXQuX3Jlc29sdmUgPSByZXNcbiAgICB0aGF0Ll9yZWplY3QgPSByZWpcbiAgfSlcbn1cblxuSW50ZXJhY3QucHJvdG90eXBlLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9ydW5uaW5nID0gZmFsc2VcbiAgdGhpcy5fcmVqZWN0KG5ldyBFcnJvcignQ2FuY2VsZWQgdGhlIGludGVyYWN0aW9uJykpXG59XG5cbkludGVyYWN0LnByb3RvdHlwZS5ydW5uaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9ydW5uaW5nXG59XG5cbkludGVyYWN0LnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fcGh5cy52ZWxvY2l0eSh0aGlzLl92ZWxvWC5nZXRWZWxvY2l0eSgpLCB0aGlzLl92ZWxvWS5nZXRWZWxvY2l0eSgpKVxuICB0aGlzLl9yZXNvbHZlKHsgdmVsb2NpdHk6IHRoaXMuX3BoeXMudmVsb2NpdHkoKSwgcG9zaXRpb246IHRoaXMuX3BoeXMucG9zaXRpb24oKSB9KVxuICByZXR1cm4gdGhpcy5fZW5kZWRcbn1cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2ludGVyYWN0LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIHByZWZpeGVzID0gWydXZWJraXQnLCAnTW96JywgJ01zJywgJ21zJ11cbnZhciBjYWxscyA9IFtdXG52YXIgdHJhbnNmb3JtUHJvcCA9IHByZWZpeGVkKCd0cmFuc2Zvcm0nKVxudmFyIHJhZiA9IHJlcXVpcmUoJ3JhZicpXG5cbmZ1bmN0aW9uIGxvb3AoKSB7XG4gIHJhZihmdW5jdGlvbigpIHtcbiAgICBsb29wKClcbiAgICBmb3IodmFyIGkgPSBjYWxscy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY2FsbHNbaV0oKVxuICAgIH1cbiAgfSlcbn1cbmxvb3AoKVxuXG5mdW5jdGlvbiBwcmVmaXhlZChwcm9wKSB7XG4gIHZhciBwcmVmaXhlZFxuICBmb3IgKHZhciBpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgcHJlZml4ZWQgPSBwcmVmaXhlc1tpXSArIHByb3BbMF0udG9VcHBlckNhc2UoKSArIHByb3Auc2xpY2UoMSlcbiAgICBpZih0eXBlb2YgZG9jdW1lbnQuYm9keS5zdHlsZVtwcmVmaXhlZF0gIT09ICd1bmRlZmluZWQnKVxuICAgICAgcmV0dXJuIHByZWZpeGVkXG4gIH1cbiAgcmV0dXJuIHByb3Bcbn1cblxudmFyIHRyYW5zZm9ybXNQcm9wZXJ0aWVzID0gWyd0cmFuc2xhdGUnLCAndHJhbnNsYXRlWCcsICd0cmFuc2xhdGVZJywgJ3RyYW5zbGF0ZVonLFxuICAgICAgICAgICAgICAgICAgJ3JvdGF0ZScsICdyb3RhdGVYJywgJ3JvdGF0ZVknLCAncm90YXRlWicsXG4gICAgICAgICAgICAgICAgICAnc2NhbGUnLCAnc2NhbGVYJywgJ3NjYWxlWScsICdzY2FsZVonLFxuICAgICAgICAgICAgICAgICAgJ3NrZXcnLCAnc2tld1gnLCAnc2tld1knLCAnc2tld1onXVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyXG5cbmZ1bmN0aW9uIFJlbmRlcmVyKGVscykge1xuICBpZih0eXBlb2YgZWxzLmxlbmd0aCA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgZWxzID0gW2Vsc11cbiAgdGhpcy5lbHMgPSBlbHNcbiAgdGhpcy5zdHlsZXMgPSB7fVxuICB0aGlzLmludmlzaWJsZUVscyA9IFtdXG4gIGNhbGxzLnB1c2godGhpcy5yZW5kZXIuYmluZCh0aGlzKSlcbn1cblxuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICBpZighdGhpcy5jdXJyZW50UG9zaXRpb24pIHJldHVyblxuICB2YXIgdHJhbnNmb3Jtc1RvQXBwbHlcbiAgICAsIGVscyA9IHRoaXMuZWxzXG4gICAgLCBwb3NpdGlvbiA9IHRoaXMuY3VycmVudFBvc2l0aW9uXG4gICAgLCBzdHlsZXMgPSB0aGlzLnN0eWxlc1xuICAgICwgdmFsdWVcbiAgICAsIHByb3BzID0gT2JqZWN0LmtleXMoc3R5bGVzKVxuICAgICwgZWxzTGVuZ3RoID0gZWxzLmxlbmd0aFxuICAgICwgcHJvcHNMZW5ndGggPSBwcm9wcy5sZW5ndGhcbiAgICAsIGksIGpcbiAgICAsIHRyYW5zZm9ybXNcblxuICBmb3IoaSA9IDAgOyBpIDwgZWxzTGVuZ3RoIDsgaSsrKSB7XG4gICAgdHJhbnNmb3Jtc1RvQXBwbHkgPSBbXVxuICAgIGlmKHRoaXMudmlzaWJsZUZuICYmICF0aGlzLnZpc2libGVGbihwb3NpdGlvbiwgaSkpIHtcbiAgICAgIGlmKCF0aGlzLmludmlzaWJsZUVsc1tpXSkge1xuICAgICAgICBlbHNbaV0uc3R5bGUud2Via2l0VHJhbnNmb3JtID0gJ3RyYW5zbGF0ZTNkKDAsIC05OTk5OXB4LCAwKSdcbiAgICAgIH1cbiAgICAgIHRoaXMuaW52aXNpYmxlRWxzW2ldID0gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmludmlzaWJsZUVsc1tpXSA9IGZhbHNlXG4gICAgICBmb3IgKGogPSAwOyBqIDwgcHJvcHNMZW5ndGg7IGorKykge1xuICAgICAgICBwcm9wID0gcHJvcHNbal1cbiAgICAgICAgdmFsdWUgPSAodHlwZW9mIHN0eWxlc1twcm9wXSA9PT0gJ2Z1bmN0aW9uJykgPyBzdHlsZXNbcHJvcF0ocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgaSkgOiBzdHlsZXNbcHJvcF1cblxuICAgICAgICBpZih0cmFuc2Zvcm1zUHJvcGVydGllcy5pbmRleE9mKHByb3ApICE9PSAtMSkge1xuICAgICAgICAgIHRyYW5zZm9ybXNUb0FwcGx5LnB1c2gocHJvcCArICcoJyArIHZhbHVlICsgJyknKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsc1tpXS5zdHlsZVtwcm9wXSA9IHZhbHVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRyYW5zZm9ybXMgPSB0cmFuc2Zvcm1zVG9BcHBseS5qb2luKCcgJylcbiAgICAgIHRyYW5zZm9ybXMgKz0gJyB0cmFuc2xhdGVaKDApJ1xuICAgICAgZWxzW2ldLnN0eWxlW3RyYW5zZm9ybVByb3BdID0gdHJhbnNmb3Jtc1xuICAgIH1cbiAgfVxufVxuXG5SZW5kZXJlci5wcm90b3R5cGUuc3R5bGUgPSBmdW5jdGlvbihwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgaWYodHlwZW9mIHByb3BlcnR5ID09PSAnb2JqZWN0Jykge1xuICAgIGZvcihwcm9wIGluIHByb3BlcnR5KSB7XG4gICAgICBpZihwcm9wZXJ0eS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICB0aGlzLnN0eWxlKHByb3AsIHByb3BlcnR5W3Byb3BdKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB0aGlzLnN0eWxlc1twcm9wZXJ0eV0gPSB2YWx1ZVxuICByZXR1cm4gdGhpc1xufVxuXG5SZW5kZXJlci5wcm90b3R5cGUudmlzaWJsZSA9IGZ1bmN0aW9uKGlzVmlzaWJsZSkge1xuICB0aGlzLnZpc2libGVGbiA9IGlzVmlzaWJsZVxuICByZXR1cm4gdGhpc1xufVxuUmVuZGVyZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgdGhpcy5jdXJyZW50UG9zaXRpb24gPSB7IHg6IHgsIHk6IHkgfVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9yZW5kZXJlci5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG4gICwgYm9kaWVzID0gW11cblxuZnVuY3Rpb24gaW5jcmVtZW50KGEsIGIsIGMsIGQpIHtcbiAgdmFyIHZlYyA9IFZlY3RvcigwLCAwKVxuICB2ZWMuc2VsZkFkZChhKVxuICB2ZWMuc2VsZkFkZChiLmFkZChjKS5zZWxmTXVsdCgyKSlcbiAgdmVjLnNlbGZBZGQoZClcbiAgdmVjLnNlbGZNdWx0KDEvNilcbiAgcmV0dXJuIHZlY1xufVxuXG52YXIgcG9zaXRpb25WZWMgPSBWZWN0b3IoMCwgMClcbnZhciB2ZWxvY2l0eVZlYyA9IFZlY3RvcigwLCAwKVxuXG5mdW5jdGlvbiBldmFsdWF0ZShpbml0aWFsLCB0LCBkdCwgZCkge1xuICB2YXIgc3RhdGUgPSB7fVxuXG4gIHN0YXRlLnBvc2l0aW9uID0gcG9zaXRpb25WZWMuc2V0dihkLmR4KS5zZWxmTXVsdChkdCkuc2VsZkFkZChpbml0aWFsLnBvc2l0aW9uKVxuICBzdGF0ZS52ZWxvY2l0eSA9IHZlbG9jaXR5VmVjLnNldHYoZC5kdikuc2VsZk11bHQoZHQpLnNlbGZBZGQoaW5pdGlhbC52ZWxvY2l0eSlcblxuICB2YXIgbmV4dCA9IHtcbiAgICBkeDogc3RhdGUudmVsb2NpdHkuY2xvbmUoKSxcbiAgICBkdjogaW5pdGlhbC5hY2NlbGVyYXRlKHN0YXRlLCB0KS5jbG9uZSgpXG4gIH1cbiAgcmV0dXJuIG5leHRcbn1cblxudmFyIGRlciA9IHsgZHg6IFZlY3RvcigwLCAwKSwgZHY6IFZlY3RvcigwLCAwKSB9XG5mdW5jdGlvbiBpbnRlZ3JhdGUoc3RhdGUsIHQsIGR0KSB7XG4gICAgdmFyIGEgPSBldmFsdWF0ZSggc3RhdGUsIHQsIDAsIGRlciApXG4gICAgdmFyIGIgPSBldmFsdWF0ZSggc3RhdGUsIHQsIGR0KjAuNSwgYSApXG4gICAgdmFyIGMgPSBldmFsdWF0ZSggc3RhdGUsIHQsIGR0KjAuNSwgYiApXG4gICAgdmFyIGQgPSBldmFsdWF0ZSggc3RhdGUsIHQsIGR0LCBjIClcblxuICAgIHZhciBkeGR0ID0gaW5jcmVtZW50KGEuZHgsYi5keCxjLmR4LGQuZHgpXG4gICAgICAsIGR2ZHQgPSBpbmNyZW1lbnQoYS5kdixiLmR2LGMuZHYsZC5kdilcblxuICAgIHN0YXRlLnBvc2l0aW9uLnNlbGZBZGQoZHhkdC5zZWxmTXVsdChkdCkpO1xuICAgIHN0YXRlLnZlbG9jaXR5LnNlbGZBZGQoZHZkdC5zZWxmTXVsdChkdCkpO1xufVxuXG52YXIgY3VycmVudFRpbWUgPSBEYXRlLm5vdygpIC8gMTAwMFxuICAsIGFjY3VtdWxhdG9yID0gMFxuICAsIHQgPSAwXG4gICwgZHQgPSAwLjAxNVxuXG5mdW5jdGlvbiBzaW11bGF0ZSgpIHtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIHNpbXVsYXRlKClcbiAgICB2YXIgbmV3VGltZSA9IERhdGUubm93KCkgLyAxMDAwXG4gICAgdmFyIGZyYW1lVGltZSA9IG5ld1RpbWUgLSBjdXJyZW50VGltZVxuICAgIGN1cnJlbnRUaW1lID0gbmV3VGltZVxuXG4gICAgaWYoZnJhbWVUaW1lID4gMC4wNSlcbiAgICAgIGZyYW1lVGltZSA9IDAuMDVcblxuXG4gICAgYWNjdW11bGF0b3IgKz0gZnJhbWVUaW1lXG5cbiAgICB2YXIgaiA9IDBcblxuICAgIHdoaWxlKGFjY3VtdWxhdG9yID49IGR0KSB7XG4gICAgICBmb3IodmFyIGkgPSAwIDsgaSA8IGJvZGllcy5sZW5ndGggOyBpKyspIHtcbiAgICAgICAgYm9kaWVzW2ldLnByZXZpb3VzUG9zaXRpb24gPSBib2RpZXNbaV0ucG9zaXRpb24uY2xvbmUoKVxuICAgICAgICBpbnRlZ3JhdGUoYm9kaWVzW2ldLCB0LCBkdClcbiAgICAgIH1cbiAgICAgIHQgKz0gZHRcbiAgICAgIGFjY3VtdWxhdG9yIC09IGR0XG4gICAgfVxuXG4gICAgZm9yKHZhciBpID0gMCA7IGkgPCBib2RpZXMubGVuZ3RoIDsgaSsrKSB7XG4gICAgICBib2RpZXNbaV0udXBkYXRlKGFjY3VtdWxhdG9yIC8gZHQpXG4gICAgfVxuICB9LCAxNilcbn1cbnNpbXVsYXRlKClcblxubW9kdWxlLmV4cG9ydHMuYWRkQm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgYm9kaWVzLnB1c2goYm9keSlcbiAgcmV0dXJuIGJvZHlcbn1cblxubW9kdWxlLmV4cG9ydHMucmVtb3ZlQm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgdmFyIGluZGV4ID0gYm9kaWVzLmluZGV4T2YoYm9keSlcbiAgaWYoaW5kZXggPj0gMClcbiAgICBib2RpZXMuc3BsaWNlKGluZGV4LCAxKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9zaW11bGF0aW9uLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIEJvZHkgPSByZXF1aXJlKCcuL2JvZHknKVxudmFyIHNpbXVsYXRpb24gPSByZXF1aXJlKCcuL3NpbXVsYXRpb24nKVxudmFyIEJvdW5kcnkgPSByZXF1aXJlKCcuL2JvdW5kcnknKVxudmFyIEFuaW1hdGlvbiA9IHJlcXVpcmUoJy4vYW5pbWF0aW9uJylcblxudmFyIFNwcmluZyA9IG1vZHVsZS5leHBvcnRzID0gQW5pbWF0aW9uKHtcbiAgZGVmYXVsdE9wdGlvbnM6IHtcbiAgICB0ZW5zaW9uOiAxMDAsXG4gICAgZGFtcGluZzogMTBcbiAgfSxcbiAgb25TdGFydDogZnVuY3Rpb24odmVsb2NpdHksIGZyb20sIHRvLCBvcHRzLCB1cGRhdGUpIHtcbiAgICB2YXIgYm9keSA9IHRoaXMuX2JvZHkgPSBuZXcgQm9keSh2ZWxvY2l0eSwgZnJvbSwge1xuICAgICAgYWNjZWxlcmF0ZTogZnVuY3Rpb24oc3RhdGUsIHQpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLnBvc2l0aW9uLnNlbGZTdWIodG8pXG4gICAgICAgICAgLnNlbGZNdWx0KC1vcHRzLnRlbnNpb24pXG4gICAgICAgICAgLnNlbGZTdWIoc3RhdGUudmVsb2NpdHkubXVsdChvcHRzLmRhbXBpbmcpKVxuICAgICAgfSxcbiAgICAgIHVwZGF0ZTogZnVuY3Rpb24ocG9zaXRpb24sIHZlbG9jaXR5KSB7XG4gICAgICAgIGlmKGJvZHkuYXRSZXN0KCkgJiYgYm9keS5hdFBvc2l0aW9uKHRvKSkge1xuICAgICAgICAgIHVwZGF0ZS5kb25lKHRvLCB7IHg6IDAsIHk6IDAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGUuc3RhdGUocG9zaXRpb24sIHZlbG9jaXR5KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgICBzaW11bGF0aW9uLmFkZEJvZHkodGhpcy5fYm9keSlcbiAgfSxcbiAgb25FbmQ6IGZ1bmN0aW9uKCkge1xuICAgIHNpbXVsYXRpb24ucmVtb3ZlQm9keSh0aGlzLl9ib2R5KVxuICB9XG59KVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9zcHJpbmcuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKVxuZnVuY3Rpb24gdmVydGV4KGEsIGIpIHtcbiAgcmV0dXJuIC1iIC8gKDIgKiBhKVxufVxuXG5mdW5jdGlvbiBoZWlnaHQoYSwgYiwgYykge1xuICByZXR1cm4gcGFyYWJvbGEoYSwgYiwgYywgdmVydGV4KGEsIGIpKVxufVxuXG5mdW5jdGlvbiBwYXJhYm9sYShhLCBiLCBjLCB4KSB7XG4gIHJldHVybiBhICogeCAqIHggKyBiICogeCArIGNcbn1cblxuZnVuY3Rpb24gZXZlbnRWZWN0b3IoZXZ0KSB7XG4gIHJldHVybiBWZWN0b3Ioe1xuICAgIHg6IGV2dC50b3VjaGVzICYmIGV2dC50b3VjaGVzWzBdLnBhZ2VYIHx8IGV2dC5wYWdlWCxcbiAgICB5OiBldnQudG91Y2hlcyAmJiBldnQudG91Y2hlc1swXS5wYWdlWSB8fCBldnQucGFnZVlcbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMuaGVpZ2h0ID0gaGVpZ2h0XG5tb2R1bGUuZXhwb3J0cy5ldmVudFZlY3RvciA9IGV2ZW50VmVjdG9yXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi91dGlsLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3JcblxuZnVuY3Rpb24gVmVjdG9yKHgsIHkpIHtcbiAgaWYoISh0aGlzIGluc3RhbmNlb2YgVmVjdG9yKSlcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5KVxuXG4gIGlmKHR5cGVvZiB4LnggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhpcy54ID0geC54XG4gICAgdGhpcy55ID0geC55XG4gIH0gZWxzZSB7XG4gICAgdGhpcy54ID0geCB8fCAwXG4gICAgdGhpcy55ID0geSB8fCAwXG4gIH1cbn1cblxuVmVjdG9yLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbih2ZWMpIHtcbiAgcmV0dXJuIHZlYy54ID09PSB0aGlzLnggJiYgdmVjLnkgPT09IHRoaXMueVxufVxuXG5WZWN0b3IucHJvdG90eXBlLmRpcmVjdGlvbkVxdWFsID0gZnVuY3Rpb24odmVjKSB7XG4gIHJldHVybiB2ZWMueCA+IDAgPT09IHRoaXMueCA+IDAgJiYgdGhpcy55ID4gMCA9PT0gdmVjLnkgPiAwXG59XG5cblZlY3Rvci5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24gKHZlYykge1xuICByZXR1cm4gdGhpcy54ICogdmVjLnggKyB0aGlzLnkgKiB2ZWMueTtcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5uZWdhdGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFZlY3Rvcih0aGlzLngsIHRoaXMueSkubXVsdCgtMSlcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5ub3JtID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBNYXRoLnNxcnQodGhpcy5ub3Jtc3EoKSlcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gVmVjdG9yKHRoaXMueCwgdGhpcy55KVxufVxuXG5WZWN0b3IucHJvdG90eXBlLm5vcm1zcSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55XG59XG5cblZlY3Rvci5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1hZ25pdHVkZSA9IHRoaXMubm9ybSgpXG5cbiAgICBpZihtYWduaXR1ZGUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICBtYWduaXR1ZGUgPSAxIC8gbWFnbml0dWRlXG5cbiAgICB0aGlzLnggKj0gbWFnbml0dWRlXG4gICAgdGhpcy55ICo9IG1hZ25pdHVkZVxuXG4gICAgcmV0dXJuIHRoaXNcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5tdWx0ID0gZnVuY3Rpb24oeCwgeSkge1xuICBpZih4IGluc3RhbmNlb2YgVmVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeC54ICogdGhpcy54LCB4LnkgKiB0aGlzLnkpXG4gIH1cbiAgaWYodHlwZW9mIHkgPT09ICd1bmRlZmluZWQnKSB7IC8vc2NhbGFyXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCAqIHRoaXMueCwgeCAqIHRoaXMueSlcbiAgfVxuICByZXR1cm4gbmV3IFZlY3Rvcih4ICogdGhpcy54LCB5ICogdGhpcy55KVxufVxuXG5WZWN0b3IucHJvdG90eXBlLnNlbGZNdWx0ID0gZnVuY3Rpb24oeCwgeSkge1xuICBpZih4IGluc3RhbmNlb2YgVmVjdG9yKSB7XG4gICAgdGhpcy54ICo9IHgueFxuICAgIHRoaXMueSAqPSB4LnlcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIGlmKHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJykgeyAvL3NjYWxhclxuICAgIHRoaXMueCAqPSB4XG4gICAgdGhpcy55ICo9IHhcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIHRoaXMueCAqPSB4XG4gIHRoaXMueSAqPSB5XG4gIHJldHVybiB0aGlzXG59XG5cblZlY3Rvci5wcm90b3R5cGUuc2VsZkFkZCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgaWYodHlwZW9mIHgueCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aGlzLnggKz0geC54XG4gICAgdGhpcy55ICs9IHgueVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgaWYodHlwZW9mIHkgPT09ICd1bmRlZmluZWQnKSB7IC8vc2NhbGFyXG4gICAgdGhpcy54ICs9IHhcbiAgICB0aGlzLnkgKz0geFxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgdGhpcy54ICs9IHhcbiAgdGhpcy55ICs9IHlcbiAgcmV0dXJuIHRoaXNcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5zZWxmU3ViID0gZnVuY3Rpb24oeCwgeSkge1xuICBpZih0eXBlb2YgeC54ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHRoaXMueCAtPSB4LnhcbiAgICB0aGlzLnkgLT0geC55XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBpZih0eXBlb2YgeSA9PT0gJ3VuZGVmaW5lZCcpIHsgLy9zY2FsYXJcbiAgICB0aGlzLnggLT0geFxuICAgIHRoaXMueSAtPSB4XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICB0aGlzLnggLT0geFxuICB0aGlzLnkgLT0geVxuXG4gIHJldHVybiB0aGlzXG59XG5cblZlY3Rvci5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24oeCwgeSkge1xuXG4gIGlmKHR5cGVvZiB4LnggIT09ICd1bmRlZmluZWQnKVxuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAtIHgueCwgdGhpcy55IC0geC55KVxuXG4gIGlmKHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJykvL3NjYWxhclxuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAtIHgsIHRoaXMueSAtIHgpXG5cbiAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54IC0geCwgdGhpcy55IC0geSlcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKHR5cGVvZiB4LnggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54ICsgeC54LCB0aGlzLnkgKyB4LnkpXG4gIH1cbiAgaWYodHlwZW9mIHkgPT09ICd1bmRlZmluZWQnKSB7IC8vc2NhbGFyXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54ICsgeCwgdGhpcy55ICsgeClcbiAgfVxuICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggKyB4LCB0aGlzLnkgKyB5KVxufVxuXG5WZWN0b3IucHJvdG90eXBlLnNldHYgPSBmdW5jdGlvbih2ZWMpIHtcbiAgdGhpcy54ID0gdmVjLnhcbiAgdGhpcy55ID0gdmVjLnlcbiAgcmV0dXJuIHRoaXNcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24odmVjdG9yLCBhbHBoYSkge1xuICByZXR1cm4gdGhpcy5tdWx0KDEtYWxwaGEpLmFkZCh2ZWN0b3IubXVsdChhbHBoYSkpXG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL3ZlY3Rvci5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGFzYXAgPSByZXF1aXJlKCdhc2FwJylcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlXG5mdW5jdGlvbiBQcm9taXNlKGZuKSB7XG4gIGlmICh0eXBlb2YgdGhpcyAhPT0gJ29iamVjdCcpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Byb21pc2VzIG11c3QgYmUgY29uc3RydWN0ZWQgdmlhIG5ldycpXG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBUeXBlRXJyb3IoJ25vdCBhIGZ1bmN0aW9uJylcbiAgdmFyIHN0YXRlID0gbnVsbFxuICB2YXIgdmFsdWUgPSBudWxsXG4gIHZhciBkZWZlcnJlZHMgPSBbXVxuICB2YXIgc2VsZiA9IHRoaXNcblxuICB0aGlzLnRoZW4gPSBmdW5jdGlvbihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGhhbmRsZShuZXcgSGFuZGxlcihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcmVzb2x2ZSwgcmVqZWN0KSlcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlKGRlZmVycmVkKSB7XG4gICAgaWYgKHN0YXRlID09PSBudWxsKSB7XG4gICAgICBkZWZlcnJlZHMucHVzaChkZWZlcnJlZClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBhc2FwKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGNiID0gc3RhdGUgPyBkZWZlcnJlZC5vbkZ1bGZpbGxlZCA6IGRlZmVycmVkLm9uUmVqZWN0ZWRcbiAgICAgIGlmIChjYiA9PT0gbnVsbCkge1xuICAgICAgICAoc3RhdGUgPyBkZWZlcnJlZC5yZXNvbHZlIDogZGVmZXJyZWQucmVqZWN0KSh2YWx1ZSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB2YXIgcmV0XG4gICAgICB0cnkge1xuICAgICAgICByZXQgPSBjYih2YWx1ZSlcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGRlZmVycmVkLnJlc29sdmUocmV0KVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlKG5ld1ZhbHVlKSB7XG4gICAgdHJ5IHsgLy9Qcm9taXNlIFJlc29sdXRpb24gUHJvY2VkdXJlOiBodHRwczovL2dpdGh1Yi5jb20vcHJvbWlzZXMtYXBsdXMvcHJvbWlzZXMtc3BlYyN0aGUtcHJvbWlzZS1yZXNvbHV0aW9uLXByb2NlZHVyZVxuICAgICAgaWYgKG5ld1ZhbHVlID09PSBzZWxmKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBIHByb21pc2UgY2Fubm90IGJlIHJlc29sdmVkIHdpdGggaXRzZWxmLicpXG4gICAgICBpZiAobmV3VmFsdWUgJiYgKHR5cGVvZiBuZXdWYWx1ZSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIG5ld1ZhbHVlID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICB2YXIgdGhlbiA9IG5ld1ZhbHVlLnRoZW5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgZG9SZXNvbHZlKHRoZW4uYmluZChuZXdWYWx1ZSksIHJlc29sdmUsIHJlamVjdClcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3RhdGUgPSB0cnVlXG4gICAgICB2YWx1ZSA9IG5ld1ZhbHVlXG4gICAgICBmaW5hbGUoKVxuICAgIH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlamVjdChuZXdWYWx1ZSkge1xuICAgIHN0YXRlID0gZmFsc2VcbiAgICB2YWx1ZSA9IG5ld1ZhbHVlXG4gICAgZmluYWxlKClcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmFsZSgpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZGVmZXJyZWRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKVxuICAgICAgaGFuZGxlKGRlZmVycmVkc1tpXSlcbiAgICBkZWZlcnJlZHMgPSBudWxsXG4gIH1cblxuICBkb1Jlc29sdmUoZm4sIHJlc29sdmUsIHJlamVjdClcbn1cblxuXG5mdW5jdGlvbiBIYW5kbGVyKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCByZXNvbHZlLCByZWplY3Qpe1xuICB0aGlzLm9uRnVsZmlsbGVkID0gdHlwZW9mIG9uRnVsZmlsbGVkID09PSAnZnVuY3Rpb24nID8gb25GdWxmaWxsZWQgOiBudWxsXG4gIHRoaXMub25SZWplY3RlZCA9IHR5cGVvZiBvblJlamVjdGVkID09PSAnZnVuY3Rpb24nID8gb25SZWplY3RlZCA6IG51bGxcbiAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZVxuICB0aGlzLnJlamVjdCA9IHJlamVjdFxufVxuXG4vKipcbiAqIFRha2UgYSBwb3RlbnRpYWxseSBtaXNiZWhhdmluZyByZXNvbHZlciBmdW5jdGlvbiBhbmQgbWFrZSBzdXJlXG4gKiBvbkZ1bGZpbGxlZCBhbmQgb25SZWplY3RlZCBhcmUgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBNYWtlcyBubyBndWFyYW50ZWVzIGFib3V0IGFzeW5jaHJvbnkuXG4gKi9cbmZ1bmN0aW9uIGRvUmVzb2x2ZShmbiwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgdmFyIGRvbmUgPSBmYWxzZTtcbiAgdHJ5IHtcbiAgICBmbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmIChkb25lKSByZXR1cm5cbiAgICAgIGRvbmUgPSB0cnVlXG4gICAgICBvbkZ1bGZpbGxlZCh2YWx1ZSlcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICBpZiAoZG9uZSkgcmV0dXJuXG4gICAgICBkb25lID0gdHJ1ZVxuICAgICAgb25SZWplY3RlZChyZWFzb24pXG4gICAgfSlcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBpZiAoZG9uZSkgcmV0dXJuXG4gICAgZG9uZSA9IHRydWVcbiAgICBvblJlamVjdGVkKGV4KVxuICB9XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL1Byb21pc2UvY29yZS5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9Qcm9taXNlXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuJ3VzZSBzdHJpY3QnO1xuXG4vL1RoaXMgZmlsZSBjb250YWlucyB0aGVuL3Byb21pc2Ugc3BlY2lmaWMgZXh0ZW5zaW9ucyB0byB0aGUgY29yZSBwcm9taXNlIEFQSVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpXG52YXIgYXNhcCA9IHJlcXVpcmUoJ2FzYXAnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2VcblxuLyogU3RhdGljIEZ1bmN0aW9ucyAqL1xuXG5mdW5jdGlvbiBWYWx1ZVByb21pc2UodmFsdWUpIHtcbiAgdGhpcy50aGVuID0gZnVuY3Rpb24gKG9uRnVsZmlsbGVkKSB7XG4gICAgaWYgKHR5cGVvZiBvbkZ1bGZpbGxlZCAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHRoaXNcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzb2x2ZShvbkZ1bGZpbGxlZCh2YWx1ZSkpXG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG59XG5WYWx1ZVByb21pc2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQcm9taXNlLnByb3RvdHlwZSlcblxudmFyIFRSVUUgPSBuZXcgVmFsdWVQcm9taXNlKHRydWUpXG52YXIgRkFMU0UgPSBuZXcgVmFsdWVQcm9taXNlKGZhbHNlKVxudmFyIE5VTEwgPSBuZXcgVmFsdWVQcm9taXNlKG51bGwpXG52YXIgVU5ERUZJTkVEID0gbmV3IFZhbHVlUHJvbWlzZSh1bmRlZmluZWQpXG52YXIgWkVSTyA9IG5ldyBWYWx1ZVByb21pc2UoMClcbnZhciBFTVBUWVNUUklORyA9IG5ldyBWYWx1ZVByb21pc2UoJycpXG5cblByb21pc2UucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSByZXR1cm4gdmFsdWVcblxuICBpZiAodmFsdWUgPT09IG51bGwpIHJldHVybiBOVUxMXG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gVU5ERUZJTkVEXG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkgcmV0dXJuIFRSVUVcbiAgaWYgKHZhbHVlID09PSBmYWxzZSkgcmV0dXJuIEZBTFNFXG4gIGlmICh2YWx1ZSA9PT0gMCkgcmV0dXJuIFpFUk9cbiAgaWYgKHZhbHVlID09PSAnJykgcmV0dXJuIEVNUFRZU1RSSU5HXG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciB0aGVuID0gdmFsdWUudGhlblxuICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSh0aGVuLmJpbmQodmFsdWUpKVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICByZWplY3QoZXgpXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXcgVmFsdWVQcm9taXNlKHZhbHVlKVxufVxuXG5Qcm9taXNlLmZyb20gPSBQcm9taXNlLmNhc3QgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIGVyciA9IG5ldyBFcnJvcignUHJvbWlzZS5mcm9tIGFuZCBQcm9taXNlLmNhc3QgYXJlIGRlcHJlY2F0ZWQsIHVzZSBQcm9taXNlLnJlc29sdmUgaW5zdGVhZCcpXG4gIGVyci5uYW1lID0gJ1dhcm5pbmcnXG4gIGNvbnNvbGUud2FybihlcnIuc3RhY2spXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUodmFsdWUpXG59XG5cblByb21pc2UuZGVub2RlaWZ5ID0gZnVuY3Rpb24gKGZuLCBhcmd1bWVudENvdW50KSB7XG4gIGFyZ3VtZW50Q291bnQgPSBhcmd1bWVudENvdW50IHx8IEluZmluaXR5XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHdoaWxlIChhcmdzLmxlbmd0aCAmJiBhcmdzLmxlbmd0aCA+IGFyZ3VtZW50Q291bnQpIHtcbiAgICAgICAgYXJncy5wb3AoKVxuICAgICAgfVxuICAgICAgYXJncy5wdXNoKGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICBpZiAoZXJyKSByZWplY3QoZXJyKVxuICAgICAgICBlbHNlIHJlc29sdmUocmVzKVxuICAgICAgfSlcbiAgICAgIGZuLmFwcGx5KHNlbGYsIGFyZ3MpXG4gICAgfSlcbiAgfVxufVxuUHJvbWlzZS5ub2RlaWZ5ID0gZnVuY3Rpb24gKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgdmFyIGNhbGxiYWNrID0gdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gJ2Z1bmN0aW9uJyA/IGFyZ3MucG9wKCkgOiBudWxsXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpLm5vZGVpZnkoY2FsbGJhY2spXG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIGlmIChjYWxsYmFjayA9PT0gbnVsbCB8fCB0eXBlb2YgY2FsbGJhY2sgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgcmVqZWN0KGV4KSB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY2FsbGJhY2soZXgpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblByb21pc2UuYWxsID0gZnVuY3Rpb24gKCkge1xuICB2YXIgY2FsbGVkV2l0aEFycmF5ID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiBBcnJheS5pc0FycmF5KGFyZ3VtZW50c1swXSlcbiAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChjYWxsZWRXaXRoQXJyYXkgPyBhcmd1bWVudHNbMF0gOiBhcmd1bWVudHMpXG5cbiAgaWYgKCFjYWxsZWRXaXRoQXJyYXkpIHtcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdQcm9taXNlLmFsbCBzaG91bGQgYmUgY2FsbGVkIHdpdGggYSBzaW5nbGUgYXJyYXksIGNhbGxpbmcgaXQgd2l0aCBtdWx0aXBsZSBhcmd1bWVudHMgaXMgZGVwcmVjYXRlZCcpXG4gICAgZXJyLm5hbWUgPSAnV2FybmluZydcbiAgICBjb25zb2xlLndhcm4oZXJyLnN0YWNrKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDApIHJldHVybiByZXNvbHZlKFtdKVxuICAgIHZhciByZW1haW5pbmcgPSBhcmdzLmxlbmd0aFxuICAgIGZ1bmN0aW9uIHJlcyhpLCB2YWwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh2YWwgJiYgKHR5cGVvZiB2YWwgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgdmFyIHRoZW4gPSB2YWwudGhlblxuICAgICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhlbi5jYWxsKHZhbCwgZnVuY3Rpb24gKHZhbCkgeyByZXMoaSwgdmFsKSB9LCByZWplY3QpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXJnc1tpXSA9IHZhbFxuICAgICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICByZXNvbHZlKGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICByZWplY3QoZXgpXG4gICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzKGksIGFyZ3NbaV0pXG4gICAgfVxuICB9KVxufVxuXG5Qcm9taXNlLnJlamVjdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyBcbiAgICByZWplY3QodmFsdWUpO1xuICB9KTtcbn1cblxuUHJvbWlzZS5yYWNlID0gZnVuY3Rpb24gKHZhbHVlcykge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyBcbiAgICB2YWx1ZXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSl7XG4gICAgICBQcm9taXNlLnJlc29sdmUodmFsdWUpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9KVxuICB9KTtcbn1cblxuLyogUHJvdG90eXBlIE1ldGhvZHMgKi9cblxuUHJvbWlzZS5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uIChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICB2YXIgc2VsZiA9IGFyZ3VtZW50cy5sZW5ndGggPyB0aGlzLnRoZW4uYXBwbHkodGhpcywgYXJndW1lbnRzKSA6IHRoaXNcbiAgc2VsZi50aGVuKG51bGwsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRocm93IGVyclxuICAgIH0pXG4gIH0pXG59XG5cblByb21pc2UucHJvdG90eXBlLm5vZGVpZnkgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnZnVuY3Rpb24nKSByZXR1cm4gdGhpc1xuXG4gIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHZhbHVlKVxuICAgIH0pXG4gIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrKGVycilcbiAgICB9KVxuICB9KVxufVxuXG5Qcm9taXNlLnByb3RvdHlwZVsnY2F0Y2gnXSA9IGZ1bmN0aW9uIChvblJlamVjdGVkKSB7XG4gIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3RlZCk7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL1Byb21pc2UvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvUHJvbWlzZVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcblxuLy8gVXNlIHRoZSBmYXN0ZXN0IHBvc3NpYmxlIG1lYW5zIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm5cbi8vIG9mIHRoZSBldmVudCBsb29wLlxuXG4vLyBsaW5rZWQgbGlzdCBvZiB0YXNrcyAoc2luZ2xlLCB3aXRoIGhlYWQgbm9kZSlcbnZhciBoZWFkID0ge3Rhc2s6IHZvaWQgMCwgbmV4dDogbnVsbH07XG52YXIgdGFpbCA9IGhlYWQ7XG52YXIgZmx1c2hpbmcgPSBmYWxzZTtcbnZhciByZXF1ZXN0Rmx1c2ggPSB2b2lkIDA7XG52YXIgaXNOb2RlSlMgPSBmYWxzZTtcblxuZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgLyoganNoaW50IGxvb3BmdW5jOiB0cnVlICovXG5cbiAgICB3aGlsZSAoaGVhZC5uZXh0KSB7XG4gICAgICAgIGhlYWQgPSBoZWFkLm5leHQ7XG4gICAgICAgIHZhciB0YXNrID0gaGVhZC50YXNrO1xuICAgICAgICBoZWFkLnRhc2sgPSB2b2lkIDA7XG4gICAgICAgIHZhciBkb21haW4gPSBoZWFkLmRvbWFpbjtcblxuICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICBoZWFkLmRvbWFpbiA9IHZvaWQgMDtcbiAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRhc2soKTtcblxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoaXNOb2RlSlMpIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBub2RlLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBjb25zaWRlcmVkIGZhdGFsIGVycm9ycy5cbiAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIHN5bmNocm9ub3VzbHkgdG8gaW50ZXJydXB0IGZsdXNoaW5nIVxuXG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIGNvbnRpbnVhdGlvbiBpZiB0aGUgdW5jYXVnaHQgZXhjZXB0aW9uIGlzIHN1cHByZXNzZWRcbiAgICAgICAgICAgICAgICAvLyBsaXN0ZW5pbmcgXCJ1bmNhdWdodEV4Y2VwdGlvblwiIGV2ZW50cyAoYXMgZG9tYWlucyBkb2VzKS5cbiAgICAgICAgICAgICAgICAvLyBDb250aW51ZSBpbiBuZXh0IGV2ZW50IHRvIGF2b2lkIHRpY2sgcmVjdXJzaW9uLlxuICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEluIGJyb3dzZXJzLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuXG4gICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBhc3luY2hyb25vdXNseSB0byBhdm9pZCBzbG93LWRvd25zLlxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmbHVzaGluZyA9IGZhbHNlO1xufVxuXG5pZiAodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgcHJvY2Vzcy5uZXh0VGljaykge1xuICAgIC8vIE5vZGUuanMgYmVmb3JlIDAuOS4gTm90ZSB0aGF0IHNvbWUgZmFrZS1Ob2RlIGVudmlyb25tZW50cywgbGlrZSB0aGVcbiAgICAvLyBNb2NoYSB0ZXN0IHJ1bm5lciwgaW50cm9kdWNlIGEgYHByb2Nlc3NgIGdsb2JhbCB3aXRob3V0IGEgYG5leHRUaWNrYC5cbiAgICBpc05vZGVKUyA9IHRydWU7XG5cbiAgICByZXF1ZXN0Rmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICAgIH07XG5cbn0gZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgLy8gSW4gSUUxMCwgTm9kZS5qcyAwLjkrLCBvciBodHRwczovL2dpdGh1Yi5jb20vTm9ibGVKUy9zZXRJbW1lZGlhdGVcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICByZXF1ZXN0Rmx1c2ggPSBzZXRJbW1lZGlhdGUuYmluZCh3aW5kb3csIGZsdXNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXF1ZXN0Rmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRJbW1lZGlhdGUoZmx1c2gpO1xuICAgICAgICB9O1xuICAgIH1cblxufSBlbHNlIGlmICh0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAvLyBtb2Rlcm4gYnJvd3NlcnNcbiAgICAvLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmbHVzaDtcbiAgICByZXF1ZXN0Rmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gICAgfTtcblxufSBlbHNlIHtcbiAgICAvLyBvbGQgYnJvd3NlcnNcbiAgICByZXF1ZXN0Rmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGFzYXAodGFzaykge1xuICAgIHRhaWwgPSB0YWlsLm5leHQgPSB7XG4gICAgICAgIHRhc2s6IHRhc2ssXG4gICAgICAgIGRvbWFpbjogaXNOb2RlSlMgJiYgcHJvY2Vzcy5kb21haW4sXG4gICAgICAgIG5leHQ6IG51bGxcbiAgICB9O1xuXG4gICAgaWYgKCFmbHVzaGluZykge1xuICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3RGbHVzaCgpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXNhcDtcblxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9Qcm9taXNlL25vZGVfbW9kdWxlcy9hc2FwL2FzYXAuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvUHJvbWlzZS9ub2RlX21vZHVsZXMvYXNhcFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcblxuLyoqXG4gKiBFeHBvc2UgYEVtaXR0ZXJgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gRW1pdHRlcjtcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBFbWl0dGVyYC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIEVtaXR0ZXIob2JqKSB7XG4gIGlmIChvYmopIHJldHVybiBtaXhpbihvYmopO1xufTtcblxuLyoqXG4gKiBNaXhpbiB0aGUgZW1pdHRlciBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIG1peGluKG9iaikge1xuICBmb3IgKHZhciBrZXkgaW4gRW1pdHRlci5wcm90b3R5cGUpIHtcbiAgICBvYmpba2V5XSA9IEVtaXR0ZXIucHJvdG90eXBlW2tleV07XG4gIH1cbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBMaXN0ZW4gb24gdGhlIGdpdmVuIGBldmVudGAgd2l0aCBgZm5gLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uID1cbkVtaXR0ZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCwgZm4pe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG4gICh0aGlzLl9jYWxsYmFja3NbZXZlbnRdID0gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XSB8fCBbXSlcbiAgICAucHVzaChmbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGRzIGFuIGBldmVudGAgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGludm9rZWQgYSBzaW5nbGVcbiAqIHRpbWUgdGhlbiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuXG4gIGZ1bmN0aW9uIG9uKCkge1xuICAgIHNlbGYub2ZmKGV2ZW50LCBvbik7XG4gICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIG9uLmZuID0gZm47XG4gIHRoaXMub24oZXZlbnQsIG9uKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgZm9yIGBldmVudGAgb3IgYWxsXG4gKiByZWdpc3RlcmVkIGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vZmYgPVxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPVxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCwgZm4pe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG5cbiAgLy8gYWxsXG4gIGlmICgwID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICB0aGlzLl9jYWxsYmFja3MgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHNwZWNpZmljIGV2ZW50XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3NbZXZlbnRdO1xuICBpZiAoIWNhbGxiYWNrcykgcmV0dXJuIHRoaXM7XG5cbiAgLy8gcmVtb3ZlIGFsbCBoYW5kbGVyc1xuICBpZiAoMSA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgZGVsZXRlIHRoaXMuX2NhbGxiYWNrc1tldmVudF07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyByZW1vdmUgc3BlY2lmaWMgaGFuZGxlclxuICB2YXIgY2I7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgY2IgPSBjYWxsYmFja3NbaV07XG4gICAgaWYgKGNiID09PSBmbiB8fCBjYi5mbiA9PT0gZm4pIHtcbiAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaSwgMSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEVtaXQgYGV2ZW50YCB3aXRoIHRoZSBnaXZlbiBhcmdzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtNaXhlZH0gLi4uXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbihldmVudCl7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcbiAgICAsIGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrc1tldmVudF07XG5cbiAgaWYgKGNhbGxiYWNrcykge1xuICAgIGNhbGxiYWNrcyA9IGNhbGxiYWNrcy5zbGljZSgwKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gY2FsbGJhY2tzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBjYWxsYmFja3NbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJldHVybiBhcnJheSBvZiBjYWxsYmFja3MgZm9yIGBldmVudGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG4gIHJldHVybiB0aGlzLl9jYWxsYmFja3NbZXZlbnRdIHx8IFtdO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGlzIGVtaXR0ZXIgaGFzIGBldmVudGAgaGFuZGxlcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5oYXNMaXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XG4gIHJldHVybiAhISB0aGlzLmxpc3RlbmVycyhldmVudCkubGVuZ3RoO1xufTtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvY29tcG9uZW50LWVtaXR0ZXIvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvY29tcG9uZW50LWVtaXR0ZXJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIGtleXMgPSByZXF1aXJlKCdsb2Rhc2gua2V5cycpLFxuICAgIG9iamVjdFR5cGVzID0gcmVxdWlyZSgnbG9kYXNoLl9vYmplY3R0eXBlcycpO1xuXG4vKipcbiAqIEFzc2lnbnMgb3duIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiBzb3VyY2Ugb2JqZWN0KHMpIHRvIHRoZSBkZXN0aW5hdGlvblxuICogb2JqZWN0IGZvciBhbGwgZGVzdGluYXRpb24gcHJvcGVydGllcyB0aGF0IHJlc29sdmUgdG8gYHVuZGVmaW5lZGAuIE9uY2UgYVxuICogcHJvcGVydHkgaXMgc2V0LCBhZGRpdGlvbmFsIGRlZmF1bHRzIG9mIHRoZSBzYW1lIHByb3BlcnR5IHdpbGwgYmUgaWdub3JlZC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHR5cGUgRnVuY3Rpb25cbiAqIEBjYXRlZ29yeSBPYmplY3RzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKiBAcGFyYW0gey4uLk9iamVjdH0gW3NvdXJjZV0gVGhlIHNvdXJjZSBvYmplY3RzLlxuICogQHBhcmFtLSB7T2JqZWN0fSBbZ3VhcmRdIEFsbG93cyB3b3JraW5nIHdpdGggYF8ucmVkdWNlYCB3aXRob3V0IHVzaW5nIGl0c1xuICogIGBrZXlgIGFuZCBgb2JqZWN0YCBhcmd1bWVudHMgYXMgc291cmNlcy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdCA9IHsgJ25hbWUnOiAnYmFybmV5JyB9O1xuICogXy5kZWZhdWx0cyhvYmplY3QsIHsgJ25hbWUnOiAnZnJlZCcsICdlbXBsb3llcic6ICdzbGF0ZScgfSk7XG4gKiAvLyA9PiB7ICduYW1lJzogJ2Jhcm5leScsICdlbXBsb3llcic6ICdzbGF0ZScgfVxuICovXG52YXIgZGVmYXVsdHMgPSBmdW5jdGlvbihvYmplY3QsIHNvdXJjZSwgZ3VhcmQpIHtcbiAgdmFyIGluZGV4LCBpdGVyYWJsZSA9IG9iamVjdCwgcmVzdWx0ID0gaXRlcmFibGU7XG4gIGlmICghaXRlcmFibGUpIHJldHVybiByZXN1bHQ7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgYXJnc0luZGV4ID0gMCxcbiAgICAgIGFyZ3NMZW5ndGggPSB0eXBlb2YgZ3VhcmQgPT0gJ251bWJlcicgPyAyIDogYXJncy5sZW5ndGg7XG4gIHdoaWxlICgrK2FyZ3NJbmRleCA8IGFyZ3NMZW5ndGgpIHtcbiAgICBpdGVyYWJsZSA9IGFyZ3NbYXJnc0luZGV4XTtcbiAgICBpZiAoaXRlcmFibGUgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSkge1xuICAgIHZhciBvd25JbmRleCA9IC0xLFxuICAgICAgICBvd25Qcm9wcyA9IG9iamVjdFR5cGVzW3R5cGVvZiBpdGVyYWJsZV0gJiYga2V5cyhpdGVyYWJsZSksXG4gICAgICAgIGxlbmd0aCA9IG93blByb3BzID8gb3duUHJvcHMubGVuZ3RoIDogMDtcblxuICAgIHdoaWxlICgrK293bkluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICBpbmRleCA9IG93blByb3BzW293bkluZGV4XTtcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0W2luZGV4XSA9PSAndW5kZWZpbmVkJykgcmVzdWx0W2luZGV4XSA9IGl0ZXJhYmxlW2luZGV4XTtcbiAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZGVmYXVsdHM7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKiogVXNlZCB0byBkZXRlcm1pbmUgaWYgdmFsdWVzIGFyZSBvZiB0aGUgbGFuZ3VhZ2UgdHlwZSBPYmplY3QgKi9cbnZhciBvYmplY3RUeXBlcyA9IHtcbiAgJ2Jvb2xlYW4nOiBmYWxzZSxcbiAgJ2Z1bmN0aW9uJzogdHJ1ZSxcbiAgJ29iamVjdCc6IHRydWUsXG4gICdudW1iZXInOiBmYWxzZSxcbiAgJ3N0cmluZyc6IGZhbHNlLFxuICAndW5kZWZpbmVkJzogZmFsc2Vcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gb2JqZWN0VHlwZXM7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9vYmplY3R0eXBlcy9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5fb2JqZWN0dHlwZXNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIGlzTmF0aXZlID0gcmVxdWlyZSgnbG9kYXNoLl9pc25hdGl2ZScpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnbG9kYXNoLmlzb2JqZWN0JyksXG4gICAgc2hpbUtleXMgPSByZXF1aXJlKCdsb2Rhc2guX3NoaW1rZXlzJyk7XG5cbi8qIE5hdGl2ZSBtZXRob2Qgc2hvcnRjdXRzIGZvciBtZXRob2RzIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzICovXG52YXIgbmF0aXZlS2V5cyA9IGlzTmF0aXZlKG5hdGl2ZUtleXMgPSBPYmplY3Qua2V5cykgJiYgbmF0aXZlS2V5cztcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IGNvbXBvc2VkIG9mIHRoZSBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBhbiBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhbiBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5rZXlzKHsgJ29uZSc6IDEsICd0d28nOiAyLCAndGhyZWUnOiAzIH0pO1xuICogLy8gPT4gWydvbmUnLCAndHdvJywgJ3RocmVlJ10gKHByb3BlcnR5IG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkIGFjcm9zcyBlbnZpcm9ubWVudHMpXG4gKi9cbnZhciBrZXlzID0gIW5hdGl2ZUtleXMgPyBzaGltS2V5cyA6IGZ1bmN0aW9uKG9iamVjdCkge1xuICBpZiAoIWlzT2JqZWN0KG9iamVjdCkpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZUtleXMob2JqZWN0KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5cztcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgaW50ZXJuYWwgW1tDbGFzc11dIG9mIHZhbHVlcyAqL1xudmFyIHRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBpZiBhIG1ldGhvZCBpcyBuYXRpdmUgKi9cbnZhciByZU5hdGl2ZSA9IFJlZ0V4cCgnXicgK1xuICBTdHJpbmcodG9TdHJpbmcpXG4gICAgLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCAnXFxcXCQmJylcbiAgICAucmVwbGFjZSgvdG9TdHJpbmd8IGZvciBbXlxcXV0rL2csICcuKj8nKSArICckJ1xuKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24sIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNOYXRpdmUodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nICYmIHJlTmF0aXZlLnRlc3QodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTmF0aXZlO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL25vZGVfbW9kdWxlcy9sb2Rhc2guX2lzbmF0aXZlL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXMvbm9kZV9tb2R1bGVzL2xvZGFzaC5faXNuYXRpdmVcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIG9iamVjdFR5cGVzID0gcmVxdWlyZSgnbG9kYXNoLl9vYmplY3R0eXBlcycpO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEEgZmFsbGJhY2sgaW1wbGVtZW50YXRpb24gb2YgYE9iamVjdC5rZXlzYCB3aGljaCBwcm9kdWNlcyBhbiBhcnJheSBvZiB0aGVcbiAqIGdpdmVuIG9iamVjdCdzIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAdHlwZSBGdW5jdGlvblxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGluc3BlY3QuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYW4gYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKi9cbnZhciBzaGltS2V5cyA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICB2YXIgaW5kZXgsIGl0ZXJhYmxlID0gb2JqZWN0LCByZXN1bHQgPSBbXTtcbiAgaWYgKCFpdGVyYWJsZSkgcmV0dXJuIHJlc3VsdDtcbiAgaWYgKCEob2JqZWN0VHlwZXNbdHlwZW9mIG9iamVjdF0pKSByZXR1cm4gcmVzdWx0O1xuICAgIGZvciAoaW5kZXggaW4gaXRlcmFibGUpIHtcbiAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGl0ZXJhYmxlLCBpbmRleCkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goaW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgcmV0dXJuIHJlc3VsdFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzaGltS2V5cztcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9zaGlta2V5cy9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL25vZGVfbW9kdWxlcy9sb2Rhc2guX3NoaW1rZXlzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBvYmplY3RUeXBlcyA9IHJlcXVpcmUoJ2xvZGFzaC5fb2JqZWN0dHlwZXMnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgbGFuZ3VhZ2UgdHlwZSBvZiBPYmplY3QuXG4gKiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdHNcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdCgxKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIC8vIGNoZWNrIGlmIHRoZSB2YWx1ZSBpcyB0aGUgRUNNQVNjcmlwdCBsYW5ndWFnZSB0eXBlIG9mIE9iamVjdFxuICAvLyBodHRwOi8vZXM1LmdpdGh1Yi5pby8jeDhcbiAgLy8gYW5kIGF2b2lkIGEgVjggYnVnXG4gIC8vIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTFcbiAgcmV0dXJuICEhKHZhbHVlICYmIG9iamVjdFR5cGVzW3R5cGVvZiB2YWx1ZV0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL25vZGVfbW9kdWxlcy9sb2Rhc2guaXNvYmplY3QvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLmlzb2JqZWN0XCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXNhcCA9IHJlcXVpcmUoJ2FzYXAnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2VcbmZ1bmN0aW9uIFByb21pc2UoZm4pIHtcbiAgaWYgKHR5cGVvZiB0aGlzICE9PSAnb2JqZWN0JykgdGhyb3cgbmV3IFR5cGVFcnJvcignUHJvbWlzZXMgbXVzdCBiZSBjb25zdHJ1Y3RlZCB2aWEgbmV3JylcbiAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykgdGhyb3cgbmV3IFR5cGVFcnJvcignbm90IGEgZnVuY3Rpb24nKVxuICB2YXIgc3RhdGUgPSBudWxsXG4gIHZhciB2YWx1ZSA9IG51bGxcbiAgdmFyIGRlZmVycmVkcyA9IFtdXG4gIHZhciBzZWxmID0gdGhpc1xuXG4gIHRoaXMudGhlbiA9IGZ1bmN0aW9uKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaGFuZGxlKG5ldyBIYW5kbGVyKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCByZXNvbHZlLCByZWplY3QpKVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGUoZGVmZXJyZWQpIHtcbiAgICBpZiAoc3RhdGUgPT09IG51bGwpIHtcbiAgICAgIGRlZmVycmVkcy5wdXNoKGRlZmVycmVkKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGFzYXAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY2IgPSBzdGF0ZSA/IGRlZmVycmVkLm9uRnVsZmlsbGVkIDogZGVmZXJyZWQub25SZWplY3RlZFxuICAgICAgaWYgKGNiID09PSBudWxsKSB7XG4gICAgICAgIChzdGF0ZSA/IGRlZmVycmVkLnJlc29sdmUgOiBkZWZlcnJlZC5yZWplY3QpKHZhbHVlKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHZhciByZXRcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldCA9IGNiKHZhbHVlKVxuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGUpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXQpXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc29sdmUobmV3VmFsdWUpIHtcbiAgICB0cnkgeyAvL1Byb21pc2UgUmVzb2x1dGlvbiBQcm9jZWR1cmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9wcm9taXNlcy1hcGx1cy9wcm9taXNlcy1zcGVjI3RoZS1wcm9taXNlLXJlc29sdXRpb24tcHJvY2VkdXJlXG4gICAgICBpZiAobmV3VmFsdWUgPT09IHNlbGYpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0EgcHJvbWlzZSBjYW5ub3QgYmUgcmVzb2x2ZWQgd2l0aCBpdHNlbGYuJylcbiAgICAgIGlmIChuZXdWYWx1ZSAmJiAodHlwZW9mIG5ld1ZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgbmV3VmFsdWUgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgIHZhciB0aGVuID0gbmV3VmFsdWUudGhlblxuICAgICAgICBpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBkb1Jlc29sdmUodGhlbi5iaW5kKG5ld1ZhbHVlKSwgcmVzb2x2ZSwgcmVqZWN0KVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdGF0ZSA9IHRydWVcbiAgICAgIHZhbHVlID0gbmV3VmFsdWVcbiAgICAgIGZpbmFsZSgpXG4gICAgfSBjYXRjaCAoZSkgeyByZWplY3QoZSkgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVqZWN0KG5ld1ZhbHVlKSB7XG4gICAgc3RhdGUgPSBmYWxzZVxuICAgIHZhbHVlID0gbmV3VmFsdWVcbiAgICBmaW5hbGUoKVxuICB9XG5cbiAgZnVuY3Rpb24gZmluYWxlKCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBkZWZlcnJlZHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspXG4gICAgICBoYW5kbGUoZGVmZXJyZWRzW2ldKVxuICAgIGRlZmVycmVkcyA9IG51bGxcbiAgfVxuXG4gIGRvUmVzb2x2ZShmbiwgcmVzb2x2ZSwgcmVqZWN0KVxufVxuXG5cbmZ1bmN0aW9uIEhhbmRsZXIob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIHJlc29sdmUsIHJlamVjdCl7XG4gIHRoaXMub25GdWxmaWxsZWQgPSB0eXBlb2Ygb25GdWxmaWxsZWQgPT09ICdmdW5jdGlvbicgPyBvbkZ1bGZpbGxlZCA6IG51bGxcbiAgdGhpcy5vblJlamVjdGVkID0gdHlwZW9mIG9uUmVqZWN0ZWQgPT09ICdmdW5jdGlvbicgPyBvblJlamVjdGVkIDogbnVsbFxuICB0aGlzLnJlc29sdmUgPSByZXNvbHZlXG4gIHRoaXMucmVqZWN0ID0gcmVqZWN0XG59XG5cbi8qKlxuICogVGFrZSBhIHBvdGVudGlhbGx5IG1pc2JlaGF2aW5nIHJlc29sdmVyIGZ1bmN0aW9uIGFuZCBtYWtlIHN1cmVcbiAqIG9uRnVsZmlsbGVkIGFuZCBvblJlamVjdGVkIGFyZSBvbmx5IGNhbGxlZCBvbmNlLlxuICpcbiAqIE1ha2VzIG5vIGd1YXJhbnRlZXMgYWJvdXQgYXN5bmNocm9ueS5cbiAqL1xuZnVuY3Rpb24gZG9SZXNvbHZlKGZuLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICB2YXIgZG9uZSA9IGZhbHNlO1xuICB0cnkge1xuICAgIGZuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKGRvbmUpIHJldHVyblxuICAgICAgZG9uZSA9IHRydWVcbiAgICAgIG9uRnVsZmlsbGVkKHZhbHVlKVxuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIGlmIChkb25lKSByZXR1cm5cbiAgICAgIGRvbmUgPSB0cnVlXG4gICAgICBvblJlamVjdGVkKHJlYXNvbilcbiAgICB9KVxuICB9IGNhdGNoIChleCkge1xuICAgIGlmIChkb25lKSByZXR1cm5cbiAgICBkb25lID0gdHJ1ZVxuICAgIG9uUmVqZWN0ZWQoZXgpXG4gIH1cbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcHJvbWlzZS9jb3JlLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2VcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4ndXNlIHN0cmljdCc7XG5cbi8vVGhpcyBmaWxlIGNvbnRhaW5zIHRoZW4vcHJvbWlzZSBzcGVjaWZpYyBleHRlbnNpb25zIHRvIHRoZSBjb3JlIHByb21pc2UgQVBJXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9jb3JlLmpzJylcbnZhciBhc2FwID0gcmVxdWlyZSgnYXNhcCcpXG5cbm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZVxuXG4vKiBTdGF0aWMgRnVuY3Rpb25zICovXG5cbmZ1bmN0aW9uIFZhbHVlUHJvbWlzZSh2YWx1ZSkge1xuICB0aGlzLnRoZW4gPSBmdW5jdGlvbiAob25GdWxmaWxsZWQpIHtcbiAgICBpZiAodHlwZW9mIG9uRnVsZmlsbGVkICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gdGhpc1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXNvbHZlKG9uRnVsZmlsbGVkKHZhbHVlKSlcbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICByZWplY3QoZXgpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cbn1cblZhbHVlUHJvbWlzZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFByb21pc2UucHJvdG90eXBlKVxuXG52YXIgVFJVRSA9IG5ldyBWYWx1ZVByb21pc2UodHJ1ZSlcbnZhciBGQUxTRSA9IG5ldyBWYWx1ZVByb21pc2UoZmFsc2UpXG52YXIgTlVMTCA9IG5ldyBWYWx1ZVByb21pc2UobnVsbClcbnZhciBVTkRFRklORUQgPSBuZXcgVmFsdWVQcm9taXNlKHVuZGVmaW5lZClcbnZhciBaRVJPID0gbmV3IFZhbHVlUHJvbWlzZSgwKVxudmFyIEVNUFRZU1RSSU5HID0gbmV3IFZhbHVlUHJvbWlzZSgnJylcblxuUHJvbWlzZS5yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHJldHVybiB2YWx1ZVxuXG4gIGlmICh2YWx1ZSA9PT0gbnVsbCkgcmV0dXJuIE5VTExcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiBVTkRFRklORURcbiAgaWYgKHZhbHVlID09PSB0cnVlKSByZXR1cm4gVFJVRVxuICBpZiAodmFsdWUgPT09IGZhbHNlKSByZXR1cm4gRkFMU0VcbiAgaWYgKHZhbHVlID09PSAwKSByZXR1cm4gWkVST1xuICBpZiAodmFsdWUgPT09ICcnKSByZXR1cm4gRU1QVFlTVFJJTkdcblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIHRoZW4gPSB2YWx1ZS50aGVuXG4gICAgICBpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHRoZW4uYmluZCh2YWx1ZSkpXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHJlamVjdChleClcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBWYWx1ZVByb21pc2UodmFsdWUpXG59XG5cblByb21pc2UuZnJvbSA9IFByb21pc2UuY2FzdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgZXJyID0gbmV3IEVycm9yKCdQcm9taXNlLmZyb20gYW5kIFByb21pc2UuY2FzdCBhcmUgZGVwcmVjYXRlZCwgdXNlIFByb21pc2UucmVzb2x2ZSBpbnN0ZWFkJylcbiAgZXJyLm5hbWUgPSAnV2FybmluZydcbiAgY29uc29sZS53YXJuKGVyci5zdGFjaylcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh2YWx1ZSlcbn1cblxuUHJvbWlzZS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoZm4sIGFyZ3VtZW50Q291bnQpIHtcbiAgYXJndW1lbnRDb3VudCA9IGFyZ3VtZW50Q291bnQgfHwgSW5maW5pdHlcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgd2hpbGUgKGFyZ3MubGVuZ3RoICYmIGFyZ3MubGVuZ3RoID4gYXJndW1lbnRDb3VudCkge1xuICAgICAgICBhcmdzLnBvcCgpXG4gICAgICB9XG4gICAgICBhcmdzLnB1c2goZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgIGlmIChlcnIpIHJlamVjdChlcnIpXG4gICAgICAgIGVsc2UgcmVzb2x2ZShyZXMpXG4gICAgICB9KVxuICAgICAgZm4uYXBwbHkoc2VsZiwgYXJncylcbiAgICB9KVxuICB9XG59XG5Qcm9taXNlLm5vZGVpZnkgPSBmdW5jdGlvbiAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICB2YXIgY2FsbGJhY2sgPSB0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09PSAnZnVuY3Rpb24nID8gYXJncy5wb3AoKSA6IG51bGxcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykubm9kZWlmeShjYWxsYmFjaylcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgaWYgKGNhbGxiYWNrID09PSBudWxsIHx8IHR5cGVvZiBjYWxsYmFjayA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyByZWplY3QoZXgpIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjYWxsYmFjayhleClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuUHJvbWlzZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBjYWxsZWRXaXRoQXJyYXkgPSBhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYXJndW1lbnRzWzBdKVxuICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGNhbGxlZFdpdGhBcnJheSA/IGFyZ3VtZW50c1swXSA6IGFyZ3VtZW50cylcblxuICBpZiAoIWNhbGxlZFdpdGhBcnJheSkge1xuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1Byb21pc2UuYWxsIHNob3VsZCBiZSBjYWxsZWQgd2l0aCBhIHNpbmdsZSBhcnJheSwgY2FsbGluZyBpdCB3aXRoIG11bHRpcGxlIGFyZ3VtZW50cyBpcyBkZXByZWNhdGVkJylcbiAgICBlcnIubmFtZSA9ICdXYXJuaW5nJ1xuICAgIGNvbnNvbGUud2FybihlcnIuc3RhY2spXG4gIH1cblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHJlc29sdmUoW10pXG4gICAgdmFyIHJlbWFpbmluZyA9IGFyZ3MubGVuZ3RoXG4gICAgZnVuY3Rpb24gcmVzKGksIHZhbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHZhbCAmJiAodHlwZW9mIHZhbCA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbCA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICB2YXIgdGhlbiA9IHZhbC50aGVuXG4gICAgICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGVuLmNhbGwodmFsLCBmdW5jdGlvbiAodmFsKSB7IHJlcyhpLCB2YWwpIH0sIHJlamVjdClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhcmdzW2ldID0gdmFsXG4gICAgICAgIGlmICgtLXJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgIHJlc29sdmUoYXJncyk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIHJlamVjdChleClcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXMoaSwgYXJnc1tpXSlcbiAgICB9XG4gIH0pXG59XG5cblByb21pc2UucmVqZWN0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IFxuICAgIHJlamVjdCh2YWx1ZSk7XG4gIH0pO1xufVxuXG5Qcm9taXNlLnJhY2UgPSBmdW5jdGlvbiAodmFsdWVzKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IFxuICAgIHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgIFByb21pc2UucmVzb2x2ZSh2YWx1ZSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgIH0pXG4gIH0pO1xufVxuXG4vKiBQcm90b3R5cGUgTWV0aG9kcyAqL1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24gKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gIHZhciBzZWxmID0gYXJndW1lbnRzLmxlbmd0aCA/IHRoaXMudGhlbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDogdGhpc1xuICBzZWxmLnRoZW4obnVsbCwgZnVuY3Rpb24gKGVycikge1xuICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgdGhyb3cgZXJyXG4gICAgfSlcbiAgfSlcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUubm9kZWlmeSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIGNhbGxiYWNrICE9ICdmdW5jdGlvbicpIHJldHVybiB0aGlzXG5cbiAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgY2FsbGJhY2sobnVsbCwgdmFsdWUpXG4gICAgfSlcbiAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgY2FsbGJhY2soZXJyKVxuICAgIH0pXG4gIH0pXG59XG5cblByb21pc2UucHJvdG90eXBlWydjYXRjaCddID0gZnVuY3Rpb24gKG9uUmVqZWN0ZWQpIHtcbiAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGVkKTtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcHJvbWlzZS9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9wcm9taXNlXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuXG4vLyBVc2UgdGhlIGZhc3Rlc3QgcG9zc2libGUgbWVhbnMgdG8gZXhlY3V0ZSBhIHRhc2sgaW4gYSBmdXR1cmUgdHVyblxuLy8gb2YgdGhlIGV2ZW50IGxvb3AuXG5cbi8vIGxpbmtlZCBsaXN0IG9mIHRhc2tzIChzaW5nbGUsIHdpdGggaGVhZCBub2RlKVxudmFyIGhlYWQgPSB7dGFzazogdm9pZCAwLCBuZXh0OiBudWxsfTtcbnZhciB0YWlsID0gaGVhZDtcbnZhciBmbHVzaGluZyA9IGZhbHNlO1xudmFyIHJlcXVlc3RGbHVzaCA9IHZvaWQgMDtcbnZhciBpc05vZGVKUyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgICAvKiBqc2hpbnQgbG9vcGZ1bmM6IHRydWUgKi9cblxuICAgIHdoaWxlIChoZWFkLm5leHQpIHtcbiAgICAgICAgaGVhZCA9IGhlYWQubmV4dDtcbiAgICAgICAgdmFyIHRhc2sgPSBoZWFkLnRhc2s7XG4gICAgICAgIGhlYWQudGFzayA9IHZvaWQgMDtcbiAgICAgICAgdmFyIGRvbWFpbiA9IGhlYWQuZG9tYWluO1xuXG4gICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgIGhlYWQuZG9tYWluID0gdm9pZCAwO1xuICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGFzaygpO1xuXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChpc05vZGVKUykge1xuICAgICAgICAgICAgICAgIC8vIEluIG5vZGUsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIGNvbnNpZGVyZWQgZmF0YWwgZXJyb3JzLlxuICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gc3luY2hyb25vdXNseSB0byBpbnRlcnJ1cHQgZmx1c2hpbmchXG5cbiAgICAgICAgICAgICAgICAvLyBFbnN1cmUgY29udGludWF0aW9uIGlmIHRoZSB1bmNhdWdodCBleGNlcHRpb24gaXMgc3VwcHJlc3NlZFxuICAgICAgICAgICAgICAgIC8vIGxpc3RlbmluZyBcInVuY2F1Z2h0RXhjZXB0aW9uXCIgZXZlbnRzIChhcyBkb21haW5zIGRvZXMpLlxuICAgICAgICAgICAgICAgIC8vIENvbnRpbnVlIGluIG5leHQgZXZlbnQgdG8gYXZvaWQgdGljayByZWN1cnNpb24uXG4gICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRocm93IGU7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gYnJvd3NlcnMsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIG5vdCBmYXRhbC5cbiAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIGFzeW5jaHJvbm91c2x5IHRvIGF2b2lkIHNsb3ctZG93bnMuXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZsdXNoaW5nID0gZmFsc2U7XG59XG5cbmlmICh0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwcm9jZXNzLm5leHRUaWNrKSB7XG4gICAgLy8gTm9kZS5qcyBiZWZvcmUgMC45LiBOb3RlIHRoYXQgc29tZSBmYWtlLU5vZGUgZW52aXJvbm1lbnRzLCBsaWtlIHRoZVxuICAgIC8vIE1vY2hhIHRlc3QgcnVubmVyLCBpbnRyb2R1Y2UgYSBgcHJvY2Vzc2AgZ2xvYmFsIHdpdGhvdXQgYSBgbmV4dFRpY2tgLlxuICAgIGlzTm9kZUpTID0gdHJ1ZTtcblxuICAgIHJlcXVlc3RGbHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcHJvY2Vzcy5uZXh0VGljayhmbHVzaCk7XG4gICAgfTtcblxufSBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAvLyBJbiBJRTEwLCBOb2RlLmpzIDAuOSssIG9yIGh0dHBzOi8vZ2l0aHViLmNvbS9Ob2JsZUpTL3NldEltbWVkaWF0ZVxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJlcXVlc3RGbHVzaCA9IHNldEltbWVkaWF0ZS5iaW5kKHdpbmRvdywgZmx1c2gpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcXVlc3RGbHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldEltbWVkaWF0ZShmbHVzaCk7XG4gICAgICAgIH07XG4gICAgfVxuXG59IGVsc2UgaWYgKHR5cGVvZiBNZXNzYWdlQ2hhbm5lbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIC8vIG1vZGVybiBicm93c2Vyc1xuICAgIC8vIGh0dHA6Ly93d3cubm9uYmxvY2tpbmcuaW8vMjAxMS8wNi93aW5kb3duZXh0dGljay5odG1sXG4gICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoO1xuICAgIHJlcXVlc3RGbHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbiAgICB9O1xuXG59IGVsc2Uge1xuICAgIC8vIG9sZCBicm93c2Vyc1xuICAgIHJlcXVlc3RGbHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gYXNhcCh0YXNrKSB7XG4gICAgdGFpbCA9IHRhaWwubmV4dCA9IHtcbiAgICAgICAgdGFzazogdGFzayxcbiAgICAgICAgZG9tYWluOiBpc05vZGVKUyAmJiBwcm9jZXNzLmRvbWFpbixcbiAgICAgICAgbmV4dDogbnVsbFxuICAgIH07XG5cbiAgICBpZiAoIWZsdXNoaW5nKSB7XG4gICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdEZsdXNoKCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBhc2FwO1xuXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2Uvbm9kZV9tb2R1bGVzL2FzYXAvYXNhcC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9wcm9taXNlL25vZGVfbW9kdWxlcy9hc2FwXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIG5vdyA9IHJlcXVpcmUoJ3BlcmZvcm1hbmNlLW5vdycpXG4gICwgZ2xvYmFsID0gdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgPyB7fSA6IHdpbmRvd1xuICAsIHZlbmRvcnMgPSBbJ21veicsICd3ZWJraXQnXVxuICAsIHN1ZmZpeCA9ICdBbmltYXRpb25GcmFtZSdcbiAgLCByYWYgPSBnbG9iYWxbJ3JlcXVlc3QnICsgc3VmZml4XVxuICAsIGNhZiA9IGdsb2JhbFsnY2FuY2VsJyArIHN1ZmZpeF0gfHwgZ2xvYmFsWydjYW5jZWxSZXF1ZXN0JyArIHN1ZmZpeF1cbiAgLCBuYXRpdmUgPSB0cnVlXG5cbmZvcih2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhcmFmOyBpKyspIHtcbiAgcmFmID0gZ2xvYmFsW3ZlbmRvcnNbaV0gKyAnUmVxdWVzdCcgKyBzdWZmaXhdXG4gIGNhZiA9IGdsb2JhbFt2ZW5kb3JzW2ldICsgJ0NhbmNlbCcgKyBzdWZmaXhdXG4gICAgICB8fCBnbG9iYWxbdmVuZG9yc1tpXSArICdDYW5jZWxSZXF1ZXN0JyArIHN1ZmZpeF1cbn1cblxuLy8gU29tZSB2ZXJzaW9ucyBvZiBGRiBoYXZlIHJBRiBidXQgbm90IGNBRlxuaWYoIXJhZiB8fCAhY2FmKSB7XG4gIG5hdGl2ZSA9IGZhbHNlXG5cbiAgdmFyIGxhc3QgPSAwXG4gICAgLCBpZCA9IDBcbiAgICAsIHF1ZXVlID0gW11cbiAgICAsIGZyYW1lRHVyYXRpb24gPSAxMDAwIC8gNjBcblxuICByYWYgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIGlmKHF1ZXVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdmFyIF9ub3cgPSBub3coKVxuICAgICAgICAsIG5leHQgPSBNYXRoLm1heCgwLCBmcmFtZUR1cmF0aW9uIC0gKF9ub3cgLSBsYXN0KSlcbiAgICAgIGxhc3QgPSBuZXh0ICsgX25vd1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNwID0gcXVldWUuc2xpY2UoMClcbiAgICAgICAgLy8gQ2xlYXIgcXVldWUgaGVyZSB0byBwcmV2ZW50XG4gICAgICAgIC8vIGNhbGxiYWNrcyBmcm9tIGFwcGVuZGluZyBsaXN0ZW5lcnNcbiAgICAgICAgLy8gdG8gdGhlIGN1cnJlbnQgZnJhbWUncyBxdWV1ZVxuICAgICAgICBxdWV1ZS5sZW5ndGggPSAwXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBjcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmKCFjcFtpXS5jYW5jZWxsZWQpIHtcbiAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgY3BbaV0uY2FsbGJhY2sobGFzdClcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB0aHJvdyBlIH0sIDApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LCBNYXRoLnJvdW5kKG5leHQpKVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKHtcbiAgICAgIGhhbmRsZTogKytpZCxcbiAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayxcbiAgICAgIGNhbmNlbGxlZDogZmFsc2VcbiAgICB9KVxuICAgIHJldHVybiBpZFxuICB9XG5cbiAgY2FmID0gZnVuY3Rpb24oaGFuZGxlKSB7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZihxdWV1ZVtpXS5oYW5kbGUgPT09IGhhbmRsZSkge1xuICAgICAgICBxdWV1ZVtpXS5jYW5jZWxsZWQgPSB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZm4pIHtcbiAgLy8gV3JhcCBpbiBhIG5ldyBmdW5jdGlvbiB0byBwcmV2ZW50XG4gIC8vIGBjYW5jZWxgIHBvdGVudGlhbGx5IGJlaW5nIGFzc2lnbmVkXG4gIC8vIHRvIHRoZSBuYXRpdmUgckFGIGZ1bmN0aW9uXG4gIGlmKCFuYXRpdmUpIHtcbiAgICByZXR1cm4gcmFmLmNhbGwoZ2xvYmFsLCBmbilcbiAgfVxuICByZXR1cm4gcmFmLmNhbGwoZ2xvYmFsLCBmdW5jdGlvbigpIHtcbiAgICB0cnl7XG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB0aHJvdyBlIH0sIDApXG4gICAgfVxuICB9KVxufVxubW9kdWxlLmV4cG9ydHMuY2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gIGNhZi5hcHBseShnbG9iYWwsIGFyZ3VtZW50cylcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcmFmL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3JhZlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjNcbihmdW5jdGlvbigpIHtcbiAgdmFyIGdldE5hbm9TZWNvbmRzLCBocnRpbWUsIGxvYWRUaW1lO1xuXG4gIGlmICgodHlwZW9mIHBlcmZvcm1hbmNlICE9PSBcInVuZGVmaW5lZFwiICYmIHBlcmZvcm1hbmNlICE9PSBudWxsKSAmJiBwZXJmb3JtYW5jZS5ub3cpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAoKHR5cGVvZiBwcm9jZXNzICE9PSBcInVuZGVmaW5lZFwiICYmIHByb2Nlc3MgIT09IG51bGwpICYmIHByb2Nlc3MuaHJ0aW1lKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAoZ2V0TmFub1NlY29uZHMoKSAtIGxvYWRUaW1lKSAvIDFlNjtcbiAgICB9O1xuICAgIGhydGltZSA9IHByb2Nlc3MuaHJ0aW1lO1xuICAgIGdldE5hbm9TZWNvbmRzID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaHI7XG4gICAgICBociA9IGhydGltZSgpO1xuICAgICAgcmV0dXJuIGhyWzBdICogMWU5ICsgaHJbMV07XG4gICAgfTtcbiAgICBsb2FkVGltZSA9IGdldE5hbm9TZWNvbmRzKCk7XG4gIH0gZWxzZSBpZiAoRGF0ZS5ub3cpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIERhdGUubm93KCkgLSBsb2FkVGltZTtcbiAgICB9O1xuICAgIGxvYWRUaW1lID0gRGF0ZS5ub3coKTtcbiAgfSBlbHNlIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbG9hZFRpbWU7XG4gICAgfTtcbiAgICBsb2FkVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICB9XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8qXG4vL0Agc291cmNlTWFwcGluZ1VSTD1wZXJmb3JtYW5jZS1ub3cubWFwXG4qL1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9yYWYvbm9kZV9tb2R1bGVzL3BlcmZvcm1hbmNlLW5vdy9saWIvcGVyZm9ybWFuY2Utbm93LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3JhZi9ub2RlX21vZHVsZXMvcGVyZm9ybWFuY2Utbm93L2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbm1vZHVsZS5leHBvcnRzID0gVmVsb2NpdHlcblxuZnVuY3Rpb24gVmVsb2NpdHkoKSB7XG4gIHRoaXMucG9zaXRpb25RdWV1ZSA9IFtdXG4gIHRoaXMudGltZVF1ZXVlID0gW11cbn1cblxuVmVsb2NpdHkucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucG9zaXRpb25RdWV1ZS5zcGxpY2UoMClcbiAgdGhpcy50aW1lUXVldWUuc3BsaWNlKDApXG59XG5cblZlbG9jaXR5LnByb3RvdHlwZS5wcnVuZVF1ZXVlID0gZnVuY3Rpb24obXMpIHtcbiAgLy9wdWxsIG9sZCB2YWx1ZXMgb2ZmIG9mIHRoZSBxdWV1ZVxuICB3aGlsZSh0aGlzLnRpbWVRdWV1ZS5sZW5ndGggJiYgdGhpcy50aW1lUXVldWVbMF0gPCAoRGF0ZS5ub3coKSAtIG1zKSkge1xuICAgIHRoaXMudGltZVF1ZXVlLnNoaWZ0KClcbiAgICB0aGlzLnBvc2l0aW9uUXVldWUuc2hpZnQoKVxuICB9XG59XG5cblZlbG9jaXR5LnByb3RvdHlwZS51cGRhdGVQb3NpdGlvbiA9IGZ1bmN0aW9uKHBvc2l0aW9uKSB7XG4gIHRoaXMucG9zaXRpb25RdWV1ZS5wdXNoKHBvc2l0aW9uKVxuICB0aGlzLnRpbWVRdWV1ZS5wdXNoKERhdGUubm93KCkpXG4gIHRoaXMucHJ1bmVRdWV1ZSg1MClcbn1cblxuVmVsb2NpdHkucHJvdG90eXBlLmdldFZlbG9jaXR5ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucHJ1bmVRdWV1ZSgxMDAwKVxuICB2YXIgbGVuZ3RoID0gdGhpcy50aW1lUXVldWUubGVuZ3RoXG4gIGlmKGxlbmd0aCA8IDIpIHJldHVybiAwXG5cbiAgdmFyIGRpc3RhbmNlID0gdGhpcy5wb3NpdGlvblF1ZXVlW2xlbmd0aC0xXSAtIHRoaXMucG9zaXRpb25RdWV1ZVswXVxuICAgICwgdGltZSA9ICh0aGlzLnRpbWVRdWV1ZVtsZW5ndGgtMV0gLSB0aGlzLnRpbWVRdWV1ZVswXSkgLyAxMDAwXG5cbiAgcmV0dXJuIGRpc3RhbmNlIC8gdGltZVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy90b3VjaC12ZWxvY2l0eS9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy90b3VjaC12ZWxvY2l0eVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS43LjFcbihmdW5jdGlvbigpIHtcbiAgdmFyICQsIE9yaURvbWksIGFkZFN0eWxlLCBhbmNob3JMaXN0LCBhbmNob3JMaXN0SCwgYW5jaG9yTGlzdFYsIGJhc2VOYW1lLCBjYXBpdGFsaXplLCBjbG9uZUVsLCBjcmVhdGVFbCwgY3NzLCBkZWZhdWx0cywgZGVmZXIsIGVsQ2xhc3NlcywgZ2V0R3JhZGllbnQsIGhpZGVFbCwgaXNTdXBwb3J0ZWQsIGssIGxpYk5hbWUsIG5vT3AsIHByZWZpeExpc3QsIHByZXAsIHNob3dFbCwgc3R5bGVCdWZmZXIsIHN1cHBvcnRXYXJuaW5nLCB0ZXN0RWwsIHRlc3RQcm9wLCB2LCBfcmVmLFxuICAgIF9fYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH0sXG4gICAgX19pbmRleE9mID0gW10uaW5kZXhPZiB8fCBmdW5jdGlvbihpdGVtKSB7IGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHsgaWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSByZXR1cm4gaTsgfSByZXR1cm4gLTE7IH0sXG4gICAgX19zbGljZSA9IFtdLnNsaWNlO1xuXG4gIGxpYk5hbWUgPSAnT3JpRG9taSc7XG5cbiAgaXNTdXBwb3J0ZWQgPSB0cnVlO1xuXG4gIHN1cHBvcnRXYXJuaW5nID0gZnVuY3Rpb24ocHJvcCkge1xuICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjb25zb2xlICE9PSBudWxsKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJcIiArIGxpYk5hbWUgKyBcIjogTWlzc2luZyBzdXBwb3J0IGZvciBgXCIgKyBwcm9wICsgXCJgLlwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzU3VwcG9ydGVkID0gZmFsc2U7XG4gIH07XG5cbiAgdGVzdFByb3AgPSBmdW5jdGlvbihwcm9wKSB7XG4gICAgdmFyIGZ1bGwsIHByZWZpeCwgX2ksIF9sZW47XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBwcmVmaXhMaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBwcmVmaXggPSBwcmVmaXhMaXN0W19pXTtcbiAgICAgIGlmICgoZnVsbCA9IHByZWZpeCArIGNhcGl0YWxpemUocHJvcCkpIGluIHRlc3RFbC5zdHlsZSkge1xuICAgICAgICByZXR1cm4gZnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHByb3AgaW4gdGVzdEVsLnN0eWxlKSB7XG4gICAgICByZXR1cm4gcHJvcDtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIGFkZFN0eWxlID0gZnVuY3Rpb24oc2VsZWN0b3IsIHJ1bGVzKSB7XG4gICAgdmFyIHByb3AsIHN0eWxlLCB2YWw7XG4gICAgc3R5bGUgPSBcIi5cIiArIHNlbGVjdG9yICsgXCJ7XCI7XG4gICAgZm9yIChwcm9wIGluIHJ1bGVzKSB7XG4gICAgICB2YWwgPSBydWxlc1twcm9wXTtcbiAgICAgIGlmIChwcm9wIGluIGNzcykge1xuICAgICAgICBwcm9wID0gY3NzW3Byb3BdO1xuICAgICAgICBpZiAocHJvcC5tYXRjaCgvXih3ZWJraXR8bW96fG1zKS9pKSkge1xuICAgICAgICAgIHByb3AgPSAnLScgKyBwcm9wO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdHlsZSArPSBcIlwiICsgKHByb3AucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKSkgKyBcIjpcIiArIHZhbCArIFwiO1wiO1xuICAgIH1cbiAgICByZXR1cm4gc3R5bGVCdWZmZXIgKz0gc3R5bGUgKyAnfSc7XG4gIH07XG5cbiAgZ2V0R3JhZGllbnQgPSBmdW5jdGlvbihhbmNob3IpIHtcbiAgICByZXR1cm4gXCJcIiArIGNzcy5ncmFkaWVudFByb3AgKyBcIihcIiArIGFuY2hvciArIFwiLCByZ2JhKDAsIDAsIDAsIC41KSAwJSwgcmdiYSgyNTUsIDI1NSwgMjU1LCAuMzUpIDEwMCUpXCI7XG4gIH07XG5cbiAgY2FwaXRhbGl6ZSA9IGZ1bmN0aW9uKHMpIHtcbiAgICByZXR1cm4gc1swXS50b1VwcGVyQ2FzZSgpICsgcy5zbGljZSgxKTtcbiAgfTtcblxuICBjcmVhdGVFbCA9IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgIHZhciBlbDtcbiAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsLmNsYXNzTmFtZSA9IGVsQ2xhc3Nlc1tjbGFzc05hbWVdO1xuICAgIHJldHVybiBlbDtcbiAgfTtcblxuICBjbG9uZUVsID0gZnVuY3Rpb24ocGFyZW50LCBkZWVwLCBjbGFzc05hbWUpIHtcbiAgICB2YXIgZWw7XG4gICAgZWwgPSBwYXJlbnQuY2xvbmVOb2RlKGRlZXApO1xuICAgIGVsLmNsYXNzTGlzdC5hZGQoZWxDbGFzc2VzW2NsYXNzTmFtZV0pO1xuICAgIHJldHVybiBlbDtcbiAgfTtcblxuICBoaWRlRWwgPSBmdW5jdGlvbihlbCkge1xuICAgIHJldHVybiBlbC5zdHlsZVtjc3MudHJhbnNmb3JtXSA9ICd0cmFuc2xhdGUzZCgtOTk5OTlweCwgMCwgMCknO1xuICB9O1xuXG4gIHNob3dFbCA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgcmV0dXJuIGVsLnN0eWxlW2Nzcy50cmFuc2Zvcm1dID0gJ3RyYW5zbGF0ZTNkKDAsIDAsIDApJztcbiAgfTtcblxuICBwcmVwID0gZnVuY3Rpb24oZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYTAsIGExLCBhMiwgYW5jaG9yLCBhbmdsZSwgb3B0O1xuICAgICAgaWYgKHRoaXMuX3RvdWNoU3RhcnRlZCkge1xuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGEwID0gYXJndW1lbnRzWzBdLCBhMSA9IGFyZ3VtZW50c1sxXSwgYTIgPSBhcmd1bWVudHNbMl07XG4gICAgICAgIG9wdCA9IHt9O1xuICAgICAgICBhbmdsZSA9IGFuY2hvciA9IG51bGw7XG4gICAgICAgIHN3aXRjaCAoZm4ubGVuZ3RoKSB7XG4gICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgb3B0LmNhbGxiYWNrID0gYTA7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNGb2xkZWRVcCkge1xuICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIG9wdC5jYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiID8gb3B0LmNhbGxiYWNrKCkgOiB2b2lkIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBpZiAodHlwZW9mIGEwID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIG9wdC5jYWxsYmFjayA9IGEwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYW5jaG9yID0gYTA7XG4gICAgICAgICAgICAgIG9wdC5jYWxsYmFjayA9IGExO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgYW5nbGUgPSBhMDtcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgYTEgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgb3B0ID0gYTE7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGExID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgb3B0LmNhbGxiYWNrID0gYTE7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYW5jaG9yID0gYTE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgICBhbmNob3IgPSBhMTtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhMiA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBvcHQgPSBhMjtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYTIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBvcHQuY2FsbGJhY2sgPSBhMjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbmdsZSA9PSBudWxsKSB7XG4gICAgICAgICAgYW5nbGUgPSB0aGlzLl9sYXN0T3AuYW5nbGUgfHwgMDtcbiAgICAgICAgfVxuICAgICAgICBhbmNob3IgfHwgKGFuY2hvciA9IHRoaXMuX2xhc3RPcC5hbmNob3IpO1xuICAgICAgICB0aGlzLl9xdWV1ZS5wdXNoKFtmbiwgdGhpcy5fbm9ybWFsaXplQW5nbGUoYW5nbGUpLCB0aGlzLl9nZXRMb25naGFuZEFuY2hvcihhbmNob3IpLCBvcHRdKTtcbiAgICAgICAgdGhpcy5fc3RlcCgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIGRlZmVyID0gZnVuY3Rpb24oZm4pIHtcbiAgICByZXR1cm4gc2V0VGltZW91dChmbiwgMCk7XG4gIH07XG5cbiAgbm9PcCA9IGZ1bmN0aW9uKCkge307XG5cbiAgJCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdyAhPT0gbnVsbCA/IChfcmVmID0gd2luZG93LiQpICE9IG51bGwgPyBfcmVmLmRhdGEgOiB2b2lkIDAgOiB2b2lkIDApID8gd2luZG93LiQgOiBudWxsO1xuXG4gIGFuY2hvckxpc3QgPSBbJ2xlZnQnLCAncmlnaHQnLCAndG9wJywgJ2JvdHRvbSddO1xuXG4gIGFuY2hvckxpc3RWID0gYW5jaG9yTGlzdC5zbGljZSgwLCAyKTtcblxuICBhbmNob3JMaXN0SCA9IGFuY2hvckxpc3Quc2xpY2UoMik7XG5cbiAgdGVzdEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgc3R5bGVCdWZmZXIgPSAnJztcblxuICBwcmVmaXhMaXN0ID0gWydXZWJraXQnLCAnTW96JywgJ21zJ107XG5cbiAgYmFzZU5hbWUgPSBsaWJOYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgZWxDbGFzc2VzID0ge1xuICAgIGFjdGl2ZTogJ2FjdGl2ZScsXG4gICAgY2xvbmU6ICdjbG9uZScsXG4gICAgaG9sZGVyOiAnaG9sZGVyJyxcbiAgICBzdGFnZTogJ3N0YWdlJyxcbiAgICBzdGFnZUxlZnQ6ICdzdGFnZS1sZWZ0JyxcbiAgICBzdGFnZVJpZ2h0OiAnc3RhZ2UtcmlnaHQnLFxuICAgIHN0YWdlVG9wOiAnc3RhZ2UtdG9wJyxcbiAgICBzdGFnZUJvdHRvbTogJ3N0YWdlLWJvdHRvbScsXG4gICAgY29udGVudDogJ2NvbnRlbnQnLFxuICAgIG1hc2s6ICdtYXNrJyxcbiAgICBtYXNrSDogJ21hc2staCcsXG4gICAgbWFza1Y6ICdtYXNrLXYnLFxuICAgIHBhbmVsOiAncGFuZWwnLFxuICAgIHBhbmVsSDogJ3BhbmVsLWgnLFxuICAgIHBhbmVsVjogJ3BhbmVsLXYnLFxuICAgIHNoYWRlcjogJ3NoYWRlcicsXG4gICAgc2hhZGVyTGVmdDogJ3NoYWRlci1sZWZ0JyxcbiAgICBzaGFkZXJSaWdodDogJ3NoYWRlci1yaWdodCcsXG4gICAgc2hhZGVyVG9wOiAnc2hhZGVyLXRvcCcsXG4gICAgc2hhZGVyQm90dG9tOiAnc2hhZGVyLWJvdHRvbSdcbiAgfTtcblxuICBmb3IgKGsgaW4gZWxDbGFzc2VzKSB7XG4gICAgdiA9IGVsQ2xhc3Nlc1trXTtcbiAgICBlbENsYXNzZXNba10gPSBcIlwiICsgYmFzZU5hbWUgKyBcIi1cIiArIHY7XG4gIH1cblxuICBjc3MgPSBuZXcgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGtleSwgX2ksIF9sZW4sIF9yZWYxO1xuICAgIF9yZWYxID0gWyd0cmFuc2Zvcm0nLCAndHJhbnNmb3JtT3JpZ2luJywgJ3RyYW5zZm9ybVN0eWxlJywgJ3RyYW5zaXRpb25Qcm9wZXJ0eScsICd0cmFuc2l0aW9uRHVyYXRpb24nLCAndHJhbnNpdGlvbkRlbGF5JywgJ3RyYW5zaXRpb25UaW1pbmdGdW5jdGlvbicsICdwZXJzcGVjdGl2ZScsICdwZXJzcGVjdGl2ZU9yaWdpbicsICdiYWNrZmFjZVZpc2liaWxpdHknLCAnYm94U2l6aW5nJywgJ21hc2snXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBrZXkgPSBfcmVmMVtfaV07XG4gICAgICB0aGlzW2tleV0gPSBrZXk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIChmdW5jdGlvbigpIHtcbiAgICB2YXIgYW5jaG9yLCBrZXksIHAzZCwgcHJlZml4LCBzdHlsZUVsLCB2YWx1ZSwgX2ksIF9sZW4sIF9yZWYxLCBfcmVmMjtcbiAgICBmb3IgKGtleSBpbiBjc3MpIHtcbiAgICAgIHZhbHVlID0gY3NzW2tleV07XG4gICAgICBjc3Nba2V5XSA9IHRlc3RQcm9wKHZhbHVlKTtcbiAgICAgIGlmICghY3NzW2tleV0pIHtcbiAgICAgICAgcmV0dXJuIHN1cHBvcnRXYXJuaW5nKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcDNkID0gJ3ByZXNlcnZlLTNkJztcbiAgICB0ZXN0RWwuc3R5bGVbY3NzLnRyYW5zZm9ybVN0eWxlXSA9IHAzZDtcbiAgICBpZiAodGVzdEVsLnN0eWxlW2Nzcy50cmFuc2Zvcm1TdHlsZV0gIT09IHAzZCkge1xuICAgICAgcmV0dXJuIHN1cHBvcnRXYXJuaW5nKHAzZCk7XG4gICAgfVxuICAgIGNzcy5ncmFkaWVudFByb3AgPSAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaHlwaGVuYXRlZCwgcHJlZml4LCBfaSwgX2xlbjtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gcHJlZml4TGlzdC5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBwcmVmaXggPSBwcmVmaXhMaXN0W19pXTtcbiAgICAgICAgaHlwaGVuYXRlZCA9IFwiLVwiICsgKHByZWZpeC50b0xvd2VyQ2FzZSgpKSArIFwiLWxpbmVhci1ncmFkaWVudFwiO1xuICAgICAgICB0ZXN0RWwuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gXCJcIiArIGh5cGhlbmF0ZWQgKyBcIihsZWZ0LCAjMDAwLCAjZmZmKVwiO1xuICAgICAgICBpZiAodGVzdEVsLnN0eWxlLmJhY2tncm91bmRJbWFnZS5pbmRleE9mKCdncmFkaWVudCcpICE9PSAtMSkge1xuICAgICAgICAgIHJldHVybiBoeXBoZW5hdGVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gJ2xpbmVhci1ncmFkaWVudCc7XG4gICAgfSkoKTtcbiAgICBfcmVmMSA9IChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBncmFiVmFsdWUsIHBsYWluR3JhYiwgcHJlZml4LCBfaSwgX2xlbjtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gcHJlZml4TGlzdC5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBwcmVmaXggPSBwcmVmaXhMaXN0W19pXTtcbiAgICAgICAgcGxhaW5HcmFiID0gJ2dyYWInO1xuICAgICAgICB0ZXN0RWwuc3R5bGUuY3Vyc29yID0gKGdyYWJWYWx1ZSA9IFwiLVwiICsgKHByZWZpeC50b0xvd2VyQ2FzZSgpKSArIFwiLVwiICsgcGxhaW5HcmFiKTtcbiAgICAgICAgaWYgKHRlc3RFbC5zdHlsZS5jdXJzb3IgPT09IGdyYWJWYWx1ZSkge1xuICAgICAgICAgIHJldHVybiBbZ3JhYlZhbHVlLCBcIi1cIiArIChwcmVmaXgudG9Mb3dlckNhc2UoKSkgKyBcIi1ncmFiYmluZ1wiXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGVzdEVsLnN0eWxlLmN1cnNvciA9IHBsYWluR3JhYjtcbiAgICAgIGlmICh0ZXN0RWwuc3R5bGUuY3Vyc29yID09PSBwbGFpbkdyYWIpIHtcbiAgICAgICAgcmV0dXJuIFtwbGFpbkdyYWIsICdncmFiYmluZyddO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFsnbW92ZScsICdtb3ZlJ107XG4gICAgICB9XG4gICAgfSkoKSwgY3NzLmdyYWIgPSBfcmVmMVswXSwgY3NzLmdyYWJiaW5nID0gX3JlZjFbMV07XG4gICAgY3NzLnRyYW5zZm9ybVByb3AgPSAocHJlZml4ID0gY3NzLnRyYW5zZm9ybS5tYXRjaCgvKFxcdyspVHJhbnNmb3JtL2kpKSA/IFwiLVwiICsgKHByZWZpeFsxXS50b0xvd2VyQ2FzZSgpKSArIFwiLXRyYW5zZm9ybVwiIDogJ3RyYW5zZm9ybSc7XG4gICAgY3NzLnRyYW5zaXRpb25FbmQgPSAoZnVuY3Rpb24oKSB7XG4gICAgICBzd2l0Y2ggKGNzcy50cmFuc2l0aW9uUHJvcGVydHkudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICBjYXNlICd0cmFuc2l0aW9ucHJvcGVydHknOlxuICAgICAgICAgIHJldHVybiAndHJhbnNpdGlvbkVuZCc7XG4gICAgICAgIGNhc2UgJ3dlYmtpdHRyYW5zaXRpb25wcm9wZXJ0eSc6XG4gICAgICAgICAgcmV0dXJuICd3ZWJraXRUcmFuc2l0aW9uRW5kJztcbiAgICAgICAgY2FzZSAnbW96dHJhbnNpdGlvbnByb3BlcnR5JzpcbiAgICAgICAgICByZXR1cm4gJ3RyYW5zaXRpb25lbmQnO1xuICAgICAgICBjYXNlICdtc3RyYW5zaXRpb25wcm9wZXJ0eSc6XG4gICAgICAgICAgcmV0dXJuICdtc1RyYW5zaXRpb25FbmQnO1xuICAgICAgfVxuICAgIH0pKCk7XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLmFjdGl2ZSwge1xuICAgICAgYmFja2dyb3VuZENvbG9yOiAndHJhbnNwYXJlbnQgIWltcG9ydGFudCcsXG4gICAgICBiYWNrZ3JvdW5kSW1hZ2U6ICdub25lICFpbXBvcnRhbnQnLFxuICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCAhaW1wb3J0YW50JyxcbiAgICAgIGJvcmRlcjogJ25vbmUgIWltcG9ydGFudCcsXG4gICAgICBvdXRsaW5lOiAnbm9uZSAhaW1wb3J0YW50JyxcbiAgICAgIHBhZGRpbmc6ICcwICFpbXBvcnRhbnQnLFxuICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICB0cmFuc2Zvcm1TdHlsZTogcDNkICsgJyAhaW1wb3J0YW50JyxcbiAgICAgIG1hc2s6ICdub25lICFpbXBvcnRhbnQnXG4gICAgfSk7XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLmNsb25lLCB7XG4gICAgICBtYXJnaW46ICcwICFpbXBvcnRhbnQnLFxuICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCAhaW1wb3J0YW50JyxcbiAgICAgIG92ZXJmbG93OiAnaGlkZGVuICFpbXBvcnRhbnQnLFxuICAgICAgZGlzcGxheTogJ2Jsb2NrICFpbXBvcnRhbnQnXG4gICAgfSk7XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLmhvbGRlciwge1xuICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgdG9wOiAnMCcsXG4gICAgICBib3R0b206ICcwJyxcbiAgICAgIHRyYW5zZm9ybVN0eWxlOiBwM2RcbiAgICB9KTtcbiAgICBhZGRTdHlsZShlbENsYXNzZXMuc3RhZ2UsIHtcbiAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoLTk5OTlweCwgMCwgMCknLFxuICAgICAgbWFyZ2luOiAnMCcsXG4gICAgICBwYWRkaW5nOiAnMCcsXG4gICAgICB0cmFuc2Zvcm1TdHlsZTogcDNkXG4gICAgfSk7XG4gICAgX3JlZjIgPSB7XG4gICAgICBMZWZ0OiAnMCUgNTAlJyxcbiAgICAgIFJpZ2h0OiAnMTAwJSA1MCUnLFxuICAgICAgVG9wOiAnNTAlIDAlJyxcbiAgICAgIEJvdHRvbTogJzUwJSAxMDAlJ1xuICAgIH07XG4gICAgZm9yIChrIGluIF9yZWYyKSB7XG4gICAgICB2ID0gX3JlZjJba107XG4gICAgICBhZGRTdHlsZShlbENsYXNzZXNbJ3N0YWdlJyArIGtdLCB7XG4gICAgICAgIHBlcnNwZWN0aXZlT3JpZ2luOiB2XG4gICAgICB9KTtcbiAgICB9XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLnNoYWRlciwge1xuICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgIGhlaWdodDogJzEwMCUnLFxuICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICBvcGFjaXR5OiAnMCcsXG4gICAgICB0b3A6ICcwJyxcbiAgICAgIGxlZnQ6ICcwJyxcbiAgICAgIHBvaW50ZXJFdmVudHM6ICdub25lJyxcbiAgICAgIHRyYW5zaXRpb25Qcm9wZXJ0eTogJ29wYWNpdHknXG4gICAgfSk7XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBhbmNob3JMaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBhbmNob3IgPSBhbmNob3JMaXN0W19pXTtcbiAgICAgIGFkZFN0eWxlKGVsQ2xhc3Nlc1snc2hhZGVyJyArIGNhcGl0YWxpemUoYW5jaG9yKV0sIHtcbiAgICAgICAgYmFja2dyb3VuZDogZ2V0R3JhZGllbnQoYW5jaG9yKVxuICAgICAgfSk7XG4gICAgfVxuICAgIGFkZFN0eWxlKGVsQ2xhc3Nlcy5jb250ZW50LCB7XG4gICAgICBtYXJnaW46ICcwICFpbXBvcnRhbnQnLFxuICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZSAhaW1wb3J0YW50JyxcbiAgICAgIGZsb2F0OiAnbm9uZSAhaW1wb3J0YW50JyxcbiAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3ggIWltcG9ydGFudCcsXG4gICAgICBvdmVyZmxvdzogJ2hpZGRlbiAhaW1wb3J0YW50J1xuICAgIH0pO1xuICAgIGFkZFN0eWxlKGVsQ2xhc3Nlcy5tYXNrLCB7XG4gICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZTNkKDAsIDAsIDApJyxcbiAgICAgIG91dGxpbmU6ICcxcHggc29saWQgdHJhbnNwYXJlbnQnXG4gICAgfSk7XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLnBhbmVsLCB7XG4gICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICBwYWRkaW5nOiAnMCcsXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgIHRyYW5zaXRpb25Qcm9wZXJ0eTogY3NzLnRyYW5zZm9ybVByb3AsXG4gICAgICB0cmFuc2Zvcm1PcmlnaW46ICdsZWZ0JyxcbiAgICAgIHRyYW5zZm9ybVN0eWxlOiBwM2RcbiAgICB9KTtcbiAgICBhZGRTdHlsZShlbENsYXNzZXMucGFuZWxILCB7XG4gICAgICB0cmFuc2Zvcm1PcmlnaW46ICd0b3AnXG4gICAgfSk7XG4gICAgYWRkU3R5bGUoXCJcIiArIGVsQ2xhc3Nlcy5zdGFnZVJpZ2h0ICsgXCIgLlwiICsgZWxDbGFzc2VzLnBhbmVsLCB7XG4gICAgICB0cmFuc2Zvcm1PcmlnaW46ICdyaWdodCdcbiAgICB9KTtcbiAgICBhZGRTdHlsZShcIlwiICsgZWxDbGFzc2VzLnN0YWdlQm90dG9tICsgXCIgLlwiICsgZWxDbGFzc2VzLnBhbmVsLCB7XG4gICAgICB0cmFuc2Zvcm1PcmlnaW46ICdib3R0b20nXG4gICAgfSk7XG4gICAgc3R5bGVFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgc3R5bGVFbC50eXBlID0gJ3RleHQvY3NzJztcbiAgICBpZiAoc3R5bGVFbC5zdHlsZVNoZWV0KSB7XG4gICAgICBzdHlsZUVsLnN0eWxlU2hlZXQuY3NzVGV4dCA9IHN0eWxlQnVmZmVyO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZUVsLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHN0eWxlQnVmZmVyKSk7XG4gICAgfVxuICAgIHJldHVybiBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlRWwpO1xuICB9KSgpO1xuXG4gIGRlZmF1bHRzID0ge1xuICAgIHZQYW5lbHM6IDMsXG4gICAgaFBhbmVsczogMyxcbiAgICBwZXJzcGVjdGl2ZTogMTAwMCxcbiAgICBzaGFkaW5nOiAnaGFyZCcsXG4gICAgc3BlZWQ6IDcwMCxcbiAgICBtYXhBbmdsZTogOTAsXG4gICAgcmlwcGxlOiAwLFxuICAgIG9yaURvbWlDbGFzczogbGliTmFtZS50b0xvd2VyQ2FzZSgpLFxuICAgIHNoYWRpbmdJbnRlbnNpdHk6IDEsXG4gICAgZWFzaW5nTWV0aG9kOiAnJyxcbiAgICBnYXBOdWRnZTogMSxcbiAgICB0b3VjaEVuYWJsZWQ6IHRydWUsXG4gICAgdG91Y2hTZW5zaXRpdml0eTogLjI1LFxuICAgIHRvdWNoU3RhcnRDYWxsYmFjazogbm9PcCxcbiAgICB0b3VjaE1vdmVDYWxsYmFjazogbm9PcCxcbiAgICB0b3VjaEVuZENhbGxiYWNrOiBub09wXG4gIH07XG5cbiAgT3JpRG9taSA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBPcmlEb21pKGVsLCBvcHRpb25zKSB7XG4gICAgICB2YXIgYSwgYW5jaG9yLCBhbmNob3JTZXQsIGF4aXMsIGNsYXNzU3VmZml4LCBjb250ZW50LCBjb250ZW50SG9sZGVyLCBjb3VudCwgaSwgaW5kZXgsIG1hc2ssIG1hc2tQcm90bywgbWV0cmljLCBvZmZzZXRzLCBwYW5lbCwgcGFuZWxDb25maWcsIHBhbmVsS2V5LCBwYW5lbE4sIHBhbmVsUHJvdG8sIHBlcmNlbnQsIHByZXYsIHByb3RvLCByaWdodE9yQm90dG9tLCBzaGFkZXJQcm90bywgc2hhZGVyUHJvdG9zLCBzaWRlLCBzdGFnZVByb3RvLCBfaSwgX2osIF9rLCBfbCwgX2xlbiwgX2xlbjEsIF9sZW4yLCBfbGVuMywgX2xlbjQsIF9sZW41LCBfbGVuNiwgX2xlbjcsIF9tLCBfbiwgX28sIF9wLCBfcSwgX3JlZjEsIF9yZWYyO1xuICAgICAgdGhpcy5lbCA9IGVsO1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICB0aGlzLl9vbk1vdXNlT3V0ID0gX19iaW5kKHRoaXMuX29uTW91c2VPdXQsIHRoaXMpO1xuICAgICAgdGhpcy5fb25Ub3VjaExlYXZlID0gX19iaW5kKHRoaXMuX29uVG91Y2hMZWF2ZSwgdGhpcyk7XG4gICAgICB0aGlzLl9vblRvdWNoRW5kID0gX19iaW5kKHRoaXMuX29uVG91Y2hFbmQsIHRoaXMpO1xuICAgICAgdGhpcy5fb25Ub3VjaE1vdmUgPSBfX2JpbmQodGhpcy5fb25Ub3VjaE1vdmUsIHRoaXMpO1xuICAgICAgdGhpcy5fb25Ub3VjaFN0YXJ0ID0gX19iaW5kKHRoaXMuX29uVG91Y2hTdGFydCwgdGhpcyk7XG4gICAgICB0aGlzLl9zdGFnZVJlc2V0ID0gX19iaW5kKHRoaXMuX3N0YWdlUmVzZXQsIHRoaXMpO1xuICAgICAgdGhpcy5fY29uY2x1ZGUgPSBfX2JpbmQodGhpcy5fY29uY2x1ZGUsIHRoaXMpO1xuICAgICAgdGhpcy5fb25UcmFuc2l0aW9uRW5kID0gX19iaW5kKHRoaXMuX29uVHJhbnNpdGlvbkVuZCwgdGhpcyk7XG4gICAgICB0aGlzLl9zdGVwID0gX19iaW5kKHRoaXMuX3N0ZXAsIHRoaXMpO1xuICAgICAgaWYgKCFpc1N1cHBvcnRlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgT3JpRG9taSkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBPcmlEb21pKHRoaXMuZWwsIG9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB0aGlzLmVsID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLmVsKTtcbiAgICAgIH1cbiAgICAgIGlmICghKHRoaXMuZWwgJiYgdGhpcy5lbC5ub2RlVHlwZSA9PT0gMSkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJcIiArIGxpYk5hbWUgKyBcIjogRmlyc3QgYXJndW1lbnQgbXVzdCBiZSBhIERPTSBlbGVtZW50XCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2NvbmZpZyA9IG5ldyBmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yIChrIGluIGRlZmF1bHRzKSB7XG4gICAgICAgICAgdiA9IGRlZmF1bHRzW2tdO1xuICAgICAgICAgIGlmIChrIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXNba10gPSBvcHRpb25zW2tdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzW2tdID0gdjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9O1xuICAgICAgdGhpcy5fY29uZmlnLnJpcHBsZSA9IE51bWJlcih0aGlzLl9jb25maWcucmlwcGxlKTtcbiAgICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgICB0aGlzLl9wYW5lbHMgPSB7fTtcbiAgICAgIHRoaXMuX3N0YWdlcyA9IHt9O1xuICAgICAgdGhpcy5fbGFzdE9wID0ge1xuICAgICAgICBhbmNob3I6IGFuY2hvckxpc3RbMF1cbiAgICAgIH07XG4gICAgICB0aGlzLl9zaGFkaW5nID0gdGhpcy5fY29uZmlnLnNoYWRpbmc7XG4gICAgICBpZiAodGhpcy5fc2hhZGluZyA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLl9zaGFkaW5nID0gJ2hhcmQnO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgdGhpcy5fc2hhZGVycyA9IHt9O1xuICAgICAgICBzaGFkZXJQcm90b3MgPSB7fTtcbiAgICAgICAgc2hhZGVyUHJvdG8gPSBjcmVhdGVFbCgnc2hhZGVyJyk7XG4gICAgICAgIHNoYWRlclByb3RvLnN0eWxlW2Nzcy50cmFuc2l0aW9uRHVyYXRpb25dID0gdGhpcy5fY29uZmlnLnNwZWVkICsgJ21zJztcbiAgICAgICAgc2hhZGVyUHJvdG8uc3R5bGVbY3NzLnRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbl0gPSB0aGlzLl9jb25maWcuZWFzaW5nTWV0aG9kO1xuICAgICAgfVxuICAgICAgc3RhZ2VQcm90byA9IGNyZWF0ZUVsKCdzdGFnZScpO1xuICAgICAgc3RhZ2VQcm90by5zdHlsZVtjc3MucGVyc3BlY3RpdmVdID0gdGhpcy5fY29uZmlnLnBlcnNwZWN0aXZlICsgJ3B4JztcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gYW5jaG9yTGlzdC5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBhbmNob3IgPSBhbmNob3JMaXN0W19pXTtcbiAgICAgICAgdGhpcy5fcGFuZWxzW2FuY2hvcl0gPSBbXTtcbiAgICAgICAgdGhpcy5fc3RhZ2VzW2FuY2hvcl0gPSBjbG9uZUVsKHN0YWdlUHJvdG8sIGZhbHNlLCAnc3RhZ2UnICsgY2FwaXRhbGl6ZShhbmNob3IpKTtcbiAgICAgICAgaWYgKHRoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgICB0aGlzLl9zaGFkZXJzW2FuY2hvcl0gPSB7fTtcbiAgICAgICAgICBpZiAoX19pbmRleE9mLmNhbGwoYW5jaG9yTGlzdFYsIGFuY2hvcikgPj0gMCkge1xuICAgICAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gYW5jaG9yTGlzdFYubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgICAgIHNpZGUgPSBhbmNob3JMaXN0Vltfal07XG4gICAgICAgICAgICAgIHRoaXMuX3NoYWRlcnNbYW5jaG9yXVtzaWRlXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKF9rID0gMCwgX2xlbjIgPSBhbmNob3JMaXN0SC5sZW5ndGg7IF9rIDwgX2xlbjI7IF9rKyspIHtcbiAgICAgICAgICAgICAgc2lkZSA9IGFuY2hvckxpc3RIW19rXTtcbiAgICAgICAgICAgICAgdGhpcy5fc2hhZGVyc1thbmNob3JdW3NpZGVdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHNoYWRlclByb3Rvc1thbmNob3JdID0gY2xvbmVFbChzaGFkZXJQcm90bywgZmFsc2UsICdzaGFkZXInICsgY2FwaXRhbGl6ZShhbmNob3IpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGVudEhvbGRlciA9IGNsb25lRWwodGhpcy5lbCwgdHJ1ZSwgJ2NvbnRlbnQnKTtcbiAgICAgIG1hc2tQcm90byA9IGNyZWF0ZUVsKCdtYXNrJyk7XG4gICAgICBtYXNrUHJvdG8uYXBwZW5kQ2hpbGQoY29udGVudEhvbGRlcik7XG4gICAgICBwYW5lbFByb3RvID0gY3JlYXRlRWwoJ3BhbmVsJyk7XG4gICAgICBwYW5lbFByb3RvLnN0eWxlW2Nzcy50cmFuc2l0aW9uRHVyYXRpb25dID0gdGhpcy5fY29uZmlnLnNwZWVkICsgJ21zJztcbiAgICAgIHBhbmVsUHJvdG8uc3R5bGVbY3NzLnRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbl0gPSB0aGlzLl9jb25maWcuZWFzaW5nTWV0aG9kO1xuICAgICAgb2Zmc2V0cyA9IHtcbiAgICAgICAgbGVmdDogW10sXG4gICAgICAgIHRvcDogW11cbiAgICAgIH07XG4gICAgICBfcmVmMSA9IFsneCcsICd5J107XG4gICAgICBmb3IgKF9sID0gMCwgX2xlbjMgPSBfcmVmMS5sZW5ndGg7IF9sIDwgX2xlbjM7IF9sKyspIHtcbiAgICAgICAgYXhpcyA9IF9yZWYxW19sXTtcbiAgICAgICAgaWYgKGF4aXMgPT09ICd4Jykge1xuICAgICAgICAgIGFuY2hvclNldCA9IGFuY2hvckxpc3RWO1xuICAgICAgICAgIG1ldHJpYyA9ICd3aWR0aCc7XG4gICAgICAgICAgY2xhc3NTdWZmaXggPSAnVic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYW5jaG9yU2V0ID0gYW5jaG9yTGlzdEg7XG4gICAgICAgICAgbWV0cmljID0gJ2hlaWdodCc7XG4gICAgICAgICAgY2xhc3NTdWZmaXggPSAnSCc7XG4gICAgICAgIH1cbiAgICAgICAgcGFuZWxDb25maWcgPSB0aGlzLl9jb25maWdbcGFuZWxLZXkgPSBjbGFzc1N1ZmZpeC50b0xvd2VyQ2FzZSgpICsgJ1BhbmVscyddO1xuICAgICAgICBpZiAodHlwZW9mIHBhbmVsQ29uZmlnID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGNvdW50ID0gTWF0aC5hYnMocGFyc2VJbnQocGFuZWxDb25maWcsIDEwKSk7XG4gICAgICAgICAgcGVyY2VudCA9IDEwMCAvIGNvdW50O1xuICAgICAgICAgIHBhbmVsQ29uZmlnID0gdGhpcy5fY29uZmlnW3BhbmVsS2V5XSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBfbSwgX3Jlc3VsdHM7XG4gICAgICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgZm9yIChfbSA9IDA7IDAgPD0gY291bnQgPyBfbSA8IGNvdW50IDogX20gPiBjb3VudDsgMCA8PSBjb3VudCA/IF9tKysgOiBfbS0tKSB7XG4gICAgICAgICAgICAgIF9yZXN1bHRzLnB1c2gocGVyY2VudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICAgICAgfSkoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb3VudCA9IHBhbmVsQ29uZmlnLmxlbmd0aDtcbiAgICAgICAgICBpZiAoISgoOTkgPD0gKF9yZWYyID0gcGFuZWxDb25maWcucmVkdWNlKGZ1bmN0aW9uKHAsIGMpIHtcbiAgICAgICAgICAgIHJldHVybiBwICsgYztcbiAgICAgICAgICB9KSkgJiYgX3JlZjIgPD0gMTAwLjEpKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiXCIgKyBsaWJOYW1lICsgXCI6IFBhbmVsIHBlcmNlbnRhZ2VzIGRvIG5vdCBzdW0gdG8gMTAwXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBtYXNrID0gY2xvbmVFbChtYXNrUHJvdG8sIHRydWUsICdtYXNrJyArIGNsYXNzU3VmZml4KTtcbiAgICAgICAgaWYgKHRoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgICBmb3IgKF9tID0gMCwgX2xlbjQgPSBhbmNob3JTZXQubGVuZ3RoOyBfbSA8IF9sZW40OyBfbSsrKSB7XG4gICAgICAgICAgICBhbmNob3IgPSBhbmNob3JTZXRbX21dO1xuICAgICAgICAgICAgbWFzay5hcHBlbmRDaGlsZChzaGFkZXJQcm90b3NbYW5jaG9yXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHByb3RvID0gY2xvbmVFbChwYW5lbFByb3RvLCBmYWxzZSwgJ3BhbmVsJyArIGNsYXNzU3VmZml4KTtcbiAgICAgICAgcHJvdG8uYXBwZW5kQ2hpbGQobWFzayk7XG4gICAgICAgIGZvciAocmlnaHRPckJvdHRvbSA9IF9uID0gMCwgX2xlbjUgPSBhbmNob3JTZXQubGVuZ3RoOyBfbiA8IF9sZW41OyByaWdodE9yQm90dG9tID0gKytfbikge1xuICAgICAgICAgIGFuY2hvciA9IGFuY2hvclNldFtyaWdodE9yQm90dG9tXTtcbiAgICAgICAgICBmb3IgKHBhbmVsTiA9IF9vID0gMDsgMCA8PSBjb3VudCA/IF9vIDwgY291bnQgOiBfbyA+IGNvdW50OyBwYW5lbE4gPSAwIDw9IGNvdW50ID8gKytfbyA6IC0tX28pIHtcbiAgICAgICAgICAgIHBhbmVsID0gcHJvdG8uY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgY29udGVudCA9IHBhbmVsLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdO1xuICAgICAgICAgICAgY29udGVudC5zdHlsZS53aWR0aCA9IGNvbnRlbnQuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuICAgICAgICAgICAgaWYgKHJpZ2h0T3JCb3R0b20pIHtcbiAgICAgICAgICAgICAgcGFuZWwuc3R5bGVbY3NzLm9yaWdpbl0gPSBhbmNob3I7XG4gICAgICAgICAgICAgIGluZGV4ID0gcGFuZWxDb25maWcubGVuZ3RoIC0gcGFuZWxOIC0gMTtcbiAgICAgICAgICAgICAgcHJldiA9IGluZGV4ICsgMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGluZGV4ID0gcGFuZWxOO1xuICAgICAgICAgICAgICBwcmV2ID0gaW5kZXggLSAxO1xuICAgICAgICAgICAgICBpZiAocGFuZWxOID09PSAwKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0c1thbmNob3JdLnB1c2goMCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0c1thbmNob3JdLnB1c2goKG9mZnNldHNbYW5jaG9yXVtwcmV2XSAtIDEwMCkgKiAocGFuZWxDb25maWdbcHJldl0gLyBwYW5lbENvbmZpZ1tpbmRleF0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhbmVsTiA9PT0gMCkge1xuICAgICAgICAgICAgICBwYW5lbC5zdHlsZVthbmNob3JdID0gJzAnO1xuICAgICAgICAgICAgICBwYW5lbC5zdHlsZVttZXRyaWNdID0gcGFuZWxDb25maWdbaW5kZXhdICsgJyUnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGFuZWwuc3R5bGVbYW5jaG9yXSA9ICcxMDAlJztcbiAgICAgICAgICAgICAgcGFuZWwuc3R5bGVbbWV0cmljXSA9IHBhbmVsQ29uZmlnW2luZGV4XSAvIHBhbmVsQ29uZmlnW3ByZXZdICogMTAwICsgJyUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgICAgICAgZm9yIChpID0gX3AgPSAwLCBfbGVuNiA9IGFuY2hvclNldC5sZW5ndGg7IF9wIDwgX2xlbjY7IGkgPSArK19wKSB7XG4gICAgICAgICAgICAgICAgYSA9IGFuY2hvclNldFtpXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaGFkZXJzW2FuY2hvcl1bYV1bcGFuZWxOXSA9IHBhbmVsLmNoaWxkcmVuWzBdLmNoaWxkcmVuW2kgKyAxXTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGVudC5zdHlsZVttZXRyaWNdID0gY29udGVudC5zdHlsZVsnbWF4JyArIGNhcGl0YWxpemUobWV0cmljKV0gPSAoY291bnQgLyBwYW5lbENvbmZpZ1tpbmRleF0gKiAxMDAwMCAvIGNvdW50KSArICclJztcbiAgICAgICAgICAgIGNvbnRlbnQuc3R5bGVbYW5jaG9yU2V0WzBdXSA9IG9mZnNldHNbYW5jaG9yU2V0WzBdXVtpbmRleF0gKyAnJSc7XG4gICAgICAgICAgICB0aGlzLl90cmFuc2Zvcm1QYW5lbChwYW5lbCwgMCwgYW5jaG9yKTtcbiAgICAgICAgICAgIHRoaXMuX3BhbmVsc1thbmNob3JdW3BhbmVsTl0gPSBwYW5lbDtcbiAgICAgICAgICAgIGlmIChwYW5lbE4gIT09IDApIHtcbiAgICAgICAgICAgICAgdGhpcy5fcGFuZWxzW2FuY2hvcl1bcGFuZWxOIC0gMV0uYXBwZW5kQ2hpbGQocGFuZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9zdGFnZXNbYW5jaG9yXS5hcHBlbmRDaGlsZCh0aGlzLl9wYW5lbHNbYW5jaG9yXVswXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX3N0YWdlSG9sZGVyID0gY3JlYXRlRWwoJ2hvbGRlcicpO1xuICAgICAgdGhpcy5fc3RhZ2VIb2xkZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICBmb3IgKF9xID0gMCwgX2xlbjcgPSBhbmNob3JMaXN0Lmxlbmd0aDsgX3EgPCBfbGVuNzsgX3ErKykge1xuICAgICAgICBhbmNob3IgPSBhbmNob3JMaXN0W19xXTtcbiAgICAgICAgdGhpcy5fc3RhZ2VIb2xkZXIuYXBwZW5kQ2hpbGQodGhpcy5fc3RhZ2VzW2FuY2hvcl0pO1xuICAgICAgfVxuICAgICAgaWYgKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMuZWwpLnBvc2l0aW9uID09PSAnYWJzb2x1dGUnKSB7XG4gICAgICAgIHRoaXMuZWwuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgfVxuICAgICAgdGhpcy5lbC5jbGFzc0xpc3QuYWRkKGVsQ2xhc3Nlcy5hY3RpdmUpO1xuICAgICAgc2hvd0VsKHRoaXMuX3N0YWdlcy5sZWZ0KTtcbiAgICAgIHRoaXMuX2Nsb25lRWwgPSBjbG9uZUVsKHRoaXMuZWwsIHRydWUsICdjbG9uZScpO1xuICAgICAgdGhpcy5fY2xvbmVFbC5jbGFzc0xpc3QucmVtb3ZlKGVsQ2xhc3Nlcy5hY3RpdmUpO1xuICAgICAgaGlkZUVsKHRoaXMuX2Nsb25lRWwpO1xuICAgICAgdGhpcy5lbC5pbm5lckhUTUwgPSAnJztcbiAgICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy5fY2xvbmVFbCk7XG4gICAgICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMuX3N0YWdlSG9sZGVyKTtcbiAgICAgIHRoaXMuZWwucGFyZW50Tm9kZS5zdHlsZVtjc3MudHJhbnNmb3JtU3R5bGVdID0gJ3ByZXNlcnZlLTNkJztcbiAgICAgIHRoaXMuYWNjb3JkaW9uKDApO1xuICAgICAgaWYgKHRoaXMuX2NvbmZpZy5yaXBwbGUpIHtcbiAgICAgICAgdGhpcy5zZXRSaXBwbGUodGhpcy5fY29uZmlnLnJpcHBsZSk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fY29uZmlnLnRvdWNoRW5hYmxlZCkge1xuICAgICAgICB0aGlzLmVuYWJsZVRvdWNoKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX3N0ZXAgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhbmNob3IsIGFuZ2xlLCBmbiwgbmV4dCwgb3B0aW9ucywgX3JlZjE7XG4gICAgICBpZiAodGhpcy5faW5UcmFucyB8fCAhdGhpcy5fcXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2luVHJhbnMgPSB0cnVlO1xuICAgICAgX3JlZjEgPSB0aGlzLl9xdWV1ZS5zaGlmdCgpLCBmbiA9IF9yZWYxWzBdLCBhbmdsZSA9IF9yZWYxWzFdLCBhbmNob3IgPSBfcmVmMVsyXSwgb3B0aW9ucyA9IF9yZWYxWzNdO1xuICAgICAgaWYgKHRoaXMuaXNGcm96ZW4pIHtcbiAgICAgICAgdGhpcy51bmZyZWV6ZSgpO1xuICAgICAgfVxuICAgICAgbmV4dCA9IChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgICAgX3RoaXMuX3NldENhbGxiYWNrKHtcbiAgICAgICAgICAgIGFuZ2xlOiBhbmdsZSxcbiAgICAgICAgICAgIGFuY2hvcjogYW5jaG9yLFxuICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcbiAgICAgICAgICAgIGZuOiBmblxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGFyZ3MgPSBbYW5nbGUsIGFuY2hvciwgb3B0aW9uc107XG4gICAgICAgICAgaWYgKGZuLmxlbmd0aCA8IDMpIHtcbiAgICAgICAgICAgIGFyZ3Muc2hpZnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KF90aGlzLCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpO1xuICAgICAgaWYgKHRoaXMuaXNGb2xkZWRVcCkge1xuICAgICAgICBpZiAoZm4ubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fdW5mb2xkKG5leHQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFuY2hvciAhPT0gdGhpcy5fbGFzdE9wLmFuY2hvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhZ2VSZXNldChhbmNob3IsIG5leHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX2lzSWRlbnRpY2FsT3BlcmF0aW9uID0gZnVuY3Rpb24ob3ApIHtcbiAgICAgIHZhciBrZXksIF9pLCBfbGVuLCBfcmVmMSwgX3JlZjI7XG4gICAgICBpZiAoIXRoaXMuX2xhc3RPcC5mbikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9sYXN0T3AucmVzZXQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgX3JlZjEgPSBbJ2FuZ2xlJywgJ2FuY2hvcicsICdmbiddO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmMS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBrZXkgPSBfcmVmMVtfaV07XG4gICAgICAgIGlmICh0aGlzLl9sYXN0T3Bba2V5XSAhPT0gb3Bba2V5XSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgX3JlZjIgPSBvcC5vcHRpb25zO1xuICAgICAgZm9yIChrIGluIF9yZWYyKSB7XG4gICAgICAgIHYgPSBfcmVmMltrXTtcbiAgICAgICAgaWYgKHYgIT09IHRoaXMuX2xhc3RPcC5vcHRpb25zW2tdICYmIGsgIT09ICdjYWxsYmFjaycpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fc2V0Q2FsbGJhY2sgPSBmdW5jdGlvbihvcGVyYXRpb24pIHtcbiAgICAgIGlmICghdGhpcy5fY29uZmlnLnNwZWVkIHx8IHRoaXMuX2lzSWRlbnRpY2FsT3BlcmF0aW9uKG9wZXJhdGlvbikpIHtcbiAgICAgICAgdGhpcy5fY29uY2x1ZGUob3BlcmF0aW9uLm9wdGlvbnMuY2FsbGJhY2spO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcGFuZWxzW3RoaXMuX2xhc3RPcC5hbmNob3JdWzBdLmFkZEV2ZW50TGlzdGVuZXIoY3NzLnRyYW5zaXRpb25FbmQsIHRoaXMuX29uVHJhbnNpdGlvbkVuZCwgZmFsc2UpO1xuICAgICAgfVxuICAgICAgcmV0dXJuICh0aGlzLl9sYXN0T3AgPSBvcGVyYXRpb24pLnJlc2V0ID0gZmFsc2U7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9vblRyYW5zaXRpb25FbmQgPSBmdW5jdGlvbihlKSB7XG4gICAgICBlLmN1cnJlbnRUYXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihjc3MudHJhbnNpdGlvbkVuZCwgdGhpcy5fb25UcmFuc2l0aW9uRW5kLCBmYWxzZSk7XG4gICAgICByZXR1cm4gdGhpcy5fY29uY2x1ZGUodGhpcy5fbGFzdE9wLm9wdGlvbnMuY2FsbGJhY2ssIGUpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fY29uY2x1ZGUgPSBmdW5jdGlvbihjYiwgZXZlbnQpIHtcbiAgICAgIHJldHVybiBkZWZlcigoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLl9pblRyYW5zID0gZmFsc2U7XG4gICAgICAgICAgX3RoaXMuX3N0ZXAoKTtcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGNiID09PSBcImZ1bmN0aW9uXCIgPyBjYihldmVudCwgX3RoaXMpIDogdm9pZCAwO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fdHJhbnNmb3JtUGFuZWwgPSBmdW5jdGlvbihlbCwgYW5nbGUsIGFuY2hvciwgZnJhY3R1cmUpIHtcbiAgICAgIHZhciB0cmFuc1ByZWZpeCwgeCwgeSwgejtcbiAgICAgIHggPSB5ID0geiA9IDA7XG4gICAgICBzd2l0Y2ggKGFuY2hvcikge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICB5ID0gYW5nbGU7XG4gICAgICAgICAgdHJhbnNQcmVmaXggPSAnWCgtJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgIHkgPSAtYW5nbGU7XG4gICAgICAgICAgdHJhbnNQcmVmaXggPSAnWCgnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd0b3AnOlxuICAgICAgICAgIHggPSAtYW5nbGU7XG4gICAgICAgICAgdHJhbnNQcmVmaXggPSAnWSgtJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgICB4ID0gYW5nbGU7XG4gICAgICAgICAgdHJhbnNQcmVmaXggPSAnWSgnO1xuICAgICAgfVxuICAgICAgaWYgKGZyYWN0dXJlKSB7XG4gICAgICAgIHggPSB5ID0geiA9IGFuZ2xlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVsLnN0eWxlW2Nzcy50cmFuc2Zvcm1dID0gXCJyb3RhdGVYKFwiICsgeCArIFwiZGVnKSByb3RhdGVZKFwiICsgeSArIFwiZGVnKSByb3RhdGVaKFwiICsgeiArIFwiZGVnKSB0cmFuc2xhdGVcIiArIHRyYW5zUHJlZml4ICsgdGhpcy5fY29uZmlnLmdhcE51ZGdlICsgXCJweClcIjtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX25vcm1hbGl6ZUFuZ2xlID0gZnVuY3Rpb24oYW5nbGUpIHtcbiAgICAgIHZhciBtYXg7XG4gICAgICBhbmdsZSA9IHBhcnNlRmxvYXQoYW5nbGUsIDEwKTtcbiAgICAgIG1heCA9IHRoaXMuX2NvbmZpZy5tYXhBbmdsZTtcbiAgICAgIGlmIChpc05hTihhbmdsZSkpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9IGVsc2UgaWYgKGFuZ2xlID4gbWF4KSB7XG4gICAgICAgIHJldHVybiBtYXg7XG4gICAgICB9IGVsc2UgaWYgKGFuZ2xlIDwgLW1heCkge1xuICAgICAgICByZXR1cm4gLW1heDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBhbmdsZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX3NldFRyYW5zID0gZnVuY3Rpb24oZHVyYXRpb24sIGRlbGF5LCBhbmNob3IpIHtcbiAgICAgIGlmIChhbmNob3IgPT0gbnVsbCkge1xuICAgICAgICBhbmNob3IgPSB0aGlzLl9sYXN0T3AuYW5jaG9yO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXJhdGUoYW5jaG9yLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHBhbmVsLCBpLCBsZW4pIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuX3NldFBhbmVsVHJhbnMuYXBwbHkoX3RoaXMsIFthbmNob3JdLmNvbmNhdChfX3NsaWNlLmNhbGwoYXJndW1lbnRzKSwgW2R1cmF0aW9uXSwgW2RlbGF5XSkpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fc2V0UGFuZWxUcmFucyA9IGZ1bmN0aW9uKGFuY2hvciwgcGFuZWwsIGksIGxlbiwgZHVyYXRpb24sIGRlbGF5KSB7XG4gICAgICB2YXIgZGVsYXlNcywgc2hhZGVyLCBzaWRlLCBfaSwgX2xlbiwgX3JlZjE7XG4gICAgICBkZWxheU1zID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICBzd2l0Y2ggKGRlbGF5KSB7XG4gICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZy5zcGVlZCAvIGxlbiAqIGk7XG4gICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZy5zcGVlZCAvIGxlbiAqIChsZW4gLSBpIC0gMSk7XG4gICAgICAgIH1cbiAgICAgIH0pLmNhbGwodGhpcyk7XG4gICAgICBwYW5lbC5zdHlsZVtjc3MudHJhbnNpdGlvbkR1cmF0aW9uXSA9IGR1cmF0aW9uICsgJ21zJztcbiAgICAgIHBhbmVsLnN0eWxlW2Nzcy50cmFuc2l0aW9uRGVsYXldID0gZGVsYXlNcyArICdtcyc7XG4gICAgICBpZiAodGhpcy5fc2hhZGluZykge1xuICAgICAgICBfcmVmMSA9IChfX2luZGV4T2YuY2FsbChhbmNob3JMaXN0ViwgYW5jaG9yKSA+PSAwID8gYW5jaG9yTGlzdFYgOiBhbmNob3JMaXN0SCk7XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICBzaWRlID0gX3JlZjFbX2ldO1xuICAgICAgICAgIHNoYWRlciA9IHRoaXMuX3NoYWRlcnNbYW5jaG9yXVtzaWRlXVtpXTtcbiAgICAgICAgICBzaGFkZXIuc3R5bGVbY3NzLnRyYW5zaXRpb25EdXJhdGlvbl0gPSBkdXJhdGlvbiArICdtcyc7XG4gICAgICAgICAgc2hhZGVyLnN0eWxlW2Nzcy50cmFuc2l0aW9uRGVsYXldID0gZGVsYXlNcyArICdtcyc7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWxheU1zO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fc2V0U2hhZGVyID0gZnVuY3Rpb24obiwgYW5jaG9yLCBhbmdsZSkge1xuICAgICAgdmFyIGEsIGFicywgYiwgb3BhY2l0eTtcbiAgICAgIGFicyA9IE1hdGguYWJzKGFuZ2xlKTtcbiAgICAgIG9wYWNpdHkgPSBhYnMgLyA5MCAqIHRoaXMuX2NvbmZpZy5zaGFkaW5nSW50ZW5zaXR5O1xuICAgICAgaWYgKHRoaXMuX3NoYWRpbmcgPT09ICdoYXJkJykge1xuICAgICAgICBvcGFjaXR5ICo9IC4xNTtcbiAgICAgICAgaWYgKHRoaXMuX2xhc3RPcC5hbmdsZSA8IDApIHtcbiAgICAgICAgICBhbmdsZSA9IGFicztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhbmdsZSA9IC1hYnM7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wYWNpdHkgKj0gLjQ7XG4gICAgICB9XG4gICAgICBpZiAoX19pbmRleE9mLmNhbGwoYW5jaG9yTGlzdFYsIGFuY2hvcikgPj0gMCkge1xuICAgICAgICBpZiAoYW5nbGUgPCAwKSB7XG4gICAgICAgICAgYSA9IG9wYWNpdHk7XG4gICAgICAgICAgYiA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYSA9IDA7XG4gICAgICAgICAgYiA9IG9wYWNpdHk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc2hhZGVyc1thbmNob3JdLmxlZnRbbl0uc3R5bGUub3BhY2l0eSA9IGE7XG4gICAgICAgIHJldHVybiB0aGlzLl9zaGFkZXJzW2FuY2hvcl0ucmlnaHRbbl0uc3R5bGUub3BhY2l0eSA9IGI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoYW5nbGUgPCAwKSB7XG4gICAgICAgICAgYSA9IDA7XG4gICAgICAgICAgYiA9IG9wYWNpdHk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYSA9IG9wYWNpdHk7XG4gICAgICAgICAgYiA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc2hhZGVyc1thbmNob3JdLnRvcFtuXS5zdHlsZS5vcGFjaXR5ID0gYTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NoYWRlcnNbYW5jaG9yXS5ib3R0b21bbl0uc3R5bGUub3BhY2l0eSA9IGI7XG4gICAgICB9XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9zaG93U3RhZ2UgPSBmdW5jdGlvbihhbmNob3IpIHtcbiAgICAgIGlmIChhbmNob3IgIT09IHRoaXMuX2xhc3RPcC5hbmNob3IpIHtcbiAgICAgICAgaGlkZUVsKHRoaXMuX3N0YWdlc1t0aGlzLl9sYXN0T3AuYW5jaG9yXSk7XG4gICAgICAgIHRoaXMuX2xhc3RPcC5hbmNob3IgPSBhbmNob3I7XG4gICAgICAgIHRoaXMuX2xhc3RPcC5yZXNldCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGFnZXNbYW5jaG9yXS5zdHlsZVtjc3MudHJhbnNmb3JtXSA9ICd0cmFuc2xhdGUzZCgnICsgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHN3aXRjaCAoYW5jaG9yKSB7XG4gICAgICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICAgICAgcmV0dXJuICcwLCAwLCAwKSc7XG4gICAgICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgICAgIHJldHVybiBcIi1cIiArIHRoaXMuX2NvbmZpZy52UGFuZWxzLmxlbmd0aCArIFwicHgsIDAsIDApXCI7XG4gICAgICAgICAgICBjYXNlICd0b3AnOlxuICAgICAgICAgICAgICByZXR1cm4gJzAsIDAsIDApJztcbiAgICAgICAgICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICAgICAgICAgIHJldHVybiBcIjAsIC1cIiArIHRoaXMuX2NvbmZpZy5oUGFuZWxzLmxlbmd0aCArIFwicHgsIDApXCI7XG4gICAgICAgICAgfVxuICAgICAgICB9KS5jYWxsKHRoaXMpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fc3RhZ2VSZXNldCA9IGZ1bmN0aW9uKGFuY2hvciwgY2IpIHtcbiAgICAgIHZhciBmbjtcbiAgICAgIGZuID0gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKGNzcy50cmFuc2l0aW9uRW5kLCBmbiwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfdGhpcy5fc2hvd1N0YWdlKGFuY2hvcik7XG4gICAgICAgICAgcmV0dXJuIGRlZmVyKGNiKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpO1xuICAgICAgaWYgKHRoaXMuX2xhc3RPcC5hbmdsZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZm4oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3BhbmVsc1t0aGlzLl9sYXN0T3AuYW5jaG9yXVswXS5hZGRFdmVudExpc3RlbmVyKGNzcy50cmFuc2l0aW9uRW5kLCBmbiwgZmFsc2UpO1xuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXJhdGUodGhpcy5fbGFzdE9wLmFuY2hvciwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihwYW5lbCwgaSkge1xuICAgICAgICAgIF90aGlzLl90cmFuc2Zvcm1QYW5lbChwYW5lbCwgMCwgX3RoaXMuX2xhc3RPcC5hbmNob3IpO1xuICAgICAgICAgIGlmIChfdGhpcy5fc2hhZGluZykge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9zZXRTaGFkZXIoaSwgX3RoaXMuX2xhc3RPcC5hbmNob3IsIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX2dldExvbmdoYW5kQW5jaG9yID0gZnVuY3Rpb24oc2hvcnRoYW5kKSB7XG4gICAgICBzd2l0Y2ggKHNob3J0aGFuZC50b1N0cmluZygpKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICBjYXNlICdsJzpcbiAgICAgICAgY2FzZSAnNCc6XG4gICAgICAgICAgcmV0dXJuICdsZWZ0JztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICBjYXNlICdyJzpcbiAgICAgICAgY2FzZSAnMic6XG4gICAgICAgICAgcmV0dXJuICdyaWdodCc7XG4gICAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgIGNhc2UgJ3QnOlxuICAgICAgICBjYXNlICcxJzpcbiAgICAgICAgICByZXR1cm4gJ3RvcCc7XG4gICAgICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICAgIGNhc2UgJ2InOlxuICAgICAgICBjYXNlICczJzpcbiAgICAgICAgICByZXR1cm4gJ2JvdHRvbSc7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuICdsZWZ0JztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX3NldEN1cnNvciA9IGZ1bmN0aW9uKGJvb2wpIHtcbiAgICAgIGlmIChib29sID09IG51bGwpIHtcbiAgICAgICAgYm9vbCA9IHRoaXMuX3RvdWNoRW5hYmxlZDtcbiAgICAgIH1cbiAgICAgIGlmIChib29sKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsLnN0eWxlLmN1cnNvciA9IGNzcy5ncmFiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWwuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fc2V0VG91Y2ggPSBmdW5jdGlvbih0b2dnbGUpIHtcbiAgICAgIHZhciBlU3RyaW5nLCBldmVudFBhaXIsIGV2ZW50UGFpcnMsIGxpc3RlbkZuLCBtb3VzZUxlYXZlU3VwcG9ydCwgX2ksIF9qLCBfbGVuLCBfbGVuMTtcbiAgICAgIGlmICh0b2dnbGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3RvdWNoRW5hYmxlZCkge1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGxpc3RlbkZuID0gJ2FkZEV2ZW50TGlzdGVuZXInO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCF0aGlzLl90b3VjaEVuYWJsZWQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBsaXN0ZW5GbiA9ICdyZW1vdmVFdmVudExpc3RlbmVyJztcbiAgICAgIH1cbiAgICAgIHRoaXMuX3RvdWNoRW5hYmxlZCA9IHRvZ2dsZTtcbiAgICAgIHRoaXMuX3NldEN1cnNvcigpO1xuICAgICAgZXZlbnRQYWlycyA9IFtbJ1RvdWNoU3RhcnQnLCAnTW91c2VEb3duJ10sIFsnVG91Y2hFbmQnLCAnTW91c2VVcCddLCBbJ1RvdWNoTW92ZScsICdNb3VzZU1vdmUnXSwgWydUb3VjaExlYXZlJywgJ01vdXNlTGVhdmUnXV07XG4gICAgICBtb3VzZUxlYXZlU3VwcG9ydCA9ICdvbm1vdXNlbGVhdmUnIGluIHdpbmRvdztcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gZXZlbnRQYWlycy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBldmVudFBhaXIgPSBldmVudFBhaXJzW19pXTtcbiAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gZXZlbnRQYWlyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICAgIGVTdHJpbmcgPSBldmVudFBhaXJbX2pdO1xuICAgICAgICAgIGlmICghKGVTdHJpbmcgPT09ICdUb3VjaExlYXZlJyAmJiAhbW91c2VMZWF2ZVN1cHBvcnQpKSB7XG4gICAgICAgICAgICB0aGlzLmVsW2xpc3RlbkZuXShlU3RyaW5nLnRvTG93ZXJDYXNlKCksIHRoaXNbJ19vbicgKyBldmVudFBhaXJbMF1dLCBmYWxzZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZWxbbGlzdGVuRm5dKCdtb3VzZW91dCcsIHRoaXMuX29uTW91c2VPdXQsIGZhbHNlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9vblRvdWNoU3RhcnQgPSBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgYXhpczEsIF9yZWYxO1xuICAgICAgaWYgKCF0aGlzLl90b3VjaEVuYWJsZWQgfHwgdGhpcy5pc0ZvbGRlZFVwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuZW1wdHlRdWV1ZSgpO1xuICAgICAgdGhpcy5fdG91Y2hTdGFydGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuZWwuc3R5bGUuY3Vyc29yID0gY3NzLmdyYWJiaW5nO1xuICAgICAgdGhpcy5fc2V0VHJhbnMoMCwgMCk7XG4gICAgICB0aGlzLl90b3VjaEF4aXMgPSAoX3JlZjEgPSB0aGlzLl9sYXN0T3AuYW5jaG9yLCBfX2luZGV4T2YuY2FsbChhbmNob3JMaXN0ViwgX3JlZjEpID49IDApID8gJ3gnIDogJ3knO1xuICAgICAgdGhpc1tcIl9cIiArIHRoaXMuX3RvdWNoQXhpcyArIFwiTGFzdFwiXSA9IHRoaXMuX2xhc3RPcC5hbmdsZTtcbiAgICAgIGF4aXMxID0gXCJfXCIgKyB0aGlzLl90b3VjaEF4aXMgKyBcIjFcIjtcbiAgICAgIGlmIChlLnR5cGUgPT09ICdtb3VzZWRvd24nKSB7XG4gICAgICAgIHRoaXNbYXhpczFdID0gZVtcInBhZ2VcIiArICh0aGlzLl90b3VjaEF4aXMudG9VcHBlckNhc2UoKSldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc1theGlzMV0gPSBlLnRhcmdldFRvdWNoZXNbMF1bXCJwYWdlXCIgKyAodGhpcy5fdG91Y2hBeGlzLnRvVXBwZXJDYXNlKCkpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9jb25maWcudG91Y2hTdGFydENhbGxiYWNrKHRoaXNbYXhpczFdLCBlKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX29uVG91Y2hNb3ZlID0gZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIGN1cnJlbnQsIGRlbHRhLCBkaXN0YW5jZTtcbiAgICAgIGlmICghKHRoaXMuX3RvdWNoRW5hYmxlZCAmJiB0aGlzLl90b3VjaFN0YXJ0ZWQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGlmIChlLnR5cGUgPT09ICdtb3VzZW1vdmUnKSB7XG4gICAgICAgIGN1cnJlbnQgPSBlW1wicGFnZVwiICsgKHRoaXMuX3RvdWNoQXhpcy50b1VwcGVyQ2FzZSgpKV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjdXJyZW50ID0gZS50YXJnZXRUb3VjaGVzWzBdW1wicGFnZVwiICsgKHRoaXMuX3RvdWNoQXhpcy50b1VwcGVyQ2FzZSgpKV07XG4gICAgICB9XG4gICAgICBkaXN0YW5jZSA9IChjdXJyZW50IC0gdGhpc1tcIl9cIiArIHRoaXMuX3RvdWNoQXhpcyArIFwiMVwiXSkgKiB0aGlzLl9jb25maWcudG91Y2hTZW5zaXRpdml0eTtcbiAgICAgIGlmICh0aGlzLl9sYXN0T3AuYW5nbGUgPCAwKSB7XG4gICAgICAgIGlmICh0aGlzLl9sYXN0T3AuYW5jaG9yID09PSAncmlnaHQnIHx8IHRoaXMuX2xhc3RPcC5hbmNob3IgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgZGVsdGEgPSB0aGlzW1wiX1wiICsgdGhpcy5fdG91Y2hBeGlzICsgXCJMYXN0XCJdIC0gZGlzdGFuY2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVsdGEgPSB0aGlzW1wiX1wiICsgdGhpcy5fdG91Y2hBeGlzICsgXCJMYXN0XCJdICsgZGlzdGFuY2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRlbHRhID4gMCkge1xuICAgICAgICAgIGRlbHRhID0gMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuX2xhc3RPcC5hbmNob3IgPT09ICdyaWdodCcgfHwgdGhpcy5fbGFzdE9wLmFuY2hvciA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICBkZWx0YSA9IHRoaXNbXCJfXCIgKyB0aGlzLl90b3VjaEF4aXMgKyBcIkxhc3RcIl0gKyBkaXN0YW5jZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWx0YSA9IHRoaXNbXCJfXCIgKyB0aGlzLl90b3VjaEF4aXMgKyBcIkxhc3RcIl0gLSBkaXN0YW5jZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVsdGEgPCAwKSB7XG4gICAgICAgICAgZGVsdGEgPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLl9sYXN0T3AuYW5nbGUgPSBkZWx0YSA9IHRoaXMuX25vcm1hbGl6ZUFuZ2xlKGRlbHRhKTtcbiAgICAgIHRoaXMuX2xhc3RPcC5mbi5jYWxsKHRoaXMsIGRlbHRhLCB0aGlzLl9sYXN0T3AuYW5jaG9yLCB0aGlzLl9sYXN0T3Aub3B0aW9ucyk7XG4gICAgICByZXR1cm4gdGhpcy5fY29uZmlnLnRvdWNoTW92ZUNhbGxiYWNrKGRlbHRhLCBlKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX29uVG91Y2hFbmQgPSBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoIXRoaXMuX3RvdWNoRW5hYmxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLl90b3VjaFN0YXJ0ZWQgPSB0aGlzLl9pblRyYW5zID0gZmFsc2U7XG4gICAgICB0aGlzLmVsLnN0eWxlLmN1cnNvciA9IGNzcy5ncmFiO1xuICAgICAgdGhpcy5fc2V0VHJhbnModGhpcy5fY29uZmlnLnNwZWVkLCB0aGlzLl9jb25maWcucmlwcGxlKTtcbiAgICAgIHJldHVybiB0aGlzLl9jb25maWcudG91Y2hFbmRDYWxsYmFjayh0aGlzW1wiX1wiICsgdGhpcy5fdG91Y2hBeGlzICsgXCJMYXN0XCJdLCBlKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX29uVG91Y2hMZWF2ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICghKHRoaXMuX3RvdWNoRW5hYmxlZCAmJiB0aGlzLl90b3VjaFN0YXJ0ZWQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9vblRvdWNoRW5kKGUpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fb25Nb3VzZU91dCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICghKHRoaXMuX3RvdWNoRW5hYmxlZCAmJiB0aGlzLl90b3VjaFN0YXJ0ZWQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChlLnRvRWxlbWVudCAmJiAhdGhpcy5lbC5jb250YWlucyhlLnRvRWxlbWVudCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX29uVG91Y2hFbmQoZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl91bmZvbGQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgdmFyIGFuY2hvcjtcbiAgICAgIHRoaXMuX2luVHJhbnMgPSB0cnVlO1xuICAgICAgYW5jaG9yID0gdGhpcy5fbGFzdE9wLmFuY2hvcjtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyYXRlKGFuY2hvciwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihwYW5lbCwgaSwgbGVuKSB7XG4gICAgICAgICAgdmFyIGRlbGF5O1xuICAgICAgICAgIGRlbGF5ID0gX3RoaXMuX3NldFBhbmVsVHJhbnMuYXBwbHkoX3RoaXMsIFthbmNob3JdLmNvbmNhdChfX3NsaWNlLmNhbGwoYXJndW1lbnRzKSwgW190aGlzLl9jb25maWcuc3BlZWRdLCBbMV0pKTtcbiAgICAgICAgICByZXR1cm4gKGZ1bmN0aW9uKHBhbmVsLCBpLCBkZWxheSkge1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBfdGhpcy5fdHJhbnNmb3JtUGFuZWwocGFuZWwsIDAsIF90aGlzLl9sYXN0T3AuYW5jaG9yKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2hvd0VsKHBhbmVsLmNoaWxkcmVuWzBdKTtcbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gbGVuIC0gMSkge1xuICAgICAgICAgICAgICAgICAgX3RoaXMuX2luVHJhbnMgPSBfdGhpcy5pc0ZvbGRlZFVwID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIF90aGlzLl9sYXN0T3AuZm4gPSBfdGhpcy5hY2NvcmRpb247XG4gICAgICAgICAgICAgICAgICBfdGhpcy5fbGFzdE9wLmFuZ2xlID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhbmVsLnN0eWxlW2Nzcy50cmFuc2l0aW9uRHVyYXRpb25dID0gX3RoaXMuX2NvbmZpZy5zcGVlZDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSwgZGVsYXkgKyBfdGhpcy5fY29uZmlnLnNwZWVkICogLjI1KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pKHBhbmVsLCBpLCBkZWxheSk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9pdGVyYXRlID0gZnVuY3Rpb24oYW5jaG9yLCBmbikge1xuICAgICAgdmFyIGksIHBhbmVsLCBwYW5lbHMsIF9pLCBfbGVuLCBfcmVmMSwgX3Jlc3VsdHM7XG4gICAgICBfcmVmMSA9IHBhbmVscyA9IHRoaXMuX3BhbmVsc1thbmNob3JdO1xuICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAoaSA9IF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBpID0gKytfaSkge1xuICAgICAgICBwYW5lbCA9IF9yZWYxW2ldO1xuICAgICAgICBfcmVzdWx0cy5wdXNoKGZuLmNhbGwodGhpcywgcGFuZWwsIGksIHBhbmVscy5sZW5ndGgpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuZW5hYmxlVG91Y2ggPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zZXRUb3VjaCh0cnVlKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuZGlzYWJsZVRvdWNoID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc2V0VG91Y2goZmFsc2UpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5zZXRTcGVlZCA9IGZ1bmN0aW9uKHNwZWVkKSB7XG4gICAgICB2YXIgYW5jaG9yLCBfaSwgX2xlbjtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gYW5jaG9yTGlzdC5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBhbmNob3IgPSBhbmNob3JMaXN0W19pXTtcbiAgICAgICAgdGhpcy5fc2V0VHJhbnMoKHRoaXMuX2NvbmZpZy5zcGVlZCA9IHNwZWVkKSwgdGhpcy5fY29uZmlnLnJpcHBsZSwgYW5jaG9yKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5mcmVlemUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgaWYgKHRoaXMuaXNGcm96ZW4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3RhZ2VSZXNldCh0aGlzLl9sYXN0T3AuYW5jaG9yLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBfdGhpcy5pc0Zyb3plbiA9IHRydWU7XG4gICAgICAgICAgICBoaWRlRWwoX3RoaXMuX3N0YWdlSG9sZGVyKTtcbiAgICAgICAgICAgIHNob3dFbChfdGhpcy5fY2xvbmVFbCk7XG4gICAgICAgICAgICBfdGhpcy5fc2V0Q3Vyc29yKGZhbHNlKTtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIiA/IGNhbGxiYWNrKCkgOiB2b2lkIDA7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLnVuZnJlZXplID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5pc0Zyb3plbikge1xuICAgICAgICB0aGlzLmlzRnJvemVuID0gZmFsc2U7XG4gICAgICAgIGhpZGVFbCh0aGlzLl9jbG9uZUVsKTtcbiAgICAgICAgc2hvd0VsKHRoaXMuX3N0YWdlSG9sZGVyKTtcbiAgICAgICAgdGhpcy5fc2V0Q3Vyc29yKCk7XG4gICAgICAgIHRoaXMuX2xhc3RPcC5hbmdsZSA9IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICB0aGlzLmZyZWV6ZSgoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLl9zZXRUb3VjaChmYWxzZSk7XG4gICAgICAgICAgaWYgKCQpIHtcbiAgICAgICAgICAgICQuZGF0YShfdGhpcy5lbCwgYmFzZU5hbWUsIG51bGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfdGhpcy5lbC5pbm5lckhUTUwgPSBfdGhpcy5fY2xvbmVFbC5pbm5lckhUTUw7XG4gICAgICAgICAgX3RoaXMuZWwuY2xhc3NMaXN0LnJlbW92ZShlbENsYXNzZXMuYWN0aXZlKTtcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIgPyBjYWxsYmFjaygpIDogdm9pZCAwO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmVtcHR5UXVldWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgICBkZWZlcigoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5faW5UcmFucyA9IGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLnNldFJpcHBsZSA9IGZ1bmN0aW9uKGRpcikge1xuICAgICAgaWYgKGRpciA9PSBudWxsKSB7XG4gICAgICAgIGRpciA9IDE7XG4gICAgICB9XG4gICAgICB0aGlzLl9jb25maWcucmlwcGxlID0gTnVtYmVyKGRpcik7XG4gICAgICB0aGlzLnNldFNwZWVkKHRoaXMuX2NvbmZpZy5zcGVlZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuY29uc3RyYWluQW5nbGUgPSBmdW5jdGlvbihhbmdsZSkge1xuICAgICAgdGhpcy5fY29uZmlnLm1heEFuZ2xlID0gcGFyc2VGbG9hdChhbmdsZSwgMTApIHx8IGRlZmF1bHRzLm1heEFuZ2xlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLndhaXQgPSBmdW5jdGlvbihtcykge1xuICAgICAgdmFyIGZuO1xuICAgICAgZm4gPSAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KF90aGlzLl9jb25jbHVkZSwgbXMpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcyk7XG4gICAgICBpZiAodGhpcy5faW5UcmFucykge1xuICAgICAgICB0aGlzLl9xdWV1ZS5wdXNoKFtmbiwgdGhpcy5fbGFzdE9wLmFuZ2xlLCB0aGlzLl9sYXN0T3AuYW5jaG9yLCB0aGlzLl9sYXN0T3Aub3B0aW9uc10pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm4oKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5tb2RpZnlDb250ZW50ID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgIHZhciBhbmNob3IsIGksIHBhbmVsLCBzZWxlY3RvcnMsIHNldCwgX2ksIF9qLCBfbGVuLCBfbGVuMSwgX3JlZjE7XG4gICAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHNlbGVjdG9ycyA9IGZuO1xuICAgICAgICBzZXQgPSBmdW5jdGlvbihlbCwgY29udGVudCwgc3R5bGUpIHtcbiAgICAgICAgICB2YXIga2V5LCB2YWx1ZTtcbiAgICAgICAgICBpZiAoY29udGVudCkge1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gY29udGVudDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0eWxlKSB7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICB2YWx1ZSA9IHN0eWxlW2tleV07XG4gICAgICAgICAgICAgIGVsLnN0eWxlW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZm4gPSBmdW5jdGlvbihlbCkge1xuICAgICAgICAgIHZhciBjb250ZW50LCBtYXRjaCwgc2VsZWN0b3IsIHN0eWxlLCB2YWx1ZSwgX2ksIF9sZW4sIF9yZWYxO1xuICAgICAgICAgIGZvciAoc2VsZWN0b3IgaW4gc2VsZWN0b3JzKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHNlbGVjdG9yc1tzZWxlY3Rvcl07XG4gICAgICAgICAgICBjb250ZW50ID0gc3R5bGUgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgY29udGVudCA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29udGVudCA9IHZhbHVlLmNvbnRlbnQsIHN0eWxlID0gdmFsdWUuc3R5bGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7XG4gICAgICAgICAgICAgIHNldChlbCwgY29udGVudCwgc3R5bGUpO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9yZWYxID0gZWwucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgICAgIG1hdGNoID0gX3JlZjFbX2ldO1xuICAgICAgICAgICAgICBzZXQobWF0Y2gsIGNvbnRlbnQsIHN0eWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGFuY2hvckxpc3QubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgYW5jaG9yID0gYW5jaG9yTGlzdFtfaV07XG4gICAgICAgIF9yZWYxID0gdGhpcy5fcGFuZWxzW2FuY2hvcl07XG4gICAgICAgIGZvciAoaSA9IF9qID0gMCwgX2xlbjEgPSBfcmVmMS5sZW5ndGg7IF9qIDwgX2xlbjE7IGkgPSArK19qKSB7XG4gICAgICAgICAgcGFuZWwgPSBfcmVmMVtpXTtcbiAgICAgICAgICBmbihwYW5lbC5jaGlsZHJlblswXS5jaGlsZHJlblswXSwgaSwgYW5jaG9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmFjY29yZGlvbiA9IHByZXAoZnVuY3Rpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXJhdGUoYW5jaG9yLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHBhbmVsLCBpKSB7XG4gICAgICAgICAgdmFyIGRlZztcbiAgICAgICAgICBpZiAoaSAlIDIgIT09IDAgJiYgIW9wdGlvbnMudHdpc3QpIHtcbiAgICAgICAgICAgIGRlZyA9IC1hbmdsZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVnID0gYW5nbGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvcHRpb25zLnN0aWNreSkge1xuICAgICAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgICAgZGVnID0gMDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA+IDEgfHwgb3B0aW9ucy5zdGFpcnMpIHtcbiAgICAgICAgICAgICAgZGVnICo9IDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpICE9PSAwKSB7XG4gICAgICAgICAgICAgIGRlZyAqPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAob3B0aW9ucy5zdGFpcnMpIHtcbiAgICAgICAgICAgIGRlZyAqPSAtMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgX3RoaXMuX3RyYW5zZm9ybVBhbmVsKHBhbmVsLCBkZWcsIGFuY2hvciwgb3B0aW9ucy5mcmFjdHVyZSk7XG4gICAgICAgICAgaWYgKF90aGlzLl9zaGFkaW5nKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy50d2lzdCB8fCBvcHRpb25zLmZyYWN0dXJlIHx8IChpID09PSAwICYmIG9wdGlvbnMuc3RpY2t5KSkge1xuICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuX3NldFNoYWRlcihpLCBhbmNob3IsIDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChNYXRoLmFicyhkZWcpICE9PSAxODApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9zZXRTaGFkZXIoaSwgYW5jaG9yLCBkZWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9KTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmN1cmwgPSBwcmVwKGZ1bmN0aW9uKGFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpIHtcbiAgICAgIGFuZ2xlIC89IF9faW5kZXhPZi5jYWxsKGFuY2hvckxpc3RWLCBhbmNob3IpID49IDAgPyB0aGlzLl9jb25maWcudlBhbmVscy5sZW5ndGggOiB0aGlzLl9jb25maWcuaFBhbmVscy5sZW5ndGg7XG4gICAgICByZXR1cm4gdGhpcy5faXRlcmF0ZShhbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocGFuZWwsIGkpIHtcbiAgICAgICAgICBfdGhpcy5fdHJhbnNmb3JtUGFuZWwocGFuZWwsIGFuZ2xlLCBhbmNob3IpO1xuICAgICAgICAgIGlmIChfdGhpcy5fc2hhZGluZykge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9zZXRTaGFkZXIoaSwgYW5jaG9yLCAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfSk7XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5yYW1wID0gcHJlcChmdW5jdGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICB0aGlzLl90cmFuc2Zvcm1QYW5lbCh0aGlzLl9wYW5lbHNbYW5jaG9yXVsxXSwgYW5nbGUsIGFuY2hvcik7XG4gICAgICByZXR1cm4gdGhpcy5faXRlcmF0ZShhbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocGFuZWwsIGkpIHtcbiAgICAgICAgICBpZiAoaSAhPT0gMSkge1xuICAgICAgICAgICAgX3RoaXMuX3RyYW5zZm9ybVBhbmVsKHBhbmVsLCAwLCBhbmNob3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoX3RoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5fc2V0U2hhZGVyKGksIGFuY2hvciwgMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH0pO1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuZm9sZFVwID0gcHJlcChmdW5jdGlvbihhbmNob3IsIGNhbGxiYWNrKSB7XG4gICAgICBpZiAodGhpcy5pc0ZvbGRlZFVwKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIiA/IGNhbGxiYWNrKCkgOiB2b2lkIDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fc3RhZ2VSZXNldChhbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMuX2luVHJhbnMgPSBfdGhpcy5pc0ZvbGRlZFVwID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuX2l0ZXJhdGUoYW5jaG9yLCBmdW5jdGlvbihwYW5lbCwgaSwgbGVuKSB7XG4gICAgICAgICAgICB2YXIgZGVsYXksIGR1cmF0aW9uO1xuICAgICAgICAgICAgZHVyYXRpb24gPSBfdGhpcy5fY29uZmlnLnNwZWVkO1xuICAgICAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgICAgZHVyYXRpb24gLz0gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGF5ID0gX3RoaXMuX3NldFBhbmVsVHJhbnMuYXBwbHkoX3RoaXMsIFthbmNob3JdLmNvbmNhdChfX3NsaWNlLmNhbGwoYXJndW1lbnRzKSwgW2R1cmF0aW9uXSwgWzJdKSk7XG4gICAgICAgICAgICByZXR1cm4gKGZ1bmN0aW9uKHBhbmVsLCBpLCBkZWxheSkge1xuICAgICAgICAgICAgICByZXR1cm4gZGVmZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuX3RyYW5zZm9ybVBhbmVsKHBhbmVsLCAoaSA9PT0gMCA/IDkwIDogMTcwKSwgYW5jaG9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLl9pblRyYW5zID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIiA/IGNhbGxiYWNrKCkgOiB2b2lkIDA7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaGlkZUVsKHBhbmVsLmNoaWxkcmVuWzBdKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCBkZWxheSArIF90aGlzLl9jb25maWcuc3BlZWQgKiAuMjUpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pKHBhbmVsLCBpLCBkZWxheSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfSk7XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS51bmZvbGQgPSBwcmVwKGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdW5mb2xkLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSk7XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbihmbikge1xuICAgICAgcmV0dXJuIHByZXAoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLl9pdGVyYXRlKGFuY2hvciwgZnVuY3Rpb24ocGFuZWwsIGksIGxlbikge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLl90cmFuc2Zvcm1QYW5lbChwYW5lbCwgZm4oYW5nbGUsIGksIGxlbiksIGFuY2hvciwgb3B0aW9ucy5mcmFjdHVyZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSkuYmluZCh0aGlzKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgcmV0dXJuIHRoaXMuYWNjb3JkaW9uKDAsIHtcbiAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUucmV2ZWFsID0gZnVuY3Rpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICBvcHRpb25zLnN0aWNreSA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5hY2NvcmRpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLnN0YWlycyA9IGZ1bmN0aW9uKGFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpIHtcbiAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgfVxuICAgICAgb3B0aW9ucy5zdGFpcnMgPSBvcHRpb25zLnN0aWNreSA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5hY2NvcmRpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmZyYWN0dXJlID0gZnVuY3Rpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICBvcHRpb25zLmZyYWN0dXJlID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLmFjY29yZGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUudHdpc3QgPSBmdW5jdGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMuZnJhY3R1cmUgPSBvcHRpb25zLnR3aXN0ID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLmFjY29yZGlvbihhbmdsZSAvIDEwLCBhbmNob3IsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5jb2xsYXBzZSA9IGZ1bmN0aW9uKGFuY2hvciwgb3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICBvcHRpb25zLnN0aWNreSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHRoaXMuYWNjb3JkaW9uKC10aGlzLl9jb25maWcubWF4QW5nbGUsIGFuY2hvciwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmNvbGxhcHNlQWx0ID0gZnVuY3Rpb24oYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMuc3RpY2t5ID0gZmFsc2U7XG4gICAgICByZXR1cm4gdGhpcy5hY2NvcmRpb24odGhpcy5fY29uZmlnLm1heEFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLlZFUlNJT04gPSAnMS4xLjInO1xuXG4gICAgT3JpRG9taS5pc1N1cHBvcnRlZCA9IGlzU3VwcG9ydGVkO1xuXG4gICAgcmV0dXJuIE9yaURvbWk7XG5cbiAgfSkoKTtcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwgPyBtb2R1bGUuZXhwb3J0cyA6IHZvaWQgMCkge1xuICAgIG1vZHVsZS5leHBvcnRzID0gT3JpRG9taTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lICE9PSBcInVuZGVmaW5lZFwiICYmIGRlZmluZSAhPT0gbnVsbCA/IGRlZmluZS5hbWQgOiB2b2lkIDApIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gT3JpRG9taTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cuT3JpRG9taSA9IE9yaURvbWk7XG4gIH1cblxuICBpZiAoISQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAkLnByb3RvdHlwZS5vcmlEb21pID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBlbCwgaW5zdGFuY2UsIG1ldGhvZCwgbWV0aG9kTmFtZSwgX2ksIF9qLCBfbGVuLCBfbGVuMTtcbiAgICBpZiAoIWlzU3VwcG9ydGVkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMgPT09IHRydWUpIHtcbiAgICAgIHJldHVybiAkLmRhdGEodGhpc1swXSwgYmFzZU5hbWUpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgICBtZXRob2ROYW1lID0gb3B0aW9ucztcbiAgICAgIGlmICh0eXBlb2YgKG1ldGhvZCA9IE9yaURvbWkucHJvdG90eXBlW21ldGhvZE5hbWVdKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcIlwiICsgbGliTmFtZSArIFwiOiBObyBzdWNoIG1ldGhvZCBgXCIgKyBtZXRob2ROYW1lICsgXCJgXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSB0aGlzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGVsID0gdGhpc1tfaV07XG4gICAgICAgIGlmICghKGluc3RhbmNlID0gJC5kYXRhKGVsLCBiYXNlTmFtZSkpKSB7XG4gICAgICAgICAgaW5zdGFuY2UgPSAkLmRhdGEoZWwsIGJhc2VOYW1lLCBuZXcgT3JpRG9taShlbCwgb3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgICAgIG1ldGhvZC5hcHBseShpbnN0YW5jZSwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5zbGljZSgxKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IHRoaXMubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgIGVsID0gdGhpc1tfal07XG4gICAgICAgIGlmIChpbnN0YW5jZSA9ICQuZGF0YShlbCwgYmFzZU5hbWUpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJC5kYXRhKGVsLCBiYXNlTmFtZSwgbmV3IE9yaURvbWkoZWwsIG9wdGlvbnMpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9b3JpZG9taS5tYXBcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvb3JpZG9taS9vcmlkb21pLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL29yaWRvbWlcIikiXX0=
