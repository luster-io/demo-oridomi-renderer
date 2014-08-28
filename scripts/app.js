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

}).call(this,require("oMfpAn"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/fake_114218df.js","/")
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
    damping: 0.2,
    restitution: 0.2
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
        if(boundry.contains(position)) {
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

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
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
        for (var i = 0; i < cp.length; i++) {
          if (!cp[i].cancelled) {
            cp[i].callback(last)
          }
        }
      }, next)
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

module.exports = function() {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  return raf.apply(global, arguments)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL2FwcC9zY3JpcHRzL2Zha2VfMTE0MjE4ZGYuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvYWNjZWxlcmF0ZS5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvYW5pbWF0aW9uLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9hdHRhY2gtc3ByaW5nLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9ib2R5LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9ib3VuZHJ5LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9kZWNlbGVyYXRlLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9kcmFnLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvaW50ZXJhY3QuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL3JlbmRlcmVyLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9zaW11bGF0aW9uLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9zcHJpbmcuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL3V0aWwuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL3ZlY3Rvci5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvUHJvbWlzZS9jb3JlLmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9Qcm9taXNlL2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9Qcm9taXNlL25vZGVfbW9kdWxlcy9hc2FwL2FzYXAuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2NvbXBvbmVudC1lbWl0dGVyL2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvaW5kZXguanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9vYmplY3R0eXBlcy9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9pc25hdGl2ZS9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9zaGlta2V5cy9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLmlzb2JqZWN0L2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9wcm9taXNlL2NvcmUuanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2UvaW5kZXguanMiLCIvVXNlcnMvemFjaC9EZXZlbG9wbWVudC9kZW1vLW9yaWRvbWktcmVuZGVyZXIvbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2Uvbm9kZV9tb2R1bGVzL2FzYXAvYXNhcC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcmFmL2luZGV4LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9yYWYvbm9kZV9tb2R1bGVzL3BlcmZvcm1hbmNlLW5vdy9saWIvcGVyZm9ybWFuY2Utbm93LmpzIiwiL1VzZXJzL3phY2gvRGV2ZWxvcG1lbnQvZGVtby1vcmlkb21pLXJlbmRlcmVyL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy90b3VjaC12ZWxvY2l0eS9pbmRleC5qcyIsIi9Vc2Vycy96YWNoL0RldmVsb3BtZW50L2RlbW8tb3JpZG9taS1yZW5kZXJlci9ub2RlX21vZHVsZXMvb3JpZG9taS9vcmlkb21pLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2bENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBQaHlzaWNzID0gcmVxdWlyZSgnaW1wdWxzZScpXG52YXIgT3JpRG9taSA9IHJlcXVpcmUoJ29yaWRvbWknKVxudmFyIGZvbGRlZCA9IG5ldyBPcmlEb21pKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jb3ZlcicpLCB7IHZQYW5lbHM6IDUsIHNwZWVkOiAwLCByaXBwbGU6IDAsIHRvdWNoRW5hYmxlZDogZmFsc2UsIHBlcnNwZWN0aXZlOiA4MDAgfSlcbnZhciBsYXN0UGVyY2VudCA9IDFcbmZvbGRlZC5hY2NvcmRpb24oMClcblxudmFyIHBoeXMgPSBuZXcgUGh5c2ljcyhmdW5jdGlvbih4KSB7XG4gIGZvbGRlZC5hY2NvcmRpb24oTWF0aC5hY29zKHgpICogKDE4MCAvIE1hdGguUEkpKVxufSlcblxucGh5cy5wb3NpdGlvbigxLCAwKVxuXG52YXIgc3RhcnRYXG4gICwgd2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aFxuICAsIGludGVyYWN0aW9uXG4gICwgbW91c2Vkb3duID0gZmFsc2Vcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgZnVuY3Rpb24oZXZ0KSB7XG4gIGV2dC5wcmV2ZW50RGVmYXVsdCgpXG59KVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHN0YXJ0KVxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHN0YXJ0KVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgbW92ZSlcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3ZlKVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBlbmQpXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGVuZClcblxuZnVuY3Rpb24gcGFnZVgoZXZ0KSB7XG4gIHJldHVybiBldnQudG91Y2hlcyAmJiBldnQudG91Y2hlc1swXS5wYWdlWCB8fCBldnQucGFnZVhcbn1cblxuZnVuY3Rpb24gc3RhcnQoZXZ0KSB7XG4gIHZhciBwZXJjZW50ID0gcGh5cy5wb3NpdGlvbigpLnhcbiAgbW91c2Vkb3duID0gdHJ1ZVxuICBpbnRlcmFjdGlvbiA9IHBoeXMuaW50ZXJhY3QoKVxuICBpbnRlcmFjdGlvbi5zdGFydCgpXG5cbiAgaWYocGVyY2VudCA8PSAwKSBwZXJjZW50ID0gLjFcblxuICBzdGFydFggPSBwYWdlWChldnQpIC8gcGVyY2VudFxufVxuXG5mdW5jdGlvbiBtb3ZlKGV2dCkge1xuICBpZighbW91c2Vkb3duKSByZXR1cm5cbiAgZXZ0LnByZXZlbnREZWZhdWx0KClcbiAgdmFyIGRlbHRhID0gcGFnZVgoZXZ0KVxuICAgICwgcGVyY2VudE1vdmVkID0gZGVsdGEgLyBzdGFydFhcblxuICBpZihwZXJjZW50TW92ZWQgPiAxKSBwZXJjZW50TW92ZWQgPSAxXG4gIGludGVyYWN0aW9uLnBvc2l0aW9uKHBlcmNlbnRNb3ZlZClcbn1cblxuZnVuY3Rpb24gZW5kKGV2dCkge1xuICBpZighbW91c2Vkb3duKSByZXR1cm5cbiAgbW91c2Vkb3duID0gZmFsc2VcbiAgZXZ0LnByZXZlbnREZWZhdWx0KClcbiAgaW50ZXJhY3Rpb24uZW5kKClcbiAgdmFyIHRvID0gKHBoeXMuZGlyZWN0aW9uKCdsZWZ0JykpID8gMCA6IDFcbiAgcGh5cy5hY2NlbGVyYXRlKHsgYm91bmNlOiB0cnVlLCBhY2NlbGVyYXRpb246IDMsIG1pbkJvdW5jZURpc3RhbmNlOiAwLCBib3VjZUFjY2VsZXJhdGlvbjogNiwgZGFtcGluZzogLjIgfSkudG8odG8pLnN0YXJ0KClcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9mYWtlXzExNDIxOGRmLmpzXCIsXCIvXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuQnVmZmVyLnBvb2xTaXplID0gODE5MlxuXG4vKipcbiAqIElmIGBCdWZmZXIuX3VzZVR5cGVkQXJyYXlzYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFVzZSBPYmplY3QgaW1wbGVtZW50YXRpb24gKGNvbXBhdGlibGUgZG93biB0byBJRTYpXG4gKi9cbkJ1ZmZlci5fdXNlVHlwZWRBcnJheXMgPSAoZnVuY3Rpb24gKCkge1xuICAvLyBEZXRlY3QgaWYgYnJvd3NlciBzdXBwb3J0cyBUeXBlZCBBcnJheXMuIFN1cHBvcnRlZCBicm93c2VycyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLFxuICAvLyBDaHJvbWUgNyssIFNhZmFyaSA1LjErLCBPcGVyYSAxMS42KywgaU9TIDQuMisuIElmIHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgYWRkaW5nXG4gIC8vIHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgIGluc3RhbmNlcywgdGhlbiB0aGF0J3MgdGhlIHNhbWUgYXMgbm8gYFVpbnQ4QXJyYXlgIHN1cHBvcnRcbiAgLy8gYmVjYXVzZSB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gYWRkIGFsbCB0aGUgbm9kZSBCdWZmZXIgQVBJIG1ldGhvZHMuIFRoaXMgaXMgYW4gaXNzdWVcbiAgLy8gaW4gRmlyZWZveCA0LTI5LiBOb3cgZml4ZWQ6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOFxuICB0cnkge1xuICAgIHZhciBidWYgPSBuZXcgQXJyYXlCdWZmZXIoMClcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoYnVmKVxuICAgIGFyci5mb28gPSBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9XG4gICAgcmV0dXJuIDQyID09PSBhcnIuZm9vKCkgJiZcbiAgICAgICAgdHlwZW9mIGFyci5zdWJhcnJheSA9PT0gJ2Z1bmN0aW9uJyAvLyBDaHJvbWUgOS0xMCBsYWNrIGBzdWJhcnJheWBcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59KSgpXG5cbi8qKlxuICogQ2xhc3M6IEJ1ZmZlclxuICogPT09PT09PT09PT09PVxuICpcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgYXJlIGF1Z21lbnRlZFxuICogd2l0aCBmdW5jdGlvbiBwcm9wZXJ0aWVzIGZvciBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgQVBJIGZ1bmN0aW9ucy4gV2UgdXNlXG4gKiBgVWludDhBcnJheWAgc28gdGhhdCBzcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdCByZXR1cm5zXG4gKiBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBCeSBhdWdtZW50aW5nIHRoZSBpbnN0YW5jZXMsIHdlIGNhbiBhdm9pZCBtb2RpZnlpbmcgdGhlIGBVaW50OEFycmF5YFxuICogcHJvdG90eXBlLlxuICovXG5mdW5jdGlvbiBCdWZmZXIgKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpXG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcsIG5vWmVybylcblxuICB2YXIgdHlwZSA9IHR5cGVvZiBzdWJqZWN0XG5cbiAgLy8gV29ya2Fyb3VuZDogbm9kZSdzIGJhc2U2NCBpbXBsZW1lbnRhdGlvbiBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgc3RyaW5nc1xuICAvLyB3aGlsZSBiYXNlNjQtanMgZG9lcyBub3QuXG4gIGlmIChlbmNvZGluZyA9PT0gJ2Jhc2U2NCcgJiYgdHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICBzdWJqZWN0ID0gc3RyaW5ndHJpbShzdWJqZWN0KVxuICAgIHdoaWxlIChzdWJqZWN0Lmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICAgIHN1YmplY3QgPSBzdWJqZWN0ICsgJz0nXG4gICAgfVxuICB9XG5cbiAgLy8gRmluZCB0aGUgbGVuZ3RoXG4gIHZhciBsZW5ndGhcbiAgaWYgKHR5cGUgPT09ICdudW1iZXInKVxuICAgIGxlbmd0aCA9IGNvZXJjZShzdWJqZWN0KVxuICBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJylcbiAgICBsZW5ndGggPSBCdWZmZXIuYnl0ZUxlbmd0aChzdWJqZWN0LCBlbmNvZGluZylcbiAgZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpXG4gICAgbGVuZ3RoID0gY29lcmNlKHN1YmplY3QubGVuZ3RoKSAvLyBhc3N1bWUgdGhhdCBvYmplY3QgaXMgYXJyYXktbGlrZVxuICBlbHNlXG4gICAgdGhyb3cgbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCBuZWVkcyB0byBiZSBhIG51bWJlciwgYXJyYXkgb3Igc3RyaW5nLicpXG5cbiAgdmFyIGJ1ZlxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIC8vIFByZWZlcnJlZDogUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICBidWYgPSBCdWZmZXIuX2F1Z21lbnQobmV3IFVpbnQ4QXJyYXkobGVuZ3RoKSlcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIFRISVMgaW5zdGFuY2Ugb2YgQnVmZmVyIChjcmVhdGVkIGJ5IGBuZXdgKVxuICAgIGJ1ZiA9IHRoaXNcbiAgICBidWYubGVuZ3RoID0gbGVuZ3RoXG4gICAgYnVmLl9pc0J1ZmZlciA9IHRydWVcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzICYmIHR5cGVvZiBzdWJqZWN0LmJ5dGVMZW5ndGggPT09ICdudW1iZXInKSB7XG4gICAgLy8gU3BlZWQgb3B0aW1pemF0aW9uIC0tIHVzZSBzZXQgaWYgd2UncmUgY29weWluZyBmcm9tIGEgdHlwZWQgYXJyYXlcbiAgICBidWYuX3NldChzdWJqZWN0KVxuICB9IGVsc2UgaWYgKGlzQXJyYXlpc2goc3ViamVjdCkpIHtcbiAgICAvLyBUcmVhdCBhcnJheS1pc2ggb2JqZWN0cyBhcyBhIGJ5dGUgYXJyYXlcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChCdWZmZXIuaXNCdWZmZXIoc3ViamVjdCkpXG4gICAgICAgIGJ1ZltpXSA9IHN1YmplY3QucmVhZFVJbnQ4KGkpXG4gICAgICBlbHNlXG4gICAgICAgIGJ1ZltpXSA9IHN1YmplY3RbaV1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICBidWYud3JpdGUoc3ViamVjdCwgMCwgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ251bWJlcicgJiYgIUJ1ZmZlci5fdXNlVHlwZWRBcnJheXMgJiYgIW5vWmVybykge1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgYnVmW2ldID0gMFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBidWZcbn1cblxuLy8gU1RBVElDIE1FVEhPRFNcbi8vID09PT09PT09PT09PT09XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICdyYXcnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiAoYikge1xuICByZXR1cm4gISEoYiAhPT0gbnVsbCAmJiBiICE9PSB1bmRlZmluZWQgJiYgYi5faXNCdWZmZXIpXG59XG5cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gZnVuY3Rpb24gKHN0ciwgZW5jb2RpbmcpIHtcbiAgdmFyIHJldFxuICBzdHIgPSBzdHIgKyAnJ1xuICBzd2l0Y2ggKGVuY29kaW5nIHx8ICd1dGY4Jykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoIC8gMlxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSB1dGY4VG9CeXRlcyhzdHIpLmxlbmd0aFxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdyYXcnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aFxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgcmV0ID0gYmFzZTY0VG9CeXRlcyhzdHIpLmxlbmd0aFxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aCAqIDJcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gKGxpc3QsIHRvdGFsTGVuZ3RoKSB7XG4gIGFzc2VydChpc0FycmF5KGxpc3QpLCAnVXNhZ2U6IEJ1ZmZlci5jb25jYXQobGlzdCwgW3RvdGFsTGVuZ3RoXSlcXG4nICtcbiAgICAgICdsaXN0IHNob3VsZCBiZSBhbiBBcnJheS4nKVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgQnVmZmVyKDApXG4gIH0gZWxzZSBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gbGlzdFswXVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB0b3RhbExlbmd0aCAhPT0gJ251bWJlcicpIHtcbiAgICB0b3RhbExlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgdG90YWxMZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcih0b3RhbExlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGxpc3RbaV1cbiAgICBpdGVtLmNvcHkoYnVmLCBwb3MpXG4gICAgcG9zICs9IGl0ZW0ubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG4vLyBCVUZGRVIgSU5TVEFOQ0UgTUVUSE9EU1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT1cblxuZnVuY3Rpb24gX2hleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgLy8gbXVzdCBiZSBhbiBldmVuIG51bWJlciBvZiBkaWdpdHNcbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcbiAgYXNzZXJ0KHN0ckxlbiAlIDIgPT09IDAsICdJbnZhbGlkIGhleCBzdHJpbmcnKVxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYnl0ZSA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBhc3NlcnQoIWlzTmFOKGJ5dGUpLCAnSW52YWxpZCBoZXggc3RyaW5nJylcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBieXRlXG4gIH1cbiAgQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPSBpICogMlxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiBfdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IEJ1ZmZlci5fY2hhcnNXcml0dGVuID1cbiAgICBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gX2FzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gX2JpbmFyeVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIF9hc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gX2Jhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IEJ1ZmZlci5fY2hhcnNXcml0dGVuID1cbiAgICBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBfdXRmMTZsZVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IEJ1ZmZlci5fY2hhcnNXcml0dGVuID1cbiAgICBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBTdXBwb3J0IGJvdGggKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKVxuICAvLyBhbmQgdGhlIGxlZ2FjeSAoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0LCBsZW5ndGgpXG4gIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgaWYgKCFpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICB9IGVsc2UgeyAgLy8gbGVnYWN5XG4gICAgdmFyIHN3YXAgPSBlbmNvZGluZ1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgb2Zmc2V0ID0gbGVuZ3RoXG4gICAgbGVuZ3RoID0gc3dhcFxuICB9XG5cbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuICBlbmNvZGluZyA9IFN0cmluZyhlbmNvZGluZyB8fCAndXRmOCcpLnRvTG93ZXJDYXNlKClcblxuICB2YXIgcmV0XG4gIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0ID0gX2hleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IF91dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgICAgcmV0ID0gX2FzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgIHJldCA9IF9iaW5hcnlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgcmV0ID0gX2Jhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSBfdXRmMTZsZVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZW5jb2RpbmcnKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgc2VsZiA9IHRoaXNcblxuICBlbmNvZGluZyA9IFN0cmluZyhlbmNvZGluZyB8fCAndXRmOCcpLnRvTG93ZXJDYXNlKClcbiAgc3RhcnQgPSBOdW1iZXIoc3RhcnQpIHx8IDBcbiAgZW5kID0gKGVuZCAhPT0gdW5kZWZpbmVkKVxuICAgID8gTnVtYmVyKGVuZClcbiAgICA6IGVuZCA9IHNlbGYubGVuZ3RoXG5cbiAgLy8gRmFzdHBhdGggZW1wdHkgc3RyaW5nc1xuICBpZiAoZW5kID09PSBzdGFydClcbiAgICByZXR1cm4gJydcblxuICB2YXIgcmV0XG4gIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0ID0gX2hleFNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IF91dGY4U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgICAgcmV0ID0gX2FzY2lpU2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgIHJldCA9IF9iaW5hcnlTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgcmV0ID0gX2Jhc2U2NFNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSBfdXRmMTZsZVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZW5jb2RpbmcnKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gKHRhcmdldCwgdGFyZ2V0X3N0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIHZhciBzb3VyY2UgPSB0aGlzXG5cbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKCF0YXJnZXRfc3RhcnQpIHRhcmdldF9zdGFydCA9IDBcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVyblxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCBzb3VyY2UubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGFzc2VydChlbmQgPj0gc3RhcnQsICdzb3VyY2VFbmQgPCBzb3VyY2VTdGFydCcpXG4gIGFzc2VydCh0YXJnZXRfc3RhcnQgPj0gMCAmJiB0YXJnZXRfc3RhcnQgPCB0YXJnZXQubGVuZ3RoLFxuICAgICAgJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoc3RhcnQgPj0gMCAmJiBzdGFydCA8IHNvdXJjZS5sZW5ndGgsICdzb3VyY2VTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgYXNzZXJ0KGVuZCA+PSAwICYmIGVuZCA8PSBzb3VyY2UubGVuZ3RoLCAnc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aClcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldF9zdGFydCA8IGVuZCAtIHN0YXJ0KVxuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgKyBzdGFydFxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuXG4gIGlmIChsZW4gPCAxMDAgfHwgIUJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRfc3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gIH0gZWxzZSB7XG4gICAgdGFyZ2V0Ll9zZXQodGhpcy5zdWJhcnJheShzdGFydCwgc3RhcnQgKyBsZW4pLCB0YXJnZXRfc3RhcnQpXG4gIH1cbn1cblxuZnVuY3Rpb24gX2Jhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiBfdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJlcyA9ICcnXG4gIHZhciB0bXAgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBpZiAoYnVmW2ldIDw9IDB4N0YpIHtcbiAgICAgIHJlcyArPSBkZWNvZGVVdGY4Q2hhcih0bXApICsgU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gICAgICB0bXAgPSAnJ1xuICAgIH0gZWxzZSB7XG4gICAgICB0bXAgKz0gJyUnICsgYnVmW2ldLnRvU3RyaW5nKDE2KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXMgKyBkZWNvZGVVdGY4Q2hhcih0bXApXG59XG5cbmZ1bmN0aW9uIF9hc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKylcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gX2JpbmFyeVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgcmV0dXJuIF9hc2NpaVNsaWNlKGJ1Ziwgc3RhcnQsIGVuZClcbn1cblxuZnVuY3Rpb24gX2hleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gX3V0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgYnl0ZXNbaSsxXSAqIDI1NilcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSBjbGFtcChzdGFydCwgbGVuLCAwKVxuICBlbmQgPSBjbGFtcChlbmQsIGxlbiwgbGVuKVxuXG4gIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5fYXVnbWVudCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpKVxuICB9IGVsc2Uge1xuICAgIHZhciBzbGljZUxlbiA9IGVuZCAtIHN0YXJ0XG4gICAgdmFyIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZCwgdHJ1ZSlcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyBpKyspIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgICByZXR1cm4gbmV3QnVmXG4gIH1cbn1cblxuLy8gYGdldGAgd2lsbCBiZSByZW1vdmVkIGluIE5vZGUgMC4xMytcbkJ1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLmdldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMucmVhZFVJbnQ4KG9mZnNldClcbn1cblxuLy8gYHNldGAgd2lsbCBiZSByZW1vdmVkIGluIE5vZGUgMC4xMytcbkJ1ZmZlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHYsIG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLnNldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMud3JpdGVVSW50OCh2LCBvZmZzZXQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgaWYgKG9mZnNldCA+PSB0aGlzLmxlbmd0aClcbiAgICByZXR1cm5cblxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbmZ1bmN0aW9uIF9yZWFkVUludDE2IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbFxuICBpZiAobGl0dGxlRW5kaWFuKSB7XG4gICAgdmFsID0gYnVmW29mZnNldF1cbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMV0gPDwgOFxuICB9IGVsc2Uge1xuICAgIHZhbCA9IGJ1ZltvZmZzZXRdIDw8IDhcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMV1cbiAgfVxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkVUludDE2KHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkVUludDE2KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZFVJbnQzMiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWxcbiAgaWYgKGxpdHRsZUVuZGlhbikge1xuICAgIGlmIChvZmZzZXQgKyAyIDwgbGVuKVxuICAgICAgdmFsID0gYnVmW29mZnNldCArIDJdIDw8IDE2XG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdIDw8IDhcbiAgICB2YWwgfD0gYnVmW29mZnNldF1cbiAgICBpZiAob2Zmc2V0ICsgMyA8IGxlbilcbiAgICAgIHZhbCA9IHZhbCArIChidWZbb2Zmc2V0ICsgM10gPDwgMjQgPj4+IDApXG4gIH0gZWxzZSB7XG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgPSBidWZbb2Zmc2V0ICsgMV0gPDwgMTZcbiAgICBpZiAob2Zmc2V0ICsgMiA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMl0gPDwgOFxuICAgIGlmIChvZmZzZXQgKyAzIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAzXVxuICAgIHZhbCA9IHZhbCArIChidWZbb2Zmc2V0XSA8PCAyNCA+Pj4gMClcbiAgfVxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkVUludDMyKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkVUludDMyKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsXG4gICAgICAgICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgaWYgKG9mZnNldCA+PSB0aGlzLmxlbmd0aClcbiAgICByZXR1cm5cblxuICB2YXIgbmVnID0gdGhpc1tvZmZzZXRdICYgMHg4MFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuZnVuY3Rpb24gX3JlYWRJbnQxNiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWwgPSBfcmVhZFVJbnQxNihidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCB0cnVlKVxuICB2YXIgbmVnID0gdmFsICYgMHg4MDAwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmZmYgLSB2YWwgKyAxKSAqIC0xXG4gIGVsc2VcbiAgICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQxNih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MTYodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkSW50MzIgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsID0gX3JlYWRVSW50MzIoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgdHJ1ZSlcbiAgdmFyIG5lZyA9IHZhbCAmIDB4ODAwMDAwMDBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmZmZmZmZmYgLSB2YWwgKyAxKSAqIC0xXG4gIGVsc2VcbiAgICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQzMih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MzIodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkRmxvYXQgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgcmV0dXJuIGllZWU3NTQucmVhZChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEZsb2F0KHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRGbG9hdCh0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWREb3VibGUgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCArIDcgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgcmV0dXJuIGllZWU3NTQucmVhZChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWREb3VibGUodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWREb3VibGUodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmKVxuICB9XG5cbiAgaWYgKG9mZnNldCA+PSB0aGlzLmxlbmd0aCkgcmV0dXJuXG5cbiAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbn1cblxuZnVuY3Rpb24gX3dyaXRlVUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAndHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnVpbnQodmFsdWUsIDB4ZmZmZilcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4obGVuIC0gb2Zmc2V0LCAyKTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9XG4gICAgICAgICh2YWx1ZSAmICgweGZmIDw8ICg4ICogKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkpKSkgPj4+XG4gICAgICAgICAgICAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSAqIDhcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlVUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAndHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnVpbnQodmFsdWUsIDB4ZmZmZmZmZmYpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGxlbiAtIG9mZnNldCwgNCk7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPVxuICAgICAgICAodmFsdWUgPj4+IChsaXR0bGVFbmRpYW4gPyBpIDogMyAtIGkpICogOCkgJiAweGZmXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2YsIC0weDgwKVxuICB9XG5cbiAgaWYgKG9mZnNldCA+PSB0aGlzLmxlbmd0aClcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICB0aGlzLndyaXRlVUludDgodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpXG4gIGVsc2VcbiAgICB0aGlzLndyaXRlVUludDgoMHhmZiArIHZhbHVlICsgMSwgb2Zmc2V0LCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZmZmLCAtMHg4MDAwKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgX3dyaXRlVUludDE2KGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbiAgZWxzZVxuICAgIF93cml0ZVVJbnQxNihidWYsIDB4ZmZmZiArIHZhbHVlICsgMSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIF93cml0ZVVJbnQzMihidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG4gIGVsc2VcbiAgICBfd3JpdGVVSW50MzIoYnVmLCAweGZmZmZmZmZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZklFRUU3NTQodmFsdWUsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyA3IDwgYnVmLmxlbmd0aCxcbiAgICAgICAgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZJRUVFNzU0KHZhbHVlLCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBmaWxsKHZhbHVlLCBzdGFydD0wLCBlbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uICh2YWx1ZSwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXZhbHVlKSB2YWx1ZSA9IDBcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kKSBlbmQgPSB0aGlzLmxlbmd0aFxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsdWUgPSB2YWx1ZS5jaGFyQ29kZUF0KDApXG4gIH1cblxuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiAhaXNOYU4odmFsdWUpLCAndmFsdWUgaXMgbm90IGEgbnVtYmVyJylcbiAgYXNzZXJ0KGVuZCA+PSBzdGFydCwgJ2VuZCA8IHN0YXJ0JylcblxuICAvLyBGaWxsIDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVyblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIGFzc2VydChzdGFydCA+PSAwICYmIHN0YXJ0IDwgdGhpcy5sZW5ndGgsICdzdGFydCBvdXQgb2YgYm91bmRzJylcbiAgYXNzZXJ0KGVuZCA+PSAwICYmIGVuZCA8PSB0aGlzLmxlbmd0aCwgJ2VuZCBvdXQgb2YgYm91bmRzJylcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHRoaXNbaV0gPSB2YWx1ZVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG91dCA9IFtdXG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgb3V0W2ldID0gdG9IZXgodGhpc1tpXSlcbiAgICBpZiAoaSA9PT0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUykge1xuICAgICAgb3V0W2kgKyAxXSA9ICcuLi4nXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICByZXR1cm4gJzxCdWZmZXIgJyArIG91dC5qb2luKCcgJykgKyAnPidcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGBBcnJheUJ1ZmZlcmAgd2l0aCB0aGUgKmNvcGllZCogbWVtb3J5IG9mIHRoZSBidWZmZXIgaW5zdGFuY2UuXG4gKiBBZGRlZCBpbiBOb2RlIDAuMTIuIE9ubHkgYXZhaWxhYmxlIGluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBBcnJheUJ1ZmZlci5cbiAqL1xuQnVmZmVyLnByb3RvdHlwZS50b0FycmF5QnVmZmVyID0gZnVuY3Rpb24gKCkge1xuICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICAgIHJldHVybiAobmV3IEJ1ZmZlcih0aGlzKSkuYnVmZmVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBidWYgPSBuZXcgVWludDhBcnJheSh0aGlzLmxlbmd0aClcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBidWYubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpXG4gICAgICAgIGJ1ZltpXSA9IHRoaXNbaV1cbiAgICAgIHJldHVybiBidWYuYnVmZmVyXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignQnVmZmVyLnRvQXJyYXlCdWZmZXIgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXInKVxuICB9XG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxudmFyIEJQID0gQnVmZmVyLnByb3RvdHlwZVxuXG4vKipcbiAqIEF1Z21lbnQgYSBVaW50OEFycmF5ICppbnN0YW5jZSogKG5vdCB0aGUgVWludDhBcnJheSBjbGFzcyEpIHdpdGggQnVmZmVyIG1ldGhvZHNcbiAqL1xuQnVmZmVyLl9hdWdtZW50ID0gZnVuY3Rpb24gKGFycikge1xuICBhcnIuX2lzQnVmZmVyID0gdHJ1ZVxuXG4gIC8vIHNhdmUgcmVmZXJlbmNlIHRvIG9yaWdpbmFsIFVpbnQ4QXJyYXkgZ2V0L3NldCBtZXRob2RzIGJlZm9yZSBvdmVyd3JpdGluZ1xuICBhcnIuX2dldCA9IGFyci5nZXRcbiAgYXJyLl9zZXQgPSBhcnIuc2V0XG5cbiAgLy8gZGVwcmVjYXRlZCwgd2lsbCBiZSByZW1vdmVkIGluIG5vZGUgMC4xMytcbiAgYXJyLmdldCA9IEJQLmdldFxuICBhcnIuc2V0ID0gQlAuc2V0XG5cbiAgYXJyLndyaXRlID0gQlAud3JpdGVcbiAgYXJyLnRvU3RyaW5nID0gQlAudG9TdHJpbmdcbiAgYXJyLnRvTG9jYWxlU3RyaW5nID0gQlAudG9TdHJpbmdcbiAgYXJyLnRvSlNPTiA9IEJQLnRvSlNPTlxuICBhcnIuY29weSA9IEJQLmNvcHlcbiAgYXJyLnNsaWNlID0gQlAuc2xpY2VcbiAgYXJyLnJlYWRVSW50OCA9IEJQLnJlYWRVSW50OFxuICBhcnIucmVhZFVJbnQxNkxFID0gQlAucmVhZFVJbnQxNkxFXG4gIGFyci5yZWFkVUludDE2QkUgPSBCUC5yZWFkVUludDE2QkVcbiAgYXJyLnJlYWRVSW50MzJMRSA9IEJQLnJlYWRVSW50MzJMRVxuICBhcnIucmVhZFVJbnQzMkJFID0gQlAucmVhZFVJbnQzMkJFXG4gIGFyci5yZWFkSW50OCA9IEJQLnJlYWRJbnQ4XG4gIGFyci5yZWFkSW50MTZMRSA9IEJQLnJlYWRJbnQxNkxFXG4gIGFyci5yZWFkSW50MTZCRSA9IEJQLnJlYWRJbnQxNkJFXG4gIGFyci5yZWFkSW50MzJMRSA9IEJQLnJlYWRJbnQzMkxFXG4gIGFyci5yZWFkSW50MzJCRSA9IEJQLnJlYWRJbnQzMkJFXG4gIGFyci5yZWFkRmxvYXRMRSA9IEJQLnJlYWRGbG9hdExFXG4gIGFyci5yZWFkRmxvYXRCRSA9IEJQLnJlYWRGbG9hdEJFXG4gIGFyci5yZWFkRG91YmxlTEUgPSBCUC5yZWFkRG91YmxlTEVcbiAgYXJyLnJlYWREb3VibGVCRSA9IEJQLnJlYWREb3VibGVCRVxuICBhcnIud3JpdGVVSW50OCA9IEJQLndyaXRlVUludDhcbiAgYXJyLndyaXRlVUludDE2TEUgPSBCUC53cml0ZVVJbnQxNkxFXG4gIGFyci53cml0ZVVJbnQxNkJFID0gQlAud3JpdGVVSW50MTZCRVxuICBhcnIud3JpdGVVSW50MzJMRSA9IEJQLndyaXRlVUludDMyTEVcbiAgYXJyLndyaXRlVUludDMyQkUgPSBCUC53cml0ZVVJbnQzMkJFXG4gIGFyci53cml0ZUludDggPSBCUC53cml0ZUludDhcbiAgYXJyLndyaXRlSW50MTZMRSA9IEJQLndyaXRlSW50MTZMRVxuICBhcnIud3JpdGVJbnQxNkJFID0gQlAud3JpdGVJbnQxNkJFXG4gIGFyci53cml0ZUludDMyTEUgPSBCUC53cml0ZUludDMyTEVcbiAgYXJyLndyaXRlSW50MzJCRSA9IEJQLndyaXRlSW50MzJCRVxuICBhcnIud3JpdGVGbG9hdExFID0gQlAud3JpdGVGbG9hdExFXG4gIGFyci53cml0ZUZsb2F0QkUgPSBCUC53cml0ZUZsb2F0QkVcbiAgYXJyLndyaXRlRG91YmxlTEUgPSBCUC53cml0ZURvdWJsZUxFXG4gIGFyci53cml0ZURvdWJsZUJFID0gQlAud3JpdGVEb3VibGVCRVxuICBhcnIuZmlsbCA9IEJQLmZpbGxcbiAgYXJyLmluc3BlY3QgPSBCUC5pbnNwZWN0XG4gIGFyci50b0FycmF5QnVmZmVyID0gQlAudG9BcnJheUJ1ZmZlclxuXG4gIHJldHVybiBhcnJcbn1cblxuLy8gc2xpY2Uoc3RhcnQsIGVuZClcbmZ1bmN0aW9uIGNsYW1wIChpbmRleCwgbGVuLCBkZWZhdWx0VmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBpbmRleCAhPT0gJ251bWJlcicpIHJldHVybiBkZWZhdWx0VmFsdWVcbiAgaW5kZXggPSB+fmluZGV4OyAgLy8gQ29lcmNlIHRvIGludGVnZXIuXG4gIGlmIChpbmRleCA+PSBsZW4pIHJldHVybiBsZW5cbiAgaWYgKGluZGV4ID49IDApIHJldHVybiBpbmRleFxuICBpbmRleCArPSBsZW5cbiAgaWYgKGluZGV4ID49IDApIHJldHVybiBpbmRleFxuICByZXR1cm4gMFxufVxuXG5mdW5jdGlvbiBjb2VyY2UgKGxlbmd0aCkge1xuICAvLyBDb2VyY2UgbGVuZ3RoIHRvIGEgbnVtYmVyIChwb3NzaWJseSBOYU4pLCByb3VuZCB1cFxuICAvLyBpbiBjYXNlIGl0J3MgZnJhY3Rpb25hbCAoZS5nLiAxMjMuNDU2KSB0aGVuIGRvIGFcbiAgLy8gZG91YmxlIG5lZ2F0ZSB0byBjb2VyY2UgYSBOYU4gdG8gMC4gRWFzeSwgcmlnaHQ/XG4gIGxlbmd0aCA9IH5+TWF0aC5jZWlsKCtsZW5ndGgpXG4gIHJldHVybiBsZW5ndGggPCAwID8gMCA6IGxlbmd0aFxufVxuXG5mdW5jdGlvbiBpc0FycmF5IChzdWJqZWN0KSB7XG4gIHJldHVybiAoQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoc3ViamVjdCkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc3ViamVjdCkgPT09ICdbb2JqZWN0IEFycmF5XSdcbiAgfSkoc3ViamVjdClcbn1cblxuZnVuY3Rpb24gaXNBcnJheWlzaCAoc3ViamVjdCkge1xuICByZXR1cm4gaXNBcnJheShzdWJqZWN0KSB8fCBCdWZmZXIuaXNCdWZmZXIoc3ViamVjdCkgfHxcbiAgICAgIHN1YmplY3QgJiYgdHlwZW9mIHN1YmplY3QgPT09ICdvYmplY3QnICYmXG4gICAgICB0eXBlb2Ygc3ViamVjdC5sZW5ndGggPT09ICdudW1iZXInXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYiA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaWYgKGIgPD0gMHg3RilcbiAgICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpKVxuICAgIGVsc2Uge1xuICAgICAgdmFyIHN0YXJ0ID0gaVxuICAgICAgaWYgKGIgPj0gMHhEODAwICYmIGIgPD0gMHhERkZGKSBpKytcbiAgICAgIHZhciBoID0gZW5jb2RlVVJJQ29tcG9uZW50KHN0ci5zbGljZShzdGFydCwgaSsxKSkuc3Vic3RyKDEpLnNwbGl0KCclJylcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgaC5sZW5ndGg7IGorKylcbiAgICAgICAgYnl0ZUFycmF5LnB1c2gocGFyc2VJbnQoaFtqXSwgMTYpKVxuICAgIH1cbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShzdHIpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgcG9zXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpXG4gICAgICBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIGRlY29kZVV0ZjhDaGFyIChzdHIpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHN0cilcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoMHhGRkZEKSAvLyBVVEYgOCBpbnZhbGlkIGNoYXJcbiAgfVxufVxuXG4vKlxuICogV2UgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCB0aGUgdmFsdWUgaXMgYSB2YWxpZCBpbnRlZ2VyLiBUaGlzIG1lYW5zIHRoYXQgaXRcbiAqIGlzIG5vbi1uZWdhdGl2ZS4gSXQgaGFzIG5vIGZyYWN0aW9uYWwgY29tcG9uZW50IGFuZCB0aGF0IGl0IGRvZXMgbm90XG4gKiBleGNlZWQgdGhlIG1heGltdW0gYWxsb3dlZCB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gdmVyaWZ1aW50ICh2YWx1ZSwgbWF4KSB7XG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInLCAnY2Fubm90IHdyaXRlIGEgbm9uLW51bWJlciBhcyBhIG51bWJlcicpXG4gIGFzc2VydCh2YWx1ZSA+PSAwLCAnc3BlY2lmaWVkIGEgbmVnYXRpdmUgdmFsdWUgZm9yIHdyaXRpbmcgYW4gdW5zaWduZWQgdmFsdWUnKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgaXMgbGFyZ2VyIHRoYW4gbWF4aW11bSB2YWx1ZSBmb3IgdHlwZScpXG4gIGFzc2VydChNYXRoLmZsb29yKHZhbHVlKSA9PT0gdmFsdWUsICd2YWx1ZSBoYXMgYSBmcmFjdGlvbmFsIGNvbXBvbmVudCcpXG59XG5cbmZ1bmN0aW9uIHZlcmlmc2ludCAodmFsdWUsIG1heCwgbWluKSB7XG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInLCAnY2Fubm90IHdyaXRlIGEgbm9uLW51bWJlciBhcyBhIG51bWJlcicpXG4gIGFzc2VydCh2YWx1ZSA8PSBtYXgsICd2YWx1ZSBsYXJnZXIgdGhhbiBtYXhpbXVtIGFsbG93ZWQgdmFsdWUnKVxuICBhc3NlcnQodmFsdWUgPj0gbWluLCAndmFsdWUgc21hbGxlciB0aGFuIG1pbmltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydChNYXRoLmZsb29yKHZhbHVlKSA9PT0gdmFsdWUsICd2YWx1ZSBoYXMgYSBmcmFjdGlvbmFsIGNvbXBvbmVudCcpXG59XG5cbmZ1bmN0aW9uIHZlcmlmSUVFRTc1NCAodmFsdWUsIG1heCwgbWluKSB7XG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInLCAnY2Fubm90IHdyaXRlIGEgbm9uLW51bWJlciBhcyBhIG51bWJlcicpXG4gIGFzc2VydCh2YWx1ZSA8PSBtYXgsICd2YWx1ZSBsYXJnZXIgdGhhbiBtYXhpbXVtIGFsbG93ZWQgdmFsdWUnKVxuICBhc3NlcnQodmFsdWUgPj0gbWluLCAndmFsdWUgc21hbGxlciB0aGFuIG1pbmltdW0gYWxsb3dlZCB2YWx1ZScpXG59XG5cbmZ1bmN0aW9uIGFzc2VydCAodGVzdCwgbWVzc2FnZSkge1xuICBpZiAoIXRlc3QpIHRocm93IG5ldyBFcnJvcihtZXNzYWdlIHx8ICdGYWlsZWQgYXNzZXJ0aW9uJylcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgbG9va3VwID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuXG47KGZ1bmN0aW9uIChleHBvcnRzKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuICB2YXIgQXJyID0gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJylcbiAgICA/IFVpbnQ4QXJyYXlcbiAgICA6IEFycmF5XG5cblx0dmFyIFBMVVMgICA9ICcrJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSCAgPSAnLycuY2hhckNvZGVBdCgwKVxuXHR2YXIgTlVNQkVSID0gJzAnLmNoYXJDb2RlQXQoMClcblx0dmFyIExPV0VSICA9ICdhJy5jaGFyQ29kZUF0KDApXG5cdHZhciBVUFBFUiAgPSAnQScuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTKVxuXHRcdFx0cmV0dXJuIDYyIC8vICcrJ1xuXHRcdGlmIChjb2RlID09PSBTTEFTSClcblx0XHRcdHJldHVybiA2MyAvLyAnLydcblx0XHRpZiAoY29kZSA8IE5VTUJFUilcblx0XHRcdHJldHVybiAtMSAvL25vIG1hdGNoXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIgKyAxMClcblx0XHRcdHJldHVybiBjb2RlIC0gTlVNQkVSICsgMjYgKyAyNlxuXHRcdGlmIChjb2RlIDwgVVBQRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gVVBQRVJcblx0XHRpZiAoY29kZSA8IExPV0VSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIExPV0VSICsgMjZcblx0fVxuXG5cdGZ1bmN0aW9uIGI2NFRvQnl0ZUFycmF5IChiNjQpIHtcblx0XHR2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuXG5cdFx0aWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0Jylcblx0XHR9XG5cblx0XHQvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuXHRcdC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcblx0XHQvLyByZXByZXNlbnQgb25lIGJ5dGVcblx0XHQvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcblx0XHQvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG5cdFx0dmFyIGxlbiA9IGI2NC5sZW5ndGhcblx0XHRwbGFjZUhvbGRlcnMgPSAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMikgPyAyIDogJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDEpID8gMSA6IDBcblxuXHRcdC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuXHRcdGFyciA9IG5ldyBBcnIoYjY0Lmxlbmd0aCAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuXHRcdGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIDQgOiBiNjQubGVuZ3RoXG5cblx0XHR2YXIgTCA9IDBcblxuXHRcdGZ1bmN0aW9uIHB1c2ggKHYpIHtcblx0XHRcdGFycltMKytdID0gdlxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTgpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgMTIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPDwgNikgfCBkZWNvZGUoYjY0LmNoYXJBdChpICsgMykpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDAwMCkgPj4gMTYpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDApID4+IDgpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpID4+IDQpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTApIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgNCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA+PiAyKVxuXHRcdFx0cHVzaCgodG1wID4+IDgpICYgMHhGRilcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyXG5cdH1cblxuXHRmdW5jdGlvbiB1aW50OFRvQmFzZTY0ICh1aW50OCkge1xuXHRcdHZhciBpLFxuXHRcdFx0ZXh0cmFCeXRlcyA9IHVpbnQ4Lmxlbmd0aCAlIDMsIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG5cdFx0XHRvdXRwdXQgPSBcIlwiLFxuXHRcdFx0dGVtcCwgbGVuZ3RoXG5cblx0XHRmdW5jdGlvbiBlbmNvZGUgKG51bSkge1xuXHRcdFx0cmV0dXJuIGxvb2t1cC5jaGFyQXQobnVtKVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG5cdFx0XHRyZXR1cm4gZW5jb2RlKG51bSA+PiAxOCAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiAxMiAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiA2ICYgMHgzRikgKyBlbmNvZGUobnVtICYgMHgzRilcblx0XHR9XG5cblx0XHQvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG5cdFx0Zm9yIChpID0gMCwgbGVuZ3RoID0gdWludDgubGVuZ3RoIC0gZXh0cmFCeXRlczsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG5cdFx0XHR0ZW1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuXHRcdFx0b3V0cHV0ICs9IHRyaXBsZXRUb0Jhc2U2NCh0ZW1wKVxuXHRcdH1cblxuXHRcdC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcblx0XHRzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0dGVtcCA9IHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAyKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9PSdcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGVtcCA9ICh1aW50OFt1aW50OC5sZW5ndGggLSAyXSA8PCA4KSArICh1aW50OFt1aW50OC5sZW5ndGggLSAxXSlcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDEwKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wID4+IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCAyKSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPSdcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0XG5cdH1cblxuXHRleHBvcnRzLnRvQnl0ZUFycmF5ID0gYjY0VG9CeXRlQXJyYXlcblx0ZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gdWludDhUb0Jhc2U2NFxufSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAodGhpcy5iYXNlNjRqcyA9IHt9KSA6IGV4cG9ydHMpKVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG5leHBvcnRzLnJlYWQgPSBmdW5jdGlvbihidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLFxuICAgICAgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMSxcbiAgICAgIGVNYXggPSAoMSA8PCBlTGVuKSAtIDEsXG4gICAgICBlQmlhcyA9IGVNYXggPj4gMSxcbiAgICAgIG5CaXRzID0gLTcsXG4gICAgICBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDAsXG4gICAgICBkID0gaXNMRSA/IC0xIDogMSxcbiAgICAgIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV07XG5cbiAgaSArPSBkO1xuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpO1xuICBzID4+PSAoLW5CaXRzKTtcbiAgbkJpdHMgKz0gZUxlbjtcbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IGUgKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCk7XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSk7XG4gIGUgPj49ICgtbkJpdHMpO1xuICBuQml0cyArPSBtTGVuO1xuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KTtcblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXM7XG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KTtcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pO1xuICAgIGUgPSBlIC0gZUJpYXM7XG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbik7XG59O1xuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24oYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGMsXG4gICAgICBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxLFxuICAgICAgZU1heCA9ICgxIDw8IGVMZW4pIC0gMSxcbiAgICAgIGVCaWFzID0gZU1heCA+PiAxLFxuICAgICAgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApLFxuICAgICAgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpLFxuICAgICAgZCA9IGlzTEUgPyAxIDogLTEsXG4gICAgICBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwO1xuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpO1xuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwO1xuICAgIGUgPSBlTWF4O1xuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKTtcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS07XG4gICAgICBjICo9IDI7XG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcyk7XG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrO1xuICAgICAgYyAvPSAyO1xuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDA7XG4gICAgICBlID0gZU1heDtcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKHZhbHVlICogYyAtIDEpICogTWF0aC5wb3coMiwgbUxlbik7XG4gICAgICBlID0gZSArIGVCaWFzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbik7XG4gICAgICBlID0gMDtcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KTtcblxuICBlID0gKGUgPDwgbUxlbikgfCBtO1xuICBlTGVuICs9IG1MZW47XG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCk7XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4O1xufTtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2llZWU3NTRcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIEJvZHkgPSByZXF1aXJlKCcuL2JvZHknKVxudmFyIHNpbXVsYXRpb24gPSByZXF1aXJlKCcuL3NpbXVsYXRpb24nKVxudmFyIEJvdW5kcnkgPSByZXF1aXJlKCcuL2JvdW5kcnknKVxudmFyIEFuaW1hdGlvbiA9IHJlcXVpcmUoJy4vYW5pbWF0aW9uJylcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG52YXIgaGVpZ2h0ID0gcmVxdWlyZSgnLi91dGlsJykuaGVpZ2h0XG5cbnZhciBBY2NlbGVyYXRlID0gbW9kdWxlLmV4cG9ydHMgPSBBbmltYXRpb24oe1xuICBkZWZhdWx0T3B0aW9uczoge1xuICAgIGFjY2VsZXJhdGlvbjogMTAwMCxcbiAgICBib3VuY2U6IGZhbHNlLFxuICAgIG1pbkJvdW5jZURpc3RhbmNlOiA1LFxuICAgIGRhbXBpbmc6IDAuMixcbiAgICByZXN0aXR1dGlvbjogMC4yXG4gIH0sXG5cbiAgb25TdGFydDogZnVuY3Rpb24odmVsb2NpdHksIGZyb20sIHRvLCBvcHRzLCB1cGRhdGUsIGRvbmUpIHtcbiAgICB2YXIgZGlyZWN0aW9uID0gdG8uc3ViKGZyb20pLm5vcm1hbGl6ZSgpXG4gICAgdmFyIGFjY2VsZXJhdGlvbiA9IGRpcmVjdGlvbi5tdWx0KG9wdHMuYWNjZWxlcmF0aW9uKVxuICAgIHZhciBib3VuY2VBY2NlbGVyYXRpb24gPSBkaXJlY3Rpb24ubXVsdChvcHRzLmJvdW5jZUFjY2VsZXJhdGlvbiB8fCBvcHRzLmFjY2VsZXJhdGlvbilcbiAgICB2YXIgYm91bmRyeSA9IEJvdW5kcnkoe1xuICAgICAgbGVmdDogKHRvLnggPiBmcm9tLngpID8gLUluZmluaXR5IDogdG8ueCxcbiAgICAgIHJpZ2h0OiAodG8ueCA+IGZyb20ueCkgPyB0by54IDogSW5maW5pdHksXG4gICAgICB0b3A6ICh0by55ID4gZnJvbS55KSA/IC1JbmZpbml0eSA6IHRvLnksXG4gICAgICBib3R0b206ICh0by55ID4gZnJvbS55KSA/IHRvLnkgOiBJbmZpbml0eVxuICAgIH0pXG4gICAgdmFyIGJvdW5jaW5nXG5cbiAgICBpZih0by5zdWIoZnJvbSkubm9ybSgpIDwgLjAwMSAmJiB2ZWxvY2l0eS5ub3JtKCkgPCAuMDAxKSB7XG4gICAgICByZXR1cm4gdXBkYXRlLmRvbmUodG8sIHZlbG9jaXR5KVxuICAgIH1cblxuICAgIHZhciByZXN0aXR1dGlvbiA9IG9wdHMucmVzdGl0dXRpb24gfHwgb3B0cy5kYW1waW5nIC8vIFRPRE8gcmVtb3ZlIGRhbXBpbmdcblxuICAgIHZhciBib2R5ID0gdGhpcy5fYm9keSA9IEJvZHkodmVsb2NpdHksIGZyb20sIHtcbiAgICAgIGFjY2VsZXJhdGU6IGZ1bmN0aW9uKHMsIHQpIHtcbiAgICAgICAgaWYoYm91bmNpbmcpXG4gICAgICAgICAgcmV0dXJuIGJvdW5jZUFjY2VsZXJhdGlvblxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGFjY2VsZXJhdGlvblxuICAgICAgfSxcbiAgICAgIHVwZGF0ZTogZnVuY3Rpb24ocG9zaXRpb24sIHZlbG9jaXR5KSB7XG4gICAgICAgIGlmKGJvdW5kcnkuY29udGFpbnMocG9zaXRpb24pKSB7XG4gICAgICAgICAgdXBkYXRlLnN0YXRlKHBvc2l0aW9uLCB2ZWxvY2l0eSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZihvcHRzLmJvdW5jZSAmJlxuICAgICAgICAgICAgIE1hdGguYWJzKGhlaWdodChib3VuY2VBY2NlbGVyYXRpb24ubm9ybSgpLCB2ZWxvY2l0eS5ub3JtKCkgKiByZXN0aXR1dGlvbiwgMCkpID4gb3B0cy5taW5Cb3VuY2VEaXN0YW5jZSkge1xuICAgICAgICAgICAgICBib3VuY2luZyA9IHRydWVcbiAgICAgICAgICAgICAgYm9keS5wb3NpdGlvbiA9IFZlY3Rvcih0bylcbiAgICAgICAgICAgICAgYm9keS52ZWxvY2l0eS5zZWxmTXVsdCgtb3B0cy5kYW1waW5nKVxuICAgICAgICAgICAgICB1cGRhdGUuc3RhdGUodG8sIGJvZHkudmVsb2NpdHkpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVwZGF0ZS5kb25lKHRvLCB2ZWxvY2l0eSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICAgIHNpbXVsYXRpb24uYWRkQm9keSh0aGlzLl9ib2R5KVxuICB9LFxuICBvbkVuZDogZnVuY3Rpb24oKSB7XG4gICAgc2ltdWxhdGlvbi5yZW1vdmVCb2R5KHRoaXMuX2JvZHkpXG4gIH1cbn0pXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2FjY2VsZXJhdGUuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCdsb2Rhc2guZGVmYXVsdHMnKVxuICAsIFByb21pc2UgPSB3aW5kb3cuUHJvbWlzZSB8fCByZXF1aXJlKCdwcm9taXNlJylcbiAgLCBCb3VuZHJ5ID0gcmVxdWlyZSgnLi9ib3VuZHJ5JylcbiAgLCBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG4gICwgRW1pdHRlciA9IHJlcXVpcmUoJ2NvbXBvbmVudC1lbWl0dGVyJylcblxudmFyIHByb3RvID0ge1xuICB0bzogZnVuY3Rpb24oeCwgeSkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBCb3VuZHJ5KVxuICAgICAgdGhpcy5fdG8gPSB4XG4gICAgZWxzZVxuICAgICAgdGhpcy5fdG8gPSBWZWN0b3IoeCwgeSlcbiAgICByZXR1cm4gdGhpc1xuICB9LFxuXG4gIHZlbG9jaXR5OiBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy5fdmVsb2NpdHkgPSBWZWN0b3IoeCwgeSlcbiAgICByZXR1cm4gdGhpc1xuICB9LFxuXG4gIGZyb206IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLl9mcm9tID0gVmVjdG9yKHgsIHkpXG4gICAgcmV0dXJuIHRoaXNcbiAgfSxcblxuICBfdXBkYXRlU3RhdGU6IGZ1bmN0aW9uKHBvc2l0aW9uLCB2ZWxvY2l0eSkge1xuICAgIHRoaXMuX3BoeXMucG9zaXRpb24ocG9zaXRpb24pXG4gICAgdGhpcy5fcGh5cy52ZWxvY2l0eSh2ZWxvY2l0eSlcbiAgfSxcblxuICBjYW5jZWw6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX29uRW5kKClcbiAgICB0aGlzLl9ydW5uaW5nID0gZmFsc2VcbiAgICB0aGlzLl9yZWplY3QoKVxuICB9LFxuXG4gIHJ1bm5pbmc6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9ydW5uaW5nIHx8IGZhbHNlXG4gIH0sXG5cbiAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgICAgLCBmcm9tID0gKHRoaXMuX2Zyb20pID8gdGhpcy5fZnJvbSA6IHRoaXMuX3BoeXMucG9zaXRpb24oKVxuICAgICAgLCB0byA9ICh0aGlzLl90bykgPyB0aGlzLl90byA6IHRoaXMuX3BoeXMucG9zaXRpb24oKVxuICAgICAgLCB2ZWxvY2l0eSA9ICh0aGlzLl92ZWxvY2l0eSkgPyB0aGlzLl92ZWxvY2l0eSA6IHRoaXMuX3BoeXMudmVsb2NpdHkoKVxuICAgICAgLCBvcHRzID0gZGVmYXVsdHMoe30sIHRoaXMuX29wdHMgfHwge30sIHRoaXMuX2RlZmF1bHRPcHRzKVxuXG4gICAgdmFyIHVwZGF0ZSA9IHtcbiAgICAgIHN0YXRlOiBmdW5jdGlvbihwb3NpdGlvbiwgdmVsb2NpdHkpIHtcbiAgICAgICAgdGhhdC5fdXBkYXRlU3RhdGUocG9zaXRpb24sIHZlbG9jaXR5KVxuICAgICAgfSxcbiAgICAgIGRvbmU6IGZ1bmN0aW9uKHBvc2l0aW9uLCB2ZWxvY2l0eSkge1xuICAgICAgICB0aGF0Ll91cGRhdGVTdGF0ZShwb3NpdGlvbiwgdmVsb2NpdHkpXG4gICAgICAgIHRoYXQuX29uRW5kKClcbiAgICAgICAgdGhhdC5fcnVubmluZyA9IGZhbHNlXG4gICAgICAgIHRoYXQuX3Jlc29sdmUoeyBwb3NpdGlvbjogcG9zaXRpb24sIHZlbG9jaXR5OiB2ZWxvY2l0eSB9KVxuICAgICAgfSxcbiAgICAgIGNhbmNlbDogZnVuY3Rpb24ocG9zaXRpb24sIHZlbG9jaXR5KSB7XG4gICAgICAgIHRoYXQuX3VwZGF0ZVN0YXRlKHBvc2l0aW9uLCB2ZWxvY2l0eSlcbiAgICAgICAgdGhhdC5fb25FbmQoKVxuICAgICAgICB0aGF0Ll9ydW5uaW5nID0gZmFsc2VcbiAgICAgICAgdGhhdC5fcmVqZWN0KClcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fcGh5cy5fc3RhcnRBbmltYXRpb24odGhpcylcblxuICAgIHRoaXMuX3J1bm5pbmcgPSB0cnVlXG4gICAgaWYodG8gaW5zdGFuY2VvZiBCb3VuZHJ5KVxuICAgICAgdG8gPSB0by5uZWFyZXN0SW50ZXJzZWN0KGZyb20sIHZlbG9jaXR5KVxuICAgIHRoaXMuX29uU3RhcnQodmVsb2NpdHksIGZyb20sIHRvLCBvcHRzLCB1cGRhdGUpXG5cbiAgICByZXR1cm4gdGhhdC5fZW5kZWRcbiAgfVxufVxuXG5mdW5jdGlvbiBBbmltYXRpb24oY2FsbGJhY2tzKSB7XG4gIHZhciBhbmltYXRpb24gPSBmdW5jdGlvbihwaHlzLCBvcHRzKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgdGhpcy5fb3B0cyA9IG9wdHNcbiAgICB0aGlzLl9waHlzID0gcGh5c1xuICAgIHRoaXMuX29uU3RhcnQgPSBjYWxsYmFja3Mub25TdGFydFxuICAgIHRoaXMuX29uRW5kID0gY2FsbGJhY2tzLm9uRW5kXG4gICAgdGhpcy5fZGVmYXVsdE9wdHMgPSBjYWxsYmFja3MuZGVmYXVsdE9wdGlvbnNcblxuICAgIHRoaXMuX2VuZGVkID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB0aGF0Ll9yZXNvbHZlID0gcmVzb2x2ZVxuICAgICAgdGhhdC5fcmVqZWN0ID0gcmVqZWN0XG4gICAgfSlcblxuICAgIHRoaXMuc3RhcnQgPSB0aGlzLnN0YXJ0LmJpbmQodGhpcylcbiAgfVxuXG4gIEVtaXR0ZXIoYW5pbWF0aW9uLnByb3RvdHlwZSlcbiAgYW5pbWF0aW9uLnByb3RvdHlwZSA9IHByb3RvXG5cbiAgcmV0dXJuIGFuaW1hdGlvblxufVxuXG5cblxuXG5cbm1vZHVsZS5leHBvcnRzID0gQW5pbWF0aW9uXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2FuaW1hdGlvbi5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ2xvZGFzaC5kZWZhdWx0cycpXG4gICwgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKVxuICAsIHNpbXVsYXRpb24gPSByZXF1aXJlKCcuL3NpbXVsYXRpb24nKVxuICAsIEJvZHkgPSByZXF1aXJlKCcuL2JvZHknKVxuXG52YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gIHRlbnNpb246IDEwMCxcbiAgZGFtcGluZzogMTAsXG4gIHNlcGVyYXRpb246IDAsXG4gIG9mZnNldDogeyB4OiAwLCB5OiAwIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBdHRhY2hTcHJpbmdcbmZ1bmN0aW9uIEF0dGFjaFNwcmluZyhwaHlzLCBhdHRhY2htZW50LCBvcHRzKSB7XG4gIHRoaXMuX3BoeXMgPSBwaHlzXG4gIHRoaXMuX29wdHMgPSBkZWZhdWx0cyh7fSwgb3B0cyB8fCB7fSwgZGVmYXVsdE9wdGlvbnMpXG4gIHRoaXMuX3Bvc2l0aW9uID0gcGh5cy5wb3NpdGlvbigpXG4gIHRoaXMuX3ZlbG9jaXR5ID0gcGh5cy52ZWxvY2l0eSgpXG4gIGlmKHR5cGVvZiBhdHRhY2htZW50LnBvc2l0aW9uID09PSAnZnVuY3Rpb24nKVxuICAgIHRoaXMuX2F0dGFjaG1lbnQgPSBhdHRhY2htZW50LnBvc2l0aW9uLmJpbmQoYXR0YWNobWVudClcbiAgZWxzZVxuICAgIHRoaXMuX2F0dGFjaG1lbnQgPSBhdHRhY2htZW50XG59XG5cbkF0dGFjaFNwcmluZy5wcm90b3R5cGUucG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl9wb3NpdGlvblxuICB9XG4gIGlmKHRoaXMuX2JvZHkpXG4gICAgdGhpcy5fYm9keS5wb3NpdGlvbiA9IHRoaXMuX3Bvc2l0aW9uID0gVmVjdG9yKHgsIHkpXG4gIGVsc2VcbiAgICB0aGlzLl9wb3NpdGlvbiA9IFZlY3Rvcih4LCB5KVxufVxuXG5BdHRhY2hTcHJpbmcucHJvdG90eXBlLnZlbG9jaXR5ID0gZnVuY3Rpb24oeCwgeSkge1xuICBpZih0aGlzLl9ib2R5KVxuICAgIHRoaXMuX2JvZHkudmVsb2NpdHkgPSB0aGlzLl92ZWxvY2l0eSA9IFZlY3Rvcih4LCB5KVxuICBlbHNlXG4gICAgdGhpcy5fdmVsb2NpdHkgPSBWZWN0b3IoeCwgeSlcbn1cblxuQXR0YWNoU3ByaW5nLnByb3RvdHlwZS5jYW5jZWwgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHRoaXMuX3J1bm5pbmcgPSBmYWxzZVxuICBzaW11bGF0aW9uLnJlbW92ZUJvZHkodGhpcy5fYm9keSlcbn1cblxuQXR0YWNoU3ByaW5nLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oeCwgeSkge1xuICB0aGlzLl9ydW5uaW5nID0gZmFsc2VcbiAgc2ltdWxhdGlvbi5yZW1vdmVCb2R5KHRoaXMuX2JvZHkpXG59XG5cbkF0dGFjaFNwcmluZy5wcm90b3R5cGUucnVubmluZyA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgcmV0dXJuIHRoaXMuX3J1bm5pbmdcbn1cblxud2luZG93LnVuaXQgPSAwXG5BdHRhY2hTcHJpbmcucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBhdHRhY2htZW50ID0gdGhpcy5fYXR0YWNobWVudFxuICAgICwgb3B0cyA9IHRoaXMuX29wdHNcbiAgICAsIHBoeXMgPSB0aGlzLl9waHlzXG4gICAgLCB2ZWxvY2l0eSA9IHRoaXMuX3ZlbG9jaXR5XG4gICAgLCBwb3NpdGlvbiA9IHRoaXMuX3Bvc2l0aW9uXG4gICAgLCB0aGF0ID0gdGhpc1xuXG4gIHBoeXMuX3N0YXJ0QW5pbWF0aW9uKHRoaXMpXG5cbiAgdGhpcy5fcnVubmluZyA9IHRydWVcblxuICB2YXIgYm9keSA9IHRoaXMuX2JvZHkgPSBCb2R5KHZlbG9jaXR5LCBwb3NpdGlvbiwge1xuICAgIGFjY2VsZXJhdGU6IGZ1bmN0aW9uKHN0YXRlLCB0KSB7XG4gICAgICB2YXIgZGlzdFZlYyA9IHN0YXRlLnBvc2l0aW9uLnNlbGZTdWIoYXR0YWNobWVudCgpKVxuICAgICAgICAsIGRpc3QgPSBkaXN0VmVjLm5vcm0oKVxuICAgICAgICAsIGRpc3ROb3JtID0gZGlzdFZlYy5ub3JtYWxpemUoKVxuXG4gICAgICBpZihkaXN0Tm9ybS54ID09PSAwICYmIGRpc3ROb3JtLnkgPT09IDApIHtcbiAgICAgICAgZGlzdE5vcm0ueCA9IGRpc3ROb3JtLnkgPSAxXG4gICAgICAgIGRpc3ROb3JtLm5vcm1hbGl6ZSgpXG4gICAgICB9XG4gICAgICB2YXIgYWNjZWwgPSBkaXN0Tm9ybVxuICAgICAgICAuc2VsZk11bHQoLW9wdHMudGVuc2lvbilcbiAgICAgICAgLnNlbGZNdWx0KGRpc3QgLSBvcHRzLnNlcGVyYXRpb24pXG4gICAgICAgIC5zZWxmU3ViKHN0YXRlLnZlbG9jaXR5LnNlbGZNdWx0KG9wdHMuZGFtcGluZykpXG5cbiAgICAgIHJldHVybiBhY2NlbFxuICAgIH0sXG4gICAgdXBkYXRlOiBmdW5jdGlvbihwb3NpdGlvbiwgdmVsb2NpdHkpIHtcbiAgICAgIHRoYXQuX3Bvc2l0aW9uID0gYm9keS5wb3NpdGlvblxuICAgICAgdGhhdC5fdmVsb2NpdHkgPSBib2R5LnZlbG9jaXR5XG4gICAgICBpZihvcHRzLm9mZnNldCkge1xuICAgICAgICB2YXIgcG9zID0gcG9zaXRpb24uYWRkKG9wdHMub2Zmc2V0KVxuICAgICAgICBwaHlzLnBvc2l0aW9uKHBvcylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBoeXMucG9zaXRpb24ocG9zaXRpb24pXG4gICAgICB9XG4gICAgICBwaHlzLnZlbG9jaXR5KHZlbG9jaXR5KVxuICAgIH1cbiAgfSlcbiAgc2ltdWxhdGlvbi5hZGRCb2R5KGJvZHkpXG4gIHJldHVybiB0aGlzXG59XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9hdHRhY2gtc3ByaW5nLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJylcblxubW9kdWxlLmV4cG9ydHMgPSBCb2R5XG5cbmZ1bmN0aW9uIEJvZHkodmVsLCBmcm9tLCBmbnMpIHtcbiAgaWYoISh0aGlzIGluc3RhbmNlb2YgQm9keSkpIHJldHVybiBuZXcgQm9keSh2ZWwsIGZyb20sIGZucylcblxuICB0aGlzLnByZXZpb3VzUG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uID0gVmVjdG9yKGZyb20pXG4gIHRoaXMudmVsb2NpdHkgPSBWZWN0b3IodmVsKVxuICB0aGlzLl9mbnMgPSBmbnNcbn1cblxuQm9keS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oYWxwaGEpIHtcbiAgdmFyIHBvcyA9IHRoaXMucHJldmlvdXNQb3NpdGlvbi5jbG9uZSgpLmxlcnAodGhpcy5wb3NpdGlvbiwgYWxwaGEpXG4gIHRoaXMuX2Zucy51cGRhdGUocG9zLCB0aGlzLnZlbG9jaXR5KVxufVxuXG5Cb2R5LnByb3RvdHlwZS5hY2NlbGVyYXRlID0gZnVuY3Rpb24oc3RhdGUsIHQpIHtcbiAgcmV0dXJuIHRoaXMuX2Zucy5hY2NlbGVyYXRlKHN0YXRlLCB0KVxufVxuXG5Cb2R5LnByb3RvdHlwZS5hdFJlc3QgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMudmVsb2NpdHkubm9ybSgpIDwgLjAxXG59XG5cbkJvZHkucHJvdG90eXBlLmF0UG9zaXRpb24gPSBmdW5jdGlvbihwb3MpIHtcbiAgLy9yZXR1cm4gd2hldGhlciB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGlzLnBvc2l0aW9uIGFuZCBwb3MgaXMgbGVzcyB0aGFuIC4xXG4gIHJldHVybiB0aGlzLnBvc2l0aW9uLnN1YihWZWN0b3IocG9zKSkubm9ybSgpIDwgLjAxXG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2JvZHkuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKVxubW9kdWxlLmV4cG9ydHMgPSBCb3VuZHJ5XG5cbmZ1bmN0aW9uIHBvaW50QmV0d2VlbihwLCBwMSwgcDIpIHtcbiAgcmV0dXJuIHAgPj0gcDEgJiYgcCA8PSBwMlxufVxuXG5mdW5jdGlvbiB5SW50ZXJzZWN0KHksIHBvaW50LCBkaXJlY3Rpb24pIHtcbiAgdmFyIGZhY3RvciA9ICh5IC0gcG9pbnQueSkgLyBkaXJlY3Rpb24ueVxuICByZXR1cm4gcG9pbnQuYWRkKGRpcmVjdGlvbi5jbG9uZSgpLm11bHQoZmFjdG9yKSlcbn1cblxuZnVuY3Rpb24geEludGVyc2VjdCh4LCBwb2ludCwgZGlyZWN0aW9uKSB7XG4gIHZhciBmYWN0b3IgPSAoeCAtIHBvaW50LngpIC8gZGlyZWN0aW9uLnhcbiAgcmV0dXJuIHBvaW50LmFkZChkaXJlY3Rpb24uY2xvbmUoKS5tdWx0KGZhY3RvcikpXG59XG5cbkJvdW5kcnkucHJvdG90eXBlLmFwcGx5RGFtcGluZyA9IGZ1bmN0aW9uKHBvc2l0aW9uLCBkYW1waW5nKSB7XG4gIHZhciB4ID0gcG9zaXRpb24ueFxuICAgICwgeSA9IHBvc2l0aW9uLnlcblxuICBpZih4IDwgdGhpcy5sZWZ0KVxuICAgIHggPSB0aGlzLmxlZnQgLSAodGhpcy5sZWZ0IC0geCkgKiBkYW1waW5nXG5cbiAgaWYoeSA8IHRoaXMudG9wKVxuICAgIHkgPSB0aGlzLnRvcCAtICh0aGlzLnRvcCAtIHkpICogZGFtcGluZ1xuXG4gIGlmKHggPiB0aGlzLnJpZ2h0KVxuICAgIHggPSB0aGlzLnJpZ2h0IC0gKHRoaXMucmlnaHQgLSB4KSAqIGRhbXBpbmdcblxuICBpZih5ID4gdGhpcy5ib3R0b20pXG4gICAgeSA9IHRoaXMuYm90dG9tIC0gKHRoaXMuYm90dG9tIC0geSkgKiBkYW1waW5nXG5cbiAgcmV0dXJuIFZlY3Rvcih4LCB5KVxufVxuXG5mdW5jdGlvbiBCb3VuZHJ5KGJvdW5kcnkpIHtcbiAgaWYoISh0aGlzIGluc3RhbmNlb2YgQm91bmRyeSkpXG4gICAgcmV0dXJuIG5ldyBCb3VuZHJ5KGJvdW5kcnkpXG5cbiAgdGhpcy5sZWZ0ID0gKHR5cGVvZiBib3VuZHJ5LmxlZnQgIT09ICd1bmRlZmluZWQnKSA/IGJvdW5kcnkubGVmdCA6IC1JbmZpbml0eVxuICB0aGlzLnJpZ2h0ID0gKHR5cGVvZiBib3VuZHJ5LnJpZ2h0ICE9PSAndW5kZWZpbmVkJykgPyBib3VuZHJ5LnJpZ2h0IDogSW5maW5pdHlcbiAgdGhpcy50b3AgPSAodHlwZW9mIGJvdW5kcnkudG9wICE9PSAndW5kZWZpbmVkJykgPyBib3VuZHJ5LnRvcCA6IC1JbmZpbml0eVxuICB0aGlzLmJvdHRvbSA9ICh0eXBlb2YgYm91bmRyeS5ib3R0b20gIT09ICd1bmRlZmluZWQnKSA/IGJvdW5kcnkuYm90dG9tIDogSW5maW5pdHlcbn1cblxuQm91bmRyeS5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbihwdCkge1xuICByZXR1cm4gcHQueCA+PSB0aGlzLmxlZnQgJiZcbiAgICAgICAgIHB0LnggPD0gdGhpcy5yaWdodCAmJlxuICAgICAgICAgcHQueSA+PSB0aGlzLnRvcCAmJlxuICAgICAgICAgcHQueSA8PSB0aGlzLmJvdHRvbVxufVxuXG5Cb3VuZHJ5LnByb3RvdHlwZS5uZWFyZXN0SW50ZXJzZWN0ID0gZnVuY3Rpb24ocG9pbnQsIHZlbG9jaXR5KSB7XG4gIHZhciBkaXJlY3Rpb24gPSBWZWN0b3IodmVsb2NpdHkpLm5vcm1hbGl6ZSgpXG4gICAgLCBwb2ludCA9IFZlY3Rvcihwb2ludClcbiAgICAsIGlzZWN0XG4gICAgLCBkaXN0WFxuICAgICwgZGlzdFlcblxuICBpZih2ZWxvY2l0eS55IDwgMClcbiAgICBpc2VjdCA9IHlJbnRlcnNlY3QodGhpcy50b3AsIHBvaW50LCBkaXJlY3Rpb24pXG4gIGlmKHZlbG9jaXR5LnkgPiAwKVxuICAgIGlzZWN0ID0geUludGVyc2VjdCh0aGlzLmJvdHRvbSwgcG9pbnQsIGRpcmVjdGlvbilcblxuICBpZihpc2VjdCAmJiBwb2ludEJldHdlZW4oaXNlY3QueCwgdGhpcy5sZWZ0LCB0aGlzLnJpZ2h0KSlcbiAgICByZXR1cm4gaXNlY3RcblxuICBpZih2ZWxvY2l0eS54IDwgMClcbiAgICBpc2VjdCA9IHhJbnRlcnNlY3QodGhpcy5sZWZ0LCBwb2ludCwgZGlyZWN0aW9uKVxuICBpZih2ZWxvY2l0eS54ID4gMClcbiAgICBpc2VjdCA9IHhJbnRlcnNlY3QodGhpcy5yaWdodCwgcG9pbnQsIGRpcmVjdGlvbilcblxuICBpZihpc2VjdCAmJiBwb2ludEJldHdlZW4oaXNlY3QueSwgdGhpcy50b3AsIHRoaXMuYm90dG9tKSlcbiAgICByZXR1cm4gaXNlY3RcblxuICAvL2lmIHRoZSB2ZWxvY2l0eSBpcyB6ZXJvLCBvciBpdCBkaWRuJ3QgaW50ZXJzZWN0IGFueSBsaW5lcyAob3V0c2lkZSB0aGUgYm94KVxuICAvL2p1c3Qgc2VuZCBpdCBpdCB0aGUgbmVhcmVzdCBib3VuZHJ5XG4gIGRpc3RYID0gKE1hdGguYWJzKHBvaW50LnggLSB0aGlzLmxlZnQpIDwgTWF0aC5hYnMocG9pbnQueCAtIHRoaXMucmlnaHQpKSA/IHRoaXMubGVmdCA6IHRoaXMucmlnaHRcbiAgZGlzdFkgPSAoTWF0aC5hYnMocG9pbnQueSAtIHRoaXMudG9wKSA8IE1hdGguYWJzKHBvaW50LnkgLSB0aGlzLmJvdHRvbSkpID8gdGhpcy50b3AgOiB0aGlzLmJvdHRvbVxuXG4gIHJldHVybiAoZGlzdFggPCBkaXN0WSkgPyBWZWN0b3IoZGlzdFgsIHBvaW50LnkpIDogVmVjdG9yKHBvaW50LngsIGRpc3RZKVxufVxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWIvYm91bmRyeS5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBCb2R5ID0gcmVxdWlyZSgnLi9ib2R5JylcbnZhciBzaW11bGF0aW9uID0gcmVxdWlyZSgnLi9zaW11bGF0aW9uJylcbnZhciBCb3VuZHJ5ID0gcmVxdWlyZSgnLi9ib3VuZHJ5JylcbnZhciBBbmltYXRpb24gPSByZXF1aXJlKCcuL2FuaW1hdGlvbicpXG5cbnZhciBEZWNlbGVyYXRlID0gbW9kdWxlLmV4cG9ydHMgPSBBbmltYXRpb24oe1xuICBkZWZhdWx0T3B0aW9uczoge1xuICAgIGRlY2VsZXJhdGlvbjogNDAwXG4gIH0sXG4gIG9uU3RhcnQ6IGZ1bmN0aW9uKHZlbG9jaXR5LCBmcm9tLCB0bywgb3B0cywgdXBkYXRlLCBkb25lKSB7XG4gICAgdmFyIGRpcmVjdGlvbiA9IHRvLnN1Yihmcm9tKS5ub3JtYWxpemUoKVxuICAgICAgLCBkZWNlbGVyYXRpb24gPSBkaXJlY3Rpb24ubXVsdChvcHRzLmRlY2VsZXJhdGlvbikubmVnYXRlKClcbiAgICAgICwgYm91bmRyeSA9IEJvdW5kcnkoe1xuICAgICAgbGVmdDogTWF0aC5taW4odG8ueCwgZnJvbS54KSxcbiAgICAgIHJpZ2h0OiBNYXRoLm1heCh0by54LCBmcm9tLngpLFxuICAgICAgdG9wOiBNYXRoLm1pbih0by55LCBmcm9tLnkpLFxuICAgICAgYm90dG9tOiBNYXRoLm1heCh0by55LCBmcm9tLnkpXG4gICAgfSlcblxuICAgIHZlbG9jaXR5ID0gZGlyZWN0aW9uLm11bHQodmVsb2NpdHkubm9ybSgpKVxuXG4gICAgdGhpcy5fYm9keSA9IEJvZHkodmVsb2NpdHksIGZyb20sIHtcbiAgICAgIGFjY2VsZXJhdGU6IGZ1bmN0aW9uKHMsIHQpIHtcbiAgICAgICAgcmV0dXJuIGRlY2VsZXJhdGlvblxuICAgICAgfSxcbiAgICAgIHVwZGF0ZTogZnVuY3Rpb24ocG9zaXRpb24sIHZlbG9jaXR5KSB7XG4gICAgICAgIGlmKCFkaXJlY3Rpb24uZGlyZWN0aW9uRXF1YWwodmVsb2NpdHkpKSB7XG4gICAgICAgICAgdXBkYXRlLmNhbmNlbChwb3NpdGlvbiwgeyB4OiAwLCB5OiAwIH0pXG4gICAgICAgIH0gZWxzZSBpZihib3VuZHJ5LmNvbnRhaW5zKHBvc2l0aW9uKSkge1xuICAgICAgICAgIHVwZGF0ZS5zdGF0ZShwb3NpdGlvbiwgdmVsb2NpdHkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlLmRvbmUodG8sIHZlbG9jaXR5KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgICBzaW11bGF0aW9uLmFkZEJvZHkodGhpcy5fYm9keSlcbiAgfSxcblxuICBvbkVuZDogZnVuY3Rpb24oKSB7XG4gICAgc2ltdWxhdGlvbi5yZW1vdmVCb2R5KHRoaXMuX2JvZHkpXG4gIH1cbn0pXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2RlY2VsZXJhdGUuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJ2NvbXBvbmVudC1lbWl0dGVyJylcbiAgLCBkZWZhdWx0cyA9IHJlcXVpcmUoJ2xvZGFzaC5kZWZhdWx0cycpXG5cbnZhciBkZWZhdWx0T3B0cyA9IHt9XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhZ1xuXG5mdW5jdGlvbiBEcmFnKHBoeXMsIG9wdHMsIHN0YXJ0KSB7XG4gIHZhciBoYW5kbGVzXG5cbiAgdGhpcy5fcGh5cyA9IHBoeXNcbiAgaWYodHlwZW9mIG9wdHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLl9zdGFydEZuID0gb3B0c1xuICAgIG9wdHMgPSB7fVxuICB9IGVsc2Uge1xuICAgIHRoaXMuX3N0YXJ0Rm4gPSBzdGFydFxuICB9XG5cbiAgdGhpcy5fb3B0cyA9IGRlZmF1bHRzKHt9LCBkZWZhdWx0T3B0cywgb3B0cylcbiAgaGFuZGxlcyA9IHRoaXMuX29wdHMuaGFuZGxlXG5cblxuICBpZihoYW5kbGVzICYmICFoYW5kbGVzLmxlbmd0aCkge1xuICAgIGhhbmRsZXMgPSBbaGFuZGxlc11cbiAgfSBlbHNlIGlmKGhhbmRsZXMgJiYgaGFuZGxlcy5sZW5ndGgpIHtcbiAgICBoYW5kbGVzID0gW10uc2xpY2UuY2FsbChoYW5kbGVzKVxuICB9IGVsc2Uge1xuICAgIGhhbmRsZXMgPSBwaHlzLmVsc1xuICB9XG4gIGhhbmRsZXMuZm9yRWFjaCh0aGlzLl9zZXR1cEhhbmRsZSwgdGhpcylcbn1cblxuRW1pdHRlcihEcmFnLnByb3RvdHlwZSlcblxuRHJhZy5wcm90b3R5cGUubW92ZWQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh0aGlzLl9pbnRlcmFjdGlvbi5kaXN0YW5jZSgpID4gMTApXG59XG5cbkRyYWcucHJvdG90eXBlLl9zZXR1cEhhbmRsZSA9IGZ1bmN0aW9uKGVsKSB7XG4gIC8vc3RhcnQgZXZlbnRzXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9zdGFydC5iaW5kKHRoaXMpKVxuICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9zdGFydC5iaW5kKHRoaXMpKVxuXG4gIC8vbW92ZSBldmVudHNcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5fbW92ZS5iaW5kKHRoaXMpKVxuICAvL2FwcGx5IHRoZSBtb3ZlIGV2ZW50IHRvIHRoZSB3aW5kb3csIHNvIGl0IGtlZXBzIG1vdmluZyxcbiAgLy9ldmVudCBpZiB0aGUgaGFuZGxlIGRvZXNuJ3RcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX21vdmUuYmluZCh0aGlzKSlcblxuICAvL2VuZCBldmVudHNcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl9lbmQuYmluZCh0aGlzKSlcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9lbmQuYmluZCh0aGlzKSlcbn1cblxuRHJhZy5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24oZXZ0KSB7XG4gIHRoaXMuX3N0YXJ0VGltZSA9IERhdGUubm93KClcbiAgZXZ0LnByZXZlbnREZWZhdWx0KClcbiAgdGhpcy5fbW91c2Vkb3duID0gdHJ1ZVxuICB0aGlzLl9pbnRlcmFjdGlvbiA9IHRoaXMuX3BoeXMuaW50ZXJhY3Qoe1xuICAgIGJvdW5kcnk6IHRoaXMuX29wdHMuYm91bmRyeSxcbiAgICBkYW1waW5nOiB0aGlzLl9vcHRzLmRhbXBpbmcsXG4gICAgZGlyZWN0aW9uOiB0aGlzLl9vcHRzLmRpcmVjdGlvblxuICB9KVxuICB2YXIgcHJvbWlzZSA9IHRoaXMuX2ludGVyYWN0aW9uLnN0YXJ0KGV2dClcbiAgdGhpcy5fc3RhcnRGbiAmJiB0aGlzLl9zdGFydEZuKHByb21pc2UpXG4gIHRoaXMuZW1pdCgnc3RhcnQnLCBldnQpXG59XG5cbkRyYWcucHJvdG90eXBlLl9tb3ZlID0gZnVuY3Rpb24oZXZ0KSB7XG4gIGlmKCF0aGlzLl9tb3VzZWRvd24pIHJldHVyblxuICBldnQucHJldmVudERlZmF1bHQoKVxuXG4gIHRoaXMuX2ludGVyYWN0aW9uLnVwZGF0ZShldnQpXG4gIHRoaXMuZW1pdCgnbW92ZScsIGV2dClcbn1cblxuRHJhZy5wcm90b3R5cGUuX2VuZCA9IGZ1bmN0aW9uKGV2dCkge1xuICBpZighdGhpcy5fbW91c2Vkb3duKSByZXR1cm5cbiAgZXZ0LnByZXZlbnREZWZhdWx0KClcblxuICB0aGlzLl9tb3VzZWRvd24gPSBmYWxzZVxuXG4gIHRoaXMuX2ludGVyYWN0aW9uLmVuZCgpXG4gIHRoaXMuZW1pdCgnZW5kJywgZXZ0KVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9kcmFnLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIHNpbXVsYXRpb24gPSByZXF1aXJlKCcuL3NpbXVsYXRpb24nKVxudmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJylcbnZhciBSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKVxudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnbG9kYXNoLmRlZmF1bHRzJylcbnZhciBTcHJpbmcgPSByZXF1aXJlKCcuL3NwcmluZycpXG52YXIgQXR0YWNoU3ByaW5nID0gcmVxdWlyZSgnLi9hdHRhY2gtc3ByaW5nJylcbnZhciBEZWNlbGVyYXRlID0gcmVxdWlyZSgnLi9kZWNlbGVyYXRlJylcbnZhciBBY2NlbGVyYXRlID0gcmVxdWlyZSgnLi9hY2NlbGVyYXRlJylcbnZhciBEcmFnID0gcmVxdWlyZSgnLi9kcmFnJylcbnZhciBJbnRlcmFjdCA9IHJlcXVpcmUoJy4vaW50ZXJhY3QnKVxudmFyIEJvdW5kcnkgPSByZXF1aXJlKCcuL2JvdW5kcnknKVxudmFyIFByb21pc2UgPSB3aW5kb3cuUHJvbWlzZSB8fCByZXF1aXJlKCdwcm9taXNlJylcblxubW9kdWxlLmV4cG9ydHMgPSBQaHlzaWNzXG5cbmZ1bmN0aW9uIFBoeXNpY3MocmVuZGVyZXJPckVscykge1xuICBpZighKHRoaXMgaW5zdGFuY2VvZiBQaHlzaWNzKSkge1xuICAgIHJldHVybiBuZXcgUGh5c2ljcyhyZW5kZXJlck9yRWxzKVxuICB9XG4gIGlmKHR5cGVvZiByZW5kZXJlck9yRWxzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5fcmVuZGVyID0gcmVuZGVyZXJPckVsc1xuICAgIHRoaXMuZWxzID0gW11cbiAgfSBlbHNlIHtcbiAgICBpZihyZW5kZXJlck9yRWxzLmxlbmd0aClcbiAgICAgIHRoaXMuZWxzID0gW10uc2xpY2UuY2FsbChyZW5kZXJlck9yRWxzKVxuICAgIGVsc2VcbiAgICAgIHRoaXMuZWxzID0gW3JlbmRlcmVyT3JFbHNdXG5cbiAgICB0aGlzLl9yZW5kZXJlciA9IG5ldyBSZW5kZXJlcih0aGlzLmVscylcbiAgICB0aGlzLl9yZW5kZXIgPSB0aGlzLl9yZW5kZXJlci51cGRhdGUuYmluZCh0aGlzLl9yZW5kZXJlcilcbiAgfVxuXG4gIHRoaXMuX3Bvc2l0aW9uID0gVmVjdG9yKDAsIDApXG4gIHRoaXMuX3ZlbG9jaXR5ID0gVmVjdG9yKDAsIDApXG59XG5cblBoeXNpY3MuQm91bmRyeSA9IEJvdW5kcnlcblBoeXNpY3MuVmVjdG9yID0gVmVjdG9yXG5QaHlzaWNzLlByb21pc2UgPSBQcm9taXNlXG5cblBoeXNpY3MucHJvdG90eXBlLnN0eWxlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX3JlbmRlcmVyLnN0eWxlLmFwcGx5KHRoaXMuX3JlbmRlcmVyLCBhcmd1bWVudHMpXG4gIHJldHVybiB0aGlzXG59XG5cblBoeXNpY3MucHJvdG90eXBlLnZpc2libGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fcmVuZGVyZXIudmlzaWJsZS5hcHBseSh0aGlzLl9yZW5kZXJlciwgYXJndW1lbnRzKVxuICByZXR1cm4gdGhpc1xufVxuXG5QaHlzaWNzLnByb3RvdHlwZS5kaXJlY3Rpb24gPSBmdW5jdGlvbihkKSB7XG4gIHZhciB2ZWxvY2l0eSA9IHRoaXMudmVsb2NpdHkoKVxuICAgICwgaCwgdiwgY1xuXG4gIGlmKHZlbG9jaXR5LnggPCAwKSAgICAgIGggPSAnbGVmdCdcbiAgZWxzZSBpZih2ZWxvY2l0eS54ID4gMCkgaCA9ICdyaWdodCdcblxuICBpZih2ZWxvY2l0eS55IDwgMCkgICAgICB2ID0gJ3VwJ1xuICBlbHNlIGlmKHZlbG9jaXR5LnkgPiAwKSB2ID0gJ2Rvd24nXG5cbiAgdmFyIGMgPSBoICsgKHYgfHwgJycpLnRvVXBwZXJDYXNlKClcblxuICByZXR1cm4gZCA9PT0gaCB8fCBkID09PSB2IHx8IGQgPT09IGNcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuYXRSZXN0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2ZWxvY2l0eSA9IHRoaXMudmVsb2NpdHkoKVxuICByZXR1cm4gdmVsb2NpdHkueCA9PT0gMCAmJiB2ZWxvY2l0eS55ID09PSAwXG59XG5cblBoeXNpY3MucHJvdG90eXBlLl9zdGFydEFuaW1hdGlvbiA9IGZ1bmN0aW9uKGFuaW1hdGlvbikge1xuICBpZih0aGlzLl9jdXJyZW50QW5pbWF0aW9uICYmIHRoaXMuX2N1cnJlbnRBbmltYXRpb24ucnVubmluZygpKSB7XG4gICAgdGhpcy5fY3VycmVudEFuaW1hdGlvbi5jYW5jZWwoKVxuICB9XG4gIHRoaXMuX2N1cnJlbnRBbmltYXRpb24gPSBhbmltYXRpb25cbn1cblxuUGh5c2ljcy5wcm90b3R5cGUudmVsb2NpdHkgPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fdmVsb2NpdHlcbiAgdGhpcy5fdmVsb2NpdHkgPSBWZWN0b3IoeCwgeSlcbiAgcmV0dXJuIHRoaXNcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUucG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fcG9zaXRpb24uY2xvbmUoKVxuICB0aGlzLl9wb3NpdGlvbiA9IFZlY3Rvcih4LCB5KVxuICB0aGlzLl9yZW5kZXIodGhpcy5fcG9zaXRpb24ueCwgdGhpcy5fcG9zaXRpb24ueSlcbiAgcmV0dXJuIHRoaXNcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuaW50ZXJhY3QgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHJldHVybiBuZXcgSW50ZXJhY3QodGhpcywgb3B0cylcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuZHJhZyA9IGZ1bmN0aW9uKG9wdHMsIHN0YXJ0KSB7XG4gIHJldHVybiBuZXcgRHJhZyh0aGlzLCBvcHRzLCBzdGFydClcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuc3ByaW5nID0gZnVuY3Rpb24ob3B0cykge1xuICByZXR1cm4gbmV3IFNwcmluZyh0aGlzLCBvcHRzKVxufVxuXG5QaHlzaWNzLnByb3RvdHlwZS5kZWNlbGVyYXRlID0gZnVuY3Rpb24ob3B0cykge1xuICByZXR1cm4gbmV3IERlY2VsZXJhdGUodGhpcywgb3B0cylcbn1cblxuUGh5c2ljcy5wcm90b3R5cGUuYWNjZWxlcmF0ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgcmV0dXJuIG5ldyBBY2NlbGVyYXRlKHRoaXMsIG9wdHMpXG59XG5cblBoeXNpY3MucHJvdG90eXBlLmF0dGFjaFNwcmluZyA9IGZ1bmN0aW9uKGF0dGFjaG1lbnQsIG9wdHMpIHtcbiAgcmV0dXJuIG5ldyBBdHRhY2hTcHJpbmcodGhpcywgYXR0YWNobWVudCwgb3B0cylcbn1cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnbG9kYXNoLmRlZmF1bHRzJylcbnZhciBWZWxvY2l0eSA9IHJlcXVpcmUoJ3RvdWNoLXZlbG9jaXR5JylcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ1Byb21pc2UnKVxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIEJvdW5kcnkgPSByZXF1aXJlKCcuL2JvdW5kcnknKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyYWN0XG5cbnZhciBkZWZhdWx0T3B0cyA9IHtcbiAgYm91bmRyeTogQm91bmRyeSh7fSksXG4gIGRhbXBpbmc6IDAsXG4gIGRpcmVjdGlvbjogJ2JvdGgnXG59XG5cbmZ1bmN0aW9uIEludGVyYWN0KHBoeXMsIG9wdHMpIHtcbiAgdGhpcy5fcGh5cyA9IHBoeXNcbiAgdGhpcy5fcnVubmluZyA9IGZhbHNlXG4gIHRoaXMuX29wdHMgPSBkZWZhdWx0cyh7fSwgb3B0cywgZGVmYXVsdE9wdHMpXG59XG5cbkludGVyYWN0LnByb3RvdHlwZS5wb3NpdGlvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgdmFyIGRpcmVjdGlvbiA9IHRoaXMuX29wdHMuZGlyZWN0aW9uXG4gICAgLCBib3VuZHJ5ID0gdGhpcy5fb3B0cy5ib3VuZHJ5XG4gICAgLCBwb3MgPSBWZWN0b3IoeCwgeSlcblxuICBpZihkaXJlY3Rpb24gIT09ICdib3RoJyAmJiBkaXJlY3Rpb24gIT09ICdob3Jpem9udGFsJykgcG9zLnggPSAwXG4gIGlmKGRpcmVjdGlvbiAhPT0gJ2JvdGgnICYmIGRpcmVjdGlvbiAhPT0gJ3ZlcnRpY2FsJykgcG9zLnkgPSAwXG5cbiAgdGhpcy5fdmVsb1gudXBkYXRlUG9zaXRpb24ocG9zLngpXG4gIHRoaXMuX3ZlbG9ZLnVwZGF0ZVBvc2l0aW9uKHBvcy55KVxuXG4gIHRoaXMuX3BoeXMudmVsb2NpdHkodGhpcy5fdmVsb1guZ2V0VmVsb2NpdHkoKSwgdGhpcy5fdmVsb1kuZ2V0VmVsb2NpdHkoKSlcblxuICBwb3MgPSBib3VuZHJ5LmFwcGx5RGFtcGluZyhwb3MsIHRoaXMuX29wdHMuZGFtcGluZylcblxuICB0aGlzLl9waHlzLnBvc2l0aW9uKHBvcylcblxuICByZXR1cm4gdGhpc1xufVxuXG5JbnRlcmFjdC5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oZXZ0KSB7XG4gIC8vZm9yIGpxdWVyeSBhbmQgaGFtbWVyLmpzXG4gIGV2dCA9IGV2dC5vcmlnaW5hbEV2ZW50IHx8IGV2dFxuICB2YXIgcG9zaXRpb24gPSB1dGlsLmV2ZW50VmVjdG9yKGV2dCkuc3ViKHRoaXMuX3N0YXJ0UG9zaXRpb24pXG5cbiAgdGhpcy5wb3NpdGlvbihwb3NpdGlvbilcbiAgcmV0dXJuIHRoaXNcbn1cblxuSW50ZXJhY3QucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oZXZ0KSB7XG4gIHZhciB0aGF0ID0gdGhpc1xuICAgICwgZXZ0UG9zaXRpb24gPSBldnQgJiYgdXRpbC5ldmVudFZlY3RvcihldnQpXG4gICAgLCBwb3NpdGlvbiA9IHRoaXMuX3BoeXMucG9zaXRpb24oKVxuXG4gIHRoaXMuX3J1bm5pbmcgPSB0cnVlXG4gIHRoaXMuX3BoeXMuX3N0YXJ0QW5pbWF0aW9uKHRoaXMpXG4gIHRoaXMuX3N0YXJ0UG9zaXRpb24gPSBldnQgJiYgZXZ0UG9zaXRpb24uc3ViKHBvc2l0aW9uKVxuICB0aGlzLl9pbml0aWFsUG9zaXRpb24gPSB0aGlzLl9waHlzLnBvc2l0aW9uKClcblxuICB0aGlzLl92ZWxvWCA9IG5ldyBWZWxvY2l0eSgpXG4gIHRoaXMuX3ZlbG9ZID0gbmV3IFZlbG9jaXR5KClcblxuICB0aGlzLnBvc2l0aW9uKHBvc2l0aW9uKVxuXG4gIHJldHVybiB0aGlzLl9lbmRlZCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlcywgcmVqKSB7XG4gICAgdGhhdC5fcmVzb2x2ZSA9IHJlc1xuICAgIHRoYXQuX3JlamVjdCA9IHJlalxuICB9KVxufVxuXG5JbnRlcmFjdC5wcm90b3R5cGUuZGlzdGFuY2UgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuX2luaXRpYWxQb3NpdGlvbi5zdWIodGhpcy5fcGh5cy5wb3NpdGlvbigpKS5ub3JtKClcbn1cblxuSW50ZXJhY3QucHJvdG90eXBlLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9ydW5uaW5nID0gZmFsc2VcbiAgdGhpcy5fcmVqZWN0KG5ldyBFcnJvcignQ2FuY2VsZWQgdGhlIGludGVyYWN0aW9uJykpXG59XG5cbkludGVyYWN0LnByb3RvdHlwZS5ydW5uaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9ydW5uaW5nXG59XG5cbkludGVyYWN0LnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fcGh5cy52ZWxvY2l0eSh0aGlzLl92ZWxvWC5nZXRWZWxvY2l0eSgpLCB0aGlzLl92ZWxvWS5nZXRWZWxvY2l0eSgpKVxuICB0aGlzLl9yZXNvbHZlKHsgdmVsb2NpdHk6IHRoaXMuX3BoeXMudmVsb2NpdHkoKSwgcG9zaXRpb246IHRoaXMuX3BoeXMucG9zaXRpb24oKSB9KVxuICByZXR1cm4gdGhpcy5fZW5kZWRcbn1cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL2ludGVyYWN0LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIHByZWZpeGVzID0gWydXZWJraXQnLCAnTW96JywgJ01zJywgJ21zJ11cbnZhciBjYWxscyA9IFtdXG52YXIgdHJhbnNmb3JtUHJvcCA9IHByZWZpeGVkKCd0cmFuc2Zvcm0nKVxudmFyIHJhZiA9IHJlcXVpcmUoJ3JhZicpXG5cbmZ1bmN0aW9uIGxvb3AoKSB7XG4gIHJhZihmdW5jdGlvbigpIHtcbiAgICBsb29wKClcbiAgICBmb3IodmFyIGkgPSBjYWxscy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY2FsbHNbaV0oKVxuICAgIH1cbiAgfSlcbn1cbmxvb3AoKVxuXG5mdW5jdGlvbiBwcmVmaXhlZChwcm9wKSB7XG4gIHZhciBwcmVmaXhlZFxuICBmb3IgKHZhciBpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgcHJlZml4ZWQgPSBwcmVmaXhlc1tpXSArIHByb3BbMF0udG9VcHBlckNhc2UoKSArIHByb3Auc2xpY2UoMSlcbiAgICBpZih0eXBlb2YgZG9jdW1lbnQuYm9keS5zdHlsZVtwcmVmaXhlZF0gIT09ICd1bmRlZmluZWQnKVxuICAgICAgcmV0dXJuIHByZWZpeGVkXG4gIH1cbiAgcmV0dXJuIHByb3Bcbn1cblxudmFyIHRyYW5zZm9ybXNQcm9wZXJ0aWVzID0gWyd0cmFuc2xhdGUnLCAndHJhbnNsYXRlWCcsICd0cmFuc2xhdGVZJywgJ3RyYW5zbGF0ZVonLFxuICAgICAgICAgICAgICAgICAgJ3JvdGF0ZScsICdyb3RhdGVYJywgJ3JvdGF0ZVknLCAncm90YXRlWicsXG4gICAgICAgICAgICAgICAgICAnc2NhbGUnLCAnc2NhbGVYJywgJ3NjYWxlWScsICdzY2FsZVonLFxuICAgICAgICAgICAgICAgICAgJ3NrZXcnLCAnc2tld1gnLCAnc2tld1knLCAnc2tld1onXVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyXG5cbmZ1bmN0aW9uIFJlbmRlcmVyKGVscykge1xuICBpZih0eXBlb2YgZWxzLmxlbmd0aCA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgZWxzID0gW2Vsc11cbiAgdGhpcy5lbHMgPSBlbHNcbiAgdGhpcy5zdHlsZXMgPSB7fVxuICB0aGlzLmludmlzaWJsZUVscyA9IFtdXG4gIGNhbGxzLnB1c2godGhpcy5yZW5kZXIuYmluZCh0aGlzKSlcbn1cblxuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICBpZighdGhpcy5jdXJyZW50UG9zaXRpb24pIHJldHVyblxuICB2YXIgdHJhbnNmb3Jtc1RvQXBwbHlcbiAgICAsIGVscyA9IHRoaXMuZWxzXG4gICAgLCBwb3NpdGlvbiA9IHRoaXMuY3VycmVudFBvc2l0aW9uXG4gICAgLCBzdHlsZXMgPSB0aGlzLnN0eWxlc1xuICAgICwgdmFsdWVcbiAgICAsIHByb3BzID0gT2JqZWN0LmtleXMoc3R5bGVzKVxuICAgICwgZWxzTGVuZ3RoID0gZWxzLmxlbmd0aFxuICAgICwgcHJvcHNMZW5ndGggPSBwcm9wcy5sZW5ndGhcbiAgICAsIGksIGpcbiAgICAsIHRyYW5zZm9ybXNcblxuICBmb3IoaSA9IDAgOyBpIDwgZWxzTGVuZ3RoIDsgaSsrKSB7XG4gICAgdHJhbnNmb3Jtc1RvQXBwbHkgPSBbXVxuICAgIGlmKHRoaXMudmlzaWJsZUZuICYmICF0aGlzLnZpc2libGVGbihwb3NpdGlvbiwgaSkpIHtcbiAgICAgIGlmKCF0aGlzLmludmlzaWJsZUVsc1tpXSkge1xuICAgICAgICBlbHNbaV0uc3R5bGUud2Via2l0VHJhbnNmb3JtID0gJ3RyYW5zbGF0ZTNkKDAsIC05OTk5OXB4LCAwKSdcbiAgICAgIH1cbiAgICAgIHRoaXMuaW52aXNpYmxlRWxzW2ldID0gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmludmlzaWJsZUVsc1tpXSA9IGZhbHNlXG4gICAgICBmb3IgKGogPSAwOyBqIDwgcHJvcHNMZW5ndGg7IGorKykge1xuICAgICAgICBwcm9wID0gcHJvcHNbal1cbiAgICAgICAgdmFsdWUgPSAodHlwZW9mIHN0eWxlc1twcm9wXSA9PT0gJ2Z1bmN0aW9uJykgPyBzdHlsZXNbcHJvcF0ocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgaSkgOiBzdHlsZXNbcHJvcF1cblxuICAgICAgICBpZih0cmFuc2Zvcm1zUHJvcGVydGllcy5pbmRleE9mKHByb3ApICE9PSAtMSkge1xuICAgICAgICAgIHRyYW5zZm9ybXNUb0FwcGx5LnB1c2gocHJvcCArICcoJyArIHZhbHVlICsgJyknKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsc1tpXS5zdHlsZVtwcm9wXSA9IHZhbHVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRyYW5zZm9ybXMgPSB0cmFuc2Zvcm1zVG9BcHBseS5qb2luKCcgJylcbiAgICAgIHRyYW5zZm9ybXMgKz0gJyB0cmFuc2xhdGVaKDApJ1xuICAgICAgZWxzW2ldLnN0eWxlW3RyYW5zZm9ybVByb3BdID0gdHJhbnNmb3Jtc1xuICAgIH1cbiAgfVxufVxuXG5SZW5kZXJlci5wcm90b3R5cGUuc3R5bGUgPSBmdW5jdGlvbihwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgaWYodHlwZW9mIHByb3BlcnR5ID09PSAnb2JqZWN0Jykge1xuICAgIGZvcihwcm9wIGluIHByb3BlcnR5KSB7XG4gICAgICBpZihwcm9wZXJ0eS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICB0aGlzLnN0eWxlKHByb3AsIHByb3BlcnR5W3Byb3BdKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB0aGlzLnN0eWxlc1twcm9wZXJ0eV0gPSB2YWx1ZVxuICByZXR1cm4gdGhpc1xufVxuXG5SZW5kZXJlci5wcm90b3R5cGUudmlzaWJsZSA9IGZ1bmN0aW9uKGlzVmlzaWJsZSkge1xuICB0aGlzLnZpc2libGVGbiA9IGlzVmlzaWJsZVxuICByZXR1cm4gdGhpc1xufVxuUmVuZGVyZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgdGhpcy5jdXJyZW50UG9zaXRpb24gPSB7IHg6IHgsIHk6IHkgfVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9yZW5kZXJlci5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG4gICwgYm9kaWVzID0gW11cblxuZnVuY3Rpb24gaW5jcmVtZW50KGEsIGIsIGMsIGQpIHtcbiAgdmFyIHZlYyA9IFZlY3RvcigwLCAwKVxuICB2ZWMuc2VsZkFkZChhKVxuICB2ZWMuc2VsZkFkZChiLmFkZChjKS5zZWxmTXVsdCgyKSlcbiAgdmVjLnNlbGZBZGQoZClcbiAgdmVjLnNlbGZNdWx0KDEvNilcbiAgcmV0dXJuIHZlY1xufVxuXG52YXIgcG9zaXRpb25WZWMgPSBWZWN0b3IoMCwgMClcbnZhciB2ZWxvY2l0eVZlYyA9IFZlY3RvcigwLCAwKVxuXG5mdW5jdGlvbiBldmFsdWF0ZShpbml0aWFsLCB0LCBkdCwgZCkge1xuICB2YXIgc3RhdGUgPSB7fVxuXG4gIHN0YXRlLnBvc2l0aW9uID0gcG9zaXRpb25WZWMuc2V0dihkLmR4KS5zZWxmTXVsdChkdCkuc2VsZkFkZChpbml0aWFsLnBvc2l0aW9uKVxuICBzdGF0ZS52ZWxvY2l0eSA9IHZlbG9jaXR5VmVjLnNldHYoZC5kdikuc2VsZk11bHQoZHQpLnNlbGZBZGQoaW5pdGlhbC52ZWxvY2l0eSlcblxuICB2YXIgbmV4dCA9IHtcbiAgICBkeDogc3RhdGUudmVsb2NpdHkuY2xvbmUoKSxcbiAgICBkdjogaW5pdGlhbC5hY2NlbGVyYXRlKHN0YXRlLCB0KS5jbG9uZSgpXG4gIH1cbiAgcmV0dXJuIG5leHRcbn1cblxudmFyIGRlciA9IHsgZHg6IFZlY3RvcigwLCAwKSwgZHY6IFZlY3RvcigwLCAwKSB9XG5mdW5jdGlvbiBpbnRlZ3JhdGUoc3RhdGUsIHQsIGR0KSB7XG4gICAgdmFyIGEgPSBldmFsdWF0ZSggc3RhdGUsIHQsIDAsIGRlciApXG4gICAgdmFyIGIgPSBldmFsdWF0ZSggc3RhdGUsIHQsIGR0KjAuNSwgYSApXG4gICAgdmFyIGMgPSBldmFsdWF0ZSggc3RhdGUsIHQsIGR0KjAuNSwgYiApXG4gICAgdmFyIGQgPSBldmFsdWF0ZSggc3RhdGUsIHQsIGR0LCBjIClcblxuICAgIHZhciBkeGR0ID0gaW5jcmVtZW50KGEuZHgsYi5keCxjLmR4LGQuZHgpXG4gICAgICAsIGR2ZHQgPSBpbmNyZW1lbnQoYS5kdixiLmR2LGMuZHYsZC5kdilcblxuICAgIHN0YXRlLnBvc2l0aW9uLnNlbGZBZGQoZHhkdC5zZWxmTXVsdChkdCkpO1xuICAgIHN0YXRlLnZlbG9jaXR5LnNlbGZBZGQoZHZkdC5zZWxmTXVsdChkdCkpO1xufVxuXG52YXIgY3VycmVudFRpbWUgPSBEYXRlLm5vdygpIC8gMTAwMFxuICAsIGFjY3VtdWxhdG9yID0gMFxuICAsIHQgPSAwXG4gICwgZHQgPSAwLjAxNVxuXG5mdW5jdGlvbiBzaW11bGF0ZSgpIHtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIHNpbXVsYXRlKClcbiAgICB2YXIgbmV3VGltZSA9IERhdGUubm93KCkgLyAxMDAwXG4gICAgdmFyIGZyYW1lVGltZSA9IG5ld1RpbWUgLSBjdXJyZW50VGltZVxuICAgIGN1cnJlbnRUaW1lID0gbmV3VGltZVxuXG4gICAgaWYoZnJhbWVUaW1lID4gMC4wNSlcbiAgICAgIGZyYW1lVGltZSA9IDAuMDVcblxuXG4gICAgYWNjdW11bGF0b3IgKz0gZnJhbWVUaW1lXG5cbiAgICB2YXIgaiA9IDBcblxuICAgIHdoaWxlKGFjY3VtdWxhdG9yID49IGR0KSB7XG4gICAgICBmb3IodmFyIGkgPSAwIDsgaSA8IGJvZGllcy5sZW5ndGggOyBpKyspIHtcbiAgICAgICAgYm9kaWVzW2ldLnByZXZpb3VzUG9zaXRpb24gPSBib2RpZXNbaV0ucG9zaXRpb24uY2xvbmUoKVxuICAgICAgICBpbnRlZ3JhdGUoYm9kaWVzW2ldLCB0LCBkdClcbiAgICAgIH1cbiAgICAgIHQgKz0gZHRcbiAgICAgIGFjY3VtdWxhdG9yIC09IGR0XG4gICAgfVxuXG4gICAgZm9yKHZhciBpID0gMCA7IGkgPCBib2RpZXMubGVuZ3RoIDsgaSsrKSB7XG4gICAgICBib2RpZXNbaV0udXBkYXRlKGFjY3VtdWxhdG9yIC8gZHQpXG4gICAgfVxuICB9LCAxNilcbn1cbnNpbXVsYXRlKClcblxubW9kdWxlLmV4cG9ydHMuYWRkQm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgYm9kaWVzLnB1c2goYm9keSlcbiAgcmV0dXJuIGJvZHlcbn1cblxubW9kdWxlLmV4cG9ydHMucmVtb3ZlQm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgdmFyIGluZGV4ID0gYm9kaWVzLmluZGV4T2YoYm9keSlcbiAgaWYoaW5kZXggPj0gMClcbiAgICBib2RpZXMuc3BsaWNlKGluZGV4LCAxKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9zaW11bGF0aW9uLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIEJvZHkgPSByZXF1aXJlKCcuL2JvZHknKVxudmFyIHNpbXVsYXRpb24gPSByZXF1aXJlKCcuL3NpbXVsYXRpb24nKVxudmFyIEJvdW5kcnkgPSByZXF1aXJlKCcuL2JvdW5kcnknKVxudmFyIEFuaW1hdGlvbiA9IHJlcXVpcmUoJy4vYW5pbWF0aW9uJylcblxudmFyIFNwcmluZyA9IG1vZHVsZS5leHBvcnRzID0gQW5pbWF0aW9uKHtcbiAgZGVmYXVsdE9wdGlvbnM6IHtcbiAgICB0ZW5zaW9uOiAxMDAsXG4gICAgZGFtcGluZzogMTBcbiAgfSxcbiAgb25TdGFydDogZnVuY3Rpb24odmVsb2NpdHksIGZyb20sIHRvLCBvcHRzLCB1cGRhdGUpIHtcbiAgICB2YXIgYm9keSA9IHRoaXMuX2JvZHkgPSBuZXcgQm9keSh2ZWxvY2l0eSwgZnJvbSwge1xuICAgICAgYWNjZWxlcmF0ZTogZnVuY3Rpb24oc3RhdGUsIHQpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLnBvc2l0aW9uLnNlbGZTdWIodG8pXG4gICAgICAgICAgLnNlbGZNdWx0KC1vcHRzLnRlbnNpb24pXG4gICAgICAgICAgLnNlbGZTdWIoc3RhdGUudmVsb2NpdHkubXVsdChvcHRzLmRhbXBpbmcpKVxuICAgICAgfSxcbiAgICAgIHVwZGF0ZTogZnVuY3Rpb24ocG9zaXRpb24sIHZlbG9jaXR5KSB7XG4gICAgICAgIGlmKGJvZHkuYXRSZXN0KCkgJiYgYm9keS5hdFBvc2l0aW9uKHRvKSkge1xuICAgICAgICAgIHVwZGF0ZS5kb25lKHRvLCB7IHg6IDAsIHk6IDAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGUuc3RhdGUocG9zaXRpb24sIHZlbG9jaXR5KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgICBzaW11bGF0aW9uLmFkZEJvZHkodGhpcy5fYm9keSlcbiAgfSxcbiAgb25FbmQ6IGZ1bmN0aW9uKCkge1xuICAgIHNpbXVsYXRpb24ucmVtb3ZlQm9keSh0aGlzLl9ib2R5KVxuICB9XG59KVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi9zcHJpbmcuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKVxuZnVuY3Rpb24gdmVydGV4KGEsIGIpIHtcbiAgcmV0dXJuIC1iIC8gKDIgKiBhKVxufVxuXG5mdW5jdGlvbiBoZWlnaHQoYSwgYiwgYykge1xuICByZXR1cm4gcGFyYWJvbGEoYSwgYiwgYywgdmVydGV4KGEsIGIpKVxufVxuXG5mdW5jdGlvbiBwYXJhYm9sYShhLCBiLCBjLCB4KSB7XG4gIHJldHVybiBhICogeCAqIHggKyBiICogeCArIGNcbn1cblxuZnVuY3Rpb24gZXZlbnRWZWN0b3IoZXZ0KSB7XG4gIHJldHVybiBWZWN0b3Ioe1xuICAgIHg6IGV2dC50b3VjaGVzICYmIGV2dC50b3VjaGVzWzBdLnBhZ2VYIHx8IGV2dC5wYWdlWCxcbiAgICB5OiBldnQudG91Y2hlcyAmJiBldnQudG91Y2hlc1swXS5wYWdlWSB8fCBldnQucGFnZVlcbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMuaGVpZ2h0ID0gaGVpZ2h0XG5tb2R1bGUuZXhwb3J0cy5ldmVudFZlY3RvciA9IGV2ZW50VmVjdG9yXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYi91dGlsLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3JcblxuZnVuY3Rpb24gVmVjdG9yKHgsIHkpIHtcbiAgaWYoISh0aGlzIGluc3RhbmNlb2YgVmVjdG9yKSlcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5KVxuXG4gIGlmKHR5cGVvZiB4LnggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhpcy54ID0geC54XG4gICAgdGhpcy55ID0geC55XG4gIH0gZWxzZSB7XG4gICAgdGhpcy54ID0geCB8fCAwXG4gICAgdGhpcy55ID0geSB8fCAwXG4gIH1cbn1cblxuVmVjdG9yLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbih2ZWMpIHtcbiAgcmV0dXJuIHZlYy54ID09PSB0aGlzLnggJiYgdmVjLnkgPT09IHRoaXMueVxufVxuXG5WZWN0b3IucHJvdG90eXBlLmRpcmVjdGlvbkVxdWFsID0gZnVuY3Rpb24odmVjKSB7XG4gIHJldHVybiB2ZWMueCA+IDAgPT09IHRoaXMueCA+IDAgJiYgdGhpcy55ID4gMCA9PT0gdmVjLnkgPiAwXG59XG5cblZlY3Rvci5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24gKHZlYykge1xuICByZXR1cm4gdGhpcy54ICogdmVjLnggKyB0aGlzLnkgKiB2ZWMueTtcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5uZWdhdGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFZlY3Rvcih0aGlzLngsIHRoaXMueSkubXVsdCgtMSlcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5ub3JtID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBNYXRoLnNxcnQodGhpcy5ub3Jtc3EoKSlcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gVmVjdG9yKHRoaXMueCwgdGhpcy55KVxufVxuXG5WZWN0b3IucHJvdG90eXBlLm5vcm1zcSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55XG59XG5cblZlY3Rvci5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1hZ25pdHVkZSA9IHRoaXMubm9ybSgpXG5cbiAgICBpZihtYWduaXR1ZGUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICBtYWduaXR1ZGUgPSAxIC8gbWFnbml0dWRlXG5cbiAgICB0aGlzLnggKj0gbWFnbml0dWRlXG4gICAgdGhpcy55ICo9IG1hZ25pdHVkZVxuXG4gICAgcmV0dXJuIHRoaXNcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5tdWx0ID0gZnVuY3Rpb24oeCwgeSkge1xuICBpZih4IGluc3RhbmNlb2YgVmVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeC54ICogdGhpcy54LCB4LnkgKiB0aGlzLnkpXG4gIH1cbiAgaWYodHlwZW9mIHkgPT09ICd1bmRlZmluZWQnKSB7IC8vc2NhbGFyXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCAqIHRoaXMueCwgeCAqIHRoaXMueSlcbiAgfVxuICByZXR1cm4gbmV3IFZlY3Rvcih4ICogdGhpcy54LCB5ICogdGhpcy55KVxufVxuXG5WZWN0b3IucHJvdG90eXBlLnNlbGZNdWx0ID0gZnVuY3Rpb24oeCwgeSkge1xuICBpZih4IGluc3RhbmNlb2YgVmVjdG9yKSB7XG4gICAgdGhpcy54ICo9IHgueFxuICAgIHRoaXMueSAqPSB4LnlcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIGlmKHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJykgeyAvL3NjYWxhclxuICAgIHRoaXMueCAqPSB4XG4gICAgdGhpcy55ICo9IHhcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIHRoaXMueCAqPSB4XG4gIHRoaXMueSAqPSB5XG4gIHJldHVybiB0aGlzXG59XG5cblZlY3Rvci5wcm90b3R5cGUuc2VsZkFkZCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgaWYodHlwZW9mIHgueCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aGlzLnggKz0geC54XG4gICAgdGhpcy55ICs9IHgueVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgaWYodHlwZW9mIHkgPT09ICd1bmRlZmluZWQnKSB7IC8vc2NhbGFyXG4gICAgdGhpcy54ICs9IHhcbiAgICB0aGlzLnkgKz0geFxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgdGhpcy54ICs9IHhcbiAgdGhpcy55ICs9IHlcbiAgcmV0dXJuIHRoaXNcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5zZWxmU3ViID0gZnVuY3Rpb24oeCwgeSkge1xuICBpZih0eXBlb2YgeC54ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHRoaXMueCAtPSB4LnhcbiAgICB0aGlzLnkgLT0geC55XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBpZih0eXBlb2YgeSA9PT0gJ3VuZGVmaW5lZCcpIHsgLy9zY2FsYXJcbiAgICB0aGlzLnggLT0geFxuICAgIHRoaXMueSAtPSB4XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICB0aGlzLnggLT0geFxuICB0aGlzLnkgLT0geVxuXG4gIHJldHVybiB0aGlzXG59XG5cblZlY3Rvci5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24oeCwgeSkge1xuXG4gIGlmKHR5cGVvZiB4LnggIT09ICd1bmRlZmluZWQnKVxuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAtIHgueCwgdGhpcy55IC0geC55KVxuXG4gIGlmKHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJykvL3NjYWxhclxuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAtIHgsIHRoaXMueSAtIHgpXG5cbiAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54IC0geCwgdGhpcy55IC0geSlcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmKHR5cGVvZiB4LnggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54ICsgeC54LCB0aGlzLnkgKyB4LnkpXG4gIH1cbiAgaWYodHlwZW9mIHkgPT09ICd1bmRlZmluZWQnKSB7IC8vc2NhbGFyXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54ICsgeCwgdGhpcy55ICsgeClcbiAgfVxuICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggKyB4LCB0aGlzLnkgKyB5KVxufVxuXG5WZWN0b3IucHJvdG90eXBlLnNldHYgPSBmdW5jdGlvbih2ZWMpIHtcbiAgdGhpcy54ID0gdmVjLnhcbiAgdGhpcy55ID0gdmVjLnlcbiAgcmV0dXJuIHRoaXNcbn1cblxuVmVjdG9yLnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24odmVjdG9yLCBhbHBoYSkge1xuICByZXR1cm4gdGhpcy5tdWx0KDEtYWxwaGEpLmFkZCh2ZWN0b3IubXVsdChhbHBoYSkpXG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2UvbGliL3ZlY3Rvci5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGFzYXAgPSByZXF1aXJlKCdhc2FwJylcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlXG5mdW5jdGlvbiBQcm9taXNlKGZuKSB7XG4gIGlmICh0eXBlb2YgdGhpcyAhPT0gJ29iamVjdCcpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Byb21pc2VzIG11c3QgYmUgY29uc3RydWN0ZWQgdmlhIG5ldycpXG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBUeXBlRXJyb3IoJ25vdCBhIGZ1bmN0aW9uJylcbiAgdmFyIHN0YXRlID0gbnVsbFxuICB2YXIgdmFsdWUgPSBudWxsXG4gIHZhciBkZWZlcnJlZHMgPSBbXVxuICB2YXIgc2VsZiA9IHRoaXNcblxuICB0aGlzLnRoZW4gPSBmdW5jdGlvbihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGhhbmRsZShuZXcgSGFuZGxlcihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcmVzb2x2ZSwgcmVqZWN0KSlcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlKGRlZmVycmVkKSB7XG4gICAgaWYgKHN0YXRlID09PSBudWxsKSB7XG4gICAgICBkZWZlcnJlZHMucHVzaChkZWZlcnJlZClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBhc2FwKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGNiID0gc3RhdGUgPyBkZWZlcnJlZC5vbkZ1bGZpbGxlZCA6IGRlZmVycmVkLm9uUmVqZWN0ZWRcbiAgICAgIGlmIChjYiA9PT0gbnVsbCkge1xuICAgICAgICAoc3RhdGUgPyBkZWZlcnJlZC5yZXNvbHZlIDogZGVmZXJyZWQucmVqZWN0KSh2YWx1ZSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB2YXIgcmV0XG4gICAgICB0cnkge1xuICAgICAgICByZXQgPSBjYih2YWx1ZSlcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGRlZmVycmVkLnJlc29sdmUocmV0KVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlKG5ld1ZhbHVlKSB7XG4gICAgdHJ5IHsgLy9Qcm9taXNlIFJlc29sdXRpb24gUHJvY2VkdXJlOiBodHRwczovL2dpdGh1Yi5jb20vcHJvbWlzZXMtYXBsdXMvcHJvbWlzZXMtc3BlYyN0aGUtcHJvbWlzZS1yZXNvbHV0aW9uLXByb2NlZHVyZVxuICAgICAgaWYgKG5ld1ZhbHVlID09PSBzZWxmKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBIHByb21pc2UgY2Fubm90IGJlIHJlc29sdmVkIHdpdGggaXRzZWxmLicpXG4gICAgICBpZiAobmV3VmFsdWUgJiYgKHR5cGVvZiBuZXdWYWx1ZSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIG5ld1ZhbHVlID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICB2YXIgdGhlbiA9IG5ld1ZhbHVlLnRoZW5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgZG9SZXNvbHZlKHRoZW4uYmluZChuZXdWYWx1ZSksIHJlc29sdmUsIHJlamVjdClcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3RhdGUgPSB0cnVlXG4gICAgICB2YWx1ZSA9IG5ld1ZhbHVlXG4gICAgICBmaW5hbGUoKVxuICAgIH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlamVjdChuZXdWYWx1ZSkge1xuICAgIHN0YXRlID0gZmFsc2VcbiAgICB2YWx1ZSA9IG5ld1ZhbHVlXG4gICAgZmluYWxlKClcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmFsZSgpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZGVmZXJyZWRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKVxuICAgICAgaGFuZGxlKGRlZmVycmVkc1tpXSlcbiAgICBkZWZlcnJlZHMgPSBudWxsXG4gIH1cblxuICBkb1Jlc29sdmUoZm4sIHJlc29sdmUsIHJlamVjdClcbn1cblxuXG5mdW5jdGlvbiBIYW5kbGVyKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCByZXNvbHZlLCByZWplY3Qpe1xuICB0aGlzLm9uRnVsZmlsbGVkID0gdHlwZW9mIG9uRnVsZmlsbGVkID09PSAnZnVuY3Rpb24nID8gb25GdWxmaWxsZWQgOiBudWxsXG4gIHRoaXMub25SZWplY3RlZCA9IHR5cGVvZiBvblJlamVjdGVkID09PSAnZnVuY3Rpb24nID8gb25SZWplY3RlZCA6IG51bGxcbiAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZVxuICB0aGlzLnJlamVjdCA9IHJlamVjdFxufVxuXG4vKipcbiAqIFRha2UgYSBwb3RlbnRpYWxseSBtaXNiZWhhdmluZyByZXNvbHZlciBmdW5jdGlvbiBhbmQgbWFrZSBzdXJlXG4gKiBvbkZ1bGZpbGxlZCBhbmQgb25SZWplY3RlZCBhcmUgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBNYWtlcyBubyBndWFyYW50ZWVzIGFib3V0IGFzeW5jaHJvbnkuXG4gKi9cbmZ1bmN0aW9uIGRvUmVzb2x2ZShmbiwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgdmFyIGRvbmUgPSBmYWxzZTtcbiAgdHJ5IHtcbiAgICBmbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmIChkb25lKSByZXR1cm5cbiAgICAgIGRvbmUgPSB0cnVlXG4gICAgICBvbkZ1bGZpbGxlZCh2YWx1ZSlcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICBpZiAoZG9uZSkgcmV0dXJuXG4gICAgICBkb25lID0gdHJ1ZVxuICAgICAgb25SZWplY3RlZChyZWFzb24pXG4gICAgfSlcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBpZiAoZG9uZSkgcmV0dXJuXG4gICAgZG9uZSA9IHRydWVcbiAgICBvblJlamVjdGVkKGV4KVxuICB9XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL1Byb21pc2UvY29yZS5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9Qcm9taXNlXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuJ3VzZSBzdHJpY3QnO1xuXG4vL1RoaXMgZmlsZSBjb250YWlucyB0aGVuL3Byb21pc2Ugc3BlY2lmaWMgZXh0ZW5zaW9ucyB0byB0aGUgY29yZSBwcm9taXNlIEFQSVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpXG52YXIgYXNhcCA9IHJlcXVpcmUoJ2FzYXAnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2VcblxuLyogU3RhdGljIEZ1bmN0aW9ucyAqL1xuXG5mdW5jdGlvbiBWYWx1ZVByb21pc2UodmFsdWUpIHtcbiAgdGhpcy50aGVuID0gZnVuY3Rpb24gKG9uRnVsZmlsbGVkKSB7XG4gICAgaWYgKHR5cGVvZiBvbkZ1bGZpbGxlZCAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHRoaXNcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzb2x2ZShvbkZ1bGZpbGxlZCh2YWx1ZSkpXG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG59XG5WYWx1ZVByb21pc2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQcm9taXNlLnByb3RvdHlwZSlcblxudmFyIFRSVUUgPSBuZXcgVmFsdWVQcm9taXNlKHRydWUpXG52YXIgRkFMU0UgPSBuZXcgVmFsdWVQcm9taXNlKGZhbHNlKVxudmFyIE5VTEwgPSBuZXcgVmFsdWVQcm9taXNlKG51bGwpXG52YXIgVU5ERUZJTkVEID0gbmV3IFZhbHVlUHJvbWlzZSh1bmRlZmluZWQpXG52YXIgWkVSTyA9IG5ldyBWYWx1ZVByb21pc2UoMClcbnZhciBFTVBUWVNUUklORyA9IG5ldyBWYWx1ZVByb21pc2UoJycpXG5cblByb21pc2UucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSByZXR1cm4gdmFsdWVcblxuICBpZiAodmFsdWUgPT09IG51bGwpIHJldHVybiBOVUxMXG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gVU5ERUZJTkVEXG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkgcmV0dXJuIFRSVUVcbiAgaWYgKHZhbHVlID09PSBmYWxzZSkgcmV0dXJuIEZBTFNFXG4gIGlmICh2YWx1ZSA9PT0gMCkgcmV0dXJuIFpFUk9cbiAgaWYgKHZhbHVlID09PSAnJykgcmV0dXJuIEVNUFRZU1RSSU5HXG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciB0aGVuID0gdmFsdWUudGhlblxuICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSh0aGVuLmJpbmQodmFsdWUpKVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICByZWplY3QoZXgpXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXcgVmFsdWVQcm9taXNlKHZhbHVlKVxufVxuXG5Qcm9taXNlLmZyb20gPSBQcm9taXNlLmNhc3QgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIGVyciA9IG5ldyBFcnJvcignUHJvbWlzZS5mcm9tIGFuZCBQcm9taXNlLmNhc3QgYXJlIGRlcHJlY2F0ZWQsIHVzZSBQcm9taXNlLnJlc29sdmUgaW5zdGVhZCcpXG4gIGVyci5uYW1lID0gJ1dhcm5pbmcnXG4gIGNvbnNvbGUud2FybihlcnIuc3RhY2spXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUodmFsdWUpXG59XG5cblByb21pc2UuZGVub2RlaWZ5ID0gZnVuY3Rpb24gKGZuLCBhcmd1bWVudENvdW50KSB7XG4gIGFyZ3VtZW50Q291bnQgPSBhcmd1bWVudENvdW50IHx8IEluZmluaXR5XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHdoaWxlIChhcmdzLmxlbmd0aCAmJiBhcmdzLmxlbmd0aCA+IGFyZ3VtZW50Q291bnQpIHtcbiAgICAgICAgYXJncy5wb3AoKVxuICAgICAgfVxuICAgICAgYXJncy5wdXNoKGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICBpZiAoZXJyKSByZWplY3QoZXJyKVxuICAgICAgICBlbHNlIHJlc29sdmUocmVzKVxuICAgICAgfSlcbiAgICAgIGZuLmFwcGx5KHNlbGYsIGFyZ3MpXG4gICAgfSlcbiAgfVxufVxuUHJvbWlzZS5ub2RlaWZ5ID0gZnVuY3Rpb24gKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgdmFyIGNhbGxiYWNrID0gdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gJ2Z1bmN0aW9uJyA/IGFyZ3MucG9wKCkgOiBudWxsXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpLm5vZGVpZnkoY2FsbGJhY2spXG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIGlmIChjYWxsYmFjayA9PT0gbnVsbCB8fCB0eXBlb2YgY2FsbGJhY2sgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgcmVqZWN0KGV4KSB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY2FsbGJhY2soZXgpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblByb21pc2UuYWxsID0gZnVuY3Rpb24gKCkge1xuICB2YXIgY2FsbGVkV2l0aEFycmF5ID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiBBcnJheS5pc0FycmF5KGFyZ3VtZW50c1swXSlcbiAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChjYWxsZWRXaXRoQXJyYXkgPyBhcmd1bWVudHNbMF0gOiBhcmd1bWVudHMpXG5cbiAgaWYgKCFjYWxsZWRXaXRoQXJyYXkpIHtcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdQcm9taXNlLmFsbCBzaG91bGQgYmUgY2FsbGVkIHdpdGggYSBzaW5nbGUgYXJyYXksIGNhbGxpbmcgaXQgd2l0aCBtdWx0aXBsZSBhcmd1bWVudHMgaXMgZGVwcmVjYXRlZCcpXG4gICAgZXJyLm5hbWUgPSAnV2FybmluZydcbiAgICBjb25zb2xlLndhcm4oZXJyLnN0YWNrKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDApIHJldHVybiByZXNvbHZlKFtdKVxuICAgIHZhciByZW1haW5pbmcgPSBhcmdzLmxlbmd0aFxuICAgIGZ1bmN0aW9uIHJlcyhpLCB2YWwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh2YWwgJiYgKHR5cGVvZiB2YWwgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgdmFyIHRoZW4gPSB2YWwudGhlblxuICAgICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhlbi5jYWxsKHZhbCwgZnVuY3Rpb24gKHZhbCkgeyByZXMoaSwgdmFsKSB9LCByZWplY3QpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXJnc1tpXSA9IHZhbFxuICAgICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICByZXNvbHZlKGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICByZWplY3QoZXgpXG4gICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzKGksIGFyZ3NbaV0pXG4gICAgfVxuICB9KVxufVxuXG5Qcm9taXNlLnJlamVjdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyBcbiAgICByZWplY3QodmFsdWUpO1xuICB9KTtcbn1cblxuUHJvbWlzZS5yYWNlID0gZnVuY3Rpb24gKHZhbHVlcykge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyBcbiAgICB2YWx1ZXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSl7XG4gICAgICBQcm9taXNlLnJlc29sdmUodmFsdWUpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9KVxuICB9KTtcbn1cblxuLyogUHJvdG90eXBlIE1ldGhvZHMgKi9cblxuUHJvbWlzZS5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uIChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICB2YXIgc2VsZiA9IGFyZ3VtZW50cy5sZW5ndGggPyB0aGlzLnRoZW4uYXBwbHkodGhpcywgYXJndW1lbnRzKSA6IHRoaXNcbiAgc2VsZi50aGVuKG51bGwsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRocm93IGVyclxuICAgIH0pXG4gIH0pXG59XG5cblByb21pc2UucHJvdG90eXBlLm5vZGVpZnkgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnZnVuY3Rpb24nKSByZXR1cm4gdGhpc1xuXG4gIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHZhbHVlKVxuICAgIH0pXG4gIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrKGVycilcbiAgICB9KVxuICB9KVxufVxuXG5Qcm9taXNlLnByb3RvdHlwZVsnY2F0Y2gnXSA9IGZ1bmN0aW9uIChvblJlamVjdGVkKSB7XG4gIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3RlZCk7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL1Byb21pc2UvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvUHJvbWlzZVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcblxuLy8gVXNlIHRoZSBmYXN0ZXN0IHBvc3NpYmxlIG1lYW5zIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm5cbi8vIG9mIHRoZSBldmVudCBsb29wLlxuXG4vLyBsaW5rZWQgbGlzdCBvZiB0YXNrcyAoc2luZ2xlLCB3aXRoIGhlYWQgbm9kZSlcbnZhciBoZWFkID0ge3Rhc2s6IHZvaWQgMCwgbmV4dDogbnVsbH07XG52YXIgdGFpbCA9IGhlYWQ7XG52YXIgZmx1c2hpbmcgPSBmYWxzZTtcbnZhciByZXF1ZXN0Rmx1c2ggPSB2b2lkIDA7XG52YXIgaXNOb2RlSlMgPSBmYWxzZTtcblxuZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgLyoganNoaW50IGxvb3BmdW5jOiB0cnVlICovXG5cbiAgICB3aGlsZSAoaGVhZC5uZXh0KSB7XG4gICAgICAgIGhlYWQgPSBoZWFkLm5leHQ7XG4gICAgICAgIHZhciB0YXNrID0gaGVhZC50YXNrO1xuICAgICAgICBoZWFkLnRhc2sgPSB2b2lkIDA7XG4gICAgICAgIHZhciBkb21haW4gPSBoZWFkLmRvbWFpbjtcblxuICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICBoZWFkLmRvbWFpbiA9IHZvaWQgMDtcbiAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRhc2soKTtcblxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoaXNOb2RlSlMpIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBub2RlLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBjb25zaWRlcmVkIGZhdGFsIGVycm9ycy5cbiAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIHN5bmNocm9ub3VzbHkgdG8gaW50ZXJydXB0IGZsdXNoaW5nIVxuXG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIGNvbnRpbnVhdGlvbiBpZiB0aGUgdW5jYXVnaHQgZXhjZXB0aW9uIGlzIHN1cHByZXNzZWRcbiAgICAgICAgICAgICAgICAvLyBsaXN0ZW5pbmcgXCJ1bmNhdWdodEV4Y2VwdGlvblwiIGV2ZW50cyAoYXMgZG9tYWlucyBkb2VzKS5cbiAgICAgICAgICAgICAgICAvLyBDb250aW51ZSBpbiBuZXh0IGV2ZW50IHRvIGF2b2lkIHRpY2sgcmVjdXJzaW9uLlxuICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEluIGJyb3dzZXJzLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuXG4gICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBhc3luY2hyb25vdXNseSB0byBhdm9pZCBzbG93LWRvd25zLlxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmbHVzaGluZyA9IGZhbHNlO1xufVxuXG5pZiAodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgcHJvY2Vzcy5uZXh0VGljaykge1xuICAgIC8vIE5vZGUuanMgYmVmb3JlIDAuOS4gTm90ZSB0aGF0IHNvbWUgZmFrZS1Ob2RlIGVudmlyb25tZW50cywgbGlrZSB0aGVcbiAgICAvLyBNb2NoYSB0ZXN0IHJ1bm5lciwgaW50cm9kdWNlIGEgYHByb2Nlc3NgIGdsb2JhbCB3aXRob3V0IGEgYG5leHRUaWNrYC5cbiAgICBpc05vZGVKUyA9IHRydWU7XG5cbiAgICByZXF1ZXN0Rmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICAgIH07XG5cbn0gZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgLy8gSW4gSUUxMCwgTm9kZS5qcyAwLjkrLCBvciBodHRwczovL2dpdGh1Yi5jb20vTm9ibGVKUy9zZXRJbW1lZGlhdGVcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICByZXF1ZXN0Rmx1c2ggPSBzZXRJbW1lZGlhdGUuYmluZCh3aW5kb3csIGZsdXNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXF1ZXN0Rmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRJbW1lZGlhdGUoZmx1c2gpO1xuICAgICAgICB9O1xuICAgIH1cblxufSBlbHNlIGlmICh0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAvLyBtb2Rlcm4gYnJvd3NlcnNcbiAgICAvLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmbHVzaDtcbiAgICByZXF1ZXN0Rmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gICAgfTtcblxufSBlbHNlIHtcbiAgICAvLyBvbGQgYnJvd3NlcnNcbiAgICByZXF1ZXN0Rmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGFzYXAodGFzaykge1xuICAgIHRhaWwgPSB0YWlsLm5leHQgPSB7XG4gICAgICAgIHRhc2s6IHRhc2ssXG4gICAgICAgIGRvbWFpbjogaXNOb2RlSlMgJiYgcHJvY2Vzcy5kb21haW4sXG4gICAgICAgIG5leHQ6IG51bGxcbiAgICB9O1xuXG4gICAgaWYgKCFmbHVzaGluZykge1xuICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3RGbHVzaCgpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXNhcDtcblxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9Qcm9taXNlL25vZGVfbW9kdWxlcy9hc2FwL2FzYXAuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvUHJvbWlzZS9ub2RlX21vZHVsZXMvYXNhcFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcblxuLyoqXG4gKiBFeHBvc2UgYEVtaXR0ZXJgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gRW1pdHRlcjtcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBFbWl0dGVyYC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIEVtaXR0ZXIob2JqKSB7XG4gIGlmIChvYmopIHJldHVybiBtaXhpbihvYmopO1xufTtcblxuLyoqXG4gKiBNaXhpbiB0aGUgZW1pdHRlciBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIG1peGluKG9iaikge1xuICBmb3IgKHZhciBrZXkgaW4gRW1pdHRlci5wcm90b3R5cGUpIHtcbiAgICBvYmpba2V5XSA9IEVtaXR0ZXIucHJvdG90eXBlW2tleV07XG4gIH1cbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBMaXN0ZW4gb24gdGhlIGdpdmVuIGBldmVudGAgd2l0aCBgZm5gLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uID1cbkVtaXR0ZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCwgZm4pe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG4gICh0aGlzLl9jYWxsYmFja3NbZXZlbnRdID0gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XSB8fCBbXSlcbiAgICAucHVzaChmbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGRzIGFuIGBldmVudGAgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGludm9rZWQgYSBzaW5nbGVcbiAqIHRpbWUgdGhlbiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuXG4gIGZ1bmN0aW9uIG9uKCkge1xuICAgIHNlbGYub2ZmKGV2ZW50LCBvbik7XG4gICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIG9uLmZuID0gZm47XG4gIHRoaXMub24oZXZlbnQsIG9uKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgZm9yIGBldmVudGAgb3IgYWxsXG4gKiByZWdpc3RlcmVkIGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vZmYgPVxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPVxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCwgZm4pe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG5cbiAgLy8gYWxsXG4gIGlmICgwID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICB0aGlzLl9jYWxsYmFja3MgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHNwZWNpZmljIGV2ZW50XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3NbZXZlbnRdO1xuICBpZiAoIWNhbGxiYWNrcykgcmV0dXJuIHRoaXM7XG5cbiAgLy8gcmVtb3ZlIGFsbCBoYW5kbGVyc1xuICBpZiAoMSA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgZGVsZXRlIHRoaXMuX2NhbGxiYWNrc1tldmVudF07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyByZW1vdmUgc3BlY2lmaWMgaGFuZGxlclxuICB2YXIgY2I7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgY2IgPSBjYWxsYmFja3NbaV07XG4gICAgaWYgKGNiID09PSBmbiB8fCBjYi5mbiA9PT0gZm4pIHtcbiAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaSwgMSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEVtaXQgYGV2ZW50YCB3aXRoIHRoZSBnaXZlbiBhcmdzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtNaXhlZH0gLi4uXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbihldmVudCl7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcbiAgICAsIGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrc1tldmVudF07XG5cbiAgaWYgKGNhbGxiYWNrcykge1xuICAgIGNhbGxiYWNrcyA9IGNhbGxiYWNrcy5zbGljZSgwKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gY2FsbGJhY2tzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBjYWxsYmFja3NbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJldHVybiBhcnJheSBvZiBjYWxsYmFja3MgZm9yIGBldmVudGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG4gIHJldHVybiB0aGlzLl9jYWxsYmFja3NbZXZlbnRdIHx8IFtdO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGlzIGVtaXR0ZXIgaGFzIGBldmVudGAgaGFuZGxlcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5oYXNMaXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XG4gIHJldHVybiAhISB0aGlzLmxpc3RlbmVycyhldmVudCkubGVuZ3RoO1xufTtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvY29tcG9uZW50LWVtaXR0ZXIvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvY29tcG9uZW50LWVtaXR0ZXJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIGtleXMgPSByZXF1aXJlKCdsb2Rhc2gua2V5cycpLFxuICAgIG9iamVjdFR5cGVzID0gcmVxdWlyZSgnbG9kYXNoLl9vYmplY3R0eXBlcycpO1xuXG4vKipcbiAqIEFzc2lnbnMgb3duIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiBzb3VyY2Ugb2JqZWN0KHMpIHRvIHRoZSBkZXN0aW5hdGlvblxuICogb2JqZWN0IGZvciBhbGwgZGVzdGluYXRpb24gcHJvcGVydGllcyB0aGF0IHJlc29sdmUgdG8gYHVuZGVmaW5lZGAuIE9uY2UgYVxuICogcHJvcGVydHkgaXMgc2V0LCBhZGRpdGlvbmFsIGRlZmF1bHRzIG9mIHRoZSBzYW1lIHByb3BlcnR5IHdpbGwgYmUgaWdub3JlZC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHR5cGUgRnVuY3Rpb25cbiAqIEBjYXRlZ29yeSBPYmplY3RzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKiBAcGFyYW0gey4uLk9iamVjdH0gW3NvdXJjZV0gVGhlIHNvdXJjZSBvYmplY3RzLlxuICogQHBhcmFtLSB7T2JqZWN0fSBbZ3VhcmRdIEFsbG93cyB3b3JraW5nIHdpdGggYF8ucmVkdWNlYCB3aXRob3V0IHVzaW5nIGl0c1xuICogIGBrZXlgIGFuZCBgb2JqZWN0YCBhcmd1bWVudHMgYXMgc291cmNlcy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdCA9IHsgJ25hbWUnOiAnYmFybmV5JyB9O1xuICogXy5kZWZhdWx0cyhvYmplY3QsIHsgJ25hbWUnOiAnZnJlZCcsICdlbXBsb3llcic6ICdzbGF0ZScgfSk7XG4gKiAvLyA9PiB7ICduYW1lJzogJ2Jhcm5leScsICdlbXBsb3llcic6ICdzbGF0ZScgfVxuICovXG52YXIgZGVmYXVsdHMgPSBmdW5jdGlvbihvYmplY3QsIHNvdXJjZSwgZ3VhcmQpIHtcbiAgdmFyIGluZGV4LCBpdGVyYWJsZSA9IG9iamVjdCwgcmVzdWx0ID0gaXRlcmFibGU7XG4gIGlmICghaXRlcmFibGUpIHJldHVybiByZXN1bHQ7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgYXJnc0luZGV4ID0gMCxcbiAgICAgIGFyZ3NMZW5ndGggPSB0eXBlb2YgZ3VhcmQgPT0gJ251bWJlcicgPyAyIDogYXJncy5sZW5ndGg7XG4gIHdoaWxlICgrK2FyZ3NJbmRleCA8IGFyZ3NMZW5ndGgpIHtcbiAgICBpdGVyYWJsZSA9IGFyZ3NbYXJnc0luZGV4XTtcbiAgICBpZiAoaXRlcmFibGUgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSkge1xuICAgIHZhciBvd25JbmRleCA9IC0xLFxuICAgICAgICBvd25Qcm9wcyA9IG9iamVjdFR5cGVzW3R5cGVvZiBpdGVyYWJsZV0gJiYga2V5cyhpdGVyYWJsZSksXG4gICAgICAgIGxlbmd0aCA9IG93blByb3BzID8gb3duUHJvcHMubGVuZ3RoIDogMDtcblxuICAgIHdoaWxlICgrK293bkluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICBpbmRleCA9IG93blByb3BzW293bkluZGV4XTtcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0W2luZGV4XSA9PSAndW5kZWZpbmVkJykgcmVzdWx0W2luZGV4XSA9IGl0ZXJhYmxlW2luZGV4XTtcbiAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZGVmYXVsdHM7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKiogVXNlZCB0byBkZXRlcm1pbmUgaWYgdmFsdWVzIGFyZSBvZiB0aGUgbGFuZ3VhZ2UgdHlwZSBPYmplY3QgKi9cbnZhciBvYmplY3RUeXBlcyA9IHtcbiAgJ2Jvb2xlYW4nOiBmYWxzZSxcbiAgJ2Z1bmN0aW9uJzogdHJ1ZSxcbiAgJ29iamVjdCc6IHRydWUsXG4gICdudW1iZXInOiBmYWxzZSxcbiAgJ3N0cmluZyc6IGZhbHNlLFxuICAndW5kZWZpbmVkJzogZmFsc2Vcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gb2JqZWN0VHlwZXM7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9vYmplY3R0eXBlcy9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5fb2JqZWN0dHlwZXNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIGlzTmF0aXZlID0gcmVxdWlyZSgnbG9kYXNoLl9pc25hdGl2ZScpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnbG9kYXNoLmlzb2JqZWN0JyksXG4gICAgc2hpbUtleXMgPSByZXF1aXJlKCdsb2Rhc2guX3NoaW1rZXlzJyk7XG5cbi8qIE5hdGl2ZSBtZXRob2Qgc2hvcnRjdXRzIGZvciBtZXRob2RzIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzICovXG52YXIgbmF0aXZlS2V5cyA9IGlzTmF0aXZlKG5hdGl2ZUtleXMgPSBPYmplY3Qua2V5cykgJiYgbmF0aXZlS2V5cztcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IGNvbXBvc2VkIG9mIHRoZSBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBhbiBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhbiBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5rZXlzKHsgJ29uZSc6IDEsICd0d28nOiAyLCAndGhyZWUnOiAzIH0pO1xuICogLy8gPT4gWydvbmUnLCAndHdvJywgJ3RocmVlJ10gKHByb3BlcnR5IG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkIGFjcm9zcyBlbnZpcm9ubWVudHMpXG4gKi9cbnZhciBrZXlzID0gIW5hdGl2ZUtleXMgPyBzaGltS2V5cyA6IGZ1bmN0aW9uKG9iamVjdCkge1xuICBpZiAoIWlzT2JqZWN0KG9iamVjdCkpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZUtleXMob2JqZWN0KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5cztcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgaW50ZXJuYWwgW1tDbGFzc11dIG9mIHZhbHVlcyAqL1xudmFyIHRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBpZiBhIG1ldGhvZCBpcyBuYXRpdmUgKi9cbnZhciByZU5hdGl2ZSA9IFJlZ0V4cCgnXicgK1xuICBTdHJpbmcodG9TdHJpbmcpXG4gICAgLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCAnXFxcXCQmJylcbiAgICAucmVwbGFjZSgvdG9TdHJpbmd8IGZvciBbXlxcXV0rL2csICcuKj8nKSArICckJ1xuKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24sIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNOYXRpdmUodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nICYmIHJlTmF0aXZlLnRlc3QodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTmF0aXZlO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL25vZGVfbW9kdWxlcy9sb2Rhc2guX2lzbmF0aXZlL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWZhdWx0cy9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXMvbm9kZV9tb2R1bGVzL2xvZGFzaC5faXNuYXRpdmVcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIG9iamVjdFR5cGVzID0gcmVxdWlyZSgnbG9kYXNoLl9vYmplY3R0eXBlcycpO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEEgZmFsbGJhY2sgaW1wbGVtZW50YXRpb24gb2YgYE9iamVjdC5rZXlzYCB3aGljaCBwcm9kdWNlcyBhbiBhcnJheSBvZiB0aGVcbiAqIGdpdmVuIG9iamVjdCdzIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAdHlwZSBGdW5jdGlvblxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGluc3BlY3QuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYW4gYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKi9cbnZhciBzaGltS2V5cyA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICB2YXIgaW5kZXgsIGl0ZXJhYmxlID0gb2JqZWN0LCByZXN1bHQgPSBbXTtcbiAgaWYgKCFpdGVyYWJsZSkgcmV0dXJuIHJlc3VsdDtcbiAgaWYgKCEob2JqZWN0VHlwZXNbdHlwZW9mIG9iamVjdF0pKSByZXR1cm4gcmVzdWx0O1xuICAgIGZvciAoaW5kZXggaW4gaXRlcmFibGUpIHtcbiAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGl0ZXJhYmxlLCBpbmRleCkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goaW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgcmV0dXJuIHJlc3VsdFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzaGltS2V5cztcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLl9zaGlta2V5cy9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL25vZGVfbW9kdWxlcy9sb2Rhc2guX3NoaW1rZXlzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBvYmplY3RUeXBlcyA9IHJlcXVpcmUoJ2xvZGFzaC5fb2JqZWN0dHlwZXMnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgbGFuZ3VhZ2UgdHlwZSBvZiBPYmplY3QuXG4gKiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdHNcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdCgxKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIC8vIGNoZWNrIGlmIHRoZSB2YWx1ZSBpcyB0aGUgRUNNQVNjcmlwdCBsYW5ndWFnZSB0eXBlIG9mIE9iamVjdFxuICAvLyBodHRwOi8vZXM1LmdpdGh1Yi5pby8jeDhcbiAgLy8gYW5kIGF2b2lkIGEgVjggYnVnXG4gIC8vIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTFcbiAgcmV0dXJuICEhKHZhbHVlICYmIG9iamVjdFR5cGVzW3R5cGVvZiB2YWx1ZV0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVmYXVsdHMvbm9kZV9tb2R1bGVzL2xvZGFzaC5rZXlzL25vZGVfbW9kdWxlcy9sb2Rhc2guaXNvYmplY3QvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlZmF1bHRzL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9ub2RlX21vZHVsZXMvbG9kYXNoLmlzb2JqZWN0XCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXNhcCA9IHJlcXVpcmUoJ2FzYXAnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2VcbmZ1bmN0aW9uIFByb21pc2UoZm4pIHtcbiAgaWYgKHR5cGVvZiB0aGlzICE9PSAnb2JqZWN0JykgdGhyb3cgbmV3IFR5cGVFcnJvcignUHJvbWlzZXMgbXVzdCBiZSBjb25zdHJ1Y3RlZCB2aWEgbmV3JylcbiAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykgdGhyb3cgbmV3IFR5cGVFcnJvcignbm90IGEgZnVuY3Rpb24nKVxuICB2YXIgc3RhdGUgPSBudWxsXG4gIHZhciB2YWx1ZSA9IG51bGxcbiAgdmFyIGRlZmVycmVkcyA9IFtdXG4gIHZhciBzZWxmID0gdGhpc1xuXG4gIHRoaXMudGhlbiA9IGZ1bmN0aW9uKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaGFuZGxlKG5ldyBIYW5kbGVyKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCByZXNvbHZlLCByZWplY3QpKVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGUoZGVmZXJyZWQpIHtcbiAgICBpZiAoc3RhdGUgPT09IG51bGwpIHtcbiAgICAgIGRlZmVycmVkcy5wdXNoKGRlZmVycmVkKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGFzYXAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY2IgPSBzdGF0ZSA/IGRlZmVycmVkLm9uRnVsZmlsbGVkIDogZGVmZXJyZWQub25SZWplY3RlZFxuICAgICAgaWYgKGNiID09PSBudWxsKSB7XG4gICAgICAgIChzdGF0ZSA/IGRlZmVycmVkLnJlc29sdmUgOiBkZWZlcnJlZC5yZWplY3QpKHZhbHVlKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHZhciByZXRcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldCA9IGNiKHZhbHVlKVxuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGUpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXQpXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc29sdmUobmV3VmFsdWUpIHtcbiAgICB0cnkgeyAvL1Byb21pc2UgUmVzb2x1dGlvbiBQcm9jZWR1cmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9wcm9taXNlcy1hcGx1cy9wcm9taXNlcy1zcGVjI3RoZS1wcm9taXNlLXJlc29sdXRpb24tcHJvY2VkdXJlXG4gICAgICBpZiAobmV3VmFsdWUgPT09IHNlbGYpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0EgcHJvbWlzZSBjYW5ub3QgYmUgcmVzb2x2ZWQgd2l0aCBpdHNlbGYuJylcbiAgICAgIGlmIChuZXdWYWx1ZSAmJiAodHlwZW9mIG5ld1ZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgbmV3VmFsdWUgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgIHZhciB0aGVuID0gbmV3VmFsdWUudGhlblxuICAgICAgICBpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBkb1Jlc29sdmUodGhlbi5iaW5kKG5ld1ZhbHVlKSwgcmVzb2x2ZSwgcmVqZWN0KVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdGF0ZSA9IHRydWVcbiAgICAgIHZhbHVlID0gbmV3VmFsdWVcbiAgICAgIGZpbmFsZSgpXG4gICAgfSBjYXRjaCAoZSkgeyByZWplY3QoZSkgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVqZWN0KG5ld1ZhbHVlKSB7XG4gICAgc3RhdGUgPSBmYWxzZVxuICAgIHZhbHVlID0gbmV3VmFsdWVcbiAgICBmaW5hbGUoKVxuICB9XG5cbiAgZnVuY3Rpb24gZmluYWxlKCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBkZWZlcnJlZHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspXG4gICAgICBoYW5kbGUoZGVmZXJyZWRzW2ldKVxuICAgIGRlZmVycmVkcyA9IG51bGxcbiAgfVxuXG4gIGRvUmVzb2x2ZShmbiwgcmVzb2x2ZSwgcmVqZWN0KVxufVxuXG5cbmZ1bmN0aW9uIEhhbmRsZXIob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIHJlc29sdmUsIHJlamVjdCl7XG4gIHRoaXMub25GdWxmaWxsZWQgPSB0eXBlb2Ygb25GdWxmaWxsZWQgPT09ICdmdW5jdGlvbicgPyBvbkZ1bGZpbGxlZCA6IG51bGxcbiAgdGhpcy5vblJlamVjdGVkID0gdHlwZW9mIG9uUmVqZWN0ZWQgPT09ICdmdW5jdGlvbicgPyBvblJlamVjdGVkIDogbnVsbFxuICB0aGlzLnJlc29sdmUgPSByZXNvbHZlXG4gIHRoaXMucmVqZWN0ID0gcmVqZWN0XG59XG5cbi8qKlxuICogVGFrZSBhIHBvdGVudGlhbGx5IG1pc2JlaGF2aW5nIHJlc29sdmVyIGZ1bmN0aW9uIGFuZCBtYWtlIHN1cmVcbiAqIG9uRnVsZmlsbGVkIGFuZCBvblJlamVjdGVkIGFyZSBvbmx5IGNhbGxlZCBvbmNlLlxuICpcbiAqIE1ha2VzIG5vIGd1YXJhbnRlZXMgYWJvdXQgYXN5bmNocm9ueS5cbiAqL1xuZnVuY3Rpb24gZG9SZXNvbHZlKGZuLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICB2YXIgZG9uZSA9IGZhbHNlO1xuICB0cnkge1xuICAgIGZuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKGRvbmUpIHJldHVyblxuICAgICAgZG9uZSA9IHRydWVcbiAgICAgIG9uRnVsZmlsbGVkKHZhbHVlKVxuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIGlmIChkb25lKSByZXR1cm5cbiAgICAgIGRvbmUgPSB0cnVlXG4gICAgICBvblJlamVjdGVkKHJlYXNvbilcbiAgICB9KVxuICB9IGNhdGNoIChleCkge1xuICAgIGlmIChkb25lKSByZXR1cm5cbiAgICBkb25lID0gdHJ1ZVxuICAgIG9uUmVqZWN0ZWQoZXgpXG4gIH1cbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcHJvbWlzZS9jb3JlLmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2VcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4ndXNlIHN0cmljdCc7XG5cbi8vVGhpcyBmaWxlIGNvbnRhaW5zIHRoZW4vcHJvbWlzZSBzcGVjaWZpYyBleHRlbnNpb25zIHRvIHRoZSBjb3JlIHByb21pc2UgQVBJXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9jb3JlLmpzJylcbnZhciBhc2FwID0gcmVxdWlyZSgnYXNhcCcpXG5cbm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZVxuXG4vKiBTdGF0aWMgRnVuY3Rpb25zICovXG5cbmZ1bmN0aW9uIFZhbHVlUHJvbWlzZSh2YWx1ZSkge1xuICB0aGlzLnRoZW4gPSBmdW5jdGlvbiAob25GdWxmaWxsZWQpIHtcbiAgICBpZiAodHlwZW9mIG9uRnVsZmlsbGVkICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gdGhpc1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXNvbHZlKG9uRnVsZmlsbGVkKHZhbHVlKSlcbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICByZWplY3QoZXgpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cbn1cblZhbHVlUHJvbWlzZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFByb21pc2UucHJvdG90eXBlKVxuXG52YXIgVFJVRSA9IG5ldyBWYWx1ZVByb21pc2UodHJ1ZSlcbnZhciBGQUxTRSA9IG5ldyBWYWx1ZVByb21pc2UoZmFsc2UpXG52YXIgTlVMTCA9IG5ldyBWYWx1ZVByb21pc2UobnVsbClcbnZhciBVTkRFRklORUQgPSBuZXcgVmFsdWVQcm9taXNlKHVuZGVmaW5lZClcbnZhciBaRVJPID0gbmV3IFZhbHVlUHJvbWlzZSgwKVxudmFyIEVNUFRZU1RSSU5HID0gbmV3IFZhbHVlUHJvbWlzZSgnJylcblxuUHJvbWlzZS5yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHJldHVybiB2YWx1ZVxuXG4gIGlmICh2YWx1ZSA9PT0gbnVsbCkgcmV0dXJuIE5VTExcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiBVTkRFRklORURcbiAgaWYgKHZhbHVlID09PSB0cnVlKSByZXR1cm4gVFJVRVxuICBpZiAodmFsdWUgPT09IGZhbHNlKSByZXR1cm4gRkFMU0VcbiAgaWYgKHZhbHVlID09PSAwKSByZXR1cm4gWkVST1xuICBpZiAodmFsdWUgPT09ICcnKSByZXR1cm4gRU1QVFlTVFJJTkdcblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIHRoZW4gPSB2YWx1ZS50aGVuXG4gICAgICBpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHRoZW4uYmluZCh2YWx1ZSkpXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHJlamVjdChleClcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBWYWx1ZVByb21pc2UodmFsdWUpXG59XG5cblByb21pc2UuZnJvbSA9IFByb21pc2UuY2FzdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgZXJyID0gbmV3IEVycm9yKCdQcm9taXNlLmZyb20gYW5kIFByb21pc2UuY2FzdCBhcmUgZGVwcmVjYXRlZCwgdXNlIFByb21pc2UucmVzb2x2ZSBpbnN0ZWFkJylcbiAgZXJyLm5hbWUgPSAnV2FybmluZydcbiAgY29uc29sZS53YXJuKGVyci5zdGFjaylcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh2YWx1ZSlcbn1cblxuUHJvbWlzZS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoZm4sIGFyZ3VtZW50Q291bnQpIHtcbiAgYXJndW1lbnRDb3VudCA9IGFyZ3VtZW50Q291bnQgfHwgSW5maW5pdHlcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgd2hpbGUgKGFyZ3MubGVuZ3RoICYmIGFyZ3MubGVuZ3RoID4gYXJndW1lbnRDb3VudCkge1xuICAgICAgICBhcmdzLnBvcCgpXG4gICAgICB9XG4gICAgICBhcmdzLnB1c2goZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgIGlmIChlcnIpIHJlamVjdChlcnIpXG4gICAgICAgIGVsc2UgcmVzb2x2ZShyZXMpXG4gICAgICB9KVxuICAgICAgZm4uYXBwbHkoc2VsZiwgYXJncylcbiAgICB9KVxuICB9XG59XG5Qcm9taXNlLm5vZGVpZnkgPSBmdW5jdGlvbiAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICB2YXIgY2FsbGJhY2sgPSB0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09PSAnZnVuY3Rpb24nID8gYXJncy5wb3AoKSA6IG51bGxcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykubm9kZWlmeShjYWxsYmFjaylcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgaWYgKGNhbGxiYWNrID09PSBudWxsIHx8IHR5cGVvZiBjYWxsYmFjayA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyByZWplY3QoZXgpIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjYWxsYmFjayhleClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuUHJvbWlzZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBjYWxsZWRXaXRoQXJyYXkgPSBhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYXJndW1lbnRzWzBdKVxuICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGNhbGxlZFdpdGhBcnJheSA/IGFyZ3VtZW50c1swXSA6IGFyZ3VtZW50cylcblxuICBpZiAoIWNhbGxlZFdpdGhBcnJheSkge1xuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1Byb21pc2UuYWxsIHNob3VsZCBiZSBjYWxsZWQgd2l0aCBhIHNpbmdsZSBhcnJheSwgY2FsbGluZyBpdCB3aXRoIG11bHRpcGxlIGFyZ3VtZW50cyBpcyBkZXByZWNhdGVkJylcbiAgICBlcnIubmFtZSA9ICdXYXJuaW5nJ1xuICAgIGNvbnNvbGUud2FybihlcnIuc3RhY2spXG4gIH1cblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHJlc29sdmUoW10pXG4gICAgdmFyIHJlbWFpbmluZyA9IGFyZ3MubGVuZ3RoXG4gICAgZnVuY3Rpb24gcmVzKGksIHZhbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHZhbCAmJiAodHlwZW9mIHZhbCA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbCA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICB2YXIgdGhlbiA9IHZhbC50aGVuXG4gICAgICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGVuLmNhbGwodmFsLCBmdW5jdGlvbiAodmFsKSB7IHJlcyhpLCB2YWwpIH0sIHJlamVjdClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhcmdzW2ldID0gdmFsXG4gICAgICAgIGlmICgtLXJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgIHJlc29sdmUoYXJncyk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIHJlamVjdChleClcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXMoaSwgYXJnc1tpXSlcbiAgICB9XG4gIH0pXG59XG5cblByb21pc2UucmVqZWN0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IFxuICAgIHJlamVjdCh2YWx1ZSk7XG4gIH0pO1xufVxuXG5Qcm9taXNlLnJhY2UgPSBmdW5jdGlvbiAodmFsdWVzKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IFxuICAgIHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgIFByb21pc2UucmVzb2x2ZSh2YWx1ZSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgIH0pXG4gIH0pO1xufVxuXG4vKiBQcm90b3R5cGUgTWV0aG9kcyAqL1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24gKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gIHZhciBzZWxmID0gYXJndW1lbnRzLmxlbmd0aCA/IHRoaXMudGhlbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDogdGhpc1xuICBzZWxmLnRoZW4obnVsbCwgZnVuY3Rpb24gKGVycikge1xuICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgdGhyb3cgZXJyXG4gICAgfSlcbiAgfSlcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUubm9kZWlmeSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIGNhbGxiYWNrICE9ICdmdW5jdGlvbicpIHJldHVybiB0aGlzXG5cbiAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgY2FsbGJhY2sobnVsbCwgdmFsdWUpXG4gICAgfSlcbiAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgY2FsbGJhY2soZXJyKVxuICAgIH0pXG4gIH0pXG59XG5cblByb21pc2UucHJvdG90eXBlWydjYXRjaCddID0gZnVuY3Rpb24gKG9uUmVqZWN0ZWQpIHtcbiAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGVkKTtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcHJvbWlzZS9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9wcm9taXNlXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuXG4vLyBVc2UgdGhlIGZhc3Rlc3QgcG9zc2libGUgbWVhbnMgdG8gZXhlY3V0ZSBhIHRhc2sgaW4gYSBmdXR1cmUgdHVyblxuLy8gb2YgdGhlIGV2ZW50IGxvb3AuXG5cbi8vIGxpbmtlZCBsaXN0IG9mIHRhc2tzIChzaW5nbGUsIHdpdGggaGVhZCBub2RlKVxudmFyIGhlYWQgPSB7dGFzazogdm9pZCAwLCBuZXh0OiBudWxsfTtcbnZhciB0YWlsID0gaGVhZDtcbnZhciBmbHVzaGluZyA9IGZhbHNlO1xudmFyIHJlcXVlc3RGbHVzaCA9IHZvaWQgMDtcbnZhciBpc05vZGVKUyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgICAvKiBqc2hpbnQgbG9vcGZ1bmM6IHRydWUgKi9cblxuICAgIHdoaWxlIChoZWFkLm5leHQpIHtcbiAgICAgICAgaGVhZCA9IGhlYWQubmV4dDtcbiAgICAgICAgdmFyIHRhc2sgPSBoZWFkLnRhc2s7XG4gICAgICAgIGhlYWQudGFzayA9IHZvaWQgMDtcbiAgICAgICAgdmFyIGRvbWFpbiA9IGhlYWQuZG9tYWluO1xuXG4gICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgIGhlYWQuZG9tYWluID0gdm9pZCAwO1xuICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGFzaygpO1xuXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChpc05vZGVKUykge1xuICAgICAgICAgICAgICAgIC8vIEluIG5vZGUsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIGNvbnNpZGVyZWQgZmF0YWwgZXJyb3JzLlxuICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gc3luY2hyb25vdXNseSB0byBpbnRlcnJ1cHQgZmx1c2hpbmchXG5cbiAgICAgICAgICAgICAgICAvLyBFbnN1cmUgY29udGludWF0aW9uIGlmIHRoZSB1bmNhdWdodCBleGNlcHRpb24gaXMgc3VwcHJlc3NlZFxuICAgICAgICAgICAgICAgIC8vIGxpc3RlbmluZyBcInVuY2F1Z2h0RXhjZXB0aW9uXCIgZXZlbnRzIChhcyBkb21haW5zIGRvZXMpLlxuICAgICAgICAgICAgICAgIC8vIENvbnRpbnVlIGluIG5leHQgZXZlbnQgdG8gYXZvaWQgdGljayByZWN1cnNpb24uXG4gICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRocm93IGU7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gYnJvd3NlcnMsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIG5vdCBmYXRhbC5cbiAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIGFzeW5jaHJvbm91c2x5IHRvIGF2b2lkIHNsb3ctZG93bnMuXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZsdXNoaW5nID0gZmFsc2U7XG59XG5cbmlmICh0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwcm9jZXNzLm5leHRUaWNrKSB7XG4gICAgLy8gTm9kZS5qcyBiZWZvcmUgMC45LiBOb3RlIHRoYXQgc29tZSBmYWtlLU5vZGUgZW52aXJvbm1lbnRzLCBsaWtlIHRoZVxuICAgIC8vIE1vY2hhIHRlc3QgcnVubmVyLCBpbnRyb2R1Y2UgYSBgcHJvY2Vzc2AgZ2xvYmFsIHdpdGhvdXQgYSBgbmV4dFRpY2tgLlxuICAgIGlzTm9kZUpTID0gdHJ1ZTtcblxuICAgIHJlcXVlc3RGbHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcHJvY2Vzcy5uZXh0VGljayhmbHVzaCk7XG4gICAgfTtcblxufSBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAvLyBJbiBJRTEwLCBOb2RlLmpzIDAuOSssIG9yIGh0dHBzOi8vZ2l0aHViLmNvbS9Ob2JsZUpTL3NldEltbWVkaWF0ZVxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJlcXVlc3RGbHVzaCA9IHNldEltbWVkaWF0ZS5iaW5kKHdpbmRvdywgZmx1c2gpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcXVlc3RGbHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldEltbWVkaWF0ZShmbHVzaCk7XG4gICAgICAgIH07XG4gICAgfVxuXG59IGVsc2UgaWYgKHR5cGVvZiBNZXNzYWdlQ2hhbm5lbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIC8vIG1vZGVybiBicm93c2Vyc1xuICAgIC8vIGh0dHA6Ly93d3cubm9uYmxvY2tpbmcuaW8vMjAxMS8wNi93aW5kb3duZXh0dGljay5odG1sXG4gICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoO1xuICAgIHJlcXVlc3RGbHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbiAgICB9O1xuXG59IGVsc2Uge1xuICAgIC8vIG9sZCBicm93c2Vyc1xuICAgIHJlcXVlc3RGbHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gYXNhcCh0YXNrKSB7XG4gICAgdGFpbCA9IHRhaWwubmV4dCA9IHtcbiAgICAgICAgdGFzazogdGFzayxcbiAgICAgICAgZG9tYWluOiBpc05vZGVKUyAmJiBwcm9jZXNzLmRvbWFpbixcbiAgICAgICAgbmV4dDogbnVsbFxuICAgIH07XG5cbiAgICBpZiAoIWZsdXNoaW5nKSB7XG4gICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdEZsdXNoKCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBhc2FwO1xuXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3Byb21pc2Uvbm9kZV9tb2R1bGVzL2FzYXAvYXNhcC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9wcm9taXNlL25vZGVfbW9kdWxlcy9hc2FwXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIG5vdyA9IHJlcXVpcmUoJ3BlcmZvcm1hbmNlLW5vdycpXG4gICwgZ2xvYmFsID0gdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgPyB7fSA6IHdpbmRvd1xuICAsIHZlbmRvcnMgPSBbJ21veicsICd3ZWJraXQnXVxuICAsIHN1ZmZpeCA9ICdBbmltYXRpb25GcmFtZSdcbiAgLCByYWYgPSBnbG9iYWxbJ3JlcXVlc3QnICsgc3VmZml4XVxuICAsIGNhZiA9IGdsb2JhbFsnY2FuY2VsJyArIHN1ZmZpeF0gfHwgZ2xvYmFsWydjYW5jZWxSZXF1ZXN0JyArIHN1ZmZpeF1cblxuZm9yKHZhciBpID0gMDsgaSA8IHZlbmRvcnMubGVuZ3RoICYmICFyYWY7IGkrKykge1xuICByYWYgPSBnbG9iYWxbdmVuZG9yc1tpXSArICdSZXF1ZXN0JyArIHN1ZmZpeF1cbiAgY2FmID0gZ2xvYmFsW3ZlbmRvcnNbaV0gKyAnQ2FuY2VsJyArIHN1ZmZpeF1cbiAgICAgIHx8IGdsb2JhbFt2ZW5kb3JzW2ldICsgJ0NhbmNlbFJlcXVlc3QnICsgc3VmZml4XVxufVxuXG4vLyBTb21lIHZlcnNpb25zIG9mIEZGIGhhdmUgckFGIGJ1dCBub3QgY0FGXG5pZighcmFmIHx8ICFjYWYpIHtcbiAgdmFyIGxhc3QgPSAwXG4gICAgLCBpZCA9IDBcbiAgICAsIHF1ZXVlID0gW11cbiAgICAsIGZyYW1lRHVyYXRpb24gPSAxMDAwIC8gNjBcblxuICByYWYgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIGlmKHF1ZXVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdmFyIF9ub3cgPSBub3coKVxuICAgICAgICAsIG5leHQgPSBNYXRoLm1heCgwLCBmcmFtZUR1cmF0aW9uIC0gKF9ub3cgLSBsYXN0KSlcbiAgICAgIGxhc3QgPSBuZXh0ICsgX25vd1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNwID0gcXVldWUuc2xpY2UoMClcbiAgICAgICAgLy8gQ2xlYXIgcXVldWUgaGVyZSB0byBwcmV2ZW50XG4gICAgICAgIC8vIGNhbGxiYWNrcyBmcm9tIGFwcGVuZGluZyBsaXN0ZW5lcnNcbiAgICAgICAgLy8gdG8gdGhlIGN1cnJlbnQgZnJhbWUncyBxdWV1ZVxuICAgICAgICBxdWV1ZS5sZW5ndGggPSAwXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3AubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoIWNwW2ldLmNhbmNlbGxlZCkge1xuICAgICAgICAgICAgY3BbaV0uY2FsbGJhY2sobGFzdClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIG5leHQpXG4gICAgfVxuICAgIHF1ZXVlLnB1c2goe1xuICAgICAgaGFuZGxlOiArK2lkLFxuICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrLFxuICAgICAgY2FuY2VsbGVkOiBmYWxzZVxuICAgIH0pXG4gICAgcmV0dXJuIGlkXG4gIH1cblxuICBjYWYgPSBmdW5jdGlvbihoYW5kbGUpIHtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKHF1ZXVlW2ldLmhhbmRsZSA9PT0gaGFuZGxlKSB7XG4gICAgICAgIHF1ZXVlW2ldLmNhbmNlbGxlZCA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgLy8gV3JhcCBpbiBhIG5ldyBmdW5jdGlvbiB0byBwcmV2ZW50XG4gIC8vIGBjYW5jZWxgIHBvdGVudGlhbGx5IGJlaW5nIGFzc2lnbmVkXG4gIC8vIHRvIHRoZSBuYXRpdmUgckFGIGZ1bmN0aW9uXG4gIHJldHVybiByYWYuYXBwbHkoZ2xvYmFsLCBhcmd1bWVudHMpXG59XG5tb2R1bGUuZXhwb3J0cy5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgY2FmLmFwcGx5KGdsb2JhbCwgYXJndW1lbnRzKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9pbXB1bHNlL25vZGVfbW9kdWxlcy9yYWYvaW5kZXguanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcmFmXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuM1xuKGZ1bmN0aW9uKCkge1xuICB2YXIgZ2V0TmFub1NlY29uZHMsIGhydGltZSwgbG9hZFRpbWU7XG5cbiAgaWYgKCh0eXBlb2YgcGVyZm9ybWFuY2UgIT09IFwidW5kZWZpbmVkXCIgJiYgcGVyZm9ybWFuY2UgIT09IG51bGwpICYmIHBlcmZvcm1hbmNlLm5vdykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgfTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgcHJvY2VzcyAhPT0gbnVsbCkgJiYgcHJvY2Vzcy5ocnRpbWUpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIChnZXROYW5vU2Vjb25kcygpIC0gbG9hZFRpbWUpIC8gMWU2O1xuICAgIH07XG4gICAgaHJ0aW1lID0gcHJvY2Vzcy5ocnRpbWU7XG4gICAgZ2V0TmFub1NlY29uZHMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBocjtcbiAgICAgIGhyID0gaHJ0aW1lKCk7XG4gICAgICByZXR1cm4gaHJbMF0gKiAxZTkgKyBoclsxXTtcbiAgICB9O1xuICAgIGxvYWRUaW1lID0gZ2V0TmFub1NlY29uZHMoKTtcbiAgfSBlbHNlIGlmIChEYXRlLm5vdykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gRGF0ZS5ub3coKSAtIGxvYWRUaW1lO1xuICAgIH07XG4gICAgbG9hZFRpbWUgPSBEYXRlLm5vdygpO1xuICB9IGVsc2Uge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBsb2FkVGltZTtcbiAgICB9O1xuICAgIGxvYWRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIH1cblxufSkuY2FsbCh0aGlzKTtcblxuLypcbi8vQCBzb3VyY2VNYXBwaW5nVVJMPXBlcmZvcm1hbmNlLW5vdy5tYXBcbiovXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3JhZi9ub2RlX21vZHVsZXMvcGVyZm9ybWFuY2Utbm93L2xpYi9wZXJmb3JtYW5jZS1ub3cuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvaW1wdWxzZS9ub2RlX21vZHVsZXMvcmFmL25vZGVfbW9kdWxlcy9wZXJmb3JtYW5jZS1ub3cvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xubW9kdWxlLmV4cG9ydHMgPSBWZWxvY2l0eVxuXG5mdW5jdGlvbiBWZWxvY2l0eSgpIHtcbiAgdGhpcy5wb3NpdGlvblF1ZXVlID0gW11cbiAgdGhpcy50aW1lUXVldWUgPSBbXVxufVxuXG5WZWxvY2l0eS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wb3NpdGlvblF1ZXVlLnNwbGljZSgwKVxuICB0aGlzLnRpbWVRdWV1ZS5zcGxpY2UoMClcbn1cblxuVmVsb2NpdHkucHJvdG90eXBlLnBydW5lUXVldWUgPSBmdW5jdGlvbihtcykge1xuICAvL3B1bGwgb2xkIHZhbHVlcyBvZmYgb2YgdGhlIHF1ZXVlXG4gIHdoaWxlKHRoaXMudGltZVF1ZXVlLmxlbmd0aCAmJiB0aGlzLnRpbWVRdWV1ZVswXSA8IChEYXRlLm5vdygpIC0gbXMpKSB7XG4gICAgdGhpcy50aW1lUXVldWUuc2hpZnQoKVxuICAgIHRoaXMucG9zaXRpb25RdWV1ZS5zaGlmdCgpXG4gIH1cbn1cblxuVmVsb2NpdHkucHJvdG90eXBlLnVwZGF0ZVBvc2l0aW9uID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcbiAgdGhpcy5wb3NpdGlvblF1ZXVlLnB1c2gocG9zaXRpb24pXG4gIHRoaXMudGltZVF1ZXVlLnB1c2goRGF0ZS5ub3coKSlcbiAgdGhpcy5wcnVuZVF1ZXVlKDUwKVxufVxuXG5WZWxvY2l0eS5wcm90b3R5cGUuZ2V0VmVsb2NpdHkgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcnVuZVF1ZXVlKDEwMDApXG4gIHZhciBsZW5ndGggPSB0aGlzLnRpbWVRdWV1ZS5sZW5ndGhcbiAgaWYobGVuZ3RoIDwgMikgcmV0dXJuIDBcblxuICB2YXIgZGlzdGFuY2UgPSB0aGlzLnBvc2l0aW9uUXVldWVbbGVuZ3RoLTFdIC0gdGhpcy5wb3NpdGlvblF1ZXVlWzBdXG4gICAgLCB0aW1lID0gKHRoaXMudGltZVF1ZXVlW2xlbmd0aC0xXSAtIHRoaXMudGltZVF1ZXVlWzBdKSAvIDEwMDBcblxuICByZXR1cm4gZGlzdGFuY2UgLyB0aW1lXG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3RvdWNoLXZlbG9jaXR5L2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2ltcHVsc2Uvbm9kZV9tb2R1bGVzL3RvdWNoLXZlbG9jaXR5XCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjcuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgJCwgT3JpRG9taSwgYWRkU3R5bGUsIGFuY2hvckxpc3QsIGFuY2hvckxpc3RILCBhbmNob3JMaXN0ViwgYmFzZU5hbWUsIGNhcGl0YWxpemUsIGNsb25lRWwsIGNyZWF0ZUVsLCBjc3MsIGRlZmF1bHRzLCBkZWZlciwgZWxDbGFzc2VzLCBnZXRHcmFkaWVudCwgaGlkZUVsLCBpc1N1cHBvcnRlZCwgaywgbm9PcCwgcHJlZml4TGlzdCwgcHJlcCwgc2hvd0VsLCBzdHlsZUJ1ZmZlciwgc3VwcG9ydFdhcm5pbmcsIHRlc3RFbCwgdGVzdFByb3AsIHYsIF9yZWYsXG4gICAgX19iaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfSxcbiAgICBfX2luZGV4T2YgPSBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHsgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykgeyBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHJldHVybiBpOyB9IHJldHVybiAtMTsgfSxcbiAgICBfX3NsaWNlID0gW10uc2xpY2U7XG5cbiAgaXNTdXBwb3J0ZWQgPSB0cnVlO1xuXG4gIHN1cHBvcnRXYXJuaW5nID0gZnVuY3Rpb24ocHJvcCkge1xuICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjb25zb2xlICE9PSBudWxsKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJPcmlEb21pOiBNaXNzaW5nIHN1cHBvcnQgZm9yIGBcIiArIHByb3AgKyBcImAuXCIpO1xuICAgIH1cbiAgICByZXR1cm4gaXNTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgfTtcblxuICB0ZXN0UHJvcCA9IGZ1bmN0aW9uKHByb3ApIHtcbiAgICB2YXIgZnVsbCwgcHJlZml4LCBfaSwgX2xlbjtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHByZWZpeExpc3QubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIHByZWZpeCA9IHByZWZpeExpc3RbX2ldO1xuICAgICAgaWYgKChmdWxsID0gcHJlZml4ICsgY2FwaXRhbGl6ZShwcm9wKSkgaW4gdGVzdEVsLnN0eWxlKSB7XG4gICAgICAgIHJldHVybiBmdWxsO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocHJvcCBpbiB0ZXN0RWwuc3R5bGUpIHtcbiAgICAgIHJldHVybiBwcm9wO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgYWRkU3R5bGUgPSBmdW5jdGlvbihzZWxlY3RvciwgcnVsZXMpIHtcbiAgICB2YXIgcHJvcCwgc3R5bGUsIHZhbDtcbiAgICBzdHlsZSA9IFwiLlwiICsgc2VsZWN0b3IgKyBcIntcIjtcbiAgICBmb3IgKHByb3AgaW4gcnVsZXMpIHtcbiAgICAgIHZhbCA9IHJ1bGVzW3Byb3BdO1xuICAgICAgaWYgKHByb3AgaW4gY3NzKSB7XG4gICAgICAgIHByb3AgPSBjc3NbcHJvcF07XG4gICAgICAgIGlmIChwcm9wLm1hdGNoKC9eKHdlYmtpdHxtb3p8bXMpL2kpKSB7XG4gICAgICAgICAgcHJvcCA9ICctJyArIHByb3A7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHN0eWxlICs9IFwiXCIgKyAocHJvcC5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpKSArIFwiOlwiICsgdmFsICsgXCI7XCI7XG4gICAgfVxuICAgIHJldHVybiBzdHlsZUJ1ZmZlciArPSBzdHlsZSArICd9JztcbiAgfTtcblxuICBnZXRHcmFkaWVudCA9IGZ1bmN0aW9uKGFuY2hvcikge1xuICAgIHJldHVybiBcIlwiICsgY3NzLmdyYWRpZW50UHJvcCArIFwiKFwiICsgYW5jaG9yICsgXCIsIHJnYmEoMCwgMCwgMCwgLjUpIDAlLCByZ2JhKDI1NSwgMjU1LCAyNTUsIC4zNSkgMTAwJSlcIjtcbiAgfTtcblxuICBjYXBpdGFsaXplID0gZnVuY3Rpb24ocykge1xuICAgIHJldHVybiBzWzBdLnRvVXBwZXJDYXNlKCkgKyBzLnNsaWNlKDEpO1xuICB9O1xuXG4gIGNyZWF0ZUVsID0gZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgdmFyIGVsO1xuICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWwuY2xhc3NOYW1lID0gZWxDbGFzc2VzW2NsYXNzTmFtZV07XG4gICAgcmV0dXJuIGVsO1xuICB9O1xuXG4gIGNsb25lRWwgPSBmdW5jdGlvbihwYXJlbnQsIGRlZXAsIGNsYXNzTmFtZSkge1xuICAgIHZhciBlbDtcbiAgICBlbCA9IHBhcmVudC5jbG9uZU5vZGUoZGVlcCk7XG4gICAgZWwuY2xhc3NMaXN0LmFkZChlbENsYXNzZXNbY2xhc3NOYW1lXSk7XG4gICAgcmV0dXJuIGVsO1xuICB9O1xuXG4gIGhpZGVFbCA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgcmV0dXJuIGVsLnN0eWxlW2Nzcy50cmFuc2Zvcm1dID0gJ3RyYW5zbGF0ZTNkKC05OTk5OXB4LCAwLCAwKSc7XG4gIH07XG5cbiAgc2hvd0VsID0gZnVuY3Rpb24oZWwpIHtcbiAgICByZXR1cm4gZWwuc3R5bGVbY3NzLnRyYW5zZm9ybV0gPSAndHJhbnNsYXRlM2QoMCwgMCwgMCknO1xuICB9O1xuXG4gIHByZXAgPSBmdW5jdGlvbihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhMCwgYTEsIGEyLCBhbmNob3IsIGFuZ2xlLCBvcHQ7XG4gICAgICBpZiAodGhpcy5fdG91Y2hTdGFydGVkKSB7XG4gICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYTAgPSBhcmd1bWVudHNbMF0sIGExID0gYXJndW1lbnRzWzFdLCBhMiA9IGFyZ3VtZW50c1syXTtcbiAgICAgICAgb3B0ID0ge307XG4gICAgICAgIGFuZ2xlID0gYW5jaG9yID0gbnVsbDtcbiAgICAgICAgc3dpdGNoIChmbi5sZW5ndGgpIHtcbiAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBvcHQuY2FsbGJhY2sgPSBhMDtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0ZvbGRlZFVwKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0eXBlb2Ygb3B0LmNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIgPyBvcHQuY2FsbGJhY2soKSA6IHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYTAgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgb3B0LmNhbGxiYWNrID0gYTA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhbmNob3IgPSBhMDtcbiAgICAgICAgICAgICAgb3B0LmNhbGxiYWNrID0gYTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICBhbmdsZSA9IGEwO1xuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhMSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBvcHQgPSBhMTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYTEgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBvcHQuY2FsbGJhY2sgPSBhMTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhbmNob3IgPSBhMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAgIGFuY2hvciA9IGExO1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGEyID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIG9wdCA9IGEyO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBhMiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIG9wdC5jYWxsYmFjayA9IGEyO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFuZ2xlID09IG51bGwpIHtcbiAgICAgICAgICBhbmdsZSA9IHRoaXMuX2xhc3RPcC5hbmdsZSB8fCAwO1xuICAgICAgICB9XG4gICAgICAgIGFuY2hvciB8fCAoYW5jaG9yID0gdGhpcy5fbGFzdE9wLmFuY2hvcik7XG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2goW2ZuLCB0aGlzLl9ub3JtYWxpemVBbmdsZShhbmdsZSksIHRoaXMuX2dldExvbmdoYW5kQW5jaG9yKGFuY2hvciksIG9wdF0pO1xuICAgICAgICB0aGlzLl9zdGVwKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgZGVmZXIgPSBmdW5jdGlvbihmbikge1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgfTtcblxuICBub09wID0gZnVuY3Rpb24oKSB7fTtcblxuICAkID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93ICE9PSBudWxsID8gKF9yZWYgPSB3aW5kb3cuJCkgIT0gbnVsbCA/IF9yZWYuZGF0YSA6IHZvaWQgMCA6IHZvaWQgMCkgPyB3aW5kb3cuJCA6IG51bGw7XG5cbiAgYW5jaG9yTGlzdCA9IFsnbGVmdCcsICdyaWdodCcsICd0b3AnLCAnYm90dG9tJ107XG5cbiAgYW5jaG9yTGlzdFYgPSBhbmNob3JMaXN0LnNsaWNlKDAsIDIpO1xuXG4gIGFuY2hvckxpc3RIID0gYW5jaG9yTGlzdC5zbGljZSgyKTtcblxuICB0ZXN0RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICBzdHlsZUJ1ZmZlciA9ICcnO1xuXG4gIHByZWZpeExpc3QgPSBbJ1dlYmtpdCcsICdNb3onLCAnbXMnXTtcblxuICBiYXNlTmFtZSA9ICdvcmlkb21pJztcblxuICBlbENsYXNzZXMgPSB7XG4gICAgYWN0aXZlOiAnYWN0aXZlJyxcbiAgICBjbG9uZTogJ2Nsb25lJyxcbiAgICBob2xkZXI6ICdob2xkZXInLFxuICAgIHN0YWdlOiAnc3RhZ2UnLFxuICAgIHN0YWdlTGVmdDogJ3N0YWdlLWxlZnQnLFxuICAgIHN0YWdlUmlnaHQ6ICdzdGFnZS1yaWdodCcsXG4gICAgc3RhZ2VUb3A6ICdzdGFnZS10b3AnLFxuICAgIHN0YWdlQm90dG9tOiAnc3RhZ2UtYm90dG9tJyxcbiAgICBjb250ZW50OiAnY29udGVudCcsXG4gICAgbWFzazogJ21hc2snLFxuICAgIG1hc2tIOiAnbWFzay1oJyxcbiAgICBtYXNrVjogJ21hc2stdicsXG4gICAgcGFuZWw6ICdwYW5lbCcsXG4gICAgcGFuZWxIOiAncGFuZWwtaCcsXG4gICAgcGFuZWxWOiAncGFuZWwtdicsXG4gICAgc2hhZGVyOiAnc2hhZGVyJyxcbiAgICBzaGFkZXJMZWZ0OiAnc2hhZGVyLWxlZnQnLFxuICAgIHNoYWRlclJpZ2h0OiAnc2hhZGVyLXJpZ2h0JyxcbiAgICBzaGFkZXJUb3A6ICdzaGFkZXItdG9wJyxcbiAgICBzaGFkZXJCb3R0b206ICdzaGFkZXItYm90dG9tJ1xuICB9O1xuXG4gIGZvciAoayBpbiBlbENsYXNzZXMpIHtcbiAgICB2ID0gZWxDbGFzc2VzW2tdO1xuICAgIGVsQ2xhc3Nlc1trXSA9IFwiXCIgKyBiYXNlTmFtZSArIFwiLVwiICsgdjtcbiAgfVxuXG4gIGNzcyA9IG5ldyBmdW5jdGlvbigpIHtcbiAgICB2YXIga2V5LCBfaSwgX2xlbiwgX3JlZjE7XG4gICAgX3JlZjEgPSBbJ3RyYW5zZm9ybScsICd0cmFuc2Zvcm1PcmlnaW4nLCAndHJhbnNmb3JtU3R5bGUnLCAndHJhbnNpdGlvblByb3BlcnR5JywgJ3RyYW5zaXRpb25EdXJhdGlvbicsICd0cmFuc2l0aW9uRGVsYXknLCAndHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uJywgJ3BlcnNwZWN0aXZlJywgJ3BlcnNwZWN0aXZlT3JpZ2luJywgJ2JhY2tmYWNlVmlzaWJpbGl0eScsICdib3hTaXppbmcnLCAnbWFzayddO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGtleSA9IF9yZWYxW19pXTtcbiAgICAgIHRoaXNba2V5XSA9IGtleTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgKGZ1bmN0aW9uKCkge1xuICAgIHZhciBhbmNob3IsIGtleSwgcDNkLCBwcmVmaXgsIHN0eWxlRWwsIHZhbHVlLCBfaSwgX2xlbiwgX3JlZjEsIF9yZWYyO1xuICAgIGZvciAoa2V5IGluIGNzcykge1xuICAgICAgdmFsdWUgPSBjc3Nba2V5XTtcbiAgICAgIGNzc1trZXldID0gdGVzdFByb3AodmFsdWUpO1xuICAgICAgaWYgKCFjc3Nba2V5XSkge1xuICAgICAgICByZXR1cm4gc3VwcG9ydFdhcm5pbmcodmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBwM2QgPSAncHJlc2VydmUtM2QnO1xuICAgIHRlc3RFbC5zdHlsZVtjc3MudHJhbnNmb3JtU3R5bGVdID0gcDNkO1xuICAgIGlmICh0ZXN0RWwuc3R5bGVbY3NzLnRyYW5zZm9ybVN0eWxlXSAhPT0gcDNkKSB7XG4gICAgICByZXR1cm4gc3VwcG9ydFdhcm5pbmcocDNkKTtcbiAgICB9XG4gICAgY3NzLmdyYWRpZW50UHJvcCA9IChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBoeXBoZW5hdGVkLCBwcmVmaXgsIF9pLCBfbGVuO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBwcmVmaXhMaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHByZWZpeCA9IHByZWZpeExpc3RbX2ldO1xuICAgICAgICBoeXBoZW5hdGVkID0gXCItXCIgKyAocHJlZml4LnRvTG93ZXJDYXNlKCkpICsgXCItbGluZWFyLWdyYWRpZW50XCI7XG4gICAgICAgIHRlc3RFbC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBcIlwiICsgaHlwaGVuYXRlZCArIFwiKGxlZnQsICMwMDAsICNmZmYpXCI7XG4gICAgICAgIGlmICh0ZXN0RWwuc3R5bGUuYmFja2dyb3VuZEltYWdlLmluZGV4T2YoJ2dyYWRpZW50JykgIT09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIGh5cGhlbmF0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiAnbGluZWFyLWdyYWRpZW50JztcbiAgICB9KSgpO1xuICAgIF9yZWYxID0gKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGdyYWJWYWx1ZSwgcGxhaW5HcmFiLCBwcmVmaXgsIF9pLCBfbGVuO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBwcmVmaXhMaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHByZWZpeCA9IHByZWZpeExpc3RbX2ldO1xuICAgICAgICBwbGFpbkdyYWIgPSAnZ3JhYic7XG4gICAgICAgIHRlc3RFbC5zdHlsZS5jdXJzb3IgPSAoZ3JhYlZhbHVlID0gXCItXCIgKyAocHJlZml4LnRvTG93ZXJDYXNlKCkpICsgXCItXCIgKyBwbGFpbkdyYWIpO1xuICAgICAgICBpZiAodGVzdEVsLnN0eWxlLmN1cnNvciA9PT0gZ3JhYlZhbHVlKSB7XG4gICAgICAgICAgcmV0dXJuIFtncmFiVmFsdWUsIFwiLVwiICsgKHByZWZpeC50b0xvd2VyQ2FzZSgpKSArIFwiLWdyYWJiaW5nXCJdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0ZXN0RWwuc3R5bGUuY3Vyc29yID0gcGxhaW5HcmFiO1xuICAgICAgaWYgKHRlc3RFbC5zdHlsZS5jdXJzb3IgPT09IHBsYWluR3JhYikge1xuICAgICAgICByZXR1cm4gW3BsYWluR3JhYiwgJ2dyYWJiaW5nJ107XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gWydtb3ZlJywgJ21vdmUnXTtcbiAgICAgIH1cbiAgICB9KSgpLCBjc3MuZ3JhYiA9IF9yZWYxWzBdLCBjc3MuZ3JhYmJpbmcgPSBfcmVmMVsxXTtcbiAgICBjc3MudHJhbnNmb3JtUHJvcCA9IChwcmVmaXggPSBjc3MudHJhbnNmb3JtLm1hdGNoKC8oXFx3KylUcmFuc2Zvcm0vaSkpID8gXCItXCIgKyAocHJlZml4WzFdLnRvTG93ZXJDYXNlKCkpICsgXCItdHJhbnNmb3JtXCIgOiAndHJhbnNmb3JtJztcbiAgICBjc3MudHJhbnNpdGlvbkVuZCA9IChmdW5jdGlvbigpIHtcbiAgICAgIHN3aXRjaCAoY3NzLnRyYW5zaXRpb25Qcm9wZXJ0eS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgIGNhc2UgJ3RyYW5zaXRpb25wcm9wZXJ0eSc6XG4gICAgICAgICAgcmV0dXJuICd0cmFuc2l0aW9uRW5kJztcbiAgICAgICAgY2FzZSAnd2Via2l0dHJhbnNpdGlvbnByb3BlcnR5JzpcbiAgICAgICAgICByZXR1cm4gJ3dlYmtpdFRyYW5zaXRpb25FbmQnO1xuICAgICAgICBjYXNlICdtb3p0cmFuc2l0aW9ucHJvcGVydHknOlxuICAgICAgICAgIHJldHVybiAndHJhbnNpdGlvbmVuZCc7XG4gICAgICAgIGNhc2UgJ21zdHJhbnNpdGlvbnByb3BlcnR5JzpcbiAgICAgICAgICByZXR1cm4gJ21zVHJhbnNpdGlvbkVuZCc7XG4gICAgICB9XG4gICAgfSkoKTtcbiAgICBhZGRTdHlsZShlbENsYXNzZXMuYWN0aXZlLCB7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCAhaW1wb3J0YW50JyxcbiAgICAgIGJhY2tncm91bmRJbWFnZTogJ25vbmUgIWltcG9ydGFudCcsXG4gICAgICBib3hTaXppbmc6ICdib3JkZXItYm94ICFpbXBvcnRhbnQnLFxuICAgICAgYm9yZGVyOiAnbm9uZSAhaW1wb3J0YW50JyxcbiAgICAgIG91dGxpbmU6ICdub25lICFpbXBvcnRhbnQnLFxuICAgICAgcGFkZGluZzogJzAgIWltcG9ydGFudCcsXG4gICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgIHRyYW5zZm9ybVN0eWxlOiBwM2QgKyAnICFpbXBvcnRhbnQnLFxuICAgICAgbWFzazogJ25vbmUgIWltcG9ydGFudCdcbiAgICB9KTtcbiAgICBhZGRTdHlsZShlbENsYXNzZXMuY2xvbmUsIHtcbiAgICAgIG1hcmdpbjogJzAgIWltcG9ydGFudCcsXG4gICAgICBib3hTaXppbmc6ICdib3JkZXItYm94ICFpbXBvcnRhbnQnLFxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4gIWltcG9ydGFudCcsXG4gICAgICBkaXNwbGF5OiAnYmxvY2sgIWltcG9ydGFudCdcbiAgICB9KTtcbiAgICBhZGRTdHlsZShlbENsYXNzZXMuaG9sZGVyLCB7XG4gICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICB0b3A6ICcwJyxcbiAgICAgIGJvdHRvbTogJzAnLFxuICAgICAgdHJhbnNmb3JtU3R5bGU6IHAzZFxuICAgIH0pO1xuICAgIGFkZFN0eWxlKGVsQ2xhc3Nlcy5zdGFnZSwge1xuICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgIGhlaWdodDogJzEwMCUnLFxuICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUzZCgtOTk5OXB4LCAwLCAwKScsXG4gICAgICBtYXJnaW46ICcwJyxcbiAgICAgIHBhZGRpbmc6ICcwJyxcbiAgICAgIHRyYW5zZm9ybVN0eWxlOiBwM2RcbiAgICB9KTtcbiAgICBfcmVmMiA9IHtcbiAgICAgIExlZnQ6ICcwJSA1MCUnLFxuICAgICAgUmlnaHQ6ICcxMDAlIDUwJScsXG4gICAgICBUb3A6ICc1MCUgMCUnLFxuICAgICAgQm90dG9tOiAnNTAlIDEwMCUnXG4gICAgfTtcbiAgICBmb3IgKGsgaW4gX3JlZjIpIHtcbiAgICAgIHYgPSBfcmVmMltrXTtcbiAgICAgIGFkZFN0eWxlKGVsQ2xhc3Nlc1snc3RhZ2UnICsga10sIHtcbiAgICAgICAgcGVyc3BlY3RpdmVPcmlnaW46IHZcbiAgICAgIH0pO1xuICAgIH1cbiAgICBhZGRTdHlsZShlbENsYXNzZXMuc2hhZGVyLCB7XG4gICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgIG9wYWNpdHk6ICcwJyxcbiAgICAgIHRvcDogJzAnLFxuICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlWigwKScsXG4gICAgICBsZWZ0OiAnMCcsXG4gICAgICBwb2ludGVyRXZlbnRzOiAnbm9uZScsXG4gICAgICB0cmFuc2l0aW9uUHJvcGVydHk6ICdvcGFjaXR5J1xuICAgIH0pO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gYW5jaG9yTGlzdC5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgYW5jaG9yID0gYW5jaG9yTGlzdFtfaV07XG4gICAgICBhZGRTdHlsZShlbENsYXNzZXNbJ3NoYWRlcicgKyBjYXBpdGFsaXplKGFuY2hvcildLCB7XG4gICAgICAgIGJhY2tncm91bmQ6IGdldEdyYWRpZW50KGFuY2hvciksXG4gICAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVooMCknXG4gICAgICB9KTtcbiAgICB9XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLmNvbnRlbnQsIHtcbiAgICAgIG1hcmdpbjogJzAgIWltcG9ydGFudCcsXG4gICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlICFpbXBvcnRhbnQnLFxuICAgICAgZmxvYXQ6ICdub25lICFpbXBvcnRhbnQnLFxuICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCAhaW1wb3J0YW50JyxcbiAgICAgIG92ZXJmbG93OiAnaGlkZGVuICFpbXBvcnRhbnQnXG4gICAgfSk7XG4gICAgYWRkU3R5bGUoZWxDbGFzc2VzLm1hc2ssIHtcbiAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMCwgMCwgMCknLFxuICAgICAgb3V0bGluZTogJzFweCBzb2xpZCB0cmFuc3BhcmVudCdcbiAgICB9KTtcbiAgICBhZGRTdHlsZShlbENsYXNzZXMucGFuZWwsIHtcbiAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgIHBhZGRpbmc6ICcwJyxcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgdHJhbnNpdGlvblByb3BlcnR5OiBjc3MudHJhbnNmb3JtUHJvcCxcbiAgICAgIHRyYW5zZm9ybU9yaWdpbjogJ2xlZnQnLFxuICAgICAgdHJhbnNmb3JtU3R5bGU6IHAzZFxuICAgIH0pO1xuICAgIGFkZFN0eWxlKGVsQ2xhc3Nlcy5wYW5lbEgsIHtcbiAgICAgIHRyYW5zZm9ybU9yaWdpbjogJ3RvcCdcbiAgICB9KTtcbiAgICBhZGRTdHlsZShcIlwiICsgZWxDbGFzc2VzLnN0YWdlUmlnaHQgKyBcIiAuXCIgKyBlbENsYXNzZXMucGFuZWwsIHtcbiAgICAgIHRyYW5zZm9ybU9yaWdpbjogJ3JpZ2h0J1xuICAgIH0pO1xuICAgIGFkZFN0eWxlKFwiXCIgKyBlbENsYXNzZXMuc3RhZ2VCb3R0b20gKyBcIiAuXCIgKyBlbENsYXNzZXMucGFuZWwsIHtcbiAgICAgIHRyYW5zZm9ybU9yaWdpbjogJ2JvdHRvbSdcbiAgICB9KTtcbiAgICBzdHlsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBzdHlsZUVsLnR5cGUgPSAndGV4dC9jc3MnO1xuICAgIGlmIChzdHlsZUVsLnN0eWxlU2hlZXQpIHtcbiAgICAgIHN0eWxlRWwuc3R5bGVTaGVldC5jc3NUZXh0ID0gc3R5bGVCdWZmZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlRWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoc3R5bGVCdWZmZXIpKTtcbiAgICB9XG4gICAgcmV0dXJuIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVFbCk7XG4gIH0pKCk7XG5cbiAgZGVmYXVsdHMgPSB7XG4gICAgdlBhbmVsczogMyxcbiAgICBoUGFuZWxzOiAzLFxuICAgIHBlcnNwZWN0aXZlOiAxMDAwLFxuICAgIHNoYWRpbmc6ICdoYXJkJyxcbiAgICBzcGVlZDogNzAwLFxuICAgIG1heEFuZ2xlOiA5MCxcbiAgICByaXBwbGU6IDAsXG4gICAgb3JpRG9taUNsYXNzOiAnb3JpZG9taScsXG4gICAgc2hhZGluZ0ludGVuc2l0eTogMSxcbiAgICBlYXNpbmdNZXRob2Q6ICcnLFxuICAgIGdhcE51ZGdlOiAxLFxuICAgIHRvdWNoRW5hYmxlZDogdHJ1ZSxcbiAgICB0b3VjaFNlbnNpdGl2aXR5OiAuMjUsXG4gICAgdG91Y2hTdGFydENhbGxiYWNrOiBub09wLFxuICAgIHRvdWNoTW92ZUNhbGxiYWNrOiBub09wLFxuICAgIHRvdWNoRW5kQ2FsbGJhY2s6IG5vT3BcbiAgfTtcblxuICBPcmlEb21pID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIE9yaURvbWkoZWwsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBhLCBhbmNob3IsIGFuY2hvclNldCwgYXhpcywgY2xhc3NTdWZmaXgsIGNvbnRlbnQsIGNvbnRlbnRIb2xkZXIsIGNvdW50LCBpLCBpbmRleCwgbWFzaywgbWFza1Byb3RvLCBtZXRyaWMsIG9mZnNldHMsIHBhbmVsLCBwYW5lbENvbmZpZywgcGFuZWxLZXksIHBhbmVsTiwgcGFuZWxQcm90bywgcGVyY2VudCwgcHJldiwgcHJvdG8sIHJpZ2h0T3JCb3R0b20sIHNoYWRlclByb3RvLCBzaGFkZXJQcm90b3MsIHNpZGUsIHN0YWdlUHJvdG8sIF9pLCBfaiwgX2ssIF9sLCBfbGVuLCBfbGVuMSwgX2xlbjIsIF9sZW4zLCBfbGVuNCwgX2xlbjUsIF9sZW42LCBfbGVuNywgX20sIF9uLCBfbywgX3AsIF9xLCBfcmVmMSwgX3JlZjI7XG4gICAgICB0aGlzLmVsID0gZWw7XG4gICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX29uTW91c2VPdXQgPSBfX2JpbmQodGhpcy5fb25Nb3VzZU91dCwgdGhpcyk7XG4gICAgICB0aGlzLl9vblRvdWNoTGVhdmUgPSBfX2JpbmQodGhpcy5fb25Ub3VjaExlYXZlLCB0aGlzKTtcbiAgICAgIHRoaXMuX29uVG91Y2hFbmQgPSBfX2JpbmQodGhpcy5fb25Ub3VjaEVuZCwgdGhpcyk7XG4gICAgICB0aGlzLl9vblRvdWNoTW92ZSA9IF9fYmluZCh0aGlzLl9vblRvdWNoTW92ZSwgdGhpcyk7XG4gICAgICB0aGlzLl9vblRvdWNoU3RhcnQgPSBfX2JpbmQodGhpcy5fb25Ub3VjaFN0YXJ0LCB0aGlzKTtcbiAgICAgIHRoaXMuX3N0YWdlUmVzZXQgPSBfX2JpbmQodGhpcy5fc3RhZ2VSZXNldCwgdGhpcyk7XG4gICAgICB0aGlzLl9jb25jbHVkZSA9IF9fYmluZCh0aGlzLl9jb25jbHVkZSwgdGhpcyk7XG4gICAgICB0aGlzLl9vblRyYW5zaXRpb25FbmQgPSBfX2JpbmQodGhpcy5fb25UcmFuc2l0aW9uRW5kLCB0aGlzKTtcbiAgICAgIHRoaXMuX3N0ZXAgPSBfX2JpbmQodGhpcy5fc3RlcCwgdGhpcyk7XG4gICAgICBpZiAoIWlzU3VwcG9ydGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBPcmlEb21pKSkge1xuICAgICAgICByZXR1cm4gbmV3IE9yaURvbWkodGhpcy5lbCwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHRoaXMuZWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMuZWwpO1xuICAgICAgfVxuICAgICAgaWYgKCEodGhpcy5lbCAmJiB0aGlzLmVsLm5vZGVUeXBlID09PSAxKSkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignT3JpRG9taTogRmlyc3QgYXJndW1lbnQgbXVzdCBiZSBhIERPTSBlbGVtZW50Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5fY29uZmlnID0gbmV3IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKGsgaW4gZGVmYXVsdHMpIHtcbiAgICAgICAgICB2ID0gZGVmYXVsdHNba107XG4gICAgICAgICAgaWYgKGsgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhpc1trXSA9IG9wdGlvbnNba107XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXNba10gPSB2O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH07XG4gICAgICB0aGlzLl9jb25maWcucmlwcGxlID0gTnVtYmVyKHRoaXMuX2NvbmZpZy5yaXBwbGUpO1xuICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgIHRoaXMuX3BhbmVscyA9IHt9O1xuICAgICAgdGhpcy5fc3RhZ2VzID0ge307XG4gICAgICB0aGlzLl9sYXN0T3AgPSB7XG4gICAgICAgIGFuY2hvcjogYW5jaG9yTGlzdFswXVxuICAgICAgfTtcbiAgICAgIHRoaXMuX3NoYWRpbmcgPSB0aGlzLl9jb25maWcuc2hhZGluZztcbiAgICAgIGlmICh0aGlzLl9zaGFkaW5nID09PSB0cnVlKSB7XG4gICAgICAgIHRoaXMuX3NoYWRpbmcgPSAnaGFyZCc7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fc2hhZGluZykge1xuICAgICAgICB0aGlzLl9zaGFkZXJzID0ge307XG4gICAgICAgIHNoYWRlclByb3RvcyA9IHt9O1xuICAgICAgICBzaGFkZXJQcm90byA9IGNyZWF0ZUVsKCdzaGFkZXInKTtcbiAgICAgICAgc2hhZGVyUHJvdG8uc3R5bGVbY3NzLnRyYW5zaXRpb25EdXJhdGlvbl0gPSB0aGlzLl9jb25maWcuc3BlZWQgKyAnbXMnO1xuICAgICAgICBzaGFkZXJQcm90by5zdHlsZVtjc3MudHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uXSA9IHRoaXMuX2NvbmZpZy5lYXNpbmdNZXRob2Q7XG4gICAgICB9XG4gICAgICBzdGFnZVByb3RvID0gY3JlYXRlRWwoJ3N0YWdlJyk7XG4gICAgICBzdGFnZVByb3RvLnN0eWxlW2Nzcy5wZXJzcGVjdGl2ZV0gPSB0aGlzLl9jb25maWcucGVyc3BlY3RpdmUgKyAncHgnO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBhbmNob3JMaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGFuY2hvciA9IGFuY2hvckxpc3RbX2ldO1xuICAgICAgICB0aGlzLl9wYW5lbHNbYW5jaG9yXSA9IFtdO1xuICAgICAgICB0aGlzLl9zdGFnZXNbYW5jaG9yXSA9IGNsb25lRWwoc3RhZ2VQcm90bywgZmFsc2UsICdzdGFnZScgKyBjYXBpdGFsaXplKGFuY2hvcikpO1xuICAgICAgICBpZiAodGhpcy5fc2hhZGluZykge1xuICAgICAgICAgIHRoaXMuX3NoYWRlcnNbYW5jaG9yXSA9IHt9O1xuICAgICAgICAgIGlmIChfX2luZGV4T2YuY2FsbChhbmNob3JMaXN0ViwgYW5jaG9yKSA+PSAwKSB7XG4gICAgICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBhbmNob3JMaXN0Vi5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgICAgICAgc2lkZSA9IGFuY2hvckxpc3RWW19qXTtcbiAgICAgICAgICAgICAgdGhpcy5fc2hhZGVyc1thbmNob3JdW3NpZGVdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoX2sgPSAwLCBfbGVuMiA9IGFuY2hvckxpc3RILmxlbmd0aDsgX2sgPCBfbGVuMjsgX2srKykge1xuICAgICAgICAgICAgICBzaWRlID0gYW5jaG9yTGlzdEhbX2tdO1xuICAgICAgICAgICAgICB0aGlzLl9zaGFkZXJzW2FuY2hvcl1bc2lkZV0gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgc2hhZGVyUHJvdG9zW2FuY2hvcl0gPSBjbG9uZUVsKHNoYWRlclByb3RvLCBmYWxzZSwgJ3NoYWRlcicgKyBjYXBpdGFsaXplKGFuY2hvcikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb250ZW50SG9sZGVyID0gY2xvbmVFbCh0aGlzLmVsLCB0cnVlLCAnY29udGVudCcpO1xuICAgICAgbWFza1Byb3RvID0gY3JlYXRlRWwoJ21hc2snKTtcbiAgICAgIG1hc2tQcm90by5hcHBlbmRDaGlsZChjb250ZW50SG9sZGVyKTtcbiAgICAgIHBhbmVsUHJvdG8gPSBjcmVhdGVFbCgncGFuZWwnKTtcbiAgICAgIHBhbmVsUHJvdG8uc3R5bGVbY3NzLnRyYW5zaXRpb25EdXJhdGlvbl0gPSB0aGlzLl9jb25maWcuc3BlZWQgKyAnbXMnO1xuICAgICAgcGFuZWxQcm90by5zdHlsZVtjc3MudHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uXSA9IHRoaXMuX2NvbmZpZy5lYXNpbmdNZXRob2Q7XG4gICAgICBvZmZzZXRzID0ge1xuICAgICAgICBsZWZ0OiBbXSxcbiAgICAgICAgdG9wOiBbXVxuICAgICAgfTtcbiAgICAgIF9yZWYxID0gWyd4JywgJ3knXTtcbiAgICAgIGZvciAoX2wgPSAwLCBfbGVuMyA9IF9yZWYxLmxlbmd0aDsgX2wgPCBfbGVuMzsgX2wrKykge1xuICAgICAgICBheGlzID0gX3JlZjFbX2xdO1xuICAgICAgICBpZiAoYXhpcyA9PT0gJ3gnKSB7XG4gICAgICAgICAgYW5jaG9yU2V0ID0gYW5jaG9yTGlzdFY7XG4gICAgICAgICAgbWV0cmljID0gJ3dpZHRoJztcbiAgICAgICAgICBjbGFzc1N1ZmZpeCA9ICdWJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhbmNob3JTZXQgPSBhbmNob3JMaXN0SDtcbiAgICAgICAgICBtZXRyaWMgPSAnaGVpZ2h0JztcbiAgICAgICAgICBjbGFzc1N1ZmZpeCA9ICdIJztcbiAgICAgICAgfVxuICAgICAgICBwYW5lbENvbmZpZyA9IHRoaXMuX2NvbmZpZ1twYW5lbEtleSA9IGNsYXNzU3VmZml4LnRvTG93ZXJDYXNlKCkgKyAnUGFuZWxzJ107XG4gICAgICAgIGlmICh0eXBlb2YgcGFuZWxDb25maWcgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgY291bnQgPSBNYXRoLmFicyhwYXJzZUludChwYW5lbENvbmZpZywgMTApKTtcbiAgICAgICAgICBwZXJjZW50ID0gMTAwIC8gY291bnQ7XG4gICAgICAgICAgcGFuZWxDb25maWcgPSB0aGlzLl9jb25maWdbcGFuZWxLZXldID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIF9tLCBfcmVzdWx0cztcbiAgICAgICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgICAgICBmb3IgKF9tID0gMDsgMCA8PSBjb3VudCA/IF9tIDwgY291bnQgOiBfbSA+IGNvdW50OyAwIDw9IGNvdW50ID8gX20rKyA6IF9tLS0pIHtcbiAgICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChwZXJjZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgICAgICB9KSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvdW50ID0gcGFuZWxDb25maWcubGVuZ3RoO1xuICAgICAgICAgIGlmICghKCg5OSA8PSAoX3JlZjIgPSBwYW5lbENvbmZpZy5yZWR1Y2UoZnVuY3Rpb24ocCwgYykge1xuICAgICAgICAgICAgcmV0dXJuIHAgKyBjO1xuICAgICAgICAgIH0pKSAmJiBfcmVmMiA8PSAxMDAuMSkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09yaURvbWk6IFBhbmVsIHBlcmNlbnRhZ2VzIGRvIG5vdCBzdW0gdG8gMTAwJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG1hc2sgPSBjbG9uZUVsKG1hc2tQcm90bywgdHJ1ZSwgJ21hc2snICsgY2xhc3NTdWZmaXgpO1xuICAgICAgICBpZiAodGhpcy5fc2hhZGluZykge1xuICAgICAgICAgIGZvciAoX20gPSAwLCBfbGVuNCA9IGFuY2hvclNldC5sZW5ndGg7IF9tIDwgX2xlbjQ7IF9tKyspIHtcbiAgICAgICAgICAgIGFuY2hvciA9IGFuY2hvclNldFtfbV07XG4gICAgICAgICAgICBtYXNrLmFwcGVuZENoaWxkKHNoYWRlclByb3Rvc1thbmNob3JdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcHJvdG8gPSBjbG9uZUVsKHBhbmVsUHJvdG8sIGZhbHNlLCAncGFuZWwnICsgY2xhc3NTdWZmaXgpO1xuICAgICAgICBwcm90by5hcHBlbmRDaGlsZChtYXNrKTtcbiAgICAgICAgZm9yIChyaWdodE9yQm90dG9tID0gX24gPSAwLCBfbGVuNSA9IGFuY2hvclNldC5sZW5ndGg7IF9uIDwgX2xlbjU7IHJpZ2h0T3JCb3R0b20gPSArK19uKSB7XG4gICAgICAgICAgYW5jaG9yID0gYW5jaG9yU2V0W3JpZ2h0T3JCb3R0b21dO1xuICAgICAgICAgIGZvciAocGFuZWxOID0gX28gPSAwOyAwIDw9IGNvdW50ID8gX28gPCBjb3VudCA6IF9vID4gY291bnQ7IHBhbmVsTiA9IDAgPD0gY291bnQgPyArK19vIDogLS1fbykge1xuICAgICAgICAgICAgcGFuZWwgPSBwcm90by5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBjb250ZW50ID0gcGFuZWwuY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF07XG4gICAgICAgICAgICBjb250ZW50LnN0eWxlLndpZHRoID0gY29udGVudC5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gICAgICAgICAgICBpZiAocmlnaHRPckJvdHRvbSkge1xuICAgICAgICAgICAgICBwYW5lbC5zdHlsZVtjc3Mub3JpZ2luXSA9IGFuY2hvcjtcbiAgICAgICAgICAgICAgaW5kZXggPSBwYW5lbENvbmZpZy5sZW5ndGggLSBwYW5lbE4gLSAxO1xuICAgICAgICAgICAgICBwcmV2ID0gaW5kZXggKyAxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaW5kZXggPSBwYW5lbE47XG4gICAgICAgICAgICAgIHByZXYgPSBpbmRleCAtIDE7XG4gICAgICAgICAgICAgIGlmIChwYW5lbE4gPT09IDApIHtcbiAgICAgICAgICAgICAgICBvZmZzZXRzW2FuY2hvcl0ucHVzaCgwKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvZmZzZXRzW2FuY2hvcl0ucHVzaCgob2Zmc2V0c1thbmNob3JdW3ByZXZdIC0gMTAwKSAqIChwYW5lbENvbmZpZ1twcmV2XSAvIHBhbmVsQ29uZmlnW2luZGV4XSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGFuZWxOID09PSAwKSB7XG4gICAgICAgICAgICAgIHBhbmVsLnN0eWxlW2FuY2hvcl0gPSAnMCc7XG4gICAgICAgICAgICAgIHBhbmVsLnN0eWxlW21ldHJpY10gPSBwYW5lbENvbmZpZ1tpbmRleF0gKyAnJSc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwYW5lbC5zdHlsZVthbmNob3JdID0gJzEwMCUnO1xuICAgICAgICAgICAgICBwYW5lbC5zdHlsZVttZXRyaWNdID0gcGFuZWxDb25maWdbaW5kZXhdIC8gcGFuZWxDb25maWdbcHJldl0gKiAxMDAgKyAnJSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fc2hhZGluZykge1xuICAgICAgICAgICAgICBmb3IgKGkgPSBfcCA9IDAsIF9sZW42ID0gYW5jaG9yU2V0Lmxlbmd0aDsgX3AgPCBfbGVuNjsgaSA9ICsrX3ApIHtcbiAgICAgICAgICAgICAgICBhID0gYW5jaG9yU2V0W2ldO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NoYWRlcnNbYW5jaG9yXVthXVtwYW5lbE5dID0gcGFuZWwuY2hpbGRyZW5bMF0uY2hpbGRyZW5baSArIDFdO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZW50LnN0eWxlW21ldHJpY10gPSBjb250ZW50LnN0eWxlWydtYXgnICsgY2FwaXRhbGl6ZShtZXRyaWMpXSA9IChjb3VudCAvIHBhbmVsQ29uZmlnW2luZGV4XSAqIDEwMDAwIC8gY291bnQpICsgJyUnO1xuICAgICAgICAgICAgY29udGVudC5zdHlsZVthbmNob3JTZXRbMF1dID0gb2Zmc2V0c1thbmNob3JTZXRbMF1dW2luZGV4XSArICclJztcbiAgICAgICAgICAgIHRoaXMuX3RyYW5zZm9ybVBhbmVsKHBhbmVsLCAwLCBhbmNob3IpO1xuICAgICAgICAgICAgdGhpcy5fcGFuZWxzW2FuY2hvcl1bcGFuZWxOXSA9IHBhbmVsO1xuICAgICAgICAgICAgaWYgKHBhbmVsTiAhPT0gMCkge1xuICAgICAgICAgICAgICB0aGlzLl9wYW5lbHNbYW5jaG9yXVtwYW5lbE4gLSAxXS5hcHBlbmRDaGlsZChwYW5lbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuX3N0YWdlc1thbmNob3JdLmFwcGVuZENoaWxkKHRoaXMuX3BhbmVsc1thbmNob3JdWzBdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fc3RhZ2VIb2xkZXIgPSBjcmVhdGVFbCgnaG9sZGVyJyk7XG4gICAgICB0aGlzLl9zdGFnZUhvbGRlci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICAgIGZvciAoX3EgPSAwLCBfbGVuNyA9IGFuY2hvckxpc3QubGVuZ3RoOyBfcSA8IF9sZW43OyBfcSsrKSB7XG4gICAgICAgIGFuY2hvciA9IGFuY2hvckxpc3RbX3FdO1xuICAgICAgICB0aGlzLl9zdGFnZUhvbGRlci5hcHBlbmRDaGlsZCh0aGlzLl9zdGFnZXNbYW5jaG9yXSk7XG4gICAgICB9XG4gICAgICBpZiAod2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy5lbCkucG9zaXRpb24gPT09ICdhYnNvbHV0ZScpIHtcbiAgICAgICAgdGhpcy5lbC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICB9XG4gICAgICB0aGlzLmVsLmNsYXNzTGlzdC5hZGQoZWxDbGFzc2VzLmFjdGl2ZSk7XG4gICAgICBzaG93RWwodGhpcy5fc3RhZ2VzLmxlZnQpO1xuICAgICAgdGhpcy5fY2xvbmVFbCA9IGNsb25lRWwodGhpcy5lbCwgdHJ1ZSwgJ2Nsb25lJyk7XG4gICAgICB0aGlzLl9jbG9uZUVsLmNsYXNzTGlzdC5yZW1vdmUoZWxDbGFzc2VzLmFjdGl2ZSk7XG4gICAgICBoaWRlRWwodGhpcy5fY2xvbmVFbCk7XG4gICAgICB0aGlzLmVsLmlubmVySFRNTCA9ICcnO1xuICAgICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLl9jbG9uZUVsKTtcbiAgICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy5fc3RhZ2VIb2xkZXIpO1xuICAgICAgdGhpcy5lbC5wYXJlbnROb2RlLnN0eWxlW2Nzcy50cmFuc2Zvcm1TdHlsZV0gPSAncHJlc2VydmUtM2QnO1xuICAgICAgdGhpcy5hY2NvcmRpb24oMCk7XG4gICAgICBpZiAodGhpcy5fY29uZmlnLnJpcHBsZSkge1xuICAgICAgICB0aGlzLnNldFJpcHBsZSh0aGlzLl9jb25maWcucmlwcGxlKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9jb25maWcudG91Y2hFbmFibGVkKSB7XG4gICAgICAgIHRoaXMuZW5hYmxlVG91Y2goKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fc3RlcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFuY2hvciwgYW5nbGUsIGZuLCBuZXh0LCBvcHRpb25zLCBfcmVmMTtcbiAgICAgIGlmICh0aGlzLl9pblRyYW5zIHx8ICF0aGlzLl9xdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5faW5UcmFucyA9IHRydWU7XG4gICAgICBfcmVmMSA9IHRoaXMuX3F1ZXVlLnNoaWZ0KCksIGZuID0gX3JlZjFbMF0sIGFuZ2xlID0gX3JlZjFbMV0sIGFuY2hvciA9IF9yZWYxWzJdLCBvcHRpb25zID0gX3JlZjFbM107XG4gICAgICBpZiAodGhpcy5pc0Zyb3plbikge1xuICAgICAgICB0aGlzLnVuZnJlZXplKCk7XG4gICAgICB9XG4gICAgICBuZXh0ID0gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYXJncztcbiAgICAgICAgICBfdGhpcy5fc2V0Q2FsbGJhY2soe1xuICAgICAgICAgICAgYW5nbGU6IGFuZ2xlLFxuICAgICAgICAgICAgYW5jaG9yOiBhbmNob3IsXG4gICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxuICAgICAgICAgICAgZm46IGZuXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYXJncyA9IFthbmdsZSwgYW5jaG9yLCBvcHRpb25zXTtcbiAgICAgICAgICBpZiAoZm4ubGVuZ3RoIDwgMykge1xuICAgICAgICAgICAgYXJncy5zaGlmdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZm4uYXBwbHkoX3RoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcyk7XG4gICAgICBpZiAodGhpcy5pc0ZvbGRlZFVwKSB7XG4gICAgICAgIGlmIChmbi5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLl91bmZvbGQobmV4dCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYW5jaG9yICE9PSB0aGlzLl9sYXN0T3AuYW5jaG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGFnZVJlc2V0KGFuY2hvciwgbmV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5faXNJZGVudGljYWxPcGVyYXRpb24gPSBmdW5jdGlvbihvcCkge1xuICAgICAgdmFyIGtleSwgX2ksIF9sZW4sIF9yZWYxLCBfcmVmMjtcbiAgICAgIGlmICghdGhpcy5fbGFzdE9wLmZuKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2xhc3RPcC5yZXNldCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBfcmVmMSA9IFsnYW5nbGUnLCAnYW5jaG9yJywgJ2ZuJ107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGtleSA9IF9yZWYxW19pXTtcbiAgICAgICAgaWYgKHRoaXMuX2xhc3RPcFtrZXldICE9PSBvcFtrZXldKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBfcmVmMiA9IG9wLm9wdGlvbnM7XG4gICAgICBmb3IgKGsgaW4gX3JlZjIpIHtcbiAgICAgICAgdiA9IF9yZWYyW2tdO1xuICAgICAgICBpZiAodiAhPT0gdGhpcy5fbGFzdE9wLm9wdGlvbnNba10gJiYgayAhPT0gJ2NhbGxiYWNrJykge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9zZXRDYWxsYmFjayA9IGZ1bmN0aW9uKG9wZXJhdGlvbikge1xuICAgICAgaWYgKCF0aGlzLl9jb25maWcuc3BlZWQgfHwgdGhpcy5faXNJZGVudGljYWxPcGVyYXRpb24ob3BlcmF0aW9uKSkge1xuICAgICAgICB0aGlzLl9jb25jbHVkZShvcGVyYXRpb24ub3B0aW9ucy5jYWxsYmFjayk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9wYW5lbHNbdGhpcy5fbGFzdE9wLmFuY2hvcl1bMF0uYWRkRXZlbnRMaXN0ZW5lcihjc3MudHJhbnNpdGlvbkVuZCwgdGhpcy5fb25UcmFuc2l0aW9uRW5kLCBmYWxzZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gKHRoaXMuX2xhc3RPcCA9IG9wZXJhdGlvbikucmVzZXQgPSBmYWxzZTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX29uVHJhbnNpdGlvbkVuZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUuY3VycmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKGNzcy50cmFuc2l0aW9uRW5kLCB0aGlzLl9vblRyYW5zaXRpb25FbmQsIGZhbHNlKTtcbiAgICAgIHJldHVybiB0aGlzLl9jb25jbHVkZSh0aGlzLl9sYXN0T3Aub3B0aW9ucy5jYWxsYmFjaywgZSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9jb25jbHVkZSA9IGZ1bmN0aW9uKGNiLCBldmVudCkge1xuICAgICAgcmV0dXJuIGRlZmVyKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMuX2luVHJhbnMgPSBmYWxzZTtcbiAgICAgICAgICBfdGhpcy5fc3RlcCgpO1xuICAgICAgICAgIHJldHVybiB0eXBlb2YgY2IgPT09IFwiZnVuY3Rpb25cIiA/IGNiKGV2ZW50LCBfdGhpcykgOiB2b2lkIDA7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl90cmFuc2Zvcm1QYW5lbCA9IGZ1bmN0aW9uKGVsLCBhbmdsZSwgYW5jaG9yLCBmcmFjdHVyZSkge1xuICAgICAgdmFyIHRyYW5zUHJlZml4LCB4LCB5LCB6O1xuICAgICAgeCA9IHkgPSB6ID0gMDtcbiAgICAgIHN3aXRjaCAoYW5jaG9yKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIHkgPSBhbmdsZTtcbiAgICAgICAgICB0cmFuc1ByZWZpeCA9ICdYKC0nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgeSA9IC1hbmdsZTtcbiAgICAgICAgICB0cmFuc1ByZWZpeCA9ICdYKCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgICAgeCA9IC1hbmdsZTtcbiAgICAgICAgICB0cmFuc1ByZWZpeCA9ICdZKC0nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdib3R0b20nOlxuICAgICAgICAgIHggPSBhbmdsZTtcbiAgICAgICAgICB0cmFuc1ByZWZpeCA9ICdZKCc7XG4gICAgICB9XG4gICAgICBpZiAoZnJhY3R1cmUpIHtcbiAgICAgICAgeCA9IHkgPSB6ID0gYW5nbGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZWwuc3R5bGVbY3NzLnRyYW5zZm9ybV0gPSBcInJvdGF0ZVgoXCIgKyB4ICsgXCJkZWcpIHJvdGF0ZVkoXCIgKyB5ICsgXCJkZWcpIHJvdGF0ZVooXCIgKyB6ICsgXCJkZWcpIHRyYW5zbGF0ZVwiICsgdHJhbnNQcmVmaXggKyB0aGlzLl9jb25maWcuZ2FwTnVkZ2UgKyBcInB4KSB0cmFuc2xhdGVaKDApXCI7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9ub3JtYWxpemVBbmdsZSA9IGZ1bmN0aW9uKGFuZ2xlKSB7XG4gICAgICB2YXIgbWF4O1xuICAgICAgYW5nbGUgPSBwYXJzZUZsb2F0KGFuZ2xlLCAxMCk7XG4gICAgICBtYXggPSB0aGlzLl9jb25maWcubWF4QW5nbGU7XG4gICAgICBpZiAoaXNOYU4oYW5nbGUpKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfSBlbHNlIGlmIChhbmdsZSA+IG1heCkge1xuICAgICAgICByZXR1cm4gbWF4O1xuICAgICAgfSBlbHNlIGlmIChhbmdsZSA8IC1tYXgpIHtcbiAgICAgICAgcmV0dXJuIC1tYXg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gYW5nbGU7XG4gICAgICB9XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9zZXRUcmFucyA9IGZ1bmN0aW9uKGR1cmF0aW9uLCBkZWxheSwgYW5jaG9yKSB7XG4gICAgICBpZiAoYW5jaG9yID09IG51bGwpIHtcbiAgICAgICAgYW5jaG9yID0gdGhpcy5fbGFzdE9wLmFuY2hvcjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9pdGVyYXRlKGFuY2hvciwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihwYW5lbCwgaSwgbGVuKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLl9zZXRQYW5lbFRyYW5zLmFwcGx5KF90aGlzLCBbYW5jaG9yXS5jb25jYXQoX19zbGljZS5jYWxsKGFyZ3VtZW50cyksIFtkdXJhdGlvbl0sIFtkZWxheV0pKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX3NldFBhbmVsVHJhbnMgPSBmdW5jdGlvbihhbmNob3IsIHBhbmVsLCBpLCBsZW4sIGR1cmF0aW9uLCBkZWxheSkge1xuICAgICAgdmFyIGRlbGF5TXMsIHNoYWRlciwgc2lkZSwgX2ksIF9sZW4sIF9yZWYxO1xuICAgICAgZGVsYXlNcyA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgc3dpdGNoIChkZWxheSkge1xuICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb25maWcuc3BlZWQgLyBsZW4gKiBpO1xuICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb25maWcuc3BlZWQgLyBsZW4gKiAobGVuIC0gaSAtIDEpO1xuICAgICAgICB9XG4gICAgICB9KS5jYWxsKHRoaXMpO1xuICAgICAgcGFuZWwuc3R5bGVbY3NzLnRyYW5zaXRpb25EdXJhdGlvbl0gPSBkdXJhdGlvbiArICdtcyc7XG4gICAgICBwYW5lbC5zdHlsZVtjc3MudHJhbnNpdGlvbkRlbGF5XSA9IGRlbGF5TXMgKyAnbXMnO1xuICAgICAgaWYgKHRoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgX3JlZjEgPSAoX19pbmRleE9mLmNhbGwoYW5jaG9yTGlzdFYsIGFuY2hvcikgPj0gMCA/IGFuY2hvckxpc3RWIDogYW5jaG9yTGlzdEgpO1xuICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgc2lkZSA9IF9yZWYxW19pXTtcbiAgICAgICAgICBzaGFkZXIgPSB0aGlzLl9zaGFkZXJzW2FuY2hvcl1bc2lkZV1baV07XG4gICAgICAgICAgc2hhZGVyLnN0eWxlW2Nzcy50cmFuc2l0aW9uRHVyYXRpb25dID0gZHVyYXRpb24gKyAnbXMnO1xuICAgICAgICAgIHNoYWRlci5zdHlsZVtjc3MudHJhbnNpdGlvbkRlbGF5XSA9IGRlbGF5TXMgKyAnbXMnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVsYXlNcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX3NldFNoYWRlciA9IGZ1bmN0aW9uKG4sIGFuY2hvciwgYW5nbGUpIHtcbiAgICAgIHZhciBhLCBhYnMsIGIsIG9wYWNpdHk7XG4gICAgICBhYnMgPSBNYXRoLmFicyhhbmdsZSk7XG4gICAgICBvcGFjaXR5ID0gYWJzIC8gOTAgKiB0aGlzLl9jb25maWcuc2hhZGluZ0ludGVuc2l0eTtcbiAgICAgIGlmICh0aGlzLl9zaGFkaW5nID09PSAnaGFyZCcpIHtcbiAgICAgICAgb3BhY2l0eSAqPSAuMTU7XG4gICAgICAgIGlmICh0aGlzLl9sYXN0T3AuYW5nbGUgPCAwKSB7XG4gICAgICAgICAgYW5nbGUgPSBhYnM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYW5nbGUgPSAtYWJzO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcGFjaXR5ICo9IC40O1xuICAgICAgfVxuICAgICAgaWYgKF9faW5kZXhPZi5jYWxsKGFuY2hvckxpc3RWLCBhbmNob3IpID49IDApIHtcbiAgICAgICAgaWYgKGFuZ2xlIDwgMCkge1xuICAgICAgICAgIGEgPSBvcGFjaXR5O1xuICAgICAgICAgIGIgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGEgPSAwO1xuICAgICAgICAgIGIgPSBvcGFjaXR5O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NoYWRlcnNbYW5jaG9yXS5sZWZ0W25dLnN0eWxlLm9wYWNpdHkgPSBhO1xuICAgICAgICByZXR1cm4gdGhpcy5fc2hhZGVyc1thbmNob3JdLnJpZ2h0W25dLnN0eWxlLm9wYWNpdHkgPSBiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGFuZ2xlIDwgMCkge1xuICAgICAgICAgIGEgPSAwO1xuICAgICAgICAgIGIgPSBvcGFjaXR5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGEgPSBvcGFjaXR5O1xuICAgICAgICAgIGIgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NoYWRlcnNbYW5jaG9yXS50b3Bbbl0uc3R5bGUub3BhY2l0eSA9IGE7XG4gICAgICAgIHJldHVybiB0aGlzLl9zaGFkZXJzW2FuY2hvcl0uYm90dG9tW25dLnN0eWxlLm9wYWNpdHkgPSBiO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fc2hvd1N0YWdlID0gZnVuY3Rpb24oYW5jaG9yKSB7XG4gICAgICBpZiAoYW5jaG9yICE9PSB0aGlzLl9sYXN0T3AuYW5jaG9yKSB7XG4gICAgICAgIGhpZGVFbCh0aGlzLl9zdGFnZXNbdGhpcy5fbGFzdE9wLmFuY2hvcl0pO1xuICAgICAgICB0aGlzLl9sYXN0T3AuYW5jaG9yID0gYW5jaG9yO1xuICAgICAgICB0aGlzLl9sYXN0T3AucmVzZXQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhZ2VzW2FuY2hvcl0uc3R5bGVbY3NzLnRyYW5zZm9ybV0gPSAndHJhbnNsYXRlM2QoJyArIChmdW5jdGlvbigpIHtcbiAgICAgICAgICBzd2l0Y2ggKGFuY2hvcikge1xuICAgICAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgICAgIHJldHVybiAnMCwgMCwgMCknO1xuICAgICAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgICAgICByZXR1cm4gXCItXCIgKyB0aGlzLl9jb25maWcudlBhbmVscy5sZW5ndGggKyBcInB4LCAwLCAwKVwiO1xuICAgICAgICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgICAgICAgcmV0dXJuICcwLCAwLCAwKSc7XG4gICAgICAgICAgICBjYXNlICdib3R0b20nOlxuICAgICAgICAgICAgICByZXR1cm4gXCIwLCAtXCIgKyB0aGlzLl9jb25maWcuaFBhbmVscy5sZW5ndGggKyBcInB4LCAwKVwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkuY2FsbCh0aGlzKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX3N0YWdlUmVzZXQgPSBmdW5jdGlvbihhbmNob3IsIGNiKSB7XG4gICAgICB2YXIgZm47XG4gICAgICBmbiA9IChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihjc3MudHJhbnNpdGlvbkVuZCwgZm4sIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgX3RoaXMuX3Nob3dTdGFnZShhbmNob3IpO1xuICAgICAgICAgIHJldHVybiBkZWZlcihjYik7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKTtcbiAgICAgIGlmICh0aGlzLl9sYXN0T3AuYW5nbGUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGZuKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9wYW5lbHNbdGhpcy5fbGFzdE9wLmFuY2hvcl1bMF0uYWRkRXZlbnRMaXN0ZW5lcihjc3MudHJhbnNpdGlvbkVuZCwgZm4sIGZhbHNlKTtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyYXRlKHRoaXMuX2xhc3RPcC5hbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocGFuZWwsIGkpIHtcbiAgICAgICAgICBfdGhpcy5fdHJhbnNmb3JtUGFuZWwocGFuZWwsIDAsIF90aGlzLl9sYXN0T3AuYW5jaG9yKTtcbiAgICAgICAgICBpZiAoX3RoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5fc2V0U2hhZGVyKGksIF90aGlzLl9sYXN0T3AuYW5jaG9yLCAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9nZXRMb25naGFuZEFuY2hvciA9IGZ1bmN0aW9uKHNob3J0aGFuZCkge1xuICAgICAgc3dpdGNoIChzaG9ydGhhbmQudG9TdHJpbmcoKSkge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgY2FzZSAnbCc6XG4gICAgICAgIGNhc2UgJzQnOlxuICAgICAgICAgIHJldHVybiAnbGVmdCc7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgY2FzZSAncic6XG4gICAgICAgIGNhc2UgJzInOlxuICAgICAgICAgIHJldHVybiAncmlnaHQnO1xuICAgICAgICBjYXNlICd0b3AnOlxuICAgICAgICBjYXNlICd0JzpcbiAgICAgICAgY2FzZSAnMSc6XG4gICAgICAgICAgcmV0dXJuICd0b3AnO1xuICAgICAgICBjYXNlICdib3R0b20nOlxuICAgICAgICBjYXNlICdiJzpcbiAgICAgICAgY2FzZSAnMyc6XG4gICAgICAgICAgcmV0dXJuICdib3R0b20nO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiAnbGVmdCc7XG4gICAgICB9XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9zZXRDdXJzb3IgPSBmdW5jdGlvbihib29sKSB7XG4gICAgICBpZiAoYm9vbCA9PSBudWxsKSB7XG4gICAgICAgIGJvb2wgPSB0aGlzLl90b3VjaEVuYWJsZWQ7XG4gICAgICB9XG4gICAgICBpZiAoYm9vbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbC5zdHlsZS5jdXJzb3IgPSBjc3MuZ3JhYjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX3NldFRvdWNoID0gZnVuY3Rpb24odG9nZ2xlKSB7XG4gICAgICB2YXIgZVN0cmluZywgZXZlbnRQYWlyLCBldmVudFBhaXJzLCBsaXN0ZW5GbiwgbW91c2VMZWF2ZVN1cHBvcnQsIF9pLCBfaiwgX2xlbiwgX2xlbjE7XG4gICAgICBpZiAodG9nZ2xlKSB7XG4gICAgICAgIGlmICh0aGlzLl90b3VjaEVuYWJsZWQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBsaXN0ZW5GbiA9ICdhZGRFdmVudExpc3RlbmVyJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghdGhpcy5fdG91Y2hFbmFibGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgbGlzdGVuRm4gPSAncmVtb3ZlRXZlbnRMaXN0ZW5lcic7XG4gICAgICB9XG4gICAgICB0aGlzLl90b3VjaEVuYWJsZWQgPSB0b2dnbGU7XG4gICAgICB0aGlzLl9zZXRDdXJzb3IoKTtcbiAgICAgIGV2ZW50UGFpcnMgPSBbWydUb3VjaFN0YXJ0JywgJ01vdXNlRG93biddLCBbJ1RvdWNoRW5kJywgJ01vdXNlVXAnXSwgWydUb3VjaE1vdmUnLCAnTW91c2VNb3ZlJ10sIFsnVG91Y2hMZWF2ZScsICdNb3VzZUxlYXZlJ11dO1xuICAgICAgbW91c2VMZWF2ZVN1cHBvcnQgPSAnb25tb3VzZWxlYXZlJyBpbiB3aW5kb3c7XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGV2ZW50UGFpcnMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgZXZlbnRQYWlyID0gZXZlbnRQYWlyc1tfaV07XG4gICAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IGV2ZW50UGFpci5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgICBlU3RyaW5nID0gZXZlbnRQYWlyW19qXTtcbiAgICAgICAgICBpZiAoIShlU3RyaW5nID09PSAnVG91Y2hMZWF2ZScgJiYgIW1vdXNlTGVhdmVTdXBwb3J0KSkge1xuICAgICAgICAgICAgdGhpcy5lbFtsaXN0ZW5Gbl0oZVN0cmluZy50b0xvd2VyQ2FzZSgpLCB0aGlzWydfb24nICsgZXZlbnRQYWlyWzBdXSwgZmFsc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVsW2xpc3RlbkZuXSgnbW91c2VvdXQnLCB0aGlzLl9vbk1vdXNlT3V0LCBmYWxzZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fb25Ub3VjaFN0YXJ0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIGF4aXMxLCBfcmVmMTtcbiAgICAgIGlmICghdGhpcy5fdG91Y2hFbmFibGVkIHx8IHRoaXMuaXNGb2xkZWRVcCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLmVtcHR5UXVldWUoKTtcbiAgICAgIHRoaXMuX3RvdWNoU3RhcnRlZCA9IHRydWU7XG4gICAgICB0aGlzLmVsLnN0eWxlLmN1cnNvciA9IGNzcy5ncmFiYmluZztcbiAgICAgIHRoaXMuX3NldFRyYW5zKDAsIDApO1xuICAgICAgdGhpcy5fdG91Y2hBeGlzID0gKF9yZWYxID0gdGhpcy5fbGFzdE9wLmFuY2hvciwgX19pbmRleE9mLmNhbGwoYW5jaG9yTGlzdFYsIF9yZWYxKSA+PSAwKSA/ICd4JyA6ICd5JztcbiAgICAgIHRoaXNbXCJfXCIgKyB0aGlzLl90b3VjaEF4aXMgKyBcIkxhc3RcIl0gPSB0aGlzLl9sYXN0T3AuYW5nbGU7XG4gICAgICBheGlzMSA9IFwiX1wiICsgdGhpcy5fdG91Y2hBeGlzICsgXCIxXCI7XG4gICAgICBpZiAoZS50eXBlID09PSAnbW91c2Vkb3duJykge1xuICAgICAgICB0aGlzW2F4aXMxXSA9IGVbXCJwYWdlXCIgKyAodGhpcy5fdG91Y2hBeGlzLnRvVXBwZXJDYXNlKCkpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXNbYXhpczFdID0gZS50YXJnZXRUb3VjaGVzWzBdW1wicGFnZVwiICsgKHRoaXMuX3RvdWNoQXhpcy50b1VwcGVyQ2FzZSgpKV07XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fY29uZmlnLnRvdWNoU3RhcnRDYWxsYmFjayh0aGlzW2F4aXMxXSwgZSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9vblRvdWNoTW92ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBjdXJyZW50LCBkZWx0YSwgZGlzdGFuY2U7XG4gICAgICBpZiAoISh0aGlzLl90b3VjaEVuYWJsZWQgJiYgdGhpcy5fdG91Y2hTdGFydGVkKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBpZiAoZS50eXBlID09PSAnbW91c2Vtb3ZlJykge1xuICAgICAgICBjdXJyZW50ID0gZVtcInBhZ2VcIiArICh0aGlzLl90b3VjaEF4aXMudG9VcHBlckNhc2UoKSldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3VycmVudCA9IGUudGFyZ2V0VG91Y2hlc1swXVtcInBhZ2VcIiArICh0aGlzLl90b3VjaEF4aXMudG9VcHBlckNhc2UoKSldO1xuICAgICAgfVxuICAgICAgZGlzdGFuY2UgPSAoY3VycmVudCAtIHRoaXNbXCJfXCIgKyB0aGlzLl90b3VjaEF4aXMgKyBcIjFcIl0pICogdGhpcy5fY29uZmlnLnRvdWNoU2Vuc2l0aXZpdHk7XG4gICAgICBpZiAodGhpcy5fbGFzdE9wLmFuZ2xlIDwgMCkge1xuICAgICAgICBpZiAodGhpcy5fbGFzdE9wLmFuY2hvciA9PT0gJ3JpZ2h0JyB8fCB0aGlzLl9sYXN0T3AuYW5jaG9yID09PSAnYm90dG9tJykge1xuICAgICAgICAgIGRlbHRhID0gdGhpc1tcIl9cIiArIHRoaXMuX3RvdWNoQXhpcyArIFwiTGFzdFwiXSAtIGRpc3RhbmNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlbHRhID0gdGhpc1tcIl9cIiArIHRoaXMuX3RvdWNoQXhpcyArIFwiTGFzdFwiXSArIGRpc3RhbmNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWx0YSA+IDApIHtcbiAgICAgICAgICBkZWx0YSA9IDA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLl9sYXN0T3AuYW5jaG9yID09PSAncmlnaHQnIHx8IHRoaXMuX2xhc3RPcC5hbmNob3IgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgZGVsdGEgPSB0aGlzW1wiX1wiICsgdGhpcy5fdG91Y2hBeGlzICsgXCJMYXN0XCJdICsgZGlzdGFuY2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVsdGEgPSB0aGlzW1wiX1wiICsgdGhpcy5fdG91Y2hBeGlzICsgXCJMYXN0XCJdIC0gZGlzdGFuY2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICAgIGRlbHRhID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fbGFzdE9wLmFuZ2xlID0gZGVsdGEgPSB0aGlzLl9ub3JtYWxpemVBbmdsZShkZWx0YSk7XG4gICAgICB0aGlzLl9sYXN0T3AuZm4uY2FsbCh0aGlzLCBkZWx0YSwgdGhpcy5fbGFzdE9wLmFuY2hvciwgdGhpcy5fbGFzdE9wLm9wdGlvbnMpO1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZy50b3VjaE1vdmVDYWxsYmFjayhkZWx0YSwgZSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9vblRvdWNoRW5kID0gZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKCF0aGlzLl90b3VjaEVuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5fdG91Y2hTdGFydGVkID0gdGhpcy5faW5UcmFucyA9IGZhbHNlO1xuICAgICAgdGhpcy5lbC5zdHlsZS5jdXJzb3IgPSBjc3MuZ3JhYjtcbiAgICAgIHRoaXMuX3NldFRyYW5zKHRoaXMuX2NvbmZpZy5zcGVlZCwgdGhpcy5fY29uZmlnLnJpcHBsZSk7XG4gICAgICByZXR1cm4gdGhpcy5fY29uZmlnLnRvdWNoRW5kQ2FsbGJhY2sodGhpc1tcIl9cIiArIHRoaXMuX3RvdWNoQXhpcyArIFwiTGFzdFwiXSwgZSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLl9vblRvdWNoTGVhdmUgPSBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoISh0aGlzLl90b3VjaEVuYWJsZWQgJiYgdGhpcy5fdG91Y2hTdGFydGVkKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fb25Ub3VjaEVuZChlKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuX29uTW91c2VPdXQgPSBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoISh0aGlzLl90b3VjaEVuYWJsZWQgJiYgdGhpcy5fdG91Y2hTdGFydGVkKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoZS50b0VsZW1lbnQgJiYgIXRoaXMuZWwuY29udGFpbnMoZS50b0VsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9vblRvdWNoRW5kKGUpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5fdW5mb2xkID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHZhciBhbmNob3I7XG4gICAgICB0aGlzLl9pblRyYW5zID0gdHJ1ZTtcbiAgICAgIGFuY2hvciA9IHRoaXMuX2xhc3RPcC5hbmNob3I7XG4gICAgICByZXR1cm4gdGhpcy5faXRlcmF0ZShhbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocGFuZWwsIGksIGxlbikge1xuICAgICAgICAgIHZhciBkZWxheTtcbiAgICAgICAgICBkZWxheSA9IF90aGlzLl9zZXRQYW5lbFRyYW5zLmFwcGx5KF90aGlzLCBbYW5jaG9yXS5jb25jYXQoX19zbGljZS5jYWxsKGFyZ3VtZW50cyksIFtfdGhpcy5fY29uZmlnLnNwZWVkXSwgWzFdKSk7XG4gICAgICAgICAgcmV0dXJuIChmdW5jdGlvbihwYW5lbCwgaSwgZGVsYXkpIHtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgX3RoaXMuX3RyYW5zZm9ybVBhbmVsKHBhbmVsLCAwLCBfdGhpcy5fbGFzdE9wLmFuY2hvcik7XG4gICAgICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNob3dFbChwYW5lbC5jaGlsZHJlblswXSk7XG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IGxlbiAtIDEpIHtcbiAgICAgICAgICAgICAgICAgIF90aGlzLl9pblRyYW5zID0gX3RoaXMuaXNGb2xkZWRVcCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBfdGhpcy5fbGFzdE9wLmZuID0gX3RoaXMuYWNjb3JkaW9uO1xuICAgICAgICAgICAgICAgICAgX3RoaXMuX2xhc3RPcC5hbmdsZSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBwYW5lbC5zdHlsZVtjc3MudHJhbnNpdGlvbkR1cmF0aW9uXSA9IF90aGlzLl9jb25maWcuc3BlZWQ7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0sIGRlbGF5ICsgX3RoaXMuX2NvbmZpZy5zcGVlZCAqIC4yNSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KShwYW5lbCwgaSwgZGVsYXkpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5faXRlcmF0ZSA9IGZ1bmN0aW9uKGFuY2hvciwgZm4pIHtcbiAgICAgIHZhciBpLCBwYW5lbCwgcGFuZWxzLCBfaSwgX2xlbiwgX3JlZjEsIF9yZXN1bHRzO1xuICAgICAgX3JlZjEgPSBwYW5lbHMgPSB0aGlzLl9wYW5lbHNbYW5jaG9yXTtcbiAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICBmb3IgKGkgPSBfaSA9IDAsIF9sZW4gPSBfcmVmMS5sZW5ndGg7IF9pIDwgX2xlbjsgaSA9ICsrX2kpIHtcbiAgICAgICAgcGFuZWwgPSBfcmVmMVtpXTtcbiAgICAgICAgX3Jlc3VsdHMucHVzaChmbi5jYWxsKHRoaXMsIHBhbmVsLCBpLCBwYW5lbHMubGVuZ3RoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmVuYWJsZVRvdWNoID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc2V0VG91Y2godHJ1ZSk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmRpc2FibGVUb3VjaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3NldFRvdWNoKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuc2V0U3BlZWQgPSBmdW5jdGlvbihzcGVlZCkge1xuICAgICAgdmFyIGFuY2hvciwgX2ksIF9sZW47XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGFuY2hvckxpc3QubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgYW5jaG9yID0gYW5jaG9yTGlzdFtfaV07XG4gICAgICAgIHRoaXMuX3NldFRyYW5zKCh0aGlzLl9jb25maWcuc3BlZWQgPSBzcGVlZCksIHRoaXMuX2NvbmZpZy5yaXBwbGUsIGFuY2hvcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuZnJlZXplID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIGlmICh0aGlzLmlzRnJvemVuKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3N0YWdlUmVzZXQodGhpcy5fbGFzdE9wLmFuY2hvciwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuaXNGcm96ZW4gPSB0cnVlO1xuICAgICAgICAgICAgaGlkZUVsKF90aGlzLl9zdGFnZUhvbGRlcik7XG4gICAgICAgICAgICBzaG93RWwoX3RoaXMuX2Nsb25lRWwpO1xuICAgICAgICAgICAgX3RoaXMuX3NldEN1cnNvcihmYWxzZSk7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIgPyBjYWxsYmFjaygpIDogdm9pZCAwO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKHRoaXMpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS51bmZyZWV6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuaXNGcm96ZW4pIHtcbiAgICAgICAgdGhpcy5pc0Zyb3plbiA9IGZhbHNlO1xuICAgICAgICBoaWRlRWwodGhpcy5fY2xvbmVFbCk7XG4gICAgICAgIHNob3dFbCh0aGlzLl9zdGFnZUhvbGRlcik7XG4gICAgICAgIHRoaXMuX3NldEN1cnNvcigpO1xuICAgICAgICB0aGlzLl9sYXN0T3AuYW5nbGUgPSAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgdGhpcy5mcmVlemUoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5fc2V0VG91Y2goZmFsc2UpO1xuICAgICAgICAgIGlmICgkKSB7XG4gICAgICAgICAgICAkLmRhdGEoX3RoaXMuZWwsIGJhc2VOYW1lLCBudWxsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgX3RoaXMuZWwuaW5uZXJIVE1MID0gX3RoaXMuX2Nsb25lRWwuaW5uZXJIVE1MO1xuICAgICAgICAgIF90aGlzLmVsLmNsYXNzTGlzdC5yZW1vdmUoZWxDbGFzc2VzLmFjdGl2ZSk7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiID8gY2FsbGJhY2soKSA6IHZvaWQgMDtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5lbXB0eVF1ZXVlID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgICAgZGVmZXIoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuX2luVHJhbnMgPSBmYWxzZTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5zZXRSaXBwbGUgPSBmdW5jdGlvbihkaXIpIHtcbiAgICAgIGlmIChkaXIgPT0gbnVsbCkge1xuICAgICAgICBkaXIgPSAxO1xuICAgICAgfVxuICAgICAgdGhpcy5fY29uZmlnLnJpcHBsZSA9IE51bWJlcihkaXIpO1xuICAgICAgdGhpcy5zZXRTcGVlZCh0aGlzLl9jb25maWcuc3BlZWQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmNvbnN0cmFpbkFuZ2xlID0gZnVuY3Rpb24oYW5nbGUpIHtcbiAgICAgIHRoaXMuX2NvbmZpZy5tYXhBbmdsZSA9IHBhcnNlRmxvYXQoYW5nbGUsIDEwKSB8fCBkZWZhdWx0cy5tYXhBbmdsZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS53YWl0ID0gZnVuY3Rpb24obXMpIHtcbiAgICAgIHZhciBmbjtcbiAgICAgIGZuID0gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChfdGhpcy5fY29uY2x1ZGUsIG1zKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpO1xuICAgICAgaWYgKHRoaXMuX2luVHJhbnMpIHtcbiAgICAgICAgdGhpcy5fcXVldWUucHVzaChbZm4sIHRoaXMuX2xhc3RPcC5hbmdsZSwgdGhpcy5fbGFzdE9wLmFuY2hvciwgdGhpcy5fbGFzdE9wLm9wdGlvbnNdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZuKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUubW9kaWZ5Q29udGVudCA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICB2YXIgYW5jaG9yLCBpLCBwYW5lbCwgc2VsZWN0b3JzLCBzZXQsIF9pLCBfaiwgX2xlbiwgX2xlbjEsIF9yZWYxO1xuICAgICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBzZWxlY3RvcnMgPSBmbjtcbiAgICAgICAgc2V0ID0gZnVuY3Rpb24oZWwsIGNvbnRlbnQsIHN0eWxlKSB7XG4gICAgICAgICAgdmFyIGtleSwgdmFsdWU7XG4gICAgICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9IGNvbnRlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzdHlsZSkge1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSBzdHlsZVtrZXldO1xuICAgICAgICAgICAgICBlbC5zdHlsZVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGZuID0gZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICB2YXIgY29udGVudCwgbWF0Y2gsIHNlbGVjdG9yLCBzdHlsZSwgdmFsdWUsIF9pLCBfbGVuLCBfcmVmMTtcbiAgICAgICAgICBmb3IgKHNlbGVjdG9yIGluIHNlbGVjdG9ycykge1xuICAgICAgICAgICAgdmFsdWUgPSBzZWxlY3RvcnNbc2VsZWN0b3JdO1xuICAgICAgICAgICAgY29udGVudCA9IHN0eWxlID0gbnVsbDtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgIGNvbnRlbnQgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnRlbnQgPSB2YWx1ZS5jb250ZW50LCBzdHlsZSA9IHZhbHVlLnN0eWxlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykge1xuICAgICAgICAgICAgICBzZXQoZWwsIGNvbnRlbnQsIHN0eWxlKTtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfcmVmMSA9IGVsLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgICAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmMS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgICAgICBtYXRjaCA9IF9yZWYxW19pXTtcbiAgICAgICAgICAgICAgc2V0KG1hdGNoLCBjb250ZW50LCBzdHlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBhbmNob3JMaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGFuY2hvciA9IGFuY2hvckxpc3RbX2ldO1xuICAgICAgICBfcmVmMSA9IHRoaXMuX3BhbmVsc1thbmNob3JdO1xuICAgICAgICBmb3IgKGkgPSBfaiA9IDAsIF9sZW4xID0gX3JlZjEubGVuZ3RoOyBfaiA8IF9sZW4xOyBpID0gKytfaikge1xuICAgICAgICAgIHBhbmVsID0gX3JlZjFbaV07XG4gICAgICAgICAgZm4ocGFuZWwuY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0sIGksIGFuY2hvcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5hY2NvcmRpb24gPSBwcmVwKGZ1bmN0aW9uKGFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyYXRlKGFuY2hvciwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihwYW5lbCwgaSkge1xuICAgICAgICAgIHZhciBkZWc7XG4gICAgICAgICAgaWYgKGkgJSAyICE9PSAwICYmICFvcHRpb25zLnR3aXN0KSB7XG4gICAgICAgICAgICBkZWcgPSAtYW5nbGU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlZyA9IGFuZ2xlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAob3B0aW9ucy5zdGlja3kpIHtcbiAgICAgICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAgIGRlZyA9IDA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGkgPiAxIHx8IG9wdGlvbnMuc3RhaXJzKSB7XG4gICAgICAgICAgICAgIGRlZyAqPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoaSAhPT0gMCkge1xuICAgICAgICAgICAgICBkZWcgKj0gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG9wdGlvbnMuc3RhaXJzKSB7XG4gICAgICAgICAgICBkZWcgKj0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICAgIF90aGlzLl90cmFuc2Zvcm1QYW5lbChwYW5lbCwgZGVnLCBhbmNob3IsIG9wdGlvbnMuZnJhY3R1cmUpO1xuICAgICAgICAgIGlmIChfdGhpcy5fc2hhZGluZyAmJiAhKGkgPT09IDAgJiYgb3B0aW9ucy5zdGlja3kpICYmIE1hdGguYWJzKGRlZykgIT09IDE4MCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9zZXRTaGFkZXIoaSwgYW5jaG9yLCBkZWcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9KTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmN1cmwgPSBwcmVwKGZ1bmN0aW9uKGFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpIHtcbiAgICAgIGFuZ2xlIC89IF9faW5kZXhPZi5jYWxsKGFuY2hvckxpc3RWLCBhbmNob3IpID49IDAgPyB0aGlzLl9jb25maWcudlBhbmVscy5sZW5ndGggOiB0aGlzLl9jb25maWcuaFBhbmVscy5sZW5ndGg7XG4gICAgICByZXR1cm4gdGhpcy5faXRlcmF0ZShhbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocGFuZWwsIGkpIHtcbiAgICAgICAgICBfdGhpcy5fdHJhbnNmb3JtUGFuZWwocGFuZWwsIGFuZ2xlLCBhbmNob3IpO1xuICAgICAgICAgIGlmIChfdGhpcy5fc2hhZGluZykge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9zZXRTaGFkZXIoaSwgYW5jaG9yLCAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfSk7XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5yYW1wID0gcHJlcChmdW5jdGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICB0aGlzLl90cmFuc2Zvcm1QYW5lbCh0aGlzLl9wYW5lbHNbYW5jaG9yXVsxXSwgYW5nbGUsIGFuY2hvcik7XG4gICAgICByZXR1cm4gdGhpcy5faXRlcmF0ZShhbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocGFuZWwsIGkpIHtcbiAgICAgICAgICBpZiAoaSAhPT0gMSkge1xuICAgICAgICAgICAgX3RoaXMuX3RyYW5zZm9ybVBhbmVsKHBhbmVsLCAwLCBhbmNob3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoX3RoaXMuX3NoYWRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5fc2V0U2hhZGVyKGksIGFuY2hvciwgMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH0pO1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUuZm9sZFVwID0gcHJlcChmdW5jdGlvbihhbmNob3IsIGNhbGxiYWNrKSB7XG4gICAgICBpZiAodGhpcy5pc0ZvbGRlZFVwKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIiA/IGNhbGxiYWNrKCkgOiB2b2lkIDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fc3RhZ2VSZXNldChhbmNob3IsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMuX2luVHJhbnMgPSBfdGhpcy5pc0ZvbGRlZFVwID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuX2l0ZXJhdGUoYW5jaG9yLCBmdW5jdGlvbihwYW5lbCwgaSwgbGVuKSB7XG4gICAgICAgICAgICB2YXIgZGVsYXksIGR1cmF0aW9uO1xuICAgICAgICAgICAgZHVyYXRpb24gPSBfdGhpcy5fY29uZmlnLnNwZWVkO1xuICAgICAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgICAgZHVyYXRpb24gLz0gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGF5ID0gX3RoaXMuX3NldFBhbmVsVHJhbnMuYXBwbHkoX3RoaXMsIFthbmNob3JdLmNvbmNhdChfX3NsaWNlLmNhbGwoYXJndW1lbnRzKSwgW2R1cmF0aW9uXSwgWzJdKSk7XG4gICAgICAgICAgICByZXR1cm4gKGZ1bmN0aW9uKHBhbmVsLCBpLCBkZWxheSkge1xuICAgICAgICAgICAgICByZXR1cm4gZGVmZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuX3RyYW5zZm9ybVBhbmVsKHBhbmVsLCAoaSA9PT0gMCA/IDkwIDogMTcwKSwgYW5jaG9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLl9pblRyYW5zID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIiA/IGNhbGxiYWNrKCkgOiB2b2lkIDA7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaGlkZUVsKHBhbmVsLmNoaWxkcmVuWzBdKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCBkZWxheSArIF90aGlzLl9jb25maWcuc3BlZWQgKiAuMjUpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pKHBhbmVsLCBpLCBkZWxheSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfSk7XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS51bmZvbGQgPSBwcmVwKGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdW5mb2xkLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSk7XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbihmbikge1xuICAgICAgcmV0dXJuIHByZXAoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLl9pdGVyYXRlKGFuY2hvciwgZnVuY3Rpb24ocGFuZWwsIGksIGxlbikge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLl90cmFuc2Zvcm1QYW5lbChwYW5lbCwgZm4oYW5nbGUsIGksIGxlbiksIGFuY2hvciwgb3B0aW9ucy5mcmFjdHVyZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSkuYmluZCh0aGlzKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgcmV0dXJuIHRoaXMuYWNjb3JkaW9uKDAsIHtcbiAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUucmV2ZWFsID0gZnVuY3Rpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICBvcHRpb25zLnN0aWNreSA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5hY2NvcmRpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLnN0YWlycyA9IGZ1bmN0aW9uKGFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpIHtcbiAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgfVxuICAgICAgb3B0aW9ucy5zdGFpcnMgPSBvcHRpb25zLnN0aWNreSA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5hY2NvcmRpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmZyYWN0dXJlID0gZnVuY3Rpb24oYW5nbGUsIGFuY2hvciwgb3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICBvcHRpb25zLmZyYWN0dXJlID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLmFjY29yZGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgT3JpRG9taS5wcm90b3R5cGUudHdpc3QgPSBmdW5jdGlvbihhbmdsZSwgYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMuZnJhY3R1cmUgPSBvcHRpb25zLnR3aXN0ID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLmFjY29yZGlvbihhbmdsZSAvIDEwLCBhbmNob3IsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLnByb3RvdHlwZS5jb2xsYXBzZSA9IGZ1bmN0aW9uKGFuY2hvciwgb3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICBvcHRpb25zLnN0aWNreSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHRoaXMuYWNjb3JkaW9uKC10aGlzLl9jb25maWcubWF4QW5nbGUsIGFuY2hvciwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIE9yaURvbWkucHJvdG90eXBlLmNvbGxhcHNlQWx0ID0gZnVuY3Rpb24oYW5jaG9yLCBvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMuc3RpY2t5ID0gZmFsc2U7XG4gICAgICByZXR1cm4gdGhpcy5hY2NvcmRpb24odGhpcy5fY29uZmlnLm1heEFuZ2xlLCBhbmNob3IsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICBPcmlEb21pLlZFUlNJT04gPSAnMS4xLjEnO1xuXG4gICAgT3JpRG9taS5pc1N1cHBvcnRlZCA9IGlzU3VwcG9ydGVkO1xuXG4gICAgcmV0dXJuIE9yaURvbWk7XG5cbiAgfSkoKTtcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwgPyBtb2R1bGUuZXhwb3J0cyA6IHZvaWQgMCkge1xuICAgIG1vZHVsZS5leHBvcnRzID0gT3JpRG9taTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lICE9PSBcInVuZGVmaW5lZFwiICYmIGRlZmluZSAhPT0gbnVsbCA/IGRlZmluZS5hbWQgOiB2b2lkIDApIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gT3JpRG9taTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cuT3JpRG9taSA9IE9yaURvbWk7XG4gIH1cblxuICBpZiAoISQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAkLnByb3RvdHlwZS5vcmlEb21pID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBlbCwgaW5zdGFuY2UsIG1ldGhvZCwgbWV0aG9kTmFtZSwgX2ksIF9qLCBfbGVuLCBfbGVuMTtcbiAgICBpZiAoIWlzU3VwcG9ydGVkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMgPT09IHRydWUpIHtcbiAgICAgIHJldHVybiAkLmRhdGEodGhpc1swXSwgYmFzZU5hbWUpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgICBtZXRob2ROYW1lID0gb3B0aW9ucztcbiAgICAgIGlmICh0eXBlb2YgKG1ldGhvZCA9IE9yaURvbWkucHJvdG90eXBlW21ldGhvZE5hbWVdKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcIk9yaURvbWk6IE5vIHN1Y2ggbWV0aG9kIGBcIiArIG1ldGhvZE5hbWUgKyBcImBcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHRoaXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgZWwgPSB0aGlzW19pXTtcbiAgICAgICAgaWYgKCEoaW5zdGFuY2UgPSAkLmRhdGEoZWwsIGJhc2VOYW1lKSkpIHtcbiAgICAgICAgICBpbnN0YW5jZSA9ICQuZGF0YShlbCwgYmFzZU5hbWUsIG5ldyBPcmlEb21pKGVsLCBvcHRpb25zKSk7XG4gICAgICAgIH1cbiAgICAgICAgbWV0aG9kLmFwcGx5KGluc3RhbmNlLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLnNsaWNlKDEpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gdGhpcy5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgZWwgPSB0aGlzW19qXTtcbiAgICAgICAgaWYgKGluc3RhbmNlID0gJC5kYXRhKGVsLCBiYXNlTmFtZSkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkLmRhdGEoZWwsIGJhc2VOYW1lLCBuZXcgT3JpRG9taShlbCwgb3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1vcmlkb21pLm1hcFxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9vcmlkb21pL29yaWRvbWkuanNcIixcIi8uLi8uLi9ub2RlX21vZHVsZXMvb3JpZG9taVwiKSJdfQ==
