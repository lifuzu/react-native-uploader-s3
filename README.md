# react-native-uploader-s3
Yet Another example for React Native module [react-native-uploader](https://github.com/aroth/react-native-uploader) to upload image file to AWS s3 and camera roll assets. Supports progress notification.

## Install

Please refer to [react-native-uploader](https://github.com/aroth/react-native-uploader)


## Usage
```javascript
var s3_policy = require('./s3_policy');
let s3_opts = {
  bucket: 'uploads-testus',
  region: 'us-east-1',
  key: '<accessKeyId>',
  secret: '<secretAccessKey>',
  type: 'image/',
  path: 'images/',
  acl: 'public-read',
  expires: new Date(Date.now() + 60 * 60000),
  length: 10485760, // 10M as maximal size
};
```

```javascript
let p = s3_policy(s3_opts);
// console.log(p.policy);
// console.log(p.signature);

let opts = {
  url: 'https://' + s3_opts.bucket + '.s3.amazonaws.com/',
  files: files,
  params: {
    key: 'images/${filename}',
    acl: s3_opts.acl,
    'X-Amz-Signature': p.signature,
    'x-amz-credential': p.credential,
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Date': p.date + 'T000000Z',
    'Content-Type': 'image/png',
    'policy': p.policy,
    'success_action_status': '201',
    'x-amz-meta-uuid': '14365123651274'
  }
};
```

### Notes

Inspired by two projects:
* https://github.com/aroth/react-native-uploader
* https://github.com/tj/node-s3-policy

... with noteable enhancements:
* support AWS Signature Version 4: AWS4-HMAC-SHA256
* support for files from the assets library, base64 `data:` or `file:` paths 
* no external dependencies (ie: AFNetworking)

... and limitations:
* support for one file at a time

### Credits

* https://github.com/aroth/react-native-uploader
* http://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-post-example.html
* https://github.com/tj/node-s3-policy
* http://stackoverflow.com/questions/18476217/amazon-s3-post-api-and-signing-a-policy-with-nodejs

## License

MIT
