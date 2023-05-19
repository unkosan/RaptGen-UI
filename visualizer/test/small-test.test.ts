import sum from "./sample";

test("add 1 + 2 to equal 3", () => {
  expect(sum(1, 2)).toBe(3);
});

test("add 55 + 2 to equal 57", () => {
  expect(sum(55, 2)).toBe(57);
});

test("adding positive numbers is not zero", () => {
  for (let a = 0; a < 10; a++) {
    for (let b = 1; b < 10; b++) {
      expect(a + b).not.toBe(0);
    }
  }
});
