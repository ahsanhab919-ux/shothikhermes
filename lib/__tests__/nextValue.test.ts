import { describe, it, expect } from "vitest";
import { nextInArray, nextInIterator, nextInLinkedList, nextValue } from "../nextValue";

describe("nextInArray", () => {
  it("returns none for empty input", () => {
    expect(nextInArray([], 0)).toEqual({ exists: false, value: undefined });
    expect(nextInArray(null, 0)).toEqual({ exists: false, value: undefined });
    expect(nextInArray(undefined, 0)).toEqual({ exists: false, value: undefined });
  });

  it("returns none for single-element input at index 0", () => {
    expect(nextInArray([1], 0)).toEqual({ exists: false, value: undefined });
  });

  it("returns next element for typical sequential case", () => {
    expect(nextInArray([10, 20, 30], 0)).toEqual({ exists: true, value: 20 });
    expect(nextInArray([10, 20, 30], 1)).toEqual({ exists: true, value: 30 });
  });

  it("returns none at end/out of range", () => {
    expect(nextInArray([10, 20, 30], 2)).toEqual({ exists: false, value: undefined });
    expect(nextInArray([10, 20, 30], 999)).toEqual({ exists: false, value: undefined });
    expect(nextInArray([10, 20, 30], -2)).toEqual({ exists: false, value: undefined });
  });

  it("uses truncation for non-integer indices", () => {
    expect(nextInArray([10, 20, 30], 0.9)).toEqual({ exists: true, value: 20 });
    expect(nextInArray([10, 20, 30], 1.1)).toEqual({ exists: true, value: 30 });
  });

  it("returns none for non-finite indices", () => {
    expect(nextInArray([10, 20], Number.NaN)).toEqual({ exists: false, value: undefined });
    expect(nextInArray([10, 20], Number.POSITIVE_INFINITY)).toEqual({ exists: false, value: undefined });
  });
});

describe("nextInIterator", () => {
  it("returns none for null/undefined iterator", () => {
    expect(nextInIterator(null)).toEqual({ exists: false, value: undefined });
    expect(nextInIterator(undefined)).toEqual({ exists: false, value: undefined });
  });

  it("returns none for empty iterator", () => {
    const it = ([] as number[])[Symbol.iterator]();
    expect(nextInIterator(it)).toEqual({ exists: false, value: undefined });
  });

  it("returns values sequentially", () => {
    const it = [1, 2, 3][Symbol.iterator]();
    expect(nextInIterator(it)).toEqual({ exists: true, value: 1 });
    expect(nextInIterator(it)).toEqual({ exists: true, value: 2 });
    expect(nextInIterator(it)).toEqual({ exists: true, value: 3 });
    expect(nextInIterator(it)).toEqual({ exists: false, value: undefined });
  });
});

describe("nextValue", () => {
  it("defaults array position to -1 (first element)", () => {
    expect(nextValue([7, 8, 9])).toEqual({ exists: true, value: 7 });
  });

  it("routes to array behavior when given an array", () => {
    expect(nextValue([7, 8, 9], 0)).toEqual({ exists: true, value: 8 });
  });

  it("routes to iterator behavior when given an iterator", () => {
    const it = [7, 8, 9][Symbol.iterator]();
    expect(nextValue(it)).toEqual({ exists: true, value: 7 });
  });
});

describe("nextInLinkedList", () => {
  it("returns none for null/undefined node", () => {
    expect(nextInLinkedList(null)).toEqual({ exists: false, value: undefined });
    expect(nextInLinkedList(undefined)).toEqual({ exists: false, value: undefined });
  });

  it("returns none when next is null/undefined (null-terminated)", () => {
    expect(nextInLinkedList({ value: 1, next: null })).toEqual({ exists: false, value: undefined });
    expect(nextInLinkedList({ value: 1 })).toEqual({ exists: false, value: undefined });
  });

  it("returns the immediate next node value", () => {
    const node = { value: 1, next: { value: 2, next: { value: 3, next: null } } };
    expect(nextInLinkedList(node)).toEqual({ exists: true, value: 2 });
  });
});
