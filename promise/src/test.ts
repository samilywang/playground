// import { MyPromise } from './promise';

// const promise = new MyPromise((resolve, reject) => {
//   resolve({ dummy: 'test' });
// }).then(() => {
//   return promise;
// });

// promise.then(null as any, reason => {
//   console.log(reason);
//   console.log(reason instanceof TypeError);
// });

import { resolved } from './index';

var dummy = { dummy: 'dummy' };
var promise = resolved(dummy).then(function () {
  return promise;
});

promise.then(null as any, function (reason) {
  console.log(reason);
  console.log(reason instanceof TypeError);
});
