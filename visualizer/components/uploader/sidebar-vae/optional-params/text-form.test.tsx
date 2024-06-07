import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import TextForm from "./text-form";

describe("TextForm", () => {
  xit("should render placeholder if form is empty", () => {
    const setValue = jest.fn();
    const setIsValid = jest.fn();
    const predicate = jest.fn();
    render(
      <TextForm
        predicate={predicate}
        setValue={setValue}
        setIsValid={setIsValid}
        value={undefined}
        isValid={true}
        placeholder="placeholder"
      />
    );
    const input = screen.getByPlaceholderText("placeholder");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(setValue).toHaveBeenCalledTimes(0);
    expect(setIsValid).toHaveBeenCalledTimes(0);
    expect(predicate).toHaveBeenCalledTimes(0);
  });

  xit("value should be undefined if form is empty", () => {
    let [value, setValue] = React.useState<string | undefined>(undefined);
    setValue = jest.fn(setValue);
    let [isValid, setIsValid] = React.useState<boolean>(true);
    setIsValid = jest.fn(setIsValid);
    const predicate = jest.fn(() => true);
    render(
      <TextForm
        predicate={predicate}
        setValue={setValue}
        setIsValid={setIsValid}
        value={value}
        isValid={isValid}
        placeholder="placeholder"
      />
    );
    const input = screen.getByPlaceholderText("placeholder");

    userEvent.type(input, "");
    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith(undefined);
    expect(setIsValid).toHaveBeenCalledTimes(1);
    expect(setIsValid).toHaveBeenCalledWith(true);
  });
});
