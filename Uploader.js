/**
 * Module dependencies.
 */
'use strict';

var React = require('react-native');
var {
  DeviceEventEmitter,
} = React;
var _ = require('lodash')

/**
 * Create a generic Uploader via `opts`:
 *
 *  - `url` String Required such as "http://my.server/api/upload"
 *  - `method` String Optional ['POST' | 'PUT'], default 'POST'
 *  - `headers` Object Optional such as "{ 'Accept': 'application/json' }"
 *  - `params` Object Optional such as "{ 'user_id': 3 }"
 *  - `files` Array Required such as "[{ name: 'file', filename: 'image1.png', filepath: 'assets-library://...', filetype: 'image/png' } ]"
 *
 * Callback via `done`
 *  - `err` String
 *  - `res` Object {status: Number, data: String} such as "{ status: 200, data: '{ success: true }' }"
 *
 * @param {Object} opts
 * @param {Function} done( err, res )
 * @return Null
 * @api public
 */

let xhr = new XMLHttpRequest();

exports.upload = function(opts, done){
  console.log(opts)

  opts.method = opts.method || 'POST'

  // TODO: support multiple files
  if (opts.files.length !== 1) {
    done('Dont support multiple files yet!', {status: 0, data: ''})
    return;
  }

  xhr.open(opts.method, opts.url);
  xhr.onload = () => {
    console.log(xhr);
    let success_status = parseInt(opts.params.success_action_status) || 200; 
    if (xhr.status !== success_status && xhr.status !== 0) {
      done('Upload failed', {status: xhr.status, data: xhr.responseText})
      return;
    }
    done(null, {status: xhr.status, data: xhr.responseText})
  }

  // Set headers
  if (opts.headers) {
    _.each(opts.headers, (value, key) => {
      xhr.setRequestHeader(key, value)
    })
  }
  xhr.onabort = () => {
    done('Upload aborted', {status: xhr.status, data: xhr.responseText})
  }

  // Set params
  let data = new FormData();
  _.each(opts.params, (value, key) => {
    if (value instanceof Date) {
      data.append(key, value.toISOString())
    } else {
      data.append(key, String(value))
    }
  })

  // Append files
  opts.files.forEach(
    (file) => data.append('file', {type: file.filetype, uri: file.filepath, name: file.filename})
  )

  if (xhr.upload) {
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        DeviceEventEmitter.emit('RNUploaderProgress', {'totalBytesWritten': event.loaded, 'totalBytesExpectedToWrite': event.total, 'progress': event.loaded / event.total * 100.0})
        console.log('uploaded: ' + event.loaded / event.total * 100.0);
      }
    };
  }
  xhr.send(data);
};

exports.cancel = function () {
  xhr.abort()
}