(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/** @jsx React.DOM */

var Physics = require('impulse')
var OriDomi = require('oridomi')
var folded = new OriDomi(document.querySelector('.cover'), { speed: 0, ripple: 0, touchEnabled: false, perspective: 800 })
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

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/fake_d4b1c245.js","/")
},{"buffer":2,"impulse":13,"oMfpAn":5,"oridomi":34}],2:[function(require,module,exports){
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
  console.log(handles)
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
  this._moved = true

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
},{"./boundry":10,"./util":18,"./vector":19,"Promise":21,"buffer":2,"lodash.defaults":24,"oMfpAn":5,"touch-velocity":33}],15:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var prefixes = ['Webkit', 'Moz', 'Ms', 'ms']
var calls = []
var transformProp = prefixed('transform')

function loop() {
  requestAnimationFrame(function() {
    loop()
    var i
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
},{"buffer":2,"oMfpAn":5}],16:[function(require,module,exports){
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
    console.log(from, to)
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
},{"buffer":2,"oMfpAn":5}],34:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// Generated by CoffeeScript 1.7.1
(function() {
  var $, OriDomi, addStyle, anchorList, anchorListH, anchorListV, baseName, capitalize, cloneEl, createEl, css, defaults, defer, elClasses, getGradient, hideEl, isSupported, k, noOp, prefixList, prep, showEl, styleBuffer, supportWarning, testEl, testProp, v, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  isSupported = true;

  supportWarning = function(prop) {
    if (typeof console !== "undefined" && console !== null) {
      console.warn("OriDomi: Missing support for `" + prop + "`.");
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

  baseName = 'oridomi';

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
      transform: 'translateZ(0)',
      left: '0',
      pointerEvents: 'none',
      transitionProperty: 'opacity'
    });
    for (_i = 0, _len = anchorList.length; _i < _len; _i++) {
      anchor = anchorList[_i];
      addStyle(elClasses['shader' + capitalize(anchor)], {
        background: getGradient(anchor),
        transform: 'translateZ(0)'
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
    oriDomiClass: 'oridomi',
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
          console.warn('OriDomi: First argument must be a DOM element');
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
            throw new Error('OriDomi: Panel percentages do not sum to 100');
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
      return el.style[css.transform] = "rotateX(" + x + "deg) rotateY(" + y + "deg) rotateZ(" + z + "deg) translate" + transPrefix + this._config.gapNudge + "px) translateZ(0)";
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
          if (_this._shading && !(i === 0 && options.sticky) && Math.abs(deg) !== 180) {
            return _this._setShader(i, anchor, deg);
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

    OriDomi.VERSION = '1.1.1';

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
          console.warn("OriDomi: No such method `" + methodName + "`");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL2FwcC9zY3JpcHRzL2Zha2VfZDRiMWMyNDUuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvYWNjZWxlcmF0ZS5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvYW5pbWF0aW9uLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9hdHRhY2gtc3ByaW5nLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9ib2R5LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9ib3VuZHJ5LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9kZWNlbGVyYXRlLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9kcmFnLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvaW50ZXJhY3QuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL3JlbmRlcmVyLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9zaW11bGF0aW9uLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9zcHJpbmcuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL3V0aWwuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL3ZlY3Rvci5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvUHJvbWlzZS9jb3JlLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9Qcm9taXNlL2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9Qcm9taXNlL25vZGVfbW9kdWxlcy9hc2FwL2FzYXAuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2NvbXBvbmVudC1lbWl0dGVyL2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvaW5kZXguanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9vYmplY3R0eXBlcy9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9pc25hdGl2ZS9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9zaGlta2V5cy9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLmlzb2JqZWN0L2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9wcm9taXNlL2NvcmUuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2UvaW5kZXguanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2Uvbm9kZV9tb2R1bGVzL2FzYXAvYXNhcC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvdG91Y2gtdmVsb2NpdHkvaW5kZXguanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL29yaWRvbWkvb3JpZG9taS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmxDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUGh5c2ljcyA9IHJlcXVpcmUoJ2ltcHVsc2UnKVxudmFyIE9yaURvbWkgPSByZXF1aXJlKCdvcmlkb21pJylcbnZhciBmb2xkZWQgPSBuZXcgT3JpRG9taShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY292ZXInKSwgeyBzcGVlZDogMCwgcmlwcGxlOiAwLCB0b3VjaEVuYWJsZWQ6IGZhbHNlLCBwZXJzcGVjdGl2ZTogODAwIH0pXG52YXIgbGFzdFBlcmNlbnQgPSAxXG5mb2xkZWQuYWNjb3JkaW9uKDApXG5cbnZhciBwaHlzID0gbmV3IFBoeXNpY3MoZnVuY3Rpb24oeCkge1xuICBmb2xkZWQuYWNjb3JkaW9uKE1hdGguYWNvcyh4KSAqICgxODAgLyBNYXRoLlBJKSlcbn0pXG5cbnBoeXMucG9zaXRpb24oMSwgMClcblxudmFyIHN0YXJ0WFxuICAsIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGhcbiAgLCBpbnRlcmFjdGlvblxuICAsIG1vdXNlZG93biA9IGZhbHNlXG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIGZ1bmN0aW9uKGV2dCkge1xuICBldnQucHJldmVudERlZmF1bHQoKVxufSlcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBzdGFydClcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBzdGFydClcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG1vdmUpXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW92ZSlcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgZW5kKVxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBlbmQpXG5cbmZ1bmN0aW9uIHBhZ2VYKGV2dCkge1xuICByZXR1cm4gZXZ0LnRvdWNoZXMgJiYgZXZ0LnRvdWNoZXNbMF0ucGFnZVggfHwgZXZ0LnBhZ2VYXG59XG5cbmZ1bmN0aW9uIHN0YXJ0KGV2dCkge1xuICB2YXIgcGVyY2VudCA9IHBoeXMucG9zaXRpb24oKS54XG4gIG1vdXNlZG93biA9IHRydWVcbiAgaW50ZXJhY3Rpb24gPSBwaHlzLmludGVyYWN0KClcbiAgaW50ZXJhY3Rpb24uc3RhcnQoKVxuXG4gIGlmKHBlcmNlbnQgPD0gMCkgcGVyY2VudCA9IC4xXG5cbiAgc3RhcnRYID0gcGFnZVgoZXZ0KSAvIHBlcmNlbnRcbn1cblxuZnVuY3Rpb24gbW92ZShldnQpIHtcbiAgaWYoIW1vdXNlZG93bikgcmV0dXJuXG4gIGV2dC5wcmV2ZW50RGVmYXVsdCgpXG4gIHZhciBkZWx0YSA9IHBhZ2VYKGV2dClcbiAgICAsIHBlcmNlbnRNb3ZlZCA9IGRlbHRhIC8gc3RhcnRYXG5cbiAgaWYocGVyY2VudE1vdmVkID4gMSkgcGVyY2VudE1vdmVkID0gMVxuICBpbnRlcmFjdGlvbi5wb3NpdGlvbihwZXJjZW50TW92ZWQpXG59XG5cbmZ1bmN0aW9uIGVuZChldnQpIHtcbiAgaWYoIW1vdXNlZG93bikgcmV0dXJuXG4gIG1vdXNlZG93biA9IGZhbHNlXG4gIGV2dC5wcmV2ZW50RGVmYXVsdCgpXG4gIGludGVyYWN0aW9uLmVuZCgpXG4gIHZhciB0byA9IChwaHlzLmRpcmVjdGlvbignbGVmdCcpKSA/IDAgOiAxXG4gIHBoeXMuYWNjZWxlcmF0ZSh7IGJvdW5jZTogdHJ1ZSwgYWNjZWxlcmF0aW9uOiAzLCBtaW5Cb3VuY2VEaXN0YW5jZTogMCwgYm91Y2VBY2NlbGVyYXRpb246IDYsIGRhbXBpbmc6IC4yIH0pLnRvKHRvKS5zdGFydCgpXG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZmFrZV9kNGIxYzI0NS5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTJcblxuLyoqXG4gKiBJZiBgQnVmZmVyLl91c2VUeXBlZEFycmF5c2A6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChjb21wYXRpYmxlIGRvd24gdG8gSUU2KVxuICovXG5CdWZmZXIuX3VzZVR5cGVkQXJyYXlzID0gKGZ1bmN0aW9uICgpIHtcbiAgLy8gRGV0ZWN0IGlmIGJyb3dzZXIgc3VwcG9ydHMgVHlwZWQgQXJyYXlzLiBTdXBwb3J0ZWQgYnJvd3NlcnMgYXJlIElFIDEwKywgRmlyZWZveCA0KyxcbiAgLy8gQ2hyb21lIDcrLCBTYWZhcmkgNS4xKywgT3BlcmEgMTEuNissIGlPUyA0LjIrLiBJZiB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGFkZGluZ1xuICAvLyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXMsIHRoZW4gdGhhdCdzIHRoZSBzYW1lIGFzIG5vIGBVaW50OEFycmF5YCBzdXBwb3J0XG4gIC8vIGJlY2F1c2Ugd2UgbmVlZCB0byBiZSBhYmxlIHRvIGFkZCBhbGwgdGhlIG5vZGUgQnVmZmVyIEFQSSBtZXRob2RzLiBUaGlzIGlzIGFuIGlzc3VlXG4gIC8vIGluIEZpcmVmb3ggNC0yOS4gTm93IGZpeGVkOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzhcbiAgdHJ5IHtcbiAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDApXG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KGJ1ZilcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIHJldHVybiA0MiA9PT0gYXJyLmZvbygpICYmXG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgLy8gQ2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufSkoKVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKVxuICAgIHJldHVybiBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pXG5cbiAgdmFyIHR5cGUgPSB0eXBlb2Ygc3ViamVjdFxuXG4gIC8vIFdvcmthcm91bmQ6IG5vZGUncyBiYXNlNjQgaW1wbGVtZW50YXRpb24gYWxsb3dzIGZvciBub24tcGFkZGVkIHN0cmluZ3NcbiAgLy8gd2hpbGUgYmFzZTY0LWpzIGRvZXMgbm90LlxuICBpZiAoZW5jb2RpbmcgPT09ICdiYXNlNjQnICYmIHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgc3ViamVjdCA9IHN0cmluZ3RyaW0oc3ViamVjdClcbiAgICB3aGlsZSAoc3ViamVjdC5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgICBzdWJqZWN0ID0gc3ViamVjdCArICc9J1xuICAgIH1cbiAgfVxuXG4gIC8vIEZpbmQgdGhlIGxlbmd0aFxuICB2YXIgbGVuZ3RoXG4gIGlmICh0eXBlID09PSAnbnVtYmVyJylcbiAgICBsZW5ndGggPSBjb2VyY2Uoc3ViamVjdClcbiAgZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpXG4gICAgbGVuZ3RoID0gQnVmZmVyLmJ5dGVMZW5ndGgoc3ViamVjdCwgZW5jb2RpbmcpXG4gIGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKVxuICAgIGxlbmd0aCA9IGNvZXJjZShzdWJqZWN0Lmxlbmd0aCkgLy8gYXNzdW1lIHRoYXQgb2JqZWN0IGlzIGFycmF5LWxpa2VcbiAgZWxzZVxuICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgbmVlZHMgdG8gYmUgYSBudW1iZXIsIGFycmF5IG9yIHN0cmluZy4nKVxuXG4gIHZhciBidWZcbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICAvLyBQcmVmZXJyZWQ6IFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgYnVmID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBUSElTIGluc3RhbmNlIG9mIEJ1ZmZlciAoY3JlYXRlZCBieSBgbmV3YClcbiAgICBidWYgPSB0aGlzXG4gICAgYnVmLmxlbmd0aCA9IGxlbmd0aFxuICAgIGJ1Zi5faXNCdWZmZXIgPSB0cnVlXG4gIH1cblxuICB2YXIgaVxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cyAmJiB0eXBlb2Ygc3ViamVjdC5ieXRlTGVuZ3RoID09PSAnbnVtYmVyJykge1xuICAgIC8vIFNwZWVkIG9wdGltaXphdGlvbiAtLSB1c2Ugc2V0IGlmIHdlJ3JlIGNvcHlpbmcgZnJvbSBhIHR5cGVkIGFycmF5XG4gICAgYnVmLl9zZXQoc3ViamVjdClcbiAgfSBlbHNlIGlmIChpc0FycmF5aXNoKHN1YmplY3QpKSB7XG4gICAgLy8gVHJlYXQgYXJyYXktaXNoIG9iamVjdHMgYXMgYSBieXRlIGFycmF5XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpKVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0LnJlYWRVSW50OChpKVxuICAgICAgZWxzZVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0W2ldXG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgYnVmLndyaXRlKHN1YmplY3QsIDAsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmICFCdWZmZXIuX3VzZVR5cGVkQXJyYXlzICYmICFub1plcm8pIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGJ1ZltpXSA9IDBcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbi8vIFNUQVRJQyBNRVRIT0RTXG4vLyA9PT09PT09PT09PT09PVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gKGIpIHtcbiAgcmV0dXJuICEhKGIgIT09IG51bGwgJiYgYiAhPT0gdW5kZWZpbmVkICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGZ1bmN0aW9uIChzdHIsIGVuY29kaW5nKSB7XG4gIHZhciByZXRcbiAgc3RyID0gc3RyICsgJydcbiAgc3dpdGNoIChlbmNvZGluZyB8fCAndXRmOCcpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aCAvIDJcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gdXRmOFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAncmF3JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggKiAyXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZW5jb2RpbmcnKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIChsaXN0LCB0b3RhbExlbmd0aCkge1xuICBhc3NlcnQoaXNBcnJheShsaXN0KSwgJ1VzYWdlOiBCdWZmZXIuY29uY2F0KGxpc3QsIFt0b3RhbExlbmd0aF0pXFxuJyArXG4gICAgICAnbGlzdCBzaG91bGQgYmUgYW4gQXJyYXkuJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9IGVsc2UgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGxpc3RbMF1cbiAgfVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdG90YWxMZW5ndGggIT09ICdudW1iZXInKSB7XG4gICAgdG90YWxMZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRvdGFsTGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIodG90YWxMZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuLy8gQlVGRkVSIElOU1RBTkNFIE1FVEhPRFNcbi8vID09PT09PT09PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIF9oZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGFzc2VydChzdHJMZW4gJSAyID09PSAwLCAnSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGJ5dGUgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgYXNzZXJ0KCFpc05hTihieXRlKSwgJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gYnl0ZVxuICB9XG4gIEJ1ZmZlci5fY2hhcnNXcml0dGVuID0gaSAqIDJcbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gX3V0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF9hc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IEJ1ZmZlci5fY2hhcnNXcml0dGVuID1cbiAgICBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF9iaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBfYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIF9iYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gX3V0ZjE2bGVXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gU3VwcG9ydCBib3RoIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZylcbiAgLy8gYW5kIHRoZSBsZWdhY3kgKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIGlmICghaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHsgIC8vIGxlZ2FjeVxuICAgIHZhciBzd2FwID0gZW5jb2RpbmdcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIG9mZnNldCA9IGxlbmd0aFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IF9oZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSBfdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IF9hc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBfYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IF9iYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gX3V0ZjE2bGVXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG4gIHN0YXJ0ID0gTnVtYmVyKHN0YXJ0KSB8fCAwXG4gIGVuZCA9IChlbmQgIT09IHVuZGVmaW5lZClcbiAgICA/IE51bWJlcihlbmQpXG4gICAgOiBlbmQgPSBzZWxmLmxlbmd0aFxuXG4gIC8vIEZhc3RwYXRoIGVtcHR5IHN0cmluZ3NcbiAgaWYgKGVuZCA9PT0gc3RhcnQpXG4gICAgcmV0dXJuICcnXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IF9oZXhTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSBfdXRmOFNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IF9hc2NpaVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBfYmluYXJ5U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IF9iYXNlNjRTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gX3V0ZjE2bGVTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uICh0YXJnZXQsIHRhcmdldF9zdGFydCwgc3RhcnQsIGVuZCkge1xuICB2YXIgc291cmNlID0gdGhpc1xuXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICghdGFyZ2V0X3N0YXJ0KSB0YXJnZXRfc3RhcnQgPSAwXG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgc291cmNlLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBhc3NlcnQoZW5kID49IHN0YXJ0LCAnc291cmNlRW5kIDwgc291cmNlU3RhcnQnKVxuICBhc3NlcnQodGFyZ2V0X3N0YXJ0ID49IDAgJiYgdGFyZ2V0X3N0YXJ0IDwgdGFyZ2V0Lmxlbmd0aCxcbiAgICAgICd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgYXNzZXJ0KHN0YXJ0ID49IDAgJiYgc3RhcnQgPCBzb3VyY2UubGVuZ3RoLCAnc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChlbmQgPj0gMCAmJiBlbmQgPD0gc291cmNlLmxlbmd0aCwgJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpXG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgPCBlbmQgLSBzdGFydClcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0ICsgc3RhcnRcblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAobGVuIDwgMTAwIHx8ICFCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0X3N0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0X3N0YXJ0KVxuICB9XG59XG5cbmZ1bmN0aW9uIF9iYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gX3V0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXMgPSAnJ1xuICB2YXIgdG1wID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgaWYgKGJ1ZltpXSA8PSAweDdGKSB7XG4gICAgICByZXMgKz0gZGVjb2RlVXRmOENoYXIodG1wKSArIFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICAgICAgdG1wID0gJydcbiAgICB9IGVsc2Uge1xuICAgICAgdG1wICs9ICclJyArIGJ1ZltpXS50b1N0cmluZygxNilcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzICsgZGVjb2RlVXRmOENoYXIodG1wKVxufVxuXG5mdW5jdGlvbiBfYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspXG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIF9iaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHJldHVybiBfYXNjaWlTbGljZShidWYsIHN0YXJ0LCBlbmQpXG59XG5cbmZ1bmN0aW9uIF9oZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIF91dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2krMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gY2xhbXAoc3RhcnQsIGxlbiwgMClcbiAgZW5kID0gY2xhbXAoZW5kLCBsZW4sIGxlbilcblxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIHJldHVybiBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIHZhciBuZXdCdWYgPSBuZXcgQnVmZmVyKHNsaWNlTGVuLCB1bmRlZmluZWQsIHRydWUpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZUxlbjsgaSsrKSB7XG4gICAgICBuZXdCdWZbaV0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gICAgcmV0dXJuIG5ld0J1ZlxuICB9XG59XG5cbi8vIGBnZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5mdW5jdGlvbiBfcmVhZFVJbnQxNiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWxcbiAgaWYgKGxpdHRsZUVuZGlhbikge1xuICAgIHZhbCA9IGJ1ZltvZmZzZXRdXG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdIDw8IDhcbiAgfSBlbHNlIHtcbiAgICB2YWwgPSBidWZbb2Zmc2V0XSA8PCA4XG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdXG4gIH1cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQxNih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQxNih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRVSW50MzIgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsXG4gIGlmIChsaXR0bGVFbmRpYW4pIHtcbiAgICBpZiAob2Zmc2V0ICsgMiA8IGxlbilcbiAgICAgIHZhbCA9IGJ1ZltvZmZzZXQgKyAyXSA8PCAxNlxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXSA8PCA4XG4gICAgdmFsIHw9IGJ1ZltvZmZzZXRdXG4gICAgaWYgKG9mZnNldCArIDMgPCBsZW4pXG4gICAgICB2YWwgPSB2YWwgKyAoYnVmW29mZnNldCArIDNdIDw8IDI0ID4+PiAwKVxuICB9IGVsc2Uge1xuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsID0gYnVmW29mZnNldCArIDFdIDw8IDE2XG4gICAgaWYgKG9mZnNldCArIDIgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDJdIDw8IDhcbiAgICBpZiAob2Zmc2V0ICsgMyA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgM11cbiAgICB2YWwgPSB2YWwgKyAoYnVmW29mZnNldF0gPDwgMjQgPj4+IDApXG4gIH1cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQzMih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQzMih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgdmFyIG5lZyA9IHRoaXNbb2Zmc2V0XSAmIDB4ODBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xXG4gIGVsc2VcbiAgICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbmZ1bmN0aW9uIF9yZWFkSW50MTYgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsID0gX3JlYWRVSW50MTYoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgdHJ1ZSlcbiAgdmFyIG5lZyA9IHZhbCAmIDB4ODAwMFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZmZmIC0gdmFsICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MTYodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDE2KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZEludDMyIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbCA9IF9yZWFkVUludDMyKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHRydWUpXG4gIHZhciBuZWcgPSB2YWwgJiAweDgwMDAwMDAwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmZmZmZmZmIC0gdmFsICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MzIodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDMyKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZEZsb2F0IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHJldHVybiBpZWVlNzU0LnJlYWQoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRGbG9hdCh0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRmxvYXQodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkRG91YmxlIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgKyA3IDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHJldHVybiBpZWVlNzU0LnJlYWQoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRG91YmxlKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRG91YmxlKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZilcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpIHJldHVyblxuXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG59XG5cbmZ1bmN0aW9uIF93cml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmYpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGxlbiAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPVxuICAgICAgICAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmZmZmZmKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihsZW4gLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID1cbiAgICAgICAgKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmLCAtMHg4MClcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgdGhpcy53cml0ZVVJbnQ4KHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgdGhpcy53cml0ZVVJbnQ4KDB4ZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2ZmZiwgLTB4ODAwMClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIF93cml0ZVVJbnQxNihidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG4gIGVsc2VcbiAgICBfd3JpdGVVSW50MTYoYnVmLCAweGZmZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICBfd3JpdGVVSW50MzIoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgX3dyaXRlVUludDMyKGJ1ZiwgMHhmZmZmZmZmZiArIHZhbHVlICsgMSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZJRUVFNzU0KHZhbHVlLCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgNyA8IGJ1Zi5sZW5ndGgsXG4gICAgICAgICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmSUVFRTc1NCh2YWx1ZSwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gZmlsbCh2YWx1ZSwgc3RhcnQ9MCwgZW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiAodmFsdWUsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAwXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCkgZW5kID0gdGhpcy5sZW5ndGhcblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHZhbHVlID0gdmFsdWUuY2hhckNvZGVBdCgwKVxuICB9XG5cbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgIWlzTmFOKHZhbHVlKSwgJ3ZhbHVlIGlzIG5vdCBhIG51bWJlcicpXG4gIGFzc2VydChlbmQgPj0gc3RhcnQsICdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBhc3NlcnQoc3RhcnQgPj0gMCAmJiBzdGFydCA8IHRoaXMubGVuZ3RoLCAnc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChlbmQgPj0gMCAmJiBlbmQgPD0gdGhpcy5sZW5ndGgsICdlbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICB0aGlzW2ldID0gdmFsdWVcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBvdXQgPSBbXVxuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIG91dFtpXSA9IHRvSGV4KHRoaXNbaV0pXG4gICAgaWYgKGkgPT09IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMpIHtcbiAgICAgIG91dFtpICsgMV0gPSAnLi4uJ1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBvdXQuam9pbignICcpICsgJz4nXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgQXJyYXlCdWZmZXJgIHdpdGggdGhlICpjb3BpZWQqIG1lbW9yeSBvZiB0aGUgYnVmZmVyIGluc3RhbmNlLlxuICogQWRkZWQgaW4gTm9kZSAwLjEyLiBPbmx5IGF2YWlsYWJsZSBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgQXJyYXlCdWZmZXIuXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUudG9BcnJheUJ1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKVxuICAgICAgICBidWZbaV0gPSB0aGlzW2ldXG4gICAgICByZXR1cm4gYnVmLmJ1ZmZlclxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIHN0cmluZ3RyaW0gKHN0cikge1xuICBpZiAoc3RyLnRyaW0pIHJldHVybiBzdHIudHJpbSgpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG59XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IGdldC9zZXQgbWV0aG9kcyBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9nZXQgPSBhcnIuZ2V0XG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWQsIHdpbGwgYmUgcmVtb3ZlZCBpbiBub2RlIDAuMTMrXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbi8vIHNsaWNlKHN0YXJ0LCBlbmQpXG5mdW5jdGlvbiBjbGFtcCAoaW5kZXgsIGxlbiwgZGVmYXVsdFZhbHVlKSB7XG4gIGlmICh0eXBlb2YgaW5kZXggIT09ICdudW1iZXInKSByZXR1cm4gZGVmYXVsdFZhbHVlXG4gIGluZGV4ID0gfn5pbmRleDsgIC8vIENvZXJjZSB0byBpbnRlZ2VyLlxuICBpZiAoaW5kZXggPj0gbGVuKSByZXR1cm4gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgaW5kZXggKz0gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgcmV0dXJuIDBcbn1cblxuZnVuY3Rpb24gY29lcmNlIChsZW5ndGgpIHtcbiAgLy8gQ29lcmNlIGxlbmd0aCB0byBhIG51bWJlciAocG9zc2libHkgTmFOKSwgcm91bmQgdXBcbiAgLy8gaW4gY2FzZSBpdCdzIGZyYWN0aW9uYWwgKGUuZy4gMTIzLjQ1NikgdGhlbiBkbyBhXG4gIC8vIGRvdWJsZSBuZWdhdGUgdG8gY29lcmNlIGEgTmFOIHRvIDAuIEVhc3ksIHJpZ2h0P1xuICBsZW5ndGggPSB+fk1hdGguY2VpbCgrbGVuZ3RoKVxuICByZXR1cm4gbGVuZ3RoIDwgMCA/IDAgOiBsZW5ndGhcbn1cblxuZnVuY3Rpb24gaXNBcnJheSAoc3ViamVjdCkge1xuICByZXR1cm4gKEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHN1YmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN1YmplY3QpID09PSAnW29iamVjdCBBcnJheV0nXG4gIH0pKHN1YmplY3QpXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXlpc2ggKHN1YmplY3QpIHtcbiAgcmV0dXJuIGlzQXJyYXkoc3ViamVjdCkgfHwgQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpIHx8XG4gICAgICBzdWJqZWN0ICYmIHR5cGVvZiBzdWJqZWN0ID09PSAnb2JqZWN0JyAmJlxuICAgICAgdHlwZW9mIHN1YmplY3QubGVuZ3RoID09PSAnbnVtYmVyJ1xufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGIgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGlmIChiIDw9IDB4N0YpXG4gICAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSlcbiAgICBlbHNlIHtcbiAgICAgIHZhciBzdGFydCA9IGlcbiAgICAgIGlmIChiID49IDB4RDgwMCAmJiBiIDw9IDB4REZGRikgaSsrXG4gICAgICB2YXIgaCA9IGVuY29kZVVSSUNvbXBvbmVudChzdHIuc2xpY2Uoc3RhcnQsIGkrMSkpLnN1YnN0cigxKS5zcGxpdCgnJScpXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGgubGVuZ3RoOyBqKyspXG4gICAgICAgIGJ5dGVBcnJheS5wdXNoKHBhcnNlSW50KGhbal0sIDE2KSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoc3RyKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIHBvc1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKVxuICAgICAgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiBkZWNvZGVVdGY4Q2hhciAoc3RyKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHIpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCkgLy8gVVRGIDggaW52YWxpZCBjaGFyXG4gIH1cbn1cblxuLypcbiAqIFdlIGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHZhbHVlIGlzIGEgdmFsaWQgaW50ZWdlci4gVGhpcyBtZWFucyB0aGF0IGl0XG4gKiBpcyBub24tbmVnYXRpdmUuIEl0IGhhcyBubyBmcmFjdGlvbmFsIGNvbXBvbmVudCBhbmQgdGhhdCBpdCBkb2VzIG5vdFxuICogZXhjZWVkIHRoZSBtYXhpbXVtIGFsbG93ZWQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHZlcmlmdWludCAodmFsdWUsIG1heCkge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPj0gMCwgJ3NwZWNpZmllZCBhIG5lZ2F0aXZlIHZhbHVlIGZvciB3cml0aW5nIGFuIHVuc2lnbmVkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGlzIGxhcmdlciB0aGFuIG1heGltdW0gdmFsdWUgZm9yIHR5cGUnKVxuICBhc3NlcnQoTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlLCAndmFsdWUgaGFzIGEgZnJhY3Rpb25hbCBjb21wb25lbnQnKVxufVxuXG5mdW5jdGlvbiB2ZXJpZnNpbnQgKHZhbHVlLCBtYXgsIG1pbikge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgbGFyZ2VyIHRoYW4gbWF4aW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlID49IG1pbiwgJ3ZhbHVlIHNtYWxsZXIgdGhhbiBtaW5pbXVtIGFsbG93ZWQgdmFsdWUnKVxuICBhc3NlcnQoTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlLCAndmFsdWUgaGFzIGEgZnJhY3Rpb25hbCBjb21wb25lbnQnKVxufVxuXG5mdW5jdGlvbiB2ZXJpZklFRUU3NTQgKHZhbHVlLCBtYXgsIG1pbikge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgbGFyZ2VyIHRoYW4gbWF4aW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlID49IG1pbiwgJ3ZhbHVlIHNtYWxsZXIgdGhhbiBtaW5pbXVtIGFsbG93ZWQgdmFsdWUnKVxufVxuXG5mdW5jdGlvbiBhc3NlcnQgKHRlc3QsIG1lc3NhZ2UpIHtcbiAgaWYgKCF0ZXN0KSB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSB8fCAnRmFpbGVkIGFzc2VydGlvbicpXG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBQTFVTICAgPSAnKycuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0ggID0gJy8nLmNoYXJDb2RlQXQoMClcblx0dmFyIE5VTUJFUiA9ICcwJy5jaGFyQ29kZUF0KDApXG5cdHZhciBMT1dFUiAgPSAnYScuY2hhckNvZGVBdCgwKVxuXHR2YXIgVVBQRVIgID0gJ0EnLmNoYXJDb2RlQXQoMClcblxuXHRmdW5jdGlvbiBkZWNvZGUgKGVsdCkge1xuXHRcdHZhciBjb2RlID0gZWx0LmNoYXJDb2RlQXQoMClcblx0XHRpZiAoY29kZSA9PT0gUExVUylcblx0XHRcdHJldHVybiA2MiAvLyAnKydcblx0XHRpZiAoY29kZSA9PT0gU0xBU0gpXG5cdFx0XHRyZXR1cm4gNjMgLy8gJy8nXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIpXG5cdFx0XHRyZXR1cm4gLTEgLy9ubyBtYXRjaFxuXHRcdGlmIChjb2RlIDwgTlVNQkVSICsgMTApXG5cdFx0XHRyZXR1cm4gY29kZSAtIE5VTUJFUiArIDI2ICsgMjZcblx0XHRpZiAoY29kZSA8IFVQUEVSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIFVQUEVSXG5cdFx0aWYgKGNvZGUgPCBMT1dFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBMT1dFUiArIDI2XG5cdH1cblxuXHRmdW5jdGlvbiBiNjRUb0J5dGVBcnJheSAoYjY0KSB7XG5cdFx0dmFyIGksIGosIGwsIHRtcCwgcGxhY2VIb2xkZXJzLCBhcnJcblxuXHRcdGlmIChiNjQubGVuZ3RoICUgNCA+IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG5cdFx0fVxuXG5cdFx0Ly8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcblx0XHQvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG5cdFx0Ly8gcmVwcmVzZW50IG9uZSBieXRlXG5cdFx0Ly8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG5cdFx0Ly8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuXHRcdHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cdFx0cGxhY2VIb2xkZXJzID0gJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDIpID8gMiA6ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAxKSA/IDEgOiAwXG5cblx0XHQvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcblx0XHRhcnIgPSBuZXcgQXJyKGI2NC5sZW5ndGggKiAzIC8gNCAtIHBsYWNlSG9sZGVycylcblxuXHRcdC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcblx0XHRsID0gcGxhY2VIb2xkZXJzID4gMCA/IGI2NC5sZW5ndGggLSA0IDogYjY0Lmxlbmd0aFxuXG5cdFx0dmFyIEwgPSAwXG5cblx0XHRmdW5jdGlvbiBwdXNoICh2KSB7XG5cdFx0XHRhcnJbTCsrXSA9IHZcblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBqID0gMDsgaSA8IGw7IGkgKz0gNCwgaiArPSAzKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDE4KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDEyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpIDw8IDYpIHwgZGVjb2RlKGI2NC5jaGFyQXQoaSArIDMpKVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwMDApID4+IDE2KVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwKSA+PiA4KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdGlmIChwbGFjZUhvbGRlcnMgPT09IDIpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA+PiA0KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDEwKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDQpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPj4gMilcblx0XHRcdHB1c2goKHRtcCA+PiA4KSAmIDB4RkYpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFyclxuXHR9XG5cblx0ZnVuY3Rpb24gdWludDhUb0Jhc2U2NCAodWludDgpIHtcblx0XHR2YXIgaSxcblx0XHRcdGV4dHJhQnl0ZXMgPSB1aW50OC5sZW5ndGggJSAzLCAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuXHRcdFx0b3V0cHV0ID0gXCJcIixcblx0XHRcdHRlbXAsIGxlbmd0aFxuXG5cdFx0ZnVuY3Rpb24gZW5jb2RlIChudW0pIHtcblx0XHRcdHJldHVybiBsb29rdXAuY2hhckF0KG51bSlcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuXHRcdFx0cmV0dXJuIGVuY29kZShudW0gPj4gMTggJiAweDNGKSArIGVuY29kZShudW0gPj4gMTIgJiAweDNGKSArIGVuY29kZShudW0gPj4gNiAmIDB4M0YpICsgZW5jb2RlKG51bSAmIDB4M0YpXG5cdFx0fVxuXG5cdFx0Ly8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuXHRcdGZvciAoaSA9IDAsIGxlbmd0aCA9IHVpbnQ4Lmxlbmd0aCAtIGV4dHJhQnl0ZXM7IGkgPCBsZW5ndGg7IGkgKz0gMykge1xuXHRcdFx0dGVtcCA9ICh1aW50OFtpXSA8PCAxNikgKyAodWludDhbaSArIDFdIDw8IDgpICsgKHVpbnQ4W2kgKyAyXSlcblx0XHRcdG91dHB1dCArPSB0cmlwbGV0VG9CYXNlNjQodGVtcClcblx0XHR9XG5cblx0XHQvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG5cdFx0c3dpdGNoIChleHRyYUJ5dGVzKSB7XG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdHRlbXAgPSB1aW50OFt1aW50OC5sZW5ndGggLSAxXVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPT0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIDI6XG5cdFx0XHRcdHRlbXAgPSAodWludDhbdWludDgubGVuZ3RoIC0gMl0gPDwgOCkgKyAodWludDhbdWludDgubGVuZ3RoIC0gMV0pXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAxMClcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA+PiA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgMikgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG91dHB1dFxuXHR9XG5cblx0ZXhwb3J0cy50b0J5dGVBcnJheSA9IGI2NFRvQnl0ZUFycmF5XG5cdGV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IHVpbnQ4VG9CYXNlNjRcbn0odHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gKHRoaXMuYmFzZTY0anMgPSB7fSkgOiBleHBvcnRzKSlcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWIvYjY0LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24oYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSxcbiAgICAgIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDEsXG4gICAgICBlTWF4ID0gKDEgPDwgZUxlbikgLSAxLFxuICAgICAgZUJpYXMgPSBlTWF4ID4+IDEsXG4gICAgICBuQml0cyA9IC03LFxuICAgICAgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwLFxuICAgICAgZCA9IGlzTEUgPyAtMSA6IDEsXG4gICAgICBzID0gYnVmZmVyW29mZnNldCArIGldO1xuXG4gIGkgKz0gZDtcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKTtcbiAgcyA+Pj0gKC1uQml0cyk7XG4gIG5CaXRzICs9IGVMZW47XG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpO1xuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpO1xuICBlID4+PSAoLW5CaXRzKTtcbiAgbkJpdHMgKz0gbUxlbjtcbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCk7XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzO1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSk7XG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICBlID0gZSAtIGVCaWFzO1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pO1xufTtcblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjLFxuICAgICAgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMSxcbiAgICAgIGVNYXggPSAoMSA8PCBlTGVuKSAtIDEsXG4gICAgICBlQmlhcyA9IGVNYXggPj4gMSxcbiAgICAgIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKSxcbiAgICAgIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKSxcbiAgICAgIGQgPSBpc0xFID8gMSA6IC0xLFxuICAgICAgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMDtcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKTtcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMDtcbiAgICBlID0gZU1heDtcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMik7XG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tO1xuICAgICAgYyAqPSAyO1xuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gYztcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpO1xuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrKztcbiAgICAgIGMgLz0gMjtcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwO1xuICAgICAgZSA9IGVNYXg7XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pO1xuICAgICAgZSA9IGUgKyBlQmlhcztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pO1xuICAgICAgZSA9IDA7XG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCk7XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbTtcbiAgZUxlbiArPSBtTGVuO1xuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpO1xuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyODtcbn07XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0XCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzc1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBCb2R5ID0gcmVxdWlyZSgnLi9ib2R5JylcbnZhciBzaW11bGF0aW9uID0gcmVxdWlyZSgnLi9zaW11bGF0aW9uJylcbnZhciBCb3VuZHJ5ID0gcmVxdWlyZSgnLi9ib3VuZHJ5JylcbnZhciBBbmltYXRpb24gPSByZXF1aXJlKCcuL2FuaW1hdGlvbicpXG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKVxudmFyIGhlaWdodCA9IHJlcXVpcmUoJy4vdXRpbCcpLmhlaWdodFxuXG52YXIgQWNjZWxlcmF0ZSA9IG1vZHVsZS5leHBvcnRzID0gQW5pbWF0aW9uKHtcbiAgZGVmYXVsdE9wdGlvbnM6IHtcbiAgICBhY2NlbGVyYXRpb246IDEwMDAsXG4gICAgYm91bmNlOiBmYWxzZSxcbiAgICBtaW5Cb3VuY2VEaXN0YW5jZTogNSxcbiAgICBkYW1waW5nOiAwLjJcbiAgfSxcblxuICBvblN0YXJ0OiBmdW5jdGlvbih2ZWxvY2l0eSwgZnJvbSwgdG8sIG9wdHMsIHVwZGF0ZSwgZG9uZSkge1xuICAgIHZhciBkaXJlY3Rpb24gPSB0by5zdWIoZnJvbSkubm9ybWFsaXplKClcbiAgICB2YXIgYWNjZWxlcmF0aW9uID0gZGlyZWN0aW9uLm11bHQob3B0cy5hY2NlbGVyYXRpb24pXG4gICAgdmFyIGJvdW5jZUFjY2VsZXJhdGlvbiA9IGRpcmVjdGlvbi5tdWx0KG9wdHMuYm91bmNlQWNjZWxlcmF0aW9uIHx8IG9wdHMuYWNjZWxlcmF0aW9uKVxuICAgIHZhciBib3VuZHJ5ID0gQm91bmRyeSh7XG4gICAgICBsZWZ0OiAodG8ueCA+IGZyb20ueCkgPyAtSW5maW5pdHkgOiB0by54LFxuICAgICAgcmlnaHQ6ICh0by54ID4gZnJvbS54KSA/IHRvLnggOiBJbmZpbml0eSxcbiAgICAgIHRvcDogKHRvLnkgPiBmcm9tLnkpID8gLUluZmluaXR5IDogdG8ueSxcbiAgICAgIGJvdHRvbTogKHRvLnkgPiBmcm9tLnkpID8gdG8ueSA6IEluZmluaXR5XG4gICAgfSlcbiAgICB2YXIgYm91bmNpbmdcblxuICAgIGlmKHRvLnN1Yihmcm9tKS5ub3JtKCkgPCAuMDAxKSB7XG4gICAgICByZXR1cm4gdXBkYXRlLmRvbmUodG8sIHZlbG9jaXR5KVxuICAgIH1cblxuICAgIHZhciBib2R5ID0gdGhpcy5fYm9keSA9IEJvZHkodmVsb2NpdHksIGZyb20sIHtcbiAgICAgIGFjY2VsZXJhdGU6IGZ1bmN0aW9uKHMsIHQpIHtcbiAgICAgICAgaWYoYm91bmNpbmcpXG4gICAgICAgICAgcmV0dXJuIGJvdW5jZUFjY2VsZXJhdGlvblxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGFjY2VsZXJhdGlvblxuICAgICAgfSxcbiAgICAgIHVwZGF0ZTogZnVuY3Rpb24ocG9zaXRpb24sIHZlbG9jaXR5KSB7XG4gICAgICAgIGlmKGJvdW5kcnkuY29udGFpbnMocG9zaXRpb24pKSB7XG4gICAgICAgICAgdXBkYXRlLnN0YXRlKHBvc2l0aW9uLCB2ZWxvY2l0eSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZihvcHRzLmJvdW5jZSAmJlxuICAgICAgICAgICAgIE1hdGguYWJzKGhlaWdodChib3VuY2VBY2NlbGVyYXRpb24ubm9ybSgpLCB2ZWxvY2l0eS5ub3JtKCkgKiBvcHRzLmRhbXBpbmcsIDApKSA+IG9wdHMubWluQm91bmNlRGlzdGFuY2UpIHtcbiAgICAgICAgICAgICAgYm91bmNpbmcgPSB0cnVlXG4gICAgICAgICAgICAgIGJvZHkucG9zaXRpb24gPSBWZWN0b3IodG8pXG4gICAgICAgICAgICAgIGJvZHkudmVsb2NpdHkuc2VsZk11bHQoLW9wdHMuZGFtcGluZylcbiAgICAgICAgICAgICAgdXBkYXRlLnN0YXRlKHRvLCBib2R5LnZlbG9jaXR5KVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1cGRhdGUuZG9uZSh0bywgdmVsb2NpdHkpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgICBzaW11bGF0aW9uLmFkZEJvZHkodGhpcy5fYm9keSlcbiAgfSxcbiAgb25FbmQ6IGZ1bmN0aW9uKCkge1xuICAgIHNpbXVsYXRpb24ucmVtb3ZlQm9keSh0aGlzLl9ib2R5KVxuICB9XG59KVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9hY2NlbGVyYXRlLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnbG9kYXNoLmRlZmF1bHRzJylcbiAgLCBQcm9taXNlID0gd2luZG93LlByb21pc2UgfHwgcmVxdWlyZSgncHJvbWlzZScpXG4gICwgQm91bmRyeSA9IHJlcXVpcmUoJy4vYm91bmRyeScpXG4gICwgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKVxuICAsIEVtaXR0ZXIgPSByZXF1aXJlKCdjb21wb25lbnQtZW1pdHRlcicpXG5cbnZhciBwcm90byA9IHtcbiAgdG86IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgQm91bmRyeSlcbiAgICAgIHRoaXMuX3RvID0geFxuICAgIGVsc2VcbiAgICAgIHRoaXMuX3RvID0gVmVjdG9yKHgsIHkpXG4gICAgcmV0dXJuIHRoaXNcbiAgfSxcblxuICB2ZWxvY2l0eTogZnVuY3Rpb24oeCwgeSkge1xuICAgIHRoaXMuX3ZlbG9jaXR5ID0gVmVjdG9yKHgsIHkpXG4gICAgcmV0dXJuIHRoaXNcbiAgfSxcblxuICBmcm9tOiBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy5fZnJvbSA9IFZlY3Rvcih4LCB5KVxuICAgIHJldHVybiB0aGlzXG4gIH0sXG5cbiAgX3VwZGF0ZVN0YXRlOiBmdW5jdGlvbihwb3NpdGlvbiwgdmVsb2NpdHkpIHtcbiAgICB0aGlzLl9waHlzLnBvc2l0aW9uKHBvc2l0aW9uKVxuICAgIHRoaXMuX3BoeXMudmVsb2NpdHkodmVsb2NpdHkpXG4gIH0sXG5cbiAgY2FuY2VsOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9vbkVuZCgpXG4gICAgdGhpcy5fcnVubmluZyA9IGZhbHNlXG4gICAgdGhpcy5fcmVqZWN0KClcbiAgfSxcblxuICBydW5uaW5nOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fcnVubmluZyB8fCBmYWxzZVxuICB9LFxuXG4gIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICAgICwgZnJvbSA9ICh0aGlzLl9mcm9tKSA/IHRoaXMuX2Zyb20gOiB0aGlzLl9waHlzLnBvc2l0aW9uKClcbiAgICAgICwgdG8gPSAodGhpcy5fdG8pID8gdGhpcy5fdG8gOiB0aGlzLl9waHlzLnBvc2l0aW9uKClcbiAgICAgICwgdmVsb2NpdHkgPSAodGhpcy5fdmVsb2NpdHkpID8gdGhpcy5fdmVsb2NpdHkgOiB0aGlzLl9waHlzLnZlbG9jaXR5KClcbiAgICAgICwgb3B0cyA9IGRlZmF1bHRzKHt9LCB0aGlzLl9vcHRzIHx8IHt9LCB0aGlzLl9kZWZhdWx0T3B0cylcblxuICAgIHZhciB1cGRhdGUgPSB7XG4gICAgICBzdGF0ZTogZnVuY3Rpb24ocG9zaXRpb24sIHZlbG9jaXR5KSB7XG4gICAgICAgIHRoYXQuX3VwZGF0ZVN0YXRlKHBvc2l0aW9uLCB2ZWxvY2l0eSlcbiAgICAgIH0sXG4gICAgICBkb25lOiBmdW5jdGlvbihwb3NpdGlvbiwgdmVsb2NpdHkpIHtcbiAgICAgICAgdGhhdC5fdXBkYXRlU3RhdGUocG9zaXRpb24sIHZlbG9jaXR5KVxuICAgICAgICB0aGF0Ll9vbkVuZCgpXG4gICAgICAgIHRoYXQuX3J1bm5pbmcgPSBmYWxzZVxuICAgICAgICB0aGF0Ll9yZXNvbHZlKHsgcG9zaXRpb246IHBvc2l0aW9uLCB2ZWxvY2l0eTogdmVsb2NpdHkgfSlcbiAgICAgIH0sXG4gICAgICBjYW5jZWw6IGZ1bmN0aW9uKHBvc2l0aW9uLCB2ZWxvY2l0eSkge1xuICAgICAgICB0aGF0Ll91cGRhdGVTdGF0ZShwb3NpdGlvbiwgdmVsb2NpdHkpXG4gICAgICAgIHRoYXQuX29uRW5kKClcbiAgICAgICAgdGhhdC5fcnVubmluZyA9IGZhbHNlXG4gICAgICAgIHRoYXQuX3JlamVjdCgpXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3BoeXMuX3N0YXJ0QW5pbWF0aW9uKHRoaXMpXG5cbiAgICB0aGlzLl9ydW5uaW5nID0gdHJ1ZVxuICAgIGlmKHRvIGluc3RhbmNlb2YgQm91bmRyeSlcbiAgICAgIHRvID0gdG8ubmVhcmVzdEludGVyc2VjdChmcm9tLCB2ZWxvY2l0eSlcbiAgICB0aGlzLl9vblN0YXJ0KHZlbG9jaXR5LCBmcm9tLCB0bywgb3B0cywgdXBkYXRlKVxuXG4gICAgcmV0dXJuIHRoYXQuX2VuZGVkXG4gIH1cbn1cblxuZnVuY3Rpb24gQW5pbWF0aW9uKGNhbGxiYWNrcykge1xuICB2YXIgYW5pbWF0aW9uID0gZnVuY3Rpb24ocGh5cywgb3B0cykge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHRoaXMuX29wdHMgPSBvcHRzXG4gICAgdGhpcy5fcGh5cyA9IHBoeXNcbiAgICB0aGlzLl9vblN0YXJ0ID0gY2FsbGJhY2tzLm9uU3RhcnRcbiAgICB0aGlzLl9vbkVuZCA9IGNhbGxiYWNrcy5vbkVuZFxuICAgIHRoaXMuX2RlZmF1bHRPcHRzID0gY2FsbGJhY2tzLmRlZmF1bHRPcHRpb25zXG5cbiAgICB0aGlzLl9lbmRlZCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdGhhdC5fcmVzb2x2ZSA9IHJlc29sdmVcbiAgICAgIHRoYXQuX3JlamVjdCA9IHJlamVjdFxuICAgIH0pXG5cbiAgICB0aGlzLnN0YXJ0ID0gdGhpcy5zdGFydC5iaW5kKHRoaXMpXG4gIH1cblxuICBFbWl0dGVyKGFuaW1hdGlvbi5wcm90b3R5cGUpXG4gIGFuaW1hdGlvbi5wcm90b3R5cGUgPSBwcm90b1xuXG4gIHJldHVybiBhbmltYXRpb25cbn1cblxuXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGlvblxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9hbmltYXRpb24uanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCdsb2Rhc2guZGVmYXVsdHMnKVxuICAsIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJylcbiAgLCBzaW11bGF0aW9uID0gcmVxdWlyZSgnLi9zaW11bGF0aW9uJylcbiAgLCBCb2R5ID0gcmVxdWlyZSgnLi9ib2R5JylcblxudmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICB0ZW5zaW9uOiAxMDAsXG4gIGRhbXBpbmc6IDEwLFxuICBzZXBlcmF0aW9uOiAwLFxuICBvZmZzZXQ6IHsgeDogMCwgeTogMCB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXR0YWNoU3ByaW5nXG5mdW5jdGlvbiBBdHRhY2hTcHJpbmcocGh5cywgYXR0YWNobWVudCwgb3B0cykge1xuICB0aGlzLl9waHlzID0gcGh5c1xuICB0aGlzLl9vcHRzID0gZGVmYXVsdHMoe30sIG9wdHMgfHwge30sIGRlZmF1bHRPcHRpb25zKVxuICB0aGlzLl9wb3NpdGlvbiA9IHBoeXMucG9zaXRpb24oKVxuICB0aGlzLl92ZWxvY2l0eSA9IHBoeXMudmVsb2NpdHkoKVxuICBpZih0eXBlb2YgYXR0YWNobWVudC5wb3NpdGlvbiA9PT0gJ2Z1bmN0aW9uJylcbiAgICB0aGlzLl9hdHRhY2htZW50ID0gYXR0YWNobWVudC5wb3NpdGlvbi5iaW5kKGF0dGFjaG1lbnQpXG4gIGVsc2VcbiAgICB0aGlzLl9hdHRhY2htZW50ID0gYXR0YWNobWVudFxufVxuXG5BdHRhY2hTcHJpbmcucHJvdG90eXBlLnBvc2l0aW9uID0gZnVuY3Rpb24oeCwgeSkge1xuICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcG9zaXRpb25cbiAgfVxuICBpZih0aGlzLl9ib2R5KVxuICAgIHRoaXMuX2JvZHkucG9zaXRpb24gPSB0aGlzLl9wb3NpdGlvbiA9IFZlY3Rvcih4LCB5KVxuICBlbHNlXG4gICAgdGhpcy5fcG9zaXRpb24gPSBWZWN0b3IoeCwgeSlcbn1cblxuQXR0YWNoU3ByaW5nLnByb3RvdHlwZS52ZWxvY2l0eSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgaWYodGhpcy5fYm9keSlcbiAgICB0aGlzLl9ib2R5LnZlbG9jaXR5ID0gdGhpcy5fdmVsb2NpdHkgPSBWZWN0b3IoeCwgeSlcbiAgZWxzZVxuICAgIHRoaXMuX3ZlbG9jaXR5ID0gVmVjdG9yKHgsIHkpXG59XG5cbkF0dGFjaFNwcmluZy5wcm90b3R5cGUuY2FuY2VsID0gZnVuY3Rpb24oeCwgeSkge1xuICB0aGlzLl9ydW5uaW5nID0gZmFsc2VcbiAgc2ltdWxhdGlvbi5yZW1vdmVCb2R5KHRoaXMuX2JvZHkpXG59XG5cbkF0dGFjaFNwcmluZy5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgdGhpcy5fcnVubmluZyA9IGZhbHNlXG4gIHNpbXVsYXRpb24ucmVtb3ZlQm9keSh0aGlzLl9ib2R5KVxufVxuXG5BdHRhY2hTcHJpbmcucHJvdG90eXBlLnJ1bm5pbmcgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHJldHVybiB0aGlzLl9ydW5uaW5nXG59XG5cbndpbmRvdy51bml0ID0gMFxuQXR0YWNoU3ByaW5nLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYXR0YWNobWVudCA9IHRoaXMuX2F0dGFjaG1lbnRcbiAgICAsIG9wdHMgPSB0aGlzLl9vcHRzXG4gICAgLCBwaHlzID0gdGhpcy5fcGh5c1xuICAgICwgdmVsb2NpdHkgPSB0aGlzLl92ZWxvY2l0eVxuICAgICwgcG9zaXRpb24gPSB0aGlzLl9wb3NpdGlvblxuICAgICwgdGhhdCA9IHRoaXNcblxuICBwaHlzLl9zdGFydEFuaW1hdGlvbih0aGlzKVxuXG4gIHRoaXMuX3J1bm5pbmcgPSB0cnVlXG5cbiAgdmFyIGJvZHkgPSB0aGlzLl9ib2R5ID0gQm9keSh2ZWxvY2l0eSwgcG9zaXRpb24sIHtcbiAgICBhY2NlbGVyYXRlOiBmdW5jdGlvbihzdGF0ZSwgdCkge1xuICAgICAgdmFyIGRpc3RWZWMgPSBzdGF0ZS5wb3NpdGlvbi5zZWxmU3ViKGF0dGFjaG1lbnQoKSlcbiAgICAgICAgLCBkaXN0ID0gZGlzdFZlYy5ub3JtKClcbiAgICAgICAgLCBkaXN0Tm9ybSA9IGRpc3RWZWMubm9ybWFsaXplKClcblxuICAgICAgaWYoZGlzdE5vcm0ueCA9PT0gMCAmJiBkaXN0Tm9ybS55ID09PSAwKSB7XG4gICAgICAgIGRpc3ROb3JtLnggPSBkaXN0Tm9ybS55ID0gMVxuICAgICAgICBkaXN0Tm9ybS5ub3JtYWxpemUoKVxuICAgICAgfVxuICAgICAgdmFyIGFjY2VsID0gZGlzdE5vcm1cbiAgICAgICAgLnNlbGZNdWx0KC1vcHRzLnRlbnNpb24pXG4gICAgICAgIC5zZWxmTXVsdChkaXN0IC0gb3B0cy5zZXBlcmF0aW9uKVxuICAgICAgICAuc2VsZlN1YihzdGF0ZS52ZWxvY2l0eS5zZWxmTXVsdChvcHRzLmRhbXBpbmcpKVxuXG4gICAgICByZXR1cm4gYWNjZWxcbiAgICB9LFxuICAgIHVwZGF0ZTogZnVuY3Rpb24ocG9zaXRpb24sIHZlbG9jaXR5KSB7XG4gICAgICB0aGF0Ll9wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cbiAgICAgIHRoYXQuX3ZlbG9jaXR5ID0gYm9keS52ZWxvY2l0eVxuICAgICAgaWYob3B0cy5vZmZzZXQpIHtcbiAgICAgICAgdmFyIHBvcyA9IHBvc2l0aW9uLmFkZChvcHRzLm9mZnNldClcbiAgICAgICAgcGh5cy5wb3NpdGlvbihwb3MpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwaHlzLnBvc2l0aW9uKHBvc2l0aW9uKVxuICAgICAgfVxuICAgICAgcGh5cy52ZWxvY2l0eSh2ZWxvY2l0eSlcbiAgICB9XG4gIH0pXG4gIHNpbXVsYXRpb24uYWRkQm9keShib2R5KVxuICByZXR1cm4gdGhpc1xufVxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvYXR0YWNoLXNwcmluZy5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG5cbm1vZHVsZS5leHBvcnRzID0gQm9keVxuXG5mdW5jdGlvbiBCb2R5KHZlbCwgZnJvbSwgZm5zKSB7XG4gIGlmKCEodGhpcyBpbnN0YW5jZW9mIEJvZHkpKSByZXR1cm4gbmV3IEJvZHkodmVsLCBmcm9tLCBmbnMpXG5cbiAgdGhpcy5wcmV2aW91c1Bvc2l0aW9uID0gdGhpcy5wb3NpdGlvbiA9IFZlY3Rvcihmcm9tKVxuICB0aGlzLnZlbG9jaXR5ID0gVmVjdG9yKHZlbClcbiAgdGhpcy5fZm5zID0gZm5zXG59XG5cbkJvZHkucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKGFscGhhKSB7XG4gIHZhciBwb3MgPSB0aGlzLnByZXZpb3VzUG9zaXRpb24uY2xvbmUoKS5sZXJwKHRoaXMucG9zaXRpb24sIGFscGhhKVxuICB0aGlzLl9mbnMudXBkYXRlKHBvcywgdGhpcy52ZWxvY2l0eSlcbn1cblxuQm9keS5wcm90b3R5cGUuYWNjZWxlcmF0ZSA9IGZ1bmN0aW9uKHN0YXRlLCB0KSB7XG4gIHJldHVybiB0aGlzLl9mbnMuYWNjZWxlcmF0ZShzdGF0ZSwgdClcbn1cblxuQm9keS5wcm90b3R5cGUuYXRSZXN0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnZlbG9jaXR5Lm5vcm0oKSA8IC4wMVxufVxuXG5Cb2R5LnByb3RvdHlwZS5hdFBvc2l0aW9uID0gZnVuY3Rpb24ocG9zKSB7XG4gIC8vcmV0dXJuIHdoZXRoZXIgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhpcy5wb3NpdGlvbiBhbmQgcG9zIGlzIGxlc3MgdGhhbiAuMVxuICByZXR1cm4gdGhpcy5wb3NpdGlvbi5zdWIoVmVjdG9yKHBvcykpLm5vcm0oKSA8IC4wMVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9ib2R5LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJylcbm1vZHVsZS5leHBvcnRzID0gQm91bmRyeVxuXG5mdW5jdGlvbiBwb2ludEJldHdlZW4ocCwgcDEsIHAyKSB7XG4gIHJldHVybiBwID49IHAxICYmIHAgPD0gcDJcbn1cblxuZnVuY3Rpb24geUludGVyc2VjdCh5LCBwb2ludCwgZGlyZWN0aW9uKSB7XG4gIHZhciBmYWN0b3IgPSAoeSAtIHBvaW50LnkpIC8gZGlyZWN0aW9uLnlcbiAgcmV0dXJuIHBvaW50LmFkZChkaXJlY3Rpb24uY2xvbmUoKS5tdWx0KGZhY3RvcikpXG59XG5cbmZ1bmN0aW9uIHhJbnRlcnNlY3QoeCwgcG9pbnQsIGRpcmVjdGlvbikge1xuICB2YXIgZmFjdG9yID0gKHggLSBwb2ludC54KSAvIGRpcmVjdGlvbi54XG4gIHJldHVybiBwb2ludC5hZGQoZGlyZWN0aW9uLmNsb25lKCkubXVsdChmYWN0b3IpKVxufVxuXG5Cb3VuZHJ5LnByb3RvdHlwZS5hcHBseURhbXBpbmcgPSBmdW5jdGlvbihwb3NpdGlvbiwgZGFtcGluZykge1xuICB2YXIgeCA9IHBvc2l0aW9uLnhcbiAgICAsIHkgPSBwb3NpdGlvbi55XG5cbiAgaWYoeCA8IHRoaXMubGVmdClcbiAgICB4ID0gdGhpcy5sZWZ0IC0gKHRoaXMubGVmdCAtIHgpICogZGFtcGluZ1xuXG4gIGlmKHkgPCB0aGlzLnRvcClcbiAgICB5ID0gdGhpcy50b3AgLSAodGhpcy50b3AgLSB5KSAqIGRhbXBpbmdcblxuICBpZih4ID4gdGhpcy5yaWdodClcbiAgICB4ID0gdGhpcy5yaWdodCAtICh0aGlzLnJpZ2h0IC0geCkgKiBkYW1waW5nXG5cbiAgaWYoeSA+IHRoaXMuYm90dG9tKVxuICAgIHkgPSB0aGlzLmJvdHRvbSAtICh0aGlzLmJvdHRvbSAtIHkpICogZGFtcGluZ1xuXG4gIHJldHVybiBWZWN0b3IoeCwgeSlcbn1cblxuZnVuY3Rpb24gQm91bmRyeShib3VuZHJ5KSB7XG4gIGlmKCEodGhpcyBpbnN0YW5jZW9mIEJvdW5kcnkpKVxuICAgIHJldHVybiBuZXcgQm91bmRyeShib3VuZHJ5KVxuXG4gIHRoaXMubGVmdCA9ICh0eXBlb2YgYm91bmRyeS5sZWZ0ICE9PSAndW5kZWZpbmVkJykgPyBib3VuZHJ5LmxlZnQgOiAtSW5maW5pdHlcbiAgdGhpcy5yaWdodCA9ICh0eXBlb2YgYm91bmRyeS5yaWdodCAhPT0gJ3VuZGVmaW5lZCcpID8gYm91bmRyeS5yaWdodCA6IEluZmluaXR5XG4gIHRoaXMudG9wID0gKHR5cGVvZiBib3VuZHJ5LnRvcCAhPT0gJ3VuZGVmaW5lZCcpID8gYm91bmRyeS50b3AgOiAtSW5maW5pdHlcbiAgdGhpcy5ib3R0b20gPSAodHlwZW9mIGJvdW5kcnkuYm90dG9tICE9PSAndW5kZWZpbmVkJykgPyBib3VuZHJ5LmJvdHRvbSA6IEluZmluaXR5XG59XG5cbkJvdW5kcnkucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24ocHQpIHtcbiAgcmV0dXJuIHB0LnggPj0gdGhpcy5sZWZ0ICYmXG4gICAgICAgICBwdC54IDw9IHRoaXMucmlnaHQgJiZcbiAgICAgICAgIHB0LnkgPj0gdGhpcy50b3AgJiZcbiAgICAgICAgIHB0LnkgPD0gdGhpcy5ib3R0b21cbn1cblxuQm91bmRyeS5wcm90b3R5cGUubmVhcmVzdEludGVyc2VjdCA9IGZ1bmN0aW9uKHBvaW50LCB2ZWxvY2l0eSkge1xuICB2YXIgZGlyZWN0aW9uID0gVmVjdG9yKHZlbG9jaXR5KS5ub3JtYWxpemUoKVxuICAgICwgcG9pbnQgPSBWZWN0b3IocG9pbnQpXG4gICAgLCBpc2VjdFxuICAgICwgZGlzdFhcbiAgICAsIGRpc3RZXG5cbiAgaWYodmVsb2NpdHkueSA8IDApXG4gICAgaXNlY3QgPSB5SW50ZXJzZWN0KHRoaXMudG9wLCBwb2ludCwgZGlyZWN0aW9uKVxuICBpZih2ZWxvY2l0eS55ID4gMClcbiAgICBpc2VjdCA9IHlJbnRlcnNlY3QodGhpcy5ib3R0b20sIHBvaW50LCBkaXJlY3Rpb24pXG5cbiAgaWYoaXNlY3QgJiYgcG9pbnRCZXR3ZWVuKGlzZWN0LngsIHRoaXMubGVmdCwgdGhpcy5yaWdodCkpXG4gICAgcmV0dXJuIGlzZWN0XG5cbiAgaWYodmVsb2NpdHkueCA8IDApXG4gICAgaXNlY3QgPSB4SW50ZXJzZWN0KHRoaXMubGVmdCwgcG9pbnQsIGRpcmVjdGlvbilcbiAgaWYodmVsb2NpdHkueCA+IDApXG4gICAgaXNlY3QgPSB4SW50ZXJzZWN0KHRoaXMucmlnaHQsIHBvaW50LCBkaXJlY3Rpb24pXG5cbiAgaWYoaXNlY3QgJiYgcG9pbnRCZXR3ZWVuKGlzZWN0LnksIHRoaXMudG9wLCB0aGlzLmJvdHRvbSkpXG4gICAgcmV0dXJuIGlzZWN0XG5cbiAgLy9pZiB0aGUgdmVsb2NpdHkgaXMgemVybywgb3IgaXQgZGlkbid0IGludGVyc2VjdCBhbnkgbGluZXMgKG91dHNpZGUgdGhlIGJveClcbiAgLy9qdXN0IHNlbmQgaXQgaXQgdGhlIG5lYXJlc3QgYm91bmRyeVxuICBkaXN0WCA9IChNYXRoLmFicyhwb2ludC54IC0gdGhpcy5sZWZ0KSA8IE1hdGguYWJzKHBvaW50LnggLSB0aGlzLnJpZ2h0KSkgPyB0aGlzLmxlZnQgOiB0aGlzLnJpZ2h0XG4gIGRpc3RZID0gKE1hdGguYWJzKHBvaW50LnkgLSB0aGlzLnRvcCkgPCBNYXRoLmFicyhwb2ludC55IC0gdGhpcy5ib3R0b20pKSA/IHRoaXMudG9wIDogdGhpcy5ib3R0b21cblxuICByZXR1cm4gKGRpc3RYIDwgZGlzdFkpID8gVmVjdG9yKGRpc3RYLCBwb2ludC55KSA6IFZlY3Rvcihwb2ludC54LCBkaXN0WSlcbn1cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2JvdW5kcnkuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgQm9keSA9IHJlcXVpcmUoJy4vYm9keScpXG52YXIgc2ltdWxhdGlvbiA9IHJlcXVpcmUoJy4vc2ltdWxhdGlvbicpXG52YXIgQm91bmRyeSA9IHJlcXVpcmUoJy4vYm91bmRyeScpXG52YXIgQW5pbWF0aW9uID0gcmVxdWlyZSgnLi9hbmltYXRpb24nKVxuXG52YXIgRGVjZWxlcmF0ZSA9IG1vZHVsZS5leHBvcnRzID0gQW5pbWF0aW9uKHtcbiAgZGVmYXVsdE9wdGlvbnM6IHtcbiAgICBkZWNlbGVyYXRpb246IDQwMFxuICB9LFxuICBvblN0YXJ0OiBmdW5jdGlvbih2ZWxvY2l0eSwgZnJvbSwgdG8sIG9wdHMsIHVwZGF0ZSwgZG9uZSkge1xuICAgIHZhciBkaXJlY3Rpb24gPSB0by5zdWIoZnJvbSkubm9ybWFsaXplKClcbiAgICAgICwgZGVjZWxlcmF0aW9uID0gZGlyZWN0aW9uLm11bHQob3B0cy5kZWNlbGVyYXRpb24pLm5lZ2F0ZSgpXG4gICAgICAsIGJvdW5kcnkgPSBCb3VuZHJ5KHtcbiAgICAgIGxlZnQ6IE1hdGgubWluKHRvLngsIGZyb20ueCksXG4gICAgICByaWdodDogTWF0aC5tYXgodG8ueCwgZnJvbS54KSxcbiAgICAgIHRvcDogTWF0aC5taW4odG8ueSwgZnJvbS55KSxcbiAgICAgIGJvdHRvbTogTWF0aC5tYXgodG8ueSwgZnJvbS55KVxuICAgIH0pXG5cbiAgICB2ZWxvY2l0eSA9IGRpcmVjdGlvbi5tdWx0KHZlbG9jaXR5Lm5vcm0oKSlcblxuICAgIHRoaXMuX2JvZHkgPSBCb2R5KHZlbG9jaXR5LCBmcm9tLCB7XG4gICAgICBhY2NlbGVyYXRlOiBmdW5jdGlvbihzLCB0KSB7XG4gICAgICAgIHJldHVybiBkZWNlbGVyYXRpb25cbiAgICAgIH0sXG4gICAgICB1cGRhdGU6IGZ1bmN0aW9uKHBvc2l0aW9uLCB2ZWxvY2l0eSkge1xuICAgICAgICBpZighZGlyZWN0aW9uLmRpcmVjdGlvbkVxdWFsKHZlbG9jaXR5KSkge1xuICAgICAgICAgIHVwZGF0ZS5jYW5jZWwocG9zaXRpb24sIHsgeDogMCwgeTogMCB9KVxuICAgICAgICB9IGVsc2UgaWYoYm91bmRyeS5jb250YWlucyhwb3NpdGlvbikpIHtcbiAgICAgICAgICB1cGRhdGUuc3RhdGUocG9zaXRpb24sIHZlbG9jaXR5KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZS5kb25lKHRvLCB2ZWxvY2l0eSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gICAgc2ltdWxhdGlvbi5hZGRCb2R5KHRoaXMuX2JvZHkpXG4gIH0sXG5cbiAgb25FbmQ6IGZ1bmN0aW9uKCkge1xuICAgIHNpbXVsYXRpb24ucmVtb3ZlQm9keSh0aGlzLl9ib2R5KVxuICB9XG59KVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9kZWNlbGVyYXRlLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCdjb21wb25lbnQtZW1pdHRlcicpXG4gICwgZGVmYXVsdHMgPSByZXF1aXJlKCdsb2Rhc2guZGVmYXVsdHMnKVxuXG52YXIgZGVmYXVsdE9wdHMgPSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IERyYWdcblxuZnVuY3Rpb24gRHJhZyhwaHlzLCBvcHRzLCBzdGFydCkge1xuICB2YXIgaGFuZGxlc1xuXG4gIHRoaXMuX3BoeXMgPSBwaHlzXG4gIGlmKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5fc3RhcnRGbiA9IG9wdHNcbiAgICBvcHRzID0ge31cbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9zdGFydEZuID0gc3RhcnRcbiAgfVxuXG4gIHRoaXMuX29wdHMgPSBkZWZhdWx0cyh7fSwgZGVmYXVsdE9wdHMsIG9wdHMpXG4gIGhhbmRsZXMgPSB0aGlzLl9vcHRzLmhhbmRsZVxuXG5cbiAgaWYoaGFuZGxlcyAmJiAhaGFuZGxlcy5sZW5ndGgpIHtcbiAgICBoYW5kbGVzID0gW2hhbmRsZXNdXG4gIH0gZWxzZSBpZihoYW5kbGVzICYmIGhhbmRsZXMubGVuZ3RoKSB7XG4gICAgaGFuZGxlcyA9IFtdLnNsaWNlLmNhbGwoaGFuZGxlcylcbiAgfSBlbHNlIHtcbiAgICBoYW5kbGVzID0gcGh5cy5lbHNcbiAgfVxuICBjb25zb2xlLmxvZyhoYW5kbGVzKVxuICBoYW5kbGVzLmZvckVhY2godGhpcy5fc2V0dXBIYW5kbGUsIHRoaXMpXG59XG5cbkVtaXR0ZXIoRHJhZy5wcm90b3R5cGUpXG5cbkRyYWcucHJvdG90eXBlLm1vdmVkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9tb3ZlZFxufVxuXG5EcmFnLnByb3RvdHlwZS5fc2V0dXBIYW5kbGUgPSBmdW5jdGlvbihlbCkge1xuICAvL3N0YXJ0IGV2ZW50c1xuICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fc3RhcnQuYmluZCh0aGlzKSlcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fc3RhcnQuYmluZCh0aGlzKSlcblxuICAvL21vdmUgZXZlbnRzXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuX21vdmUuYmluZCh0aGlzKSlcbiAgLy9hcHBseSB0aGUgbW92ZSBldmVudCB0byB0aGUgd2luZG93LCBzbyBpdCBrZWVwcyBtb3ZpbmcsXG4gIC8vZXZlbnQgaWYgdGhlIGhhbmRsZSBkb2Vzbid0XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9tb3ZlLmJpbmQodGhpcykpXG5cbiAgLy9lbmQgZXZlbnRzXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5fZW5kLmJpbmQodGhpcykpXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5fZW5kLmJpbmQodGhpcykpXG59XG5cbkRyYWcucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uKGV2dCkge1xuICBldnQucHJldmVudERlZmF1bHQoKVxuICB0aGlzLl9tb3VzZWRvd24gPSB0cnVlXG4gIHRoaXMuX21vdmVkID0gZmFsc2VcbiAgdGhpcy5faW50ZXJhY3Rpb24gPSB0aGlzLl9waHlzLmludGVyYWN0KHtcbiAgICBib3VuZHJ5OiB0aGlzLl9vcHRzLmJvdW5kcnksXG4gICAgZGFtcGluZzogdGhpcy5fb3B0cy5kYW1waW5nLFxuICAgIGRpcmVjdGlvbjogdGhpcy5fb3B0cy5kaXJlY3Rpb25cbiAgfSlcbiAgdmFyIHByb21pc2UgPSB0aGlzLl9pbnRlcmFjdGlvbi5zdGFydChldnQpXG4gIHRoaXMuX3N0YXJ0Rm4gJiYgdGhpcy5fc3RhcnRGbihwcm9taXNlKVxuICB0aGlzLmVtaXQoJ3N0YXJ0JywgZXZ0KVxufVxuXG5EcmFnLnByb3RvdHlwZS5fbW92ZSA9IGZ1bmN0aW9uKGV2dCkge1xuICBpZighdGhpcy5fbW91c2Vkb3duKSByZXR1cm5cbiAgdGhpcy5fbW92ZWQgPSB0cnVlXG5cbiAgZXZ0LnByZXZlbnREZWZhdWx0KClcbiAgdGhpcy5faW50ZXJhY3Rpb24udXBkYXRlKGV2dClcbiAgdGhpcy5lbWl0KCdtb3ZlJywgZXZ0KVxufVxuXG5EcmFnLnByb3RvdHlwZS5fZW5kID0gZnVuY3Rpb24oZXZ0KSB7XG4gIGlmKCF0aGlzLl9tb3VzZWRvd24pIHJldHVyblxuICBldnQucHJldmVudERlZmF1bHQoKVxuXG4gIHRoaXMuX21vdXNlZG93biA9IGZhbHNlXG5cbiAgdGhpcy5faW50ZXJhY3Rpb24uZW5kKClcbiAgdGhpcy5lbWl0KCdlbmQnLCBldnQpXG59XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9kcmFnLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIHNpbXVsYXRpb24gPSByZXF1aXJlKCcuL3NpbXVsYXRpb24nKVxudmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJylcbnZhciBSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKVxudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnbG9kYXNoLmRlZmF1bHRzJylcbnZhciBTcHJpbmcgPSByZXF1aXJlKCcuL3NwcmluZycpXG52YXIgQXR0YWNoU3ByaW5nID0gcmVxdWlyZSgnLi9hdHRhY2gtc3ByaW5nJylcbnZhciBEZWNlbGVyYXRlID0gcmVxdWlyZSgnLi9kZWNlbGVyYXRlJylcbnZhciBBY2NlbGVyYXRlID0gcmVxdWlyZSgnLi9hY2NlbGVyYXRlJylcbnZhciBEcmFnID0gcmVxdWlyZSgnLi9kcmFnJylcbnZhciBJbnRlcmFjdCA9IHJlcXVpcmUoJy4vaW50ZXJhY3QnKVxudmFyIEJvdW5kcnkgPSByZXF1aXJlKCcuL2JvdW5kcnknKVxudmFyIFByb21pc2UgPSB3aW5kb3cuUHJvbWlzZSB8fCByZXF1aXJlKCdwcm9taXNlJylcblxubW9kdWxlLmV4cG9ydHMgPSBQaHlzaWNzXG5cbmZ1bmN0aW9uIFBoeXNpY3MocmVuZGVyZXJPckVscykge1xuICBpZighKHRoaXMgaW5zdGFuY2VvZiBQaHlzaWNzKSkge1xuICAgIHJldHVybiBuZXcgUGh5c2ljcyhyZW5kZXJlck9yRWxzKVxuICB9XG4gIGlmKHR5cGVvZiByZW5kZXJlck9yRWxzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5fcmVuZGVyID0gcmVuZGVyZXJPckVsc1xuICAgIHRoaXMuZWxzID0gW11cbiAgfSBlbHNlIHtcbiAgICBpZihyZW5kZXJlck9yRWxzLmxlbmd0aClcbiAgICAgIHRoaXMuZWxzID0gW10uc2xpY2UuY2FsbChyZW5kZXJlck9yRWxzKVxuICAgIGVsc2VcbiAgICAgIHRoaXMuZWxzID0gW3JlbmRlcmVyT3JFbHNdXG5cbiAgICB0aGlzLl9yZW5kZXJlciA9IG5ldyBSZW5kZXJlcih0aGlzLmVscylcbiAgICB0aGlzLl9yZW5kZXIgPSB0aGlzLl9yZW5kZXJlci51cGRhdGUuYmluZCh0aGlzLl9yZW5kZXJlcilcbiAgfVxuXG4gIHRoaXMuX3Bvc2l0aW9uID0gVmVjdG9yKDAsIDApXG4gIHRoaXMuX3ZlbG9jaXR5ID0gVmVjdG9yKDAsIDApXG59XG5cblBoeXNpY3MuQm91bmRyeSA9IEJvdW5kcnlcblBoeXNpY3MuVmVjdG9yID0gVmVjdG9yXG5QaHlzaWNzLlByb21pc2UgPSBQcm9taXNlXG5cblBoeXNpY3MucHJvdG90eXBlLnN0eWxlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX3JlbmRlcmVyLnN0eWxlLmFwcGx5KHRoaXMuX3JlbmRlcmVyLCBhcmd1bWVudHMpXG4gIHJldHVybiB0aGlzXG59XG5cblBoeXNpY3MucHJvdG90eXBlLnZpc2libGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fcmVuZGVyZXIudmlzaWJsZS5hcHBseSh0aGlzLl9yZW5kZXJlciwgYXJndW1lbnRzKVxuICByZXR1cm4gdGhpc1xufVxuXG5QaHlzaWNzLnByb3RvdHlwZS5kaXJlY3Rpb24gPSBmdW5jdGlvbihkKSB7XG4gIHZhciB2ZWxvY2l0eSA9IHRoaXMudmVsb2NpdHkoKVxuICAgICwgaCwgdiwgY1xuXG4gIGlmKHZlbG9jaXR5LnggPCAwKSAgICAgIGggPSAnbGVmdCdcbiAgZWxzZSBpZih2ZWxvY2l0eS54ID4gMCkgaCA9ICdyaWdodCdcblxuICBpZih2ZWxvY2l0eS55IDwgMCkgICAgICB2ID0gJ3VwJ1xuICBlbHNlIGlmKHZlbG9jaXR5LnkgPiAwKSB2ID0gJ2Rvd24nXG5cbiAgdmFyIGMgPSBoICsgKHYgfHwgJycpLnRvVXBwZXJDYXNlKClcblxuICByZXR1cm4gZCA9PT0gaCB8fCBkID09PSB2IHx8IGQgPT09IGNcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuYXRSZXN0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2ZWxvY2l0eSA9IHRoaXMudmVsb2NpdHkoKVxuICByZXR1cm4gdmVsb2NpdHkueCA9PT0gMCAmJiB2ZWxvY2l0eS55ID09PSAwXG59XG5cblBoeXNpY3MucHJvdG90eXBlLl9zdGFydEFuaW1hdGlvbiA9IGZ1bmN0aW9uKGFuaW1hdGlvbikge1xuICBpZih0aGlzLl9jdXJyZW50QW5pbWF0aW9uICYmIHRoaXMuX2N1cnJlbnRBbmltYXRpb24ucnVubmluZygpKSB7XG4gICAgdGhpcy5fY3VycmVudEFuaW1hdGlvbi5jYW5jZWwoKVxuICB9XG4gIHRoaXMuX2N1cnJlbnRBbmltYXRpb24gPSBhbmltYXRpb25cbn1cblxuUGh5c2ljcy5wcm90b3R5cGUudmVsb2NpdHkgPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fdmVsb2NpdHlcbiAgdGhpcy5fdmVsb2NpdHkgPSBWZWN0b3IoeCwgeSlcbiAgcmV0dXJuIHRoaXNcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUucG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fcG9zaXRpb24uY2xvbmUoKVxuICB0aGlzLl9wb3NpdGlvbiA9IFZlY3Rvcih4LCB5KVxuICB0aGlzLl9yZW5kZXIodGhpcy5fcG9zaXRpb24ueCwgdGhpcy5fcG9zaXRpb24ueSlcbiAgcmV0dXJuIHRoaXNcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuaW50ZXJhY3QgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHJldHVybiBuZXcgSW50ZXJhY3QodGhpcywgb3B0cylcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuZHJhZyA9IGZ1bmN0aW9uKG9wdHMsIHN0YXJ0KSB7XG4gIHJldHVybiBuZXcgRHJhZyh0aGlzLCBvcHRzLCBzdGFydClcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuc3ByaW5nID0gZnVuY3Rpb24ob3B0cykge1xuICByZXR1cm4gbmV3IFNwcmluZyh0aGlzLCBvcHRzKVxufVxuXG5QaHlzaWNzLnByb3RvdHlwZS5kZWNlbGVyYXRlID0gZnVuY3Rpb24ob3B0cykge1xuICByZXR1cm4gbmV3IERlY2VsZXJhdGUodGhpcywgb3B0cylcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuYWNjZWxlcmF0ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgcmV0dXJuIG5ldyBBY2NlbGVyYXRlKHRoaXMsIG9wdHMpXG59XG5cblBoeXNpY3MucHJvdG90eXBlLmF0dGFjaFNwcmluZyA9IGZ1bmN0aW9uKGF0dGFjaG1lbnQsIG9wdHMpIHtcbiAgcmV0dXJuIG5ldyBBdHRhY2hTcHJpbmcodGhpcywgYXR0YWNobWVudCwgb3B0cylcbn1cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnbG9kYXNoLmRlZmF1bHRzJylcbnZhciBWZWxvY2l0eSA9IHJlcXVpcmUoJ3RvdWNoLXZlbG9jaXR5JylcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ1Byb21pc2UnKVxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIEJvdW5kcnkgPSByZXF1aXJlKCcuL2JvdW5kcnknKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyYWN0XG5cbnZhciBkZWZhdWx0T3B0cyA9IHtcbiAgYm91bmRyeTogQm91bmRyeSh7fSksXG4gIGRhbXBpbmc6IDAsXG4gIGRpcmVjdGlvbjogJ2JvdGgnXG59XG5cbmZ1bmN0aW9uIEludGVyYWN0KHBoeXMsIG9wdHMpIHtcbiAgdGhpcy5fcGh5cyA9IHBoeXNcbiAgdGhpcy5fcnVubmluZyA9IGZhbHNlXG4gIHRoaXMuX29wdHMgPSBkZWZhdWx0cyh7fSwgb3B0cywgZGVmYXVsdE9wdHMpXG59XG5cbkludGVyYWN0LnByb3RvdHlwZS5wb3NpdGlvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgdmFyIGRpcmVjdGlvbiA9IHRoaXMuX29wdHMuZGlyZWN0aW9uXG4gICAgLCBib3VuZHJ5ID0gdGhpcy5fb3B0cy5ib3VuZHJ5XG4gICAgLCBwb3MgPSBWZWN0b3IoeCwgeSlcblxuICBpZihkaXJlY3Rpb24gIT09ICdib3RoJyAmJiBkaXJlY3Rpb24gIT09ICdob3Jpem9udGFsJykgcG9zLnggPSAwXG4gIGlmKGRpcmVjdGlvbiAhPT0gJ2JvdGgnICYmIGRpcmVjdGlvbiAhPT0gJ3ZlcnRpY2FsJykgcG9zLnkgPSAwXG5cbiAgdGhpcy5fdmVsb1gudXBkYXRlUG9zaXRpb24ocG9zLngpXG4gIHRoaXMuX3ZlbG9ZLnVwZGF0ZVBvc2l0aW9uKHBvcy55KVxuXG4gIHRoaXMuX3BoeXMudmVsb2NpdHkodGhpcy5fdmVsb1guZ2V0VmVsb2NpdHkoKSwgdGhpcy5fdmVsb1kuZ2V0VmVsb2NpdHkoKSlcblxuICBwb3MgPSBib3VuZHJ5LmFwcGx5RGFtcGluZyhwb3MsIHRoaXMuX29wdHMuZGFtcGluZylcblxuXG4gIHRoaXMuX3BoeXMucG9zaXRpb24ocG9zKVxuXG4gIHJldHVybiB0aGlzXG59XG5cbkludGVyYWN0LnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihldnQpIHtcbiAgLy9mb3IganF1ZXJ5IGFuZCBoYW1tZXIuanNcbiAgZXZ0ID0gZXZ0Lm9yaWdpbmFsRXZlbnQgfHwgZXZ0XG4gIHZhciBwb3NpdGlvbiA9IHV0aWwuZXZlbnRWZWN0b3IoZXZ0KS5zdWIodGhpcy5fc3RhcnRQb3NpdGlvbilcblxuICB0aGlzLnBvc2l0aW9uKHBvc2l0aW9uKVxuICByZXR1cm4gdGhpc1xufVxuXG5JbnRlcmFjdC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbihldnQpIHtcbiAgdmFyIHRoYXQgPSB0aGlzXG4gICAgLCBldnRQb3NpdGlvbiA9IGV2dCAmJiB1dGlsLmV2ZW50VmVjdG9yKGV2dClcbiAgICAsIHBvc2l0aW9uID0gdGhpcy5fcGh5cy5wb3NpdGlvbigpXG5cbiAgdGhpcy5fcnVubmluZyA9IHRydWVcbiAgdGhpcy5fcGh5cy5fc3RhcnRBbmltYXRpb24odGhpcylcbiAgdGhpcy5fc3RhcnRQb3NpdGlvbiA9IGV2dCAmJiBldnRQb3NpdGlvbi5zdWIocG9zaXRpb24pXG5cbiAgdGhpcy5fdmVsb1ggPSBuZXcgVmVsb2NpdHkoKVxuICB0aGlzLl92ZWxvWSA9IG5ldyBWZWxvY2l0eSgpXG5cbiAgdGhpcy5wb3NpdGlvbihwb3NpdGlvbilcblxuICByZXR1cm4gdGhpcy5fZW5kZWQgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXMsIHJlaikge1xuICAgIHRoYXQuX3Jlc29sdmUgPSByZXNcbiAgICB0aGF0Ll9yZWplY3QgPSByZWpcbiAgfSlcbn1cblxuSW50ZXJhY3QucHJvdG90eXBlLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9ydW5uaW5nID0gZmFsc2VcbiAgdGhpcy5fcmVqZWN0KG5ldyBFcnJvcignQ2FuY2VsZWQgdGhlIGludGVyYWN0aW9uJykpXG59XG5cbkludGVyYWN0LnByb3RvdHlwZS5ydW5uaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9ydW5uaW5nXG59XG5cbkludGVyYWN0LnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fcGh5cy52ZWxvY2l0eSh0aGlzLl92ZWxvWC5nZXRWZWxvY2l0eSgpLCB0aGlzLl92ZWxvWS5nZXRWZWxvY2l0eSgpKVxuICB0aGlzLl9yZXNvbHZlKHsgdmVsb2NpdHk6IHRoaXMuX3BoeXMudmVsb2NpdHkoKSwgcG9zaXRpb246IHRoaXMuX3BoeXMucG9zaXRpb24oKSB9KVxuICByZXR1cm4gdGhpcy5fZW5kZWRcbn1cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2ludGVyYWN0LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIHByZWZpeGVzID0gWydXZWJraXQnLCAnTW96JywgJ01zJywgJ21zJ11cbnZhciBjYWxscyA9IFtdXG52YXIgdHJhbnNmb3JtUHJvcCA9IHByZWZpeGVkKCd0cmFuc2Zvcm0nKVxuXG5mdW5jdGlvbiBsb29wKCkge1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgbG9vcCgpXG4gICAgdmFyIGlcbiAgICBmb3IodmFyIGkgPSBjYWxscy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY2FsbHNbaV0oKVxuICAgIH1cbiAgfSlcbn1cbmxvb3AoKVxuXG5mdW5jdGlvbiBwcmVmaXhlZChwcm9wKSB7XG4gIHZhciBwcmVmaXhlZFxuICBmb3IgKHZhciBpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgcHJlZml4ZWQgPSBwcmVmaXhlc1tpXSArIHByb3BbMF0udG9VcHBlckNhc2UoKSArIHByb3Auc2xpY2UoMSlcbiAgICBpZih0eXBlb2YgZG9jdW1lbnQuYm9keS5zdHlsZVtwcmVmaXhlZF0gIT09ICd1bmRlZmluZWQnKVxuICAgICAgcmV0dXJuIHByZWZpeGVkXG4gIH1cbiAgcmV0dXJuIHByb3Bcbn1cblxudmFyIHRyYW5zZm9ybXNQcm9wZXJ0aWVzID0gWyd0cmFuc2xhdGUnLCAndHJhbnNsYXRlWCcsICd0cmFuc2xhdGVZJywgJ3RyYW5zbGF0ZVonLFxuICAgICAgICAgICAgICAgICAgJ3JvdGF0ZScsICdyb3RhdGVYJywgJ3JvdGF0ZVknLCAncm90YXRlWicsXG4gICAgICAgICAgICAgICAgICAnc2NhbGUnLCAnc2NhbGVYJywgJ3NjYWxlWScsICdzY2FsZVonLFxuICAgICAgICAgICAgICAgICAgJ3NrZXcnLCAnc2tld1gnLCAnc2tld1knLCAnc2tld1onXVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyXG5cbmZ1bmN0aW9uIFJlbmRlcmVyKGVscykge1xuICBpZih0eXBlb2YgZWxzLmxlbmd0aCA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgZWxzID0gW2Vsc11cbiAgdGhpcy5lbHMgPSBlbHNcbiAgdGhpcy5zdHlsZXMgPSB7fVxuICB0aGlzLmludmlzaWJsZUVscyA9IFtdXG4gIGNhbGxzLnB1c2godGhpcy5yZW5kZXIuYmluZCh0aGlzKSlcbn1cblxuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICBpZighdGhpcy5jdXJyZW50UG9zaXRpb24pIHJldHVyblxuICB2YXIgdHJhbnNmb3Jtc1RvQXBwbHlcbiAgICAsIGVscyA9IHRoaXMuZWxzXG4gICAgLCBwb3NpdGlvbiA9IHRoaXMuY3VycmVudFBvc2l0aW9uXG4gICAgLCBzdHlsZXMgPSB0aGlzLnN0eWxlc1xuICAgICwgdmFsdWVcbiAgICAsIHByb3BzID0gT2JqZWN0LmtleXMoc3R5bGVzKVxuICAgICwgZWxzTGVuZ3RoID0gZWxzLmxlbmd0aFxuICAgICwgcHJvcHNMZW5ndGggPSBwcm9wcy5sZW5ndGhcbiAgICAsIGksIGpcbiAgICAsIHRyYW5zZm9ybXNcblxuICBmb3IoaSA9IDAgOyBpIDwgZWxzTGVuZ3RoIDsgaSsrKSB7XG4gICAgdHJhbnNmb3Jtc1RvQXBwbHkgPSBbXVxuICAgIGlmKHRoaXMudmlzaWJsZUZuICYmICF0aGlzLnZpc2libGVGbihwb3NpdGlvbiwgaSkpIHtcbiAgICAgIGlmKCF0aGlzLmludmlzaWJsZUVsc1tpXSkge1xuICAgICAgICBlbHNbaV0uc3R5bGUud2Via2l0VHJhbnNmb3JtID0gJ3RyYW5zbGF0ZTNkKDAsIC05OTk5OXB4LCAwKSdcbiAgICAgIH1cbiAgICAgIHRoaXMuaW52aXNpYmxlRWxzW2ldID0gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmludmlzaWJsZUVsc1tpXSA9IGZhbHNlXG4gICAgICBmb3IgKGogPSAwOyBqIDwgcHJvcHNMZW5ndGg7IGorKykge1xuICAgICAgICBwcm9wID0gcHJvcHNbal1cbiAgICAgICAgdmFsdWUgPSAodHlwZW9mIHN0eWxlc1twcm9wXSA9PT0gJ2Z1bmN0aW9uJykgPyBzdHlsZXNbcHJvcF0ocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgaSkgOiBzdHlsZXNbcHJvcF1cblxuICAgICAgICBpZih0cmFuc2Zvcm1zUHJvcGVydGllcy5pbmRleE9mKHByb3ApICE9PSAtMSkge1xuICAgICAgICAgIHRyYW5zZm9ybXNUb0FwcGx5LnB1c2gocHJvcCArICcoJyArIHZhbHVlICsgJyknKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsc1tpXS5zdHlsZVtwcm9wXSA9IHZhbHVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRyYW5zZm9ybXMgPSB0cmFuc2Zvcm1zVG9BcHBseS5qb2luKCcgJylcbiAgICAgIHRyYW5zZm9ybXMgKz0gJyB0cmFuc2xhdGVaKDApJ1xuICAgICAgZWxzW2ldLnN0eWxlW3RyYW5zZm9ybVByb3BdID0gdHJhbnNmb3Jtc1xuICAgIH1cbiAgfVxufVxuXG5SZW5kZXJlci5wcm90b3R5cGUuc3R5bGUgPSBmdW5jdGlvbihwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgaWYodHlwZW9mIHByb3BlcnR5ID09PSAnb2JqZWN0Jykge1xuICAgIGZvcihwcm9wIGluIHByb3BlcnR5KSB7XG4gICAgICBpZihwcm9wZXJ0eS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICB0aGlzLnN0eWxlKHByb3AsIHByb3BlcnR5W3Byb3BdKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB0aGlzLnN0eWxlc1twcm9wZXJ0eV0gPSB2YWx1ZVxuICByZXR1cm4gdGhpc1xufVxuXG5SZW5kZXJlci5wcm90b3R5cGUudmlzaWJsZSA9IGZ1bmN0aW9uKGlzVmlzaWJsZSkge1xuICB0aGlzLnZpc2libGVGbiA9IGlzVmlzaWJsZVxuICByZXR1cm4gdGhpc1xufVxuUmVuZGVyZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgdGhpcy5jdXJyZW50UG9zaXRpb24gPSB7IHg6IHgsIHk6IHkgfVxufVxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvcmVuZGVyZXIuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKVxuICAsIGJvZGllcyA9IFtdXG5cbmZ1bmN0aW9uIGluY3JlbWVudChhLCBiLCBjLCBkKSB7XG4gIHZhciB2ZWMgPSBWZWN0b3IoMCwgMClcbiAgdmVjLnNlbGZBZGQoYSlcbiAgdmVjLnNlbGZBZGQoYi5hZGQoYykuc2VsZk11bHQoMikpXG4gIHZlYy5zZWxmQWRkKGQpXG4gIHZlYy5zZWxmTXVsdCgxLzYpXG4gIHJldHVybiB2ZWNcbn1cblxudmFyIHBvc2l0aW9uVmVjID0gVmVjdG9yKDAsIDApXG52YXIgdmVsb2NpdHlWZWMgPSBWZWN0b3IoMCwgMClcblxuZnVuY3Rpb24gZXZhbHVhdGUoaW5pdGlhbCwgdCwgZHQsIGQpIHtcbiAgdmFyIHN0YXRlID0ge31cblxuICBzdGF0ZS5wb3NpdGlvbiA9IHBvc2l0aW9uVmVjLnNldHYoZC5keCkuc2VsZk11bHQoZHQpLnNlbGZBZGQoaW5pdGlhbC5wb3NpdGlvbilcbiAgc3RhdGUudmVsb2NpdHkgPSB2ZWxvY2l0eVZlYy5zZXR2KGQuZHYpLnNlbGZNdWx0KGR0KS5zZWxmQWRkKGluaXRpYWwudmVsb2NpdHkpXG5cbiAgdmFyIG5leHQgPSB7XG4gICAgZHg6IHN0YXRlLnZlbG9jaXR5LmNsb25lKCksXG4gICAgZHY6IGluaXRpYWwuYWNjZWxlcmF0ZShzdGF0ZSwgdCkuY2xvbmUoKVxuICB9XG4gIHJldHVybiBuZXh0XG59XG5cbnZhciBkZXIgPSB7IGR4OiBWZWN0b3IoMCwgMCksIGR2OiBWZWN0b3IoMCwgMCkgfVxuZnVuY3Rpb24gaW50ZWdyYXRlKHN0YXRlLCB0LCBkdCkge1xuICAgIHZhciBhID0gZXZhbHVhdGUoIHN0YXRlLCB0LCAwLCBkZXIgKVxuICAgIHZhciBiID0gZXZhbHVhdGUoIHN0YXRlLCB0LCBkdCowLjUsIGEgKVxuICAgIHZhciBjID0gZXZhbHVhdGUoIHN0YXRlLCB0LCBkdCowLjUsIGIgKVxuICAgIHZhciBkID0gZXZhbHVhdGUoIHN0YXRlLCB0LCBkdCwgYyApXG5cbiAgICB2YXIgZHhkdCA9IGluY3JlbWVudChhLmR4LGIuZHgsYy5keCxkLmR4KVxuICAgICAgLCBkdmR0ID0gaW5jcmVtZW50KGEuZHYsYi5kdixjLmR2LGQuZHYpXG5cbiAgICBzdGF0ZS5wb3NpdGlvbi5zZWxmQWRkKGR4ZHQuc2VsZk11bHQoZHQpKTtcbiAgICBzdGF0ZS52ZWxvY2l0eS5zZWxmQWRkKGR2ZHQuc2VsZk11bHQoZHQpKTtcbn1cblxudmFyIGN1cnJlbnRUaW1lID0gRGF0ZS5ub3coKSAvIDEwMDBcbiAgLCBhY2N1bXVsYXRvciA9IDBcbiAgLCB0ID0gMFxuICAsIGR0ID0gMC4wMTVcblxuZnVuY3Rpb24gc2ltdWxhdGUoKSB7XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICBzaW11bGF0ZSgpXG4gICAgdmFyIG5ld1RpbWUgPSBEYXRlLm5vdygpIC8gMTAwMFxuICAgIHZhciBmcmFtZVRpbWUgPSBuZXdUaW1lIC0gY3VycmVudFRpbWVcbiAgICBjdXJyZW50VGltZSA9IG5ld1RpbWVcblxuICAgIGlmKGZyYW1lVGltZSA+IDAuMDUpXG4gICAgICBmcmFtZVRpbWUgPSAwLjA1XG5cblxuICAgIGFjY3VtdWxhdG9yICs9IGZyYW1lVGltZVxuXG4gICAgdmFyIGogPSAwXG5cbiAgICB3aGlsZShhY2N1bXVsYXRvciA+PSBkdCkge1xuICAgICAgZm9yKHZhciBpID0gMCA7IGkgPCBib2RpZXMubGVuZ3RoIDsgaSsrKSB7XG4gICAgICAgIGJvZGllc1tpXS5wcmV2aW91c1Bvc2l0aW9uID0gYm9kaWVzW2ldLnBvc2l0aW9uLmNsb25lKClcbiAgICAgICAgaW50ZWdyYXRlKGJvZGllc1tpXSwgdCwgZHQpXG4gICAgICB9XG4gICAgICB0ICs9IGR0XG4gICAgICBhY2N1bXVsYXRvciAtPSBkdFxuICAgIH1cblxuICAgIGZvcih2YXIgaSA9IDAgOyBpIDwgYm9kaWVzLmxlbmd0aCA7IGkrKykge1xuICAgICAgYm9kaWVzW2ldLnVwZGF0ZShhY2N1bXVsYXRvciAvIGR0KVxuICAgIH1cbiAgfSwgMTYpXG59XG5zaW11bGF0ZSgpXG5cbm1vZHVsZS5leHBvcnRzLmFkZEJvZHkgPSBmdW5jdGlvbihib2R5KSB7XG4gIGJvZGllcy5wdXNoKGJvZHkpXG4gIHJldHVybiBib2R5XG59XG5cbm1vZHVsZS5leHBvcnRzLnJlbW92ZUJvZHkgPSBmdW5jdGlvbihib2R5KSB7XG4gIHZhciBpbmRleCA9IGJvZGllcy5pbmRleE9mKGJvZHkpXG4gIGlmKGluZGV4ID49IDApXG4gICAgYm9kaWVzLnNwbGljZShpbmRleCwgMSlcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvc2ltdWxhdGlvbi5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBCb2R5ID0gcmVxdWlyZSgnLi9ib2R5JylcbnZhciBzaW11bGF0aW9uID0gcmVxdWlyZSgnLi9zaW11bGF0aW9uJylcbnZhciBCb3VuZHJ5ID0gcmVxdWlyZSgnLi9ib3VuZHJ5JylcbnZhciBBbmltYXRpb24gPSByZXF1aXJlKCcuL2FuaW1hdGlvbicpXG5cbnZhciBTcHJpbmcgPSBtb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGlvbih7XG4gIGRlZmF1bHRPcHRpb25zOiB7XG4gICAgdGVuc2lvbjogMTAwLFxuICAgIGRhbXBpbmc6IDEwXG4gIH0sXG4gIG9uU3RhcnQ6IGZ1bmN0aW9uKHZlbG9jaXR5LCBmcm9tLCB0bywgb3B0cywgdXBkYXRlKSB7XG4gICAgY29uc29sZS5sb2coZnJvbSwgdG8pXG4gICAgdmFyIGJvZHkgPSB0aGlzLl9ib2R5ID0gbmV3IEJvZHkodmVsb2NpdHksIGZyb20sIHtcbiAgICAgIGFjY2VsZXJhdGU6IGZ1bmN0aW9uKHN0YXRlLCB0KSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5wb3NpdGlvbi5zZWxmU3ViKHRvKVxuICAgICAgICAgIC5zZWxmTXVsdCgtb3B0cy50ZW5zaW9uKVxuICAgICAgICAgIC5zZWxmU3ViKHN0YXRlLnZlbG9jaXR5Lm11bHQob3B0cy5kYW1waW5nKSlcbiAgICAgIH0sXG4gICAgICB1cGRhdGU6IGZ1bmN0aW9uKHBvc2l0aW9uLCB2ZWxvY2l0eSkge1xuICAgICAgICBpZihib2R5LmF0UmVzdCgpICYmIGJvZHkuYXRQb3NpdGlvbih0bykpIHtcbiAgICAgICAgICB1cGRhdGUuZG9uZSh0bywgeyB4OiAwLCB5OiAwIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlLnN0YXRlKHBvc2l0aW9uLCB2ZWxvY2l0eSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gICAgc2ltdWxhdGlvbi5hZGRCb2R5KHRoaXMuX2JvZHkpXG4gIH0sXG4gIG9uRW5kOiBmdW5jdGlvbigpIHtcbiAgICBzaW11bGF0aW9uLnJlbW92ZUJvZHkodGhpcy5fYm9keSlcbiAgfVxufSlcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvc3ByaW5nLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJylcbmZ1bmN0aW9uIHZlcnRleChhLCBiKSB7XG4gIHJldHVybiAtYiAvICgyICogYSlcbn1cblxuZnVuY3Rpb24gaGVpZ2h0KGEsIGIsIGMpIHtcbiAgcmV0dXJuIHBhcmFib2xhKGEsIGIsIGMsIHZlcnRleChhLCBiKSlcbn1cblxuZnVuY3Rpb24gcGFyYWJvbGEoYSwgYiwgYywgeCkge1xuICByZXR1cm4gYSAqIHggKiB4ICsgYiAqIHggKyBjXG59XG5cbmZ1bmN0aW9uIGV2ZW50VmVjdG9yKGV2dCkge1xuICByZXR1cm4gVmVjdG9yKHtcbiAgICB4OiBldnQudG91Y2hlcyAmJiBldnQudG91Y2hlc1swXS5wYWdlWCB8fCBldnQucGFnZVgsXG4gICAgeTogZXZ0LnRvdWNoZXMgJiYgZXZ0LnRvdWNoZXNbMF0ucGFnZVkgfHwgZXZ0LnBhZ2VZXG4gIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzLmhlaWdodCA9IGhlaWdodFxubW9kdWxlLmV4cG9ydHMuZXZlbnRWZWN0b3IgPSBldmVudFZlY3RvclxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvdXRpbC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yXG5cbmZ1bmN0aW9uIFZlY3Rvcih4LCB5KSB7XG4gIGlmKCEodGhpcyBpbnN0YW5jZW9mIFZlY3RvcikpXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCwgeSlcblxuICBpZih0eXBlb2YgeC54ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHRoaXMueCA9IHgueFxuICAgIHRoaXMueSA9IHgueVxuICB9IGVsc2Uge1xuICAgIHRoaXMueCA9IHggfHwgMFxuICAgIHRoaXMueSA9IHkgfHwgMFxuICB9XG59XG5cblZlY3Rvci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24odmVjKSB7XG4gIHJldHVybiB2ZWMueCA9PT0gdGhpcy54ICYmIHZlYy55ID09PSB0aGlzLnlcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5kaXJlY3Rpb25FcXVhbCA9IGZ1bmN0aW9uKHZlYykge1xuICByZXR1cm4gdmVjLnggPiAwID09PSB0aGlzLnggPiAwICYmIHRoaXMueSA+IDAgPT09IHZlYy55ID4gMFxufVxuXG5WZWN0b3IucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uICh2ZWMpIHtcbiAgcmV0dXJuIHRoaXMueCAqIHZlYy54ICsgdGhpcy55ICogdmVjLnk7XG59XG5cblZlY3Rvci5wcm90b3R5cGUubmVnYXRlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBWZWN0b3IodGhpcy54LCB0aGlzLnkpLm11bHQoLTEpXG59XG5cblZlY3Rvci5wcm90b3R5cGUubm9ybSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMubm9ybXNxKCkpXG59XG5cblZlY3Rvci5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFZlY3Rvcih0aGlzLngsIHRoaXMueSlcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5ub3Jtc3EgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueVxufVxuXG5WZWN0b3IucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtYWduaXR1ZGUgPSB0aGlzLm5vcm0oKVxuXG4gICAgaWYobWFnbml0dWRlID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgbWFnbml0dWRlID0gMSAvIG1hZ25pdHVkZVxuXG4gICAgdGhpcy54ICo9IG1hZ25pdHVkZVxuICAgIHRoaXMueSAqPSBtYWduaXR1ZGVcblxuICAgIHJldHVybiB0aGlzXG59XG5cblZlY3Rvci5wcm90b3R5cGUubXVsdCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgaWYoeCBpbnN0YW5jZW9mIFZlY3Rvcikge1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHgueCAqIHRoaXMueCwgeC55ICogdGhpcy55KVxuICB9XG4gIGlmKHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJykgeyAvL3NjYWxhclxuICAgIHJldHVybiBuZXcgVmVjdG9yKHggKiB0aGlzLngsIHggKiB0aGlzLnkpXG4gIH1cbiAgcmV0dXJuIG5ldyBWZWN0b3IoeCAqIHRoaXMueCwgeSAqIHRoaXMueSlcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5zZWxmTXVsdCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgaWYoeCBpbnN0YW5jZW9mIFZlY3Rvcikge1xuICAgIHRoaXMueCAqPSB4LnhcbiAgICB0aGlzLnkgKj0geC55XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBpZih0eXBlb2YgeSA9PT0gJ3VuZGVmaW5lZCcpIHsgLy9zY2FsYXJcbiAgICB0aGlzLnggKj0geFxuICAgIHRoaXMueSAqPSB4XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICB0aGlzLnggKj0geFxuICB0aGlzLnkgKj0geVxuICByZXR1cm4gdGhpc1xufVxuXG5WZWN0b3IucHJvdG90eXBlLnNlbGZBZGQgPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKHR5cGVvZiB4LnggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhpcy54ICs9IHgueFxuICAgIHRoaXMueSArPSB4LnlcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIGlmKHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJykgeyAvL3NjYWxhclxuICAgIHRoaXMueCArPSB4XG4gICAgdGhpcy55ICs9IHhcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIHRoaXMueCArPSB4XG4gIHRoaXMueSArPSB5XG4gIHJldHVybiB0aGlzXG59XG5cblZlY3Rvci5wcm90b3R5cGUuc2VsZlN1YiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgaWYodHlwZW9mIHgueCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aGlzLnggLT0geC54XG4gICAgdGhpcy55IC09IHgueVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgaWYodHlwZW9mIHkgPT09ICd1bmRlZmluZWQnKSB7IC8vc2NhbGFyXG4gICAgdGhpcy54IC09IHhcbiAgICB0aGlzLnkgLT0geFxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgdGhpcy54IC09IHhcbiAgdGhpcy55IC09IHlcblxuICByZXR1cm4gdGhpc1xufVxuXG5WZWN0b3IucHJvdG90eXBlLnN1YiA9IGZ1bmN0aW9uKHgsIHkpIHtcblxuICBpZih0eXBlb2YgeC54ICE9PSAndW5kZWZpbmVkJylcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggLSB4LngsIHRoaXMueSAtIHgueSlcblxuICBpZih0eXBlb2YgeSA9PT0gJ3VuZGVmaW5lZCcpLy9zY2FsYXJcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggLSB4LCB0aGlzLnkgLSB4KVxuXG4gIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAtIHgsIHRoaXMueSAtIHkpXG59XG5cblZlY3Rvci5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oeCwgeSkge1xuICBpZih0eXBlb2YgeC54ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCArIHgueCwgdGhpcy55ICsgeC55KVxuICB9XG4gIGlmKHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJykgeyAvL3NjYWxhclxuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCArIHgsIHRoaXMueSArIHgpXG4gIH1cbiAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54ICsgeCwgdGhpcy55ICsgeSlcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5zZXR2ID0gZnVuY3Rpb24odmVjKSB7XG4gIHRoaXMueCA9IHZlYy54XG4gIHRoaXMueSA9IHZlYy55XG4gIHJldHVybiB0aGlzXG59XG5cblZlY3Rvci5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uKHZlY3RvciwgYWxwaGEpIHtcbiAgcmV0dXJuIHRoaXMubXVsdCgxLWFscGhhKS5hZGQodmVjdG9yLm11bHQoYWxwaGEpKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi92ZWN0b3IuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBhc2FwID0gcmVxdWlyZSgnYXNhcCcpXG5cbm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZVxuZnVuY3Rpb24gUHJvbWlzZShmbikge1xuICBpZiAodHlwZW9mIHRoaXMgIT09ICdvYmplY3QnKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdQcm9taXNlcyBtdXN0IGJlIGNvbnN0cnVjdGVkIHZpYSBuZXcnKVxuICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdub3QgYSBmdW5jdGlvbicpXG4gIHZhciBzdGF0ZSA9IG51bGxcbiAgdmFyIHZhbHVlID0gbnVsbFxuICB2YXIgZGVmZXJyZWRzID0gW11cbiAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgdGhpcy50aGVuID0gZnVuY3Rpb24ob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBoYW5kbGUobmV3IEhhbmRsZXIob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIHJlc29sdmUsIHJlamVjdCkpXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZShkZWZlcnJlZCkge1xuICAgIGlmIChzdGF0ZSA9PT0gbnVsbCkge1xuICAgICAgZGVmZXJyZWRzLnB1c2goZGVmZXJyZWQpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgYXNhcChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjYiA9IHN0YXRlID8gZGVmZXJyZWQub25GdWxmaWxsZWQgOiBkZWZlcnJlZC5vblJlamVjdGVkXG4gICAgICBpZiAoY2IgPT09IG51bGwpIHtcbiAgICAgICAgKHN0YXRlID8gZGVmZXJyZWQucmVzb2x2ZSA6IGRlZmVycmVkLnJlamVjdCkodmFsdWUpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdmFyIHJldFxuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0ID0gY2IodmFsdWUpXG4gICAgICB9XG4gICAgICBjYXRjaCAoZSkge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKHJldClcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVzb2x2ZShuZXdWYWx1ZSkge1xuICAgIHRyeSB7IC8vUHJvbWlzZSBSZXNvbHV0aW9uIFByb2NlZHVyZTogaHR0cHM6Ly9naXRodWIuY29tL3Byb21pc2VzLWFwbHVzL3Byb21pc2VzLXNwZWMjdGhlLXByb21pc2UtcmVzb2x1dGlvbi1wcm9jZWR1cmVcbiAgICAgIGlmIChuZXdWYWx1ZSA9PT0gc2VsZikgdGhyb3cgbmV3IFR5cGVFcnJvcignQSBwcm9taXNlIGNhbm5vdCBiZSByZXNvbHZlZCB3aXRoIGl0c2VsZi4nKVxuICAgICAgaWYgKG5ld1ZhbHVlICYmICh0eXBlb2YgbmV3VmFsdWUgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBuZXdWYWx1ZSA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgdmFyIHRoZW4gPSBuZXdWYWx1ZS50aGVuXG4gICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGRvUmVzb2x2ZSh0aGVuLmJpbmQobmV3VmFsdWUpLCByZXNvbHZlLCByZWplY3QpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHN0YXRlID0gdHJ1ZVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgICAgZmluYWxlKClcbiAgICB9IGNhdGNoIChlKSB7IHJlamVjdChlKSB9XG4gIH1cblxuICBmdW5jdGlvbiByZWplY3QobmV3VmFsdWUpIHtcbiAgICBzdGF0ZSA9IGZhbHNlXG4gICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIGZpbmFsZSgpXG4gIH1cblxuICBmdW5jdGlvbiBmaW5hbGUoKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRlZmVycmVkcy5sZW5ndGg7IGkgPCBsZW47IGkrKylcbiAgICAgIGhhbmRsZShkZWZlcnJlZHNbaV0pXG4gICAgZGVmZXJyZWRzID0gbnVsbFxuICB9XG5cbiAgZG9SZXNvbHZlKGZuLCByZXNvbHZlLCByZWplY3QpXG59XG5cblxuZnVuY3Rpb24gSGFuZGxlcihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcmVzb2x2ZSwgcmVqZWN0KXtcbiAgdGhpcy5vbkZ1bGZpbGxlZCA9IHR5cGVvZiBvbkZ1bGZpbGxlZCA9PT0gJ2Z1bmN0aW9uJyA/IG9uRnVsZmlsbGVkIDogbnVsbFxuICB0aGlzLm9uUmVqZWN0ZWQgPSB0eXBlb2Ygb25SZWplY3RlZCA9PT0gJ2Z1bmN0aW9uJyA/IG9uUmVqZWN0ZWQgOiBudWxsXG4gIHRoaXMucmVzb2x2ZSA9IHJlc29sdmVcbiAgdGhpcy5yZWplY3QgPSByZWplY3Rcbn1cblxuLyoqXG4gKiBUYWtlIGEgcG90ZW50aWFsbHkgbWlzYmVoYXZpbmcgcmVzb2x2ZXIgZnVuY3Rpb24gYW5kIG1ha2Ugc3VyZVxuICogb25GdWxmaWxsZWQgYW5kIG9uUmVqZWN0ZWQgYXJlIG9ubHkgY2FsbGVkIG9uY2UuXG4gKlxuICogTWFrZXMgbm8gZ3VhcmFudGVlcyBhYm91dCBhc3luY2hyb255LlxuICovXG5mdW5jdGlvbiBkb1Jlc29sdmUoZm4sIG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gIHZhciBkb25lID0gZmFsc2U7XG4gIHRyeSB7XG4gICAgZm4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoZG9uZSkgcmV0dXJuXG4gICAgICBkb25lID0gdHJ1ZVxuICAgICAgb25GdWxmaWxsZWQodmFsdWUpXG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgaWYgKGRvbmUpIHJldHVyblxuICAgICAgZG9uZSA9IHRydWVcbiAgICAgIG9uUmVqZWN0ZWQocmVhc29uKVxuICAgIH0pXG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgaWYgKGRvbmUpIHJldHVyblxuICAgIGRvbmUgPSB0cnVlXG4gICAgb25SZWplY3RlZChleClcbiAgfVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9Qcm9taXNlL2NvcmUuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvUHJvbWlzZVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbid1c2Ugc3RyaWN0JztcblxuLy9UaGlzIGZpbGUgY29udGFpbnMgdGhlbi9wcm9taXNlIHNwZWNpZmljIGV4dGVuc2lvbnMgdG8gdGhlIGNvcmUgcHJvbWlzZSBBUElcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL2NvcmUuanMnKVxudmFyIGFzYXAgPSByZXF1aXJlKCdhc2FwJylcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlXG5cbi8qIFN0YXRpYyBGdW5jdGlvbnMgKi9cblxuZnVuY3Rpb24gVmFsdWVQcm9taXNlKHZhbHVlKSB7XG4gIHRoaXMudGhlbiA9IGZ1bmN0aW9uIChvbkZ1bGZpbGxlZCkge1xuICAgIGlmICh0eXBlb2Ygb25GdWxmaWxsZWQgIT09ICdmdW5jdGlvbicpIHJldHVybiB0aGlzXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJlc29sdmUob25GdWxmaWxsZWQodmFsdWUpKVxuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxufVxuVmFsdWVQcm9taXNlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUHJvbWlzZS5wcm90b3R5cGUpXG5cbnZhciBUUlVFID0gbmV3IFZhbHVlUHJvbWlzZSh0cnVlKVxudmFyIEZBTFNFID0gbmV3IFZhbHVlUHJvbWlzZShmYWxzZSlcbnZhciBOVUxMID0gbmV3IFZhbHVlUHJvbWlzZShudWxsKVxudmFyIFVOREVGSU5FRCA9IG5ldyBWYWx1ZVByb21pc2UodW5kZWZpbmVkKVxudmFyIFpFUk8gPSBuZXcgVmFsdWVQcm9taXNlKDApXG52YXIgRU1QVFlTVFJJTkcgPSBuZXcgVmFsdWVQcm9taXNlKCcnKVxuXG5Qcm9taXNlLnJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkgcmV0dXJuIHZhbHVlXG5cbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gTlVMTFxuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFVOREVGSU5FRFxuICBpZiAodmFsdWUgPT09IHRydWUpIHJldHVybiBUUlVFXG4gIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHJldHVybiBGQUxTRVxuICBpZiAodmFsdWUgPT09IDApIHJldHVybiBaRVJPXG4gIGlmICh2YWx1ZSA9PT0gJycpIHJldHVybiBFTVBUWVNUUklOR1xuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRyeSB7XG4gICAgICB2YXIgdGhlbiA9IHZhbHVlLnRoZW5cbiAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UodGhlbi5iaW5kKHZhbHVlKSlcbiAgICAgIH1cbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgcmVqZWN0KGV4KVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmV3IFZhbHVlUHJvbWlzZSh2YWx1ZSlcbn1cblxuUHJvbWlzZS5mcm9tID0gUHJvbWlzZS5jYXN0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1Byb21pc2UuZnJvbSBhbmQgUHJvbWlzZS5jYXN0IGFyZSBkZXByZWNhdGVkLCB1c2UgUHJvbWlzZS5yZXNvbHZlIGluc3RlYWQnKVxuICBlcnIubmFtZSA9ICdXYXJuaW5nJ1xuICBjb25zb2xlLndhcm4oZXJyLnN0YWNrKVxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZhbHVlKVxufVxuXG5Qcm9taXNlLmRlbm9kZWlmeSA9IGZ1bmN0aW9uIChmbiwgYXJndW1lbnRDb3VudCkge1xuICBhcmd1bWVudENvdW50ID0gYXJndW1lbnRDb3VudCB8fCBJbmZpbml0eVxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpc1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB3aGlsZSAoYXJncy5sZW5ndGggJiYgYXJncy5sZW5ndGggPiBhcmd1bWVudENvdW50KSB7XG4gICAgICAgIGFyZ3MucG9wKClcbiAgICAgIH1cbiAgICAgIGFyZ3MucHVzaChmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgICAgaWYgKGVycikgcmVqZWN0KGVycilcbiAgICAgICAgZWxzZSByZXNvbHZlKHJlcylcbiAgICAgIH0pXG4gICAgICBmbi5hcHBseShzZWxmLCBhcmdzKVxuICAgIH0pXG4gIH1cbn1cblByb21pc2Uubm9kZWlmeSA9IGZ1bmN0aW9uIChmbikge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICAgIHZhciBjYWxsYmFjayA9IHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09ICdmdW5jdGlvbicgPyBhcmdzLnBvcCgpIDogbnVsbFxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKS5ub2RlaWZ5KGNhbGxiYWNrKVxuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICBpZiAoY2FsbGJhY2sgPT09IG51bGwgfHwgdHlwZW9mIGNhbGxiYWNrID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IHJlamVjdChleCkgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNhbGxiYWNrKGV4KVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5Qcm9taXNlLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGNhbGxlZFdpdGhBcnJheSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgQXJyYXkuaXNBcnJheShhcmd1bWVudHNbMF0pXG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoY2FsbGVkV2l0aEFycmF5ID8gYXJndW1lbnRzWzBdIDogYXJndW1lbnRzKVxuXG4gIGlmICghY2FsbGVkV2l0aEFycmF5KSB7XG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcignUHJvbWlzZS5hbGwgc2hvdWxkIGJlIGNhbGxlZCB3aXRoIGEgc2luZ2xlIGFycmF5LCBjYWxsaW5nIGl0IHdpdGggbXVsdGlwbGUgYXJndW1lbnRzIGlzIGRlcHJlY2F0ZWQnKVxuICAgIGVyci5uYW1lID0gJ1dhcm5pbmcnXG4gICAgY29uc29sZS53YXJuKGVyci5zdGFjaylcbiAgfVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSByZXR1cm4gcmVzb2x2ZShbXSlcbiAgICB2YXIgcmVtYWluaW5nID0gYXJncy5sZW5ndGhcbiAgICBmdW5jdGlvbiByZXMoaSwgdmFsKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAodmFsICYmICh0eXBlb2YgdmFsID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgIHZhciB0aGVuID0gdmFsLnRoZW5cbiAgICAgICAgICBpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoZW4uY2FsbCh2YWwsIGZ1bmN0aW9uICh2YWwpIHsgcmVzKGksIHZhbCkgfSwgcmVqZWN0KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGFyZ3NbaV0gPSB2YWxcbiAgICAgICAgaWYgKC0tcmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgcmVzb2x2ZShhcmdzKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgcmVqZWN0KGV4KVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlcyhpLCBhcmdzW2ldKVxuICAgIH1cbiAgfSlcbn1cblxuUHJvbWlzZS5yZWplY3QgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgXG4gICAgcmVqZWN0KHZhbHVlKTtcbiAgfSk7XG59XG5cblByb21pc2UucmFjZSA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgXG4gICAgdmFsdWVzLmZvckVhY2goZnVuY3Rpb24odmFsdWUpe1xuICAgICAgUHJvbWlzZS5yZXNvbHZlKHZhbHVlKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgfSlcbiAgfSk7XG59XG5cbi8qIFByb3RvdHlwZSBNZXRob2RzICovXG5cblByb21pc2UucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbiAob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgdmFyIHNlbGYgPSBhcmd1bWVudHMubGVuZ3RoID8gdGhpcy50aGVuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgOiB0aGlzXG4gIHNlbGYudGhlbihudWxsLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICB0aHJvdyBlcnJcbiAgICB9KVxuICB9KVxufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5ub2RlaWZ5ID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHRoaXNcblxuICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICBjYWxsYmFjayhudWxsLCB2YWx1ZSlcbiAgICB9KVxuICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICBjYWxsYmFjayhlcnIpXG4gICAgfSlcbiAgfSlcbn1cblxuUHJvbWlzZS5wcm90b3R5cGVbJ2NhdGNoJ10gPSBmdW5jdGlvbiAob25SZWplY3RlZCkge1xuICByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0ZWQpO1xufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9Qcm9taXNlL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL1Byb21pc2VcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG5cbi8vIFVzZSB0aGUgZmFzdGVzdCBwb3NzaWJsZSBtZWFucyB0byBleGVjdXRlIGEgdGFzayBpbiBhIGZ1dHVyZSB0dXJuXG4vLyBvZiB0aGUgZXZlbnQgbG9vcC5cblxuLy8gbGlua2VkIGxpc3Qgb2YgdGFza3MgKHNpbmdsZSwgd2l0aCBoZWFkIG5vZGUpXG52YXIgaGVhZCA9IHt0YXNrOiB2b2lkIDAsIG5leHQ6IG51bGx9O1xudmFyIHRhaWwgPSBoZWFkO1xudmFyIGZsdXNoaW5nID0gZmFsc2U7XG52YXIgcmVxdWVzdEZsdXNoID0gdm9pZCAwO1xudmFyIGlzTm9kZUpTID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIC8qIGpzaGludCBsb29wZnVuYzogdHJ1ZSAqL1xuXG4gICAgd2hpbGUgKGhlYWQubmV4dCkge1xuICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xuICAgICAgICB2YXIgdGFzayA9IGhlYWQudGFzaztcbiAgICAgICAgaGVhZC50YXNrID0gdm9pZCAwO1xuICAgICAgICB2YXIgZG9tYWluID0gaGVhZC5kb21haW47XG5cbiAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgaGVhZC5kb21haW4gPSB2b2lkIDA7XG4gICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0YXNrKCk7XG5cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGlzTm9kZUpTKSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gbm9kZSwgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgY29uc2lkZXJlZCBmYXRhbCBlcnJvcnMuXG4gICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBzeW5jaHJvbm91c2x5IHRvIGludGVycnVwdCBmbHVzaGluZyFcblxuICAgICAgICAgICAgICAgIC8vIEVuc3VyZSBjb250aW51YXRpb24gaWYgdGhlIHVuY2F1Z2h0IGV4Y2VwdGlvbiBpcyBzdXBwcmVzc2VkXG4gICAgICAgICAgICAgICAgLy8gbGlzdGVuaW5nIFwidW5jYXVnaHRFeGNlcHRpb25cIiBldmVudHMgKGFzIGRvbWFpbnMgZG9lcykuXG4gICAgICAgICAgICAgICAgLy8gQ29udGludWUgaW4gbmV4dCBldmVudCB0byBhdm9pZCB0aWNrIHJlY3Vyc2lvbi5cbiAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBicm93c2VycywgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgbm90IGZhdGFsLlxuICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgc2xvdy1kb3ducy5cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZmx1c2hpbmcgPSBmYWxzZTtcbn1cblxuaWYgKHR5cGVvZiBwcm9jZXNzICE9PSBcInVuZGVmaW5lZFwiICYmIHByb2Nlc3MubmV4dFRpY2spIHtcbiAgICAvLyBOb2RlLmpzIGJlZm9yZSAwLjkuIE5vdGUgdGhhdCBzb21lIGZha2UtTm9kZSBlbnZpcm9ubWVudHMsIGxpa2UgdGhlXG4gICAgLy8gTW9jaGEgdGVzdCBydW5uZXIsIGludHJvZHVjZSBhIGBwcm9jZXNzYCBnbG9iYWwgd2l0aG91dCBhIGBuZXh0VGlja2AuXG4gICAgaXNOb2RlSlMgPSB0cnVlO1xuXG4gICAgcmVxdWVzdEZsdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgICB9O1xuXG59IGVsc2UgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIC8vIEluIElFMTAsIE5vZGUuanMgMC45Kywgb3IgaHR0cHM6Ly9naXRodWIuY29tL05vYmxlSlMvc2V0SW1tZWRpYXRlXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmVxdWVzdEZsdXNoID0gc2V0SW1tZWRpYXRlLmJpbmQod2luZG93LCBmbHVzaCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVxdWVzdEZsdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZsdXNoKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbn0gZWxzZSBpZiAodHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgLy8gbW9kZXJuIGJyb3dzZXJzXG4gICAgLy8gaHR0cDovL3d3dy5ub25ibG9ja2luZy5pby8yMDExLzA2L3dpbmRvd25leHR0aWNrLmh0bWxcbiAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZmx1c2g7XG4gICAgcmVxdWVzdEZsdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgIH07XG5cbn0gZWxzZSB7XG4gICAgLy8gb2xkIGJyb3dzZXJzXG4gICAgcmVxdWVzdEZsdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhc2FwKHRhc2spIHtcbiAgICB0YWlsID0gdGFpbC5uZXh0ID0ge1xuICAgICAgICB0YXNrOiB0YXNrLFxuICAgICAgICBkb21haW46IGlzTm9kZUpTICYmIHByb2Nlc3MuZG9tYWluLFxuICAgICAgICBuZXh0OiBudWxsXG4gICAgfTtcblxuICAgIGlmICghZmx1c2hpbmcpIHtcbiAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0Rmx1c2goKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzYXA7XG5cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvUHJvbWlzZS9ub2RlX21vZHVsZXMvYXNhcC9hc2FwLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL1Byb21pc2Uvbm9kZV9tb2R1bGVzL2FzYXBcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG5cbi8qKlxuICogRXhwb3NlIGBFbWl0dGVyYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVtaXR0ZXI7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgRW1pdHRlcmAuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBFbWl0dGVyKG9iaikge1xuICBpZiAob2JqKSByZXR1cm4gbWl4aW4ob2JqKTtcbn07XG5cbi8qKlxuICogTWl4aW4gdGhlIGVtaXR0ZXIgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBtaXhpbihvYmopIHtcbiAgZm9yICh2YXIga2V5IGluIEVtaXR0ZXIucHJvdG90eXBlKSB7XG4gICAgb2JqW2tleV0gPSBFbWl0dGVyLnByb3RvdHlwZVtrZXldO1xuICB9XG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogTGlzdGVuIG9uIHRoZSBnaXZlbiBgZXZlbnRgIHdpdGggYGZuYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbiA9XG5FbWl0dGVyLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICAodGhpcy5fY2FsbGJhY2tzW2V2ZW50XSA9IHRoaXMuX2NhbGxiYWNrc1tldmVudF0gfHwgW10pXG4gICAgLnB1c2goZm4pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkcyBhbiBgZXZlbnRgIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIGEgc2luZ2xlXG4gKiB0aW1lIHRoZW4gYXV0b21hdGljYWxseSByZW1vdmVkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgZm4pe1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcblxuICBmdW5jdGlvbiBvbigpIHtcbiAgICBzZWxmLm9mZihldmVudCwgb24pO1xuICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBvbi5mbiA9IGZuO1xuICB0aGlzLm9uKGV2ZW50LCBvbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhlIGdpdmVuIGNhbGxiYWNrIGZvciBgZXZlbnRgIG9yIGFsbFxuICogcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub2ZmID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuXG4gIC8vIGFsbFxuICBpZiAoMCA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fY2FsbGJhY2tzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBzcGVjaWZpYyBldmVudFxuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XTtcbiAgaWYgKCFjYWxsYmFja3MpIHJldHVybiB0aGlzO1xuXG4gIC8vIHJlbW92ZSBhbGwgaGFuZGxlcnNcbiAgaWYgKDEgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbZXZlbnRdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gcmVtb3ZlIHNwZWNpZmljIGhhbmRsZXJcbiAgdmFyIGNiO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIGNiID0gY2FsbGJhY2tzW2ldO1xuICAgIGlmIChjYiA9PT0gZm4gfHwgY2IuZm4gPT09IGZuKSB7XG4gICAgICBjYWxsYmFja3Muc3BsaWNlKGksIDEpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBFbWl0IGBldmVudGAgd2l0aCB0aGUgZ2l2ZW4gYXJncy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7TWl4ZWR9IC4uLlxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnQpe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXG4gICAgLCBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3NbZXZlbnRdO1xuXG4gIGlmIChjYWxsYmFja3MpIHtcbiAgICBjYWxsYmFja3MgPSBjYWxsYmFja3Muc2xpY2UoMCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNhbGxiYWNrcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgY2FsbGJhY2tzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYXJyYXkgb2YgY2FsbGJhY2tzIGZvciBgZXZlbnRgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICByZXR1cm4gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XSB8fCBbXTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhpcyBlbWl0dGVyIGhhcyBgZXZlbnRgIGhhbmRsZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuaGFzTGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xuICByZXR1cm4gISEgdGhpcy5saXN0ZW5lcnMoZXZlbnQpLmxlbmd0aDtcbn07XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2NvbXBvbmVudC1lbWl0dGVyL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2NvbXBvbmVudC1lbWl0dGVyXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBrZXlzID0gcmVxdWlyZSgnbG9kYXNoLmtleXMnKSxcbiAgICBvYmplY3RUeXBlcyA9IHJlcXVpcmUoJ2xvZGFzaC5fb2JqZWN0dHlwZXMnKTtcblxuLyoqXG4gKiBBc3NpZ25zIG93biBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2Ygc291cmNlIG9iamVjdChzKSB0byB0aGUgZGVzdGluYXRpb25cbiAqIG9iamVjdCBmb3IgYWxsIGRlc3RpbmF0aW9uIHByb3BlcnRpZXMgdGhhdCByZXNvbHZlIHRvIGB1bmRlZmluZWRgLiBPbmNlIGFcbiAqIHByb3BlcnR5IGlzIHNldCwgYWRkaXRpb25hbCBkZWZhdWx0cyBvZiB0aGUgc2FtZSBwcm9wZXJ0eSB3aWxsIGJlIGlnbm9yZWQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEB0eXBlIEZ1bmN0aW9uXG4gKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICogQHBhcmFtIHsuLi5PYmplY3R9IFtzb3VyY2VdIFRoZSBzb3VyY2Ugb2JqZWN0cy5cbiAqIEBwYXJhbS0ge09iamVjdH0gW2d1YXJkXSBBbGxvd3Mgd29ya2luZyB3aXRoIGBfLnJlZHVjZWAgd2l0aG91dCB1c2luZyBpdHNcbiAqICBga2V5YCBhbmQgYG9iamVjdGAgYXJndW1lbnRzIGFzIHNvdXJjZXMuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBvYmplY3QgPSB7ICduYW1lJzogJ2Jhcm5leScgfTtcbiAqIF8uZGVmYXVsdHMob2JqZWN0LCB7ICduYW1lJzogJ2ZyZWQnLCAnZW1wbG95ZXInOiAnc2xhdGUnIH0pO1xuICogLy8gPT4geyAnbmFtZSc6ICdiYXJuZXknLCAnZW1wbG95ZXInOiAnc2xhdGUnIH1cbiAqL1xudmFyIGRlZmF1bHRzID0gZnVuY3Rpb24ob2JqZWN0LCBzb3VyY2UsIGd1YXJkKSB7XG4gIHZhciBpbmRleCwgaXRlcmFibGUgPSBvYmplY3QsIHJlc3VsdCA9IGl0ZXJhYmxlO1xuICBpZiAoIWl0ZXJhYmxlKSByZXR1cm4gcmVzdWx0O1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgIGFyZ3NJbmRleCA9IDAsXG4gICAgICBhcmdzTGVuZ3RoID0gdHlwZW9mIGd1YXJkID09ICdudW1iZXInID8gMiA6IGFyZ3MubGVuZ3RoO1xuICB3aGlsZSAoKythcmdzSW5kZXggPCBhcmdzTGVuZ3RoKSB7XG4gICAgaXRlcmFibGUgPSBhcmdzW2FyZ3NJbmRleF07XG4gICAgaWYgKGl0ZXJhYmxlICYmIG9iamVjdFR5cGVzW3R5cGVvZiBpdGVyYWJsZV0pIHtcbiAgICB2YXIgb3duSW5kZXggPSAtMSxcbiAgICAgICAgb3duUHJvcHMgPSBvYmplY3RUeXBlc1t0eXBlb2YgaXRlcmFibGVdICYmIGtleXMoaXRlcmFibGUpLFxuICAgICAgICBsZW5ndGggPSBvd25Qcm9wcyA/IG93blByb3BzLmxlbmd0aCA6IDA7XG5cbiAgICB3aGlsZSAoKytvd25JbmRleCA8IGxlbmd0aCkge1xuICAgICAgaW5kZXggPSBvd25Qcm9wc1tvd25JbmRleF07XG4gICAgICBpZiAodHlwZW9mIHJlc3VsdFtpbmRleF0gPT0gJ3VuZGVmaW5lZCcpIHJlc3VsdFtpbmRleF0gPSBpdGVyYWJsZVtpbmRleF07XG4gICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlZmF1bHRzO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgdG8gZGV0ZXJtaW5lIGlmIHZhbHVlcyBhcmUgb2YgdGhlIGxhbmd1YWdlIHR5cGUgT2JqZWN0ICovXG52YXIgb2JqZWN0VHlwZXMgPSB7XG4gICdib29sZWFuJzogZmFsc2UsXG4gICdmdW5jdGlvbic6IHRydWUsXG4gICdvYmplY3QnOiB0cnVlLFxuICAnbnVtYmVyJzogZmFsc2UsXG4gICdzdHJpbmcnOiBmYWxzZSxcbiAgJ3VuZGVmaW5lZCc6IGZhbHNlXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdFR5cGVzO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5fb2JqZWN0dHlwZXMvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2guX29iamVjdHR5cGVzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBpc05hdGl2ZSA9IHJlcXVpcmUoJ2xvZGFzaC5faXNuYXRpdmUnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJ2xvZGFzaC5pc29iamVjdCcpLFxuICAgIHNoaW1LZXlzID0gcmVxdWlyZSgnbG9kYXNoLl9zaGlta2V5cycpO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHNob3J0Y3V0cyBmb3IgbWV0aG9kcyB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcyAqL1xudmFyIG5hdGl2ZUtleXMgPSBpc05hdGl2ZShuYXRpdmVLZXlzID0gT2JqZWN0LmtleXMpICYmIG5hdGl2ZUtleXM7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBjb21wb3NlZCBvZiB0aGUgb3duIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgYW4gb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGluc3BlY3QuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYW4gYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8ua2V5cyh7ICdvbmUnOiAxLCAndHdvJzogMiwgJ3RocmVlJzogMyB9KTtcbiAqIC8vID0+IFsnb25lJywgJ3R3bycsICd0aHJlZSddIChwcm9wZXJ0eSBvcmRlciBpcyBub3QgZ3VhcmFudGVlZCBhY3Jvc3MgZW52aXJvbm1lbnRzKVxuICovXG52YXIga2V5cyA9ICFuYXRpdmVLZXlzID8gc2hpbUtleXMgOiBmdW5jdGlvbihvYmplY3QpIHtcbiAgaWYgKCFpc09iamVjdChvYmplY3QpKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIHJldHVybiBuYXRpdmVLZXlzKG9iamVjdCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleXM7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXMvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5c1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGludGVybmFsIFtbQ2xhc3NdXSBvZiB2YWx1ZXMgKi9cbnZhciB0b1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaWYgYSBtZXRob2QgaXMgbmF0aXZlICovXG52YXIgcmVOYXRpdmUgPSBSZWdFeHAoJ14nICtcbiAgU3RyaW5nKHRvU3RyaW5nKVxuICAgIC5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgJ1xcXFwkJicpXG4gICAgLnJlcGxhY2UoL3RvU3RyaW5nfCBmb3IgW15cXF1dKy9nLCAnLio/JykgKyAnJCdcbik7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24uXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzTmF0aXZlKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJyAmJiByZU5hdGl2ZS50ZXN0KHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc05hdGl2ZTtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9pc25hdGl2ZS9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL25vZGVfbW9kdWxlcy9sb2Rhc2guX2lzbmF0aXZlXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBvYmplY3RUeXBlcyA9IHJlcXVpcmUoJ2xvZGFzaC5fb2JqZWN0dHlwZXMnKTtcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIE5hdGl2ZSBtZXRob2Qgc2hvcnRjdXRzICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBBIGZhbGxiYWNrIGltcGxlbWVudGF0aW9uIG9mIGBPYmplY3Qua2V5c2Agd2hpY2ggcHJvZHVjZXMgYW4gYXJyYXkgb2YgdGhlXG4gKiBnaXZlbiBvYmplY3QncyBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGUgRnVuY3Rpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpbnNwZWN0LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGFuIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICovXG52YXIgc2hpbUtleXMgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgdmFyIGluZGV4LCBpdGVyYWJsZSA9IG9iamVjdCwgcmVzdWx0ID0gW107XG4gIGlmICghaXRlcmFibGUpIHJldHVybiByZXN1bHQ7XG4gIGlmICghKG9iamVjdFR5cGVzW3R5cGVvZiBvYmplY3RdKSkgcmV0dXJuIHJlc3VsdDtcbiAgICBmb3IgKGluZGV4IGluIGl0ZXJhYmxlKSB7XG4gICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChpdGVyYWJsZSwgaW5kZXgpKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gIHJldHVybiByZXN1bHRcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2hpbUtleXM7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXMvbm9kZV9tb2R1bGVzL2xvZGFzaC5fc2hpbWtleXMvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9zaGlta2V5c1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgb2JqZWN0VHlwZXMgPSByZXF1aXJlKCdsb2Rhc2guX29iamVjdHR5cGVzJyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlIGxhbmd1YWdlIHR5cGUgb2YgT2JqZWN0LlxuICogKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RzXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoMSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAvLyBjaGVjayBpZiB0aGUgdmFsdWUgaXMgdGhlIEVDTUFTY3JpcHQgbGFuZ3VhZ2UgdHlwZSBvZiBPYmplY3RcbiAgLy8gaHR0cDovL2VzNS5naXRodWIuaW8vI3g4XG4gIC8vIGFuZCBhdm9pZCBhIFY4IGJ1Z1xuICAvLyBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yMjkxXG4gIHJldHVybiAhISh2YWx1ZSAmJiBvYmplY3RUeXBlc1t0eXBlb2YgdmFsdWVdKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdDtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLmlzb2JqZWN0L2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXMvbm9kZV9tb2R1bGVzL2xvZGFzaC5pc29iamVjdFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGFzYXAgPSByZXF1aXJlKCdhc2FwJylcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlXG5mdW5jdGlvbiBQcm9taXNlKGZuKSB7XG4gIGlmICh0eXBlb2YgdGhpcyAhPT0gJ29iamVjdCcpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Byb21pc2VzIG11c3QgYmUgY29uc3RydWN0ZWQgdmlhIG5ldycpXG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBUeXBlRXJyb3IoJ25vdCBhIGZ1bmN0aW9uJylcbiAgdmFyIHN0YXRlID0gbnVsbFxuICB2YXIgdmFsdWUgPSBudWxsXG4gIHZhciBkZWZlcnJlZHMgPSBbXVxuICB2YXIgc2VsZiA9IHRoaXNcblxuICB0aGlzLnRoZW4gPSBmdW5jdGlvbihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGhhbmRsZShuZXcgSGFuZGxlcihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcmVzb2x2ZSwgcmVqZWN0KSlcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlKGRlZmVycmVkKSB7XG4gICAgaWYgKHN0YXRlID09PSBudWxsKSB7XG4gICAgICBkZWZlcnJlZHMucHVzaChkZWZlcnJlZClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBhc2FwKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGNiID0gc3RhdGUgPyBkZWZlcnJlZC5vbkZ1bGZpbGxlZCA6IGRlZmVycmVkLm9uUmVqZWN0ZWRcbiAgICAgIGlmIChjYiA9PT0gbnVsbCkge1xuICAgICAgICAoc3RhdGUgPyBkZWZlcnJlZC5yZXNvbHZlIDogZGVmZXJyZWQucmVqZWN0KSh2YWx1ZSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB2YXIgcmV0XG4gICAgICB0cnkge1xuICAgICAgICByZXQgPSBjYih2YWx1ZSlcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGRlZmVycmVkLnJlc29sdmUocmV0KVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlKG5ld1ZhbHVlKSB7XG4gICAgdHJ5IHsgLy9Qcm9taXNlIFJlc29sdXRpb24gUHJvY2VkdXJlOiBodHRwczovL2dpdGh1Yi5jb20vcHJvbWlzZXMtYXBsdXMvcHJvbWlzZXMtc3BlYyN0aGUtcHJvbWlzZS1yZXNvbHV0aW9uLXByb2NlZHVyZVxuICAgICAgaWYgKG5ld1ZhbHVlID09PSBzZWxmKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBIHByb21pc2UgY2Fubm90IGJlIHJlc29sdmVkIHdpdGggaXRzZWxmLicpXG4gICAgICBpZiAobmV3VmFsdWUgJiYgKHR5cGVvZiBuZXdWYWx1ZSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIG5ld1ZhbHVlID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICB2YXIgdGhlbiA9IG5ld1ZhbHVlLnRoZW5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgZG9SZXNvbHZlKHRoZW4uYmluZChuZXdWYWx1ZSksIHJlc29sdmUsIHJlamVjdClcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3RhdGUgPSB0cnVlXG4gICAgICB2YWx1ZSA9IG5ld1ZhbHVlXG4gICAgICBmaW5hbGUoKVxuICAgIH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlamVjdChuZXdWYWx1ZSkge1xuICAgIHN0YXRlID0gZmFsc2VcbiAgICB2YWx1ZSA9IG5ld1ZhbHVlXG4gICAgZmluYWxlKClcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmFsZSgpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZGVmZXJyZWRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKVxuICAgICAgaGFuZGxlKGRlZmVycmVkc1tpXSlcbiAgICBkZWZlcnJlZHMgPSBudWxsXG4gIH1cblxuICBkb1Jlc29sdmUoZm4sIHJlc29sdmUsIHJlamVjdClcbn1cblxuXG5mdW5jdGlvbiBIYW5kbGVyKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCByZXNvbHZlLCByZWplY3Qpe1xuICB0aGlzLm9uRnVsZmlsbGVkID0gdHlwZW9mIG9uRnVsZmlsbGVkID09PSAnZnVuY3Rpb24nID8gb25GdWxmaWxsZWQgOiBudWxsXG4gIHRoaXMub25SZWplY3RlZCA9IHR5cGVvZiBvblJlamVjdGVkID09PSAnZnVuY3Rpb24nID8gb25SZWplY3RlZCA6IG51bGxcbiAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZVxuICB0aGlzLnJlamVjdCA9IHJlamVjdFxufVxuXG4vKipcbiAqIFRha2UgYSBwb3RlbnRpYWxseSBtaXNiZWhhdmluZyByZXNvbHZlciBmdW5jdGlvbiBhbmQgbWFrZSBzdXJlXG4gKiBvbkZ1bGZpbGxlZCBhbmQgb25SZWplY3RlZCBhcmUgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBNYWtlcyBubyBndWFyYW50ZWVzIGFib3V0IGFzeW5jaHJvbnkuXG4gKi9cbmZ1bmN0aW9uIGRvUmVzb2x2ZShmbiwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgdmFyIGRvbmUgPSBmYWxzZTtcbiAgdHJ5IHtcbiAgICBmbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmIChkb25lKSByZXR1cm5cbiAgICAgIGRvbmUgPSB0cnVlXG4gICAgICBvbkZ1bGZpbGxlZCh2YWx1ZSlcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICBpZiAoZG9uZSkgcmV0dXJuXG4gICAgICBkb25lID0gdHJ1ZVxuICAgICAgb25SZWplY3RlZChyZWFzb24pXG4gICAgfSlcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBpZiAoZG9uZSkgcmV0dXJuXG4gICAgZG9uZSA9IHRydWVcbiAgICBvblJlamVjdGVkKGV4KVxuICB9XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2UvY29yZS5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9wcm9taXNlXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuJ3VzZSBzdHJpY3QnO1xuXG4vL1RoaXMgZmlsZSBjb250YWlucyB0aGVuL3Byb21pc2Ugc3BlY2lmaWMgZXh0ZW5zaW9ucyB0byB0aGUgY29yZSBwcm9taXNlIEFQSVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpXG52YXIgYXNhcCA9IHJlcXVpcmUoJ2FzYXAnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2VcblxuLyogU3RhdGljIEZ1bmN0aW9ucyAqL1xuXG5mdW5jdGlvbiBWYWx1ZVByb21pc2UodmFsdWUpIHtcbiAgdGhpcy50aGVuID0gZnVuY3Rpb24gKG9uRnVsZmlsbGVkKSB7XG4gICAgaWYgKHR5cGVvZiBvbkZ1bGZpbGxlZCAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHRoaXNcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzb2x2ZShvbkZ1bGZpbGxlZCh2YWx1ZSkpXG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG59XG5WYWx1ZVByb21pc2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQcm9taXNlLnByb3RvdHlwZSlcblxudmFyIFRSVUUgPSBuZXcgVmFsdWVQcm9taXNlKHRydWUpXG52YXIgRkFMU0UgPSBuZXcgVmFsdWVQcm9taXNlKGZhbHNlKVxudmFyIE5VTEwgPSBuZXcgVmFsdWVQcm9taXNlKG51bGwpXG52YXIgVU5ERUZJTkVEID0gbmV3IFZhbHVlUHJvbWlzZSh1bmRlZmluZWQpXG52YXIgWkVSTyA9IG5ldyBWYWx1ZVByb21pc2UoMClcbnZhciBFTVBUWVNUUklORyA9IG5ldyBWYWx1ZVByb21pc2UoJycpXG5cblByb21pc2UucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSByZXR1cm4gdmFsdWVcblxuICBpZiAodmFsdWUgPT09IG51bGwpIHJldHVybiBOVUxMXG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gVU5ERUZJTkVEXG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkgcmV0dXJuIFRSVUVcbiAgaWYgKHZhbHVlID09PSBmYWxzZSkgcmV0dXJuIEZBTFNFXG4gIGlmICh2YWx1ZSA9PT0gMCkgcmV0dXJuIFpFUk9cbiAgaWYgKHZhbHVlID09PSAnJykgcmV0dXJuIEVNUFRZU1RSSU5HXG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciB0aGVuID0gdmFsdWUudGhlblxuICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSh0aGVuLmJpbmQodmFsdWUpKVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICByZWplY3QoZXgpXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXcgVmFsdWVQcm9taXNlKHZhbHVlKVxufVxuXG5Qcm9taXNlLmZyb20gPSBQcm9taXNlLmNhc3QgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIGVyciA9IG5ldyBFcnJvcignUHJvbWlzZS5mcm9tIGFuZCBQcm9taXNlLmNhc3QgYXJlIGRlcHJlY2F0ZWQsIHVzZSBQcm9taXNlLnJlc29sdmUgaW5zdGVhZCcpXG4gIGVyci5uYW1lID0gJ1dhcm5pbmcnXG4gIGNvbnNvbGUud2FybihlcnIuc3RhY2spXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUodmFsdWUpXG59XG5cblByb21pc2UuZGVub2RlaWZ5ID0gZnVuY3Rpb24gKGZuLCBhcmd1bWVudENvdW50KSB7XG4gIGFyZ3VtZW50Q291bnQgPSBhcmd1bWVudENvdW50IHx8IEluZmluaXR5XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHdoaWxlIChhcmdzLmxlbmd0aCAmJiBhcmdzLmxlbmd0aCA+IGFyZ3VtZW50Q291bnQpIHtcbiAgICAgICAgYXJncy5wb3AoKVxuICAgICAgfVxuICAgICAgYXJncy5wdXNoKGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICBpZiAoZXJyKSByZWplY3QoZXJyKVxuICAgICAgICBlbHNlIHJlc29sdmUocmVzKVxuICAgICAgfSlcbiAgICAgIGZuLmFwcGx5KHNlbGYsIGFyZ3MpXG4gICAgfSlcbiAgfVxufVxuUHJvbWlzZS5ub2RlaWZ5ID0gZnVuY3Rpb24gKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgdmFyIGNhbGxiYWNrID0gdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gJ2Z1bmN0aW9uJyA/IGFyZ3MucG9wKCkgOiBudWxsXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpLm5vZGVpZnkoY2FsbGJhY2spXG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIGlmIChjYWxsYmFjayA9PT0gbnVsbCB8fCB0eXBlb2YgY2FsbGJhY2sgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgcmVqZWN0KGV4KSB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY2FsbGJhY2soZXgpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblByb21pc2UuYWxsID0gZnVuY3Rpb24gKCkge1xuICB2YXIgY2FsbGVkV2l0aEFycmF5ID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiBBcnJheS5pc0FycmF5KGFyZ3VtZW50c1swXSlcbiAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChjYWxsZWRXaXRoQXJyYXkgPyBhcmd1bWVudHNbMF0gOiBhcmd1bWVudHMpXG5cbiAgaWYgKCFjYWxsZWRXaXRoQXJyYXkpIHtcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdQcm9taXNlLmFsbCBzaG91bGQgYmUgY2FsbGVkIHdpdGggYSBzaW5nbGUgYXJyYXksIGNhbGxpbmcgaXQgd2l0aCBtdWx0aXBsZSBhcmd1bWVudHMgaXMgZGVwcmVjYXRlZCcpXG4gICAgZXJyLm5hbWUgPSAnV2FybmluZydcbiAgICBjb25zb2xlLndhcm4oZXJyLnN0YWNrKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDApIHJldHVybiByZXNvbHZlKFtdKVxuICAgIHZhciByZW1haW5pbmcgPSBhcmdzLmxlbmd0aFxuICAgIGZ1bmN0aW9uIHJlcyhpLCB2YWwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh2YWwgJiYgKHR5cGVvZiB2YWwgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgdmFyIHRoZW4gPSB2YWwudGhlblxuICAgICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhlbi5jYWxsKHZhbCwgZnVuY3Rpb24gKHZhbCkgeyByZXMoaSwgdmFsKSB9LCByZWplY3QpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXJnc1tpXSA9IHZhbFxuICAgICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICByZXNvbHZlKGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICByZWplY3QoZXgpXG4gICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzKGksIGFyZ3NbaV0pXG4gICAgfVxuICB9KVxufVxuXG5Qcm9taXNlLnJlamVjdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyBcbiAgICByZWplY3QodmFsdWUpO1xuICB9KTtcbn1cblxuUHJvbWlzZS5yYWNlID0gZnVuY3Rpb24gKHZhbHVlcykge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyBcbiAgICB2YWx1ZXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSl7XG4gICAgICBQcm9taXNlLnJlc29sdmUodmFsdWUpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9KVxuICB9KTtcbn1cblxuLyogUHJvdG90eXBlIE1ldGhvZHMgKi9cblxuUHJvbWlzZS5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uIChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICB2YXIgc2VsZiA9IGFyZ3VtZW50cy5sZW5ndGggPyB0aGlzLnRoZW4uYXBwbHkodGhpcywgYXJndW1lbnRzKSA6IHRoaXNcbiAgc2VsZi50aGVuKG51bGwsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRocm93IGVyclxuICAgIH0pXG4gIH0pXG59XG5cblByb21pc2UucHJvdG90eXBlLm5vZGVpZnkgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnZnVuY3Rpb24nKSByZXR1cm4gdGhpc1xuXG4gIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHZhbHVlKVxuICAgIH0pXG4gIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrKGVycilcbiAgICB9KVxuICB9KVxufVxuXG5Qcm9taXNlLnByb3RvdHlwZVsnY2F0Y2gnXSA9IGZ1bmN0aW9uIChvblJlamVjdGVkKSB7XG4gIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3RlZCk7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2UvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcHJvbWlzZVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcblxuLy8gVXNlIHRoZSBmYXN0ZXN0IHBvc3NpYmxlIG1lYW5zIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm5cbi8vIG9mIHRoZSBldmVudCBsb29wLlxuXG4vLyBsaW5rZWQgbGlzdCBvZiB0YXNrcyAoc2luZ2xlLCB3aXRoIGhlYWQgbm9kZSlcbnZhciBoZWFkID0ge3Rhc2s6IHZvaWQgMCwgbmV4dDogbnVsbH07XG52YXIgdGFpbCA9IGhlYWQ7XG52YXIgZmx1c2hpbmcgPSBmYWxzZTtcbnZhciByZXF1ZXN0Rmx1c2ggPSB2b2lkIDA7XG52YXIgaXNOb2RlSlMgPSBmYWxzZTtcblxuZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgLyoganNoaW50IGxvb3BmdW5jOiB0cnVlICovXG5cbiAgICB3aGlsZSAoaGVhZC5uZXh0KSB7XG4gICAgICAgIGhlYWQgPSBoZWFkLm5leHQ7XG4gICAgICAgIHZhciB0YXNrID0gaGVhZC50YXNrO1xuICAgICAgICBoZWFkLnRhc2sgPSB2b2lkIDA7XG4gICAgICAgIHZhciBkb21haW4gPSBoZWFkLmRvbWFpbjtcblxuICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICBoZWFkLmRvbWFpbiA9IHZvaWQgMDtcbiAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRhc2soKTtcblxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoaXNOb2RlSlMpIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBub2RlLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBjb25zaWRlcmVkIGZhdGFsIGVycm9ycy5cbiAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIHN5bmNocm9ub3VzbHkgdG8gaW50ZXJydXB0IGZsdXNoaW5nIVxuXG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIGNvbnRpbnVhdGlvbiBpZiB0aGUgdW5jYXVnaHQgZXhjZXB0aW9uIGlzIHN1cHByZXNzZWRcbiAgICAgICAgICAgICAgICAvLyBsaXN0ZW5pbmcgXCJ1bmNhdWdodEV4Y2VwdGlvblwiIGV2ZW50cyAoYXMgZG9tYWlucyBkb2VzKS5cbiAgICAgICAgICAgICAgICAvLyBDb250aW51ZSBpbiBuZXh0IGV2ZW50IHRvIGF2b2lkIHRpY2sgcmVjdXJzaW9uLlxuICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEluIGJyb3dzZXJzLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuXG4gICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBhc3luY2hyb25vdXNseSB0byBhdm9pZCBzbG93LWRvd25zLlxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmbHVzaGluZyA9IGZhbHNlO1xufVxuXG5pZiAodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgcHJvY2Vzcy5uZXh0VGljaykge1xuICAgIC8vIE5vZGUuanMgYmVmb3JlIDAuOS4gTm90ZSB0aGF0IHNvbWUgZmFrZS1Ob2RlIGVudmlyb25tZW50cywgbGlrZSB0aGVcbiAgICAvLyBNb2NoYSB0ZXN0IHJ1bm5lciwgaW50cm9kdWNlIGEgYHByb2Nlc3NgIGdsb2JhbCB3aXRob3V0IGEgYG5leHRUaWNrYC5cbiAgICBpc05vZGVKUyA9IHRydWU7XG5cbiAgICByZXF1ZXN0Rmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICAgIH07XG5cbn0gZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgLy8gSW4gSUUxMCwgTm9kZS5qcyAwLjkrLCBvciBodHRwczovL2dpdGh1Yi5jb20vTm9ibGVKUy9zZXRJbW1lZGlhdGVcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICByZXF1ZXN0Rmx1c2ggPSBzZXRJbW1lZGlhdGUuYmluZCh3aW5kb3csIGZsdXNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXF1ZXN0Rmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRJbW1lZGlhdGUoZmx1c2gpO1xuICAgICAgICB9O1xuICAgIH1cblxufSBlbHNlIGlmICh0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAvLyBtb2Rlcm4gYnJvd3NlcnNcbiAgICAvLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmbHVzaDtcbiAgICByZXF1ZXN0Rmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gICAgfTtcblxufSBlbHNlIHtcbiAgICAvLyBvbGQgYnJvd3NlcnNcbiAgICByZXF1ZXN0Rmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGFzYXAodGFzaykge1xuICAgIHRhaWwgPSB0YWlsLm5leHQgPSB7XG4gICAgICAgIHRhc2s6IHRhc2ssXG4gICAgICAgIGRvbWFpbjogaXNOb2RlSlMgJiYgcHJvY2Vzcy5kb21haW4sXG4gICAgICAgIG5leHQ6IG51bGxcbiAgICB9O1xuXG4gICAgaWYgKCFmbHVzaGluZykge1xuICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3RGbHVzaCgpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXNhcDtcblxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9wcm9taXNlL25vZGVfbW9kdWxlcy9hc2FwL2FzYXAuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcHJvbWlzZS9ub2RlX21vZHVsZXMvYXNhcFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbm1vZHVsZS5leHBvcnRzID0gVmVsb2NpdHlcblxuZnVuY3Rpb24gVmVsb2NpdHkoKSB7XG4gIHRoaXMucG9zaXRpb25RdWV1ZSA9IFtdXG4gIHRoaXMudGltZVF1ZXVlID0gW11cbn1cblxuVmVsb2NpdHkucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucG9zaXRpb25RdWV1ZS5zcGxpY2UoMClcbiAgdGhpcy50aW1lUXVldWUuc3BsaWNlKDApXG59XG5cblZlbG9jaXR5LnByb3RvdHlwZS5wcnVuZVF1ZXVlID0gZnVuY3Rpb24obXMpIHtcbiAgLy9wdWxsIG9sZCB2YWx1ZXMgb2ZmIG9mIHRoZSBxdWV1ZVxuICB3aGlsZSh0aGlzLnRpbWVRdWV1ZS5sZW5ndGggJiYgdGhpcy50aW1lUXVldWVbMF0gPCAoRGF0ZS5ub3coKSAtIG1zKSkge1xuICAgIHRoaXMudGltZVF1ZXVlLnNoaWZ0KClcbiAgICB0aGlzLnBvc2l0aW9uUXVldWUuc2hpZnQoKVxuICB9XG59XG5cblZlbG9jaXR5LnByb3RvdHlwZS51cGRhdGVQb3NpdGlvbiA9IGZ1bmN0aW9uKHBvc2l0aW9uKSB7XG4gIHRoaXMucG9zaXRpb25RdWV1ZS5wdXNoKHBvc2l0aW9uKVxuICB0aGlzLnRpbWVRdWV1ZS5wdXNoKERhdGUubm93KCkpXG4gIHRoaXMucHJ1bmVRdWV1ZSg1MClcbn1cblxuVmVsb2NpdHkucHJvdG90eXBlLmdldFZlbG9jaXR5ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucHJ1bmVRdWV1ZSgxMDAwKVxuICB2YXIgbGVuZ3RoID0gdGhpcy50aW1lUXVldWUubGVuZ3RoXG4gIGlmKGxlbmd0aCA8IDIpIHJldHVybiAwXG5cbiAgdmFyIGRpc3RhbmNlID0gdGhpcy5wb3NpdGlvblF1ZXVlW2xlbmd0aC0xXSAtIHRoaXMucG9zaXRpb25RdWV1ZVswXVxuICAgICwgdGltZSA9ICh0aGlzLnRpbWVRdWV1ZVtsZW5ndGgtMV0gLSB0aGlzLnRpbWVRdWV1ZVswXSkgLyAxMDAwXG5cbiAgcmV0dXJuIGRpc3RhbmNlIC8gdGltZVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy90b3VjaC12ZWxvY2l0eS9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy90b3VjaC12ZWxvY2l0eVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS43LjFcbihmdW5jdGlvbigpIHtcbiAgdmFyICQsIE9yaURvbWksIGFkZFN0eWxlLCBhbmNob3JMaXN0LCBhbmNob3JMaXN0SCwgYW5jaG9yTGlzdFYsIGJhc2VOYW1lLCBjYXBpdGFsaXplLCBjbG9uZUVsLCBjcmVhdGVFbCwgY3NzLCBkZWZhdWx0cywgZGVmZXIsIGVsQ2xhc3NlcywgZ2V0R3JhZGllbnQsIGhpZGVFbCwgaXNTdXBwb3J0ZWQsIGssIG5vT3AsIHByZWZpeExpc3QsIHByZXAsIHNob3dFbCwgc3R5bGVCdWZmZXIsIHN1cHBvcnRXYXJuaW5nLCB0ZXN0RWwsIHRlc3RQcm9wLCB2LCBfcmVmLFxuICAgIF9fYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH0sXG4gICAgX19pbmRleE9mID0gW10uaW5kZXhPZiB8fCBmdW5jdGlvbihpdGVtKSB7IGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHsgaWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSByZXR1cm4gaTsgfSByZXR1cm4gLTE7IH0sXG4gICAgX19zbGljZSA9IFtdLnNsaWNlO1xuXG4gIGlzU3VwcG9ydGVkID0gdHJ1ZTtcblxuICBzdXBwb3J0V2FybmluZyA9IGZ1bmN0aW9uKHByb3ApIHtcbiAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZSAhPT0gbnVsbCkge1xuICAgICAgY29uc29sZS53YXJuKFwiT3JpRG9taTogTWlzc2luZyBzdXBwb3J0IGZvciBgXCIgKyBwcm9wICsgXCJgLlwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzU3VwcG9ydGVkID0gZmFsc2U7XG4gIH07XG5cbiAgdGVzdFByb3AgPSBmdW5jdGlvbihwcm9wKSB7XG4gICAgdmFyIGZ1bGwsIHByZWZpeCwgX2ksIF9sZW47XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBwcmVmaXhMaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBwcmVmaXggPSBwcmVmaXhMaXN0W19pXTtcbiAgICAgIGlmICgoZnVsbCA9IHByZWZpeCArIGNhcGl0YWxpemUocHJvcCkpIGluIHRlc3RFbC5zdHlsZSkge1xuICAgICAgICByZXR1cm4gZnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHByb3AgaW4gdGVzdEVsLnN0eWxlKSB7XG4gICAgICByZXR1cm4gcHJvcDtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIGFkZFN0eWxlID0gZnVuY3Rpb24oc2VsZWN0b3IsIHJ1bGVzKSB7XG4gICAgdmFyIHByb3AsIHN0eWxlLCB2YWw7XG4gICAgc3R5bGUgPSBcIi5cIiArIHNlbGVjdG9yICsgXCJ7XCI7XG4gICAgZm9yIChwcm9wIGluIHJ1bGVzKSB7XG4gICAgICB2YWwgPSBydWxlc1twcm9wXTtcbiAgICAgIGlmIChwcm9wIGluIGNzcykge1xuICAgICAgICBwcm9wID0gY3NzW3Byb3BdO1xuICAgICAgICBpZiAocHJvcC5tYXRjaCgvXih3ZWJraXR8bW96fG1zKS9pKSkge1xuICAgICAgICAgIHByb3AgPSAnLScgKyBwcm9wO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdHlsZSArPSBcIlwiICsgKHByb3AucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKSkgKyBcIjpcIiArIHZhbCArIFwiO1wiO1xuICAgIH1cbiAgICByZXR1cm4gc3R5bGVCdWZmZXIgKz0gc3R5bGUgKyAnfSc7XG4gIH07XG5cbiAgZ2V0R3JhZGllbnQgPSBmdW5jdGlvbihhbmNob3IpIHtcbiAgICByZXR1cm4gXCJcIiArIGNzcy5ncmFkaWVudFByb3AgKyBcIihcIiArIGFuY2hvciArIFwiLCByZ2JhKDAsIDAsIDAsIC41KSAwJSwgcmdiYSgyNTUsIDI1NSwgMjU1LCAuMzUpIDEwMCUpXCI7XG4gIH07XG5cbiAgY2FwaXRhbGl6ZSA9IGZ1bmN0aW9uKHMpIHtcbiAgICByZXR1cm4gc1swXS50b1VwcGVyQ2FzZSgpICsgcy5zbGljZSgxKTtcbiAgfTtcblxuICBjcmVhdGVFbCA9IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgIHZhciBlbDtcbiAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsLmNsYXNzTmFtZSA9IGVsQ2xhc3Nlc1tjbGFzc05hbWVdO1xuICAgIHJldHVybiBlbDtcbiAgfTtcblxuICBjbG9uZUVsID0gZnVuY3Rpb24ocGFyZW50LCBkZWVwLCBjbGFzc05hbWUpIHtcbiAgICB2YXIgZWw7XG4gICAgZWwgPSBwYXJlbnQuY2xvbmVOb2RlKGRlZXApO1xuICAgIGVsLmNsYXNzTGlzdC5hZGQoZWxDbGFzc2VzW2NsYXNzTmFtZV0pO1xuICAgIHJldHVybiBlbDtcbiAgfTtcblxuICBoaWRlRWwgPSBmdW5jdGlvbihlbCkge1xuICAgIHJldHVybiBlbC5zdHlsZVtjc3MudHJhbnNmb3JtXSA9ICd0cmFuc2xhdGUzZCgtOTk5OTlweCwgMCwgMCknO1xuICB9O1xuXG4gIHNob3dFbCA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgcmV0dXJuIGVsLnN0eWxlW2Nzcy50cmFuc2Zvcm1dID0gJ3RyYW5zbGF0ZTNkKDAsIDAsIDApJztcbiAgfTtcblxuICBwcmVwID0gZnVuY3Rpb24oZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYTAsIGExLCBhMiwgYW5jaG9yLCBhbmdsZSwgb3B0O1xuICAgICAgaWYgKHRoaXMuX3RvdWNoU3RhcnRlZCkge1xuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGEwID0gYXJndW1lbnRzWzBdLCBhMSA9IGFyZ3VtZW50c1sxXSwgYTIgPSBhcmd1bWVudHNbMl07XG4gICAgICAgIG9wdCA9IHt9O1xuICAgICAgICBhbmdsZSA9IGFuY2hvciA9IG51bGw7XG4gICAgICAgIHN3aXRjaCAoZm4ubGVuZ3RoKSB7XG4gICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgb3B0LmNhbGxiYWNrID0gYTA7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNGb2xkZWRVcCkge1xuICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIG9wdC5jYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiID8gb3B0LmNhbGxiYWNrKCkgOiB2b2lkIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBpZiAodHlwZW9mIGEwID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIG9wdC5jYWxsYmFjayA9IGEwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYW5jaG9yID0gYTA7XG4gICAgICAgICAgICAgIG9wdC5jYWxsYmFjayA9IGExO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgYW5nbGUgPSBhMDtcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgYTEgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgb3B0ID0gYTE7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGExID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgb3B0LmNhbGxiYWNrID0gYTE7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYW5jaG9yID0gYTE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgICBhbmNob3IgPSBhMTtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhMiA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBvcHQgPSBhMjtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYTIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBvcHQuY2FsbGJhY2sgPSBhMjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbmdsZSA9PSBudWxsKSB7XG4gICAgICAgICAgYW5nbGUgPSB0aGlzLl9sYXN0T3AuYW5nbGUgfHwgMDtcbiAgICAgICAgfVxuICAgICAgICBhbmNob3IgfHwgKGFuY2hvciA9IHRoaXMuX2xhc3RPcC5hbmNob3IpO1xuICAgICAgICB0aGlzLl9xdWV1ZS5wdXNoKFtmbiwgdGhpcy5fbm9ybWFsaXplQW5nbGUoYW5nbGUpLCB0aGlzLl9nZXRMb25naGFuZEFuY2hvcihhbmNob3IpLCBvcHRdKTtcbiAgICAgICAgdGhpcy5fc3RlcCgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIGRlZmVyID0gZnVuY3Rpb24oZm4pIHtcbiAgICByZXR1cm4gc2V0VGltZW91dChmbiwgMCk7XG4gIH07XG5cbiAgbm9PcCA9IGZ1bmN0aW9uKCkge307XG5cbiAgJCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdyAhPT0gbnVsbCA/IChfcmVmID0gd2luZG93LiQpICE9IG51bGwgPyBfcmVmLmRhdGEgOiB2b2lkIDAgOiB2b2lkIDApID8gd2luZG93LiQgOiBudWxsO1xuXG4gIGFuY2hvckxpc3QgPSBbJ2xlZnQnLCAncmlnaHQnLCAndG9wJywgJ2JvdHRvbSddO1xuXG4gIGFuY2hvckxpc3RWID0gYW5jaG9yTGlzdC5zbGljZSgwLCAyKTtcblxuICBhbmNob3JMaXN0SCA9IGFuY2hvckxpc3Quc2xpY2UoMik7XG5cbiAgdGVzdEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgc3R5bGVCdWZmZXIgPSAnJztcblxuICBwcmVmaXhMaXN0ID0gWydXZWJraXQnLCAnTW96JywgJ21zJ107XG5cbiAgYmFzZU5hbWUgPSAnb3JpZG9taSc7XG5cbiAgZWxDbGFzc2VzID0ge1xuICAgIGFjdGl2ZTogJ2FjdGl2ZScsXG4gICAgY2xvbmU6ICdjbG9uZScsXG4gICAgaG9sZGVyOiAnaG9sZGVyJyxcbiAgICBzdGFnZTogJ3N0YWdlJyxcbiAgICBzdGFnZUxlZnQ6ICdzdGFnZS1sZWZ0JyxcbiAgICBzdGFnZVJpZ2h0OiAnc3RhZ2UtcmlnaHQnLFxuICAgIHN0YWdlVG9wOiAnc3RhZ2UtdG9wJyxcbiAgICBzdGFnZUJvdHRvbTogJ3N0YWdlLWJvdHRvbScsXG4gICAgY29udGVudDogJ2NvbnRlbnQnLFxuICAgIG1hc2s6ICdtYXNrJyxcbiAgICBtYXNrSDogJ21hc2staCcsXG4gICAgbWFza1Y6ICdtYXNrLXYnLFxuICAgIHBhbmVsOiAncGFuZWwnLFxuICAgIHBhbmVsSDogJ3BhbmVsLWgnLFxuICAgIHBhbmVsVjogJ3BhbmVsLXYnLFxuICAgIHNoYWRlcjogJ3NoYWRlcicsXG4gICAgc2hhZGVyTGVmdDogJ3NoYWRlci1sZWZ0JyxcbiAgICBzaGFkZXJSaWdodDogJ3NoYWRlci1yaWdodCcsXG4gICAgc2hhZGVyVG9wOiAnc2hhZGVyLXRvcCcsXG4gICAgc2hhZGVyQm90dG9tOiAnc2hhZGVyLWJvdHRvbSdcbiAgfTtcblxuICBmb3IgKGsgaW4gZWxDbGFzc2VzKSB7XG4gICAgdiA9IGVsQ2xhc3Nlc1trXTtcbiAgICBlbENsYXNzZXNba10gPSBcIlwiICsgYmFzZU5hbWUgKyBcIi1cIiArIHY7XG4gIH1cblxuICBjc3MgPSBuZXcgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGtleSwgX2ksIF9sZW4sIF9yZWYxO1xuICAgIF9yZWYxID0gWyd0cmFuc2Zvcm0nLCAndHJhbnNmb3JtT3JpZ2luJywgJ3RyYW5zZm9ybVN0eWxlJywgJ3RyYW5zaXRpb25Qcm9wZXJ0eScsICd0cmFuc2l0aW9uRHVyYXRpb24nLCAndHJhbnNpdGlvbkRlbGF5JywgJ3RyYW5zaXRpb25UaW1pbmdGdW5jdGlvbicsICdwZXJzcGVjdGl2ZScsICdwZXJzcGVjdGl2ZU9yaWdpbicsICdiYWNrZmFjZVZpc2liaWxpdHknLCAnYm94U2l6aW5nJywgJ21hc2snXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBrZXkgPSBfcmVmMVtfaV07XG4gICAgICB0aGlzW2tleV0gPSBrZXk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIChmdW5jdGlvbigpIHtcbiAgICB2YXIgYW5jaG9yLCBrZXksIHAzZCwgcHJlZml4LCBzdHlsZUVsLCB2YWx1ZSwgX2ksIF9sZW4sIF9yZWYxLCBfcmVmMjtcbiAgICBmb3IgKGtleSBpbiBjc3MpIHtcbiAgICAgIHZhbHVlID0gY3NzW2tleV07XG4gICAgICBjc3Nba2V5XSA9IHRlc3RQcm9wKHZhbHVlKTtcbiAgICAgIGlmICghY3NzW2tleV0pIHtcbiAgICAgICAgcmV0dXJuIHN1cHBvcnRXYXJuaW5nKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcDNkID0gJ3ByZXNlcnZlLTNkJztcbiAgICB0ZXN0RWwuc3R5bGVbY3NzLnRyYW5zZm9ybVN0eWxlXSA9IHAzZDtcbiAgICBpZiAodGVzdEVsLnN0eWxlW2Nzcy50cmFuc2Zvcm1TdHlsZV0gIT09IHAzZCkge1xuICAgICAgcmV0dXJuIHN1cHBvcnRXYXJuaW5nKHAzZCk7XG4gICAgfVxuICAgIGNzcy5ncmFkaWVudFByb3AgPSAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaHlwaGVuYXRlZCwgcHJlZml4LCBfaSwgX2xlbjtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gcHJlZml4TGlzdC5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBwcmVmaXggPSBwcmVmaXhMaXN0W19pXTtcbiAgICAgICAgaHlwaGVuYXRlZCA9IFwiLVwiICsgKHByZWZpeC50b0xvd2VyQ2FzZSgpKSArIFwiLWxpbmVhci1ncmFkaWVudFwiO1xuICAgICAgICB0ZXN0RWwuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gXCJcIiArIGh5cGhlbmF0ZWQgKyBcIihsZWZ0LCAjMDAwLCAjZmZmKVwiO1xuICAgICAgICBpZiAodGVzdEVsLnN0eWxlLmJhY2tncm91bmRJbWFnZS5pbmRleE9mKCdncmFkaWVudCcpICE9PSAtMSkge1xuICAgICAgICAgIHJldHVybiBoeXBoZW5hdGVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gJ2xpbmVhci1ncmFkaWVudCc7XG4gICAgfSkoKTtcbiAgICBfcmVmMSA9IChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBncmFiVmFsdWUsIHBsYWluR3JhYiwgcHJlZml4LCBfaSwgX2xlbjtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gcHJlZml4TGlzdC5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBwcmVmaXggPSBwcmVmaXhMaXN0W19pXTtcbiAgICAgICAgcGxhaW5HcmFiID0gJ2dyYWInO1xuICAgICAgICB0ZXN0RWwuc3R5bGUuY3Vyc29yID0gKGdyYWJWYWx1ZSA9IFwiLVwiICsgKHByZWZpeC50b0xvd2VyQ2FzZSgpKSArIFwiLVwiICsgcGxhaW5HcmFiKTtcbiAgICAgICAgaWYgKHRlc3RFbC5zdHlsZS5jdXJzb3IgPT09IGdyYWJWYWx1ZSkge1xuICAgICAgICAgIHJldHVybiBbZ3JhYlZhbHVlLCBcIi1cIiArIChwcmVmaXgudG9Mb3dlckNhc2UoKSkgKyBcIi1ncmFiYmluZ1wiXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGVzdEVsLnN0eWxlLmN1cnNvciA9IHBsYWluR3JhYjtcbiAgICAgIGlmICh0ZXN0RWwuc3R5bGUuY3Vyc29yID09PSBwbGFpbkdyYWIpIHtcbiAgICAgICAgcmV0dXJuIFtwbGFpbkdyYWIsICdncmFiYmluZyddO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFsnbW92ZScsICdtb3ZlJ107XG4gICAgICB9XG4gICAgfSkoKSwgY3NzLmdyYWIgPSBfcmVmMVswXSwgY3NzLmdyYWJiaW5nID0gX3JlZjFbMV07XG4gICAgY3NzLnRyYW5zZm9ybVByb3AgPSAocHJlZml4ID0gY3NzLnRyYW5zZm9ybS5tYXRjaCgvKFxcdyspVHJhbnNmb3JtL2kpKSA/IFwiLVwiICsgKHByZWZpeFsxXS50b0xvd2VyQ2FzZSgpKSArIFwiLXRyYW5zZm9ybVwiIDogJ3RyYW5zZm9ybSc7XG4gICAgY3NzLnRyYW5zaXRpb25FbmQgPSAoZnVuY3Rpb24oKSB7XG4gICAgICBzd2l0Y2ggKGNzcy50cmFuc2l0aW9uUHJvcGVydHkudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICBjYXNlICd0cmFuc2l0aW9ucHJvcGVydHknOlxuICAgICAgICAgIHJldHVybiAndHJhbnNpdGlvbkVuZCc7XG4gICAgICAgIGNhc2UgJ3dlYmtpdHRyYW5zaXRpb25wcm9wZXJ0eSc6XG4gICAgICAgICAgcmV0dXJuICd3ZWJraXRUcmFuc2l0aW9uRW5kJztcbiAgICAgICAgY2FzZSAnbW96dHJhbnNpdGlvbnByb3BlcnR5JzpcbiAgICAgICAgICByZXR1cm4gJ3RyYW5zaXRpb25lbmQnO1xuICAgICAgICBjYXNlICdtc3RyYW5zaXRpb25wcm9wZXJ0eSc6XG4gICAgICAgICAgcmV0dXJuICdtc1RyYW5zaXRpb25FbmQnO1xuICAgICAgfVxuICAgIH0pKCk7XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLmFjdGl2ZSwge1xuICAgICAgYmFja2dyb3VuZENvbG9yOiAndHJhbnNwYXJlbnQgIWltcG9ydGFudCcsXG4gICAgICBiYWNrZ3JvdW5kSW1hZ2U6ICdub25lICFpbXBvcnRhbnQnLFxuICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCAhaW1wb3J0YW50JyxcbiAgICAgIGJvcmRlcjogJ25vbmUgIWltcG9ydGFudCcsXG4gICAgICBvdXRsaW5lOiAnbm9uZSAhaW1wb3J0YW50JyxcbiAgICAgIHBhZGRpbmc6ICcwICFpbXBvcnRhbnQnLFxuICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICB0cmFuc2Zvcm1TdHlsZTogcDNkICsgJyAhaW1wb3J0YW50JyxcbiAgICAgIG1hc2s6ICdub25lICFpbXBvcnRhbnQnXG4gICAgfSk7XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLmNsb25lLCB7XG4gICAgICBtYXJnaW46ICcwICFpbXBvcnRhbnQnLFxuICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCAhaW1wb3J0YW50JyxcbiAgICAgIG92ZXJmbG93OiAnaGlkZGVuICFpbXBvcnRhbnQnLFxuICAgICAgZGlzcGxheTogJ2Jsb2NrICFpbXBvcnRhbnQnXG4gICAgfSk7XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLmhvbGRlciwge1xuICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgdG9wOiAnMCcsXG4gICAgICBib3R0b206ICcwJyxcbiAgICAgIHRyYW5zZm9ybVN0eWxlOiBwM2RcbiAgICB9KTtcbiAgICBhZGRTdHlsZShlbENsYXNzZXMuc3RhZ2UsIHtcbiAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoLTk5OTlweCwgMCwgMCknLFxuICAgICAgbWFyZ2luOiAnMCcsXG4gICAgICBwYWRkaW5nOiAnMCcsXG4gICAgICB0cmFuc2Zvcm1TdHlsZTogcDNkXG4gICAgfSk7XG4gICAgX3JlZjIgPSB7XG4gICAgICBMZWZ0OiAnMCUgNTAlJyxcbiAgICAgIFJpZ2h0OiAnMTAwJSA1MCUnLFxuICAgICAgVG9wOiAnNTAlIDAlJyxcbiAgICAgIEJvdHRvbTogJzUwJSAxMDAlJ1xuICAgIH07XG4gICAgZm9yIChrIGluIF9yZWYyKSB7XG4gICAgICB2ID0gX3JlZjJba107XG4gICAgICBhZGRTdHlsZShlbENsYXNzZXNbJ3N0YWdlJyArIGtdLCB7XG4gICAgICAgIHBlcnNwZWN0aXZlT3JpZ2luOiB2XG4gICAgICB9KTtcbiAgICB9XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLnNoYWRlciwge1xuICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgIGhlaWdodDogJzEwMCUnLFxuICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICBvcGFjaXR5OiAnMCcsXG4gICAgICB0b3A6ICcwJyxcbiAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVooMCknLFxuICAgICAgbGVmdDogJzAnLFxuICAgICAgcG9pbnRlckV2ZW50czogJ25vbmUnLFxuICAgICAgdHJhbnNpdGlvblByb3BlcnR5OiAnb3BhY2l0eSdcbiAgICB9KTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGFuY2hvckxpc3QubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGFuY2hvciA9IGFuY2hvckxpc3RbX2ldO1xuICAgICAgYWRkU3R5bGUoZWxDbGFzc2VzWydzaGFkZXInICsgY2FwaXRhbGl6ZShhbmNob3IpXSwge1xuICAgICAgICBiYWNrZ3JvdW5kOiBnZXRHcmFkaWVudChhbmNob3IpLFxuICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVaKDApJ1xuICAgICAgfSk7XG4gICAgfVxuICAgIGFkZFN0eWxlKGVsQ2xhc3Nlcy5jb250ZW50LCB7XG4gICAgICBtYXJnaW46ICcwICFpbXBvcnRhbnQnLFxuICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZSAhaW1wb3J0YW50JyxcbiAgICAgIGZsb2F0OiAnbm9uZSAhaW1wb3J0YW50JyxcbiAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3ggIWltcG9ydGFudCcsXG4gICAgICBvdmVyZmxvdzogJ2hpZGRlbiAhaW1wb3J0YW50J1xuICAgIH0pO1xuICAgIGFkZFN0eWxlKGVsQ2xhc3Nlcy5tYXNrLCB7XG4gICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZTNkKDAsIDAsIDApJyxcbiAgICAgIG91dGxpbmU6ICcxcHggc29saWQgdHJhbnNwYXJlbnQnXG4gICAgfSk7XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLnBhbmVsLCB7XG4gICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICBwYWRkaW5nOiAnMCcsXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgIHRyYW5zaXRpb25Qcm9wZXJ0eTogY3NzLnRyYW5zZm9ybVByb3AsXG4gICAgICB0cmFuc2Zvcm1PcmlnaW46ICdsZWZ0JyxcbiAgICAgIHRyYW5zZm9ybVN0eWxlOiBwM2RcbiAgICB9KTtcbiAgICBhZGRTdHlsZShlbENsYXNzZXMucGFuZWxILCB7XG4gICAgICB0cmFuc2Zvcm1PcmlnaW46ICd0b3AnXG4gICAgfSk7XG4gICAgYWRkU3R5bGUoXCJcIiArIGVsQ2xhc3Nlcy5zdGFnZVJpZ2h0ICsgXCIgLlwiICsgZWxDbGFzc2VzLnBhbmVsLCB7XG4gICAgICB0cmFuc2Zvcm1PcmlnaW46ICdyaWdodCdcbiAgICB9KTtcbiAgICBhZGRTdHlsZShcIlwiICsgZWxDbGFzc2VzLnN0YWdlQm90dG9tICsgXCIgLlwiICsgZWxDbGFzc2VzLnBhbmVsLCB7XG4gICAgICB0cmFuc2Zvcm1PcmlnaW46ICdib3R0b20nXG4gICAgfSk7XG4gICAgc3R5bGVFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgc3R5bGVFbC50eXBlID0gJ3RleHQvY3NzJztcbiAgICBpZiAoc3R5bGVFbC5zdHlsZVNoZWV0KSB7XG4gICAgICBzdHlsZUVsLnN0eWxlU2hlZXQuY3NzVGV4dCA9IHN0eWxlQnVmZmVyO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZUVsLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHN0eWxlQnVmZmVyKSk7XG4gICAgfVxuICAgIHJldHVybiBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlRWwpO1xuICB9KSgpO1xuXG4gIGRlZmF1bHRzID0ge1xuICAgIHZQYW5lbHM6IDMsXG4gICAgaFBhbmVsczogMyxcbiAgICBwZXJzcGVjdGl2ZTogMTAwMCxcbiAgICBzaGFkaW5nOiAnaGFyZCcsXG4gICAgc3BlZWQ6IDcwMCxcbiAgICBtYXhBbmdsZTogOTAsXG4gICAgcmlwcGxlOiAwLFxuICAgIG9yaURvbWlDbGFzczogJ29yaWRvbWknLFxuICAgIHNoYWRpbmdJbnRlbnNpdHk6IDEsXG4gICAgZWFzaW5nTWV0aG9kOiAnJyxcbiAgICBnYXBOdWRnZTogMSxcbiAgICB0b3VjaEVuYWJsZWQ6IHRydWUsXG4gICAgdG91Y2hTZW5zaXRpdml0eTogLjI1LFxuICAgIHRvdWNoU3RhcnRDYWxsYmFjazogbm9PcCxcbiAgICB0b3VjaE1vdmVDYWxsYmFjazogbm9PcCxcbiAgICB0b3VjaEVuZENhbGxiYWNrOiBub09wXG4gIH07XG5cbiAgT3JpRG9taSA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBPcmlEb21pKGVsLCBvcHRpb25zKSB7XG4gICAgICB2YXIgYSwgYW5jaG9yLCBhbmNob3JTZXQsIGF4aXMsIGNsYXNzU3VmZml4LCBjb250ZW50LCBjb250ZW50SG9sZGVyLCBjb3VudCwgaSwgaW5kZXgsIG1hc2ssIG1hc2tQcm90bywgbWV0cmljLCBvZmZzZXRzLCBwYW5lbCwgcGFuZWxDb25maWcsIHBhbmVsS2V5LCBwYW5lbE4sIHBhbmVsUHJvdG8sIHBlcmNlbnQsIHByZXYsIHByb3RvLCByaWdodE9yQm90dG9tLCBzaGFkZXJQcm90bywgc2hhZGVyUHJvdG9zLCBzaWRlLCBzdGFnZVByb3RvLCBfaSwgX2osIF9rLCBfbCwgX2xlbiwgX2xlbjEsIF9sZW4yLCBfbGVuMywgX2xlbjQsIF9sZW41LCBfbGVuNiwgX2xlbjcsIF9tLCBfbiwgX28sIF9wLCBfcSwgX3JlZjEsIF9yZWYyO1xuICAgICAgdGhpcy5lbCA9IGVsO1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICB0aGlzLl9vbk1vdXNlT3V0ID0gX19iaW5kKHRoaXMuX29uTW91c2VPdXQsIHRoaXMpO1xuICAgICAgdGhpcy5fb25Ub3VjaExlYXZlID0gX19iaW5kKHRoaXMuX29uVG91Y2hMZWF2ZSwgdGhpcyk7XG4gICAgICB0aGlzLl9vblRvdWNoRW5kID0gX19iaW5kKHRoaXMuX29uVG91Y2hFbmQsIHRoaXMpO1xuICAgICAgdGhpcy5fb25Ub3VjaE1vdmUgPSBfX2JpbmQodGhpcy5fb25Ub3VjaE1vdmUsIHRoaXMpO1xuICAgICAgdGhpcy5fb25Ub3VjaFN0YXJ0ID0gX19iaW5kKHRoaXMuX29uVG91Y2hTdGFydCwgdGhpcyk7XG4gICAgICB0aGlzLl9zdGFnZVJlc2V0ID0gX19iaW5kKHRoaXMuX3N0YWdlUmVzZXQsIHRoaXMpO1xuICAgICAgdGhpcy5fY29uY2x1ZGUgPSBfX2JpbmQodGhpcy5fY29uY2x1ZGUsIHRoaXMpO1xuICAgICAgdGhpcy5fb25UcmFuc2l0aW9uRW5kID0gX19iaW5kKHRoaXMuX29uVHJhbnNpdGlvbkVuZCwgdGhpcyk7XG4gICAgICB0aGlzLl9zdGVwID0gX19iaW5kKHRoaXMuX3N0ZXAsIHRoaXMpO1xuICAgICAgaWYgKCFpc1N1cHBvcnRlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgT3JpRG9taSkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBPcmlEb21pKHRoaXMuZWwsIG9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB0aGlzLmVsID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLmVsKTtcbiAgICAgIH1cbiAgICAgIGlmICghKHRoaXMuZWwgJiYgdGhpcy5lbC5ub2RlVHlwZSA9PT0gMSkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ09yaURvbWk6IEZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBET00gZWxlbWVudCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2NvbmZpZyA9IG5ldyBmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yIChrIGluIGRlZmF1bHRzKSB7XG4gICAgICAgICAgdiA9IGRlZmF1bHRzW2tdO1xuICAgICAgICAgIGlmIChrIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXNba10gPSBvcHRpb25zW2tdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzW2tdID0gdjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9O1xuICAgICAgdGhpcy5fY29uZmlnLnJpcHBsZSA9IE51bWJlcih0aGlzLl9jb25maWcucmlwcGxlKTtcbiAgICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgICB0aGlzLl9wYW5lbHMgPSB7fTtcbiAgICAgIHRoaXMuX3N0YWdlcyA9IHt9O1xuICAgICAgdGhpcy5fbGFzdE9wID0ge1xuICAgICAgICBhbmNob3I6IGFuY2hvckxpc3RbMF1cbiAgICAgIH07XG4gICAgICB0aGlzLl9zaGFkaW5nID0gdGhpcy5fY29uZmlnLnNoYWRpbmc7XG4gICAgICBpZiAodGhpcy5fc2hhZGluZyA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLl9zaGFkaW5nID0gJ2hhcmQnO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgdGhpcy5fc2hhZGVycyA9IHt9O1xuICAgICAgICBzaGFkZXJQcm90b3MgPSB7fTtcbiAgICAgICAgc2hhZGVyUHJvdG8gPSBjcmVhdGVFbCgnc2hhZGVyJyk7XG4gICAgICAgIHNoYWRlclByb3RvLnN0eWxlW2Nzcy50cmFuc2l0aW9uRHVyYXRpb25dID0gdGhpcy5fY29uZmlnLnNwZWVkICsgJ21zJztcbiAgICAgICAgc2hhZGVyUHJvdG8uc3R5bGVbY3NzLnRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbl0gPSB0aGlzLl9jb25maWcuZWFzaW5nTWV0aG9kO1xuICAgICAgfVxuICAgICAgc3RhZ2VQcm90byA9IGNyZWF0ZUVsKCdzdGFnZScpO1xuICAgICAgc3RhZ2VQcm90by5zdHlsZVtjc3MucGVyc3BlY3RpdmVdID0gdGhpcy5fY29uZmlnLnBlcnNwZWN0aXZlICsgJ3B4JztcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gYW5jaG9yTGlzdC5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBhbmNob3IgPSBhbmNob3JMaXN0W19pXTtcbiAgICAgICAgdGhpcy5fcGFuZWxzW2FuY2hvcl0gPSBbXTtcbiAgICAgICAgdGhpcy5fc3RhZ2VzW2FuY2hvcl0gPSBjbG9uZUVsKHN0YWdlUHJvdG8sIGZhbHNlLCAnc3RhZ2UnICsgY2FwaXRhbGl6ZShhbmNob3IpKTtcbiAgICAgICAgaWYgKHRoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgICB0aGlzLl9zaGFkZXJzW2FuY2hvcl0gPSB7fTtcbiAgICAgICAgICBpZiAoX19pbmRleE9mLmNhbGwoYW5jaG9yTGlzdFYsIGFuY2hvcikgPj0gMCkge1xuICAgICAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gYW5jaG9yTGlzdFYubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgICAgIHNpZGUgPSBhbmNob3JMaXN0Vltfal07XG4gICAgICAgICAgICAgIHRoaXMuX3NoYWRlcnNbYW5jaG9yXVtzaWRlXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKF9rID0gMCwgX2xlbjIgPSBhbmNob3JMaXN0SC5sZW5ndGg7IF9rIDwgX2xlbjI7IF9rKyspIHtcbiAgICAgICAgICAgICAgc2lkZSA9IGFuY2hvckxpc3RIW19rXTtcbiAgICAgICAgICAgICAgdGhpcy5fc2hhZGVyc1thbmNob3JdW3NpZGVdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHNoYWRlclByb3Rvc1thbmNob3JdID0gY2xvbmVFbChzaGFkZXJQcm90bywgZmFsc2UsICdzaGFkZXInICsgY2FwaXRhbGl6ZShhbmNob3IpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGVudEhvbGRlciA9IGNsb25lRWwodGhpcy5lbCwgdHJ1ZSwgJ2NvbnRlbnQnKTtcbiAgICAgIG1hc2tQcm90byA9IGNyZWF0ZUVsKCdtYXNrJyk7XG4gICAgICBtYXNrUHJvdG8uYXBwZW5kQ2hpbGQoY29udGVudEhvbGRlcik7XG4gICAgICBwYW5lbFByb3RvID0gY3JlYXRlRWwoJ3BhbmVsJyk7XG4gICAgICBwYW5lbFByb3RvLnN0eWxlW2Nzcy50cmFuc2l0aW9uRHVyYXRpb25dID0gdGhpcy5fY29uZmlnLnNwZWVkICsgJ21zJztcbiAgICAgIHBhbmVsUHJvdG8uc3R5bGVbY3NzLnRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbl0gPSB0aGlzLl9jb25maWcuZWFzaW5nTWV0aG9kO1xuICAgICAgb2Zmc2V0cyA9IHtcbiAgICAgICAgbGVmdDogW10sXG4gICAgICAgIHRvcDogW11cbiAgICAgIH07XG4gICAgICBfcmVmMSA9IFsneCcsICd5J107XG4gICAgICBmb3IgKF9sID0gMCwgX2xlbjMgPSBfcmVmMS5sZW5ndGg7IF9sIDwgX2xlbjM7IF9sKyspIHtcbiAgICAgICAgYXhpcyA9IF9yZWYxW19sXTtcbiAgICAgICAgaWYgKGF4aXMgPT09ICd4Jykge1xuICAgICAgICAgIGFuY2hvclNldCA9IGFuY2hvckxpc3RWO1xuICAgICAgICAgIG1ldHJpYyA9ICd3aWR0aCc7XG4gICAgICAgICAgY2xhc3NTdWZmaXggPSAnVic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYW5jaG9yU2V0ID0gYW5jaG9yTGlzdEg7XG4gICAgICAgICAgbWV0cmljID0gJ2hlaWdodCc7XG4gICAgICAgICAgY2xhc3NTdWZmaXggPSAnSCc7XG4gICAgICAgIH1cbiAgICAgICAgcGFuZWxDb25maWcgPSB0aGlzLl9jb25maWdbcGFuZWxLZXkgPSBjbGFzc1N1ZmZpeC50b0xvd2VyQ2FzZSgpICsgJ1BhbmVscyddO1xuICAgICAgICBpZiAodHlwZW9mIHBhbmVsQ29uZmlnID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGNvdW50ID0gTWF0aC5hYnMocGFyc2VJbnQocGFuZWxDb25maWcsIDEwKSk7XG4gICAgICAgICAgcGVyY2VudCA9IDEwMCAvIGNvdW50O1xuICAgICAgICAgIHBhbmVsQ29uZmlnID0gdGhpcy5fY29uZmlnW3BhbmVsS2V5XSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBfbSwgX3Jlc3VsdHM7XG4gICAgICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgZm9yIChfbSA9IDA7IDAgPD0gY291bnQgPyBfbSA8IGNvdW50IDogX20gPiBjb3VudDsgMCA8PSBjb3VudCA/IF9tKysgOiBfbS0tKSB7XG4gICAgICAgICAgICAgIF9yZXN1bHRzLnB1c2gocGVyY2VudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICAgICAgfSkoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb3VudCA9IHBhbmVsQ29uZmlnLmxlbmd0aDtcbiAgICAgICAgICBpZiAoISgoOTkgPD0gKF9yZWYyID0gcGFuZWxDb25maWcucmVkdWNlKGZ1bmN0aW9uKHAsIGMpIHtcbiAgICAgICAgICAgIHJldHVybiBwICsgYztcbiAgICAgICAgICB9KSkgJiYgX3JlZjIgPD0gMTAwLjEpKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcmlEb21pOiBQYW5lbCBwZXJjZW50YWdlcyBkbyBub3Qgc3VtIHRvIDEwMCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBtYXNrID0gY2xvbmVFbChtYXNrUHJvdG8sIHRydWUsICdtYXNrJyArIGNsYXNzU3VmZml4KTtcbiAgICAgICAgaWYgKHRoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgICBmb3IgKF9tID0gMCwgX2xlbjQgPSBhbmNob3JTZXQubGVuZ3RoOyBfbSA8IF9sZW40OyBfbSsrKSB7XG4gICAgICAgICAgICBhbmNob3IgPSBhbmNob3JTZXRbX21dO1xuICAgICAgICAgICAgbWFzay5hcHBlbmRDaGlsZChzaGFkZXJQcm90b3NbYW5jaG9yXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHByb3RvID0gY2xvbmVFbChwYW5lbFByb3RvLCBmYWxzZSwgJ3BhbmVsJyArIGNsYXNzU3VmZml4KTtcbiAgICAgICAgcHJvdG8uYXBwZW5kQ2hpbGQobWFzayk7XG4gICAgICAgIGZvciAocmlnaHRPckJvdHRvbSA9IF9uID0gMCwgX2xlbjUgPSBhbmNob3JTZXQubGVuZ3RoOyBfbiA8IF9sZW41OyByaWdodE9yQm90dG9tID0gKytfbikge1xuICAgICAgICAgIGFuY2hvciA9IGFuY2hvclNldFtyaWdodE9yQm90dG9tXTtcbiAgICAgICAgICBmb3IgKHBhbmVsTiA9IF9vID0gMDsgMCA8PSBjb3VudCA/IF9vIDwgY291bnQgOiBfbyA+IGNvdW50OyBwYW5lbE4gPSAwIDw9IGNvdW50ID8gKytfbyA6IC0tX28pIHtcbiAgICAgICAgICAgIHBhbmVsID0gcHJvdG8uY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgY29udGVudCA9IHBhbmVsLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdO1xuICAgICAgICAgICAgY29udGVudC5zdHlsZS53aWR0aCA9IGNvbnRlbnQuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuICAgICAgICAgICAgaWYgKHJpZ2h0T3JCb3R0b20pIHtcbiAgICAgICAgICAgICAgcGFuZWwuc3R5bGVbY3NzLm9yaWdpbl0gPSBhbmNob3I7XG4gICAgICAgICAgICAgIGluZGV4ID0gcGFuZWxDb25maWcubGVuZ3RoIC0gcGFuZWxOIC0gMTtcbiAgICAgICAgICAgICAgcHJldiA9IGluZGV4ICsgMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGluZGV4ID0gcGFuZWxOO1xuICAgICAgICAgICAgICBwcmV2ID0gaW5kZXggLSAxO1xuICAgICAgICAgICAgICBpZiAocGFuZWxOID09PSAwKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0c1thbmNob3JdLnB1c2goMCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0c1thbmNob3JdLnB1c2goKG9mZnNldHNbYW5jaG9yXVtwcmV2XSAtIDEwMCkgKiAocGFuZWxDb25maWdbcHJldl0gLyBwYW5lbENvbmZpZ1tpbmRleF0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhbmVsTiA9PT0gMCkge1xuICAgICAgICAgICAgICBwYW5lbC5zdHlsZVthbmNob3JdID0gJzAnO1xuICAgICAgICAgICAgICBwYW5lbC5zdHlsZVttZXRyaWNdID0gcGFuZWxDb25maWdbaW5kZXhdICsgJyUnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGFuZWwuc3R5bGVbYW5jaG9yXSA9ICcxMDAlJztcbiAgICAgICAgICAgICAgcGFuZWwuc3R5bGVbbWV0cmljXSA9IHBhbmVsQ29uZmlnW2luZGV4XSAvIHBhbmVsQ29uZmlnW3ByZXZdICogMTAwICsgJyUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgICAgICAgZm9yIChpID0gX3AgPSAwLCBfbGVuNiA9IGFuY2hvclNldC5sZW5ndGg7IF9wIDwgX2xlbjY7IGkgPSArK19wKSB7XG4gICAgICAgICAgICAgICAgYSA9IGFuY2hvclNldFtpXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaGFkZXJzW2FuY2hvcl1bYV1bcGFuZWxOXSA9IHBhbmVsLmNoaWxkcmVuWzBdLmNoaWxkcmVuW2kgKyAxXTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGVudC5zdHlsZVttZXRyaWNdID0gY29udGVudC5zdHlsZVsnbWF4JyArIGNhcGl0YWxpemUobWV0cmljKV0gPSAoY291bnQgLyBwYW5lbENvbmZpZ1tpbmRleF0gKiAxMDAwMCAvIGNvdW50KSArICclJztcbiAgICAgICAgICAgIGNvbnRlbnQuc3R5bGVbYW5jaG9yU2V0WzBdXSA9IG9mZnNldHNbYW5jaG9yU2V0WzBdXVtpbmRleF0gKyAnJSc7XG4gICAgICAgICAgICB0aGlzLl90cmFuc2Zvcm1QYW5lbChwYW5lbCwgMCwgYW5jaG9yKTtcbiAgICAgICAgICAgIHRoaXMuX3BhbmVsc1thbmNob3JdW3BhbmVsTl0gPSBwYW5lbDtcbiAgICAgICAgICAgIGlmIChwYW5lbE4gIT09IDApIHtcbiAgICAgICAgICAgICAgdGhpcy5fcGFuZWxzW2FuY2hvcl1bcGFuZWxOIC0gMV0uYXBwZW5kQ2hpbGQocGFuZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9zdGFnZXNbYW5jaG9yXS5hcHBlbmRDaGlsZCh0aGlzLl9wYW5lbHNbYW5jaG9yXVswXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX3N0YWdlSG9sZGVyID0gY3JlYXRlRWwoJ2hvbGRlcicpO1xuICAgICAgdGhpcy5fc3RhZ2VIb2xkZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICBmb3IgKF9xID0gMCwgX2xlbjcgPSBhbmNob3JMaXN0Lmxlbmd0aDsgX3EgPCBfbGVuNzsgX3ErKykge1xuICAgICAgICBhbmNob3IgPSBhbmNob3JMaXN0W19xXTtcbiAgICAgICAgdGhpcy5fc3RhZ2VIb2xkZXIuYXBwZW5kQ2hpbGQodGhpcy5fc3RhZ2VzW2FuY2hvcl0pO1xuICAgICAgfVxuICAgICAgaWYgKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMuZWwpLnBvc2l0aW9uID09PSAnYWJzb2x1dGUnKSB7XG4gICAgICAgIHRoaXMuZWwuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgfVxuICAgICAgdGhpcy5lbC5jbGFzc0xpc3QuYWRkKGVsQ2xhc3Nlcy5hY3RpdmUpO1xuICAgICAgc2hvd0VsKHRoaXMuX3N0YWdlcy5sZWZ0KTtcbiAgICAgIHRoaXMuX2Nsb25lRWwgPSBjbG9uZUVsKHRoaXMuZWwsIHRydWUsICdjbG9uZScpO1xuICAgICAgdGhpcy5fY2xvbmVFbC5jbGFzc0xpc3QucmVtb3ZlKGVsQ2xhc3Nlcy5hY3RpdmUpO1xuICAgICAgaGlkZUVsKHRoaXMuX2Nsb25lRWwpO1xuICAgICAgdGhpcy5lbC5pbm5lckhUTUwgPSAnJztcbiAgICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy5fY2xvbmVFbCk7XG4gICAgICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMuX3N0YWdlSG9sZGVyKTtcbiAgICAgIHRoaXMuZWwucGFyZW50Tm9kZS5zdHlsZVtjc3MudHJhbnNmb3JtU3R5bGVdID0gJ3ByZXNlcnZlLTNkJztcbiAgICAgIHRoaXMuYWNjb3JkaW9uKDApO1xuICAgICAgaWYgKHRoaXMuX2NvbmZpZy5yaXBwbGUpIHtcbiAgICAgICAgdGhpcy5zZXRSaXBwbGUodGhpcy5fY29uZmlnLnJpcHBsZSk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fY29uZmlnLnRvdWNoRW5hYmxlZCkge1xuICAgICAgICB0aGlzLmVuYWJsZVRvdWNoKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX3N0ZXAgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhbmNob3IsIGFuZ2xlLCBmbiwgbmV4dCwgb3B0aW9ucywgX3JlZjE7XG4gICAgICBpZiAodGhpcy5faW5UcmFucyB8fCAhdGhpcy5fcXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2luVHJhbnMgPSB0cnVlO1xuICAgICAgX3JlZjEgPSB0aGlzLl9xdWV1ZS5zaGlmdCgpLCBmbiA9IF9yZWYxWzBdLCBhbmdsZSA9IF9yZWYxWzFdLCBhbmNob3IgPSBfcmVmMVsyXSwgb3B0aW9ucyA9IF9yZWYxWzNdO1xuICAgICAgaWYgKHRoaXMuaXNGcm96ZW4pIHtcbiAgICAgICAgdGhpcy51bmZyZWV6ZSgpO1xuICAgICAgfVxuICAgICAgbmV4dCA9IChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgICAgX3RoaXMuX3NldENhbGxiYWNrKHtcbiAgICAgICAgICAgIGFuZ2xlOiBhbmdsZSxcbiAgICAgICAgICAgIGFuY2hvcjogYW5jaG9yLFxuICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcbiAgICAgICAgICAgIGZuOiBmblxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGFyZ3MgPSBbYW5nbGUsIGFuY2hvciwgb3B0aW9uc107XG4gICAgICAgICAgaWYgKGZuLmxlbmd0aCA8IDMpIHtcbiAgICAgICAgICAgIGFyZ3Muc2hpZnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KF90aGlzLCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpO1xuICAgICAgaWYgKHRoaXMuaXNGb2xkZWRVcCkge1xuICAgICAgICBpZiAoZm4ubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fdW5mb2xkKG5leHQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFuY2hvciAhPT0gdGhpcy5fbGFzdE9wLmFuY2hvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhZ2VSZXNldChhbmNob3IsIG5leHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX2lzSWRlbnRpY2FsT3BlcmF0aW9uID0gZnVuY3Rpb24ob3ApIHtcbiAgICAgIHZhciBrZXksIF9pLCBfbGVuLCBfcmVmMSwgX3JlZjI7XG4gICAgICBpZiAoIXRoaXMuX2xhc3RPcC5mbikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9sYXN0T3AucmVzZXQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgX3JlZjEgPSBbJ2FuZ2xlJywgJ2FuY2hvcicsICdmbiddO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmMS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBrZXkgPSBfcmVmMVtfaV07XG4gICAgICAgIGlmICh0aGlzLl9sYXN0T3Bba2V5XSAhPT0gb3Bba2V5XSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgX3JlZjIgPSBvcC5vcHRpb25zO1xuICAgICAgZm9yIChrIGluIF9yZWYyKSB7XG4gICAgICAgIHYgPSBfcmVmMltrXTtcbiAgICAgICAgaWYgKHYgIT09IHRoaXMuX2xhc3RPcC5vcHRpb25zW2tdICYmIGsgIT09ICdjYWxsYmFjaycpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fc2V0Q2FsbGJhY2sgPSBmdW5jdGlvbihvcGVyYXRpb24pIHtcbiAgICAgIGlmICghdGhpcy5fY29uZmlnLnNwZWVkIHx8IHRoaXMuX2lzSWRlbnRpY2FsT3BlcmF0aW9uKG9wZXJhdGlvbikpIHtcbiAgICAgICAgdGhpcy5fY29uY2x1ZGUob3BlcmF0aW9uLm9wdGlvbnMuY2FsbGJhY2spO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcGFuZWxzW3RoaXMuX2xhc3RPcC5hbmNob3JdWzBdLmFkZEV2ZW50TGlzdGVuZXIoY3NzLnRyYW5zaXRpb25FbmQsIHRoaXMuX29uVHJhbnNpdGlvbkVuZCwgZmFsc2UpO1xuICAgICAgfVxuICAgICAgcmV0dXJuICh0aGlzLl9sYXN0T3AgPSBvcGVyYXRpb24pLnJlc2V0ID0gZmFsc2U7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9vblRyYW5zaXRpb25FbmQgPSBmdW5jdGlvbihlKSB7XG4gICAgICBlLmN1cnJlbnRUYXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihjc3MudHJhbnNpdGlvbkVuZCwgdGhpcy5fb25UcmFuc2l0aW9uRW5kLCBmYWxzZSk7XG4gICAgICByZXR1cm4gdGhpcy5fY29uY2x1ZGUodGhpcy5fbGFzdE9wLm9wdGlvbnMuY2FsbGJhY2ssIGUpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fY29uY2x1ZGUgPSBmdW5jdGlvbihjYiwgZXZlbnQpIHtcbiAgICAgIHJldHVybiBkZWZlcigoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLl9pblRyYW5zID0gZmFsc2U7XG4gICAgICAgICAgX3RoaXMuX3N0ZXAoKTtcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGNiID09PSBcImZ1bmN0aW9uXCIgPyBjYihldmVudCwgX3RoaXMpIDogdm9pZCAwO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fdHJhbnNmb3JtUGFuZWwgPSBmdW5jdGlvbihlbCwgYW5nbGUsIGFuY2hvciwgZnJhY3R1cmUpIHtcbiAgICAgIHZhciB0cmFuc1ByZWZpeCwgeCwgeSwgejtcbiAgICAgIHggPSB5ID0geiA9IDA7XG4gICAgICBzd2l0Y2ggKGFuY2hvcikge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICB5ID0gYW5nbGU7XG4gICAgICAgICAgdHJhbnNQcmVmaXggPSAnWCgtJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgIHkgPSAtYW5nbGU7XG4gICAgICAgICAgdHJhbnNQcmVmaXggPSAnWCgnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd0b3AnOlxuICAgICAgICAgIHggPSAtYW5nbGU7XG4gICAgICAgICAgdHJhbnNQcmVmaXggPSAnWSgtJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgICB4ID0gYW5nbGU7XG4gICAgICAgICAgdHJhbnNQcmVmaXggPSAnWSgnO1xuICAgICAgfVxuICAgICAgaWYgKGZyYWN0dXJlKSB7XG4gICAgICAgIHggPSB5ID0geiA9IGFuZ2xlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVsLnN0eWxlW2Nzcy50cmFuc2Zvcm1dID0gXCJyb3RhdGVYKFwiICsgeCArIFwiZGVnKSByb3RhdGVZKFwiICsgeSArIFwiZGVnKSByb3RhdGVaKFwiICsgeiArIFwiZGVnKSB0cmFuc2xhdGVcIiArIHRyYW5zUHJlZml4ICsgdGhpcy5fY29uZmlnLmdhcE51ZGdlICsgXCJweCkgdHJhbnNsYXRlWigwKVwiO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fbm9ybWFsaXplQW5nbGUgPSBmdW5jdGlvbihhbmdsZSkge1xuICAgICAgdmFyIG1heDtcbiAgICAgIGFuZ2xlID0gcGFyc2VGbG9hdChhbmdsZSwgMTApO1xuICAgICAgbWF4ID0gdGhpcy5fY29uZmlnLm1heEFuZ2xlO1xuICAgICAgaWYgKGlzTmFOKGFuZ2xlKSkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH0gZWxzZSBpZiAoYW5nbGUgPiBtYXgpIHtcbiAgICAgICAgcmV0dXJuIG1heDtcbiAgICAgIH0gZWxzZSBpZiAoYW5nbGUgPCAtbWF4KSB7XG4gICAgICAgIHJldHVybiAtbWF4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGFuZ2xlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fc2V0VHJhbnMgPSBmdW5jdGlvbihkdXJhdGlvbiwgZGVsYXksIGFuY2hvcikge1xuICAgICAgaWYgKGFuY2hvciA9PSBudWxsKSB7XG4gICAgICAgIGFuY2hvciA9IHRoaXMuX2xhc3RPcC5hbmNob3I7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5faXRlcmF0ZShhbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocGFuZWwsIGksIGxlbikge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5fc2V0UGFuZWxUcmFucy5hcHBseShfdGhpcywgW2FuY2hvcl0uY29uY2F0KF9fc2xpY2UuY2FsbChhcmd1bWVudHMpLCBbZHVyYXRpb25dLCBbZGVsYXldKSk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9zZXRQYW5lbFRyYW5zID0gZnVuY3Rpb24oYW5jaG9yLCBwYW5lbCwgaSwgbGVuLCBkdXJhdGlvbiwgZGVsYXkpIHtcbiAgICAgIHZhciBkZWxheU1zLCBzaGFkZXIsIHNpZGUsIF9pLCBfbGVuLCBfcmVmMTtcbiAgICAgIGRlbGF5TXMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHN3aXRjaCAoZGVsYXkpIHtcbiAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29uZmlnLnNwZWVkIC8gbGVuICogaTtcbiAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29uZmlnLnNwZWVkIC8gbGVuICogKGxlbiAtIGkgLSAxKTtcbiAgICAgICAgfVxuICAgICAgfSkuY2FsbCh0aGlzKTtcbiAgICAgIHBhbmVsLnN0eWxlW2Nzcy50cmFuc2l0aW9uRHVyYXRpb25dID0gZHVyYXRpb24gKyAnbXMnO1xuICAgICAgcGFuZWwuc3R5bGVbY3NzLnRyYW5zaXRpb25EZWxheV0gPSBkZWxheU1zICsgJ21zJztcbiAgICAgIGlmICh0aGlzLl9zaGFkaW5nKSB7XG4gICAgICAgIF9yZWYxID0gKF9faW5kZXhPZi5jYWxsKGFuY2hvckxpc3RWLCBhbmNob3IpID49IDAgPyBhbmNob3JMaXN0ViA6IGFuY2hvckxpc3RIKTtcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmMS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIHNpZGUgPSBfcmVmMVtfaV07XG4gICAgICAgICAgc2hhZGVyID0gdGhpcy5fc2hhZGVyc1thbmNob3JdW3NpZGVdW2ldO1xuICAgICAgICAgIHNoYWRlci5zdHlsZVtjc3MudHJhbnNpdGlvbkR1cmF0aW9uXSA9IGR1cmF0aW9uICsgJ21zJztcbiAgICAgICAgICBzaGFkZXIuc3R5bGVbY3NzLnRyYW5zaXRpb25EZWxheV0gPSBkZWxheU1zICsgJ21zJztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGRlbGF5TXM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9zZXRTaGFkZXIgPSBmdW5jdGlvbihuLCBhbmNob3IsIGFuZ2xlKSB7XG4gICAgICB2YXIgYSwgYWJzLCBiLCBvcGFjaXR5O1xuICAgICAgYWJzID0gTWF0aC5hYnMoYW5nbGUpO1xuICAgICAgb3BhY2l0eSA9IGFicyAvIDkwICogdGhpcy5fY29uZmlnLnNoYWRpbmdJbnRlbnNpdHk7XG4gICAgICBpZiAodGhpcy5fc2hhZGluZyA9PT0gJ2hhcmQnKSB7XG4gICAgICAgIG9wYWNpdHkgKj0gLjE1O1xuICAgICAgICBpZiAodGhpcy5fbGFzdE9wLmFuZ2xlIDwgMCkge1xuICAgICAgICAgIGFuZ2xlID0gYWJzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFuZ2xlID0gLWFicztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3BhY2l0eSAqPSAuNDtcbiAgICAgIH1cbiAgICAgIGlmIChfX2luZGV4T2YuY2FsbChhbmNob3JMaXN0ViwgYW5jaG9yKSA+PSAwKSB7XG4gICAgICAgIGlmIChhbmdsZSA8IDApIHtcbiAgICAgICAgICBhID0gb3BhY2l0eTtcbiAgICAgICAgICBiID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhID0gMDtcbiAgICAgICAgICBiID0gb3BhY2l0eTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zaGFkZXJzW2FuY2hvcl0ubGVmdFtuXS5zdHlsZS5vcGFjaXR5ID0gYTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NoYWRlcnNbYW5jaG9yXS5yaWdodFtuXS5zdHlsZS5vcGFjaXR5ID0gYjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChhbmdsZSA8IDApIHtcbiAgICAgICAgICBhID0gMDtcbiAgICAgICAgICBiID0gb3BhY2l0eTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhID0gb3BhY2l0eTtcbiAgICAgICAgICBiID0gMDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zaGFkZXJzW2FuY2hvcl0udG9wW25dLnN0eWxlLm9wYWNpdHkgPSBhO1xuICAgICAgICByZXR1cm4gdGhpcy5fc2hhZGVyc1thbmNob3JdLmJvdHRvbVtuXS5zdHlsZS5vcGFjaXR5ID0gYjtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX3Nob3dTdGFnZSA9IGZ1bmN0aW9uKGFuY2hvcikge1xuICAgICAgaWYgKGFuY2hvciAhPT0gdGhpcy5fbGFzdE9wLmFuY2hvcikge1xuICAgICAgICBoaWRlRWwodGhpcy5fc3RhZ2VzW3RoaXMuX2xhc3RPcC5hbmNob3JdKTtcbiAgICAgICAgdGhpcy5fbGFzdE9wLmFuY2hvciA9IGFuY2hvcjtcbiAgICAgICAgdGhpcy5fbGFzdE9wLnJlc2V0ID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YWdlc1thbmNob3JdLnN0eWxlW2Nzcy50cmFuc2Zvcm1dID0gJ3RyYW5zbGF0ZTNkKCcgKyAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc3dpdGNoIChhbmNob3IpIHtcbiAgICAgICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgICAgICByZXR1cm4gJzAsIDAsIDApJztcbiAgICAgICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICAgICAgcmV0dXJuIFwiLVwiICsgdGhpcy5fY29uZmlnLnZQYW5lbHMubGVuZ3RoICsgXCJweCwgMCwgMClcIjtcbiAgICAgICAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgICAgICAgIHJldHVybiAnMCwgMCwgMCknO1xuICAgICAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgICAgICAgcmV0dXJuIFwiMCwgLVwiICsgdGhpcy5fY29uZmlnLmhQYW5lbHMubGVuZ3RoICsgXCJweCwgMClcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLmNhbGwodGhpcyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9zdGFnZVJlc2V0ID0gZnVuY3Rpb24oYW5jaG9yLCBjYikge1xuICAgICAgdmFyIGZuO1xuICAgICAgZm4gPSAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoY3NzLnRyYW5zaXRpb25FbmQsIGZuLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIF90aGlzLl9zaG93U3RhZ2UoYW5jaG9yKTtcbiAgICAgICAgICByZXR1cm4gZGVmZXIoY2IpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcyk7XG4gICAgICBpZiAodGhpcy5fbGFzdE9wLmFuZ2xlID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmbigpO1xuICAgICAgfVxuICAgICAgdGhpcy5fcGFuZWxzW3RoaXMuX2xhc3RPcC5hbmNob3JdWzBdLmFkZEV2ZW50TGlzdGVuZXIoY3NzLnRyYW5zaXRpb25FbmQsIGZuLCBmYWxzZSk7XG4gICAgICByZXR1cm4gdGhpcy5faXRlcmF0ZSh0aGlzLl9sYXN0T3AuYW5jaG9yLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHBhbmVsLCBpKSB7XG4gICAgICAgICAgX3RoaXMuX3RyYW5zZm9ybVBhbmVsKHBhbmVsLCAwLCBfdGhpcy5fbGFzdE9wLmFuY2hvcik7XG4gICAgICAgICAgaWYgKF90aGlzLl9zaGFkaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuX3NldFNoYWRlcihpLCBfdGhpcy5fbGFzdE9wLmFuY2hvciwgMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fZ2V0TG9uZ2hhbmRBbmNob3IgPSBmdW5jdGlvbihzaG9ydGhhbmQpIHtcbiAgICAgIHN3aXRjaCAoc2hvcnRoYW5kLnRvU3RyaW5nKCkpIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgIGNhc2UgJ2wnOlxuICAgICAgICBjYXNlICc0JzpcbiAgICAgICAgICByZXR1cm4gJ2xlZnQnO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgIGNhc2UgJ3InOlxuICAgICAgICBjYXNlICcyJzpcbiAgICAgICAgICByZXR1cm4gJ3JpZ2h0JztcbiAgICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgY2FzZSAndCc6XG4gICAgICAgIGNhc2UgJzEnOlxuICAgICAgICAgIHJldHVybiAndG9wJztcbiAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgY2FzZSAnYic6XG4gICAgICAgIGNhc2UgJzMnOlxuICAgICAgICAgIHJldHVybiAnYm90dG9tJztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gJ2xlZnQnO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fc2V0Q3Vyc29yID0gZnVuY3Rpb24oYm9vbCkge1xuICAgICAgaWYgKGJvb2wgPT0gbnVsbCkge1xuICAgICAgICBib29sID0gdGhpcy5fdG91Y2hFbmFibGVkO1xuICAgICAgfVxuICAgICAgaWYgKGJvb2wpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWwuc3R5bGUuY3Vyc29yID0gY3NzLmdyYWI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5lbC5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XG4gICAgICB9XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9zZXRUb3VjaCA9IGZ1bmN0aW9uKHRvZ2dsZSkge1xuICAgICAgdmFyIGVTdHJpbmcsIGV2ZW50UGFpciwgZXZlbnRQYWlycywgbGlzdGVuRm4sIG1vdXNlTGVhdmVTdXBwb3J0LCBfaSwgX2osIF9sZW4sIF9sZW4xO1xuICAgICAgaWYgKHRvZ2dsZSkge1xuICAgICAgICBpZiAodGhpcy5fdG91Y2hFbmFibGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgbGlzdGVuRm4gPSAnYWRkRXZlbnRMaXN0ZW5lcic7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIXRoaXMuX3RvdWNoRW5hYmxlZCkge1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGxpc3RlbkZuID0gJ3JlbW92ZUV2ZW50TGlzdGVuZXInO1xuICAgICAgfVxuICAgICAgdGhpcy5fdG91Y2hFbmFibGVkID0gdG9nZ2xlO1xuICAgICAgdGhpcy5fc2V0Q3Vyc29yKCk7XG4gICAgICBldmVudFBhaXJzID0gW1snVG91Y2hTdGFydCcsICdNb3VzZURvd24nXSwgWydUb3VjaEVuZCcsICdNb3VzZVVwJ10sIFsnVG91Y2hNb3ZlJywgJ01vdXNlTW92ZSddLCBbJ1RvdWNoTGVhdmUnLCAnTW91c2VMZWF2ZSddXTtcbiAgICAgIG1vdXNlTGVhdmVTdXBwb3J0ID0gJ29ubW91c2VsZWF2ZScgaW4gd2luZG93O1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBldmVudFBhaXJzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGV2ZW50UGFpciA9IGV2ZW50UGFpcnNbX2ldO1xuICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBldmVudFBhaXIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgZVN0cmluZyA9IGV2ZW50UGFpcltfal07XG4gICAgICAgICAgaWYgKCEoZVN0cmluZyA9PT0gJ1RvdWNoTGVhdmUnICYmICFtb3VzZUxlYXZlU3VwcG9ydCkpIHtcbiAgICAgICAgICAgIHRoaXMuZWxbbGlzdGVuRm5dKGVTdHJpbmcudG9Mb3dlckNhc2UoKSwgdGhpc1snX29uJyArIGV2ZW50UGFpclswXV0sIGZhbHNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbFtsaXN0ZW5Gbl0oJ21vdXNlb3V0JywgdGhpcy5fb25Nb3VzZU91dCwgZmFsc2UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX29uVG91Y2hTdGFydCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBheGlzMSwgX3JlZjE7XG4gICAgICBpZiAoIXRoaXMuX3RvdWNoRW5hYmxlZCB8fCB0aGlzLmlzRm9sZGVkVXApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5lbXB0eVF1ZXVlKCk7XG4gICAgICB0aGlzLl90b3VjaFN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5lbC5zdHlsZS5jdXJzb3IgPSBjc3MuZ3JhYmJpbmc7XG4gICAgICB0aGlzLl9zZXRUcmFucygwLCAwKTtcbiAgICAgIHRoaXMuX3RvdWNoQXhpcyA9IChfcmVmMSA9IHRoaXMuX2xhc3RPcC5hbmNob3IsIF9faW5kZXhPZi5jYWxsKGFuY2hvckxpc3RWLCBfcmVmMSkgPj0gMCkgPyAneCcgOiAneSc7XG4gICAgICB0aGlzW1wiX1wiICsgdGhpcy5fdG91Y2hBeGlzICsgXCJMYXN0XCJdID0gdGhpcy5fbGFzdE9wLmFuZ2xlO1xuICAgICAgYXhpczEgPSBcIl9cIiArIHRoaXMuX3RvdWNoQXhpcyArIFwiMVwiO1xuICAgICAgaWYgKGUudHlwZSA9PT0gJ21vdXNlZG93bicpIHtcbiAgICAgICAgdGhpc1theGlzMV0gPSBlW1wicGFnZVwiICsgKHRoaXMuX3RvdWNoQXhpcy50b1VwcGVyQ2FzZSgpKV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzW2F4aXMxXSA9IGUudGFyZ2V0VG91Y2hlc1swXVtcInBhZ2VcIiArICh0aGlzLl90b3VjaEF4aXMudG9VcHBlckNhc2UoKSldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZy50b3VjaFN0YXJ0Q2FsbGJhY2sodGhpc1theGlzMV0sIGUpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fb25Ub3VjaE1vdmUgPSBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgY3VycmVudCwgZGVsdGEsIGRpc3RhbmNlO1xuICAgICAgaWYgKCEodGhpcy5fdG91Y2hFbmFibGVkICYmIHRoaXMuX3RvdWNoU3RhcnRlZCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgaWYgKGUudHlwZSA9PT0gJ21vdXNlbW92ZScpIHtcbiAgICAgICAgY3VycmVudCA9IGVbXCJwYWdlXCIgKyAodGhpcy5fdG91Y2hBeGlzLnRvVXBwZXJDYXNlKCkpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN1cnJlbnQgPSBlLnRhcmdldFRvdWNoZXNbMF1bXCJwYWdlXCIgKyAodGhpcy5fdG91Y2hBeGlzLnRvVXBwZXJDYXNlKCkpXTtcbiAgICAgIH1cbiAgICAgIGRpc3RhbmNlID0gKGN1cnJlbnQgLSB0aGlzW1wiX1wiICsgdGhpcy5fdG91Y2hBeGlzICsgXCIxXCJdKSAqIHRoaXMuX2NvbmZpZy50b3VjaFNlbnNpdGl2aXR5O1xuICAgICAgaWYgKHRoaXMuX2xhc3RPcC5hbmdsZSA8IDApIHtcbiAgICAgICAgaWYgKHRoaXMuX2xhc3RPcC5hbmNob3IgPT09ICdyaWdodCcgfHwgdGhpcy5fbGFzdE9wLmFuY2hvciA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICBkZWx0YSA9IHRoaXNbXCJfXCIgKyB0aGlzLl90b3VjaEF4aXMgKyBcIkxhc3RcIl0gLSBkaXN0YW5jZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWx0YSA9IHRoaXNbXCJfXCIgKyB0aGlzLl90b3VjaEF4aXMgKyBcIkxhc3RcIl0gKyBkaXN0YW5jZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVsdGEgPiAwKSB7XG4gICAgICAgICAgZGVsdGEgPSAwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5fbGFzdE9wLmFuY2hvciA9PT0gJ3JpZ2h0JyB8fCB0aGlzLl9sYXN0T3AuYW5jaG9yID09PSAnYm90dG9tJykge1xuICAgICAgICAgIGRlbHRhID0gdGhpc1tcIl9cIiArIHRoaXMuX3RvdWNoQXhpcyArIFwiTGFzdFwiXSArIGRpc3RhbmNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlbHRhID0gdGhpc1tcIl9cIiArIHRoaXMuX3RvdWNoQXhpcyArIFwiTGFzdFwiXSAtIGRpc3RhbmNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWx0YSA8IDApIHtcbiAgICAgICAgICBkZWx0YSA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX2xhc3RPcC5hbmdsZSA9IGRlbHRhID0gdGhpcy5fbm9ybWFsaXplQW5nbGUoZGVsdGEpO1xuICAgICAgdGhpcy5fbGFzdE9wLmZuLmNhbGwodGhpcywgZGVsdGEsIHRoaXMuX2xhc3RPcC5hbmNob3IsIHRoaXMuX2xhc3RPcC5vcHRpb25zKTtcbiAgICAgIHJldHVybiB0aGlzLl9jb25maWcudG91Y2hNb3ZlQ2FsbGJhY2soZGVsdGEsIGUpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fb25Ub3VjaEVuZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICghdGhpcy5fdG91Y2hFbmFibGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3RvdWNoU3RhcnRlZCA9IHRoaXMuX2luVHJhbnMgPSBmYWxzZTtcbiAgICAgIHRoaXMuZWwuc3R5bGUuY3Vyc29yID0gY3NzLmdyYWI7XG4gICAgICB0aGlzLl9zZXRUcmFucyh0aGlzLl9jb25maWcuc3BlZWQsIHRoaXMuX2NvbmZpZy5yaXBwbGUpO1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZy50b3VjaEVuZENhbGxiYWNrKHRoaXNbXCJfXCIgKyB0aGlzLl90b3VjaEF4aXMgKyBcIkxhc3RcIl0sIGUpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fb25Ub3VjaExlYXZlID0gZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKCEodGhpcy5fdG91Y2hFbmFibGVkICYmIHRoaXMuX3RvdWNoU3RhcnRlZCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX29uVG91Y2hFbmQoZSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9vbk1vdXNlT3V0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKCEodGhpcy5fdG91Y2hFbmFibGVkICYmIHRoaXMuX3RvdWNoU3RhcnRlZCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGUudG9FbGVtZW50ICYmICF0aGlzLmVsLmNvbnRhaW5zKGUudG9FbGVtZW50KSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fb25Ub3VjaEVuZChlKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX3VuZm9sZCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICB2YXIgYW5jaG9yO1xuICAgICAgdGhpcy5faW5UcmFucyA9IHRydWU7XG4gICAgICBhbmNob3IgPSB0aGlzLl9sYXN0T3AuYW5jaG9yO1xuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXJhdGUoYW5jaG9yLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHBhbmVsLCBpLCBsZW4pIHtcbiAgICAgICAgICB2YXIgZGVsYXk7XG4gICAgICAgICAgZGVsYXkgPSBfdGhpcy5fc2V0UGFuZWxUcmFucy5hcHBseShfdGhpcywgW2FuY2hvcl0uY29uY2F0KF9fc2xpY2UuY2FsbChhcmd1bWVudHMpLCBbX3RoaXMuX2NvbmZpZy5zcGVlZF0sIFsxXSkpO1xuICAgICAgICAgIHJldHVybiAoZnVuY3Rpb24ocGFuZWwsIGksIGRlbGF5KSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIF90aGlzLl90cmFuc2Zvcm1QYW5lbChwYW5lbCwgMCwgX3RoaXMuX2xhc3RPcC5hbmNob3IpO1xuICAgICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzaG93RWwocGFuZWwuY2hpbGRyZW5bMF0pO1xuICAgICAgICAgICAgICAgIGlmIChpID09PSBsZW4gLSAxKSB7XG4gICAgICAgICAgICAgICAgICBfdGhpcy5faW5UcmFucyA9IF90aGlzLmlzRm9sZGVkVXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgX3RoaXMuX2xhc3RPcC5mbiA9IF90aGlzLmFjY29yZGlvbjtcbiAgICAgICAgICAgICAgICAgIF90aGlzLl9sYXN0T3AuYW5nbGUgPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gcGFuZWwuc3R5bGVbY3NzLnRyYW5zaXRpb25EdXJhdGlvbl0gPSBfdGhpcy5fY29uZmlnLnNwZWVkO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9LCBkZWxheSArIF90aGlzLl9jb25maWcuc3BlZWQgKiAuMjUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSkocGFuZWwsIGksIGRlbGF5KTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX2l0ZXJhdGUgPSBmdW5jdGlvbihhbmNob3IsIGZuKSB7XG4gICAgICB2YXIgaSwgcGFuZWwsIHBhbmVscywgX2ksIF9sZW4sIF9yZWYxLCBfcmVzdWx0cztcbiAgICAgIF9yZWYxID0gcGFuZWxzID0gdGhpcy5fcGFuZWxzW2FuY2hvcl07XG4gICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChpID0gX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IGkgPSArK19pKSB7XG4gICAgICAgIHBhbmVsID0gX3JlZjFbaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2goZm4uY2FsbCh0aGlzLCBwYW5lbCwgaSwgcGFuZWxzLmxlbmd0aCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5lbmFibGVUb3VjaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3NldFRvdWNoKHRydWUpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5kaXNhYmxlVG91Y2ggPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zZXRUb3VjaChmYWxzZSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLnNldFNwZWVkID0gZnVuY3Rpb24oc3BlZWQpIHtcbiAgICAgIHZhciBhbmNob3IsIF9pLCBfbGVuO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBhbmNob3JMaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGFuY2hvciA9IGFuY2hvckxpc3RbX2ldO1xuICAgICAgICB0aGlzLl9zZXRUcmFucygodGhpcy5fY29uZmlnLnNwZWVkID0gc3BlZWQpLCB0aGlzLl9jb25maWcucmlwcGxlLCBhbmNob3IpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmZyZWV6ZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICBpZiAodGhpcy5pc0Zyb3plbikge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zdGFnZVJlc2V0KHRoaXMuX2xhc3RPcC5hbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF90aGlzLmlzRnJvemVuID0gdHJ1ZTtcbiAgICAgICAgICAgIGhpZGVFbChfdGhpcy5fc3RhZ2VIb2xkZXIpO1xuICAgICAgICAgICAgc2hvd0VsKF90aGlzLl9jbG9uZUVsKTtcbiAgICAgICAgICAgIF90aGlzLl9zZXRDdXJzb3IoZmFsc2UpO1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiID8gY2FsbGJhY2soKSA6IHZvaWQgMDtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUudW5mcmVlemUgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLmlzRnJvemVuKSB7XG4gICAgICAgIHRoaXMuaXNGcm96ZW4gPSBmYWxzZTtcbiAgICAgICAgaGlkZUVsKHRoaXMuX2Nsb25lRWwpO1xuICAgICAgICBzaG93RWwodGhpcy5fc3RhZ2VIb2xkZXIpO1xuICAgICAgICB0aGlzLl9zZXRDdXJzb3IoKTtcbiAgICAgICAgdGhpcy5fbGFzdE9wLmFuZ2xlID0gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHRoaXMuZnJlZXplKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMuX3NldFRvdWNoKGZhbHNlKTtcbiAgICAgICAgICBpZiAoJCkge1xuICAgICAgICAgICAgJC5kYXRhKF90aGlzLmVsLCBiYXNlTmFtZSwgbnVsbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIF90aGlzLmVsLmlubmVySFRNTCA9IF90aGlzLl9jbG9uZUVsLmlubmVySFRNTDtcbiAgICAgICAgICBfdGhpcy5lbC5jbGFzc0xpc3QucmVtb3ZlKGVsQ2xhc3Nlcy5hY3RpdmUpO1xuICAgICAgICAgIHJldHVybiB0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIiA/IGNhbGxiYWNrKCkgOiB2b2lkIDA7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuZW1wdHlRdWV1ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgIGRlZmVyKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLl9pblRyYW5zID0gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuc2V0UmlwcGxlID0gZnVuY3Rpb24oZGlyKSB7XG4gICAgICBpZiAoZGlyID09IG51bGwpIHtcbiAgICAgICAgZGlyID0gMTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2NvbmZpZy5yaXBwbGUgPSBOdW1iZXIoZGlyKTtcbiAgICAgIHRoaXMuc2V0U3BlZWQodGhpcy5fY29uZmlnLnNwZWVkKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5jb25zdHJhaW5BbmdsZSA9IGZ1bmN0aW9uKGFuZ2xlKSB7XG4gICAgICB0aGlzLl9jb25maWcubWF4QW5nbGUgPSBwYXJzZUZsb2F0KGFuZ2xlLCAxMCkgfHwgZGVmYXVsdHMubWF4QW5nbGU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUud2FpdCA9IGZ1bmN0aW9uKG1zKSB7XG4gICAgICB2YXIgZm47XG4gICAgICBmbiA9IChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoX3RoaXMuX2NvbmNsdWRlLCBtcyk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKTtcbiAgICAgIGlmICh0aGlzLl9pblRyYW5zKSB7XG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2goW2ZuLCB0aGlzLl9sYXN0T3AuYW5nbGUsIHRoaXMuX2xhc3RPcC5hbmNob3IsIHRoaXMuX2xhc3RPcC5vcHRpb25zXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmbigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLm1vZGlmeUNvbnRlbnQgPSBmdW5jdGlvbihmbikge1xuICAgICAgdmFyIGFuY2hvciwgaSwgcGFuZWwsIHNlbGVjdG9ycywgc2V0LCBfaSwgX2osIF9sZW4sIF9sZW4xLCBfcmVmMTtcbiAgICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgc2VsZWN0b3JzID0gZm47XG4gICAgICAgIHNldCA9IGZ1bmN0aW9uKGVsLCBjb250ZW50LCBzdHlsZSkge1xuICAgICAgICAgIHZhciBrZXksIHZhbHVlO1xuICAgICAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSBjb250ZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc3R5bGUpIHtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIHN0eWxlKSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gc3R5bGVba2V5XTtcbiAgICAgICAgICAgICAgZWwuc3R5bGVba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBmbiA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgdmFyIGNvbnRlbnQsIG1hdGNoLCBzZWxlY3Rvciwgc3R5bGUsIHZhbHVlLCBfaSwgX2xlbiwgX3JlZjE7XG4gICAgICAgICAgZm9yIChzZWxlY3RvciBpbiBzZWxlY3RvcnMpIHtcbiAgICAgICAgICAgIHZhbHVlID0gc2VsZWN0b3JzW3NlbGVjdG9yXTtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBzdHlsZSA9IG51bGw7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICBjb250ZW50ID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb250ZW50ID0gdmFsdWUuY29udGVudCwgc3R5bGUgPSB2YWx1ZS5zdHlsZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHtcbiAgICAgICAgICAgICAgc2V0KGVsLCBjb250ZW50LCBzdHlsZSk7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3JlZjEgPSBlbC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICAgICAgbWF0Y2ggPSBfcmVmMVtfaV07XG4gICAgICAgICAgICAgIHNldChtYXRjaCwgY29udGVudCwgc3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gYW5jaG9yTGlzdC5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBhbmNob3IgPSBhbmNob3JMaXN0W19pXTtcbiAgICAgICAgX3JlZjEgPSB0aGlzLl9wYW5lbHNbYW5jaG9yXTtcbiAgICAgICAgZm9yIChpID0gX2ogPSAwLCBfbGVuMSA9IF9yZWYxLmxlbmd0aDsgX2ogPCBfbGVuMTsgaSA9ICsrX2opIHtcbiAgICAgICAgICBwYW5lbCA9IF9yZWYxW2ldO1xuICAgICAgICAgIGZuKHBhbmVsLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLCBpLCBhbmNob3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuYWNjb3JkaW9uID0gcHJlcChmdW5jdGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXRlcmF0ZShhbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocGFuZWwsIGkpIHtcbiAgICAgICAgICB2YXIgZGVnO1xuICAgICAgICAgIGlmIChpICUgMiAhPT0gMCAmJiAhb3B0aW9ucy50d2lzdCkge1xuICAgICAgICAgICAgZGVnID0gLWFuZ2xlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWcgPSBhbmdsZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG9wdGlvbnMuc3RpY2t5KSB7XG4gICAgICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgICBkZWcgPSAwO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpID4gMSB8fCBvcHRpb25zLnN0YWlycykge1xuICAgICAgICAgICAgICBkZWcgKj0gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGkgIT09IDApIHtcbiAgICAgICAgICAgICAgZGVnICo9IDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvcHRpb25zLnN0YWlycykge1xuICAgICAgICAgICAgZGVnICo9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfdGhpcy5fdHJhbnNmb3JtUGFuZWwocGFuZWwsIGRlZywgYW5jaG9yLCBvcHRpb25zLmZyYWN0dXJlKTtcbiAgICAgICAgICBpZiAoX3RoaXMuX3NoYWRpbmcgJiYgIShpID09PSAwICYmIG9wdGlvbnMuc3RpY2t5KSAmJiBNYXRoLmFicyhkZWcpICE9PSAxODApIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5fc2V0U2hhZGVyKGksIGFuY2hvciwgZGVnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfSk7XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5jdXJsID0gcHJlcChmdW5jdGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICBhbmdsZSAvPSBfX2luZGV4T2YuY2FsbChhbmNob3JMaXN0ViwgYW5jaG9yKSA+PSAwID8gdGhpcy5fY29uZmlnLnZQYW5lbHMubGVuZ3RoIDogdGhpcy5fY29uZmlnLmhQYW5lbHMubGVuZ3RoO1xuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXJhdGUoYW5jaG9yLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHBhbmVsLCBpKSB7XG4gICAgICAgICAgX3RoaXMuX3RyYW5zZm9ybVBhbmVsKHBhbmVsLCBhbmdsZSwgYW5jaG9yKTtcbiAgICAgICAgICBpZiAoX3RoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5fc2V0U2hhZGVyKGksIGFuY2hvciwgMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH0pO1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUucmFtcCA9IHByZXAoZnVuY3Rpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucykge1xuICAgICAgdGhpcy5fdHJhbnNmb3JtUGFuZWwodGhpcy5fcGFuZWxzW2FuY2hvcl1bMV0sIGFuZ2xlLCBhbmNob3IpO1xuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXJhdGUoYW5jaG9yLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHBhbmVsLCBpKSB7XG4gICAgICAgICAgaWYgKGkgIT09IDEpIHtcbiAgICAgICAgICAgIF90aGlzLl90cmFuc2Zvcm1QYW5lbChwYW5lbCwgMCwgYW5jaG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKF90aGlzLl9zaGFkaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuX3NldFNoYWRlcihpLCBhbmNob3IsIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9KTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmZvbGRVcCA9IHByZXAoZnVuY3Rpb24oYW5jaG9yLCBjYWxsYmFjaykge1xuICAgICAgaWYgKHRoaXMuaXNGb2xkZWRVcCkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIgPyBjYWxsYmFjaygpIDogdm9pZCAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX3N0YWdlUmVzZXQoYW5jaG9yLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLl9pblRyYW5zID0gX3RoaXMuaXNGb2xkZWRVcCA9IHRydWU7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLl9pdGVyYXRlKGFuY2hvciwgZnVuY3Rpb24ocGFuZWwsIGksIGxlbikge1xuICAgICAgICAgICAgdmFyIGRlbGF5LCBkdXJhdGlvbjtcbiAgICAgICAgICAgIGR1cmF0aW9uID0gX3RoaXMuX2NvbmZpZy5zcGVlZDtcbiAgICAgICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAgIGR1cmF0aW9uIC89IDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxheSA9IF90aGlzLl9zZXRQYW5lbFRyYW5zLmFwcGx5KF90aGlzLCBbYW5jaG9yXS5jb25jYXQoX19zbGljZS5jYWxsKGFyZ3VtZW50cyksIFtkdXJhdGlvbl0sIFsyXSkpO1xuICAgICAgICAgICAgcmV0dXJuIChmdW5jdGlvbihwYW5lbCwgaSwgZGVsYXkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIF90aGlzLl90cmFuc2Zvcm1QYW5lbChwYW5lbCwgKGkgPT09IDAgPyA5MCA6IDE3MCksIGFuY2hvcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5faW5UcmFucyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIgPyBjYWxsYmFjaygpIDogdm9pZCAwO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGhpZGVFbChwYW5lbC5jaGlsZHJlblswXSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZGVsYXkgKyBfdGhpcy5fY29uZmlnLnNwZWVkICogLjI1KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KShwYW5lbCwgaSwgZGVsYXkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH0pO1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUudW5mb2xkID0gcHJlcChmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgcmV0dXJuIHRoaXMuX3VuZm9sZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH0pO1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgIHJldHVybiBwcmVwKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucykge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5faXRlcmF0ZShhbmNob3IsIGZ1bmN0aW9uKHBhbmVsLCBpLCBsZW4pIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5fdHJhbnNmb3JtUGFuZWwocGFuZWwsIGZuKGFuZ2xlLCBpLCBsZW4pLCBhbmNob3IsIG9wdGlvbnMuZnJhY3R1cmUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpLmJpbmQodGhpcyk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHJldHVybiB0aGlzLmFjY29yZGlvbigwLCB7XG4gICAgICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLnJldmVhbCA9IGZ1bmN0aW9uKGFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpIHtcbiAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgfVxuICAgICAgb3B0aW9ucy5zdGlja3kgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMuYWNjb3JkaW9uKGFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5zdGFpcnMgPSBmdW5jdGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMuc3RhaXJzID0gb3B0aW9ucy5zdGlja3kgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMuYWNjb3JkaW9uKGFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5mcmFjdHVyZSA9IGZ1bmN0aW9uKGFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpIHtcbiAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgfVxuICAgICAgb3B0aW9ucy5mcmFjdHVyZSA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5hY2NvcmRpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLnR3aXN0ID0gZnVuY3Rpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICBvcHRpb25zLmZyYWN0dXJlID0gb3B0aW9ucy50d2lzdCA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5hY2NvcmRpb24oYW5nbGUgLyAxMCwgYW5jaG9yLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuY29sbGFwc2UgPSBmdW5jdGlvbihhbmNob3IsIG9wdGlvbnMpIHtcbiAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgfVxuICAgICAgb3B0aW9ucy5zdGlja3kgPSBmYWxzZTtcbiAgICAgIHJldHVybiB0aGlzLmFjY29yZGlvbigtdGhpcy5fY29uZmlnLm1heEFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5jb2xsYXBzZUFsdCA9IGZ1bmN0aW9uKGFuY2hvciwgb3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICBvcHRpb25zLnN0aWNreSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHRoaXMuYWNjb3JkaW9uKHRoaXMuX2NvbmZpZy5tYXhBbmdsZSwgYW5jaG9yLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5WRVJTSU9OID0gJzEuMS4xJztcblxuICAgIE9yaURvbWkuaXNTdXBwb3J0ZWQgPSBpc1N1cHBvcnRlZDtcblxuICAgIHJldHVybiBPcmlEb21pO1xuXG4gIH0pKCk7XG5cbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlICE9PSBudWxsID8gbW9kdWxlLmV4cG9ydHMgOiB2b2lkIDApIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IE9yaURvbWk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkZWZpbmUgIT09IG51bGwgPyBkZWZpbmUuYW1kIDogdm9pZCAwKSB7XG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIE9yaURvbWk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgd2luZG93Lk9yaURvbWkgPSBPcmlEb21pO1xuICB9XG5cbiAgaWYgKCEkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgJC5wcm90b3R5cGUub3JpRG9taSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgZWwsIGluc3RhbmNlLCBtZXRob2QsIG1ldGhvZE5hbWUsIF9pLCBfaiwgX2xlbiwgX2xlbjE7XG4gICAgaWYgKCFpc1N1cHBvcnRlZCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmIChvcHRpb25zID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gJC5kYXRhKHRoaXNbMF0sIGJhc2VOYW1lKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuICAgICAgbWV0aG9kTmFtZSA9IG9wdGlvbnM7XG4gICAgICBpZiAodHlwZW9mIChtZXRob2QgPSBPcmlEb21pLnByb3RvdHlwZVttZXRob2ROYW1lXSkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJPcmlEb21pOiBObyBzdWNoIG1ldGhvZCBgXCIgKyBtZXRob2ROYW1lICsgXCJgXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSB0aGlzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGVsID0gdGhpc1tfaV07XG4gICAgICAgIGlmICghKGluc3RhbmNlID0gJC5kYXRhKGVsLCBiYXNlTmFtZSkpKSB7XG4gICAgICAgICAgaW5zdGFuY2UgPSAkLmRhdGEoZWwsIGJhc2VOYW1lLCBuZXcgT3JpRG9taShlbCwgb3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgICAgIG1ldGhvZC5hcHBseShpbnN0YW5jZSwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5zbGljZSgxKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IHRoaXMubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgIGVsID0gdGhpc1tfal07XG4gICAgICAgIGlmIChpbnN0YW5jZSA9ICQuZGF0YShlbCwgYmFzZU5hbWUpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJC5kYXRhKGVsLCBiYXNlTmFtZSwgbmV3IE9yaURvbWkoZWwsIG9wdGlvbnMpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9b3JpZG9taS5tYXBcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvb3JpZG9taS9vcmlkb21pLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL29yaWRvbWlcIikiXX0=
