export interface Thenable {
  then: Function;
}

enum MyPromiseState {
  pending,
  fulfilled,
  rejected,
}

type ResolveFunction = (value: unknown) => void;
type RejectFunction = (e: unknown) => void;

export class MyPromise implements Thenable {
  private state: MyPromiseState;
  private value: unknown;
  private reason: unknown;
  private onFulfilledCallbacks: ResolveFunction[];
  private onRejectedCallbacks: RejectFunction[];

  constructor(executor: (resolve: ResolveFunction, reject: RejectFunction) => void) {
    this.state = MyPromiseState.pending;

    const resolve = (value: unknown) => {
      if (this.state === MyPromiseState.pending) {
        this.state = MyPromiseState.fulfilled;
        this.value = value;
        this.onFulfilledCallbacks.forEach(callback => callback(value));
      }
    };
    const reject = (e: unknown) => {
      if (this.state === MyPromiseState.pending) {
        this.state = MyPromiseState.rejected;
        this.reason = e;
        this.onRejectedCallbacks.forEach(callback => callback(e));
      }
    };

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  then(onFulfilled?: ResolveFunction, onRejected?: RejectFunction): MyPromise {
    const nextPromise = new MyPromise((resolve, reject) => {
      const onResolve = () => {
        if (typeof onFulfilled === 'function') {
          try {
            const x = onFulfilled(this.value);
            this.resolvePromise(nextPromise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        } else {
          resolve(this.value);
        }
      };

      const onReject = () => {
        if (typeof onRejected === 'function') {
          try {
            const x = onRejected(this.reason);
            this.resolvePromise(nextPromise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(this.reason);
        }
      };

      switch (this.state) {
        case MyPromiseState.fulfilled:
          onResolve();
          break;
        case MyPromiseState.rejected:
          onReject();
          break;
        case MyPromiseState.pending:
          this.onFulfilledCallbacks.push(onResolve);
          this.onFulfilledCallbacks.push(onReject);
          break;
      }
    });

    return nextPromise;
  }

  private resolvePromise(
    nextPromise: MyPromise,
    x: unknown,
    nextPromiseResolve: ResolveFunction,
    nextPromiseReject: RejectFunction
  ) {
    if (nextPromise === x) {
      nextPromiseReject(TypeError);
      return;
    }

    if (x instanceof MyPromise) {
      switch (x.state) {
        case MyPromiseState.fulfilled:
          nextPromiseResolve(x.value);
          break;
        case MyPromiseState.rejected:
          nextPromiseReject(x.reason);
          break;
        case MyPromiseState.pending:
          x.onFulfilledCallbacks.push(() => {
            nextPromiseResolve(x.value);
          });
          x.onRejectedCallbacks.push(() => {
            nextPromiseReject(x.reason);
          });
          break;
      }

      return;
    }

    if (typeof x === 'object' || typeof x === 'function') {
      try {
        const then = (x as Thenable).then;

        if (typeof then === 'function') {
          let called = false;
          then.call(
            x,
            y => {
              if (called) {
                return;
              }

              called = true;
              this.resolvePromise(nextPromise, y, nextPromiseResolve, nextPromiseReject);
            },
            r => {
              if (called) {
                return;
              }

              called = true;
              nextPromiseReject(r);
            }
          );
        } else {
          nextPromiseResolve(x);
        }
      } catch (e) {
        nextPromiseReject(e);
      }
    } else {
      nextPromiseResolve(x);
    }
  }
}

new Promise((resolve, reject) => {});
