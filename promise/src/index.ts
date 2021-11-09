import { MyPromise } from './promise';

const resolved = (value: unknown) => {
  return new MyPromise((resolve, reject) => {
    resolve(value);
  });
};

const rejected = (reason: unknown) => {
  return new MyPromise((resolve, reject) => {
    reject(reason);
  });
};

const deferred = () => {
  const result: any = {};
  result.promise = new MyPromise((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });

  return result;
};

export { resolved, rejected, deferred };