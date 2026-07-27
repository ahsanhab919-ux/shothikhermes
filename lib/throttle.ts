type AnyFunction = (...args: any[]) => void;

const throttle = <T extends AnyFunction>(func: T, limit: number): T => {
  let inThrottle = false;

  const throttled = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  } as T;

  return throttled;
};

export default throttle;
