import * as React from "react";

export const initialisingComponentTest = {
  isCalled: false,
};

export const CustomInitialisingComponent = () => {
  initialisingComponentTest.isCalled = true;
  return <h5>Loading...</h5>;
};

export const WrappersTestComponent: React.FC<{
  name: number;
  test: { works: boolean; count: number };
}> = (props) => {
  props.test.works = true;

  wrappersTest.count += 1;

  wrappersTest.orderOfRender.push(props.name);

  return <div>{props.children}</div>;
};

export const wrappersTest = {
  works: false,
  count: 0,
  orderOfRender: [],
};
