/**
 * Module dependencies.
 */

var crypto = require("crypto-js");
var Buffer = global.Buffer || require('buffer').Buffer;

/**
 * Create an s3 policy and signature via `opts`:
 *
 *  - `acl` acl such as "public-read"
 *  - `expires` expiration date
 *  - `key` s3 access id
 *  - `secret` s3 secret
 *  - `bucket` bucket name
 *  - `path` restrict object name to prefix [""]
 *  - `type` restrict content-type prefix [""]
 *  - `service` default 's3'
 *  - `date` now, format 'YYYYMMDD'
 *  - `length` max size restriction
 *  - `conditions` an optional Array of custom "conditions" to include in the policy
 *
 * An object with `.signature` and `.policy` is returned.
 *
 * @param {Object} opts
 * @return {Object}
 * @api public
 */

module.exports = function(opts){
  var ret = {};

  if (!Array.isArray(opts.conditions)) opts.conditions = [];
  opts.conditions.push(['starts-with', '$key', opts.path || '']);
  opts.conditions.push({'success_action_status': '201'});
  opts.conditions.push(['starts-with', '$Content-Type', opts.type || '']);
  // opts.conditions.push(['starts-with', '$Content-Length', '']);
  opts.conditions.push({'x-amz-meta-uuid': "14365123651274"});
  // opts.conditions.push({'x-amz-server-side-encryption': "AES256"});
  // opts.conditions.push(["starts-with", "$x-amz-meta-tag", ""]);
  let date = opts.date || (new Date()).toISOString().slice(0,10).replace(/-/g,"");
  let service = opts.service || 's3';
  let credential = opts.key + "/" + date + "/" + opts.region + "/" + service +"/aws4_request";
  opts.conditions.push({'x-amz-credential': credential});
  opts.conditions.push({'x-amz-algorithm': "AWS4-HMAC-SHA256"});
  opts.conditions.push({'x-amz-date': date + "T000000Z"});

  if (opts.length) {
    opts.conditions.push(['content-length-range', 1, opts.length]);
  }

  ret.date = date;
  ret.credential = credential;
  ret.policy = policy(opts);
  let signatureKey = getSignatureKey(opts.secret, date, opts.region, service);
  ret.signature = signature(ret.policy, signatureKey);

  return ret;
};

/**
 * Create an s3 policy via `opts`.
 *
 * @param {Object} opts
 * @return {String}
 * @api public
 */

function policy(opts) {
  if (!opts) throw new Error('settings required');
  if (!opts.expires) throw new Error('.expires required');
  if (!opts.bucket) throw new Error('.bucket required');
  if (!opts.acl) throw new Error('.acl required');

  var conds = opts.conditions || [];
  conds.push({ bucket: opts.bucket });
  conds.push({ acl: opts.acl });

  var data = {
    // ISO format: "2015-12-30T12:00:00.000Z",
    expiration: opts.expires.toISOString(),
    conditions: conds
  };

  var json = JSON.stringify(data, "utf-8");
  // console.log(json);
  var base = new Buffer(json).toString('base64');
  return base;
}

/**
 * Create signature key.
 *
 * @param {String} key
 * @param {String} date
 * @param {String} region
 * @param {String} service
 * @return {String}
 * @api private
 */

function getSignatureKey(key, date, region, service = 's3') {
   let _date = crypto.HmacSHA256(date, "AWS4" + key);
   let _region = crypto.HmacSHA256(region, _date);
   let _service = crypto.HmacSHA256(service, _region);
   let _signing = crypto.HmacSHA256("aws4_request", _service);

   return _signing;
}


/**
 * HMAC SHA256 of the policy / secret.
 *
 * @param {String} policy
 * @param {String} secret
 * @return {String}
 * @api private
 */

function signature(policy, secret) {
  if (!secret) throw new Error('secret required');

  return crypto
    .HmacSHA256(policy, secret)
    .toString(crypto.enc.Hex);
}