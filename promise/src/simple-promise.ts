// Thenable接口
export interface Thenable {
  then: Function;
}

// Promise的三种状态
enum SimplePromiseState {
  pending,
  fulfilled,
  rejected,
}

// 一些函数类型的定义
type ResolveFunc = (value: unknown) => void;
type RejectFunc = (reason: unknown) => void;
type OnFulfilledCallback = (value: unknown) => unknown;
type OnRejectedCallback = (reason: unknown) => unknown;

export class SimplePromise implements Thenable {
  state: SimplePromiseState;
  value: unknown;
  reason: unknown;
  onFulfilledCallbacks: OnFulfilledCallback[];
  onRejectedCallbacks: OnRejectedCallback[];

  // Promise A+规范对于构造函数这一块没有明确规定，这边按照常规的ES6+的用法来设计
  constructor(executor: (resolve: ResolveFunc, reject: RejectFunc) => any) {
    // 初始化内部状态为pending
    this.state = SimplePromiseState.pending;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value: unknown) => {
      if (this.state === SimplePromiseState.pending) {
        this.state = SimplePromiseState.fulfilled;
        this.value = value;
        this.onFulfilledCallbacks.forEach(callback => callback(value));
      }
      // 这边如果resolve的时候promise不是pending状态其实可以报个错，但是不报也不影响
    };
    const reject = (reason: unknown) => {
      if (this.state === SimplePromiseState.pending) {
        this.state = SimplePromiseState.rejected;
        this.reason = reason;
        this.onRejectedCallbacks.forEach(callback => callback(reason));
      }
      // 这边如果reject的时候promise不是pending状态其实可以报个错，但是不报也不影响
    };

    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }

  then(onFulfilled?: OnFulfilledCallback, onRejected?: OnRejectedCallback): SimplePromise {
    const nextPromise = new SimplePromise((resolve, reject) => {
      // 将onFulfilled/onRejected改造为异步函数
      const asyncOnFulfilled = (value: unknown) => {
        setTimeout(() => {
          try {
            if (typeof onFulfilled === 'function') {
              const x = onFulfilled(value);
              promiseResolveProcedure(nextPromise, x, resolve, reject);
            } else {
              resolve(value);
            }
          } catch (e) {
            reject(e);
          }
        });
      };
      const asyncOnRejected = (reason: unknown) => {
        setTimeout(() => {
          try {
            if (typeof onRejected === 'function') {
              const x = onRejected(reason);
              promiseResolveProcedure(nextPromise, x, resolve, reject);
            } else {
              reject(reason);
            }
          } catch (e) {
            reject(e);
          }
        });
      };

      // 根据promise状态进行处理
      switch (this.state) {
        case SimplePromiseState.pending:
          this.onFulfilledCallbacks.push(asyncOnFulfilled);
          this.onRejectedCallbacks.push(asyncOnRejected);
          break;
        case SimplePromiseState.fulfilled:
          asyncOnFulfilled(this.value);
          break;
        case SimplePromiseState.rejected:
          asyncOnRejected(this.reason);
          break;
      }
    });

    return nextPromise;
  }
}

function promiseResolveProcedure(
  nextPromise: SimplePromise,
  x: unknown,
  nextPromiseResolve: ResolveFunc,
  nextPromiseReject: RejectFunc
) {
  if (nextPromise === x) {
    nextPromiseReject(new TypeError('Next promise and X cannot refer to the same object!'));
    return;
  }

  if (x instanceof SimplePromise) {
    switch (x.state) {
      case SimplePromiseState.pending:
        x.onFulfilledCallbacks.push(nextPromiseResolve);
        // x.onFulfilledCallbacks.push(() =>
        //   promiseResolveProcedure(nextPromise, x.value, nextPromiseResolve, nextPromiseReject)
        // );
        x.onRejectedCallbacks.push(nextPromiseReject);
        break;
      case SimplePromiseState.fulfilled:
        nextPromiseResolve(x.value);
        // promiseResolveProcedure(nextPromise, x.value, nextPromiseResolve, nextPromiseReject);
        break;
      case SimplePromiseState.rejected:
        nextPromiseReject(x.reason);
        break;
    }

    return;
  }

  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    //if (typeof x === 'object' || typeof x === 'function') {
    let called = false;

    try {
      // @ts-ignore
      const then: unknown = x.then;

      if (typeof then === 'function') {
        then.call(
          x,
          (y: unknown) => {
            if (!called) {
              called = true;
              console.log(y);
              promiseResolveProcedure(nextPromise, y, nextPromiseResolve, nextPromiseReject);
            }
          },
          (e: unknown) => {
            if (!called) {
              called = true;
              nextPromiseReject(e);
            }
          }
        );
      } else {
        called = true;
        nextPromiseResolve(x);
      }
    } catch (e) {
      if (!called) {
        called = true;
        nextPromiseReject(e);
      }
    }
  } else {
    nextPromiseResolve(x);
  }
}
