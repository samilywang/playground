import { SimplePromise } from './simple-promise';

const resolved = (value: unknown) => {
  return new SimplePromise((resolve, reject) => {
    resolve(value);
  });
};

const rejected = (reason: unknown) => {
  return new SimplePromise((resolve, reject) => {
    reject(reason);
  });
};

const deferred = () => {
  const result: any = {};
  result.promise = new SimplePromise((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });

  return result;
};

export { resolved, rejected, deferred };
